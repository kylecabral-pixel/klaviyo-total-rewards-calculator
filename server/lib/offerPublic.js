/**
 * Candidate-facing offer payload + visibility for one-time cash lines.
 * Greenhouse / recruiter set amounts + optional showSignOn/showRelocation;
 * when omitted, visibility defaults from amounts (> 0) for legacy rows.
 */

const INTERNAL_KEYS = new Set([
  'token',
  'greenhouseApplicationId',
  'signOnSource',
  'reloSource',
])

/**
 * @param {Record<string, unknown>} row — full offer row (may include token)
 * @returns {{ showSignOn: boolean, showRelocation: boolean }}
 */
export function computePublicVisibility(row) {
  const signOn = Number(row?.signOn) || 0
  const relo = Number(row?.relo) || 0
  const showSignOn =
    row?.showSignOn !== undefined ? Boolean(row.showSignOn) : signOn > 0
  const showRelocation =
    row?.showRelocation !== undefined
      ? Boolean(row.showRelocation)
      : relo > 0
  return { showSignOn, showRelocation }
}

/**
 * Public GET /api/offer response (no token, no internal linkage).
 */
export function toPublicOffer(row) {
  if (!row) return null
  const { token: _t, offerId, updatedAt, ...rest } = row
  const { showSignOn, showRelocation } = computePublicVisibility(row)
  const publicFields = {}
  for (const [k, v] of Object.entries(rest)) {
    if (INTERNAL_KEYS.has(k)) continue
    if (k === 'showSignOn' || k === 'showRelocation') continue
    publicFields[k] = v
  }
  return {
    ok: true,
    offerId,
    updatedAt,
    ...publicFields,
    showSignOn,
    showRelocation,
  }
}
