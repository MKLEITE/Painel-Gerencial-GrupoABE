import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { hash, verify } from '@node-rs/argon2';
import { PapelUsuario as PapelDb, Prisma } from '@prisma/client';
import { PapelUsuario } from '@abe/canonical-model';
import { PrismaService } from '../../prisma/prisma.service.js';
import { UserPublic, UserRecord } from './users.types.js';

const ARGON2_OPTS = { memoryCost: 19456, timeCost: 2, parallelism: 1 } as const;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: string): Promise<UserRecord | null> {
    const row = await this.prisma.usuario.findFirst({
      where: { email: email.toLowerCase() },
    });
    return row ? this.toRecord(row) : null;
  }

  async findById(id: string): Promise<UserRecord | null> {
    const row = await this.prisma.usuario.findUnique({ where: { id } });
    return row ? this.toRecord(row) : null;
  }

  async findPublicById(id: string): Promise<UserPublic> {
    const row = await this.prisma.usuario.findUnique({
      where: { id },
      include: { tenant: { select: { credor: { select: { id: true } } } } },
    });
    if (!row) throw new NotFoundException('Usuário não encontrado.');
    if (row.tenant.credor) {
      throw new NotFoundException('Usuário não encontrado.');
    }
    return this.toPublic(this.toRecord(row));
  }

  /** Apenas administradores internos da plataforma (sem credor vinculado). */
  async listPlatformUsers(): Promise<UserPublic[]> {
    const rows = await this.prisma.usuario.findMany({
      where: { tenant: { credor: null } },
      orderBy: { criadoEm: 'desc' },
    });
    return rows.map((r) => this.toPublic(this.toRecord(r)));
  }

  async listAll(tenantId?: string): Promise<(UserPublic & { tenantNome: string })[]> {
    const rows = await this.prisma.usuario.findMany({
      where: tenantId ? { tenantId } : undefined,
      orderBy: { criadoEm: 'desc' },
      include: { tenant: { select: { nome: true } } },
    });
    return rows.map((r) => ({
      ...this.toPublic(this.toRecord(r)),
      tenantNome: r.tenant.nome,
    }));
  }

  async createPlatformUser(data: {
    email: string;
    nome: string;
    senha: string;
    papel: PapelUsuario;
  }): Promise<UserPublic> {
    const platformTenant = await this.prisma.tenant.findFirst({
      where: { credor: null, status: 'ATIVO' },
    });
    if (!platformTenant) {
      throw new NotFoundException('Tenant da plataforma não configurado.');
    }

    const exists = await this.findByEmail(data.email);
    if (exists) {
      throw new ConflictException('E-mail já cadastrado.');
    }

    const senhaHash = await hash(data.senha, ARGON2_OPTS);
    try {
      const row = await this.prisma.usuario.create({
        data: {
          tenantId: platformTenant.id,
          email: data.email.toLowerCase(),
          nome: data.nome,
          senhaHash,
          papel: data.papel as PapelDb,
          ativo: true,
        },
      });
      return this.toPublic(this.toRecord(row));
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new ConflictException('E-mail já cadastrado.');
      }
      throw err;
    }
  }

  async create(data: {
    tenantId: string;
    email: string;
    nome: string;
    senha: string;
    papel: PapelUsuario;
  }): Promise<UserPublic> {
    const exists = await this.findByEmail(data.email);
    if (exists) {
      throw new ConflictException('E-mail já cadastrado.');
    }

    const senhaHash = await hash(data.senha, ARGON2_OPTS);
    try {
      const row = await this.prisma.usuario.create({
        data: {
          tenantId: data.tenantId,
          email: data.email.toLowerCase(),
          nome: data.nome,
          senhaHash,
          papel: data.papel as PapelDb,
          ativo: true,
        },
      });
      return this.toPublic(this.toRecord(row));
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new ConflictException('E-mail já cadastrado neste tenant.');
      }
      throw err;
    }
  }

  async update(
    id: string,
    data: Partial<{ nome: string; papel: PapelUsuario; ativo: boolean; senha: string }>,
  ): Promise<UserPublic> {
    const existing = await this.prisma.usuario.findUnique({
      where: { id },
      include: { tenant: { select: { credor: { select: { id: true } } } } },
    });
    if (!existing) throw new NotFoundException('Usuário não encontrado.');
    if (existing.tenant.credor) {
      throw new ForbiddenException('Usuários de credor são gerenciados no cadastro do credor.');
    }

    const update: Prisma.UsuarioUpdateInput = {};
    if (data.nome !== undefined) update.nome = data.nome;
    if (data.papel !== undefined) update.papel = data.papel as PapelDb;
    if (data.ativo !== undefined) update.ativo = data.ativo;
    if (data.senha !== undefined) {
      update.senhaHash = await hash(data.senha, ARGON2_OPTS);
    }

    const row = await this.prisma.usuario.update({ where: { id }, data: update });
    return this.toPublic(this.toRecord(row));
  }

  async validatePassword(user: UserRecord, senha: string): Promise<boolean> {
    return verify(user.senhaHash, senha);
  }

  toPublic(user: UserRecord): UserPublic {
    return {
      id: user.id,
      tenantId: user.tenantId,
      email: user.email,
      nome: user.nome,
      papel: user.papel,
      ativo: user.ativo,
      fotoUrl: user.fotoUrl,
    };
  }

  private toRecord(row: {
    id: string;
    tenantId: string;
    email: string;
    nome: string;
    senhaHash: string;
    papel: PapelDb;
    ativo: boolean;
    fotoUrl: string | null;
  }): UserRecord {
    return {
      id: row.id,
      tenantId: row.tenantId,
      email: row.email,
      nome: row.nome,
      senhaHash: row.senhaHash,
      papel: row.papel as PapelUsuario,
      ativo: row.ativo,
      fotoUrl: row.fotoUrl,
    };
  }
}
