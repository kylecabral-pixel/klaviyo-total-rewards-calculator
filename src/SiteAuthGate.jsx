import { useState, useEffect, useCallback } from 'react'

const B = {
  charcoal: '#232121',
  poppy: '#F96353',
  cotton: '#FFFCF9',
  fog: '#A09A95',
  slate: '#5C5654',
}

function ApiWarningBanner({ onDismiss, onRetry }) {
  return (
    <div
      role="alert"
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: '#fff8e6',
        borderBottom: `1px solid ${B.poppy}`,
        padding: '10px 16px',
        fontFamily: "'Instrument Sans', system-ui, sans-serif",
        fontSize: 13,
        color: B.charcoal,
        lineHeight: 1.45,
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: '10px 14px',
        justifyContent: 'space-between',
      }}
    >
      <span>
        <strong>Backend not reachable</strong> — the calculator will load, but
        data that needs <code style={{ fontSize: 11 }}>/api</code> may fail.{' '}
        <strong>Local:</strong>{' '}
        <code style={{ fontSize: 11, background: 'rgba(0,0,0,0.06)', padding: '2px 6px', borderRadius: 4 }}>
          npm run dev:all
        </code>
        . <strong>Production:</strong> open{' '}
        <a href="/api/health" style={{ color: B.poppy, fontWeight: 600 }}>
          /api/health
        </a>
        ; set <code style={{ fontSize: 11 }}>VITE_SKIP_AUTH_GATE=true</code> on
        Vercel if you use Deployment Protection only.
      </span>
      <span style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
        <button
          type="button"
          onClick={onRetry}
          style={{
            background: B.charcoal,
            color: '#fff',
            border: 'none',
            fontWeight: 600,
            fontSize: 12,
            padding: '6px 12px',
            borderRadius: 6,
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          Retry
        </button>
        <button
          type="button"
          onClick={onDismiss}
          style={{
            background: 'transparent',
            color: B.slate,
            border: `1px solid ${B.fog}`,
            fontWeight: 600,
            fontSize: 12,
            padding: '6px 12px',
            borderRadius: 6,
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          Dismiss
        </button>
      </span>
    </div>
  )
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
  const [apiUnreachable, setApiUnreachable] = useState(false)

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
          setApiUnreachable(false)
          setPhase('in')
          return
        }
        if (r.status === 401) {
          setShowSignOut(false)
          setApiUnreachable(false)
          setPhase('out')
          return
        }
        setShowSignOut(false)
        setApiUnreachable(true)
        setPhase('in')
      })
      .catch(() => {
        setShowSignOut(false)
        setApiUnreachable(true)
        setPhase('in')
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
      {apiUnreachable ? (
        <ApiWarningBanner
          onDismiss={() => setApiUnreachable(false)}
          onRetry={() => refresh({ showLoading: true })}
        />
      ) : null}
      {children}
      {showSignOut ? <SignOutControl /> : null}
    </>
  )
}
