import { randomBytes, createCipheriv, createDecipheriv } from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const PREFIX = 'enc:v1:'

function getKey(): Buffer {
  const secret = process.env.ENCRYPTION_SECRET
  if (!secret) throw new Error('ENCRYPTION_SECRET environment variable is not set')
  const buf = Buffer.from(secret, 'hex')
  if (buf.length !== 32) throw new Error('ENCRYPTION_SECRET must be 64 hex characters (32 bytes)')
  return buf
}

export function encrypt(plaintext: string): string {
  const key = getKey()
  const iv = randomBytes(12) // 96-bit IV recommended for GCM
  const cipher = createCipheriv(ALGORITHM, key, iv)
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const authTag = cipher.getAuthTag()
  return PREFIX + [iv.toString('hex'), authTag.toString('hex'), encrypted.toString('hex')].join(':')
}

/**
 * Decrypts a value encrypted by `encrypt()`.
 * If the value does not start with the encryption prefix it is returned as-is
 * (backward compatibility for keys saved before encryption was introduced).
 */
export function decrypt(value: string): string {
  if (!value.startsWith(PREFIX)) return value // legacy plaintext

  const key = getKey()
  const parts = value.slice(PREFIX.length).split(':')
  if (parts.length !== 3) throw new Error('Invalid encrypted value format')

  const [ivHex, authTagHex, encryptedHex] = parts
  const iv = Buffer.from(ivHex, 'hex')
  const authTag = Buffer.from(authTagHex, 'hex')
  const encrypted = Buffer.from(encryptedHex, 'hex')

  const decipher = createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(authTag)
  return decipher.update(encrypted).toString('utf8') + decipher.final('utf8')
}
