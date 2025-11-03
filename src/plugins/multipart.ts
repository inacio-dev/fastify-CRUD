import fastifyMultipart from '@fastify/multipart'
import type { FastifyInstance, FastifyPluginOptions } from 'fastify'
import fp from 'fastify-plugin'

import { env } from '../config/env.js'

/**
 * Plugin de upload de arquivos
 * Habilita suporte a multipart/form-data para upload de arquivos com streaming
 */
async function multipartPlugin(fastify: FastifyInstance, _opts: FastifyPluginOptions) {
  try {
    await fastify.register(fastifyMultipart, {
      // Limites de upload
      limits: {
        fieldNameSize: 100, // Tamanho máximo do nome do campo
        fieldSize: 100, // Tamanho máximo do valor do campo (em bytes)
        fields: 10, // Número máximo de campos não-arquivo
        fileSize: env.UPLOAD_MAX_FILE_SIZE, // Tamanho máximo por arquivo (em bytes)
        files: env.UPLOAD_MAX_FILES, // Número máximo de arquivos por request
        headerPairs: 2000, // Número máximo de pares header
        parts: 1000, // Número máximo de parts (fields + files)
      },

      // Anexa os campos de texto ao body do request
      attachFieldsToBody: true,
    })

    fastify.log.info(
      {
        maxFileSize: `${Math.round(env.UPLOAD_MAX_FILE_SIZE / 1024 / 1024)}MB`,
        maxFiles: env.UPLOAD_MAX_FILES,
        allowedMimes: env.UPLOAD_ALLOWED_MIMES.join(', '),
      },
      'Plugin [multipart] carregado com sucesso',
    )
  } catch (err) {
    fastify.log.error({ err }, 'Falha ao carregar o plugin [multipart]')
    throw err
  }
}

export default fp(multipartPlugin, {
  name: 'multipart',
})
