import { getLumPagesConfig } from './client.js'

/**
 * LumPages KB search — **stub** until internal API path and auth are finalized.
 * Replace implementation with real HTTP call to LumPages search (or RAG) when spec is available.
 *
 * @param {string} query
 * @returns {Promise<{ ok: boolean, configured: boolean, stub: boolean, query: string, results: unknown[], message?: string }>}
 */
export async function searchKnowledge(query) {
  const { baseUrl } = getLumPagesConfig()
  const q = String(query ?? '').trim()

  if (!baseUrl) {
    return {
      ok: false,
      configured: false,
      stub: true,
      query: q,
      results: [],
      message: 'LUMPAGES_BASE_URL is not set',
    }
  }

  return {
    ok: true,
    configured: true,
    stub: true,
    query: q,
    results: [],
    message:
      'LumPages search not wired yet; implement against internal KB API when credentials and routes are available.',
  }
}
