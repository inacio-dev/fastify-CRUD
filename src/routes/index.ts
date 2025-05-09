import { FastifyInstance } from 'fastify'

import { logger } from '../core/logger'
import { HealthCheckPayload } from '../tasks/tester'

export default async function (fastify: FastifyInstance) {
  fastify.get(
    '/',
    {
      schema: {
        description: 'Verifica o status de saúde da aplicação',
        tags: ['System'],
        response: {
          200: {
            description: 'Aplicação está funcionando normalmente',
            type: 'object',
            properties: {
              uptime: { type: 'number', description: 'Tempo de execução em segundos' },
              timestamp: { type: 'number', description: 'Timestamp atual em milissegundos' },
              status: { type: 'string', description: 'Status da aplicação' },
              database: { type: 'string', description: 'Status da conexão com o banco de dados' },
            },
          },
          503: {
            description: 'Um ou mais serviços estão indisponíveis',
            type: 'object',
            properties: {
              uptime: { type: 'number' },
              timestamp: { type: 'number' },
              status: { type: 'string' },
              database: { type: 'string' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const healthcheck: HealthCheckPayload = {
        uptime: process.uptime(),
        timestamp: Date.now(),
        status: 'OK',
      }

      try {
        if (fastify.orm) {
          const isConnected = await fastify.orm.isConnected()
          healthcheck.database = isConnected ? 'connected' : 'disconnected'
        }

        await fastify.queues.tester.add(healthcheck)
        return healthcheck
      } catch (error) {
        logger.error({ err: error }, 'Erro ao verificar conexão com o banco de dados')

        healthcheck.status = 'ERROR'
        healthcheck.database = 'error'
        await fastify.queues.tester.add(healthcheck)
        return reply.status(503).send(healthcheck)
      }
    },
  )
}
