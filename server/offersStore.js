import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import crypto from 'crypto'
import { toPublicOffer } from './lib/offerPublic.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const FILE = path.join(__dirname, 'data', 'offers.json')

const ALLOWED_PATCH_KEYS = [
  'name',
  'role',
  'startDate',
  'region',
  'coverageType',
  'salary',
  'bonusPct',
  'signOn',
  'relo',
  'newHireGrant',
  'annualRefresh',
  'currentPrice',
  'growth1',
  'growth2',
  'showSignOn',
  'showRelocation',
  'greenhouseApplicationId',
  'signOnSource',
  'reloSource',
]

function defaultOfferFields() {
  return {
    name: '',
    role: '',
    startDate: '2026-05-15',
    region: 'US',
    coverageType: 'individual',
    salary: 300000,
    bonusPct: 0.2,
    signOn: 0,
    relo: 0,
    newHireGrant: 2000000,
    annualRefresh: 200000,
    currentPrice: 25,
    growth1: 0.1,
    growth2: 0.15,
  }
}

export function readOffersDb() {
  const raw = fs.readFileSync(FILE, 'utf8')
  return JSON.parse(raw)
}

export function writeOffersDb(db) {
  try {
    const tmp = `${FILE}.tmp`
    fs.writeFileSync(tmp, `${JSON.stringify(db, null, 2)}\n`, 'utf8')
    fs.renameSync(tmp, FILE)
  } catch (err) {
    const e = /** @type {NodeJS.ErrnoException} */ (err)
    if (e.code === 'EROFS' || e.code === 'EPERM' || e.code === 'ENOTSUP') {
      throw new Error(
        'Offer storage is read-only on this host (e.g. Vercel). Recruiter create/update and Greenhouse upsert need a database or local API.',
      )
    }
    throw err
  }
}

export function findOfferByToken(token) {
  if (!token || typeof token !== 'string') return null
  const db = readOffersDb()
  const offers = db.offers || {}
  for (const [offerId, row] of Object.entries(offers)) {
    if (row.token === token) return { offerId, ...row }
  }
  return null
}

export function getOfferRow(offerId) {
  const db = readOffersDb()
  const row = db.offers?.[offerId]
  if (!row) return null
  return { offerId, ...row }
}

export { toPublicOffer }

export function pickOfferFields(obj) {
  if (!obj || typeof obj !== 'object') return {}
  const out = {}
  for (const k of ALLOWED_PATCH_KEYS) {
    if (obj[k] !== undefined) out[k] = obj[k]
  }
  return out
}

export function createOffer(initial = {}) {
  const db = readOffersDb()
  if (!db.offers) db.offers = {}
  const offerId = crypto.randomUUID()
  const token = crypto.randomBytes(24).toString('hex')
  const now = new Date().toISOString()
  const row = {
    token,
    updatedAt: now,
    ...defaultOfferFields(),
    ...pickOfferFields(initial),
  }
  db.offers[offerId] = row
  writeOffersDb(db)
  return { offerId, ...row }
}

export function updateOffer(offerId, patch) {
  const db = readOffersDb()
  if (!db.offers?.[offerId]) return null
  const cur = db.offers[offerId]
  const next = {
    ...cur,
    updatedAt: new Date().toISOString(),
  }
  for (const k of ALLOWED_PATCH_KEYS) {
    if (patch[k] !== undefined) next[k] = patch[k]
  }
  db.offers[offerId] = next
  writeOffersDb(db)
  return { offerId, ...next }
}

/**
 * Create or update offer keyed by Greenhouse application id (webhook / Harvest sync).
 */
export function upsertOfferByGreenhouseApplicationId(applicationId, patch) {
  if (!applicationId) return null
  const db = readOffersDb()
  if (!db.offers) db.offers = {}
  for (const [offerId, row] of Object.entries(db.offers)) {
    if (String(row.greenhouseApplicationId || '') === String(applicationId)) {
      return updateOffer(offerId, { ...patch, greenhouseApplicationId: applicationId })
    }
  }
  return createOffer({ ...patch, greenhouseApplicationId: applicationId })
}
