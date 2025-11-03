import * as couchbase from 'couchbase'
import type { FastifyInstance, FastifyPluginOptions } from 'fastify'
import fp from 'fastify-plugin'

import { env } from '../config/env.js'

/**
 * Interface do documento de auditoria no Couchbase
 */
export interface AuditLog {
  id: string // UUID do documento
  entity: string // Nome da entidade (ex: 'user')
  entityId: string // ID da entidade
  operation: 'create' | 'update' | 'delete' // Tipo de operação
  timestamp: string // ISO 8601 timestamp
  changes?: Record<string, { old: unknown; new: unknown }> | undefined // Mudanças nos campos
  data?: unknown // Dados completos após a operação
  metadata?:
    | {
        userId?: string | undefined // ID do usuário que fez a operação
        ip?: string | undefined // IP de onde veio a requisição
        userAgent?: string | undefined // User agent do cliente
      }
    | undefined
}

/**
 * Extensão do Fastify para incluir o Couchbase
 */
declare module 'fastify' {
  interface FastifyInstance {
    couchbase: {
      cluster: couchbase.Cluster
      bucket: couchbase.Bucket
      collection: couchbase.Collection
      logAudit: (log: Omit<AuditLog, 'id' | 'timestamp'>) => Promise<void>
    }
  }
}

/**
 * Plugin de conexão com Couchbase
 * Usado para armazenar logs de auditoria e histórico de mudanças
 */
async function couchbasePlugin(fastify: FastifyInstance, _opts: FastifyPluginOptions) {
  try {
    // Só conecta se o Couchbase estiver habilitado
    if (!env.COUCHBASE_ENABLED) {
      fastify.log.info('Plugin [couchbase] desabilitado (COUCHBASE_ENABLED=false)')
      return
    }

    // Conecta ao cluster Couchbase
    const cluster = await couchbase.Cluster.connect(env.COUCHBASE_URL, {
      username: env.COUCHBASE_USER,
      password: env.COUCHBASE_PASSWORD,
    })

    fastify.log.info({ url: env.COUCHBASE_URL }, 'Conectado ao Couchbase com sucesso')

    // Obtém referência ao bucket
    const bucket = cluster.bucket(env.COUCHBASE_BUCKET)

    // Obtém referência à collection (usa _default se não especificado)
    const collectionName = env.COUCHBASE_COLLECTION || '_default'
    const scopeName = env.COUCHBASE_SCOPE || '_default'
    const collection = bucket.scope(scopeName).collection(collectionName)

    // Função auxiliar para registrar logs de auditoria
    const logAudit = async (log: Omit<AuditLog, 'id' | 'timestamp'>) => {
      try {
        // Gera ID único para o documento
        const id = `audit::${log.entity}::${log.entityId}::${Date.now()}`

        const auditLog: AuditLog = {
          id,
          ...log,
          timestamp: new Date().toISOString(),
        }

        // Insere documento no Couchbase
        await collection.insert(id, auditLog)

        fastify.log.debug(
          { entity: log.entity, entityId: log.entityId, operation: log.operation },
          'Log de auditoria registrado',
        )
      } catch (err) {
        fastify.log.error({ err, log }, 'Falha ao registrar log de auditoria')
        // Lança erro para forçar rollback da transação
        throw err
      }
    }

    // Decora o Fastify com a conexão do Couchbase
    fastify.decorate('couchbase', {
      cluster,
      bucket,
      collection,
      logAudit,
    })

    // Fecha conexão ao desligar o servidor
    fastify.addHook('onClose', async () => {
      await cluster.close()
      fastify.log.info('Conexão com Couchbase fechada')
    })

    fastify.log.info(
      { bucket: env.COUCHBASE_BUCKET, collection: collectionName },
      'Plugin [couchbase] carregado com sucesso',
    )
  } catch (err) {
    fastify.log.error({ err }, 'Falha ao carregar o plugin [couchbase]')
    throw err
  }
}

export default fp(couchbasePlugin, {
  name: 'couchbase',
})
