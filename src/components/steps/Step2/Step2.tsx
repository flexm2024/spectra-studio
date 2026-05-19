// Step 2 — 비주얼 편집: 테마 선택, 스테이지 미리보기, 효과 설정
import './Step2.css'
import Icon from '../../../icons'
import Button from '../../shared/Button'
import SegmentedControl from '../../shared/SegmentedControl'
import Switch from '../../shared/Switch'
import { waveformFor } from '../../../data/sampleTracks'
import type { Track, Effects, Visualizer, Typography } from '../../../types'

const THEMES = [
  { id: 'midnight', label: 'Midnight',  bg: 'linear-gradient(135deg, #0c1a2e, #050813)' },
  { id: 'cyanwave', label: 'Cyan Wave', bg: 'linear-gradient(135deg, #042f3f, #0a647a)' },
  { id: 'sunset',   label: 'Sunset',    bg: 'linear-gradient(135deg, #2a0f2e, #6d2c4a)' },
  { id: 'forest',   label: 'Forest',    bg: 'linear-gradient(135deg, #0c1e16, #1f3d2c)' },
  { id: 'cream',    label: 'Cream',     bg: 'linear-gradient(135deg, #f3ead8, #d9c7a3)' },
  { id: 'mono',     label: 'Mono',      bg: 'linear-gradient(135deg, #0a0a0a, #2a2a2a)' },
]

const VIS_OPTIONS = [
  { value: 'bars' as const, label: 'Bars' },
  { value: 'wave' as const, label: 'Wave' },
  { value: 'orb'  as const, label: 'Orb'  },
]

const EFFECT_ITEMS = [
  { key: 'vis'       as const, icon: 'waveform', title: '오디오 비주얼라이저', sub: '파형이 음원에 반응' },
  { key: 'crossfade' as const, icon: 'repeat',   title: '크로스페이드',        sub: '트랙 간 2초 페이드' },
  { key: 'ducking'   as const, icon: 'sliders',  title: '자동 레벨',           sub: '트랙별 −14 LUFS 정규화' },
  { key: 'blur'      as const, icon: 'sparkles', title: '배경 블러',           sub: '깊이감 부여 · 24px' },
]

interface Step2Props {
  tracks: Track[]
  theme: string
  setTheme: (t: string) => void
  effects: Effects
  setEffects: (e: Effects) => void
  visualizer: Visualizer
  setVisualizer: (v: Visualizer) => void
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
}

export default function Step2({ tracks, theme, setTheme, effects, setEffects, visualizer, setVisualizer, typography, setTypography, onBack, onNext, playingId, isPlaying, onPlay, onPause, onSkipNext, onSkipPrev }: Step2Props) {
  const themeObj = THEMES.find(t => t.id === theme) ?? THEMES[0]
  const playingTrack = tracks.find(t => t.id === playingId) ?? tracks[0]
  const trackIdx = tracks.findIndex(t => t.id === playingId)

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
          <SegmentedControl
            options={VIS_OPTIONS}
            value={visualizer.type}
            onChange={type => setVisualizer({ ...visualizer, type })}
          />
          <div className="slider-row">
            <div className="slider-row__label">강도</div>
            <input
              className="slider" type="range" min={0} max={100}
              value={visualizer.intensity}
              onChange={e => setVisualizer({ ...visualizer, intensity: Number(e.target.value) })}
            />
            <div className="slider-row__value">{visualizer.intensity}</div>
          </div>
          <div className="slider-row">
            <div className="slider-row__label">불투명도</div>
            <input
              className="slider" type="range" min={0} max={100}
              value={visualizer.opacity}
              onChange={e => setVisualizer({ ...visualizer, opacity: Number(e.target.value) })}
            />
            <div className="slider-row__value">{visualizer.opacity}</div>
          </div>
        </div>
      </div>

      {/* 중앙 — 스테이지 */}
      <div className="s2-stage">
        <div className="s2-stage__top">
          <Button variant="ghost" size="icon" data-testid="stage-skip-prev" onClick={() => onSkipPrev()}><Icon name="skipBack" size={14} /></Button>
          <button type="button" className="s2-play-btn" onClick={() => { if (isPlaying) { onPause() } else if (playingTrack) { onPlay(playingTrack.id) } }}><Icon name={isPlaying ? 'pause' : 'play'} size={14} /></button>
          <Button variant="ghost" size="icon" data-testid="stage-skip-next" onClick={() => onSkipNext()}><Icon name="skipForward" size={14} /></Button>
          <div className="s2-timecode">00:48 / 38:11</div>
          <div className="legend">
            <span className="legend__item">1920×1080</span>
            <span className="legend__item">30 fps</span>
            <span className="legend__item">H.264</span>
          </div>
        </div>
        <div className="s2-stage__viewport">
          <div className="s2-stage__frame" style={{ background: themeObj.bg }}>
            <div className="s2-frame__content">
              <div className="s2-frame__logo"><Icon name="logo" size={26} /></div>
              <h2 className="s2-frame__title">{playingTrack?.title}</h2>
              <div className="s2-frame__sub">
                {playingTrack?.artist} · Track {String(trackIdx + 1).padStart(2, '0')} / {tracks.length}
              </div>
            </div>
            <div className="s2-frame__wave">
              {waveformFor(trackIdx + 1, 80).map((h, i) => (
                <div key={i} className="s2-frame__wave-bar" style={{ height: `${h * 100}%` }} />
              ))}
            </div>
            <div className="s2-frame__badge-l">SPECTRA · LIVE</div>
            <div className="s2-frame__badge-r">{String(trackIdx + 1).padStart(2, '0')} / {tracks.length}</div>
          </div>
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
