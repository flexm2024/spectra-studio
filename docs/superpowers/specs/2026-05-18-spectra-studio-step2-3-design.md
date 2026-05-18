# Spectra Studio — Step 2 & Step 3 설계 문서

## 개요

Step 1(미디어 준비)에 이어 Step 2(비주얼 편집)와 Step 3(영상 출력) 화면을 구현한다. 기존 React+Vite+TS+Vanilla CSS 스택을 그대로 유지하며, Subagent-Driven Development 방식으로 Task 단위 구현한다.

---

## 아키텍처 결정

### 상태 관리

Step 2에서 설정한 값이 Step 3 요약에 표시돼야 하므로, 모든 Step 2 설정을 App.tsx로 끌어올린다.

**App.tsx에 추가되는 상태:**

```typescript
theme: string                          // 기본값: 'midnight'
effects: {
  vis: boolean       // 오디오 비주얼라이저 (기본: true)
  crossfade: boolean // 크로스페이드 (기본: false)
  ducking: boolean   // 자동 레벨 (기본: true)
  blur: boolean      // 배경 블러 (기본: true)
}
visualizer: {
  type: 'bars' | 'wave' | 'orb'  // 기본: 'bars'
  intensity: number               // 0~100, 기본: 70
  opacity: number                 // 0~100, 기본: 85
}
typography: {
  titleSize: number      // 20~80, 기본: 48
  letterSpacing: number  // -50~50, 기본: -15
}
exportSettings: {
  filename: string                       // 기본: 'my-playlist'
  format: 'mp4' | 'webm' | 'mov'        // 기본: 'mp4'
  resolution: '720p' | '1080p' | '4k'  // 기본: '1080p'
  thumbnail: boolean                     // 기본: true
  chapters: boolean                      // 기본: false
}
```

Step 2는 모든 setter를 props로 받는다. Step 3는 `theme`, `effects`, `visualizer`, `typography`를 읽기 전용으로 요약에 표시하고, `exportSettings` / `setExportSettings`만 편집한다.

---

## Task 11: App.tsx 상태 확장

**파일:** `src/App.tsx` 수정

- 위의 5개 상태 추가 (theme, effects, visualizer, typography, exportSettings)
- Step2, Step3 컴포넌트 import 및 라우팅 연결
  - `step === 2` → `<Step2 .../>`
  - `step === 3` → `<Step3 .../>`
- Step1의 `onNext={() => setStep(2)}` 유지
- Step2: `onBack={() => setStep(1)}`, `onNext={() => setStep(3)}`
- Step3: `onBack={() => setStep(2)}`

**테스트 없음** — App.tsx는 조합 레이어이므로 단위 테스트 생략. Step2/Step3 개별 테스트로 검증.

---

## Task 12: Step 2 — 비주얼 편집

**파일:**
- `src/components/steps/Step2/Step2.tsx`
- `src/components/steps/Step2/Step2.css`
- `src/components/steps/Step2/Step2.test.tsx`

### 레이아웃

3컬럼 그리드: `240px 1fr 260px`, 높이 100% (overflow-y: auto per column)

### 좌측 패널 — 테마 & 비주얼 (`.s2-panel`)

**테마 프리셋 그리드 (`.theme-grid`, 2컬럼)**

| id | label | 배경 |
|----|-------|------|
| midnight | Midnight | `linear-gradient(135deg, #0c1a2e, #050813)` |
| cyanwave | Cyan Wave | `linear-gradient(135deg, #042f3f, #0a647a)` |
| sunset | Sunset | `linear-gradient(135deg, #2a0f2e, #6d2c4a)` |
| forest | Forest | `linear-gradient(135deg, #0c1e16, #1f3d2c)` |
| cream | Cream | `linear-gradient(135deg, #f3ead8, #d9c7a3)` |
| mono | Mono | `linear-gradient(135deg, #0a0a0a, #2a2a2a)` |

- 클릭 시 `setTheme(id)` 호출, 선택된 카드에 `.theme-card--active`
- 각 카드 하단에 `label` 텍스트

**비주얼라이저 설정**
- SegmentedControl: `bars / wave / orb` → `setVisualizer(v => ({...v, type}))`
- range 슬라이더 — 강도 (0~100, 기본 70): `setVisualizer(v => ({...v, intensity: n}))`
- range 슬라이더 — 불투명도 (0~100, 기본 85): `setVisualizer(v => ({...v, opacity: n}))`
- 슬라이더 우측에 현재 값 표시 (`.slider-row__value`)

### 중앙 스테이지 (`.s2-stage`)

**컨트롤 바 (`.s2-stage__top`)**
- 이전/재생/다음 버튼 (Button variant="ghost" / icon 스타일)
- 타임코드 표시 (하드코딩: `00:48 / 38:11`)
- 레전드: `1920×1080 · 30fps · H.264`

**뷰포트 (`.s2-stage__viewport` → `.s2-stage__frame`)**
- 16:9 비율, `background: themeObj.bg` (실시간 반영)
- 콘텐츠 오버레이: 로고 아이콘, 트랙 제목, `아티스트 · Track NN / 15`
- 파형 시각화 (`waveformFor`)
- 좌상단: `SPECTRA · LIVE` 레이블
- 우상단: `NN / 15` 트랙 번호
- 선택된 `playingTrack`이 없으면 tracks[0]로 fallback

**타임라인 (`.s2-timeline`)**
- 헤더: `타임라인 · 총길이`, `스냅 1초 · 줌 50%`
- 클립 행: `tracks.slice(0, 8)` 렌더링
- 각 클립 너비: `Math.max(48, durationSec * 1.5)px`
- 클릭 시 해당 트랙을 `playingId`로 설정 → 뷰포트에 반영
- 활성 클립: `background: linear-gradient(...)`, 나머지 `opacity: 0.6`

### 우측 패널 — 효과 & 타이포그래피 (`.s2-panel`)

**효과 4개 (`.effect-chip` 리스트)**

| key | 아이콘 | 제목 | 설명 |
|-----|--------|------|------|
| vis | waveform | 오디오 비주얼라이저 | 파형이 음원에 반응 |
| crossfade | repeat | 크로스페이드 | 트랙 간 2초 페이드 |
| ducking | sliders | 자동 레벨 | 트랙별 −14 LUFS 정규화 |
| blur | sparkles | 배경 블러 | 깊이감 부여 · 24px |

- Switch 토글 + chip 전체 클릭 모두 동작
- `.effect-chip--on`: 활성 상태 시각 강조

**타이포그래피 슬라이더**
- 제목 크기 (20~80, 기본 48)
- 자간 (-50~50, 기본 -15)

**하단 네비게이션**
- "이전" 버튼 → `onBack()`
- "다음" 버튼 → `onNext()`

### 로컬 상태

- `playingId: string` — 현재 뷰포트에 표시되는 트랙 ID (초기값: `tracks[0]?.id`). 타임라인 클릭으로 변경.
- `THEMES` 배열 — Step2 컴포넌트 파일 내 상수로 정의

### Props

```typescript
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
```

### 테스트 (5개)

1. `"비주얼 편집"` 제목 렌더링
2. 테마 카드 6개 표시
3. 테마 카드 클릭 시 `setTheme` 호출
4. 효과 칩 클릭 시 `setEffects` 호출
5. "다음" 버튼 클릭 시 `onNext` 호출

---

## Task 13: Step 3 — 영상 출력

**파일:**
- `src/components/steps/Step3/Step3.tsx`
- `src/components/steps/Step3/Step3.css`
- `src/components/steps/Step3/Step3.test.tsx`

### 레이아웃

2컬럼 그리드: `1fr 360px`, 헤더 행 포함 (Step1과 동일한 page-head 패턴)

### 좌측

**요약 통계 (`.s3-summary`, 4개 카드)**

| 라벨 | 값 | 서브 |
|------|-----|------|
| 트랙 | `tracks.length` | `{n} / 50` |
| 길이 | `totalDur` 계산 | `반복 1회` |
| 해상도 | `resolution.toUpperCase()` | 해상도별 픽셀 (`1920 × 1080` 등) |
| 예상 크기 | `sizeMb MB` | `≈ N MB/min` |

크기 계산: `totalSec = tracks.reduce((acc, t) => acc + t.durationSec, 0)` 후 `Math.round(totalSec * (resolution === '4k' ? 1.5 : resolution === '1080p' ? 0.42 : 0.22))`

**최종 프리뷰 (`.s3-final`)**
- Step 2에서 선택한 `theme`의 배경 그라디언트 적용
- 로고, 제목(하드코딩: `가을 산책 플레이리스트`), 메타 정보, 파형 시각화

**설정 요약 카드**
- 테마: `{themeLabel} · 비주얼라이저 {visualizer.type} · 배경 블러 {effects.blur ? '24px' : '꺼짐'}`
- 오디오: `{exportSettings.format 기반 kbps} · AAC · 자동 레벨 {effects.ducking ? '−14 LUFS' : '꺼짐'}`
- 크로스페이드: `{effects.crossfade ? '켜짐' : '꺼짐'}`
- 로고/워터마크: `Spectra 로고 · 우상단 · 60% 불투명도` (하드코딩)
- "편집으로 돌아가기" 버튼 → `onBack()`

### 우측 — 내보내기 패널 (`.s3-export`)

- **파일명 input** (`.input` 클래스): `value={exportSettings.filename}`, onChange로 업데이트
- **포맷 SegmentedControl**: `mp4 / webm / mov`
- **해상도 SegmentedControl**: `720p / 1080p / 4k`
- **Switch 2개**: 썸네일 자동 생성, 챕터 마커 포함
- **예상 정보**: 렌더링 시간 (하드코딩: `≈ 2분 18초`), 파일 크기 (`sizeMb MB`)

**렌더링 진행 UI**

상태: `idle | rendering | done`

- `idle`: "렌더링 시작" 버튼 표시
- `rendering`: 프로그레스 바 0→100% 애니메이션 (3초), 퍼센트 텍스트
- `done`: "✓ 렌더링 완료" 메시지 + "다시 내보내기" 버튼

진행 구현: `setInterval` 100ms마다 +3, 100% 도달 시 `done`으로 전환.

### Props

```typescript
interface Step3Props {
  tracks: Track[]
  theme: string
  effects: Effects
  visualizer: Visualizer
  typography: Typography
  exportSettings: ExportSettings
  setExportSettings: (s: ExportSettings) => void
  onBack: () => void
}
```

### 테스트 (5개)

1. `"영상 출력"` 제목 렌더링
2. 트랙 수 통계 표시 (`tracks.length`)
3. 총 길이 계산 표시 (`분:초` 형식)
4. "렌더링 시작" 클릭 시 렌더링 상태로 전환 (버튼 사라짐 또는 진행 UI 표시)
5. "편집으로 돌아가기" 클릭 시 `onBack` 호출

---

## 공유 타입 추가 (src/types.ts)

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

---

## CSS 추가 패턴

Step1.css의 `.card`, `.page-head`, `.form-section`, `.progress-track` 등을 재사용한다. Step2/Step3 전용 클래스만 각 CSS 파일에 추가.

**Step2 전용:** `.step2`, `.s2-panel`, `.s2-stage`, `.s2-stage__viewport`, `.s2-stage__frame`, `.s2-timeline`, `.s2-clip`, `.theme-grid`, `.theme-card`, `.effect-chip`, `.slider-row`

**Step3 전용:** `.step3`, `.s3-summary`, `.s3-stat`, `.s3-final`, `.s3-export`, `.s3-form-row`, `.render-progress`

---

## 구현 순서

Task 11 → Task 12 → Task 13 (순차, 각 Task 후 스펙/품질 리뷰)

**Task 11 완료 조건:** App.tsx 타입 체크 통과, 기존 35 테스트 유지
**Task 12 완료 조건:** 5 테스트 통과 (누적 40+)
**Task 13 완료 조건:** 5 테스트 통과 (누적 45+)
