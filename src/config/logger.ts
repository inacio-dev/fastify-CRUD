import { join } from 'node:path'

import type { PinoLoggerOptions } from 'fastify/types/logger.js'

import { env } from './env.js'

const isDevelopment = env.NODE_ENV !== 'production'
const logLevel = env.LOG_LEVEL
const logsDir = env.LOGS_DIR

/**
 * Configuração do logger Pino
 * - Development: Pretty print no console
 * - Production: JSON logs em arquivos rotativos usando pino-roll
 */
export const loggerConfig: PinoLoggerOptions = isDevelopment
  ? // Development: Pretty print para leitura fácil
    {
      level: logLevel,
      transport: {
        target: 'pino-pretty',
        options: {
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname',
          colorize: true,
          singleLine: false,
        },
      },
    }
  : // Production: Logs rotativos com pino-roll
    {
      level: logLevel,
      transport: {
        target: 'pino-roll',
        options: {
          file: join(logsDir, 'app.log'),
          frequency: 'daily',
          dateFormat: 'yyyy-MM-dd',
          size: '10m',
          mkdir: true,
          limit: {
            count: 7,
          },
        },
      },
    }
