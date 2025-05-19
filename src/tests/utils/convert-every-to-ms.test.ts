import { convertEveryToMs } from '../../utils/convert-every-to-ms'

describe('convertEveryToMs', () => {
  // Testa quando o valor já é numérico
  test('deve retornar o mesmo valor quando já for um número', () => {
    expect(convertEveryToMs(5000)).toBe(5000)
    expect(convertEveryToMs(0)).toBe(0)
    expect(convertEveryToMs(1)).toBe(1)
  })

  // Testa conversões de strings para milissegundos
  test('deve converter corretamente strings com unidades de tempo para ms', () => {
    // Teste para milissegundos
    expect(convertEveryToMs('100 ms')).toBe(100)
    expect(convertEveryToMs('500ms')).toBe(500)

    // Teste para segundos
    expect(convertEveryToMs('5 s')).toBe(5000)
    expect(convertEveryToMs('10s')).toBe(10000)
    expect(convertEveryToMs('1 second')).toBe(1000)
    expect(convertEveryToMs('2 seconds')).toBe(2000)

    // Teste para minutos
    expect(convertEveryToMs('1 min')).toBe(60000)
    expect(convertEveryToMs('2min')).toBe(120000)
    expect(convertEveryToMs('1 minute')).toBe(60000)
    expect(convertEveryToMs('2 minutes')).toBe(120000)

    // Teste para horas
    expect(convertEveryToMs('1 h')).toBe(3600000)
    expect(convertEveryToMs('2h')).toBe(7200000)
    expect(convertEveryToMs('1 hour')).toBe(3600000)
    expect(convertEveryToMs('2 hours')).toBe(7200000)

    // Teste para dias
    expect(convertEveryToMs('1 d')).toBe(86400000)
    expect(convertEveryToMs('2d')).toBe(172800000)
    expect(convertEveryToMs('1 day')).toBe(86400000)
    expect(convertEveryToMs('2 days')).toBe(172800000)
  })

  // Testa a remoção de espaços em branco e capitalização
  test('deve lidar com espaços em branco e maiúsculas/minúsculas', () => {
    expect(convertEveryToMs('  5 min  ')).toBe(300000)
    expect(convertEveryToMs('10 MIN')).toBe(600000)
    expect(convertEveryToMs('15MIN')).toBe(900000)
  })

  // Testa casos de erro
  test('deve lançar erro para formatos inválidos', () => {
    expect(() => convertEveryToMs('')).toThrow()
    expect(() => convertEveryToMs('abc')).toThrow()
    expect(() => convertEveryToMs('5x')).toThrow()
    expect(() => convertEveryToMs('min')).toThrow()
  })

  test('deve lançar erro para unidades de tempo desconhecidas', () => {
    expect(() => convertEveryToMs('5 years')).toThrow('Unidade de tempo desconhecida')
    expect(() => convertEveryToMs('10 weeks')).toThrow('Unidade de tempo desconhecida')
  })
})
