import { createServer } from 'node:http'

import type { FastifyInstance, FastifyPluginOptions } from 'fastify'
import fp from 'fastify-plugin'
import { collectDefaultMetrics, Counter, Histogram, register } from 'prom-client'

import { env } from '../config/env.js'

/**
 * Plugin de métricas Prometheus em servidor separado
 * Expõe métricas de performance, latência, throughput e erros no formato Prometheus
 * IMPORTANTE:
 * - Só é ativado em produção para evitar overhead desnecessário em desenvolvimento
 * - Roda em PORTA SEPARADA (padrão: 9090) para isolamento de segurança
 * - Protegido por IP Whitelist
 *
 * Métricas coletadas automaticamente:
 * - http_request_duration_seconds: Latência de requisições (histograma)
 * - http_requests_total: Total de requisições (por rota, método, status)
 * - process_cpu_*: Uso de CPU
 * - nodejs_heap_*: Uso de memória
 * - nodejs_eventloop_lag_*: Lag do event loop
 *
 * Use com Prometheus + Grafana para dashboards de monitoramento em produção
 */
async function metrics(fastify: FastifyInstance, _opts: FastifyPluginOptions) {
  try {
    // Só ativa em produção
    if (env.NODE_ENV !== 'production') {
      fastify.log.info('Plugin [metrics] desabilitado em desenvolvimento')
      return
    }

    // Coleta métricas padrão do Node.js (se habilitado)
    if (env.METRICS_DEFAULT_METRICS_ENABLED) {
      collectDefaultMetrics({ register })
    }

    // Define métricas de rotas HTTP (se habilitado)
    let httpRequestsTotal: Counter<string> | undefined
    let httpRequestDuration: Histogram<string> | undefined

    if (env.METRICS_ROUTE_METRICS_ENABLED) {
      httpRequestsTotal = new Counter({
        name: 'http_requests_total',
        help: 'Total de requisições HTTP',
        labelNames: ['method', 'route', 'status_code'],
      })

      httpRequestDuration = new Histogram({
        name: 'http_request_duration_seconds',
        help: 'Duração das requisições HTTP em segundos',
        labelNames: ['method', 'route', 'status_code'],
        buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
      })

      // Hook para coletar métricas de cada requisição
      fastify.addHook('onResponse', async (request, reply) => {
        const route = request.routeOptions.url || request.url
        const method = request.method
        const statusCode = reply.statusCode.toString()

        // Incrementa contador
        httpRequestsTotal?.inc({ method, route, status_code: statusCode })

        // Registra duração (em segundos)
        const duration = reply.elapsedTime / 1000
        httpRequestDuration?.observe({ method, route, status_code: statusCode }, duration)
      })
    }

    // Função para verificar IP whitelist
    const isIpAllowed = (clientIp: string): boolean => {
      if (env.METRICS_ALLOWED_IPS.length === 0) {
        return true // Sem whitelist = permite todos (com warning)
      }
      return env.METRICS_ALLOWED_IPS.includes(clientIp)
    }

    // Cria servidor HTTP separado para métricas
    const metricsServer = createServer(async (req, res) => {
      // Obtém IP real do cliente (considerando proxies)
      const clientIp =
        req.headers['x-forwarded-for']?.toString().split(',')[0]?.trim() ||
        req.headers['x-real-ip']?.toString() ||
        req.socket.remoteAddress ||
        'unknown'

      // Verifica IP whitelist
      if (!isIpAllowed(clientIp)) {
        fastify.log.warn(
          {
            clientIp,
            allowedIps: env.METRICS_ALLOWED_IPS,
          },
          'Acesso negado ao endpoint de métricas - IP não autorizado',
        )

        res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' })
        res.end(`Acesso negado. IP ${clientIp} não está autorizado a acessar métricas.\n`)
        return
      }

      // Serve métricas
      if (req.url === env.METRICS_ENDPOINT) {
        res.writeHead(200, { 'Content-Type': register.contentType })
        res.end(await register.metrics())
      } else {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' })
        res.end('Not Found. Use /metrics para acessar as métricas.\n')
      }
    })

    // Inicia servidor de métricas
    metricsServer.listen(env.METRICS_PORT, '0.0.0.0', () => {
      if (env.METRICS_ALLOWED_IPS.length > 0) {
        fastify.log.info(
          {
            port: env.METRICS_PORT,
            endpoint: env.METRICS_ENDPOINT,
            allowedIps: env.METRICS_ALLOWED_IPS,
            defaultMetrics: env.METRICS_DEFAULT_METRICS_ENABLED,
            routeMetrics: env.METRICS_ROUTE_METRICS_ENABLED,
          },
          'Servidor de métricas Prometheus iniciado com IP Whitelist',
        )
      } else {
        fastify.log.warn(
          {
            port: env.METRICS_PORT,
            endpoint: env.METRICS_ENDPOINT,
          },
          '⚠️  AVISO DE SEGURANÇA: Servidor de métricas exposto SEM IP Whitelist! Configure METRICS_ALLOWED_IPS.',
        )
      }
    })

    // Fecha servidor de métricas ao encerrar Fastify
    fastify.addHook('onClose', async () => {
      metricsServer.close()
      register.clear()
    })
  } catch (err) {
    fastify.log.error({ err }, 'Falha ao carregar o plugin [metrics]')
    throw err
  }
}

export default fp(metrics, {
  name: 'metrics',
})
