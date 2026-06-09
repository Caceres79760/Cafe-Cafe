'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { supabase } from '../lib/supabase'

const MapView = dynamic(() => import('../components/MapView'), { ssr: false })

// ─── Distance helper (Haversine formula) ─────
// Returns distance in miles between two lat/lng points
function getDistanceMiles(lat1, lng1, lat2, lng2) {
  const R    = 3958.8 // Earth radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a    =
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2)
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
}

function formatDistance(miles) {
  if (miles < 0.1) return `${Math.round(miles * 5280)} ft`
  return `${miles.toFixed(1)} mi`
}

// ─── Spinner ─────────────────────────────────
function Spinner() {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100%', flex:1, minHeight:200 }}>
      <div className="animate-spin" style={{ width:32, height:32, border:'3px solid var(--border)', borderTopColor:'var(--crema-mid)', borderRadius:'50%' }} />
    </div>
  )
}

// ─── Stars ───────────────────────────────────
function Stars({ value, size=16, interactive=false, onChange }) {
  const [hovered, setHovered] = useState(0)
  const display = interactive ? (hovered || value) : value
  return (
    <div style={{ display:'flex', gap:2 }}>
      {Array.from({ length:5 }, (_,i) => (
        <span key={i}
          onClick={() => interactive && onChange?.(i+1)}
          onMouseEnter={() => interactive && setHovered(i+1)}
          onMouseLeave={() => interactive && setHovered(0)}
          style={{ fontSize:size, color: i<display ? 'var(--star)' : 'var(--border)', cursor: interactive?'pointer':'default', transition:'color 0.15s, transform 0.15s', transform: interactive&&hovered===i+1?'scale(1.3)':'scale(1)', display:'inline-block' }}>★</span>
      ))}
    </div>
  )
}

// ─── Score bar ───────────────────────────────
function ScoreBar({ label, icon, value, color }) {
  return (
    <div style={{ marginBottom:12 }}>
      <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:6 }}>
        <span style={{ fontSize:13 }}>{icon}</span>
        <span style={{ fontSize:12, color:'var(--text-2)', flex:1 }}>{label}</span>
        <span style={{ fontSize:13, fontWeight:700, color:'var(--crema)' }}>{value}<span style={{ fontSize:11, fontWeight:400, color:'var(--text-3)' }}>/5</span></span>
      </div>
      <div style={{ height:5, background:'var(--surface-3)', borderRadius:3, overflow:'hidden' }}>
        <div style={{ height:'100%', width:`${(value/5)*100}%`, background:color, borderRadius:3, transition:'width 0.6s cubic-bezier(.22,1,.36,1)' }} />
      </div>
    </div>
  )
}

// ─── Distance Badge ───────────────────────────
function DistanceBadge({ miles, size='sm' }) {
  const isClose = miles < 0.5
  const isMed   = miles < 1.5
  const color   = isClose ? 'var(--success)' : isMed ? 'var(--crema-mid)' : 'var(--text-3)'
  const bg      = isClose ? '#6a9e7822' : isMed ? 'var(--crema-mid)22' : 'var(--surface-3)'
  return (
    <span style={{ fontSize: size==='lg' ? 13 : 11, fontWeight:600, color, background:bg, border:`1px solid ${color}44`, borderRadius:20, padding: size==='lg' ? '4px 12px' : '2px 8px', flexShrink:0, display:'inline-flex', alignItems:'center', gap:4 }}>
      📍 {formatDistance(miles)}
    </span>
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
    if (mode === 'signup') { setMode('login'); setError('Account created! Please log in.'); return }
    onSuccess()
  }

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(10,8,5,0.88)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999, padding:24 }}
      onClick={e => e.target===e.currentTarget && onClose()}>
      <div className="card animate-scaleIn" style={{ width:'100%', maxWidth:400, padding:'32px 28px' }}>
        <div style={{ textAlign:'center', marginBottom:28 }}>
          <h1 style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:32, fontWeight:700, fontStyle:'italic', color:'var(--crema)' }}>café café</h1>
          <p style={{ fontSize:12, color:'var(--text-3)', marginTop:4, letterSpacing:2, textTransform:'uppercase' }}>your coffee, mapped.</p>
        </div>
        <div style={{ display:'flex', background:'var(--surface-3)', borderRadius:10, padding:3, marginBottom:24 }}>
          {['login','signup'].map(m => (
            <button key={m} onClick={() => { setMode(m); setError('') }} style={{ flex:1, padding:'8px', borderRadius:8, border:'none', cursor:'pointer', background:mode===m?'var(--crema-mid)':'transparent', color:mode===m?'var(--bg)':'var(--text-3)', fontWeight:700, fontSize:13, transition:'all 0.2s', fontFamily:"'DM Sans', sans-serif" }}>
              {m==='login'?'Log In':'Sign Up'}
            </button>
          ))}
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:12, marginBottom:16 }}>
          <input className="input" type="email" placeholder="Email address" value={email} onChange={e=>setEmail(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handleSubmit()} />
          <input className="input" type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handleSubmit()} />
        </div>
        {error && <div style={{ padding:'10px 14px', borderRadius:10, marginBottom:14, fontSize:13, background:error.includes('created')?'#6a9e7822':'var(--error)22', color:error.includes('created')?'var(--success)':'var(--error)', border:`1px solid ${error.includes('created')?'#6a9e7844':'var(--error)44'}` }}>{error}</div>}
        <button className="btn-primary" onClick={handleSubmit} disabled={loading} style={{ width:'100%', fontSize:15 }}>{loading?'Just a moment…':mode==='login'?'Log In':'Create Account'}</button>
        <button onClick={onClose} style={{ width:'100%', marginTop:10, background:'none', border:'none', color:'var(--text-3)', fontSize:13, cursor:'pointer', padding:'8px', fontFamily:"'DM Sans', sans-serif" }}>Continue as guest</button>
      </div>
    </div>
  )
}

// ─── Log Modal ───────────────────────────────
const CATEGORIES = [
  { key:'ambiance_score', label:'Ambiance', icon:'🌿', color:'var(--success)',   desc:'Vibe, atmosphere, how it felt' },
  { key:'taste_score',    label:'Taste',    icon:'☕', color:'var(--crema-mid)', desc:'Coffee, drinks, and food quality' },
  { key:'value_score',    label:'Value',    icon:'💰', color:'#9b8ec4',          desc:'Worth the price?' },
]
const RATING_LABELS = ['','Not great','Below average','Pretty good','Really enjoyed it','Absolutely loved it']

function LogModal({ shop, user, onClose, onSubmit, onNeedAuth }) {
  const [scores, setScores] = useState({ ambiance_score:0, taste_score:0, value_score:0 })
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
      shop_id:shop.id, user_id:user.id,
      ambiance_score:scores.ambiance_score, taste_score:scores.taste_score, value_score:scores.value_score,
      note:note.trim()||null,
    })
    setLoading(false)
    if (dbError) { setError(dbError.message); return }
    setDone(true)
    setTimeout(() => { setDone(false); onSubmit() }, 1800)
  }

  if (done) return (
    <div className="animate-scaleIn" style={{ position:'fixed', inset:0, background:'rgba(10,8,5,0.92)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999 }}>
      <div className="card" style={{ padding:'48px 40px', textAlign:'center', maxWidth:320 }}>
        <div style={{ fontSize:56, marginBottom:12 }}>☕</div>
        <h2 style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:26, color:'var(--crema)', marginBottom:8 }}>Visit Logged!</h2>
        <p style={{ fontSize:13, color:'var(--text-3)' }}>Your rating has been saved.</p>
      </div>
    </div>
  )

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(10,8,5,0.85)', display:'flex', alignItems:'flex-end', justifyContent:'center', zIndex:9999 }}
      onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="animate-slideUp" style={{ background:'var(--surface)', borderRadius:'20px 20px 0 0', width:'100%', maxWidth:600, maxHeight:'92vh', overflowY:'auto', padding:'0 0 40px', border:'1px solid var(--border)', borderBottom:'none' }}>
        <div style={{ display:'flex', alignItems:'center', gap:12, padding:'20px 24px 16px', borderBottom:'1px solid var(--border)' }}>
          <button onClick={onClose} style={{ background:'var(--surface-3)', border:'1px solid var(--border)', borderRadius:8, width:32, height:32, cursor:'pointer', color:'var(--text-2)', fontSize:14 }}>✕</button>
          <div style={{ flex:1 }}>
            <p style={{ fontSize:10, color:'var(--crema-mid)', fontWeight:800, letterSpacing:2 }}>NEW VISIT</p>
            <h2 style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:20, color:'var(--crema)', fontWeight:700 }}>{shop?.name}</h2>
          </div>
          <button onClick={handleSubmit} disabled={!allRated||loading} style={{ background:allRated?'var(--crema-mid)':'var(--surface-3)', color:allRated?'var(--bg)':'var(--text-3)', border:'none', borderRadius:10, padding:'8px 18px', fontWeight:700, fontSize:14, cursor:allRated?'pointer':'default', transition:'all 0.2s', fontFamily:"'DM Sans', sans-serif", opacity:loading?0.7:1 }}>
            {loading?'…':user?'Save':'Log In to Save'}
          </button>
        </div>
        <div style={{ padding:'20px 24px' }}>
          {!user && (
            <div style={{ background:'var(--crema-mid)22', border:'1px solid var(--crema-mid)44', borderRadius:12, padding:'12px 16px', marginBottom:18, display:'flex', alignItems:'center', justifyContent:'space-between', gap:12 }}>
              <p style={{ fontSize:13, color:'var(--crema)', lineHeight:1.5 }}>Create a free account to save your visits.</p>
              <button onClick={onNeedAuth} className="btn-primary" style={{ fontSize:12, padding:'7px 14px', flexShrink:0 }}>Sign Up</button>
            </div>
          )}
          <p style={{ fontSize:14, color:'var(--crema)', fontWeight:700, marginBottom:4 }}>Rate your visit</p>
          <p style={{ fontSize:12, color:'var(--text-3)', marginBottom:18 }}>Your scores help others find great spots.</p>
          {CATEGORIES.map(cat => (
            <div key={cat.key} className="card" style={{ padding:18, marginBottom:12 }}>
              <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:14 }}>
                <div style={{ width:38, height:38, borderRadius:10, background:cat.color+'22', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>{cat.icon}</div>
                <div style={{ flex:1 }}>
                  <p style={{ fontSize:14, fontWeight:700, color:'var(--crema)' }}>{cat.label}</p>
                  <p style={{ fontSize:11, color:'var(--text-3)' }}>{cat.desc}</p>
                </div>
                {scores[cat.key]>0 && <span style={{ fontSize:12, fontWeight:700, color:cat.color, background:cat.color+'20', padding:'4px 10px', borderRadius:8 }}>{scores[cat.key]}/5</span>}
              </div>
              <Stars value={scores[cat.key]} size={34} interactive onChange={v=>setScores(s=>({...s,[cat.key]:v}))} />
              {scores[cat.key]>0 && <p style={{ fontSize:12, color:cat.color, marginTop:8, fontWeight:600 }}>{RATING_LABELS[scores[cat.key]]}</p>}
            </div>
          ))}
          <div style={{ marginTop:4 }}>
            <p style={{ fontSize:14, color:'var(--crema)', fontWeight:700, marginBottom:8 }}>Add a note <span style={{ color:'var(--text-3)', fontWeight:400, fontSize:13 }}>(optional)</span></p>
            <textarea value={note} onChange={e=>setNote(e.target.value)} maxLength={280} rows={3} placeholder="What stood out? Best drink? Favourite seat?…" className="input" style={{ resize:'none', lineHeight:1.6 }} />
            <p style={{ fontSize:11, color:'var(--text-3)', textAlign:'right', marginTop:4 }}>{note.length}/280</p>
          </div>
          {error && <div style={{ background:'var(--error)18', border:'1px solid var(--error)44', borderRadius:10, padding:'10px 14px', marginTop:8 }}><p style={{ fontSize:13, color:'var(--error)' }}>⚠ {error}</p></div>}
          <button onClick={handleSubmit} disabled={!allRated||loading} style={{ width:'100%', padding:'16px', borderRadius:14, border:'none', marginTop:16, background:allRated?'var(--crema-mid)':'var(--surface-3)', color:allRated?'var(--bg)':'var(--text-3)', fontWeight:800, fontSize:15, cursor:allRated?'pointer':'default', transition:'all 0.2s', fontFamily:"'DM Sans', sans-serif", opacity:loading?0.7:1 }}>
            {loading?'Saving…':allRated?'Save Visit  ☕':'Rate all three to save'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Shop Panel ──────────────────────────────
function ShopPanel({ shop, onClose, onLog, avgScores }) {
  if (!shop) return null
  const amb = avgScores?.[shop.id]?.ambiance ?? 0
  const tas = avgScores?.[shop.id]?.taste    ?? 0
  const val = avgScores?.[shop.id]?.value    ?? 0
  return (
    <div className="animate-slideUp" style={{ position:'absolute', bottom:0, left:0, right:0, background:'var(--surface)', borderTop:'1px solid var(--border)', borderRadius:'20px 20px 0 0', maxHeight:'72vh', overflowY:'auto', zIndex:1000, padding:'0 0 32px' }}>
      <div style={{ display:'flex', justifyContent:'center', padding:'12px 0 8px' }}>
        <div style={{ width:36, height:4, background:'var(--border)', borderRadius:2 }} />
      </div>
      <div style={{ position:'relative', margin:'0 16px', borderRadius:14, overflow:'hidden' }}>
        <img src={shop.image_url} alt={shop.name} style={{ width:'100%', height:160, objectFit:'cover', display:'block' }} />
        {shop.visited && <div style={{ position:'absolute', top:10, right:10, background:'var(--crema)', color:'var(--bg)', fontSize:11, fontWeight:700, padding:'4px 10px', borderRadius:20 }}>✓ Visited</div>}
        {shop.distanceMiles !== undefined && (
          <div style={{ position:'absolute', bottom:10, left:10 }}>
            <DistanceBadge miles={shop.distanceMiles} size="lg" />
          </div>
        )}
      </div>
      <div style={{ padding:'16px 20px 0' }}>
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12 }}>
          <div>
            <h2 style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:22, fontWeight:700, color:'var(--crema)', lineHeight:1.2 }}>{shop.name}</h2>
            <p style={{ fontSize:12, color:'var(--text-3)', marginTop:3 }}>{shop.address} · {shop.neighborhood}</p>
          </div>
          <button onClick={onClose} style={{ background:'var(--surface-3)', border:'1px solid var(--border)', borderRadius:8, width:30, height:30, cursor:'pointer', color:'var(--text-2)', fontSize:14, flexShrink:0 }}>✕</button>
        </div>
        <p style={{ fontSize:13, color:'var(--text-2)', lineHeight:1.6, margin:'10px 0 12px' }}>{shop.description}</p>
        <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:16 }}>
          {shop.tags?.map(t => <span key={t} style={{ fontSize:11, color:'var(--text-2)', background:'var(--surface-3)', border:'1px solid var(--border)', borderRadius:6, padding:'3px 9px' }}>{t}</span>)}
        </div>
        {(amb>0||tas>0||val>0) && (
          <div style={{ borderTop:'1px solid var(--border)', paddingTop:14, marginBottom:14 }}>
            <p style={{ fontSize:11, color:'var(--text-3)', fontWeight:600, letterSpacing:1.5, textTransform:'uppercase', marginBottom:12 }}>Community Scores</p>
            {amb>0 && <ScoreBar label="Ambiance" icon="🌿" value={Math.round(amb)} color="var(--success)" />}
            {tas>0 && <ScoreBar label="Taste"    icon="☕" value={Math.round(tas)} color="var(--crema-mid)" />}
            {val>0 && <ScoreBar label="Value"    icon="💰" value={Math.round(val)} color="#9b8ec4" />}
          </div>
        )}
        <button onClick={() => onLog(shop)} className="btn-primary" style={{ width:'100%', fontSize:14 }}>⭐ Log a Visit</button>
      </div>
    </div>
  )
}

// ─── Nearby View ──────────────────────────────
function NearbyView({ shops, avgScores, userLocation, locationError, locationLoading, onRequestLocation, onSelect, onLog }) {

  const [radius, setRadius] = useState(1.0) // miles

  // Add distance to each shop and filter/sort
  const shopsWithDistance = shops
    .map(shop => ({
      ...shop,
      distanceMiles: userLocation
        ? getDistanceMiles(userLocation.lat, userLocation.lng, shop.lat, shop.lng)
        : null,
    }))
    .filter(shop => shop.distanceMiles === null || shop.distanceMiles <= radius)
    .sort((a, b) => (a.distanceMiles ?? 999) - (b.distanceMiles ?? 999))

  const RADIUS_OPTIONS = [0.25, 0.5, 1.0, 1.5, 2.0, 5.0]

  return (
    <div style={{ maxWidth:680, margin:'0 auto', padding:'32px 24px' }}>

      {/* Header */}
      <h1 className="animate-fadeUp" style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:38, fontWeight:700, color:'var(--crema)', marginBottom:6 }}>Nearby</h1>
      <p className="animate-fadeUp delay-100" style={{ fontSize:14, color:'var(--text-3)', marginBottom:24 }}>
        {userLocation ? `Cafés within ${radius} mile${radius!==1?'s':''} of you` : 'Find cafés near your current location'}
      </p>

      {/* Location state */}
      {!userLocation && !locationLoading && (
        <div className="card animate-fadeUp delay-100" style={{ padding:'32px', textAlign:'center', marginBottom:24 }}>
          <div style={{ fontSize:44, marginBottom:12 }}>📍</div>
          <h3 style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:22, color:'var(--crema)', marginBottom:8 }}>
            {locationError ? 'Location unavailable' : 'Share your location'}
          </h3>
          <p style={{ fontSize:13, color:'var(--text-3)', marginBottom:20, lineHeight:1.6 }}>
            {locationError
              ? 'We couldn\'t access your location. Please enable location permissions in your browser and try again.'
              : 'Allow location access to see which cafés are closest to you right now.'}
          </p>
          <button onClick={onRequestLocation} className="btn-primary" style={{ fontSize:14, padding:'12px 28px' }}>
            {locationError ? '↻ Try Again' : '📍 Enable Location'}
          </button>
        </div>
      )}

      {locationLoading && (
        <div className="card animate-fadeUp" style={{ padding:'32px', textAlign:'center', marginBottom:24 }}>
          <div className="animate-spin" style={{ width:32, height:32, border:'3px solid var(--border)', borderTopColor:'var(--crema-mid)', borderRadius:'50%', margin:'0 auto 16px' }} />
          <p style={{ fontSize:14, color:'var(--text-3)' }}>Getting your location…</p>
        </div>
      )}

      {/* Controls — only show when location is available */}
      {userLocation && (
        <>
          {/* Location confirmed banner */}
          <div className="animate-fadeUp" style={{ display:'flex', alignItems:'center', gap:10, background:'var(--success)18', border:'1px solid var(--success)44', borderRadius:12, padding:'10px 16px', marginBottom:20 }}>
            <span style={{ fontSize:16 }}>📍</span>
            <p style={{ fontSize:13, color:'var(--success)', flex:1 }}>Location found — showing cafés near you</p>
            <button onClick={onRequestLocation} style={{ background:'none', border:'none', color:'var(--text-3)', fontSize:12, cursor:'pointer', fontFamily:"'DM Sans', sans-serif" }}>Update</button>
          </div>

          {/* Radius slider */}
          <div className="card animate-fadeUp delay-100" style={{ padding:'18px 20px', marginBottom:24 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
              <p style={{ fontSize:14, color:'var(--crema)', fontWeight:700 }}>Search radius</p>
              <span style={{ fontSize:16, fontWeight:800, color:'var(--crema-mid)', fontFamily:"'Cormorant Garamond', serif" }}>
                {radius} mile{radius!==1?'s':''}
              </span>
            </div>

            {/* Radius pill options */}
            <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
              {RADIUS_OPTIONS.map(r => (
                <button key={r} onClick={() => setRadius(r)} style={{
                  background: radius===r ? 'var(--crema-mid)' : 'var(--surface-3)',
                  color: radius===r ? 'var(--bg)' : 'var(--text-2)',
                  border: `1px solid ${radius===r ? 'var(--crema-mid)' : 'var(--border)'}`,
                  borderRadius:20, padding:'6px 14px', fontSize:13, fontWeight:600,
                  cursor:'pointer', transition:'all 0.2s', fontFamily:"'DM Sans', sans-serif",
                }}>
                  {r < 1 ? `${r*5280|0} ft` : `${r} mi`}
                </button>
              ))}
            </div>

            {/* Visual range bar */}
            <div style={{ marginTop:16, height:4, background:'var(--surface-3)', borderRadius:2, overflow:'hidden' }}>
              <div style={{ height:'100%', width:`${(radius/5)*100}%`, background:'var(--crema-mid)', borderRadius:2, transition:'width 0.3s ease' }} />
            </div>
          </div>

          {/* Results count */}
          <p style={{ fontSize:13, color:'var(--text-3)', marginBottom:16 }}>
            <span style={{ color:'var(--crema)', fontWeight:700 }}>{shopsWithDistance.length}</span>
            {' '}café{shopsWithDistance.length!==1?'s':''} within {radius} mile{radius!==1?'s':''}
          </p>

          {/* Café cards */}
          {shopsWithDistance.length === 0 ? (
            <div className="card" style={{ padding:'48px', textAlign:'center' }}>
              <div style={{ fontSize:40, marginBottom:12 }}>🔍</div>
              <p style={{ color:'var(--crema)', fontSize:16, fontFamily:"'Cormorant Garamond', serif", marginBottom:6 }}>No cafés in range</p>
              <p style={{ color:'var(--text-3)', fontSize:13 }}>Try increasing the search radius.</p>
            </div>
          ) : shopsWithDistance.map((shop, i) => {
            const amb = avgScores?.[shop.id]?.ambiance ?? 0
            const tas = avgScores?.[shop.id]?.taste    ?? 0
            const val = avgScores?.[shop.id]?.value    ?? 0
            const avg = amb > 0 ? (amb+tas+val)/3 : 0
            return (
              <div key={shop.id} className="card animate-fadeUp" style={{ marginBottom:12, overflow:'hidden', cursor:'pointer', transition:'border-color 0.2s', animationDelay:`${i*0.05}s` }}
                onMouseEnter={e => e.currentTarget.style.borderColor='var(--crema-mid)'}
                onMouseLeave={e => e.currentTarget.style.borderColor='var(--border)'}
                onClick={() => onSelect(shop)}>
                <div style={{ display:'flex' }}>
                  {/* Image */}
                  <div style={{ position:'relative', flexShrink:0 }}>
                    <img src={shop.image_url} alt={shop.name} style={{ width:100, height:100, objectFit:'cover', display:'block' }} />
                    {/* Distance overlay on image */}
                    <div style={{ position:'absolute', bottom:6, left:6 }}>
                      <DistanceBadge miles={shop.distanceMiles} />
                    </div>
                  </div>

                  {/* Info */}
                  <div style={{ padding:'12px 16px', flex:1 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:8 }}>
                      <div>
                        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                          <h3 style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:17, fontWeight:700, color:'var(--crema)' }}>{shop.name}</h3>
                          {shop.visited && <span style={{ fontSize:10, background:'var(--crema)', color:'var(--bg)', borderRadius:20, padding:'1px 7px', fontWeight:700, flexShrink:0 }}>✓</span>}
                        </div>
                        <p style={{ fontSize:11, color:'var(--text-3)', margin:'2px 0 6px' }}>{shop.neighborhood}</p>
                      </div>
                    </div>

                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                      <div style={{ display:'flex', gap:10 }}>
                        <span style={{ fontSize:11, color:'var(--text-3)' }}>🌿 {amb>0?Math.round(amb):'—'}</span>
                        <span style={{ fontSize:11, color:'var(--text-3)' }}>☕ {tas>0?Math.round(tas):'—'}</span>
                      </div>
                      <button onClick={e=>{e.stopPropagation();onLog(shop)}} className="btn-primary" style={{ fontSize:11, padding:'5px 12px' }}>Log</button>
                    </div>
                  </div>
                </div>

                {/* Walking time estimate */}
                <div style={{ borderTop:'1px solid var(--border)', padding:'8px 16px', display:'flex', gap:16 }}>
                  <span style={{ fontSize:11, color:'var(--text-3)' }}>🚶 {Math.round(shop.distanceMiles * 20)} min walk</span>
                  <span style={{ fontSize:11, color:'var(--text-3)' }}>🚗 {Math.round(shop.distanceMiles * 3)} min drive</span>
                  {avg > 0 && <span style={{ fontSize:11, color:'var(--text-3)', marginLeft:'auto' }}>★ {avg.toFixed(1)} avg</span>}
                </div>
              </div>
            )
          })}
        </>
      )}
    </div>
  )
}

// ─── Search View ─────────────────────────────
function SearchView({ shops, avgScores, onSelect, onLog }) {
  const [query, setQuery]           = useState('')
  const [neighborhood, setNeighborhood] = useState('all')
  const [tag, setTag]               = useState('all')
  const [minScore, setMinScore]     = useState(0)
  const neighborhoods = ['all', ...Array.from(new Set(shops.map(s=>s.neighborhood).filter(Boolean)))]
  const allTags       = ['all', ...Array.from(new Set(shops.flatMap(s=>s.tags||[])))]
  const filtered = shops.filter(shop => {
    const avg = avgScores[shop.id] ? (avgScores[shop.id].ambiance+avgScores[shop.id].taste+avgScores[shop.id].value)/3 : 0
    return (
      (!query || shop.name.toLowerCase().includes(query.toLowerCase()) || shop.neighborhood?.toLowerCase().includes(query.toLowerCase()) || shop.tags?.some(t=>t.toLowerCase().includes(query.toLowerCase()))) &&
      (neighborhood==='all' || shop.neighborhood===neighborhood) &&
      (tag==='all' || shop.tags?.includes(tag)) &&
      (minScore===0 || avg>=minScore)
    )
  })
  return (
    <div style={{ maxWidth:680, margin:'0 auto', padding:'32px 24px' }}>
      <h1 className="animate-fadeUp" style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:38, fontWeight:700, color:'var(--crema)', marginBottom:6 }}>Search</h1>
      <p className="animate-fadeUp delay-100" style={{ fontSize:14, color:'var(--text-3)', marginBottom:24 }}>Find your next favourite café.</p>
      <div className="animate-fadeUp delay-100" style={{ position:'relative', marginBottom:16 }}>
        <span style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', fontSize:16 }}>🔍</span>
        <input className="input" style={{ paddingLeft:40 }} placeholder="Search by name, tag, or neighbourhood…" value={query} onChange={e=>setQuery(e.target.value)} />
      </div>
      <div className="animate-fadeUp delay-200" style={{ display:'flex', gap:10, marginBottom:24, flexWrap:'wrap' }}>
        <select value={neighborhood} onChange={e=>setNeighborhood(e.target.value)} style={{ background:'var(--surface-2)', border:`1.5px solid ${neighborhood!=='all'?'var(--crema-mid)':'var(--border)'}`, borderRadius:10, color:neighborhood!=='all'?'var(--crema)':'var(--text-3)', padding:'8px 12px', fontSize:13, cursor:'pointer', outline:'none', fontFamily:"'DM Sans', sans-serif" }}>
          {neighborhoods.map(n=><option key={n} value={n} style={{ background:'var(--surface-2)' }}>{n==='all'?'All Neighbourhoods':n}</option>)}
        </select>
        <select value={tag} onChange={e=>setTag(e.target.value)} style={{ background:'var(--surface-2)', border:`1.5px solid ${tag!=='all'?'var(--crema-mid)':'var(--border)'}`, borderRadius:10, color:tag!=='all'?'var(--crema)':'var(--text-3)', padding:'8px 12px', fontSize:13, cursor:'pointer', outline:'none', fontFamily:"'DM Sans', sans-serif" }}>
          {allTags.map(t=><option key={t} value={t} style={{ background:'var(--surface-2)' }}>{t==='all'?'All Tags':t}</option>)}
        </select>
        <select value={minScore} onChange={e=>setMinScore(Number(e.target.value))} style={{ background:'var(--surface-2)', border:`1.5px solid ${minScore>0?'var(--crema-mid)':'var(--border)'}`, borderRadius:10, color:minScore>0?'var(--crema)':'var(--text-3)', padding:'8px 12px', fontSize:13, cursor:'pointer', outline:'none', fontFamily:"'DM Sans', sans-serif" }}>
          <option value={0} style={{ background:'var(--surface-2)' }}>Any Score</option>
          {[2,3,4,5].map(s=><option key={s} value={s} style={{ background:'var(--surface-2)' }}>★ {s}+ avg</option>)}
        </select>
        {(query||neighborhood!=='all'||tag!=='all'||minScore>0) && (
          <button onClick={()=>{setQuery('');setNeighborhood('all');setTag('all');setMinScore(0)}} style={{ background:'none', border:'1px solid var(--border)', borderRadius:10, color:'var(--text-3)', padding:'8px 14px', fontSize:13, cursor:'pointer', fontFamily:"'DM Sans', sans-serif" }}>Clear ✕</button>
        )}
      </div>
      <p style={{ fontSize:13, color:'var(--text-3)', marginBottom:16 }}>{filtered.length} result{filtered.length!==1?'s':''}{query&&<span> for "<span style={{ color:'var(--crema)' }}>{query}</span>"</span>}</p>
      {filtered.length===0 ? (
        <div className="card" style={{ padding:'48px', textAlign:'center' }}>
          <div style={{ fontSize:40, marginBottom:12 }}>🔍</div>
          <p style={{ color:'var(--crema)', fontSize:16, fontFamily:"'Cormorant Garamond', serif", marginBottom:6 }}>No cafés found</p>
          <p style={{ color:'var(--text-3)', fontSize:13 }}>Try adjusting your filters.</p>
        </div>
      ) : filtered.map((shop,i) => {
        const avg = avgScores[shop.id] ? (avgScores[shop.id].ambiance+avgScores[shop.id].taste+avgScores[shop.id].value)/3 : 0
        return (
          <div key={shop.id} className="card animate-fadeUp" style={{ marginBottom:12, overflow:'hidden', cursor:'pointer', transition:'border-color 0.2s', animationDelay:`${i*0.05}s` }}
            onMouseEnter={e=>e.currentTarget.style.borderColor='var(--crema-mid)'}
            onMouseLeave={e=>e.currentTarget.style.borderColor='var(--border)'}
            onClick={()=>onSelect(shop)}>
            <div style={{ display:'flex' }}>
              <img src={shop.image_url} alt={shop.name} style={{ width:100, height:100, objectFit:'cover', flexShrink:0 }} />
              <div style={{ padding:'14px 16px', flex:1 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:8 }}>
                  <div>
                    <h3 style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:18, fontWeight:700, color:'var(--crema)' }}>{shop.name}</h3>
                    <p style={{ fontSize:11, color:'var(--text-3)', margin:'2px 0 8px' }}>{shop.neighborhood}</p>
                  </div>
                  {shop.visited && <span style={{ fontSize:10, background:'var(--crema)', color:'var(--bg)', borderRadius:20, padding:'2px 8px', fontWeight:700, flexShrink:0 }}>✓</span>}
                </div>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                    {shop.tags?.slice(0,2).map(t=><span key={t} style={{ fontSize:10, color:'var(--text-3)', background:'var(--surface-3)', border:'1px solid var(--border)', borderRadius:5, padding:'2px 7px' }}>{t}</span>)}
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                    {avg>0 && <Stars value={Math.round(avg)} size={12} />}
                    <button onClick={e=>{e.stopPropagation();onLog(shop)}} className="btn-primary" style={{ fontSize:11, padding:'5px 12px' }}>Log</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Discover View ───────────────────────────
function DiscoverView({ shops, avgScores, onSelect, onLog }) {
  const [filter, setFilter] = useState('all')
  const filtered = filter==='visited'?shops.filter(s=>s.visited):filter==='unvisited'?shops.filter(s=>!s.visited):shops
  return (
    <div style={{ maxWidth:680, margin:'0 auto', padding:'32px 24px' }}>
      <h1 className="animate-fadeUp" style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:38, fontWeight:700, color:'var(--crema)', marginBottom:6 }}>Discover Rochester</h1>
      <p className="animate-fadeUp delay-100" style={{ fontSize:14, color:'var(--text-3)', marginBottom:24 }}>{shops.length} cafés · {shops.filter(s=>s.visited).length} visited</p>
      <div className="animate-fadeUp delay-200" style={{ display:'flex', gap:8, marginBottom:24 }}>
        {[['all','All'],['visited','Visited'],['unvisited','Unvisited']].map(([val,label])=>(
          <button key={val} onClick={()=>setFilter(val)} style={{ background:filter===val?'var(--crema-mid)':'var(--surface)', color:filter===val?'var(--bg)':'var(--text-2)', border:'1px solid var(--border)', borderRadius:20, padding:'6px 16px', fontSize:13, fontWeight:600, cursor:'pointer', transition:'all 0.2s', fontFamily:"'DM Sans', sans-serif" }}>{label}</button>
        ))}
      </div>
      {filtered.map((shop,i)=>{
        const amb=avgScores?.[shop.id]?.ambiance??0, tas=avgScores?.[shop.id]?.taste??0, val=avgScores?.[shop.id]?.value??0
        return (
          <div key={shop.id} className="card animate-fadeUp" style={{ marginBottom:16, overflow:'hidden', cursor:'pointer', transition:'border-color 0.2s', animationDelay:`${i*0.07}s` }}
            onMouseEnter={e=>e.currentTarget.style.borderColor='var(--crema-mid)'}
            onMouseLeave={e=>e.currentTarget.style.borderColor='var(--border)'}
            onClick={()=>onSelect(shop)}>
            <img src={shop.image_url} alt={shop.name} style={{ width:'100%', height:180, objectFit:'cover', display:'block' }} />
            <div style={{ padding:'16px 20px' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                <div>
                  <h3 style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:22, fontWeight:700, color:'var(--crema)' }}>{shop.name}</h3>
                  <p style={{ fontSize:12, color:'var(--text-3)', marginTop:2 }}>{shop.address} · {shop.neighborhood}</p>
                </div>
                {shop.visited && <span style={{ fontSize:11, background:'var(--crema)', color:'var(--bg)', borderRadius:20, padding:'3px 10px', fontWeight:700, flexShrink:0 }}>✓ Visited</span>}
              </div>
              <p style={{ fontSize:13, color:'var(--text-2)', marginTop:10, lineHeight:1.6 }}>{shop.description}</p>
              <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginTop:10 }}>
                {shop.tags?.map(t=><span key={t} style={{ fontSize:11, color:'var(--text-2)', background:'var(--surface-3)', border:'1px solid var(--border)', borderRadius:6, padding:'2px 8px' }}>{t}</span>)}
              </div>
              <div style={{ borderTop:'1px solid var(--border)', marginTop:14, paddingTop:14, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <div style={{ display:'flex', gap:14 }}>
                  <span style={{ fontSize:12, color:'var(--text-3)' }}>🌿 {amb>0?Math.round(amb):'—'}</span>
                  <span style={{ fontSize:12, color:'var(--text-3)' }}>☕ {tas>0?Math.round(tas):'—'}</span>
                  <span style={{ fontSize:12, color:'var(--text-3)' }}>💰 {val>0?Math.round(val):'—'}</span>
                </div>
                <button onClick={e=>{e.stopPropagation();onLog(shop)}} className="btn-primary" style={{ fontSize:12, padding:'7px 16px' }}>Log Visit</button>
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
  const shopMap = Object.fromEntries(shops.map(s=>[s.id,s]))
  return (
    <div style={{ maxWidth:680, margin:'0 auto', padding:'32px 24px' }}>
      <h1 className="animate-fadeUp" style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:38, fontWeight:700, color:'var(--crema)', marginBottom:6 }}>My Visits</h1>
      <p className="animate-fadeUp delay-100" style={{ fontSize:14, color:'var(--text-3)', marginBottom:28 }}>{visits.length} visit{visits.length!==1?'s':''} logged</p>
      {visits.length===0 ? (
        <div className="card animate-fadeUp" style={{ padding:'48px', textAlign:'center' }}>
          <div style={{ fontSize:48, marginBottom:12 }}>☕</div>
          <p style={{ color:'var(--crema)', fontSize:18, fontFamily:"'Cormorant Garamond', serif", marginBottom:8 }}>No visits yet</p>
          <p style={{ color:'var(--text-3)', fontSize:13 }}>Head to the map and start exploring!</p>
        </div>
      ):visits.map((visit,i)=>{
        const shop=shopMap[visit.shop_id]; if(!shop) return null
        return (
          <div key={visit.id} className="card animate-fadeUp" style={{ marginBottom:12, padding:'16px', animationDelay:`${i*0.07}s` }}>
            <div style={{ display:'flex', gap:12, alignItems:'flex-start' }}>
              <img src={shop.image_url} alt={shop.name} style={{ width:60, height:60, borderRadius:10, objectFit:'cover', flexShrink:0 }} />
              <div style={{ flex:1 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                  <div>
                    <h3 style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:18, fontWeight:700, color:'var(--crema)' }}>{shop.name}</h3>
                    <p style={{ fontSize:11, color:'var(--text-3)', margin:'2px 0 6px' }}>{shop.neighborhood} · {new Date(visit.visited_at).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}</p>
                  </div>
                  <Stars value={Math.round((visit.ambiance_score+visit.taste_score+visit.value_score)/3)} size={14} />
                </div>
                <div style={{ display:'flex', gap:14 }}>
                  <span style={{ fontSize:12, color:'var(--text-3)' }}>🌿 {visit.ambiance_score}/5</span>
                  <span style={{ fontSize:12, color:'var(--text-3)' }}>☕ {visit.taste_score}/5</span>
                  <span style={{ fontSize:12, color:'var(--text-3)' }}>💰 {visit.value_score}/5</span>
                </div>
                {visit.note && <p style={{ fontSize:12, color:'var(--text-2)', marginTop:8, fontStyle:'italic', lineHeight:1.5 }}>"{visit.note}"</p>}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Profile View ─────────────────────────────
function ProfileView({ user, visits, shops, onAuthClick }) {
  if (!user) return (
    <div style={{ maxWidth:480, margin:'80px auto', padding:'0 24px', textAlign:'center' }}>
      <div style={{ fontSize:52, marginBottom:16 }}>☕</div>
      <h2 style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:28, color:'var(--crema)', marginBottom:8 }}>Your coffee story starts here</h2>
      <p style={{ fontSize:14, color:'var(--text-3)', marginBottom:24 }}>Sign in to track your visits and build your coffee profile.</p>
      <button onClick={onAuthClick} className="btn-primary" style={{ fontSize:15, padding:'13px 32px' }}>Sign In / Sign Up</button>
    </div>
  )
  const shopMap=Object.fromEntries(shops.map(s=>[s.id,s]))
  const total=visits.length
  const avgAmbiance=total?(visits.reduce((a,v)=>a+v.ambiance_score,0)/total).toFixed(1):'—'
  const avgTaste=total?(visits.reduce((a,v)=>a+v.taste_score,0)/total).toFixed(1):'—'
  const avgValue=total?(visits.reduce((a,v)=>a+v.value_score,0)/total).toFixed(1):'—'
  const visitCounts={}; visits.forEach(v=>{visitCounts[v.shop_id]=(visitCounts[v.shop_id]||0)+1})
  const favId=Object.entries(visitCounts).sort((a,b)=>b[1]-a[1])[0]?.[0]
  const favShop=favId?shopMap[favId]:null
  const shopAvgs={}; visits.forEach(v=>{ if(!shopAvgs[v.shop_id])shopAvgs[v.shop_id]=[]; shopAvgs[v.shop_id].push((v.ambiance_score+v.taste_score+v.value_score)/3) })
  const topRatedId=Object.entries(shopAvgs).sort((a,b)=>(b[1].reduce((x,y)=>x+y,0)/b[1].length)-(a[1].reduce((x,y)=>x+y,0)/a[1].length))[0]?.[0]
  const topRatedShop=topRatedId?shopMap[topRatedId]:null
  const P={ bg:'#FAF6F0', surface:'#F2EBE0', border:'#E8DDD0', espresso:'#1C1208', roast:'#3D2B1F', crema:'#C8965A', slate:'#8A7968' }
  return (
    <div style={{ background:P.bg, minHeight:'100%' }}>
      <div style={{ maxWidth:640, margin:'0 auto', padding:'40px 24px 60px' }}>
        <div className="animate-fadeUp" style={{ marginBottom:32 }}>
          <div style={{ width:64, height:64, borderRadius:20, background:P.crema+'30', border:`2px solid ${P.crema}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:28, marginBottom:16 }}>☕</div>
          <h1 style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:36, fontWeight:700, color:P.espresso, marginBottom:4 }}>Your Profile</h1>
          <p style={{ fontSize:13, color:P.slate }}>{user.email}</p>
        </div>
        <div className="animate-fadeUp delay-100" style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:28 }}>
          {[{label:'Cafés Visited',value:total,icon:'📍'},{label:'Avg Taste',value:avgTaste,icon:'☕'},{label:'Avg Ambiance',value:avgAmbiance,icon:'🌿'}].map(stat=>(
            <div key={stat.label} style={{ background:P.surface, border:`1px solid ${P.border}`, borderRadius:16, padding:'18px 12px', textAlign:'center' }}>
              <div style={{ fontSize:22, marginBottom:6 }}>{stat.icon}</div>
              <div style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:28, fontWeight:700, color:P.espresso }}>{stat.value}</div>
              <div style={{ fontSize:11, color:P.slate, marginTop:3 }}>{stat.label}</div>
            </div>
          ))}
        </div>
        <div className="animate-fadeUp delay-200" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:28 }}>
          <div style={{ background:P.surface, border:`1px solid ${P.border}`, borderRadius:16, padding:'18px 16px' }}>
            <p style={{ fontSize:11, color:P.slate, fontWeight:700, letterSpacing:1.5, textTransform:'uppercase', marginBottom:10 }}>Avg Value Score</p>
            <div style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:32, fontWeight:700, color:P.espresso }}>{avgValue}</div>
            <div style={{ height:4, background:P.border, borderRadius:2, marginTop:10, overflow:'hidden' }}>
              <div style={{ height:'100%', width:avgValue!=='—'?`${(avgValue/5)*100}%`:'0%', background:'#9b8ec4', borderRadius:2, transition:'width 0.8s ease' }} />
            </div>
          </div>
          <div style={{ background:P.surface, border:`1px solid ${P.border}`, borderRadius:16, padding:'18px 16px' }}>
            <p style={{ fontSize:11, color:P.slate, fontWeight:700, letterSpacing:1.5, textTransform:'uppercase', marginBottom:10 }}>Unique Cafés</p>
            <div style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:32, fontWeight:700, color:P.espresso }}>{Object.keys(visitCounts).length}</div>
            <p style={{ fontSize:11, color:P.slate, marginTop:6 }}>of {shops.length} in Rochester</p>
          </div>
        </div>
        {favShop && (
          <div className="animate-fadeUp delay-200" style={{ marginBottom:28 }}>
            <p style={{ fontSize:11, color:P.slate, fontWeight:700, letterSpacing:1.5, textTransform:'uppercase', marginBottom:12 }}>⭐ Favourite Café</p>
            <div style={{ background:P.surface, border:`1px solid ${P.border}`, borderRadius:18, overflow:'hidden' }}>
              <img src={favShop.image_url} alt={favShop.name} style={{ width:'100%', height:140, objectFit:'cover', display:'block' }} />
              <div style={{ padding:'16px 18px' }}>
                <h3 style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:22, fontWeight:700, color:P.espresso }}>{favShop.name}</h3>
                <p style={{ fontSize:12, color:P.slate, marginTop:3 }}>{favShop.neighborhood} · visited {visitCounts[favId]}x</p>
                <div style={{ display:'flex', gap:6, marginTop:10, flexWrap:'wrap' }}>
                  {favShop.tags?.map(t=><span key={t} style={{ fontSize:11, color:P.roast, background:P.crema+'25', border:`1px solid ${P.crema}44`, borderRadius:6, padding:'3px 9px' }}>{t}</span>)}
                </div>
              </div>
            </div>
          </div>
        )}
        {topRatedShop&&topRatedShop.id!==favShop?.id && (
          <div className="animate-fadeUp delay-300" style={{ marginBottom:28 }}>
            <p style={{ fontSize:11, color:P.slate, fontWeight:700, letterSpacing:1.5, textTransform:'uppercase', marginBottom:12 }}>🏆 Highest Rated by You</p>
            <div style={{ background:P.surface, border:`1px solid ${P.border}`, borderRadius:16, padding:16, display:'flex', gap:14, alignItems:'center' }}>
              <img src={topRatedShop.image_url} alt={topRatedShop.name} style={{ width:60, height:60, borderRadius:10, objectFit:'cover', flexShrink:0 }} />
              <div>
                <h3 style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:18, fontWeight:700, color:P.espresso }}>{topRatedShop.name}</h3>
                <p style={{ fontSize:12, color:P.slate, marginTop:2 }}>{topRatedShop.neighborhood}</p>
                <Stars value={Math.round(shopAvgs[topRatedId].reduce((a,b)=>a+b,0)/shopAvgs[topRatedId].length)} size={14} />
              </div>
            </div>
          </div>
        )}
        {visits.length>0 && (
          <div className="animate-fadeUp delay-300">
            <p style={{ fontSize:11, color:P.slate, fontWeight:700, letterSpacing:1.5, textTransform:'uppercase', marginBottom:12 }}>Recent Visits</p>
            {visits.slice(0,5).map((visit,i)=>{
              const shop=shopMap[visit.shop_id]; if(!shop) return null
              return (
                <div key={visit.id} style={{ background:P.surface, border:`1px solid ${P.border}`, borderRadius:14, padding:'14px 16px', marginBottom:10, display:'flex', gap:12, alignItems:'center' }}>
                  <img src={shop.image_url} alt={shop.name} style={{ width:48, height:48, borderRadius:8, objectFit:'cover', flexShrink:0 }} />
                  <div style={{ flex:1 }}>
                    <h4 style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:16, fontWeight:700, color:P.espresso }}>{shop.name}</h4>
                    <p style={{ fontSize:11, color:P.slate, margin:'2px 0 5px' }}>{new Date(visit.visited_at).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}</p>
                    <div style={{ display:'flex', gap:12 }}>
                      <span style={{ fontSize:11, color:P.slate }}>🌿 {visit.ambiance_score}</span>
                      <span style={{ fontSize:11, color:P.slate }}>☕ {visit.taste_score}</span>
                      <span style={{ fontSize:11, color:P.slate }}>💰 {visit.value_score}</span>
                    </div>
                    {visit.note && <p style={{ fontSize:11, color:P.roast, marginTop:5, fontStyle:'italic' }}>"{visit.note}"</p>}
                  </div>
                </div>
              )
            })}
          </div>
        )}
        {visits.length===0 && (
          <div style={{ background:P.surface, border:`1px solid ${P.border}`, borderRadius:18, padding:'48px', textAlign:'center' }}>
            <div style={{ fontSize:48, marginBottom:12 }}>☕</div>
            <p style={{ color:P.espresso, fontSize:18, fontFamily:"'Cormorant Garamond', serif", marginBottom:8 }}>No visits yet</p>
            <p style={{ color:P.slate, fontSize:13 }}>Start logging your café visits to build your profile.</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Nav ─────────────────────────────────────
function Nav({ activeView, setActiveView, user, onAuthClick, onSignOut }) {
  const tabs = [
    { id:'map',      icon:'🗺️', label:'Map'     },
    { id:'nearby',   icon:'📍', label:'Nearby'  },
    { id:'discover', icon:'🔍', label:'Discover'},
    { id:'search',   icon:'🔎', label:'Search'  },
    { id:'visited',  icon:'⭐', label:'Visits'  },
    { id:'profile',  icon:'👤', label:'Profile' },
  ]
  return (
    <nav style={{ height:56, background:'var(--surface)', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 16px', flexShrink:0, gap:8 }}>
      <div style={{ display:'flex', alignItems:'center', gap:6, flexShrink:0 }}>
        <span style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:20, fontWeight:700, fontStyle:'italic', color:'var(--crema)' }}>café café</span>
        <div style={{ width:5, height:5, borderRadius:3, background:'var(--crema-mid)', flexShrink:0 }} />
      </div>
      <div style={{ display:'flex', gap:2 }}>
        {tabs.map(tab => (
          <button key={tab.id} onClick={()=>setActiveView(tab.id)} title={tab.label} style={{ background:activeView===tab.id?'var(--crema-mid)':'transparent', color:activeView===tab.id?'var(--bg)':'var(--text-3)', border:'none', borderRadius:8, padding:'6px 10px', fontSize:14, fontWeight:600, cursor:'pointer', transition:'all 0.2s', fontFamily:"'DM Sans', sans-serif" }}>{tab.icon}</button>
        ))}
      </div>
      {user ? (
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ fontSize:11, color:'var(--text-3)', maxWidth:100, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{user.email}</span>
          <button onClick={onSignOut} style={{ background:'var(--surface-3)', border:'1px solid var(--border)', borderRadius:8, padding:'5px 10px', fontSize:12, color:'var(--text-2)', cursor:'pointer', fontFamily:"'DM Sans', sans-serif", flexShrink:0 }}>Out</button>
        </div>
      ) : (
        <button onClick={onAuthClick} className="btn-primary" style={{ fontSize:12, padding:'6px 14px', flexShrink:0 }}>Sign In</button>
      )}
    </nav>
  )
}

// ─── Main App ────────────────────────────────
export default function Home() {
  const [user, setUser]             = useState(null)
  const [shops, setShops]           = useState([])
  const [visits, setVisits]         = useState([])
  const [avgScores, setAvgScores]   = useState({})
  const [activeView, setActiveView] = useState('map')
  const [selected, setSelected]     = useState(null)
  const [logShop, setLogShop]       = useState(null)
  const [showAuth, setShowAuth]     = useState(false)
  const [loadingShops, setLoadingShops]   = useState(true)
  const [loadingVisits, setLoadingVisits] = useState(false)
  const [isMobile, setIsMobile]     = useState(false)

  // ── Location state ───────────────────────────
  const [userLocation, setUserLocation]       = useState(null)
  const [locationLoading, setLocationLoading] = useState(false)
  const [locationError, setLocationError]     = useState(null)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check(); window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(({data:{session}}) => setUser(session?.user??null))
    const {data:{subscription}} = supabase.auth.onAuthStateChange((_e,session) => setUser(session?.user??null))
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    const load = async () => {
      setLoadingShops(true)
      const {data} = await supabase.from('shops').select('*')
      if (data) setShops(data)
      setLoadingShops(false)
    }
    load()
  }, [])

  useEffect(() => {
    if (!user) { setVisits([]); return }
    const load = async () => {
      setLoadingVisits(true)
      const {data} = await supabase.from('visits').select('*').eq('user_id',user.id).order('visited_at',{ascending:false})
      if (data) setVisits(data)
      setLoadingVisits(false)
    }
    load()
  }, [user])

  useEffect(() => {
    if (!visits.length) { setAvgScores({}); return }
    const map = {}
    visits.forEach(v => {
      if (!map[v.shop_id]) map[v.shop_id] = {ambiance:[],taste:[],value:[]}
      map[v.shop_id].ambiance.push(v.ambiance_score)
      map[v.shop_id].taste.push(v.taste_score)
      map[v.shop_id].value.push(v.value_score)
    })
    const avgs = {}
    Object.entries(map).forEach(([id,s]) => {
      avgs[id] = {
        ambiance: s.ambiance.reduce((a,b)=>a+b,0)/s.ambiance.length,
        taste:    s.taste.reduce((a,b)=>a+b,0)/s.taste.length,
        value:    s.value.reduce((a,b)=>a+b,0)/s.value.length,
      }
    })
    setAvgScores(avgs)
  }, [visits])

  // ── Request location ─────────────────────────
  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser.')
      return
    }
    setLocationLoading(true)
    setLocationError(null)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setLocationLoading(false)
        setLocationError(null)
      },
      (err) => {
        setLocationError(err.message || 'Could not get your location.')
        setLocationLoading(false)
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }, [])

  // Auto-request location when Nearby tab is opened
  useEffect(() => {
    if (activeView === 'nearby' && !userLocation && !locationLoading) {
      requestLocation()
    }
  }, [activeView])

  const shopsWithVisited = shops.map(s => ({ ...s, visited: visits.some(v=>v.shop_id===s.id) }))
  const handleLog        = (shop) => { setLogShop(shop); setSelected(null) }
  const handleLogSubmit  = async () => {
    setLogShop(null)
    if (user) {
      const {data} = await supabase.from('visits').select('*').eq('user_id',user.id).order('visited_at',{ascending:false})
      if (data) setVisits(data)
    }
  }
  const handleSignOut  = async () => { await supabase.auth.signOut(); setVisits([]) }
  const handleNeedAuth = ()        => { setLogShop(null); setShowAuth(true) }

  return (
    <div style={{ height:'100vh', display:'flex', flexDirection:'column', overflow:'hidden' }}>
      <Nav activeView={activeView} setActiveView={setActiveView} user={user} onAuthClick={()=>setShowAuth(true)} onSignOut={handleSignOut} />

      <div style={{ flex:1, overflow:'hidden', position:'relative' }}>

        {/* MAP */}
        {activeView==='map' && (
          <div style={{ display:'flex', height:'100%' }}>
            {!isMobile && (
              <div style={{ width:290, flexShrink:0, background:'var(--surface)', borderRight:'1px solid var(--border)', overflowY:'auto', padding:'14px 12px' }}>
                <p style={{ fontSize:10, color:'var(--text-3)', fontWeight:700, letterSpacing:2, textTransform:'uppercase', marginBottom:14, paddingLeft:4 }}>Rochester · {shopsWithVisited.length} cafés</p>
                {loadingShops?<Spinner/>:shopsWithVisited.map((shop,i)=>(
                  <div key={shop.id} className="animate-fadeUp" style={{ animationDelay:`${i*0.08}s` }}>
                    <div onClick={()=>setSelected(shop)} style={{ background:selected?.id===shop.id?'var(--surface-2)':'var(--surface)', border:`1.5px solid ${selected?.id===shop.id?'var(--crema-mid)':'var(--border)'}`, borderRadius:14, padding:'12px 14px', cursor:'pointer', transition:'all 0.2s', marginBottom:10 }}
                      onMouseEnter={e=>{if(selected?.id!==shop.id)e.currentTarget.style.borderColor='var(--crema-dark)'}}
                      onMouseLeave={e=>{if(selected?.id!==shop.id)e.currentTarget.style.borderColor='var(--border)'}}>
                      <div style={{ display:'flex', gap:10, alignItems:'center' }}>
                        <img src={shop.image_url} alt={shop.name} style={{ width:46, height:46, borderRadius:8, objectFit:'cover', flexShrink:0 }} />
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ display:'flex', alignItems:'center', gap:5 }}>
                            <h3 style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:14, fontWeight:700, color:'var(--crema)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{shop.name}</h3>
                            {shop.visited && <span style={{ fontSize:9, background:'var(--crema)', color:'var(--bg)', borderRadius:20, padding:'1px 5px', fontWeight:700, flexShrink:0 }}>✓</span>}
                          </div>
                          <p style={{ fontSize:10, color:'var(--text-3)', marginBottom:3 }}>{shop.neighborhood}</p>
                          <Stars value={Math.round(((avgScores[shop.id]?.ambiance??0)+(avgScores[shop.id]?.taste??0)+(avgScores[shop.id]?.value??0))/3)} size={11} />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div style={{ flex:1, position:'relative' }}>
              {loadingShops?<Spinner/>:<MapView shops={shopsWithVisited} selected={selected} onSelect={setSelected} />}
              {isMobile&&!selected && <button onClick={()=>setActiveView('discover')} style={{ position:'absolute', bottom:24, right:16, background:'var(--crema-mid)', color:'var(--bg)', border:'none', borderRadius:14, padding:'12px 18px', fontWeight:700, fontSize:14, cursor:'pointer', boxShadow:'0 6px 20px rgba(200,150,90,0.4)', zIndex:500, fontFamily:"'DM Sans', sans-serif" }}>☕ Browse All</button>}
              {selected&&isMobile && <ShopPanel shop={selected} onClose={()=>setSelected(null)} onLog={handleLog} avgScores={avgScores} />}
              {selected&&!isMobile && (
                <div className="animate-slideUp" style={{ position:'absolute', bottom:24, left:306, right:24, background:'var(--surface)', border:'1px solid var(--border)', borderRadius:18, padding:'20px', zIndex:500, maxWidth:360 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:12 }}>
                    <div>
                      <h3 style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:20, fontWeight:700, color:'var(--crema)' }}>{selected.name}</h3>
                      <p style={{ fontSize:11, color:'var(--text-3)', marginTop:2 }}>{selected.address}</p>
                    </div>
                    <button onClick={()=>setSelected(null)} style={{ background:'var(--surface-3)', border:'1px solid var(--border)', borderRadius:8, width:28, height:28, cursor:'pointer', color:'var(--text-2)', fontSize:12 }}>✕</button>
                  </div>
                  {avgScores[selected.id] ? (
                    <>
                      <ScoreBar label="Ambiance" icon="🌿" value={Math.round(avgScores[selected.id].ambiance)} color="var(--success)" />
                      <ScoreBar label="Taste"    icon="☕" value={Math.round(avgScores[selected.id].taste)}    color="var(--crema-mid)" />
                      <ScoreBar label="Value"    icon="💰" value={Math.round(avgScores[selected.id].value)}    color="#9b8ec4" />
                    </>
                  ) : <p style={{ fontSize:12, color:'var(--text-3)', marginBottom:12 }}>No ratings yet — be the first!</p>}
                  <button onClick={()=>handleLog(selected)} className="btn-primary" style={{ width:'100%', marginTop:8, fontSize:13 }}>⭐ Log a Visit</button>
                </div>
              )}
            </div>
          </div>
        )}

        {activeView==='nearby' && (
          <div style={{ overflowY:'auto', height:'100%' }}>
            {loadingShops?<Spinner/>:<NearbyView shops={shopsWithVisited} avgScores={avgScores} userLocation={userLocation} locationError={locationError} locationLoading={locationLoading} onRequestLocation={requestLocation} onSelect={s=>{setSelected(s);setActiveView('map')}} onLog={handleLog} />}
          </div>
        )}

        {activeView==='discover' && (
          <div style={{ overflowY:'auto', height:'100%' }}>
            {loadingShops?<Spinner/>:<DiscoverView shops={shopsWithVisited} avgScores={avgScores} onSelect={s=>{setSelected(s);setActiveView('map')}} onLog={handleLog} />}
          </div>
        )}

        {activeView==='search' && (
          <div style={{ overflowY:'auto', height:'100%' }}>
            {loadingShops?<Spinner/>:<SearchView shops={shopsWithVisited} avgScores={avgScores} onSelect={s=>{setSelected(s);setActiveView('map')}} onLog={handleLog} />}
          </div>
        )}

        {activeView==='visited' && (
          <div style={{ overflowY:'auto', height:'100%' }}>
            {!user?(
              <div style={{ maxWidth:480, margin:'80px auto', padding:'0 24px', textAlign:'center' }}>
                <div style={{ fontSize:52, marginBottom:16 }}>☕</div>
                <h2 style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:28, color:'var(--crema)', marginBottom:8 }}>Sign in to see your visits</h2>
                <p style={{ fontSize:14, color:'var(--text-3)', marginBottom:24 }}>Create a free account to track every café you visit.</p>
                <button onClick={()=>setShowAuth(true)} className="btn-primary" style={{ fontSize:15, padding:'13px 32px' }}>Sign In / Sign Up</button>
              </div>
            ):<VisitedView visits={visits} shops={shops} loading={loadingVisits} />}
          </div>
        )}

        {activeView==='profile' && (
          <div style={{ overflowY:'auto', height:'100%' }}>
            <ProfileView user={user} visits={visits} shops={shops} onAuthClick={()=>setShowAuth(true)} />
          </div>
        )}
      </div>

      {showAuth && <AuthModal onClose={()=>setShowAuth(false)} onSuccess={()=>setShowAuth(false)} />}
      {logShop  && <LogModal shop={logShop} user={user} onClose={()=>setLogShop(null)} onSubmit={handleLogSubmit} onNeedAuth={handleNeedAuth} />}
    </div>
  )
}
