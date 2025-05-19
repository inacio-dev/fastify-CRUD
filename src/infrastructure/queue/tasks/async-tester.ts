import { Job } from 'bull'

import { logger } from '../../../core/logger'

interface HealthCheckPayload {
  message?: string
}

export async function process(job: Job<HealthCheckPayload>) {
  try {
    const message = `Concluída a tarefa de sincronização.`
    job.update({
      ...job.data,
      message,
    })
    logger.info(`${message}`)
    return message
  } catch (error) {
    if (error instanceof Error) {
      logger.error(`Erro ao processar tarefa: ${error.message}`)
      logger.error(`Stack trace: ${error.stack}`)
    } else {
      logger.error(`Erro desconhecido ao processar tarefa: ${String(error)}`)
    }
  }
}

export const schedule = [
  {
    name: 'morning-sync',
    cron: '0 6 * * *', // 6:00 AM
    jobData: {
      message: 'Iniciando sincronização da manhã...',
    } as HealthCheckPayload,
  },
  {
    name: 'midday-sync',
    cron: '30 12 * * *', // 12:30 PM
    jobData: {
      message: 'Iniciando sincronização do meio-dia...',
    } as HealthCheckPayload,
  },
  {
    name: 'evening-sync',
    cron: '30 18 * * *', // 18:30 PM
    jobData: {
      message: 'Iniciando sincronização da tarde...',
    } as HealthCheckPayload,
  },
]
