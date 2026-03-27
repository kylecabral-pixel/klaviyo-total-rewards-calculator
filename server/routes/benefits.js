import fs from 'fs'
import {
  getUsBenefitsMeta,
  getUsBenefitsPdfAbsolutePath,
} from '../benefitsFromPdf.js'

/**
 * @param {import('express').Express} app
 */
export function registerBenefitsRoutes(app) {
  app.get('/api/benefits/us', async (_req, res) => {
    try {
      const payload = await getUsBenefitsMeta()
      res.json(payload)
    } catch (e) {
      res.status(500).json({ ok: false, error: String(e?.message || e) })
    }
  })

  /** Download the official US benefits PDF (no inline rendering in the app). */
  app.get('/api/benefits/us/pdf', (_req, res) => {
    const pdfPath = getUsBenefitsPdfAbsolutePath()
    if (!fs.existsSync(pdfPath)) {
      return res.status(404).json({ ok: false, error: 'PDF not available' })
    }
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="Klaviyo-US-Benefits-At-a-Glance.pdf"',
    )
    fs.createReadStream(pdfPath).pipe(res)
  })
}
