/**
 * Minimal Harvest API client (scaffold). Set GREENHOUSE_API_KEY in env.
 * @see https://developers.greenhouse.io/harvest.html
 */

const HARVEST = 'https://harvest.greenhouse.io/v1'

export function getGreenhouseApiKey() {
  return process.env.GREENHOUSE_API_KEY || ''
}

/** @param {string} applicationId */
export async function fetchApplication(applicationId) {
  const key = getGreenhouseApiKey()
  if (!key || !applicationId) return null
  const url = `${HARVEST}/applications/${encodeURIComponent(applicationId)}`
  const res = await fetch(url, {
    headers: {
      Authorization: `Basic ${Buffer.from(`${key}:`).toString('base64')}`,
      'Content-Type': 'application/json',
    },
  })
  if (!res.ok) return null
  return res.json()
}
