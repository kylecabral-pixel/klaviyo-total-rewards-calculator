import crypto from 'node:crypto'

function base64Url(buf) {
  return buf
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

export function randomState() {
  return base64Url(crypto.randomBytes(32))
}

export function generatePkcePair() {
  const codeVerifier = base64Url(crypto.randomBytes(32))
  const codeChallenge = base64Url(
    crypto.createHash('sha256').update(codeVerifier, 'utf8').digest(),
  )
  return { codeVerifier, codeChallenge }
}
