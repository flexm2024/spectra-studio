# Spectra Studio — 기능 구현 설계 스펙

**날짜:** 2026-05-19  
**범위:** UI는 완성된 상태에서 미구현 기능 연결  
**방식:** App.tsx 중심 단일 오디오 엘리먼트 관리 (방식 A)

---

## 1. 배경 및 목표

3단계 워크플로우 UI(Step1~3)는 완성되어 있으나 다음 기능이 미구현 상태:

- 오디오 파일 업로드 (드래그/클릭)
- 실제 오디오 재생 (play/pause/skip)
- 정렬 드롭다운
- 누락된 버튼 핸들러 (`트랙 추가`, `초기화`, Step2 재생 컨트롤)
- Step3 요약의 하드코딩된 값 (`loops`, `quality`)
- `playingId`, `loops`, `quality` 상태가 Step1 로컬에 고립되어 있어 타 Step과 공유 안 됨

---

## 2. 상태 변경 (App.tsx)

### 추가할 상태

| 상태 | 타입 | 초기값 | 이유 |
|------|------|--------|------|
| `playingId` | `string \| null` | `null` | Step1/Step2 공유. 현재 각자 로컬 중복 |
| `loops` | `1 \| 2 \| 3` | `1` | Step1 로컬 → Step3 요약에 반영 필요 |
| `quality` | `'96k' \| '128k' \| '192k'` | `'192k'` | Step1 로컬 → Step3 요약에 반영 필요 |
| `audioRef` | `RefObject<HTMLAudioElement>` | — | 앱 전체 단일 오디오 엘리먼트 |

### App.tsx에 추가할 오디오 콜백

```ts
onPlay(id: string)   // playingId 설정 + audioUrl 있으면 실제 재생
onPause()            // audioRef.current.pause()
onSkipNext()         // 다음 트랙으로 이동
onSkipPrev()         // 이전 트랙 (현재 재생 2초 초과면 처음으로)
handleTrackEnded()   // onEnded 이벤트 → onSkipNext() 자동 호출
```

### 숨겨진 audio 엘리먼트

```tsx
<audio ref={audioRef} onEnded={handleTrackEnded} />
```

App.tsx 루트 div 안에 추가. 화면에 표시되지 않음.

---

## 3. Track 타입 확장

`src/types.ts`의 `Track` 인터페이스에 필드 추가:

```ts
audioUrl?: string  // 업로드 파일의 Object URL. 샘플 트랙은 undefined.
```

---

## 4. 파일 업로드

### 컴포넌트 구조

Step1에 숨겨진 file input 추가:

```tsx
<input
  ref={fileInputRef}
  type="file"
  multiple
  accept="audio/*"
  style={{ display: 'none' }}
  onChange={handleFileSelect}
/>
```

### 드롭존 핸들러

```tsx
onDragOver={e => e.preventDefault()}
onDrop={e => { e.preventDefault(); handleFiles(e.dataTransfer.files) }}
onClick={() => fileInputRef.current?.click()}
```

### 파일 → Track 변환 (`handleFiles`)

1. `URL.createObjectURL(file)` → `audioUrl`
2. 임시 `<audio>` 엘리먼트에 src 설정 → `loadedmetadata` 이벤트에서 `duration` 추출
3. 파일명 파싱: `"my song.mp3"` → title: `"my song"`
4. 기본값: `artist: "Unknown"`, `bpm: 0`, `tag: "기타"`
5. 파형: 기존 `waveformFor()` 함수 재사용 (인덱스 기반)
6. 중복 방지: 이미 같은 `title`이 있으면 스킵
7. 완성된 Track 객체를 `setTracks([...tracks, newTrack])` 로 추가

### "트랙 추가" 버튼

```tsx
<Button onClick={() => fileInputRef.current?.click()}>트랙 추가</Button>
```

---

## 5. 오디오 재생

### onPlay(id)

```ts
const onPlay = (id: string) => {
  setPlayingId(id)
  const track = tracks.find(t => t.id === id)
  if (track?.audioUrl) {
    audioRef.current.src = track.audioUrl
    audioRef.current.play()
  }
}
```

샘플 트랙(`audioUrl` 없음) → `playingId`만 변경, 실제 오디오 없음.

### onPause()

```ts
const onPause = () => audioRef.current?.pause()
```

### onSkipNext() / onSkipPrev()

```ts
const onSkipNext = () => {
  const idx = tracks.findIndex(t => t.id === playingId)
  const next = tracks[idx + 1]
  if (next) onPlay(next.id)
}

const onSkipPrev = () => {
  const el = audioRef.current
  if (el && el.currentTime > 2) {
    el.currentTime = 0
    return
  }
  const idx = tracks.findIndex(t => t.id === playingId)
  const prev = tracks[idx - 1]
  if (prev) onPlay(prev.id)
}
```

### 재생 아이콘 판단

- `playingId === t.id` → pause 아이콘 표시
- 실제 오디오 재생 여부(`!audioRef.current.paused`)는 프리뷰 컨트롤에서만 구분

---

## 6. 정렬 드롭다운 (Step1)

### 로컬 상태

```ts
const [sortOpen, setSortOpen] = useState(false)
```

### 드롭다운 옵션

| 옵션 | 정렬 기준 |
|------|----------|
| 제목 A → Z | `title.localeCompare()` 오름차순 |
| 제목 Z → A | `title.localeCompare()` 내림차순 |
| BPM 낮은 순 | `bpm` 오름차순 |
| BPM 높은 순 | `bpm` 내림차순 |

선택 즉시 `setTracks(sorted)` 후 드롭다운 닫힘.

바깥 클릭 시 닫기: `useEffect` + `document.addEventListener('mousedown', ...)`.

정렬 버튼 주변에 `position: relative` 래퍼 → 드롭다운은 `position: absolute`.

---

## 7. 나머지 버튼 핸들러

| 버튼 | 위치 | 동작 |
|------|------|------|
| 트랙 추가 | Step1 하단 | `fileInputRef.current?.click()` |
| 초기화 | Step1 인코딩 섹션 | `loops → 1`, `quality → '192k'` |
| 재생/일시정지 | Step1 프리뷰, Step2 스테이지 | `onPlay` / `onPause` 연결 |
| 이전/다음 | Step1 프리뷰, Step2 스테이지 | `onSkipPrev` / `onSkipNext` 연결 |
| 프로젝트로 저장 | Step3 | 비활성화 + `title="준비 중"` tooltip |

---

## 8. Step3 동적 요약

Step3에 `loops`, `quality` props 추가:

| 현재 (하드코딩) | 변경 후 |
|----------------|---------|
| `"반복 1회"` | `` `반복 ${loops}회` `` |
| `"192 kbps · AAC"` | `` `${quality} · AAC` `` |

---

## 9. Props 변경 요약

### Step1Props 추가

```ts
playingId: string | null
setPlayingId: (id: string | null) => void
loops: 1 | 2 | 3
setLoops: (l: 1 | 2 | 3) => void
quality: '96k' | '128k' | '192k'
setQuality: (q: '96k' | '128k' | '192k') => void
onPlay: (id: string) => void
onPause: () => void
onSkipNext: () => void
onSkipPrev: () => void
```

### Step2Props 추가

```ts
playingId: string | null
onPlay: (id: string) => void
onPause: () => void
onSkipNext: () => void
onSkipPrev: () => void
```

### Step3Props 추가

```ts
loops: 1 | 2 | 3
quality: '96k' | '128k' | '192k'
```

---

## 10. 범위 밖 (이번 구현에서 제외)

- 배경/로고/스티커 실제 파일 업로드
- ID3 태그 파싱 (artist, BPM, genre 자동 추출)
- 프로젝트 저장/불러오기 (백엔드 미존재)
- 실제 영상 렌더링
