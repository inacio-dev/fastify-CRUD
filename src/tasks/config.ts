/* eslint-disable @typescript-eslint/no-explicit-any */

import QueueFactory, { Job } from 'bull'
import { FastifyInstance } from 'fastify'

import * as testTask from './test'

export type QueueInstance = InstanceType<typeof QueueFactory>

export interface TaskModule {
  process?: (job: Job, fastify: FastifyInstance) => Promise<unknown>
  onCompleted?: (job: Job, result: unknown) => void
  onFailed?: (job: Job, err: Error) => void
}
export type QueueRegistry = Record<string, any>

export const taskModules: Record<string, any> = {
  test: testTask,
}

export function onCompleted(job: Job) {
  console.log(`Job #${job.id} concluído.`)
}

export function onFailed(job: Job) {
  console.error(`Job #${job.id} falhou.`)
}
