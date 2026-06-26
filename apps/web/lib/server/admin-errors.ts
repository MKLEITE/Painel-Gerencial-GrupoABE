export class AdminError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'AdminError';
  }
}

export function mapDbError(err: unknown): never {
  if (err instanceof AdminError) throw err;
  const code = (err as { code?: string })?.code;
  if (code === '23505') throw new AdminError('CNPJ ou e-mail já cadastrado.', 409);
  throw err;
}
