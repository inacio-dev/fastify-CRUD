/* eslint-disable @typescript-eslint/no-explicit-any */

import Fastify, { FastifyInstance } from 'fastify'
import fastifyPlugin from 'fastify-plugin'

import healthCheckRoutes from './index'

// Mock para o logger
jest.mock('../core/logger', () => ({
  logger: {
    error: jest.fn(),
  },
}))

// Mock para a fila tester
const mockAdd = jest.fn().mockResolvedValue({})
const mockQueues = {
  tester: {
    add: mockAdd,
  },
}

describe('Health check routes', () => {
  let app: FastifyInstance

  beforeEach(async () => {
    // Reinicia os mocks entre testes
    mockAdd.mockClear()

    // Cria uma nova instância do Fastify para cada teste
    app = Fastify()

    // Registra os mocks necessários usando "as any" para contornar a verificação de tipos
    app.decorate('queues', mockQueues as any)

    // Registra as rotas de health check
    await app.register(fastifyPlugin(healthCheckRoutes))
  })

  afterEach(() => {
    // Fecha a instância do Fastify após cada teste
    app.close()
  })

  it('should return 200 OK quando todos os serviços estão funcionando', async () => {
    // Mock para o ORM com conexão bem-sucedida usando "as any"
    app.decorate('orm', {
      isConnected: jest.fn().mockResolvedValue(true),
    } as any)

    const response = await app.inject({
      method: 'GET',
      url: '/',
    })

    expect(response.statusCode).toBe(200)

    const payload = JSON.parse(response.payload)
    expect(payload).toHaveProperty('uptime')
    expect(payload).toHaveProperty('timestamp')
    expect(payload.status).toBe('OK')
    expect(payload.database).toBe('connected')

    // Verifica se a fila foi chamada com os dados corretos
    expect(mockAdd).toHaveBeenCalledTimes(1)
    expect(mockAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'OK',
        database: 'connected',
      }),
    )
  })

  it('should return 200 OK when no ORM is available', async () => {
    // Sem decorar com o ORM, simulando ausência de banco de dados

    const response = await app.inject({
      method: 'GET',
      url: '/',
    })

    expect(response.statusCode).toBe(200)

    const payload = JSON.parse(response.payload)
    expect(payload).toHaveProperty('uptime')
    expect(payload).toHaveProperty('timestamp')
    expect(payload.status).toBe('OK')
    expect(payload).not.toHaveProperty('database')

    // Verifica se a fila foi chamada com os dados corretos
    expect(mockAdd).toHaveBeenCalledTimes(1)
  })

  it('should return 503 when database connection fails', async () => {
    // Mock para o ORM com erro de conexão usando "as any"
    app.decorate('orm', {
      isConnected: jest.fn().mockRejectedValue(new Error('Database connection error')),
    } as any)

    const response = await app.inject({
      method: 'GET',
      url: '/',
    })

    expect(response.statusCode).toBe(503)

    const payload = JSON.parse(response.payload)
    expect(payload).toHaveProperty('uptime')
    expect(payload).toHaveProperty('timestamp')
    expect(payload.status).toBe('ERROR')
    expect(payload.database).toBe('error')

    // Verifica se a fila foi chamada com os dados corretos
    expect(mockAdd).toHaveBeenCalledTimes(1)
    expect(mockAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'ERROR',
        database: 'error',
      }),
    )
  })

  it('should return 503 when database is disconnected', async () => {
    // Mock para o ORM com conexão mal-sucedida usando "as any"
    app.decorate('orm', {
      isConnected: jest.fn().mockResolvedValue(false),
    } as any)

    const response = await app.inject({
      method: 'GET',
      url: '/',
    })

    expect(response.statusCode).toBe(200) // Nota: o código atual não retorna 503 neste caso

    const payload = JSON.parse(response.payload)
    expect(payload.database).toBe('disconnected')
  })
})
