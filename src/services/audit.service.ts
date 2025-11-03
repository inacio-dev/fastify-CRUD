import type { FastifyInstance, FastifyRequest } from 'fastify'

import type { AuditLog } from '../plugins/couchbase.js'

/**
 * Service de auditoria
 * Fornece métodos para registrar mudanças em entidades
 */
export class AuditService {
  constructor(private readonly fastify: FastifyInstance) {}

  /**
   * Verifica se o Couchbase está habilitado e disponível
   */
  private isEnabled(): boolean {
    return !!this.fastify.couchbase
  }

  /**
   * Registra uma operação de criação
   */
  async logCreate(params: {
    entity: string
    entityId: string
    data: unknown
    request?: FastifyRequest
  }): Promise<void> {
    if (!this.isEnabled()) return

    await this.fastify.couchbase.logAudit({
      entity: params.entity,
      entityId: params.entityId,
      operation: 'create',
      data: params.data,
      metadata: params.request ? this.extractMetadata(params.request) : undefined,
    })
  }

  /**
   * Registra uma operação de atualização
   */
  async logUpdate(params: {
    entity: string
    entityId: string
    oldData: unknown
    newData: unknown
    changes?: Record<string, { old: unknown; new: unknown }>
    request?: FastifyRequest
  }): Promise<void> {
    if (!this.isEnabled()) return

    await this.fastify.couchbase.logAudit({
      entity: params.entity,
      entityId: params.entityId,
      operation: 'update',
      data: params.newData,
      changes: params.changes,
      metadata: params.request ? this.extractMetadata(params.request) : undefined,
    })
  }

  /**
   * Registra uma operação de exclusão
   */
  async logDelete(params: {
    entity: string
    entityId: string
    data: unknown
    request?: FastifyRequest
  }): Promise<void> {
    if (!this.isEnabled()) return

    await this.fastify.couchbase.logAudit({
      entity: params.entity,
      entityId: params.entityId,
      operation: 'delete',
      data: params.data,
      metadata: params.request ? this.extractMetadata(params.request) : undefined,
    })
  }

  /**
   * Extrai metadados da requisição para auditoria
   */
  private extractMetadata(request: FastifyRequest): {
    userId?: string | undefined
    ip?: string | undefined
    userAgent?: string | undefined
  } {
    const metadata: {
      userId?: string | undefined
      ip?: string | undefined
      userAgent?: string | undefined
    } = {}

    if (request.ip) {
      metadata.ip = request.ip
    }

    if (request.headers['user-agent']) {
      metadata.userAgent = request.headers['user-agent']
    }

    // Adicione aqui outros metadados como userId de sessão/JWT quando implementado

    return metadata
  }

  /**
   * Busca histórico de auditoria de uma entidade específica
   */
  async getEntityHistory(entity: string, entityId: string): Promise<AuditLog[]> {
    if (!this.isEnabled()) return []

    try {
      const bucket = this.fastify.couchbase.bucket.name
      const scope = '_default'
      const collection = '_default'

      // Query N1QL para buscar documentos
      const query = `
        SELECT META().id, *
        FROM \`${bucket}\`.\`${scope}\`.\`${collection}\`
        WHERE entity = $entity
          AND entityId = $entityId
        ORDER BY timestamp DESC
      `

      const result = await this.fastify.couchbase.cluster.query(query, {
        parameters: { entity, entityId },
      })

      return result.rows.map((row) => row as unknown as AuditLog)
    } catch (err) {
      this.fastify.log.error({ err, entity, entityId }, 'Falha ao buscar histórico de auditoria')
      return []
    }
  }

  /**
   * Busca todos os logs de auditoria de um tipo de entidade
   */
  async getEntityLogs(entity: string, limit = 100): Promise<AuditLog[]> {
    if (!this.isEnabled()) return []

    try {
      const bucket = this.fastify.couchbase.bucket.name
      const scope = '_default'
      const collection = '_default'

      // Query N1QL para buscar documentos
      const query = `
        SELECT META().id, *
        FROM \`${bucket}\`.\`${scope}\`.\`${collection}\`
        WHERE entity = $entity
        ORDER BY timestamp DESC
        LIMIT $limit
      `

      const result = await this.fastify.couchbase.cluster.query(query, {
        parameters: { entity, limit },
      })

      return result.rows.map((row) => row as unknown as AuditLog)
    } catch (err) {
      this.fastify.log.error({ err, entity }, 'Falha ao buscar logs de auditoria')
      return []
    }
  }
}
