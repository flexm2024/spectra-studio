# Step3 영상 출력 기능 설계

**날짜:** 2026-05-21  
**범위:** Step3 실제 MP4 렌더링 및 다운로드

---

## 목표

브라우저에서 WebCodecs + mp4-muxer를 사용해 H.264 MP4 영상을 실제로 생성하고 다운로드할 수 있게 한다. 유튜브 업로드 가능한 품질의 파일을 출력한다.

---

## 렌더링 파이프라인

```
1. 오디오 로드 → OfflineAudioContext 믹싱 (concat + crossfade + loops)
2. 프레임별 FFT 주파수 데이터 추출 (30fps 기준 suspend/resume)
3. OffscreenCanvas 프레임 렌더링 (배경, 비주얼라이저, 트랙 제목, 로고, 스티커)
4. VideoEncoder → H.264 encoded chunks
5. AudioEncoder → AAC encoded chunks  
6. mp4-muxer → .mp4 파일 조립
7. 다운로드 트리거 (URL.createObjectURL + <a> click)
```

---

## 모듈 구조

### `src/lib/renderer/audioProcessor.ts`

**역할:** 트랙 오디오를 OfflineAudioContext로 concat/loop 믹싱하고, 30fps 기준 프레임별 주파수 데이터를 추출한다.

**입력:**
```ts
interface AudioProcessorInput {
  tracks: Track[]          // audioUrl이 있는 트랙만 사용, 없으면 무음
  loops: 1 | 2 | 3
  crossfade: boolean       // crossfade 효과 on/off
  sampleRate: number       // 기본 48000
}
```

**출력:**
```ts
interface AudioProcessorOutput {
  audioBuffer: AudioBuffer           // 최종 믹스된 PCM 데이터
  trackBoundaries: number[]          // 각 트랙 시작 시각 (초 단위)
  frameCount: number
  durationSec: number
}
```

**처리 흐름:**
1. 각 트랙의 `audioUrl`을 fetch → `decodeAudioData`
2. `audioUrl`이 없는 트랙은 해당 `durationSec` 길이의 무음 버퍼로 대체
3. crossfade가 true면 트랙 경계에서 1초 fade-out/fade-in 적용
4. loops 횟수만큼 반복 concat
5. OfflineAudioContext로 `startRendering()` → 최종 AudioBuffer 반환
6. 주파수 데이터는 프레임별로 그때그때 AudioBuffer PCM에서 직접 FFT 계산 (전체 저장 안 함, 메모리 절약)

### `src/lib/renderer/frameRenderer.ts`

**역할:** 주어진 프레임 인덱스와 주파수 데이터로 OffscreenCanvas에 한 프레임을 그린다.

**입력:**
```ts
interface FrameInput {
  canvas: OffscreenCanvas
  width: number
  height: number
  frequencyData: Float32Array   // audioBuffer PCM에서 해당 프레임 구간 FFT 계산 결과
  theme: string
  background: Background
  logo?: string
  watermark?: string
  stickers: string[]
  effects: Effects
  visualizer: Visualizer
  typography: Typography
  currentTrack: Track           // 현재 재생 중인 트랙 (제목 표시용)
  currentTrackIndex: number
  totalTracks: number
}
```

**그리기 순서 (z-index 낮은 것부터):**
1. 배경 (gradient 또는 image)
2. blur overlay (effects.blur가 true인 경우)
3. 비주얼라이저 (bars / wave / orb) — frequencyData 기반
4. 타이포그래피 (트랙 제목, 아티스트, 인덱스)
5. 로고 (logo 이미지, 좌상단)
6. 워터마크 (watermark 이미지, 우하단, 60% 불투명도)
7. 스티커 (stickers 배열, 우상단부터 배치)

**해상도별 캔버스 크기:**
- 720p: 1280×720
- 1080p: 1920×1080
- 4k: 3840×2160

### `src/lib/renderer/videoEncoder.ts`

**역할:** VideoEncoder + AudioEncoder + mp4-muxer를 조합해 MP4 파일을 생성한다.

**입력:**
```ts
interface EncoderInput {
  frames: VideoFrame[]           // 또는 콜백 방식으로 순차 처리
  audioBuffer: AudioBuffer
  fps: number                    // 30
  width: number
  height: number
  onProgress: (pct: number) => void
}
```

**처리:**
1. `mp4-muxer` Muxer 초기화 (mp4, fastStart 옵션)
2. `VideoEncoder` 설정: codec `'avc1.42001f'` (H.264 Baseline), bitrate 해상도별 자동 계산
   - 720p: 4Mbps, 1080p: 8Mbps, 4k: 25Mbps
3. `AudioEncoder` 설정: codec `'mp4a.40.2'` (AAC-LC), bitrate 192kbps
4. 프레임마다 `VideoEncoder.encode()` → `onProgress` 업데이트
5. `AudioEncoder.encode()` → AudioData 청크로 변환
6. `flush()` → Muxer 완료 → `Uint8Array` 반환

### `src/lib/renderer/index.ts`

**역할:** 세 모듈을 조합하는 최상위 `renderVideo()` 함수.

```ts
export async function renderVideo(
  input: RenderInput,
  onProgress: (pct: number) => void
): Promise<Blob>
```

진행률 단계:
- 0–10%: 오디오 로드 및 디코딩
- 10–40%: OfflineAudioContext 렌더링 + 주파수 추출
- 40–90%: Canvas 프레임 렌더링 + VideoEncoder
- 90–100%: AudioEncoder + Mux + 완료

---

## Step3 변경 사항

### Props 추가

현재 Step3에 없는 props를 추가한다:

```ts
interface Step3Props {
  // 기존
  tracks: Track[]
  theme: string
  effects: Effects
  visualizer: Visualizer
  exportSettings: ExportSettings
  setExportSettings: (s: ExportSettings) => void
  loops: 1 | 2 | 3
  quality: '96k' | '128k' | '192k'
  onBack: () => void
  // 추가
  background: Background
  logo?: string
  watermark?: string
  stickers: string[]
  typography: Typography
}
```

### App.tsx 변경

Step3에 `background`, `logo`, `watermark`, `stickers`, `typography` props 추가 전달.

### startRender 변경

```ts
const startRender = async () => {
  setRenderState('rendering')
  setProgress(0)
  const blob = await renderVideo({
    tracks, theme, effects, visualizer, typography,
    background, logo, watermark, stickers,
    exportSettings, loops,
  }, pct => setProgress(pct))
  // 다운로드 트리거
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${exportSettings.filename}.${exportSettings.format}`
  a.click()
  URL.revokeObjectURL(url)
  setRenderState('done')
}
```

---

## 외부 의존성

| 라이브러리 | 용도 | 크기 |
|-----------|------|------|
| `mp4-muxer` | MP4 컨테이너 muxing | ~50KB |

WebCodecs (`VideoEncoder`, `AudioEncoder`) 는 브라우저 기본 API. 별도 설치 불필요.

**지원 환경:** Chrome 94+, Edge 94+ (Firefox 미지원)

---

## 테스트 전략

실제 인코딩은 브라우저 환경에서만 동작하므로 단위 테스트 범위를 제한한다.

- `audioProcessor.ts`: 무음 트랙 대체 로직, concat 길이 계산, crossfade 적용 여부 — vitest에서 Web Audio API mock
- `frameRenderer.ts`: 캔버스 그리기 순서, 트랙 제목 변경 로직 — OffscreenCanvas mock
- `Step3.tsx`: 새 props 렌더링, 렌더링 버튼 클릭 시 renderVideo 호출 여부 — vi.mock으로 renderer 대체
- 실제 MP4 출력 검증은 브라우저 수동 테스트로 확인

---

## 제외 범위

- 썸네일 자동 생성 (ExportSettings.thumbnail) — 현재 UI에만 존재, 실제 기능 제외
- 챕터 마커 (ExportSettings.chapters) — MP4 메타데이터 삽입 복잡, 제외
- Firefox 지원 — WebCodecs 미지원으로 제외
- 렌더링 취소 버튼 — 1차 구현에서 제외
