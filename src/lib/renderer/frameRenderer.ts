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
  const titleX = Math.round((typography.titlePosition.x / 100) * width)
  const titleY = Math.round((typography.titlePosition.y / 100) * height)
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
  ctx.strokeText(currentTrack.title, titleX, titleY)
  ctx.fillStyle = 'rgba(255,255,255,0.9)'
  ctx.fillText(currentTrack.title, titleX, titleY)
  ctx.shadowColor = 'transparent'
  ctx.shadowBlur = 0
  ctx.shadowOffsetY = 0

  const subX = Math.round((typography.subPosition.x / 100) * width)
  const subY = Math.round((typography.subPosition.y / 100) * height)
  const subPx = Math.round(18 * (width / 1920))
  ctx.font = `400 ${subPx}px "Inter", sans-serif`
  ctx.fillStyle = 'rgba(255,255,255,0.6)'
  const artistPrefix = currentTrack.artist && currentTrack.artist !== 'Unknown' ? `${currentTrack.artist} · ` : ''
  ctx.fillText(
    `${artistPrefix}Track ${String(currentTrackIndex + 1).padStart(2, '0')} / ${totalTracks}`,
    subX,
    subY,
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

function hexHue(hex: string): number {
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  if (max === min) return 0
  const d = max - min
  const h = max === r ? ((g - b) / d + (g < b ? 6 : 0))
          : max === g ? (b - r) / d + 2
          : (r - g) / d + 4
  return h * 60
}

function barHue(i: number, total: number, color: string): number {
  return color === 'rainbow'
    ? (i / Math.max(total - 1, 1)) * 240
    : hexHue(color) + (i / Math.max(total - 1, 1) - 0.5) * 40
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
  const visW = Math.round(width * (Math.max(10, visualizer.width) / 100))
  const visX = (width - visW) / 2

  const energy = frequencyData.reduce((s, v) => s + v, 0) / Math.max(frequencyData.length, 1)
  const maxH = height * 0.42 * sizeScale

  ctx.globalAlpha = opacity

  if (visualizer.type === 'bars' || visualizer.type === 'particle') {
    const numBars = frequencyData.length
    const barW = visW / numBars
    for (let i = 0; i < numBars; i++) {
      const hue = barHue(i, numBars, visualizer.color)
      const c = `hsl(${hue}, 100%, ${50 + energy * 30}%)`
      ctx.shadowBlur = energy * intensity * 40
      ctx.shadowColor = c
      ctx.fillStyle = c
      const barH = frequencyData[i] * intensity * maxH
      ctx.fillRect(visX + i * barW, yCenter - barH, barW - 1, barH)
    }
  } else if (visualizer.type === 'glow') {
    const bins = 28
    const barW = visW / bins
    for (let i = 0; i < bins; i++) {
      const fd = frequencyData[Math.floor(i * frequencyData.length / bins)] ?? 0
      const barH = Math.max(2, fd * intensity * maxH)
      const hue = barHue(i, bins, visualizer.color)
      ctx.save()
      ctx.shadowColor = `hsl(${hue}, 100%, 65%)`
      ctx.shadowBlur = fd * intensity * 40 + 5
      const grad = ctx.createLinearGradient(0, yCenter - barH, 0, yCenter)
      grad.addColorStop(0, `hsl(${hue}, 100%, 78%)`)
      grad.addColorStop(0.55, `hsl(${hue}, 90%, 55%)`)
      grad.addColorStop(1, `hsl(${hue}, 80%, 38%)`)
      ctx.fillStyle = grad
      ctx.fillRect(visX + i * barW + barW * 0.08, yCenter - barH, barW * 0.84, barH)
      ctx.restore()
    }
  } else if (visualizer.type === 'peak') {
    const bins = 40
    const barW = visW / bins
    const lineH = Math.max(2, Math.round(2 * (height / 1080)))
    for (let i = 0; i < bins; i++) {
      const fd = frequencyData[Math.floor(i * frequencyData.length / bins)] ?? 0
      const barH = Math.max(2, fd * intensity * maxH)
      const hue = barHue(i, bins, visualizer.color)
      ctx.fillStyle = `hsla(${hue}, 70%, 42%, 0.55)`
      ctx.fillRect(visX + i * barW + barW * 0.1, yCenter - barH, barW * 0.8, barH)
      ctx.save()
      ctx.shadowColor = `hsl(${hue}, 100%, 70%)`
      ctx.shadowBlur = 6
      ctx.fillStyle = `hsl(${hue}, 100%, 82%)`
      ctx.fillRect(visX + i * barW + barW * 0.1, yCenter - barH, barW * 0.8, lineH)
      ctx.restore()
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
