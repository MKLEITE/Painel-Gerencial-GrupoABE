# syntax=docker/dockerfile:1
# Imagem multi-stage para o backend (NestJS). Usuário não-root, imagem enxuta.

FROM node:22-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
WORKDIR /repo

FROM base AS build
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @abe/api build

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
# Usuário não-root (boa prática de segurança)
USER node
COPY --from=build --chown=node:node /repo/apps/api/dist ./dist
COPY --from=build --chown=node:node /repo/node_modules ./node_modules
EXPOSE 3333
CMD ["node", "dist/main.js"]
