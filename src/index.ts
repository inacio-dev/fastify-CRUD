import 'dotenv/config'

import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

import autoload from '@fastify/autoload'
import Fastify from 'fastify'

import { env } from './config/env.js'
import { loggerConfig } from './config/logger.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = join(__filename, '..')

const fastify = Fastify({
  logger: loggerConfig,
  disableRequestLogging: true,
})

try {
  // Carrega todos os plugins da pasta plugins/
  await fastify.register(autoload, {
    dir: join(__dirname, 'plugins'),
    options: {
      logLevel: 'info',
    },
  })

  fastify.addHook('onReady', async function () {
    fastify.log.info('Todos os plugins foram carregados com sucesso')
  })

  // Carrega todas as rotas da pasta routes/
  await fastify.register(autoload, {
    dir: join(__dirname, 'routes'),
    options: {
      logLevel: 'info',
    },
    dirNameRoutePrefix: true,
  })

  fastify.addHook('onReady', async function () {
    fastify.log.info('Todas as rotas foram carregadas com sucesso')
  })
} catch (err) {
  fastify.log.error({ err }, 'Falha ao carregar plugins/rotas - encerrando aplicação')
  process.exit(1)
}

const start = async () => {
  try {
    await fastify.listen({
      port: env.PORT,
      host: env.HOST,
    })
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

start()
