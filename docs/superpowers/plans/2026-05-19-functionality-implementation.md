# Spectra Studio 기능 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** UI만 완성된 Spectra Studio에 실제 파일 업로드, 오디오 재생, 정렬, 상태 연결 기능을 구현한다.

**Architecture:** App.tsx가 단일 `<audio>` 엘리먼트와 `playingId`/`isPlaying` 상태를 소유하고, 재생 콜백(onPlay/onPause/onSkipNext/onSkipPrev)을 Step1/Step2에 내려준다. Step3는 `loops`/`quality`만 props로 받아 요약에 반영한다.

**Tech Stack:** React 18, TypeScript 5, Vitest + @testing-library/react, 브라우저 File API, HTML `<audio>` 엘리먼트

---

## 파일 맵

| 파일 | 변경 유형 | 역할 |
|------|----------|------|
| `src/types.ts` | 수정 | Track에 `audioUrl?: string` 추가 |
| `src/App.tsx` | 수정 | 오디오 상태·콜백·audio 엘리먼트 추가, 새 props 전달 |
| `src/components/steps/Step1/Step1.tsx` | 수정 | 로컬 상태 제거, props 수신, 파일 업로드, 정렬, 컨트롤 연결 |
| `src/components/steps/Step1/Step1.css` | 수정 | 정렬 드롭다운 스타일 추가 |
| `src/components/steps/Step1/Step1.test.tsx` | 수정 | base 객체 갱신, 업로드·정렬·재생 테스트 추가 |
| `src/components/steps/Step2/Step2.tsx` | 수정 | 재생 props 수신, 컨트롤 연결 |
| `src/components/steps/Step2/Step2.test.tsx` | 수정 | base 객체에 재생 props 추가 |
| `src/components/steps/Step3/Step3.tsx` | 수정 | loops/quality props 수신, 하드코딩 제거, 저장 버튼 비활성화 |
| `src/components/steps/Step3/Step3.test.tsx` | 수정 | base 객체에 loops/quality 추가, 동적 표시 테스트 추가 |

---

## Task 1: Track 타입 확장

**Files:**
- Modify: `src/types.ts`

- [ ] **Step 1: `audioUrl` 필드 추가**

`src/types.ts`의 `Track` 타입을 다음과 같이 수정:

```typescript
export type Track = {
  id: string
  title: string
  artist: string
  duration: string
  durationSec: number
  tag: string
  bpm: number
  src: string
  waveform: number[]
  audioUrl?: string   // 업로드 파일의 Object URL. 샘플 트랙은 undefined.
}
```

- [ ] **Step 2: 기존 테스트 통과 확인**

```bash
npx vitest run
```

Expected: 전체 45개 테스트 모두 PASS (타입 추가는 옵셔널이므로 기존 코드 무영향)

- [ ] **Step 3: 커밋**

```bash
git add src/types.ts
git commit -m "feat: Track 타입에 audioUrl 옵셔널 필드 추가"
```

---

## Task 2: App.tsx — 오디오 인프라 구축

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: import 및 상태 추가**

`src/App.tsx` 상단을 다음과 같이 수정:

```typescript
// 앱 루트 — 전체 상태 관리 및 레이아웃 조합
import { useState, useRef } from 'react'
import type { Track, Effects, Visualizer, Typography, ExportSettings } from './types'
import { sampleTracks } from './data/sampleTracks'
import Sidebar from './components/Sidebar/Sidebar'
import Header from './components/Header/Header'
import StatusBar from './components/StatusBar/StatusBar'
import Step1 from './components/steps/Step1/Step1'
import Step2 from './components/steps/Step2/Step2'
import Step3 from './components/steps/Step3/Step3'

export default function App() {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [tracks, setTracks] = useState<Track[]>(sampleTracks)
  const [playingId, setPlayingId] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [loops, setLoops] = useState<1 | 2 | 3>(1)
  const [quality, setQuality] = useState<'96k' | '128k' | '192k'>('192k')
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
```

- [ ] **Step 2: 재생 콜백 5개 추가**

상태 선언 바로 뒤, `return` 전에 삽입:

```typescript
  const onPlay = (id: string) => {
    const track = tracks.find(t => t.id === id)
    setPlayingId(id)
    setIsPlaying(true)
    if (track?.audioUrl && audioRef.current) {
      if (audioRef.current.src !== track.audioUrl) {
        audioRef.current.src = track.audioUrl
      }
      audioRef.current.play()
    }
  }

  const onPause = () => {
    setIsPlaying(false)
    audioRef.current?.pause()
  }

  const onSkipNext = () => {
    const idx = tracks.findIndex(t => t.id === playingId)
    const next = tracks[idx + 1]
    if (next) onPlay(next.id)
  }

  const onSkipPrev = () => {
    if (audioRef.current && audioRef.current.currentTime > 2) {
      audioRef.current.currentTime = 0
      return
    }
    const idx = tracks.findIndex(t => t.id === playingId)
    const prev = tracks[idx - 1]
    if (prev) onPlay(prev.id)
  }

  const handleTrackEnded = () => onSkipNext()
```

- [ ] **Step 3: JSX 업데이트 — audio 엘리먼트 + 새 props 전달**

`return` 블록 전체를 다음으로 교체:

```tsx
  return (
    <div className="app">
      <audio ref={audioRef} onEnded={handleTrackEnded} />
      <Sidebar step={step} setStep={setStep} tracks={tracks} />
      <Header step={step} setStep={setStep} />
      <main className="main">
        {step === 1 && (
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
          />
        )}
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
          />
        )}
        {step === 3 && (
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
          />
        )}
      </main>
      <StatusBar tracks={tracks} />
    </div>
  )
}
```

- [ ] **Step 4: 커밋**

```bash
git add src/App.tsx
git commit -m "feat: App.tsx에 오디오 재생 인프라 추가 (상태·콜백·audio 엘리먼트)"
```

---

## Task 3: Step1 — Props 갱신 및 로컬 상태 제거

**Files:**
- Modify: `src/components/steps/Step1/Step1.tsx`
- Modify: `src/components/steps/Step1/Step1.test.tsx`

- [ ] **Step 1: 테스트 base 객체에 새 props 추가**

`Step1.test.tsx`의 `base` 객체를 다음으로 교체 (기존 테스트들이 새 interface를 충족하도록):

```typescript
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
}
```

- [ ] **Step 2: 테스트 실행 (현재 FAIL 예상)**

```bash
npx vitest run src/components/steps/Step1/Step1.test.tsx
```

Expected: TS 컴파일 오류 또는 prop 불일치 에러 (Step1 interface가 아직 구 버전이므로)

- [ ] **Step 3: Step1 Props 인터페이스 교체**

`Step1.tsx`의 `interface Step1Props`를 다음으로 교체:

```typescript
interface Step1Props {
  tracks: Track[]
  setTracks: (tracks: Track[]) => void
  playingId: string | null
  isPlaying: boolean
  loops: 1 | 2 | 3
  setLoops: (l: 1 | 2 | 3) => void
  quality: '96k' | '128k' | '192k'
  setQuality: (q: '96k' | '128k' | '192k') => void
  onPlay: (id: string) => void
  onPause: () => void
  onSkipNext: () => void
  onSkipPrev: () => void
  onNext: () => void
}
```

- [ ] **Step 4: 함수 시그니처 및 로컬 상태 제거**

`export default function Step1(...)` 줄과 내부 로컬 상태 선언을 다음으로 교체:

```typescript
export default function Step1({
  tracks, setTracks,
  playingId, isPlaying,
  loops, setLoops,
  quality, setQuality,
  onPlay, onPause, onSkipNext, onSkipPrev,
  onNext,
}: Step1Props) {
  const [activeTab, setActiveTab] = useState<'background' | 'logo' | 'stickers'>('background')
  const [bgType, setBgType] = useState<'image' | 'gradient' | 'video'>('gradient')
  const [dragId, setDragId] = useState<string | null>(null)
  const [overId, setOverId] = useState<string | null>(null)
```

(기존 `playingId`, `loops`, `quality` useState 3개 삭제)

- [ ] **Step 5: JSX 내 track row 클릭 핸들러 수정**

기존: `onClick={() => setPlayingId(t.id)}`  
변경: `onClick={() => onPlay(t.id)}`

기존 track play 버튼:
```tsx
onClick={e => { e.stopPropagation(); setPlayingId(playingId === t.id ? (tracks[0]?.id ?? '') : t.id) }}
```
변경:
```tsx
onClick={e => { e.stopPropagation(); playingId === t.id && isPlaying ? onPause() : onPlay(t.id) }}
```

- [ ] **Step 6: 테스트 재실행 — PASS 확인**

```bash
npx vitest run src/components/steps/Step1/Step1.test.tsx
```

Expected: 5개 PASS

- [ ] **Step 7: 커밋**

```bash
git add src/components/steps/Step1/Step1.tsx src/components/steps/Step1/Step1.test.tsx
git commit -m "refactor: Step1 playingId·loops·quality 로컬 상태를 App.tsx props로 교체"
```

---

## Task 4: Step1 — 파일 업로드

**Files:**
- Modify: `src/components/steps/Step1/Step1.tsx`
- Modify: `src/components/steps/Step1/Step1.test.tsx`

- [ ] **Step 1: 실패하는 테스트 작성**

`Step1.test.tsx`에 다음 테스트 추가:

```typescript
it('드롭존 클릭 시 파일 선택 input이 트리거된다', () => {
  const clickSpy = vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(() => {})
  render(<Step1 {...base} />)
  fireEvent.click(document.querySelector('.upload')!)
  expect(clickSpy).toHaveBeenCalled()
  clickSpy.mockRestore()
})

it('"트랙 추가" 버튼 클릭 시 파일 선택 input이 트리거된다', () => {
  const clickSpy = vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(() => {})
  render(<Step1 {...base} />)
  fireEvent.click(screen.getByText(/트랙 추가/))
  expect(clickSpy).toHaveBeenCalled()
  clickSpy.mockRestore()
})
```

- [ ] **Step 2: 테스트 실행 — FAIL 확인**

```bash
npx vitest run src/components/steps/Step1/Step1.test.tsx
```

Expected: 새로 추가한 2개 테스트 FAIL

- [ ] **Step 3: import 및 useRef 추가**

`Step1.tsx` import에 `useRef` 추가:

```typescript
import { useState, useRef } from 'react'
```

함수 본문 상단(기존 로컬 상태 선언 직후)에 추가:

```typescript
  const fileInputRef = useRef<HTMLInputElement>(null)
```

- [ ] **Step 4: handleFiles 함수 추가**

`fileInputRef` 선언 바로 뒤에 추가:

```typescript
  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    const newTracks: Track[] = []
    for (const file of Array.from(files)) {
      const title = file.name.replace(/\.[^/.]+$/, '')
      if (tracks.some(t => t.title === title) || newTracks.some(t => t.title === title)) continue
      const audioUrl = URL.createObjectURL(file)
      const durationSec = await new Promise<number>(resolve => {
        const audio = new Audio()
        audio.addEventListener('loadedmetadata', () => resolve(Math.round(audio.duration)))
        audio.addEventListener('error', () => resolve(0))
        audio.src = audioUrl
      })
      const minutes = Math.floor(durationSec / 60)
      const seconds = durationSec % 60
      const duration = `${minutes}:${String(seconds).padStart(2, '0')}`
      const id = `upload-${Date.now()}-${newTracks.length}`
      newTracks.push({
        id,
        title,
        artist: 'Unknown',
        duration,
        durationSec,
        tag: '기타',
        bpm: 0,
        src: '',
        audioUrl,
        waveform: waveformFor(tracks.length + newTracks.length + 1),
      })
    }
    if (newTracks.length > 0) setTracks([...tracks, ...newTracks])
  }
```

- [ ] **Step 5: JSX — 숨겨진 file input 추가**

`return (` 안, `<div className="step1">` 바로 다음 줄에 삽입:

```tsx
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="audio/*"
        style={{ display: 'none' }}
        onChange={e => handleFiles(e.target.files)}
      />
```

- [ ] **Step 6: 드롭존에 핸들러 연결**

기존 `<div className="upload">` 를 다음으로 교체:

```tsx
              <div
                className="upload"
                style={{ cursor: 'pointer' }}
                onDragOver={e => e.preventDefault()}
                onDrop={e => { e.preventDefault(); handleFiles(e.dataTransfer.files) }}
                onClick={() => fileInputRef.current?.click()}
              >
```

- [ ] **Step 7: "트랙 추가" 버튼에 onClick 연결**

기존:
```tsx
<Button variant="ghost"><Icon name="plus" size={14} /> 트랙 추가</Button>
```

변경:
```tsx
<Button variant="ghost" onClick={() => fileInputRef.current?.click()}>
  <Icon name="plus" size={14} /> 트랙 추가
</Button>
```

- [ ] **Step 8: 테스트 PASS 확인**

```bash
npx vitest run src/components/steps/Step1/Step1.test.tsx
```

Expected: 7개 PASS

- [ ] **Step 9: 커밋**

```bash
git add src/components/steps/Step1/Step1.tsx src/components/steps/Step1/Step1.test.tsx
git commit -m "feat: Step1 오디오 파일 업로드 구현 (드래그/클릭, 메타데이터 추출)"
```

---

## Task 5: Step1 — 정렬 드롭다운

**Files:**
- Modify: `src/components/steps/Step1/Step1.tsx`
- Modify: `src/components/steps/Step1/Step1.css`
- Modify: `src/components/steps/Step1/Step1.test.tsx`

- [ ] **Step 1: 실패하는 테스트 작성**

`Step1.test.tsx`에 추가:

```typescript
it('"정렬" 버튼 클릭 시 드롭다운이 표시된다', () => {
  render(<Step1 {...base} />)
  fireEvent.click(screen.getByText('정렬'))
  expect(screen.getByText('제목 A → Z')).toBeInTheDocument()
})

it('"제목 A → Z" 선택 시 setTracks가 가나다 오름차순으로 호출된다', () => {
  const setTracks = vi.fn()
  render(<Step1 {...base} setTracks={setTracks} />)
  fireEvent.click(screen.getByText('정렬'))
  fireEvent.click(screen.getByText('제목 A → Z'))
  expect(setTracks).toHaveBeenCalledTimes(1)
  const result: Track[] = setTracks.mock.calls[0][0]
  expect(result[0].title.localeCompare(result[1].title, 'ko')).toBeLessThanOrEqual(0)
})
```

- [ ] **Step 2: 테스트 실행 — FAIL 확인**

```bash
npx vitest run src/components/steps/Step1/Step1.test.tsx
```

Expected: 새 2개 테스트 FAIL

- [ ] **Step 3: sortOpen 상태 + sortRef + 바깥 클릭 처리 추가**

`Step1.tsx` import에 `useEffect` 추가:

```typescript
import { useState, useRef, useEffect } from 'react'
```

로컬 상태 선언부에 추가:

```typescript
  const [sortOpen, setSortOpen] = useState(false)
  const sortRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!sortOpen) return
    const handler = (e: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) {
        setSortOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [sortOpen])
```

- [ ] **Step 4: applySort 함수 추가**

`handleFiles` 바로 뒤에 추가:

```typescript
  const applySort = (key: 'titleAsc' | 'titleDesc' | 'bpmAsc' | 'bpmDesc') => {
    const sorted = [...tracks]
    if (key === 'titleAsc')  sorted.sort((a, b) => a.title.localeCompare(b.title, 'ko'))
    if (key === 'titleDesc') sorted.sort((a, b) => b.title.localeCompare(a.title, 'ko'))
    if (key === 'bpmAsc')    sorted.sort((a, b) => a.bpm - b.bpm)
    if (key === 'bpmDesc')   sorted.sort((a, b) => b.bpm - a.bpm)
    setTracks(sorted)
    setSortOpen(false)
  }
```

- [ ] **Step 5: JSX — 정렬 버튼을 래퍼로 교체**

기존:
```tsx
<Button variant="ghost"><Icon name="sliders" size={14} /> 정렬</Button>
```

변경:
```tsx
<div ref={sortRef} style={{ position: 'relative' }}>
  <Button variant="ghost" onClick={() => setSortOpen(o => !o)}>
    <Icon name="sliders" size={14} /> 정렬
  </Button>
  {sortOpen && (
    <div className="sort-menu">
      {([
        { key: 'titleAsc',  label: '제목 A → Z' },
        { key: 'titleDesc', label: '제목 Z → A' },
        { key: 'bpmAsc',    label: 'BPM 낮은 순' },
        { key: 'bpmDesc',   label: 'BPM 높은 순' },
      ] as const).map(({ key, label }) => (
        <button
          key={key}
          type="button"
          className="sort-menu__item"
          onClick={() => applySort(key)}
        >
          {label}
        </button>
      ))}
    </div>
  )}
</div>
```

- [ ] **Step 6: CSS 추가**

`Step1.css` 끝에 추가:

```css
.sort-menu {
  position: absolute;
  top: calc(100% + 4px);
  right: 0;
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 4px;
  z-index: 20;
  min-width: 130px;
  box-shadow: 0 4px 16px rgb(0 0 0 / 0.3);
}

.sort-menu__item {
  display: block;
  width: 100%;
  padding: 6px 10px;
  border-radius: 4px;
  background: none;
  border: none;
  color: var(--text-1);
  font-size: 12px;
  text-align: left;
  cursor: pointer;
  white-space: nowrap;
}

.sort-menu__item:hover {
  background: var(--surface-3);
}
```

- [ ] **Step 7: 테스트 PASS 확인**

```bash
npx vitest run src/components/steps/Step1/Step1.test.tsx
```

Expected: 9개 PASS

- [ ] **Step 8: 커밋**

```bash
git add src/components/steps/Step1/Step1.tsx src/components/steps/Step1/Step1.css src/components/steps/Step1/Step1.test.tsx
git commit -m "feat: Step1 정렬 드롭다운 구현 (제목/BPM 오름·내림차순)"
```

---

## Task 6: Step1 — 재생 컨트롤 + 누락 버튼

**Files:**
- Modify: `src/components/steps/Step1/Step1.tsx`
- Modify: `src/components/steps/Step1/Step1.test.tsx`

- [ ] **Step 1: 실패하는 테스트 작성**

`Step1.test.tsx`에 추가:

```typescript
it('재생 버튼 클릭 시 onPlay가 호출된다', () => {
  const onPlay = vi.fn()
  render(<Step1 {...base} onPlay={onPlay} />)
  // preview-play 버튼 클릭
  fireEvent.click(document.querySelector('.preview-play')!)
  expect(onPlay).toHaveBeenCalled()
})

it('"초기화" 버튼 클릭 시 setLoops(1)과 setQuality("192k")가 호출된다', () => {
  const setLoops = vi.fn()
  const setQuality = vi.fn()
  render(<Step1 {...base} setLoops={setLoops} setQuality={setQuality} />)
  fireEvent.click(screen.getByText('초기화'))
  expect(setLoops).toHaveBeenCalledWith(1)
  expect(setQuality).toHaveBeenCalledWith('192k')
})
```

- [ ] **Step 2: 테스트 실행 — FAIL 확인**

```bash
npx vitest run src/components/steps/Step1/Step1.test.tsx
```

Expected: 새 2개 테스트 FAIL

- [ ] **Step 3: 프리뷰 컨트롤 연결**

Step1.tsx의 `playingTrack` 계산 직후(기존 코드 유지)에 `isPreviewPlaying` 도우미 추가:

```typescript
  const playingTrack = tracks.find(t => t.id === playingId) ?? tracks[0]
  const isPreviewPlaying = isPlaying && playingId === playingTrack?.id
```

프리뷰 이전/재생/다음 버튼을 다음으로 교체:

```tsx
          <div className="preview-controls">
            <Button variant="ghost" size="icon" onClick={onSkipPrev}>
              <Icon name="skipBack" size={14} />
            </Button>
            <button
              type="button"
              className="preview-play"
              onClick={() => isPreviewPlaying ? onPause() : onPlay(playingTrack?.id ?? tracks[0]?.id ?? '')}
            >
              <Icon name={isPreviewPlaying ? 'pause' : 'play'} size={14} />
            </button>
            <Button variant="ghost" size="icon" onClick={onSkipNext}>
              <Icon name="skipForward" size={14} />
            </Button>
            <div className="preview-controls__progress">
              <div className="preview-controls__fill" />
            </div>
            <span className="preview-controls__time">0:48 / {playingTrack?.duration}</span>
          </div>
```

- [ ] **Step 4: "초기화" 버튼 onClick 연결**

기존:
```tsx
<Button variant="danger-ghost"><Icon name="reset" size={14} /> 초기화</Button>
```

변경:
```tsx
<Button variant="danger-ghost" onClick={() => { setLoops(1); setQuality('192k') }}>
  <Icon name="reset" size={14} /> 초기화
</Button>
```

- [ ] **Step 5: 테스트 PASS 확인**

```bash
npx vitest run src/components/steps/Step1/Step1.test.tsx
```

Expected: 11개 PASS

- [ ] **Step 6: 전체 테스트 PASS 확인**

```bash
npx vitest run
```

Expected: 전체 PASS

- [ ] **Step 7: 커밋**

```bash
git add src/components/steps/Step1/Step1.tsx src/components/steps/Step1/Step1.test.tsx
git commit -m "feat: Step1 프리뷰 재생 컨트롤 및 초기화 버튼 연결"
```

---

## Task 7: Step2 — 재생 컨트롤 연결

**Files:**
- Modify: `src/components/steps/Step2/Step2.tsx`
- Modify: `src/components/steps/Step2/Step2.test.tsx`

- [ ] **Step 1: 테스트 base 갱신**

`Step2.test.tsx`의 `base` 객체를 다음으로 교체:

```typescript
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
  playingId: null as string | null,
  isPlaying: false,
  onPlay: vi.fn(),
  onPause: vi.fn(),
  onSkipNext: vi.fn(),
  onSkipPrev: vi.fn(),
  onBack: vi.fn(),
  onNext: vi.fn(),
}
```

- [ ] **Step 2: 실패하는 테스트 추가**

`Step2.test.tsx`에 추가:

```typescript
it('스테이지 재생 버튼 클릭 시 onPlay가 호출된다', () => {
  const onPlay = vi.fn()
  render(<Step2 {...base} onPlay={onPlay} />)
  fireEvent.click(document.querySelector('.s2-play-btn')!)
  expect(onPlay).toHaveBeenCalled()
})
```

- [ ] **Step 3: 테스트 실행 — FAIL 확인**

```bash
npx vitest run src/components/steps/Step2/Step2.test.tsx
```

Expected: 기존 5개 PASS + 새 1개 FAIL (interface 불일치 없으면 컴파일 통과)

- [ ] **Step 4: Step2Props 인터페이스 수정**

`Step2.tsx`의 `interface Step2Props`에 다음 필드 추가:

```typescript
  playingId: string | null
  isPlaying: boolean
  onPlay: (id: string) => void
  onPause: () => void
  onSkipNext: () => void
  onSkipPrev: () => void
```

- [ ] **Step 5: 함수 시그니처에 새 props 추가**

```typescript
export default function Step2({
  tracks, theme, setTheme, effects, setEffects,
  visualizer, setVisualizer, typography, setTypography,
  playingId, isPlaying, onPlay, onPause, onSkipNext, onSkipPrev,
  onBack, onNext,
}: Step2Props) {
```

기존 `const [playingId, setPlayingId] = useState<string>(...)` 줄을 제거하고 대신:

```typescript
  const themeObj = THEMES.find(t => t.id === theme) ?? THEMES[0]
  const playingTrack = tracks.find(t => t.id === playingId) ?? tracks[0]
  const trackIdx = tracks.findIndex(t => t.id === (playingId ?? tracks[0]?.id))
  const isStagePlaying = isPlaying && !!playingId
```

- [ ] **Step 6: 스테이지 재생/이전/다음 버튼 연결**

기존:
```tsx
<Button variant="ghost" size="icon"><Icon name="skipBack" size={14} /></Button>
<button type="button" className="s2-play-btn"><Icon name="play" size={14} /></button>
<Button variant="ghost" size="icon"><Icon name="skipForward" size={14} /></Button>
```

변경:
```tsx
<Button variant="ghost" size="icon" onClick={onSkipPrev}>
  <Icon name="skipBack" size={14} />
</Button>
<button
  type="button"
  className="s2-play-btn"
  onClick={() => isStagePlaying ? onPause() : onPlay(playingTrack?.id ?? tracks[0]?.id ?? '')}
>
  <Icon name={isStagePlaying ? 'pause' : 'play'} size={14} />
</button>
<Button variant="ghost" size="icon" onClick={onSkipNext}>
  <Icon name="skipForward" size={14} />
</Button>
```

타임라인 클립 onClick도 수정:

기존: `onClick={() => setPlayingId(t.id)}`  
변경: `onClick={() => onPlay(t.id)}`

- [ ] **Step 7: 테스트 PASS 확인**

```bash
npx vitest run src/components/steps/Step2/Step2.test.tsx
```

Expected: 6개 PASS

- [ ] **Step 8: 커밋**

```bash
git add src/components/steps/Step2/Step2.tsx src/components/steps/Step2/Step2.test.tsx
git commit -m "feat: Step2 스테이지 재생 컨트롤 연결 (onPlay·onPause·skip)"
```

---

## Task 8: Step3 — 동적 요약 + 저장 버튼

**Files:**
- Modify: `src/components/steps/Step3/Step3.tsx`
- Modify: `src/components/steps/Step3/Step3.test.tsx`

- [ ] **Step 1: 테스트 base 갱신 + 실패하는 테스트 추가**

`Step3.test.tsx`의 `base`를 다음으로 교체:

```typescript
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
  loops: 2 as const,
  quality: '128k' as const,
  onBack: vi.fn(),
}
```

그리고 다음 테스트 추가:

```typescript
it('loops props가 요약에 반영된다', () => {
  render(<Step3 {...base} loops={2} />)
  expect(screen.getByText('반복 2회')).toBeInTheDocument()
})

it('quality props가 오디오 요약에 반영된다', () => {
  render(<Step3 {...base} quality="128k" />)
  expect(screen.getByText(/128k · AAC/)).toBeInTheDocument()
})
```

- [ ] **Step 2: 테스트 실행 — FAIL 확인**

```bash
npx vitest run src/components/steps/Step3/Step3.test.tsx
```

Expected: 기존 5개 PASS + 새 2개 FAIL

- [ ] **Step 3: Step3Props 인터페이스 수정**

`Step3.tsx`의 `interface Step3Props`에 추가:

```typescript
  loops: 1 | 2 | 3
  quality: '96k' | '128k' | '192k'
```

- [ ] **Step 4: 함수 시그니처 및 하드코딩 제거**

함수 선언:

```typescript
export default function Step3({
  tracks, theme, effects, visualizer,
  exportSettings, setExportSettings,
  loops, quality,
  onBack,
}: Step3Props) {
```

하드코딩된 "반복 1회" 찾아서 교체:

기존 (Step3.tsx 약 91번째 줄):
```tsx
<div className="s3-stat__sub">반복 1회</div>
```
변경:
```tsx
<div className="s3-stat__sub">반복 {loops}회</div>
```

하드코딩된 오디오 요약 찾아서 교체:

기존:
```tsx
<div className="s3-form-row__value">192 kbps · AAC · 자동 레벨 {effects.ducking ? '−14 LUFS' : '꺼짐'}</div>
```
변경:
```tsx
<div className="s3-form-row__value">{quality} · AAC · 자동 레벨 {effects.ducking ? '−14 LUFS' : '꺼짐'}</div>
```

- [ ] **Step 5: "프로젝트로 저장" 버튼 비활성화**

기존:
```tsx
<button type="button" className="s3-btn-full" style={{ marginTop: 8 }}>
  <Icon name="folder" size={14} /> 프로젝트로 저장
</button>
```
변경:
```tsx
<button
  type="button"
  className="s3-btn-full"
  style={{ marginTop: 8, opacity: 0.45, cursor: 'not-allowed' }}
  disabled
  title="준비 중"
>
  <Icon name="folder" size={14} /> 프로젝트로 저장
</button>
```

- [ ] **Step 6: 테스트 PASS 확인**

```bash
npx vitest run src/components/steps/Step3/Step3.test.tsx
```

Expected: 7개 PASS

- [ ] **Step 7: 전체 테스트 최종 확인**

```bash
npx vitest run
```

Expected: 전체 PASS (기존 45개 + 새 테스트 포함)

- [ ] **Step 8: 커밋**

```bash
git add src/components/steps/Step3/Step3.tsx src/components/steps/Step3/Step3.test.tsx
git commit -m "feat: Step3 loops·quality 동적 요약 반영 및 저장 버튼 비활성화"
```
