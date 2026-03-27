import {
  findOfferByToken,
  getOfferRow,
  createOffer,
  updateOffer,
  toPublicOffer,
} from '../offersStore.js'
import { lookupValuesForSeed } from '../services/compensationLookup.js'
import { requireRecruiter } from '../middleware/recruiterAuth.js'

/**
 * @param {import('express').Express} app
 */
export function registerOfferRoutes(app) {
  app.get('/api/offer', (req, res) => {
    const token = req.query.token
    if (!token || typeof token !== 'string') {
      return res.status(400).json({ ok: false, error: 'Missing token' })
    }
    const row = findOfferByToken(token.trim())
    if (!row) {
      return res.status(404).json({ ok: false, error: 'Offer not found' })
    }
    res.json(toPublicOffer(row))
  })

  app.post('/api/recruiter/offer', requireRecruiter, (req, res) => {
    try {
      const body = req.body && typeof req.body === 'object' ? req.body : {}
      let initial = { ...body }
      delete initial.seedFromLookup
      const sl = body.seedFromLookup
      if (sl && typeof sl === 'object' && sl.roleText) {
        const seeded = lookupValuesForSeed(sl.roleText, sl.region || 'US')
        if (seeded) Object.assign(initial, seeded)
      }
      const created = createOffer(initial)
      res.status(201).json({
        ok: true,
        offerId: created.offerId,
        token: created.token,
        recruiter: stripTokenForRecruiter(created),
      })
    } catch (e) {
      res.status(500).json({ ok: false, error: String(e?.message || e) })
    }
  })

  app.put('/api/recruiter/offer/:offerId', requireRecruiter, (req, res) => {
    try {
      const { offerId } = req.params
      const patch = req.body && typeof req.body === 'object' ? req.body : {}
      const updated = updateOffer(offerId, patch)
      if (!updated) {
        return res.status(404).json({ ok: false, error: 'Offer not found' })
      }
      res.json({
        ok: true,
        offerId: updated.offerId,
        token: updated.token,
        recruiter: stripTokenForRecruiter(updated),
      })
    } catch (e) {
      res.status(500).json({ ok: false, error: String(e?.message || e) })
    }
  })

  app.get('/api/recruiter/offer/:offerId', requireRecruiter, (req, res) => {
    const row = getOfferRow(req.params.offerId)
    if (!row) {
      return res.status(404).json({ ok: false, error: 'Offer not found' })
    }
    res.json({
      ok: true,
      offerId: row.offerId,
      token: row.token,
      recruiter: stripTokenForRecruiter(row),
    })
  })
}

function stripTokenForRecruiter(row) {
  const { token, ...rest } = row
  return { ...rest, shareUrlHint: `?offer=${encodeURIComponent(token)}` }
}
