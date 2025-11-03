import fs from 'node:fs'
import path from 'node:path'

/**
 * Deleta arquivo de upload de forma segura
 *
 * @param filename - Nome do arquivo (UUID)
 * @param uploadDir - Diretório de uploads
 * @throws Error se arquivo não existir ou erro ao deletar
 */
export async function deleteUploadedFile(filename: string, uploadDir: string): Promise<void> {
  // Validar que filename é UUID válido (previne path traversal)
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.[a-z0-9]+$/i

  if (!uuidRegex.test(filename)) {
    throw new Error('Nome de arquivo inválido')
  }

  const filepath = path.join(uploadDir, filename)

  // Verificar se arquivo existe
  try {
    await fs.promises.access(filepath)
  } catch {
    throw new Error('Arquivo não encontrado')
  }

  // Deletar arquivo
  await fs.promises.unlink(filepath)
}
