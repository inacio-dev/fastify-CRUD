import crypto from 'node:crypto'

import type { FastifyInstance, FastifyPluginOptions, FastifyRequest } from 'fastify'
import fp from 'fastify-plugin'

import { env } from '../config/env.js'

/**
 * Plugin de cache HTTP com suporte a tags e invalidação inteligente
 *
 * Features:
 * - Cache automático para rotas GET (opt-in via route config)
 * - Usa Redis se disponível, senão usa memória local
 * - Sistema de tags para invalidação em grupo
 * - Headers HTTP corretos (X-Cache-Status, Age, Cache-Control)
 * - Bypass com header X-No-Cache
 *
 * Uso em rotas:
 * ```typescript
 * fastify.get('/products', {
 *   config: {
 *     cache: {
 *       ttl: 300,              // 5 minutos
 *       tags: ['products']     // Tags para invalidação
 *     }
 *   }
 * }, async () => { ... })
 * ```
 *
 * Invalidação manual:
 * ```typescript
 * await fastify.cache.invalidate(['products'])
 * await fastify.cache.clear()
 * ```
 */

interface CacheEntry {
  data: unknown
  headers: Record<string, string>
  statusCode: number
  tags: string[]
  createdAt: number
  ttl: number
}

interface CacheConfig {
  ttl?: number
  tags?: string[]
}

// Armazenamento em memória (fallback se Redis não disponível)
const memoryCache = new Map<string, CacheEntry>()
const tagIndex = new Map<string, Set<string>>() // tag -> Set de cache keys

async function cachingPlugin(fastify: FastifyInstance, _opts: FastifyPluginOptions) {
  try {
    if (!env.CACHE_ENABLED) {
      fastify.log.info('Plugin [caching] desabilitado (CACHE_ENABLED=false)')
      return
    }

    const useRedis = env.REDIS_ENABLED && 'redis' in fastify

    // Helper: gera cache key baseado na rota e params
    const generateCacheKey = (request: FastifyRequest): string => {
      // Usa pathname + query params, mas filtra parâmetros de cache busting
      const url = new URL(request.url, `http://${request.hostname}`)
      const pathname = url.pathname

      // Remove query params que começam com _ (usados por Swagger/navegadores para cache busting)
      // Exemplos: _=1234567890, _timestamp=..., _random=...
      const filteredParams = Array.from(url.searchParams.entries())
        .filter(([key]) => !key.startsWith('_'))
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, value]) => `${key}=${value}`)
        .join('&')

      const raw = `${request.method}:${pathname}${filteredParams ? `?${filteredParams}` : ''}`
      return crypto.createHash('sha256').update(raw).digest('hex')
    }

    // Helper: substituir placeholders nas tags com valores reais
    const resolveTags = (tags: string[], params: Record<string, unknown>): string[] => {
      return tags.map((tag) => {
        let resolved = tag
        for (const [key, value] of Object.entries(params)) {
          resolved = resolved.replace(`{${key}}`, String(value))
        }
        return resolved
      })
    }

    // Get do cache
    const getFromCache = async (key: string): Promise<CacheEntry | null> => {
      if (useRedis) {
        const data = await fastify.redis.get(`cache:${key}`)
        return data ? (JSON.parse(data) as CacheEntry) : null
      } else {
        const entry = memoryCache.get(key)
        if (!entry) return null

        // Verifica TTL
        const age = Math.floor((Date.now() - entry.createdAt) / 1000)
        if (age > entry.ttl) {
          memoryCache.delete(key)
          return null
        }

        return entry
      }
    }

    // Set no cache
    const setInCache = async (key: string, entry: CacheEntry): Promise<void> => {
      if (useRedis) {
        await fastify.redis.set(`cache:${key}`, JSON.stringify(entry), 'EX', entry.ttl)

        // Indexar tags no Redis
        for (const tag of entry.tags) {
          await fastify.redis.sadd(`cache:tag:${tag}`, key)
          await fastify.redis.expire(`cache:tag:${tag}`, entry.ttl)
        }
      } else {
        // Limpar cache antigo se exceder tamanho máximo
        if (memoryCache.size >= env.CACHE_MAX_SIZE) {
          const firstKey = memoryCache.keys().next().value as string | undefined
          if (firstKey) {
            memoryCache.delete(firstKey)
          }
        }

        memoryCache.set(key, entry)

        // Indexar tags em memória
        for (const tag of entry.tags) {
          if (!tagIndex.has(tag)) {
            tagIndex.set(tag, new Set())
          }
          tagIndex.get(tag)?.add(key)
        }
      }
    }

    // Invalidar por tags
    const invalidateByTags = async (tags: string[]): Promise<void> => {
      if (useRedis) {
        for (const tag of tags) {
          const keys = await fastify.redis.smembers(`cache:tag:${tag}`)
          if (keys.length > 0) {
            const cacheKeys = keys.map((k) => `cache:${k}`)
            await fastify.redis.del(...cacheKeys)
            await fastify.redis.del(`cache:tag:${tag}`)
          }
        }
      } else {
        for (const tag of tags) {
          const keys = tagIndex.get(tag)
          if (keys) {
            for (const key of keys) {
              memoryCache.delete(key)
            }
            tagIndex.delete(tag)
          }
        }
      }
    }

    // Limpar todo o cache
    const clearCache = async (): Promise<void> => {
      if (useRedis) {
        const keys = await fastify.redis.keys('cache:*')
        if (keys.length > 0) {
          await fastify.redis.del(...keys)
        }
      } else {
        memoryCache.clear()
        tagIndex.clear()
      }
    }

    // Decorators para API pública
    fastify.decorate('cache', {
      invalidate: invalidateByTags,
      clear: clearCache,
      delete: async (key: string) => {
        if (useRedis) {
          await fastify.redis.del(`cache:${key}`)
        } else {
          memoryCache.delete(key)
        }
      },
    })

    // Hook: cacheia respostas de rotas GET com config.cache
    fastify.addHook('onRequest', async (request, reply) => {
      // Só cacheia GET
      if (request.method !== 'GET') return

      // Verifica se rota tem configuração de cache
      const cacheConfig = request.routeOptions.config?.cache as CacheConfig | undefined
      if (!cacheConfig) return

      // Bypass se header X-No-Cache presente
      if (request.headers['x-no-cache']) {
        reply.header('X-Cache-Status', 'BYPASS')
        return
      }

      const cacheKey = generateCacheKey(request)
      const cached = await getFromCache(cacheKey)

      if (cached) {
        const age = Math.floor((Date.now() - cached.createdAt) / 1000)

        // Adiciona headers de cache
        reply.headers({
          'X-Cache-Status': 'HIT',
          Age: String(age),
          'Cache-Control': `public, max-age=${cached.ttl}`,
          ...cached.headers,
        })

        reply.code(cached.statusCode).send(cached.data)
      }
    })

    // Hook: salva resposta no cache
    fastify.addHook('onSend', async (request, reply, payload) => {
      // Só cacheia GET com status 200
      if (request.method !== 'GET' || reply.statusCode !== 200) return payload

      const cacheConfig = request.routeOptions.config?.cache as CacheConfig | undefined
      if (!cacheConfig) return payload

      // Não cacheia se já veio do cache
      if (reply.getHeader('X-Cache-Status') === 'HIT') return payload

      const cacheKey = generateCacheKey(request)
      const ttl = cacheConfig.ttl ?? env.CACHE_TTL_DEFAULT
      const rawTags = cacheConfig.tags ?? []
      const tags = resolveTags(rawTags, request.params as Record<string, unknown>)

      // Extrai headers relevantes
      const headers: Record<string, string> = {}
      const headerNames = ['content-type', 'content-encoding', 'etag']
      for (const name of headerNames) {
        const value = reply.getHeader(name)
        if (value) {
          headers[name] = String(value)
        }
      }

      const entry: CacheEntry = {
        data: payload,
        headers,
        statusCode: reply.statusCode,
        tags,
        createdAt: Date.now(),
        ttl,
      }

      await setInCache(cacheKey, entry)

      // Adiciona headers de cache
      reply.headers({
        'X-Cache-Status': 'MISS',
        'Cache-Control': `public, max-age=${ttl}`,
      })

      return payload
    })

    fastify.log.info(
      {
        enabled: env.CACHE_ENABLED,
        backend: useRedis ? 'Redis' : 'Memória',
        ttlDefault: `${env.CACHE_TTL_DEFAULT}s`,
        maxSize: useRedis ? 'ilimitado' : env.CACHE_MAX_SIZE,
      },
      'Plugin [caching] carregado com sucesso',
    )
  } catch (err) {
    fastify.log.error({ err }, 'Falha ao carregar o plugin [caching]')
    throw err
  }
}

export default fp(cachingPlugin, {
  name: 'caching',
  dependencies: ['redis'], // Aguarda Redis carregar (se habilitado)
})

// Adiciona tipos ao Fastify
declare module 'fastify' {
  interface FastifyInstance {
    cache: {
      invalidate: (tags: string[]) => Promise<void>
      clear: () => Promise<void>
      delete: (key: string) => Promise<void>
    }
  }

  interface FastifyContextConfig {
    cache?: {
      ttl?: number
      tags?: string[]
    }
  }
}
