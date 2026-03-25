import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { parse } from 'csv-parse/sync'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const CSV_NAME =
  '2026 Klaviyo Compensation Ranges - 2026 Equity & Bonus Table.csv'

const TRACK_COLUMNS = [
  'Eng',
  'ML',
  'Design',
  'Product',
  'IT',
  'People',
  'Finance',
  'Legal',
  'Marketing',
  'CS',
  'Sales',
]

export function parseMoneyCell(s) {
  if (s == null || String(s).trim() === '') return null
  const n = Number(String(s).replace(/[$,]/g, '').trim())
  return Number.isFinite(n) ? n : null
}

export function parseBonusPct(s) {
  if (s == null) return null
  const m = String(s).match(/(\d+(?:\.\d+)?)\s*%/)
  if (m) return Number(m[1]) / 100
  const n = Number(String(s).replace('%', '').trim())
  return Number.isFinite(n) ? n / 100 : null
}

function normCell(v) {
  return String(v ?? '')
    .trim()
    .replace(/^["']|["']$/g, '')
}

function loadRows() {
  const csvPath = path.join(__dirname, '..', 'Source', CSV_NAME)
  const raw = fs.readFileSync(csvPath, 'utf8')
  return parse(raw, {
    relax_column_count: true,
    skip_empty_lines: false,
  })
}

function levelKeyFromRow(cell) {
  const m = normCell(cell).match(/^(L\d)/i)
  return m ? m[1].toUpperCase() : null
}

/**
 * Build structured lookup from the Klaviyo 2026 CSV (Tier 1/2 grant tables + Pilot R&D equity).
 */
export function buildCompensationLookup() {
  const rows = loadRows()
  const tier1Grant = {}
  const tier2Grant = {}
  const tier1Pilot = {}

  let mode = null
  let expectHeader = false

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i].map(normCell)

    if (row[1]?.includes('TIER 2')) {
      mode = 'tier2_header'
      expectHeader = true
      continue
    }
    if (row[1]?.includes('Pilot R&D Equity Ranges')) {
      mode = 'pilot_subtitle'
      continue
    }

    if (row[1]?.includes('TIER 1 - US')) {
      mode = 'tier1_header'
      expectHeader = true
      continue
    }
    if (mode === 'tier1_header' || mode === 'tier2_header') {
      if (row[3] === 'Eng' && row[4] === 'ML') {
        mode = mode === 'tier1_header' ? 'tier1_rows' : 'tier2_rows'
        expectHeader = false
        continue
      }
      continue
    }

    if (mode === 'tier1_rows') {
      const lv = levelKeyFromRow(row[1])
      if (!lv) {
        if (!row[1] && !row[2]) mode = null
        continue
      }
      const bonusPct = parseBonusPct(row[2])
      const entry = { bonusPct }
      TRACK_COLUMNS.forEach((t, j) => {
        entry[t] = parseMoneyCell(row[3 + j])
      })
      tier1Grant[lv] = entry
      continue
    }

    if (mode === 'tier2_rows') {
      const lv = levelKeyFromRow(row[1])
      if (!lv) {
        mode = null
        continue
      }
      const bonusPct = parseBonusPct(row[2])
      const entry = { bonusPct }
      TRACK_COLUMNS.forEach((t, j) => {
        entry[t] = parseMoneyCell(row[3 + j])
      })
      tier2Grant[lv] = entry
      continue
    }

    if (mode === 'pilot_subtitle') {
      if (row[2] === 'Min' && row[3] === 'Mid') {
        mode = 'pilot_rows'
      }
      continue
    }

    if (mode === 'pilot_rows') {
      const lv = levelKeyFromRow(row[1])
      if (!lv) {
        mode = null
        continue
      }
      tier1Pilot[lv] = {
        engMin: parseMoneyCell(row[2]),
        engMid: parseMoneyCell(row[3]),
        engMax: parseMoneyCell(row[4]),
        pmMin: parseMoneyCell(row[5]),
        pmMid: parseMoneyCell(row[6]),
        pmMax: parseMoneyCell(row[7]),
      }
    }
  }

  return { tier1Grant, tier2Grant, tier1Pilot, tracks: TRACK_COLUMNS }
}

let cached = null
export function getCompensationLookup() {
  if (!cached) cached = buildCompensationLookup()
  return cached
}

/**
 * @param {object} opts
 * @param {'TIER1'|'TIER2'} opts.tier
 * @param {string} opts.level L0–L6
 * @param {string} opts.track Eng|ML|Design|…
 * @param {'engineering'|'pm'} opts.equityPath pilot column group
 */
export function lookupCompensation({ tier, level, track, equityPath }) {
  const { tier1Grant, tier2Grant, tier1Pilot } = getCompensationLookup()
  const grantRow =
    tier === 'TIER2' ? tier2Grant[level] : tier1Grant[level]
  const pilot = tier1Pilot[level]

  if (!grantRow) {
    return { ok: false, error: `Unknown level: ${level}` }
  }

  const trackKey = TRACK_COLUMNS.includes(track) ? track : 'Eng'
  const grantTableDollar = grantRow[trackKey]

  let newHireGrant = null
  let pilotEngMid = null
  let pilotPmMid = null
  if (pilot) {
    pilotEngMid = pilot.engMid
    pilotPmMid = pilot.pmMid
    const baseMid = equityPath === 'pm' ? pilotPmMid : pilotEngMid
    if (tier === 'TIER2' && pilotEngMid && grantRow.Eng) {
      const t1 = tier1Grant[level]
      const ratio =
        t1?.Eng && t1.Eng > 0 ? grantRow.Eng / t1.Eng : 0.75
      newHireGrant =
        baseMid != null ? Math.round(baseMid * ratio) : grantTableDollar
    } else {
      newHireGrant = baseMid ?? grantTableDollar
    }
  } else {
    newHireGrant = grantTableDollar
  }

  const annualRefresh =
    newHireGrant != null
      ? Math.round((newHireGrant * 0.175) / 5000) * 5000
      : null

  return {
    ok: true,
    bonusPct: grantRow.bonusPct,
    grantTableDollar,
    newHireGrant,
    annualRefresh,
    pilotEngMid,
    pilotPmMid,
  }
}
