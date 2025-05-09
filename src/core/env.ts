import 'dotenv/config'

import { z } from 'zod'

const EnvSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'production'], {
      message: '[.env - NODE_ENV] Valor desconhecido',
    })
    .optional()
    .default('development'),
  PORT: z
    .string()
    .optional()
    .default('3000')
    .transform((val) => parseInt(val, 10))
    .refine((n) => !Number.isNaN(n), {
      message: '[.env - PORT] Porta inválida',
    }),
  DEBUG: z
    .string()
    .optional()
    .default('false')
    .transform((v) => (v ?? '').toLowerCase() === 'true'),
  CORS_ORIGINS: z
    .string()
    .optional()
    .default('*')
    .transform((val) => {
      if (val === '*') return true
      return val.split(',').map((origin) => origin.trim())
    }),
  COOKIE_SECRET: z
    .string()
    .optional()
    .default('uma-chave-secreta-aleatoria-para-cookies')
    .refine((val) => val.length >= 32, {
      message: '[.env - COOKIE_SECRET] Deve ter pelo menos 32 caracteres para segurança adequada',
    }),
  // Redis ---------------------------------------------------------------------
  REDIS_HOST: z.string().optional().default('localhost'),
  REDIS_PORT: z
    .string()
    .optional()
    .default('6379')
    .transform((val) => parseInt(val, 10))
    .refine((n) => Number.isInteger(n) && n > 0, {
      message: '[.env - REDIS_PORT] Porta inválida',
    }),
  REDIS_PASSWORD: z.string().optional(),
  // ---------------------------------------------------------------------------
  // Database ------------------------------------------------------------------
  POSTGRES_DB: z.string({ required_error: '[.env - POSTGRES_DB] Necessário' }),
  POSTGRES_USER: z.string({ required_error: '[.env - POSTGRES_USER] Necessário' }),
  POSTGRES_PASSWORD: z.string({ required_error: '[.env - POSTGRES_PASSWORD] Necessária' }),
  POSTGRES_HOST: z.string({ required_error: '[.env - POSTGRES_HOST] Necessário' }),
  POSTGRES_PORT: z
    .string()
    .optional()
    .default('5432')
    .transform((val) => parseInt(val, 10))
    .refine((n) => Number.isInteger(n) && n > 0, {
      message: '[.env - POSTGRES_PORT] Porta inválida',
    }),
  POSTGRES_SCHEMA: z.string().optional().default('public'),
  POSTGRES_SSL: z
    .string()
    .optional()
    .default('false')
    .transform((v) => (v ?? '').toLowerCase() === 'true'),
  // ---------------------------------------------------------------------------
})

type Env = z.infer<typeof EnvSchema>

export const env: Env = EnvSchema.parse(process.env)
