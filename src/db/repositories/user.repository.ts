import { eq } from 'drizzle-orm'
import type { FastifyInstance } from 'fastify'

import { AuditService } from '../../services/audit.service.js'
import { db } from '../index.js'
import { users, type User } from '../schema.js'
import { Email } from '../value-objects/email.js'
import { Name } from '../value-objects/name.js'

/**
 * Representa uma linha bruta do banco de dados
 */
interface UserRawRow {
  id: string
  name: string
  email: string
  created_at: Date
  updated_at: Date
}

/**
 * Repository de usuários
 *
 * Responsável por abstrair o acesso ao banco de dados e converter
 * entre a camada de persistência e a camada de domínio.
 *
 * Opcionalmente registra logs de auditoria no CouchDB quando uma instância
 * do Fastify é fornecida.
 */
export class UserRepository {
  private auditService?: AuditService

  /**
   * Construtor do repositório
   * @param fastify Instância opcional do Fastify para habilitar auditoria
   */
  constructor(fastify?: FastifyInstance) {
    if (fastify) {
      this.auditService = new AuditService(fastify)
    }
  }
  /**
   * Converte dados do banco para entidade de domínio
   * Usa Value Objects para garantir validação
   */
  private toDomain(row: UserRawRow): User {
    return {
      id: row.id,
      name: Name.fromDatabase(row.name),
      email: Email.fromDatabase(row.email),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }
  }

  /**
   * Valida e prepara dados para criação
   * Aplica as regras de negócio dos Value Objects
   */
  private prepareCreate(data: { name: string; email: string }) {
    return {
      name: Name.create(data.name).toString() as unknown as Name,
      email: Email.create(data.email).toString() as unknown as Email,
    }
  }

  /**
   * Valida e prepara dados para atualização
   * Apenas valida os campos fornecidos
   */
  private prepareUpdate(data: { name?: string | undefined; email?: string | undefined }) {
    const updateData = {} as { name?: Name; email?: Email }

    if (data.name !== undefined) {
      updateData.name = Name.create(data.name).toString() as unknown as Name
    }

    if (data.email !== undefined) {
      updateData.email = Email.create(data.email).toString() as unknown as Email
    }

    return updateData
  }

  /**
   * Busca todos os usuários
   * @returns Lista de usuários com Value Objects
   */
  async findAll(): Promise<User[]> {
    const rows = await db.select().from(users)
    return rows.map((row) =>
      this.toDomain({
        id: row.id,
        name: row.name as unknown as string,
        email: row.email as unknown as string,
        created_at: row.createdAt,
        updated_at: row.updatedAt,
      }),
    )
  }

  /**
   * Busca usuário por ID
   * @returns User ou null se não encontrado
   */
  async findById(id: string): Promise<User | null> {
    const [row] = await db.select().from(users).where(eq(users.id, id)).limit(1)

    if (!row) return null

    return this.toDomain({
      id: row.id,
      name: row.name as unknown as string,
      email: row.email as unknown as string,
      created_at: row.createdAt,
      updated_at: row.updatedAt,
    })
  }

  /**
   * Busca usuário por email
   * @param email Value Object Email
   * @returns User ou null se não encontrado
   */
  async findByEmail(email: Email): Promise<User | null> {
    const [row] = await db
      .select()
      .from(users)
      .where(eq(users.email, email as unknown as Email))
      .limit(1)

    if (!row) return null

    return this.toDomain({
      id: row.id,
      name: row.name as unknown as string,
      email: row.email as unknown as string,
      created_at: row.createdAt,
      updated_at: row.updatedAt,
    })
  }

  /**
   * Cria novo usuário
   * @throws Error se validação ou auditoria falhar
   */
  async create(data: { name: string; email: string }): Promise<User> {
    const validated = this.prepareCreate(data)

    // Usa transação para garantir consistência entre banco e auditoria
    return await db.transaction(async (tx) => {
      const [row] = await tx.insert(users).values(validated).returning()

      if (!row) throw new Error('Falha ao criar usuário')

      const user = this.toDomain({
        id: row.id,
        name: row.name as unknown as string,
        email: row.email as unknown as string,
        created_at: row.createdAt,
        updated_at: row.updatedAt,
      })

      // Registra auditoria se habilitado
      if (this.auditService) {
        try {
          await this.auditService.logCreate({
            entity: 'user',
            entityId: user.id,
            data: {
              id: user.id,
              name: user.name.value,
              email: user.email.value,
              createdAt: user.createdAt.toISOString(),
              updatedAt: user.updatedAt.toISOString(),
            },
          })
        } catch (err) {
          // Se auditoria falhar, a transação será revertida
          throw new Error(
            `Falha ao registrar auditoria: ${err instanceof Error ? err.message : 'Unknown error'}`,
          )
        }
      }

      return user
    })
  }

  /**
   * Atualiza usuário existente
   * @throws Error se validação, auditoria falhar ou usuário não for encontrado
   */
  async update(
    id: string,
    data: { name?: string | undefined; email?: string | undefined },
  ): Promise<User> {
    const validated = this.prepareUpdate(data)
    const updateData = { ...validated, updatedAt: new Date() }

    // Usa transação para garantir consistência entre banco e auditoria
    return await db.transaction(async (tx) => {
      // Busca dados antigos para auditoria
      let oldUser: User | null = null
      if (this.auditService) {
        const [oldRow] = await tx.select().from(users).where(eq(users.id, id)).limit(1)
        if (oldRow) {
          oldUser = this.toDomain({
            id: oldRow.id,
            name: oldRow.name as unknown as string,
            email: oldRow.email as unknown as string,
            created_at: oldRow.createdAt,
            updated_at: oldRow.updatedAt,
          })
        }
      }

      const [row] = await tx.update(users).set(updateData).where(eq(users.id, id)).returning()

      if (!row) throw new Error('Falha ao atualizar usuário')

      const user = this.toDomain({
        id: row.id,
        name: row.name as unknown as string,
        email: row.email as unknown as string,
        created_at: row.createdAt,
        updated_at: row.updatedAt,
      })

      // Registra auditoria se habilitado
      if (this.auditService && oldUser) {
        try {
          const changes: Record<string, { old: unknown; new: unknown }> = {}
          if (data.name && oldUser.name.value !== user.name.value) {
            changes.name = { old: oldUser.name.value, new: user.name.value }
          }
          if (data.email && oldUser.email.value !== user.email.value) {
            changes.email = { old: oldUser.email.value, new: user.email.value }
          }

          await this.auditService.logUpdate({
            entity: 'user',
            entityId: user.id,
            oldData: {
              id: oldUser.id,
              name: oldUser.name.value,
              email: oldUser.email.value,
              createdAt: oldUser.createdAt.toISOString(),
              updatedAt: oldUser.updatedAt.toISOString(),
            },
            newData: {
              id: user.id,
              name: user.name.value,
              email: user.email.value,
              createdAt: user.createdAt.toISOString(),
              updatedAt: user.updatedAt.toISOString(),
            },
            changes,
          })
        } catch (err) {
          // Se auditoria falhar, a transação será revertida
          throw new Error(
            `Falha ao registrar auditoria: ${err instanceof Error ? err.message : 'Unknown error'}`,
          )
        }
      }

      return user
    })
  }

  /**
   * Remove usuário
   * @throws Error se auditoria falhar
   */
  async delete(id: string): Promise<void> {
    // Usa transação para garantir consistência entre banco e auditoria
    await db.transaction(async (tx) => {
      // Busca dados antes de deletar para auditoria
      let deletedUser: User | null = null
      if (this.auditService) {
        const [row] = await tx.select().from(users).where(eq(users.id, id)).limit(1)
        if (row) {
          deletedUser = this.toDomain({
            id: row.id,
            name: row.name as unknown as string,
            email: row.email as unknown as string,
            created_at: row.createdAt,
            updated_at: row.updatedAt,
          })
        }
      }

      await tx.delete(users).where(eq(users.id, id))

      // Registra auditoria se habilitado e usuário existia
      if (this.auditService && deletedUser) {
        try {
          await this.auditService.logDelete({
            entity: 'user',
            entityId: id,
            data: {
              id: deletedUser.id,
              name: deletedUser.name.value,
              email: deletedUser.email.value,
              createdAt: deletedUser.createdAt.toISOString(),
              updatedAt: deletedUser.updatedAt.toISOString(),
            },
          })
        } catch (err) {
          // Se auditoria falhar, a transação será revertida
          throw new Error(
            `Falha ao registrar auditoria: ${err instanceof Error ? err.message : 'Unknown error'}`,
          )
        }
      }
    })
  }
}

/**
 * Factory function para criar instância do repositório
 * @param fastify Instância opcional do Fastify para habilitar auditoria
 */
export function createUserRepository(fastify?: FastifyInstance): UserRepository {
  return new UserRepository(fastify)
}

/**
 * Instância singleton do repositório (sem auditoria)
 * Use createUserRepository(fastify) nas rotas para habilitar auditoria
 */
export const userRepository = new UserRepository()
