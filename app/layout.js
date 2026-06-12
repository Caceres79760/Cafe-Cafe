import './globals.css'

export const metadata = {
  title: 'Café Café — Discover Rochester Coffee',
  description: 'Find, rate, and map independent coffee shops in Rochester, NY. See where your friends have been.',
  keywords: ['coffee', 'Rochester', 'cafes', 'coffee shops', 'ratings', 'map'],
  authors: [{ name: 'Café Café' }],
  themeColor: '#EDE8DC',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    apple: [
      { url: '/apple-touch-icon.svg', type: 'image/svg+xml' },
    ],
  },
  openGraph: {
    title: 'Café Café — Discover Rochester Coffee',
    description: "Rochester's coffee map. Find, rate, and share independent cafés.",
    type: 'website',
    locale: 'en_US',
    siteName: 'Café Café',
  },
  twitter: {
    card: 'summary',
    title: 'Café Café',
    description: "Rochester's coffee map.",
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400;1,700&family=DM+Sans:wght@300;400;500;600&display=swap"
          rel="stylesheet"
        />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.svg" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#EDE8DC" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Café Café" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </head>
      <body style={{ fontFamily: "'DM Sans', sans-serif" }}>{children}</body>
    </html>
  )
}
