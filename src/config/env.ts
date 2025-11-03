import 'dotenv/config'

import { z } from 'zod'

/**
 * Schema de validação das variáveis de ambiente
 */
const envSchema = z.object({
  // Ambiente
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // Servidor
  PORT: z.coerce.number().int().positive().default(3333),
  HOST: z.string().default('0.0.0.0'),

  // Logging
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  LOGS_DIR: z.string().default('logs'),

  // CORS
  CORS_ORIGINS: z
    .string()
    .default('*')
    .transform((val) => {
      if (val === '*' || val === 'true') return '*'
      return val.split(',').map((origin) => origin.trim())
    }),

  // Rate Limiting
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(100),
  RATE_LIMIT_TIME_WINDOW: z.string().default('1 minute'),

  // Session
  SESSION_SECRET: z.string().min(32, 'SESSION_SECRET deve ter pelo menos 32 caracteres').optional(),

  // Compressão
  COMPRESS_THRESHOLD: z.coerce.number().int().positive().default(1024),

  // Upload de arquivos
  UPLOAD_MAX_FILE_SIZE: z.coerce
    .number()
    .int()
    .positive()
    .default(10 * 1024 * 1024), // 10MB
  UPLOAD_MAX_FILES: z.coerce.number().int().positive().default(5),
  UPLOAD_ALLOWED_MIMES: z
    .string()
    .default('image/jpeg,image/png,image/webp,application/pdf')
    .transform((val) => val.split(',').map((mime) => mime.trim())),
  UPLOAD_STORAGE_PATH: z.string().default('./uploads'),

  // ETags para cache HTTP
  ETAG_ALGORITHM: z.enum(['sha1', 'sha256', 'md5']).default('sha1'),
  ETAG_WEAK: z.coerce.boolean().default(false),

  // Under Pressure - Monitoramento de saúde do servidor
  UNDER_PRESSURE_MAX_EVENT_LOOP_DELAY: z.coerce.number().positive().default(1000), // ms
  UNDER_PRESSURE_MAX_HEAP_USED_BYTES: z.coerce
    .number()
    .positive()
    .default(100 * 1024 * 1024), // 100MB
  UNDER_PRESSURE_MAX_RSS_BYTES: z.coerce
    .number()
    .positive()
    .default(200 * 1024 * 1024), // 200MB
  UNDER_PRESSURE_MAX_EVENT_LOOP_UTILIZATION: z.coerce.number().min(0).max(1).default(0.98), // 98%
  UNDER_PRESSURE_HEALTH_CHECK_INTERVAL: z.coerce.number().positive().default(5000), // ms

  // Metrics - Prometheus metrics (formato padrão de mercado)
  METRICS_PORT: z.coerce.number().int().positive().default(9090), // Porta separada para métricas
  METRICS_ENDPOINT: z.string().default('/metrics'),
  METRICS_DEFAULT_METRICS_ENABLED: z.coerce.boolean().default(true), // Node.js métricas padrão
  METRICS_ROUTE_METRICS_ENABLED: z.coerce.boolean().default(true), // Métricas por rota
  METRICS_ALLOWED_IPS: z
    .string()
    .optional()
    .transform((val) => {
      if (!val) return []
      return val.split(',').map((ip) => ip.trim())
    }), // IPs permitidos (whitelist)

  // Circuit Breaker - Proteção contra falhas em cascata
  CIRCUIT_BREAKER_THRESHOLD: z.coerce.number().int().positive().default(5), // Falhas antes de abrir
  CIRCUIT_BREAKER_TIMEOUT: z.coerce.number().positive().default(10000), // ms para timeout
  CIRCUIT_BREAKER_RESET_TIMEOUT: z.coerce.number().positive().default(30000), // ms em OPEN

  // Redis - Cache distribuído (opcional)
  REDIS_ENABLED: z.coerce.boolean().default(false), // Ativa conexão com Redis
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.coerce.number().int().positive().default(6379),
  REDIS_PASSWORD: z.string().optional(), // Senha do Redis (opcional)
  REDIS_DB: z.coerce.number().int().min(0).max(15).default(0), // Database do Redis (0-15)

  // Caching - Sistema de cache HTTP
  CACHE_ENABLED: z.coerce.boolean().default(true), // Habilita sistema de cache
  CACHE_TTL_DEFAULT: z.coerce.number().int().positive().default(300), // TTL padrão (5 min)
  CACHE_MAX_SIZE: z.coerce.number().int().positive().default(100), // Máx items em memória

  // Virus Scanning - Proteção contra malware em uploads
  VIRUS_SCANNING_ENABLED: z.coerce.boolean().default(false), // Habilita scanning com ClamAV
  CLAMAV_HOST: z.string().default('localhost'), // Host do ClamAV daemon
  CLAMAV_PORT: z.coerce.number().int().positive().default(3310), // Porta do ClamAV daemon

  // PostgreSQL - Banco de dados relacional
  DATABASE_URL: z.string().optional(), // URL completa de conexão (alternativa moderna)
  POSTGRES_HOST: z.string().default('localhost'), // Host do PostgreSQL
  POSTGRES_PORT: z.coerce.number().int().positive().default(5432), // Porta do PostgreSQL
  POSTGRES_USER: z.string().min(1, 'POSTGRES_USER é obrigatório'), // Usuário do banco
  POSTGRES_PASSWORD: z.string().min(1, 'POSTGRES_PASSWORD é obrigatório'), // Senha do banco
  POSTGRES_DB: z.string().min(1, 'POSTGRES_DB é obrigatório'), // Nome do database
  POSTGRES_SSL: z.coerce.boolean().default(false), // Habilita SSL/TLS
  POSTGRES_POOL_MIN: z.coerce.number().int().min(0).default(2), // Mínimo de conexões no pool
  POSTGRES_POOL_MAX: z.coerce.number().int().positive().default(10), // Máximo de conexões no pool

  // Couchbase - Banco de dados NoSQL para auditoria e histórico
  COUCHBASE_ENABLED: z.coerce.boolean().default(false), // Habilita conexão com Couchbase
  COUCHBASE_URL: z.string().default('couchbase://localhost'), // URL de conexão do Couchbase
  COUCHBASE_USER: z.string().default('Administrator'), // Usuário do Couchbase
  COUCHBASE_PASSWORD: z.string().default('password'), // Senha do Couchbase
  COUCHBASE_BUCKET: z.string().default('audit_logs'), // Nome do bucket de auditoria
  COUCHBASE_SCOPE: z.string().optional(), // Scope (opcional, usa _default se não especificado)
  COUCHBASE_COLLECTION: z.string().optional(), // Collection (opcional, usa _default se não especificado)
})

/**
 * Valida e exporta as variáveis de ambiente
 * @throws {ZodError} Se houver erro de validação
 */
function validateEnv() {
  const result = envSchema.safeParse(process.env)

  if (!result.success) {
    console.error('❌ Erro de validação nas variáveis de ambiente:')
    console.error(JSON.stringify(z.treeifyError(result.error), null, 2))
    process.exit(1)
  }

  return result.data
}

/**
 * Variáveis de ambiente validadas e tipadas
 */
export const env = validateEnv()

/**
 * Tipo inferido das variáveis de ambiente
 */
export type Env = z.infer<typeof envSchema>
