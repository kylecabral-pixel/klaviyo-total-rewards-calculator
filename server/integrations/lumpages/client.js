/**
 * LumPages HTTP client (scaffold). Configure LUMPAGES_BASE_URL + LUMPAGES_API_KEY.
 */

export function getLumPagesConfig() {
  return {
    baseUrl: (process.env.LUMPAGES_BASE_URL || '').replace(/\/$/, ''),
    apiKey: process.env.LUMPAGES_API_KEY || '',
  }
}

/** @param {string} path - e.g. /api/pages/foo */
export async function lumPagesFetch(path, init = {}) {
  const { baseUrl, apiKey } = getLumPagesConfig()
  if (!baseUrl) {
    throw new Error('LUMPAGES_BASE_URL is not set')
  }
  const url = `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`
  const headers = {
    ...(init.headers || {}),
    ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
  }
  return fetch(url, { ...init, headers })
}

/** @param {string} slugOrId */
export async function fetchPageBySlug(slugOrId) {
  const res = await lumPagesFetch(`/pages/${encodeURIComponent(slugOrId)}`)
  if (!res.ok) return null
  return res.json()
}
