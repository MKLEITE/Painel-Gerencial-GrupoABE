import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEmail,
  IsEnum,
  IsIn,
  IsOptional,
  IsString,
  Length,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PapelUsuario } from '@abe/canonical-model';

export class ResponsavelCredorDto {
  @IsString()
  @MinLength(2)
  nome!: string;

  @IsEmail()
  email!: string;

  @IsEmail()
  confirmarEmail!: string;

  @IsOptional()
  @IsString()
  telefone?: string;

  @IsOptional()
  @IsString()
  @MinLength(8)
  senha?: string;

  @IsOptional()
  @IsString()
  fotoUrl?: string | null;
}

export class CreateCredorDto {
  @IsString()
  @MinLength(2)
  razaoSocial!: string;

  @IsOptional()
  @IsString()
  nomeFantasia?: string;

  @IsString()
  @MinLength(14, { message: 'CNPJ deve conter 14 dígitos.' })
  cnpj!: string;

  @IsString()
  @MinLength(8)
  telefone!: string;

  @IsEmail()
  emailComercial!: string;

  @IsArray()
  @ArrayMinSize(1, { message: 'Selecione ao menos um setor.' })
  @IsString({ each: true })
  setores!: string[];

  @IsString()
  @MinLength(8)
  cep!: string;

  @IsString()
  @MinLength(2)
  cidade!: string;

  @IsString()
  @Length(2, 2)
  estado!: string;

  @IsString()
  @MinLength(2)
  bairro!: string;

  @IsString()
  @MinLength(2)
  endereco!: string;

  @IsString()
  @MinLength(1)
  numero!: string;

  @IsOptional()
  @IsString()
  complemento?: string;

  @IsArray()
  @ArrayMinSize(1, { message: 'Selecione ao menos uma página de acesso.' })
  @IsString({ each: true })
  paginasAcesso!: string[];

  @ValidateNested()
  @Type(() => ResponsavelCredorDto)
  responsavel!: ResponsavelCredorDto;
}

export class CreateUsuarioDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(2)
  nome!: string;

  @IsString()
  @MinLength(8, { message: 'Senha deve ter no mínimo 8 caracteres.' })
  senha!: string;

  @IsEnum(PapelUsuario)
  @IsIn([PapelUsuario.SUPER_ADMIN, PapelUsuario.OPERADOR], {
    message: 'Papel inválido para usuário da plataforma.',
  })
  papel!: PapelUsuario;
}

export class UpdateCredorDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  razaoSocial?: string;

  @IsOptional()
  @IsString()
  nomeFantasia?: string;

  @IsOptional()
  @IsString()
  @MinLength(14, { message: 'CNPJ deve conter 14 dígitos.' })
  cnpj?: string;

  @IsOptional()
  @IsString()
  telefone?: string;

  @IsOptional()
  @IsEmail()
  emailComercial?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  setores?: string[];

  @IsOptional()
  @IsString()
  cep?: string;

  @IsOptional()
  @IsString()
  cidade?: string;

  @IsOptional()
  @IsString()
  @Length(2, 2)
  estado?: string;

  @IsOptional()
  @IsString()
  bairro?: string;

  @IsOptional()
  @IsString()
  endereco?: string;

  @IsOptional()
  @IsString()
  numero?: string;

  @IsOptional()
  @IsString()
  complemento?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  paginasAcesso?: string[];
}

export class UpdateResponsavelCredorDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  nome?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsEmail()
  confirmarEmail?: string;

  @IsOptional()
  @IsString()
  telefone?: string;

  @IsOptional()
  @IsString()
  @MinLength(8, { message: 'Senha deve ter no mínimo 8 caracteres.' })
  senha?: string;

  @IsOptional()
  @IsString()
  fotoUrl?: string | null;
}

export class UpdateUsuarioDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  nome?: string;

  @IsOptional()
  @IsEnum(PapelUsuario)
  @IsIn([PapelUsuario.SUPER_ADMIN, PapelUsuario.OPERADOR])
  papel?: PapelUsuario;

  @IsOptional()
  @IsBoolean()
  ativo?: boolean;

  @IsOptional()
  @IsString()
  @MinLength(8, { message: 'Senha deve ter no mínimo 8 caracteres.' })
  senha?: string;
}
