import { createHash, createCipheriv, createDecipheriv, randomBytes } from 'crypto'

const ENC_PREFIX = 'enc:'

function getKey(): Buffer {
  const secret = process.env.API_KEY_ENCRYPTION_SECRET
  if (!secret) throw new Error('API_KEY_ENCRYPTION_SECRET env var is not set')
  return createHash('sha256').update(secret).digest()
}

/**
 * Encrypts a plaintext string using AES-256-GCM.
 * Returns `enc:<iv_hex>:<authTag_hex>:<ciphertext_hex>`.
 */
export function encrypt(plaintext: string): string {
  const key = getKey()
  const iv = randomBytes(12) // 96-bit IV — recommended for GCM
  const cipher = createCipheriv('aes-256-gcm', key, iv)
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const authTag = cipher.getAuthTag()
  return `${ENC_PREFIX}${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`
}

/**
 * Decrypts a value produced by `encrypt()`.
 * If the value does not start with the `enc:` prefix it is treated as legacy
 * plaintext and returned unchanged — safe for the initial migration period.
 */
export function decrypt(stored: string): string {
  if (!stored.startsWith(ENC_PREFIX)) return stored // legacy plaintext
  try {
    const inner = stored.slice(ENC_PREFIX.length)
    const [ivHex, authTagHex, encryptedHex] = inner.split(':')
    const key = getKey()
    const decipher = createDecipheriv('aes-256-gcm', key, Buffer.from(ivHex, 'hex'))
    decipher.setAuthTag(Buffer.from(authTagHex, 'hex'))
    return (
      decipher.update(Buffer.from(encryptedHex, 'hex')).toString('utf8') +
      decipher.final('utf8')
    )
  } catch {
    return stored // fallback — return stored value rather than crashing
  }
}
