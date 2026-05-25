// Step 2 — 비주얼 편집: 테마 선택, 스테이지 미리보기, 효과 설정
import './Step2.css'
import React, { useRef, useEffect, useState } from 'react'
import Icon from '../../../icons'
import Button from '../../shared/Button'
import Switch from '../../shared/Switch'
import { waveformFor } from '../../../data/sampleTracks'
import type { Track, Effects, Visualizer, Typography, Background, LogoPosition } from '../../../types'

const THEMES = [
  { id: 'midnight', label: 'Midnight',  bg: 'linear-gradient(135deg, #0c1a2e, #050813)' },
  { id: 'cyanwave', label: 'Cyan Wave', bg: 'linear-gradient(135deg, #042f3f, #0a647a)' },
  { id: 'sunset',   label: 'Sunset',    bg: 'linear-gradient(135deg, #2a0f2e, #6d2c4a)' },
  { id: 'forest',   label: 'Forest',    bg: 'linear-gradient(135deg, #0c1e16, #1f3d2c)' },
  { id: 'cream',    label: 'Cream',     bg: 'linear-gradient(135deg, #f3ead8, #d9c7a3)' },
  { id: 'mono',     label: 'Mono',      bg: 'linear-gradient(135deg, #0a0a0a, #2a2a2a)' },
]

const VIS_SHAPES: { id: Visualizer['type'], label: string }[] = [
  { id: 'bars',     label: 'Bars'     },
  { id: 'mirror',   label: 'Mirror'   },
  { id: 'waveform', label: 'Waveform' },
  { id: 'scope',    label: 'Scope'    },
  { id: 'led',      label: 'LED'      },
  { id: 'rain',     label: 'Rain'     },
  { id: 'circular', label: 'Circular' },
  { id: 'burst',    label: 'Burst'    },
  { id: 'tunnel',   label: 'Tunnel'   },
  { id: 'galaxy',   label: 'Galaxy'   },
  { id: 'prism',    label: 'Prism'    },
  { id: 'pulse',    label: 'Pulse'    },
]

// 원형 중심 타입 — 좌표 앵커 포지셔닝 사용
const COMPACT_VIS: Visualizer['type'][] = ['circular', 'burst', 'tunnel', 'galaxy', 'prism', 'pulse']

const VIS_COLORS = [
  '#00d4ff', '#a855f7', '#fbbf24', '#f97316', '#22c55e', '#ff3b5c',
  '#00ffcc', '#818cf8', '#fb7185', '#84cc16', '#f0abfc', '#ffffff',
]

const EFFECT_ITEMS = [
  { key: 'vis'       as const, icon: 'waveform', title: '오디오 비주얼라이저', sub: '파형이 음원에 반응' },
  { key: 'crossfade' as const, icon: 'repeat',   title: '크로스페이드',        sub: '트랙 간 2초 페이드' },
  { key: 'ducking'   as const, icon: 'sliders',  title: '자동 레벨',           sub: '트랙별 −14 LUFS 정규화' },
  { key: 'blur'      as const, icon: 'sparkles', title: '배경 블러',           sub: '깊이감 부여 · 24px' },
]

const fmt = (sec: number) => {
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function waveContainerStyle(y: number, size: number): React.CSSProperties {
  const h = `${Math.max(10, Math.round(size * 0.8))}px`
  return { top: `${y}%`, transform: 'translateY(-50%)', height: h, cursor: 'ns-resize' }
}

function rainbowColor(i: number, total: number, energy: number): string {
  const hue = (i / Math.max(total - 1, 1)) * 240
  const lightness = 50 + energy * 30
  return `hsl(${hue}, 100%, ${lightness}%)`
}

function energyColor(energy: number): string {
  return `hsl(${energy * 240}, 100%, ${50 + energy * 30}%)`
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
  analyserRef: React.RefObject<AnalyserNode | null>
}

export default function Step2({ tracks, theme, setTheme, effects, setEffects, visualizer, setVisualizer, typography, setTypography, onBack, onNext, playingId, isPlaying, onPlay, onPause, onSkipNext, onSkipPrev, background, logo, logoPosition, setLogoPosition, logoSize, setLogoSize, currentTime, analyserRef }: Step2Props) {
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
        setFreqData(logMap!.map(({ lo, hi }) => {
          let s = 0, n = 0
          for (let b = lo; b <= hi; b++) { s += buf![b]; n++ }
          return n ? s / n / 255 : 0
        }))
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
    }
    function onMouseUp() {
      isDragging.current = false
      visIsDragging.current = false
      titleIsDragging.current = false
      subIsDragging.current = false
    }
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
    return () => {
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
    }
  }, [setLogoPosition, setVisualizer])

  const data = freqData.length ? freqData : waveformFor(trackIdx + 1, 80)
  const energy = data.reduce((s, v) => s + v, 0) / Math.max(data.length, 1)
  const visColor = visualizer.color
  const sizeScale = visualizer.size / 50
  const intensityScale = visualizer.intensity / 100

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
                className={`vis-color-swatch${visualizer.color === hex ? ' vis-color-swatch--active' : ''}`}
                style={{ background: hex === '#ffffff' ? 'rgba(255,255,255,0.9)' : hex }}
                onClick={() => setVisualizer(prev => ({ ...prev, color: hex }))}
              />
            ))}
          </div>
          <div className="slider-row">
            <div className="slider-row__label">크기</div>
            <input className="slider" type="range" min={0} max={100}
              value={visualizer.size}
              onChange={e => setVisualizer(prev => ({ ...prev, size: Number(e.target.value) }))}
            />
            <div className="slider-row__value">{visualizer.size}</div>
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
            <h2
              className="s2-frame__title"
              style={{
                fontSize: `${typography.titleSize}px`,
                letterSpacing: `${typography.letterSpacing / 1000}em`,
                left: `${typography.titlePosition.x}%`,
                top: `${typography.titlePosition.y}%`,
              }}
              onMouseDown={handleTitleMouseDown}
            >
              {playingTrack?.title}
            </h2>
            <div
              className="s2-frame__sub"
              style={{
                left: `${typography.subPosition.x}%`,
                top: `${typography.subPosition.y}%`,
              }}
              onMouseDown={handleSubMouseDown}
            >
              {playingTrack?.artist && playingTrack.artist !== 'Unknown' ? `${playingTrack.artist} · ` : ''}Track {String(trackIdx + 1).padStart(2, '0')} / {tracks.length}
            </div>

            {effects.vis && (
              <>
                {/* 와이드 타입: bars / mirror / waveform / scope / led / rain */}
                {!COMPACT_VIS.includes(visualizer.type) && (
                  <div
                    className="s2-frame__wave"
                    style={{
                      opacity: visualizer.opacity / 100,
                      filter: energy > 0.05 ? `drop-shadow(0 0 ${Math.round(energy * intensityScale * 20)}px ${energyColor(energy)})` : undefined,
                      ...waveContainerStyle(visualizer.y, visualizer.size),
                    }}
                    onMouseDown={handleVisMouseDown}
                  >
                    {/* Bars — 그라디언트 막대 */}
                    {visualizer.type === 'bars' && data.map((h, i) => (
                      <div
                        key={i}
                        className="s2-frame__wave-bar"
                        style={{
                          height: `${h * intensityScale * 100}%`,
                          background: rainbowColor(i, data.length, energy),
                        }}
                      />
                    ))}

                    {/* Mirror — 상하 대칭 막대 */}
                    {visualizer.type === 'mirror' && (
                      <svg className="s2-frame__wave-svg" viewBox={`0 0 ${data.length} 80`} preserveAspectRatio="none">
                        {data.map((h, i) => {
                          const barH = h * intensityScale * 36
                          return <rect key={i} x={i + 0.1} y={40 - barH} width={0.8} height={barH * 2}
                            fill={rainbowColor(i, data.length, energy)} opacity="0.8" />
                        })}
                      </svg>
                    )}

                    {/* Waveform — 채워진 파형 */}
                    {visualizer.type === 'waveform' && (
                      <svg className="s2-frame__wave-svg" viewBox="0 0 80 40" preserveAspectRatio="none">
                        <defs>
                          <linearGradient id="wfg" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={energyColor(energy)} stopOpacity="0.7" />
                            <stop offset="100%" stopColor={energyColor(energy)} stopOpacity="0.02" />
                          </linearGradient>
                        </defs>
                        <path
                          d={`M0,40 ${data.map((h, i) => `L${i},${40 - h * intensityScale * 38}`).join(' ')} L79,40 Z`}
                          fill="url(#wfg)"
                        />
                        <polyline
                          points={data.map((h, i) => `${i},${40 - h * intensityScale * 38}`).join(' ')}
                          fill="none" stroke={energyColor(energy)} strokeWidth="1" opacity="0.9"
                        />
                      </svg>
                    )}

                    {/* Scope — 오실로스코프 파형 */}
                    {visualizer.type === 'scope' && (
                      <svg className="s2-frame__wave-svg" viewBox="0 0 80 40" preserveAspectRatio="none">
                        <line x1="0" y1="20" x2="80" y2="20" stroke={visColor} strokeWidth="0.3" opacity="0.25" />
                        <polyline
                          points={data.map((h, i) => `${i},${20 - Math.sin(i * 0.3) * h * intensityScale * 18}`).join(' ')}
                          fill="none" stroke={energyColor(energy)} strokeWidth="1.2" opacity="0.9"
                          strokeLinecap="round" strokeLinejoin="round"
                        />
                      </svg>
                    )}

                    {/* LED — 격자 도트 */}
                    {visualizer.type === 'led' && (() => {
                      const cols = 20, rows = 8
                      return (
                        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gridTemplateRows: `repeat(${rows}, 1fr)`, gap: '1.5px', width: '100%', height: '100%' }}>
                          {Array.from({ length: rows }, (_, row) =>
                            Array.from({ length: cols }, (_, col) => {
                              const h = data[Math.floor(col * (data.length / cols))]
                              const isActive = (rows - 1 - row) / rows < h * intensityScale
                              return (
                                <div key={`${row}-${col}`} style={{
                                  borderRadius: '2px',
                                  background: isActive ? rainbowColor(col, cols, energy) : 'rgba(255,255,255,0.07)',
                                }} />
                              )
                            })
                          ).flat()}
                        </div>
                      )
                    })()}

                    {/* Rain — 수직 도트 컬럼 */}
                    {visualizer.type === 'rain' && (() => {
                      const cols = 24
                      return (
                        <svg className="s2-frame__wave-svg" viewBox={`0 0 ${cols} 40`} preserveAspectRatio="none">
                          {Array.from({ length: cols }, (_, col) => {
                            const h = data[Math.floor(col * data.length / cols)]
                            const dotCount = Math.max(1, Math.floor(h * intensityScale * 12))
                            return Array.from({ length: dotCount }, (_, dot) => (
                              <circle key={`${col}-${dot}`}
                                cx={col + 0.5} cy={39 - dot * 3}
                                r="0.45" fill={rainbowColor(col, cols, energy)} opacity={1 - dot * 0.07}
                              />
                            ))
                          }).flat()}
                        </svg>
                      )
                    })()}
                  </div>
                )}

                {/* 컴팩트 타입: circular/burst/tunnel/galaxy/prism/pulse — SVG 앵커 */}
                {COMPACT_VIS.includes(visualizer.type) && (
                  <div
                    className="s2-frame__orb"
                    style={{
                      opacity: visualizer.opacity / 100,
                      top: `${visualizer.y}%`,
                      left: '50%',
                      filter: energy > 0.05 ? `drop-shadow(0 0 ${Math.round(energy * intensityScale * 20)}px ${energyColor(energy)})` : undefined,
                    }}
                  >
                    <svg
                      viewBox="-100 -100 200 200"
                      width={`${visualizer.size * 2}px`}
                      height={`${visualizer.size * 2}px`}
                      style={{ position: 'absolute', left: 0, top: 0, transform: 'translate(-50%, -50%)', overflow: 'visible' }}
                    >
                      {/* Circular — 원형 스펙트럼 */}
                      {visualizer.type === 'circular' && data.map((h, i) => {
                        const angle = (i / data.length) * 2 * Math.PI - Math.PI / 2
                        const innerR = 28 * sizeScale
                        const barLen = h * intensityScale * 62 * sizeScale
                        const cos = Math.cos(angle), sin = Math.sin(angle)
                        return (
                          <line key={i}
                            x1={cos * innerR} y1={sin * innerR}
                            x2={cos * (innerR + barLen)} y2={sin * (innerR + barLen)}
                            stroke={rainbowColor(i, data.length, energy)} strokeWidth="1.5" opacity="0.85"
                          />
                        )
                      })}

                      {/* Burst — 방사형 선 */}
                      {visualizer.type === 'burst' && data.filter((_, i) => i % 2 === 0).map((h, i) => {
                        const angle = (i / 40) * 2 * Math.PI
                        const r = h * intensityScale * 82 * sizeScale + 4
                        return (
                          <line key={i} x1={0} y1={0}
                            x2={Math.cos(angle) * r} y2={Math.sin(angle) * r}
                            stroke={rainbowColor(i, 40, energy)} strokeWidth="2" opacity="0.8"
                          />
                        )
                      })}

                      {/* Tunnel — 동심 사각형 */}
                      {visualizer.type === 'tunnel' && [1, 0.72, 0.5, 0.32, 0.18].map((scale, i) => {
                        const bandH = data[Math.floor(i * (data.length / 5))]
                        const w = (scale * 78 + bandH * intensityScale * 18) * sizeScale
                        return (
                          <rect key={i} x={-w} y={-w} width={w * 2} height={w * 2}
                            fill="none" stroke={energyColor(energy)} strokeWidth="1.5"
                            opacity={0.9 - i * 0.13}
                          />
                        )
                      })}

                      {/* Galaxy — 원형 궤도 도트 */}
                      {visualizer.type === 'galaxy' && data.map((h, i) => {
                        const angle = (i / data.length) * 2 * Math.PI
                        const r = (30 + h * intensityScale * 58) * sizeScale
                        return (
                          <circle key={i}
                            cx={Math.cos(angle) * r} cy={Math.sin(angle) * r}
                            r={(h * intensityScale * 4 + 0.8) * sizeScale}
                            fill={rainbowColor(i, data.length, energy)} opacity={0.5 + h * 0.5}
                          />
                        )
                      })}

                      {/* Prism — 방사형 삼각 웨지 */}
                      {visualizer.type === 'prism' && data.filter((_, i) => i % 4 === 0).map((h, i) => {
                        const count = 20
                        const a1 = (i / count) * 2 * Math.PI
                        const a2 = ((i + 0.7) / count) * 2 * Math.PI
                        const r = (h * intensityScale * 88 + 6) * sizeScale
                        return (
                          <polygon key={i}
                            points={`0,0 ${Math.cos(a1)*r},${Math.sin(a1)*r} ${Math.cos(a2)*r},${Math.sin(a2)*r}`}
                            fill={rainbowColor(i, 20, energy)} opacity={0.35 + h * 0.55}
                          />
                        )
                      })}

                      {/* Pulse — 동심원 펄스 */}
                      {visualizer.type === 'pulse' && [0, 1, 2, 3].map((ring) => {
                        const bandH = data[Math.floor(ring * data.length / 4)]
                        const r = (ring * 22 + bandH * intensityScale * 20 + 8) * sizeScale
                        return (
                          <circle key={ring} cx={0} cy={0} r={r}
                            fill="none" stroke={energyColor(energy)} strokeWidth="1.5"
                            opacity={0.8 - ring * 0.15}
                          />
                        )
                      })}
                    </svg>
                  </div>
                )}

                {/* 컴팩트 타입 드래그 핸들 */}
                {COMPACT_VIS.includes(visualizer.type) && (
                  <div
                    className="s2-frame__vis-handle"
                    style={{ top: `${visualizer.y}%` }}
                    onMouseDown={handleVisMouseDown}
                  />
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
            <span>스냅 1초 · 줌 50%</span>
          </div>
          <div className="s2-timeline__row">
            {tracks.slice(0, 8).map((t, i) => (
              <div
                key={t.id}
                className={`s2-clip${playingId === t.id ? ' s2-clip--active' : ''}`}
                style={{ width: Math.max(48, t.durationSec * 1.5) }}
                onClick={() => onPlay(t.id)}
              >
                {String(i + 1).padStart(2, '0')} · {t.title}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 우측 — 효과 & 타이포그래피 */}
      <div className="s2-panel">
        <div className="s2-panel__head">
          <span>효과</span>
          <Button variant="ghost" size="icon"><Icon name="plus" size={14} /></Button>
        </div>
        <div className="s2-panel__body">
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
          <div className="slider-row">
            <div className="slider-row__label">제목 크기</div>
            <input className="slider" type="range" min={20} max={80}
              value={typography.titleSize}
              onChange={e => setTypography({ ...typography, titleSize: Number(e.target.value) })}
            />
            <div className="slider-row__value">{typography.titleSize}</div>
          </div>
          <div className="slider-row">
            <div className="slider-row__label">자간</div>
            <input className="slider" type="range" min={-50} max={50}
              value={typography.letterSpacing}
              onChange={e => setTypography({ ...typography, letterSpacing: Number(e.target.value) })}
            />
            <div className="slider-row__value">{typography.letterSpacing}</div>
          </div>

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
