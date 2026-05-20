# Step2 비주얼 컨트롤 스테이지 반영 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Step2의 타이포그래피·비주얼라이저·효과·타임코드 컨트롤을 스테이지 프리뷰에 실시간 반영한다.

**Architecture:** Step2.tsx에서 props로 받은 typography/visualizer/effects/currentTime을 인라인 스타일과 조건부 렌더링으로 스테이지 프레임에 적용한다. CSS는 Wave SVG·Orb·blur-overlay 세 가지 새 클래스를 추가한다. App.tsx는 기존 audioCurrentTime 상태를 Step2에 전달한다.

**Tech Stack:** React 18, TypeScript 5, Vanilla CSS, Vitest + @testing-library/react

---

## 파일 구조

| 파일 | 변경 내용 |
|------|-----------|
| `src/components/steps/Step2/Step2.test.tsx` | `currentTime` prop 추가, 새 테스트 7개 |
| `src/components/steps/Step2/Step2.css` | `.s2-frame__wave-svg`, `.s2-frame__wave-line`, `.s2-frame__orb`, `.s2-frame__orb-ring`, `.s2-frame__blur-overlay` |
| `src/components/steps/Step2/Step2.tsx` | `currentTime` prop, 타이포그래피 인라인 스타일, 비주얼라이저 조건부 렌더링, blur overlay, 타임코드 |
| `src/App.tsx` | `<Step2>`에 `currentTime={audioCurrentTime}` 추가 |

---

## Task 1: Step2.test.tsx — currentTime prop 추가 및 실패 테스트 7개 작성

**Files:**
- Modify: `src/components/steps/Step2/Step2.test.tsx`

### 현재 파일 상태 (참고)

```ts
// 파일 상단 imports
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Step2 from './Step2'
import { sampleTracks } from '../../../data/sampleTracks'
import type { Background } from '../../../types'

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
  playingId: null as string | null,
  isPlaying: false,
  onPlay: vi.fn(),
  onPause: vi.fn(),
  onSkipNext: vi.fn(),
  onSkipPrev: vi.fn(),
  background: { type: 'gradient' } as Background,
  logo: undefined as string | undefined,
}
```

- [ ] **Step 1: `base` 객체에 `currentTime: 0` 추가**

`logo: undefined as string | undefined,` 다음 줄에 추가:

```ts
  currentTime: 0,
```

- [ ] **Step 2: 새 테스트 7개 추가** — `describe('Step2', () => {` 블록 끝 닫는 `})`  바로 앞에 삽입

```ts
  it('currentTime이 타임코드에 MM:SS 형식으로 표시된다', () => {
    render(<Step2 {...base} currentTime={90} />)
    expect(screen.getByText(/01:30/)).toBeInTheDocument()
  })

  it('typography.titleSize가 스테이지 제목 font-size에 반영된다', () => {
    render(<Step2 {...base} typography={{ titleSize: 60, letterSpacing: -15 }} />)
    const title = document.querySelector('.s2-frame__title') as HTMLElement
    expect(title.style.fontSize).toBe('60px')
  })

  it('typography.letterSpacing이 스테이지 제목 letter-spacing에 반영된다', () => {
    render(<Step2 {...base} typography={{ titleSize: 48, letterSpacing: 20 }} />)
    const title = document.querySelector('.s2-frame__title') as HTMLElement
    expect(title.style.letterSpacing).toBe('0.02em')
  })

  it('visualizer.type이 wave일 때 SVG 파형이 렌더링된다', () => {
    render(<Step2 {...base} visualizer={{ type: 'wave', intensity: 70, opacity: 85 }} />)
    expect(document.querySelector('.s2-frame__wave-svg')).toBeInTheDocument()
  })

  it('visualizer.type이 orb일 때 orb 컨테이너가 렌더링된다', () => {
    render(<Step2 {...base} visualizer={{ type: 'orb', intensity: 70, opacity: 85 }} />)
    expect(document.querySelector('.s2-frame__orb')).toBeInTheDocument()
  })

  it('effects.vis가 false일 때 비주얼라이저가 렌더링되지 않는다', () => {
    render(<Step2 {...base} effects={{ vis: false, crossfade: false, ducking: true, blur: false }} />)
    expect(document.querySelector('.s2-frame__wave')).not.toBeInTheDocument()
    expect(document.querySelector('.s2-frame__orb')).not.toBeInTheDocument()
  })

  it('effects.blur가 true일 때 blur overlay가 렌더링된다', () => {
    render(<Step2 {...base} effects={{ vis: true, crossfade: false, ducking: true, blur: true }} />)
    expect(document.querySelector('.s2-frame__blur-overlay')).toBeInTheDocument()
  })
```

- [ ] **Step 3: 테스트 실행 — 기존 10개 PASS, 새 7개 FAIL 확인**

```powershell
npx vitest run src/components/steps/Step2/Step2.test.tsx
```

Expected: 기존 10개 PASS, 새 7개 FAIL (prop not found / element not found)

- [ ] **Step 4: 커밋**

```bash
git add src/components/steps/Step2/Step2.test.tsx
git commit -m "test: Step2 컨트롤 반영 실패 테스트 7개 추가"
```

---

## Task 2: Step2.css — 새 CSS 클래스 5개 추가

**Files:**
- Modify: `src/components/steps/Step2/Step2.css`

- [ ] **Step 1: 파일 끝(`.s2-frame__logo-img` 규칙 다음)에 아래 CSS 추가**

```css
/* Wave 비주얼라이저 */
.s2-frame__wave-svg {
  width: 100%;
  height: 100%;
}
.s2-frame__wave-line {
  fill: none;
  stroke: var(--c);
  stroke-width: 1.5;
  stroke-linecap: round;
  stroke-linejoin: round;
}

/* Orb 비주얼라이저 */
.s2-frame__orb {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1;
  pointer-events: none;
}
.s2-frame__orb-ring {
  position: absolute;
  border-radius: 50%;
  border: 1.5px solid var(--c);
  opacity: 0.6;
}

/* 배경 블러 오버레이 */
.s2-frame__blur-overlay {
  position: absolute;
  inset: 0;
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  z-index: 0;
  pointer-events: none;
}
```

- [ ] **Step 2: 커밋**

```bash
git add src/components/steps/Step2/Step2.css
git commit -m "style: Step2 Wave/Orb 비주얼라이저 및 blur overlay CSS 추가"
```

---

## Task 3: Step2.tsx — 컨트롤 → 스테이지 연결

**Files:**
- Modify: `src/components/steps/Step2/Step2.tsx`

### 현재 Step2Props 인터페이스 (참고)

```ts
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
  background: Background
  logo: string | undefined
}
```

- [ ] **Step 1: `Step2Props`에 `currentTime: number` 추가** — `logo: string | undefined` 다음 줄에

```ts
  currentTime: number
```

- [ ] **Step 2: 함수 시그니처 구조분해에 `currentTime` 추가** — `logo` 다음에

현재:
```ts
export default function Step2({ tracks, theme, setTheme, effects, setEffects, visualizer, setVisualizer, typography, setTypography, onBack, onNext, playingId, isPlaying, onPlay, onPause, onSkipNext, onSkipPrev, background, logo }: Step2Props) {
```

교체:
```ts
export default function Step2({ tracks, theme, setTheme, effects, setEffects, visualizer, setVisualizer, typography, setTypography, onBack, onNext, playingId, isPlaying, onPlay, onPause, onSkipNext, onSkipPrev, background, logo, currentTime }: Step2Props) {
```

- [ ] **Step 3: `themeObj` 선언 아래에 `fmt` 헬퍼와 `totalSec` 추가**

현재:
```ts
  const themeObj = THEMES.find(t => t.id === theme) ?? THEMES[0]
  const playingTrack = tracks.find(t => t.id === playingId) ?? tracks[0]
  const trackIdx = tracks.findIndex(t => t.id === playingId)
```

교체:
```ts
  const themeObj = THEMES.find(t => t.id === theme) ?? THEMES[0]
  const playingTrack = tracks.find(t => t.id === playingId) ?? tracks[0]
  const trackIdx = tracks.findIndex(t => t.id === playingId)
  const totalSec = tracks.reduce((acc, t) => acc + t.durationSec, 0)
  const fmt = (sec: number) => {
    const m = Math.floor(sec / 60)
    const s = Math.floor(sec % 60)
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }
```

- [ ] **Step 4: 타임코드 업데이트**

현재:
```tsx
          <div className="s2-timecode">00:48 / 38:11</div>
```

교체:
```tsx
          <div className="s2-timecode">{fmt(currentTime)} / {fmt(totalSec)}</div>
```

- [ ] **Step 5: 스테이지 프레임 — blur overlay 추가**

현재 프레임 내부 첫 부분:
```tsx
            {background.src && (
              <img className="s2-frame__bg-img" src={background.src} alt="" />
            )}
            <div className="s2-frame__content">
```

교체:
```tsx
            {background.src && (
              <img className="s2-frame__bg-img" src={background.src} alt="" />
            )}
            {effects.blur && <div className="s2-frame__blur-overlay" />}
            <div className="s2-frame__content">
```

- [ ] **Step 6: 스테이지 프레임 — 제목에 타이포그래피 인라인 스타일 적용**

현재:
```tsx
              <h2 className="s2-frame__title">{playingTrack?.title}</h2>
```

교체:
```tsx
              <h2
                className="s2-frame__title"
                style={{
                  fontSize: typography.titleSize,
                  letterSpacing: `${typography.letterSpacing / 1000}em`,
                }}
              >
                {playingTrack?.title}
              </h2>
```

- [ ] **Step 7: 스테이지 프레임 — 비주얼라이저 조건부 렌더링으로 교체**

현재 wave 블록:
```tsx
            <div className="s2-frame__wave">
              {waveformFor(trackIdx + 1, 80).map((h, i) => (
                <div key={i} className="s2-frame__wave-bar" style={{ height: `${h * 100}%` }} />
              ))}
            </div>
```

교체 (effects.vis로 전체 조건부 렌더링, type별 분기):
```tsx
            {effects.vis && (
              <>
                {visualizer.type !== 'orb' && (
                  <div
                    className="s2-frame__wave"
                    style={{ opacity: visualizer.opacity / 100 }}
                  >
                    {visualizer.type === 'bars' && waveformFor(trackIdx + 1, 80).map((h, i) => (
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
                          points={waveformFor(trackIdx + 1, 80)
                            .map((h, i) => `${i},${40 - h * (visualizer.intensity / 100) * 38}`)
                            .join(' ')}
                        />
                      </svg>
                    )}
                  </div>
                )}
                {visualizer.type === 'orb' && (
                  <div
                    className="s2-frame__orb"
                    style={{ opacity: visualizer.opacity / 100 }}
                  >
                    {[1, 0.65, 0.35].map((scale, i) => (
                      <div
                        key={i}
                        className="s2-frame__orb-ring"
                        style={{
                          width:  `${scale * visualizer.intensity * 0.8}px`,
                          height: `${scale * visualizer.intensity * 0.8}px`,
                        }}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
```

- [ ] **Step 8: 타입 체크 확인**

```powershell
npx tsc --noEmit
```

Expected: 0 errors

- [ ] **Step 9: 테스트 실행 — Step2 새 7개 포함 전체 통과 확인**

```powershell
npx vitest run src/components/steps/Step2/Step2.test.tsx
```

Expected: 17 tests PASS

- [ ] **Step 10: 커밋**

```bash
git add src/components/steps/Step2/Step2.tsx
git commit -m "feat: Step2 타이포그래피/비주얼라이저/효과/타임코드 스테이지 반영"
```

---

## Task 4: App.tsx — Step2에 currentTime prop 전달

**Files:**
- Modify: `src/App.tsx`

### 현재 Step2 블록 (참고)

```tsx
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
            playingId={playingId}
            isPlaying={isPlaying}
            onPlay={onPlay}
            onPause={onPause}
            onSkipNext={onSkipNext}
            onSkipPrev={onSkipPrev}
            onBack={() => setStep(1)}
            onNext={() => setStep(3)}
            background={background}
            logo={logo}
          />
        )}
```

- [ ] **Step 1: `logo={logo}` 다음 줄에 `currentTime` prop 추가**

```tsx
            logo={logo}
            currentTime={audioCurrentTime}
```

- [ ] **Step 2: 전체 테스트 통과 확인**

```powershell
npx tsc --noEmit
npx vitest run
```

Expected: 0 TS errors, 73 tests PASS (기존 66 + 새 7)

- [ ] **Step 3: 커밋**

```bash
git add src/App.tsx
git commit -m "feat: App.tsx Step2에 audioCurrentTime 전달"
```

---

## 자체 검토

### 스펙 커버리지

| 스펙 요구사항 | Task |
|---|---|
| typography.titleSize → font-size | Task 3 Step 6 |
| typography.letterSpacing → letter-spacing (N/1000em) | Task 3 Step 6 |
| Bars: intensity로 높이 스케일 | Task 3 Step 7 |
| Bars: opacity 적용 | Task 3 Step 7 |
| Wave: SVG polyline 파형 | Task 3 Step 7 |
| Orb: 동심원 3개, intensity로 크기 | Task 3 Step 7 |
| effects.vis OFF → 비주얼라이저 숨김 | Task 3 Step 7 |
| effects.blur ON → blur overlay | Task 3 Step 5 |
| 타임코드 currentTime 연결 | Task 3 Step 3-4 |
| App.tsx → Step2 currentTime 전달 | Task 4 |

### 타입 일관성

- `currentTime: number` — Task 1(test), Task 3(Props + 구조분해), Task 4(전달) 모두 일치
- `visualizer.type: 'bars' | 'wave' | 'orb'` — Visualizer 타입 기존 정의와 일치
- `effects.vis`, `effects.blur` — Effects 타입 기존 정의와 일치
- `waveformFor(trackIdx + 1, 80)` — Task 2, 3 모두 동일 호출 패턴

### 누락 없음

- ✅ `effects.vis === false` → wave와 orb 모두 미렌더링
- ✅ Bars: intensity 스케일 (`h * intensity/100 * 100%`)
- ✅ Wave: intensity 스케일 (`h * intensity/100 * 38`)
- ✅ Orb: intensity 스케일 (`scale * intensity * 0.8 px`)
- ✅ blur overlay z-index: 0 (bg-img 위, content 아래)
- ✅ fmt 헬퍼로 MM:SS 포맷
- ✅ totalSec = 전체 트랙 durationSec 합산
