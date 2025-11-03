import type { FastifyInstance, FastifyPluginOptions } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { createUserRepository } from '../../../db/repositories/user.repository.js'

const UserIdParamSchema = z.object({
  id: z.uuid(),
})

const ErrorResponseSchema = z.object({
  error: z.string(),
  message: z.string(),
})

export default async function deleteUser(fastify: FastifyInstance, _opts: FastifyPluginOptions) {
  const userRepository = createUserRepository(fastify)

  fastify.withTypeProvider<ZodTypeProvider>().delete(
    '/:id',
    {
      schema: {
        description: 'Remove um usuário',
        tags: ['database'],
        params: UserIdParamSchema,
        response: {
          204: z.void(),
          404: ErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        const { id } = request.params

        const existing = await userRepository.findById(id)

        if (!existing) {
          return reply.code(404).send({
            error: 'Not Found',
            message: 'Usuário não encontrado',
          })
        }

        // Auditoria acontece automaticamente no repository
        await userRepository.delete(id)

        return reply.code(204).send()
      } catch (error) {
        fastify.log.error({ err: error }, 'Erro ao remover usuário')

        if (error instanceof Error && error.message.includes('auditoria')) {
          throw fastify.httpErrors.internalServerError(error.message)
        }

        throw fastify.httpErrors.internalServerError('Erro ao remover usuário')
      }
    },
  )
}
