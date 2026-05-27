// 비주얼라이저 렌더 함수 24종 — Step2 canvas + frameRenderer 공유

type Ctx2D = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D

export interface FireParticle {
  x: number; y: number; vx: number; vy: number
  life: number; hue: number; size: number
}

export interface RingEntry { r: number; life: number; hue: number }

export interface VisState {
  particles: FireParticle[]
  peaks: number[]
  glitch: { active: boolean; timer: number }
  phase: number
  angle: number
  rings: RingEntry[]
  cityscape: number[]
}

export function makeVisState(): VisState {
  return { particles: [], peaks: [], glitch: { active: false, timer: 10 }, phase: 0, angle: 0, rings: [], cityscape: [] }
}

export function hexHue(hex: string): number {
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  if (max === min) return 0
  const d = max - min
  return (max === r ? ((g - b) / d + (g < b ? 6 : 0))
        : max === g ? (b - r) / d + 2
        : (r - g) / d + 4) * 60
}

export function bandHue(i: number, n: number, color: string): number {
  return color === 'rainbow'
    ? (i / Math.max(n - 1, 1)) * 240
    : hexHue(color) + (i / Math.max(n - 1, 1) - 0.5) * 40
}

// [01] classic-bars
export function drawClassicBars(ctx: Ctx2D, vals: number[], W: number, H: number, color: string, iScale: number, doClear = true): void {
  if (doClear) ctx.clearRect(0, 0, W, H)
  const n = vals.length
  const gap = W * 0.006
  const bw = (W - gap * (n + 1)) / n
  for (let i = 0; i < n; i++) {
    const bh = vals[i] * H * 0.88 * iScale
    if (bh < 1) continue
    const x = gap + i * (bw + gap)
    const hue = bandHue(i, n, color)
    const gr = ctx.createLinearGradient(0, H - bh, 0, H)
    gr.addColorStop(0, `hsla(${hue},100%,68%,0.95)`)
    gr.addColorStop(1, `hsla(${hue},100%,42%,0.55)`)
    ctx.fillStyle = gr
    ctx.shadowColor = `hsl(${hue},100%,65%)`
    ctx.shadowBlur = vals[i] * 14 * iScale
    ctx.fillRect(x, H - bh, bw, bh)
  }
  ctx.shadowBlur = 0
}

// [02] mirror-bars
export function drawMirrorBars(ctx: Ctx2D, vals: number[], W: number, H: number, color: string, iScale: number, doClear = true): void {
  if (doClear) ctx.clearRect(0, 0, W, H)
  const n = vals.length
  const gap = W * 0.005
  const bw = (W - gap * (n + 1)) / n
  const mid = H / 2
  for (let i = 0; i < n; i++) {
    const half = vals[i] * mid * 0.9 * iScale
    if (half < 1) continue
    const x = gap + i * (bw + gap)
    const hue = bandHue(i, n, color)
    const gr = ctx.createLinearGradient(0, mid - half, 0, mid + half)
    gr.addColorStop(0, `hsla(${hue},100%,65%,0.2)`)
    gr.addColorStop(0.5, `hsla(${hue},100%,72%,0.95)`)
    gr.addColorStop(1, `hsla(${hue},100%,65%,0.2)`)
    ctx.fillStyle = gr
    ctx.fillRect(x, mid - half, bw, half * 2)
  }
  ctx.strokeStyle = 'rgba(255,255,255,0.06)'
  ctx.lineWidth = 1
  ctx.beginPath(); ctx.moveTo(0, mid); ctx.lineTo(W, mid); ctx.stroke()
}

// [03] neon-glow with peak dots
export function drawNeonGlow(ctx: Ctx2D, vals: number[], W: number, H: number, color: string, iScale: number, state: VisState, doClear = true): void {
  if (doClear) ctx.clearRect(0, 0, W, H)
  const n = vals.length
  const gap = W * 0.007
  const bw = (W - gap * (n + 1)) / n
  if (state.peaks.length !== n) state.peaks = new Array(n).fill(0)
  for (let i = 0; i < n; i++) {
    const bh = vals[i] * H * 0.82 * iScale
    const x = gap + i * (bw + gap)
    const hue = bandHue(i, n, color)
    ctx.shadowColor = `hsl(${hue},100%,65%)`
    ctx.shadowBlur = 18 * iScale
    ctx.fillStyle = `hsla(${hue},100%,65%,0.85)`
    ctx.fillRect(x, H - bh, bw, bh)
    if (vals[i] > state.peaks[i]) state.peaks[i] = vals[i]
    else state.peaks[i] = Math.max(0, state.peaks[i] - 0.003)
    ctx.shadowBlur = 10
    ctx.fillStyle = `hsl(${hue},100%,90%)`
    ctx.fillRect(x, H - state.peaks[i] * H * 0.82 * iScale - 3, bw, 3)
  }
  ctx.shadowBlur = 0
}

// [04] waveform-line
export function drawWaveformLine(ctx: Ctx2D, vals: number[], W: number, H: number, color: string, iScale: number, doClear = true): void {
  if (doClear) ctx.clearRect(0, 0, W, H)
  const n = vals.length
  const mid = H * 0.5
  const hue0 = color === 'rainbow' ? 45 : hexHue(color)
  ctx.beginPath()
  for (let i = 0; i < n; i++) {
    const x = (i / (n - 1)) * W
    const y = mid - vals[i] * mid * 0.85 * iScale
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
  }
  ctx.lineTo(W, mid); ctx.lineTo(0, mid); ctx.closePath()
  const fill = ctx.createLinearGradient(0, 0, W, 0)
  fill.addColorStop(0, `hsla(${hue0},100%,65%,0.3)`)
  fill.addColorStop(0.5, `hsla(${(hue0 + 150) % 360},100%,65%,0.5)`)
  fill.addColorStop(1, `hsla(${(hue0 + 300) % 360},100%,65%,0.3)`)
  ctx.fillStyle = fill; ctx.fill()
  ctx.beginPath()
  for (let i = 0; i < n; i++) {
    const x = (i / (n - 1)) * W
    const y = mid - vals[i] * mid * 0.85 * iScale
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
  }
  ctx.strokeStyle = `hsla(${hue0},100%,78%,0.95)`
  ctx.lineWidth = 2.5
  ctx.shadowColor = `hsl(${hue0},100%,78%)`
  ctx.shadowBlur = 12
  ctx.stroke()
  ctx.shadowBlur = 0
}

// [05] circular-eq
export function drawCircularEQ(ctx: Ctx2D, vals: number[], W: number, H: number, color: string, iScale: number, doClear = true): void {
  if (doClear) ctx.clearRect(0, 0, W, H)
  const cx = W / 2, cy = H / 2
  const inner = Math.min(W, H) * 0.18
  const outer = Math.min(W, H) * 0.46
  const n = vals.length
  ctx.lineCap = 'round'
  for (let i = 0; i < n; i++) {
    const angle = (i / n) * Math.PI * 2 - Math.PI / 2
    const len = vals[i] * (outer - inner) * iScale
    const x1 = cx + Math.cos(angle) * inner
    const y1 = cy + Math.sin(angle) * inner
    const x2 = cx + Math.cos(angle) * (inner + len)
    const y2 = cy + Math.sin(angle) * (inner + len)
    const hue = bandHue(i, n, color)
    ctx.strokeStyle = `hsla(${hue},100%,65%,0.9)`
    ctx.lineWidth = (2 * Math.PI * inner / n) * 0.55
    ctx.shadowColor = `hsl(${hue},100%,65%)`
    ctx.shadowBlur = 8 * iScale
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke()
  }
  ctx.shadowBlur = 0
}

// [06] stacked-layers
export function drawStackedLayers(ctx: Ctx2D, vals: number[], W: number, H: number, color: string, iScale: number, doClear = true): void {
  if (doClear) ctx.clearRect(0, 0, W, H)
  const n = vals.length
  const baseHue = color === 'rainbow' ? 0 : hexHue(color)
  const layers = [
    { hueOff: 0,   yBase: H * 0.85, amp: H * 0.35 * iScale, alpha: 0.55 },
    { hueOff: 120, yBase: H * 0.72, amp: H * 0.28 * iScale, alpha: 0.50 },
    { hueOff: 240, yBase: H * 0.60, amp: H * 0.22 * iScale, alpha: 0.45 },
  ]
  for (const { hueOff, yBase, amp, alpha } of layers) {
    const hue = (baseHue + hueOff) % 360
    ctx.beginPath()
    ctx.moveTo(0, H)
    for (let i = 0; i <= n; i++) {
      const x = (i / n) * W
      ctx.lineTo(x, yBase - vals[Math.min(i, n - 1)] * amp)
    }
    ctx.lineTo(W, H); ctx.closePath()
    const gr = ctx.createLinearGradient(0, 0, W, 0)
    gr.addColorStop(0, `hsla(${hue},100%,60%,${alpha * 0.4})`)
    gr.addColorStop(0.5, `hsla(${hue},100%,65%,${alpha})`)
    gr.addColorStop(1, `hsla(${hue},100%,60%,${alpha * 0.4})`)
    ctx.fillStyle = gr; ctx.fill()
    ctx.beginPath()
    for (let i = 0; i < n; i++) {
      const x = (i / (n - 1)) * W
      const y = yBase - vals[i] * amp
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
    }
    ctx.strokeStyle = `hsla(${hue},100%,82%,0.7)`
    ctx.lineWidth = 1.5
    ctx.shadowColor = `hsl(${hue},100%,70%)`
    ctx.shadowBlur = 8
    ctx.stroke(); ctx.shadowBlur = 0
  }
}

// [07] dot-matrix (LED grid)
export function drawDotMatrix(ctx: Ctx2D, vals: number[], W: number, H: number, color: string, iScale: number, doClear = true): void {
  if (doClear) ctx.clearRect(0, 0, W, H)
  const cols = Math.min(vals.length, 40)
  const rows = 20
  const cw = W / cols, rh = H / rows
  const r = Math.min(cw, rh) * 0.38
  for (let col = 0; col < cols; col++) {
    const vi = Math.floor(col * vals.length / cols)
    const level = Math.round(vals[vi] * rows * iScale)
    const hue = bandHue(col, cols, color)
    for (let row = 0; row < rows; row++) {
      const lit = (rows - 1 - row) < level
      const cx2 = (col + 0.5) * cw, cy2 = (row + 0.5) * rh
      ctx.beginPath(); ctx.arc(cx2, cy2, r, 0, Math.PI * 2)
      if (lit) {
        ctx.fillStyle = `hsl(${hue},100%,65%)`
        ctx.shadowColor = `hsl(${hue},100%,65%)`
        ctx.shadowBlur = r * 2
      } else {
        ctx.fillStyle = `hsla(${hue},40%,25%,0.3)`
        ctx.shadowBlur = 0
      }
      ctx.fill()
    }
  }
  ctx.shadowBlur = 0
}

// [08] spectrum-fire (particle trail)
export function drawSpectrumFire(ctx: Ctx2D, vals: number[], W: number, H: number, color: string, iScale: number, state: VisState, doClear = true): void {
  if (doClear) { ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(0, 0, W, H) }
  const n = vals.length
  const bw = W / n
  const baseHue = color === 'rainbow' ? -1 : hexHue(color)
  for (let i = 0; i < n; i++) {
    const v = vals[i] * iScale
    if (v > 0.15 && Math.random() < v * 0.6) {
      const hue = baseHue < 0 ? 10 + (i / n) * 50 : (baseHue + (i / n) * 60) % 360
      state.particles.push({ x: i * bw + bw / 2 + (Math.random() - 0.5) * bw, y: H - v * H * 0.7, vy: -(1 + Math.random() * 3) * v, vx: (Math.random() - 0.5) * 0.8, life: 1, hue, size: 2 + Math.random() * 4 * v })
    }
  }
  for (let i = 0; i < n; i++) {
    const bh = vals[i] * H * 0.7 * iScale
    const hue = baseHue < 0 ? 10 + (i / n) * 50 : (baseHue + (i / n) * 60) % 360
    const gr = ctx.createLinearGradient(0, H - bh, 0, H)
    gr.addColorStop(0, `hsla(${hue + 30},100%,65%,0)`)
    gr.addColorStop(0.5, `hsla(${hue},100%,55%,0.6)`)
    gr.addColorStop(1, `hsla(${hue},100%,45%,0.8)`)
    ctx.fillStyle = gr; ctx.fillRect(i * bw, H - bh, bw - 1, bh)
  }
  state.particles = state.particles.filter(p => {
    p.x += p.vx; p.y += p.vy; p.vy *= 0.96; p.life -= 0.022
    if (p.life <= 0) return false
    ctx.beginPath(); ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2)
    ctx.fillStyle = `hsla(${p.hue + p.life * 30},100%,70%,${p.life * 0.8})`
    ctx.fill(); return true
  })
}

// [09] 3d-perspective bars
export function draw3DPerspective(ctx: Ctx2D, vals: number[], W: number, H: number, color: string, iScale: number, doClear = true): void {
  if (doClear) ctx.clearRect(0, 0, W, H)
  const n = vals.length
  const vpX = W / 2, groundY = H * 0.9, depth = 0.5
  for (let i = n - 1; i >= 0; i--) {
    const t = i / (n - 1)
    const pScale = 1 - Math.abs(t - 0.5) * 2 * depth
    const bh = vals[i] * groundY * 0.75 * iScale * pScale
    const bw = (W / n) * pScale
    const baseX = vpX + (t - 0.5) * W * 0.85
    const x = baseX - bw / 2
    const top = groundY - bh
    const hue = bandHue(i, n, color)
    const gr = ctx.createLinearGradient(0, top, 0, groundY)
    gr.addColorStop(0, `hsla(${hue},100%,72%,${0.9 * pScale})`)
    gr.addColorStop(1, `hsla(${hue},100%,40%,${0.6 * pScale})`)
    ctx.fillStyle = gr
    ctx.shadowColor = `hsl(${hue},100%,65%)`
    ctx.shadowBlur = vals[i] * 12 * iScale * pScale
    ctx.fillRect(x, top, bw, bh)
    // top face
    ctx.fillStyle = `hsla(${hue},100%,85%,${0.35 * pScale})`
    const skew = (t - 0.5) * bw * 0.3
    ctx.beginPath()
    ctx.moveTo(x, top); ctx.lineTo(x + bw, top)
    ctx.lineTo(x + bw + skew, top - 4 * pScale)
    ctx.lineTo(x + skew, top - 4 * pScale)
    ctx.closePath(); ctx.fill()
  }
  ctx.shadowBlur = 0
}

// [10] glitch-shift (chromatic aberration)
export function drawGlitchShift(ctx: Ctx2D, vals: number[], W: number, H: number, color: string, iScale: number, state: VisState, doClear = true): void {
  if (doClear) ctx.clearRect(0, 0, W, H)
  const n = vals.length
  const gap = W * 0.006
  const bw = (W - gap * (n + 1)) / n
  state.glitch.timer--
  if (state.glitch.timer <= 0) {
    state.glitch.active = Math.random() < 0.15
    state.glitch.timer = state.glitch.active ? 2 + Math.floor(Math.random() * 4) : 8 + Math.floor(Math.random() * 20)
  }
  const baseHue = color === 'rainbow' ? -1 : hexHue(color)
  const offsets: [number, number][] = state.glitch.active ? [[-3, 0], [2, 0], [0, 0]] : [[0, 0], [0, 0], [0, 0]]
  const channels = baseHue < 0
    ? ['rgba(255,34,85,0.7)', 'rgba(0,229,255,0.7)', 'rgba(255,255,255,0.85)']
    : [`hsla(${baseHue},100%,55%,0.7)`, `hsla(${(baseHue + 120) % 360},100%,55%,0.7)`, `hsla(${(baseHue + 240) % 360},100%,75%,0.85)`]
  for (let c = 0; c < 3; c++) {
    const [ox, oy] = offsets[c]
    for (let i = 0; i < n; i++) {
      const bh = vals[i] * H * 0.85 * iScale
      ctx.fillStyle = channels[c]
      ctx.fillRect(gap + i * (bw + gap) + ox, H - bh + oy, bw, bh)
    }
  }
  if (state.glitch.active) {
    ctx.fillStyle = 'rgba(255,255,255,0.03)'
    for (let y = 0; y < H; y += 4) ctx.fillRect(0, y, W, 2)
    ctx.fillStyle = 'rgba(255,255,255,0.12)'
    ctx.fillRect(0, Math.random() * H, W, 1 + Math.random() * 3)
  }
}

// [11] spiral-eq
export function drawSpiralEQ(ctx: Ctx2D, vals: number[], W: number, H: number, color: string, iScale: number, state: VisState, doClear = true): void {
  if (doClear) ctx.clearRect(0, 0, W, H)
  const cx = W / 2, cy = H / 2
  const n = vals.length
  state.angle += 0.005
  ctx.lineCap = 'round'
  for (let i = 0; i < n; i++) {
    const t = i / n
    const theta = t * Math.PI * 2 * 2.5 + state.angle
    const rBase = Math.min(W, H) * 0.06 + Math.min(W, H) * 0.36 * t
    const barLen = vals[i] * Math.min(W, H) * 0.12 * iScale
    const hue = bandHue(i, n, color)
    ctx.strokeStyle = `hsl(${hue},100%,65%)`
    ctx.lineWidth = 1.5 + vals[i] * 2
    ctx.shadowColor = `hsl(${hue},100%,65%)`
    ctx.shadowBlur = vals[i] * 10 * iScale
    ctx.beginPath()
    ctx.moveTo(cx + Math.cos(theta) * rBase, cy + Math.sin(theta) * rBase)
    ctx.lineTo(cx + Math.cos(theta) * (rBase + barLen), cy + Math.sin(theta) * (rBase + barLen))
    ctx.stroke()
  }
  ctx.shadowBlur = 0
}

// [12] tunnel-rings
export function drawTunnelRings(ctx: Ctx2D, vals: number[], W: number, H: number, color: string, iScale: number, state: VisState, doClear = true): void {
  if (doClear) ctx.clearRect(0, 0, W, H)
  const cx = W / 2, cy = H / 2
  const energy = vals.reduce((s, v) => s + v, 0) / vals.length
  if (energy * iScale > 0.18 && Math.random() < 0.3) {
    const hue = color === 'rainbow' ? Math.random() * 360 : hexHue(color)
    state.rings.push({ r: 0, life: 1, hue })
  }
  state.rings = state.rings.filter(ring => {
    ring.r += (3 + energy * 12) * iScale
    ring.life -= 0.018
    if (ring.life <= 0 || ring.r > Math.max(W, H)) return false
    ctx.beginPath(); ctx.arc(cx, cy, ring.r, 0, Math.PI * 2)
    ctx.strokeStyle = `hsla(${ring.hue},100%,70%,${ring.life * 0.8})`
    ctx.lineWidth = 2 + ring.life * 3
    ctx.shadowColor = `hsl(${ring.hue},100%,65%)`
    ctx.shadowBlur = 15 * ring.life
    ctx.stroke(); return true
  })
  ctx.shadowBlur = 0
  const n = vals.length
  ctx.lineCap = 'round'
  for (let i = 0; i < n; i++) {
    const angle = (i / n) * Math.PI * 2 - Math.PI / 2
    const r0 = Math.min(W, H) * 0.06
    const r1 = r0 + vals[i] * Math.min(W, H) * 0.14 * iScale
    const hue = bandHue(i, n, color)
    ctx.strokeStyle = `hsla(${hue},100%,65%,0.8)`
    ctx.lineWidth = (W / n) * 0.4
    ctx.beginPath()
    ctx.moveTo(cx + Math.cos(angle) * r0, cy + Math.sin(angle) * r0)
    ctx.lineTo(cx + Math.cos(angle) * r1, cy + Math.sin(angle) * r1)
    ctx.stroke()
  }
}

// [13] frequency-mountain (layered terrain)
export function drawFrequencyMountain(ctx: Ctx2D, vals: number[], W: number, H: number, color: string, iScale: number, doClear = true): void {
  if (doClear) ctx.clearRect(0, 0, W, H)
  const n = vals.length
  const baseHue = color === 'rainbow' ? 200 : hexHue(color)
  const numLayers = 5
  for (let layer = numLayers - 1; layer >= 0; layer--) {
    const t = layer / (numLayers - 1)
    const yBase = H * (0.32 + t * 0.46)
    const amp = H * (0.32 - t * 0.12) * iScale
    const hue = (baseHue + layer * 22) % 360
    const alpha = 0.35 + t * 0.45
    ctx.beginPath(); ctx.moveTo(0, H)
    for (let i = 0; i < n; i++) {
      const vi = (i + layer * 3) % n
      ctx.lineTo((i / (n - 1)) * W, yBase - vals[vi] * amp)
    }
    ctx.lineTo(W, H); ctx.closePath()
    const gr = ctx.createLinearGradient(0, yBase - amp, 0, H)
    gr.addColorStop(0, `hsla(${hue},80%,62%,${alpha * 0.6})`)
    gr.addColorStop(0.5, `hsla(${hue},70%,38%,${alpha})`)
    gr.addColorStop(1, `hsla(${hue},60%,14%,${alpha * 0.8})`)
    ctx.fillStyle = gr; ctx.fill()
    ctx.beginPath()
    for (let i = 0; i < n; i++) {
      const vi = (i + layer * 3) % n
      const y = yBase - vals[vi] * amp
      i === 0 ? ctx.moveTo(0, y) : ctx.lineTo((i / (n - 1)) * W, y)
    }
    ctx.strokeStyle = `hsla(${hue},100%,80%,${0.4 + t * 0.3})`
    ctx.lineWidth = 1.5
    ctx.shadowColor = `hsl(${hue},100%,75%)`
    ctx.shadowBlur = 6 + t * 8
    ctx.stroke(); ctx.shadowBlur = 0
  }
}

// [14] starburst (rotating radial)
export function drawStarburst(ctx: Ctx2D, vals: number[], W: number, H: number, color: string, iScale: number, state: VisState, doClear = true): void {
  if (doClear) ctx.clearRect(0, 0, W, H)
  const cx = W / 2, cy = H / 2
  const n = vals.length
  const energy = vals.reduce((s, v) => s + v, 0) / vals.length
  state.angle += 0.008 + energy * 0.02 * iScale
  const maxR = Math.min(W, H) * 0.48
  ctx.lineCap = 'round'
  for (let i = 0; i < n; i++) {
    const angle = (i / n) * Math.PI * 2 + state.angle
    const len = vals[i] * maxR * iScale
    if (len < 2) continue
    const hue = bandHue(i, n, color)
    ctx.strokeStyle = `hsla(${hue},100%,72%,0.8)`
    ctx.lineWidth = 1.5 + vals[i] * 2.5
    ctx.shadowColor = `hsl(${hue},100%,65%)`
    ctx.shadowBlur = vals[i] * 16 * iScale
    ctx.beginPath()
    ctx.moveTo(cx, cy)
    ctx.lineTo(cx + Math.cos(angle) * len, cy + Math.sin(angle) * len)
    ctx.stroke()
  }
  ctx.shadowBlur = 0
  const rg = 4 + energy * 20 * iScale
  const cg = ctx.createRadialGradient(cx, cy, 0, cx, cy, rg)
  const ch = color === 'rainbow' ? (state.angle * 30) % 360 : hexHue(color)
  cg.addColorStop(0, `hsla(${ch},100%,95%,0.9)`); cg.addColorStop(1, `hsla(${ch},100%,65%,0)`)
  ctx.fillStyle = cg; ctx.beginPath(); ctx.arc(cx, cy, rg, 0, Math.PI * 2); ctx.fill()
}

// [15] block-steps (LED segmented)
export function drawBlockSteps(ctx: Ctx2D, vals: number[], W: number, H: number, color: string, iScale: number, state: VisState, doClear = true): void {
  if (doClear) ctx.clearRect(0, 0, W, H)
  const n = vals.length
  const segments = 16
  const gap = W * 0.006
  const bw = (W - gap * (n + 1)) / n
  const segH = H * 0.86 / segments
  const segGap = segH * 0.15
  if (state.peaks.length !== n) state.peaks = new Array(n).fill(0)
  for (let i = 0; i < n; i++) {
    const level = Math.round(vals[i] * segments * iScale)
    const x = gap + i * (bw + gap)
    const hue = bandHue(i, n, color)
    if (vals[i] > state.peaks[i]) state.peaks[i] = vals[i]
    else state.peaks[i] = Math.max(0, state.peaks[i] - 0.008)
    for (let s = 0; s < segments; s++) {
      const sy = H * 0.07 + (segments - 1 - s) * segH
      const lit = s < level
      if (lit) {
        ctx.fillStyle = `hsl(${hue},100%,${s === level - 1 ? 85 : 62}%)`
        ctx.shadowColor = `hsl(${hue},100%,65%)`
        ctx.shadowBlur = 5
      } else {
        ctx.fillStyle = `hsla(${hue},30%,22%,0.3)`
        ctx.shadowBlur = 0
      }
      ctx.fillRect(x, sy, bw, segH - segGap)
    }
    const pkLevel = Math.round(state.peaks[i] * segments * iScale)
    if (pkLevel > 0) {
      ctx.fillStyle = `hsl(${hue},100%,92%)`
      ctx.shadowColor = `hsl(${hue},100%,90%)`
      ctx.shadowBlur = 8
      ctx.fillRect(x, H * 0.07 + (segments - pkLevel) * segH, bw, segH - segGap)
    }
  }
  ctx.shadowBlur = 0
}

// [16] aurora-curtains
export function drawAuroraCurtains(ctx: Ctx2D, vals: number[], W: number, H: number, color: string, iScale: number, state: VisState, doClear = true): void {
  if (doClear) ctx.clearRect(0, 0, W, H)
  state.phase += 0.012
  const n = 14
  const energy = vals.reduce((s, v) => s + v, 0) / vals.length
  const baseHue = color === 'rainbow' ? 160 : hexHue(color)
  const sw = W / n
  for (let strip = 0; strip < n; strip++) {
    const hue = (baseHue + strip * 20) % 360
    const waveAmp = sw * 0.45 * (0.5 + energy * iScale)
    ctx.beginPath()
    ctx.moveTo(strip * sw, 0)
    const steps = 20
    for (let p = 0; p <= steps; p++) {
      const py = (p / steps) * H
      const wave = Math.sin(state.phase + strip * 0.85 + py / H * Math.PI * 2) * waveAmp
      ctx.lineTo(strip * sw + sw / 2 + wave, py)
    }
    ctx.lineTo((strip + 1) * sw, H); ctx.lineTo(strip * sw, H); ctx.closePath()
    const gr = ctx.createLinearGradient(0, 0, 0, H)
    const a = 0.28 + energy * 0.28 * iScale
    gr.addColorStop(0, `hsla(${hue},100%,70%,0)`)
    gr.addColorStop(0.3, `hsla(${hue},100%,65%,${a})`)
    gr.addColorStop(0.7, `hsla(${(hue + 30) % 360},90%,55%,${a * 1.2})`)
    gr.addColorStop(1, `hsla(${(hue + 60) % 360},80%,40%,0.08)`)
    ctx.fillStyle = gr; ctx.fill()
  }
  ctx.globalAlpha = 0.12
  for (let p = 0; p < 4; p++) {
    const y = (Math.sin(state.phase * 0.7 + p * 1.4) * 0.4 + 0.5) * H
    const sg = ctx.createLinearGradient(0, y - 25, 0, y + 25)
    sg.addColorStop(0, 'transparent'); sg.addColorStop(0.5, 'rgba(255,255,255,0.8)'); sg.addColorStop(1, 'transparent')
    ctx.fillStyle = sg; ctx.fillRect(0, y - 25, W, 50)
  }
  ctx.globalAlpha = 1
}

// [17] dna-helix
export function drawDnaHelix(ctx: Ctx2D, vals: number[], W: number, H: number, color: string, iScale: number, state: VisState, doClear = true): void {
  if (doClear) ctx.clearRect(0, 0, W, H)
  state.phase += 0.04
  const amp = H * 0.3 * iScale
  const baseHue = color === 'rainbow' ? 200 : hexHue(color)
  const pts = 80
  const s1: [number, number][] = [], s2: [number, number][] = []
  for (let i = 0; i <= pts; i++) {
    const x = (i / pts) * W
    const t = (i / pts) * Math.PI * 2 * 3 + state.phase
    const vi = Math.floor(i * vals.length / pts)
    const boost = 1 + vals[vi] * 0.5 * iScale
    s1.push([x, H / 2 + Math.sin(t) * amp * boost])
    s2.push([x, H / 2 + Math.sin(t + Math.PI) * amp * boost])
  }
  // rungs
  for (let i = 0; i <= pts; i += 3) {
    const vi = Math.floor(i * vals.length / pts)
    const hue = color === 'rainbow' ? (i / pts) * 360 : baseHue
    ctx.strokeStyle = `hsla(${hue},80%,65%,${0.2 + vals[vi] * 0.45 * iScale})`
    ctx.lineWidth = 1.5; ctx.shadowBlur = 0
    ctx.beginPath(); ctx.moveTo(s1[i][0], s1[i][1]); ctx.lineTo(s2[i][0], s2[i][1]); ctx.stroke()
  }
  // strands
  for (const [strand, hOff] of [[s1, 0], [s2, 120]] as [[number, number][], number][]) {
    ctx.beginPath()
    strand.forEach(([x, y], i) => i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y))
    const hue = (baseHue + hOff) % 360
    ctx.strokeStyle = `hsl(${hue},100%,65%)`
    ctx.lineWidth = 3
    ctx.shadowColor = `hsl(${hue},100%,65%)`
    ctx.shadowBlur = 12 * iScale
    ctx.stroke(); ctx.shadowBlur = 0
  }
}

// [18] vinyl-grooves
export function drawVinylGrooves(ctx: Ctx2D, vals: number[], W: number, H: number, color: string, iScale: number, state: VisState, doClear = true): void {
  if (doClear) ctx.clearRect(0, 0, W, H)
  const cx = W / 2, cy = H / 2
  const energy = vals.reduce((s, v) => s + v, 0) / vals.length
  state.angle += (0.01 + energy * 0.05) * iScale
  const maxR = Math.min(W, H) * 0.44
  const baseHue = color === 'rainbow' ? 0 : hexHue(color)
  const bg = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxR)
  bg.addColorStop(0, '#1e1e1e'); bg.addColorStop(0.96, '#101010'); bg.addColorStop(1, '#2a2a2a')
  ctx.fillStyle = bg; ctx.beginPath(); ctx.arc(cx, cy, maxR, 0, Math.PI * 2); ctx.fill()
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(state.angle)
  const numG = 24
  for (let g = 0; g < numG; g++) {
    const r = maxR * (0.35 + (g / numG) * 0.6)
    const vi = Math.floor(g * vals.length / numG)
    const br = 18 + vals[vi] * 48 * iScale
    const hue = (baseHue + g * 15) % 360
    ctx.strokeStyle = color === 'rainbow' ? `hsla(${hue},70%,${br}%,0.5)` : `hsla(${hue},40%,${br}%,0.5)`
    ctx.lineWidth = maxR * 0.6 / numG * 0.5
    ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.stroke()
  }
  const lR = maxR * 0.22
  const lhue = (baseHue + 30) % 360
  const lg = ctx.createRadialGradient(0, 0, 0, 0, 0, lR)
  lg.addColorStop(0, `hsl(${lhue},80%,50%)`); lg.addColorStop(0.8, `hsl(${lhue},55%,28%)`); lg.addColorStop(1, `hsl(${lhue},40%,18%)`)
  ctx.fillStyle = lg; ctx.beginPath(); ctx.arc(0, 0, lR, 0, Math.PI * 2); ctx.fill()
  ctx.fillStyle = '#05030a'; ctx.beginPath(); ctx.arc(0, 0, maxR * 0.026, 0, Math.PI * 2); ctx.fill()
  ctx.restore()
  const hl = ctx.createRadialGradient(cx - maxR * 0.2, cy - maxR * 0.2, 0, cx, cy, maxR)
  hl.addColorStop(0, 'rgba(255,255,255,0.07)'); hl.addColorStop(1, 'transparent')
  ctx.fillStyle = hl; ctx.beginPath(); ctx.arc(cx, cy, maxR, 0, Math.PI * 2); ctx.fill()
}

// [19] laser-harp
export function drawLaserHarp(ctx: Ctx2D, vals: number[], W: number, H: number, color: string, iScale: number, doClear = true): void {
  if (doClear) ctx.clearRect(0, 0, W, H)
  const n = Math.min(vals.length, 24)
  const bw = W / n
  for (let i = 0; i < n; i++) {
    const vi = Math.floor(i * vals.length / n)
    const v = vals[vi] * iScale
    if (v < 0.05) continue
    const x = (i + 0.5) * bw
    const bh = v * H * 0.85
    const hue = bandHue(i, n, color)
    const gr = ctx.createLinearGradient(x - bw * 0.3, 0, x + bw * 0.3, 0)
    gr.addColorStop(0, 'transparent')
    gr.addColorStop(0.5, `hsla(${hue},100%,70%,${0.45 + v * 0.4})`)
    gr.addColorStop(1, 'transparent')
    ctx.fillStyle = gr
    ctx.shadowColor = `hsl(${hue},100%,65%)`
    ctx.shadowBlur = 20 * v
    ctx.fillRect(x - bw * 0.3, H - bh, bw * 0.6, bh)
    ctx.strokeStyle = `hsla(${hue},100%,90%,0.9)`
    ctx.lineWidth = 2 * v + 0.5
    ctx.shadowBlur = 14 * v
    ctx.beginPath(); ctx.moveTo(x, H); ctx.lineTo(x, H - bh); ctx.stroke()
    const fr = 3 + v * 8
    const fg = ctx.createRadialGradient(x, H - bh, 0, x, H - bh, fr * 2.5)
    fg.addColorStop(0, `hsla(${hue},100%,95%,0.9)`)
    fg.addColorStop(0.4, `hsla(${hue},100%,75%,0.5)`)
    fg.addColorStop(1, 'transparent')
    ctx.fillStyle = fg; ctx.beginPath(); ctx.arc(x, H - bh, fr * 2.5, 0, Math.PI * 2); ctx.fill()
  }
  ctx.shadowBlur = 0
}

// [20] neon-cityscape
export function drawNeonCityscape(ctx: Ctx2D, vals: number[], W: number, H: number, color: string, iScale: number, state: VisState, doClear = true): void {
  if (doClear) ctx.clearRect(0, 0, W, H)
  const n = Math.min(vals.length, 28)
  const bw = W / n
  const groundY = H * 0.75
  const baseHue = color === 'rainbow' ? 220 : hexHue(color)
  if (state.cityscape.length !== n) {
    state.cityscape = Array.from({ length: n }, () => 0.3 + Math.random() * 0.5)
  }
  const sky = ctx.createLinearGradient(0, 0, 0, groundY)
  sky.addColorStop(0, `hsla(${baseHue},55%,7%,1)`); sky.addColorStop(1, `hsla(${baseHue},38%,14%,1)`)
  ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H)
  for (let i = 0; i < n; i++) {
    const vi = Math.floor(i * vals.length / n)
    const bh = (state.cityscape[i] + vals[vi] * 0.35 * iScale) * groundY * 0.85
    const x = i * bw
    const bTop = groundY - bh
    const hue = (baseHue + (i % 3) * 38) % 360
    ctx.fillStyle = `hsl(${hue},18%,9%))`; ctx.fillRect(x + 1, bTop, bw - 2, bh + 2)
    ctx.strokeStyle = `hsla(${hue},100%,60%,${0.38 + vals[vi] * 0.48 * iScale})`
    ctx.lineWidth = 1
    ctx.shadowColor = `hsl(${hue},100%,60%)`
    ctx.shadowBlur = 5 + vals[vi] * 10 * iScale
    ctx.strokeRect(x + 1, bTop, bw - 2, bh); ctx.shadowBlur = 0
    const wc = Math.max(1, Math.floor((bw - 4) / 6))
    const wr = Math.min(8, Math.max(1, Math.floor(bh / 9)))
    for (let r = 0; r < wr; r++) {
      for (let c = 0; c < wc; c++) {
        if ((r * 7 + c * 13 + i * 31) % 10 < 5 || vals[vi] > 0.4) {
          ctx.fillStyle = `hsla(${hue + 25},100%,80%,${0.45 + vals[vi] * 0.45})`
          ctx.fillRect(x + 2 + c * 6 + 1, bTop + 3 + r * 9, 3, 4)
        }
      }
    }
  }
  // ground / reflection
  ctx.fillStyle = `hsla(${baseHue},30%,12%,1)`; ctx.fillRect(0, groundY, W, H - groundY)
  ctx.save(); ctx.globalAlpha = 0.22
  ctx.scale(1, -0.25); ctx.translate(0, -(groundY / 0.25) * 2)
  for (let i = 0; i < n; i++) {
    const vi = Math.floor(i * vals.length / n)
    const bh = (state.cityscape[i] + vals[vi] * 0.35 * iScale) * groundY * 0.85
    const x = i * bw, bTop = groundY - bh
    const hue = (baseHue + (i % 3) * 38) % 360
    ctx.strokeStyle = `hsla(${hue},100%,60%,0.5)`; ctx.lineWidth = 1
    ctx.strokeRect(x + 1, bTop, bw - 2, bh)
  }
  ctx.restore(); ctx.globalAlpha = 1
}

// [21] prism-split (RGB channel shift)
export function drawPrismSplit(ctx: Ctx2D, vals: number[], W: number, H: number, color: string, iScale: number, doClear = true): void {
  if (doClear) ctx.clearRect(0, 0, W, H)
  const n = vals.length
  const gap = W * 0.006
  const bw = (W - gap * (n + 1)) / n
  const energy = vals.reduce((s, v) => s + v, 0) / vals.length
  const off = energy * 8 * iScale
  const baseHue = color === 'rainbow' ? -1 : hexHue(color)
  const ch: [string, number][] = baseHue < 0
    ? [['rgba(255,50,50,0.55)', -off], ['rgba(50,255,100,0.55)', 0], ['rgba(50,100,255,0.55)', off]]
    : [[`hsla(${baseHue},100%,60%,0.55)`, -off], [`hsla(${(baseHue + 120) % 360},100%,60%,0.55)`, 0], [`hsla(${(baseHue + 240) % 360},100%,60%,0.55)`, off]]
  for (const [fc, ox] of ch) {
    for (let i = 0; i < n; i++) {
      ctx.fillStyle = fc
      ctx.fillRect(gap + i * (bw + gap) + ox, H - vals[i] * H * 0.85 * iScale, bw, vals[i] * H * 0.85 * iScale)
    }
  }
}

// [22] lightning-bolt
export function drawLightningBolt(ctx: Ctx2D, vals: number[], W: number, H: number, color: string, iScale: number, doClear = true): void {
  if (doClear) ctx.clearRect(0, 0, W, H)
  const n = vals.length
  const bw = W / n
  const baseHue = color === 'rainbow' ? -1 : hexHue(color)
  ctx.lineCap = 'round'
  for (let i = 0; i < n; i++) {
    const v = vals[i] * iScale
    if (v < 0.38) continue
    const x = (i + 0.5) * bw
    const hue = baseHue < 0 ? bandHue(i, n, color) : baseHue
    const segs = 6 + Math.floor(v * 6)
    const maxDev = bw * 3 * v
    const branches = v > 0.7 ? 2 : 1
    for (let b = 0; b < branches; b++) {
      let cx2 = x + (Math.random() - 0.5) * bw * 2, cy2 = 0
      const tY = H * (0.1 + Math.random() * 0.8)
      ctx.beginPath(); ctx.moveTo(cx2, 0)
      for (let s = 1; s <= segs; s++) {
        cy2 = tY * (s / segs)
        cx2 = Math.max(0, Math.min(W, cx2 + (Math.random() - 0.5) * maxDev))
        ctx.lineTo(cx2, cy2)
      }
      ctx.strokeStyle = `hsla(${hue},100%,${b === 0 ? 90 : 70}%,${0.7 - b * 0.2})`
      ctx.lineWidth = (3 - b * 1.5) * v
      ctx.shadowColor = `hsl(${hue},100%,75%)`
      ctx.shadowBlur = 20 * v
      ctx.stroke()
    }
  }
  ctx.shadowBlur = 0
}

// [23] arcade-spectrum (pixel LED)
export function drawArcadeSpectrum(ctx: Ctx2D, vals: number[], W: number, H: number, color: string, iScale: number, doClear = true): void {
  if (doClear) ctx.clearRect(0, 0, W, H)
  const n = Math.min(vals.length, 32)
  const pw = Math.floor(W / n)
  const ph = 10
  const rows = Math.floor(H * 0.86 / ph)
  for (let col = 0; col < n; col++) {
    const vi = Math.floor(col * vals.length / n)
    const level = Math.round(vals[vi] * rows * iScale)
    const hue = bandHue(col, n, color)
    for (let row = 0; row < rows; row++) {
      const lit = (rows - row) <= level
      if (lit) {
        const t = (rows - row) / Math.max(level, 1)
        const lhue = color === 'rainbow' ? hue : (hue + t * 40) % 360
        ctx.fillStyle = `hsl(${lhue},100%,${52 + t * 32}%)`
        ctx.shadowColor = `hsl(${lhue},100%,65%)`
        ctx.shadowBlur = 4
      } else {
        ctx.fillStyle = `hsla(${hue},28%,14%,0.4)`
        ctx.shadowBlur = 0
      }
      ctx.fillRect(col * pw + 1, H * 0.07 + row * ph + 1, pw - 2, ph - 2)
    }
  }
  ctx.fillStyle = 'rgba(0,0,0,0.07)'
  for (let y = 0; y < H; y += 2) ctx.fillRect(0, y, W, 1)
  ctx.shadowBlur = 0
}

// [24] liquid-mercury
export function drawLiquidMercury(ctx: Ctx2D, vals: number[], W: number, H: number, color: string, iScale: number, state: VisState, doClear = true): void {
  if (doClear) ctx.clearRect(0, 0, W, H)
  state.phase += 0.015
  const n = vals.length
  const baseHue = color === 'rainbow' ? 210 : hexHue(color)
  const energy = vals.reduce((s, v) => s + v, 0) / vals.length
  const surfaceY = H * 0.55 - energy * H * 0.2 * iScale
  for (let layer = 2; layer >= 0; layer--) {
    const t = layer / 2
    const layerY = surfaceY + layer * H * 0.12
    const amp = H * 0.06 * (1 + layer * 0.5) * iScale
    ctx.beginPath(); ctx.moveTo(0, H); ctx.lineTo(0, layerY)
    for (let i = 0; i < n; i++) {
      const x = (i / (n - 1)) * W
      const w1 = Math.sin(x / W * Math.PI * 4 + state.phase + layer * 0.5) * amp
      const w2 = Math.sin(x / W * Math.PI * 7 - state.phase * 1.3) * amp * 0.4
      ctx.lineTo(x, layerY + w1 + w2 + vals[i] * amp * 2 * iScale)
    }
    ctx.lineTo(W, H); ctx.closePath()
    const hue = (baseHue + layer * 14) % 360
    const a = 0.5 - layer * 0.12
    const gr = ctx.createLinearGradient(0, layerY, 0, H)
    gr.addColorStop(0, `hsla(${hue},28%,84%,${a * 1.2})`)
    gr.addColorStop(0.15, `hsla(${hue},38%,62%,${a})`)
    gr.addColorStop(0.5, `hsla(${hue},48%,42%,${a * 0.9})`)
    gr.addColorStop(1, `hsla(${hue},38%,18%,${a * 0.7})`)
    ctx.fillStyle = gr; ctx.fill()
    if (layer === 0) {
      ctx.beginPath()
      for (let i = 0; i < n; i++) {
        const x = (i / (n - 1)) * W
        const w1 = Math.sin(x / W * Math.PI * 4 + state.phase) * amp
        const w2 = Math.sin(x / W * Math.PI * 7 - state.phase * 1.3) * amp * 0.4
        const y = layerY + w1 + w2 + vals[i] * amp * 2 * iScale
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
      }
      ctx.strokeStyle = `hsla(${hue},20%,90%,0.55)`
      ctx.lineWidth = 2
      ctx.shadowColor = `hsl(${hue},28%,84%)`
      ctx.shadowBlur = 8
      ctx.stroke(); ctx.shadowBlur = 0
    }
  }
}
