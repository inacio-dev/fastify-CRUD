import QueueFactory from 'bull'
import { FastifyPluginAsync } from 'fastify'
import fp from 'fastify-plugin'

import { env } from '../core/env'
import { QueueRegistry, taskModules } from '../tasks/config'

declare module 'fastify' {
  interface FastifyInstance {
    queues: QueueRegistry
  }
}

const queuePlugin: FastifyPluginAsync = async (fastify) => {
  const queues: QueueRegistry = {}
  const redisConfig = {
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
    password: env.REDIS_PASSWORD,
  }

  for (const [queueName, mod] of Object.entries(taskModules)) {
    const { process: processFn, onCompleted: onCompletedFn, onFailed: onFailedFn } = mod

    if (!processFn && !onCompletedFn && !onFailedFn) {
      fastify.log.warn(`Nenhum handler para fila "${queueName}", pulando.`)
      continue
    }

    const queue = new QueueFactory(queueName, { redis: redisConfig })

    if (processFn) {
      queue.process(async (job) => {
        fastify.log.info(`Processando ${queueName}: ${JSON.stringify(job.data)}`)
        return processFn(job, fastify)
      })
    }
    if (onCompletedFn) queue.on('completed', onCompletedFn)
    if (onFailedFn) queue.on('failed', onFailedFn)

    queues[queueName] = queue
    fastify.log.info(`Fila registrada: ${queueName}`)
  }

  fastify.decorate('queues', queues)
  fastify.addHook('onClose', async (instance) => {
    await Promise.all(Object.values(instance.queues).map((q) => q.close()))
  })
}

export default fp(queuePlugin, { name: 'queue' })
