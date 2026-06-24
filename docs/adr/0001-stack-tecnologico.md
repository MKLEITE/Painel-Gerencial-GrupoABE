# ADR-0001 — Stack tecnológico (linguagem/frameworks)

Status: Proposto
Data: 2026-06-18

## Contexto
O documento original sugere Java ou Node.js no backend e um frontend moderno. Precisamos de uma stack
que dê velocidade, segurança, tipagem forte e que o time consiga manter. O sistema é um SaaS
multi-tenant com integrações, dashboard e ações financeiras críticas.

## Decisão
- **Backend:** TypeScript com **NestJS**.
- **Frontend:** TypeScript com **Next.js** (App Router), Tailwind + shadcn/ui.
- **ORM:** Prisma. **Banco:** PostgreSQL (RDS).
- **Monorepo** (pnpm workspaces + Turborepo) para compartilhar tipos/contratos.

## Consequências
**Positivas**
- Um só idioma (TS) entre front, back e workers → menos atrito, tipos compartilhados.
- NestJS traz estrutura modular, DI, guards/interceptors (ótimo para auth e auditoria).
- Ecossistema maduro, contratação mais fácil.

**Negativas**
- Node é single-thread por processo; cargas de CPU pesadas exigem workers/escala horizontal (já previsto).
- Se o time tiver forte expertise em Java, há curva para padrões NestJS.

## Alternativas consideradas
- **Java + Spring Boot:** excelente para domínio financeiro robusto e times Java; mais verboso e com
  build/infra mais pesados. **Permanece como alternativa válida** caso a equipe seja majoritariamente Java.
- **Python/Django:** bom DX, porém menos alinhado ao compartilhamento de tipos com o frontend.
