# =========================================
# Stage 1: Base - Setup comum
# =========================================
FROM node:24.11.0-slim AS base

# Instala pnpm globalmente
RUN npm install -g pnpm@latest

# Define diretório de trabalho
WORKDIR /app

# Copia arquivos de dependências
COPY package.json pnpm-lock.yaml ./

# =========================================
# Stage 2: Development - Desenvolvimento com hot-reload
# =========================================
FROM base AS development

# Copia código fonte
COPY . .

# Instala todas as dependências
RUN pnpm install --frozen-lockfile

# Expõe portas
EXPOSE 3333 9090

# Comando de desenvolvimento
CMD ["pnpm", "dev"]

# =========================================
# Stage 3: Production - Produção otimizada
# =========================================
FROM base AS production

# Copia código fonte
COPY . .

# Instala TODAS as dependências (incluindo dev para build)
RUN pnpm install --frozen-lockfile

# Compila TypeScript
RUN pnpm build

# Remove node_modules completo
RUN rm -rf node_modules

# Reinstala APENAS dependências de produção
RUN pnpm install --frozen-lockfile --prod

# Remove arquivos desnecessários
RUN rm -rf src tsconfig.json eslint.config.mjs .prettierrc

# Cria diretórios necessários
RUN mkdir -p logs uploads

# Expõe portas
EXPOSE 3333 9090

# Variáveis de ambiente de produção
ENV NODE_ENV=production

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3333/', (res) => { process.exit(res.statusCode === 200 ? 0 : 1); });"

# Comando de produção
CMD ["pnpm", "start"]
