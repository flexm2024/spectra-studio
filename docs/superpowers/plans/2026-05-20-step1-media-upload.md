# Step1 미디어 업로드 기능 구현 플랜

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Step1 브랜딩 탭(배경/로고/워터마크/스티커)의 이미지 업로드 기능 구현, 업로드된 에셋을 Step1·Step2 프리뷰에 반영, 오디오 재생 진행바 연동.

**Architecture:** 5개 새 상태(`background`, `logo`, `watermark`, `stickers`, `audioCurrentTime`)를 App.tsx에서 관리하고 Step1·Step2에 props로 전달. 각 drop-slot에 숨김 `<input type="file">` 추가 및 클릭/드롭 이벤트 연결. `<audio>` 요소의 `onTimeUpdate`로 `currentTime` 상태 갱신.

**Tech Stack:** React 18, TypeScript 5, Vitest, @testing-library/react

---

## 파일 맵

| 파일 | 변경 유형 | 내용 |
|------|-----------|------|
| `src/types.ts` | Modify | `watermark?: string` 추가 |
| `src/App.tsx` | Modify | 5개 상태, `onTimeUpdate`, Step1/Step2 props 전달 |
| `src/components/steps/Step1/Step1.tsx` | Modify | Props 확장, 핸들러 추가, UI 업데이트 |
| `src/components/steps/Step1/Step1.css` | Modify | drop-slot--filled, sticker-grid, bg-img, logo-img 클래스 추가 |
| `src/components/steps/Step1/Step1.test.tsx` | Modify | base 객체 업데이트, 새 테스트 추가 |
| `src/components/steps/Step2/Step2.tsx` | Modify | background/logo props 추가, 스테이지 프레임 반영 |
| `src/components/steps/Step2/Step2.test.tsx` | Modify | base 객체 업데이트 |
| `src/components/steps/Step2/Step2.css` | Modify | `s2-frame__bg-img`, `s2-frame__logo-img` 추가 |

---

## Task 1: types.ts — watermark 필드 추가

**Files:**
- Modify: `src/types.ts`

- [ ] **Step 1: `ProjectState`에 `watermark` 필드 추가**

`src/types.ts`의 `ProjectState` 타입에서 `logo?: string` 다음 줄에 추가.

```ts
export type ProjectState = {
  step: 1 | 2 | 3
  tracks: Track[]
  playingId: string | null
  background: Background
  logo?: string
  watermark?: string   // ← 추가
  stickers: string[]
  loops: 1 | 2 | 3
  audioQuality: '96k' | '128k' | '192k'
  // ... 이하 기존 필드 유지
```

- [ ] **Step 2: 타입 체크 확인**

```powershell
npx tsc --noEmit
```
Expected: 0 errors

- [ ] **Step 3: 커밋**

```bash
git add src/types.ts
git commit -m "feat: ProjectState에 watermark 필드 추가"
```

---

## Task 2: Step1 CSS — 새 클래스 추가

**Files:**
- Modify: `src/components/steps/Step1/Step1.css`

- [ ] **Step 1: `Step1.css` 파일 끝에 아래 CSS 추가**

```css
/* 업로드 완료 drop-slot */
.drop-slot--filled {
  padding: 0;
  overflow: hidden;
  position: relative;
}
.drop-slot__thumb {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  min-height: 110px;
}
.drop-slot__change {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.5);
  color: oklch(1 0 0);
  font-size: 12px;
  font-weight: 600;
  opacity: 0;
  transition: opacity 120ms ease;
}
.drop-slot--filled:hover .drop-slot__change { opacity: 1; }

/* 스티커 그리드 */
.sticker-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 6px;
  margin-bottom: 10px;
}
.sticker-item {
  position: relative;
  aspect-ratio: 1;
  border-radius: 6px;
  overflow: hidden;
  background: var(--bg-sunken);
  border: 1px solid var(--line);
}
.sticker-item img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}
.sticker-item__del {
  position: absolute;
  top: 2px;
  right: 2px;
  width: 16px;
  height: 16px;
  border-radius: 4px;
  background: rgba(0, 0, 0, 0.6);
  border: none;
  color: oklch(1 0 0);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  opacity: 0;
  transition: opacity 120ms ease;
}
.sticker-item:hover .sticker-item__del { opacity: 1; }

/* Step1 프리뷰 배경 이미지 */
.preview-frame__bg-img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* Step1 프리뷰 로고 이미지 */
.preview-frame__logo-img {
  width: 42px;
  height: 42px;
  border-radius: 11px;
  object-fit: contain;
  background: rgba(255, 255, 255, 0.1);
}
```

- [ ] **Step 2: 커밋**

```bash
git add src/components/steps/Step1/Step1.css
git commit -m "feat: Step1 CSS — 이미지 업로드 및 스티커 그리드 스타일 추가"
```

---

## Task 3: Step1 — 테스트 업데이트 (failing 먼저)

**Files:**
- Modify: `src/components/steps/Step1/Step1.test.tsx`

- [ ] **Step 1: `Step1.test.tsx`의 `base` 객체에 새 props 추가**

파일 상단 import에 `Background` 타입 추가.

```ts
import type { Track, Background } from '../../../types'
```

`base` 객체를 아래로 교체 (기존 필드 유지 + 새 필드 추가).

```ts
const base = {
  tracks: sampleTracks,
  setTracks: vi.fn(),
  playingId: null as string | null,
  isPlaying: false,
  loops: 1 as const,
  setLoops: vi.fn(),
  quality: '192k' as const,
  setQuality: vi.fn(),
  onPlay: vi.fn(),
  onPause: vi.fn(),
  onSkipNext: vi.fn(),
  onSkipPrev: vi.fn(),
  onNext: vi.fn(),
  background: { type: 'gradient' } as Background,
  setBackground: vi.fn(),
  logo: undefined as string | undefined,
  setLogo: vi.fn(),
  watermark: undefined as string | undefined,
  setWatermark: vi.fn(),
  stickers: [] as string[],
  setStickers: vi.fn(),
  currentTime: 0,
}
```

- [ ] **Step 2: 새 테스트 4개 추가** (`describe('Step1', () => {` 블록 안 끝에 추가)

```ts
it('배경 파일 선택 시 setBackground가 type: image로 호출된다', () => {
  const setBackground = vi.fn()
  vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:fake-bg')
  vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
  render(<Step1 {...base} setBackground={setBackground} />)
  const bgInput = document.querySelector('[data-testid="bg-file-input"]') as HTMLInputElement
  const file = new File([''], 'bg.jpg', { type: 'image/jpeg' })
  fireEvent.change(bgInput, { target: { files: [file] } })
  expect(setBackground).toHaveBeenCalledWith({ type: 'image', src: 'blob:fake-bg' })
  vi.restoreAllMocks()
})

it('로고 파일 선택 시 setLogo가 호출된다', () => {
  const setLogo = vi.fn()
  vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:fake-logo')
  vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
  render(<Step1 {...base} setLogo={setLogo} />)
  fireEvent.click(screen.getByText('로고'))
  const logoInput = document.querySelector('[data-testid="logo-file-input"]') as HTMLInputElement
  const file = new File([''], 'logo.png', { type: 'image/png' })
  fireEvent.change(logoInput, { target: { files: [file] } })
  expect(setLogo).toHaveBeenCalledWith('blob:fake-logo')
  vi.restoreAllMocks()
})

it('스티커가 있을 때 뱃지가 "N / 5"로 표시된다', () => {
  render(<Step1 {...base} stickers={['blob:1', 'blob:2', 'blob:3']} />)
  expect(screen.getByText('3 / 5')).toBeInTheDocument()
})

it('currentTime이 주어질 때 진행바 너비가 비율로 계산된다', () => {
  const track = sampleTracks[0]  // durationSec = 131
  render(<Step1 {...base} playingId={track.id} currentTime={track.durationSec / 2} />)
  const fill = document.querySelector('.preview-controls__fill') as HTMLElement
  expect(fill.style.width).toBe('50%')
})
```

- [ ] **Step 3: 테스트 실행 — 새 테스트 4개 실패 확인 (기존 테스트는 통과해야 함)**

```powershell
npx vitest run src/components/steps/Step1/Step1.test.tsx
```
Expected: 기존 테스트들은 PASS, 새 4개 테스트는 FAIL (props not found / element not found)

---

## Task 4: Step1 — Props 확장 + 이미지 업로드 기능 구현

**Files:**
- Modify: `src/components/steps/Step1/Step1.tsx`

- [ ] **Step 1: import에 `Background` 타입 추가**

파일 첫 줄 import를 교체.

```ts
import type { Track, Background } from '../../../types'
```

- [ ] **Step 2: `Step1Props` 인터페이스에 새 props 추가** (`onNext: () => void` 다음에)

```ts
  background: Background
  setBackground: (bg: Background) => void
  logo: string | undefined
  setLogo: (url: string | undefined) => void
  watermark: string | undefined
  setWatermark: (url: string | undefined) => void
  stickers: string[]
  setStickers: (s: string[]) => void
  currentTime: number
```

- [ ] **Step 3: 함수 시그니처 업데이트** — 구조분해에 새 props 추가

```ts
export default function Step1({
  tracks, setTracks,
  playingId, isPlaying,
  loops, setLoops,
  quality, setQuality,
  onPlay, onPause, onSkipNext, onSkipPrev,
  onNext,
  background, setBackground,
  logo, setLogo,
  watermark, setWatermark,
  stickers, setStickers,
  currentTime,
}: Step1Props) {
```

- [ ] **Step 4: `bgType` 내부 상태 제거**

아래 줄을 삭제.
```ts
const [bgType, setBgType] = useState<'image' | 'gradient' | 'video'>('gradient')
```

- [ ] **Step 5: 이미지 파일 ref 4개 추가** (기존 `fileInputRef` 선언 바로 아래에)

```ts
const bgFileRef = useRef<HTMLInputElement>(null)
const logoFileRef = useRef<HTMLInputElement>(null)
const watermarkFileRef = useRef<HTMLInputElement>(null)
const stickerFileRef = useRef<HTMLInputElement>(null)
```

- [ ] **Step 6: 이미지 업로드 핸들러 4개 추가** (`applySort` 함수 바로 아래에)

```ts
const handleBgFile = (files: FileList | null) => {
  if (!files || files.length === 0) return
  if (background.src) URL.revokeObjectURL(background.src)
  setBackground({ type: 'image', src: URL.createObjectURL(files[0]) })
}

const handleLogoFile = (files: FileList | null) => {
  if (!files || files.length === 0) return
  if (logo) URL.revokeObjectURL(logo)
  setLogo(URL.createObjectURL(files[0]))
}

const handleWatermarkFile = (files: FileList | null) => {
  if (!files || files.length === 0) return
  if (watermark) URL.revokeObjectURL(watermark)
  setWatermark(URL.createObjectURL(files[0]))
}

const handleStickerFiles = (files: FileList | null) => {
  if (!files || files.length === 0) return
  const remaining = 5 - stickers.length
  if (remaining <= 0) return
  const urls = Array.from(files).slice(0, remaining).map(f => URL.createObjectURL(f))
  setStickers([...stickers, ...urls])
}

const handleDeleteSticker = (url: string) => {
  URL.revokeObjectURL(url)
  setStickers(stickers.filter(s => s !== url))
}
```

- [ ] **Step 7: 프리뷰 프레임 배경 업데이트**

기존 `<div className="preview-frame__bg" />` 를 아래로 교체.

```tsx
{background.src
  ? <img className="preview-frame__bg-img" src={background.src} alt="" />
  : <div className="preview-frame__bg" />
}
```

- [ ] **Step 8: 프리뷰 프레임 로고 업데이트**

기존 `<div className="preview-frame__logo"><Icon name="logo" size={22} /></div>` 를 아래로 교체.

```tsx
{logo
  ? <img className="preview-frame__logo-img" src={logo} alt="" />
  : <div className="preview-frame__logo"><Icon name="logo" size={22} /></div>
}
```

- [ ] **Step 9: 진행바 width를 `currentTime` 기반으로 교체**

기존 `<div className="preview-controls__fill" />` 를 아래로 교체.

```tsx
<div
  className="preview-controls__fill"
  style={{ width: `${playingTrack ? (currentTime / Math.max(1, playingTrack.durationSec)) * 100 : 0}%` }}
/>
```

- [ ] **Step 10: 배경 탭 drop-slot 업데이트**

기존 배경 탭 전체 `{activeTab === 'background' && (...)}`를 아래로 교체.

```tsx
{activeTab === 'background' && (
  <div style={{ padding: 14 }}>
    <div
      className={`drop-slot${background.src ? ' drop-slot--filled' : ''}`}
      onClick={() => bgFileRef.current?.click()}
      onDragOver={e => e.preventDefault()}
      onDrop={e => { e.preventDefault(); handleBgFile(e.dataTransfer.files) }}
    >
      {background.src ? (
        <>
          <img className="drop-slot__thumb" src={background.src} alt="" />
          <div className="drop-slot__change">변경</div>
        </>
      ) : (
        <>
          <Icon name="image" size={22} />
          <div>배경 이미지를 끌어다 놓거나 클릭</div>
          <div className="drop-slot__hint">JPG · PNG · 최소 1920×1080</div>
        </>
      )}
    </div>
    <input
      data-testid="bg-file-input"
      ref={bgFileRef}
      type="file"
      accept="image/*"
      style={{ display: 'none' }}
      onChange={e => { handleBgFile(e.target.files); e.target.value = '' }}
    />
    <div className="form-section" style={{ paddingLeft: 0, paddingRight: 0 }}>
      <div className="form-section__label">배경 타입</div>
      <SegmentedControl
        options={BG_OPTIONS}
        value={background.type}
        onChange={type => setBackground({ ...background, type })}
      />
    </div>
  </div>
)}
```

- [ ] **Step 11: 로고 탭 업데이트**

기존 `{activeTab === 'logo' && (...)}` 전체를 아래로 교체.

```tsx
{activeTab === 'logo' && (
  <div style={{ padding: 14, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
    <div
      className={`drop-slot${logo ? ' drop-slot--filled' : ''}`}
      onClick={() => logoFileRef.current?.click()}
      onDragOver={e => e.preventDefault()}
      onDrop={e => { e.preventDefault(); handleLogoFile(e.dataTransfer.files) }}
    >
      {logo ? (
        <>
          <img className="drop-slot__thumb" src={logo} alt="" />
          <div className="drop-slot__change">변경</div>
        </>
      ) : (
        <>
          <Icon name="layers" size={20} />
          <div style={{ fontSize: 11.5, fontWeight: 600 }}>로고</div>
          <div className="drop-slot__hint">PNG · SVG</div>
        </>
      )}
    </div>
    <input
      data-testid="logo-file-input"
      ref={logoFileRef}
      type="file"
      accept="image/*,.svg"
      style={{ display: 'none' }}
      onChange={e => { handleLogoFile(e.target.files); e.target.value = '' }}
    />
    <div
      className={`drop-slot${watermark ? ' drop-slot--filled' : ''}`}
      onClick={() => watermarkFileRef.current?.click()}
      onDragOver={e => e.preventDefault()}
      onDrop={e => { e.preventDefault(); handleWatermarkFile(e.dataTransfer.files) }}
    >
      {watermark ? (
        <>
          <img className="drop-slot__thumb" src={watermark} alt="" />
          <div className="drop-slot__change">변경</div>
        </>
      ) : (
        <>
          <Icon name="sticker" size={20} />
          <div style={{ fontSize: 11.5, fontWeight: 600 }}>워터마크</div>
          <div className="drop-slot__hint">선택 · PNG</div>
        </>
      )}
    </div>
    <input
      data-testid="watermark-file-input"
      ref={watermarkFileRef}
      type="file"
      accept="image/*"
      style={{ display: 'none' }}
      onChange={e => { handleWatermarkFile(e.target.files); e.target.value = '' }}
    />
  </div>
)}
```

- [ ] **Step 12: 스티커 탭 업데이트**

기존 `{activeTab === 'stickers' && (...)}` 전체를 아래로 교체.

```tsx
{activeTab === 'stickers' && (
  <div style={{ padding: 14 }}>
    {stickers.length > 0 && (
      <div className="sticker-grid">
        {stickers.map(url => (
          <div key={url} className="sticker-item">
            <img src={url} alt="" />
            <button
              type="button"
              className="sticker-item__del"
              onClick={() => handleDeleteSticker(url)}
            >
              <Icon name="x" size={10} />
            </button>
          </div>
        ))}
      </div>
    )}
    {stickers.length < 5 && (
      <div
        className="drop-slot"
        onClick={() => stickerFileRef.current?.click()}
        onDragOver={e => e.preventDefault()}
        onDrop={e => { e.preventDefault(); handleStickerFiles(e.dataTransfer.files) }}
      >
        <Icon name="sticker" size={22} />
        <div>스티커/GIF를 끌어다 놓으세요</div>
        <div className="drop-slot__hint">GIF · PNG · 최대 5개</div>
      </div>
    )}
    <input
      data-testid="sticker-file-input"
      ref={stickerFileRef}
      type="file"
      accept="image/*,.gif"
      multiple
      style={{ display: 'none' }}
      onChange={e => { handleStickerFiles(e.target.files); e.target.value = '' }}
    />
  </div>
)}
```

- [ ] **Step 13: 스티커 탭 뱃지 업데이트**

기존 `<>스티커 <span className="tab__badge">0 / 5</span></>` 를 아래로 교체.

```tsx
<>스티커 <span className="tab__badge">{stickers.length} / 5</span></>
```

- [ ] **Step 14: 테스트 실행 — 모든 테스트 통과 확인**

```powershell
npx vitest run src/components/steps/Step1/Step1.test.tsx
```
Expected: PASS (기존 + 새 4개 모두)

- [ ] **Step 15: 커밋**

```bash
git add src/components/steps/Step1/Step1.tsx src/components/steps/Step1/Step1.test.tsx
git commit -m "feat: Step1 이미지 업로드(배경/로고/워터마크/스티커) 및 진행바 연동"
```

---

## Task 5: App.tsx — 새 상태 추가 + Step1 props 전달

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: `Background` 타입 import 추가**

기존 import를 교체.

```ts
import type { Track, Background, Effects, Visualizer, Typography, ExportSettings } from './types'
```

- [ ] **Step 2: 새 상태 5개 추가** (`exportSettings` 상태 선언 바로 아래에)

```ts
const [background, setBackground] = useState<Background>({ type: 'gradient' })
const [logo, setLogo] = useState<string | undefined>(undefined)
const [watermark, setWatermark] = useState<string | undefined>(undefined)
const [stickers, setStickers] = useState<string[]>([])
const [audioCurrentTime, setAudioCurrentTime] = useState(0)
```

- [ ] **Step 3: `<audio>` 요소에 `onTimeUpdate` 핸들러 추가**

기존 `<audio ... />` 를 아래로 교체.

```tsx
<audio
  ref={audioRef}
  onPlay={() => setIsPlaying(true)}
  onPause={() => setIsPlaying(false)}
  onEnded={handleTrackEnded}
  onTimeUpdate={e => setAudioCurrentTime(e.currentTarget.currentTime)}
/>
```

- [ ] **Step 4: Step1 컴포넌트에 새 props 전달**

기존 `<Step1 ... />` 블록을 아래로 교체.

```tsx
<Step1
  tracks={tracks}
  setTracks={setTracks}
  playingId={playingId}
  isPlaying={isPlaying}
  loops={loops}
  setLoops={setLoops}
  quality={quality}
  setQuality={setQuality}
  onPlay={onPlay}
  onPause={onPause}
  onSkipNext={onSkipNext}
  onSkipPrev={onSkipPrev}
  onNext={() => setStep(2)}
  background={background}
  setBackground={setBackground}
  logo={logo}
  setLogo={setLogo}
  watermark={watermark}
  setWatermark={setWatermark}
  stickers={stickers}
  setStickers={setStickers}
  currentTime={audioCurrentTime}
/>
```

- [ ] **Step 5: 타입 체크 + 테스트 통과 확인**

```powershell
npx tsc --noEmit
npx vitest run
```
Expected: 0 errors, all tests PASS

- [ ] **Step 6: 커밋**

```bash
git add src/App.tsx
git commit -m "feat: App.tsx 미디어 에셋 상태 추가 및 Step1 props 연결"
```

---

## Task 6: Step2 CSS + 컴포넌트 — background/logo 프리뷰 반영

**Files:**
- Modify: `src/components/steps/Step2/Step2.css`
- Modify: `src/components/steps/Step2/Step2.tsx`
- Modify: `src/components/steps/Step2/Step2.test.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: `Step2.css` 끝에 두 클래스 추가**

```css
/* 커스텀 배경 이미지 (스테이지 프레임) */
.s2-frame__bg-img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  z-index: 0;
}

/* 커스텀 로고 이미지 */
.s2-frame__logo-img {
  width: 52px;
  height: 52px;
  border-radius: 14px;
  object-fit: contain;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
}
```

- [ ] **Step 2: `Step2.test.tsx` base 객체 업데이트**

`import` 라인에 `Background` 추가.

```ts
import type { Background } from '../../../types'
```

`base` 객체에 두 필드 추가 (`onSkipPrev: vi.fn(),` 다음에).

```ts
  background: { type: 'gradient' } as Background,
  logo: undefined as string | undefined,
```

- [ ] **Step 3: Step2 테스트 실행 — 현재 통과 확인**

```powershell
npx vitest run src/components/steps/Step2/Step2.test.tsx
```
Expected: 9 tests PASS

- [ ] **Step 4: `Step2.tsx` — `Background` 타입 import 추가**

기존 import를 교체.

```ts
import type { Track, Effects, Visualizer, Typography, Background } from '../../../types'
```

- [ ] **Step 5: `Step2Props` 인터페이스에 두 props 추가** (`onSkipPrev: () => void` 다음에)

```ts
  background: Background
  logo: string | undefined
```

- [ ] **Step 6: 함수 시그니처 구조분해에 새 props 추가**

기존 `export default function Step2({ tracks, theme, ...` 첫 줄을 아래로 교체.

```ts
export default function Step2({ tracks, theme, setTheme, effects, setEffects, visualizer, setVisualizer, typography, setTypography, onBack, onNext, playingId, isPlaying, onPlay, onPause, onSkipNext, onSkipPrev, background, logo }: Step2Props) {
```

- [ ] **Step 7: 스테이지 프레임에 배경 이미지 반영**

기존 `<div className="s2-stage__frame" style={{ background: themeObj.bg }}>` 를 아래로 교체.

```tsx
<div
  className="s2-stage__frame"
  style={{ background: background.src ? undefined : themeObj.bg }}
>
  {background.src && (
    <img className="s2-frame__bg-img" src={background.src} alt="" />
  )}
```

- [ ] **Step 8: 스테이지 프레임 로고 반영**

기존 `<div className="s2-frame__logo"><Icon name="logo" size={26} /></div>` 를 아래로 교체.

```tsx
{logo
  ? <img className="s2-frame__logo-img" src={logo} alt="" />
  : <div className="s2-frame__logo"><Icon name="logo" size={26} /></div>
}
```

- [ ] **Step 9: `App.tsx` — Step2에 background/logo props 전달**

기존 `<Step2 ... />` 블록에서 `onSkipPrev={onSkipPrev}` 다음에 두 props 추가.

```tsx
background={background}
logo={logo}
```

- [ ] **Step 10: 전체 테스트 통과 확인**

```powershell
npx tsc --noEmit
npx vitest run
```
Expected: 0 TS errors, all tests PASS

- [ ] **Step 11: 커밋**

```bash
git add src/components/steps/Step2/Step2.css src/components/steps/Step2/Step2.tsx src/components/steps/Step2/Step2.test.tsx src/App.tsx
git commit -m "feat: Step2 스테이지에 커스텀 배경/로고 반영"
```

---

## 자체 검토

### 스펙 커버리지

| 스펙 요구사항 | 구현 Task |
|--------------|-----------|
| 배경 이미지 업로드 → setBackground 호출 | Task 4 Step 10 |
| 로고 업로드 → setLogo 호출 | Task 4 Step 11 |
| 워터마크 업로드 → setWatermark 호출 | Task 4 Step 11 |
| 스티커 업로드 (최대 5개) → setStickers 호출 | Task 4 Step 12 |
| bgType 상태 제거 → background.type 통합 | Task 4 Step 4, 10 |
| 파일 교체 시 revokeObjectURL | Task 4 Step 6 |
| 스티커 개별 삭제 + revokeObjectURL | Task 4 Step 6, 12 |
| 스티커 뱃지 실시간 반영 | Task 4 Step 13 |
| 업로드 후 drop-slot 썸네일 표시 | Task 4 Step 10–12 |
| 진행바 currentTime 반영 | Task 4 Step 9 |
| App.tsx 상태 관리 | Task 5 |
| Step2 배경/로고 반영 | Task 6 |
| watermark 타입 추가 | Task 1 |

### 타입 일관성

- `background: Background` — Task 1에서 `Background` 타입 재사용, Task 2/4/5/6 일치
- `setBackground: (bg: Background) => void` — Task 3/4/5 일치
- `stickers: string[]` — Task 3/4/5 일치
- `handleBgFile`, `handleLogoFile`, `handleWatermarkFile`, `handleStickerFiles`, `handleDeleteSticker` — Task 4에서 정의, Task 4 Steps 10–12에서 사용

### 누락 없음

- ✅ 모든 drop-slot에 drag & drop + click 처리
- ✅ ObjectURL 해제 (교체 시, 스티커 삭제 시)
- ✅ 스티커 5개 초과 방지 (`remaining` 계산)
- ✅ 진행바 division-by-zero 방지 (`Math.max(1, ...)`)
- ✅ Step1/Step2 테스트 base 객체 업데이트
