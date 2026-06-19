'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function NotFound() {
  const router = useRouter()
  const [hasSession, setHasSession] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setHasSession(!!session)
    })
  }, [])

  const goHome = () => {
    if (hasSession) router.push('/app')
    else router.push('/')
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#EDE8DC',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      textAlign: 'center',
    }}>
      {/* Coffee cup illustration — same style as the map markers */}
      <svg width="96" height="96" viewBox="0 0 96 96" style={{ marginBottom: 28 }}>
        <circle cx="48" cy="48" r="46" fill="#E4DDD0" stroke="#BDB5A4" strokeWidth="1.5" />
        {/* Cup body */}
        <path d="M30 40h36l-4 22H34l-4-22Z" fill="#A0856A" />
        {/* Cup rim */}
        <rect x="28" y="36" width="40" height="6" rx="3" fill="#8A7060" />
        {/* Saucer */}
        <ellipse cx="48" cy="66" rx="20" ry="4" fill="#8A7060" opacity="0.7" />
        {/* Handle */}
        <path d="M66 44 Q76 44 76 52 Q76 60 66 60" stroke="#8A7060" strokeWidth="4" fill="none" strokeLinecap="round" />
        {/* Question mark steam */}
        <text x="48" y="28" textAnchor="middle" fontFamily="'Cormorant Garamond', serif" fontSize="22" fontWeight="700" fill="#7C5C35">?</text>
      </svg>

      {/* Heading */}
      <h1 style={{
        fontFamily: "'Cormorant Garamond', serif",
        fontSize: 'clamp(32px, 6vw, 48px)',
        fontWeight: 700,
        color: '#2C2416',
        letterSpacing: '-0.5px',
        lineHeight: 1.15,
        marginBottom: 12,
      }}>
        This cup's gone cold.
      </h1>

      {/* Subtitle */}
      <p style={{
        fontSize: 15,
        color: '#8A7D6A',
        lineHeight: 1.65,
        maxWidth: 380,
        marginBottom: 32,
      }}>
        We couldn't find the page you were looking for. It may have moved, or the link might be off by a sip.
      </p>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
        <button
          onClick={goHome}
          style={{
            background: '#7C5C35',
            color: '#FAF6F0',
            border: 'none',
            borderRadius: 12,
            padding: '13px 28px',
            fontSize: 15,
            fontWeight: 700,
            cursor: 'pointer',
            fontFamily: "'DM Sans', sans-serif",
            transition: 'background 0.2s, transform 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = '#5C4025'; e.currentTarget.style.transform = 'translateY(-1px)' }}
          onMouseLeave={e => { e.currentTarget.style.background = '#7C5C35'; e.currentTarget.style.transform = 'translateY(0)' }}
        >
          {hasSession === false ? 'Back to homepage' : 'Take me back'} →
        </button>

        <button
          onClick={() => router.back()}
          style={{
            background: 'none',
            color: '#5A4E3C',
            border: '1px solid #BDB5A4',
            borderRadius: 12,
            padding: '13px 28px',
            fontSize: 15,
            fontWeight: 500,
            cursor: 'pointer',
            fontFamily: "'DM Sans', sans-serif",
            transition: 'border-color 0.2s, color 0.2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = '#7C5C35'; e.currentTarget.style.color = '#2C2416' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = '#BDB5A4'; e.currentTarget.style.color = '#5A4E3C' }}
        >
          Go back
        </button>
      </div>

      {/* Footer wordmark */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 56, opacity: 0.6 }}>
        <span style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: 16,
          fontWeight: 700,
          fontStyle: 'italic',
          color: '#2C2416',
        }}>Café Café</span>
        <div style={{ width: 5, height: 5, borderRadius: 3, background: '#7C5C35' }} />
      </div>
    </div>
  )
}
