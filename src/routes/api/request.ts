import type { FastifyInstance, FastifyPluginOptions } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

// Schema Zod para validar o body do request
const CreateUserRequestSchema = z.object({
  name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres').max(100),
  email: z.email('Email inválido').default('example@gmail.com'),
  age: z.number().int('Idade deve ser um número inteiro').min(18, 'Idade mínima é 18 anos'),
  role: z.enum(['admin', 'user', 'guest']).default('user'),
})

// Schema Zod para a resposta de sucesso
const ValidationSuccessResponseSchema = z.object({
  success: z.boolean().describe('Se a validação foi bem-sucedida'),
  message: z.string().describe('Mensagem de confirmação'),
  validatedData: z
    .object({
      name: z.string(),
      email: z.string(),
      age: z.number(),
      role: z.string(),
    })
    .describe('Dados validados pelo Zod'),
  timestamp: z.string().describe('Timestamp da validação'),
})

// Schema Zod para resposta de erro (400)
const ValidationErrorResponseSchema = z.object({
  statusCode: z.number(),
  error: z.string(),
  message: z.string(),
})

/**
 * Rota de teste de validação com Zod
 * Demonstra validação type-safe de requests usando Zod schemas
 */
export default async function requestRoutes(fastify: FastifyInstance, _opts: FastifyPluginOptions) {
  fastify.withTypeProvider<ZodTypeProvider>().post(
    '/request',
    {
      schema: {
        description: 'Rota de teste para validação de dados com Zod',
        tags: ['test'],
        body: CreateUserRequestSchema,
        response: {
          200: ValidationSuccessResponseSchema,
          400: ValidationErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      // ✅ request.body é type-safe! TypeScript conhece todos os tipos
      const { name, email, age, role } = request.body

      // Se chegou aqui, os dados já foram validados pelo Zod automaticamente
      // Qualquer dado inválido resulta em 400 automático antes de chegar aqui

      return reply.code(200).send({
        success: true,
        message: 'Dados validados com sucesso pelo Zod! ✅',
        validatedData: {
          name,
          email,
          age,
          role,
        },
        timestamp: new Date().toISOString(),
      })
    },
  )
}
