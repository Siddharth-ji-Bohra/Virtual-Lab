import { Component } from 'react'

/**
 * ErrorBoundary — Catches rendering errors in child components
 * Prevents full app crash from canvas or chart errors
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="flex flex-col items-center justify-center p-8 text-center"
          style={{
            background: 'var(--color-bg-raised)',
            borderRadius: '12px',
            margin: '12px',
            flex: 1,
          }}
        >
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center mb-3 text-xl"
            style={{ background: 'rgba(248, 113, 113, 0.12)' }}
          >
            ⚠️
          </div>
          <p className="text-sm font-semibold mb-1" style={{ color: 'var(--color-text-primary)' }}>
            {this.props.label || 'Something went wrong'}
          </p>
          <p className="text-xs mb-4" style={{ color: 'var(--color-text-muted)' }}>
            {this.state.error?.message || 'An unexpected error occurred'}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="px-4 py-2 rounded-lg text-xs font-semibold transition-colors"
            style={{
              background: 'var(--color-accent)',
              color: 'var(--color-text-inverse)',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Try Again
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
