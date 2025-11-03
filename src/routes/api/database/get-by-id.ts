import type { FastifyInstance, FastifyPluginOptions } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { userRepository } from '../../../db/repositories/user.repository.js'

const UserResponseSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  email: z.email().default('example@gmail.com'),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
})

const UserIdParamSchema = z.object({
  id: z.uuid(),
})

const ErrorResponseSchema = z.object({
  error: z.string(),
  message: z.string(),
})

export default async function getUserById(fastify: FastifyInstance, _opts: FastifyPluginOptions) {
  fastify.withTypeProvider<ZodTypeProvider>().get(
    '/:id',
    {
      schema: {
        description: 'Busca usuário por ID',
        tags: ['database'],
        params: UserIdParamSchema,
        response: {
          200: UserResponseSchema,
          404: ErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        const { id } = request.params
        const user = await userRepository.findById(id)

        if (!user) {
          return reply.code(404).send({
            error: 'Not Found',
            message: 'Usuário não encontrado',
          })
        }

        return reply.code(200).send({
          id: user.id,
          name: user.name.value,
          email: user.email.value,
          createdAt: user.createdAt.toISOString(),
          updatedAt: user.updatedAt.toISOString(),
        })
      } catch (error) {
        fastify.log.error({ err: error }, 'Erro ao buscar usuário')
        throw fastify.httpErrors.internalServerError('Erro ao buscar usuário')
      }
    },
  )
}
