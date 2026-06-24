# Logos dos sistemas de origem (`/public/sources`)

Logos das 4 fontes integradas pelo portal. Aparecem na homepage (seção "fontes
conectadas") e poderão aparecer nos cards do dashboard. Acessíveis em
`/sources/...`.

## Arquivos sugeridos

| Arquivo | Sistema |
|---------|---------|
| `avantpay.svg` | Avantpay (preventivo) |
| `abe-interno.svg` | ABE Interno (Delphi / SQL Server) |
| `abeweb.svg` | ABEWeb (cobrança ativa) |
| `acordo-seguro.svg` | Acordo Seguro (acordos) |

> Use SVG ou PNG transparente. Enquanto os arquivos não existirem, a homepage
> mostra automaticamente um selo com a inicial de cada sistema (fallback visual).

## Como usar

Em `app/page.tsx`, na lista `FONTES`, troque `logo: null` pelo caminho do arquivo:

```ts
{ nome: 'Avantpay', logo: '/sources/avantpay.svg', ... }
```
