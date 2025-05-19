# Fastify CRUD

Uma API RESTful de alta performance construída com Fastify, MikroORM e ferramentas modernas para fornecer uma base robusta para aplicações Node.js.

## Visão Geral

Este projeto implementa um sistema CRUD (Create, Read, Update, Delete) completo utilizando uma arquitetura moderna com foco em desempenho, segurança e manutenibilidade. A API inclui recursos como health check, documentação automática, conexão otimizada com banco de dados, cache de respostas, e sistema de filas de tarefas.

## 🚀 Recursos

- **Health Check**: Verificação completa de estado com verificação de banco de dados e enfileiramento de tarefas
- **Documentação API**: Integração com Swagger e Swagger UI
- **ORM**: Conexão com PostgreSQL utilizando MikroORM para mapeamento objeto-relacional
- **Cache**: Otimização de respostas com Redis
- **Compressão HTTP**: Redução automática do tamanho das respostas
- **Segurança**: Proteção avançada com Helmet, cookies assinados e proteção CSRF
- **Filas de Tarefas**: Processamento assíncrono com Bull (Redis)
- **TypeScript**: Tipagem estática para melhorar a manutenção e evitar erros

## 📋 Pré-requisitos

- Node.js >= 22.14.0
- pnpm (ou npm/yarn)
- PostgreSQL
- Redis
- Docker (opcional, para desenvolvimento e staging)

## 🔧 Instalação

1. Clone o repositório:

```bash
git clone https://github.com/seu-usuario/fastify-CRUD.git
cd fastify-CRUD
```

2. Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:

```
NODE_ENV=development
PORT=3333
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

## 🏃‍♂️ Scripts Disponíveis

- `pnpm dev`: Inicia o servidor em modo desenvolvimento com hot reload
- `pnpm build`: Compila o projeto TypeScript para `dist/`
- `pnpm start`: Inicia o servidor compilado em `dist/server.js`
- `pnpm lint`: Executa ESLint em todo o código
- `pnpm test`: Executa os testes automatizados
- `pnpm migration:create <nome>`: Cria uma nova migration do MikroORM
- `pnpm migration:up`: Aplica todas as migrations pendentes
- `pnpm migration:down`: Reverte a última migration
- `pnpm migration:pending`: Lista migrations pendentes
- `pnpm schema:update`: Atualiza o schema do banco sem gerar migration
- `pnpm schema:fresh`: Reseta o banco e recria o schema

## 📁 Estrutura de Pastas

```
fastify-CRUD/
├── docker/                  # Arquivos de Docker e Docker Compose
│   ├── Dockerfile           # Imagem base do serviço
│   ├── docker-compose.local.yml    # Containers para desenvolvimento
│   └── docker-compose.staging.yml  # Configuração de staging/produção
├── src/
│   ├── api/                 # Código relacionado à API
│   │   ├── controllers/     # Controladores da API
│   │   ├── routes/          # Definições de rotas
│   │   ├── middlewares/     # Middlewares
│   │   └── validators/      # Validadores de entrada
│   ├── core/                # Núcleo da aplicação e funcionalidades fundamentais
│   │   └── logger.ts        # Logger Pino com rotação de arquivos
│   ├── domain/              # Lógica de domínio da aplicação
│   │   ├── entities/        # Entidades do domínio
│   │   ├── models/          # Modelos de dados
│   │   ├── services/        # Serviços de domínio
│   │   └── repositories/    # Interfaces de repositórios
│   ├── environments/        # Configurações de ambiente (dev, prod, test)
│   │   └── environments.ts  # Variáveis de ambiente validadas (Zod)
│   ├── infrastructure/      # Código de infraestrutura e integrações
│   │   ├── database/        # Configuração e conexões com banco de dados
│   │   └── queue/           # Serviços de fila e mensageria
│   ├── plugins/             # Plugins Fastify registrados via autoload
│   │   ├── cache.ts         # Plugin para cache com Redis
│   │   ├── compress.ts      # Plugin para compressão de respostas
│   │   ├── mikro-orm.ts     # Plugin para integração com MikroORM
│   │   ├── queue.ts         # Plugin para filas de tarefas com Bull
│   │   └── security.ts      # Plugin para segurança (CSRF, Helmet)
│   ├── types/               # Definições de tipos globais
│   ├── utils/               # Funções utilitárias genéricas
│   │   └── convert-every-to-ms.ts  # Utilitário para converter tempo
│   ├── server.ts            # Ponto de entrada da aplicação
│   └── tests/               # Testes automatizados
│       ├── api/             # Testes de API
│       ├── utils/           # Testes de utilitários
│       └── mocks/           # Dados fictícios para testes
├── mikro-orm.config.ts      # Configuração do MikroORM
├── tsconfig.json            # Configuração do TypeScript
├── package.json
├── .prettierrc
├── eslint.config.mjs
└── jest.config.mjs          # Configuração dos testes
```

## 🔐 Variáveis de Ambiente

| Variável          | Descrição                                        | Padrão                                   |
| ----------------- | ------------------------------------------------ | ---------------------------------------- |
| NODE_ENV          | Ambiente de execução (development ou production) | development                              |
| PORT              | Porta em que o servidor irá escutar              | 3333                                     |
| DEBUG             | Habilita logs de debug (true/false)              | false                                    |
| CORS_ORIGINS      | Origem(s) permitidas no CORS                     | \*                                       |
| COOKIE_SECRET     | Chave secreta para cookies assinados             | uma-chave-secreta-aleatoria-para-cookies |
| REDIS_HOST        | Host do Redis                                    | localhost                                |
| REDIS_PORT        | Porta do Redis                                   | 6379                                     |
| REDIS_PASSWORD    | Senha do Redis (opcional)                        | -                                        |
| POSTGRES_HOST     | Host do PostgreSQL                               | Obrigatório                              |
| POSTGRES_PORT     | Porta do PostgreSQL                              | 5432                                     |
| POSTGRES_DB       | Nome do banco de dados                           | Obrigatório                              |
| POSTGRES_USER     | Usuário do banco                                 | Obrigatório                              |
| POSTGRES_PASSWORD | Senha do banco                                   | Obrigatório                              |
| POSTGRES_SCHEMA   | Schema do PostgreSQL                             | public                                   |
| POSTGRES_SSL      | Usa SSL na conexão (true/false)                  | false                                    |

## 🐳 Docker

Para desenvolver usando Docker:

```bash
# Para ambiente de desenvolvimento com PostgreSQL e Redis
docker-compose -f docker/docker-compose.local.yml up -d

# Para ambiente de staging
docker-compose -f docker/docker-compose.staging.yml up -d
```

## 🌐 Endpoints

### Raiz (/)

- **Método**: GET
- **Descrição**: Status geral da API
- **Resposta**:

```json
{
  "status": "online",
  "version": "2.0.0",
  "timestamp": "2025-05-19T10:15:30.123Z",
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

## 📖 Documentação

Acesse a interface interativa via Swagger UI:

```
http://localhost:3333/docs
```

## 🧩 Componentes Principais

### Servidor Fastify

O núcleo da aplicação está configurado em `src/server.ts`, onde o servidor Fastify é instanciado e configurado com todos os plugins e middlewares necessários.

### Plugins

Os plugins estão organizados em `src/plugins/` e são carregados via autoload. Plugins incluem funcionalidades como:

- **cache.ts**: Configuração de cache com Redis
- **compress.ts**: Compressão de respostas HTTP
- **mikro-orm.ts**: Integração com banco de dados PostgreSQL
- **queue.ts**: Sistema de filas com Bull/Redis
- **security.ts**: Configurações de segurança

### Rotas

As rotas da API estão definidas em `src/api/routes/` e implementam os endpoints RESTful da aplicação.

### Sistema de Filas

O sistema de filas baseado em Bull permite o processamento assíncrono de tarefas. As tarefas são definidas em `src/infrastructure/queue/tasks/`:

- **tester.ts**: Tarefa para verificação de saúde do sistema
- **async-tester.ts**: Tarefas de sincronização programadas

## 🏗️ Arquitetura

Este projeto segue uma arquitetura em camadas:

1. **Camada de API**: Rotas, controladores e validadores
2. **Camada de Domínio**: Entidades e lógica de negócio
3. **Camada de Infraestrutura**: Acesso a serviços externos (DB, Redis)
4. **Camada de Plugins**: Extensões do Fastify para diversas funcionalidades

### Recursos de Segurança

- Proteção de cabeçalhos HTTP com Helmet
- Cookies assinados e seguros
- Proteção CSRF integrada
- Validação de entradas com Zod

### Recursos de Performance

- Cache com Redis
- Compressão de respostas
- Pool de conexões otimizado para PostgreSQL
- Processamento assíncrono de tarefas

## 🧪 Testes

O projeto inclui testes automatizados usando Jest:

```bash
# Executar todos os testes
pnpm test

# Executar testes com watch mode
pnpm test -- --watch
```

## 🔭 Roadmap

- [ ] Implementação de autenticação JWT
- [ ] Suporte a multitenancy
- [ ] Monitoramento e telemetria
- [ ] Integração com serviços de email
- [ ] Pipeline de CI/CD completo
- [ ] Expansão da cobertura de testes

## 🤝 Contribuição

Pull requests são bem-vindos! Para alterações maiores, abra uma issue antes para alinharmos as mudanças.

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/amazing-feature`)
3. Commit suas alterações (`git commit -m 'Add some amazing feature'`)
4. Push para a branch (`git push origin feature/amazing-feature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está licenciado sob a Licença ISC - veja o arquivo LICENSE para detalhes.

---

Desenvolvido por Inácio Rodrigues
