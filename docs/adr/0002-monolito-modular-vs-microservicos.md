# ADR-0002 — Monólito modular vs. microserviços

Status: Proposto
Data: 2026-06-18

## Contexto
Precisamos decidir o estilo de decomposição do backend. O time é enxuto no início e o produto ainda
está validando mercado, mas há integrações que têm ciclos de falha independentes (4 fontes externas).

## Decisão
Adotar um **monólito modular** para a API principal (módulos bem separados: auth, carteira,
devedores, financeiro, admin, auditoria) **+ workers de integração separados** (um por fonte),
comunicando-se por filas (SQS).

## Consequências
**Positivas**
- Velocidade de desenvolvimento e deploy simples no início.
- Módulos bem definidos permitem **extrair microserviços depois** sem reescrever tudo.
- Workers separados dão **isolamento de falha** das integrações (bulkhead) sem complexidade de microserviços completos.

**Negativas**
- Um deploy maior para a API (mitigado por CI/CD e testes).
- Disciplina necessária para não acoplar módulos indevidamente (reforçado em code review).

## Alternativas consideradas
- **Microserviços desde o início:** flexibilidade e escala independentes, mas custo operacional alto
  (observabilidade distribuída, orquestração) — prematuro para a fase atual.
- **Monólito tradicional (tudo junto, inclusive integrações no mesmo processo):** simples, porém uma
  fonte lenta/instável afetaria a API inteira. Rejeitado.
