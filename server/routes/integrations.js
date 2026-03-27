import { getLumPagesConfig } from '../integrations/lumpages/client.js'
import { searchKnowledge } from '../integrations/lumpages/searchKnowledge.js'
import { getGDriveStatus } from '../integrations/gdrive/client.js'
import { requireRecruiter } from '../middleware/recruiterAuth.js'

const GREENHOUSE_WEBHOOK_SECRET = process.env.GREENHOUSE_WEBHOOK_SECRET || ''

/**
 * Integration status + stub endpoints (LumPages / GDrive) with clear boundaries for future wiring.
 * @param {import('express').Express} app
 */
export function registerIntegrationsRoutes(app) {
  app.get('/api/integrations/status', (_req, res) => {
    const { baseUrl } = getLumPagesConfig()
    res.json({
      ok: true,
      greenhouse: {
        harvestConfigured: Boolean(process.env.GREENHOUSE_API_KEY),
        webhookSecretConfigured: Boolean(GREENHOUSE_WEBHOOK_SECRET),
      },
      lumpages: {
        baseUrlConfigured: Boolean(baseUrl),
      },
      gdrive: getGDriveStatus(),
    })
  })

  /** Public: LumPages connectivity summary only (no external call). */
  app.get('/api/integrations/lumpages/status', (_req, res) => {
    const { baseUrl, apiKey } = getLumPagesConfig()
    res.json({
      ok: true,
      configured: Boolean(baseUrl),
      hasApiKey: Boolean(apiKey),
      stub: true,
      message:
        'Full LumPages client: use fetchPageBySlug / searchKnowledge (recruiter) when internal routes are ready.',
    })
  })

  /** Public: GDrive scaffold summary (no secrets). */
  app.get('/api/integrations/gdrive/status', (_req, res) => {
    res.json({ ok: true, ...getGDriveStatus(), stub: true })
  })

  /**
   * Recruiter-only stub: will call LumPages search API when implemented.
   * Body: { query?: string }
   */
  app.post(
    '/api/integrations/lumpages/search',
    requireRecruiter,
    async (req, res) => {
      try {
        const query =
          (req.body && typeof req.body.query === 'string'
            ? req.body.query
            : '') ||
          (typeof req.query.q === 'string' ? req.query.q : '')
        const result = await searchKnowledge(query)
        res.json({ ok: true, ...result })
      } catch (e) {
        res
          .status(500)
          .json({ ok: false, error: String(e?.message || e) })
      }
    },
  )
}
