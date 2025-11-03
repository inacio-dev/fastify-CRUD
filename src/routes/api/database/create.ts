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

const CreateUserSchema = z.object({
  name: z.string().min(3).max(100),
  email: z.email().default('example@gmail.com'),
})

const ErrorResponseSchema = z.object({
  error: z.string(),
  message: z.string(),
})

export default async function createUser(fastify: FastifyInstance, _opts: FastifyPluginOptions) {
  const userRepository = createUserRepository(fastify)

  fastify.withTypeProvider<ZodTypeProvider>().post(
    '/',
    {
      schema: {
        description: 'Cria um novo usuário',
        tags: ['database'],
        body: CreateUserSchema,
        response: {
          201: UserResponseSchema,
          400: ErrorResponseSchema,
          409: ErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        const { name, email } = request.body

        const emailVO = Email.create(email)
        const existing = await userRepository.findByEmail(emailVO)

        if (existing) {
          return reply.code(409).send({
            error: 'Conflict',
            message: 'Email já cadastrado',
          })
        }

        // Auditoria acontece automaticamente no repository
        const user = await userRepository.create({ name, email })

        return reply.code(201).send({
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

        fastify.log.error({ err: error }, 'Erro ao criar usuário')
        throw fastify.httpErrors.internalServerError('Erro ao criar usuário')
      }
    },
  )
}
