import type { FastifyInstance, FastifyPluginOptions } from 'fastify'
import fp from 'fastify-plugin'

import { env } from '../config/env.js'
import { closeDatabase, db, pool } from '../db/index.js'

/**
 * Plugin do Drizzle ORM
 *
 * Integra o Drizzle ORM ao Fastify, fornecendo:
 * - Conexão com PostgreSQL via pool de conexões
 * - Instância do Drizzle ORM para queries type-safe
 * - Graceful shutdown (fechamento de conexões)
 *
 * A instância do db fica disponível em `fastify.db` em todas as rotas
 */
async function drizzlePlugin(fastify: FastifyInstance, _opts: FastifyPluginOptions) {
  try {
    // Testar conexão com o banco de dados
    await pool.query('SELECT 1')

    // Decorar Fastify com a instância do Drizzle
    fastify.decorate('db', db)

    // Adicionar hook para fechar conexões no shutdown
    fastify.addHook('onClose', async () => {
      fastify.log.info('Fechando conexões do banco de dados...')
      await closeDatabase()
      fastify.log.info('Conexões do banco de dados fechadas com sucesso')
    })

    fastify.log.info(
      {
        host: env.POSTGRES_HOST,
        port: env.POSTGRES_PORT,
        database: env.POSTGRES_DB,
        poolMin: env.POSTGRES_POOL_MIN,
        poolMax: env.POSTGRES_POOL_MAX,
      },
      'Plugin [drizzle] carregado com sucesso',
    )
  } catch (err) {
    fastify.log.error({ err }, 'Falha ao carregar o plugin [drizzle]')
    throw err
  }
}

export default fp(drizzlePlugin, {
  name: 'drizzle',
})

// Estender tipos do Fastify para incluir a instância do db
declare module 'fastify' {
  interface FastifyInstance {
    db: typeof db
  }
}
