/**
 * Canonical public origin for OAuth redirect_uri and post-login redirects.
 */
export function getAppBaseUrl() {
  const raw = process.env.APP_BASE_URL?.trim()
  if (raw) return raw.replace(/\/$/, '')
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  return 'http://localhost:5173'
}

export function isAuthEnabled() {
  return String(process.env.AUTH_ENABLED || '').toLowerCase() === 'true'
}
