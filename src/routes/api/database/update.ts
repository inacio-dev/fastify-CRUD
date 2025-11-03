import type { FastifyInstance, FastifyPluginOptions } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { createUserRepository } from '../../../db/repositories/user.repository.js'
import { Email } from '../../../db/value-objects/email.js'

const UserResponseSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  email: z.email().default('example@gmail.com'),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
})

const UpdateUserSchema = z.object({
  name: z.string().min(3).max(100).optional(),
  email: z.email().default('example@gmail.com').optional(),
})

const UserIdParamSchema = z.object({
  id: z.uuid(),
})

const ErrorResponseSchema = z.object({
  error: z.string(),
  message: z.string(),
})

export default async function updateUser(fastify: FastifyInstance, _opts: FastifyPluginOptions) {
  const userRepository = createUserRepository(fastify)

  fastify.withTypeProvider<ZodTypeProvider>().patch(
    '/:id',
    {
      schema: {
        description: 'Atualiza dados de um usuário',
        tags: ['database'],
        params: UserIdParamSchema,
        body: UpdateUserSchema,
        response: {
          200: UserResponseSchema,
          400: ErrorResponseSchema,
          404: ErrorResponseSchema,
          409: ErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        const { id } = request.params
        const { name, email } = request.body

        const existing = await userRepository.findById(id)

        if (!existing) {
          return reply.code(404).send({
            error: 'Not Found',
            message: 'Usuário não encontrado',
          })
        }

        if (email) {
          const emailVO = Email.create(email)
          const emailExists = await userRepository.findByEmail(emailVO)

          if (emailExists && emailExists.id !== id) {
            return reply.code(409).send({
              error: 'Conflict',
              message: 'Email já cadastrado por outro usuário',
            })
          }
        }

        // Auditoria acontece automaticamente no repository
        const user = await userRepository.update(id, { name, email })

        return reply.code(200).send({
          id: user.id,
          name: user.name.value,
          email: user.email.value,
          createdAt: user.createdAt.toISOString(),
          updatedAt: user.updatedAt.toISOString(),
        })
      } catch (error) {
        if (error instanceof Error) {
          if (
            error.message.includes('Nome') ||
            error.message.includes('Email') ||
            error.message.includes('auditoria')
          ) {
            return reply.code(400).send({
              error: 'Bad Request',
              message: error.message,
            })
          }
        }

        fastify.log.error({ err: error }, 'Erro ao atualizar usuário')
        throw fastify.httpErrors.internalServerError('Erro ao atualizar usuário')
      }
    },
  )
}
