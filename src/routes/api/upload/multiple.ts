import type { FastifyInstance, FastifyPluginOptions } from 'fastify'

import { env } from '../../../config/env.js'
import { secureUpload } from '../../../helpers/secure-upload.js'

// Tipo para arquivo enviado
interface UploadedFile {
  success: boolean
  id: string
  originalName: string
  size: number
  mime: string
  url: string
}

/**
 * Rota de upload múltiplo com validações de segurança
 *
 * Segurança implementada (para cada arquivo):
 * - UUID rename (previne path traversal)
 * - Validação de tamanho
 * - Magic number verification (valida MIME real)
 * - Virus scanning com ClamAV (se habilitado)
 *
 * Permite enviar vários arquivos em uma única requisição
 */
export default async function multipleUploadRoute(
  fastify: FastifyInstance,
  _opts: FastifyPluginOptions,
) {
  fastify.post(
    '/multiple',
    {
      schema: {
        description: 'Upload seguro de múltiplos arquivos com validações',
        tags: ['upload'],
        consumes: ['multipart/form-data'],
        body: {
          type: 'object',
          required: ['files'],
          properties: {
            files: {
              type: 'array',
              items: {
                type: 'string',
                format: 'binary',
              },
            },
          },
        },
        response: {
          201: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' },
              count: { type: 'number' },
              files: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
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
    },
    async (request, reply) => {
      const parts = request.parts()
      const uploadedFiles: UploadedFile[] = []
      const errors: { file: string; error: string }[] = []

      for await (const part of parts) {
        if (part.type === 'file') {
          try {
            // Validar limite de arquivos
            if (uploadedFiles.length >= env.UPLOAD_MAX_FILES) {
              errors.push({
                file: part.filename,
                error: `Máximo de ${env.UPLOAD_MAX_FILES} arquivos permitidos`,
              })
              continue
            }

            // Upload seguro com todas as validações
            const result = await secureUpload(
              part,
              {
                allowedMimes: env.UPLOAD_ALLOWED_MIMES,
                maxSize: env.UPLOAD_MAX_FILE_SIZE,
                uploadDir: env.UPLOAD_STORAGE_PATH,
                virusScanning: env.VIRUS_SCANNING_ENABLED,
              },
              fastify.clamscan,
            )

            uploadedFiles.push({
              success: true,
              id: result.filename,
              originalName: result.originalName,
              size: result.size,
              mime: result.mime,
              url: `/uploads/${result.filename}`,
            })

            fastify.log.info(
              {
                originalName: result.originalName,
                savedAs: result.filename,
                size: result.size,
                mime: result.mime,
              },
              'Arquivo carregado (múltiplo)',
            )
          } catch (error) {
            // Registra erro mas continua processando outros arquivos
            const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'

            errors.push({
              file: part.filename,
              error: errorMessage,
            })

            fastify.log.warn(
              {
                error: errorMessage,
                filename: part.filename,
                ip: request.ip,
              },
              'Arquivo rejeitado em upload múltiplo',
            )
          }
        }
      }

      // Validar se pelo menos um arquivo foi enviado
      if (uploadedFiles.length === 0 && errors.length === 0) {
        throw fastify.httpErrors.badRequest('Nenhum arquivo foi enviado')
      }

      // Se todos falharam, retornar erro
      if (uploadedFiles.length === 0 && errors.length > 0) {
        throw fastify.httpErrors.badRequest(
          `Todos os arquivos foram rejeitados: ${errors.map((e) => `${e.file} (${e.error})`).join(', ')}`,
        )
      }

      // Sucesso (total ou parcial)
      return reply.code(201).send({
        success: true,
        message:
          errors.length > 0
            ? `${uploadedFiles.length} arquivo(s) enviado(s), ${errors.length} rejeitado(s)`
            : `${uploadedFiles.length} arquivo(s) enviado(s) com sucesso`,
        count: uploadedFiles.length,
        files: uploadedFiles,
        ...(errors.length > 0 && { errors }),
      })
    },
  )
}
