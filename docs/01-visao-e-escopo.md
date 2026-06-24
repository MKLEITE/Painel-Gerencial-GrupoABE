# 01 — Visão, Escopo e Glossário

## 1.1 Problema

A operação de cobrança do Grupo ABE está fragmentada em **quatro sistemas**, cada um cuidando de
uma fase da régua. O cliente credor precisa entrar em vários sites para entender a situação de um
devedor e da carteira. Isso gera retrabalho, falta de visão consolidada e dificuldade de prestação
de contas.

## 1.2 Visão do produto

> Um **portal único, seguro e multiempresa** onde o credor faz um login e enxerga **toda a régua de
> cobrança consolidada** (preventivo → ativa → acordo → baixa), pesquisa qualquer devedor por
> CPF/CNPJ em todos os sistemas ao mesmo tempo, acompanha o financeiro e — em área administrativa
> restrita — aciona transferências entre sistemas com segurança e rastreabilidade.

## 1.3 Objetivos (mensuráveis)

| Objetivo | Indicador de sucesso |
|----------|----------------------|
| Visão 360º do devedor | Buscar 1 CPF e ver histórico das 4 fontes em < 2s |
| Consolidação da carteira | KPIs (total em cobrança, recuperado, roll rate) corretos por CNPJ |
| Operação segura | 0 vazamentos; isolamento total entre tenants; conformidade LGPD |
| Ação administrativa confiável | Transferência Avantpay→ABEWeb sem cobrança duplicada (idempotente) |
| Não impactar o legado | Portal nunca consulta o SQL 2005 em tempo real |
| Produto vendável | Onboarding de um novo credor sem alteração de código |

## 1.4 Escopo

### Dentro do escopo (produto-alvo)
- Portal web responsivo para credores (multi-CNPJ).
- Dashboard com KPIs, régua visual (funil) e listagem consolidada.
- Busca unificada por CPF/CNPJ/nome com linha do tempo do devedor.
- Módulo financeiro (extrato consolidado, recebimentos).
- Área administrativa: transferência de títulos e pausa de cobrança automática.
- Camada de integração (middleware) com as 4 fontes.
- Sincronização/ETL para banco moderno (somente leitura para o portal).
- Autenticação, autorização (RBAC), auditoria e conformidade LGPD.

### Fora do escopo (por enquanto)
- Substituir os sistemas de origem (eles continuam sendo a fonte da verdade operacional).
- Disparo de cobrança/mensageria pelo portal (isso é dos sistemas de origem).
- App mobile nativo (o portal será responsivo; app fica para fase futura).
- BI avançado / data lake analítico (fase futura; começamos com views materializadas).

## 1.5 Personas e papéis

| Persona | Quem é | O que faz no portal |
|---------|--------|---------------------|
| **Super Admin (MK Solutions)** | Equipe que opera a plataforma | Cria tenants, monitora saúde, suporte. Não vê dado de negócio sem necessidade. |
| **Admin do Credor** | Gestor do cliente credor | Vê tudo do seu tenant, gerencia usuários, executa ações administrativas (transferir/pausar). |
| **Operador do Credor** | Analista de cobrança do cliente | Consulta carteira, busca devedor, gera relatórios. Sem ações administrativas. |
| **Visualizador** | Sócio/auditor do cliente | Apenas leitura de dashboards e relatórios. |

> Cada papel é um nível de **RBAC** (ver doc 06). Todo acesso é sempre **dentro do tenant** do usuário.

## 1.6 Sistemas de origem (fontes de dados)

| Sistema | Fase da régua | Forma de integração provável | Observações |
|---------|---------------|------------------------------|-------------|
| **Avantpay** | Preventivo / atraso curto (< 10 dias) | API REST e/ou arquivo | WhatsApp, lembretes, boletos. Origem da ação "pausar". |
| **ABE Interno (Delphi + SQL Server 2005)** | Cobrança ativa / jurídico | **Agente on-premise → réplica** (nunca direto) | Sistema legado, fim de vida. Cuidado com performance. |
| **ABEWeb** | Cobrança ativa | API REST / banco | Destino da ação "transferir". |
| **Acordo Seguro** | Acordos automáticos | **Webhooks** + API | Assinaturas digitais, parcelas, quebras de acordo. |

> ⚠️ **Premissa a validar:** disponibilidade e documentação das APIs de Avantpay, ABEWeb e Acordo
> Seguro, e a forma de acesso seguro ao SQL Server 2005. Isso é pré-requisito da Fase 1.

## 1.7 Requisitos não-funcionais (NFRs)

| Categoria | Requisito |
|-----------|-----------|
| **Segurança** | OWASP ASVS nível 2; criptografia em trânsito e repouso; MFA para admin; WAF. |
| **Privacidade** | Conformidade LGPD; minimização; mascaramento de CPF/CNPJ na UI; trilha de auditoria. |
| **Disponibilidade** | Alvo 99,5% no MVP, evoluindo para 99,9%. Multi-AZ. |
| **Desempenho** | Dashboard < 2s; busca < 2s; listagens paginadas. |
| **Isolamento** | Multi-tenant com isolamento garantido em app + banco (RLS). |
| **Resiliência** | Falha de uma fonte não derruba o portal; dados defasados sinalizados. |
| **Auditabilidade** | Toda ação sensível registrada (quem, o quê, quando, de onde). |
| **Escalabilidade** | Crescer por tenant/CNPJ sem reescrever; escalar horizontalmente. |
| **Observabilidade** | Logs estruturados, métricas e tracing distribuído. |

## 1.8 Glossário

| Termo | Significado |
|-------|-------------|
| **Tenant** | Um cliente credor isolado dos demais. Pode ter vários CNPJs. |
| **Credor** | Cliente que contrata o Grupo ABE para cobrar. Usuário externo do portal. |
| **Devedor** | Pessoa/empresa que deve. Seus dados (CPF/CNPJ) são dados pessoais sob LGPD. |
| **Título** | Uma dívida/cobrança específica. |
| **Régua de cobrança** | Sequência de fases (preventivo → ativa → acordo → baixa). |
| **Roll rate** | % de títulos que "rolam" de uma fase para a próxima (ex.: preventivo → ativa). |
| **Middleware / Camada de integração** | Serviço que conversa com as 4 fontes e padroniza os dados. |
| **Modelo canônico** | Formato único e padronizado de dados, independente da origem. |
| **ETL / Sincronização** | Processo que extrai dos sistemas, transforma e carrega na réplica do portal. |
| **Réplica de leitura** | Banco moderno (PostgreSQL) que o portal consulta, alimentado pela sincronização. |
| **Visão 360º** | Consolidação de tudo sobre um devedor/carteira, vindo das 4 fontes. |
| **RBAC** | Role-Based Access Control — permissões por papel. |
| **RLS** | Row-Level Security — isolamento por linha no banco (por tenant). |
| **Idempotência** | Repetir a mesma operação não causa efeito duplicado. |
| **ADR** | Architecture Decision Record — registro de uma decisão técnica. |
| **LGPD** | Lei Geral de Proteção de Dados (Lei 13.709/2018). |
