import type { FastifyInstance, FastifyPluginOptions } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

const HealthResponseSchema = z.object({
  status: z.enum(['ok', 'degraded']),
  timestamp: z.string(),
  uptime: z.number(),
  environment: z.string(),
  metrics: z.object({
    memory: z.object({
      heapUsed: z.number(),
      heapTotal: z.number(),
      rss: z.number(),
      external: z.number(),
    }),
    eventLoop: z
      .object({
        delay: z.number(),
        utilization: z.number(),
      })
      .optional(),
  }),
})

/**
 * Endpoint de health check e métricas do servidor
 * Retorna informações sobre saúde e performance do sistema
 */
export default async function healthRoute(fastify: FastifyInstance, _opts: FastifyPluginOptions) {
  fastify.withTypeProvider<ZodTypeProvider>().get(
    '/health',
    {
      schema: {
        description: 'Health check e métricas do servidor (memória, CPU, uptime)',
        tags: ['health'],
        response: {
          200: HealthResponseSchema,
        },
      },
    },
    async (_request, reply) => {
      const mem = process.memoryUsage()

      // Tenta obter métricas do under-pressure (só disponível em produção)
      let eventLoopMetrics: { delay: number; utilization: number } | undefined

      // O @fastify/under-pressure adiciona o decorator memoryUsage quando ativo
      if ('memoryUsage' in fastify && typeof fastify.memoryUsage === 'function') {
        try {
          const upMetrics = fastify.memoryUsage()
          eventLoopMetrics = {
            delay: upMetrics.eventLoopDelay,
            utilization: upMetrics.eventLoopUtilized,
          }
        } catch {
          // Under-pressure não disponível ou não ativo
        }
      }

      return reply.code(200).send({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
        metrics: {
          memory: {
            heapUsed: mem.heapUsed,
            heapTotal: mem.heapTotal,
            rss: mem.rss,
            external: mem.external,
          },
          ...(eventLoopMetrics && { eventLoop: eventLoopMetrics }),
        },
      })
    },
  )
}
