import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))

/** @type {{ version?: string, name?: string }} */
let _pkg
try {
  _pkg = JSON.parse(
    readFileSync(join(__dirname, '../package.json'), 'utf8'),
  )
} catch {
  _pkg = {}
}

/** Public API product name (matches Vercel project / marketing). */
export const SERVICE_NAME = 'klaviyo-total-rewards-calculator-api'

export const PACKAGE_NAME = _pkg.name || 'klaviyo-wealth-model'
export const SERVICE_VERSION = _pkg.version || '0.0.0'

/**
 * Vercel / CI identifiers for health checks (no secrets).
 * @returns {{ vercelEnv: string | null, gitSha: string | null }}
 */
export function getDeploymentMeta() {
  return {
    vercelEnv: process.env.VERCEL_ENV ?? null,
    gitSha:
      process.env.VERCEL_GIT_COMMIT_SHA ??
      process.env.GIT_COMMIT_SHA ??
      null,
  }
}

/** Curated list for GET /api discovery (keep in sync with server/routes). */
export const API_ENDPOINTS = [
  'GET /api/auth/session',
  'GET /api/auth/klaviyo/start',
  'GET /api/auth/klaviyo/callback',
  'POST /api/auth/logout',
  'GET /api/health',
  'GET /api — discovery (this list)',
  'GET /api/offer?token=',
  'GET /api/benefits/us',
  'GET /api/benefits/us/pdf',
  'GET|POST /api/compensation/lookup',
  'GET /api/integrations/status',
  'GET /api/integrations/lumpages/status',
  'GET /api/integrations/gdrive/status',
  'POST /api/webhooks/greenhouse',
  'POST /api/recruiter/offer (Bearer)',
  'PUT /api/recruiter/offer/:offerId (Bearer)',
  'GET /api/recruiter/offer/:offerId (Bearer)',
  'POST /api/integrations/lumpages/search (Bearer)',
]
