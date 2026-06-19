'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../lib/supabase'

// ─── Design tokens (warm parchment) ──────────
const C = {
  bg:       '#EDE8DC',
  surface:  '#E4DDD0',
  border:   '#BDB5A4',
  crema:    '#2C2416',
  cremaMid: '#7C5C35',
  cremaDark:'#5C4025',
  text2:    '#5A4E3C',
  text3:    '#8A7D6A',
  parchment:'#EDE8DC',
  parchDeep:'#E4DDD0',
  espresso: '#2C2416',
  roast:    '#5A4E3C',
  slate:    '#8A7D6A',
  steam:    '#CEC5B4',
}

// ─── Animated counter ─────────────────────────
function Counter({ target, suffix = '' }) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    const step = Math.ceil(target / 40)
    const interval = setInterval(() => {
      setCount(c => {
        if (c + step >= target) { clearInterval(interval); return target }
        return c + step
      })
    }, 30)
    return () => clearInterval(interval)
  }, [target])
  return <span>{count}{suffix}</span>
}

// ─── Feature card ─────────────────────────────
function FeatureCard({ icon, title, desc, delay }) {
  return (
    <div className="animate-fadeUp" style={{
      animationDelay: delay,
      background: C.surface,
      border: `1px solid ${C.border}`,
      borderRadius: 20,
      padding: '28px 24px',
      flex: 1,
      minWidth: 220,
    }}>
      <div style={{ fontSize: 36, marginBottom: 14 }}>{icon}</div>
      <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontWeight: 700, color: C.crema, marginBottom: 8, letterSpacing: '-0.2px' }}>{title}</h3>
      <p style={{ fontSize: 14, color: C.text2, lineHeight: 1.68 }}>{desc}</p>
    </div>
  )
}

// ─── Step card ────────────────────────────────
function StepCard({ number, title, desc, delay }) {
  return (
    <div className="animate-fadeUp" style={{ animationDelay: delay, display: 'flex', gap: 20, alignItems: 'flex-start', marginBottom: 28 }}>
      <div style={{ width: 44, height: 44, borderRadius: 14, background: C.cremaMid, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 700, color: C.bg, flexShrink: 0 }}>{number}</div>
      <div>
        <h4 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 19, fontWeight: 700, color: C.crema, marginBottom: 4, letterSpacing: '-0.2px' }}>{title}</h4>
        <p style={{ fontSize: 14, color: C.text2, lineHeight: 1.68 }}>{desc}</p>
      </div>
    </div>
  )
}

// ─── Café preview card ────────────────────────
function CafeCard({ name, neighborhood, tags, ambiance, taste, value, image, delay }) {
  return (
    <div className="animate-fadeUp" style={{
      animationDelay: delay,
      background: C.surface,
      border: `1px solid ${C.border}`,
      borderRadius: 18,
      overflow: 'hidden',
      minWidth: 260,
      maxWidth: 300,
      flexShrink: 0,
    }}>
      <img src={image} alt={name} style={{ width: '100%', height: 140, objectFit: 'cover', display: 'block' }} />
      <div style={{ padding: '14px 16px' }}>
        <h4 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 17, fontWeight: 700, color: C.crema, marginBottom: 2, letterSpacing: '-0.1px' }}>{name}</h4>
        <p style={{ fontSize: 11, color: C.text3, marginBottom: 10 }}>{neighborhood}</p>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
          {tags.map(t => <span key={t} style={{ fontSize: 10, color: C.text2, background: '#2a2420', border: `1px solid ${C.border}`, borderRadius: 5, padding: '2px 7px' }}>{t}</span>)}
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <span style={{ fontSize: 11, color: C.text3 }}>🌿 {ambiance}/5</span>
          <span style={{ fontSize: 11, color: C.text3 }}>☕ {taste}/5</span>
          <span style={{ fontSize: 11, color: C.text3 }}>💰 {value}/5</span>
        </div>
      </div>
    </div>
  )
}

// ─── Auth Modal ───────────────────────────────
function AuthModal({ mode: initialMode, onClose, onSuccess }) {
  const [mode, setMode]         = useState(initialMode)
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  const handleSubmit = async () => {
    if (!email || !password) { setError('Please fill in all fields.'); return }
    if (mode === 'signup' && !username.trim()) { setError('Please choose a username.'); return }
    if (mode === 'signup' && username.includes(' ')) { setError('Username cannot contain spaces.'); return }
    setError(''); setLoading(true)

    if (mode === 'signup') {
      const { data: existing } = await supabase.from('profiles').select('id').eq('username', username.trim().toLowerCase()).maybeSingle()
      if (existing) { setError('That username is already taken.'); setLoading(false); return }
      const { data, error: authError } = await supabase.auth.signUp({ email, password })
      if (authError) { setError(authError.message); setLoading(false); return }
      if (data.user) await supabase.from('profiles').insert({ id: data.user.id, username: username.trim().toLowerCase() })
      setMode('login'); setError('Account created! Please log in.'); setLoading(false); return
    }

    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (authError) { setError(authError.message); return }
    onSuccess()
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(180,165,145,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 24 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 24, boxShadow: '0 8px 40px rgba(0,0,0,0.12)', width: '100%', maxWidth: 400, padding: '36px 32px' }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 30, fontWeight: 700, fontStyle: 'italic', color: C.crema, letterSpacing: '0.5px' }}>Café Café</h1>
          <p style={{ fontSize: 12, color: C.text3, marginTop: 4, letterSpacing: 2, textTransform: 'uppercase' }}>Your coffee, mapped.</p>
        </div>
        <div style={{ display: 'flex', background: '#2a2420', borderRadius: 10, padding: 3, marginBottom: 24 }}>
          {['login', 'signup'].map(m => (
            <button key={m} onClick={() => { setMode(m); setError('') }} style={{ flex: 1, padding: '8px', borderRadius: 8, border: 'none', cursor: 'pointer', background: mode === m ? C.cremaMid : 'transparent', color: mode === m ? C.bg : C.text3, fontWeight: 700, fontSize: 13, transition: 'all 0.2s', fontFamily: "'DM Sans', sans-serif" }}>
              {m === 'login' ? 'Log In' : 'Sign Up'}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
          {mode === 'signup' && <input style={{ width: '100%', background: '#2a2420', border: `1.5px solid ${C.border}`, borderRadius: 12, padding: '12px 14px', color: C.crema, fontSize: 14, outline: 'none', fontFamily: "'DM Sans', sans-serif" }} type="text" placeholder="Username (e.g. coffeejuan)" value={username} onChange={e => setUsername(e.target.value.toLowerCase())} onKeyDown={e => e.key === 'Enter' && handleSubmit()} />}
          <input style={{ width: '100%', background: '#2a2420', border: `1.5px solid ${C.border}`, borderRadius: 12, padding: '12px 14px', color: C.crema, fontSize: 14, outline: 'none', fontFamily: "'DM Sans', sans-serif" }} type="email" placeholder="Email address" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
          <input style={{ width: '100%', background: '#2a2420', border: `1.5px solid ${C.border}`, borderRadius: 12, padding: '12px 14px', color: C.crema, fontSize: 14, outline: 'none', fontFamily: "'DM Sans', sans-serif" }} type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
        </div>
        {error && <div style={{ padding: '10px 14px', borderRadius: 10, marginBottom: 14, fontSize: 13, background: error.includes('created') ? '#6a9e7822' : '#e07b5422', color: error.includes('created') ? '#6a9e78' : '#e07b54', border: `1px solid ${error.includes('created') ? '#6a9e7844' : '#e07b5444'}` }}>{error}</div>}
        <button onClick={handleSubmit} disabled={loading} style={{ width: '100%', background: C.cremaMid, color: '#FAF6F0', border: 'none', borderRadius: 12, padding: '14px', fontWeight: 700, fontSize: 15, cursor: loading ? 'default' : 'pointer', opacity: loading ? 0.7 : 1, fontFamily: "'DM Sans', sans-serif", transition: 'all 0.2s' }}>
          {loading ? 'Just a moment…' : mode === 'login' ? 'Log In' : 'Create Account'}
        </button>
        <button onClick={onClose} style={{ width: '100%', marginTop: 10, background: 'none', border: 'none', color: C.text3, fontSize: 13, cursor: 'pointer', padding: '8px', fontFamily: "'DM Sans', sans-serif" }}>Maybe later</button>
      </div>
    </div>
  )
}

// ─── Main Landing Page ────────────────────────
export default function LandingPage() {
  const router  = useRouter()
  const [showAuth, setShowAuth]   = useState(false)
  const [authMode, setAuthMode]   = useState('signup')
  const [checkingAuth, setCheckingAuth] = useState(true)

  // If already logged in, go straight to the app
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.replace('/app')
      else setCheckingAuth(false)
    })
  }, [])

  const handleAuthSuccess = () => router.push('/app')
  const openSignUp  = () => { setAuthMode('signup');  setShowAuth(true) }
  const openSignIn  = () => { setAuthMode('login');   setShowAuth(true) }
  const goToApp     = () => router.push('/app')

  if (checkingAuth) return (
    <div style={{ height: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 32, height: 32, border: `3px solid ${C.border}`, borderTopColor: C.cremaMid, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    </div>
  )

  const CAFES = [
    { name: 'Fuego Coffee Roasters', neighborhood: 'Village Gate', tags: ['Pour Over', 'Roastery'], ambiance: 5, taste: 4, value: 4, image: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=400&q=80' },
    { name: 'Glen Edith Coffee',     neighborhood: 'South Wedge',  tags: ['Single Origin', 'Cozy'], ambiance: 4, taste: 5, value: 3, image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&q=80' },
    { name: 'Joe Bean Coffee',       neighborhood: 'Downtown',     tags: ['Espresso Bar', 'Work-Friendly'], ambiance: 4, taste: 5, value: 4, image: 'https://images.unsplash.com/photo-1511920170033-f8396924c348?w=400&q=80' },
    { name: 'Equal Grounds',         neighborhood: 'South Wedge',  tags: ['Community', 'Vegan'], ambiance: 5, taste: 4, value: 5, image: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=400&q=80' },
  ]

  return (
    <div style={{ background: C.bg, minHeight: '100vh', overflowX: 'hidden' }}>

      {/* ── NAV ── */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, background: 'rgba(237,232,220,0.92)', backdropFilter: 'blur(12px)', borderBottom: `1px solid ${C.border}`, height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 21, fontWeight: 700, fontStyle: 'italic', color: C.crema, letterSpacing: '0.5px' }}>Café Café</span>
          <div style={{ width: 6, height: 6, borderRadius: 3, background: C.cremaMid }} />
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button onClick={openSignIn} style={{ background: 'none', border: `1px solid ${C.border}`, borderRadius: 10, padding: '8px 18px', color: C.text2, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", transition: 'all 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.borderColor = C.cremaMid}
            onMouseLeave={e => e.currentTarget.style.borderColor = C.border}>
            Log In
          </button>
          <button onClick={openSignUp} style={{ background: C.cremaMid, border: 'none', borderRadius: 10, padding: '8px 18px', color: C.bg, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", transition: 'background 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.background = C.cremaDark}
            onMouseLeave={e => e.currentTarget.style.background = C.cremaMid}>
            Sign Up Free
          </button>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '120px 24px 80px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        {/* Background glow */}
        <div style={{ position: 'absolute', top: '20%', left: '50%', transform: 'translateX(-50%)', width: 600, height: 600, borderRadius: '50%', background: C.cremaMid, opacity: 0.12, filter: 'blur(80px)', pointerEvents: 'none' }} />

        <div style={{ maxWidth: 720, position: 'relative' }}>
          {/* Eyebrow */}
          <div className="animate-fadeUp" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: C.cremaMid + '18', border: `1px solid ${C.cremaMid}44`, borderRadius: 20, padding: '6px 16px', marginBottom: 28 }}>
            <span style={{ fontSize: 14 }}>☕</span>
            <span style={{ fontSize: 12, color: C.cremaMid, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase' }}>Now live in Rochester, NY</span>
          </div>

          {/* Headline */}
          <h1 className="animate-fadeUp delay-100 hero-headline" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 'clamp(38px, 7vw, 80px)', fontWeight: 700, color: C.crema, lineHeight: 1.08, letterSpacing: '-1.5px', marginBottom: 24 }}>
            Your city's coffee,<br />
            <span style={{ color: C.cremaMid, fontStyle: 'italic' }}>finally mapped.</span>
          </h1>

          {/* Subheadline */}
          <p className="animate-fadeUp delay-200" style={{ fontSize: 'clamp(15px, 2vw, 18px)', color: C.text2, lineHeight: 1.72, marginBottom: 40, maxWidth: 560, margin: '0 auto 40px' }}>
            Discover independent cafés near you. Rate the vibe, the coffee, and the value. See where your friends have been. Build your personal coffee map.
          </p>

          {/* CTAs */}
          <div className="animate-fadeUp delay-300" style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 48 }}>
            <button onClick={openSignUp} style={{ background: C.cremaMid, color: '#FAF6F0', border: 'none', borderRadius: 14, padding: '16px 36px', fontSize: 16, fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", transition: 'all 0.2s', boxShadow: `0 8px 32px ${C.cremaMid}44` }}
              onMouseEnter={e => { e.currentTarget.style.background = C.cremaDark; e.currentTarget.style.transform = 'translateY(-2px)' }}
              onMouseLeave={e => { e.currentTarget.style.background = C.cremaMid; e.currentTarget.style.transform = 'translateY(0)' }}>
              Start Mapping Free →
            </button>
            <button onClick={goToApp} style={{ background: 'none', color: C.text2, border: `1px solid ${C.border}`, borderRadius: 14, padding: '16px 28px', fontSize: 16, fontWeight: 500, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", transition: 'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = C.cremaMid; e.currentTarget.style.color = C.crema }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.text2 }}>
              Explore the map
            </button>
          </div>

          {/* Social proof */}
          <div className="animate-fadeUp delay-400" style={{ display: 'flex', gap: 32, justifyContent: 'center', flexWrap: 'wrap' }}>
            {[
              { value: 12, suffix: '+', label: 'Cafés mapped' },
              { value: 100, suffix: '%', label: 'Independent only' },
              { value: 3, suffix: ' scores', label: 'Per café' },
            ].map(stat => (
              <div key={stat.label} style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 30, fontWeight: 700, color: C.crema, letterSpacing: '-0.4px', lineHeight: 1 }}>
                  <Counter target={stat.value} suffix={stat.suffix} />
                </div>
                <div style={{ fontSize: 11, color: C.text3, marginTop: 4, letterSpacing: '0.2px', fontWeight: 500 }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CAFÉ PREVIEW STRIP ── */}
      <section style={{ padding: '0 0 80px', overflow: 'hidden' }}>
        <div style={{ textAlign: 'center', marginBottom: 32, padding: '0 24px' }}>
          <p style={{ fontSize: 11, color: C.cremaMid, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 8 }}>Featured in Rochester</p>
          <h2 className="animate-fadeUp" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 36, fontWeight: 700, color: C.crema }}>Spots worth your morning</h2>
        </div>
        <div style={{ display: 'flex', gap: 16, padding: '0 32px', overflowX: 'auto', scrollbarWidth: 'none' }}>
          {CAFES.map((cafe, i) => (
            <CafeCard key={cafe.name} {...cafe} delay={`${i * 0.08}s`} />
          ))}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section style={{ padding: '80px 32px', maxWidth: 1000, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <p style={{ fontSize: 11, color: C.cremaMid, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 8 }}>What you get</p>
          <h2 className="animate-fadeUp" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 36, fontWeight: 700, color: C.crema, letterSpacing: '-0.4px' }}>Everything a coffee explorer needs</h2>
        </div>
        <div className="features-grid" style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <FeatureCard icon="🗺️" title="Interactive Map" desc="Every café in Rochester pinned on a live map. See what you've visited, what's near you, and what your friends recommend." delay="0s" />
          <FeatureCard icon="⭐" title="Three-Score Rating" desc="Rate every visit on Ambiance, Taste, and Value — the three things that actually tell you if a place is worth it." delay="0.1s" />
          <FeatureCard icon="📍" title="Nearby Discovery" desc="Enable location and instantly see which cafés are a 5-minute walk away, sorted by distance with estimated walk times." delay="0.2s" />
          <FeatureCard icon="👥" title="Friends & Profiles" desc="Add friends, see where they've been, and let their ratings guide your next choice. Coffee is better shared." delay="0.3s" />
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section style={{ padding: '80px 32px', background: C.surface, borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <p style={{ fontSize: 11, color: C.cremaMid, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 8 }}>How it works</p>
            <h2 className="animate-fadeUp" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 36, fontWeight: 700, color: C.crema, letterSpacing: '-0.4px' }}>Three steps to a better cup</h2>
          </div>
          <StepCard number="1" title="Find a café" desc="Browse the map or search by name, neighbourhood, or tag. Use the Nearby tab to find what's walkable from where you are right now." delay="0s" />
          <StepCard number="2" title="Visit and rate" desc="Order your coffee. Soak in the vibe. Then log your visit with star ratings for Ambiance, Taste, and Value — takes 20 seconds." delay="0.1s" />
          <StepCard number="3" title="Build your map" desc="Every logged visit adds a pin to your personal coffee map. Watch it fill up. Share it with friends. Let it guide your next morning." delay="0.2s" />
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section style={{ padding: '100px 24px', textAlign: 'center' }}>
        <div style={{ maxWidth: 560, margin: '0 auto' }}>
          <div style={{ fontSize: 52, marginBottom: 20 }}>☕</div>
          <h2 className="animate-fadeUp" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 'clamp(34px, 5vw, 52px)', fontWeight: 700, color: C.crema, marginBottom: 16, lineHeight: 1.1, letterSpacing: '-0.5px' }}>
            Your next favourite café is already out there.
          </h2>
          <p className="animate-fadeUp delay-100" style={{ fontSize: 16, color: C.text2, lineHeight: 1.7, marginBottom: 36 }}>
            Join Café Café and start discovering Rochester's best independent coffee — one visit at a time.
          </p>
          <button className="animate-fadeUp delay-200" onClick={openSignUp} style={{ background: C.cremaMid, color: '#FAF6F0', border: 'none', borderRadius: 14, padding: '18px 44px', fontSize: 17, fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", transition: 'all 0.2s', boxShadow: `0 8px 40px ${C.cremaMid}44` }}
            onMouseEnter={e => { e.currentTarget.style.background = C.cremaDark; e.currentTarget.style.transform = 'translateY(-2px)' }}
            onMouseLeave={e => { e.currentTarget.style.background = C.cremaMid; e.currentTarget.style.transform = 'translateY(0)' }}>
            Create a Free Account →
          </button>
          <p className="animate-fadeUp delay-300" style={{ fontSize: 12, color: C.text3, marginTop: 16 }}>Free forever. No credit card required.</p>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ borderTop: `1px solid ${C.border}`, padding: '28px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18, fontWeight: 700, fontStyle: 'italic', color: C.crema, letterSpacing: '0.5px' }}>Café Café</span>
          <div style={{ width: 5, height: 5, borderRadius: 3, background: C.cremaMid }} />
        </div>
        <p style={{ fontSize: 12, color: C.text3 }}>Built for Rochester coffee lovers. ☕</p>
        <button onClick={goToApp} style={{ background: 'none', border: 'none', color: C.text3, fontSize: 12, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
          Explore the map →
        </button>
      </footer>

      {/* Auth modal */}
      {showAuth && <AuthModal mode={authMode} onClose={() => setShowAuth(false)} onSuccess={handleAuthSuccess} />}
    </div>
  )
}
