# Spectra Studio Step 2 & Step 3 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Step 2(비주얼 편집)와 Step 3(영상 출력) 화면을 구현하고, App.tsx에 공유 상태를 추가해 두 화면이 설정값을 공유한다.

**Architecture:** App.tsx가 theme/effects/visualizer/typography/exportSettings 상태를 보유하고 Step2/Step3에 props로 전달. Step2는 모든 setter를 받아 편집하고, Step3는 읽기 전용으로 요약 표시 + exportSettings만 편집. 렌더링 진행 UI는 Step3 로컬 상태로 관리.

**Tech Stack:** React 18, Vite 5, TypeScript 5, Vanilla CSS, Vitest + @testing-library/react

---

## 파일 구조

| 파일 | 역할 |
|------|------|
| `src/types.ts` | Effects / Visualizer / Typography / ExportSettings 인터페이스 추가 |
| `src/App.tsx` | 5개 상태 추가, Step2/Step3 라우팅 연결 |
| `src/components/steps/Step2/Step2.tsx` | 비주얼 편집 컴포넌트 |
| `src/components/steps/Step2/Step2.css` | Step2 전용 스타일 |
| `src/components/steps/Step2/Step2.test.tsx` | Step2 테스트 (5개) |
| `src/components/steps/Step3/Step3.tsx` | 영상 출력 컴포넌트 |
| `src/components/steps/Step3/Step3.css` | Step3 전용 스타일 |
| `src/components/steps/Step3/Step3.test.tsx` | Step3 테스트 (5개) |

---

### Task 11: types.ts 확장 + App.tsx 상태 추가

**Files:**
- Modify: `src/types.ts`
- Modify: `src/App.tsx`

- [ ] **Step 1: types.ts에 새 인터페이스 추가**

`src/types.ts` 파일 끝에 다음을 추가한다 (기존 내용은 그대로 유지):

```typescript
export interface Effects {
  vis: boolean
  crossfade: boolean
  ducking: boolean
  blur: boolean
}

export interface Visualizer {
  type: 'bars' | 'wave' | 'orb'
  intensity: number
  opacity: number
}

export interface Typography {
  titleSize: number
  letterSpacing: number
}

export interface ExportSettings {
  filename: string
  format: 'mp4' | 'webm' | 'mov'
  resolution: '720p' | '1080p' | '4k'
  thumbnail: boolean
  chapters: boolean
}
```

- [ ] **Step 2: App.tsx 상태 추가**

`src/App.tsx`를 다음으로 교체한다:

```typescript
// 앱 루트 — 전체 상태 관리 및 레이아웃 조합
import { useState } from 'react'
import type { Track, Effects, Visualizer, Typography, ExportSettings } from './types'
import { sampleTracks } from './data/sampleTracks'
import Sidebar from './components/Sidebar/Sidebar'
import Header from './components/Header/Header'
import StatusBar from './components/StatusBar/StatusBar'
import Step1 from './components/steps/Step1/Step1'

export default function App() {
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [tracks, setTracks] = useState<Track[]>(sampleTracks)
  const [theme, setTheme] = useState('midnight')
  const [effects, setEffects] = useState<Effects>({ vis: true, crossfade: false, ducking: true, blur: true })
  const [visualizer, setVisualizer] = useState<Visualizer>({ type: 'bars', intensity: 70, opacity: 85 })
  const [typography, setTypography] = useState<Typography>({ titleSize: 48, letterSpacing: -15 })
  const [exportSettings, setExportSettings] = useState<ExportSettings>({
    filename: 'my-playlist',
    format: 'mp4',
    resolution: '1080p',
    thumbnail: true,
    chapters: false,
  })

  return (
    <div className="app">
      <Sidebar step={step} setStep={setStep} tracks={tracks} />
      <Header step={step} setStep={setStep} />
      <main className="main">
        {step === 1 && (
          <Step1 tracks={tracks} setTracks={setTracks} onNext={() => setStep(2)} />
        )}
        {step === 2 && (
          <p style={{ padding: 20, color: 'var(--ink-3)' }}>Step 2 — 구현 예정</p>
        )}
        {step === 3 && (
          <p style={{ padding: 20, color: 'var(--ink-3)' }}>Step 3 — 구현 예정</p>
        )}
      </main>
      <StatusBar tracks={tracks} />
    </div>
  )
}
```

**참고:** Step2/Step3 import는 Task 12, 13에서 추가한다. 현재는 타입 선언과 상태만 추가.

- [ ] **Step 3: TypeScript 검사 + 기존 테스트 통과 확인**

```bash
cd C:\claudecode\spectra && npm test
```

Expected: 35 tests passed (기존과 동일)

- [ ] **Step 4: 커밋**

```bash
cd C:\claudecode\spectra && git add src/types.ts src/App.tsx && git commit -m "feat: Step2/3 공유 상태 타입 정의 및 App.tsx 상태 추가"
```

---

### Task 12: Step 2 — 비주얼 편집 화면

**Files:**
- Create: `src/components/steps/Step2/Step2.tsx`
- Create: `src/components/steps/Step2/Step2.css`
- Create: `src/components/steps/Step2/Step2.test.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: 실패 테스트 작성**

`src/components/steps/Step2/Step2.test.tsx`:

```typescript
// Step2 컴포넌트 테스트
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Step2 from './Step2'
import { sampleTracks } from '../../../data/sampleTracks'

const base = {
  tracks: sampleTracks,
  theme: 'midnight',
  setTheme: vi.fn(),
  effects: { vis: true, crossfade: false, ducking: true, blur: true },
  setEffects: vi.fn(),
  visualizer: { type: 'bars' as const, intensity: 70, opacity: 85 },
  setVisualizer: vi.fn(),
  typography: { titleSize: 48, letterSpacing: -15 },
  setTypography: vi.fn(),
  onBack: vi.fn(),
  onNext: vi.fn(),
}

describe('Step2', () => {
  it('"테마 & 비주얼" 패널 헤딩을 렌더링한다', () => {
    render(<Step2 {...base} />)
    expect(screen.getByText('테마 & 비주얼')).toBeInTheDocument()
  })
  it('테마 카드 6개를 표시한다', () => {
    render(<Step2 {...base} />)
    expect(screen.getByText('Midnight')).toBeInTheDocument()
    expect(screen.getByText('Cyan Wave')).toBeInTheDocument()
    expect(screen.getByText('Sunset')).toBeInTheDocument()
    expect(screen.getByText('Forest')).toBeInTheDocument()
    expect(screen.getByText('Cream')).toBeInTheDocument()
    expect(screen.getByText('Mono')).toBeInTheDocument()
  })
  it('테마 카드 클릭 시 setTheme이 해당 id로 호출된다', () => {
    const setTheme = vi.fn()
    render(<Step2 {...base} setTheme={setTheme} />)
    fireEvent.click(screen.getByText('Sunset').closest('.theme-card')!)
    expect(setTheme).toHaveBeenCalledWith('sunset')
  })
  it('효과 칩 클릭 시 setEffects가 호출된다', () => {
    const setEffects = vi.fn()
    render(<Step2 {...base} setEffects={setEffects} />)
    fireEvent.click(screen.getByText('크로스페이드').closest('.effect-chip')!)
    expect(setEffects).toHaveBeenCalled()
  })
  it('"다음" 버튼 클릭 시 onNext가 호출된다', () => {
    const onNext = vi.fn()
    render(<Step2 {...base} onNext={onNext} />)
    fireEvent.click(screen.getByText('다음'))
    expect(onNext).toHaveBeenCalledTimes(1)
  })
})
```

- [ ] **Step 2: 테스트 실패 확인**

```bash
cd C:\claudecode\spectra && npm test -- --reporter=verbose src/components/steps/Step2/Step2.test.tsx
```

Expected: FAIL (Step2 파일 없음)

- [ ] **Step 3: Step2.css 작성**

`src/components/steps/Step2/Step2.css`:

```css
/* Step 2 — 비주얼 편집 3컬럼 레이아웃 */
.step2 {
  display: grid;
  grid-template-columns: 240px 1fr 260px;
  height: 100%;
  overflow: hidden;
}

.s2-panel {
  display: flex;
  flex-direction: column;
  border-right: 1px solid var(--line);
  overflow-y: auto;
}
.s2-panel:last-child { border-right: none; border-left: 1px solid var(--line); }
.s2-panel__head {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 14px; border-bottom: 1px solid var(--line);
  font-size: 13px; font-weight: 600; color: var(--ink);
  white-space: nowrap; flex-shrink: 0;
}
.s2-panel__body { padding: 14px; display: flex; flex-direction: column; gap: 10px; }

.s2-section-label {
  font-size: 11.5px; font-weight: 600; color: var(--ink-3);
  letter-spacing: 0.04em; text-transform: uppercase;
}

/* 테마 그리드 */
.theme-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.theme-card {
  height: 52px; border-radius: var(--r-m);
  border: 2px solid transparent;
  cursor: pointer; display: flex; align-items: flex-end;
  padding: 6px 8px; transition: all 120ms ease;
}
.theme-card:hover { border-color: var(--c-soft); }
.theme-card--active { border-color: var(--c); box-shadow: 0 0 0 1px var(--c); }
.theme-card__label {
  font-size: 11px; font-weight: 600;
  color: oklch(1 0 0);
  text-shadow: 0 1px 3px rgba(0,0,0,0.5); letter-spacing: 0.02em;
}

/* 슬라이더 */
.slider-row { display: flex; align-items: center; gap: 10px; font-size: 12px; }
.slider-row__label { color: var(--ink-3); min-width: 60px; white-space: nowrap; }
.slider { flex: 1; height: 4px; accent-color: var(--c); cursor: pointer; }
.slider-row__value { font-family: var(--f-mono); font-size: 11.5px; color: var(--ink-2); min-width: 28px; text-align: right; }

.divider { border: none; border-top: 1px solid var(--line-faint); margin: 4px 0; }

/* 스테이지 */
.s2-stage { display: flex; flex-direction: column; overflow: hidden; }
.s2-stage__top {
  display: flex; align-items: center; gap: 8px;
  padding: 10px 14px; border-bottom: 1px solid var(--line); flex-shrink: 0;
}
.s2-timecode { flex: 1; padding-left: 4px; font-family: var(--f-mono); font-size: 12px; color: var(--ink-3); }
.legend { display: flex; gap: 6px; }
.legend__item {
  font-size: 11px; font-family: var(--f-mono); color: var(--ink-3);
  background: var(--bg-sunken); border: 1px solid var(--line);
  border-radius: 4px; padding: 2px 6px;
}
.s2-play-btn {
  width: 28px; height: 28px; border-radius: 7px;
  background: var(--c); border: none; color: var(--bg-elev);
  display: flex; align-items: center; justify-content: center; cursor: pointer;
}

.s2-stage__viewport {
  flex: 1; display: flex; align-items: center; justify-content: center;
  padding: 20px; background: var(--bg-sunken); overflow: hidden;
}
.s2-stage__frame {
  width: 100%; max-width: 640px; aspect-ratio: 16 / 9;
  border-radius: var(--r-m); position: relative; overflow: hidden;
  display: flex; align-items: center; justify-content: center;
}

.s2-frame__content {
  position: relative; z-index: 1;
  display: flex; flex-direction: column; align-items: center;
  gap: 10px; color: oklch(1 0 0); text-align: center; padding: 0 20px; width: 100%;
}
.s2-frame__logo {
  width: 52px; height: 52px; border-radius: 14px;
  background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2);
  display: flex; align-items: center; justify-content: center;
  color: var(--c); backdrop-filter: blur(8px);
}
.s2-frame__title {
  font-size: 24px; font-weight: 700; margin: 0;
  letter-spacing: -0.02em; white-space: nowrap;
  max-width: 90%; overflow: hidden; text-overflow: ellipsis;
}
.s2-frame__sub { font-size: 13px; font-family: var(--f-mono); color: rgba(255,255,255,0.7); }
.s2-frame__wave {
  position: absolute; bottom: 28px; left: 60px; right: 60px;
  display: flex; gap: 3px; align-items: flex-end; height: 40px;
}
.s2-frame__wave-bar {
  flex: 1; background: linear-gradient(180deg, var(--c) 0%, oklch(0.5 0.18 240) 100%);
  border-radius: 2px; max-width: 5px;
}
.s2-frame__badge-l {
  position: absolute; top: 18px; left: 18px;
  font-size: 11px; font-family: var(--f-mono); color: rgba(255,255,255,0.6); letter-spacing: 0.1em;
}
.s2-frame__badge-r {
  position: absolute; top: 18px; right: 18px;
  font-size: 11px; font-family: var(--f-mono); color: rgba(255,255,255,0.6);
}

/* 타임라인 */
.s2-timeline { border-top: 1px solid var(--line); flex-shrink: 0; }
.s2-timeline__head {
  display: flex; justify-content: space-between;
  padding: 8px 14px; font-size: 11.5px; color: var(--ink-3);
  border-bottom: 1px solid var(--line-faint);
}
.s2-timeline__row { display: flex; gap: 4px; padding: 8px 14px; overflow-x: auto; }
.s2-clip {
  flex-shrink: 0; height: 28px;
  background: var(--bg-sunken); border: 1px solid var(--line);
  border-radius: 5px; padding: 0 8px;
  display: flex; align-items: center;
  font-size: 11px; font-family: var(--f-mono); color: var(--ink-3);
  cursor: pointer; overflow: hidden; white-space: nowrap; text-overflow: ellipsis;
  transition: all 100ms ease;
}
.s2-clip:hover { border-color: var(--line-strong); color: var(--ink-2); }
.s2-clip--active {
  background: linear-gradient(90deg, var(--c), oklch(0.55 0.18 235));
  border-color: var(--c); color: oklch(1 0 0);
}

/* 효과 칩 */
.effect-list { display: flex; flex-direction: column; gap: 6px; }
.effect-chip {
  display: flex; align-items: center; gap: 10px;
  padding: 10px; border-radius: var(--r-m);
  border: 1px solid var(--line-faint); background: var(--bg-sunken);
  cursor: pointer; transition: all 100ms ease;
}
.effect-chip:hover { border-color: var(--line); }
.effect-chip--on { border-color: var(--c-soft); background: var(--c-softer); }
.effect-chip__icon {
  width: 30px; height: 30px; border-radius: 8px;
  background: var(--bg-elev); border: 1px solid var(--line);
  display: flex; align-items: center; justify-content: center;
  color: var(--ink-2); flex-shrink: 0;
}
.effect-chip--on .effect-chip__icon { color: var(--c-strong); border-color: var(--c-soft); }
.effect-chip__meta { flex: 1; min-width: 0; }
.effect-chip__title { font-size: 12.5px; font-weight: 500; color: var(--ink); }
.effect-chip__sub { font-size: 11px; color: var(--ink-4); margin-top: 1px; }
.effect-chip__toggle { flex-shrink: 0; }

.s2-nav { display: flex; gap: 8px; }
.s2-nav > * { flex: 1; justify-content: center; }
```

- [ ] **Step 4: Step2.tsx 작성**

`src/components/steps/Step2/Step2.tsx`:

```typescript
// Step 2 — 비주얼 편집: 테마 선택, 스테이지 미리보기, 효과 설정
import { useState } from 'react'
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
}

export default function Step2({ tracks, theme, setTheme, effects, setEffects, visualizer, setVisualizer, typography, setTypography, onBack, onNext }: Step2Props) {
  const [playingId, setPlayingId] = useState<string>(tracks[0]?.id ?? '')
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
          <Button variant="ghost" size="icon"><Icon name="skipBack" size={14} /></Button>
          <button type="button" className="s2-play-btn"><Icon name="play" size={14} /></button>
          <Button variant="ghost" size="icon"><Icon name="skipForward" size={14} /></Button>
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
                onClick={() => setPlayingId(t.id)}
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
                <div className="effect-chip__toggle">
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
```

- [ ] **Step 5: 테스트 통과 확인**

```bash
cd C:\claudecode\spectra && npm test -- --reporter=verbose src/components/steps/Step2/Step2.test.tsx
```

Expected: 5 tests passed

- [ ] **Step 6: App.tsx에 Step2 연결**

`src/App.tsx`에서 Step2 import 추가 및 `step === 2` 분기 교체:

```typescript
// 기존 import 목록에 추가:
import Step2 from './components/steps/Step2/Step2'

// main 내부 step === 2 부분을 교체:
{step === 2 && (
  <Step2
    tracks={tracks}
    theme={theme}
    setTheme={setTheme}
    effects={effects}
    setEffects={setEffects}
    visualizer={visualizer}
    setVisualizer={setVisualizer}
    typography={typography}
    setTypography={setTypography}
    onBack={() => setStep(1)}
    onNext={() => setStep(3)}
  />
)}
```

- [ ] **Step 7: 전체 테스트 통과 확인**

```bash
cd C:\claudecode\spectra && npm test
```

Expected: 40 tests passed (기존 35 + 신규 5)

- [ ] **Step 8: 커밋**

```bash
cd C:\claudecode\spectra && git add src/components/steps/Step2/ src/App.tsx && git commit -m "feat: Step2 비주얼 편집 화면 구현"
```

---

### Task 13: Step 3 — 영상 출력 화면

**Files:**
- Create: `src/components/steps/Step3/Step3.tsx`
- Create: `src/components/steps/Step3/Step3.css`
- Create: `src/components/steps/Step3/Step3.test.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: 실패 테스트 작성**

`src/components/steps/Step3/Step3.test.tsx`:

```typescript
// Step3 컴포넌트 테스트
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Step3 from './Step3'
import { sampleTracks } from '../../../data/sampleTracks'

const base = {
  tracks: sampleTracks,
  theme: 'midnight',
  effects: { vis: true, crossfade: false, ducking: true, blur: true },
  visualizer: { type: 'bars' as const, intensity: 70, opacity: 85 },
  exportSettings: {
    filename: 'my-playlist',
    format: 'mp4' as const,
    resolution: '1080p' as const,
    thumbnail: true,
    chapters: false,
  },
  setExportSettings: vi.fn(),
  onBack: vi.fn(),
}

describe('Step3', () => {
  it('"영상 출력" 제목을 렌더링한다', () => {
    render(<Step3 {...base} />)
    expect(screen.getByText('영상 출력')).toBeInTheDocument()
  })
  it('트랙 수 통계를 표시한다', () => {
    render(<Step3 {...base} />)
    expect(screen.getByText('15')).toBeInTheDocument()
  })
  it('총 길이를 계산해 분:초 형식으로 표시한다', () => {
    render(<Step3 {...base} />)
    expect(screen.getByText(/^\d+:\d{2}$/)).toBeInTheDocument()
  })
  it('"렌더링 시작" 클릭 시 렌더링 진행 UI가 표시된다', () => {
    render(<Step3 {...base} />)
    fireEvent.click(screen.getByText(/렌더링 시작/))
    expect(screen.getByText(/렌더링 중\.\.\./)).toBeInTheDocument()
  })
  it('"편집으로 돌아가기" 클릭 시 onBack이 호출된다', () => {
    const onBack = vi.fn()
    render(<Step3 {...base} onBack={onBack} />)
    fireEvent.click(screen.getByText('편집으로 돌아가기'))
    expect(onBack).toHaveBeenCalledTimes(1)
  })
})
```

- [ ] **Step 2: 테스트 실패 확인**

```bash
cd C:\claudecode\spectra && npm test -- --reporter=verbose src/components/steps/Step3/Step3.test.tsx
```

Expected: FAIL (Step3 파일 없음)

- [ ] **Step 3: Step3.css 작성**

`src/components/steps/Step3/Step3.css`:

```css
/* Step 3 — 영상 출력 2컬럼 레이아웃 */
.step3 {
  display: grid;
  grid-template-columns: 1fr 360px;
  gap: 20px;
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

/* 요약 통계 */
.s3-summary {
  display: grid; grid-template-columns: repeat(4, 1fr);
  gap: 12px; margin-bottom: 16px;
}
.s3-stat {
  background: var(--bg-elev); border: 1px solid var(--line);
  border-radius: var(--r-m); padding: 14px 16px;
}
.s3-stat__label {
  font-size: 11px; font-weight: 600; color: var(--ink-4);
  letter-spacing: 0.04em; text-transform: uppercase; margin-bottom: 6px;
}
.s3-stat__value {
  font-size: 24px; font-weight: 700; color: var(--ink);
  font-variant-numeric: tabular-nums; letter-spacing: -0.02em; line-height: 1;
}
.s3-stat__unit { font-size: 14px; font-weight: 500; color: var(--ink-3); }
.s3-stat__sub { font-size: 11px; color: var(--ink-4); margin-top: 4px; font-family: var(--f-mono); }

/* 최종 프리뷰 */
.s3-final { border-radius: var(--r-l); overflow: hidden; }
.s3-final__inner { aspect-ratio: 16 / 9; position: relative; overflow: hidden; }
.s3-final__content {
  position: absolute; inset: 0;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  color: oklch(1 0 0); gap: 14px; text-align: center;
}
.s3-final__logo {
  width: 54px; height: 54px; border-radius: 14px;
  background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2);
  display: flex; align-items: center; justify-content: center;
  color: var(--c); backdrop-filter: blur(8px);
}
.s3-final__title {
  font-size: 28px; font-weight: 700; margin: 0;
  letter-spacing: -0.02em; white-space: nowrap;
  max-width: 90%; overflow: hidden; text-overflow: ellipsis;
}
.s3-final__meta { font-size: 13px; font-family: var(--f-mono); color: rgba(255,255,255,0.7); letter-spacing: 0.05em; }
.s3-final__badge {
  position: absolute; top: 18px; left: 18px;
  font-size: 11px; font-family: var(--f-mono); color: rgba(255,255,255,0.5); letter-spacing: 0.12em;
}
.s3-final__wave {
  position: absolute; bottom: 18px; left: 18px; right: 18px;
  display: flex; gap: 2px; align-items: flex-end; height: 18px;
}
.s3-final__wave-bar { flex: 1; background: rgba(255,255,255,0.4); border-radius: 1px; max-width: 4px; }

/* 설정 요약 */
.s3-form-row {
  display: flex; gap: 12px; padding: 10px 16px;
  border-bottom: 1px solid var(--line-faint); font-size: 12.5px;
}
.s3-form-row:last-child { border-bottom: none; }
.s3-form-row__label { min-width: 100px; color: var(--ink-3); flex-shrink: 0; }
.s3-form-row__value { color: var(--ink); }

/* 내보내기 패널 */
.s3-export { display: flex; flex-direction: column; }
.s3-filename-hint { font-size: 11px; color: var(--ink-4); font-family: var(--f-mono); margin-top: 6px; }

.input {
  width: 100%; padding: 8px 10px;
  background: var(--bg-sunken); border: 1px solid var(--line);
  border-radius: var(--r-s); font-size: 13px; color: var(--ink);
  font-family: var(--f-sans); outline: none; box-sizing: border-box;
}
.input:focus { border-color: var(--c); box-shadow: 0 0 0 2px var(--c-softer); }

/* 옵션 */
.s3-options { display: flex; flex-direction: column; gap: 10px; }
.s3-option { display: flex; align-items: center; gap: 10px; cursor: pointer; }
.s3-option__meta { min-width: 0; flex: 1; }
.s3-option__title { font-size: 13px; font-weight: 500; white-space: nowrap; }
.s3-option__sub { font-size: 11.5px; color: var(--ink-3); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

/* 예상 정보 */
.s3-estimate {
  padding: 12px 16px; border-top: 1px solid var(--line-faint);
  background: var(--bg-sunken); display: flex; flex-direction: column; gap: 4px;
}
.s3-estimate__row {
  display: flex; justify-content: space-between;
  font-size: 12px; white-space: nowrap; gap: 8px; color: var(--ink-3);
}
.s3-estimate__val { font-family: var(--f-mono); color: var(--ink); font-weight: 600; }

/* 렌더링 영역 */
.s3-render { padding: 14px 16px; display: flex; flex-direction: column; gap: 8px; }

.render-progress { display: flex; flex-direction: column; gap: 8px; }
.render-progress__bar {
  height: 8px; background: var(--bg-sunken);
  border: 1px solid var(--line); border-radius: 999px; overflow: hidden;
}
.render-progress__fill { height: 100%; background: var(--c); border-radius: 999px; transition: width 100ms linear; }
.render-progress__text { font-size: 12px; font-family: var(--f-mono); color: var(--ink-2); text-align: center; }

.render-done { display: flex; flex-direction: column; gap: 8px; }
.render-done__msg { font-size: 14px; font-weight: 600; color: var(--c-strong); text-align: center; padding: 8px; }

.s3-btn-full { width: 100%; justify-content: center; }
```

- [ ] **Step 4: Step3.tsx 작성**

`src/components/steps/Step3/Step3.tsx`:

```typescript
// Step 3 — 영상 출력: 설정 요약, 내보내기 패널, 렌더링 진행 UI
import { useState } from 'react'
import './Step3.css'
import Icon from '../../../icons'
import Button from '../../shared/Button'
import SegmentedControl from '../../shared/SegmentedControl'
import Switch from '../../shared/Switch'
import { waveformFor } from '../../../data/sampleTracks'
import type { Track, Effects, Visualizer, ExportSettings } from '../../../types'

const THEMES = [
  { id: 'midnight', label: 'Midnight',  bg: 'linear-gradient(135deg, #0c1a2e, #050813)' },
  { id: 'cyanwave', label: 'Cyan Wave', bg: 'linear-gradient(135deg, #042f3f, #0a647a)' },
  { id: 'sunset',   label: 'Sunset',    bg: 'linear-gradient(135deg, #2a0f2e, #6d2c4a)' },
  { id: 'forest',   label: 'Forest',    bg: 'linear-gradient(135deg, #0c1e16, #1f3d2c)' },
  { id: 'cream',    label: 'Cream',     bg: 'linear-gradient(135deg, #f3ead8, #d9c7a3)' },
  { id: 'mono',     label: 'Mono',      bg: 'linear-gradient(135deg, #0a0a0a, #2a2a2a)' },
]

const RESOLUTION_MAP: Record<string, string> = {
  '720p': '1280 × 720',
  '1080p': '1920 × 1080',
  '4k': '3840 × 2160',
}

interface Step3Props {
  tracks: Track[]
  theme: string
  effects: Effects
  visualizer: Visualizer
  exportSettings: ExportSettings
  setExportSettings: (s: ExportSettings) => void
  onBack: () => void
}

type RenderState = 'idle' | 'rendering' | 'done'

export default function Step3({ tracks, theme, effects, visualizer, exportSettings, setExportSettings, onBack }: Step3Props) {
  const [renderState, setRenderState] = useState<RenderState>('idle')
  const [progress, setProgress] = useState(0)

  const totalSec = tracks.reduce((acc, t) => acc + t.durationSec, 0)
  const totalDur = `${Math.floor(totalSec / 60)}:${String(totalSec % 60).padStart(2, '0')}`
  const sizeMb = Math.round(totalSec * (exportSettings.resolution === '4k' ? 1.5 : exportSettings.resolution === '1080p' ? 0.42 : 0.22))
  const themeObj = THEMES.find(t => t.id === theme) ?? THEMES[0]

  const startRender = () => {
    setRenderState('rendering')
    setProgress(0)
    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 100) {
          clearInterval(interval)
          setRenderState('done')
          return 100
        }
        return Math.min(100, p + 3)
      })
    }, 100)
  }

  return (
    <div className="step3">
      <div className="page-head">
        <div>
          <h1 className="page-head__title">영상 출력</h1>
          <p className="page-head__sub">파일 포맷·해상도를 선택하고 렌더링을 시작하세요.</p>
        </div>
        <div className="page-head__progress">
          <div className="progress-track"><div className="progress-fill" style={{ width: '100%' }} /></div>
          <span>STEP 3 / 3</span>
        </div>
      </div>

      {/* 좌측 */}
      <div>
        <div className="s3-summary">
          <div className="s3-stat">
            <div className="s3-stat__label">트랙</div>
            <div className="s3-stat__value">{tracks.length}</div>
            <div className="s3-stat__sub">{tracks.length} / 50</div>
          </div>
          <div className="s3-stat">
            <div className="s3-stat__label">길이</div>
            <div className="s3-stat__value">{totalDur}</div>
            <div className="s3-stat__sub">반복 1회</div>
          </div>
          <div className="s3-stat">
            <div className="s3-stat__label">해상도</div>
            <div className="s3-stat__value">{exportSettings.resolution.toUpperCase()}</div>
            <div className="s3-stat__sub">{RESOLUTION_MAP[exportSettings.resolution]}</div>
          </div>
          <div className="s3-stat">
            <div className="s3-stat__label">예상 크기</div>
            <div className="s3-stat__value">{sizeMb} <span className="s3-stat__unit">MB</span></div>
            <div className="s3-stat__sub">≈ {Math.round(sizeMb / (totalSec / 60))} MB/min</div>
          </div>
        </div>

        <div className="s3-final">
          <div className="s3-final__inner" style={{ background: themeObj.bg }}>
            <div className="s3-final__content">
              <div className="s3-final__logo"><Icon name="logo" size={26} /></div>
              <h2 className="s3-final__title">가을 산책 플레이리스트</h2>
              <div className="s3-final__meta">{tracks.length} TRACKS · {totalDur} · {exportSettings.resolution.toUpperCase()}</div>
            </div>
            <div className="s3-final__badge">SPECTRA</div>
            <div className="s3-final__wave">
              {waveformFor(11, 100).map((h, i) => (
                <div key={i} className="s3-final__wave-bar" style={{ height: `${h * 60}%` }} />
              ))}
            </div>
          </div>
        </div>

        <div className="card" style={{ marginTop: 16 }}>
          <div className="card__head">
            <div className="card__title" style={{ fontSize: 13 }}>최종 설정 요약</div>
            <Button variant="ghost" onClick={onBack}>
              <Icon name="chevronLeft" size={14} /> 편집으로 돌아가기
            </Button>
          </div>
          <div>
            <div className="s3-form-row">
              <div className="s3-form-row__label">테마</div>
              <div className="s3-form-row__value">{themeObj.label} · 비주얼라이저 {visualizer.type} · 배경 블러 {effects.blur ? '24px' : '꺼짐'}</div>
            </div>
            <div className="s3-form-row">
              <div className="s3-form-row__label">오디오</div>
              <div className="s3-form-row__value">192 kbps · AAC · 자동 레벨 {effects.ducking ? '−14 LUFS' : '꺼짐'}</div>
            </div>
            <div className="s3-form-row">
              <div className="s3-form-row__label">크로스페이드</div>
              <div className="s3-form-row__value">{effects.crossfade ? '켜짐' : '꺼짐'}</div>
            </div>
            <div className="s3-form-row">
              <div className="s3-form-row__label">로고 / 워터마크</div>
              <div className="s3-form-row__value">Spectra 로고 · 우상단 · 60% 불투명도</div>
            </div>
          </div>
        </div>
      </div>

      {/* 우측 — 내보내기 패널 */}
      <div className="s3-export card">
        <div className="card__head">
          <div className="card__title"><Icon name="export" size={16} /> 내보내기</div>
        </div>

        <div className="form-section">
          <div className="form-section__label">파일명</div>
          <input
            className="input"
            value={exportSettings.filename}
            onChange={e => setExportSettings({ ...exportSettings, filename: e.target.value })}
          />
          <div className="s3-filename-hint">{exportSettings.filename}.{exportSettings.format}</div>
        </div>

        <div className="form-section">
          <div className="form-section__label">파일 포맷</div>
          <SegmentedControl
            options={[
              { value: 'mp4'  as const, label: 'MP4',  hint: 'H.264'  },
              { value: 'webm' as const, label: 'WebM', hint: 'VP9'    },
              { value: 'mov'  as const, label: 'MOV',  hint: 'ProRes' },
            ]}
            value={exportSettings.format}
            onChange={format => setExportSettings({ ...exportSettings, format })}
          />
        </div>

        <div className="form-section">
          <div className="form-section__label">해상도</div>
          <SegmentedControl
            options={[
              { value: '720p'  as const, label: '720p',  hint: '빠름'   },
              { value: '1080p' as const, label: '1080p', hint: '권장'   },
              { value: '4k'    as const, label: '4K',    hint: '고해상' },
            ]}
            value={exportSettings.resolution}
            onChange={resolution => setExportSettings({ ...exportSettings, resolution })}
          />
        </div>

        <div className="form-section">
          <div className="form-section__label">옵션</div>
          <div className="s3-options">
            <label className="s3-option">
              <Switch
                on={exportSettings.thumbnail}
                onChange={() => setExportSettings({ ...exportSettings, thumbnail: !exportSettings.thumbnail })}
              />
              <div className="s3-option__meta">
                <div className="s3-option__title">썸네일 자동 생성</div>
                <div className="s3-option__sub">YouTube/Spotify용 1280×720</div>
              </div>
            </label>
            <label className="s3-option">
              <Switch
                on={exportSettings.chapters}
                onChange={() => setExportSettings({ ...exportSettings, chapters: !exportSettings.chapters })}
              />
              <div className="s3-option__meta">
                <div className="s3-option__title">챕터 마커 포함</div>
                <div className="s3-option__sub">각 트랙을 챕터로 분할</div>
              </div>
            </label>
          </div>
        </div>

        <div className="s3-estimate">
          <div className="s3-estimate__row">
            <span>예상 렌더링 시간</span>
            <span className="s3-estimate__val">≈ 2분 18초</span>
          </div>
          <div className="s3-estimate__row">
            <span>최종 파일 크기</span>
            <span className="s3-estimate__val">≈ {sizeMb} MB</span>
          </div>
        </div>

        <div className="s3-render">
          {renderState === 'idle' && (
            <Button variant="primary" size="lg" className="s3-btn-full" onClick={startRender}>
              <Icon name="export" size={15} /> 렌더링 시작
            </Button>
          )}
          {renderState === 'rendering' && (
            <div className="render-progress">
              <div className="render-progress__bar">
                <div className="render-progress__fill" style={{ width: `${progress}%` }} />
              </div>
              <div className="render-progress__text">렌더링 중... {progress}%</div>
            </div>
          )}
          {renderState === 'done' && (
            <div className="render-done">
              <div className="render-done__msg">✓ 렌더링 완료</div>
              <Button
                variant="ghost"
                className="s3-btn-full"
                onClick={() => { setRenderState('idle'); setProgress(0) }}
              >
                다시 내보내기
              </Button>
            </div>
          )}
          <Button className="s3-btn-full" style={{ marginTop: 8 }}>
            <Icon name="folder" size={14} /> 프로젝트로 저장
          </Button>
        </div>
      </div>
    </div>
  )
}
```

**주의:** `Button` 컴포넌트가 `className`, `style` prop을 전달받는지 `src/components/shared/Button.tsx`를 먼저 확인하라. 지원하지 않으면 `<button>` 직접 사용하거나 Button을 감싸는 래퍼 div를 활용하라.

- [ ] **Step 5: 테스트 통과 확인**

```bash
cd C:\claudecode\spectra && npm test -- --reporter=verbose src/components/steps/Step3/Step3.test.tsx
```

Expected: 5 tests passed

- [ ] **Step 6: App.tsx에 Step3 연결**

`src/App.tsx`에서 Step3 import 추가 및 `step === 3` 분기 교체:

```typescript
// 기존 import 목록에 추가:
import Step3 from './components/steps/Step3/Step3'

// main 내부 step === 3 부분을 교체:
{step === 3 && (
  <Step3
    tracks={tracks}
    theme={theme}
    effects={effects}
    visualizer={visualizer}
    exportSettings={exportSettings}
    setExportSettings={setExportSettings}
    onBack={() => setStep(2)}
  />
)}
```

- [ ] **Step 7: 전체 테스트 통과 확인**

```bash
cd C:\claudecode\spectra && npm test
```

Expected: 45 tests passed (기존 40 + 신규 5)

- [ ] **Step 8: 커밋**

```bash
cd C:\claudecode\spectra && git add src/components/steps/Step3/ src/App.tsx && git commit -m "feat: Step3 영상 출력 화면 구현"
```
