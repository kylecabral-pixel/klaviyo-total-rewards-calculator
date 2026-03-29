import {
  getAppBaseUrl,
  isAuthEnabled,
} from '../auth/appBaseUrl.js'
import { generatePkcePair, randomState } from '../auth/klaviyoPkce.js'
import crypto from 'node:crypto'
import {
  clearOAuthCookies,
  readOAuthCookies,
  setOAuthCookies,
  setSiteSessionCookie,
  signSession,
  verifySession,
  readSiteSessionCookie,
} from '../auth/sessionCookie.js'

const KLAVIYO_AUTH = 'https://www.klaviyo.com/oauth/authorize'
const KLAVIYO_TOKEN = 'https://a.klaviyo.com/oauth/token'
/** Least-privilege scope for “logged into Klaviyo” only (required baseline for OAuth apps). */
const SCOPE = 'accounts:read'

function getKlaviyoClient() {
  const clientId = process.env.KLAVIYO_OAUTH_CLIENT_ID?.trim()
  const clientSecret = process.env.KLAVIYO_OAUTH_CLIENT_SECRET?.trim()
  if (!clientId || !clientSecret) {
    throw new Error(
      'KLAVIYO_OAUTH_CLIENT_ID and KLAVIYO_OAUTH_CLIENT_SECRET are required when AUTH_ENABLED=true',
    )
  }
  return { clientId, clientSecret }
}

function redirectUri() {
  return `${getAppBaseUrl()}/api/auth/klaviyo/callback`
}

function safeTimingEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false
  const ba = Buffer.from(a, 'utf8')
  const bb = Buffer.from(b, 'utf8')
  if (ba.length !== bb.length) return false
  return crypto.timingSafeEqual(ba, bb)
}

/**
 * @param {import('express').Express} app
 */
export function registerAuthRoutes(app) {
  app.get('/api/auth/session', (req, res) => {
    if (!isAuthEnabled()) {
      return res.json({ ok: true, bypass: true })
    }
    const raw = readSiteSessionCookie(req)
    if (verifySession(raw)) {
      return res.json({ ok: true, provider: 'klaviyo' })
    }
    return res.status(401).json({ ok: false })
  })

  app.get('/api/auth/klaviyo/start', (req, res) => {
    if (!isAuthEnabled()) {
      return res.redirect(`${getAppBaseUrl()}/`)
    }
    let clientId
    try {
      ;({ clientId } = getKlaviyoClient())
    } catch (e) {
      return res.status(500).send(String(e?.message || e))
    }

    const state = randomState()
    const { codeVerifier, codeChallenge } = generatePkcePair()
    setOAuthCookies(res, state, codeVerifier)
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: clientId,
      redirect_uri: redirectUri(),
      scope: SCOPE,
      state,
      code_challenge_method: 'S256',
      code_challenge: codeChallenge,
    })

    res.redirect(`${KLAVIYO_AUTH}?${params.toString()}`)
  })

  app.get('/api/auth/klaviyo/callback', async (req, res) => {
    const base = getAppBaseUrl()
    if (!isAuthEnabled()) {
      return res.redirect(`${base}/`)
    }

    const err = req.query.error
    if (err) {
      clearOAuthCookies(res)
      const desc =
        typeof req.query.error_description === 'string'
          ? req.query.error_description
          : String(err)
      return res.redirect(
        `${base}/?auth_error=${encodeURIComponent(desc.slice(0, 200))}`,
      )
    }

    const code = req.query.code
    const state = req.query.state
    if (typeof code !== 'string' || typeof state !== 'string') {
      clearOAuthCookies(res)
      return res.redirect(
        `${base}/?auth_error=${encodeURIComponent('Missing code or state')}`,
      )
    }

    const cookies = readOAuthCookies(req)
    clearOAuthCookies(res)

    if (
      !cookies.state ||
      !cookies.codeVerifier ||
      !safeTimingEqual(cookies.state, state)
    ) {
      return res.redirect(
        `${base}/?auth_error=${encodeURIComponent('Invalid OAuth state — try again')}`,
      )
    }

    let clientId
    let clientSecret
    try {
      ;({ clientId, clientSecret } = getKlaviyoClient())
    } catch (e) {
      return res.status(500).send(String(e?.message || e))
    }

    const basic = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')

    let tokenRes
    try {
      tokenRes = await fetch(KLAVIYO_TOKEN, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${basic}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          code_verifier: cookies.codeVerifier,
          redirect_uri: redirectUri(),
        }).toString(),
      })
    } catch (e) {
      return res.redirect(
        `${base}/?auth_error=${encodeURIComponent(String(e?.message || 'Token request failed'))}`,
      )
    }

    const text = await tokenRes.text()
    let body
    try {
      body = JSON.parse(text)
    } catch {
      body = { raw: text }
    }

    if (!tokenRes.ok) {
      const msg =
        typeof body.error_description === 'string'
          ? body.error_description
          : typeof body.error === 'string'
            ? body.error
            : `HTTP ${tokenRes.status}`
      return res.redirect(
        `${base}/?auth_error=${encodeURIComponent(msg.slice(0, 200))}`,
      )
    }

    try {
      setSiteSessionCookie(res, signSession())
    } catch (e) {
      return res.status(500).send(String(e?.message || e))
    }

    res.redirect(`${base}/`)
  })

  app.post('/api/auth/logout', (req, res) => {
    setSiteSessionCookie(res, '')
    res.json({ ok: true })
  })
}
