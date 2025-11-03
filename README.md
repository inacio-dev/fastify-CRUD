# Fastify CRUD - Backend Completo

Backend moderno e robusto construído com **Fastify** e **TypeScript**, com sistema completo de plugins, segurança, monitoramento e suporte a Docker.

## 📋 Índice

- [Características](#-características)
- [Stack Tecnológica](#-stack-tecnológica)
- [Requisitos](#-requisitos)
- [Instalação](#-instalação)
- [Configuração](#-configuração)
- [Uso](#-uso)
- [Docker](#-docker)
- [Estrutura do Projeto](#-estrutura-do-projeto)
- [API Endpoints](#-api-endpoints)
- [Plugins](#-plugins)
- [Monitoramento](#-monitoramento)
- [CI/CD](#-cicd)
- [Scripts Disponíveis](#-scripts-disponíveis)

## 🚀 Características

### Segurança

- ✅ **Helmet**: Proteção com headers de segurança (CSP, HSTS, X-Frame-Options)
- ✅ **CSRF Protection**: Proteção contra ataques Cross-Site Request Forgery
- ✅ **Rate Limiting**: Proteção contra DDoS e brute force
- ✅ **Secure Sessions**: Sessões criptografadas stateless
- ✅ **CORS**: Configuração flexível de origens permitidas
- ✅ **HTTPS Redirect**: Redirecionamento automático de HTTP para HTTPS

### Performance

- ✅ **Cache Distribuído**: Sistema de cache com Redis (HIT/MISS tracking, TTL, invalidação por tags)
- ✅ **Compressão**: Brotli, gzip e deflate automáticos
- ✅ **ETag**: Cache HTTP com validação de conteúdo
- ✅ **Connection Pooling**: Pools otimizados para PostgreSQL
- ✅ **Circuit Breaker**: Proteção contra falhas em cascata

### Monitoramento

- ✅ **Prometheus Metrics**: Métricas HTTP e de sistema
- ✅ **Under Pressure**: Monitoramento de saúde (event loop, heap, RSS)
- ✅ **Logs Estruturados**: Pino com rotação diária e formato JSON
- ✅ **Health Check**: Endpoint de verificação de saúde

### Dados e Armazenamento

- ✅ **PostgreSQL**: Banco de dados principal com Drizzle ORM
- ✅ **Redis**: Cache distribuído e sessões
- ✅ **Couchbase**: Logs de auditoria com histórico completo de alterações
- ✅ **ClamAV**: Antivírus para escaneamento de uploads

### Desenvolvimento

- ✅ **TypeScript**: Tipagem estrita e segura
- ✅ **Zod Validation**: Validação de schemas para rotas e variáveis de ambiente
- ✅ **Swagger UI**: Documentação interativa da API
- ✅ **Hot Reload**: Desenvolvimento com auto-reload via tsx
- ✅ **ESLint + Prettier**: Qualidade e formatação de código
- ✅ **GitHub Actions**: CI/CD automático (lint + build)

### Docker

- ✅ **Multi-stage Build**: Desenvolvimento e produção otimizados
- ✅ **Docker Compose**: Orquestração completa (core services + backend)
- ✅ **Health Checks**: Verificação automática de saúde dos containers

## 🛠 Stack Tecnológica

### Core

- **Runtime**: Node.js 24.11.0
- **Framework**: Fastify 5.2.2
- **Linguagem**: TypeScript 5.7.3
- **Package Manager**: pnpm

### Bancos de Dados

- **PostgreSQL**: Banco relacional principal
- **Redis**: Cache e sessões
- **Couchbase**: Auditoria e logs
- **Drizzle ORM**: Type-safe SQL query builder

### Segurança

- **@fastify/helmet**: Security headers
- **@fastify/csrf-protection**: CSRF tokens
- **@fastify/rate-limit**: Rate limiting
- **@fastify/secure-session**: Encrypted sessions
- **@fastify/cors**: CORS configuration

### Monitoramento

- **fastify-metrics**: Prometheus integration
- **@fastify/under-pressure**: Health monitoring
- **pino**: Structured logging
- **pino-roll**: Log rotation

### Validação

- **Zod**: Schema validation
- **fastify-type-provider-zod**: Type-safe routes

### Uploads

- **@fastify/multipart**: File uploads
- **clamscan**: Antivirus scanning

### Desenvolvimento

- **tsx**: TypeScript execution with hot reload
- **ESLint**: Code linting
- **Prettier**: Code formatting
- **@fastify/swagger**: API documentation

## 📦 Requisitos

### Desenvolvimento Local

- Node.js 24.11.0+
- pnpm (instalado automaticamente)
- PostgreSQL 16+
- Redis 7+
- Couchbase 7+
- ClamAV (opcional, pode ser desabilitado)

### Docker

- Docker 24+
- Docker Compose 2.20+

## 📥 Instalação

### Opção 1: Desenvolvimento Local

```bash
# Clone o repositório
git clone git@github.com:inacio-dev/fastify-CRUD.git
cd fastify-CRUD

# Instale as dependências
pnpm install

# Configure as variáveis de ambiente
cp .env.example .env
# Edite o arquivo .env com suas configurações
```

### Opção 2: Docker (Recomendado)

```bash
# Clone o repositório
git clone git@github.com:inacio-dev/fastify-CRUD.git
cd fastify-CRUD

# Configure as variáveis de ambiente
cp .env.example .env
# Edite o arquivo .env se necessário

# Suba os serviços de suporte (PostgreSQL, Redis, ClamAV, Couchbase)
docker compose -f docker/docker-compose.core.yml up -d

# Suba o backend em modo desenvolvimento
docker compose -f docker/docker-compose.dev.yml up
```

## ⚙️ Configuração

### Variáveis de Ambiente

Todas as variáveis de ambiente são validadas com **Zod** na inicialização. Consulte `.env.example` para ver todas as opções disponíveis.

#### Principais Variáveis

```bash
# Ambiente
NODE_ENV=development              # development | production | test
PORT=3333                         # Porta do servidor
HOST=0.0.0.0                      # Host (0.0.0.0 para Docker)

# Segurança
SESSION_SECRET=seu-secret-aqui    # 64 caracteres hex (obrigatório para CSRF)
RATE_LIMIT_MAX=1000              # Requisições por janela de tempo
RATE_LIMIT_TIME_WINDOW=1 minute  # Janela de tempo

# CORS
CORS_ORIGINS=http://localhost:3000,http://localhost:5173

# PostgreSQL
POSTGRES_HOST=localhost           # postgres (no Docker)
POSTGRES_PORT=5432
POSTGRES_USER=fastify
POSTGRES_PASSWORD=fastify_dev_password
POSTGRES_DB=fastify_db

# Redis
REDIS_ENABLED=true
REDIS_HOST=localhost              # redis (no Docker)
REDIS_PORT=6379

# Couchbase
COUCHBASE_ENABLED=true
COUCHBASE_URL=couchbase://localhost  # couchbase://couchbase (no Docker)
COUCHBASE_USER=Administrator
COUCHBASE_PASSWORD=password
COUCHBASE_BUCKET=audit_logs

# ClamAV
VIRUS_SCANNING_ENABLED=true
CLAMAV_HOST=localhost             # clamav (no Docker)
CLAMAV_PORT=3310

# Cache
CACHE_ENABLED=true
CACHE_TTL_DEFAULT=300             # 5 minutos
CACHE_MAX_SIZE=100

# Logs
LOG_LEVEL=debug                   # trace | debug | info | warn | error | fatal
LOGS_DIR=logs

# Monitoramento
METRICS_PORT=9090
METRICS_ENDPOINT=/metrics
```

### Gerar Session Secret

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## 🚀 Uso

### Desenvolvimento Local

```bash
# Modo desenvolvimento com hot-reload
pnpm dev

# Build de produção
pnpm build

# Executar versão compilada
pnpm start

# Executar lint
pnpm lint
```

Servidor disponível em:

- API: http://localhost:3333
- Swagger: http://localhost:3333/documentation
- Metrics: http://localhost:9090/metrics

### Desenvolvimento com Docker

```bash
# Iniciar serviços de suporte
docker compose -f docker/docker-compose.core.yml up -d

# Iniciar backend em desenvolvimento
docker compose -f docker/docker-compose.dev.yml up

# Ver logs
docker compose -f docker/docker-compose.dev.yml logs -f

# Parar serviços
docker compose -f docker/docker-compose.dev.yml down
docker compose -f docker/docker-compose.core.yml down
```

### Produção com Docker

```bash
# Iniciar serviços de suporte
docker compose -f docker/docker-compose.core.yml up -d

# Iniciar backend em produção
docker compose -f docker/docker-compose.prod.yml up -d

# Ver logs
docker compose -f docker/docker-compose.prod.yml logs -f

# Parar serviços
docker compose -f docker/docker-compose.prod.yml down
docker compose -f docker/docker-compose.core.yml down
```

## 🐳 Docker

### Arquitetura Docker

O projeto usa **multi-stage builds** e separação de serviços:

#### docker-compose.core.yml

Serviços de suporte (PostgreSQL, Redis, ClamAV, Couchbase):

- **postgres**: Banco de dados principal (porta 5432)
- **redis**: Cache e sessões (porta 6379)
- **clamav**: Antivírus (porta 3310)
- **couchbase**: Logs de auditoria (porta 8091 web UI)

#### docker-compose.dev.yml

Backend em modo desenvolvimento:

- Hot-reload com volumes montados
- Código fonte em `src/` sincronizado
- Node modules em volume anônimo

#### docker-compose.prod.yml

Backend em modo produção:

- Build otimizado (apenas prod dependencies)
- Health checks ativos
- Restart automático
- Logs em JSON para agregação

### Dockerfile Stages

1. **base**: Setup comum (Node.js + pnpm)
2. **development**: Código fonte + todas as dependências + hot-reload
3. **production**: Build TypeScript + apenas prod dependencies + otimizações

## 📁 Estrutura do Projeto

```
backend/
├── .github/
│   └── workflows/
│       └── ci.yml              # GitHub Actions workflow
├── docker/
│   ├── docker-compose.core.yml # Serviços de suporte
│   ├── docker-compose.dev.yml  # Backend desenvolvimento
│   ├── docker-compose.prod.yml # Backend produção
│   └── Dockerfile              # Multi-stage build
├── drizzle/
│   ├── migrations/             # Migrações SQL
│   └── schema.ts               # Schema do banco
├── logs/                       # Logs em produção (git-ignored)
├── uploads/                    # Uploads de arquivos (git-ignored)
├── src/
│   ├── config/
│   │   ├── env.ts             # Validação de variáveis (Zod)
│   │   └── logger.ts          # Configuração Pino
│   ├── db/
│   │   ├── connection.ts      # Conexão PostgreSQL
│   │   └── schema/            # Schemas Drizzle
│   ├── helpers/               # Funções auxiliares
│   ├── plugins/               # Plugins Fastify (auto-load)
│   │   ├── caching.ts         # Sistema de cache Redis
│   │   ├── circuit-breaker.ts # Proteção contra falhas
│   │   ├── clamav.ts          # Antivírus
│   │   ├── compress.ts        # Compressão de respostas
│   │   ├── cors.ts            # CORS
│   │   ├── couchbase.ts       # Auditoria
│   │   ├── csrf-protection.ts # CSRF
│   │   ├── drizzle.ts         # PostgreSQL ORM
│   │   ├── etag.ts            # Cache HTTP
│   │   ├── helmet.ts          # Segurança
│   │   ├── https-redirect.ts  # Redirect HTTP → HTTPS
│   │   ├── metrics.ts         # Prometheus
│   │   ├── multipart.ts       # Upload de arquivos
│   │   ├── rate-limit.ts      # Rate limiting
│   │   ├── redis.ts           # Redis client
│   │   ├── secure-session.ts  # Sessões seguras
│   │   ├── sensible.ts        # HTTP helpers
│   │   ├── swagger.ts         # Documentação
│   │   ├── under-pressure.ts  # Health monitoring
│   │   └── zod-validator.ts   # Validação de rotas
│   ├── routes/                # Rotas da API (auto-load)
│   │   ├── api/
│   │   │   ├── cache.ts       # Endpoints de cache
│   │   │   └── database.ts    # CRUD exemplo
│   │   └── index.ts           # Health check
│   ├── services/              # Serviços de negócio
│   └── index.ts               # Entry point
├── .dockerignore
├── .env                       # Variáveis de ambiente (git-ignored)
├── .env.example               # Template de variáveis
├── .gitignore
├── .nvmrc                     # Node version
├── .prettierrc                # Configuração Prettier
├── drizzle.config.ts          # Configuração Drizzle
├── eslint.config.mjs          # Configuração ESLint
├── package.json
├── pnpm-lock.yaml
├── pnpm-workspace.yaml
├── README.md
└── tsconfig.json              # Configuração TypeScript
```

## 🌐 API Endpoints

### Health Check

```http
GET /
```

Retorna status da API, versão, timestamp e endpoints disponíveis.

### Cache Endpoints

```http
GET /api/cache
POST /api/cache/invalidate
DELETE /api/cache/clear
```

**Headers de Cache:**

- `X-Cache-Status`: HIT | MISS
- `Age`: Tempo em cache (segundos)
- `Cache-Control`: max-age, public/private
- `ETag`: Hash do conteúdo

### Database CRUD

```http
GET    /api/database          # Listar todos
GET    /api/database/:id      # Buscar por ID
POST   /api/database          # Criar novo
PATCH  /api/database/:id      # Atualizar
DELETE /api/database/:id      # Deletar
```

Todos os endpoints têm:

- Validação com Zod
- Logs de auditoria no Couchbase
- Suporte a cache (quando aplicável)
- Documentação no Swagger

### Documentação Interativa

```http
GET /documentation
```

Swagger UI com documentação completa (apenas em desenvolvimento).

### Métricas

```http
GET /metrics  # Porta 9090
```

Métricas Prometheus (protegido por IP whitelist).

## 🔌 Plugins

### Segurança

- **helmet**: Headers de segurança (CSP condicional)
- **csrf-protection**: Tokens CSRF
- **rate-limit**: Limite de requisições
- **secure-session**: Sessões criptografadas
- **cors**: Controle de origens
- **https-redirect**: Redirect HTTP → HTTPS

### Performance

- **caching**: Cache distribuído com Redis
- **compress**: Brotli, gzip, deflate
- **etag**: Cache HTTP

### Dados

- **drizzle**: PostgreSQL ORM
- **redis**: Cliente Redis
- **couchbase**: Logs de auditoria
- **clamav**: Antivírus

### Validação

- **zod-validator**: Schemas Zod para rotas

### Monitoramento

- **metrics**: Prometheus
- **under-pressure**: Health monitoring

### Desenvolvimento

- **swagger**: Documentação OpenAPI
- **sensible**: HTTP helpers

### Outros

- **multipart**: Upload de arquivos
- **circuit-breaker**: Proteção contra falhas

## 📊 Monitoramento

### Prometheus Metrics

Métricas disponíveis em `http://localhost:9090/metrics`:

- **http_request_duration_seconds**: Histograma de duração de requisições HTTP
- **http_request_summary_seconds**: Resumo de requisições HTTP
- **process_cpu_user_seconds_total**: CPU em user space
- **process_cpu_system_seconds_total**: CPU em kernel space
- **nodejs_heap_size_total_bytes**: Tamanho total do heap
- **nodejs_heap_size_used_bytes**: Heap usado
- **nodejs_external_memory_bytes**: Memória externa
- E muitas outras métricas de processo e runtime

**Configuração:**

- Porta: 9090 (separada da API)
- IP Whitelist: 127.0.0.1, ::1
- Métricas de rota: habilitadas
- Métricas default do Node.js: habilitadas

### Under Pressure

Monitora a saúde do servidor em tempo real:

- **Event Loop Delay**: Máximo 5000ms
- **Heap Used**: Máximo 500MB
- **RSS Memory**: Máximo 1GB
- **Event Loop Utilization**: Máximo 98%
- **Health Check Interval**: 5 segundos

Se algum limite for ultrapassado, retorna `503 Service Unavailable`.

### Logs

**Desenvolvimento:**

- Console com pretty-print colorido
- Nível: debug

**Produção:**

- Arquivos JSON em `logs/`
- Rotação diária
- Máximo 10MB por arquivo
- Mantém últimos 7 arquivos
- Formato: `app.YYYY-MM-DD.N.log`

### Couchbase Audit Logs

Todos os CRUDs registram no Couchbase:

```json
{
  "entity": "user",
  "entityId": "uuid",
  "operation": "create | update | delete",
  "userId": "uuid",
  "timestamp": "2025-11-03T10:30:00.000Z",
  "changes": {
    "before": { ... },
    "after": { ... }
  },
  "metadata": { ... }
}
```

Acesse: http://localhost:8091 (Couchbase Web UI)

## 🔄 CI/CD

### GitHub Actions

Workflow automático em `.github/workflows/ci.yml`:

**Triggers:**

- Push em qualquer branch
- Pull Request para qualquer branch

**Jobs:**

1. ✅ Checkout do código
2. ✅ Setup Node.js 24.11.0
3. ✅ Instalar pnpm
4. ✅ Configurar cache do pnpm
5. ✅ Instalar dependências
6. ✅ Executar lint
7. ✅ Executar build
8. ✅ Verificar arquivos compilados

**Benefícios:**

- Garante que o código compila
- Verifica qualidade do código
- Cache para builds rápidos
- Feedback imediato em PRs

## 📜 Scripts Disponíveis

```bash
# Desenvolvimento
pnpm dev          # Servidor com hot-reload (tsx watch)

# Build
pnpm build        # Compila TypeScript para dist/

# Produção
pnpm start        # Executa código compilado

# Qualidade
pnpm lint         # Verifica código com ESLint

# Formatação (manual)
npx prettier --write .
```

## 🔐 Segurança

### Boas Práticas Implementadas

- ✅ Variáveis de ambiente validadas (fail-fast)
- ✅ Secrets nunca commitados (.env no .gitignore)
- ✅ TypeScript strict mode
- ✅ HTTPS redirect automático
- ✅ CSP (Content Security Policy)
- ✅ HSTS (HTTP Strict Transport Security)
- ✅ X-Frame-Options, X-Content-Type-Options
- ✅ Rate limiting por IP
- ✅ CSRF protection
- ✅ Sessões criptografadas
- ✅ Antivírus em uploads
- ✅ Validação de schemas (Zod)
- ✅ SQL injection protection (Drizzle)
- ✅ Circuit breaker para serviços externos

### Recomendações para Produção

1. **Secrets**: Use um secret manager (AWS Secrets Manager, Vault)
2. **SESSION_SECRET**: Gere um novo secret único por ambiente
3. **CORS**: Configure apenas domínios necessários (nunca use `*`)
4. **Rate Limit**: Ajuste conforme seu tráfego
5. **HTTPS**: Use certificado SSL válido (Let's Encrypt, AWS ACM)
6. **Monitoramento**: Configure alertas no Prometheus
7. **Logs**: Agregue logs em um sistema centralizado (ELK, CloudWatch)
8. **Backups**: Configure backups automáticos do PostgreSQL e Couchbase

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -m 'feat: adiciona nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

**Padrões:**

- Use commits semânticos (feat, fix, docs, refactor, test, chore)
- Passe no lint antes de commitar
- Atualize a documentação se necessário
- Escreva testes quando aplicável

## 📄 Licença

Este projeto é de código aberto e está disponível sob a licença MIT.

## 🙏 Agradecimentos

- [Fastify](https://www.fastify.io/) - Framework web rápido e eficiente
- [Drizzle ORM](https://orm.drizzle.team/) - Type-safe SQL query builder
- [Zod](https://zod.dev/) - TypeScript-first schema validation
- [Pino](https://getpino.io/) - Super fast logger
