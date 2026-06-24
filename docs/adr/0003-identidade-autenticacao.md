# ADR-0003 — Provedor de identidade e autenticação

Status: Proposto
Data: 2026-06-18

## Contexto
O portal é acessado por usuários externos (credores), com múltiplos papéis e MFA obrigatório para
admins. Precisamos de autenticação robusta (OIDC/OAuth2), gestão de usuários por tenant e MFA, sem
reinventar segurança de identidade.

## Decisão
Usar um provedor de identidade gerenciado baseado em **OIDC/OAuth2**. Recomendação inicial:
**Amazon Cognito** (integra com a stack AWS, gerenciado, suporta MFA e federação). **Keycloak**
(auto-hospedado) fica como alternativa caso seja necessário maior controle/customização ou evitar
lock-in.

> Decisão final entre Cognito e Keycloak fica pendente de confirmação (ver doc 09, seção 9.5).

## Consequências
**Positivas**
- Não implementamos criptografia de senha/fluxo OIDC do zero (menos risco).
- MFA, rotação de tokens e federação prontos.

**Negativas**
- Cognito: algum lock-in AWS e limitações de customização de telas/fluxos.
- Keycloak: exige operar/hospedar e manter atualizado (mais esforço de infra).

## Alternativas consideradas
- **Auth0:** excelente DX, custo cresce com usuários; lock-in de fornecedor.
- **Autenticação própria:** maior risco de segurança e manutenção. Rejeitada.
