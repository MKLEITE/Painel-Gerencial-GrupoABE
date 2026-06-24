# Imagens de fundo (`/public/backgrounds`)

Coloque aqui imagens usadas como **background** (hero da homepage, painel lateral
do login, capas). Acessíveis na web em `/backgrounds/...`.

## Arquivos sugeridos

| Arquivo | Onde aparece | Formato ideal |
|---------|--------------|----------------|
| `hero.webp` | Fundo da seção principal da homepage | WebP/JPG, ~2400px largura |
| `woman-background-login.png` | Painel lateral da tela de login (foto + overlay navy) | PNG/JPG, retrato ~1200×1600 |
| `login-side.webp` | Alternativa ao painel lateral do login | WebP/JPG, retrato 1200x1600 |
| `dashboard-cover.webp` | Faixa de boas-vindas do dashboard | WebP/JPG, panorâmica |
| `pattern.svg` | Textura/grade sutil sobreposta | SVG leve |

> Prefira **WebP** (bem mais leve que PNG/JPG). Mantenha cada imagem abaixo de
> ~300 KB para não pesar o carregamento. Imagens escuras funcionam melhor com
> texto branco por cima.

## Como usar no código

As telas hoje usam **gradientes e grade gerados por CSS** (não dependem de
imagem). Para aplicar uma imagem, adicione no elemento desejado:

```tsx
<div
  className="absolute inset-0 -z-10 bg-cover bg-center opacity-60"
  style={{ backgroundImage: "url('/backgrounds/hero.webp')" }}
/>
```

Pontos já preparados para receber imagem (procure pelo comentário
`{/* BG-SLOT */}` no código):

- `app/page.tsx` — hero da homepage
- `app/login/page.tsx` — painel lateral
- `app/dashboard/page.tsx` — faixa de boas-vindas
