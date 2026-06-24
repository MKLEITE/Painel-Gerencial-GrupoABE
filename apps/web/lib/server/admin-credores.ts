import type { SupabaseClient } from '@supabase/supabase-js';
import { generatePassword } from './generate-password';

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

type CredorRow = {
  id: string;
  tenant_id: string;
  razao_social: string;
  nome_fantasia: string | null;
  cnpj: string | null;
  telefone: string | null;
  email_comercial: string | null;
  setores: string[];
  cep: string | null;
  cidade: string | null;
  estado: string | null;
  bairro: string | null;
  endereco: string | null;
  numero: string | null;
  complemento: string | null;
  paginas_acesso: string[];
  cod_cliente_principal: string | null;
  criado_em: string;
  tenants: { nome: string; status: string } | { nome: string; status: string }[];
  codigos_cliente: { id: string; cod_cliente: string; rotulo: string | null }[];
};

function tenantOf(row: CredorRow): { nome: string; status: string } {
  return Array.isArray(row.tenants) ? row.tenants[0]! : row.tenants;
}

function toPublic(row: CredorRow, responsavel: CredorResponsavel | null): CredorPublic {
  const tenant = tenantOf(row);
  return {
    id: row.id,
    tenantId: row.tenant_id,
    tenantNome: tenant.nome,
    tenantStatus: tenant.status,
    razaoSocial: row.razao_social,
    nomeFantasia: row.nome_fantasia,
    cnpj: row.cnpj,
    telefone: row.telefone,
    emailComercial: row.email_comercial,
    setores: row.setores ?? [],
    cep: row.cep,
    cidade: row.cidade,
    estado: row.estado,
    bairro: row.bairro,
    endereco: row.endereco,
    numero: row.numero,
    complemento: row.complemento,
    paginasAcesso: row.paginas_acesso ?? ['dashboard'],
    codClientePrincipal: row.cod_cliente_principal,
    codigosCliente: (row.codigos_cliente ?? []).map((c) => ({
      id: c.id,
      codCliente: c.cod_cliente,
      rotulo: c.rotulo,
    })),
    responsavel,
    criadoEm: row.criado_em,
  };
}

const CREDOR_SELECT = `
  id, tenant_id, razao_social, nome_fantasia, cnpj, telefone, email_comercial,
  setores, cep, cidade, estado, bairro, endereco, numero, complemento,
  paginas_acesso, cod_cliente_principal, criado_em,
  tenants ( nome, status ),
  codigos_cliente ( id, cod_cliente, rotulo )
`;

async function fetchResponsavel(
  db: SupabaseClient,
  tenantId: string,
): Promise<CredorResponsavel | null> {
  const { data } = await db
    .from('usuarios')
    .select('id, nome, email, telefone, foto_url, ativo')
    .eq('tenant_id', tenantId)
    .eq('papel', 'ADMIN_CREDOR')
    .order('criado_em', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!data) return null;
  return {
    id: data.id,
    nome: data.nome,
    email: data.email,
    telefone: data.telefone,
    fotoUrl: data.foto_url,
    ativo: data.ativo,
  };
}

export async function listCredores(db: SupabaseClient): Promise<CredorPublic[]> {
  const { data, error } = await db
    .from('credores')
    .select(CREDOR_SELECT)
    .order('razao_social', { ascending: true });

  if (error) throw error;

  const rows = (data ?? []) as CredorRow[];
  return Promise.all(
    rows.map(async (row) => toPublic(row, await fetchResponsavel(db, row.tenant_id))),
  );
}

export async function getCredor(db: SupabaseClient, id: string): Promise<CredorPublic | null> {
  const { data, error } = await db
    .from('credores')
    .select(CREDOR_SELECT)
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const row = data as CredorRow;
  return toPublic(row, await fetchResponsavel(db, row.tenant_id));
}

export async function createCredor(
  db: SupabaseClient,
  data: {
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
  },
): Promise<{ credor: CredorPublic; credenciais: { email: string; senha: string } }> {
  if (data.responsavel.email.toLowerCase() !== data.responsavel.confirmarEmail.toLowerCase()) {
    throw new AdminError('Os e-mails do responsável não conferem.', 400);
  }

  const cnpj = data.cnpj.replace(/\D/g, '');
  if (cnpj.length !== 14) {
    throw new AdminError('CNPJ deve conter 14 dígitos.', 400);
  }

  const emailResp = data.responsavel.email.toLowerCase().trim();
  const { data: existingUser } = await db
    .from('usuarios')
    .select('id')
    .ilike('email', emailResp)
    .maybeSingle();

  if (existingUser) {
    throw new AdminError('E-mail do responsável já cadastrado.', 409);
  }

  const senha = data.responsavel.senha?.trim() || generatePassword(12);
  const tenantNome = data.nomeFantasia?.trim() || data.razaoSocial.trim();

  const { data: authUser, error: authError } = await db.auth.admin.createUser({
    email: emailResp,
    password: senha,
    email_confirm: true,
    user_metadata: { nome: data.responsavel.nome.trim() },
  });

  if (authError) {
    if (authError.message.includes('already') || authError.status === 422) {
      throw new AdminError('E-mail do responsável já cadastrado.', 409);
    }
    throw authError;
  }

  const userId = authUser.user.id;

  const { data: tenant, error: tenantError } = await db
    .from('tenants')
    .insert({ nome: tenantNome, status: 'ATIVO' })
    .select('id')
    .single();

  if (tenantError) {
    await db.auth.admin.deleteUser(userId);
    throw tenantError;
  }

  const { data: credorRow, error: credorError } = await db
    .from('credores')
    .insert({
      tenant_id: tenant.id,
      razao_social: data.razaoSocial.trim(),
      nome_fantasia: data.nomeFantasia?.trim() || null,
      cnpj,
      telefone: data.telefone.replace(/\D/g, ''),
      email_comercial: data.emailComercial.toLowerCase().trim(),
      setores: data.setores,
      cep: data.cep.replace(/\D/g, ''),
      cidade: data.cidade.trim(),
      estado: data.estado.toUpperCase(),
      bairro: data.bairro.trim(),
      endereco: data.endereco.trim(),
      numero: data.numero.trim(),
      complemento: data.complemento?.trim() || null,
      paginas_acesso: data.paginasAcesso.length ? data.paginasAcesso : ['dashboard'],
    })
    .select('id')
    .single();

  if (credorError || !credorRow) {
    await db.from('tenants').delete().eq('id', tenant.id);
    await db.auth.admin.deleteUser(userId);
    throw credorError ?? new Error('Falha ao criar credor.');
  }

  const { error: usuarioError } = await db.from('usuarios').insert({
    id: userId,
    tenant_id: tenant.id,
    email: emailResp,
    nome: data.responsavel.nome.trim(),
    telefone: data.responsavel.telefone?.replace(/\D/g, '') || null,
    foto_url: data.responsavel.fotoUrl?.trim() || null,
    papel: 'ADMIN_CREDOR',
    ativo: true,
  });

  if (usuarioError) {
    await db.from('credores').delete().eq('tenant_id', tenant.id);
    await db.from('tenants').delete().eq('id', tenant.id);
    await db.auth.admin.deleteUser(userId);
    throw usuarioError;
  }

  const credor = await getCredor(db, credorRow.id);
  if (!credor) throw new Error('Credor criado mas não encontrado.');

  return { credor, credenciais: { email: emailResp, senha } };
}

export async function updateCredor(
  db: SupabaseClient,
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
  const { data: existing, error: findError } = await db
    .from('credores')
    .select('id, tenant_id, razao_social')
    .eq('id', id)
    .maybeSingle();

  if (findError) throw findError;
  if (!existing) throw new AdminError('Credor não encontrado.', 404);

  const patch: Record<string, unknown> = {};

  if (data.razaoSocial !== undefined) patch.razao_social = data.razaoSocial.trim();
  if (data.nomeFantasia !== undefined) patch.nome_fantasia = data.nomeFantasia.trim() || null;
  if (data.cnpj !== undefined) {
    const cnpj = data.cnpj.replace(/\D/g, '');
    if (cnpj.length !== 14) throw new AdminError('CNPJ deve conter 14 dígitos.', 400);
    patch.cnpj = cnpj;
  }
  if (data.telefone !== undefined) patch.telefone = data.telefone.replace(/\D/g, '');
  if (data.emailComercial !== undefined)
    patch.email_comercial = data.emailComercial.toLowerCase().trim();
  if (data.setores !== undefined) patch.setores = data.setores;
  if (data.cep !== undefined) patch.cep = data.cep.replace(/\D/g, '');
  if (data.cidade !== undefined) patch.cidade = data.cidade.trim();
  if (data.estado !== undefined) patch.estado = data.estado.toUpperCase();
  if (data.bairro !== undefined) patch.bairro = data.bairro.trim();
  if (data.endereco !== undefined) patch.endereco = data.endereco.trim();
  if (data.numero !== undefined) patch.numero = data.numero.trim();
  if (data.complemento !== undefined) patch.complemento = data.complemento.trim() || null;
  if (data.paginasAcesso !== undefined) patch.paginas_acesso = data.paginasAcesso;

  if (Object.keys(patch).length) {
    const { error } = await db.from('credores').update(patch).eq('id', id);
    if (error) throw error;
  }

  if (data.nomeFantasia !== undefined || data.razaoSocial !== undefined) {
    const tenantNome =
      data.nomeFantasia?.trim() || data.razaoSocial?.trim() || existing.razao_social;
    await db.from('tenants').update({ nome: tenantNome }).eq('id', existing.tenant_id);
  }

  const credor = await getCredor(db, id);
  if (!credor) throw new AdminError('Credor não encontrado.', 404);
  return credor;
}

export async function updateResponsavelCredor(
  db: SupabaseClient,
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
  const { data: credor, error: credorError } = await db
    .from('credores')
    .select('tenant_id')
    .eq('id', credorId)
    .maybeSingle();

  if (credorError) throw credorError;
  if (!credor) throw new AdminError('Credor não encontrado.', 404);

  const { data: usuario, error: userError } = await db
    .from('usuarios')
    .select('id, nome, email, telefone, foto_url, ativo')
    .eq('tenant_id', credor.tenant_id)
    .eq('papel', 'ADMIN_CREDOR')
    .order('criado_em', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (userError) throw userError;
  if (!usuario) throw new AdminError('Responsável não encontrado para este credor.', 404);

  const patch: Record<string, unknown> = {};
  let senhaRetorno: string | undefined;

  if (data.nome !== undefined) patch.nome = data.nome.trim();
  if (data.telefone !== undefined) patch.telefone = data.telefone.replace(/\D/g, '') || null;
  if (data.fotoUrl !== undefined) patch.foto_url = data.fotoUrl?.trim() || null;

  if (data.email !== undefined) {
    const email = data.email.toLowerCase().trim();
    if (data.confirmarEmail !== undefined && data.confirmarEmail.toLowerCase().trim() !== email) {
      throw new AdminError('Os e-mails do responsável não conferem.', 400);
    }
    const { data: existing } = await db
      .from('usuarios')
      .select('id')
      .ilike('email', email)
      .neq('id', usuario.id)
      .maybeSingle();
    if (existing) throw new AdminError('E-mail do responsável já cadastrado.', 409);
    patch.email = email;

    const { error: authEmailError } = await db.auth.admin.updateUserById(usuario.id, { email });
    if (authEmailError) throw authEmailError;
  }

  if (data.senha !== undefined) {
    senhaRetorno = data.senha.trim() || generatePassword(12);
    const { error: authPassError } = await db.auth.admin.updateUserById(usuario.id, {
      password: senhaRetorno,
    });
    if (authPassError) throw authPassError;
  }

  if (Object.keys(patch).length) {
    const { data: updated, error } = await db
      .from('usuarios')
      .update(patch)
      .eq('id', usuario.id)
      .select('id, nome, email, telefone, foto_url, ativo')
      .single();
    if (error) throw error;
    return {
      responsavel: {
        id: updated.id,
        nome: updated.nome,
        email: updated.email,
        telefone: updated.telefone,
        fotoUrl: updated.foto_url,
        ativo: updated.ativo,
      },
      ...(senhaRetorno ? { senha: senhaRetorno } : {}),
    };
  }

  return {
    responsavel: {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      telefone: usuario.telefone,
      fotoUrl: usuario.foto_url,
      ativo: usuario.ativo,
    },
    ...(senhaRetorno ? { senha: senhaRetorno } : {}),
  };
}

export class AdminError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'AdminError';
  }
}

function mapDbError(err: unknown): never {
  if (err instanceof AdminError) throw err;
  const code = (err as { code?: string })?.code;
  if (code === '23505') throw new AdminError('CNPJ ou e-mail já cadastrado.', 409);
  throw err;
}

export { mapDbError };
