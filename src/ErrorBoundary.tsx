import { Component, type ReactNode, type ErrorInfo } from 'react'

interface Props { children: ReactNode }
interface State { hasError: boolean; error: string }

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: '' }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error: error.message ?? String(error) }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('App crash:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh', backgroundColor: '#D8DAE4',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: '2rem', fontFamily: 'Nunito, sans-serif',
          gap: '1rem',
        }}>
          <div style={{
            width: 64, height: 64, borderRadius: '1rem', overflow: 'hidden',
            boxShadow: '8px 8px 16px rgba(130,142,170,0.5),-8px -8px 16px rgba(255,255,255,0.5)',
          }}>
            <img src="/logo.jpg" alt="logo"
              style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          <p style={{ fontWeight: 700, color: '#2D3561', fontSize: '1rem', textAlign: 'center' }}>
            Algo salió mal. Recargando...
          </p>
          <p style={{ fontSize: '0.7rem', color: '#8B92AA', textAlign: 'center', maxWidth: 280 }}>
            {this.state.error}
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: '0.5rem',
              padding: '0.75rem 2rem',
              backgroundColor: '#FF5722',
              color: '#fff', fontWeight: 700,
              border: 'none', borderRadius: '1rem',
              cursor: 'pointer', fontSize: '0.9rem',
              boxShadow: '8px 8px 16px rgba(255,87,34,0.32),-4px -4px 12px rgba(255,255,255,0.45)',
            }}
          >
            🔄 Recargar
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
