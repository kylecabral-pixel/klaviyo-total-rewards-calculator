import crypto from 'node:crypto'

const COOKIE = 'kwm_site'

function getSecret() {
  const s = process.env.AUTH_SESSION_SECRET
  if (!s || s.length < 16) {
    throw new Error('AUTH_SESSION_SECRET must be set (min 16 chars) when AUTH_ENABLED=true')
  }
  return s
}

/**
 * @returns {string} "payload.sig" base64url
 */
export function signSession() {
  const exp = Date.now() + 7 * 24 * 60 * 60 * 1000
  const payload = Buffer.from(JSON.stringify({ v: 1, exp }), 'utf8').toString(
    'base64url',
  )
  const sig = crypto
    .createHmac('sha256', getSecret())
    .update(payload)
    .digest('base64url')
  return `${payload}.${sig}`
}

/**
 * @param {string} value cookie value
 * @returns {{ v: number, exp: number } | null}
 */
export function verifySession(value) {
  if (!value || typeof value !== 'string') return null
  const dot = value.indexOf('.')
  if (dot < 1) return null
  const payload = value.slice(0, dot)
  const sig = value.slice(dot + 1)
  let secret
  try {
    secret = getSecret()
  } catch {
    return null
  }
  const expect = crypto.createHmac('sha256', secret).update(payload).digest()
  let sigBuf
  try {
    sigBuf = Buffer.from(sig, 'base64url')
  } catch {
    return null
  }
  if (sigBuf.length !== expect.length) return null
  if (!crypto.timingSafeEqual(sigBuf, expect)) return null
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'))
    if (data.v !== 1 || typeof data.exp !== 'number') return null
    if (data.exp < Date.now()) return null
    return data
  } catch {
    return null
  }
}

export function readSiteSessionCookie(req) {
  const raw = req.headers.cookie
  if (!raw) return null
  for (const part of raw.split(';')) {
    const [k, ...rest] = part.trim().split('=')
    if (k === COOKIE) {
      return decodeURIComponent(rest.join('=').trim())
    }
  }
  return null
}

/**
 * @param {import('express').Response} res
 * @param {string} value signed session or empty to clear
 */
export function setSiteSessionCookie(res, value) {
  const secure =
    process.env.VERCEL === '1' || process.env.NODE_ENV === 'production'
  const parts = [
    `${COOKIE}=${value ? encodeURIComponent(value) : ''}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    'Max-Age=' + (value ? String(7 * 24 * 60 * 60) : '0'),
  ]
  if (secure) parts.push('Secure')
  res.append('Set-Cookie', parts.join('; '))
}

export function setOAuthCookies(res, state, codeVerifier) {
  const secure =
    process.env.VERCEL === '1' || process.env.NODE_ENV === 'production'
  const base = ['Path=/', 'HttpOnly', 'SameSite=Lax', 'Max-Age=600']
  if (secure) base.push('Secure')
  res.append(
    'Set-Cookie',
    `kwm_oauth_st=${encodeURIComponent(state)}; ${base.join('; ')}`,
  )
  res.append(
    'Set-Cookie',
    `kwm_oauth_cv=${encodeURIComponent(codeVerifier)}; ${base.join('; ')}`,
  )
}

export function clearOAuthCookies(res) {
  const secure =
    process.env.VERCEL === '1' || process.env.NODE_ENV === 'production'
  const base = ['Path=/', 'HttpOnly', 'SameSite=Lax', 'Max-Age=0']
  if (secure) base.push('Secure')
  res.append('Set-Cookie', `kwm_oauth_st=; ${base.join('; ')}`)
  res.append('Set-Cookie', `kwm_oauth_cv=; ${base.join('; ')}`)
}

export function readOAuthCookies(req) {
  const raw = req.headers.cookie
  if (!raw) return { state: null, codeVerifier: null }
  let state = null
  let codeVerifier = null
  for (const part of raw.split(';')) {
    const [k, ...rest] = part.trim().split('=')
    const v = decodeURIComponent(rest.join('=').trim())
    if (k === 'kwm_oauth_st') state = v
    if (k === 'kwm_oauth_cv') codeVerifier = v
  }
  return { state, codeVerifier }
}
