import rateLimit from '@fastify/rate-limit'
import type { FastifyInstance, FastifyPluginOptions } from 'fastify'
import fp from 'fastify-plugin'

import { env } from '../config/env.js'

/**
 * Plugin de rate limiting
 * Protege contra DDoS e ataques de brute force limitando requisições por IP
 */
async function rateLimitPlugin(fastify: FastifyInstance, _opts: FastifyPluginOptions) {
  try {
    const max = env.RATE_LIMIT_MAX
    const timeWindow = env.RATE_LIMIT_TIME_WINDOW

    await fastify.register(rateLimit, {
      max, // Máximo de requisições
      timeWindow, // Janela de tempo
      cache: 10000, // Tamanho do cache (número de IPs rastreados)
      allowList: [], // Lista de IPs permitidos (whitelist)
      redis: undefined, // Para produção distribuída, configure Redis
      continueExceeding: true, // Continua contando após o limite
      skipOnError: false, // Não pula rate limit se houver erro
      addHeadersOnExceeding: {
        'x-ratelimit-limit': true,
        'x-ratelimit-remaining': true,
        'x-ratelimit-reset': true,
      },
      addHeaders: {
        'x-ratelimit-limit': true,
        'x-ratelimit-remaining': true,
        'x-ratelimit-reset': true,
      },
    })

    fastify.log.info({ max, timeWindow }, 'Plugin [rate-limit] carregado com sucesso')
  } catch (err) {
    fastify.log.error({ err }, 'Falha ao carregar o plugin [rate-limit]')
    throw err
  }
}

export default fp(rateLimitPlugin, {
  name: 'rate-limit',
})
