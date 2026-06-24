/**
 * Entidades do modelo canônico (forma lógica).
 * Valores monetários sempre em CENTAVOS (inteiro) para evitar erro de ponto flutuante.
 * Datas em ISO-8601 (string) nos contratos de API.
 * Ver docs/03-arquitetura-de-dados.md.
 */
import {
  FaseCobranca,
  PapelUsuario,
  SistemaOrigem,
  StatusCanonico,
  StatusComando,
  TipoComandoAdmin,
} from './enums';

/** Identificadores comuns presentes em toda entidade multi-tenant. */
export interface BaseEntity {
  id: string;
  tenantId: string;
  criadoEm: string;
  atualizadoEm: string;
}

export interface Tenant {
  id: string;
  nome: string;
  status: 'ATIVO' | 'SUSPENSO' | 'INATIVO';
  criadoEm: string;
}

export interface Empresa extends BaseEntity {
  cnpj: string;
  razaoSocial: string;
}

export interface Usuario extends BaseEntity {
  email: string;
  nome: string;
  papel: PapelUsuario;
  mfaHabilitado: boolean;
}

/**
 * Devedor. O documento (CPF/CNPJ) é dado pessoal sob LGPD:
 * - armazenado criptografado no banco;
 * - exposto SEMPRE mascarado na API/UI conforme o papel.
 */
export interface Devedor extends BaseEntity {
  /** Documento mascarado para exibição, ex.: "123.***.***-00". */
  documentoMascarado: string;
  nome: string;
}

export interface Titulo extends BaseEntity {
  empresaId: string;
  devedorId: string;
  valorOriginalCentavos: number;
  valorAtualizadoCentavos: number;
  fase: FaseCobranca;
  statusCanonico: StatusCanonico;
  sistemaOrigem: SistemaOrigem;
  /** Identificador do título no sistema de origem (para idempotência). */
  idExterno: string;
  /** Quando a réplica foi sincronizada pela última vez para este título. */
  sincronizadoEm: string;
}

export interface Interacao extends BaseEntity {
  tituloId: string;
  tipo: string;
  descricao: string;
  data: string;
  sistemaOrigem: SistemaOrigem;
}

export interface Pagamento extends BaseEntity {
  tituloId: string;
  valorCentavos: number;
  data: string;
  sistemaOrigem: SistemaOrigem;
}

export interface ComandoAdmin extends BaseEntity {
  tipo: TipoComandoAdmin;
  idempotencyKey: string;
  status: StatusComando;
  resultado?: string;
}

/** KPIs consolidados do dashboard (por tenant/empresa). */
export interface KpisCarteira {
  totalEmCobrancaCentavos: number;
  recuperadoMesCentavos: number;
  taxaSucesso: number;
  rollRate: number;
  pagamentos24hCentavos: number;
}
