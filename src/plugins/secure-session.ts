import secureSession from '@fastify/secure-session'
import type { FastifyInstance, FastifyPluginOptions } from 'fastify'
import fp from 'fastify-plugin'

import { env } from '../config/env.js'

/**
 * Plugin de sessão segura
 * Gerencia sessões criptografadas armazenadas em cookies (stateless, sem banco de dados)
 */
async function secureSessionPlugin(fastify: FastifyInstance, _opts: FastifyPluginOptions) {
  try {
    const sessionSecret = env.SESSION_SECRET

    if (!sessionSecret) {
      throw new Error('SESSION_SECRET não definido no arquivo .env')
    }

    await fastify.register(secureSession, {
      key: Buffer.from(sessionSecret, 'hex'),
      cookie: {
        path: '/',
        httpOnly: true, // Previne acesso via JavaScript
        secure: env.NODE_ENV === 'production', // HTTPS apenas em produção
        sameSite: 'lax', // Proteção contra CSRF
        maxAge: 24 * 60 * 60, // 24 horas em segundos
      },
    })

    fastify.log.info('Plugin [secure-session] carregado com sucesso')
  } catch (err) {
    fastify.log.error({ err }, 'Falha ao carregar o plugin [secure-session]')
    throw err
  }
}

export default fp(secureSessionPlugin, {
  name: 'secure-session',
})
