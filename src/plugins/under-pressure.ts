import underPressure from '@fastify/under-pressure'
import type { FastifyInstance, FastifyPluginOptions } from 'fastify'
import fp from 'fastify-plugin'

import { env } from '../config/env.js'

/**
 * Plugin de monitoramento de saúde do servidor
 * Retorna 503 Service Unavailable quando o servidor está sobrecarregado
 * Previne crashes por falta de recursos (CPU, memória, event loop)
 * IMPORTANTE: Só é ativado em produção para evitar overhead desnecessário em desenvolvimento
 */
async function underPressurePlugin(fastify: FastifyInstance, _opts: FastifyPluginOptions) {
  try {
    // Só ativa em produção
    if (env.NODE_ENV !== 'production') {
      fastify.log.info('Plugin [under-pressure] desabilitado em desenvolvimento')
      return
    }

    await fastify.register(underPressure, {
      // Delay máximo do event loop em ms (1000ms = servidor está bloqueado)
      maxEventLoopDelay: env.UNDER_PRESSURE_MAX_EVENT_LOOP_DELAY,

      // Memória heap máxima em bytes (100MB padrão)
      maxHeapUsedBytes: env.UNDER_PRESSURE_MAX_HEAP_USED_BYTES,

      // Memória RSS máxima em bytes (200MB padrão)
      maxRssBytes: env.UNDER_PRESSURE_MAX_RSS_BYTES,

      // Event Loop Utilization máximo (0.98 = 98% ocupado)
      maxEventLoopUtilization: env.UNDER_PRESSURE_MAX_EVENT_LOOP_UTILIZATION,

      // Intervalo de verificação de saúde em ms
      healthCheckInterval: env.UNDER_PRESSURE_HEALTH_CHECK_INTERVAL,

      // Mensagem customizada quando servidor está sobrecarregado
      message: 'Servidor temporariamente sobrecarregado. Tente novamente em alguns instantes.',

      // Header Retry-After em segundos
      retryAfter: 50,
    })

    fastify.log.info(
      {
        maxEventLoopDelay: `${env.UNDER_PRESSURE_MAX_EVENT_LOOP_DELAY}ms`,
        maxHeapUsed: `${Math.round(env.UNDER_PRESSURE_MAX_HEAP_USED_BYTES / 1024 / 1024)}MB`,
        maxRss: `${Math.round(env.UNDER_PRESSURE_MAX_RSS_BYTES / 1024 / 1024)}MB`,
        maxEventLoopUtilization: `${env.UNDER_PRESSURE_MAX_EVENT_LOOP_UTILIZATION * 100}%`,
        healthCheckInterval: `${env.UNDER_PRESSURE_HEALTH_CHECK_INTERVAL}ms`,
      },
      'Plugin [under-pressure] carregado com sucesso',
    )
  } catch (err) {
    fastify.log.error({ err }, 'Falha ao carregar o plugin [under-pressure]')
    throw err
  }
}

export default fp(underPressurePlugin, {
  name: 'under-pressure',
})
