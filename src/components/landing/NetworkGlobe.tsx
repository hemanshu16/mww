import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import earcut, { flatten as earcutFlatten } from 'earcut'
import { DEST, ORIGIN, SERVICES, type GlobeDestination } from '@/lib/landing/globeData'
import { WORLD_COUNTRIES, countryRings, findCountry } from '@/data/worldCountries'

const R = 1
const GLOBE_SCALE = 0.9
const BASE_FOV_DEG = 34
// The canvas is rendered 30% larger than its visible CSS box (kept in sync with
// the matching 130%/-15% sizing on .globe-stage canvas in landing.css) so a
// zoomed-in globe has room to spill past the box edge instead of being clipped
// by the canvas's own bounds. Widening the camera's FOV to match keeps the view
// within the original box pixel-identical to before — the extra canvas margin
// just reveals whatever would previously have been clipped there.
const GLOBE_OVERSCAN = 1.3
const OVERSCAN_FOV_DEG =
  (2 * Math.atan(Math.tan((BASE_FOV_DEG * Math.PI) / 180 / 2) * GLOBE_OVERSCAN) * 180) / Math.PI
// Layering above the R=1 sphere surface (innermost to outermost): the graticule
// sits closest, then the country fill, then normal borders, then the highlighted
// country's border — each nudged out just enough to avoid z-fighting.
const COUNTRY_FILL_R = R * 1.0015
const COUNTRY_BORDER_R = R * 1.002
const HIGHLIGHT_BORDER_R = R * 1.0035

function ll2v(lat: number, lng: number, r = R) {
  const phi = ((90 - lat) * Math.PI) / 180
  const theta = ((lng + 180) * Math.PI) / 180
  return new THREE.Vector3(
    -(r * Math.sin(phi) * Math.cos(theta)),
    r * Math.cos(phi),
    r * Math.sin(phi) * Math.sin(theta),
  )
}

function clamp(v: number, a: number, b: number) {
  return Math.max(a, Math.min(b, v))
}

function slerp(a: THREE.Vector3, b: THREE.Vector3, t: number) {
  const d = Math.max(-1, Math.min(1, a.dot(b)))
  const o = Math.acos(d)
  if (o < 1e-4) return a.clone()
  const s = Math.sin(o)
  return a
    .clone()
    .multiplyScalar(Math.sin((1 - t) * o) / s)
    .add(b.clone().multiplyScalar(Math.sin(t * o) / s))
}

function ease(t: number) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
}

interface NetworkGlobeProps {
  /** A country name from the Natural Earth dataset (see findCountry). Undefined clears the highlight. */
  selectedCountry?: string
}

/**
 * Self-contained interactive 3D globe (drag to rotate, click a destination marker).
 * Ported near-verbatim from the original vanilla Three.js scene since this is an
 * imperative WebGL animation loop with its own state machine — there's no benefit
 * to threading it through React state, only cost. React only owns mount/unmount.
 */
export function NetworkGlobe({ selectedCountry }: NetworkGlobeProps) {
  const stageRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const loadingRef = useRef<HTMLDivElement>(null)
  const hintRef = useRef<HTMLDivElement>(null)
  const tipRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const selectCountryRef = useRef<(name: string | undefined) => void>(() => {})

  // Runs on prop changes only — the scene itself is built once in the mount effect
  // below and mutated imperatively here, same as the rest of this component's state.
  useEffect(() => {
    selectCountryRef.current(selectedCountry)
  }, [selectedCountry])

  useEffect(() => {
    const stage = stageRef.current
    const canvas = canvasRef.current
    const loadingEl = loadingRef.current
    const hintEl = hintRef.current
    const tipEl = tipRef.current
    const panelEl = panelRef.current
    if (!stage || !canvas || !loadingEl || !hintEl || !tipEl || !panelEl) return

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    function webglOK() {
      try {
        const c = document.createElement('canvas')
        return !!(window.WebGLRenderingContext && (c.getContext('webgl') || c.getContext('experimental-webgl')))
      } catch {
        return false
      }
    }
    if (!webglOK()) {
      stage.classList.add('nowebgl')
      return
    }

    const disposers: Array<() => void> = []
    const isMobile = window.innerWidth <= 560

    function makeDotTexture() {
      const s = 64
      const cv = document.createElement('canvas')
      cv.width = cv.height = s
      const g = cv.getContext('2d')!
      const grd = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2)
      grd.addColorStop(0, 'rgba(255,255,255,1)')
      grd.addColorStop(0.55, 'rgba(255,255,255,.9)')
      grd.addColorStop(1, 'rgba(255,255,255,0)')
      g.fillStyle = grd
      g.beginPath()
      g.arc(s / 2, s / 2, s / 2, 0, Math.PI * 2)
      g.fill()
      return new THREE.CanvasTexture(cv)
    }
    const DOTTEX = makeDotTexture()

    function makePlaneTexture() {
      const s = 96
      const cv = document.createElement('canvas')
      cv.width = cv.height = s
      const g = cv.getContext('2d')!
      const cx = s / 2
      const cy = s / 2
      g.save()
      g.translate(cx, cy)
      g.fillStyle = '#fff'
      g.shadowColor = 'rgba(240,169,59,.9)'
      g.shadowBlur = 10
      g.beginPath()
      g.moveTo(40, 0)
      g.lineTo(12, -8)
      g.lineTo(-8, -30)
      g.lineTo(-15, -30)
      g.lineTo(-6, -6)
      g.lineTo(-34, -6)
      g.lineTo(-40, -12)
      g.lineTo(-44, -12)
      g.lineTo(-38, 0)
      g.lineTo(-44, 12)
      g.lineTo(-40, 12)
      g.lineTo(-34, 6)
      g.lineTo(-6, 6)
      g.lineTo(-15, 30)
      g.lineTo(-8, 30)
      g.lineTo(12, 8)
      g.closePath()
      g.fill()
      g.restore()
      return new THREE.CanvasTexture(cv)
    }
    const PLANETEX = makePlaneTexture()

    function makeDestLabel(name: string, sub: string, isOrigin: boolean) {
      const pad = 14
      const fsMain = 34
      const fsSub = 21
      const cv = document.createElement('canvas')
      let g = cv.getContext('2d')!
      g.font = `700 ${fsMain}px "Space Grotesk", sans-serif`
      const w1 = g.measureText(name).width
      g.font = `500 ${fsSub}px "Inter", sans-serif`
      const w2 = g.measureText(sub).width
      const w = Math.max(w1, w2) + pad * 2
      const h = fsMain + fsSub + pad * 1.7
      cv.width = w
      cv.height = h
      g = cv.getContext('2d')!
      g.textBaseline = 'top'
      g.shadowColor = 'rgba(0,0,0,.5)'
      g.shadowBlur = 5
      g.font = `700 ${fsMain}px "Space Grotesk", sans-serif`
      g.fillStyle = isOrigin ? '#F0A93B' : '#EAF0FF'
      g.fillText(name, pad, 2)
      g.font = `500 ${fsSub}px "Inter", sans-serif`
      g.fillStyle = isOrigin ? 'rgba(240,169,59,.85)' : 'rgba(174,204,255,.88)'
      g.fillText(sub, pad, fsMain + 6)
      const tex = new THREE.CanvasTexture(cv)
      tex.anisotropy = 2
      const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false, depthWrite: false, opacity: 0.92 })
      const sp = new THREE.Sprite(mat)
      const scale = isOrigin ? 0.115 : 0.1
      sp.scale.set((scale * cv.width) / cv.height, scale, 1)
      sp.renderOrder = 9
      return sp
    }

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(OVERSCAN_FOV_DEG, 1, 0.1, 100)
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2))

    let W = 1
    let H = 1
    const baseDist = 3.7
    function resize() {
      // Render at GLOBE_OVERSCAN× the stage's own box size — matches the canvas's
      // enlarged CSS box (landing.css) so the wider FOV lines up pixel-for-pixel.
      W = (stage!.clientWidth || 1) * GLOBE_OVERSCAN
      H = (stage!.clientHeight || 1) * GLOBE_OVERSCAN
      renderer.setSize(W, H, false)
      camera.aspect = W / H
      camera.updateProjectionMatrix()
    }
    resize()

    const globe = new THREE.Group()
    scene.add(globe)

    const inner = new THREE.Mesh(new THREE.SphereGeometry(R * 0.992, 48, 48), new THREE.MeshBasicMaterial({ color: 0x0a1a3c }))
    globe.add(inner)

    function ring(val: number, type: 'lat' | 'lng', mat: THREE.LineBasicMaterial) {
      const pts: THREE.Vector3[] = []
      const seg = 96
      for (let i = 0; i <= seg; i++) {
        const t = (i / seg) * Math.PI * 2
        if (type === 'lat') {
          pts.push(ll2v(val, (t * 180) / Math.PI - 180, R * 1.001))
        } else {
          const lat = (t * 180) / Math.PI - 180
          pts.push(ll2v(Math.max(-89, Math.min(89, lat)), val, R * 1.001))
        }
      }
      return new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), mat)
    }
    const grat = new THREE.Group()
    const gmat = new THREE.LineBasicMaterial({ color: 0x3f63a8, transparent: true, opacity: 0.1 })
    for (let la = -60; la <= 60; la += 30) grat.add(ring(la, 'lat', gmat))
    for (let lo = 0; lo < 360; lo += 30) grat.add(ring(lo, 'lng', gmat))
    globe.add(grat)

    // ---- country geography (real Natural Earth boundaries, see src/data/worldCountries.ts) ----
    // Every country's rings are converted to 3D once and cached, so both the merged
    // "all borders" layer and the on-demand highlight layer reuse the same points
    // instead of re-running lat/lng trig per selection change.
    const countryPoints3D = new Map<string, THREE.Vector3[][]>()
    for (const country of WORLD_COUNTRIES) {
      const rings = countryRings(country).map((ring) =>
        // GeoJSON coordinates are [lng, lat] — ll2v takes (lat, lng), so this is a
        // deliberate swap, not a bug.
        ring.map(([lng, lat]) => ll2v(lat, lng, COUNTRY_BORDER_R)),
      )
      countryPoints3D.set(country.name, rings)
    }

    // One merged BufferGeometry/LineSegments for every country's borders — a single
    // draw call instead of one Line per ring (~286 rings), per the perf requirement.
    const borderPositions: number[] = []
    for (const rings of countryPoints3D.values()) {
      for (const ring of rings) {
        for (let i = 0; i < ring.length - 1; i++) {
          borderPositions.push(ring[i].x, ring[i].y, ring[i].z, ring[i + 1].x, ring[i + 1].y, ring[i + 1].z)
        }
      }
    }
    const borderGeom = new THREE.BufferGeometry()
    borderGeom.setAttribute('position', new THREE.Float32BufferAttribute(borderPositions, 3))
    const borderMat = new THREE.LineBasicMaterial({
      color: 0x7fa8e8,
      transparent: true,
      opacity: 0.32,
      depthWrite: false,
    })
    globe.add(new THREE.LineSegments(borderGeom, borderMat))

    // The highlighted country's border + spherical fill are rebuilt on demand
    // (see setSelectedCountry below) rather than kept for all ~180 countries, since
    // only one is ever selected at a time.
    const highlightGroup = new THREE.Group()
    globe.add(highlightGroup)
    let highlightDisposables: Array<THREE.BufferGeometry | THREE.Material> = []

    // One polygon (outer ring + optional holes) triangulated for the spherical fill.
    // earcut runs in 2D lng/lat space purely to decide *which* vertices form each
    // triangle — the vertex positions it's fed (and that end up in the mesh) are the
    // real 3D sphere points, so the fill still follows the globe's curvature rather
    // than being a flat map projection. Known limitation: a polygon that crosses the
    // antimeridian (e.g. the USA's Aleutian tail, Fiji) can triangulate incorrectly
    // in this 2D parameterization — its border is unaffected, since that's drawn
    // point-to-point directly on the sphere with no 2D step involved.
    function triangulatePolygon(rings: number[][][]) {
      const { vertices, holes, dimensions } = earcutFlatten(rings)
      const triangles = earcut(vertices, holes, dimensions)
      const positions: number[] = []
      for (let i = 0; i < vertices.length; i += 2) {
        const p = ll2v(vertices[i + 1], vertices[i], COUNTRY_FILL_R)
        positions.push(p.x, p.y, p.z)
      }
      return { positions, indices: triangles }
    }

    function buildCountryFillGeometry(country: { type: 'Polygon' | 'MultiPolygon'; coordinates: number[][][] | number[][][][] }) {
      const polygons: number[][][][] = country.type === 'Polygon' ? [country.coordinates as number[][][]] : (country.coordinates as number[][][][])
      const positions: number[] = []
      const indices: number[] = []
      let vertexOffset = 0
      for (const rings of polygons) {
        const { positions: p, indices: idx } = triangulatePolygon(rings)
        positions.push(...p)
        for (const i of idx) indices.push(i + vertexOffset)
        vertexOffset += p.length / 3
      }
      const geom = new THREE.BufferGeometry()
      geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
      geom.setIndex(indices)
      return geom
    }

    function setSelectedCountry(name: string | undefined) {
      highlightGroup.clear()
      highlightDisposables.forEach((d) => d.dispose())
      highlightDisposables = []
      if (!name) return
      const country = findCountry(name)
      const rings3D = countryPoints3D.get(country?.name ?? name)
      if (!country || !rings3D) return

      const borderPos: number[] = []
      for (const ring of rings3D) {
        for (let i = 0; i < ring.length - 1; i++) {
          const a = ring[i].clone().multiplyScalar(HIGHLIGHT_BORDER_R / COUNTRY_BORDER_R)
          const b = ring[i + 1].clone().multiplyScalar(HIGHLIGHT_BORDER_R / COUNTRY_BORDER_R)
          borderPos.push(a.x, a.y, a.z, b.x, b.y, b.z)
        }
      }
      const hBorderGeom = new THREE.BufferGeometry()
      hBorderGeom.setAttribute('position', new THREE.Float32BufferAttribute(borderPos, 3))
      const hBorderMat = new THREE.LineBasicMaterial({ color: 0xf0a93b, transparent: true, opacity: 0.95 })
      highlightGroup.add(new THREE.LineSegments(hBorderGeom, hBorderMat))
      highlightDisposables.push(hBorderGeom, hBorderMat)

      const fillGeom = buildCountryFillGeometry(country)
      const fillMat = new THREE.MeshBasicMaterial({
        color: 0xf0a93b,
        transparent: true,
        opacity: 0.16,
        side: THREE.DoubleSide,
        depthWrite: false,
      })
      highlightGroup.add(new THREE.Mesh(fillGeom, fillMat))
      highlightDisposables.push(fillGeom, fillMat)
    }
    selectCountryRef.current = setSelectedCountry

    const atmMat = new THREE.ShaderMaterial({
      transparent: true,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      depthWrite: false,
      uniforms: { c: { value: new THREE.Color(0x3e7be0) } },
      vertexShader:
        'varying vec3 vN; void main(){ vN=normalize(normalMatrix*normal); gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
      fragmentShader:
        'varying vec3 vN; uniform vec3 c; void main(){ float in_=pow(0.72-dot(vN,vec3(0.,0.,1.)),3.4); in_=clamp(in_,0.0,1.0); gl_FragColor=vec4(c,in_*0.45);}',
    })
    scene.add(new THREE.Mesh(new THREE.SphereGeometry(R * 1.07, 48, 48), atmMat))

    function buildRoute(a: { lat: number; lng: number }, b: GlobeDestination, i: number) {
      const va = ll2v(a.lat, a.lng, 1).normalize()
      const vb = ll2v(b.lat, b.lng, 1).normalize()
      const ang = va.angleTo(vb)
      const lift = 0.12 + ang * 0.14
      const seg = 64
      const pts: THREE.Vector3[] = []
      for (let s = 0; s <= seg; s++) {
        const t = s / seg
        const p = slerp(va, vb, t)
        const r = 1 + Math.sin(Math.PI * t) * lift
        pts.push(p.multiplyScalar(r))
      }
      const curve = new THREE.CatmullRomCurve3(pts)
      const cp = curve.getPoints(seg)
      const geom = new THREE.BufferGeometry().setFromPoints(cp)
      const colA = new THREE.Color(0x4e8cff)
      const colB = new THREE.Color(0xf0a93b)
      const cols: number[] = []
      for (let k = 0; k <= seg; k++) {
        const c = colA.clone().lerp(colB, k / seg)
        cols.push(c.r, c.g, c.b)
      }
      geom.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3))
      const mat = new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.0, depthWrite: false })
      const line = new THREE.Line(geom, mat) as unknown as THREE.Line & { userData: { total: number } }
      line.userData = { total: seg + 1 }
      geom.setDrawRange(0, 1)
      globe.add(line)
      routeLines.push(line)

      const tv = new THREE.Sprite(
        new THREE.SpriteMaterial({ map: PLANETEX, transparent: true, opacity: 0.95, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending }),
      ) as THREE.Sprite & { userData: { curve: THREE.CatmullRomCurve3; t: number; speed: number; delay: number } }
      tv.scale.setScalar(0.06)
      tv.renderOrder = 8
      tv.userData = { curve, t: Math.random(), speed: 0.0016 + Math.random() * 0.0012, delay: i * 0.05 }
      globe.add(tv)
      travelers.push(tv)
    }

    function marker(d: { lat: number; lng: number } & Partial<GlobeDestination>, isHub: boolean) {
      const col = isHub ? 0xf0a93b : 0x6ba4ff
      const m = new THREE.Mesh(new THREE.SphereGeometry(isHub ? 0.022 : 0.016, 16, 16), new THREE.MeshBasicMaterial({ color: col })) as unknown as THREE.Mesh & {
        userData: { d: typeof d; isHub: boolean; base: number }
      }
      m.position.copy(ll2v(d.lat, d.lng, R * 1.01))
      m.userData = { d, isHub, base: isHub ? 0.022 : 0.016 }
      if (!isHub) markerMeshes.push(m)
      const halo = new THREE.Sprite(
        new THREE.SpriteMaterial({ map: DOTTEX, color: col, transparent: true, opacity: isHub ? 0.6 : 0.55, depthWrite: false, blending: THREE.AdditiveBlending }),
      )
      halo.scale.setScalar(isHub ? 0.058 : 0.05)
      m.add(halo)
      return m
    }

    function pulseRing(d: { lat: number; lng: number }) {
      const g = new THREE.RingGeometry(0.024, 0.032, 32)
      const m = new THREE.MeshBasicMaterial({ color: 0xf0a93b, transparent: true, opacity: 0.5, side: THREE.DoubleSide, depthWrite: false })
      const mesh = new THREE.Mesh(g, m)
      const p = ll2v(d.lat, d.lng, R * 1.012)
      mesh.position.copy(p)
      mesh.lookAt(p.clone().multiplyScalar(2))
      return mesh
    }

    const markerMeshes: THREE.Mesh[] = []
    const travelers: (THREE.Sprite & { userData: { curve: THREE.CatmullRomCurve3; t: number; speed: number; delay: number } })[] = []
    const routeLines: (THREE.Line & { userData: { total: number } })[] = []
    const destLabels: THREE.Sprite[] = []

    DEST.forEach((d, i) => buildRoute(ORIGIN, d, i))
    DEST.forEach((d) => {
      globe.add(marker(d, false))
      const dl = makeDestLabel(d.name, d.country, false)
      const dp = ll2v(d.lat, d.lng, R * 1.02)
      dl.position.copy(dp).multiplyScalar(1.14)
      globe.add(dl)
      destLabels.push(dl)
    })
    const hub = marker(ORIGIN, true)
    globe.add(hub)
    const originRing = pulseRing(ORIGIN)
    globe.add(originRing)
    setSelectedCountry(selectedCountry)

    const o = ll2v(ORIGIN.lat, ORIGIN.lng, 1)
    const rot = { x: 0.28, y: -Math.atan2(o.x, o.z) }
    const tRot = { x: rot.x, y: rot.y }
    globe.scale.setScalar(reduce ? GLOBE_SCALE : GLOBE_SCALE * 0.9)
    camera.position.set(0, 0, baseDist)

    const raycaster = new THREE.Raycaster()
    const mouseNDC = new THREE.Vector2(-2, -2)

    // ---- controls ----
    let zoom = 1
    let tZoom = 1
    const ZMIN = 0.85
    const ZMAX = 2.0
    let dragging = false
    let moved = 0
    let last = { x: 0, y: 0 }
    let autoPaused = false
    let resumeAt = 0
    const pointers: Record<number, { x: number; y: number }> = {}
    let pinchStart = 0
    let pinchZoom = 1
    let interacted = false

    function markInteracted() {
      if (!interacted) {
        interacted = true
        hintEl!.classList.add('hide')
      }
    }

    function pinchDist() {
      const k = Object.keys(pointers)
      const a = pointers[+k[0]]
      const b = pointers[+k[1]]
      return Math.hypot(a.x - b.x, a.y - b.y)
    }

    function ndcFrom(e: PointerEvent) {
      const r = canvas!.getBoundingClientRect()
      mouseNDC.x = ((e.clientX - r.left) / r.width) * 2 - 1
      mouseNDC.y = -((e.clientY - r.top) / r.height) * 2 + 1
      return r
    }

    function frontVisible(mesh: THREE.Object3D) {
      const w = new THREE.Vector3()
      mesh.getWorldPosition(w)
      return w.z > 0.02
    }

    function hover(e: PointerEvent) {
      if (!ready) return
      const r = ndcFrom(e)
      raycaster.setFromCamera(mouseNDC, camera)
      const hit = raycaster.intersectObjects(markerMeshes, false).filter((h) => frontVisible(h.object))[0]
      markerMeshes.forEach((m) => m.scale.setScalar(THREE.MathUtils.lerp(m.scale.x, 1, 0.3)))
      if (hit) {
        const m = hit.object as THREE.Mesh & { userData: { d: GlobeDestination } }
        m.scale.setScalar(1.8)
        canvas!.style.cursor = 'pointer'
        const d = m.userData.d
        const w = new THREE.Vector3()
        m.getWorldPosition(w)
        w.project(camera)
        // tipEl is positioned relative to .globe-stage, but r is the canvas's own
        // rect — and the canvas is deliberately offset/larger than the stage (see
        // GLOBE_OVERSCAN), so the stage's own origin has to be subtracted back in.
        const stageRect = stage!.getBoundingClientRect()
        tipEl!.innerHTML = `<b>${d.name}</b><i>${d.region}</i>`
        tipEl!.style.left = `${r.left - stageRect.left + (w.x * 0.5 + 0.5) * r.width}px`
        tipEl!.style.top = `${r.top - stageRect.top + (-w.y * 0.5 + 0.5) * r.height}px`
        tipEl!.classList.add('show')
      } else {
        canvas!.style.cursor = dragging ? 'grabbing' : 'grab'
        tipEl!.classList.remove('show')
      }
    }

    function showPanel(d: GlobeDestination) {
      panelEl!.innerHTML =
        '<button class="gp-close" aria-label="Close">✕</button>' +
        `<div class="gp-region">${d.region}</div><h4>${d.name}</h4>` +
        `<div class="gp-row"><span>Service</span><span>${d.category}</span></div>` +
        `<div class="gp-row"><span>Modes</span><span>${SERVICES[d.category] || 'Air · Sea'}</span></div>` +
        '<div class="gp-row"><span>Origin</span><span>India hub</span></div>'
      panelEl!.classList.add('show')
    }
    function hidePanel() {
      panelEl!.classList.remove('show')
    }

    function pick(e: PointerEvent) {
      ndcFrom(e)
      raycaster.setFromCamera(mouseNDC, camera)
      const hit = raycaster.intersectObjects(markerMeshes, false).filter((h) => frontVisible(h.object))[0]
      if (hit) showPanel((hit.object as THREE.Mesh & { userData: { d: GlobeDestination } }).userData.d)
      else hidePanel()
    }

    function onDown(e: PointerEvent) {
      if (e.pointerType !== 'mouse' || e.button === 0) {
        pointers[e.pointerId] = { x: e.clientX, y: e.clientY }
        if (Object.keys(pointers).length === 1) {
          dragging = true
          moved = 0
          last = { x: e.clientX, y: e.clientY }
          canvas!.classList.add('grabbing')
          autoPaused = true
        } else if (Object.keys(pointers).length === 2) {
          dragging = false
          pinchStart = pinchDist()
          pinchZoom = tZoom
        }
      }
    }
    function onMove(e: PointerEvent) {
      if (pointers[e.pointerId]) pointers[e.pointerId] = { x: e.clientX, y: e.clientY }
      const keys = Object.keys(pointers)
      if (keys.length === 2) {
        e.preventDefault?.()
        const d = pinchDist()
        if (pinchStart > 0) tZoom = clamp(pinchZoom * (d / pinchStart), ZMIN, ZMAX)
        markInteracted()
        autoPaused = true
        return
      }
      if (dragging) {
        const dx = e.clientX - last.x
        const dy = e.clientY - last.y
        last = { x: e.clientX, y: e.clientY }
        moved += Math.abs(dx) + Math.abs(dy)
        tRot.y += dx * 0.005
        tRot.x = clamp(tRot.x + dy * 0.005, -1.15, 1.15)
        markInteracted()
      } else {
        hover(e)
      }
    }
    function onUp(e: PointerEvent) {
      if (pointers[e.pointerId]) {
        const wasTap = dragging && moved < 6
        delete pointers[e.pointerId]
        if (Object.keys(pointers).length < 2) pinchStart = 0
        if (Object.keys(pointers).length === 0) {
          dragging = false
          canvas!.classList.remove('grabbing')
          resumeAt = performance.now() + 1400
          if (wasTap) pick(e)
        }
      }
    }
    function onWheel(e: WheelEvent) {
      e.preventDefault()
      tZoom = clamp(tZoom - e.deltaY * 0.0012, ZMIN, ZMAX)
      markInteracted()
      autoPaused = true
      resumeAt = performance.now() + 1400
    }
    function onPanelClick(e: Event) {
      if ((e.target as HTMLElement).classList.contains('gp-close')) hidePanel()
    }
    let resizeObserver: ResizeObserver | undefined
    function bindEvents() {
      canvas!.style.touchAction = 'pan-y'
      canvas!.addEventListener('pointerdown', onDown)
      window.addEventListener('pointermove', onMove)
      window.addEventListener('pointerup', onUp)
      window.addEventListener('pointercancel', onUp)
      stage!.addEventListener('wheel', onWheel, { passive: false })
      panelEl!.addEventListener('click', onPanelClick)
      window.addEventListener('resize', resize)
      if (window.ResizeObserver) {
        resizeObserver = new ResizeObserver(resize)
        resizeObserver.observe(stage!)
      }
    }

    let ready = false
    let started = false
    let offscreen = false
    let rafId = 0
    let entranceT = reduce ? 1 : 0

    function animate() {
      rafId = requestAnimationFrame(animate)
      if (offscreen) return
      const now = performance.now()

      if (autoPaused && !dragging && Object.keys(pointers).length === 0 && now > resumeAt) autoPaused = false
      if (!reduce && !autoPaused) tRot.y += 0.0006

      rot.x += (tRot.x - rot.x) * 0.09
      rot.y += (tRot.y - rot.y) * 0.09
      zoom += (tZoom - zoom) * 0.1
      camera.position.z = baseDist / zoom
      globe.rotation.x = rot.x
      globe.rotation.y = rot.y

      if (entranceT < 1) {
        entranceT = Math.min(1, entranceT + 0.03)
        const s = GLOBE_SCALE * (0.9 + 0.1 * ease(entranceT))
        globe.scale.setScalar(s)
      }

      const k = (now % 2000) / 2000
      originRing.scale.setScalar(1 + k * 1.0)
      ;(originRing.material as THREE.MeshBasicMaterial).opacity = 0.45 * (1 - k)

      // Each route line trails behind its own plane instead of staying fully drawn:
      // the line's draw range is driven directly by the traveler's own progress (t),
      // so it grows from the origin as the plane flies and resets the moment the
      // plane laps back to the start of its route.
      if (!reduce) {
        for (let i = 0; i < travelers.length; i++) {
          const tv = travelers[i]
          const u = tv.userData
          u.t += u.speed
          if (u.t > 1) u.t -= 1
          // Sample the spline continuously (getPoint) instead of snapping between
          // its ~65 precomputed vertices — the old nearest-sample lookup only moved
          // the plane once every several frames, which read as a stutter.
          const p = u.curve.getPoint(u.t)
          const p2 = u.curve.getPoint(Math.min(u.t + 0.003, 1))
          tv.position.copy(p)
          const w = p.clone().applyMatrix4(globe.matrixWorld)
          tv.visible = w.z > 0.04
          if (tv.visible) {
            const s1 = p.clone().applyMatrix4(globe.matrixWorld).project(camera)
            const s2 = p2.clone().applyMatrix4(globe.matrixWorld).project(camera)
            const dx = (s2.x - s1.x) * W
            const dy = (s2.y - s1.y) * H
            if (dx || dy) (tv.material as THREE.SpriteMaterial).rotation = Math.atan2(dy, dx)
          }

          const L = routeLines[i]
          if (L) {
            L.geometry.setDrawRange(0, Math.max(1, Math.floor(u.t * L.userData.total)))
            const mat = L.material as THREE.LineBasicMaterial
            if (mat.opacity < 0.55) mat.opacity = Math.min(0.55, mat.opacity + 0.02)
          }
        }
      } else {
        // Reduced motion: no trailing/no flight, just the full static route once.
        travelers.forEach((t) => (t.visible = false))
        for (const L of routeLines) {
          L.geometry.setDrawRange(0, L.userData.total)
          ;(L.material as THREE.LineBasicMaterial).opacity = 0.55
        }
      }

      for (const label of destLabels) {
        const dw = new THREE.Vector3()
        label.getWorldPosition(dw)
        label.visible = dw.z > 0.02
      }

      globe.updateMatrixWorld()
      renderer.render(scene, camera)
    }

    function init() {
      bindEvents()
      ready = true
      setTimeout(() => loadingEl!.classList.add('hide'), 420)
      entranceT = reduce ? 1 : 0
      animate()
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          offscreen = !entry.isIntersecting
          if (entry.isIntersecting && !started) {
            started = true
            const fontsReady = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()
            fontsReady.then(() => init())
          }
        })
      },
      { threshold: 0.15 },
    )
    io.observe(stage)

    disposers.push(() => {
      selectCountryRef.current = () => {}
      io.disconnect()
      cancelAnimationFrame(rafId)
      canvas.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
      stage.removeEventListener('wheel', onWheel)
      panelEl.removeEventListener('click', onPanelClick)
      window.removeEventListener('resize', resize)
      resizeObserver?.disconnect()
      scene.traverse((obj) => {
        const mesh = obj as THREE.Mesh
        if (mesh.geometry) mesh.geometry.dispose()
        const mat = (obj as THREE.Sprite).material
        if (Array.isArray(mat)) mat.forEach((m) => m.dispose())
        else if (mat) mat.dispose()
      })
      DOTTEX.dispose()
      PLANETEX.dispose()
      renderer.dispose()
    })

    return () => disposers.forEach((d) => d())
  }, [])

  return (
    <div className="globe-stage" id="globeStage" ref={stageRef}>
      <canvas id="globeCanvas" aria-hidden="true" ref={canvasRef} />
      <div className="globe-loading" id="globeLoading" ref={loadingRef}>
        <div className="gl-brand">
          MONARCH
          <span>WORLDWIDE EXPRESS</span>
        </div>
        <div className="gl-bar">
          <i />
        </div>
      </div>
      <div className="globe-hint" id="globeHint" ref={hintRef}>
        <span className="gh-desktop">Drag to explore · click a destination</span>
        <span className="gh-mobile">Tap a destination to explore</span>
      </div>
      <div className="globe-tip" id="globeTip" ref={tipRef} />
      <div className="globe-panel" id="globePanel" role="dialog" aria-label="Destination details" ref={panelRef} />
      <div className="globe-fallback" id="globeFallback">
        <strong>Our global network</strong>
        <p>
          From our India hub we connect to destinations across the Middle East, Europe, North
          America and Asia&nbsp;Pacific.
        </p>
      </div>
      <div className="globe-float gf-1">
        <span className="gf-ico" style={{ background: 'var(--azure-soft)', color: 'var(--azure)' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
            <circle cx="12" cy="12" r="9" />
            <path d="M3 12h18M12 3c2.5 2.7 4 6 4 9s-1.5 6.3-4 9c-2.5-2.7-4-6-4-9s1.5-6.3 4-9z" />
          </svg>
        </span>
        <span className="gf-txt">
          <span className="gf-k">Global Reach</span>
          <span className="gf-v">120+ Countries</span>
          <span className="gf-s">Worldwide</span>
        </span>
      </div>
      <div className="globe-float gf-2">
        <span className="gf-ico" style={{ background: '#FDF3E4', color: 'var(--amber)' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
            <path d="M3 12h18M4 8h4v4H4zM16 12h4v4h-4z" />
          </svg>
        </span>
        <span className="gf-txt">
          <span className="gf-k">Fast Delivery</span>
          <span className="gf-v">Door-to-Door</span>
          <span className="gf-s">Reliable &amp; Secure</span>
        </span>
      </div>
      <div className="globe-float gf-3">
        <span className="gf-ico" style={{ background: '#E9F8EF', color: '#1E9E5A' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
            <circle cx="12" cy="12" r="9" />
            <circle cx="12" cy="12" r="3.4" />
            <path d="M12 3v2.4M12 18.6V21M3 12h2.4M18.6 12H21" />
          </svg>
        </span>
        <span className="gf-txt">
          <span className="gf-k">Live Tracking</span>
          <span className="gf-v">Shipment Visibility</span>
          <span className="gf-s">Track Every Step</span>
        </span>
      </div>
    </div>
  )
}
