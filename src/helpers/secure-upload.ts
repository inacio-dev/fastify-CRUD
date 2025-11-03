import { randomUUID } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { pipeline } from 'node:stream/promises'

import type { MultipartFile } from '@fastify/multipart'
import type NodeClam from 'clamscan'
import { fileTypeFromFile } from 'file-type'

/**
 * Opções de configuração para upload seguro
 */
export interface SecureUploadOptions {
  allowedMimes: string[] // MIMEs permitidos
  maxSize: number // Tamanho máximo em bytes
  uploadDir: string // Diretório de destino
  virusScanning: boolean // Habilitar scan de vírus
}

/**
 * Resultado do upload seguro
 */
export interface SecureUploadResult {
  filename: string // Nome UUID do arquivo salvo
  originalName: string // Nome original do arquivo
  path: string // Caminho completo do arquivo salvo
  mime: string // MIME type real do arquivo
  size: number // Tamanho em bytes
}

/**
 * Realiza upload seguro de arquivo com validações:
 *
 * 1. UUID rename (previne path traversal)
 * 2. Validação de tamanho
 * 3. Magic number verification (valida MIME real)
 * 4. Virus scanning com ClamAV (opcional)
 *
 * @param file - Arquivo multipart do Fastify
 * @param options - Opções de segurança
 * @param clamscan - Instância do ClamAV (opcional)
 * @returns Informações do arquivo salvo
 * @throws Error se validação falhar
 */
export async function secureUpload(
  file: MultipartFile,
  options: SecureUploadOptions,
  clamscan?: NodeClam,
): Promise<SecureUploadResult> {
  // 1. Validar tamanho (antes de salvar para economizar I/O)
  if (file.file.bytesRead > options.maxSize) {
    throw new Error(
      `Arquivo excede tamanho máximo de ${(options.maxSize / 1024 / 1024).toFixed(2)}MB`,
    )
  }

  // 2. Gerar nome seguro com UUID (previne path traversal e conflitos)
  const ext = path.extname(file.filename).toLowerCase()
  const safeFilename = `${randomUUID()}${ext}`
  const tempPath = path.join('/tmp', safeFilename)

  try {
    // 3. Salvar temporariamente em /tmp para validações
    await pipeline(file.file, fs.createWriteStream(tempPath))

    // Obter tamanho real do arquivo salvo
    const stats = await fs.promises.stat(tempPath)
    const fileSize = stats.size

    // Revalidar tamanho após salvar
    if (fileSize > options.maxSize) {
      throw new Error(
        `Arquivo excede tamanho máximo de ${(options.maxSize / 1024 / 1024).toFixed(2)}MB`,
      )
    }

    // 4. Verificar tipo REAL do arquivo via magic numbers
    const fileType = await fileTypeFromFile(tempPath)

    if (!fileType) {
      throw new Error('Não foi possível identificar o tipo do arquivo')
    }

    if (!options.allowedMimes.includes(fileType.mime)) {
      throw new Error(
        `Tipo de arquivo não permitido: ${fileType.mime}. Permitidos: ${options.allowedMimes.join(', ')}`,
      )
    }

    // 5. Virus scanning (se habilitado e ClamAV disponível)
    if (options.virusScanning && clamscan) {
      const { isInfected, viruses } = await clamscan.isInfected(tempPath)

      if (isInfected) {
        throw new Error(`Arquivo contém vírus ou malware: ${viruses?.join(', ') || 'desconhecido'}`)
      }
    }

    // 6. Garantir que diretório de destino existe
    await fs.promises.mkdir(options.uploadDir, { recursive: true })

    // 7. Mover para diretório final
    const finalPath = path.join(options.uploadDir, safeFilename)
    await fs.promises.rename(tempPath, finalPath)

    // 8. Retornar informações do arquivo
    return {
      filename: safeFilename,
      originalName: file.filename,
      path: finalPath,
      mime: fileType.mime,
      size: fileSize,
    }
  } catch (error) {
    // Limpar arquivo temporário em caso de erro
    try {
      await fs.promises.unlink(tempPath)
    } catch {
      // Ignora erro se arquivo já foi removido
    }

    // Re-throw erro original
    throw error
  }
}
