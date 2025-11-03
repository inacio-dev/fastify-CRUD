import type { FastifyInstance, FastifyPluginOptions } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

/**
 * DELETE /cache/clear - Limpa TODO o cache do sistema
 *
 * ⚠️ CUIDADO: Esta operação remove TODO o cache, não apenas o da demo
 * Use apenas para testes ou manutenção
 */

const ClearResponseSchema = z.object({
  message: z.string(),
  cleared: z.boolean(),
})

export default async function cacheClearRoute(
  fastify: FastifyInstance,
  _opts: FastifyPluginOptions,
) {
  fastify.withTypeProvider<ZodTypeProvider>().delete(
    '/clear',
    {
      schema: {
        description: 'Limpa TODO o cache do sistema (use com cuidado!)',
        tags: ['cache'],
        response: {
          200: ClearResponseSchema,
        },
      },
    },
    async (_request, reply) => {
      await fastify.cache.clear()

      return reply.code(200).send({
        message: 'TODO o cache foi limpo',
        cleared: true,
      })
    },
  )
}
