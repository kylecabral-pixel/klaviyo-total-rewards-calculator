import crypto from 'crypto'

/**
 * Greenhouse webhook: Signature header = hex-encoded SHA-256 HMAC of raw body.
 * @see https://developers.greenhouse.io/webhooks.html
 */
export function verifyGreenhouseSignature(rawBody, signatureHeader, secret) {
  if (!secret || typeof signatureHeader !== 'string') return false
  const expected = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex')
  const sig = signatureHeader.trim()
  try {
    const a = Buffer.from(expected, 'utf8')
    const b = Buffer.from(sig, 'utf8')
    if (a.length !== b.length) return false
    return crypto.timingSafeEqual(a, b)
  } catch {
    return false
  }
}
