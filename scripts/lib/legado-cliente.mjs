/**
 * Leitura e merge de matrizes Cliente — ABE WEB + ABE Delphi.
 */

import sql from 'mssql';

export function normalizeCnpj(raw) {
  const digits = String(raw ?? '').replace(/\D/g, '');
  return digits.length === 14 ? digits : null;
}

export function pickFirst(...values) {
  for (const value of values) {
    const text = String(value ?? '').trim();
    if (text) return text;
  }
  return null;
}

function requireEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Variável ${name} não definida no .env`);
  return value;
}

export function abeWebConfig() {
  return {
    server: requireEnv('ABEWEB_DB_HOST'),
    port: Number(process.env.ABEWEB_DB_PORT ?? 1433),
    database: requireEnv('ABEWEB_DB_NAME'),
    user: requireEnv('ABEWEB_DB_USER'),
    password: requireEnv('ABEWEB_DB_PASSWORD'),
    options: {
      encrypt: true,
      trustServerCertificate: process.env.ABEWEB_DB_TRUST_CERT !== '0',
    },
    requestTimeout: 120_000,
  };
}

export function abeDelphiConfig() {
  const trustCert = process.env.ABEDELPHI_DB_TRUST_CERT !== '0';
  const encrypt = process.env.ABEDELPHI_DB_ENCRYPT === '1';

  return {
    server: requireEnv('ABEDELPHI_DB_HOST'),
    port: Number(process.env.ABEDELPHI_DB_PORT ?? 1433),
    database: requireEnv('ABEDELPHI_DB_NAME'),
    user: requireEnv('ABEDELPHI_DB_USER'),
    password: requireEnv('ABEDELPHI_DB_PASSWORD'),
    options: {
      encrypt,
      trustServerCertificate: trustCert,
      enableArithAbort: true,
    },
    connectionTimeout: Number(process.env.ABEDELPHI_CONNECTION_TIMEOUT_MS ?? 15_000),
    requestTimeout: Number(process.env.ABEDELPHI_REQUEST_TIMEOUT_MS ?? 120_000),
  };
}

export async function fetchAbeWebMatrizes(pool) {
  const matrizes = await pool.request().query(`
    SELECT
      c.idCliente,
      c.idClientePrincipal,
      c.nome,
      c.nomeFantasia,
      c.cnpjCpf,
      c.statusCliente,
      c.dataCadastramento,
      e.endereco,
      e.numero,
      e.complemento,
      e.bairro,
      e.cidade,
      e.cep,
      e.idEstado AS uf
    FROM Cliente c WITH (NOLOCK)
    LEFT JOIN Endereco e ON e.idEndereco = c.idEndereco
    WHERE c.idCliente = c.idClientePrincipal
      AND c.statusCliente = 'A'
      AND c.cnpjCpf IS NOT NULL
  `);

  let emailsByCliente = new Map();
  let phonesByCliente = new Map();

  try {
    const emails = await pool.request().query(`
      SELECT idCliente, email
      FROM ClienteEmail WITH (NOLOCK)
      WHERE email IS NOT NULL AND LTRIM(RTRIM(email)) <> ''
    `);
    for (const row of emails.recordset) {
      const key = String(row.idCliente);
      if (!emailsByCliente.has(key)) emailsByCliente.set(key, row.email.trim());
    }
  } catch {
    /* ClienteEmail opcional */
  }

  try {
    const phones = await pool.request().query(`
      SELECT idCliente, telefone
      FROM ClienteTelefone WITH (NOLOCK)
      WHERE telefone IS NOT NULL AND LTRIM(RTRIM(telefone)) <> ''
    `);
    for (const row of phones.recordset) {
      const key = String(row.idCliente);
      if (!phonesByCliente.has(key)) phonesByCliente.set(key, row.telefone.trim());
    }
  } catch {
    /* ClienteTelefone opcional */
  }

  const filiais = await pool.request().query(`
    SELECT idCliente, idClientePrincipal
    FROM Cliente WITH (NOLOCK)
    WHERE statusCliente = 'A'
  `);

  const codigosByPrincipal = groupCodigos(
    filiais.recordset,
    'idClientePrincipal',
    'idCliente',
  );

  return matrizes.recordset
    .map((row) => {
      const cnpj = normalizeCnpj(row.cnpjCpf);
      if (!cnpj) return null;

      const principal = String(row.idClientePrincipal);
      return {
        fonte: 'ABE_WEB',
        cnpj,
        idCliente: String(row.idCliente),
        idClientePrincipal: principal,
        nome: row.nome?.trim() || null,
        nomeFantasia: row.nomeFantasia?.trim() || null,
        email: emailsByCliente.get(String(row.idCliente)) ?? null,
        telefone: phonesByCliente.get(String(row.idCliente)) ?? null,
        endereco: row.endereco?.trim() || null,
        numero: row.numero != null ? String(row.numero) : null,
        complemento: row.complemento?.trim() || null,
        bairro: row.bairro?.trim() || null,
        cidade: row.cidade?.trim() || null,
        cep: row.cep?.replace(/\D/g, '') || null,
        uf: row.uf?.trim()?.toUpperCase()?.slice(0, 2) || null,
        codigos: codigosByPrincipal.get(principal) ?? [principal],
      };
    })
    .filter(Boolean);
}

export async function fetchAbeDelphiMatrizes(pool) {
  const colRows = await pool.request().query(`
    SELECT COLUMN_NAME
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME = 'Cliente'
  `);
  const cols = new Set(colRows.recordset.map((c) => c.COLUMN_NAME));

  if (!cols.has('CodCliente') || !cols.has('CodPrincipal')) {
    throw new Error(
      'Tabela Cliente do ABE Delphi não encontrada (CodCliente/CodPrincipal ausentes). Verifique ABEDELPHI_DB_*.',
    );
  }

  const telefoneExpr = cols.has('Telefone1')
    ? 'Telefone1'
    : cols.has('Telefone')
      ? 'Telefone'
      : 'NULL';

  const matrizes = await pool.request().query(`
    SELECT
      CodCliente,
      CodPrincipal,
      Nome,
      NomeFantasia,
      CGC,
      Status,
      Endereco,
      Bairro,
      Cidade,
      Cep,
      Sigla AS uf,
      email,
      ${telefoneExpr} AS telefone
    FROM Cliente WITH (NOLOCK)
    WHERE CodCliente = CodPrincipal
      AND Status = 'A'
      AND CGC IS NOT NULL
  `);

  const filiais = await pool.request().query(`
    SELECT CodCliente, CodPrincipal
    FROM Cliente WITH (NOLOCK)
    WHERE Status = 'A'
  `);

  const codigosByPrincipal = groupCodigos(
    filiais.recordset,
    'CodPrincipal',
    'CodCliente',
  );

  return matrizes.recordset
    .map((row) => {
      const cnpj = normalizeCnpj(row.CGC);
      if (!cnpj) return null;

      const principal = String(row.CodPrincipal);
      return {
        fonte: 'ABE_DELPHI',
        cnpj,
        codCliente: String(row.CodCliente),
        codPrincipal: principal,
        nome: row.Nome?.trim() || null,
        nomeFantasia: row.NomeFantasia?.trim() || null,
        email: row.email?.trim() || null,
        telefone: row.telefone?.replace(/\D/g, '') || null,
        endereco: row.Endereco?.trim() || null,
        numero: null,
        complemento: null,
        bairro: row.Bairro?.trim() || null,
        cidade: row.Cidade?.trim() || null,
        cep: row.Cep?.replace(/\D/g, '') || null,
        uf: row.uf?.trim()?.toUpperCase()?.slice(0, 2) || null,
        codigos: codigosByPrincipal.get(principal) ?? [principal],
      };
    })
    .filter(Boolean);
}

function groupCodigos(rows, principalKey, codigoKey) {
  const map = new Map();
  for (const row of rows) {
    const principal = String(row[principalKey]);
    const codigo = String(row[codigoKey]);
    if (!map.has(principal)) map.set(principal, new Set());
    map.get(principal).add(codigo);
  }
  for (const [key, set] of map) {
    map.set(key, [...set].sort((a, b) => Number(a) - Number(b)));
  }
  return map;
}

export function mergeLegadoClientes(webRows, delphiRows) {
  const byCnpj = new Map();

  for (const web of webRows) {
    byCnpj.set(web.cnpj, { web, delphi: null });
  }

  for (const delphi of delphiRows) {
    const existing = byCnpj.get(delphi.cnpj);
    if (existing) existing.delphi = delphi;
    else byCnpj.set(delphi.cnpj, { web: null, delphi });
  }

  const merged = [];

  for (const [cnpj, { web, delphi }] of byCnpj) {
    const codigosWeb = web?.codigos ?? [];
    const codigosDelphi = delphi?.codigos ?? [];

    merged.push({
      cnpj,
      razao_social: pickFirst(web?.nome, delphi?.nome) ?? `Credor ${cnpj}`,
      nome_fantasia: pickFirst(web?.nomeFantasia, delphi?.nomeFantasia, web?.nome, delphi?.nome),
      telefone: pickFirst(web?.telefone, delphi?.telefone),
      email_comercial: pickFirst(web?.email, delphi?.email)?.toLowerCase() ?? null,
      cep: pickFirst(web?.cep, delphi?.cep),
      cidade: pickFirst(web?.cidade, delphi?.cidade),
      estado: pickFirst(web?.uf, delphi?.uf),
      bairro: pickFirst(web?.bairro, delphi?.bairro),
      endereco: pickFirst(web?.endereco, delphi?.endereco),
      numero: pickFirst(web?.numero),
      complemento: pickFirst(web?.complemento),
      cod_cliente_principal: web ? web.idClientePrincipal : null,
      abe_cliente_id: web ? web.idClientePrincipal : null,
      abe_delphi_cliente_id: delphi ? delphi.codPrincipal : null,
      codigos_cliente: buildCodigosCliente(codigosWeb, codigosDelphi, web, delphi),
      fontes: [web && 'ABE_WEB', delphi && 'ABE_DELPHI'].filter(Boolean),
    });
  }

  merged.sort((a, b) => a.razao_social.localeCompare(b.razao_social, 'pt-BR'));
  return merged;
}

function buildCodigosCliente(codigosWeb, codigosDelphi, web, delphi) {
  const out = [];
  const seen = new Set();

  const principalWeb = web?.idClientePrincipal;
  const principalDelphi = delphi?.codPrincipal;

  for (const cod of codigosWeb) {
    if (cod === principalWeb) continue;
    const key = `W:${cod}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ cod_cliente: cod, rotulo: 'ABE_WEB' });
  }

  for (const cod of codigosDelphi) {
    if (cod === principalDelphi) continue;
    const key = `D:${cod}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ cod_cliente: cod, rotulo: 'ABE_DELPHI' });
  }

  return out;
}

export function mapCadastroLegado(row, sistema) {
  if (!row) return null;
  if (sistema === 'ABE_WEB') {
    const matriz = String(row.idCliente) === String(row.idClientePrincipal);
    return {
      cod_cliente: String(row.idCliente),
      rotulo: 'ABE_WEB',
      papel: matriz ? 'matriz' : 'filial',
      razao_social: row.nome?.trim() || null,
      nome_fantasia: row.nomeFantasia?.trim() || null,
      cnpj: normalizeCnpj(row.cnpjCpf),
      telefone: row.telefone?.replace(/\D/g, '') || null,
      email_comercial: row.email?.trim()?.toLowerCase() || null,
      cep: row.cep?.replace(/\D/g, '') || null,
      cidade: row.cidade?.trim() || null,
      estado: row.uf?.trim()?.toUpperCase()?.slice(0, 2) || null,
      bairro: row.bairro?.trim() || null,
      endereco: row.endereco?.trim() || null,
      numero: row.numero != null ? String(row.numero) : null,
      complemento: row.complemento?.trim() || null,
      comercial_principal: row.comercialPrincipal?.trim() || null,
      preposto: row.preposto?.trim() || null,
    };
  }

  const matriz = String(row.CodCliente) === String(row.CodPrincipal);
  return {
    cod_cliente: String(row.CodCliente),
    rotulo: 'ABE_DELPHI',
    papel: matriz ? 'matriz' : 'filial',
    razao_social: row.Nome?.trim() || null,
    nome_fantasia: row.NomeFantasia?.trim() || null,
    cnpj: normalizeCnpj(row.CGC),
    telefone: row.telefone?.replace(/\D/g, '') || null,
    email_comercial: row.email?.trim()?.toLowerCase() || null,
    cep: row.Cep?.replace(/\D/g, '') || null,
    cidade: row.Cidade?.trim() || null,
    estado: row.uf?.trim()?.toUpperCase()?.slice(0, 2) || null,
    bairro: row.Bairro?.trim() || null,
    endereco: row.Endereco?.trim() || null,
    numero: null,
    complemento: null,
    comercial_principal: row.comercialPrincipal?.trim() || null,
    preposto: row.Preposto?.trim() || null,
  };
}

export async function fetchAbeWebClientePorCodigo(pool, idCliente) {
  const id = Number(idCliente);
  if (!Number.isFinite(id)) return null;

  const result = await pool.request().input('id', sql.Int, id).query(`
    SELECT
      c.idCliente,
      c.idClientePrincipal,
      c.nome,
      c.nomeFantasia,
      c.cnpjCpf,
      c.preposto,
      c.idUsuarioPrincipal,
      u.nomeUsuario AS comercialPrincipal,
      e.endereco,
      e.numero,
      e.complemento,
      e.bairro,
      e.cidade,
      e.cep,
      e.idEstado AS uf
    FROM Cliente c WITH (NOLOCK)
    LEFT JOIN Endereco e ON e.idEndereco = c.idEndereco
    LEFT JOIN Usuario u ON u.idUsuario = c.idUsuarioPrincipal
    WHERE c.idCliente = @id
  `);

  const row = result.recordset[0];
  if (!row) return null;

  let email = null;
  let telefone = null;
  try {
    const extra = await pool.request().input('id', sql.Int, id).query(`
      SELECT TOP 1 email FROM ClienteEmail WITH (NOLOCK) WHERE idCliente = @id AND email IS NOT NULL
    `);
    email = extra.recordset[0]?.email?.trim() || null;
  } catch {
    /* optional */
  }
  try {
    const extra = await pool.request().input('id', sql.Int, id).query(`
      SELECT TOP 1 telefone FROM ClienteTelefone WITH (NOLOCK) WHERE idCliente = @id AND telefone IS NOT NULL
    `);
    telefone = extra.recordset[0]?.telefone?.trim() || null;
  } catch {
    /* optional */
  }

  return mapCadastroLegado({ ...row, email, telefone }, 'ABE_WEB');
}

export async function fetchAbeDelphiClientePorCodigo(pool, codCliente) {
  const id = Number(codCliente);
  if (!Number.isFinite(id)) return null;

  const colRows = await pool.request().query(`
    SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Cliente'
  `);
  const cols = new Set(colRows.recordset.map((c) => c.COLUMN_NAME));
  const telefoneExpr = cols.has('Telefone1')
    ? 'c.Telefone1'
    : cols.has('Telefone')
      ? 'c.Telefone'
      : 'NULL';

  const result = await pool
    .request()
    .input('cod', sql.Int, id)
    .query(`
    SELECT
      c.CodCliente,
      c.CodPrincipal,
      c.Nome,
      c.NomeFantasia,
      c.CGC,
      c.Preposto,
      c.CodUsuario,
      u.Nome AS comercialPrincipal,
      c.Endereco,
      c.Bairro,
      c.Cidade,
      c.Cep,
      c.Sigla AS uf,
      c.email,
      ${telefoneExpr} AS telefone
    FROM Cliente c WITH (NOLOCK)
    LEFT JOIN Usuario u ON u.CodUsuario = c.CodUsuario
    WHERE c.CodCliente = @cod
  `);

  return mapCadastroLegado(result.recordset[0], 'ABE_DELPHI');
}

export async function connectAbeWeb() {
  const pool = new sql.ConnectionPool(abeWebConfig());
  await pool.connect();
  return pool;
}

export async function connectAbeDelphi() {
  const pool = new sql.ConnectionPool(abeDelphiConfig());
  await pool.connect();
  return pool;
}
