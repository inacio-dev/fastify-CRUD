import path from 'path'

import fastifyAutoload from '@fastify/autoload'
import fastifyCors from '@fastify/cors'
import fastifySwagger from '@fastify/swagger'
import fastifySwaggerUi from '@fastify/swagger-ui'
import fastify from 'fastify'

import { env } from './core/env'
import { logger } from './core/logger'

const app = fastify({
  loggerInstance: logger,
  disableRequestLogging: true,
})

app.register(fastifySwagger, {
  swagger: {
    info: {
      title: 'API Documentation',
      description: 'Documentação da API',
      version: '1.0.0',
    },
    host: `localhost:${env.PORT}`,
    schemes: ['http'],
    consumes: ['application/json'],
    produces: ['application/json'],
  },
})

app.register(fastifySwaggerUi, {
  routePrefix: '/docs',
  uiConfig: {
    docExpansion: 'full',
    deepLinking: false,
  },
})

app.register(fastifyCors, {
  origin: env.CORS_ORIGINS,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  credentials: true,
  maxAge: 86400,
})

app.register(fastifyAutoload, {
  dir: path.join(__dirname, 'plugins'),
  options: { prefix: '/api' },
})

app.register(fastifyAutoload, {
  dir: path.join(__dirname, 'routes'),
  options: { prefix: '/api' },
  dirNameRoutePrefix: true,
})

app.get('/', async () => {
  return {
    status: 'online',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      documentation: '/docs',
      api: '/api',
    },
  }
})

const start = async () => {
  try {
    const address = await app.listen({
      port: env.PORT,
      host: '0.0.0.0',
    })
    logger.info(`Servidor iniciado em ${address}`)
  } catch (err) {
    logger.error({ err }, 'Erro ao iniciar o servidor')
    process.exit(1)
  }
}

start()
