import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { hash } from '@node-rs/argon2';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service.js';
import { generatePassword } from '../../common/utils/generate-password.js';

const ARGON2_OPTS = { memoryCost: 19456, timeCost: 2, parallelism: 1 } as const;

export interface CredorResponsavel {
  id: string;
  nome: string;
  email: string;
  telefone: string | null;
  fotoUrl: string | null;
  ativo: boolean;
}

export interface CredorPublic {
  id: string;
  tenantId: string;
  tenantNome: string;
  tenantStatus: string;
  razaoSocial: string;
  nomeFantasia: string | null;
  cnpj: string | null;
  telefone: string | null;
  emailComercial: string | null;
  setores: string[];
  cep: string | null;
  cidade: string | null;
  estado: string | null;
  bairro: string | null;
  endereco: string | null;
  numero: string | null;
  complemento: string | null;
  paginasAcesso: string[];
  codClientePrincipal: string | null;
  codigosCliente: { id: string; codCliente: string; rotulo: string | null }[];
  responsavel: CredorResponsavel | null;
  criadoEm: string;
}

export interface CreateCredorResult {
  credor: CredorPublic;
  credenciais: { email: string; senha: string };
}

type CredorRow = {
  id: string;
  tenantId: string;
  razaoSocial: string;
  nomeFantasia: string | null;
  cnpj: string | null;
  telefone: string | null;
  emailComercial: string | null;
  setores: string[];
  cep: string | null;
  cidade: string | null;
  estado: string | null;
  bairro: string | null;
  endereco: string | null;
  numero: string | null;
  complemento: string | null;
  paginasAcesso: string[];
  codClientePrincipal: string | null;
  criadoEm: Date;
  tenant: {
    nome: string;
    status: string;
    usuarios?: {
      id: string;
      nome: string;
      email: string;
      telefone: string | null;
      ativo: boolean;
    }[];
  };
  codigosCliente: { id: string; codCliente: string; rotulo: string | null }[];
};

@Injectable()
export class CredoresService {
  constructor(private readonly prisma: PrismaService) {}

  async list(): Promise<CredorPublic[]> {
    const rows = await this.prisma.credor.findMany({
      include: {
        tenant: {
          include: {
            usuarios: {
              where: { papel: 'ADMIN_CREDOR' },
              orderBy: { criadoEm: 'asc' },
              take: 1,
            },
          },
        },
        codigosCliente: { orderBy: { codCliente: 'asc' } },
      },
      orderBy: { razaoSocial: 'asc' },
    });
    return rows.map((r) => this.toPublic(r));
  }

  async create(data: {
    razaoSocial: string;
    nomeFantasia?: string;
    cnpj: string;
    telefone: string;
    emailComercial: string;
    setores: string[];
    cep: string;
    cidade: string;
    estado: string;
    bairro: string;
    endereco: string;
    numero: string;
    complemento?: string;
    paginasAcesso: string[];
    responsavel: {
      nome: string;
      email: string;
      confirmarEmail: string;
      telefone?: string;
      senha?: string;
      fotoUrl?: string | null;
    };
  }): Promise<CreateCredorResult> {
    if (data.responsavel.email.toLowerCase() !== data.responsavel.confirmarEmail.toLowerCase()) {
      throw new BadRequestException('Os e-mails do responsável não conferem.');
    }

    const cnpj = data.cnpj.replace(/\D/g, '');
    if (cnpj.length !== 14) {
      throw new BadRequestException('CNPJ deve conter 14 dígitos.');
    }

    const emailResp = data.responsavel.email.toLowerCase();
    const existingUser = await this.prisma.usuario.findFirst({ where: { email: emailResp } });
    if (existingUser) {
      throw new ConflictException('E-mail do responsável já cadastrado.');
    }

    const senha = data.responsavel.senha?.trim() || generatePassword(12);
    const senhaHash = await hash(senha, ARGON2_OPTS);
    const tenantNome = data.nomeFantasia?.trim() || data.razaoSocial.trim();

    try {
      const result = await this.prisma.$transaction(async (tx) => {
        const tenant = await tx.tenant.create({
          data: { nome: tenantNome, status: 'ATIVO' },
        });

        const credor = await tx.credor.create({
          data: {
            tenantId: tenant.id,
            razaoSocial: data.razaoSocial.trim(),
            nomeFantasia: data.nomeFantasia?.trim() || null,
            cnpj,
            telefone: data.telefone.replace(/\D/g, ''),
            emailComercial: data.emailComercial.toLowerCase().trim(),
            setores: data.setores,
            cep: data.cep.replace(/\D/g, ''),
            cidade: data.cidade.trim(),
            estado: data.estado.toUpperCase(),
            bairro: data.bairro.trim(),
            endereco: data.endereco.trim(),
            numero: data.numero.trim(),
            complemento: data.complemento?.trim() || null,
            paginasAcesso: data.paginasAcesso.length ? data.paginasAcesso : ['dashboard'],
          },
        });

        await tx.usuario.create({
          data: {
            tenantId: tenant.id,
            email: emailResp,
            nome: data.responsavel.nome.trim(),
            telefone: data.responsavel.telefone?.replace(/\D/g, '') || null,
            fotoUrl: data.responsavel.fotoUrl?.trim() || null,
            senhaHash,
            papel: 'ADMIN_CREDOR',
            ativo: true,
          },
        });

        return tx.credor.findUniqueOrThrow({
          where: { id: credor.id },
          include: {
            tenant: {
              include: {
                usuarios: {
                  where: { papel: 'ADMIN_CREDOR' },
                  orderBy: { criadoEm: 'asc' },
                  take: 1,
                },
              },
            },
            codigosCliente: true,
          },
        });
      });

      return {
        credor: this.toPublic(result),
        credenciais: { email: emailResp, senha },
      };
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new ConflictException('CNPJ ou e-mail já cadastrado.');
      }
      throw err;
    }
  }

  async findById(id: string): Promise<CredorPublic> {
    const row = await this.prisma.credor.findUnique({
      where: { id },
      include: {
        tenant: {
          include: {
            usuarios: {
              where: { papel: 'ADMIN_CREDOR' },
              orderBy: { criadoEm: 'asc' },
              take: 1,
            },
          },
        },
        codigosCliente: true,
      },
    });
    if (!row) throw new NotFoundException('Credor não encontrado.');
    return this.toPublic(row);
  }

  async update(
    id: string,
    data: {
      razaoSocial?: string;
      nomeFantasia?: string;
      cnpj?: string;
      telefone?: string;
      emailComercial?: string;
      setores?: string[];
      cep?: string;
      cidade?: string;
      estado?: string;
      bairro?: string;
      endereco?: string;
      numero?: string;
      complemento?: string;
      paginasAcesso?: string[];
    },
  ): Promise<CredorPublic> {
    const existing = await this.prisma.credor.findUnique({
      where: { id },
      include: { tenant: true },
    });
    if (!existing) throw new NotFoundException('Credor não encontrado.');

    try {
      const result = await this.prisma.$transaction(async (tx) => {
        const credorData: Prisma.CredorUpdateInput = {};

        if (data.razaoSocial !== undefined) {
          credorData.razaoSocial = data.razaoSocial.trim();
        }
        if (data.nomeFantasia !== undefined) {
          credorData.nomeFantasia = data.nomeFantasia.trim() || null;
          await tx.tenant.update({
            where: { id: existing.tenantId },
            data: {
              nome: data.nomeFantasia.trim() || data.razaoSocial?.trim() || existing.razaoSocial,
            },
          });
        } else if (data.razaoSocial !== undefined) {
          await tx.tenant.update({
            where: { id: existing.tenantId },
            data: { nome: data.razaoSocial.trim() },
          });
        }
        if (data.cnpj !== undefined) {
          const cnpj = data.cnpj.replace(/\D/g, '');
          if (cnpj.length !== 14) throw new BadRequestException('CNPJ deve conter 14 dígitos.');
          credorData.cnpj = cnpj;
        }
        if (data.telefone !== undefined) credorData.telefone = data.telefone.replace(/\D/g, '');
        if (data.emailComercial !== undefined) {
          credorData.emailComercial = data.emailComercial.toLowerCase().trim();
        }
        if (data.setores !== undefined) credorData.setores = data.setores;
        if (data.cep !== undefined) credorData.cep = data.cep.replace(/\D/g, '');
        if (data.cidade !== undefined) credorData.cidade = data.cidade.trim();
        if (data.estado !== undefined) credorData.estado = data.estado.toUpperCase();
        if (data.bairro !== undefined) credorData.bairro = data.bairro.trim();
        if (data.endereco !== undefined) credorData.endereco = data.endereco.trim();
        if (data.numero !== undefined) credorData.numero = data.numero.trim();
        if (data.complemento !== undefined)
          credorData.complemento = data.complemento.trim() || null;
        if (data.paginasAcesso !== undefined) credorData.paginasAcesso = data.paginasAcesso;

        await tx.credor.update({ where: { id }, data: credorData });

        return tx.credor.findUniqueOrThrow({
          where: { id },
          include: {
            tenant: {
              include: {
                usuarios: {
                  where: { papel: 'ADMIN_CREDOR' },
                  orderBy: { criadoEm: 'asc' },
                  take: 1,
                },
              },
            },
            codigosCliente: true,
          },
        });
      });

      return this.toPublic(result);
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new ConflictException('CNPJ ou e-mail já cadastrado.');
      }
      throw err;
    }
  }

  async updateResponsavel(
    credorId: string,
    data: {
      nome?: string;
      email?: string;
      confirmarEmail?: string;
      telefone?: string;
      senha?: string;
      fotoUrl?: string | null;
    },
  ): Promise<{ responsavel: CredorResponsavel; senha?: string }> {
    const credor = await this.prisma.credor.findUnique({
      where: { id: credorId },
      include: {
        tenant: {
          include: {
            usuarios: {
              where: { papel: 'ADMIN_CREDOR' },
              orderBy: { criadoEm: 'asc' },
              take: 1,
            },
          },
        },
      },
    });
    if (!credor) throw new NotFoundException('Credor não encontrado.');

    const usuario = credor.tenant.usuarios[0];
    if (!usuario) throw new NotFoundException('Responsável não encontrado para este credor.');

    const updateData: {
      nome?: string;
      email?: string;
      telefone?: string | null;
      fotoUrl?: string | null;
      senhaHash?: string;
    } = {};

    if (data.nome !== undefined) updateData.nome = data.nome.trim();
    if (data.telefone !== undefined) {
      updateData.telefone = data.telefone.replace(/\D/g, '') || null;
    }
    if (data.fotoUrl !== undefined) {
      updateData.fotoUrl = data.fotoUrl?.trim() || null;
    }

    if (data.email !== undefined) {
      const email = data.email.toLowerCase().trim();
      if (data.confirmarEmail !== undefined) {
        if (data.confirmarEmail.toLowerCase().trim() !== email) {
          throw new BadRequestException('Os e-mails do responsável não conferem.');
        }
      }
      const existingUser = await this.prisma.usuario.findFirst({
        where: { email, NOT: { id: usuario.id } },
      });
      if (existingUser) {
        throw new ConflictException('E-mail do responsável já cadastrado.');
      }
      updateData.email = email;
    }

    let senhaRetorno: string | undefined;
    if (data.senha !== undefined) {
      senhaRetorno = data.senha.trim() || generatePassword(12);
      updateData.senhaHash = await hash(senhaRetorno, ARGON2_OPTS);
    }

    const updated = await this.prisma.usuario.update({
      where: { id: usuario.id },
      data: updateData,
    });

    return {
      responsavel: {
        id: updated.id,
        nome: updated.nome,
        email: updated.email,
        telefone: updated.telefone,
        fotoUrl: updated.fotoUrl,
        ativo: updated.ativo,
      },
      ...(senhaRetorno ? { senha: senhaRetorno } : {}),
    };
  }

  private toPublic(row: CredorRow): CredorPublic {
    const resp = row.tenant.usuarios?.[0];
    return {
      id: row.id,
      tenantId: row.tenantId,
      tenantNome: row.tenant.nome,
      tenantStatus: row.tenant.status,
      razaoSocial: row.razaoSocial,
      nomeFantasia: row.nomeFantasia,
      cnpj: row.cnpj,
      telefone: row.telefone,
      emailComercial: row.emailComercial,
      setores: row.setores,
      cep: row.cep,
      cidade: row.cidade,
      estado: row.estado,
      bairro: row.bairro,
      endereco: row.endereco,
      numero: row.numero,
      complemento: row.complemento,
      paginasAcesso: row.paginasAcesso,
      codClientePrincipal: row.codClientePrincipal,
      codigosCliente: row.codigosCliente,
      responsavel: resp
        ? {
            id: resp.id,
            nome: resp.nome,
            email: resp.email,
            telefone: resp.telefone,
            fotoUrl: resp.fotoUrl,
            ativo: resp.ativo,
          }
        : null,
      criadoEm: row.criadoEm.toISOString(),
    };
  }
}
