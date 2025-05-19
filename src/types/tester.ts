export interface HealthCheckPayload {
  uptime: number
  timestamp: number
  status: 'OK' | 'ERROR'
  database?: 'connected' | 'disconnected' | 'error'
}
