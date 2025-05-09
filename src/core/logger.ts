import fs from 'fs'
import path from 'path'

import pino from 'pino'
import pretty from 'pino-pretty'
import { createStream } from 'rotating-file-stream'

import { env } from './env'

const logDir = path.join(process.cwd(), 'logs')
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true })
}

const loggerOptions = {
  level: env.DEBUG ? 'debug' : 'info',
  formatters: {
    level: (label: string) => {
      return { level: label.toUpperCase() }
    },
  },
  timestamp: () => `,"time":"${new Date().toISOString()}"`,
}

const rotatingLogStream = createStream('app.log', {
  size: '5M',
  maxFiles: 3,
  path: logDir,
  compress: false,
  interval: '3d',
})

const transportPattern = {
  translateTime: 'yyyy-mm-dd HH:MM:ss',
  messageFormat: '[{level}] {msg}',
  ignore: 'hostname,pid',
  levelFirst: true,
}

const fileTransport = pretty({
  destination: rotatingLogStream,
  colorize: false,
  ...transportPattern,
})

const consoleTransport = pretty({ colorize: true, ...transportPattern })

export const logger = pino(
  loggerOptions,
  pino.multistream([{ stream: fileTransport }, { stream: consoleTransport }]),
)
