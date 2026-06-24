import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { PapelUsuario } from '@abe/canonical-model';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { UsersService } from '../users/users.service.js';
import { CredoresService } from './credores.service.js';
import {
  CreateCredorDto,
  CreateUsuarioDto,
  UpdateCredorDto,
  UpdateResponsavelCredorDto,
  UpdateUsuarioDto,
} from './dto/admin.dto.js';

@Controller({ path: 'admin', version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(PapelUsuario.SUPER_ADMIN)
export class AdminController {
  constructor(
    private readonly credoresService: CredoresService,
    private readonly usersService: UsersService,
  ) {}

  @Get('credores')
  listCredores() {
    return this.credoresService.list();
  }

  @Post('credores')
  createCredor(@Body() dto: CreateCredorDto) {
    return this.credoresService.create(dto);
  }

  @Get('credores/:id')
  getCredor(@Param('id') id: string) {
    return this.credoresService.findById(id);
  }

  @Patch('credores/:id')
  updateCredor(@Param('id') id: string, @Body() dto: UpdateCredorDto) {
    return this.credoresService.update(id, dto);
  }

  @Patch('credores/:id/responsavel')
  updateResponsavel(@Param('id') id: string, @Body() dto: UpdateResponsavelCredorDto) {
    return this.credoresService.updateResponsavel(id, dto);
  }

  @Get('usuarios')
  listUsuarios() {
    return this.usersService.listPlatformUsers();
  }

  @Get('usuarios/:id')
  getUsuario(@Param('id') id: string) {
    return this.usersService.findPublicById(id);
  }

  @Post('usuarios')
  createUsuario(@Body() dto: CreateUsuarioDto) {
    return this.usersService.createPlatformUser(dto);
  }

  @Patch('usuarios/:id')
  updateUsuario(@Param('id') id: string, @Body() dto: UpdateUsuarioDto) {
    return this.usersService.update(id, dto);
  }
}
