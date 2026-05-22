# Audio Empty State + Logo Position Drag 구현 플랜

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 앱 시작 시 트랙 목록을 빈 상태로 시작하고, Step2 스테이지에서 로고를 드래그해 위치를 조정할 수 있게 한다.

**Architecture:** `LogoPosition` 타입을 추가하고 App.tsx에서 상태로 관리. Step2에서 document-level mousemove/mouseup으로 드래그 처리. frameRenderer에 위치값을 전달해 실제 렌더링 좌표에도 반영.

**Tech Stack:** React 18, TypeScript, Vitest, @testing-library/react

---

## 파일 변경 맵

| 파일 | 변경 내용 |
|---|---|
| `src/types.ts` | `LogoPosition` 인터페이스 추가 |
| `src/App.tsx` | 초기 tracks `[]`로 변경, `logoPosition` 상태 추가 + Step2/Step3에 props 전달 |
| `src/lib/renderer/frameRenderer.ts` | `DrawFrameInput`에 `logoPosition` 추가, drawImage 좌표 반영 |
| `src/lib/renderer/frameRenderer.test.ts` | base fixture에 `logoPosition` 추가, 위치 기반 drawImage 테스트 |
| `src/lib/renderer/index.ts` | `RenderInput`에 `logoPosition` 추가, frameInputBase에 전달 |
| `src/components/steps/Step2/Step2.tsx` | `logoPosition`/`setLogoPosition` props, 드래그 로직, 로고를 absolute로 분리 |
| `src/components/steps/Step2/Step2.css` | 드래그 가능한 로고 absolute 스타일 + cursor |
| `src/components/steps/Step2/Step2.test.tsx` | base fixture에 `logoPosition`/`setLogoPosition` 추가 |
| `src/components/steps/Step3/Step3.tsx` | `logoPosition` prop 추가, 요약 텍스트 동적화 |
| `src/components/steps/Step3/Step3.test.tsx` | base fixture에 `logoPosition` 추가 |

---

## Task 1: LogoPosition 타입 추가

**Files:**
- Modify: `src/types.ts`

- [ ] **Step 1: types.ts에 LogoPosition 인터페이스 추가**

  `src/types.ts` 파일 맨 아래에 추가:
  ```ts
  export interface LogoPosition {
    x: number  // 스테이지 너비 대비 %, 0–100
    y: number  // 스테이지 높이 대비 %, 0–100
  }
  ```

- [ ] **Step 2: 빌드 확인**

  Run: `npm run build -- --noEmit 2>&1 | head -20`
  Expected: 에러 없음 (또는 기존 에러만)

- [ ] **Step 3: 커밋**
  ```bash
  git add src/types.ts
  git commit -m "feat: LogoPosition 타입 추가"
  ```

---

## Task 2: frameRenderer — logoPosition 반영

**Files:**
- Modify: `src/lib/renderer/frameRenderer.ts:5-22` (DrawFrameInput 인터페이스)
- Modify: `src/lib/renderer/frameRenderer.ts:81-85` (로고 drawImage)
- Test: `src/lib/renderer/frameRenderer.test.ts`

- [ ] **Step 1: 테스트 먼저 — logoPosition이 drawImage 좌표에 반영되는지 확인하는 테스트 작성**

  `src/lib/renderer/frameRenderer.test.ts`에서 `base` fixture에 `logoPosition` 추가 후, 새 테스트 추가:

  ```ts
  // base fixture에 추가:
  const base: DrawFrameInput = {
    // ... 기존 필드들 ...
    logoPosition: { x: 85, y: 8 },
  }

  it('logoPosition x=50, y=50이면 drawImage가 캔버스 중앙에서 호출된다', () => {
    beforeEach(() => { mockCtx.drawImage.mockClear() })
    const img = {} as ImageBitmap
    const logoSize = Math.round(64 * (1920 / 1920))  // 64
    drawFrame({ ...base, logoImage: img, logoPosition: { x: 50, y: 50 } })
    const call = mockCtx.drawImage.mock.calls.find(c => c[0] === img)
    expect(call).toBeDefined()
    // x: (50/100)*1920 - 64/2 = 960 - 32 = 928
    // y: (50/100)*1080 - 64/2 = 540 - 32 = 508
    expect(call![1]).toBe(928)
    expect(call![2]).toBe(508)
  })
  ```

- [ ] **Step 2: 테스트 실패 확인**

  Run: `npm test -- --reporter=verbose 2>&1 | tail -30`
  Expected: `logoPosition x=50` 테스트가 FAIL (DrawFrameInput에 logoPosition 없음)

- [ ] **Step 3: DrawFrameInput에 logoPosition 추가**

  `src/lib/renderer/frameRenderer.ts` 상단 import에 `LogoPosition` 추가:
  ```ts
  import type { Background, Effects, Visualizer, Typography, Track, LogoPosition } from '../../types'
  ```

  `DrawFrameInput` 인터페이스에 추가:
  ```ts
  export interface DrawFrameInput {
    canvas: OffscreenCanvas
    width: number
    height: number
    frequencyData: Float32Array
    themeGradient: [string, string]
    background: Background
    backgroundImage?: ImageBitmap
    logoImage?: ImageBitmap
    logoPosition: LogoPosition
    watermarkImage?: ImageBitmap
    stickerImages: ImageBitmap[]
    effects: Effects
    visualizer: Visualizer
    typography: Typography
    currentTrack: Track
    currentTrackIndex: number
    totalTracks: number
  }
  ```

- [ ] **Step 4: drawFrame에서 logoPosition 좌표 반영**

  `src/lib/renderer/frameRenderer.ts` 로고 그리기 부분(5. 로고):
  ```ts
  // 5. 로고
  if (input.logoImage) {
    const logoSize = Math.round(64 * (width / 1920))
    const lx = Math.round((input.logoPosition.x / 100) * width) - logoSize / 2
    const ly = Math.round((input.logoPosition.y / 100) * height) - logoSize / 2
    ctx.globalAlpha = 1
    ctx.drawImage(input.logoImage, lx, ly, logoSize, logoSize)
  }
  ```

- [ ] **Step 5: 테스트 통과 확인**

  Run: `npm test -- --reporter=verbose 2>&1 | tail -30`
  Expected: 모든 테스트 PASS

- [ ] **Step 6: 커밋**
  ```bash
  git add src/lib/renderer/frameRenderer.ts src/lib/renderer/frameRenderer.test.ts
  git commit -m "feat: frameRenderer에 logoPosition 반영"
  ```

---

## Task 3: renderer/index.ts — RenderInput에 logoPosition 추가

**Files:**
- Modify: `src/lib/renderer/index.ts`

- [ ] **Step 1: RenderInput에 logoPosition 추가**

  `src/lib/renderer/index.ts`:

  import 라인 변경:
  ```ts
  import type { Track, Background, Effects, Visualizer, Typography, ExportSettings, LogoPosition } from '../../types'
  ```

  `RenderInput` 인터페이스에 추가:
  ```ts
  export interface RenderInput {
    tracks: Track[]
    theme: string
    background: Background
    logo?: string
    logoPosition: LogoPosition
    watermark?: string
    stickers: string[]
    effects: Effects
    visualizer: Visualizer
    typography: Typography
    exportSettings: ExportSettings
    loops: 1 | 2 | 3
  }
  ```

  `encodeVideo` 호출 내 `frameInputBase`에 `logoPosition` 추가:
  ```ts
  const blob = await encodeVideo({
    audioResult,
    frameInputBase: {
      width,
      height,
      themeGradient,
      background: input.background,
      backgroundImage,
      logoImage,
      logoPosition: input.logoPosition,
      watermarkImage,
      stickerImages: stickerImages.filter((x): x is ImageBitmap => x !== undefined),
      effects: input.effects,
      visualizer: input.visualizer,
      typography: input.typography,
      totalTracks: input.tracks.length,
    },
    resolution: input.exportSettings.resolution,
    tracks: input.tracks,
    onProgress: pct => onProgress(40 + pct * 0.6),
  })
  ```

- [ ] **Step 2: 빌드 타입 체크**

  Run: `npx tsc --noEmit 2>&1 | head -30`
  Expected: 에러 없음 (Step3.tsx에서 renderVideo 호출 시 logoPosition 없어서 에러가 날 수 있음 — 다음 Task에서 해결)

- [ ] **Step 3: 커밋**
  ```bash
  git add src/lib/renderer/index.ts
  git commit -m "feat: RenderInput에 logoPosition 추가"
  ```

---

## Task 4: App.tsx — 초기 트랙 비우기 + logoPosition 상태

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: 초기 tracks 빈 배열로 변경**

  `src/App.tsx` line 15:
  ```ts
  // before:
  const [tracks, setTracks] = useState<Track[]>(sampleTracks)
  // after:
  const [tracks, setTracks] = useState<Track[]>([])
  ```

- [ ] **Step 2: logoPosition 상태 추가**

  `src/App.tsx`에서 `logo` 상태 선언 바로 아래에 추가:
  ```ts
  import type { Track, Background, Effects, Visualizer, Typography, ExportSettings, LogoPosition } from './types'
  // ...
  const [logo, setLogo] = useState<string | undefined>(undefined)
  const [logoPosition, setLogoPosition] = useState<LogoPosition>({ x: 85, y: 8 })
  ```

- [ ] **Step 3: Step2에 logoPosition props 전달**

  App.tsx의 Step2 렌더링 부분:
  ```tsx
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
    logoPosition={logoPosition}
    setLogoPosition={setLogoPosition}
    currentTime={audioCurrentTime}
  />
  ```

- [ ] **Step 4: Step3에 logoPosition props 전달**

  App.tsx의 Step3 렌더링 부분:
  ```tsx
  <Step3
    tracks={tracks}
    theme={theme}
    effects={effects}
    visualizer={visualizer}
    exportSettings={exportSettings}
    setExportSettings={setExportSettings}
    loops={loops}
    quality={quality}
    onBack={() => setStep(2)}
    background={background}
    logo={logo}
    logoPosition={logoPosition}
    watermark={watermark}
    stickers={stickers}
    typography={typography}
  />
  ```

- [ ] **Step 5: `sampleTracks` import 제거 (더 이상 사용 안 함)**

  `src/App.tsx` 상단:
  ```ts
  // 아래 줄 삭제:
  import { sampleTracks } from './data/sampleTracks'
  ```

- [ ] **Step 6: 타입 체크**

  Run: `npx tsc --noEmit 2>&1 | head -30`
  Expected: Step2/Step3에서 logoPosition prop 관련 에러 (다음 Task에서 해결)

- [ ] **Step 7: 커밋**
  ```bash
  git add src/App.tsx
  git commit -m "feat: 초기 트랙 빈 상태 + logoPosition 상태 추가"
  ```

---

## Task 5: Step3.tsx — logoPosition prop + 요약 텍스트 동적화

**Files:**
- Modify: `src/components/steps/Step3/Step3.tsx`
- Test: `src/components/steps/Step3/Step3.test.tsx`

- [ ] **Step 1: Step3 테스트 fixture에 logoPosition 추가**

  `src/components/steps/Step3/Step3.test.tsx`의 `base` fixture:
  ```ts
  import type { Background, LogoPosition } from '../../../types'
  // ...
  const base = {
    // ... 기존 필드들 ...
    logoPosition: { x: 85, y: 8 } as LogoPosition,
  }
  ```

- [ ] **Step 2: 테스트 실패 확인**

  Run: `npm test -- Step3 --reporter=verbose 2>&1 | tail -20`
  Expected: TypeScript 에러로 컴파일 실패 또는 prop 누락 경고

- [ ] **Step 3: Step3Props에 logoPosition 추가**

  `src/components/steps/Step3/Step3.tsx`:

  import 업데이트:
  ```ts
  import type { Track, Effects, Visualizer, ExportSettings, Background, Typography, LogoPosition } from '../../../types'
  ```

  `Step3Props` 인터페이스:
  ```ts
  interface Step3Props {
    tracks: Track[]
    theme: string
    effects: Effects
    visualizer: Visualizer
    exportSettings: ExportSettings
    setExportSettings: (s: ExportSettings) => void
    loops: 1 | 2 | 3
    quality: '96k' | '128k' | '192k'
    onBack: () => void
    background: Background
    logo?: string
    logoPosition: LogoPosition
    watermark?: string
    stickers: string[]
    typography: Typography
  }
  ```

  함수 시그니처에 `logoPosition` 추가:
  ```ts
  export default function Step3({ tracks, theme, effects, visualizer, exportSettings, setExportSettings, loops, quality, onBack, background, logo, logoPosition, watermark, stickers, typography }: Step3Props) {
  ```

- [ ] **Step 4: 요약 텍스트 동적화 + renderVideo에 logoPosition 전달**

  파일 상단(컴포넌트 밖)에 헬퍼 함수 추가:
  ```ts
  function logoPositionLabel(pos: LogoPosition): string {
    const x = pos.x < 40 ? '좌' : pos.x > 60 ? '우' : '중'
    const y = pos.y < 40 ? '상' : pos.y > 60 ? '하' : '중'
    return `${y}${x}단`
  }
  ```

  "로고 / 워터마크" 요약 행 변경:
  ```tsx
  <div className="s3-form-row__value">
    {logo ? `로고 · ${logoPositionLabel(logoPosition)}` : '로고 없음'} · 워터마크 {watermark ? '있음' : '없음'}
  </div>
  ```

  `startRender` 함수 내 `renderVideo` 호출에 `logoPosition` 추가:
  ```ts
  const blob = await renderVideo(
    { tracks, theme, effects, visualizer, typography, background, logo, logoPosition, watermark, stickers, exportSettings, loops },
    setProgress,
  )
  ```

- [ ] **Step 5: 테스트 통과 확인**

  Run: `npm test -- Step3 --reporter=verbose 2>&1 | tail -20`
  Expected: 모든 Step3 테스트 PASS

- [ ] **Step 6: 커밋**
  ```bash
  git add src/components/steps/Step3/Step3.tsx src/components/steps/Step3/Step3.test.tsx
  git commit -m "feat: Step3에 logoPosition prop 추가 및 요약 텍스트 동적화"
  ```

---

## Task 6: Step2.css — 드래그 로고 스타일

**Files:**
- Modify: `src/components/steps/Step2/Step2.css`

- [ ] **Step 1: 드래그 가능한 로고 CSS 추가**

  `src/components/steps/Step2/Step2.css` 맨 아래에 추가:
  ```css
  /* 드래그 가능한 로고 (업로드된 경우) */
  .s2-frame__logo-drag {
    position: absolute;
    width: 52px;
    height: 52px;
    border-radius: 14px;
    object-fit: contain;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    transform: translate(-50%, -50%);
    cursor: grab;
    z-index: 4;
    user-select: none;
    -webkit-user-drag: none;
  }
  .s2-frame__logo-drag:active,
  .s2-frame__logo-drag--dragging {
    cursor: grabbing;
  }
  ```

- [ ] **Step 2: 커밋**
  ```bash
  git add src/components/steps/Step2/Step2.css
  git commit -m "feat: 드래그 로고 CSS 추가"
  ```

---

## Task 7: Step2.tsx — 드래그 로직 구현

**Files:**
- Modify: `src/components/steps/Step2/Step2.tsx`
- Test: `src/components/steps/Step2/Step2.test.tsx`

- [ ] **Step 1: Step2 테스트 fixture에 logoPosition/setLogoPosition 추가**

  `src/components/steps/Step2/Step2.test.tsx`의 `base` fixture:
  ```ts
  import type { Background, LogoPosition } from '../../../types'
  // ...
  const base = {
    // ... 기존 필드들 ...
    logoPosition: { x: 85, y: 8 } as LogoPosition,
    setLogoPosition: vi.fn(),
  }
  ```

- [ ] **Step 2: 테스트 실패 확인**

  Run: `npm test -- Step2 --reporter=verbose 2>&1 | tail -20`
  Expected: TypeScript prop 누락 에러

- [ ] **Step 3: Step2Props 업데이트 + 드래그 로직 구현**

  `src/components/steps/Step2/Step2.tsx` 전체 교체:

  import 상단:
  ```ts
  import { useRef, useEffect } from 'react'
  import type { Track, Effects, Visualizer, Typography, Background, LogoPosition } from '../../../types'
  ```

  `Step2Props` 인터페이스에 추가:
  ```ts
  interface Step2Props {
    // ... 기존 props ...
    logoPosition: LogoPosition
    setLogoPosition: (p: LogoPosition) => void
  }
  ```

  컴포넌트 함수 시그니처에 추가:
  ```ts
  export default function Step2({ ..., logo, logoPosition, setLogoPosition, currentTime }: Step2Props) {
  ```

  컴포넌트 본문 상단(return 전)에 드래그 로직 추가:
  ```ts
  const frameRef = useRef<HTMLDivElement>(null)
  const isDragging = useRef(false)
  const dragOffset = useRef({ x: 0, y: 0 })

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

  useEffect(() => {
    function onMouseMove(e: MouseEvent) {
      if (!isDragging.current || !frameRef.current) return
      const rect = frameRef.current.getBoundingClientRect()
      const x = Math.max(5, Math.min(95, ((e.clientX - rect.left - dragOffset.current.x) / rect.width) * 100))
      const y = Math.max(5, Math.min(90, ((e.clientY - rect.top - dragOffset.current.y) / rect.height) * 100))
      setLogoPosition({ x, y })
    }
    function onMouseUp() {
      isDragging.current = false
    }
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
    return () => {
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
    }
  }, [setLogoPosition])
  ```

  JSX에서 스테이지 프레임 변경:

  1. `<div className="s2-stage__frame" ...>` 에 `ref={frameRef}` 추가
  2. `s2-frame__content` 안에서 로고 렌더링 교체:
     ```tsx
     {/* 로고: 업로드된 경우 absolute 드래그 / 없으면 placeholder */}
     {!logo && (
       <div className="s2-frame__logo"><Icon name="logo" size={26} /></div>
     )}
     ```
  3. `</div>` (s2-stage__frame 닫기) 직전에 드래그 로고 추가:
     ```tsx
     {logo && (
       <img
         className="s2-frame__logo-drag"
         src={logo}
         alt=""
         style={{ left: `${logoPosition.x}%`, top: `${logoPosition.y}%` }}
         onMouseDown={handleLogoMouseDown}
         draggable={false}
       />
     )}
     ```

- [ ] **Step 4: 테스트 통과 확인**

  Run: `npm test -- Step2 --reporter=verbose 2>&1 | tail -20`
  Expected: 모든 Step2 테스트 PASS

- [ ] **Step 5: 전체 테스트 통과 확인**

  Run: `npm test 2>&1 | tail -20`
  Expected: 모든 테스트 PASS (94개 이상)

- [ ] **Step 6: 커밋**
  ```bash
  git add src/components/steps/Step2/Step2.tsx src/components/steps/Step2/Step2.test.tsx
  git commit -m "feat: Step2 로고 드래그 위치 조정 구현"
  ```
