# @abe/web — Frontend (Next.js)

Portal do Painel Gerencial Grupo ABE. Ver desenho completo em [`docs/05-frontend.md`](../../docs/05-frontend.md).

## Rodar localmente

```bash
cp .env.example .env.local
pnpm --filter @abe/web dev
```

Abre em `http://localhost:3000`.

## Estrutura

```text
app/                # rotas (App Router)
  layout.tsx
  page.tsx
  globals.css
components/          # componentes de UI (kpi-card, regua-funil, etc. — Fase 1)
lib/
  api-client.ts     # cliente HTTP tipado
```

## Boas práticas já aplicadas

- Headers de segurança (CSP, HSTS, X-Frame-Options...) em `next.config.mjs`.
- `poweredByHeader: false` (não expõe a stack).
- Token preferencialmente em cookie HttpOnly (não localStorage) — ver docs/05.
- Apenas variáveis `NEXT_PUBLIC_*` chegam ao navegador.
