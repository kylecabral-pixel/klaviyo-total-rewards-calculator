/**
 * Map Greenhouse Harvest / webhook payloads into offer store patches.
 * Adjust name_key strings to match your org's custom fields in Greenhouse.
 */

const SIGN_ON_KEYS = new Set(['sign_on', 'sign_on_bonus', 'signon', 'sign_on_amount'])
const RELO_KEYS = new Set(['relocation', 'relocation_bonus', 'relo', 'relocation_amount'])
const RELO_FLAG_KEYS = new Set(['includes_relocation', 'relocation_offered'])

function num(v) {
  if (v == null || v === '') return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

/** Normalize Harvest custom_fields array or keyed_custom_fields object */
function normalizeCustomFields(raw) {
  if (!raw) return []
  if (Array.isArray(raw)) return raw
  if (typeof raw === 'object') {
    return Object.entries(raw).map(([name_key, v]) => ({
      name_key,
      value: v && typeof v === 'object' && 'value' in v ? v.value : v,
    }))
  }
  return []
}

/** @param {{ name?: string, name_key?: string, value?: unknown }[]} customFields */
function readCustomFields(customFields) {
  let signOn = null
  let relo = null
  let reloFlag = null
  for (const f of customFields) {
    const key = String(f?.name_key || f?.name || '')
      .toLowerCase()
      .replace(/\s+/g, '_')
    const raw = f?.value
    if (SIGN_ON_KEYS.has(key)) {
      const n = num(raw)
      if (n != null) signOn = n
    }
    if (RELO_KEYS.has(key)) {
      const n = num(raw)
      if (n != null) relo = n
    }
    if (RELO_FLAG_KEYS.has(key)) {
      if (raw === true || raw === 'true' || raw === '1') reloFlag = true
      if (raw === false || raw === 'false' || raw === '0') reloFlag = false
    }
  }
  return { signOn, relo, reloFlag }
}

/**
 * Build patch from a Harvest "application" style object (nested payload).
 * @param {Record<string, unknown>} application
 */
export function mapApplicationToOfferPatch(application) {
  const patch = {}
  const app = /** @type {any} */ (application)
  const list = normalizeCustomFields(
    app?.custom_fields || app?.keyed_custom_fields,
  )
  const cf = readCustomFields(list)

  if (cf.signOn != null) {
    patch.signOn = cf.signOn
    patch.showSignOn = cf.signOn > 0
    patch.signOnSource = 'greenhouse'
  }
  if (cf.relo != null) {
    patch.relo = cf.relo
    patch.showRelocation = cf.relo > 0
    patch.reloSource = 'greenhouse'
  } else if (cf.reloFlag === true) {
    patch.showRelocation = true
    patch.reloSource = 'greenhouse'
  } else if (cf.reloFlag === false) {
    patch.showRelocation = false
    patch.relo = 0
    patch.reloSource = 'greenhouse'
  }

  const cand = app?.candidate
  if (cand?.first_name || cand?.last_name) {
    const name = [cand.first_name, cand.last_name].filter(Boolean).join(' ')
    if (name) patch.name = name
  }
  const job = app?.jobs?.[0] || app?.job
  if (job?.name) patch.role = job.name

  return patch
}

/**
 * Webhook envelope: Greenhouse sends action + payload with application id.
 */
export function mapWebhookBodyToApplicationStub(body) {
  const b = body && typeof body === 'object' ? body : {}
  const payload = /** @type {any} */ (b).payload || b
  const application = payload.application || payload
  const applicationId =
    application?.id ??
    payload?.application_id ??
    /** @type {any} */ (b).application_id
  return { application, applicationId: applicationId != null ? String(applicationId) : null }
}
