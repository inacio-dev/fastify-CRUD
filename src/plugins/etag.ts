import etag from '@fastify/etag'
import type { FastifyInstance, FastifyPluginOptions } from 'fastify'
import fp from 'fastify-plugin'

import { env } from '../config/env.js'

/**
 * Plugin de ETags para cache HTTP
 * Gera ETags automaticamente para respostas, permitindo cache eficiente
 * no browser e CDN, reduzindo tráfego de rede significativamente
 */
async function etagPlugin(fastify: FastifyInstance, _opts: FastifyPluginOptions) {
  try {
    await fastify.register(etag, {
      // Algoritmo de hash (padrão: 'sha1')
      // 'sha1' é mais rápido, 'sha256' é mais seguro
      algorithm: env.ETAG_ALGORITHM,

      // Força geração de ETag fraco (W/"...")
      // ETags fracos permitem comparação semântica (conteúdo equivalente)
      weak: env.ETAG_WEAK,
    })

    fastify.log.info(
      {
        algorithm: env.ETAG_ALGORITHM,
        weak: env.ETAG_WEAK,
      },
      'Plugin [etag] carregado com sucesso',
    )
  } catch (err) {
    fastify.log.error({ err }, 'Falha ao carregar o plugin [etag]')
    throw err
  }
}

export default fp(etagPlugin, {
  name: 'etag',
})
