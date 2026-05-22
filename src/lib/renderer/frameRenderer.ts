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

function drawVisualizer(
  ctx: OffscreenCanvasRenderingContext2D,
  width: number,
  height: number,
  frequencyData: Float32Array,
  visualizer: Visualizer,
): void {
  const opacity = visualizer.opacity / 100
  const intensity = visualizer.intensity / 100
  const sizeScale = visualizer.size / 50  // 1.0 at default size=50
  const yCenter = height * (visualizer.y / 100)

  ctx.globalAlpha = opacity

  if (visualizer.type === 'bars') {
    const numBars = frequencyData.length
    const barW = width / numBars
    ctx.fillStyle = 'rgba(255,255,255,0.7)'
    for (let i = 0; i < numBars; i++) {
      const barH = frequencyData[i] * intensity * sizeScale * height * 0.45
      ctx.fillRect(i * barW, yCenter - barH, barW - 1, barH)
    }
  } else if (visualizer.type === 'wave') {
    ctx.beginPath()
    ctx.strokeStyle = 'rgba(255,255,255,0.8)'
    ctx.lineWidth = 2 * (width / 1920)
    const step = width / frequencyData.length
    for (let i = 0; i < frequencyData.length; i++) {
      const y = yCenter - frequencyData[i] * intensity * sizeScale * height * 0.4
      if (i === 0) ctx.moveTo(0, y)
      else ctx.lineTo(i * step, y)
    }
    ctx.stroke()
  } else if (visualizer.type === 'mirror') {
    const numBars = frequencyData.length
    const barW = width / numBars
    ctx.fillStyle = 'rgba(255,255,255,0.7)'
    for (let i = 0; i < numBars; i++) {
      const barH = frequencyData[i] * intensity * sizeScale * height * 0.22
      ctx.fillRect(i * barW, yCenter - barH, barW - 1, barH)
      ctx.fillRect(i * barW, yCenter,         barW - 1, barH)
    }
  } else if (visualizer.type === 'dots') {
    const numDots = 40
    const step = width / numDots
    const dataStep = frequencyData.length / numDots
    ctx.fillStyle = 'rgba(255,255,255,0.7)'
    for (let i = 0; i < numDots; i++) {
      const v = frequencyData[Math.floor(i * dataStep)]
      const r = v * intensity * sizeScale * height * 0.05 + 2 * (width / 1920)
      ctx.beginPath()
      ctx.arc(i * step + step / 2, yCenter, r, 0, 2 * Math.PI)
      ctx.fill()
    }
  } else if (visualizer.type === 'orb') {
    const energy = frequencyData.reduce((a, v) => a + v, 0) / frequencyData.length
    const baseR = Math.min(width, height) * 0.15 * intensity * sizeScale
    ;[1, 0.65, 0.35].forEach((scale, i) => {
      const r = baseR * scale * (1 + energy * 0.5)
      ctx.globalAlpha = opacity * (1 - i * 0.25)
      ctx.beginPath()
      ctx.arc(width / 2, yCenter, r, 0, 2 * Math.PI)
      ctx.strokeStyle = 'rgba(255,255,255,0.6)'
      ctx.lineWidth = 2
      ctx.stroke()
    })
  } else if (visualizer.type === 'ring') {
    const energy = frequencyData.reduce((a, v) => a + v, 0) / frequencyData.length
    const r = Math.min(width, height) * 0.18 * intensity * sizeScale * (1 + energy * 0.8)
    ctx.strokeStyle = 'rgba(255,255,255,0.7)'
    ctx.lineWidth = 2.5 * (width / 1920)
    ctx.beginPath()
    ctx.arc(width / 2, yCenter, r, 0, 2 * Math.PI)
    ctx.stroke()
    ctx.globalAlpha = opacity * 0.35
    ctx.beginPath()
    ctx.arc(width / 2, yCenter, r * 0.6, 0, 2 * Math.PI)
    ctx.stroke()
  }

  ctx.globalAlpha = 1
}

export async function loadImageBitmap(url: string): Promise<ImageBitmap> {
  const resp = await fetch(url)
  const blob = await resp.blob()
  return createImageBitmap(blob)
}
