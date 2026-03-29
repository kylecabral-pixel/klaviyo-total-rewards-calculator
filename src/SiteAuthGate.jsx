import { useState, useEffect, useCallback } from 'react'

const B = {
  charcoal: '#232121',
  poppy: '#F96353',
  cotton: '#FFFCF9',
  fog: '#A09A95',
}

function SignOutControl() {
  return (
    <button
      type="button"
      onClick={() => {
        fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
          .catch(() => {})
          .finally(() => {
            window.location.reload()
          })
      }}
      style={{
        position: 'fixed',
        bottom: 16,
        right: 16,
        zIndex: 50,
        fontFamily: "'Instrument Sans', system-ui, sans-serif",
        fontSize: 11,
        fontWeight: 600,
        color: B.fog,
        background: '#fff',
        border: `1px solid ${B.fog}`,
        borderRadius: 6,
        padding: '6px 10px',
        cursor: 'pointer',
      }}
    >
      Sign out
    </button>
  )
}

/**
 * When AUTH_ENABLED on the API, blocks the SPA until Klaviyo OAuth completes.
 * Set VITE_SKIP_AUTH_GATE=true at build time to disable this UI and lock the
 * site with Vercel Deployment Protection (password / SSO) instead.
 */
export function SiteAuthGate({ children }) {
  const skipGate = import.meta.env.VITE_SKIP_AUTH_GATE === 'true'
  const [phase, setPhase] = useState(() => (skipGate ? 'in' : 'loading'))
  const [authErr] = useState(() => {
    if (typeof window === 'undefined') return null
    return new URLSearchParams(window.location.search).get('auth_error')
  })
  const [showSignOut, setShowSignOut] = useState(false)

  const refresh = useCallback((opts = { showLoading: true }) => {
    if (opts.showLoading) setPhase('loading')
    fetch('/api/auth/session', { credentials: 'include' })
      .then(async (r) => {
        let d = {}
        try {
          d = await r.json()
        } catch {
          d = {}
        }
        if (r.ok && d.ok === true) {
          setShowSignOut(!d.bypass)
          setPhase('in')
          return
        }
        if (r.status === 401) {
          setShowSignOut(false)
          setPhase('out')
          return
        }
        setShowSignOut(false)
        setPhase('api_error')
      })
      .catch(() => {
        setShowSignOut(false)
        setPhase('api_error')
      })
  }, [])

  useEffect(() => {
    if (skipGate) return
    const p = new URLSearchParams(window.location.search)
    if (p.get('auth_error')) {
      const u = new URL(window.location.href)
      u.searchParams.delete('auth_error')
      window.history.replaceState({}, '', u.pathname + u.search)
    }
    queueMicrotask(() => refresh({ showLoading: false }))
  }, [refresh, skipGate])

  if (skipGate) return children

  if (phase === 'api_error') {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: B.cotton,
          padding: 24,
          fontFamily: "'Instrument Sans', system-ui, sans-serif",
        }}
      >
        <div style={{ maxWidth: 440, width: '100%', textAlign: 'center' }}>
          <h1
            style={{
              fontSize: 20,
              fontWeight: 800,
              color: B.charcoal,
              marginBottom: 10,
              letterSpacing: '-0.02em',
            }}
          >
            Can’t reach the API
          </h1>
          <p
            style={{
              fontSize: 14,
              color: B.fog,
              lineHeight: 1.55,
              marginBottom: 20,
            }}
          >
            <strong>Local dev:</strong> run{' '}
            <code style={{ fontSize: 12, background: '#eee', padding: '2px 6px', borderRadius: 4 }}>
              npm run dev:all
            </code>{' '}
            (API on <strong>:3001</strong>, Vite on <strong>:5173</strong> so{' '}
            <code style={{ fontSize: 11 }}>/api</code> proxies).{' '}
            <strong>Production:</strong> confirm the latest deployment succeeded and
            `/api/health` loads.
          </p>
          <button
            type="button"
            onClick={() => refresh({ showLoading: true })}
            style={{
              background: B.charcoal,
              color: '#fff',
              border: 'none',
              fontWeight: 700,
              fontSize: 14,
              padding: '10px 22px',
              borderRadius: 8,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (phase === 'loading') {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: B.cotton,
          fontFamily: "'Instrument Sans', system-ui, sans-serif",
        }}
      >
        <div style={{ color: B.fog, fontSize: 14 }}>Loading…</div>
      </div>
    )
  }

  if (phase === 'out') {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: B.cotton,
          padding: 24,
          fontFamily: "'Instrument Sans', system-ui, sans-serif",
        }}
      >
        <div style={{ maxWidth: 420, width: '100%', textAlign: 'center' }}>
          <h1
            style={{
              fontSize: 22,
              fontWeight: 800,
              color: B.charcoal,
              marginBottom: 8,
              letterSpacing: '-0.02em',
            }}
          >
            Klaviyo Total Rewards
          </h1>
          <p
            style={{
              fontSize: 14,
              color: B.fog,
              lineHeight: 1.5,
              marginBottom: 24,
            }}
          >
            Sign in with your Klaviyo account to open this calculator.
          </p>
          {authErr ? (
            <p
              style={{
                fontSize: 13,
                color: '#b42318',
                marginBottom: 16,
                lineHeight: 1.4,
              }}
            >
              {authErr}
            </p>
          ) : null}
          <a
            href="/api/auth/klaviyo/start"
            style={{
              display: 'inline-block',
              background: B.charcoal,
              color: '#fff',
              textDecoration: 'none',
              fontWeight: 700,
              fontSize: 14,
              padding: '12px 24px',
              borderRadius: 8,
              letterSpacing: '0.02em',
            }}
          >
            Continue with Klaviyo
          </a>
          <p
            style={{
              fontSize: 11,
              color: B.fog,
              marginTop: 20,
              lineHeight: 1.45,
            }}
          >
            OAuth scope{' '}
            <code style={{ fontSize: 10 }}>accounts:read</code> only. Register
            redirect URI{' '}
            <code style={{ fontSize: 9, wordBreak: 'break-all' }}>
              …/api/auth/klaviyo/callback
            </code>{' '}
            in{' '}
            <a
              href="https://www.klaviyo.com/manage-apps"
              target="_blank"
              rel="noreferrer"
              style={{ color: B.poppy }}
            >
              Klaviyo → Manage apps
            </a>
            .
          </p>
        </div>
      </div>
    )
  }

  return (
    <>
      {children}
      {showSignOut ? <SignOutControl /> : null}
    </>
  )
}
