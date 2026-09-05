import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'

const KRAFT = '#C9A46B'
const INK = '#17223F'
const AMBER = '#E28C22'

function makeCanvas(w: number, h: number) {
  const cv = document.createElement('canvas')
  cv.width = w
  cv.height = h
  return { cv, g: cv.getContext('2d')! }
}

/** Kraft-cardboard base fill with a little grain so it doesn't read as flat plastic. */
function paintKraft(g: CanvasRenderingContext2D, w: number, h: number) {
  g.fillStyle = KRAFT
  g.fillRect(0, 0, w, h)
  const grd = g.createLinearGradient(0, 0, 0, h)
  grd.addColorStop(0, 'rgba(255,255,255,.08)')
  grd.addColorStop(0.5, 'rgba(0,0,0,0)')
  grd.addColorStop(1, 'rgba(0,0,0,.1)')
  g.fillStyle = grd
  g.fillRect(0, 0, w, h)
  // sparse fiber-grain speckle, drawn once (baked into the texture, not per-frame)
  g.globalAlpha = 0.05
  for (let i = 0; i < 900; i++) {
    g.fillStyle = Math.random() > 0.5 ? '#000' : '#fff'
    const x = Math.random() * w
    const y = Math.random() * h
    const l = 6 + Math.random() * 14
    g.fillRect(x, y, l, 0.8)
  }
  g.globalAlpha = 1
}

/**
 * Draws the real Monarch wing mark (public/logo-mark.png) centered at (cx, cy)
 * with the given pixel height, preserving its aspect ratio. Falls back to a
 * hand-drawn approximation if the asset failed to load, so the box never ends
 * up with a blank spot where the mark should be.
 */
function drawLogoMark(
  g: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  height: number,
  logo: HTMLImageElement | null,
  alpha = 1,
) {
  g.save()
  g.globalAlpha = alpha
  if (logo) {
    const w = height * (logo.naturalWidth / logo.naturalHeight)
    g.drawImage(logo, cx - w / 2, cy - height / 2, w, height)
  } else {
    const s = height / 2
    g.translate(cx, cy)
    g.fillStyle = INK
    g.beginPath()
    g.moveTo(0, -s)
    g.bezierCurveTo(-s * 0.6, -s * 0.2, -s * 1.1, s * 0.1, -s * 0.3, s)
    g.bezierCurveTo(-s * 0.15, s * 0.3, 0, s * 0.15, 0, -s)
    g.fill()
    g.beginPath()
    g.moveTo(0, -s)
    g.bezierCurveTo(s * 0.6, -s * 0.2, s * 1.1, s * 0.1, s * 0.3, s)
    g.bezierCurveTo(s * 0.15, s * 0.3, 0, s * 0.15, 0, -s)
    g.fill()
  }
  g.restore()
}

/** Front face: the primary MONARCH WORLDWIDE EXPRESS branding, "printed" onto the box. */
function frontTexture(logo: HTMLImageElement | null) {
  const { cv, g } = makeCanvas(1024, 640)
  paintKraft(g, cv.width, cv.height)

  const cx = cv.width / 2
  g.textAlign = 'center'

  drawLogoMark(g, cx, 150, 92, logo)

  g.fillStyle = INK
  g.font = '700 92px "Space Grotesk", sans-serif'
  g.fillText('MONARCH', cx, 300)
  g.font = '600 40px "Space Grotesk", sans-serif'
  g.save()
  g.letterSpacing = '10px'
  g.fillText('WORLDWIDE EXPRESS', cx, 360)
  g.restore()

  g.strokeStyle = 'rgba(23,34,63,.35)'
  g.lineWidth = 2
  g.beginPath()
  g.moveTo(cx - 210, 385)
  g.lineTo(cx + 210, 385)
  g.stroke()

  g.fillStyle = 'rgba(23,34,63,.6)'
  g.font = '500 22px "JetBrains Mono", monospace'
  g.save()
  g.letterSpacing = '6px'
  g.fillText('AIR · SEA · DOOR-TO-DOOR', cx, 430)
  g.restore()

  // secondary courier markings — small, low-contrast corner details only
  g.save()
  g.translate(cv.width - 150, cv.height - 110)
  g.strokeStyle = 'rgba(23,34,63,.4)'
  g.setLineDash([6, 5])
  g.strokeRect(-90, -55, 180, 110)
  g.setLineDash([])
  g.fillStyle = 'rgba(23,34,63,.55)'
  g.font = '600 13px "JetBrains Mono", monospace'
  g.textAlign = 'center'
  g.fillText('AWB · MWX', 0, -30)
  let bx = -70
  for (let i = 0; i < 14; i++) {
    const bw = 2 + (i % 3)
    g.fillRect(bx, -10, bw, 34)
    bx += bw + 4
  }
  g.restore()

  g.save()
  g.translate(120, cv.height - 90)
  g.rotate(-0.12)
  g.strokeStyle = 'rgba(200,60,40,.55)'
  g.lineWidth = 3
  g.strokeRect(-58, -22, 116, 44)
  g.fillStyle = 'rgba(200,60,40,.55)'
  g.font = '700 18px "Space Grotesk", sans-serif'
  g.textAlign = 'center'
  g.fillText('FRAGILE', 0, 6)
  g.restore()

  const tex = new THREE.CanvasTexture(cv)
  tex.anisotropy = 4
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

/** Side/back faces: a quieter repeated wordmark, like real courier tape branding. */
function sideTexture(logo: HTMLImageElement | null) {
  const { cv, g } = makeCanvas(512, 512)
  paintKraft(g, cv.width, cv.height)
  g.fillStyle = AMBER
  g.fillRect(0, 214, cv.width, 6)
  g.fillRect(0, 292, cv.width, 6)
  drawLogoMark(g, cv.width / 2, 130, 52, logo)
  g.fillStyle = 'rgba(23,34,63,.7)'
  g.textAlign = 'center'
  g.font = '700 34px "Space Grotesk", sans-serif'
  g.fillText('MWE', cv.width / 2, 265)
  g.font = '500 15px "JetBrains Mono", monospace'
  g.save()
  g.letterSpacing = '3px'
  g.fillStyle = 'rgba(23,34,63,.45)'
  g.fillText('WORLDWIDE EXPRESS', cv.width / 2, 340)
  g.restore()
  const tex = new THREE.CanvasTexture(cv)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

/** Top face: kraft + a painted-on packing-tape strip and fold seam — no extra tape geometry needed. */
function topTexture(logo: HTMLImageElement | null) {
  const { cv, g } = makeCanvas(512, 512)
  paintKraft(g, cv.width, cv.height)

  g.save()
  g.globalAlpha = 0.85
  g.fillStyle = '#E9DFC4'
  g.fillRect(0, 190, cv.width, 132)
  g.strokeStyle = 'rgba(255,255,255,.5)'
  g.lineWidth = 1
  for (let x = 0; x < cv.width; x += 26) {
    g.beginPath()
    g.moveTo(x, 190)
    g.lineTo(x, 322)
    g.stroke()
  }
  g.restore()

  // center fold seam under the tape
  g.strokeStyle = 'rgba(23,34,63,.25)'
  g.lineWidth = 2
  g.beginPath()
  g.moveTo(cv.width / 2, 0)
  g.lineTo(cv.width / 2, cv.height)
  g.stroke()

  drawLogoMark(g, cv.width / 2, 256, 44, logo, 0.5)

  const tex = new THREE.CanvasTexture(cv)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

function build(stage: HTMLDivElement, canvas: HTMLCanvasElement, logo: HTMLImageElement | null) {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const disposables: Array<{ dispose: () => void }> = []

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 50)
  camera.position.set(0, 0, 3.85)
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.outputColorSpace = THREE.SRGBColorSpace

  function resize() {
    const w = stage.clientWidth || 1
    const h = stage.clientHeight || 1
    renderer.setSize(w, h, false)
    camera.aspect = w / h
    camera.updateProjectionMatrix()
  }
  resize()

  // ---- lighting: soft key, gentle fill, subtle brand-tinted rim ----
  scene.add(new THREE.AmbientLight(0xffffff, 0.55))
  const key = new THREE.DirectionalLight(0xffffff, 1.15)
  key.position.set(3, 4, 5)
  scene.add(key)
  const fill = new THREE.DirectionalLight(0x9db7e8, 0.35)
  fill.position.set(-4, -1, 2)
  scene.add(fill)
  const rim = new THREE.DirectionalLight(0xf0a93b, 0.55)
  rim.position.set(-2, 3, -4)
  scene.add(rim)

  // ---- the box itself: rectangular, width > height, depth ≈ height ----
  const W = 1.85
  const H = 1.15
  const D = 1.15
  const geom = new RoundedBoxGeometry(W, H, D, 3, 0.035)
  disposables.push(geom)

  const front = frontTexture(logo)
  const side = sideTexture(logo)
  const top = topTexture(logo)
  disposables.push(front, side, top)

  const cardboardMat = (map: THREE.Texture) =>
    new THREE.MeshStandardMaterial({ map, roughness: 0.88, metalness: 0.04, color: 0xffffff })
  const flatMat = (color: number) => new THREE.MeshStandardMaterial({ color, roughness: 0.9, metalness: 0.03 })

  // BoxGeometry face-group order: +x, -x, +y, -y, +z, -z
  const materials = [
    cardboardMat(side), // right
    cardboardMat(side), // left
    cardboardMat(top), // top
    flatMat(0xb08a52), // bottom
    cardboardMat(front), // front
    cardboardMat(side), // back
  ]
  materials.forEach((m) => disposables.push(m))

  const box = new THREE.Mesh(geom, materials)
  const rig = new THREE.Group()
  rig.add(box)
  scene.add(rig)

  // gentle contact shadow (a flat, soft dark ellipse) so the box feels grounded
  const shadowGeom = new THREE.CircleGeometry(1.05, 32)
  const shadowMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.22, depthWrite: false })
  const shadow = new THREE.Mesh(shadowGeom, shadowMat)
  shadow.rotation.x = -Math.PI / 2
  shadow.position.y = -H / 2 - 0.42
  scene.add(shadow)
  disposables.push(shadowGeom, shadowMat)

  // ---- idle motion + drag rotation with damping/inertia (same conventions as NetworkGlobe) ----
  const idleBaseY = -0.15
  const rot = { x: -0.18, y: 0.5 }
  const tRot = { x: rot.x, y: rot.y }
  const XMIN = -0.55
  const XMAX = 0.5
  let dragging = false
  let moved = 0
  let last = { x: 0, y: 0 }
  let velocity = { x: 0, y: 0 }
  let autoPaused = false
  let resumeAt = 0
  const pointers: Record<number, { x: number; y: number }> = {}

  function clamp(v: number, a: number, b: number) {
    return Math.max(a, Math.min(b, v))
  }

  function onDown(e: PointerEvent) {
    pointers[e.pointerId] = { x: e.clientX, y: e.clientY }
    dragging = true
    moved = 0
    velocity = { x: 0, y: 0 }
    last = { x: e.clientX, y: e.clientY }
    autoPaused = true
    canvas.style.cursor = 'grabbing'
    ;(e.target as Element).setPointerCapture?.(e.pointerId)
  }
  function onMove(e: PointerEvent) {
    if (!dragging || !pointers[e.pointerId]) return
    const dx = e.clientX - last.x
    const dy = e.clientY - last.y
    last = { x: e.clientX, y: e.clientY }
    moved += Math.abs(dx) + Math.abs(dy)
    const rx = dy * 0.006
    const ry = dx * 0.008
    tRot.y += ry
    tRot.x = clamp(tRot.x + rx, XMIN, XMAX)
    velocity = { x: rx, y: ry }
  }
  function onUp(e: PointerEvent) {
    if (!pointers[e.pointerId]) return
    delete pointers[e.pointerId]
    dragging = false
    canvas.style.cursor = 'grab'
    resumeAt = performance.now() + 1800
  }
  canvas.addEventListener('pointerdown', onDown)
  window.addEventListener('pointermove', onMove)
  window.addEventListener('pointerup', onUp)
  window.addEventListener('pointercancel', onUp)
  canvas.style.cursor = 'grab'
  canvas.style.touchAction = 'none'

  let resizeObserver: ResizeObserver | undefined
  window.addEventListener('resize', resize)
  if (window.ResizeObserver) {
    resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(stage)
  }
  // The very first resize() above can measure a stale/transitional layout size
  // (the grid column hasn't finished settling yet), and that isn't guaranteed to
  // self-correct via ResizeObserver. Re-measure once after layout has settled.
  requestAnimationFrame(() => requestAnimationFrame(resize))

  // ---- render loop, paused while offscreen ----
  let rafId = 0
  let offscreen = false
  let started = false

  function animate() {
    rafId = requestAnimationFrame(animate)
    if (offscreen) return
    const now = performance.now()

    if (!dragging) {
      // inertia: momentum carries the last drag velocity, decaying each frame
      if (Math.abs(velocity.x) > 0.0002 || Math.abs(velocity.y) > 0.0002) {
        tRot.y += velocity.y
        tRot.x = clamp(tRot.x + velocity.x, XMIN, XMAX)
        velocity.x *= 0.92
        velocity.y *= 0.92
      } else if (autoPaused && now > resumeAt) {
        autoPaused = false
      }
      if (!reduce && !autoPaused && Math.abs(velocity.y) < 0.0002) {
        tRot.y += 0.0022
        tRot.x = clamp(idleBaseYTilt(now), XMIN, XMAX)
      }
    }

    rot.x += (tRot.x - rot.x) * 0.08
    rot.y += (tRot.y - rot.y) * 0.08
    rig.rotation.x = rot.x
    rig.rotation.y = rot.y

    if (!reduce) {
      rig.position.y = idleBaseY + Math.sin(now * 0.0009) * 0.055
    } else {
      rig.position.y = idleBaseY
    }

    renderer.render(scene, camera)
  }

  function idleBaseYTilt(now: number) {
    return -0.18 + Math.sin(now * 0.0006) * 0.05
  }

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        offscreen = !entry.isIntersecting
        if (entry.isIntersecting && !started) {
          started = true
          animate()
        }
      })
    },
    { threshold: 0.15 },
  )
  io.observe(stage)
  if (reduce) {
    // still render one static frame so the box is visible without the loop running continuously
    resize()
    renderer.render(scene, camera)
  }

  return () => {
    io.disconnect()
    cancelAnimationFrame(rafId)
    canvas.removeEventListener('pointerdown', onDown)
    window.removeEventListener('pointermove', onMove)
    window.removeEventListener('pointerup', onUp)
    window.removeEventListener('pointercancel', onUp)
    window.removeEventListener('resize', resize)
    resizeObserver?.disconnect()
    disposables.forEach((d) => d.dispose())
    renderer.dispose()
  }
}

interface CourierPackage3DProps {
  className?: string
}

/**
 * Self-contained interactive 3D courier box (drag to rotate, subtle idle float).
 * Structured the same way as NetworkGlobe.tsx: one mount effect owning the whole
 * Three.js scene/animation loop imperatively, an IntersectionObserver to pause
 * rendering offscreen, and full disposal on unmount.
 */
export function CourierPackage3D({ className }: CourierPackage3DProps) {
  const stageRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const stage = stageRef.current
    const canvas = canvasRef.current
    if (!stage || !canvas) return

    function webglOK() {
      try {
        const c = document.createElement('canvas')
        return !!(window.WebGLRenderingContext && (c.getContext('webgl') || c.getContext('experimental-webgl')))
      } catch {
        return false
      }
    }
    if (!webglOK()) return

    let cancelled = false
    let teardown: (() => void) | null = null

    // The real wing mark is drawn onto the box textures, so the scene only
    // builds once it's loaded (or has definitively failed) — drawLogoMark
    // falls back to a hand-drawn approximation on failure either way.
    const logoImg = new Image()
    logoImg.src = '/logo-mark.png'
    logoImg.onload = () => init(logoImg)
    logoImg.onerror = () => init(null)

    function init(logo: HTMLImageElement | null) {
      if (cancelled || !stage || !canvas) return
      teardown = build(stage, canvas, logo)
    }

    return () => {
      cancelled = true
      teardown?.()
    }
  }, [])

  return (
    <div className={className ? `package-stage ${className}` : 'package-stage'} ref={stageRef} aria-hidden="true">
      <canvas ref={canvasRef} />
    </div>
  )
}
