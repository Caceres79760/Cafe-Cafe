'use client'

import { useEffect, useRef } from 'react'

function markerSVG(visited) {
  const fill = visited ? '#e8d5b5' : '#ff6b35'
  const stroke = visited ? '#c8965a' : '#cc4a1a'
  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="36" height="44" viewBox="0 0 36 44">
      <ellipse cx="18" cy="41" rx="7" ry="3" fill="rgba(0,0,0,0.25)"/>
      <path d="M18 0 C8 0 0 8 0 18 C0 30 18 44 18 44 C18 44 36 30 36 18 C36 8 28 0 18 0Z"
        fill="${fill}" stroke="${stroke}" stroke-width="1.5"/>
      <text x="18" y="22" text-anchor="middle" font-size="13"
        dominant-baseline="middle" font-family="system-ui">☕</text>
    </svg>`
}

export default function MapView({ shops, selected, onSelect }) {
  const mapRef      = useRef(null)
  const instanceRef = useRef(null)
  const markersRef  = useRef({})

  useEffect(() => {
    if (instanceRef.current || !shops.length) return

    import('leaflet').then(L => {
      const map = L.map(mapRef.current, {
        center: [43.1566, -77.6088],
        zoom: 14,
        zoomControl: true,
      })

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
      }).addTo(map)

      instanceRef.current = map

      shops.forEach(shop => {
        const icon = L.divIcon({
          html: markerSVG(shop.visited),
          className: '',
          iconSize:   [36, 44],
          iconAnchor: [18, 44],
        })
        const marker = L.marker([shop.lat, shop.lng], { icon }).addTo(map)
        marker.on('click', () => onSelect(shop))
        markersRef.current[shop.id] = marker
      })
    })

    return () => {
      if (instanceRef.current) {
        instanceRef.current.remove()
        instanceRef.current = null
        markersRef.current  = {}
      }
    }
  }, [shops])

  // Pan to selected shop
  useEffect(() => {
    if (!instanceRef.current || !selected) return
    instanceRef.current.flyTo(
      [selected.lat - 0.004, selected.lng],
      15, { duration: 0.8 }
    )
  }, [selected])

  return (
    <div ref={mapRef} style={{ width: '100%', height: '100%', background: '#0f0c09' }} />
  )
}
