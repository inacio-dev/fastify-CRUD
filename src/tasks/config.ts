import QueueFactory, { Job } from 'bull'
import { FastifyInstance } from 'fastify'

import * as testerTask from './tester'

type QueueInstance = InstanceType<typeof QueueFactory>

interface TaskModule {
  process?: (job: Job, fastify: FastifyInstance) => Promise<unknown>
  onCompleted?: (job: Job, result: unknown) => void
  onFailed?: (job: Job, err: Error) => void
}
export type QueueRegistry = Record<string, QueueInstance>

export const taskModules: Record<string, TaskModule> = {
  tester: testerTask,
}

export function onCompleted(job: Job) {
  console.log(`Job #${job.id} concluído.`)
}

export function onFailed(job: Job) {
  console.error(`Job #${job.id} falhou.`)
}
