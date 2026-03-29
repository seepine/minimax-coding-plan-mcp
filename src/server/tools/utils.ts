import { MinimaxRequestError } from './types.js'
import { readFile } from 'node:fs/promises'
import { isAbsolute, resolve, extname } from 'node:path'

export async function processImageUrl(imageSource: string): Promise<string> {
  // If it's already a data URL or HTTP URL, return as is
  if (imageSource.startsWith('data:')) {
    return imageSource
  }
  if (imageSource.startsWith('http://') || imageSource.startsWith('https://')) {
    const response = await fetch(imageSource)
    if (!response.ok) {
      throw new MinimaxRequestError(`Image URL is not accessible: ${imageSource}`)
    }
    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const base64 = buffer.toString('base64')
    return `data:${response.headers.get('content-type') || 'image/png'};base64,${base64}`
  }
  // If it's a local file path (strip @ prefix if present)
  const filePath = imageSource.replace(/^@/, '')
  // Check if file exists
  try {
    const absolutePath = isAbsolute(filePath) ? filePath : resolve(process.cwd(), filePath)
    const buffer = await readFile(absolutePath)
    const base64 = buffer.toString('base64')
    const ext = extname(filePath).toLowerCase().slice(1)
    const mimeType = ext === 'jpg' ? 'jpeg' : ext
    return `data:image/${mimeType};base64,${base64}`
  } catch {
    throw new MinimaxRequestError(`Failed to read image file: ${filePath}`)
  }
}
