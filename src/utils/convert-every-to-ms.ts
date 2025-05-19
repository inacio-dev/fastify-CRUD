export function convertEveryToMs(every: string | number): number {
  if (typeof every === 'number') {
    return every
  }

  const timeValue = every.trim().toLowerCase()

  // Melhorando a regex para capturar melhor os diferentes formatos
  const match = timeValue.match(/^(\d+)\s*([a-z]+)$/)

  if (!match) {
    throw new Error(
      `Formato inválido para 'every': ${every}. Use um número ou uma string como '5 m'.`,
    )
  }

  const value = parseInt(match[1], 10)
  const unitRaw = match[2]

  // Verificar se a unidade é vazia
  if (!unitRaw || unitRaw.length === 0) {
    throw new Error(`Unidade de tempo não especificada para: ${every}`)
  }

  // Tratar 'ms' como caso especial antes de remover o 's' do final
  if (unitRaw === 'ms') {
    return value
  }

  // Para outras unidades, normalizar
  // Não remova o 's' se for apenas 's' (segundos)
  let unit = unitRaw === 's' ? 's' : unitRaw.replace(/s$/, '')

  // Normalizar unidades escritas por extenso
  if (unit === 'minute') unit = 'min'
  if (unit === 'hour') unit = 'h'
  if (unit === 'day') unit = 'd'
  if (unit === 'second') unit = 's'

  const MS_PER_SECOND = 1000
  const MS_PER_MINUTE = 60 * MS_PER_SECOND
  const MS_PER_HOUR = 60 * MS_PER_MINUTE
  const MS_PER_DAY = 24 * MS_PER_HOUR

  switch (unit) {
    case 's':
      return value * MS_PER_SECOND
    case 'min':
    case 'm': // Adicionando suporte para 'm' como abreviação de minuto
      return value * MS_PER_MINUTE
    case 'h':
      return value * MS_PER_HOUR
    case 'd':
      return value * MS_PER_DAY
    default:
      throw new Error(`Unidade de tempo desconhecida: ${unit}`)
  }
}
