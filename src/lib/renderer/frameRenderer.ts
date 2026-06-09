// OffscreenCanvas에 영상 한 프레임을 그리는 렌더러

import type { Background, Effects, Visualizer, Typography, Track, LogoPosition, ParticleOverlay } from '../../types'
import { createParticleOverlayState, tickParticleOverlay, ParticleOverlayState } from '../visualizer/particleOverlay'
import {
  makeVisState, VisState,
  drawClassicBars, drawMirrorBars, drawNeonGlow, drawWaveformLine, drawCircularEQ,
  drawStackedLayers, drawDotMatrix, drawSpectrumFire, draw3DPerspective, drawGlitchShift,
  drawSpiralEQ, drawTunnelRings, drawFrequencyMountain, drawStarburst, drawBlockSteps,
  drawAuroraCurtains, drawDnaHelix, drawVinylGrooves, drawLaserHarp, drawNeonCityscape,
  drawPrismSplit, drawLightningBolt, drawArcadeSpectrum, drawLiquidMercury,
} from '../visualizer/renderers'

let _vis: VisState = makeVisState()

export interface DrawFrameInput {
  canvas: OffscreenCanvas | HTMLCanvasElement
  width: number
  height: number
  frequencyData: Float32Array  // 80개 밴드
  timeSec?: number
  particleOverlay?: ParticleOverlay
  particleOverlayState?: ParticleOverlayState
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
  const ctx = input.canvas.getContext('2d') as unknown as OffscreenCanvasRenderingContext2D
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
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  if (typography.showTitle) {
    const anchorX = Math.round((typography.titlePosition.x / 100) * width)
    const titleY = Math.round((typography.titlePosition.y / 100) * height)
    const titlePx = Math.round(typography.titleSize * (width / 640))
    const fontFamily = RENDERER_FONT_MAP[typography.titleFont ?? 'inter'] ?? '"Inter", sans-serif'
    // 정렬별 앵커 → 중심 x 변환 (geometry는 항상 center 기준)
    const align = typography.titleAlign ?? 'center'
    const textW = measureTitleWidth(ctx, currentTrack.title, titlePx, fontFamily)
    const titleX = align === 'left' ? anchorX + textW / 2
                 : align === 'right' ? anchorX - textW / 2
                 : anchorX
    drawTitle(ctx, currentTrack.title, titleX, titleY, titlePx, fontFamily,
      typography.titleStyle ?? 'minimal', typography.titleDeco ?? 'none',
      typography.titleCaptionTop ?? '', typography.titleCaptionBottom ?? '',
      typography.letterSpacing, width,
      typography.titleStroke ?? { enabled: true, width: 2, color: '#000000' })
  }

  if (typography.showSub) {
    const subX = Math.round((typography.subPosition.x / 100) * width)
    const subY = Math.round((typography.subPosition.y / 100) * height)
    const subPx = Math.round(typography.subSize * (width / 640))
    ctx.font = `400 ${subPx}px "Inter", sans-serif`
    ;(ctx as any).letterSpacing = `${typography.subLetterSpacing / 1000}em`
    ctx.fillStyle = 'rgba(255,255,255,0.6)'
    const artistPrefix = currentTrack.artist && currentTrack.artist !== 'Unknown' ? `${currentTrack.artist} · ` : ''
    ctx.fillText(
      `${artistPrefix}Track ${String(currentTrackIndex + 1).padStart(2, '0')} / ${totalTracks}`,
      subX,
      subY,
    )
    ;(ctx as any).letterSpacing = '0px'
  }

  // 5. 파티클 오버레이
  if (input.particleOverlay?.enabled && input.particleOverlayState) {
    tickParticleOverlay(ctx, input.particleOverlayState, input.particleOverlay, width, height, 1 / 30)
  }

  // 6. 로고
  if (input.logoImage) {
    const canvasLogoSize = Math.round(input.logoSize * (width / 640))
    const lx = Math.round((input.logoPosition.x / 100) * width) - canvasLogoSize / 2
    const ly = Math.round((input.logoPosition.y / 100) * height) - canvasLogoSize / 2
    ctx.globalAlpha = 1
    ctx.drawImage(input.logoImage, lx, ly, canvasLogoSize, canvasLogoSize)
  }

  // 7. 워터마크
  if (input.watermarkImage) {
    const wSize = Math.round(80 * (width / 1920))
    ctx.globalAlpha = 0.6
    ctx.drawImage(input.watermarkImage, width - wSize - 40, height - wSize - 40, wSize, wSize)
    ctx.globalAlpha = 1
  }

  // 8. 스티커
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
  // 프리뷰(Step2) 컨테이너 높이 기준: size*0.8px at 360px frame
  const containerH = height * (visualizer.size * 0.8) / 360
  // bars: SVG y=80 라인 = 컨테이너 상단 + 0.8*containerH → center + 0.3*containerH
  const yCenter = height * (visualizer.y / 100) + containerH * 0.3
  // glow/peak: 막대가 캔버스 하단(컨테이너 bottom)에서 위로 자람
  const yBaseGP = height * (visualizer.y / 100) + containerH * 0.5
  const visW = Math.round(width * (Math.max(10, visualizer.width) / 100))
  const visX = (width - visW) / 2

  const energy = frequencyData.reduce((s, v) => s + v, 0) / Math.max(frequencyData.length, 1)
  // bars: SVG 막대 최대 80% of containerH (preserveAspectRatio="none")
  const maxH = containerH * 0.8
  // glow/peak: 프리뷰 캔버스 H = containerH, 실제 막대 높이 비율 맞춤
  const maxHGlow = containerH * 0.94
  const maxHPeak = containerH * 0.90

  ctx.globalAlpha = opacity

  // 24종 새 비주얼라이저 — 높이·가로폭·위치 적용
  const vals = Array.from(frequencyData)
  const iScale = intensity
  const color = visualizer.color

  const NEW_VIS_TYPES = new Set(['classic-bars','mirror-bars','neon-glow','waveform-line','circular-eq','stacked-layers','dot-matrix','spectrum-fire','3d-perspective','glitch-shift','spiral-eq','tunnel-rings','frequency-mountain','starburst','block-steps','aurora-curtains','dna-helix','vinyl-grooves','laser-harp','neon-cityscape','prism-split','lightning-bolt','arcade-spectrum','liquid-mercury'])
  if (NEW_VIS_TYPES.has(visualizer.type)) {
    const newVisH = Math.round(height * Math.max(0.05, visualizer.size / 100))
    const newVisTop = Math.round(height * (visualizer.y / 100)) - newVisH / 2
    ctx.save()
    ctx.translate(visX, newVisTop)
    ctx.beginPath()
    ctx.rect(0, 0, visW, newVisH)
    ctx.clip()
    switch (visualizer.type) {
      case 'classic-bars':       drawClassicBars(ctx as any, vals, visW, newVisH, color, iScale, false); break
      case 'mirror-bars':        drawMirrorBars(ctx as any, vals, visW, newVisH, color, iScale, false); break
      case 'neon-glow':          drawNeonGlow(ctx as any, vals, visW, newVisH, color, iScale, _vis, false); break
      case 'waveform-line':      drawWaveformLine(ctx as any, vals, visW, newVisH, color, iScale, false); break
      case 'circular-eq':        drawCircularEQ(ctx as any, vals, visW, newVisH, color, iScale, false); break
      case 'stacked-layers':     drawStackedLayers(ctx as any, vals, visW, newVisH, color, iScale, false); break
      case 'dot-matrix':         drawDotMatrix(ctx as any, vals, visW, newVisH, color, iScale, false); break
      case 'spectrum-fire':      drawSpectrumFire(ctx as any, vals, visW, newVisH, color, iScale, _vis, false); break
      case '3d-perspective':     draw3DPerspective(ctx as any, vals, visW, newVisH, color, iScale, false); break
      case 'glitch-shift':       drawGlitchShift(ctx as any, vals, visW, newVisH, color, iScale, _vis, false); break
      case 'spiral-eq':          drawSpiralEQ(ctx as any, vals, visW, newVisH, color, iScale, _vis, false); break
      case 'tunnel-rings':       drawTunnelRings(ctx as any, vals, visW, newVisH, color, iScale, _vis, false); break
      case 'frequency-mountain': drawFrequencyMountain(ctx as any, vals, visW, newVisH, color, iScale, false); break
      case 'starburst':          drawStarburst(ctx as any, vals, visW, newVisH, color, iScale, _vis, false); break
      case 'block-steps':        drawBlockSteps(ctx as any, vals, visW, newVisH, color, iScale, _vis, false); break
      case 'aurora-curtains':    drawAuroraCurtains(ctx as any, vals, visW, newVisH, color, iScale, _vis, false); break
      case 'dna-helix':          drawDnaHelix(ctx as any, vals, visW, newVisH, color, iScale, _vis, false); break
      case 'vinyl-grooves':      drawVinylGrooves(ctx as any, vals, visW, newVisH, color, iScale, _vis, false); break
      case 'laser-harp':         drawLaserHarp(ctx as any, vals, visW, newVisH, color, iScale, false); break
      case 'neon-cityscape':     drawNeonCityscape(ctx as any, vals, visW, newVisH, color, iScale, _vis, false); break
      case 'prism-split':        drawPrismSplit(ctx as any, vals, visW, newVisH, color, iScale, false); break
      case 'lightning-bolt':     drawLightningBolt(ctx as any, vals, visW, newVisH, color, iScale, false); break
      case 'arcade-spectrum':    drawArcadeSpectrum(ctx as any, vals, visW, newVisH, color, iScale, false); break
      case 'liquid-mercury':     drawLiquidMercury(ctx as any, vals, visW, newVisH, color, iScale, _vis, false); break
      default: break
    }
    ctx.restore()
    ctx.shadowBlur = 0; ctx.shadowColor = 'transparent'; ctx.globalAlpha = 1; return
  }

  if (visualizer.type === 'bars' || visualizer.type === 'particle') {
    const numBars = frequencyData.length
    const barW = visW / numBars
    const rx = Math.min(barW * 0.35, 4 * (width / 640))
    for (let i = 0; i < numBars; i++) {
      const hue = barHue(i, numBars, visualizer.color)
      const c = `hsl(${hue}, 100%, ${50 + energy * 30}%)`
      const barH = Math.max(1, frequencyData[i] * intensity * maxH)
      const x = visX + i * barW + barW * 0.08
      const w = barW * 0.84
      ctx.shadowBlur = energy * intensity * 40
      ctx.shadowColor = c
      ctx.fillStyle = c
      ctx.beginPath()
      ;(ctx as any).roundRect(x, yCenter - barH, w, barH, rx)
      ctx.fill()
      // reflection
      ctx.save()
      ctx.shadowBlur = 0
      ctx.shadowColor = 'transparent'
      ctx.globalAlpha = opacity * 0.18
      ctx.beginPath()
      ;(ctx as any).roundRect(x, yCenter + 1, w, barH * 0.36, rx)
      ctx.fill()
      ctx.restore()
    }
  } else if (visualizer.type === 'glow') {
    const bins = 28
    const barW = visW / bins
    const rx = Math.min(barW * 0.18, 4 * (width / 640))
    for (let i = 0; i < bins; i++) {
      const fd = frequencyData[Math.floor(i * frequencyData.length / bins)] ?? 0
      const barH = Math.max(2, fd * intensity * maxHGlow)
      const hue = barHue(i, bins, visualizer.color)
      ctx.save()
      ctx.shadowColor = `hsl(${hue}, 100%, 65%)`
      ctx.shadowBlur = fd * intensity * 40 + 5
      const grad = ctx.createLinearGradient(0, yBaseGP - barH, 0, yBaseGP)
      grad.addColorStop(0, `hsl(${hue}, 100%, 78%)`)
      grad.addColorStop(0.55, `hsl(${hue}, 90%, 55%)`)
      grad.addColorStop(1, `hsl(${hue}, 80%, 38%)`)
      ctx.fillStyle = grad
      ctx.beginPath()
      ;(ctx as any).roundRect(visX + i * barW + barW * 0.08, yBaseGP - barH, barW * 0.84, barH, rx)
      ctx.fill()
      ctx.restore()
    }
  } else if (visualizer.type === 'peak') {
    const bins = 40
    const barW = visW / bins
    const rxPeak = Math.min(barW * 0.15, 3 * (width / 640))
    for (let i = 0; i < bins; i++) {
      const fd = frequencyData[Math.floor(i * frequencyData.length / bins)] ?? 0
      const barH = Math.max(2, fd * intensity * maxHPeak)
      const hue = barHue(i, bins, visualizer.color)
      const x = visX + i * barW + barW * 0.1
      const w = barW * 0.8
      const barTop = yBaseGP - barH
      ctx.fillStyle = `hsla(${hue}, 70%, 42%, 0.55)`
      ctx.beginPath()
      ;(ctx as any).roundRect(x, barTop, w, barH, [rxPeak, rxPeak, 0, 0])
      ctx.fill()
      ctx.save()
      ctx.shadowColor = `hsl(${hue}, 100%, 75%)`
      ctx.shadowBlur = 10
      ctx.fillStyle = `hsl(${hue}, 100%, 82%)`
      ctx.beginPath()
      ctx.arc(x + w / 2, barTop, w * 0.42, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    }
  }

  ctx.shadowBlur = 0
  ctx.shadowColor = 'transparent'
  ctx.globalAlpha = 1
}

const RENDERER_FONT_MAP: Record<string, string> = {
  inter:           '"Inter", sans-serif',
  playfair:        '"Playfair Display", serif',
  dm_serif:        '"DM Serif Display", serif',
  cormorant:       '"Cormorant Garamond", serif',
  nunito:          'Nunito, sans-serif',
  barlow:          '"Barlow Condensed", sans-serif',
  orbitron:        'Orbitron, sans-serif',
  space_mono:      '"Space Mono", monospace',
  dancing:         '"Dancing Script", cursive',
  black_han:       '"Black Han Sans", sans-serif',
  jua:             'Jua, sans-serif',
  nanum_gothic:    '"Nanum Gothic", sans-serif',
  nanum_myeongjo:  '"Nanum Myeongjo", serif',
  gowun_batang:    '"Gowun Batang", serif',
  hi_melody:       '"Hi Melody", cursive',
  poor_story:      '"Poor Story", cursive',
  noto_sans_kr:    '"Noto Sans KR", sans-serif',
  paperlogy:       '"Paperlogy", sans-serif',
}

function measureTitleWidth(ctx: OffscreenCanvasRenderingContext2D, text: string, px: number, fontFamily: string): number {
  ctx.save()
  ctx.font = `700 ${px}px ${fontFamily}`
  const w = ctx.measureText(text).width
  ctx.restore()
  return w
}

function drawTitle(
  ctx: OffscreenCanvasRenderingContext2D,
  text: string,
  x: number, y: number,
  px: number,
  fontFamily: string,
  style: string,
  deco: string,
  captionTop: string,
  captionBottom: string,
  letterSpacing: number,
  width: number,
  titleStroke: { enabled: boolean; width: number; color: string },
): void {
  const s = width / 640
  const textW = measureTitleWidth(ctx, text, px, fontFamily)

  // deco: bg-word (배경에 먼저)
  if (deco === 'bg-word') {
    ctx.save()
    ctx.globalAlpha = 0.04
    ctx.font = `900 ${px * 4}px ${fontFamily}`
    ctx.fillStyle = '#ffffff'
    ctx.textAlign = 'center'
    ctx.fillText(captionTop || text, x, y)
    ctx.restore()
  }

  // style: card (텍스트 아래 배경)
  if (style === 'card') {
    const padX = 18 * s, padY = 8 * s
    ctx.save()
    ctx.fillStyle = 'rgba(0,0,0,0.45)'
    ctx.beginPath()
    ;(ctx as any).roundRect(x - textW / 2 - padX, y - px * 0.6 - padY, textW + padX * 2, px * 1.2 + padY * 2, 6 * s)
    ctx.fill()
    ctx.restore()
  }

  // deco: caption 상단
  if ((deco === 'caption' || deco === 'divider') && captionTop) {
    const capPx = Math.round(10 * s)
    ctx.save()
    ctx.font = `400 ${capPx}px "Inter", sans-serif`
    ;(ctx as any).letterSpacing = '0.15em'
    ctx.fillStyle = 'rgba(255,255,255,0.65)'
    ctx.textAlign = 'center'
    ctx.fillText(captionTop.toUpperCase(), x, y - px * 0.8)
    ctx.restore()
  }

  // deco: divider 상단 라인
  if (deco === 'divider') {
    const lineW = Math.max(160 * s, textW)
    ctx.save()
    ctx.strokeStyle = 'rgba(255,255,255,0.5)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(x - lineW / 2, y - px * 0.65)
    ctx.lineTo(x + lineW / 2, y - px * 0.65)
    ctx.stroke()
    ctx.restore()
  }

  // 폰트 굵기/스타일 설정
  const weight = style === 'modern' ? '300' : style === 'bold' ? '900' : '700'
  ctx.font = `${weight} ${px}px ${fontFamily}`
  ;(ctx as any).letterSpacing = style === 'modern' ? '0.12em' : `${letterSpacing / 1000}em`
  ctx.textAlign = 'center'
  ctx.lineJoin = 'round'

  const strokeW = titleStroke.enabled ? Math.max(0.5, titleStroke.width * (width / 640)) : 0

  // 기본 텍스트 렌더링
  switch (style) {
    case 'neon': {
      ctx.shadowColor = '#00d4ff'
      ctx.shadowBlur = px * 0.5
      if (titleStroke.enabled) {
        ctx.strokeStyle = titleStroke.color
        ctx.lineWidth = strokeW
        ctx.strokeText(text, x, y)
      }
      ctx.fillStyle = '#00d4ff'
      ctx.fillText(text, x, y)
      ctx.shadowBlur = px * 0.25
      ctx.fillText(text, x, y)
      break
    }
    case 'outline': {
      if (titleStroke.enabled) {
        ctx.strokeStyle = titleStroke.color
        ctx.lineWidth = strokeW
        ctx.strokeText(text, x, y)
      }
      break
    }
    case 'vintage': {
      ctx.shadowColor = 'rgba(0,0,0,0.5)'
      ctx.shadowBlur = Math.round(px * 0.2)
      ctx.shadowOffsetY = Math.round(px * 0.06)
      if (titleStroke.enabled) {
        ctx.strokeStyle = titleStroke.color
        ctx.lineWidth = strokeW
        ctx.strokeText(text, x, y)
      }
      ctx.fillStyle = '#f0e6c8'
      ctx.fillText(text, x, y)
      break
    }
    case 'glitch': {
      ctx.save()
      ctx.fillStyle = '#ff003c'
      ctx.globalAlpha = 0.8
      ctx.fillText(text, x - 3 * s, y - 2 * s)
      ctx.fillStyle = '#00d4ff'
      ctx.fillText(text, x + 3 * s, y + 2 * s)
      ctx.restore()
      if (titleStroke.enabled) {
        ctx.strokeStyle = titleStroke.color
        ctx.lineWidth = strokeW
        ctx.strokeText(text, x, y)
      }
      ctx.fillStyle = 'rgba(255,255,255,0.9)'
      ctx.fillText(text, x, y)
      break
    }
    default: {
      ctx.shadowColor = 'rgba(0,0,0,0.6)'
      ctx.shadowBlur = Math.round(px * 0.25)
      ctx.shadowOffsetY = Math.round(px * 0.08)
      if (titleStroke.enabled) {
        ctx.strokeStyle = titleStroke.color
        ctx.lineWidth = strokeW
        ctx.strokeText(text, x, y)
      }
      ctx.fillStyle = style === 'modern' ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.9)'
      ctx.fillText(text, x, y)
    }
  }

  // underline
  if (style === 'underline') {
    ctx.save()
    ctx.strokeStyle = 'rgba(255,255,255,0.8)'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(x - textW / 2, y + px * 0.58)
    ctx.lineTo(x + textW / 2, y + px * 0.58)
    ctx.stroke()
    ctx.restore()
  }

  ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0
  ;(ctx as any).letterSpacing = '0px'

  // deco: divider 하단 라인 + 하단 캡션
  if (deco === 'divider') {
    const lineW = Math.max(160 * s, textW)
    ctx.save()
    ctx.strokeStyle = 'rgba(255,255,255,0.5)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(x - lineW / 2, y + px * 0.65)
    ctx.lineTo(x + lineW / 2, y + px * 0.65)
    ctx.stroke()
    ctx.restore()
  }

  if ((deco === 'caption' || deco === 'divider') && captionBottom) {
    const capPx = Math.round(10 * s)
    ctx.save()
    ctx.font = `400 ${capPx}px "Inter", sans-serif`
    ;(ctx as any).letterSpacing = '0.15em'
    ctx.fillStyle = 'rgba(255,255,255,0.65)'
    ctx.textAlign = 'center'
    ctx.fillText(captionBottom.toUpperCase(), x, y + px * 0.8)
    ctx.restore()
  }

  // deco: frame
  if (deco === 'frame') {
    const padX = 12 * s, padY = 8 * s
    ctx.save()
    ctx.strokeStyle = 'rgba(255,255,255,0.45)'
    ctx.lineWidth = 1
    ctx.strokeRect(x - textW / 2 - padX, y - px * 0.6 - padY, textW + padX * 2, px * 1.2 + padY * 2)
    ctx.restore()
  }

  // deco: bar-left
  if (deco === 'bar-left') {
    const barX = x - textW / 2 - 16 * s
    ctx.save()
    ctx.strokeStyle = '#00d4ff'
    ctx.lineWidth = 4 * s
    ctx.beginPath()
    ctx.moveTo(barX, y - px * 0.6)
    ctx.lineTo(barX, y + px * 0.6)
    ctx.stroke()
    ctx.restore()
  }

  // deco: corner
  if (deco === 'corner') {
    const padX = 14 * s, padY = 8 * s
    const cs = 12 * s
    const l = x - textW / 2 - padX, r = x + textW / 2 + padX
    const t = y - px * 0.6 - padY, b = y + px * 0.6 + padY
    ctx.save()
    ctx.strokeStyle = 'rgba(255,255,255,0.6)'
    ctx.lineWidth = 1.5
    ctx.beginPath(); ctx.moveTo(l + cs, t); ctx.lineTo(l, t); ctx.lineTo(l, t + cs); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(r - cs, b); ctx.lineTo(r, b); ctx.lineTo(r, b - cs); ctx.stroke()
    ctx.restore()
  }

  // deco: wave
  if (deco === 'wave') {
    const wW = textW * 1.2
    const wY = y + px * 0.8
    ctx.save()
    ctx.strokeStyle = 'rgba(255,255,255,0.5)'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.moveTo(x - wW / 2, wY)
    ctx.bezierCurveTo(x - wW / 4, wY - 5 * s, x + wW / 4, wY + 5 * s, x + wW / 2, wY)
    ctx.stroke()
    ctx.restore()
  }
}

export async function loadImageBitmap(url: string): Promise<ImageBitmap> {
  const resp = await fetch(url)
  const blob = await resp.blob()
  return createImageBitmap(blob)
}
