// lib/supabase.js
// Single shared Supabase client used across the entire app.

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL  = 'https://frishcvtspxgjwsnrijw.supabase.co'
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZyaXNoY3Z0c3B4Z2p3c25yaWp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA4MzgwMDksImV4cCI6MjA5NjQxNDAwOX0.2TpRY6fcGAUnxTy568AC--e1iJozlmCW1-FXAd1WSyw'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON)
