/**
 * Value Object - Name
 *
 * Encapsula as regras de validação para nomes de usuário.
 * Garante que o nome sempre esteja em um estado válido.
 */
export class Name {
  private readonly _value: string

  /**
   * Construtor privado - use create() ou fromDatabase()
   */
  private constructor(value: string) {
    this._value = value
  }

  /**
   * Cria uma nova instância de Name com validação
   * Use este método ao receber dados externos (formulários, APIs)
   *
   * @throws Error se o nome for inválido
   */
  static create(value: string): Name {
    const trimmed = value.trim()

    if (trimmed.length === 0) {
      throw new Error('Nome não pode ser vazio')
    }

    if (trimmed.length < 3) {
      throw new Error('Nome deve ter pelo menos 3 caracteres')
    }

    if (trimmed.length > 100) {
      throw new Error('Nome deve ter no máximo 100 caracteres')
    }

    return new Name(trimmed)
  }

  /**
   * Cria uma instância de Name a partir de dados do banco
   * Não faz validação pois assume que o dado já foi validado
   */
  static fromDatabase(value: string): Name {
    return new Name(value)
  }

  /**
   * Retorna o valor encapsulado
   */
  get value(): string {
    return this._value
  }

  /**
   * Converte para string para uso no banco de dados
   */
  toString(): string {
    return this._value
  }

  /**
   * Serialização JSON para respostas de API
   */
  toJSON(): string {
    return this._value
  }
}
