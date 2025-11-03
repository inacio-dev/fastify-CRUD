import type { FastifyInstance, FastifyPluginOptions } from 'fastify'
import fp from 'fastify-plugin'
import { serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod'

/**
 * Plugin de validação com Zod
 * Integra Zod com Fastify para validação type-safe de schemas de rotas
 * Permite usar schemas Zod para validar body, params, query e headers
 */
async function zodValidatorPlugin(fastify: FastifyInstance, _opts: FastifyPluginOptions) {
  try {
    // Configura o validador para usar Zod
    fastify.setValidatorCompiler(validatorCompiler)

    // Configura o serializador para usar Zod
    fastify.setSerializerCompiler(serializerCompiler)

    fastify.log.info('Plugin [zod-validator] carregado com sucesso')
  } catch (err) {
    fastify.log.error({ err }, 'Falha ao carregar o plugin [zod-validator]')
    throw err
  }
}

export default fp(zodValidatorPlugin, {
  name: 'zod-validator',
})
