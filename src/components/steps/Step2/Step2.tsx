// Step 2 — 비주얼 편집: 테마 선택, 스테이지 미리보기, 효과 설정
import './Step2.css'
import React, { useRef, useEffect, useState } from 'react'
import Icon from '../../../icons'
import Button from '../../shared/Button'
import Switch from '../../shared/Switch'
import { waveformFor } from '../../../data/sampleTracks'
import type { Track, Effects, Visualizer, Typography, Background, LogoPosition, TitleBaseStyle, TitleDecoStyle, TitlePositionPreset } from '../../../types'
import {
  makeVisState, VisState,
  drawClassicBars, drawMirrorBars, drawNeonGlow, drawWaveformLine, drawCircularEQ,
  drawStackedLayers, drawDotMatrix, drawSpectrumFire, draw3DPerspective, drawGlitchShift,
  drawSpiralEQ, drawTunnelRings, drawFrequencyMountain, drawStarburst, drawBlockSteps,
  drawAuroraCurtains, drawDnaHelix, drawVinylGrooves, drawLaserHarp, drawNeonCityscape,
  drawPrismSplit, drawLightningBolt, drawArcadeSpectrum, drawLiquidMercury,
} from '../../../lib/visualizer/renderers'

const THEMES = [
  { id: 'midnight', label: 'Midnight',  bg: 'linear-gradient(135deg, #0c1a2e, #050813)' },
  { id: 'cyanwave', label: 'Cyan Wave', bg: 'linear-gradient(135deg, #042f3f, #0a647a)' },
  { id: 'sunset',   label: 'Sunset',    bg: 'linear-gradient(135deg, #2a0f2e, #6d2c4a)' },
  { id: 'forest',   label: 'Forest',    bg: 'linear-gradient(135deg, #0c1e16, #1f3d2c)' },
  { id: 'cream',    label: 'Cream',     bg: 'linear-gradient(135deg, #f3ead8, #d9c7a3)' },
  { id: 'mono',     label: 'Mono',      bg: 'linear-gradient(135deg, #0a0a0a, #2a2a2a)' },
]

const VIS_SHAPES: { id: Visualizer['type'], label: string }[] = [
  { id: 'bars',              label: '그라데이션'  },
  { id: 'glow',              label: '글로우'      },
  { id: 'peak',              label: '피크'        },
  { id: 'particle',          label: '파티클'      },
  { id: 'classic-bars',      label: '클래식 바'   },
  { id: 'mirror-bars',       label: '미러 바'     },
  { id: 'neon-glow',         label: '네온 글로우' },
  { id: 'waveform-line',     label: '웨이브폼'    },
  { id: 'circular-eq',       label: '원형 EQ'     },
  { id: 'stacked-layers',    label: '스택 레이어' },
  { id: 'dot-matrix',        label: '도트 매트릭스' },
  { id: 'spectrum-fire',     label: '불꽃 스펙트럼' },
  { id: '3d-perspective',    label: '3D 원근'     },
  { id: 'glitch-shift',      label: '글리치'      },
  { id: 'spiral-eq',         label: '스파이럴'    },
  { id: 'tunnel-rings',      label: '터널 링'     },
  { id: 'frequency-mountain',label: '주파수 산맥' },
  { id: 'starburst',         label: '스타버스트'  },
  { id: 'block-steps',       label: '블록 스텝'   },
  { id: 'aurora-curtains',   label: '오로라 커튼' },
  { id: 'dna-helix',         label: 'DNA 헬릭스'  },
  { id: 'vinyl-grooves',     label: '바이닐'      },
  { id: 'laser-harp',        label: '레이저 하프' },
  { id: 'neon-cityscape',    label: '네온 야경'   },
  { id: 'prism-split',       label: '프리즘'      },
  { id: 'lightning-bolt',    label: '번개'        },
  { id: 'arcade-spectrum',   label: '아케이드'    },
  { id: 'liquid-mercury',    label: '한강 물결'   },
]

const NEW_VIS_TYPES = new Set<Visualizer['type']>([
  'classic-bars','mirror-bars','neon-glow','waveform-line','circular-eq',
  'stacked-layers','dot-matrix','spectrum-fire','3d-perspective','glitch-shift',
  'spiral-eq','tunnel-rings','frequency-mountain','starburst','block-steps',
  'aurora-curtains','dna-helix','vinyl-grooves','laser-harp','neon-cityscape',
  'prism-split','lightning-bolt','arcade-spectrum','liquid-mercury',
])


const VIS_COLORS = [
  'rainbow',
  '#00d4ff', '#a855f7', '#fbbf24', '#f97316', '#22c55e', '#ff3b5c',
  '#00ffcc', '#818cf8', '#fb7185', '#84cc16', '#f0abfc', '#ffffff',
]

const EFFECT_ITEMS = [
  { key: 'vis'       as const, icon: 'waveform', title: '오디오 비주얼라이저', sub: '파형이 음원에 반응' },
  { key: 'crossfade' as const, icon: 'repeat',   title: '크로스페이드',        sub: '트랙 간 2초 페이드' },
  { key: 'ducking'   as const, icon: 'sliders',  title: '자동 레벨',           sub: '트랙별 −14 LUFS 정규화' },
  { key: 'blur'      as const, icon: 'sparkles', title: '배경 블러',           sub: '깊이감 부여 · 24px' },
]

const TITLE_BASE_STYLES: { id: TitleBaseStyle; label: string }[] = [
  { id: 'minimal',   label: '미니멀'   },
  { id: 'modern',    label: '모던'     },
  { id: 'bold',      label: '볼드'     },
  { id: 'underline', label: '언더라인' },
  { id: 'card',      label: '카드'     },
  { id: 'neon',      label: '네온'     },
  { id: 'glitch',    label: '글리치'   },
  { id: 'outline',   label: '아웃라인' },
  { id: 'vintage',   label: '빈티지'   },
]

const TITLE_DECO_STYLES: { id: TitleDecoStyle; label: string }[] = [
  { id: 'caption',  label: '캡션'    },
  { id: 'bar-left', label: '바 좌측' },
  { id: 'frame',    label: '프레임'  },
  { id: 'divider',  label: '디바이더'},
  { id: 'bg-word',  label: 'BG 워드' },
  { id: 'corner',   label: '코너'    },
  { id: 'wave',     label: '웨이브'  },
]

const FONT_MAP: Record<string, string> = {
  inter:           'Inter, sans-serif',
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

const TITLE_FONTS: { key: string; label: string; sample: string }[] = [
  { key: 'inter',          label: 'CLEAN',      sample: 'Aa' },
  { key: 'playfair',       label: 'DISPLAY',    sample: 'Aa' },
  { key: 'dm_serif',       label: 'EDITORIAL',  sample: 'Aa' },
  { key: 'cormorant',      label: 'ELEGANT',    sample: 'Aa' },
  { key: 'nunito',         label: 'ROUNDED',    sample: 'Aa' },
  { key: 'barlow',         label: 'CONDENSED',  sample: 'Aa' },
  { key: 'orbitron',       label: 'FUTURISTIC', sample: 'Aa' },
  { key: 'space_mono',     label: 'MONO',       sample: 'Aa' },
  { key: 'dancing',        label: 'HAND',       sample: 'Aa' },
  { key: 'black_han',      label: '검은고딕',    sample: '가나' },
  { key: 'jua',            label: '주아체',      sample: '가나' },
  { key: 'nanum_gothic',   label: '나눔고딕',    sample: '가나' },
  { key: 'nanum_myeongjo', label: '나눔명조',    sample: '가나' },
  { key: 'gowun_batang',   label: '고운바탕',    sample: '가나' },
  { key: 'hi_melody',      label: '하이멜로디',  sample: '가나' },
  { key: 'poor_story',     label: '푸어스토리',  sample: '가나' },
  { key: 'noto_sans_kr',   label: '나눔젠',      sample: '가나' },
  { key: 'paperlogy',      label: '페이퍼로지',  sample: '가나' },
]

const PRESET_COORDS: Record<TitlePositionPreset, { x: number; y: number }> = {
  tl: { x: 15, y: 15 }, tc: { x: 50, y: 15 }, tr: { x: 85, y: 15 },
  ml: { x: 15, y: 50 }, mc: { x: 50, y: 50 }, mr: { x: 85, y: 50 },
  bl: { x: 15, y: 80 }, bc: { x: 50, y: 80 }, br: { x: 85, y: 80 },
}

const DECO_CAPTION_KEYS = new Set<TitleDecoStyle>(['caption', 'divider', 'frame', 'bar-left'])

const fmt = (sec: number) => {
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function waveContainerStyle(y: number, size: number, width: number): React.CSSProperties {
  const h = `${Math.max(10, Math.round(size * 0.8))}px`
  return {
    top: `${y}%`,
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: `${Math.max(10, width)}%`,
    height: h,
    cursor: 'ns-resize',
  }
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

function barColor(i: number, total: number, energy: number, color: string): string {
  const hue = color === 'rainbow'
    ? (i / Math.max(total - 1, 1)) * 240
    : hexHue(color) + (i / Math.max(total - 1, 1) - 0.5) * 40
  return `hsl(${hue}, 100%, ${50 + energy * 30}%)`
}

function energyColor(energy: number): string {
  return `hsl(${energy * 240}, 100%, ${50 + energy * 30}%)`
}

const CLIP_GAP = 4

function clipW(t: Track, zoom: number): number {
  return Math.max(24, t.durationSec * zoom)
}

function clipPxFromTime(time: number, tracks: Track[], zoom: number): number {
  const shown = tracks.slice(0, 8)
  let acc = 0, px = 0
  for (let i = 0; i < shown.length; i++) {
    const t = shown[i]
    const w = clipW(t, zoom)
    if (i > 0) px += CLIP_GAP
    if (time <= acc + t.durationSec || i === shown.length - 1) {
      const r = t.durationSec > 0 ? Math.max(0, Math.min(1, (time - acc) / t.durationSec)) : 0
      return px + r * w
    }
    px += w
    acc += t.durationSec
  }
  return px
}

function pxToTime(px: number, tracks: Track[], zoom: number): number {
  const shown = tracks.slice(0, 8)
  let acc = 0, p = 0
  for (let i = 0; i < shown.length; i++) {
    const t = shown[i]
    const w = clipW(t, zoom)
    if (i > 0) p += CLIP_GAP
    if (px <= p + w || i === shown.length - 1) {
      const r = w > 0 ? Math.max(0, Math.min(1, (px - p) / w)) : 0
      return acc + r * t.durationSec
    }
    p += w
    acc += t.durationSec
  }
  return acc
}

interface Step2Props {
  tracks: Track[]
  theme: string
  setTheme: (t: string) => void
  effects: Effects
  setEffects: (e: Effects) => void
  visualizer: Visualizer
  setVisualizer: React.Dispatch<React.SetStateAction<Visualizer>>
  typography: Typography
  setTypography: React.Dispatch<React.SetStateAction<Typography>>
  onBack: () => void
  onNext: () => void
  playingId: string | null
  isPlaying: boolean
  onPlay: (id: string) => void
  onPause: () => void
  onSkipNext: () => void
  onSkipPrev: () => void
  background: Background
  logo: string | undefined
  logoPosition: LogoPosition
  setLogoPosition: (p: LogoPosition) => void
  logoSize: number
  setLogoSize: (s: number) => void
  currentTime: number
  onSeek: (time: number) => void
  analyserRef: React.RefObject<AnalyserNode | null>
}

export default function Step2({ tracks, theme, setTheme, effects, setEffects, visualizer, setVisualizer, typography, setTypography, onBack, onNext, playingId, isPlaying, onPlay, onPause, onSkipNext, onSkipPrev, background, logo, logoPosition, setLogoPosition, logoSize, setLogoSize, currentTime, onSeek, analyserRef }: Step2Props) {
  const themeObj = THEMES.find(t => t.id === theme) ?? THEMES[0]
  const playingTrack = tracks.find(t => t.id === playingId) ?? tracks[0]
  const trackIdx = tracks.findIndex(t => t.id === playingId)
  const totalSec = tracks.reduce((acc, t) => acc + t.durationSec, 0)

  const frameRef = useRef<HTMLDivElement>(null)
  const isDragging = useRef(false)
  const dragOffset = useRef({ x: 0, y: 0 })
  const visIsDragging = useRef(false)
  const visDragOffset = useRef(0)
  const titleIsDragging = useRef(false)
  const titleDragOffset = useRef({ x: 0, y: 0 })
  const subIsDragging = useRef(false)
  const subDragOffset = useRef({ x: 0, y: 0 })
  const barsCanvasRef = useRef<HTMLCanvasElement>(null)
  const peaksRef = useRef<{ pos: number; vel: number }[]>([])
  const particleCanvasRef = useRef<HTMLCanvasElement>(null)
  const freqDataRef = useRef<number[]>([])
  const visIntensityRef = useRef(visualizer.intensity)
  visIntensityRef.current = visualizer.intensity
  const visSizeRef = useRef(visualizer.size)
  visSizeRef.current = visualizer.size
  const visColorRef = useRef(visualizer.color)
  visColorRef.current = visualizer.color
  const smoothedFreqRef = useRef<number[]>([])
  const particlesRef = useRef<{ x: number; y: number; vx: number; vy: number; r: number }[] | null>(null)
  const newVisStateRef = useRef<VisState | null>(null)
  if (!particlesRef.current) {
    particlesRef.current = Array.from({ length: 220 }, () => ({
      x: Math.random(), y: Math.random(),
      vx: (Math.random() - 0.5) * 0.003,
      vy: (Math.random() - 0.5) * 0.003,
      r: Math.random() * 1.8 + 0.5,
    }))
  }

  const [activeRightTab, setActiveRightTab] = useState<'effects' | 'title'>('title')
  const [zoom, setZoom] = useState(1.5)
  const zoomRef = useRef(zoom)
  zoomRef.current = zoom
  const timelineRowRef = useRef<HTMLDivElement>(null)
  const clipHeadIsDragging = useRef(false)
  const onSeekRef = useRef(onSeek)
  onSeekRef.current = onSeek
  const tracksRef = useRef(tracks)
  tracksRef.current = tracks

  const [freqData, setFreqData] = useState<number[]>([])

  function handleLogoMouseDown(e: React.MouseEvent) {
    e.preventDefault()
    const frame = frameRef.current
    if (!frame) return
    const rect = frame.getBoundingClientRect()
    dragOffset.current = {
      x: e.clientX - rect.left - (logoPosition.x / 100) * rect.width,
      y: e.clientY - rect.top - (logoPosition.y / 100) * rect.height,
    }
    isDragging.current = true
  }

  function handleVisMouseDown(e: React.MouseEvent) {
    e.preventDefault()
    const frame = frameRef.current
    if (!frame) return
    const rect = frame.getBoundingClientRect()
    visDragOffset.current = e.clientY - rect.top - (visualizer.y / 100) * rect.height
    visIsDragging.current = true
  }

  function handleTitleMouseDown(e: React.MouseEvent) {
    e.preventDefault()
    const frame = frameRef.current
    if (!frame) return
    const rect = frame.getBoundingClientRect()
    titleDragOffset.current = {
      x: e.clientX - rect.left - (typography.titlePosition.x / 100) * rect.width,
      y: e.clientY - rect.top - (typography.titlePosition.y / 100) * rect.height,
    }
    titleIsDragging.current = true
  }

  function handleSubMouseDown(e: React.MouseEvent) {
    e.preventDefault()
    const frame = frameRef.current
    if (!frame) return
    const rect = frame.getBoundingClientRect()
    subDragOffset.current = {
      x: e.clientX - rect.left - (typography.subPosition.x / 100) * rect.width,
      y: e.clientY - rect.top - (typography.subPosition.y / 100) * rect.height,
    }
    subIsDragging.current = true
  }

  useEffect(() => {
    if (!isPlaying) { setFreqData([]); return }
    let rafId: number
    let buf: Uint8Array<ArrayBuffer> | null = null
    let logMap: { lo: number; hi: number }[] | null = null

    function tick() {
      const analyser = analyserRef.current
      if (analyser) {
        if (!buf) {
          const bins = analyser.frequencyBinCount
          buf = new Uint8Array(bins)
          const nyq = (analyser.context as AudioContext).sampleRate / 2
          const fMin = 30, fMax = Math.min(18000, nyq)
          logMap = Array.from({ length: 80 }, (_, i) => ({
            lo: Math.max(0, Math.floor(fMin * Math.pow(fMax / fMin,  i      / 80) / nyq * bins)),
            hi: Math.min(bins - 1, Math.ceil (fMin * Math.pow(fMax / fMin, (i + 1) / 80) / nyq * bins)),
          }))
        }
        analyser.getByteFrequencyData(buf)
        const raw = logMap!.map(({ lo, hi }) => {
          let s = 0, n = 0
          for (let b = lo; b <= hi; b++) { s += buf![b]; n++ }
          return n ? s / n / 255 : 0
        })
        const prev = smoothedFreqRef.current
        const smoothed = raw.map((v, i) => {
          const p = prev[i] ?? v
          // 빠른 상승(0.7), 느린 하강(0.15) — 막대가 올라갈 때 즉각 반응, 내려갈 때 서서히
          return p > v ? p * 0.85 + v * 0.15 : p * 0.3 + v * 0.7
        })
        smoothedFreqRef.current = smoothed
        setFreqData(smoothed)
      }
      rafId = requestAnimationFrame(tick)
    }
    rafId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafId)
  }, [isPlaying, analyserRef])

  useEffect(() => {
    function onMouseMove(e: MouseEvent) {
      const frame = frameRef.current
      if (!frame) return
      const rect = frame.getBoundingClientRect()
      if (isDragging.current) {
        const x = Math.max(5, Math.min(95, ((e.clientX - rect.left - dragOffset.current.x) / rect.width) * 100))
        const y = Math.max(5, Math.min(90, ((e.clientY - rect.top - dragOffset.current.y) / rect.height) * 100))
        setLogoPosition({ x, y })
      }
      if (visIsDragging.current) {
        const y = Math.max(5, Math.min(95, ((e.clientY - rect.top - visDragOffset.current) / rect.height) * 100))
        setVisualizer(prev => ({ ...prev, y }))
      }
      if (titleIsDragging.current) {
        const x = Math.max(5, Math.min(95, ((e.clientX - rect.left - titleDragOffset.current.x) / rect.width) * 100))
        const y = Math.max(5, Math.min(95, ((e.clientY - rect.top - titleDragOffset.current.y) / rect.height) * 100))
        setTypography(prev => ({ ...prev, titlePosition: { x, y } }))
      }
      if (subIsDragging.current) {
        const x = Math.max(5, Math.min(95, ((e.clientX - rect.left - subDragOffset.current.x) / rect.width) * 100))
        const y = Math.max(5, Math.min(95, ((e.clientY - rect.top - subDragOffset.current.y) / rect.height) * 100))
        setTypography(prev => ({ ...prev, subPosition: { x, y } }))
      }
      if (clipHeadIsDragging.current && timelineRowRef.current) {
        const row = timelineRowRef.current
        const rect = row.getBoundingClientRect()
        const px = Math.max(0, e.clientX - rect.left + row.scrollLeft - 14)
        onSeekRef.current(pxToTime(px, tracksRef.current, zoomRef.current))
      }
    }
    function onMouseUp() {
      isDragging.current = false
      visIsDragging.current = false
      titleIsDragging.current = false
      subIsDragging.current = false
      clipHeadIsDragging.current = false
    }
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
    return () => {
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
    }
  }, [setLogoPosition, setVisualizer])

  useEffect(() => {
    if (visualizer.type !== 'glow' && visualizer.type !== 'peak') return
    const canvas = barsCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const type = visualizer.type
    canvas.width = canvas.offsetWidth || 400
    canvas.height = canvas.offsetHeight || 100
    peaksRef.current = Array.from({ length: 40 }, () => ({ pos: canvas.height, vel: 0 }))
    let rafId: number
    const smoothed: number[] = []
    function tick() {
      const W = canvas!.width, H = canvas!.height
      const fd = freqDataRef.current
      const iScale = visIntensityRef.current / 100
      const color = visColorRef.current
      ctx!.clearRect(0, 0, W, H)
      if (type === 'glow') {
        const bins = 28
        for (let i = 0; i < bins; i++) {
          const raw = fd[Math.floor(i * fd.length / bins)] ?? 0
          const p = smoothed[i] ?? raw
          const v = p > raw ? p * 0.84 + raw * 0.16 : p * 0.25 + raw * 0.75
          smoothed[i] = v
          const barH = Math.max(2, v * H * 0.94 * iScale)
          const bw = W / bins
          const x = i * bw + bw * 0.08
          const w = bw * 0.84
          const hueVal = color === 'rainbow' ? (i / (bins - 1)) * 220 : hexHue(color) + (i / (bins - 1) - 0.5) * 40
          ctx!.save()
          ctx!.shadowColor = `hsl(${hueVal},100%,65%)`
          ctx!.shadowBlur = v * 28 * iScale + 5
          const g = ctx!.createLinearGradient(0, H - barH, 0, H)
          g.addColorStop(0, `hsl(${hueVal},100%,78%)`)
          g.addColorStop(0.55, `hsl(${hueVal},90%,55%)`)
          g.addColorStop(1, `hsl(${hueVal},80%,38%)`)
          ctx!.fillStyle = g
          ctx!.beginPath()
          if ('roundRect' in ctx!) ctx!.roundRect(x, H - barH, w, barH, 4)
          else ctx!.rect(x, H - barH, w, barH)
          ctx!.fill()
          ctx!.restore()
        }
      } else {
        const bins = 40
        for (let i = 0; i < bins; i++) {
          const raw = fd[Math.floor(i * fd.length / bins)] ?? 0
          const p = smoothed[i] ?? raw
          const v = p > raw ? p * 0.84 + raw * 0.16 : p * 0.25 + raw * 0.75
          smoothed[i] = v
          const barH = Math.max(2, v * H * 0.90 * iScale)
          const bw = W / bins
          const x = i * bw + bw * 0.1
          const w = bw * 0.8
          const hueVal = color === 'rainbow' ? (i / (bins - 1)) * 220 : hexHue(color) + (i / (bins - 1) - 0.5) * 40
          const barTop = H - barH
          ctx!.fillStyle = `hsla(${hueVal},70%,42%,0.55)`
          ctx!.beginPath()
          if ('roundRect' in ctx!) ctx!.roundRect(x, barTop, w, barH, [3, 3, 0, 0])
          else ctx!.rect(x, barTop, w, barH)
          ctx!.fill()
          ctx!.save()
          ctx!.shadowColor = `hsl(${hueVal},100%,70%)`
          ctx!.shadowBlur = 6
          ctx!.fillStyle = `hsl(${hueVal},100%,78%)`
          ctx!.fillRect(x, barTop, w, 2)
          ctx!.restore()
          const pk = peaksRef.current[i]
          if (barTop < pk.pos) { pk.pos = barTop; pk.vel = 0 }
          pk.vel += 0.5; pk.pos += pk.vel
          if (pk.pos > H - 3) { pk.pos = H - 3; pk.vel = 0 }
          ctx!.save()
          ctx!.shadowColor = `hsl(${hueVal},100%,75%)`
          ctx!.shadowBlur = 10
          ctx!.beginPath()
          ctx!.arc(x + w / 2, pk.pos, w * 0.42, 0, Math.PI * 2)
          ctx!.fillStyle = `hsl(${hueVal},100%,82%)`
          ctx!.fill()
          ctx!.restore()
        }
      }
      rafId = requestAnimationFrame(tick)
    }
    rafId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafId)
  }, [visualizer.type])

  useEffect(() => {
    if (visualizer.type !== 'particle') return
    const canvas = particleCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    canvas.width = canvas.offsetWidth || 640
    canvas.height = canvas.offsetHeight || 360
    let rafId: number
    let tAnim = 0
    let prevBass = 0
    function tick() {
      tAnim += 0.016
      const W = canvas!.width, H = canvas!.height
      const fd = freqDataRef.current
      const iScale = visIntensityRef.current / 100
      const sScale = visSizeRef.current / 50
      const bass = fd.slice(0, 10).reduce((s, v) => s + v, 0) / 10
      const bassDelta = Math.max(0, bass - prevBass)
      prevBass = bass * 0.82 + prevBass * 0.18
      const isBeat = bassDelta > 0.11
      ctx!.fillStyle = `rgba(0,0,0,${isBeat ? 0.38 : 0.22})`
      ctx!.fillRect(0, 0, W, H)
      particlesRef.current!.forEach(p => {
        const dx = 0.5 - p.x, dy = 0.5 - p.y
        if (isBeat) {
          p.vx -= dx * bassDelta * 0.28
          p.vy -= dy * bassDelta * 0.28
        }
        p.vx += dx * bass * 0.015 * iScale
        p.vy += dy * bass * 0.015 * iScale
        p.vx += (Math.random() - 0.5) * 0.0006
        p.vy += (Math.random() - 0.5) * 0.0006
        const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy)
        const maxSpeed = (0.012 + bassDelta * 0.09) * Math.max(0.3, iScale)
        if (speed > maxSpeed) { p.vx *= maxSpeed / speed; p.vy *= maxSpeed / speed }
        p.x = ((p.x + p.vx) + 1) % 1
        p.y = ((p.y + p.vy) + 1) % 1
        const bin = Math.min(fd.length - 1, Math.floor(p.x * fd.length))
        const e = fd[bin] ?? 0
        const color = visColorRef.current
        const hue = color === 'rainbow'
          ? (p.x * 220 + tAnim * 30) % 360
          : (hexHue(color) + (p.x - 0.5) * 60 + tAnim * 15) % 360
        ctx!.save()
        ctx!.shadowColor = `hsl(${hue},100%,65%)`
        ctx!.shadowBlur = isBeat ? e * 22 * iScale + 7 : e * 14 * iScale + 2
        ctx!.beginPath()
        ctx!.arc(p.x * W, p.y * H, p.r * sScale * (1 + e * 2.5 + bassDelta * 3.5), 0, Math.PI * 2)
        ctx!.fillStyle = `hsla(${hue},100%,${70 + bassDelta * 25}%,${0.45 + e * 0.55})`
        ctx!.fill()
        ctx!.restore()
      })
      rafId = requestAnimationFrame(tick)
    }
    rafId = requestAnimationFrame(tick)
    return () => { cancelAnimationFrame(rafId); ctx?.clearRect(0, 0, canvas!.width, canvas!.height) }
  }, [visualizer.type])

  // 새 24종 비주얼라이저 — particleCanvasRef 풀프레임 렌더
  useEffect(() => {
    if (!NEW_VIS_TYPES.has(visualizer.type)) return
    const canvas = particleCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    canvas.width = canvas.offsetWidth || 640
    canvas.height = canvas.offsetHeight || 360
    newVisStateRef.current = makeVisState()
    let rafId: number
    function tick() {
      // 높이·가로폭 슬라이더 변경 시 캔버스 해상도를 CSS 크기에 맞게 갱신
      const cssW = canvas!.offsetWidth
      const cssH = canvas!.offsetHeight
      if (cssW > 0 && cssH > 0 && (canvas!.width !== cssW || canvas!.height !== cssH)) {
        canvas!.width = cssW
        canvas!.height = cssH
      }
      const W = canvas!.width, H = canvas!.height
      const vals = freqDataRef.current.length ? [...freqDataRef.current] : new Array(80).fill(0)
      const iScale = visIntensityRef.current / 100
      const color = visColorRef.current
      const st = newVisStateRef.current!
      switch (visualizer.type) {
        case 'classic-bars':       drawClassicBars(ctx!, vals, W, H, color, iScale); break
        case 'mirror-bars':        drawMirrorBars(ctx!, vals, W, H, color, iScale); break
        case 'neon-glow':          drawNeonGlow(ctx!, vals, W, H, color, iScale, st); break
        case 'waveform-line':      drawWaveformLine(ctx!, vals, W, H, color, iScale); break
        case 'circular-eq':        drawCircularEQ(ctx!, vals, W, H, color, iScale); break
        case 'stacked-layers':     drawStackedLayers(ctx!, vals, W, H, color, iScale); break
        case 'dot-matrix':         drawDotMatrix(ctx!, vals, W, H, color, iScale); break
        case 'spectrum-fire':      drawSpectrumFire(ctx!, vals, W, H, color, iScale, st); break
        case '3d-perspective':     draw3DPerspective(ctx!, vals, W, H, color, iScale); break
        case 'glitch-shift':       drawGlitchShift(ctx!, vals, W, H, color, iScale, st); break
        case 'spiral-eq':          drawSpiralEQ(ctx!, vals, W, H, color, iScale, st); break
        case 'tunnel-rings':       drawTunnelRings(ctx!, vals, W, H, color, iScale, st); break
        case 'frequency-mountain': drawFrequencyMountain(ctx!, vals, W, H, color, iScale); break
        case 'starburst':          drawStarburst(ctx!, vals, W, H, color, iScale, st); break
        case 'block-steps':        drawBlockSteps(ctx!, vals, W, H, color, iScale, st); break
        case 'aurora-curtains':    drawAuroraCurtains(ctx!, vals, W, H, color, iScale, st); break
        case 'dna-helix':          drawDnaHelix(ctx!, vals, W, H, color, iScale, st); break
        case 'vinyl-grooves':      drawVinylGrooves(ctx!, vals, W, H, color, iScale, st); break
        case 'laser-harp':         drawLaserHarp(ctx!, vals, W, H, color, iScale); break
        case 'neon-cityscape':     drawNeonCityscape(ctx!, vals, W, H, color, iScale, st); break
        case 'prism-split':        drawPrismSplit(ctx!, vals, W, H, color, iScale); break
        case 'lightning-bolt':     drawLightningBolt(ctx!, vals, W, H, color, iScale); break
        case 'arcade-spectrum':    drawArcadeSpectrum(ctx!, vals, W, H, color, iScale); break
        case 'liquid-mercury':     drawLiquidMercury(ctx!, vals, W, H, color, iScale, st); break
        default: ctx!.clearRect(0, 0, W, H)
      }
      rafId = requestAnimationFrame(tick)
    }
    rafId = requestAnimationFrame(tick)
    return () => { cancelAnimationFrame(rafId); ctx?.clearRect(0, 0, canvas!.width, canvas!.height) }
  }, [visualizer.type])

  useEffect(() => {
    const el = timelineRowRef.current
    if (!el) return
    function onWheel(e: WheelEvent) {
      e.preventDefault()
      setZoom(prev => Math.max(0.3, Math.min(20, prev * (e.deltaY < 0 ? 1.15 : 0.87))))
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [])

  const data = freqData.length ? freqData : waveformFor(trackIdx + 1, 80)
  freqDataRef.current = data
  const energy = data.reduce((s, v) => s + v, 0) / Math.max(data.length, 1)
  const visColor = visualizer.color
  const sizeScale = visualizer.size / 50
  const intensityScale = visualizer.intensity / 100

  const accTime = tracks.slice(0, Math.max(0, trackIdx)).reduce((s, t) => s + t.durationSec, 0)
  const playlistCurrentTime = accTime + Math.min(currentTime, tracks[Math.max(0, trackIdx)]?.durationSec ?? 0)
  const playheadPx = clipPxFromTime(playlistCurrentTime, tracks, zoom)

  return (
    <div className="step2">
      {/* 좌측 — 테마 & 비주얼 */}
      <div className="s2-panel">
        <div className="s2-panel__head">
          <span>테마 & 비주얼</span>
          <Button variant="ghost" size="icon"><Icon name="plus" size={14} /></Button>
        </div>
        <div className="s2-panel__body">
          <div className="s2-section-label">프리셋</div>
          <div className="theme-grid">
            {THEMES.map(t => (
              <div
                key={t.id}
                className={`theme-card${theme === t.id ? ' theme-card--active' : ''}`}
                style={{ background: t.bg }}
                onClick={() => setTheme(t.id)}
              >
                <div className="theme-card__label">{t.label}</div>
              </div>
            ))}
          </div>

          <hr className="divider" />
          <div className="s2-section-label">비주얼라이저</div>
          <div className="vis-shape-grid">
            {VIS_SHAPES.map(s => (
              <div
                key={s.id}
                className={`vis-shape-card${visualizer.type === s.id ? ' vis-shape-card--active' : ''}`}
                onClick={() => setVisualizer(prev => ({ ...prev, type: s.id }))}
              >
                {s.label}
              </div>
            ))}
          </div>
          <div className="vis-color-swatches">
            {VIS_COLORS.map(hex => (
              <div
                key={hex}
                className={`vis-color-swatch${visualizer.color === hex ? ' vis-color-swatch--active' : ''}${hex === 'rainbow' ? ' vis-color-swatch--rainbow' : ''}`}
                style={hex === 'rainbow' ? {} : { background: hex === '#ffffff' ? 'rgba(255,255,255,0.9)' : hex }}
                onClick={() => setVisualizer(prev => ({ ...prev, color: hex }))}
              />
            ))}
          </div>
          <div className="slider-row">
            <div className="slider-row__label">높이</div>
            <input className="slider" type="range" min={0} max={100}
              value={visualizer.size}
              onChange={e => setVisualizer(prev => ({ ...prev, size: Number(e.target.value) }))}
            />
            <div className="slider-row__value">{visualizer.size}</div>
          </div>
          <div className="slider-row">
            <div className="slider-row__label">가로 폭</div>
            <input className="slider" type="range" min={10} max={100}
              value={visualizer.width}
              onChange={e => setVisualizer(prev => ({ ...prev, width: Number(e.target.value) }))}
            />
            <div className="slider-row__value">{visualizer.width}%</div>
          </div>
          <div className="slider-row">
            <div className="slider-row__label">강도</div>
            <input className="slider" type="range" min={0} max={100}
              value={visualizer.intensity}
              onChange={e => setVisualizer(prev => ({ ...prev, intensity: Number(e.target.value) }))}
            />
            <div className="slider-row__value">{visualizer.intensity}</div>
          </div>
          <div className="slider-row">
            <div className="slider-row__label">불투명도</div>
            <input className="slider" type="range" min={0} max={100}
              value={visualizer.opacity}
              onChange={e => setVisualizer(prev => ({ ...prev, opacity: Number(e.target.value) }))}
            />
            <div className="slider-row__value">{visualizer.opacity}</div>
          </div>
        </div>
      </div>

      {/* 중앙 — 스테이지 */}
      <div className="s2-stage">
        <div className="s2-stage__top">
          <div className="s2-timecode">{fmt(Math.min(currentTime, totalSec))} / {fmt(totalSec)}</div>
          <div className="legend">
            <span className="legend__item">1920×1080</span>
            <span className="legend__item">30 fps</span>
            <span className="legend__item">H.264</span>
          </div>
        </div>
        <div className="s2-stage__viewport">
          <div
            className="s2-stage__frame"
            ref={frameRef}
            style={{ background: background.src ? undefined : themeObj.bg }}
          >
            {background.src && <img className="s2-frame__bg-img" src={background.src} alt="" />}
            {effects.blur && <div className="s2-frame__blur-overlay" />}
            <div className="s2-frame__content">
              {!logo && <div className="s2-frame__logo"><Icon name="logo" size={26} /></div>}
            </div>
            {typography.showTitle && (
              <div
                className={`s2-frame__title-block title-style-${typography.titleStyle} title-deco-${typography.titleDeco}`}
                style={{
                  left: `${typography.titlePosition.x}%`,
                  top: `${typography.titlePosition.y}%`,
                  fontFamily: FONT_MAP[typography.titleFont] ?? FONT_MAP.inter,
                  transform: `translate(${typography.titleAlign === 'left' ? '0' : typography.titleAlign === 'right' ? '-100%' : '-50%'}, -50%)`,
                  alignItems: typography.titleAlign === 'left' ? 'flex-start' : typography.titleAlign === 'right' ? 'flex-end' : 'center',
                  textAlign: typography.titleAlign,
                }}
                data-caption={typography.titleCaptionTop || playingTrack?.title}
                onMouseDown={handleTitleMouseDown}
              >
                {DECO_CAPTION_KEYS.has(typography.titleDeco) && typography.titleCaptionTop && (
                  <span className="title-deco__top">{typography.titleCaptionTop}</span>
                )}
                <h2
                  className="s2-frame__title"
                  data-text={playingTrack?.title}
                  style={{
                    fontSize: `${typography.titleSize}px`,
                    letterSpacing: `${typography.letterSpacing / 1000}em`,
                  }}
                >
                  {playingTrack?.title}
                </h2>
                {DECO_CAPTION_KEYS.has(typography.titleDeco) && typography.titleCaptionBottom && (
                  <span className="title-deco__bottom">{typography.titleCaptionBottom}</span>
                )}
              </div>
            )}
            {typography.showSub && (
              <div
                className="s2-frame__sub"
                style={{
                  left: `${typography.subPosition.x}%`,
                  top: `${typography.subPosition.y}%`,
                  fontSize: `${typography.subSize}px`,
                  letterSpacing: `${typography.subLetterSpacing / 1000}em`,
                }}
                onMouseDown={handleSubMouseDown}
              >
                {playingTrack?.artist && playingTrack.artist !== 'Unknown' ? `${playingTrack.artist} · ` : ''}Track {String(trackIdx + 1).padStart(2, '0')} / {tracks.length}
              </div>
            )}

            {effects.vis && (
              <>
                {/* 풀프레임 canvas — particle + 24종 새 타입 */}
                {(visualizer.type === 'particle' || NEW_VIS_TYPES.has(visualizer.type)) && (
                  <canvas
                    ref={particleCanvasRef}
                    className="s2-frame__particle-canvas"
                    style={{
                      opacity: visualizer.opacity / 100,
                      ...(NEW_VIS_TYPES.has(visualizer.type) ? {
                        top: `${visualizer.y}%`,
                        right: 'auto',
                        bottom: 'auto',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: `${Math.max(5, visualizer.width)}%`,
                        height: `${Math.max(5, visualizer.size)}%`,
                        pointerEvents: 'auto',
                        cursor: 'ns-resize',
                      } : {})
                    }}
                    onMouseDown={NEW_VIS_TYPES.has(visualizer.type) ? handleVisMouseDown : undefined}
                  />
                )}

                {/* 막대 타입: bars / glow / peak */}
                {visualizer.type !== 'particle' && !NEW_VIS_TYPES.has(visualizer.type) && (
                  <div
                    className="s2-frame__wave"
                    style={{
                      opacity: visualizer.opacity / 100,
                      ...waveContainerStyle(visualizer.y, visualizer.size, visualizer.width),
                    }}
                    onMouseDown={handleVisMouseDown}
                  >
                    {/* Bars — 그라데이션 + 반사 */}
                    {visualizer.type === 'bars' && (
                      <svg className="s2-frame__wave-svg" viewBox={`0 0 ${data.length} 100`} preserveAspectRatio="none">
                        {data.map((h, i) => {
                          const barH = Math.max(1, h * intensityScale * 80)
                          const color = barColor(i, data.length, energy, visualizer.color)
                          return (
                            <g key={i}>
                              <rect x={i + 0.08} y={80 - barH} width={0.84} height={barH} fill={color} opacity="0.95" rx="0.35" />
                              <rect x={i + 0.08} y={81} width={0.84} height={barH * 0.36} fill={color} opacity="0.18" rx="0.35" />
                            </g>
                          )
                        })}
                        <rect x="0" y="80.4" width={data.length} height="0.5" fill="rgba(255,255,255,0.09)" />
                      </svg>
                    )}
                    {/* Glow / Peak — canvas */}
                    {(visualizer.type === 'glow' || visualizer.type === 'peak') && (
                      <canvas ref={barsCanvasRef} className="s2-frame__bars-canvas" />
                    )}
                  </div>
                )}

              </>
            )}

            {logo && (
              <img
                className="s2-frame__logo-drag"
                src={logo}
                alt=""
                style={{ left: `${logoPosition.x}%`, top: `${logoPosition.y}%`, width: `${logoSize}px`, height: `${logoSize}px` }}
                onMouseDown={handleLogoMouseDown}
                draggable={false}
              />
            )}
          </div>
        </div>
        <div className="s2-stage__controls">
          <Button variant="ghost" size="icon" data-testid="stage-skip-prev" onClick={() => onSkipPrev()}><Icon name="skipBack" size={14} /></Button>
          <button type="button" className="s2-play-btn" onClick={() => { if (isPlaying) { onPause() } else if (playingTrack) { onPlay(playingTrack.id) } }}><Icon name={isPlaying ? 'pause' : 'play'} size={14} /></button>
          <Button variant="ghost" size="icon" data-testid="stage-skip-next" onClick={() => onSkipNext()}><Icon name="skipForward" size={14} /></Button>
        </div>
        <div className="s2-timeline">
          <div className="s2-timeline__head">
            <span>타임라인</span>
            <span>줌 {Math.round(zoom / 1.5 * 100)}%</span>
          </div>
          <div className="s2-timeline__row" ref={timelineRowRef} style={{ position: 'relative' }}
            onMouseDown={e => {
              const row = timelineRowRef.current!
              const rect = row.getBoundingClientRect()
              const px = Math.max(0, e.clientX - rect.left + row.scrollLeft - 14)
              onSeekRef.current(pxToTime(px, tracksRef.current, zoomRef.current))
              clipHeadIsDragging.current = true
            }}
          >
            {tracks.slice(0, 8).map((t, i) => (
              <div
                key={t.id}
                className={`s2-clip${playingId === t.id ? ' s2-clip--active' : ''}`}
                style={{ width: clipW(t, zoom) }}
                onClick={() => onPlay(t.id)}
              >
                {String(i + 1).padStart(2, '0')} · {t.title}
              </div>
            ))}
            {tracks.length > 0 && (
              <div
                className="s2-timeline__clip-playhead"
                style={{ left: `${14 + playheadPx}px` }}
              />
            )}
          </div>
        </div>
      </div>

      {/* 우측 — 효과 & 타이틀 */}
      <div className="s2-panel">
        <div className="s2-panel__tabs">
          <button
            className={`s2-tab${activeRightTab === 'title' ? ' s2-tab--active' : ''}`}
            onClick={() => setActiveRightTab('title')}
          >타이틀</button>
          <button
            className={`s2-tab${activeRightTab === 'effects' ? ' s2-tab--active' : ''}`}
            onClick={() => setActiveRightTab('effects')}
          >효과</button>
        </div>
        <div className="s2-panel__body">
          {activeRightTab === 'effects' ? (
            <>
              <div className="effect-list">
                {EFFECT_ITEMS.map(({ key, icon, title, sub }) => (
                  <div
                    key={key}
                    className={`effect-chip${effects[key] ? ' effect-chip--on' : ''}`}
                    onClick={() => setEffects({ ...effects, [key]: !effects[key] })}
                  >
                    <div className="effect-chip__icon"><Icon name={icon} size={16} /></div>
                    <div className="effect-chip__meta">
                      <div className="effect-chip__title">{title}</div>
                      <div className="effect-chip__sub">{sub}</div>
                    </div>
                    <div className="effect-chip__toggle" onClick={e => e.stopPropagation()}>
                      <Switch on={effects[key]} onChange={() => setEffects({ ...effects, [key]: !effects[key] })} />
                    </div>
                  </div>
                ))}
              </div>

              <hr className="divider" />
              <div className="s2-section-label">타이포그래피</div>

              <div className="typo-toggle-row">
                <span className="typo-toggle-row__label">트랙</span>
                <Switch on={typography.showSub} onChange={() => setTypography({ ...typography, showSub: !typography.showSub })} />
              </div>
              {typography.showSub && (
                <>
                  <div className="slider-row">
                    <div className="slider-row__label">크기</div>
                    <input className="slider" type="range" min={10} max={40}
                      value={typography.subSize}
                      onChange={e => setTypography({ ...typography, subSize: Number(e.target.value) })}
                    />
                    <div className="slider-row__value">{typography.subSize}</div>
                  </div>
                  <div className="slider-row">
                    <div className="slider-row__label">자간</div>
                    <input className="slider" type="range" min={-50} max={50}
                      value={typography.subLetterSpacing}
                      onChange={e => setTypography({ ...typography, subLetterSpacing: Number(e.target.value) })}
                    />
                    <div className="slider-row__value">{typography.subLetterSpacing}</div>
                  </div>
                </>
              )}

              {logo && (
                <>
                  <hr className="divider" />
                  <div className="s2-section-label">로고</div>
                  <div className="slider-row">
                    <div className="slider-row__label">크기</div>
                    <input className="slider" type="range" min={24} max={120}
                      value={logoSize}
                      onChange={e => setLogoSize(Number(e.target.value))}
                    />
                    <div className="slider-row__value">{logoSize}px</div>
                  </div>
                  <div className="s2-hint">위치는 마우스로 조정</div>
                </>
              )}

            </>
          ) : (
            <>
              {/* 곡 제목 표시 */}
              <div className="typo-toggle-row">
                <span className="typo-toggle-row__label">곡 제목 표시</span>
                <Switch
                  on={typography.showTitle}
                  onChange={() => setTypography(prev => ({ ...prev, showTitle: !prev.showTitle }))}
                />
              </div>

              <div className="slider-row">
                <div className="slider-row__label">크기</div>
                <input
                  className="slider"
                  type="range"
                  min={20}
                  max={80}
                  value={typography.titleSize}
                  onChange={e => setTypography(prev => ({ ...prev, titleSize: Number(e.target.value) }))}
                />
                <div className="slider-row__value">{typography.titleSize}</div>
              </div>
              <div className="slider-row">
                <div className="slider-row__label">자간</div>
                <input
                  className="slider"
                  type="range"
                  min={-50}
                  max={50}
                  value={typography.letterSpacing}
                  onChange={e => setTypography(prev => ({ ...prev, letterSpacing: Number(e.target.value) }))}
                />
                <div className="slider-row__value">{typography.letterSpacing}</div>
              </div>

              {/* 기본 스타일 */}
              <div className="title-section">
                <div className="s2-section-label">기본 스타일</div>
                <div className="title-style-grid">
                  {TITLE_BASE_STYLES.map(({ id, label }) => (
                    <button
                      key={id}
                      className={`title-style-btn${typography.titleStyle === id ? ' title-style-btn--active' : ''}`}
                      onClick={() => setTypography(prev => ({ ...prev, titleStyle: id }))}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 데코 스타일 */}
              <div className="title-section">
                <div className="s2-section-label">데코 스타일</div>
                <div className="title-style-grid">
                  {TITLE_DECO_STYLES.map(({ id, label }) => (
                    <button
                      key={id}
                      className={`title-style-btn${typography.titleDeco === id ? ' title-style-btn--active' : ''}`}
                      onClick={() => setTypography(prev => ({
                        ...prev,
                        titleDeco: prev.titleDeco === id ? 'none' : id,
                      }))}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                {/* 스타일별 입력 — caption/divider/frame/bar-left일 때만 */}
                {DECO_CAPTION_KEYS.has(typography.titleDeco) && (
                  <>
                    <input
                      className="title-caption-input"
                      placeholder="상단 캡션"
                      value={typography.titleCaptionTop}
                      onChange={e => setTypography(prev => ({ ...prev, titleCaptionTop: e.target.value }))}
                    />
                    <input
                      className="title-caption-input"
                      placeholder="하단 캡션"
                      value={typography.titleCaptionBottom}
                      onChange={e => setTypography(prev => ({ ...prev, titleCaptionBottom: e.target.value }))}
                    />
                  </>
                )}
              </div>

              {/* 폰트 */}
              <div className="title-section">
                <div className="s2-section-label">폰트</div>
                <div className="title-font-grid">
                  {TITLE_FONTS.map(({ key, label, sample }) => (
                    <button
                      key={key}
                      className={`title-font-btn${typography.titleFont === key ? ' title-font-btn--active' : ''}`}
                      style={{ fontFamily: FONT_MAP[key] }}
                      onClick={() => setTypography(prev => ({ ...prev, titleFont: key }))}
                    >
                      <span className="title-font-btn__sample">{sample}</span>
                      <span className="title-font-btn__label" style={{ fontFamily: 'var(--f-sans)' }}>{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 위치 */}
              <div className="title-section">
                <div className="s2-section-label">위치</div>
                <div className="title-align-row">
                  {(['left', 'center', 'right'] as const).map(a => (
                    <button
                      key={a}
                      className={`title-align-btn${typography.titleAlign === a ? ' title-align-btn--active' : ''}`}
                      onClick={() => setTypography(prev => ({ ...prev, titleAlign: a }))}
                    >
                      {a === 'left' ? '왼쪽' : a === 'center' ? '가운데' : '오른쪽'}
                    </button>
                  ))}
                </div>
                <div className="title-pos-grid">
                  {(Object.keys(PRESET_COORDS) as TitlePositionPreset[]).map(preset => (
                    <button
                      key={preset}
                      className={`title-pos-btn${typography.titlePositionPreset === preset ? ' title-pos-btn--active' : ''}`}
                      data-preset={preset}
                      onClick={() => setTypography(prev => ({
                        ...prev,
                        titlePositionPreset: preset,
                        titlePosition: PRESET_COORDS[preset],
                      }))}
                    >
                      <span className={`title-pos-dot${typography.titlePositionPreset === preset ? ' title-pos-dot--active' : ''}`} />
                    </button>
                  ))}
                </div>
              </div>

            </>
          )}
          <hr className="divider" />
          <div className="s2-nav">
            <Button onClick={onBack}><Icon name="chevronLeft" size={14} /> 이전</Button>
            <Button variant="primary" onClick={onNext}>다음 <Icon name="arrowRight" size={14} /></Button>
          </div>
        </div>
      </div>
    </div>
  )
}
