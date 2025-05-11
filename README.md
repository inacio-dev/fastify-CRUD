# Fastify-CRUD

Uma API RESTful de alta performance construída com Fastify, MikroORM e ferramentas modernas para fornecer uma base robusta para aplicações Node.js.

## Visão Geral

Este projeto implementa um sistema CRUD (Create, Read, Update, Delete) completo utilizando uma arquitetura moderna com foco em desempenho, segurança e manutenibilidade. A API inclui recursos como health check, documentação automática, conexão otimizada com banco de dados, cache de respostas, e sistema de filas de tarefas.

## Recursos

- **Health Check**: Verificação completa de estado com verificação de banco de dados e enfileiramento de tarefas
- **Documentação Automática**: Integração com Swagger e Swagger UI
- **ORM**: Conexão com PostgreSQL utilizando MikroORM para mapeamento objeto-relacional
- **Cache**: Otimização de respostas com Redis
- **Compressão HTTP**: Redução automática do tamanho das respostas
- **Segurança**: Proteção avançada com Helmet, cookies assinados e proteção CSRF
- **Filas de Tarefas**: Processamento assíncrono com Bull (Redis)

## Pré-requisitos

- Node.js >= 22.14.0
- pnpm (ou npm/yarn)
- PostgreSQL
- Redis
- Docker (opcional, para desenvolvimento e staging)

## Instalação

1. Clone o repositório:
```bash
git clone https://github.com/inacio-dev/fastify-CRUD.git
cd fastify-CRUD
```

2. Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:
```
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

4. Execute as migrations e atualize o schema:
```bash
pnpm schema:update
```

## Scripts npm

- `pnpm dev`: Inicia o servidor em modo desenvolvimento com hot reload
- `pnpm build`: Compila o projeto TypeScript para `build/`
- `pnpm start`: Inicia o servidor compilado em `build/server.js`
- `pnpm lint`: Executa ESLint em todo o código
- `pnpm migration:create <nome>`: Cria uma nova migration do MikroORM
- `pnpm migration:up`: Aplica todas as migrations pendentes
- `pnpm migration:down`: Reverte a última migration
- `pnpm migration:pending`: Lista migrations pendentes
- `pnpm schema:update`: Atualiza o schema do banco sem gerar migration
- `pnpm schema:fresh`: Reseta o banco e recria o schema

## Estrutura de Pastas

```
fastify-CRUD/
├── docker/                  # Arquivos de Docker e Docker Compose
│   ├── Dockerfile           # Imagem base do serviço
│   ├── docker-compose.local.yml    # Containers para desenvolvimento
│   └── docker-compose.staging.yml  # Configuração de staging/produção
├── src/
│   ├── server.ts            # Configuração principal do Fastify
│   ├── core/
│   │   ├── env.ts           # Variáveis de ambiente validadas (Zod)
│   │   └── logger.ts        # Logger Pino com rotação de arquivos
│   ├── entities/
│   │   └── SystemInfo.entity.ts  # Exemplo de entidade MikroORM
│   ├── plugins/             # Plugins Fastify registrados via autoload
│   ├── routes/              # Rotas da API
│   │   └── index.ts         # Health check e lógica de status
│   └── tasks/               # Configuração e implementação de jobs Bull
│       ├── config.ts
│       └── test.ts          # Tarefa de log de healthcheck
├── mikro-orm.config.ts      # Configuração do MikroORM
├── package.json
├── tsconfig.json
├── .prettierrc
├── eslint.config.mjs
└── .gitignore
```

## Variáveis de Ambiente

| Variável | Descrição | Padrão |
|---|---|---|
| NODE_ENV | Ambiente de execução (development ou production) | development |
| PORT | Porta em que o servidor irá escutar | 3000 |
| DEBUG | Habilita logs de debug (true/false) | false |
| CORS_ORIGINS | Origem(s) permitidas no CORS | * |
| COOKIE_SECRET | Chave secreta para cookies assinados | uma-chave-secreta-aleatoria-para-cookies |
| REDIS_HOST | Host do Redis | localhost |
| REDIS_PORT | Porta do Redis | 6379 |
| POSTGRES_HOST | Host do PostgreSQL | Obrigatório |
| POSTGRES_PORT | Porta do PostgreSQL | 5432 |
| POSTGRES_DB | Nome do banco de dados | Obrigatório |
| POSTGRES_USER | Usuário do banco | Obrigatório |
| POSTGRES_PASSWORD | Senha do banco | Obrigatório |
| POSTGRES_SCHEMA | Schema do PostgreSQL | public |
| POSTGRES_SSL | Usa SSL na conexão (true/false) | false |

## Docker

Para desenvolver usando Docker:

```bash
# Para ambiente de desenvolvimento com PostgreSQL e Redis
docker-compose -f docker/docker-compose.local.yml up -d

# Para ambiente de staging
docker-compose -f docker/docker-compose.staging.yml up -d
```

## Endpoints

### Raiz (/)
- **Método**: GET
- **Descrição**: Status geral da API
- **Resposta**:
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

### Health Check (/api/)
- **Método**: GET
- **Descrição**: Health check da aplicação
- **Resposta 200**:
```json
{
  "uptime": 12345,
  "timestamp": 1616161616161,
  "status": "OK",
  "database": "connected"
}
```
- **Resposta 503** (erro no DB):
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

## Componentes Principais

### Servidor Fastify
O núcleo da aplicação está configurado em `src/server.ts`, onde o servidor Fastify é instanciado e configurado com todos os plugins e middlewares necessários.

### Plugins
Os plugins estão organizados em `src/plugins/` e são carregados via autoload. Plugins incluem funcionalidades como:
- Compressão de respostas
- Cache Redis
- Segurança HTTP
- Documentação Swagger

### Rotas
As rotas da API estão definidas em `src/routes/` e implementam os endpoints RESTful da aplicação.

### Entidades
As entidades de banco de dados estão definidas em `src/entities/` usando a sintaxe do MikroORM para definir a estrutura de dados e relacionamentos.

### Tarefas Assíncronas
Tarefas em background são gerenciadas pelo Bull e configuradas em `src/tasks/`, permitindo processamento assíncrono de jobs.

## Arquitetura

Este projeto segue uma arquitetura em camadas:

1. **Camada de Transporte**: Fastify para roteamento e manipulação de requisições HTTP
2. **Camada de Aplicação**: Lógica de negócios e processamento
3. **Camada de Persistência**: MikroORM para acesso e gerenciamento de dados
4. **Infraestrutura**: Redis para cache, Bull para filas de tarefas

## Segurança

O projeto implementa diversas medidas de segurança:
- Helmet para proteção de cabeçalhos HTTP
- Cookies assinados para sessões seguras
- Proteção CSRF para prevenir ataques de falsificação de requisição
- Validação de dados de entrada

## Desempenho

A performance é otimizada através de:
- Cache de respostas com Redis
- Compressão HTTP
- Carregamento assíncrono de plugins
- ORM otimizado para consultas eficientes

## Contribuição

Pull requests são bem-vindos! Para alterações maiores, abra uma issue antes para alinharmos as mudanças.

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/amazing-feature`)
3. Commit suas alterações (`git commit -m 'Add some amazing feature'`)
4. Push para a branch (`git push origin feature/amazing-feature`)
5. Abra um Pull Request

## Roadmap

- [ ] Implementação de testes automatizados
- [ ] Autenticação e autorização de usuários
- [ ] Expansão de endpoints para novas entidades
- [ ] Monitoramento e observabilidade
- [ ] Pipeline de CI/CD

---

Desenvolvido por [inacio-dev](https://github.com/inacio-dev).
