import QueueFactory, { Job } from 'bull'
import { FastifyInstance } from 'fastify'

import * as asyncTesterTask from './tasks/async-tester'
import * as testerTask from './tasks/tester'

type QueueInstance = InstanceType<typeof QueueFactory>

export interface ScheduleCronConfig {
  name?: string // Nome opcional para identificar o agendamento
  cron: string
  jobData?: unknown
}

export interface ScheduleEveryConfig {
  name?: string // Nome opcional para identificar o agendamento
  every: number | string
  jobData?: unknown
}

// Tipo de união para representar qualquer tipo de configuração de agendamento
export type ScheduleConfig = ScheduleCronConfig | ScheduleEveryConfig

interface TaskModule {
  process?: (job: Job, fastify: FastifyInstance) => Promise<unknown>
  schedule?: ScheduleConfig | ScheduleConfig[] // Agora aceita um único agendamento ou um array
}

export type QueueRegistry = Record<string, QueueInstance>

export const taskModules: Record<string, TaskModule> = {
  tester: testerTask,
  asyncTester: asyncTesterTask,
}
