# Particle Overlay Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 비주얼라이저와 독립된 파티클 오버레이 레이어를 Step2 왼쪽 패널에 추가하고 스테이지 캔버스에 렌더링한다.

**Architecture:** `ParticleOverlay` 상태를 App.tsx에서 관리하고 Step2에 props로 전달한다. Step2 왼쪽 패널 비주얼라이저 슬라이더 아래에 파티클 UI 섹션을 배치하고, 스테이지에 전용 풀프레임 캔버스(`particleOverlayCanvasRef`)를 추가한다. 각 파티클 타입은 독립 RAF 루프로 Canvas 2D 렌더링한다.

**Tech Stack:** React 18, TypeScript, Canvas 2D API, Vitest + @testing-library/react

---

## File Map

| 파일 | 변경 유형 | 역할 |
|------|-----------|------|
| `src/types.ts` | Modify | `ParticleType`, `ParticleOverlay` 추가; `ProjectSnapshot`에 `particleOverlay` 필드 추가 |
| `src/App.tsx` | Modify | `particleOverlay` state 추가; Step2 props 전달; 자동저장·불러오기·초기화에 포함 |
| `src/components/steps/Step2/Step2.tsx` | Modify | props 추가; 왼쪽 패널 파티클 UI 섹션; 스테이지 파티클 캔버스 렌더링 |
| `src/components/steps/Step2/Step2.test.tsx` | Modify | 파티클 UI 테스트 추가 |

---

## Task 1: types.ts — ParticleOverlay 타입 추가

**Files:**
- Modify: `src/types.ts`

- [ ] **Step 1: `ParticleType`와 `ParticleOverlay` 인터페이스 추가**

`src/types.ts` 의 `export interface Typography {` 바로 위에 아래 코드를 삽입한다.

```ts
export type ParticleType =
  | 'snow' | 'sparkle' | 'firefly' | 'stars'
  | 'petals' | 'dust' | 'smoke' | 'bubbles'
  | 'rain' | 'sparks'

export interface ParticleOverlay {
  enabled: boolean
  type: ParticleType
  intensity: number   // 밀도 0–100
  speed: number       // 속도 0–100
  size: number        // 크기 0–100
  opacity: number     // 불투명도 0–100
  color: string       // hex or 'rainbow'
}
```

- [ ] **Step 2: `ProjectSnapshot`에 `particleOverlay` 필드 추가**

`src/types.ts`의 `ProjectSnapshot` 인터페이스에서 `logoSize: number` 다음 줄에 추가:

```ts
  particleOverlay: ParticleOverlay
```

- [ ] **Step 3: TypeScript 컴파일 확인**

```bash
npx tsc --noEmit
```

Expected: 에러 없음 (또는 App.tsx/Step2.tsx의 미구현 props 에러만 표시)

- [ ] **Step 4: Commit**

```bash
git add src/types.ts
git commit -m "feat: ParticleOverlay 타입 추가"
```

---

## Task 2: App.tsx — particleOverlay 상태 관리

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: import에 `ParticleOverlay` 추가**

`src/App.tsx` 1번째 import 줄을 수정한다:

```ts
import type { Track, Background, Effects, Visualizer, Typography, ExportSettings, LogoPosition, ParticleOverlay } from './types'
```

- [ ] **Step 2: `particleOverlay` 기본값 상수 정의**

`loadInitialProject` 함수 바로 위(파일 상단)에 기본값 상수를 추가한다:

```ts
const DEFAULT_PARTICLE_OVERLAY: ParticleOverlay = {
  enabled: false,
  type: 'snow',
  intensity: 50,
  speed: 50,
  size: 50,
  opacity: 70,
  color: 'rainbow',
}
```

- [ ] **Step 3: `particleOverlay` state 추가**

`App.tsx`에서 `const [logoSize, setLogoSize] = useState(...)` 바로 다음 줄에 추가:

```ts
const [particleOverlay, setParticleOverlay] = useState<ParticleOverlay>(
  _init.snapshot?.particleOverlay ?? DEFAULT_PARTICLE_OVERLAY
)
```

- [ ] **Step 4: 자동저장 스냅샷에 `particleOverlay` 포함**

App.tsx 자동저장 `useEffect` 내부 `snapshot` 객체에 `particleOverlay` 필드를 추가한다.

현재 코드:
```ts
      const snapshot: ProjectSnapshot = {
        theme, effects, visualizer, typography, exportSettings, loops, quality, background,
        logoPosition, logoSize,
        tracks: tracks.map(...)
      }
```

변경 후:
```ts
      const snapshot: ProjectSnapshot = {
        theme, effects, visualizer, typography, exportSettings, loops, quality, background,
        logoPosition, logoSize, particleOverlay,
        tracks: tracks.map(...)
      }
```

- [ ] **Step 5: 자동저장 `useEffect` 의존성 배열에 `particleOverlay` 추가**

현재 코드:
```ts
  }, [theme, effects, visualizer, typography, exportSettings, loops, quality, background, logoPosition, logoSize, tracks, projectId, projectName])
```

변경 후:
```ts
  }, [theme, effects, visualizer, typography, exportSettings, loops, quality, background, logoPosition, logoSize, particleOverlay, tracks, projectId, projectName])
```

- [ ] **Step 6: `handleLoadProject`에 `particleOverlay` 복원 추가**

`handleLoadProject` 함수 내 `setLogoSize(snapshot.logoSize)` 다음 줄에 추가:

```ts
    setParticleOverlay(snapshot.particleOverlay ?? DEFAULT_PARTICLE_OVERLAY)
```

- [ ] **Step 7: `handleNewProject`에 `particleOverlay` 초기화 추가**

`handleNewProject` 함수 내 `setLogoSize(52)` 다음 줄에 추가:

```ts
    setParticleOverlay(DEFAULT_PARTICLE_OVERLAY)
```

- [ ] **Step 8: Step2에 `particleOverlay`, `setParticleOverlay` props 전달**

App.tsx의 `<Step2 ...>` JSX에 두 props를 추가한다. `analyserRef={analyserRef}` 바로 전에:

```tsx
            particleOverlay={particleOverlay}
            setParticleOverlay={setParticleOverlay}
```

- [ ] **Step 9: TypeScript 컴파일 확인**

```bash
npx tsc --noEmit
```

Expected: Step2 props 타입 에러만 남아있어야 함 (Task 3에서 해결)

- [ ] **Step 10: Commit**

```bash
git add src/App.tsx
git commit -m "feat: App.tsx — particleOverlay 상태 추가 및 저장/불러오기 연동"
```

---

## Task 3: Step2 — 파티클 UI 섹션 (props + 왼쪽 패널)

**Files:**
- Modify: `src/components/steps/Step2/Step2.tsx`
- Modify: `src/components/steps/Step2/Step2.test.tsx`

- [ ] **Step 1: 실패 테스트 작성**

`src/components/steps/Step2/Step2.test.tsx` 파일에서 `base` 객체에 파티클 props를 추가하고 테스트를 작성한다.

`base` 객체 마지막 `analyserRef` 다음에 추가:

```ts
  particleOverlay: {
    enabled: false,
    type: 'snow' as const,
    intensity: 50,
    speed: 50,
    size: 50,
    opacity: 70,
    color: 'rainbow',
  },
  setParticleOverlay: vi.fn(),
```

파일 끝에 새 describe 블록 추가:

```ts
describe('Step2 — 파티클 섹션', () => {
  it('파티클 섹션 레이블을 렌더링한다', () => {
    render(<Step2 {...base} />)
    expect(screen.getByText('파티클')).toBeInTheDocument()
  })

  it('ON/OFF 토글이 렌더링된다', () => {
    render(<Step2 {...base} />)
    const row = screen.getByTestId('particle-toggle-row')
    expect(row.querySelector('[role="switch"]')).toBeInTheDocument()
  })

  it('disabled 상태에서는 타입 그리드가 숨겨진다', () => {
    render(<Step2 {...base} />)
    expect(screen.queryByText('눈송이')).not.toBeInTheDocument()
  })

  it('enabled 상태에서는 타입 그리드가 표시된다', () => {
    render(<Step2 {...base} particleOverlay={{ ...base.particleOverlay, enabled: true }} />)
    expect(screen.getByText('눈송이')).toBeInTheDocument()
    expect(screen.getByText('반짝임')).toBeInTheDocument()
    expect(screen.getByText('반딧불')).toBeInTheDocument()
    expect(screen.getByText('별')).toBeInTheDocument()
    expect(screen.getByText('꽃잎')).toBeInTheDocument()
    expect(screen.getByText('빛 먼지')).toBeInTheDocument()
    expect(screen.getByText('연기')).toBeInTheDocument()
    expect(screen.getByText('버블')).toBeInTheDocument()
    expect(screen.getByText('빗방울')).toBeInTheDocument()
    expect(screen.getByText('불꽃')).toBeInTheDocument()
  })

  it('토글 클릭 시 setParticleOverlay가 호출된다', () => {
    const setParticleOverlay = vi.fn()
    render(<Step2 {...base} setParticleOverlay={setParticleOverlay} />)
    const row = screen.getByTestId('particle-toggle-row')
    const switchBtn = row.querySelector('[role="switch"]')!
    fireEvent.click(switchBtn)
    expect(setParticleOverlay).toHaveBeenCalled()
  })

  it('enabled 상태에서 타입 버튼 클릭 시 setParticleOverlay가 호출된다', () => {
    const setParticleOverlay = vi.fn()
    render(
      <Step2
        {...base}
        particleOverlay={{ ...base.particleOverlay, enabled: true }}
        setParticleOverlay={setParticleOverlay}
      />
    )
    fireEvent.click(screen.getByText('반짝임'))
    expect(setParticleOverlay).toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: 테스트 실행하여 실패 확인**

```bash
npx vitest run src/components/steps/Step2/Step2.test.tsx
```

Expected: 새로 추가한 파티클 테스트들이 FAIL (Step2 props 미구현)

- [ ] **Step 3: Step2.tsx — `ParticleOverlay` import 추가**

`Step2.tsx` 상단 import를 수정한다:

```ts
import type { Track, Effects, Visualizer, Typography, Background, LogoPosition, TitleBaseStyle, TitleDecoStyle, TitlePositionPreset, ParticleOverlay, ParticleType } from '../../../types'
```

- [ ] **Step 4: PARTICLE_TYPES 상수 정의**

`Step2.tsx`에서 `const PRESET_COORDS` 위에 추가:

```ts
const PARTICLE_TYPES: { id: ParticleType; label: string; emoji: string }[] = [
  { id: 'snow',    label: '눈송이', emoji: '❄️' },
  { id: 'sparkle', label: '반짝임', emoji: '✨' },
  { id: 'firefly', label: '반딧불', emoji: '🌟' },
  { id: 'stars',   label: '별',     emoji: '⭐' },
  { id: 'petals',  label: '꽃잎',   emoji: '🌸' },
  { id: 'dust',    label: '빛 먼지',emoji: '💫' },
  { id: 'smoke',   label: '연기',   emoji: '💨' },
  { id: 'bubbles', label: '버블',   emoji: '🫧' },
  { id: 'rain',    label: '빗방울', emoji: '🌧️' },
  { id: 'sparks',  label: '불꽃',   emoji: '🔥' },
]
```

- [ ] **Step 5: Step2Props에 파티클 props 추가**

`interface Step2Props` 에서 `analyserRef: React.RefObject<AnalyserNode | null>` 바로 다음에 추가:

```ts
  particleOverlay: ParticleOverlay
  setParticleOverlay: React.Dispatch<React.SetStateAction<ParticleOverlay>>
```

- [ ] **Step 6: 함수 시그니처에서 props 구조분해 추가**

`export default function Step2({ ..., analyserRef }: Step2Props)` 의 destructuring에 추가:

```ts
export default function Step2({ tracks, theme, setTheme, effects, setEffects, visualizer, setVisualizer, typography, setTypography, onBack, onNext, playingId, isPlaying, onPlay, onPause, onSkipNext, onSkipPrev, background, logo, logoPosition, setLogoPosition, logoSize, setLogoSize, currentTime, onSeek, analyserRef, particleOverlay, setParticleOverlay }: Step2Props) {
```

- [ ] **Step 7: 왼쪽 패널에 파티클 섹션 UI 추가**

`Step2.tsx`에서 불투명도 슬라이더 (`visualizer.opacity`) 블록 바로 아래, `</div>{/* s2-panel__body */}` 닫기 태그 바로 앞에 추가:

```tsx
          <hr className="divider" />
          <div data-testid="particle-toggle-row" className="s2-section-label-row">
            <span className="s2-section-label">파티클</span>
            <Switch
              on={particleOverlay.enabled}
              onChange={() => setParticleOverlay(prev => ({ ...prev, enabled: !prev.enabled }))}
            />
          </div>
          {particleOverlay.enabled && (
            <>
              <div className="particle-type-grid">
                {PARTICLE_TYPES.map(p => (
                  <button
                    key={p.id}
                    className={`particle-type-btn${particleOverlay.type === p.id ? ' particle-type-btn--active' : ''}`}
                    onClick={() => setParticleOverlay(prev => ({ ...prev, type: p.id }))}
                  >
                    <span className="particle-type-btn__emoji">{p.emoji}</span>
                    <span className="particle-type-btn__label">{p.label}</span>
                  </button>
                ))}
              </div>
              <div className="slider-row">
                <div className="slider-row__label">밀도</div>
                <input className="slider" type="range" min={0} max={100}
                  value={particleOverlay.intensity}
                  onChange={e => setParticleOverlay(prev => ({ ...prev, intensity: Number(e.target.value) }))}
                />
                <div className="slider-row__value">{particleOverlay.intensity}</div>
              </div>
              <div className="slider-row">
                <div className="slider-row__label">속도</div>
                <input className="slider" type="range" min={0} max={100}
                  value={particleOverlay.speed}
                  onChange={e => setParticleOverlay(prev => ({ ...prev, speed: Number(e.target.value) }))}
                />
                <div className="slider-row__value">{particleOverlay.speed}</div>
              </div>
              <div className="slider-row">
                <div className="slider-row__label">크기</div>
                <input className="slider" type="range" min={0} max={100}
                  value={particleOverlay.size}
                  onChange={e => setParticleOverlay(prev => ({ ...prev, size: Number(e.target.value) }))}
                />
                <div className="slider-row__value">{particleOverlay.size}</div>
              </div>
              <div className="slider-row">
                <div className="slider-row__label">불투명도</div>
                <input className="slider" type="range" min={0} max={100}
                  value={particleOverlay.opacity}
                  onChange={e => setParticleOverlay(prev => ({ ...prev, opacity: Number(e.target.value) }))}
                />
                <div className="slider-row__value">{particleOverlay.opacity}</div>
              </div>
              <div className="vis-color-swatches">
                {VIS_COLORS.map(hex => (
                  <div
                    key={hex}
                    className={`vis-color-swatch${particleOverlay.color === hex ? ' vis-color-swatch--active' : ''}${hex === 'rainbow' ? ' vis-color-swatch--rainbow' : ''}`}
                    style={hex === 'rainbow' ? {} : { background: hex === '#ffffff' ? 'rgba(255,255,255,0.9)' : hex }}
                    onClick={() => setParticleOverlay(prev => ({ ...prev, color: hex }))}
                  />
                ))}
              </div>
            </>
          )}
```

**주의**: `Switch` 컴포넌트가 `data-testid`를 지원하는지 확인 필요. 지원하지 않으면 `Switch` 대신 `<button data-testid="particle-toggle" ...>` 방식으로 래핑한다.

- [ ] **Step 8: 테스트 실행하여 통과 확인**

```bash
npx vitest run src/components/steps/Step2/Step2.test.tsx
```

Expected: 전체 PASS

- [ ] **Step 10: Commit**

```bash
git add src/components/steps/Step2/Step2.tsx src/components/steps/Step2/Step2.test.tsx
git commit -m "feat: Step2 — 파티클 UI 섹션 추가"
```

---

## Task 4: Step2 — 파티클 캔버스 렌더링

**Files:**
- Modify: `src/components/steps/Step2/Step2.tsx`

이 Task는 Canvas 2D 렌더링이므로 JSDOM에서 테스트 불가. 시각 확인으로 검증한다.

- [ ] **Step 1: `particleOverlayCanvasRef` ref 추가**

Step2.tsx 에서 `const particleCanvasRef = useRef<HTMLCanvasElement>(null)` 바로 다음에 추가:

```ts
const particleOverlayCanvasRef = useRef<HTMLCanvasElement>(null)
```

- [ ] **Step 2: 파티클 데이터 ref 추가**

`const newVisStateRef = useRef<VisState | null>(null)` 바로 다음에 추가:

```ts
const particleOverlayDataRef = useRef<{ x: number; y: number; vx: number; vy: number; r: number; angle: number; life: number; opacity: number }[]>([])
const particleOverlayColorRef = useRef(particleOverlay.color)
particleOverlayColorRef.current = particleOverlay.color
const particleOverlaySpeedRef = useRef(particleOverlay.speed)
particleOverlaySpeedRef.current = particleOverlay.speed
const particleOverlaySizeRef = useRef(particleOverlay.size)
particleOverlaySizeRef.current = particleOverlay.size
const particleOverlayIntensityRef = useRef(particleOverlay.intensity)
particleOverlayIntensityRef.current = particleOverlay.intensity
const particleOverlayOpacityRef = useRef(particleOverlay.opacity)
particleOverlayOpacityRef.current = particleOverlay.opacity
```

- [ ] **Step 3: 파티클 오버레이 렌더링 useEffect 추가**

기존 particle useEffect (`if (visualizer.type !== 'particle') return`) 뒤에 새 useEffect를 추가한다:

```ts
  useEffect(() => {
    if (!particleOverlay.enabled) return
    const canvas = particleOverlayCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    canvas.width = canvas.offsetWidth || 640
    canvas.height = canvas.offsetHeight || 360

    const count = Math.round(30 + particleOverlayIntensityRef.current * 1.7)
    particleOverlayDataRef.current = Array.from({ length: count }, () => ({
      x: Math.random(),
      y: Math.random(),
      vx: (Math.random() - 0.5) * 0.004,
      vy: (Math.random() - 0.5) * 0.004,
      r: Math.random() * 0.8 + 0.2,
      angle: Math.random() * Math.PI * 2,
      life: Math.random(),
      opacity: Math.random(),
    }))

    let rafId: number
    let t = 0

    function initParticles() {
      const cnt = Math.round(30 + particleOverlayIntensityRef.current * 1.7)
      particleOverlayDataRef.current = Array.from({ length: cnt }, () => ({
        x: Math.random(),
        y: Math.random(),
        vx: (Math.random() - 0.5) * 0.004,
        vy: (Math.random() - 0.5) * 0.004,
        r: Math.random() * 0.8 + 0.2,
        angle: Math.random() * Math.PI * 2,
        life: Math.random(),
        opacity: Math.random(),
      }))
    }

    initParticles()

    function tick() {
      t += 0.016
      const W = canvas!.width, H = canvas!.height
      const sp = particleOverlaySpeedRef.current / 100
      const sz = particleOverlaySizeRef.current / 50
      const baseOpacity = particleOverlayOpacityRef.current / 100
      const color = particleOverlayColorRef.current
      const type = particleOverlay.type

      ctx!.clearRect(0, 0, W, H)

      particleOverlayDataRef.current.forEach(p => {
        const hue = color === 'rainbow'
          ? (p.x * 300 + t * 20) % 360
          : hexHue(color)
        const alpha = p.opacity * baseOpacity

        switch (type) {
          case 'snow': {
            p.x += Math.sin(t + p.y * 10) * 0.001 * sp
            p.y += (0.003 + p.r * 0.002) * sp
            if (p.y > 1) { p.y = -0.02; p.x = Math.random() }
            const snowR = (p.r * 4 + 1) * sz
            ctx!.save()
            ctx!.globalAlpha = alpha
            ctx!.fillStyle = color === 'rainbow' ? `hsl(${hue},60%,95%)` : `hsl(${hue},40%,90%)`
            ctx!.beginPath()
            ctx!.arc(p.x * W, p.y * H, snowR, 0, Math.PI * 2)
            ctx!.fill()
            ctx!.restore()
            break
          }
          case 'sparkle': {
            p.life += 0.04 * sp
            if (p.life > 1) { p.life = 0; p.x = Math.random(); p.y = Math.random() }
            const sparkleAlpha = Math.sin(p.life * Math.PI) * alpha
            const sparkR = (p.r * 5 + 1) * sz
            ctx!.save()
            ctx!.globalAlpha = sparkleAlpha
            ctx!.shadowColor = `hsl(${hue},100%,80%)`
            ctx!.shadowBlur = sparkR * 3
            ctx!.fillStyle = `hsl(${hue},100%,90%)`
            ctx!.beginPath()
            ctx!.arc(p.x * W, p.y * H, sparkR, 0, Math.PI * 2)
            ctx!.fill()
            ctx!.restore()
            break
          }
          case 'firefly': {
            p.x += Math.sin(t * 1.3 + p.r * 5) * 0.002 * sp
            p.y += Math.cos(t * 0.9 + p.r * 7) * 0.002 * sp
            p.x = ((p.x + 1) % 1)
            p.y = ((p.y + 1) % 1)
            p.opacity = 0.4 + Math.sin(t * 2 + p.r * 4) * 0.4
            const ffR = (p.r * 3 + 1.5) * sz
            ctx!.save()
            ctx!.globalAlpha = p.opacity * baseOpacity
            ctx!.shadowColor = `hsl(${hue},100%,70%)`
            ctx!.shadowBlur = ffR * 4
            ctx!.fillStyle = `hsl(${hue},100%,80%)`
            ctx!.beginPath()
            ctx!.arc(p.x * W, p.y * H, ffR, 0, Math.PI * 2)
            ctx!.fill()
            ctx!.restore()
            break
          }
          case 'stars': {
            p.opacity = 0.2 + Math.abs(Math.sin(t * (0.5 + p.r * 0.8) + p.r * 3)) * 0.8
            const starR = (p.r * 3 + 0.5) * sz
            ctx!.save()
            ctx!.globalAlpha = p.opacity * baseOpacity
            ctx!.fillStyle = color === 'rainbow' ? `hsl(${hue},80%,95%)` : `hsl(${hue},60%,90%)`
            ctx!.beginPath()
            ctx!.arc(p.x * W, p.y * H, starR, 0, Math.PI * 2)
            ctx!.fill()
            ctx!.restore()
            break
          }
          case 'petals': {
            p.y += (0.002 + p.r * 0.001) * sp
            p.x += Math.sin(t * 1.5 + p.r * 5) * 0.001 * sp
            p.angle += 0.015 * sp
            if (p.y > 1.05) { p.y = -0.05; p.x = Math.random() }
            const pw = (p.r * 8 + 4) * sz, ph = pw * 0.55
            ctx!.save()
            ctx!.globalAlpha = alpha
            ctx!.translate(p.x * W, p.y * H)
            ctx!.rotate(p.angle)
            ctx!.fillStyle = color === 'rainbow' ? `hsl(${hue},80%,75%)` : `hsl(${hue},70%,72%)`
            ctx!.beginPath()
            ctx!.ellipse(0, 0, pw, ph, 0, 0, Math.PI * 2)
            ctx!.fill()
            ctx!.restore()
            break
          }
          case 'dust': {
            p.y -= (0.001 + p.r * 0.0005) * sp
            p.x += Math.sin(t + p.r * 3) * 0.0005 * sp
            if (p.y < -0.02) { p.y = 1.02; p.x = Math.random() }
            const dustR = (p.r * 1.5 + 0.5) * sz
            ctx!.save()
            ctx!.globalAlpha = alpha * 0.7
            ctx!.shadowColor = `hsl(${hue},100%,85%)`
            ctx!.shadowBlur = 3
            ctx!.fillStyle = `hsl(${hue},80%,85%)`
            ctx!.beginPath()
            ctx!.arc(p.x * W, p.y * H, dustR, 0, Math.PI * 2)
            ctx!.fill()
            ctx!.restore()
            break
          }
          case 'smoke': {
            p.y -= (0.001 + p.r * 0.0008) * sp
            p.x += (Math.random() - 0.5) * 0.0005 * sp
            p.r = Math.min(p.r + 0.003 * sp, 1.5)
            p.opacity = Math.max(0, p.opacity - 0.004 * sp)
            if (p.opacity <= 0 || p.y < -0.15) {
              p.y = 1.05; p.x = 0.3 + Math.random() * 0.4
              p.r = Math.random() * 0.4 + 0.1; p.opacity = Math.random() * 0.4 + 0.2
            }
            const smokeR = (p.r * 30 + 10) * sz
            ctx!.save()
            ctx!.globalAlpha = p.opacity * baseOpacity * 0.5
            ctx!.fillStyle = color === 'rainbow' ? `hsl(${hue},20%,85%)` : `hsl(${hue},10%,80%)`
            ctx!.beginPath()
            ctx!.arc(p.x * W, p.y * H, smokeR, 0, Math.PI * 2)
            ctx!.fill()
            ctx!.restore()
            break
          }
          case 'bubbles': {
            p.y -= (0.002 + p.r * 0.001) * sp
            p.x += Math.sin(t * 2 + p.r * 6) * 0.0008 * sp
            if (p.y < -0.02) { p.y = 1.02; p.x = Math.random() }
            const bubR = (p.r * 10 + 3) * sz
            ctx!.save()
            ctx!.globalAlpha = alpha * 0.7
            ctx!.strokeStyle = color === 'rainbow' ? `hsl(${hue},80%,80%)` : `hsl(${hue},60%,75%)`
            ctx!.lineWidth = 1.2
            ctx!.beginPath()
            ctx!.arc(p.x * W, p.y * H, bubR, 0, Math.PI * 2)
            ctx!.stroke()
            ctx!.globalAlpha = alpha * 0.15
            ctx!.fillStyle = color === 'rainbow' ? `hsl(${hue},60%,85%)` : `hsl(${hue},40%,80%)`
            ctx!.fill()
            ctx!.restore()
            break
          }
          case 'rain': {
            p.y += (0.015 + p.r * 0.01) * sp
            p.x += (0.002 + p.r * 0.001) * sp
            if (p.y > 1.02) { p.y = -0.02 - Math.random() * 0.3; p.x = Math.random() }
            const rainLen = (8 + p.r * 6) * sz
            const rx = p.x * W, ry = p.y * H
            ctx!.save()
            ctx!.globalAlpha = alpha * 0.7
            ctx!.strokeStyle = color === 'rainbow' ? `hsl(${hue},60%,80%)` : `hsl(${hue},50%,75%)`
            ctx!.lineWidth = (0.8 + p.r * 0.4) * sz
            ctx!.beginPath()
            ctx!.moveTo(rx, ry)
            ctx!.lineTo(rx + rainLen * 0.2, ry + rainLen)
            ctx!.stroke()
            ctx!.restore()
            break
          }
          case 'sparks': {
            p.vy += 0.0003 * sp
            p.y += p.vy
            p.x += p.vx
            p.life -= 0.02 * sp
            if (p.life <= 0) {
              p.x = 0.3 + Math.random() * 0.4
              p.y = 0.6 + Math.random() * 0.3
              p.vx = (Math.random() - 0.5) * 0.012 * sp
              p.vy = -(Math.random() * 0.015 + 0.005) * sp
              p.life = 0.5 + Math.random() * 0.5
            }
            const sparkAlpha = p.life * alpha
            ctx!.save()
            ctx!.globalAlpha = sparkAlpha
            ctx!.strokeStyle = color === 'rainbow' ? `hsl(${hue},100%,80%)` : `hsl(${hue},90%,75%)`
            ctx!.lineWidth = (1 + p.r) * sz
            ctx!.beginPath()
            ctx!.moveTo(p.x * W, p.y * H)
            ctx!.lineTo((p.x - p.vx * 8) * W, (p.y - p.vy * 8) * H)
            ctx!.stroke()
            ctx!.restore()
            break
          }
        }
      })
      rafId = requestAnimationFrame(tick)
    }

    rafId = requestAnimationFrame(tick)
    return () => { cancelAnimationFrame(rafId); ctx?.clearRect(0, 0, canvas!.width, canvas!.height) }
  }, [particleOverlay.enabled, particleOverlay.type])
```

- [ ] **Step 4: 스테이지에 파티클 오버레이 캔버스 추가**

`Step2.tsx` 스테이지 JSX에서 로고 drag img (`{logo && ...}`) 바로 위에 추가:

```tsx
            {particleOverlay.enabled && (
              <canvas
                ref={particleOverlayCanvasRef}
                className="s2-frame__particle-overlay-canvas"
                style={{ opacity: particleOverlay.opacity / 100 }}
              />
            )}
```

- [ ] **Step 5: CSS 클래스 추가**

`Step2.css`를 찾아서 `.s2-frame__particle-canvas` 스타일 뒤에 추가한다.

먼저 현재 CSS 파일에서 particle-canvas 스타일 확인:
```bash
grep -n "particle-canvas\|particle" src/components/steps/Step2/Step2.css
```

`.s2-frame__particle-canvas`와 동일한 위치 고정 스타일을 `.s2-frame__particle-overlay-canvas`에도 적용:

```css
.s2-frame__particle-overlay-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 5;
}
```

그리고 파티클 타입 그리드와 버튼 CSS도 추가:

```css
.s2-section-label-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}

.particle-type-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4px;
  margin-bottom: 10px;
}

.particle-type-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 6px 8px;
  border-radius: 6px;
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.08);
  color: var(--c-text-sub, #9ca3af);
  font-size: 11px;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
  text-align: left;
}

.particle-type-btn:hover {
  background: rgba(255,255,255,0.1);
}

.particle-type-btn--active {
  background: rgba(120,90,255,0.18);
  border-color: rgba(120,90,255,0.5);
  color: #c4b5fd;
}

.particle-type-btn__emoji {
  font-size: 14px;
  line-height: 1;
}

.particle-type-btn__label {
  font-size: 11px;
}
```

- [ ] **Step 6: 전체 테스트 실행**

```bash
npx vitest run
```

Expected: 전체 PASS (기존 테스트 포함)

- [ ] **Step 7: Commit**

```bash
git add src/components/steps/Step2/Step2.tsx src/components/steps/Step2/Step2.css
git commit -m "feat: Step2 — 파티클 오버레이 캔버스 렌더링"
```

---

## Task 5: 최종 확인 및 마무리

**Files:**
- 없음 (확인 및 커밋)

- [ ] **Step 1: 전체 테스트 실행**

```bash
npx vitest run
```

Expected: 전체 PASS

- [ ] **Step 2: TypeScript 타입 체크**

```bash
npx tsc --noEmit
```

Expected: 에러 없음

- [ ] **Step 3: dev 서버 실행 및 시각 확인**

```bash
npm run dev
```

확인 체크리스트:
- [ ] Step2 왼쪽 패널 스크롤 시 파티클 섹션이 비주얼라이저 슬라이더 아래에 표시됨
- [ ] ON 토글 클릭 시 파티클 섹션 컨텐츠가 펼쳐짐
- [ ] 타입 버튼 10개 표시 (눈송이, 반짝임, ... 불꽃)
- [ ] 스테이지에 파티클 애니메이션이 재생됨
- [ ] 타입 변경 시 파티클 모션이 바뀜
- [ ] 슬라이더 조작이 즉각 반영됨
- [ ] 비주얼라이저와 동시 활성화 가능
- [ ] OFF 토글 시 파티클 캔버스가 사라짐

- [ ] **Step 4: 최종 커밋**

모든 변경이 이미 커밋되었으면 생략. 미커밋 파일이 있으면:

```bash
git add -p
git commit -m "feat: 파티클 오버레이 — 최종 마무리"
```
