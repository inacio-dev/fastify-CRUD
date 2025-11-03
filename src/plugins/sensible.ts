import sensible from '@fastify/sensible'
import type { FastifyInstance, FastifyPluginOptions } from 'fastify'
import fp from 'fastify-plugin'

/**
 * Plugin Sensible
 * Adiciona utilitários sensatos e manipuladores de erro HTTP padronizados
 * Fornece métodos como httpErrors.notFound(), httpErrors.badRequest() e assertions úteis
 */
async function sensiblePlugin(fastify: FastifyInstance, _opts: FastifyPluginOptions) {
  try {
    await fastify.register(sensible)

    fastify.log.info('Plugin [sensible] carregado com sucesso')
  } catch (err) {
    fastify.log.error({ err }, 'Falha ao carregar o plugin [sensible]')
    throw err
  }
}

export default fp(sensiblePlugin, {
  name: 'sensible',
})
