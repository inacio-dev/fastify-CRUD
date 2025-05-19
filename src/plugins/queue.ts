import QueueFactory, { JobOptions } from 'bull'
import { FastifyPluginAsync } from 'fastify'
import fp from 'fastify-plugin'

import { logger } from '../core/logger'
import { environments } from '../environments/environments'
import {
  QueueRegistry,
  ScheduleConfig,
  ScheduleCronConfig,
  ScheduleEveryConfig,
  taskModules,
} from '../infrastructure/queue/registry'
import { convertEveryToMs } from '../utils/convert-every-to-ms'

declare module 'fastify' {
  interface FastifyInstance {
    queues: QueueRegistry
  }
}

function isEverySchedule(schedule: ScheduleConfig): schedule is ScheduleEveryConfig {
  return (
    'every' in schedule &&
    (typeof schedule.every === 'number' || typeof schedule.every === 'string')
  )
}

function isCronSchedule(schedule: ScheduleConfig): schedule is ScheduleCronConfig {
  return 'cron' in schedule && typeof schedule.cron === 'string'
}

async function removeEveryJob(queue: QueueFactory.Queue): Promise<void> {
  try {
    const repeatableJobs = await queue.getRepeatableJobs()

    for (const job of repeatableJobs) {
      await queue.removeRepeatableByKey(job.key)
    }
  } catch (error) {
    logger.error(`Erro ao remover jobs.`, error)
  }
}

// Função auxiliar para configurar um agendamento
async function configureSchedule(
  queue: QueueFactory.Queue,
  queueName: string,
  scheduleConfig: ScheduleConfig,
): Promise<void> {
  try {
    if (isCronSchedule(scheduleConfig)) {
      const jobOptions: JobOptions = {
        repeat: {
          cron: scheduleConfig.cron,
        },
        jobId: scheduleConfig.name || undefined,
      }

      await queue.add(scheduleConfig.jobData || {}, jobOptions)

      logger.info(
        `Tarefa ${scheduleConfig.name ? `'${scheduleConfig.name}' ` : ''}agendada para ${queueName}: ${scheduleConfig.cron}`,
      )
    } else if (isEverySchedule(scheduleConfig)) {
      const jobOptions: JobOptions = {
        repeat: {
          every: convertEveryToMs(scheduleConfig.every),
        },
        jobId: scheduleConfig.name || undefined,
      }

      await queue.add(scheduleConfig.jobData || {}, jobOptions)

      logger.info(
        `Tarefa ${scheduleConfig.name ? `'${scheduleConfig.name}' ` : ''}agendada para ${queueName}: ${scheduleConfig.every}`,
      )
    }
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err)
    logger.error(
      `Erro ao configurar agendamento para ${queueName}${scheduleConfig.name ? ` (${scheduleConfig.name})` : ''}: ${errorMessage}`,
    )
  }
}

const queuePlugin: FastifyPluginAsync = async (fastify) => {
  const queues: QueueRegistry = {}
  const redisConfig = {
    host: environments.REDIS_HOST,
    port: environments.REDIS_PORT,
    password: environments.REDIS_PASSWORD,
  }

  for (const [queueName, mod] of Object.entries(taskModules)) {
    const { process: processFn, schedule } = mod

    const queue = new QueueFactory(queueName, { redis: redisConfig })

    await removeEveryJob(queue)

    if (processFn) {
      queue.process(async (job) => {
        logger.info(`Processando ${queueName}: ${JSON.stringify(job.data)}`)
        return processFn(job, fastify)
      })
    }

    // Configuração para tarefas agendadas
    if (schedule) {
      // Converter para array para tratar uniformemente
      const schedules = Array.isArray(schedule) ? schedule : [schedule]

      // Configurar cada agendamento
      for (const scheduleConfig of schedules) {
        await configureSchedule(queue, queueName, scheduleConfig)
      }
    }

    queues[queueName] = queue
    logger.info(`Fila registrada: ${queueName}`)
  }

  fastify.decorate('queues', queues)
  fastify.addHook('onClose', async (instance) => {
    await Promise.all(Object.values(instance.queues).map((q) => q.close()))
  })
}

export default fp(queuePlugin, { name: 'queue' })
