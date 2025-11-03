import type { FastifyInstance, FastifyPluginOptions } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

/**
 * POST /cache/invalidate - Invalida o cache da rota GET /cache
 *
 * Invalida todas as rotas com a tag 'demo-cache'
 * Após chamar este endpoint, o próximo GET /cache retornará um novo número
 */

const InvalidateResponseSchema = z.object({
  message: z.string(),
  invalidated: z.boolean(),
})

export default async function cacheInvalidateRoute(
  fastify: FastifyInstance,
  _opts: FastifyPluginOptions,
) {
  fastify.withTypeProvider<ZodTypeProvider>().post(
    '/invalidate',
    {
      schema: {
        description: 'Invalida o cache da rota GET /cache',
        tags: ['cache'],
        response: {
          200: InvalidateResponseSchema,
        },
      },
    },
    async (_request, reply) => {
      // Invalida todas as rotas com a tag 'demo-cache'
      await fastify.cache.invalidate(['demo-cache'])

      return reply.code(200).send({
        message: 'Cache invalidado com sucesso! Próximo GET retornará novo número.',
        invalidated: true,
      })
    },
  )
}
