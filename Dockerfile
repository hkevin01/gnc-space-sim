# Frontend dev image
FROM node:22-bullseye
WORKDIR /workspace
COPY package.json pnpm-workspace.yaml ./
RUN corepack enable && corepack prepare pnpm@9.12.0 --activate
COPY . .
RUN pnpm install --frozen-lockfile=false
CMD ["pnpm","dev"]
