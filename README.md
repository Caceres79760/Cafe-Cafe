# ☕ Café Café — v5 (with Supabase)

## What's new in this version
- Real database — visits are saved permanently to Supabase
- Auth — Sign Up / Log In with email and password
- Live scores — community ratings update in real time
- My Visits tab — see all your logged visits with dates and notes

## Deploy to Vercel
1. Replace all files in your GitHub repo with these files
2. Vercel will auto-deploy on push

## Run locally
```bash
npm install
npm run dev
```

## How it works
- Shops are loaded from your Supabase `shops` table
- When a user logs a visit it saves to the `visits` table
- Scores shown on the map are averaged from all visits
- Guest users can browse but must sign in to save visits
