import type { FastifyInstance } from 'fastify'
import { exec } from 'node:child_process'
import { promisify } from 'node:util'
import { loggerService } from '@logger'
import { LOG_MODULE } from '@shared/config/logger'
import { AsyncTask, SimpleIntervalJob } from 'toad-scheduler'

const logger = loggerService.withContext(LOG_MODULE.FASTIFY)
const execAsync = promisify(exec)

const PING_TARGET = '192.168.1.78'
const PING_JOB_ID = 'core-ping-192-168-1-78'
const PING_INTERVAL_SECONDS = 60

function createPingTask(): AsyncTask {
  return new AsyncTask(
    'core:ping-192-168-1-78',
    async () => {
      const command = `ping -n 1 ${PING_TARGET}`
      const { stdout } = await execAsync(command)
      logger.info(`Ping ${PING_TARGET} success: ${stdout}`)
    },
    (error) => {
      logger.error(`Ping ${PING_TARGET} failed: ${(error as Error).message}`)
    },
  )
}

function createPingJob(task: AsyncTask): SimpleIntervalJob {
  return new SimpleIntervalJob({ seconds: PING_INTERVAL_SECONDS }, task, {
    id: PING_JOB_ID,
    preventOverrun: true,
  })
}

function registerPingJob(scheduler: any): void {
  const pingTask = createPingTask()
  const pingJob = createPingJob(pingTask)
  scheduler.addSimpleIntervalJob(pingJob)
}

export function registerCoreTasks(server: FastifyInstance): void {
  const scheduler = (server as any).scheduler
  if (!scheduler) { return }

  registerPingJob(scheduler)
}
