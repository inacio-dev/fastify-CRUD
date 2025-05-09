import caching from '@fastify/caching'
import redis from '@fastify/redis'
import { FastifyInstance, FastifyPluginAsync } from 'fastify'
import fp from 'fastify-plugin'

import { env } from '../core/env'

type CacheableValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | CacheableValue[]
  | { [key: string]: CacheableValue }

declare module 'fastify' {
  interface FastifyInstance {
    getCache: <T extends CacheableValue = CacheableValue>(key: string) => Promise<T | null>
    setCache: <T extends CacheableValue = CacheableValue>(
      key: string,
      value: T,
      ttl?: number,
    ) => Promise<string>
  }
}

const cachePlugin: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  // Configurar Redis
  await fastify.register(redis, {
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
    password: env.REDIS_PASSWORD,
    family: 4, // IPv4
  })

  // Configurar cache HTTP
  await fastify.register(caching, {
    privacy: caching.privacy.PUBLIC,
    expiresIn: 300, // 5 minutos
  })

  fastify.decorate(
    'getCache',
    async <T extends CacheableValue = CacheableValue>(key: string): Promise<T | null> => {
      const data = await fastify.redis.get(key)
      return data ? (JSON.parse(data) as T) : null
    },
  )

  fastify.decorate(
    'setCache',
    async <T extends CacheableValue = CacheableValue>(
      key: string,
      value: T,
      ttl = 300,
    ): Promise<string> => {
      return fastify.redis.set(key, JSON.stringify(value), 'EX', ttl)
    },
  )
}

export default fp(cachePlugin, { name: 'cache' })
