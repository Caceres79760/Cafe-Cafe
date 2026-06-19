'use client'

import { useEffect, useRef } from 'react'

// ─── Custom marker SVG generator ─────────────
// Produces a branded coffee-cup pin in the
// parchment palette. Two visual states:
//   visited   → filled warm brown cup, solid drop shadow
//   unvisited → outlined cup, lighter fill
//   selected  → larger, glowing ring around it
function markerSVG(visited, selected) {
  const size     = selected ? 54 : 42
  const cupColor = visited  ? '#7C5C35' : '#A0856A'
  const bgColor  = visited  ? '#EDE8DC' : '#F5F0E8'
  const rimColor = visited  ? '#5C4025' : '#8A7060'
  const steamOp  = visited  ? '0.7'     : '0.4'
  const ring     = selected
    ? `<circle cx="${size/2}" cy="${size/2 - 2}" r="${size/2 - 1}"
        fill="none" stroke="${cupColor}" stroke-width="2.5" opacity="0.35"/>`
    : ''
  const shadow   = selected
    ? `filter="drop-shadow(0 4px 8px rgba(124,92,53,0.45))"`
    : `filter="drop-shadow(0 2px 4px rgba(0,0,0,0.18))"`

  // Scale all geometry relative to size
  const s = size / 42  // scale factor

  return `
<svg xmlns="http://www.w3.org/2000/svg"
  width="${size}" height="${size + 10}"
  viewBox="0 0 ${size} ${size + 10}">

  ${ring}

  <g ${shadow}>
    <!-- Pin teardrop body -->
    <path d="
      M${size/2} ${size + 8}
      C${size/2} ${size + 8} ${3 * s} ${size * 0.72}
        ${3 * s} ${size * 0.44}
      A${size/2 - 3*s} ${size/2 - 3*s} 0 1 1 ${size - 3*s} ${size * 0.44}
      C${size - 3*s} ${size * 0.72} ${size/2} ${size + 8} ${size/2} ${size + 8}Z"
      fill="${bgColor}" stroke="${cupColor}" stroke-width="${selected ? 2 : 1.5}"/>

    <!-- Cup body -->
    <path d="M${13*s} ${18*s} h${16*s} l${-2*s} ${10*s} h${-12*s}Z"
      fill="${cupColor}" rx="1"/>

    <!-- Cup rim -->
    <rect x="${12*s}" y="${16*s}" width="${18*s}" height="${3*s}" rx="${1.5*s}"
      fill="${rimColor}"/>

    <!-- Saucer -->
    <ellipse cx="${size/2}" cy="${29*s}" rx="${9*s}" ry="${2*s}"
      fill="${rimColor}" opacity="0.7"/>

    <!-- Handle -->
    <path d="M${29*s} ${19*s} Q${34*s} ${19*s} ${34*s} ${23*s} Q${34*s} ${27*s} ${29*s} ${27*s}"
      stroke="${rimColor}" stroke-width="${2*s}" fill="none" stroke-linecap="round"/>

    <!-- Steam line 1 -->
    <path d="M${17*s} ${13*s} Q${18.5*s} ${10*s} ${17*s} ${7*s}"
      stroke="${cupColor}" stroke-width="${1.2*s}" stroke-linecap="round"
      fill="none" opacity="${steamOp}"/>

    <!-- Steam line 2 -->
    <path d="M${21*s} ${11*s} Q${22.5*s} ${8*s} ${21*s} ${5*s}"
      stroke="${cupColor}" stroke-width="${1.2*s}" stroke-linecap="round"
      fill="none" opacity="${steamOp}"/>

    <!-- Steam line 3 -->
    <path d="M${25*s} ${13*s} Q${26.5*s} ${10*s} ${25*s} ${7*s}"
      stroke="${cupColor}" stroke-width="${1.2*s}" stroke-linecap="round"
      fill="none" opacity="${steamOp}"/>
  </g>
</svg>`
}

// ─── Inject hover CSS once ────────────────────
// A real CSS class + transition, instead of calling the
// Web Animations API directly on the marker's DOM node.
// CSS transitions are driven by the browser's style engine
// and always settle back to the element's base style on
// mouseleave — they can't get caught mid-animation and leave
// the marker stuck in a half-transformed state, which is what
// was making markers appear to "vanish" on hover before.
let hoverStyleInjected = false
function injectHoverStyle() {
  if (hoverStyleInjected || typeof document === 'undefined') return
  const style = document.createElement('style')
  style.textContent = `
    .cafe-marker-icon {
      transition: transform 0.22s ease-out;
      transform: translateY(0);
    }
    .cafe-marker-icon:hover {
      transform: translateY(-5px);
    }
    .cafe-marker-icon.is-selected {
      transition: transform 0.32s cubic-bezier(.34,1.56,.64,1);
    }
  `
  document.head.appendChild(style)
  hoverStyleInjected = true
}

export default function MapView({ shops, selected, onSelect }) {
  const mapRef       = useRef(null)
  const instanceRef  = useRef(null)
  const markersRef   = useRef({})    // shop.id → Leaflet marker
  const shopsRef      = useRef(shops) // always-current shop list, avoids stale closures
  const onSelectRef   = useRef(onSelect)
  const prevSelected  = useRef(null)

  // Keep refs fresh every render without re-running the init effect below
  useEffect(() => { shopsRef.current = shops }, [shops])
  useEffect(() => { onSelectRef.current = onSelect }, [onSelect])

  // ── Initialise map (runs once shops first arrive) ──
  useEffect(() => {
    injectHoverStyle()

    if (instanceRef.current || !shops.length) return

    let cancelled = false

    import('leaflet').then(L => {
      if (cancelled) return

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
        const isSelected = selected?.id === shop.id
        const size = isSelected ? 54 : 42

        const icon = L.divIcon({
          html: `<div class="cafe-marker-icon${isSelected ? ' is-selected' : ''}" data-visited="${shop.visited}">${markerSVG(shop.visited, isSelected)}</div>`,
          className: '', // keep Leaflet's wrapper unstyled; our inner div carries the hover class
          iconSize:   [size, size + 10],
          iconAnchor: [size / 2, size + 10],
        })

        const marker = L.marker([shop.lat, shop.lng], { icon }).addTo(map)

        // Stable click handler — looks up the *current* shop by id
        // from shopsRef instead of closing over the `shop` variable
        // captured when the marker was first created. This is what
        // was causing clicks to silently no-op after shop data
        // refreshed (e.g. `visited` flipping true right after logging
        // a visit): the old handler kept pointing at a stale shop
        // object that no longer matched what was rendered on screen.
        marker.on('click', () => {
          const current = shopsRef.current.find(s => s.id === shop.id) || shop
          onSelectRef.current(current)
        })

        markersRef.current[shop.id] = marker
      })
    })

    return () => {
      cancelled = true
      if (instanceRef.current) {
        instanceRef.current.remove()
        instanceRef.current = null
        markersRef.current  = {}
        prevSelected.current = null
      }
    }
    // Only re-run when shops first populate (empty → non-empty).
    // In-place data changes (visited flips, etc.) are patched onto
    // existing markers below instead of tearing the whole map down.
  }, [shops.length > 0])

  // ── Patch marker visuals when shop data changes in place ──
  // e.g. `visited` flips true right after logging a visit.
  // Updates the icon without rebuilding the map or losing the
  // click handler bound above.
  useEffect(() => {
    if (!instanceRef.current) return
    shops.forEach(shop => {
      const marker = markersRef.current[shop.id]
      if (!marker) return
      const el = marker.getElement()
      const host = el?.querySelector('.cafe-marker-icon')
      if (host && host.dataset.visited !== String(shop.visited)) {
        const isSelected = selected?.id === shop.id
        host.innerHTML = markerSVG(shop.visited, isSelected)
        host.dataset.visited = String(shop.visited)
      }
    })
  }, [shops])

  // ── Update markers when selection changes ─────────
  // Swaps the icon on just the two affected markers
  // (deselected → normal, newly selected → large) without
  // re-rendering the whole map or re-creating click handlers.
  useEffect(() => {
    if (!instanceRef.current) return

    import('leaflet').then(L => {
      const prev = prevSelected.current

      // Restore previous marker to normal size
      if (prev && markersRef.current[prev.id]) {
        const size = 42
        markersRef.current[prev.id].setIcon(L.divIcon({
          html: `<div class="cafe-marker-icon" data-visited="${prev.visited}">${markerSVG(prev.visited, false)}</div>`,
          className: '',
          iconSize:   [size, size + 10],
          iconAnchor: [size / 2, size + 10],
        }))
      }

      // Enlarge newly selected marker
      if (selected && markersRef.current[selected.id]) {
        const size = 54
        markersRef.current[selected.id].setIcon(L.divIcon({
          html: `<div class="cafe-marker-icon is-selected" data-visited="${selected.visited}">${markerSVG(selected.visited, true)}</div>`,
          className: '',
          iconSize:   [size, size + 10],
          iconAnchor: [size / 2, size + 10],
        }))
      }

      prevSelected.current = selected || null
    })
  }, [selected])

  // ── Pan map when selection changes ────────
  useEffect(() => {
    if (!instanceRef.current || !selected) return
    instanceRef.current.flyTo(
      [selected.lat - 0.004, selected.lng],
      15,
      { duration: 0.8, easeLinearity: 0.4 }
    )
  }, [selected])

  return (
    <div
      ref={mapRef}
      style={{ width: '100%', height: '100%', background: '#D9D1C2' }}
    />
  )
}
