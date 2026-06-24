import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { randomUUID } from 'node:crypto';
import { UserPublic } from '../users/users.types.js';
import { UsersService } from '../users/users.service.js';
import { AuthenticatedUser, JwtPayload } from './auth.types.js';

export const ACCESS_TOKEN_COOKIE = 'access_token';
export const REFRESH_TOKEN_COOKIE = 'refresh_token';

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  /** Refresh tokens válidos (jti → userId). Rotacionados a cada uso. */
  private readonly refreshTokens = new Map<string, string>();

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  async login(email: string, senha: string): Promise<{ user: UserPublic; tokens: TokenPair }> {
    const user = await this.usersService.findByEmail(email);
    if (!user || !user.ativo) {
      throw new UnauthorizedException('Credenciais inválidas.');
    }

    const senhaValida = await this.usersService.validatePassword(user, senha);
    if (!senhaValida) {
      throw new UnauthorizedException('Credenciais inválidas.');
    }

    const tokens = await this.issueTokenPair(user.id, user.email, user.tenantId, user.papel);
    return { user: this.usersService.toPublic(user), tokens };
  }

  async refresh(refreshToken: string): Promise<TokenPair> {
    const payload = await this.verifyToken(refreshToken, 'refresh');
    const storedUserId = this.refreshTokens.get(payload.jti ?? '');
    if (!storedUserId || storedUserId !== payload.sub) {
      throw new UnauthorizedException('Sessão inválida ou expirada.');
    }

    this.refreshTokens.delete(payload.jti ?? '');

    const user = await this.usersService.findById(payload.sub);
    if (!user || !user.ativo) {
      throw new UnauthorizedException('Usuário inativo ou não encontrado.');
    }

    return this.issueTokenPair(user.id, user.email, user.tenantId, user.papel);
  }

  logout(refreshToken?: string): void {
    if (!refreshToken) return;
    try {
      const payload = this.jwtService.verify<JwtPayload>(refreshToken, {
        secret: this.config.get<string>('JWT_REFRESH_SECRET'),
      });
      if (payload.jti) this.refreshTokens.delete(payload.jti);
    } catch {
      // Token inválido/expirado — nada a revogar.
    }
  }

  async validateAccessToken(token: string): Promise<AuthenticatedUser> {
    const payload = await this.verifyToken(token, 'access');
    const user = await this.usersService.findById(payload.sub);
    if (!user || !user.ativo) {
      throw new UnauthorizedException('Usuário inativo ou não encontrado.');
    }
    return {
      id: user.id,
      email: user.email,
      tenantId: user.tenantId,
      papel: user.papel,
    };
  }

  private async issueTokenPair(
    userId: string,
    email: string,
    tenantId: string,
    papel: JwtPayload['papel'],
  ): Promise<TokenPair> {
    const jti = randomUUID();
    const base = { sub: userId, email, tenantId, papel };

    const accessToken = await this.jwtService.signAsync(
      { ...base, type: 'access' as const },
      {
        secret: this.config.get<string>('JWT_ACCESS_SECRET'),
        expiresIn: this.config.get<string>('JWT_ACCESS_EXPIRES_IN'),
      },
    );

    const refreshToken = await this.jwtService.signAsync(
      { ...base, type: 'refresh' as const, jti },
      {
        secret: this.config.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.config.get<string>('JWT_REFRESH_EXPIRES_IN'),
      },
    );

    this.refreshTokens.set(jti, userId);
    return { accessToken, refreshToken };
  }

  private async verifyToken(token: string, expectedType: JwtPayload['type']): Promise<JwtPayload> {
    try {
      const secret =
        expectedType === 'access'
          ? this.config.get<string>('JWT_ACCESS_SECRET')
          : this.config.get<string>('JWT_REFRESH_SECRET');

      const payload = await this.jwtService.verifyAsync<JwtPayload>(token, { secret });
      if (payload.type !== expectedType) {
        throw new UnauthorizedException('Token inválido.');
      }
      return payload;
    } catch {
      throw new UnauthorizedException('Token inválido ou expirado.');
    }
  }
}
