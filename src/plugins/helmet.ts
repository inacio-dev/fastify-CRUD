import helmet from '@fastify/helmet'
import type { FastifyInstance, FastifyPluginOptions } from 'fastify'
import fp from 'fastify-plugin'

import { env } from '../config/env.js'

/**
 * Plugin de headers de segurança usando Helmet
 * Adiciona vários headers HTTP para proteção contra vulnerabilidades comuns
 * Em desenvolvimento, CSP mais permissivo para Swagger UI
 * Em produção, CSP restritivo para máxima segurança + HSTS + proteção contra mixed content
 */
async function helmetPlugin(fastify: FastifyInstance, _opts: FastifyPluginOptions) {
  try {
    const isProduction = env.NODE_ENV === 'production'

    await fastify.register(helmet, {
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          // Em desenvolvimento, permite estilos inline para Swagger UI
          // Em produção, bloqueia estilos inline
          styleSrc: isProduction ? ["'self'"] : ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"], // Scripts inline sempre bloqueados
          imgSrc: ["'self'", 'data:', 'https:'],
          // connectSrc sempre permite o próprio servidor (necessário para chamadas API)
          connectSrc: ["'self'"],
          // Em desenvolvimento, permite fontes data: para Swagger UI
          // Em produção, apenas fontes do próprio servidor
          fontSrc: isProduction ? ["'self'"] : ["'self'", 'data:'],
          baseUri: ["'self'"],
          formAction: ["'self'"],
          frameAncestors: ["'self'"],
          objectSrc: ["'none'"],
          scriptSrcAttr: ["'none'"],
          // Em produção, força upgrade de HTTP → HTTPS e bloqueia mixed content
          ...(isProduction && {
            upgradeInsecureRequests: [],
            blockAllMixedContent: [],
          }),
        },
      },
      // HSTS (HTTP Strict Transport Security) - apenas em produção
      hsts: isProduction
        ? {
            maxAge: 31536000, // 1 ano
            includeSubDomains: true, // Aplica a todos os subdomínios
            preload: true, // Permite inclusão na lista HSTS preload dos browsers
          }
        : false,
      crossOriginEmbedderPolicy: false,
    })

    fastify.log.info(
      {
        cspMode: isProduction ? 'restritivo (produção)' : 'permissivo (desenvolvimento)',
        hsts: isProduction ? 'ativado (1 ano, subdomínios, preload)' : 'desativado',
        httpsEnforcement: isProduction ? 'ativado (upgrade + block mixed content)' : 'desativado',
      },
      'Plugin [helmet] carregado com sucesso',
    )
  } catch (err) {
    fastify.log.error({ err }, 'Falha ao carregar o plugin [helmet]')
    throw err
  }
}

export default fp(helmetPlugin, {
  name: 'helmet',
})
