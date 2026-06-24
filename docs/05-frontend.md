# 05 — Frontend

## 5.1 Stack recomendada

| Item | Escolha | Por quê |
|------|---------|---------|
| Framework | **Next.js (App Router) + TypeScript** | SSR/SSG, ótima performance e SEO da landing, boas práticas de segurança |
| UI | **Tailwind CSS + shadcn/ui** | Design system consistente e moderno, acessível |
| Estado servidor | **TanStack Query** | Cache, revalidação, estados de loading/erro padronizados |
| Estado cliente | **Zustand** (leve) | Estado de UI simples sem boilerplate |
| Gráficos | **Recharts** ou **visx** | Funil/barras da régua, séries dos KPIs |
| Formulários | **React Hook Form + Zod** | Validação client compartilhada com o backend |
| Tabelas | **TanStack Table** | Listagens grandes, ordenação, paginação por cursor |
| i18n | **next-intl** | pt-BR agora; pronto para expandir |
| Testes | **Vitest + Testing Library + Playwright** | Unit + e2e |

## 5.2 Estrutura

```text
apps/web/
  app/
    (auth)/login/
    (dashboard)/
      page.tsx                 # cockpit (KPIs + régua + listagem)
      devedores/
        page.tsx               # busca unificada
        [id]/page.tsx          # linha do tempo do devedor (modal/rota)
      financeiro/
        page.tsx               # extrato consolidado
      relatorios/
        page.tsx
      admin/
        usuarios/
        gestao-fluxo/          # transferir/pausar (restrito)
    layout.tsx
  components/
    kpi-card/
    regua-funil/
    listagem-devedores/
    seletor-empresa/           # multi-CNPJ
    timeline-devedor/
  lib/
    api-client.ts              # cliente tipado (consome OpenAPI)
    auth.ts
  styles/
```

## 5.3 Telas do MVP (baseadas no documento original)

### Cockpit (Home)
- **Barra superior:** seletor multi-CNPJ ("Todos os CNPJs" ou específico) + filtro por período.
- **Cards de KPI:** Total em Cobrança, Recuperação do Mês, Taxa de Sucesso, Roll Rate, Pagamentos (24h).
- **Régua visual (funil/barras):** distribuição por fase (Preventivo/Avantpay, Ativa/ABEWeb,
  Acordo/Acordo Seguro). Clicar numa fase **filtra** a listagem abaixo.
- **Listagem consolidada:** Devedor, Documento (mascarado), Valor, Fase, Sistema de origem, Última
  interação, Ação. Para admin, botão **Transferir**.
- **Indicador de frescor:** "atualizado há X min" por fonte (transparência sobre defasagem).

### Busca unificada + Linha do tempo
- Campo de busca por CPF/CNPJ/nome → resultado das 4 fontes.
- Ao abrir um devedor: **timeline** com eventos (ex.: "10/03 mensagem enviada — Avantpay",
  "15/03 transferido p/ cobrança humana — ABEWeb", "16/03 promessa de pagamento").

### Financeiro
- Extrato de conta corrente consolidado; recebimentos por fonte; total a receber hoje.

### Admin — Gestão de Fluxo (restrito)
- Seleção de títulos elegíveis (ex.: > 11 dias no Avantpay) → **Transferir** (confirmação dupla).
- Feedback claro do processamento assíncrono (em processamento / concluído / falhou).

## 5.4 UX e acessibilidade

- Layout responsivo (desktop primeiro, mas usável em tablet).
- Estados explícitos: loading (skeleton), vazio, erro (com ação de retry), defasado.
- Acessibilidade: contraste, navegação por teclado, ARIA nos componentes (shadcn já ajuda).
- Ações destrutivas/críticas com **confirmação** e resumo do impacto.
- Mascaramento de documento por padrão; revelar somente com permissão e registrando auditoria.

## 5.5 Segurança no frontend

- **Tokens:** preferir cookies `HttpOnly` + `Secure` + `SameSite=Strict` (mitiga XSS roubando token).
  Evitar guardar token em `localStorage`.
- **CSP (Content-Security-Policy)** estrita; sem `unsafe-inline` onde possível.
- Sanitização de qualquer HTML dinâmico; nunca `dangerouslySetInnerHTML` sem sanitizar.
- Proteção CSRF para chamadas que usam cookie (token anti-CSRF).
- Nenhum segredo no bundle do cliente; somente variáveis públicas (`NEXT_PUBLIC_*`).
- O frontend **não** decide permissão — apenas reflete; a autorização real é sempre no backend.

## 5.6 Performance

- Code splitting por rota (App Router já faz).
- Dados via TanStack Query com cache e revalidação; paginação por cursor.
- Gráficos só carregam dados agregados (views materializadas), não dados brutos.
- Imagens/ícones otimizados; lazy loading onde fizer sentido.

## 5.7 Cliente de API tipado

- Gerar cliente a partir do **OpenAPI** do backend → tipos sempre sincronizados (sem "drift" de contrato).
- Tratamento central de erros (`problem+json`) com toast/feedback e correlação por `traceId`.
