import NodeClam from 'clamscan'
import type { FastifyInstance, FastifyPluginOptions } from 'fastify'
import fp from 'fastify-plugin'

import { env } from '../config/env.js'

/**
 * Plugin de integração com ClamAV para scanning de vírus
 *
 * Conecta ao ClamAV daemon (clamd) via Docker ou instalação local.
 * Usado pelo helper de upload seguro para validar arquivos antes de salvar.
 *
 * Pré-requisitos:
 * - ClamAV rodando via Docker: docker-compose up -d clamav
 * - Ou instalação local: apt-get install clamav clamav-daemon
 *
 * Configuração:
 * - VIRUS_SCANNING_ENABLED: Habilita/desabilita scanning
 * - CLAMAV_HOST: Host do ClamAV daemon (padrão: localhost)
 * - CLAMAV_PORT: Porta do ClamAV daemon (padrão: 3310)
 *
 * Uso:
 * const { isInfected, viruses } = await fastify.clamscan.isInfected(filepath)
 */
async function clamavPlugin(fastify: FastifyInstance, _opts: FastifyPluginOptions) {
  try {
    // Só carrega se virus scanning estiver habilitado
    if (!env.VIRUS_SCANNING_ENABLED) {
      fastify.log.info(
        { enabled: false },
        'Plugin [clamav] desabilitado (VIRUS_SCANNING_ENABLED=false)',
      )
      return
    }

    // Inicializa cliente ClamAV
    const clamscan = await new NodeClam().init({
      clamdscan: {
        host: env.CLAMAV_HOST,
        port: env.CLAMAV_PORT,
        timeout: 60000, // 60 segundos
        localFallback: false, // Não usar clamscan local se daemon falhar
      },
      preference: 'clamdscan', // Usa daemon (mais rápido que clamscan CLI)
      debugMode: env.NODE_ENV === 'development', // Debug apenas em dev
    })

    // Decora instância do Fastify com cliente ClamAV
    fastify.decorate('clamscan', clamscan)

    // Testa conexão com ClamAV
    const version = await clamscan.getVersion()

    fastify.log.info(
      {
        host: env.CLAMAV_HOST,
        port: env.CLAMAV_PORT,
        version,
      },
      'Plugin [clamav] carregado com sucesso',
    )
  } catch (err) {
    fastify.log.error({ err }, 'Falha ao carregar o plugin [clamav]')

    // Se virus scanning está habilitado mas ClamAV não conecta, falha
    if (env.VIRUS_SCANNING_ENABLED) {
      fastify.log.error(
        'ClamAV não está acessível. Certifique-se que o container está rodando: docker-compose up -d clamav',
      )
      throw err
    }
  }
}

export default fp(clamavPlugin, {
  name: 'clamav',
})

// Adiciona tipos ao Fastify
declare module 'fastify' {
  interface FastifyInstance {
    clamscan?: NodeClam
  }
}
