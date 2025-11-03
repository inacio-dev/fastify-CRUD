import fastifyRedis from '@fastify/redis'
import type { FastifyInstance, FastifyPluginOptions } from 'fastify'
import fp from 'fastify-plugin'

import { env } from '../config/env.js'

/**
 * Plugin Redis para cache distribuído
 *
 * Conecta ao Redis apenas se REDIS_ENABLED=true
 * Útil para:
 * - Cache distribuído entre múltiplas instâncias do servidor
 * - Sessões compartilhadas
 * - Filas de jobs
 * - Pub/Sub
 *
 * Se desabilitado, o sistema de cache usa memória local (fallback)
 *
 * Uso:
 * ```typescript
 * const value = await fastify.redis.get('key')
 * await fastify.redis.set('key', 'value', 'EX', 300) // 5 minutos
 * await fastify.redis.del('key')
 * ```
 */
async function redisPlugin(fastify: FastifyInstance, _opts: FastifyPluginOptions) {
  try {
    // Só conecta se Redis estiver habilitado
    if (!env.REDIS_ENABLED) {
      fastify.log.info('Plugin [redis] desabilitado (REDIS_ENABLED=false)')
      return
    }

    // Configuração do Redis - omite password se undefined
    const redisConfig: {
      host: string
      port: number
      password?: string
      db: number
      retryStrategy: (times: number) => number | null
    } = {
      host: env.REDIS_HOST,
      port: env.REDIS_PORT,
      db: env.REDIS_DB,
      // Reconecta automaticamente se cair
      retryStrategy: (times: number) => {
        if (times > 10) {
          fastify.log.error('Redis: Máximo de tentativas de reconexão atingido')
          return null // Para de tentar
        }
        const delay = Math.min(times * 50, 2000) // Max 2s de delay
        return delay
      },
    }

    // Adiciona password apenas se estiver definida
    if (env.REDIS_PASSWORD) {
      redisConfig.password = env.REDIS_PASSWORD
    }

    await fastify.register(fastifyRedis, redisConfig)

    // Testa conexão
    await fastify.redis.ping()

    fastify.log.info(
      {
        host: env.REDIS_HOST,
        port: env.REDIS_PORT,
        db: env.REDIS_DB,
      },
      'Plugin [redis] conectado com sucesso',
    )

    // Log de erros do Redis
    fastify.redis.on('error', (err: Error) => {
      fastify.log.error({ err }, 'Erro na conexão Redis')
    })

    // Fecha conexão ao encerrar Fastify
    fastify.addHook('onClose', async () => {
      await fastify.redis.quit()
    })
  } catch (err) {
    fastify.log.error({ err }, 'Falha ao carregar o plugin [redis]')
    throw err
  }
}

export default fp(redisPlugin, {
  name: 'redis',
})
