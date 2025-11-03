import type { FastifyInstance, FastifyPluginOptions } from 'fastify'
import httpsRedirect from 'fastify-https-redirect'
import fp from 'fastify-plugin'

import { env } from '../config/env.js'

/**
 * Plugin de redirecionamento HTTPS
 *
 * Em produção, redireciona automaticamente todas as requisições HTTP para HTTPS.
 * Em desenvolvimento, permite HTTP para facilitar testes locais.
 *
 * Funciona apenas se o servidor estiver atrás de um proxy reverso (nginx, cloudflare, etc.)
 * que adiciona os headers X-Forwarded-Proto ou X-Forwarded-Host.
 *
 * Importante:
 * - Em produção, configure seu proxy reverso para adicionar esses headers
 * - Nginx: proxy_set_header X-Forwarded-Proto $scheme;
 * - Cloudflare: adiciona automaticamente
 */
async function httpsRedirectPlugin(fastify: FastifyInstance, _opts: FastifyPluginOptions) {
  try {
    // Só ativa em produção
    if (env.NODE_ENV !== 'production') {
      fastify.log.info(
        { environment: env.NODE_ENV },
        'Plugin [https-redirect] desabilitado (apenas ativo em produção)',
      )
      return
    }

    // Registra plugin de redirecionamento
    await fastify.register(httpsRedirect)

    fastify.log.info('Plugin [https-redirect] carregado com sucesso')
  } catch (err) {
    fastify.log.error({ err }, 'Falha ao carregar o plugin [https-redirect]')
    throw err
  }
}

export default fp(httpsRedirectPlugin, {
  name: 'https-redirect',
})
