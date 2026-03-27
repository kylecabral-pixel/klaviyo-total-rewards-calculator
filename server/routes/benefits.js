import { loadUsBenefits } from '../benefitsFromPdf.js'

/**
 * @param {import('express').Express} app
 */
export function registerBenefitsRoutes(app) {
  app.get('/api/benefits/us', async (_req, res) => {
    try {
      const payload = await loadUsBenefits()
      res.json({ ok: true, ...payload })
    } catch (e) {
      res.status(500).json({ ok: false, error: String(e?.message || e) })
    }
  })
}
