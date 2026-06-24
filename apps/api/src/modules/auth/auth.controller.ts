import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { UsersService } from '../users/users.service.js';
import { AuthenticatedUser } from './auth.types.js';
import {
  ACCESS_TOKEN_COOKIE,
  AuthService,
  REFRESH_TOKEN_COOKIE,
} from './auth.service.js';
import { LoginDto } from './dto/login.dto.js';

@Controller({ path: 'auth', version: '1' })
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
    private readonly config: ConfigService,
  ) {}

  @Post('login')
  @HttpCode(200)
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ user: { id: string; email: string; nome: string; papel: string; fotoUrl: string | null } }> {
    const { user, tokens } = await this.authService.login(dto.email, dto.senha);
    this.setAuthCookies(res, tokens.accessToken, tokens.refreshToken);
    return { user };
  }

  @Post('refresh')
  @HttpCode(200)
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ ok: true }> {
    const refreshToken = req.cookies?.[REFRESH_TOKEN_COOKIE] as string | undefined;
    if (!refreshToken) {
      throw new UnauthorizedException('Sessão expirada.');
    }
    const tokens = await this.authService.refresh(refreshToken);
    this.setAuthCookies(res, tokens.accessToken, tokens.refreshToken);
    return { ok: true };
  }

  @Post('logout')
  @HttpCode(200)
  logout(@Req() req: Request, @Res({ passthrough: true }) res: Response): { ok: true } {
    const refreshToken = req.cookies?.[REFRESH_TOKEN_COOKIE] as string | undefined;
    this.authService.logout(refreshToken);
    this.clearAuthCookies(res);
    return { ok: true };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async me(@CurrentUser() user: AuthenticatedUser) {
    const record = await this.usersService.findById(user.id);
    if (!record) {
      throw new UnauthorizedException('Usuário não encontrado.');
    }
    return { user: this.usersService.toPublic(record) };
  }

  private setAuthCookies(res: Response, accessToken: string, refreshToken: string): void {
    const secure = this.config.get<boolean>('COOKIE_SECURE') ?? false;
    const common = {
      httpOnly: true,
      secure,
      sameSite: 'lax' as const,
      path: '/',
    };

    res.cookie(ACCESS_TOKEN_COOKIE, accessToken, {
      ...common,
      maxAge: 15 * 60 * 1000,
    });
    res.cookie(REFRESH_TOKEN_COOKIE, refreshToken, {
      ...common,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
  }

  private clearAuthCookies(res: Response): void {
    res.clearCookie(ACCESS_TOKEN_COOKIE, { path: '/' });
    res.clearCookie(REFRESH_TOKEN_COOKIE, { path: '/' });
  }
}
