'use client'

import { useState, useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'
import { supabase } from '../lib/supabase'

const MapView = dynamic(() => import('../components/MapView'), { ssr: false })

// ─── Spinner ─────────────────────────────────
function Spinner() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', flex: 1 }}>
      <div className="animate-spin" style={{ width: 32, height: 32, border: '3px solid var(--border)', borderTopColor: 'var(--crema-mid)', borderRadius: '50%' }} />
    </div>
  )
}

// ─── Stars ───────────────────────────────────
function Stars({ value, size = 16, interactive = false, onChange }) {
  const [hovered, setHovered] = useState(0)
  const display = interactive ? (hovered || value) : value
  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {Array.from({ length: 5 }, (_, i) => (
        <span
          key={i}
          onClick={() => interactive && onChange?.(i + 1)}
          onMouseEnter={() => interactive && setHovered(i + 1)}
          onMouseLeave={() => interactive && setHovered(0)}
          style={{
            fontSize: size,
            color: i < display ? 'var(--star)' : 'var(--border)',
            cursor: interactive ? 'pointer' : 'default',
            transition: 'color 0.15s, transform 0.15s',
            transform: interactive && hovered === i + 1 ? 'scale(1.3)' : 'scale(1)',
            display: 'inline-block',
          }}
        >★</span>
      ))}
    </div>
  )
}

// ─── Score bar ───────────────────────────────
function ScoreBar({ label, icon, value, color }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
        <span style={{ fontSize: 13 }}>{icon}</span>
        <span style={{ fontSize: 12, color: 'var(--text-2)', flex: 1 }}>{label}</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--crema)' }}>
          {value}<span style={{ fontSize: 11, fontWeight: 400, color: 'var(--text-3)' }}>/5</span>
        </span>
      </div>
      <div style={{ height: 5, background: 'var(--surface-3)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${(value / 5) * 100}%`,
          background: color, borderRadius: 3,
          transition: 'width 0.6s cubic-bezier(.22,1,.36,1)',
        }} />
      </div>
    </div>
  )
}

// ─── Auth Modal ──────────────────────────────
function AuthModal({ onClose, onSuccess }) {
  const [mode, setMode]         = useState('login')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  const handleSubmit = async () => {
    if (!email || !password) { setError('Please fill in all fields.'); return }
    setError(''); setLoading(true)

    const { error: authError } = mode === 'signup'
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password })

    setLoading(false)
    if (authError) { setError(authError.message); return }
    if (mode === 'signup') {
      setError(''); 
      setMode('login')
      setError('Account created! Please log in.')
      return
    }
    onSuccess()
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(10,8,5,0.88)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999, padding: 24,
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="card animate-scaleIn" style={{ width: '100%', maxWidth: 400, padding: '32px 28px' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 32, fontWeight: 700, fontStyle: 'italic', color: 'var(--crema)' }}>café café</h1>
          <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 4, letterSpacing: 2, textTransform: 'uppercase' }}>your coffee, mapped.</p>
        </div>

        {/* Toggle */}
        <div style={{ display: 'flex', background: 'var(--surface-3)', borderRadius: 10, padding: 3, marginBottom: 24 }}>
          {['login', 'signup'].map(m => (
            <button key={m} onClick={() => { setMode(m); setError('') }} style={{
              flex: 1, padding: '8px', borderRadius: 8, border: 'none', cursor: 'pointer',
              background: mode === m ? 'var(--crema-mid)' : 'transparent',
              color: mode === m ? 'var(--bg)' : 'var(--text-3)',
              fontWeight: 700, fontSize: 13, transition: 'all 0.2s',
              fontFamily: "'DM Sans', sans-serif",
            }}>
              {m === 'login' ? 'Log In' : 'Sign Up'}
            </button>
          ))}
        </div>

        {/* Fields */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
          <input className="input" type="email" placeholder="Email address" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
          <input className="input" type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
        </div>

        {error && (
          <div style={{
            padding: '10px 14px', borderRadius: 10, marginBottom: 14, fontSize: 13,
            background: error.includes('created') ? 'var(--success)' + '22' : 'var(--error)' + '22',
            color: error.includes('created') ? 'var(--success)' : 'var(--error)',
            border: `1px solid ${error.includes('created') ? 'var(--success)' : 'var(--error)'}44`,
          }}>{error}</div>
        )}

        <button className="btn-primary" onClick={handleSubmit} disabled={loading} style={{ width: '100%', fontSize: 15 }}>
          {loading ? 'Just a moment…' : mode === 'login' ? 'Log In' : 'Create Account'}
        </button>

        <button onClick={onClose} style={{ width: '100%', marginTop: 10, background: 'none', border: 'none', color: 'var(--text-3)', fontSize: 13, cursor: 'pointer', padding: '8px', fontFamily: "'DM Sans', sans-serif" }}>
          Continue as guest
        </button>
      </div>
    </div>
  )
}

// ─── Log Modal ───────────────────────────────
const CATEGORIES = [
  { key: 'ambiance_score', label: 'Ambiance', icon: '🌿', color: 'var(--success)',   desc: 'Vibe, atmosphere, how it felt' },
  { key: 'taste_score',    label: 'Taste',    icon: '☕', color: 'var(--crema-mid)', desc: 'Coffee, drinks, and food quality' },
  { key: 'value_score',    label: 'Value',    icon: '💰', color: '#9b8ec4',          desc: 'Worth the price?' },
]
const RATING_LABELS = ['', 'Not great', 'Below average', 'Pretty good', 'Really enjoyed it', 'Absolutely loved it']

function LogModal({ shop, user, onClose, onSubmit, onNeedAuth }) {
  const [scores, setScores] = useState({ ambiance_score: 0, taste_score: 0, value_score: 0 })
  const [note, setNote]     = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone]     = useState(false)
  const [error, setError]   = useState('')

  const allRated = Object.values(scores).every(v => v > 0)

  const handleSubmit = async () => {
    if (!user) { onNeedAuth(); return }
    if (!allRated) { setError('Please rate all three categories.'); return }

    setError(''); setLoading(true)

    const { error: dbError } = await supabase.from('visits').insert({
      shop_id:        shop.id,
      user_id:        user.id,
      ambiance_score: scores.ambiance_score,
      taste_score:    scores.taste_score,
      value_score:    scores.value_score,
      note:           note.trim() || null,
    })

    setLoading(false)
    if (dbError) { setError(dbError.message); return }
    setDone(true)
    setTimeout(() => { setDone(false); onSubmit() }, 1800)
  }

  // Success screen
  if (done) return (
    <div className="animate-scaleIn" style={{
      position: 'fixed', inset: 0, background: 'rgba(10,8,5,0.92)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999,
    }}>
      <div className="card" style={{ padding: '48px 40px', textAlign: 'center', maxWidth: 320 }}>
        <div style={{ fontSize: 56, marginBottom: 12 }}>☕</div>
        <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 26, color: 'var(--crema)', marginBottom: 8 }}>Visit Logged!</h2>
        <p style={{ fontSize: 13, color: 'var(--text-3)' }}>Your rating has been saved.</p>
      </div>
    </div>
  )

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(10,8,5,0.85)',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 9999,
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="animate-slideUp" style={{
        background: 'var(--surface)', borderRadius: '20px 20px 0 0',
        width: '100%', maxWidth: 600, maxHeight: '92vh', overflowY: 'auto',
        padding: '0 0 40px', border: '1px solid var(--border)', borderBottom: 'none',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '20px 24px 16px', borderBottom: '1px solid var(--border)' }}>
          <button onClick={onClose} style={{ background: 'var(--surface-3)', border: '1px solid var(--border)', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', color: 'var(--text-2)', fontSize: 14 }}>✕</button>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 10, color: 'var(--crema-mid)', fontWeight: 800, letterSpacing: 2 }}>NEW VISIT</p>
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, color: 'var(--crema)', fontWeight: 700 }}>{shop?.name}</h2>
          </div>
          <button onClick={handleSubmit} disabled={!allRated || loading} style={{
            background: allRated ? 'var(--crema-mid)' : 'var(--surface-3)',
            color: allRated ? 'var(--bg)' : 'var(--text-3)',
            border: 'none', borderRadius: 10, padding: '8px 18px',
            fontWeight: 700, fontSize: 14, cursor: allRated ? 'pointer' : 'default',
            transition: 'all 0.2s', fontFamily: "'DM Sans', sans-serif",
            opacity: loading ? 0.7 : 1,
          }}>
            {loading ? '…' : user ? 'Save' : 'Log In to Save'}
          </button>
        </div>

        <div style={{ padding: '20px 24px' }}>
          {/* Guest banner */}
          {!user && (
            <div style={{ background: 'var(--crema-mid)22', border: '1px solid var(--crema-mid)44', borderRadius: 12, padding: '12px 16px', marginBottom: 18, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <p style={{ fontSize: 13, color: 'var(--crema)', lineHeight: 1.5 }}>Create a free account to save your visits permanently.</p>
              <button onClick={onNeedAuth} className="btn-primary" style={{ fontSize: 12, padding: '7px 14px', flexShrink: 0 }}>Sign Up</button>
            </div>
          )}

          {/* Categories */}
          <p style={{ fontSize: 14, color: 'var(--crema)', fontWeight: 700, marginBottom: 4 }}>Rate your visit</p>
          <p style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 18 }}>Your scores help others find great spots.</p>

          {CATEGORIES.map(cat => (
            <div key={cat.key} className="card" style={{ padding: 18, marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: cat.color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>{cat.icon}</div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--crema)' }}>{cat.label}</p>
                  <p style={{ fontSize: 11, color: 'var(--text-3)' }}>{cat.desc}</p>
                </div>
                {scores[cat.key] > 0 && (
                  <span style={{ fontSize: 12, fontWeight: 700, color: cat.color, background: cat.color + '20', padding: '4px 10px', borderRadius: 8 }}>
                    {scores[cat.key]}/5
                  </span>
                )}
              </div>
              <Stars value={scores[cat.key]} size={34} interactive onChange={v => setScores(s => ({ ...s, [cat.key]: v }))} />
              {scores[cat.key] > 0 && (
                <p style={{ fontSize: 12, color: cat.color, marginTop: 8, fontWeight: 600 }}>{RATING_LABELS[scores[cat.key]]}</p>
              )}
            </div>
          ))}

          {/* Note */}
          <div style={{ marginTop: 4 }}>
            <p style={{ fontSize: 14, color: 'var(--crema)', fontWeight: 700, marginBottom: 8 }}>
              Add a note <span style={{ color: 'var(--text-3)', fontWeight: 400, fontSize: 13 }}>(optional)</span>
            </p>
            <textarea
              value={note} onChange={e => setNote(e.target.value)}
              maxLength={280} rows={3}
              placeholder="What stood out? Best drink? Favourite seat?…"
              className="input" style={{ resize: 'none', lineHeight: 1.6 }}
            />
            <p style={{ fontSize: 11, color: 'var(--text-3)', textAlign: 'right', marginTop: 4 }}>{note.length}/280</p>
          </div>

          {error && (
            <div style={{ background: 'var(--error)18', border: '1px solid var(--error)44', borderRadius: 10, padding: '10px 14px', marginTop: 8 }}>
              <p style={{ fontSize: 13, color: 'var(--error)' }}>⚠ {error}</p>
            </div>
          )}

          <button onClick={handleSubmit} disabled={!allRated || loading} style={{
            width: '100%', padding: '16px', borderRadius: 14, border: 'none', marginTop: 16,
            background: allRated ? 'var(--crema-mid)' : 'var(--surface-3)',
            color: allRated ? 'var(--bg)' : 'var(--text-3)',
            fontWeight: 800, fontSize: 15, cursor: allRated ? 'pointer' : 'default',
            transition: 'all 0.2s', fontFamily: "'DM Sans', sans-serif",
            opacity: loading ? 0.7 : 1,
          }}>
            {loading ? 'Saving…' : allRated ? 'Save Visit  ☕' : 'Rate all three to save'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Shop Panel (bottom sheet) ───────────────
function ShopPanel({ shop, onClose, onLog, avgScores }) {
  if (!shop) return null
  const amb = avgScores?.[shop.id]?.ambiance ?? shop.ambiance_score ?? 0
  const tas = avgScores?.[shop.id]?.taste    ?? shop.taste_score    ?? 0
  const val = avgScores?.[shop.id]?.value    ?? shop.value_score    ?? 0

  return (
    <div className="animate-slideUp" style={{
      position: 'absolute', bottom: 0, left: 0, right: 0,
      background: 'var(--surface)', borderTop: '1px solid var(--border)',
      borderRadius: '20px 20px 0 0', maxHeight: '72vh', overflowY: 'auto',
      zIndex: 1000, padding: '0 0 32px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 8px' }}>
        <div style={{ width: 36, height: 4, background: 'var(--border)', borderRadius: 2 }} />
      </div>
      <div style={{ position: 'relative', margin: '0 16px', borderRadius: 14, overflow: 'hidden' }}>
        <img src={shop.image_url} alt={shop.name} style={{ width: '100%', height: 160, objectFit: 'cover', display: 'block' }} />
        {shop.visited && (
          <div style={{ position: 'absolute', top: 10, right: 10, background: 'var(--crema)', color: 'var(--bg)', fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20 }}>✓ Visited</div>
        )}
      </div>
      <div style={{ padding: '16px 20px 0' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 700, color: 'var(--crema)', lineHeight: 1.2 }}>{shop.name}</h2>
            <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 3 }}>{shop.address} · {shop.neighborhood}</p>
          </div>
          <button onClick={onClose} style={{ background: 'var(--surface-3)', border: '1px solid var(--border)', borderRadius: 8, width: 30, height: 30, cursor: 'pointer', color: 'var(--text-2)', fontSize: 14, flexShrink: 0 }}>✕</button>
        </div>
        <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6, margin: '10px 0 12px' }}>{shop.description}</p>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
          {shop.tags?.map(t => (
            <span key={t} style={{ fontSize: 11, color: 'var(--text-2)', background: 'var(--surface-3)', border: '1px solid var(--border)', borderRadius: 6, padding: '3px 9px' }}>{t}</span>
          ))}
        </div>
        {(amb > 0 || tas > 0 || val > 0) && (
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14, marginBottom: 14 }}>
            <p style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 12 }}>Community Scores</p>
            {amb > 0 && <ScoreBar label="Ambiance" icon="🌿" value={Math.round(amb)} color="var(--success)" />}
            {tas > 0 && <ScoreBar label="Taste"    icon="☕" value={Math.round(tas)} color="var(--crema-mid)" />}
            {val > 0 && <ScoreBar label="Value"    icon="💰" value={Math.round(val)} color="#9b8ec4" />}
          </div>
        )}
        <button onClick={() => onLog(shop)} className="btn-primary" style={{ width: '100%', fontSize: 14 }}>⭐ Log a Visit</button>
      </div>
    </div>
  )
}

// ─── Nav ─────────────────────────────────────
function Nav({ activeView, setActiveView, user, onAuthClick, onSignOut }) {
  const tabs = [
    { id: 'map',      label: 'Map',      icon: '🗺️' },
    { id: 'discover', label: 'Discover', icon: '🔍' },
    { id: 'visited',  label: 'My Visits', icon: '⭐' },
  ]
  return (
    <nav style={{
      height: 56, background: 'var(--surface)', borderBottom: '1px solid var(--border)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 20px', flexShrink: 0, gap: 12,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 700, fontStyle: 'italic', color: 'var(--crema)' }}>café café</span>
        <div style={{ width: 6, height: 6, borderRadius: 3, background: 'var(--crema-mid)' }} />
      </div>
      <div style={{ display: 'flex', gap: 4 }}>
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveView(tab.id)} style={{
            background: activeView === tab.id ? 'var(--crema-mid)' : 'transparent',
            color: activeView === tab.id ? 'var(--bg)' : 'var(--text-3)',
            border: 'none', borderRadius: 8, padding: '6px 12px',
            fontSize: 13, fontWeight: 600, cursor: 'pointer',
            transition: 'all 0.2s', fontFamily: "'DM Sans', sans-serif",
            display: 'flex', alignItems: 'center', gap: 5,
          }}>
            <span>{tab.icon}</span>
            <span style={{ display: 'none' }}>{tab.label}</span>
          </button>
        ))}
      </div>
      {user ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, color: 'var(--text-3)', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</span>
          <button onClick={onSignOut} style={{ background: 'var(--surface-3)', border: '1px solid var(--border)', borderRadius: 8, padding: '5px 12px', fontSize: 12, color: 'var(--text-2)', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>Sign Out</button>
        </div>
      ) : (
        <button onClick={onAuthClick} className="btn-primary" style={{ fontSize: 13, padding: '7px 16px' }}>Sign In</button>
      )}
    </nav>
  )
}

// ─── Discover View ───────────────────────────
function DiscoverView({ shops, onSelect, onLog, avgScores }) {
  const [filter, setFilter] = useState('all')
  const filtered = filter === 'visited'   ? shops.filter(s => s.visited)
                 : filter === 'unvisited' ? shops.filter(s => !s.visited)
                 : shops

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '32px 24px' }}>
      <h1 className="animate-fadeUp" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 38, fontWeight: 700, color: 'var(--crema)', marginBottom: 6 }}>Discover Rochester</h1>
      <p className="animate-fadeUp delay-100" style={{ fontSize: 14, color: 'var(--text-3)', marginBottom: 24 }}>{shops.length} cafés · {shops.filter(s => s.visited).length} visited</p>
      <div className="animate-fadeUp delay-200" style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {[['all','All'], ['visited','Visited'], ['unvisited','Unvisited']].map(([val, label]) => (
          <button key={val} onClick={() => setFilter(val)} style={{
            background: filter === val ? 'var(--crema-mid)' : 'var(--surface)',
            color: filter === val ? 'var(--bg)' : 'var(--text-2)',
            border: '1px solid var(--border)', borderRadius: 20,
            padding: '6px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
            transition: 'all 0.2s', fontFamily: "'DM Sans', sans-serif",
          }}>{label}</button>
        ))}
      </div>
      {filtered.map((shop, i) => {
        const amb = avgScores?.[shop.id]?.ambiance ?? 0
        const tas = avgScores?.[shop.id]?.taste    ?? 0
        const val = avgScores?.[shop.id]?.value    ?? 0
        return (
          <div key={shop.id} className="card animate-fadeUp" style={{ marginBottom: 16, overflow: 'hidden', cursor: 'pointer', transition: 'border-color 0.2s', animationDelay: `${i * 0.07}s` }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--crema-mid)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
            onClick={() => { onSelect(shop) }}
          >
            <img src={shop.image_url} alt={shop.name} style={{ width: '100%', height: 180, objectFit: 'cover', display: 'block' }} />
            <div style={{ padding: '16px 20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 700, color: 'var(--crema)' }}>{shop.name}</h3>
                  <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>{shop.address} · {shop.neighborhood}</p>
                </div>
                {shop.visited && <span style={{ fontSize: 11, background: 'var(--crema)', color: 'var(--bg)', borderRadius: 20, padding: '3px 10px', fontWeight: 700, flexShrink: 0 }}>✓ Visited</span>}
              </div>
              <p style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 10, lineHeight: 1.6 }}>{shop.description}</p>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
                {shop.tags?.map(t => <span key={t} style={{ fontSize: 11, color: 'var(--text-2)', background: 'var(--surface-3)', border: '1px solid var(--border)', borderRadius: 6, padding: '2px 8px' }}>{t}</span>)}
              </div>
              <div style={{ borderTop: '1px solid var(--border)', marginTop: 14, paddingTop: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: 14 }}>
                  <span style={{ fontSize: 12, color: 'var(--text-3)' }}>🌿 {amb > 0 ? Math.round(amb) : '—'}</span>
                  <span style={{ fontSize: 12, color: 'var(--text-3)' }}>☕ {tas > 0 ? Math.round(tas) : '—'}</span>
                  <span style={{ fontSize: 12, color: 'var(--text-3)' }}>💰 {val > 0 ? Math.round(val) : '—'}</span>
                </div>
                <button onClick={e => { e.stopPropagation(); onLog(shop) }} className="btn-primary" style={{ fontSize: 12, padding: '7px 16px' }}>Log Visit</button>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Visited View ────────────────────────────
function VisitedView({ visits, shops, loading }) {
  if (loading) return <Spinner />

  const shopMap = Object.fromEntries(shops.map(s => [s.id, s]))

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '32px 24px' }}>
      <h1 className="animate-fadeUp" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 38, fontWeight: 700, color: 'var(--crema)', marginBottom: 6 }}>My Visits</h1>
      <p className="animate-fadeUp delay-100" style={{ fontSize: 14, color: 'var(--text-3)', marginBottom: 28 }}>{visits.length} visit{visits.length !== 1 ? 's' : ''} logged</p>

      {visits.length === 0 ? (
        <div className="card animate-fadeUp" style={{ padding: '48px', textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>☕</div>
          <p style={{ color: 'var(--crema)', fontSize: 18, fontFamily: "'Cormorant Garamond', serif", marginBottom: 8 }}>No visits yet</p>
          <p style={{ color: 'var(--text-3)', fontSize: 13 }}>Head to the map and start exploring!</p>
        </div>
      ) : visits.map((visit, i) => {
        const shop = shopMap[visit.shop_id]
        if (!shop) return null
        const avg = Math.round((visit.ambiance_score + visit.taste_score + visit.value_score) / 3)
        return (
          <div key={visit.id} className="card animate-fadeUp" style={{ marginBottom: 12, padding: '16px', animationDelay: `${i * 0.07}s` }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <img src={shop.image_url} alt={shop.name} style={{ width: 60, height: 60, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18, fontWeight: 700, color: 'var(--crema)' }}>{shop.name}</h3>
                    <p style={{ fontSize: 11, color: 'var(--text-3)', margin: '2px 0 6px' }}>{shop.neighborhood} · {new Date(visit.visited_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                  </div>
                  <Stars value={avg} size={14} />
                </div>
                <div style={{ display: 'flex', gap: 14 }}>
                  <span style={{ fontSize: 12, color: 'var(--text-3)' }}>🌿 {visit.ambiance_score}/5</span>
                  <span style={{ fontSize: 12, color: 'var(--text-3)' }}>☕ {visit.taste_score}/5</span>
                  <span style={{ fontSize: 12, color: 'var(--text-3)' }}>💰 {visit.value_score}/5</span>
                </div>
                {visit.note && <p style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 8, fontStyle: 'italic', lineHeight: 1.5 }}>"{visit.note}"</p>}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Main App ────────────────────────────────
export default function Home() {
  const [user, setUser]           = useState(null)
  const [shops, setShops]         = useState([])
  const [visits, setVisits]       = useState([])
  const [avgScores, setAvgScores] = useState({})
  const [activeView, setActiveView] = useState('map')
  const [selected, setSelected]   = useState(null)
  const [logShop, setLogShop]     = useState(null)
  const [showAuth, setShowAuth]   = useState(false)
  const [loadingShops, setLoadingShops]   = useState(true)
  const [loadingVisits, setLoadingVisits] = useState(false)
  const [isMobile, setIsMobile]   = useState(false)

  // Detect mobile
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  // Auth state listener
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  // Load shops from Supabase
  useEffect(() => {
    const loadShops = async () => {
      setLoadingShops(true)
      const { data, error } = await supabase.from('shops').select('*')
      if (!error && data) setShops(data)
      setLoadingShops(false)
    }
    loadShops()
  }, [])

  // Load visits when user logs in
  useEffect(() => {
    if (!user) { setVisits([]); return }
    const loadVisits = async () => {
      setLoadingVisits(true)
      const { data, error } = await supabase
        .from('visits')
        .select('*')
        .eq('user_id', user.id)
        .order('visited_at', { ascending: false })
      if (!error && data) setVisits(data)
      setLoadingVisits(false)
    }
    loadVisits()
  }, [user])

  // Compute average scores per shop from all visits
  useEffect(() => {
    if (!visits.length) return
    const map = {}
    visits.forEach(v => {
      if (!map[v.shop_id]) map[v.shop_id] = { ambiance: [], taste: [], value: [] }
      map[v.shop_id].ambiance.push(v.ambiance_score)
      map[v.shop_id].taste.push(v.taste_score)
      map[v.shop_id].value.push(v.value_score)
    })
    const avgs = {}
    Object.entries(map).forEach(([id, s]) => {
      avgs[id] = {
        ambiance: s.ambiance.reduce((a,b) => a+b,0) / s.ambiance.length,
        taste:    s.taste.reduce((a,b) => a+b,0)    / s.taste.length,
        value:    s.value.reduce((a,b) => a+b,0)    / s.value.length,
      }
    })
    setAvgScores(avgs)
  }, [visits])

  // Mark shops as visited based on user's visits
  const shopsWithVisited = shops.map(s => ({
    ...s,
    visited: visits.some(v => v.shop_id === s.id),
  }))

  const handleLog = (shop) => {
    setLogShop(shop)
    setSelected(null)
  }

  const handleLogSubmit = async () => {
    setLogShop(null)
    // Refresh visits
    if (user) {
      const { data } = await supabase.from('visits').select('*').eq('user_id', user.id).order('visited_at', { ascending: false })
      if (data) setVisits(data)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setVisits([])
  }

  const handleNeedAuth = () => {
    setLogShop(null)
    setShowAuth(true)
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <Nav
        activeView={activeView}
        setActiveView={setActiveView}
        user={user}
        onAuthClick={() => setShowAuth(true)}
        onSignOut={handleSignOut}
      />

      <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>

        {/* ── MAP VIEW ── */}
        {activeView === 'map' && (
          <div style={{ display: 'flex', height: '100%' }}>
            {/* Sidebar (desktop) */}
            {!isMobile && (
              <div style={{ width: 300, flexShrink: 0, background: 'var(--surface)', borderRight: '1px solid var(--border)', overflowY: 'auto', padding: '16px 14px' }}>
                <p style={{ fontSize: 10, color: 'var(--text-3)', fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 14, paddingLeft: 4 }}>
                  Rochester, NY · {shopsWithVisited.length} cafés
                </p>
                {loadingShops ? <Spinner /> : shopsWithVisited.map((shop, i) => (
                  <div key={shop.id} className="animate-fadeUp" style={{ animationDelay: `${i * 0.08}s` }}>
                    <div
                      onClick={() => setSelected(shop)}
                      style={{
                        background: selected?.id === shop.id ? 'var(--surface-2)' : 'var(--surface)',
                        border: `1.5px solid ${selected?.id === shop.id ? 'var(--crema-mid)' : 'var(--border)'}`,
                        borderRadius: 14, padding: '12px 14px', cursor: 'pointer',
                        transition: 'all 0.2s', marginBottom: 10,
                      }}
                      onMouseEnter={e => { if (selected?.id !== shop.id) e.currentTarget.style.borderColor = 'var(--crema-dark)' }}
                      onMouseLeave={e => { if (selected?.id !== shop.id) e.currentTarget.style.borderColor = 'var(--border)' }}
                    >
                      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                        <img src={shop.image_url} alt={shop.name} style={{ width: 48, height: 48, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                            <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 15, fontWeight: 700, color: 'var(--crema)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{shop.name}</h3>
                            {shop.visited && <span style={{ fontSize: 9, background: 'var(--crema)', color: 'var(--bg)', borderRadius: 20, padding: '1px 6px', fontWeight: 700, flexShrink: 0 }}>✓</span>}
                          </div>
                          <p style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 4 }}>{shop.neighborhood}</p>
                          <Stars value={Math.round(((avgScores[shop.id]?.ambiance ?? 0) + (avgScores[shop.id]?.taste ?? 0) + (avgScores[shop.id]?.value ?? 0)) / 3)} size={12} />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Map */}
            <div style={{ flex: 1, position: 'relative' }}>
              {loadingShops ? <Spinner /> : (
                <MapView shops={shopsWithVisited} selected={selected} onSelect={setSelected} />
              )}

              {/* Mobile browse button */}
              {isMobile && !selected && (
                <button onClick={() => setActiveView('discover')} style={{
                  position: 'absolute', bottom: 24, right: 16,
                  background: 'var(--crema-mid)', color: 'var(--bg)',
                  border: 'none', borderRadius: 14, padding: '12px 18px',
                  fontWeight: 700, fontSize: 14, cursor: 'pointer',
                  boxShadow: '0 6px 20px rgba(200,150,90,0.4)', zIndex: 500,
                  fontFamily: "'DM Sans', sans-serif",
                }}>☕ Browse All</button>
              )}

              {/* Mobile bottom sheet */}
              {selected && isMobile && (
                <ShopPanel shop={selected} onClose={() => setSelected(null)} onLog={handleLog} avgScores={avgScores} />
              )}

              {/* Desktop detail card */}
              {selected && !isMobile && (
                <div className="animate-slideUp" style={{
                  position: 'absolute', bottom: 24, left: 316, right: 24,
                  background: 'var(--surface)', border: '1px solid var(--border)',
                  borderRadius: 18, padding: '20px', zIndex: 500, maxWidth: 360,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div>
                      <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontWeight: 700, color: 'var(--crema)' }}>{selected.name}</h3>
                      <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>{selected.address}</p>
                    </div>
                    <button onClick={() => setSelected(null)} style={{ background: 'var(--surface-3)', border: '1px solid var(--border)', borderRadius: 8, width: 28, height: 28, cursor: 'pointer', color: 'var(--text-2)', fontSize: 12 }}>✕</button>
                  </div>
                  {avgScores[selected.id] ? (
                    <>
                      <ScoreBar label="Ambiance" icon="🌿" value={Math.round(avgScores[selected.id].ambiance)} color="var(--success)" />
                      <ScoreBar label="Taste"    icon="☕" value={Math.round(avgScores[selected.id].taste)}    color="var(--crema-mid)" />
                      <ScoreBar label="Value"    icon="💰" value={Math.round(avgScores[selected.id].value)}    color="#9b8ec4" />
                    </>
                  ) : (
                    <p style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 12 }}>No ratings yet — be the first!</p>
                  )}
                  <button onClick={() => handleLog(selected)} className="btn-primary" style={{ width: '100%', marginTop: 8, fontSize: 13 }}>⭐ Log a Visit</button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── DISCOVER VIEW ── */}
        {activeView === 'discover' && (
          <div style={{ overflowY: 'auto', height: '100%' }}>
            {loadingShops ? <Spinner /> : (
              <DiscoverView
                shops={shopsWithVisited}
                avgScores={avgScores}
                onSelect={s => { setSelected(s); setActiveView('map') }}
                onLog={handleLog}
              />
            )}
          </div>
        )}

        {/* ── VISITED VIEW ── */}
        {activeView === 'visited' && (
          <div style={{ overflowY: 'auto', height: '100%' }}>
            {!user ? (
              <div style={{ maxWidth: 480, margin: '80px auto', padding: '0 24px', textAlign: 'center' }}>
                <div style={{ fontSize: 52, marginBottom: 16 }}>☕</div>
                <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, color: 'var(--crema)', marginBottom: 8 }}>Sign in to see your visits</h2>
                <p style={{ fontSize: 14, color: 'var(--text-3)', marginBottom: 24 }}>Create a free account to track every café you visit.</p>
                <button onClick={() => setShowAuth(true)} className="btn-primary" style={{ fontSize: 15, padding: '13px 32px' }}>Sign In / Sign Up</button>
              </div>
            ) : (
              <VisitedView visits={visits} shops={shops} loading={loadingVisits} />
            )}
          </div>
        )}
      </div>

      {/* ── MODALS ── */}
      {showAuth && (
        <AuthModal
          onClose={() => setShowAuth(false)}
          onSuccess={() => setShowAuth(false)}
        />
      )}

      {logShop && (
        <LogModal
          shop={logShop}
          user={user}
          onClose={() => setLogShop(null)}
          onSubmit={handleLogSubmit}
          onNeedAuth={handleNeedAuth}
        />
      )}
    </div>
  )
}
