/**
 * Value Object - Email
 *
 * Encapsula as regras de validação para endereços de email.
 * Normaliza o email para lowercase e garante formato válido.
 */
export class Email {
  private readonly _value: string

  /**
   * Construtor privado - use create() ou fromDatabase()
   */
  private constructor(value: string) {
    this._value = value
  }

  /**
   * Cria uma nova instância de Email com validação
   * Normaliza o email para lowercase
   *
   * @throws Error se o email for inválido
   */
  static create(value: string): Email {
    const trimmed = value.trim().toLowerCase()

    if (!this.isValid(trimmed)) {
      throw new Error('Email inválido')
    }

    return new Email(trimmed)
  }

  /**
   * Cria uma instância de Email a partir de dados do banco
   * Não faz validação pois assume que o dado já foi validado
   */
  static fromDatabase(value: string): Email {
    return new Email(value)
  }

  /**
   * Valida se o formato do email é válido
   */
  private static isValid(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
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
