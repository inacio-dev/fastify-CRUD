import type { FastifyInstance, FastifyPluginOptions } from 'fastify'

import { env } from '../../../config/env.js'
import { secureUpload } from '../../../helpers/secure-upload.js'

/**
 * Rota de upload com streaming e validações de segurança
 *
 * Segurança implementada:
 * - UUID rename (previne path traversal)
 * - Validação de tamanho
 * - Magic number verification (valida MIME real do arquivo)
 * - Virus scanning com ClamAV (se habilitado)
 *
 * Arquivo é processado em chunks via streaming, eficiente para arquivos grandes
 */
export default async function streamUploadRoute(
  fastify: FastifyInstance,
  _opts: FastifyPluginOptions,
) {
  fastify.post(
    '/stream',
    {
      schema: {
        description:
          'Upload seguro com streaming - adequado para arquivos grandes (eficiente em memória)',
        tags: ['upload'],
        consumes: ['multipart/form-data'],
        body: {
          type: 'object',
          required: ['file'],
          properties: {
            file: {
              type: 'string',
              format: 'binary',
            },
          },
        },
        response: {
          201: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' },
              file: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  originalName: { type: 'string' },
                  size: { type: 'number' },
                  mime: { type: 'string' },
                  url: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const data = await request.file()

      if (!data) {
        throw fastify.httpErrors.badRequest('Nenhum arquivo foi enviado')
      }

      try {
        // Upload seguro com streaming (helper usa pipeline internamente)
        const result = await secureUpload(
          data,
          {
            allowedMimes: env.UPLOAD_ALLOWED_MIMES,
            maxSize: env.UPLOAD_MAX_FILE_SIZE,
            uploadDir: env.UPLOAD_STORAGE_PATH,
            virusScanning: env.VIRUS_SCANNING_ENABLED,
          },
          fastify.clamscan,
        )

        fastify.log.info(
          {
            originalName: result.originalName,
            savedAs: result.filename,
            size: result.size,
            mime: result.mime,
            ip: request.ip,
          },
          'Upload realizado com sucesso (streaming)',
        )

        return reply.code(201).send({
          success: true,
          message: 'Upload realizado com sucesso',
          file: {
            id: result.filename,
            originalName: result.originalName,
            size: result.size,
            mime: result.mime,
            url: `/uploads/${result.filename}`,
          },
        })
      } catch (error) {
        // Log de segurança para tentativas bloqueadas
        fastify.log.warn(
          {
            error: error instanceof Error ? error.message : 'Erro desconhecido',
            ip: request.ip,
            filename: data.filename,
            mimetype: data.mimetype,
          },
          'Upload bloqueado por validação de segurança (streaming)',
        )

        throw fastify.httpErrors.badRequest(
          error instanceof Error ? error.message : 'Erro ao processar upload',
        )
      }
    },
  )
}
