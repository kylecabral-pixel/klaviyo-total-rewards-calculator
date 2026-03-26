import express from 'express'
import cors from 'cors'
import { parseRoleText } from './parseRoleText.js'
import { lookupCompensation } from './parseCompensationCsv.js'
import { loadUsBenefits } from './benefitsFromPdf.js'
import {
  findOfferByToken,
  getOfferRow,
  createOffer,
  updateOffer,
  toPublicOffer,
  upsertOfferByGreenhouseApplicationId,
} from './offersStore.js'
import {
  verifyGreenhouseSignature,
  mapApplicationToOfferPatch,
  mapWebhookBodyToApplicationStub,
  fetchApplication,
} from './integrations/greenhouse/index.js'
import { getLumPagesConfig } from './integrations/lumpages/client.js'
import { getGDriveFolderId } from './integrations/gdrive/client.js'

const RECRUITER_KEY =
  process.env.RECRUITER_API_KEY || 'dev-insecure-recruiter-key-change-me'

const GREENHOUSE_WEBHOOK_SECRET = process.env.GREENHOUSE_WEBHOOK_SECRET || ''

function requireRecruiter(req, res, next) {
  if (
    process.env.NODE_ENV === 'production' &&
    !process.env.RECRUITER_API_KEY
  ) {
    return res
      .status(500)
      .json({ ok: false, error: 'RECRUITER_API_KEY is not set' })
  }
  const auth = req.headers.authorization || ''
  const m = auth.match(/^Bearer\s+(.+)$/i)
  if (!m || m[1] !== RECRUITER_KEY) {
    return res.status(401).json({ ok: false, error: 'Unauthorized' })
  }
  next()
}

/** Base salary not in CSV; level-based placeholder aligned with typical bands. */
const SALARY_BY_LEVEL = {
  L6: 320000,
  L5: 265000,
  L4: 205000,
  L3: 160000,
  L2: 128000,
  L1: 102000,
  L0: 88000,
}

function regionToTier(region) {
  const r = String(region || 'US').toUpperCase()
  if (r === 'US') return 'TIER1'
  return 'TIER2'
}

const app = express()
app.use(cors())

app.post(
  '/api/webhooks/greenhouse',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    try {
      const raw = req.body instanceof Buffer ? req.body : Buffer.from(String(req.body || ''), 'utf8')
      const sig =
        req.get('Signature') ||
        req.get('X-Greenhouse-Signature') ||
        req.get('X-Hub-Signature-256') ||
        ''

      if (GREENHOUSE_WEBHOOK_SECRET) {
        if (!verifyGreenhouseSignature(raw, String(sig), GREENHOUSE_WEBHOOK_SECRET)) {
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

      const { application, applicationId } = mapWebhookBodyToApplicationStub(body)
      if (!applicationId) {
        return res.status(400).json({ ok: false, error: 'Missing application id' })
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
      return res.status(500).json({ ok: false, error: String(e?.message || e) })
    }
  },
)

app.use(express.json())

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'klaviyo-wealth-model-api' })
})

app.get('/api/integrations/status', (_req, res) => {
  const { baseUrl } = getLumPagesConfig()
  res.json({
    ok: true,
    greenhouse: {
      harvestConfigured: Boolean(process.env.GREENHOUSE_API_KEY),
      webhookSecretConfigured: Boolean(GREENHOUSE_WEBHOOK_SECRET),
    },
    lumpages: { baseUrlConfigured: Boolean(baseUrl) },
    gdrive: { folderConfigured: Boolean(getGDriveFolderId()) },
  })
})

app.get('/api/compensation/lookup', (req, res) => {
  const roleText = req.query.q ?? req.query.roleText ?? ''
  const region = req.query.region ?? 'US'
  return runLookup(res, roleText, region)
})

app.post('/api/compensation/lookup', (req, res) => {
  const roleText = req.body?.roleText ?? ''
  const region = req.body?.region ?? 'US'
  return runLookup(res, roleText, region)
})

function runLookup(res, roleText, region) {
  const parsed = parseRoleText(roleText)
  const tier = regionToTier(region)

  if (!parsed.level) {
    return res.status(400).json({
      ok: false,
      error: 'Could not detect level (L0–L6) in role text.',
      parsed,
      tier,
    })
  }

  const row = lookupCompensation({
    tier,
    level: parsed.level,
    track: parsed.track,
    equityPath: parsed.equityPath,
  })

  if (!row.ok) {
    return res.status(404).json({ ok: false, error: row.error, parsed, tier })
  }

  const salary = SALARY_BY_LEVEL[parsed.level] ?? 150000
  const warnings = []
  if (parsed.confidence === 'low') {
    warnings.push(
      'Low confidence parsing role; verify track (Eng, Product, Sales, …) and level.',
    )
  } else if (parsed.confidence === 'medium') {
    warnings.push('Track inferred as Eng; adjust role text if another function fits.')
  }

  res.json({
    ok: true,
    tier,
    parsed,
    values: {
      salary,
      bonusPct: row.bonusPct,
      newHireGrant: row.newHireGrant,
      annualRefresh: row.annualRefresh,
      signOn: 0,
      relo: 0,
      grantTableDollar: row.grantTableDollar,
    },
    meta: {
      pilotEngMid: row.pilotEngMid,
      pilotPmMid: row.pilotPmMid,
    },
    warnings,
  })
}

app.get('/api/benefits/us', async (_req, res) => {
  try {
    const payload = await loadUsBenefits()
    res.json({ ok: true, ...payload })
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e?.message || e) })
  }
})

function lookupValuesForSeed(roleText, region) {
  const parsed = parseRoleText(roleText)
  const tier = regionToTier(region)
  if (!parsed.level) return null
  const row = lookupCompensation({
    tier,
    level: parsed.level,
    track: parsed.track,
    equityPath: parsed.equityPath,
  })
  if (!row.ok) return null
  const salary = SALARY_BY_LEVEL[parsed.level] ?? 150000
  return {
    role: roleText,
    region: region || 'US',
    salary,
    bonusPct: row.bonusPct,
    newHireGrant: row.newHireGrant,
    annualRefresh: row.annualRefresh,
    signOn: 0,
    relo: 0,
  }
}

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

function stripTokenForRecruiter(row) {
  const { token, ...rest } = row
  return { ...rest, shareUrlHint: `?offer=${encodeURIComponent(token)}` }
}

export default app
