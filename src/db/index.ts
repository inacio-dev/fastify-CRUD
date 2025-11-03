import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'

import { env } from '../config/env.js'
import * as schema from './schema.js'

/**
 * Pool de conexões do PostgreSQL
 * Gerencia múltiplas conexões reutilizáveis com o banco
 */
export const pool = new Pool({
  host: env.POSTGRES_HOST,
  port: env.POSTGRES_PORT,
  user: env.POSTGRES_USER,
  password: env.POSTGRES_PASSWORD,
  database: env.POSTGRES_DB,
  min: env.POSTGRES_POOL_MIN,
  max: env.POSTGRES_POOL_MAX,
})

/**
 * Instância do Drizzle ORM
 * Fornece API type-safe para queries SQL
 */
export const db = drizzle(pool, { schema })

/**
 * Fecha todas as conexões do pool
 * Deve ser chamado no shutdown graceful da aplicação
 */
export async function closeDatabase(): Promise<void> {
  await pool.end()
}
