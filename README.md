# Fastify CRUD

Uma API RESTful construída com Fastify, MikroORM e outras ferramentas para fornecer:

- Health Check com verificação de banco de dados e enfileiramento de tarefas
- Documentação automática via Swagger e Swagger UI
- Conexão com PostgreSQL usando MikroORM
- Cache de respostas com Redis
- Compressão de respostas HTTP
- Segurança HTTP (Helmet, cookies e proteção CSRF)
- Fila de tarefas com Bull (Redis)

---

## Índice

- [Recursos](#recursos)
- [Pré-requisitos](#pré-requisitos)
- [Instalação](#instalação)
- [Scripts npm](#scripts-npm)
- [Estrutura de Pastas](#estrutura-de-pastas)
- [Variáveis de Ambiente](#variáveis-de-ambiente)
- [Docker](#docker)
- [Endpoints](#endpoints)
- [Documentação](#documentação)
- [Contribuição](#contribuição)
- [Licença](#licença)

---

## Recursos

- **Health Check** (`GET /api/`): Verifica uptime da aplicação e conexão com o banco de dados.
- **Root** (`GET /`): Retorna status, versão, timestamp e rotas disponíveis.
- **Swagger & Swagger UI**: Documentação interativa em `/docs`.
- **Cache Redis**: Plugin de cache para otimizar respostas.
- **Compressão**: Compressão automática de respostas HTTP.
- **Segurança**: Helmet, cookies assinados e proteção CSRF.
- **ORM**: MikroORM para mapeamento objeto-relacional com PostgreSQL.
- **Fila de Tarefas**: Bull para processamento assíncrono de jobs.

## Pré-requisitos

- **Node.js** >= 22.14.0
- **pnpm** (ou npm/yarn)
- **PostgreSQL**
- **Redis**
- **Docker** (opcional, para desenvolvimento e staging)

## Instalação

1. Clone o repositório:

   ```bash
   git clone https://github.com/inacio-dev/fastify-CRUD.git
   cd fastify-CRUD
   ```

2. Crie um arquivo `.env` na raiz com as variáveis:

   ```env
   NODE_ENV=development
   PORT=3000
   DEBUG=false
   CORS_ORIGINS=*
   COOKIE_SECRET=uma-chave-secreta-aleatoria-para-cookies
   REDIS_HOST=localhost
   REDIS_PORT=6379
   POSTGRES_HOST=localhost
   POSTGRES_PORT=5432
   POSTGRES_DB=nome_do_banco
   POSTGRES_USER=usuario
   POSTGRES_PASSWORD=senha
   POSTGRES_SCHEMA=public
   POSTGRES_SSL=false
   ```

3. Instale as dependências:

   ```bash
   pnpm install
   ```

4. Execute migrations e atualize o schema:

   ```bash
   pnpm schema:update
   ```

## Scripts npm

- **`pnpm dev`**: Inicia o servidor em modo desenvolvimento com hot reload.
- **`pnpm build`**: Compila o projeto TypeScript para `build/`.
- **`pnpm start`**: Inicia o servidor compilado em `build/server.js`.
- **`pnpm lint`**: Executa ESLint em todo o código.
- **`pnpm migration:create <nome>`**: Cria uma nova migration do MikroORM.
- **`pnpm migration:up`**: Aplica todas as migrations pendentes.
- **`pnpm migration:down`**: Reverte a última migration.
- **`pnpm migration:pending`**: Lista migrations pendentes.
- **`pnpm schema:update`**: Atualiza o schema do banco sem gerar migration.
- **`pnpm schema:fresh`**: Reseta o banco e recria o schema.

## Estrutura de Pastas

```
fastify-CRUD/
├── docker/                         # Arquivos de Docker e Docker Compose
│   ├── Dockerfile                  # Imagem base do serviço
│   ├── docker-compose.local.yml    # Containers para desenvolvimento (PostgreSQL, Redis)
│   └── docker-compose.staging.yml  # Configuração de staging/produção
├── src/
│   ├── server.ts                   # Configuração principal do Fastify
│   ├── core/
│   │   ├── env.ts                  # Variáveis de ambiente validadas (Zod)
│   │   └── logger.ts               # Logger Pino com rotação de arquivos
│   ├── entities/
│   │   └── SystemInfo.entity.ts    # Exemplo de entidade MikroORM
│   ├── plugins/                    # Plugins Fastify registrados via autoload
│   ├── routes/                     # Rotas da API
│   │   └── index.ts                # Health check e lógica de status
│   └── tasks/                      # Configuração e implementação de jobs Bull
│       ├── config.ts
│       └── test.ts                 # Tarefa de log de healthcheck
├── mikro-orm.config.ts             # Configuração do MikroORM
├── package.json
├── tsconfig.json
├── .prettierrc
├── eslint.config.mjs
└── .gitignore
```

## Variáveis de Ambiente

| Variável            | Descrição                                            | Padrão                                     |
| ------------------- | ---------------------------------------------------- | ------------------------------------------ |
| `NODE_ENV`          | Ambiente de execução (`development` ou `production`) | `development`                              |
| `PORT`              | Porta em que o servidor irá escutar                  | `3000`                                     |
| `DEBUG`             | Habilita logs de debug (`true`/`false`)              | `false`                                    |
| `CORS_ORIGINS`      | Origem(s) permitidas no CORS                         | `*`                                        |
| `COOKIE_SECRET`     | Chave secreta para cookies assinados                 | `uma-chave-secreta-aleatoria-para-cookies` |
| `REDIS_HOST`        | Host do Redis                                        | `localhost`                                |
| `REDIS_PORT`        | Porta do Redis                                       | `6379`                                     |
| `POSTGRES_HOST`     | Host do PostgreSQL                                   | _Obrigatório_                              |
| `POSTGRES_PORT`     | Porta do PostgreSQL                                  | `5432`                                     |
| `POSTGRES_DB`       | Nome do banco de dados                               | _Obrigatório_                              |
| `POSTGRES_USER`     | Usuário do banco                                     | _Obrigatório_                              |
| `POSTGRES_PASSWORD` | Senha do banco                                       | _Obrigatório_                              |
| `POSTGRES_SCHEMA`   | Schema do PostgreSQL                                 | `public`                                   |
| `POSTGRES_SSL`      | Usa SSL na conexão (`true`/`false`)                  | `false`                                    |

## Docker

### Desenvolvimento Local

```bash
docker-compose -f docker/docker-compose.local.yml up -d
```

### Staging/Produção

```bash
docker-compose -f docker/docker-compose.staging.yml up -d
```

## Endpoints

- **GET /**

  - Descrição: Status geral da API
  - Resposta:

    ```json
    {
      "status": "online",
      "version": "1.0.0",
      "timestamp": "2025-05-09T...Z",
      "endpoints": {
        "documentation": "/docs",
        "api": "/api"
      }
    }
    ```

- **GET /api/**

  - Descrição: Health check da aplicação
  - Resposta 200:

    ```json
    {
      "uptime": 12345,
      "timestamp": 1616161616161,
      "status": "OK",
      "database": "connected"
    }
    ```

  - Resposta 503 (erro no DB):

    ```json
    {
      "uptime": 12345,
      "timestamp": 1616161616161,
      "status": "ERROR",
      "database": "error"
    }
    ```

## Documentação

Acesse a interface interativa via Swagger UI:

```
http://localhost:3000/docs
```

## Contribuição

Pull requests são bem-vindos! Para alterações maiores, abra uma issue antes para alinharmos as mudanças.

## Licença

Este projeto não possui licença definida.
