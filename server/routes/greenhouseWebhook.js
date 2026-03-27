import express from 'express'
import {
  verifyGreenhouseSignature,
  mapApplicationToOfferPatch,
  mapWebhookBodyToApplicationStub,
  fetchApplication,
} from '../integrations/greenhouse/index.js'
import { upsertOfferByGreenhouseApplicationId } from '../offersStore.js'

const GREENHOUSE_WEBHOOK_SECRET = process.env.GREENHOUSE_WEBHOOK_SECRET || ''

/**
 * Mount before express.json(). Greenhouse needs raw body for HMAC verification.
 * @param {import('express').Express} app
 */
export function mountGreenhouseWebhook(app) {
  app.post(
    '/api/webhooks/greenhouse',
    express.raw({ type: 'application/json' }),
    async (req, res) => {
      try {
        const raw =
          req.body instanceof Buffer
            ? req.body
            : Buffer.from(String(req.body || ''), 'utf8')
        const sig =
          req.get('Signature') ||
          req.get('X-Greenhouse-Signature') ||
          req.get('X-Hub-Signature-256') ||
          ''

        if (GREENHOUSE_WEBHOOK_SECRET) {
          if (
            !verifyGreenhouseSignature(
              raw,
              String(sig),
              GREENHOUSE_WEBHOOK_SECRET,
            )
          ) {
            return res.status(401).json({ ok: false, error: 'Invalid signature' })
          }
        } else if (process.env.NODE_ENV === 'production') {
          return res.status(500).json({
            ok: false,
            error: 'GREENHOUSE_WEBHOOK_SECRET must be set in production',
          })
        } else {
          console.warn(
            '[greenhouse] GREENHOUSE_WEBHOOK_SECRET not set — skipping webhook signature verification (dev)',
          )
        }

        let body
        try {
          body = JSON.parse(raw.toString('utf8'))
        } catch {
          return res.status(400).json({ ok: false, error: 'Invalid JSON' })
        }

        const { application, applicationId } =
          mapWebhookBodyToApplicationStub(body)
        if (!applicationId) {
          return res
            .status(400)
            .json({ ok: false, error: 'Missing application id' })
        }

        let patch = mapApplicationToOfferPatch(application)
        if (process.env.GREENHOUSE_API_KEY) {
          const full = await fetchApplication(applicationId)
          if (full && typeof full === 'object') {
            patch = { ...mapApplicationToOfferPatch(full), ...patch }
          }
        }

        patch.greenhouseApplicationId = applicationId
        const row = upsertOfferByGreenhouseApplicationId(applicationId, patch)
        if (!row) {
          return res.status(500).json({ ok: false, error: 'Upsert failed' })
        }
        return res.json({ ok: true, offerId: row.offerId })
      } catch (e) {
        console.error('[greenhouse webhook]', e)
        return res
          .status(500)
          .json({ ok: false, error: String(e?.message || e) })
      }
    },
  )
}
