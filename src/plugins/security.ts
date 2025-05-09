import cookie from '@fastify/cookie'
import csrf from '@fastify/csrf-protection'
import helmet from '@fastify/helmet'
import { FastifyPluginAsync } from 'fastify'
import fp from 'fastify-plugin'

import { env } from '../core/env'

const securityPlugin: FastifyPluginAsync = async (fastify) => {
  // Configurações de segurança de cabeçalhos HTTP
  await fastify.register(helmet, {
    // Configurações personalizadas se necessário
  })

  // Suporte para cookies
  await fastify.register(cookie, {
    secret: env.COOKIE_SECRET, // para cookies assinados
    parseOptions: {}, // opções para cookie parsing
  })

  // Proteção CSRF
  await fastify.register(csrf, {
    sessionPlugin: '@fastify/cookie',
  })
}

export default fp(securityPlugin, { name: 'security' })
