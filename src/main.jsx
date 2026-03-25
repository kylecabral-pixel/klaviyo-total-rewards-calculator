import { StrictMode, Component } from 'react'
import { createRoot } from 'react-dom/client'
import KlaviyoWealthModel from './klaviyo-wealth-model.jsx'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  render() {
    if (this.state.error) {
      return (
        <div
          style={{
            fontFamily: 'system-ui, sans-serif',
            maxWidth: '40rem',
            margin: '2rem auto',
            padding: '0 1rem',
            lineHeight: 1.5,
          }}
        >
          <h1 style={{ fontSize: '1.1rem' }}>Something went wrong</h1>
          <pre
            style={{
              background: '#f5f5f5',
              padding: '1rem',
              overflow: 'auto',
              fontSize: '12px',
            }}
          >
            {String(this.state.error)}
          </pre>
        </div>
      )
    }
    return this.props.children
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <KlaviyoWealthModel />
    </ErrorBoundary>
  </StrictMode>,
)
