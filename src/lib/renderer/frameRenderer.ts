// OffscreenCanvas에 영상 한 프레임을 그리는 렌더러

import type { Background, Effects, Visualizer, Typography, Track, LogoPosition } from '../../types'

export interface DrawFrameInput {
  canvas: OffscreenCanvas
  width: number
  height: number
  frequencyData: Float32Array  // 80개 밴드
  themeGradient: [string, string]
  background: Background
  backgroundImage?: ImageBitmap
  logoImage?: ImageBitmap
  logoPosition: LogoPosition
  logoSize: number
  watermarkImage?: ImageBitmap
  stickerImages: ImageBitmap[]
  effects: Effects
  visualizer: Visualizer
  typography: Typography
  currentTrack: Track
  currentTrackIndex: number
  totalTracks: number
}

export function drawFrame(input: DrawFrameInput): void {
  const ctx = input.canvas.getContext('2d') as OffscreenCanvasRenderingContext2D
  const { width, height, frequencyData, themeGradient, effects, visualizer, typography, currentTrack, currentTrackIndex, totalTracks } = input

  // 1. 배경
  if (input.backgroundImage) {
    ctx.drawImage(input.backgroundImage, 0, 0, width, height)
  } else {
    const grad = ctx.createLinearGradient(0, 0, width, height)
    grad.addColorStop(0, themeGradient[0])
    grad.addColorStop(1, themeGradient[1])
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, width, height)
  }

  // 2. blur overlay
  if (effects.blur) {
    ctx.save()
    ctx.filter = 'blur(24px)'
    ctx.globalAlpha = 0.35
    if (input.backgroundImage) {
      ctx.drawImage(input.backgroundImage, -40, -40, width + 80, height + 80)
    } else {
      const grad = ctx.createLinearGradient(0, 0, width, height)
      grad.addColorStop(0, themeGradient[0])
      grad.addColorStop(1, themeGradient[1])
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, width, height)
    }
    ctx.restore()
  }

  // 3. 비주얼라이저
  if (effects.vis) {
    drawVisualizer(ctx, width, height, frequencyData, visualizer)
    ctx.globalAlpha = 1
  }

  // 4. 타이포그래피
  const cx = width / 2
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  const titlePx = Math.round(typography.titleSize * (width / 1920))
  ctx.font = `700 ${titlePx}px "Inter", sans-serif`
  ctx.strokeStyle = 'rgba(0,0,0,0.5)'
  ctx.lineWidth = Math.max(2, titlePx * 0.06)
  ctx.shadowColor = 'rgba(0,0,0,0.6)'
  ctx.shadowBlur = Math.round(titlePx * 0.25)
  ctx.shadowOffsetY = Math.round(titlePx * 0.08)
  ctx.lineJoin = 'round'
  ctx.strokeText(currentTrack.title, cx, height * 0.48)
  ctx.fillStyle = 'rgba(255,255,255,0.9)'
  ctx.fillText(currentTrack.title, cx, height * 0.48)
  ctx.shadowColor = 'transparent'
  ctx.shadowBlur = 0
  ctx.shadowOffsetY = 0

  const subPx = Math.round(18 * (width / 1920))
  ctx.font = `400 ${subPx}px "Inter", sans-serif`
  ctx.fillStyle = 'rgba(255,255,255,0.6)'
  const artistPrefix = currentTrack.artist && currentTrack.artist !== 'Unknown' ? `${currentTrack.artist} · ` : ''
  ctx.fillText(
    `${artistPrefix}Track ${String(currentTrackIndex + 1).padStart(2, '0')} / ${totalTracks}`,
    cx,
    height * 0.55,
  )

  // 5. 로고
  if (input.logoImage) {
    const canvasLogoSize = Math.round(input.logoSize * (width / 640))
    const lx = Math.round((input.logoPosition.x / 100) * width) - canvasLogoSize / 2
    const ly = Math.round((input.logoPosition.y / 100) * height) - canvasLogoSize / 2
    ctx.globalAlpha = 1
    ctx.drawImage(input.logoImage, lx, ly, canvasLogoSize, canvasLogoSize)
  }

  // 6. 워터마크
  if (input.watermarkImage) {
    const wSize = Math.round(80 * (width / 1920))
    ctx.globalAlpha = 0.6
    ctx.drawImage(input.watermarkImage, width - wSize - 40, height - wSize - 40, wSize, wSize)
    ctx.globalAlpha = 1
  }

  // 7. 스티커
  input.stickerImages.forEach((img, i) => {
    const sSize = Math.round(70 * (width / 1920))
    ctx.globalAlpha = 1
    ctx.drawImage(img, width - (i + 1) * (sSize + 12) - 40, 40, sSize, sSize)
  })
}

function rainbowColor(i: number, total: number, energy: number): string {
  const hue = (i / Math.max(total - 1, 1)) * 240
  const lightness = 50 + energy * 30
  return `hsl(${hue}, 100%, ${lightness}%)`
}

function energyColor(energy: number): string {
  return `hsl(${energy * 240}, 100%, ${50 + energy * 30}%)`
}

function energyColorAlpha(energy: number, alpha: number): string {
  return `hsla(${energy * 240}, 100%, ${50 + energy * 30}%, ${alpha})`
}

function drawVisualizer(
  ctx: OffscreenCanvasRenderingContext2D,
  width: number,
  height: number,
  frequencyData: Float32Array,
  visualizer: Visualizer,
): void {
  const opacity = visualizer.opacity / 100
  const intensity = visualizer.intensity / 100
  const sizeScale = visualizer.size / 50
  const yCenter = height * (visualizer.y / 100)
  const cx = width / 2

  const energy = frequencyData.reduce((s, v) => s + v, 0) / Math.max(frequencyData.length, 1)
  const glowPx = energy * intensity * 40

  ctx.globalAlpha = opacity

  if (visualizer.type === 'bars') {
    const numBars = frequencyData.length
    const barW = width / numBars
    const maxH = height * 0.45 * sizeScale
    for (let i = 0; i < numBars; i++) {
      const rc = rainbowColor(i, numBars, energy)
      ctx.shadowBlur = glowPx
      ctx.shadowColor = rc
      ctx.fillStyle = rc
      const barH = frequencyData[i] * intensity * maxH
      ctx.fillRect(i * barW, yCenter - barH, barW - 1, barH)
    }
  } else if (visualizer.type === 'waveform') {
    const maxH = height * 0.38 * sizeScale
    const step = width / frequencyData.length
    const ec = energyColor(energy)
    ctx.shadowBlur = glowPx
    ctx.shadowColor = ec
    ctx.beginPath()
    ctx.moveTo(0, yCenter)
    for (let i = 0; i < frequencyData.length; i++) {
      ctx.lineTo(i * step, yCenter - frequencyData[i] * intensity * maxH)
    }
    ctx.lineTo(width, yCenter)
    ctx.closePath()
    const wfGrad = ctx.createLinearGradient(0, yCenter - maxH, 0, yCenter)
    wfGrad.addColorStop(0, energyColorAlpha(energy, 0.7))
    wfGrad.addColorStop(1, energyColorAlpha(energy, 0.02))
    ctx.fillStyle = wfGrad
    ctx.fill()
    ctx.beginPath()
    for (let i = 0; i < frequencyData.length; i++) {
      const x = i * step, y = yCenter - frequencyData[i] * intensity * maxH
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.strokeStyle = ec
    ctx.lineWidth = Math.max(1, width / 1920)
    ctx.globalAlpha = opacity * 0.9
    ctx.stroke()
  } else if (visualizer.type === 'led') {
    const cols = 20, rows = 8
    const colW = width / cols
    const gridH = height * 0.35 * sizeScale
    const rowH = gridH / rows
    const gridTop = yCenter - gridH / 2
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const h = frequencyData[Math.floor(col * frequencyData.length / cols)]
        const isActive = (rows - 1 - row) / rows < h * intensity
        const rc = rainbowColor(col, cols, energy)
        ctx.shadowBlur = isActive ? glowPx : 0
        ctx.shadowColor = rc
        ctx.fillStyle = isActive ? rc : 'rgba(255,255,255,0.05)'
        ctx.fillRect(col * colW + 2, gridTop + row * rowH + 2, colW - 4, rowH - 4)
      }
    }
  } else if (visualizer.type === 'circular') {
    const unit = Math.min(width, height)
    const innerR = unit * 0.07 * sizeScale
    const maxOutR = unit * 0.25 * sizeScale
    ctx.lineWidth = 1.5 * (width / 1920)
    ctx.globalAlpha = opacity * 0.85
    for (let i = 0; i < frequencyData.length; i++) {
      const angle = (i / frequencyData.length) * 2 * Math.PI - Math.PI / 2
      const barLen = frequencyData[i] * intensity * maxOutR
      const cos = Math.cos(angle), sin = Math.sin(angle)
      const rc = rainbowColor(i, frequencyData.length, energy)
      ctx.strokeStyle = rc
      ctx.shadowBlur = glowPx
      ctx.shadowColor = rc
      ctx.beginPath()
      ctx.moveTo(cx + cos * innerR, yCenter + sin * innerR)
      ctx.lineTo(cx + cos * (innerR + barLen), yCenter + sin * (innerR + barLen))
      ctx.stroke()
    }
  } else if (visualizer.type === 'burst') {
    const unit = Math.min(width, height)
    const maxR = unit * 0.35 * sizeScale
    ctx.lineWidth = 2 * (width / 1920)
    ctx.globalAlpha = opacity * 0.8
    const sparseData = frequencyData.filter((_, i) => i % 2 === 0)
    for (let i = 0; i < sparseData.length; i++) {
      const angle = (i / sparseData.length) * 2 * Math.PI
      const r = sparseData[i] * intensity * maxR + 4 * (width / 1920)
      const rc = rainbowColor(i, sparseData.length, energy)
      ctx.strokeStyle = rc
      ctx.shadowBlur = glowPx
      ctx.shadowColor = rc
      ctx.beginPath()
      ctx.moveTo(cx, yCenter)
      ctx.lineTo(cx + Math.cos(angle) * r, yCenter + Math.sin(angle) * r)
      ctx.stroke()
    }
  } else if (visualizer.type === 'tunnel') {
    const unit = Math.min(width, height)
    const scales = [1, 0.72, 0.5, 0.32, 0.18]
    ctx.lineWidth = 1.5 * (width / 1920)
    const ec = energyColor(energy)
    ctx.strokeStyle = ec
    for (let i = 0; i < scales.length; i++) {
      const bandH = frequencyData[Math.floor(i * frequencyData.length / 5)]
      const w = (scales[i] * unit * 0.4 + bandH * intensity * unit * 0.08) * sizeScale
      ctx.globalAlpha = opacity * (0.9 - i * 0.13)
      ctx.shadowBlur = glowPx
      ctx.shadowColor = ec
      ctx.strokeRect(cx - w, yCenter - w, w * 2, w * 2)
    }
  } else if (visualizer.type === 'mirror') {
    const numBars = frequencyData.length
    const barW = width / numBars
    const maxH = height * 0.22 * sizeScale
    for (let i = 0; i < numBars; i++) {
      const rc = rainbowColor(i, numBars, energy)
      ctx.fillStyle = rc
      ctx.shadowBlur = glowPx
      ctx.shadowColor = rc
      ctx.globalAlpha = opacity * 0.8
      const barH = frequencyData[i] * intensity * maxH
      ctx.fillRect(i * barW, yCenter - barH, barW - 1, barH * 2)
    }
  } else if (visualizer.type === 'scope') {
    const maxH = height * 0.3 * sizeScale
    const ec = energyColor(energy)
    ctx.strokeStyle = ec
    ctx.shadowBlur = glowPx
    ctx.shadowColor = ec
    ctx.lineWidth = 1.5 * (width / 1920)
    ctx.globalAlpha = opacity * 0.9
    ctx.beginPath()
    for (let i = 0; i < frequencyData.length; i++) {
      const x = (i / frequencyData.length) * width
      const y = yCenter - Math.sin(i * 0.3) * frequencyData[i] * intensity * maxH
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.stroke()
  } else if (visualizer.type === 'rain') {
    const cols = 24
    const colW = width / cols
    const dotR = Math.max(2, width / 960)
    for (let col = 0; col < cols; col++) {
      const h = frequencyData[Math.floor(col * frequencyData.length / cols)]
      const dotCount = Math.max(1, Math.floor(h * intensity * 12))
      const rc = rainbowColor(col, cols, energy)
      ctx.fillStyle = rc
      ctx.shadowBlur = glowPx
      ctx.shadowColor = rc
      for (let dot = 0; dot < dotCount; dot++) {
        ctx.globalAlpha = opacity * (1 - dot * 0.07)
        ctx.beginPath()
        ctx.arc(col * colW + colW / 2, yCenter - dot * dotR * 2.5, dotR, 0, 2 * Math.PI)
        ctx.fill()
      }
    }
  } else if (visualizer.type === 'galaxy') {
    const unit = Math.min(width, height)
    for (let i = 0; i < frequencyData.length; i++) {
      const angle = (i / frequencyData.length) * 2 * Math.PI
      const r = (unit * 0.12 + frequencyData[i] * intensity * unit * 0.22) * sizeScale
      const dotR = frequencyData[i] * intensity * unit * 0.02 * sizeScale + unit * 0.003
      const rc = rainbowColor(i, frequencyData.length, energy)
      ctx.fillStyle = rc
      ctx.shadowBlur = glowPx
      ctx.shadowColor = rc
      ctx.globalAlpha = opacity * (0.5 + frequencyData[i] * 0.5)
      ctx.beginPath()
      ctx.arc(cx + Math.cos(angle) * r, yCenter + Math.sin(angle) * r, dotR, 0, 2 * Math.PI)
      ctx.fill()
    }
  } else if (visualizer.type === 'prism') {
    const unit = Math.min(width, height)
    const count = 20
    for (let i = 0; i < count; i++) {
      const h = frequencyData[Math.floor(i * frequencyData.length / count)]
      const a1 = (i / count) * 2 * Math.PI
      const a2 = ((i + 0.7) / count) * 2 * Math.PI
      const r = (h * intensity * unit * 0.35 + unit * 0.02) * sizeScale
      const rc = rainbowColor(i, count, energy)
      ctx.fillStyle = rc
      ctx.shadowBlur = glowPx
      ctx.shadowColor = rc
      ctx.globalAlpha = opacity * (0.35 + h * 0.55)
      ctx.beginPath()
      ctx.moveTo(cx, yCenter)
      ctx.lineTo(cx + Math.cos(a1) * r, yCenter + Math.sin(a1) * r)
      ctx.lineTo(cx + Math.cos(a2) * r, yCenter + Math.sin(a2) * r)
      ctx.closePath()
      ctx.fill()
    }
  } else if (visualizer.type === 'pulse') {
    const unit = Math.min(width, height)
    ctx.lineWidth = 1.5 * (width / 1920)
    const ec = energyColor(energy)
    ctx.strokeStyle = ec
    for (let ring = 0; ring < 4; ring++) {
      const bandH = frequencyData[Math.floor(ring * frequencyData.length / 4)]
      const r = (ring * unit * 0.08 + bandH * intensity * unit * 0.07 + unit * 0.03) * sizeScale
      ctx.globalAlpha = opacity * (0.8 - ring * 0.15)
      ctx.shadowBlur = glowPx
      ctx.shadowColor = ec
      ctx.beginPath()
      ctx.arc(cx, yCenter, r, 0, 2 * Math.PI)
      ctx.stroke()
    }
  }

  ctx.shadowBlur = 0
  ctx.shadowColor = 'transparent'
  ctx.globalAlpha = 1
}

export async function loadImageBitmap(url: string): Promise<ImageBitmap> {
  const resp = await fetch(url)
  const blob = await resp.blob()
  return createImageBitmap(blob)
}
