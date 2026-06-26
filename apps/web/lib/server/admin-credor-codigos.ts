import type { SupabaseClient } from '@supabase/supabase-js';
import { AdminError } from './admin-errors';
import { assertCnpjDigits, assertEstado } from './admin-validators';

export interface CredorCodigoUnidade {
  id: string;
  codCliente: string;
  rotulo: string | null;
  papel: 'matriz' | 'filial';
  sistema: 'WEB' | 'Delphi';
  razaoSocial: string | null;
  nomeFantasia: string | null;
  cnpj: string | null;
  telefone: string | null;
  emailComercial: string | null;
  cep: string | null;
  cidade: string | null;
  estado: string | null;
  bairro: string | null;
  endereco: string | null;
  numero: string | null;
  complemento: string | null;
  comercialPrincipal: string | null;
  preposto: string | null;
  legadoSyncEm: string | null;
}

type CodigoRow = {
  id: string;
  credor_id: string;
  cod_cliente: string;
  rotulo: string | null;
  papel: 'matriz' | 'filial';
  razao_social: string | null;
  nome_fantasia: string | null;
  cnpj: string | null;
  telefone: string | null;
  email_comercial: string | null;
  cep: string | null;
  cidade: string | null;
  estado: string | null;
  bairro: string | null;
  endereco: string | null;
  numero: string | null;
  complemento: string | null;
  comercial_principal: string | null;
  preposto: string | null;
  legado_sync_em: string | null;
};

type CredorRow = {
  id: string;
  tenant_id: string;
  razao_social: string;
  nome_fantasia: string | null;
  cnpj: string | null;
  telefone: string | null;
  email_comercial: string | null;
  cep: string | null;
  cidade: string | null;
  estado: string | null;
  bairro: string | null;
  endereco: string | null;
  numero: string | null;
  complemento: string | null;
  cod_cliente_principal: string | null;
  abe_delphi_cliente_id: string | null;
};

const CODIGO_SELECT = `
  id, credor_id, cod_cliente, rotulo, papel,
  razao_social, nome_fantasia, cnpj, telefone, email_comercial,
  cep, cidade, estado, bairro, endereco, numero, complemento,
  comercial_principal, preposto, legado_sync_em
`;

function sistemaDe(rotulo: string | null): 'WEB' | 'Delphi' {
  return rotulo === 'ABE_DELPHI' ? 'Delphi' : 'WEB';
}

function toPublic(row: CodigoRow): CredorCodigoUnidade {
  return {
    id: row.id,
    codCliente: row.cod_cliente,
    rotulo: row.rotulo,
    papel: row.papel,
    sistema: sistemaDe(row.rotulo),
    razaoSocial: row.razao_social,
    nomeFantasia: row.nome_fantasia,
    cnpj: row.cnpj,
    telefone: row.telefone,
    emailComercial: row.email_comercial,
    cep: row.cep,
    cidade: row.cidade,
    estado: row.estado,
    bairro: row.bairro,
    endereco: row.endereco,
    numero: row.numero,
    complemento: row.complemento,
    comercialPrincipal: row.comercial_principal,
    preposto: row.preposto,
    legadoSyncEm: row.legado_sync_em,
  };
}

function expectedCodigos(
  credor: CredorRow,
): { cod: string; rotulo: string; papel: 'matriz' | 'filial' }[] {
  const out: { cod: string; rotulo: string; papel: 'matriz' | 'filial' }[] = [];
  const seen = new Set<string>();

  function add(cod: string | null | undefined, rotulo: string, papel: 'matriz' | 'filial') {
    const key = cod?.trim();
    if (!key || seen.has(`${rotulo}:${key}`)) return;
    seen.add(`${rotulo}:${key}`);
    out.push({ cod: key, rotulo, papel });
  }

  if (credor.cod_cliente_principal) add(credor.cod_cliente_principal, 'ABE_WEB', 'matriz');
  if (credor.abe_delphi_cliente_id) add(credor.abe_delphi_cliente_id, 'ABE_DELPHI', 'matriz');

  return out;
}

function cadastroFromCredor(credor: CredorRow) {
  return {
    razao_social: credor.razao_social,
    nome_fantasia: credor.nome_fantasia,
    cnpj: credor.cnpj,
    telefone: credor.telefone,
    email_comercial: credor.email_comercial,
    cep: credor.cep,
    cidade: credor.cidade,
    estado: credor.estado,
    bairro: credor.bairro,
    endereco: credor.endereco,
    numero: credor.numero,
    complemento: credor.complemento,
  };
}

export async function ensureCredorCodigos(db: SupabaseClient, credorId: string): Promise<void> {
  const { data: credor, error } = await db
    .from('credores')
    .select(
      `id, tenant_id, razao_social, nome_fantasia, cnpj, telefone, email_comercial,
       cep, cidade, estado, bairro, endereco, numero, complemento,
       cod_cliente_principal, abe_delphi_cliente_id`,
    )
    .eq('id', credorId)
    .maybeSingle();

  if (error) throw error;
  if (!credor) throw new AdminError('Credor não encontrado.', 404);

  const c = credor as CredorRow;
  const { data: existingRows } = await db
    .from('codigos_cliente')
    .select('cod_cliente, rotulo')
    .eq('credor_id', credorId);

  for (const row of existingRows ?? []) {
    const cod = row.cod_cliente?.trim();
    if (!cod) continue;
    const rotulo = row.rotulo === 'ABE_DELPHI' ? 'ABE_DELPHI' : 'ABE_WEB';
    const isWebMatriz = cod === c.cod_cliente_principal?.trim();
    const isDelphiMatriz = cod === c.abe_delphi_cliente_id?.trim();
    const papel = isWebMatriz || isDelphiMatriz ? 'matriz' : 'filial';
    await db
      .from('codigos_cliente')
      .update({ papel, rotulo })
      .eq('credor_id', credorId)
      .eq('cod_cliente', cod);
  }

  for (const exp of expectedCodigos(c)) {
    const { data: found } = await db
      .from('codigos_cliente')
      .select('id')
      .eq('credor_id', credorId)
      .eq('cod_cliente', exp.cod)
      .maybeSingle();

    if (found) continue;

    const seed =
      exp.papel === 'matriz' &&
      ((exp.rotulo === 'ABE_WEB' && exp.cod === c.cod_cliente_principal) ||
        (exp.rotulo === 'ABE_DELPHI' && exp.cod === c.abe_delphi_cliente_id))
        ? cadastroFromCredor(c)
        : {
            razao_social: null,
            nome_fantasia: null,
            cnpj: null,
            telefone: null,
            email_comercial: null,
            cep: null,
            cidade: null,
            estado: null,
            bairro: null,
            endereco: null,
            numero: null,
            complemento: null,
          };

    await db.from('codigos_cliente').insert({
      credor_id: credorId,
      cod_cliente: exp.cod,
      rotulo: exp.rotulo,
      papel: exp.papel,
      ...seed,
    });
  }
}

export async function listCredorCodigos(
  db: SupabaseClient,
  credorId: string,
): Promise<CredorCodigoUnidade[]> {
  await ensureCredorCodigos(db, credorId);

  const { data, error } = await db
    .from('codigos_cliente')
    .select(CODIGO_SELECT)
    .eq('credor_id', credorId)
    .order('papel', { ascending: true })
    .order('rotulo', { ascending: true })
    .order('cod_cliente', { ascending: true });

  if (error) throw error;

  const rows = (data ?? []) as CodigoRow[];
  return rows.map(toPublic).sort((a, b) => {
    if (a.sistema !== b.sistema) return a.sistema === 'WEB' ? -1 : 1;
    if (a.papel !== b.papel) return a.papel === 'matriz' ? -1 : 1;
    return Number(a.codCliente) - Number(b.codCliente) || a.codCliente.localeCompare(b.codCliente);
  });
}

export async function updateCredorCodigo(
  db: SupabaseClient,
  credorId: string,
  codigoId: string,
  data: Partial<{
    razaoSocial: string;
    nomeFantasia: string;
    cnpj: string;
    telefone: string;
    emailComercial: string;
    cep: string;
    cidade: string;
    estado: string;
    bairro: string;
    endereco: string;
    numero: string;
    complemento: string;
    comercialPrincipal: string;
    preposto: string;
  }>,
): Promise<CredorCodigoUnidade> {
  const { data: credor } = await db
    .from('credores')
    .select('id, cod_cliente_principal, abe_delphi_cliente_id')
    .eq('id', credorId)
    .maybeSingle();

  if (!credor) throw new AdminError('Credor não encontrado.', 404);

  const patch: Record<string, unknown> = {};
  if (data.razaoSocial !== undefined) patch.razao_social = data.razaoSocial.trim();
  if (data.nomeFantasia !== undefined) patch.nome_fantasia = data.nomeFantasia.trim() || null;
  if (data.cnpj !== undefined) {
    const digits = data.cnpj.replace(/\D/g, '');
    patch.cnpj = digits.length ? assertCnpjDigits(digits) : null;
  }
  if (data.telefone !== undefined) patch.telefone = data.telefone.replace(/\D/g, '') || null;
  if (data.emailComercial !== undefined)
    patch.email_comercial = data.emailComercial.trim().toLowerCase() || null;
  if (data.cep !== undefined) patch.cep = data.cep.replace(/\D/g, '') || null;
  if (data.cidade !== undefined) patch.cidade = data.cidade.trim() || null;
  if (data.estado !== undefined) {
    const uf = data.estado.trim();
    patch.estado = uf ? assertEstado(uf) : null;
  }
  if (data.bairro !== undefined) patch.bairro = data.bairro.trim() || null;
  if (data.endereco !== undefined) patch.endereco = data.endereco.trim() || null;
  if (data.numero !== undefined) patch.numero = data.numero.trim() || null;
  if (data.complemento !== undefined) patch.complemento = data.complemento.trim() || null;
  if (data.comercialPrincipal !== undefined)
    patch.comercial_principal = data.comercialPrincipal.trim() || null;
  if (data.preposto !== undefined) patch.preposto = data.preposto.trim() || null;

  const { data: updated, error } = await db
    .from('codigos_cliente')
    .update(patch)
    .eq('id', codigoId)
    .eq('credor_id', credorId)
    .select(CODIGO_SELECT)
    .single();

  if (error) throw error;

  const row = updated as CodigoRow;

  if (
    row.papel === 'matriz' &&
    row.cod_cliente === credor.cod_cliente_principal &&
    row.rotulo === 'ABE_WEB'
  ) {
    await db
      .from('credores')
      .update({
        razao_social: row.razao_social ?? undefined,
        nome_fantasia: row.nome_fantasia,
        cnpj: row.cnpj,
        telefone: row.telefone,
        email_comercial: row.email_comercial,
        cep: row.cep,
        cidade: row.cidade,
        estado: row.estado,
        bairro: row.bairro,
        endereco: row.endereco,
        numero: row.numero,
        complemento: row.complemento,
        comercial_principal: row.comercial_principal,
        preposto_web: row.preposto,
      })
      .eq('id', credorId);
  }

  if (
    row.papel === 'matriz' &&
    row.cod_cliente === credor.abe_delphi_cliente_id &&
    row.rotulo === 'ABE_DELPHI'
  ) {
    await db
      .from('credores')
      .update({
        preposto_delphi: row.preposto,
      })
      .eq('id', credorId);
  }

  return toPublic(row);
}
