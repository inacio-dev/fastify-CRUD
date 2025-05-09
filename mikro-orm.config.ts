import path from 'path'
import { Options, PostgreSqlDriver } from '@mikro-orm/postgresql'

import { env } from './src/core/env'

const mikroOrmConfig: Options = {
  /* ---------------------------------------------------------------------------
    Configurações gerais:
      - Driver para conexão com PostgreSQL
      - Entidades compiladas (JS)
      - Entidades em TypeScript
      - Habilita logs de debug apenas em desenvolvimento
      - Cache de metadados para melhorar performance
      - Configurações de timezone
      - Define o uso de transações implícitas
  */
  driver: PostgreSqlDriver,
  entities: ['./build/**/*.entity.js'],
  entitiesTs: ['./src/**/*.entity.ts'],
  debug: env.NODE_ENV === 'development',
  metadataCache: { enabled: true },
  timezone: 'UTC',
  implicitTransactions: true,
  // ---------------------------------------------------------------------------
  // Configurações básicas de conexão ------------------------------------------
  port: env.POSTGRES_PORT,
  user: env.POSTGRES_USER,
  host: env.POSTGRES_HOST,
  dbName: env.POSTGRES_DB,
  password: env.POSTGRES_PASSWORD,
  schema: env.POSTGRES_SCHEMA,
  // ---------------------------------------------------------------------------
  // Configuração de migrations ------------------------------------------------
  migrations: {
    path: path.resolve(__dirname, './migrations'),
  },
  // ---------------------------------------------------------------------------
  // Configurações de contexto e descoberta ------------------------------------
  allowGlobalContext: true,
  discovery: {
    warnWhenNoEntities: false,
    requireEntitiesArray: false,
  },
  // ---------------------------------------------------------------------------
  /* ---------------------------------------------------------------------------
    Configurações de pool de conexão:
      - Mínimo de conexões mantidas no pool
      - Máximo de conexões que o pool pode ter
      - Tempo máximo para adquirir uma conexão (5s)
      - Tempo máximo para criar uma conexão (5s)
      - Tempo que uma conexão pode ficar ociosa (30s)
      - Intervalo entre tentativas de criação (200ms)
  */
  pool: {
    min: 2,
    max: 10,
    acquireTimeoutMillis: 5000,
    createTimeoutMillis: 5000,
    idleTimeoutMillis: 30000,
    createRetryIntervalMillis: 200,
  },
  // ---------------------------------------------------------------------------
  // Configurações de segurança ------------------------------------------------
  driverOptions: {
    connection: {
      ssl: env.POSTGRES_SSL
        ? {
            rejectUnauthorized: false,
          }
        : false,
    },
  },
  // ---------------------------------------------------------------------------
}

export default mikroOrmConfig
