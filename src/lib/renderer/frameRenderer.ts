// OffscreenCanvas에 영상 한 프레임을 그리는 렌더러

import type { Background, Effects, Visualizer, Typography, Track } from '../../types'

export interface DrawFrameInput {
  canvas: OffscreenCanvas
  width: number
  height: number
  frequencyData: Float32Array  // 80개 밴드
  themeGradient: [string, string]
  background: Background
  backgroundImage?: ImageBitmap
  logoImage?: ImageBitmap
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
  }

  // 4. 타이포그래피
  const cx = width / 2
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = 'rgba(255,255,255,0.9)'
  const titlePx = Math.round(typography.titleSize * (width / 1920))
  ctx.font = `700 ${titlePx}px "Inter", sans-serif`
  ctx.fillText(currentTrack.title, cx, height * 0.48)

  const subPx = Math.round(18 * (width / 1920))
  ctx.font = `400 ${subPx}px "Inter", sans-serif`
  ctx.fillStyle = 'rgba(255,255,255,0.6)'
  ctx.fillText(
    `${currentTrack.artist} · Track ${String(currentTrackIndex + 1).padStart(2, '0')} / ${totalTracks}`,
    cx,
    height * 0.55,
  )

  // 5. 로고
  if (input.logoImage) {
    const logoSize = Math.round(64 * (width / 1920))
    ctx.globalAlpha = 1
    ctx.drawImage(input.logoImage, 40, 40, logoSize, logoSize)
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

function drawVisualizer(
  ctx: OffscreenCanvasRenderingContext2D,
  width: number,
  height: number,
  frequencyData: Float32Array,
  visualizer: Visualizer,
): void {
  const opacity = visualizer.opacity / 100
  const intensity = visualizer.intensity / 100

  if (visualizer.type === 'bars') {
    const numBars = frequencyData.length
    const barW = width / numBars
    ctx.globalAlpha = opacity
    ctx.fillStyle = 'rgba(255,255,255,0.7)'
    for (let i = 0; i < numBars; i++) {
      const barH = frequencyData[i] * intensity * height * 0.45
      ctx.fillRect(i * barW, height - barH, barW - 1, barH)
    }
    ctx.globalAlpha = 1
  } else if (visualizer.type === 'wave') {
    ctx.globalAlpha = opacity
    ctx.beginPath()
    ctx.strokeStyle = 'rgba(255,255,255,0.8)'
    ctx.lineWidth = 2 * (width / 1920)
    const step = width / frequencyData.length
    for (let i = 0; i < frequencyData.length; i++) {
      const y = height / 2 - frequencyData[i] * intensity * height * 0.4
      if (i === 0) ctx.moveTo(0, y)
      else ctx.lineTo(i * step, y)
    }
    ctx.stroke()
    ctx.globalAlpha = 1
  } else if (visualizer.type === 'orb') {
    const cx = width / 2, cy = height / 2
    const energy = frequencyData.reduce((a, v) => a + v, 0) / frequencyData.length
    const baseR = Math.min(width, height) * 0.15 * intensity
    ;[1, 0.65, 0.35].forEach((scale, i) => {
      const r = baseR * scale * (1 + energy * 0.5)
      ctx.globalAlpha = opacity * (1 - i * 0.25)
      ctx.beginPath()
      ctx.arc(cx, cy, r, 0, 2 * Math.PI)
      ctx.strokeStyle = 'rgba(255,255,255,0.6)'
      ctx.lineWidth = 2
      ctx.stroke()
    })
    ctx.globalAlpha = 1
  }
}

export async function loadImageBitmap(url: string): Promise<ImageBitmap> {
  const resp = await fetch(url)
  const blob = await resp.blob()
  return createImageBitmap(blob)
}
