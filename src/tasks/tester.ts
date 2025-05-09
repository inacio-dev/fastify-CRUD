import { Job } from 'bull'

import { logger } from '../core/logger'

export interface HealthCheckPayload {
  uptime: number
  timestamp: number
  status: 'OK' | 'ERROR'
  database?: 'connected' | 'disconnected' | 'error'
}

export async function process(job: Job<HealthCheckPayload>) {
  const { uptime, timestamp, status, database } = job.data
  logger.info('📋 Healthcheck Test Task', {
    uptime,
    timestamp,
    status,
    database,
  })
  return { logged: true }
}
