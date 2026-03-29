import { isAuthEnabled } from '../auth/appBaseUrl.js'
import { readSiteSessionCookie, verifySession } from '../auth/sessionCookie.js'
import { hasRecruiterBearer } from './recruiterAuth.js'

/**
 * When AUTH_ENABLED=true, require a valid signed site session for /api/* except allowlist.
 * Mount after auth routes (so /api/auth/* handlers run first) and before other API routes.
 */
export function siteAuthMiddleware(req, res, next) {
  if (!isAuthEnabled()) return next()

  const p =
    (req.originalUrl || req.url || req.path || '').split('?')[0] || ''

  if (p.startsWith('/api/auth')) return next()
  if (p === '/api/health' || p === '/api') return next()

  if (
    hasRecruiterBearer(req) &&
    (p.startsWith('/api/recruiter') ||
      p === '/api/integrations/lumpages/search')
  ) {
    return next()
  }

  const raw = readSiteSessionCookie(req)
  if (verifySession(raw)) return next()

  res.status(401).json({ ok: false, error: 'Unauthorized', code: 'SITE_AUTH' })
}
