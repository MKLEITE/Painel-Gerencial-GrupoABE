import { apiFetch } from './api-client';

export interface CredorResponsavel {
  id: string;
  nome: string;
  email: string;
  telefone: string | null;
  fotoUrl: string | null;
  ativo: boolean;
}

export interface Credor {
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

export interface AdminUsuario {
  id: string;
  tenantId: string;
  email: string;
  nome: string;
  papel: string;
  ativo: boolean;
}

export interface CreateCredorPayload {
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
}

export interface CreateCredorResult {
  credor: Credor;
  credenciais: { email: string; senha: string };
}

export function listCredores(): Promise<Credor[]> {
  return apiFetch('/v1/admin/credores');
}

export function getCredor(id: string): Promise<Credor> {
  return apiFetch(`/v1/admin/credores/${id}`);
}

export function createCredor(body: CreateCredorPayload): Promise<CreateCredorResult> {
  return apiFetch('/v1/admin/credores', { method: 'POST', body: JSON.stringify(body) });
}

export function updateCredor(
  id: string,
  body: Partial<Omit<CreateCredorPayload, 'responsavel'>>,
): Promise<Credor> {
  return apiFetch(`/v1/admin/credores/${id}`, { method: 'PATCH', body: JSON.stringify(body) });
}

export function updateResponsavelCredor(
  credorId: string,
  body: {
    nome?: string;
    email?: string;
    confirmarEmail?: string;
    telefone?: string;
    senha?: string;
    fotoUrl?: string | null;
  },
): Promise<{ responsavel: CredorResponsavel; senha?: string }> {
  return apiFetch(`/v1/admin/credores/${credorId}/responsavel`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

export function listUsuarios(): Promise<AdminUsuario[]> {
  return apiFetch('/v1/admin/usuarios');
}

export function getUsuario(id: string): Promise<AdminUsuario> {
  return apiFetch(`/v1/admin/usuarios/${id}`);
}

export function createUsuario(body: {
  email: string;
  nome: string;
  senha: string;
  papel: string;
}): Promise<AdminUsuario> {
  return apiFetch('/v1/admin/usuarios', { method: 'POST', body: JSON.stringify(body) });
}

export function updateUsuario(
  id: string,
  body: Partial<{ nome: string; papel: string; ativo: boolean; senha: string }>,
): Promise<AdminUsuario> {
  return apiFetch(`/v1/admin/usuarios/${id}`, { method: 'PATCH', body: JSON.stringify(body) });
}
