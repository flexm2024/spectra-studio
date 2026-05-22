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
  { id: 'bars',   label: 'Bars'   },
  { id: 'wave',   label: 'Wave'   },
  { id: 'mirror', label: 'Mirror' },
  { id: 'dots',   label: 'Dots'   },
  { id: 'orb',    label: 'Orb'    },
  { id: 'ring',   label: 'Ring'   },
]

// orb, ring은 컴팩트(원형 중심) 타입 — 수직 드래그 핸들 별도 표시
const COMPACT_VIS: Visualizer['type'][] = ['orb', 'ring']

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

interface Step2Props {
  tracks: Track[]
  theme: string
  setTheme: (t: string) => void
  effects: Effects
  setEffects: (e: Effects) => void
  visualizer: Visualizer
  setVisualizer: React.Dispatch<React.SetStateAction<Visualizer>>
  typography: Typography
  setTypography: (t: Typography) => void
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

  useEffect(() => {
    if (!isPlaying) {
      setFreqData([])
      return
    }
    let rafId: number
    const buf = new Uint8Array(128)
    function tick() {
      const analyser = analyserRef.current
      if (analyser) {
        analyser.getByteFrequencyData(buf)
        const step = buf.length / 80
        setFreqData(Array.from({ length: 80 }, (_, i) => buf[Math.floor(i * step)] / 255))
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
    }
    function onMouseUp() {
      isDragging.current = false
      visIsDragging.current = false
    }
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
    return () => {
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
    }
  }, [setLogoPosition, setVisualizer])

  const data = freqData.length ? freqData : waveformFor(trackIdx + 1, 80)

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
          <div className="slider-row">
            <div className="slider-row__label">크기</div>
            <input
              className="slider" type="range" min={0} max={100}
              value={visualizer.size}
              onChange={e => setVisualizer(prev => ({ ...prev, size: Number(e.target.value) }))}
            />
            <div className="slider-row__value">{visualizer.size}</div>
          </div>
          <div className="slider-row">
            <div className="slider-row__label">강도</div>
            <input
              className="slider" type="range" min={0} max={100}
              value={visualizer.intensity}
              onChange={e => setVisualizer(prev => ({ ...prev, intensity: Number(e.target.value) }))}
            />
            <div className="slider-row__value">{visualizer.intensity}</div>
          </div>
          <div className="slider-row">
            <div className="slider-row__label">불투명도</div>
            <input
              className="slider" type="range" min={0} max={100}
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
            {background.src && (
              <img className="s2-frame__bg-img" src={background.src} alt="" />
            )}
            {effects.blur && <div className="s2-frame__blur-overlay" />}
            <div className="s2-frame__content">
              {!logo && (
                <div className="s2-frame__logo"><Icon name="logo" size={26} /></div>
              )}
              <h2
                className="s2-frame__title"
                style={{
                  fontSize: `${typography.titleSize}px`,
                  letterSpacing: `${typography.letterSpacing / 1000}em`,
                }}
              >
                {playingTrack?.title}
              </h2>
              <div className="s2-frame__sub">
                {playingTrack?.artist} · Track {String(trackIdx + 1).padStart(2, '0')} / {tracks.length}
              </div>
            </div>
            {effects.vis && (
              <>
                {/* 와이드 타입: bars / wave / mirror / dots */}
                {!COMPACT_VIS.includes(visualizer.type) && (
                  <div
                    className="s2-frame__wave"
                    style={{ opacity: visualizer.opacity / 100, ...waveContainerStyle(visualizer.y, visualizer.size) }}
                    onMouseDown={handleVisMouseDown}
                  >
                    {visualizer.type === 'bars' && data.map((h, i) => (
                      <div
                        key={i}
                        className="s2-frame__wave-bar"
                        style={{ height: `${h * (visualizer.intensity / 100) * 100}%` }}
                      />
                    ))}
                    {visualizer.type === 'wave' && (
                      <svg className="s2-frame__wave-svg" viewBox="0 0 80 40" preserveAspectRatio="none">
                        <polyline
                          className="s2-frame__wave-line"
                          points={data.map((h, i) => `${i},${40 - h * (visualizer.intensity / 100) * 38}`).join(' ')}
                        />
                      </svg>
                    )}
                    {visualizer.type === 'mirror' && (
                      <svg className="s2-frame__wave-svg" viewBox="0 0 80 40" preserveAspectRatio="none">
                        {data.map((h, i) => {
                          const bh = h * (visualizer.intensity / 100) * 17
                          return (
                            <React.Fragment key={i}>
                              <rect x={i} y={20 - bh} width={0.7} height={bh} fill="var(--c)" opacity="0.85" />
                              <rect x={i} y={20}      width={0.7} height={bh} fill="var(--c)" opacity="0.85" />
                            </React.Fragment>
                          )
                        })}
                      </svg>
                    )}
                    {visualizer.type === 'dots' && (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', width: '100%', height: '100%', gap: '2px' }}>
                        {data.filter((_, i) => i % 2 === 0).map((h, i) => {
                          const r = Math.max(2, h * (visualizer.intensity / 100) * 10)
                          return (
                            <div
                              key={i}
                              style={{ width: `${r * 2}px`, height: `${r * 2}px`, borderRadius: '50%', background: 'var(--c)', flexShrink: 0 }}
                            />
                          )
                        })}
                      </div>
                    )}
                  </div>
                )}
                {/* 컴팩트 타입: orb / ring */}
                {COMPACT_VIS.includes(visualizer.type) && (
                  <div
                    className="s2-frame__orb"
                    style={{ opacity: visualizer.opacity / 100, top: `${visualizer.y}%`, left: '50%' }}
                  >
                    {visualizer.type === 'orb' && (() => {
                      const energy = freqData.length ? freqData.reduce((a, v) => a + v, 0) / freqData.length : 0
                      const sizeScale = visualizer.size / 50
                      return [1, 0.65, 0.35].map((scale, i) => {
                        const w = scale * (1 + energy * 0.5) * visualizer.intensity * 0.8 * sizeScale
                        return (
                          <div key={i} className="s2-frame__orb-ring" style={{ width: `${w}px`, height: `${w}px` }} />
                        )
                      })
                    })()}
                    {visualizer.type === 'ring' && (() => {
                      const energy = freqData.length ? freqData.reduce((a, v) => a + v, 0) / freqData.length : 0
                      const sizeScale = visualizer.size / 50
                      const r = (50 + energy * 35) * sizeScale * (visualizer.intensity / 100)
                      return (
                        <>
                          <div className="s2-frame__orb-ring" style={{ width: `${r * 2}px`, height: `${r * 2}px` }} />
                          <div className="s2-frame__orb-ring" style={{ width: `${r * 1.4}px`, height: `${r * 1.4}px`, opacity: 0.35 }} />
                        </>
                      )
                    })()}
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
            <div className="s2-frame__badge-l">SPECTRA · LIVE</div>
            <div className="s2-frame__badge-r">{String(trackIdx + 1).padStart(2, '0')} / {tracks.length}</div>
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
          {logo && (
            <>
              <div className="s2-ctrl-divider" />
              <span className="s2-ctrl-label">로고</span>
              <input
                type="range" min={24} max={120} value={logoSize}
                onChange={e => setLogoSize(Number(e.target.value))}
                className="slider s2-ctrl-slider"
              />
              <span className="s2-ctrl-value">{logoSize}px</span>
            </>
          )}
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
            <input
              className="slider" type="range" min={20} max={80}
              value={typography.titleSize}
              onChange={e => setTypography({ ...typography, titleSize: Number(e.target.value) })}
            />
            <div className="slider-row__value">{typography.titleSize}</div>
          </div>
          <div className="slider-row">
            <div className="slider-row__label">자간</div>
            <input
              className="slider" type="range" min={-50} max={50}
              value={typography.letterSpacing}
              onChange={e => setTypography({ ...typography, letterSpacing: Number(e.target.value) })}
            />
            <div className="slider-row__value">{typography.letterSpacing}</div>
          </div>

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
