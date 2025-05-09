import compress from '@fastify/compress'
import { FastifyPluginAsync } from 'fastify'
import fp from 'fastify-plugin'

const compressPlugin: FastifyPluginAsync = async (fastify) => {
  await fastify.register(compress, {
    global: true,
    threshold: 4096, // 4KB - valor mais equilibrado
    encodings: ['gzip', 'deflate', 'br'],
    customTypes:
      /^text|^application\/json|^application\/javascript|^application\/xml|^image\/svg\+xml/,
    inflateIfDeflated: true,
    zlibOptions: {
      level: 6, // Nível de compressão 6 (de 0 a 9) - bom equilíbrio entre velocidade e compressão
    },
  })
}

export default fp(compressPlugin, { name: 'compress' })
