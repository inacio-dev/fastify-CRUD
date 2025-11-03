import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'

import type { Email } from './value-objects/email.js'
import type { Name } from './value-objects/name.js'

/**
 * Tabela de usuários (exemplo)
 *
 * Este é um schema de exemplo para demonstrar o uso do Drizzle ORM.
 * Modifique conforme as necessidades do seu projeto.
 *
 * Note: .$type<>() força type-safety mas requer conversão manual nas queries
 */
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull().$type<Name>(),
  email: text('email').notNull().unique().$type<Email>(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

/**
 * Tipos inferidos do schema para uso no código
 *
 * Com Value Objects:
 * - User.name é do tipo Name (classe com métodos)
 * - User.email é do tipo Email (classe com métodos)
 */
export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
