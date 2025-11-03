import csrfProtection from '@fastify/csrf-protection'
import type { FastifyInstance, FastifyPluginOptions } from 'fastify'
import fp from 'fastify-plugin'

import { env } from '../config/env.js'

/**
 * Plugin de proteção CSRF
 * Protege contra ataques Cross-Site Request Forgery usando tokens
 */
async function csrfPlugin(fastify: FastifyInstance, _opts: FastifyPluginOptions) {
  try {
    await fastify.register(csrfProtection, {
      sessionPlugin: '@fastify/secure-session',
      cookieOpts: {
        httpOnly: true,
        sameSite: 'lax',
        secure: env.NODE_ENV === 'production',
      },
    })

    fastify.log.info('Plugin [csrf-protection] carregado com sucesso')
  } catch (err) {
    fastify.log.error({ err }, 'Falha ao carregar o plugin [csrf-protection]')
    throw err
  }
}

export default fp(csrfPlugin, {
  name: 'csrf-protection',
  dependencies: ['secure-session'], // Garante que secure-session seja carregado antes
})
