// 파티클 오버레이 상태 관리 및 렌더링 — 라이브 프리뷰·영상 출력 공용

import type { ParticleOverlay } from '../../types'

export interface Particle {
  x: number; y: number; vx: number; vy: number
  r: number; angle: number; life: number; opacity: number
}

export interface ParticleOverlayState {
  particles: Particle[]
  t: number
}

// 시드 기반 의사난수 — 파티클 초기 배치 재현성
function sr(seed: number): number {
  const x = Math.sin(seed + 0.1) * 43758.5453
  return x - Math.floor(x)
}

function hexHue(hex: string): number {
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  if (max === min) return 0
  const d = max - min
  const h = max === r ? (g - b) / d + (g < b ? 6 : 0)
          : max === g ? (b - r) / d + 2
          : (r - g) / d + 4
  return h * 60
}

export function createParticleOverlayState(overlay: ParticleOverlay): ParticleOverlayState {
  const sparkly = ['sparkle', 'firefly', 'stars', 'dust', 'neon'].includes(overlay.type)
  const count = Math.round((sparkly ? 50 : 30) + overlay.intensity * (sparkly ? 2.5 : 1.7))
  const sp0 = overlay.speed / 100
  const particles: Particle[] = Array.from({ length: count }, (_, i) => ({
    x: sr(i * 17),
    y: sr(i * 17 + 1),
    vx: (sr(i * 17 + 2) - 0.5) * 0.004 * sp0,
    vy: (sr(i * 17 + 3) - 0.5) * 0.004 * sp0,
    r: sr(i * 17 + 4) * 0.8 + 0.2,
    angle: sr(i * 17 + 5) * Math.PI * 2,
    life: sr(i * 17 + 6),
    opacity: sr(i * 17 + 7),
  }))
  return { particles, t: 0 }
}

// dt: 프레임 간격(초) — 라이브=0.016(≈60fps), 영상=1/30
export function tickParticleOverlay(
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  state: ParticleOverlayState,
  overlay: ParticleOverlay,
  W: number,
  H: number,
  dt = 0.016,
): void {
  state.t += dt
  const t = state.t
  const sp = overlay.speed / 100
  // 캔버스 크기에 비례해 파티클 크기 스케일 (360p 기준)
  const sz = (overlay.size / 50) * (Math.min(W, H) / 360)
  const baseOpacity = overlay.opacity / 100
  const color = overlay.color
  const type = overlay.type

  state.particles.forEach(p => {
    const hue = color === 'rainbow'
      ? (p.x * 300 + t * 20) % 360
      : hexHue(color)
    const alpha = p.opacity * baseOpacity

    switch (type) {
      case 'snow': {
        p.x += Math.sin(t + p.y * 10) * 0.001 * sp
        p.y += (0.003 + p.r * 0.002) * sp
        if (p.y > 1) { p.y = -0.02; p.x = Math.random() }
        const snowR = (p.r * 4 + 1) * sz
        ctx.save()
        ctx.globalAlpha = alpha
        ctx.fillStyle = color === 'rainbow' ? `hsl(${hue},60%,95%)` : `hsl(${hue},40%,90%)`
        ctx.beginPath()
        ctx.arc(p.x * W, p.y * H, snowR, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
        break
      }
      case 'sparkle': {
        p.life += 0.04 * sp
        if (p.life > 1) { p.life = 0; p.x = Math.random(); p.y = Math.random() }
        const sparkleAlpha = Math.sin(p.life * Math.PI) * alpha
        const sparkR = (p.r * 5 + 1) * sz
        ctx.save()
        ctx.globalAlpha = sparkleAlpha
        ctx.shadowColor = `hsl(${hue},100%,80%)`
        ctx.shadowBlur = sparkR * 3
        ctx.fillStyle = `hsl(${hue},100%,90%)`
        ctx.beginPath()
        ctx.arc(p.x * W, p.y * H, sparkR, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
        break
      }
      case 'firefly': {
        p.x += Math.sin(t * 1.3 + p.r * 5) * 0.002 * sp
        p.y += Math.cos(t * 0.9 + p.r * 7) * 0.002 * sp
        p.x = (p.x + 1) % 1
        p.y = (p.y + 1) % 1
        p.opacity = 0.4 + Math.sin(t * 2 + p.r * 4) * 0.4
        const ffR = (p.r * 3 + 1.5) * sz
        ctx.save()
        ctx.globalAlpha = p.opacity * baseOpacity
        ctx.shadowColor = `hsl(${hue},100%,70%)`
        ctx.shadowBlur = ffR * 4
        ctx.fillStyle = `hsl(${hue},100%,80%)`
        ctx.beginPath()
        ctx.arc(p.x * W, p.y * H, ffR, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
        break
      }
      case 'stars': {
        p.opacity = 0.2 + Math.abs(Math.sin(t * (0.5 + p.r * 0.8) + p.r * 3)) * 0.8
        const starR = (p.r * 3 + 0.5) * sz
        const starAngle = p.angle - Math.PI / 2
        ctx.save()
        ctx.globalAlpha = p.opacity * baseOpacity
        ctx.fillStyle = color === 'rainbow' ? `hsl(${hue},80%,95%)` : `hsl(${hue},60%,90%)`
        ctx.beginPath()
        for (let pi = 0; pi < 10; pi++) {
          const ang = (pi / 10) * Math.PI * 2 + starAngle
          const rad = pi % 2 === 0 ? starR : starR * 0.4
          ctx.lineTo(p.x * W + Math.cos(ang) * rad, p.y * H + Math.sin(ang) * rad)
        }
        ctx.closePath()
        ctx.fill()
        ctx.restore()
        break
      }
      case 'petals': {
        p.y += (0.002 + p.r * 0.001) * sp
        p.x += Math.sin(t * 1.5 + p.r * 5) * 0.001 * sp
        p.angle += 0.015 * sp
        if (p.y > 1.05) { p.y = -0.05; p.x = Math.random() }
        const pw = (p.r * 8 + 4) * sz, ph = pw * 0.55
        ctx.save()
        ctx.globalAlpha = alpha
        ctx.translate(p.x * W, p.y * H)
        ctx.rotate(p.angle)
        ctx.fillStyle = color === 'rainbow' ? `hsl(${hue},80%,75%)` : `hsl(${hue},70%,72%)`
        ctx.beginPath()
        ctx.ellipse(0, 0, pw, ph, 0, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
        break
      }
      case 'dust': {
        p.y -= (0.001 + p.r * 0.0005) * sp
        p.x += Math.sin(t + p.r * 3) * 0.0005 * sp
        if (p.y < -0.02) { p.y = 1.02; p.x = Math.random() }
        const dustR = (p.r * 1.5 + 0.5) * sz
        ctx.save()
        ctx.globalAlpha = alpha * 0.7
        ctx.shadowColor = `hsl(${hue},100%,85%)`
        ctx.shadowBlur = 3
        ctx.fillStyle = `hsl(${hue},80%,85%)`
        ctx.beginPath()
        ctx.arc(p.x * W, p.y * H, dustR, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
        break
      }
      case 'smoke': {
        p.y -= (0.001 + p.r * 0.0008) * sp
        p.x += (Math.random() - 0.5) * 0.0005 * sp
        p.r = Math.min(p.r + 0.003 * sp, 1.5)
        p.opacity = Math.max(0, p.opacity - 0.004 * sp)
        if (p.opacity <= 0 || p.y < -0.15) {
          p.y = 1.05; p.x = 0.3 + Math.random() * 0.4
          p.r = Math.random() * 0.4 + 0.1; p.opacity = Math.random() * 0.4 + 0.2
        }
        const smokeR = (p.r * 30 + 10) * sz
        ctx.save()
        ctx.globalAlpha = p.opacity * baseOpacity * 0.5
        ctx.fillStyle = color === 'rainbow' ? `hsl(${hue},20%,85%)` : `hsl(${hue},10%,80%)`
        ctx.beginPath()
        ctx.arc(p.x * W, p.y * H, smokeR, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
        break
      }
      case 'bubbles': {
        p.y -= (0.002 + p.r * 0.001) * sp
        p.x += Math.sin(t * 2 + p.r * 6) * 0.0008 * sp
        if (p.y < -0.02) { p.y = 1.02; p.x = Math.random() }
        const bubR = (p.r * 10 + 3) * sz
        ctx.save()
        ctx.globalAlpha = alpha * 0.7
        ctx.strokeStyle = color === 'rainbow' ? `hsl(${hue},80%,80%)` : `hsl(${hue},60%,75%)`
        ctx.lineWidth = 1.2
        ctx.beginPath()
        ctx.arc(p.x * W, p.y * H, bubR, 0, Math.PI * 2)
        ctx.stroke()
        ctx.globalAlpha = alpha * 0.15
        ctx.fillStyle = color === 'rainbow' ? `hsl(${hue},60%,85%)` : `hsl(${hue},40%,80%)`
        ctx.fill()
        ctx.restore()
        break
      }
      case 'rain': {
        p.y += (0.015 + p.r * 0.01) * sp
        p.x += (0.002 + p.r * 0.001) * sp
        if (p.y > 1.02) { p.y = -0.02 - Math.random() * 0.3; p.x = Math.random() }
        const rainLen = (8 + p.r * 6) * sz
        const rx = p.x * W, ry = p.y * H
        ctx.save()
        ctx.globalAlpha = alpha * 0.7
        ctx.strokeStyle = color === 'rainbow' ? `hsl(${hue},60%,80%)` : `hsl(${hue},50%,75%)`
        ctx.lineWidth = (0.8 + p.r * 0.4) * sz
        ctx.beginPath()
        ctx.moveTo(rx, ry)
        ctx.lineTo(rx + rainLen * 0.2, ry + rainLen)
        ctx.stroke()
        ctx.restore()
        break
      }
      case 'sparks': {
        p.vy += 0.0003 * sp
        p.y += p.vy
        p.x += p.vx
        p.life -= 0.02 * sp
        if (p.life <= 0) {
          p.x = 0.3 + Math.random() * 0.4
          p.y = 0.6 + Math.random() * 0.3
          p.vx = (Math.random() - 0.5) * 0.012 * sp
          p.vy = -(Math.random() * 0.015 + 0.005) * sp
          p.life = 0.5 + Math.random() * 0.5
        }
        const sparkAlpha = p.life * alpha
        ctx.save()
        ctx.globalAlpha = sparkAlpha
        ctx.strokeStyle = color === 'rainbow' ? `hsl(${hue},100%,80%)` : `hsl(${hue},90%,75%)`
        ctx.lineWidth = (1 + p.r) * sz
        ctx.beginPath()
        ctx.moveTo(p.x * W, p.y * H)
        ctx.lineTo((p.x - p.vx * 8) * W, (p.y - p.vy * 8) * H)
        ctx.stroke()
        ctx.restore()
        break
      }
      case 'confetti': {
        p.vy += 0.00008 * sp
        p.y += p.vy
        p.x += Math.sin(t * 1.2 + p.r * 5) * 0.001 * sp
        p.angle += (p.r - 0.5) * 0.1 * sp
        if (p.y > 1.05) {
          p.y = -0.05; p.x = Math.random()
          p.vy = (0.003 + p.r * 0.004) * sp
          p.angle = Math.random() * Math.PI * 2
        }
        const cw = (p.r * 9 + 4) * sz, ch = cw * 0.45
        ctx.save()
        ctx.globalAlpha = alpha
        ctx.translate(p.x * W, p.y * H)
        ctx.rotate(p.angle)
        ctx.fillStyle = color === 'rainbow' ? `hsl(${hue},90%,65%)` : `hsl(${hue},80%,60%)`
        ctx.fillRect(-cw / 2, -ch / 2, cw, ch)
        ctx.restore()
        break
      }
      case 'bokeh': {
        p.y -= (0.0004 + p.r * 0.0002) * sp
        p.x += Math.sin(t * 0.4 + p.r * 3) * 0.0002 * sp
        if (p.y < -0.2) { p.y = 1.1; p.x = Math.random() }
        const bokR = (p.r * 55 + 18) * sz
        ctx.save()
        ctx.globalAlpha = alpha * 0.18
        const rg = ctx.createRadialGradient(p.x * W, p.y * H, 0, p.x * W, p.y * H, bokR)
        rg.addColorStop(0, color === 'rainbow' ? `hsl(${hue},70%,85%)` : `hsl(${hue},55%,80%)`)
        rg.addColorStop(1, 'transparent')
        ctx.fillStyle = rg
        ctx.beginPath()
        ctx.arc(p.x * W, p.y * H, bokR, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
        break
      }
      case 'hearts': {
        p.y -= (0.003 + p.r * 0.002) * sp
        p.x += Math.sin(t * 1.1 + p.r * 4) * 0.001 * sp
        p.life += 0.009 * sp
        if (p.life > 1 || p.y < -0.06) {
          p.y = 0.88 + Math.random() * 0.15; p.x = Math.random(); p.life = 0
        }
        const heartAlpha = Math.sin(Math.min(p.life * Math.PI, Math.PI)) * alpha
        const hs = (p.r * 9 + 4) * sz
        ctx.save()
        ctx.globalAlpha = heartAlpha
        ctx.fillStyle = color === 'rainbow' ? `hsl(${hue},80%,72%)` : `hsl(${hue},70%,67%)`
        ctx.translate(p.x * W, p.y * H)
        ctx.beginPath()
        ctx.moveTo(0, -hs * 0.35)
        ctx.bezierCurveTo(-hs * 0.5, -hs * 0.9, -hs, -hs * 0.2, 0, hs * 0.5)
        ctx.bezierCurveTo(hs, -hs * 0.2, hs * 0.5, -hs * 0.9, 0, -hs * 0.35)
        ctx.closePath()
        ctx.fill()
        ctx.restore()
        break
      }
      case 'ripple': {
        p.life += 0.012 * sp
        if (p.life > 1) { p.life = 0; p.x = Math.random(); p.y = Math.random() }
        const ripR = (p.r * 80 + 20) * p.life * sz
        const ripAlpha = (1 - p.life) * alpha * 0.7
        ctx.save()
        ctx.globalAlpha = ripAlpha
        ctx.strokeStyle = color === 'rainbow' ? `hsl(${hue},65%,75%)` : `hsl(${hue},50%,70%)`
        ctx.lineWidth = Math.max(0.5, (1.8 - p.life * 1.5)) * sz
        ctx.beginPath()
        ctx.arc(p.x * W, p.y * H, Math.max(1, ripR), 0, Math.PI * 2)
        ctx.stroke()
        ctx.restore()
        break
      }
      case 'neon': {
        p.life += 0.02 * sp
        if (p.life > 1) {
          p.life = 0; p.x = Math.random(); p.y = Math.random()
          p.angle = Math.random() * Math.PI * 2
        }
        const nAlpha = Math.sin(p.life * Math.PI) * alpha
        const lineLen = (p.r * 35 + 12) * sz
        const dx = Math.cos(p.angle), dy = Math.sin(p.angle)
        p.x += dx * 0.0008 * sp
        p.y += dy * 0.0008 * sp
        ctx.save()
        ctx.globalAlpha = nAlpha
        ctx.shadowColor = color === 'rainbow' ? `hsl(${hue},100%,70%)` : `hsl(${hue},90%,65%)`
        ctx.shadowBlur = 8 * sz
        ctx.strokeStyle = color === 'rainbow' ? `hsl(${hue},100%,82%)` : `hsl(${hue},90%,77%)`
        ctx.lineWidth = (1 + p.r * 1.5) * sz
        ctx.lineCap = 'round'
        ctx.beginPath()
        ctx.moveTo(p.x * W - dx * lineLen / 2, p.y * H - dy * lineLen / 2)
        ctx.lineTo(p.x * W + dx * lineLen / 2, p.y * H + dy * lineLen / 2)
        ctx.stroke()
        ctx.restore()
        break
      }
      case 'comets': {
        if (Math.abs(p.vx) < 0.003) {
          p.x = -0.05; p.y = Math.random()
          p.vx = (0.013 + p.r * 0.01) * sp
          p.vy = (Math.random() - 0.5) * 0.004 * sp
        }
        p.x += p.vx; p.y += p.vy
        if (p.x > 1.1) {
          p.x = -0.05; p.y = Math.random()
          p.vx = (0.013 + p.r * 0.01) * sp
          p.vy = (Math.random() - 0.5) * 0.004 * sp
        }
        const tailLen = (p.r * 65 + 30) * sz
        const spd = Math.sqrt(p.vx ** 2 + p.vy ** 2)
        const ndx = spd > 0 ? -p.vx / spd : -1
        const ndy = spd > 0 ? -p.vy / spd : 0
        const cx2 = p.x * W, cy2 = p.y * H
        ctx.save()
        const cg = ctx.createLinearGradient(cx2, cy2, cx2 + ndx * tailLen, cy2 + ndy * tailLen)
        cg.addColorStop(0, color === 'rainbow' ? `hsl(${hue},100%,95%)` : `hsl(${hue},80%,90%)`)
        cg.addColorStop(1, color === 'rainbow' ? `hsla(${hue},80%,70%,0)` : `hsla(${hue},60%,65%,0)`)
        ctx.globalAlpha = alpha
        ctx.strokeStyle = cg
        ctx.lineWidth = (1.5 + p.r * 2) * sz
        ctx.lineCap = 'round'
        ctx.beginPath()
        ctx.moveTo(cx2, cy2)
        ctx.lineTo(cx2 + ndx * tailLen, cy2 + ndy * tailLen)
        ctx.stroke()
        ctx.shadowColor = color === 'rainbow' ? `hsl(${hue},100%,90%)` : `hsl(${hue},80%,85%)`
        ctx.shadowBlur = 10 * sz
        ctx.fillStyle = 'white'
        ctx.beginPath()
        ctx.arc(cx2, cy2, (1.2 + p.r * 1.5) * sz, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
        break
      }
    }
  })
}
