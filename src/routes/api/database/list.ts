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

export default async function listUsers(fastify: FastifyInstance, _opts: FastifyPluginOptions) {
  fastify.withTypeProvider<ZodTypeProvider>().get(
    '/',
    {
      schema: {
        description: 'Lista todos os usuários',
        tags: ['database'],
        response: {
          200: z.array(UserResponseSchema),
        },
      },
    },
    async (_request, reply) => {
      try {
        const users = await userRepository.findAll()

        return reply.code(200).send(
          users.map((user) => ({
            id: user.id,
            name: user.name.value,
            email: user.email.value,
            createdAt: user.createdAt.toISOString(),
            updatedAt: user.updatedAt.toISOString(),
          })),
        )
      } catch (error) {
        fastify.log.error({ err: error }, 'Erro ao listar usuários')
        throw fastify.httpErrors.internalServerError('Erro ao listar usuários')
      }
    },
  )
}
