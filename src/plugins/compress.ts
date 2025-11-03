import { constants } from 'node:zlib'

import compress from '@fastify/compress'
import type { FastifyInstance, FastifyPluginOptions } from 'fastify'
import fp from 'fastify-plugin'

import { env } from '../config/env.js'

/**
 * Plugin de compressão de respostas
 * Comprime respostas HTTP usando gzip, deflate ou brotli para reduzir banda e melhorar performance
 */
async function compressPlugin(fastify: FastifyInstance, _opts: FastifyPluginOptions) {
  try {
    const threshold = env.COMPRESS_THRESHOLD

    await fastify.register(compress, {
      global: true, // Comprime todas as respostas automaticamente
      threshold, // Tamanho mínimo em bytes para comprimir (padrão: 1KB)
      encodings: ['br', 'gzip', 'deflate'], // br = brotli (melhor compressão)
      brotliOptions: {
        params: {
          [constants.BROTLI_PARAM_MODE]: constants.BROTLI_MODE_TEXT,
          [constants.BROTLI_PARAM_QUALITY]: 4, // 0-11 (4 = bom balanço)
        },
      },
      zlibOptions: {
        level: 6, // 0-9 (6 = bom balanço entre velocidade e compressão)
      },
    })

    fastify.log.info({ threshold: `${threshold} bytes` }, 'Plugin [compress] carregado com sucesso')
  } catch (err) {
    fastify.log.error({ err }, 'Falha ao carregar o plugin [compress]')
    throw err
  }
}

export default fp(compressPlugin, {
  name: 'compress',
})
