'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'

// Same warm parchment palette used across the rest of the site
const C = {
  bg:        '#EDE8DC',
  surface:   '#E4DDD0',
  steam:     '#CEC5B4',
  border:    '#BDB5A4',
  crema:     '#2C2416',
  cremaMid:  '#7C5C35',
  cremaDark: '#5C4025',
  text2:     '#5A4E3C',
  text3:     '#8A7D6A',
  success:   '#4A7A58',
  error:     '#B85A3A',
}

export default function ContactPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [subject, setSubject] = useState('')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [status, setStatus] = useState(null) // null | 'success' | 'error'
  const [errorMsg, setErrorMsg] = useState('')

  const isValid = email.trim().length > 3 && email.includes('@') && subject.trim().length > 0 && description.trim().length > 0

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!isValid || submitting) return

    setSubmitting(true)
    setErrorMsg('')

    const { error } = await supabase.from('contact_messages').insert({
      email: email.trim(),
      subject: subject.trim(),
      description: description.trim(),
    })

    setSubmitting(false)

    if (error) {
      setStatus('error')
      setErrorMsg('Something went wrong sending your message. Please try again in a moment.')
      return
    }

    setStatus('success')
  }

  // ── Success state ──
  if (status === 'success') {
    return (
      <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ maxWidth: 480, textAlign: 'center' }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%', background: C.cremaMid,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 24px',
          }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
              <path d="M5 13l4 4L19 7" stroke="#FAF6F0" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 32, fontWeight: 700, color: C.crema, marginBottom: 12, letterSpacing: '-0.3px' }}>
            Message sent.
          </h1>
          <p style={{ fontSize: 15, color: C.text2, lineHeight: 1.65, marginBottom: 32 }}>
            Thanks for reaching out — we'll get back to you at <strong>{email}</strong> as soon as we can.
          </p>
          <button onClick={() => router.push('/')} style={{
            background: C.cremaMid, color: '#FAF6F0', border: 'none',
            borderRadius: 12, padding: '13px 28px', fontSize: 15, fontWeight: 700,
            cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
          }}>
            ← Back to homepage
          </button>
        </div>
      </div>
    )
  }

  // ── Form state ──
  return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', flexDirection: 'column' }}>

      {/* Simple top bar with wordmark, matches landing page nav style */}
      <nav style={{ padding: '20px 32px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
          <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 21, fontWeight: 700, fontStyle: 'italic', color: C.crema, letterSpacing: '0.5px' }}>Café Café</span>
          <div style={{ width: 5, height: 5, borderRadius: 3, background: C.cremaMid }} />
        </a>
      </nav>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 24px 64px' }}>
        <div style={{ maxWidth: 520, width: '100%' }}>

          <p style={{ fontSize: 11, color: C.cremaMid, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 10, textAlign: 'center' }}>
            Get in touch
          </p>
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 'clamp(32px, 5vw, 42px)', fontWeight: 700, color: C.crema, textAlign: 'center', lineHeight: 1.15, letterSpacing: '-0.4px', marginBottom: 12 }}>
            Contact Us
          </h1>
          <p style={{ fontSize: 15, color: C.text2, textAlign: 'center', lineHeight: 1.65, marginBottom: 36 }}>
            Found a bug, have a café to suggest, or just want to say hello?<br/>We'd love to hear from you.
          </p>

          <form onSubmit={handleSubmit} style={{
            background: C.surface, border: `1px solid ${C.border}`,
            borderRadius: 20, padding: '32px 28px',
          }}>

            {/* Email */}
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.text2, marginBottom: 6 }}>
              Your email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              style={{
                width: '100%', background: C.bg, border: `1.5px solid ${C.border}`,
                borderRadius: 12, padding: '12px 14px', color: C.crema, fontSize: 14,
                outline: 'none', fontFamily: "'DM Sans', sans-serif", marginBottom: 18,
                boxSizing: 'border-box',
              }}
            />

            {/* Subject */}
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.text2, marginBottom: 6 }}>
              Subject
            </label>
            <input
              type="text"
              value={subject}
              onChange={e => setSubject(e.target.value)}
              placeholder="What's this about?"
              required
              style={{
                width: '100%', background: C.bg, border: `1.5px solid ${C.border}`,
                borderRadius: 12, padding: '12px 14px', color: C.crema, fontSize: 14,
                outline: 'none', fontFamily: "'DM Sans', sans-serif", marginBottom: 18,
                boxSizing: 'border-box',
              }}
            />

            {/* Description */}
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.text2, marginBottom: 6 }}>
              Message
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Tell us what's on your mind..."
              required
              rows={5}
              style={{
                width: '100%', background: C.bg, border: `1.5px solid ${C.border}`,
                borderRadius: 12, padding: '12px 14px', color: C.crema, fontSize: 14,
                outline: 'none', fontFamily: "'DM Sans', sans-serif", marginBottom: 8,
                boxSizing: 'border-box', resize: 'vertical', lineHeight: 1.5,
              }}
            />
            <p style={{ fontSize: 11, color: C.text3, textAlign: 'right', marginBottom: 20 }}>
              {description.length} characters
            </p>

            {status === 'error' && (
              <div style={{
                background: '#B85A3A18', border: '1px solid #B85A3A44',
                borderRadius: 10, padding: '10px 14px', marginBottom: 18,
              }}>
                <p style={{ fontSize: 13, color: C.error, margin: 0 }}>{errorMsg}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={!isValid || submitting}
              style={{
                width: '100%', background: isValid ? C.cremaMid : C.steam,
                color: isValid ? '#FAF6F0' : C.text3,
                border: 'none', borderRadius: 12, padding: '14px',
                fontSize: 15, fontWeight: 700,
                cursor: isValid && !submitting ? 'pointer' : 'not-allowed',
                fontFamily: "'DM Sans', sans-serif",
                transition: 'background 0.2s',
              }}
            >
              {submitting ? 'Sending…' : 'Send Message'}
            </button>
          </form>

          <p style={{ fontSize: 12, color: C.text3, textAlign: 'center', marginTop: 24 }}>
            <a href="/" style={{ color: C.text3, textDecoration: 'none' }}>← Back to homepage</a>
          </p>
        </div>
      </div>
    </div>
  )
}
