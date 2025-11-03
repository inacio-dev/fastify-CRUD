import swagger from '@fastify/swagger'
import swaggerUi from '@fastify/swagger-ui'
import type { FastifyInstance, FastifyPluginOptions } from 'fastify'
import fp from 'fastify-plugin'
import { jsonSchemaTransform } from 'fastify-type-provider-zod'

import packageJson from '../../package.json' with { type: 'json' }
import { env } from '../config/env.js'

/**
 * Plugin de documentação Swagger/OpenAPI
 * Gera documentação interativa da API automaticamente
 * Acesse em /documentation para visualizar e testar os endpoints
 * IMPORTANTE: Só é carregado em desenvolvimento, não em produção por segurança
 */
async function swaggerPlugin(fastify: FastifyInstance, _opts: FastifyPluginOptions) {
  try {
    if (env.NODE_ENV === 'production') {
      fastify.log.info('Plugin [swagger] desabilitado em produção')
      return
    }

    // Registra o gerador de especificação OpenAPI
    await fastify.register(swagger, {
      openapi: {
        openapi: '3.1.0',
        info: {
          title: `${packageJson.name} - API`,
          description: 'API do sistema',
          version: packageJson.version,
        },
        servers: [
          {
            // Usa localhost para Swagger UI, mesmo quando servidor escuta em 0.0.0.0
            url:
              env.HOST === '0.0.0.0'
                ? `http://localhost:${env.PORT}`
                : `http://${env.HOST}:${env.PORT}`,
            description: 'Servidor de desenvolvimento',
          },
        ],
      },
      // Transform customizado: só transforma Zod schemas, ignora JSON puro
      transform: (transformObject) => {
        const { schema } = transformObject as { schema: unknown }

        // Type guard: verifica se é um schema JSON puro com multipart
        const isJsonSchema = (s: unknown): s is { body: { type: string; properties: unknown } } => {
          return (
            typeof s === 'object' &&
            s !== null &&
            'body' in s &&
            typeof s.body === 'object' &&
            s.body !== null &&
            'type' in s.body &&
            s.body.type === 'object' &&
            'properties' in s.body
          )
        }

        // Se é JSON Schema puro, não transforma
        if (isJsonSchema(schema)) {
          return transformObject
        }

        // Caso contrário, aplica o transform do Zod
        return jsonSchemaTransform(transformObject)
      },
    })

    // Registra a interface visual Swagger UI
    await fastify.register(swaggerUi, {
      routePrefix: '/documentation', // URL onde a documentação estará disponível
      uiConfig: {
        docExpansion: 'list', // 'list', 'full' ou 'none'
        deepLinking: true, // Permite deep linking para operações
        displayRequestDuration: true, // Mostra tempo de resposta
        filter: true, // Adiciona caixa de busca
        showExtensions: true,
        showCommonExtensions: true,
        tryItOutEnabled: true, // Habilita "Try it out" por padrão
      },
      staticCSP: false, // Desabilita CSP próprio do Swagger (usa o do Helmet)
    })

    fastify.log.info(
      { route: '/documentation' },
      'Plugin [swagger] carregado com sucesso - Documentação disponível',
    )
  } catch (err) {
    fastify.log.error({ err }, 'Falha ao carregar o plugin [swagger]')
    throw err
  }
}

export default fp(swaggerPlugin, {
  name: 'swagger',
})
