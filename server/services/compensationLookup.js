import { parseRoleText } from '../parseRoleText.js'
import { lookupCompensation } from '../parseCompensationCsv.js'

/** Base salary not in CSV; level-based placeholder aligned with typical bands. */
export const SALARY_BY_LEVEL = {
  L6: 320000,
  L5: 265000,
  L4: 205000,
  L3: 160000,
  L2: 128000,
  L1: 102000,
  L0: 88000,
}

export function regionToTier(region) {
  const r = String(region || 'US').toUpperCase()
  if (r === 'US') return 'TIER1'
  return 'TIER2'
}

/**
 * @param {string} roleText
 * @param {string} region
 * @returns {{ kind: 'ok', body: object } | { kind: 'bad_request', body: object } | { kind: 'not_found', body: object }}
 */
export function performCompensationLookup(roleText, region) {
  const parsed = parseRoleText(roleText)
  const tier = regionToTier(region)

  if (!parsed.level) {
    return {
      kind: 'bad_request',
      body: {
        ok: false,
        error: 'Could not detect level (L0–L6) in role text.',
        parsed,
        tier,
      },
    }
  }

  const row = lookupCompensation({
    tier,
    level: parsed.level,
    track: parsed.track,
    equityPath: parsed.equityPath,
  })

  if (!row.ok) {
    return {
      kind: 'not_found',
      body: { ok: false, error: row.error, parsed, tier },
    }
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

  return {
    kind: 'ok',
    body: {
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
    },
  }
}

/**
 * Seed object for recruiter offer creation from role text (USD table values).
 * @param {string} roleText
 * @param {string} [region]
 * @returns {object | null}
 */
export function lookupValuesForSeed(roleText, region) {
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
