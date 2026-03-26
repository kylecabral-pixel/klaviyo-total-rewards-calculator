import crypto from 'crypto'

/**
 * Greenhouse webhook: Signature header = hex-encoded SHA-256 HMAC of raw body.
 * @see https://developers.greenhouse.io/webhooks.html
 */
export function verifyGreenhouseSignature(rawBody, signatureHeader, secret) {
  if (!secret || typeof signatureHeader !== 'string') return false
  const expectedHex = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex')
  let sigHex = signatureHeader.trim().toLowerCase()
  if (sigHex.startsWith('sha256=')) sigHex = sigHex.slice(7)
  if (!/^[0-9a-f]*$/.test(sigHex) || sigHex.length % 2 !== 0) return false
  try {
    const a = Buffer.from(expectedHex, 'hex')
    const b = Buffer.from(sigHex, 'hex')
    if (a.length !== b.length) return false
    return crypto.timingSafeEqual(a, b)
  } catch {
    return false
  }
}
