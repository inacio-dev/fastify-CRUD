import type { FastifyInstance, FastifyPluginOptions } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import packageJson from '../../package.json' with { type: 'json' }

// Schema Zod para a resposta de health check
const HealthCheckResponseSchema = z.object({
  status: z.string().describe('Status do servidor'),
  version: z.string().describe('Versão da aplicação'),
  timestamp: z.string().describe('Data e hora da resposta (ISO 8601)'),
  name: z.string().describe('Nome da aplicação'),
  framework: z.string().describe('Framework utilizado'),
  endpoints: z
    .object({
      api: z.string().describe('Endpoint base da API'),
    })
    .describe('Endpoints disponíveis'),
})

/**
 * Rota raiz - Health check
 * Retorna informações básicas do sistema e status do servidor
 */
export default async function healthRoutes(fastify: FastifyInstance, _opts: FastifyPluginOptions) {
  fastify.withTypeProvider<ZodTypeProvider>().get(
    '/',
    {
      schema: {
        description: 'Health check e informações do sistema',
        tags: ['health'],
        response: {
          200: HealthCheckResponseSchema,
        },
      },
    },
    async (_request, reply) => {
      return reply.send({
        status: 'online',
        version: packageJson.version,
        timestamp: new Date().toISOString(),
        name: packageJson.name,
        framework: 'Fastify',
        endpoints: {
          api: '/api',
        },
      })
    },
  )
}
