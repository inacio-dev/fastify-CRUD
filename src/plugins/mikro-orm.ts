import { MikroORM } from '@mikro-orm/core'
import { FastifyPluginAsync } from 'fastify'
import fp from 'fastify-plugin'

import mikroOrmConfig from '../../mikro-orm.config'

declare module 'fastify' {
  interface FastifyInstance {
    orm: MikroORM
  }
}

const mikroOrmPlugin: FastifyPluginAsync = async (fastify) => {
  const orm = await MikroORM.init(mikroOrmConfig)

  // Adiciona o MikroORM e EntityManager ao Fastify
  fastify.decorate('orm', orm)

  // Fechando a conexão quando o servidor for fechado
  fastify.addHook('onClose', async (instance) => {
    await instance.orm.close()
  })
}

export default fp(mikroOrmPlugin, { name: 'mikro-orm' })
