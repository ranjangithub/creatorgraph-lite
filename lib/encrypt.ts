import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'

const ALGORITHM = 'aes-256-gcm'

function getKey(): Buffer {
  const secret = process.env.ENCRYPTION_SECRET
  if (!secret || secret.length < 64) {
    throw new Error('ENCRYPTION_SECRET must be a 64-char hex string (32 bytes). Generate one with: openssl rand -hex 32')
  }
  return Buffer.from(secret.slice(0, 64), 'hex')
}

export function encrypt(plaintext: string): string {
  const key = getKey()
  const iv  = randomBytes(12)
  const cipher = createCipheriv(ALGORITHM, key, iv)
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  // Format: iv:tag:ciphertext (all hex)
  return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`
}

export function decrypt(encoded: string): string {
  const key = getKey()
  const parts = encoded.split(':')
  if (parts.length !== 3) throw new Error('Invalid encrypted value format')
  const [ivHex, tagHex, cipherHex] = parts
  const iv        = Buffer.from(ivHex,    'hex')
  const tag       = Buffer.from(tagHex,   'hex')
  const encrypted = Buffer.from(cipherHex,'hex')
  const decipher  = createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(tag)
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8')
}

export function maskApiKey(key: string): string {
  if (key.length < 12) return '****'
  return `${key.slice(0, 7)}...${key.slice(-4)}`
}
