import type { FastifyInstance, FastifyPluginOptions } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

/**
 * GET /cache - Retorna número aleatório cacheado por 5 minutos
 *
 * Como testar:
 * 1. GET /cache várias vezes → retorna o mesmo número (X-Cache-Status: HIT)
 * 2. POST /cache/invalidate para limpar o cache
 * 3. GET /cache → retorna novo número (X-Cache-Status: MISS)
 *
 * Para debug sem cache:
 * - curl -H "X-No-Cache: true" http://localhost:3333/api/cache
 * - Ou configure CACHE_ENABLED=false no .env
 */

const RandomDataSchema = z.object({
  message: z.string(),
  randomNumber: z.number(),
  timestamp: z.string(),
  cached: z.boolean(),
})

export default async function cacheGetRoute(fastify: FastifyInstance, _opts: FastifyPluginOptions) {
  fastify.withTypeProvider<ZodTypeProvider>().get(
    '/',
    {
      schema: {
        description: 'Retorna número aleatório cacheado por 5 minutos',
        tags: ['cache'],
        response: {
          200: RandomDataSchema,
        },
      },
      config: {
        cache: {
          ttl: 300, // 5 minutos (300 segundos)
          tags: ['demo-cache'], // Tag para invalidação
        },
      },
    },
    async (_request, reply) => {
      const randomNumber = Math.floor(Math.random() * 1000000)
      const cacheStatus = reply.getHeader('X-Cache-Status')

      return {
        message: 'Número aleatório gerado (ou cacheado)',
        randomNumber,
        timestamp: new Date().toISOString(),
        cached: cacheStatus === 'HIT',
      }
    },
  )
}
