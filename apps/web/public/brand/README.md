# Logos da marca (`/public/brand`)

Coloque aqui os logotipos do **Grupo ABE** e da **MK Solutions**.
Tudo nesta pasta fica acessível pela web na raiz `/brand/...`.

## Arquivos sugeridos

| Arquivo | Uso | Formato ideal |
|---------|-----|----------------|
| `GRUPOABE.png` | **Logo principal em uso** (header, login, dashboard, footer) | PNG |
| `logo-grupo-abe.svg` | Alternativa vetorial | SVG (ou PNG transparente) |
| `logo-grupo-abe-dark.svg` | Versão para o modo escuro (claro/branco) | SVG/PNG |
| `logo-mk-solutions.svg` | Assinatura "desenvolvido por" no rodapé | SVG/PNG |
| `favicon.ico` | Ícone da aba do navegador | ICO 32x32 / 48x48 |
| `icon.png` | Ícone PWA / atalho | PNG 512x512 |
| `og-image.png` | Imagem de compartilhamento (link em redes) | PNG 1200x630 |

> Dica: SVG é o ideal (escala sem perder qualidade). Se só tiver PNG, use fundo
> transparente e pelo menos 2x o tamanho exibido (telas retina).

## Como usar no código

O componente atual desenha um logo vetorial provisório em
`apps/web/components/brand/logo.tsx`. Para usar o arquivo oficial, troque o
bloco `<svg>` por:

```tsx
<img src="/brand/logo-grupo-abe.svg" alt="Grupo ABE" className="h-9 w-auto" />
```

Para alternar logo por tema (claro/escuro):

```tsx
<img src="/brand/logo-grupo-abe.svg" className="h-9 w-auto dark:hidden" alt="Grupo ABE" />
<img src="/brand/logo-grupo-abe-dark.svg" className="hidden h-9 w-auto dark:block" alt="Grupo ABE" />
```
