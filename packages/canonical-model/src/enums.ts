/**
 * Enumerações do modelo canônico.
 * Estes valores são a "linguagem padrão" do portal, independente do sistema de origem.
 * Ver docs/03-arquitetura-de-dados.md (seção de tradução de status).
 */

/** Sistemas de origem dos dados. */
export enum SistemaOrigem {
  AVANTPAY = 'AVANTPAY',
  ABE_INTERNO = 'ABE_INTERNO',
  ABEWEB = 'ABEWEB',
  ACORDO_SEGURO = 'ACORDO_SEGURO',
}

/** Fase da régua de cobrança (visão consolidada para o cliente). */
export enum FaseCobranca {
  PREVENTIVA = 'PREVENTIVA',
  COBRANCA_ATIVA = 'COBRANCA_ATIVA',
  ACORDO = 'ACORDO',
  LIQUIDACAO = 'LIQUIDACAO',
  INSUCESSO = 'INSUCESSO',
}

/** Status canônico padronizado (de-para a partir do status de cada fonte). */
export enum StatusCanonico {
  AGUARDANDO_ENVIO = 'AGUARDANDO_ENVIO',
  LEMBRETE_ENVIADO = 'LEMBRETE_ENVIADO',
  EM_ATRASO = 'EM_ATRASO',
  EM_NEGOCIACAO = 'EM_NEGOCIACAO',
  ACORDO_FIRMADO = 'ACORDO_FIRMADO',
  PARCELA_PAGA = 'PARCELA_PAGA',
  QUITADO = 'QUITADO',
  QUEBRA_ACORDO = 'QUEBRA_ACORDO',
  BAIXADO = 'BAIXADO',
}

/** Papéis de usuário (RBAC). Ver docs/01 e docs/06. */
export enum PapelUsuario {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN_CREDOR = 'ADMIN_CREDOR',
  OPERADOR = 'OPERADOR',
  VIEWER = 'VIEWER',
}

/** Tipo de ação administrativa (idempotente). */
export enum TipoComandoAdmin {
  TRANSFERIR = 'TRANSFERIR',
  PAUSAR = 'PAUSAR',
}

/** Status do processamento de um comando administrativo. */
export enum StatusComando {
  PENDENTE = 'PENDENTE',
  EM_PROCESSAMENTO = 'EM_PROCESSAMENTO',
  CONCLUIDO = 'CONCLUIDO',
  FALHOU = 'FALHOU',
}
