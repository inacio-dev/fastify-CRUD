import { Job } from 'bull'

import { logger } from '../../../core/logger'
import { HealthCheckPayload } from '../../../types/tester'

export async function process(job: Job<HealthCheckPayload>) {
  try {
    const { uptime, timestamp, status, database } = job.data
    logger.info('📋 Healthcheck Test Task', {
      uptime,
      timestamp,
      status,
      database,
    })
    return { logged: true }
  } catch (error) {
    if (error instanceof Error) {
      logger.error(`Erro ao processar tarefa: ${error.message}`)
      logger.error(`Stack trace: ${error.stack}`)
    } else {
      logger.error(`Erro desconhecido ao processar tarefa: ${String(error)}`)
    }
  }
}
