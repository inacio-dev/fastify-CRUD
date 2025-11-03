import cors from '@fastify/cors'
import type { FastifyInstance, FastifyPluginOptions } from 'fastify'
import fp from 'fastify-plugin'

import { env } from '../config/env.js'

/**
 * Plugin de CORS
 * Configura políticas de Cross-Origin Resource Sharing
 */
async function corsPlugin(fastify: FastifyInstance, _opts: FastifyPluginOptions) {
  try {
    const corsOrigins = env.CORS_ORIGINS

    // Determina o valor de origin baseado em CORS_ORIGINS
    let origin: boolean | string | string[]
    if (corsOrigins === '*') {
      origin = true // Permite todas as origens
      fastify.log.warn(
        'CORS configurado para aceitar todas as origens (não recomendado em produção)',
      )
    } else if (Array.isArray(corsOrigins)) {
      origin = corsOrigins // Array de origens
      fastify.log.info({ origins: origin }, 'CORS configurado com origens específicas')
    } else {
      origin = corsOrigins
      fastify.log.info({ origin }, 'CORS configurado')
    }

    await fastify.register(cors, {
      origin,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      exposedHeaders: ['Content-Range', 'X-Content-Range'],
      maxAge: 86400, // 24 horas
    })

    fastify.log.info('Plugin [cors] carregado com sucesso')
  } catch (err) {
    fastify.log.error({ err }, 'Falha ao carregar o plugin [cors]')
    throw err
  }
}

export default fp(corsPlugin, {
  name: 'cors',
})
