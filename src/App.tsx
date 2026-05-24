import { useState, useEffect, useCallback } from 'react'
import { supabase }  from './services/supabaseClient'
import Login         from './pages/Login'
import Dashboard     from './pages/Dashboard'
import PublicMenu    from './pages/PublicMenu'
import type { Session } from '@supabase/supabase-js'

// Ruta pública — evaluada una sola vez, fuera del componente
const IS_PUBLIC_MENU = window.location.pathname.startsWith('/menu')

function SplashScreen() {
  return (
    <div style={{
      minHeight: '100dvh',
      backgroundColor: '#D8DAE4',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: '1.5rem',
      fontFamily: '"Nunito", sans-serif',
    }}>
      <div style={{
        width: 96, height: 96, borderRadius: '1.5rem', overflow: 'hidden', flexShrink: 0,
        boxShadow: '8px 8px 16px rgba(130,142,170,0.55),-8px -8px 16px rgba(255,255,255,0.55)',
      }}>
        <img src="/logo.jpg" alt="RestaurantOS"
          style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }} />
      </div>
      <p style={{ color: '#2D3561', fontFamily: '"DM Sans", sans-serif', fontWeight: 700, fontSize: '1.25rem' }}>
        RestaurantOS
      </p>
      <div style={{
        width: 28, height: 28, borderRadius: '50%',
        border: '3px solid #CDD0DC', borderTopColor: '#FF5722',
        animation: 'spin 0.8s linear infinite',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

// Componente independiente para la ruta /menu — no comparte estado con App
function PublicMenuRoute() {
  return <PublicMenu />
}

export default function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  // onLogin: no hace getSession() extra — deja que onAuthStateChange maneje todo
  // Esto elimina la race condition en móvil
  const handleLogin = useCallback(() => {
    // onAuthStateChange ya va a disparar con la sesión nueva.
    // No hacemos nada aquí — el estado se actualiza solo.
  }, [])

  useEffect(() => {
    // Si es ruta pública no necesitamos auth
    if (IS_PUBLIC_MENU) {
      setLoading(false)
      return
    }

    let isMounted = true

    // 1. Obtener sesión actual (una sola vez, al montar)
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      if (isMounted) {
        setSession(s)
        setLoading(false)
      }
    }).catch(() => {
      // En móvil getSession puede fallar si el storage no está listo
      // — reintentar una vez después de 500ms
      setTimeout(() => {
        supabase.auth.getSession().then(({ data: { session: s } }) => {
          if (isMounted) {
            setSession(s)
            setLoading(false)
          }
        }).catch(() => {
          if (isMounted) setLoading(false)
        })
      }, 500)
    })

    // 2. Escuchar cambios en tiempo real (login, logout, refresh token)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      if (isMounted) {
        setSession(s)
        // Si estábamos cargando y llega un evento, ya podemos mostrar la UI
        setLoading(false)
      }
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [])

  // Ruta pública: renderizar directamente sin auth
  if (IS_PUBLIC_MENU) return <PublicMenuRoute />

  if (loading) return <SplashScreen />

  if (session) {
    return <Dashboard onLogout={async () => {
      await supabase.auth.signOut()
      setSession(null)
    }} />
  }

  return <Login onLogin={handleLogin} />
}
