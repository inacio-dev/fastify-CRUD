import circuitBreaker from '@fastify/circuit-breaker'
import type { FastifyInstance, FastifyPluginOptions } from 'fastify'
import fp from 'fastify-plugin'

import { env } from '../config/env.js'

/**
 * Plugin de Circuit Breaker para proteger contra falhas em cascata
 *
 * Implementa o padrão Circuit Breaker para chamadas a serviços externos
 *
 * Estados:
 * - CLOSED: Funcionamento normal (requisições passam)
 * - OPEN: Serviço externo falhando (fail-fast, rejeita imediatamente)
 * - HALF-OPEN: Testando se serviço voltou (permite 1 requisição de teste)
 *
 * Previne:
 * - Timeout em cascata quando serviços externos caem
 * - Sobrecarga do servidor esperando respostas que nunca virão
 * - Efeito dominó (seu servidor cair porque API externa caiu)
 *
 * Uso em rotas:
 * ```typescript
 * const result = await fastify.circuitBreaker(async () => {
 *   return await fetch('https://api.externa.com/data')
 * })
 * ```
 */
async function circuitBreakerPlugin(fastify: FastifyInstance, _opts: FastifyPluginOptions) {
  try {
    await fastify.register(circuitBreaker, {
      // Número de falhas consecutivas antes de abrir o circuito
      threshold: env.CIRCUIT_BREAKER_THRESHOLD,

      // Timeout em ms para considerar requisição como falha
      timeout: env.CIRCUIT_BREAKER_TIMEOUT,

      // Tempo em ms que o circuito fica OPEN antes de tentar HALF-OPEN
      resetTimeout: env.CIRCUIT_BREAKER_RESET_TIMEOUT,
    })

    fastify.log.info(
      {
        threshold: env.CIRCUIT_BREAKER_THRESHOLD,
        timeout: `${env.CIRCUIT_BREAKER_TIMEOUT}ms`,
        resetTimeout: `${env.CIRCUIT_BREAKER_RESET_TIMEOUT}ms`,
      },
      'Plugin [circuit-breaker] carregado com sucesso',
    )
  } catch (err) {
    fastify.log.error({ err }, 'Falha ao carregar o plugin [circuit-breaker]')
    throw err
  }
}

export default fp(circuitBreakerPlugin, {
  name: 'circuit-breaker',
})
