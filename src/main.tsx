import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { QueryClientProvider } from '@tanstack/react-query'
import { ErrorBoundary } from './ErrorBoundary'
import { queryClient } from './services/queryClient'

// ── Registrar Service Worker ───────────────────────────────────
async function registerSW() {
  if (!('serviceWorker' in navigator)) return

  try {
    // Desregistrar cualquier SW viejo que no sea /sw.js
    const regs = await navigator.serviceWorker.getRegistrations()
    for (const reg of regs) {
      const url = reg.active?.scriptURL ?? reg.installing?.scriptURL ?? ''
      if (!url.endsWith('/sw.js')) {
        await reg.unregister()
        console.log('SW viejo eliminado:', url)
      }
    }

    // Limpiar cachés de versiones anteriores
    const keys = await caches.keys()
    for (const key of keys) {
      if (key !== 'ros-v5') {
        await caches.delete(key)
        console.log('Caché viejo eliminado:', key)
      }
    }

    // Registrar el SW actual
    const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' })
    console.log('SW registrado:', reg.scope)

    // Activar inmediatamente si hay uno esperando
    if (reg.waiting) {
      reg.waiting.postMessage({ type: 'SKIP_WAITING' })
    }

    reg.addEventListener('updatefound', () => {
      const w = reg.installing
      if (!w) return
      w.addEventListener('statechange', () => {
        if (w.state === 'installed' && navigator.serviceWorker.controller) {
          w.postMessage({ type: 'SKIP_WAITING' })
        }
      })
    })

    // Recargar cuando cambie el SW activo
    let reloading = false
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!reloading) {
        reloading = true
        window.location.reload()
      }
    })

  } catch (err) {
    console.warn('SW no disponible:', err)
  }
}

// Registrar después de que la app cargue
window.addEventListener('load', registerSW)

ReactDOM.createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </ErrorBoundary>,
)
