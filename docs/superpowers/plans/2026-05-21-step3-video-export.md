# Step3 영상 출력 기능 구현 플랜

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** WebCodecs + mp4-muxer를 사용해 Step3에서 실제 H.264 MP4 파일을 생성하고 다운로드할 수 있게 한다.

**Architecture:** OfflineAudioContext로 오디오를 믹싱하고, PCM 데이터 기반 FFT로 프레임별 주파수를 추출해 OffscreenCanvas에 그린 뒤, VideoEncoder + AudioEncoder로 인코딩하고 mp4-muxer로 MP4를 조립한다.

**Tech Stack:** WebCodecs API (VideoEncoder, AudioEncoder, VideoFrame, AudioData), mp4-muxer, OfflineAudioContext, OffscreenCanvas, Vitest + vi.mock

---

## 파일 구조

| 파일 | 역할 |
|------|------|
| `src/lib/renderer/fft.ts` (신규) | PCM → 주파수 밴드 FFT 유틸 |
| `src/lib/renderer/fft.test.ts` (신규) | FFT 유닛 테스트 |
| `src/lib/renderer/audioProcessor.ts` (신규) | OfflineAudioContext 오디오 믹싱 + 순수함수 경계 계산 |
| `src/lib/renderer/audioProcessor.test.ts` (신규) | 순수함수 유닛 테스트 + Web Audio mock 테스트 |
| `src/lib/renderer/frameRenderer.ts` (신규) | OffscreenCanvas 프레임 그리기 + ImageBitmap 로딩 |
| `src/lib/renderer/frameRenderer.test.ts` (신규) | Canvas mock 테스트 |
| `src/lib/renderer/videoEncoder.ts` (신규) | VideoEncoder + AudioEncoder + mp4-muxer 조립 |
| `src/lib/renderer/index.ts` (신규) | `renderVideo()` 진입점 |
| `src/lib/renderer/index.test.ts` (신규) | renderVideo mock 오케스트레이션 테스트 |
| `src/components/steps/Step3/Step3.tsx` (수정) | props 추가 + startRender 실제 연결 |
| `src/components/steps/Step3/Step3.test.tsx` (수정) | 새 props + renderVideo mock 테스트 추가 |
| `src/App.tsx` (수정) | Step3에 background/logo/watermark/stickers/typography 전달 |

---

## Task 1: mp4-muxer 패키지 설치

**Files:**
- Modify: `package.json` (npm install이 자동 처리)

- [ ] **Step 1: mp4-muxer 설치**

```
npm install mp4-muxer
```

Expected: `package.json` dependencies에 `"mp4-muxer"` 추가됨.

- [ ] **Step 2: 설치 확인**

```
npm ls mp4-muxer
```

Expected: 버전 출력 (5.x)

- [ ] **Step 3: Commit**

```
git add package.json package-lock.json
git commit -m "chore: mp4-muxer 설치"
```

---

## Task 2: `src/lib/renderer/fft.ts` — PCM → 주파수 밴드

**Files:**
- Create: `src/lib/renderer/fft.ts`
- Create: `src/lib/renderer/fft.test.ts`

- [ ] **Step 1: 실패 테스트 작성**

`src/lib/renderer/fft.test.ts`:

```ts
// FFT 유틸리티 테스트
import { describe, it, expect } from 'vitest'
import { computeFrequencyBands } from './fft'

describe('computeFrequencyBands', () => {
  it('numBands 길이의 Float32Array를 반환한다', () => {
    const signal = new Float32Array(2048)
    const result = computeFrequencyBands(signal, 0, 2048, 16)
    expect(result).toHaveLength(16)
    expect(result).toBeInstanceOf(Float32Array)
  })

  it('무음 신호는 모든 밴드가 0에 가깝다', () => {
    const silence = new Float32Array(2048)
    const bands = computeFrequencyBands(silence, 0, 2048, 16)
    bands.forEach(b => expect(b).toBeCloseTo(0, 5))
  })

  it('정현파는 해당 주파수 구간 밴드에서 에너지가 가장 높다', () => {
    // 440Hz 정현파 — fftSize=2048, sampleRate=48000 기준 bin ~19 → log 밴드 6-7 근방
    const fftSize = 2048
    const signal = new Float32Array(fftSize)
    for (let i = 0; i < fftSize; i++) {
      signal[i] = Math.sin(2 * Math.PI * 440 * i / 48000)
    }
    const bands = computeFrequencyBands(signal, 0, fftSize, 16)
    let maxBand = 0
    for (let i = 1; i < bands.length; i++) {
      if (bands[i] > bands[maxBand]) maxBand = i
    }
    expect(maxBand).toBeGreaterThanOrEqual(4)
    expect(maxBand).toBeLessThanOrEqual(9)
  })

  it('범위 밖 sampleOffset도 예외 없이 처리한다', () => {
    const signal = new Float32Array(100)
    expect(() => computeFrequencyBands(signal, 5000, 2048, 16)).not.toThrow()
  })
})
```

- [ ] **Step 2: 테스트 실행 — 실패 확인**

```
npm test -- fft
```

Expected: `Cannot find module './fft'`

- [ ] **Step 3: fft.ts 구현**

`src/lib/renderer/fft.ts`:

```ts
// PCM 데이터에서 주파수 밴드 크기를 추출하는 Cooley-Tukey FFT 유틸리티

function fftInPlace(re: Float64Array, im: Float64Array): void {
  const n = re.length
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1
    for (; j & bit; bit >>= 1) j ^= bit
    j ^= bit
    if (i < j) {
      ;[re[i], re[j]] = [re[j], re[i]]
      ;[im[i], im[j]] = [im[j], im[i]]
    }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = (-2 * Math.PI) / len
    const wRe = Math.cos(ang)
    const wIm = Math.sin(ang)
    for (let i = 0; i < n; i += len) {
      let curRe = 1, curIm = 0
      for (let j = 0; j < len >> 1; j++) {
        const uRe = re[i + j], uIm = im[i + j]
        const vRe = re[i + j + (len >> 1)] * curRe - im[i + j + (len >> 1)] * curIm
        const vIm = re[i + j + (len >> 1)] * curIm + im[i + j + (len >> 1)] * curRe
        re[i + j] = uRe + vRe
        im[i + j] = uIm + vIm
        re[i + j + (len >> 1)] = uRe - vRe
        im[i + j + (len >> 1)] = uIm - vIm
        const tmp = curRe * wRe - curIm * wIm
        curIm = curRe * wIm + curIm * wRe
        curRe = tmp
      }
    }
  }
}

export function computeFrequencyBands(
  pcmData: Float32Array,
  sampleOffset: number,
  fftSize: number,
  numBands: number
): Float32Array {
  const re = new Float64Array(fftSize)
  const im = new Float64Array(fftSize)
  for (let i = 0; i < fftSize; i++) {
    const idx = sampleOffset + i
    const hann = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (fftSize - 1)))
    re[i] = (idx >= 0 && idx < pcmData.length ? pcmData[idx] : 0) * hann
  }
  fftInPlace(re, im)

  const half = fftSize >> 1
  const bands = new Float32Array(numBands)
  for (let b = 0; b < numBands; b++) {
    const lo = Math.max(1, Math.round(Math.pow(half, b / numBands)))
    const hi = Math.max(lo + 1, Math.round(Math.pow(half, (b + 1) / numBands)))
    let sum = 0, count = 0
    for (let j = lo; j < hi && j < half; j++) {
      sum += Math.sqrt(re[j] * re[j] + im[j] * im[j])
      count++
    }
    bands[b] = count > 0 ? (sum / count) / fftSize : 0
  }
  return bands
}
```

- [ ] **Step 4: 테스트 실행 — 통과 확인**

```
npm test -- fft
```

Expected: 4 tests passed

- [ ] **Step 5: Commit**

```
git add src/lib/renderer/fft.ts src/lib/renderer/fft.test.ts
git commit -m "feat: PCM 주파수 밴드 추출 FFT 유틸리티 구현"
```

---

## Task 3: `src/lib/renderer/audioProcessor.ts` — 오디오 믹싱

**Files:**
- Create: `src/lib/renderer/audioProcessor.ts`
- Create: `src/lib/renderer/audioProcessor.test.ts`

- [ ] **Step 1: 실패 테스트 작성**

`src/lib/renderer/audioProcessor.test.ts`:

```ts
// 오디오 믹싱 순수함수 + Web Audio mock 테스트
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { computeTrackBoundaries, processAudio } from './audioProcessor'
import type { Track } from '../../types'

// ─── 순수함수 테스트 ───────────────────────────────────────────────────────────

describe('computeTrackBoundaries', () => {
  it('단일 트랙, 반복 1회, 크로스페이드 없음', () => {
    const r = computeTrackBoundaries([180], 1, false)
    expect(r.boundaries).toEqual([0])
    expect(r.totalDuration).toBeCloseTo(180)
  })

  it('두 트랙, 반복 1회, 크로스페이드 없음', () => {
    const r = computeTrackBoundaries([180, 200], 1, false)
    expect(r.boundaries).toEqual([0, 180])
    expect(r.singlePassDuration).toBeCloseTo(380)
    expect(r.totalDuration).toBeCloseTo(380)
  })

  it('두 트랙, 반복 2회, 크로스페이드 없음 — 총 길이 2배', () => {
    const r = computeTrackBoundaries([180, 200], 2, false)
    expect(r.totalDuration).toBeCloseTo(760)
    expect(r.boundaries).toHaveLength(4) // 2 트랙 × 2 루프
  })

  it('두 트랙, 반복 1회, 크로스페이드 1초 — 경계가 1초 당겨진다', () => {
    const r = computeTrackBoundaries([180, 200], 1, true)
    expect(r.boundaries[0]).toBe(0)
    expect(r.boundaries[1]).toBeCloseTo(179) // 180 - 1
    expect(r.totalDuration).toBeCloseTo(379) // 380 - 1
  })
})

// ─── Web Audio mock 테스트 ────────────────────────────────────────────────────

const SAMPLE_RATE = 48000
const MOCK_DURATION = 3 // seconds
const MOCK_SAMPLES = MOCK_DURATION * SAMPLE_RATE

const makeMockBuffer = (duration = MOCK_DURATION) => ({
  duration,
  length: duration * SAMPLE_RATE,
  sampleRate: SAMPLE_RATE,
  numberOfChannels: 2,
  getChannelData: () => new Float32Array(duration * SAMPLE_RATE),
})

const makeMockCtx = () => ({
  decodeAudioData: vi.fn().mockResolvedValue(makeMockBuffer()),
  createBuffer: vi.fn().mockImplementation((ch: number, len: number, sr: number) => makeMockBuffer(len / sr)),
  createBufferSource: vi.fn().mockReturnValue({
    buffer: null as unknown,
    connect: vi.fn(),
    start: vi.fn(),
  }),
  createGain: vi.fn().mockReturnValue({
    gain: { setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn() },
    connect: vi.fn(),
  }),
  destination: {},
  startRendering: vi.fn().mockResolvedValue(makeMockBuffer(MOCK_DURATION * 2)),
  length: MOCK_SAMPLES * 2,
  sampleRate: SAMPLE_RATE,
})

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(100)),
  }))
  vi.stubGlobal('OfflineAudioContext', vi.fn().mockImplementation(() => makeMockCtx()))
})

const makeTrack = (override: Partial<Track> = {}): Track => ({
  id: 't1', title: 'Test', artist: 'Artist', duration: '3:00',
  durationSec: 180, tag: 'pop', bpm: 120, src: '', waveform: [],
  audioUrl: 'blob:test',
  ...override,
})

describe('processAudio', () => {
  it('audioUrl 없는 트랙은 무음 버퍼로 대체해 정상 완료된다', async () => {
    const result = await processAudio({
      tracks: [makeTrack({ audioUrl: undefined })],
      loops: 1,
      crossfade: false,
    })
    expect(result.audioBuffer).toBeDefined()
    expect(result.trackBoundaries).toHaveLength(1)
    expect(result.frameCount).toBeGreaterThan(0)
  })

  it('processAudio는 trackBoundaries를 반환한다', async () => {
    const result = await processAudio({
      tracks: [makeTrack(), makeTrack({ id: 't2', audioUrl: 'blob:test2' })],
      loops: 1,
      crossfade: false,
    })
    expect(result.trackBoundaries).toHaveLength(2)
    expect(result.trackBoundaries[0]).toBe(0)
  })
})
```

- [ ] **Step 2: 테스트 실행 — 실패 확인**

```
npm test -- audioProcessor
```

Expected: `Cannot find module './audioProcessor'`

- [ ] **Step 3: audioProcessor.ts 구현**

`src/lib/renderer/audioProcessor.ts`:

```ts
// OfflineAudioContext로 트랙 오디오를 concat/loop 믹싱하는 오디오 프로세서

import type { Track } from '../../types'

const FPS = 30
const CROSSFADE_SEC = 1

export interface AudioProcessorInput {
  tracks: Track[]
  loops: 1 | 2 | 3
  crossfade: boolean
  sampleRate?: number
}

export interface AudioProcessorOutput {
  audioBuffer: AudioBuffer
  trackBoundaries: number[]  // 루프 포함 전체 트랙 시작 시각 (초)
  frameCount: number
  durationSec: number
}

export interface BoundaryResult {
  boundaries: number[]        // 루프 전체 포함
  singlePassDuration: number  // 루프 1회 길이
  totalDuration: number
}

export function computeTrackBoundaries(
  durations: number[],
  loops: number,
  crossfade: boolean
): BoundaryResult {
  const overlap = crossfade ? CROSSFADE_SEC : 0
  const perLoopBounds: number[] = []
  let cursor = 0
  for (let i = 0; i < durations.length; i++) {
    perLoopBounds.push(cursor)
    cursor += durations[i] - (i < durations.length - 1 ? overlap : 0)
  }
  const singlePassDuration = cursor
  const boundaries: number[] = []
  for (let loop = 0; loop < loops; loop++) {
    for (const b of perLoopBounds) {
      boundaries.push(loop * singlePassDuration + b)
    }
  }
  return { boundaries, singlePassDuration, totalDuration: singlePassDuration * loops }
}

export async function processAudio(input: AudioProcessorInput): Promise<AudioProcessorOutput> {
  const { tracks, loops, crossfade } = input
  const sampleRate = input.sampleRate ?? 48000

  // Phase 1: 디코딩 전용 임시 컨텍스트 (길이 무관)
  const decodeCtx = new OfflineAudioContext(2, sampleRate, sampleRate)

  const trackBuffers: AudioBuffer[] = await Promise.all(
    tracks.map(async t => {
      if (t.audioUrl) {
        const resp = await fetch(t.audioUrl)
        const arr = await resp.arrayBuffer()
        return decodeCtx.decodeAudioData(arr)
      }
      return decodeCtx.createBuffer(2, Math.ceil(t.durationSec * sampleRate), sampleRate)
    })
  )

  const durations = trackBuffers.map(b => b.duration)
  const { boundaries, singlePassDuration, totalDuration } = computeTrackBoundaries(durations, loops, crossfade)

  // Phase 2: 믹싱 컨텍스트
  const totalSamples = Math.ceil(totalDuration * sampleRate)
  const offline = new OfflineAudioContext(2, totalSamples, sampleRate)

  for (let loop = 0; loop < loops; loop++) {
    trackBuffers.forEach((buf, i) => {
      const src = offline.createBufferSource()
      src.buffer = buf
      const startTime = boundaries[loop * tracks.length + i]  // boundaries는 이미 절대 시각

      if (crossfade) {
        const gain = offline.createGain()
        src.connect(gain)
        gain.connect(offline.destination)
        if (i > 0) {
          gain.gain.setValueAtTime(0, startTime)
          gain.gain.linearRampToValueAtTime(1, startTime + CROSSFADE_SEC)
        }
        const endTime = startTime + buf.duration
        gain.gain.setValueAtTime(1, endTime - CROSSFADE_SEC)
        gain.gain.linearRampToValueAtTime(0, endTime)
      } else {
        src.connect(offline.destination)
      }
      src.start(startTime)
    })
  }

  const audioBuffer = await offline.startRendering()
  return {
    audioBuffer,
    trackBoundaries: boundaries,
    frameCount: Math.ceil(totalDuration * FPS),
    durationSec: totalDuration,
  }
}
```

- [ ] **Step 4: 테스트 실행 — 통과 확인**

```
npm test -- audioProcessor
```

Expected: 6 tests passed

- [ ] **Step 5: Commit**

```
git add src/lib/renderer/audioProcessor.ts src/lib/renderer/audioProcessor.test.ts
git commit -m "feat: OfflineAudioContext 오디오 믹싱 + 트랙 경계 계산 구현"
```

---

## Task 4: `src/lib/renderer/frameRenderer.ts` — Canvas 프레임 렌더링

**Files:**
- Create: `src/lib/renderer/frameRenderer.ts`
- Create: `src/lib/renderer/frameRenderer.test.ts`

- [ ] **Step 1: 실패 테스트 작성**

`src/lib/renderer/frameRenderer.test.ts`:

```ts
// Canvas 프레임 렌더링 테스트
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { drawFrame } from './frameRenderer'
import type { DrawFrameInput } from './frameRenderer'
import type { Track } from '../../types'

const mockCtx = {
  fillRect: vi.fn(),
  fillStyle: '' as unknown,
  drawImage: vi.fn(),
  globalAlpha: 1,
  filter: '',
  font: '',
  textAlign: '' as unknown,
  textBaseline: '' as unknown,
  fillText: vi.fn(),
  save: vi.fn(),
  restore: vi.fn(),
  beginPath: vi.fn(),
  arc: vi.fn(),
  fill: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  stroke: vi.fn(),
  strokeStyle: '' as unknown,
  lineWidth: 0,
  createLinearGradient: vi.fn().mockReturnValue({ addColorStop: vi.fn() }),
  measureText: vi.fn().mockReturnValue({ width: 100 }),
}

const mockCanvas = { getContext: vi.fn().mockReturnValue(mockCtx), width: 1920, height: 1080 }

const track: Track = {
  id: 't1', title: '가을 산책', artist: 'Lo-Fi', duration: '3:00',
  durationSec: 180, tag: 'lofi', bpm: 80, src: '', waveform: [],
}

const base: DrawFrameInput = {
  canvas: mockCanvas as unknown as OffscreenCanvas,
  width: 1920,
  height: 1080,
  frequencyData: new Float32Array(80),
  themeGradient: ['#0c1a2e', '#050813'],
  background: { type: 'gradient' },
  stickerImages: [],
  effects: { vis: true, crossfade: false, ducking: false, blur: false },
  visualizer: { type: 'bars', intensity: 70, opacity: 85 },
  typography: { titleSize: 48, letterSpacing: -15 },
  currentTrack: track,
  currentTrackIndex: 0,
  totalTracks: 5,
}

beforeEach(() => {
  vi.clearAllMocks()
  mockCtx.createLinearGradient.mockReturnValue({ addColorStop: vi.fn() })
})

describe('drawFrame', () => {
  it('배경 그라디언트를 그린다', () => {
    drawFrame(base)
    expect(mockCtx.createLinearGradient).toHaveBeenCalled()
    expect(mockCtx.fillRect).toHaveBeenCalledWith(0, 0, 1920, 1080)
  })

  it('트랙 제목을 Canvas에 그린다', () => {
    drawFrame(base)
    const allText = mockCtx.fillText.mock.calls.map((c: unknown[]) => c[0])
    expect(allText.some((t: unknown) => String(t).includes('가을 산책'))).toBe(true)
  })

  it('effects.blur가 true면 blur filter를 적용한다', () => {
    drawFrame({ ...base, effects: { ...base.effects, blur: true } })
    expect(mockCtx.filter).toContain('blur')
  })

  it('logoImage가 있으면 drawImage를 호출한다', () => {
    const fakeImg = {} as ImageBitmap
    drawFrame({ ...base, logoImage: fakeImg })
    expect(mockCtx.drawImage).toHaveBeenCalledWith(fakeImg, expect.any(Number), expect.any(Number), expect.any(Number), expect.any(Number))
  })
})
```

- [ ] **Step 2: 테스트 실행 — 실패 확인**

```
npm test -- frameRenderer
```

Expected: `Cannot find module './frameRenderer'`

- [ ] **Step 3: frameRenderer.ts 구현**

`src/lib/renderer/frameRenderer.ts`:

```ts
// OffscreenCanvas에 영상 한 프레임을 그리는 렌더러

import type { Background, Effects, Visualizer, Typography, Track } from '../../types'

export interface DrawFrameInput {
  canvas: OffscreenCanvas
  width: number
  height: number
  frequencyData: Float32Array  // 80개 밴드
  themeGradient: [string, string]
  background: Background
  backgroundImage?: ImageBitmap
  logoImage?: ImageBitmap
  watermarkImage?: ImageBitmap
  stickerImages: ImageBitmap[]
  effects: Effects
  visualizer: Visualizer
  typography: Typography
  currentTrack: Track
  currentTrackIndex: number
  totalTracks: number
}

export function drawFrame(input: DrawFrameInput): void {
  const ctx = input.canvas.getContext('2d') as OffscreenCanvasRenderingContext2D
  const { width, height, frequencyData, themeGradient, background, effects, visualizer, typography, currentTrack, currentTrackIndex, totalTracks } = input

  // 1. 배경
  if (input.backgroundImage) {
    ctx.drawImage(input.backgroundImage, 0, 0, width, height)
  } else {
    const grad = ctx.createLinearGradient(0, 0, width, height)
    grad.addColorStop(0, themeGradient[0])
    grad.addColorStop(1, themeGradient[1])
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, width, height)
  }

  // 2. blur overlay
  if (effects.blur) {
    ctx.save()
    ctx.filter = 'blur(24px)'
    ctx.globalAlpha = 0.35
    if (input.backgroundImage) {
      ctx.drawImage(input.backgroundImage, -40, -40, width + 80, height + 80)
    } else {
      const grad = ctx.createLinearGradient(0, 0, width, height)
      grad.addColorStop(0, themeGradient[0])
      grad.addColorStop(1, themeGradient[1])
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, width, height)
    }
    ctx.filter = 'none'
    ctx.globalAlpha = 1
    ctx.restore()
  }

  // 3. 비주얼라이저
  if (effects.vis) {
    drawVisualizer(ctx, width, height, frequencyData, visualizer)
  }

  // 4. 타이포그래피
  const cx = width / 2
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = 'rgba(255,255,255,0.9)'
  const titlePx = Math.round(typography.titleSize * (width / 1920))
  ctx.font = `700 ${titlePx}px "Inter", sans-serif`
  ctx.fillText(currentTrack.title, cx, height * 0.48)

  const subPx = Math.round(18 * (width / 1920))
  ctx.font = `400 ${subPx}px "Inter", sans-serif`
  ctx.fillStyle = 'rgba(255,255,255,0.6)'
  ctx.fillText(
    `${currentTrack.artist} · Track ${String(currentTrackIndex + 1).padStart(2, '0')} / ${totalTracks}`,
    cx,
    height * 0.55,
  )

  // 5. 로고
  if (input.logoImage) {
    const logoSize = Math.round(64 * (width / 1920))
    ctx.globalAlpha = 1
    ctx.drawImage(input.logoImage, 40, 40, logoSize, logoSize)
  }

  // 6. 워터마크
  if (input.watermarkImage) {
    const wSize = Math.round(80 * (width / 1920))
    ctx.globalAlpha = 0.6
    ctx.drawImage(input.watermarkImage, width - wSize - 40, height - wSize - 40, wSize, wSize)
    ctx.globalAlpha = 1
  }

  // 7. 스티커
  input.stickerImages.forEach((img, i) => {
    const sSize = Math.round(70 * (width / 1920))
    ctx.globalAlpha = 1
    ctx.drawImage(img, width - (i + 1) * (sSize + 12) - 40, 40, sSize, sSize)
  })
}

function drawVisualizer(
  ctx: OffscreenCanvasRenderingContext2D,
  width: number,
  height: number,
  frequencyData: Float32Array,
  visualizer: Visualizer,
): void {
  const opacity = visualizer.opacity / 100
  const intensity = visualizer.intensity / 100

  if (visualizer.type === 'bars') {
    const numBars = frequencyData.length
    const barW = width / numBars
    ctx.globalAlpha = opacity
    ctx.fillStyle = 'rgba(255,255,255,0.7)'
    for (let i = 0; i < numBars; i++) {
      const barH = frequencyData[i] * intensity * height * 0.45
      ctx.fillRect(i * barW, height - barH, barW - 1, barH)
    }
    ctx.globalAlpha = 1
  } else if (visualizer.type === 'wave') {
    ctx.globalAlpha = opacity
    ctx.beginPath()
    ctx.strokeStyle = 'rgba(255,255,255,0.8)'
    ctx.lineWidth = 2 * (width / 1920)
    const step = width / frequencyData.length
    for (let i = 0; i < frequencyData.length; i++) {
      const y = height / 2 - frequencyData[i] * intensity * height * 0.4
      if (i === 0) ctx.moveTo(0, y)
      else ctx.lineTo(i * step, y)
    }
    ctx.stroke()
    ctx.globalAlpha = 1
  } else if (visualizer.type === 'orb') {
    const cx = width / 2, cy = height / 2
    const energy = frequencyData.reduce((a, v) => a + v, 0) / frequencyData.length
    const baseR = Math.min(width, height) * 0.15 * intensity
    ;[1, 0.65, 0.35].forEach((scale, i) => {
      const r = baseR * scale * (1 + energy * 0.5)
      ctx.globalAlpha = opacity * (1 - i * 0.25)
      ctx.beginPath()
      ctx.arc(cx, cy, r, 0, 2 * Math.PI)
      ctx.strokeStyle = 'rgba(255,255,255,0.6)'
      ctx.lineWidth = 2
      ctx.stroke()
    })
    ctx.globalAlpha = 1
  }
}

export async function loadImageBitmap(url: string): Promise<ImageBitmap> {
  const resp = await fetch(url)
  const blob = await resp.blob()
  return createImageBitmap(blob)
}
```

- [ ] **Step 4: 테스트 실행 — 통과 확인**

```
npm test -- frameRenderer
```

Expected: 4 tests passed

- [ ] **Step 5: Commit**

```
git add src/lib/renderer/frameRenderer.ts src/lib/renderer/frameRenderer.test.ts
git commit -m "feat: OffscreenCanvas 프레임 렌더러 구현 (배경/비주얼라이저/타이포/로고/스티커)"
```

---

## Task 5: `src/lib/renderer/videoEncoder.ts` — VideoEncoder + mp4-muxer

**Files:**
- Create: `src/lib/renderer/videoEncoder.ts`

이 모듈은 VideoEncoder/AudioEncoder/OffscreenCanvas가 jsdom에 없어 직접 단위 테스트 불가. Task 7에서 Step3를 통해 mock으로 검증한다.

- [ ] **Step 1: videoEncoder.ts 구현**

`src/lib/renderer/videoEncoder.ts`:

```ts
// VideoEncoder + AudioEncoder + mp4-muxer로 H.264 MP4를 생성하는 인코더

import { Muxer, ArrayBufferTarget } from 'mp4-muxer'
import { computeFrequencyBands } from './fft'
import { drawFrame } from './frameRenderer'
import type { DrawFrameInput } from './frameRenderer'
import type { Track } from '../../types'
import type { AudioProcessorOutput } from './audioProcessor'

const FPS = 30

const BITRATE: Record<string, number> = {
  '720p': 4_000_000,
  '1080p': 8_000_000,
  '4k': 25_000_000,
}

const RESOLUTION: Record<string, [number, number]> = {
  '720p': [1280, 720],
  '1080p': [1920, 1080],
  '4k': [3840, 2160],
}

export interface EncodeVideoInput {
  audioResult: AudioProcessorOutput
  frameInputBase: Omit<DrawFrameInput, 'canvas' | 'frequencyData' | 'currentTrack' | 'currentTrackIndex'>
  resolution: '720p' | '1080p' | '4k'
  tracks: Track[]
  onProgress: (pct: number) => void
}

export async function encodeVideo(input: EncodeVideoInput): Promise<Blob> {
  const { audioResult, frameInputBase, resolution, tracks } = input
  const [width, height] = RESOLUTION[resolution]
  const { audioBuffer, trackBoundaries, frameCount } = audioResult
  const pcmData = audioBuffer.getChannelData(0)

  const target = new ArrayBufferTarget()
  const muxer = new Muxer({
    target,
    video: { codec: 'avc', width, height },
    audio: {
      codec: 'aac',
      sampleRate: audioBuffer.sampleRate,
      numberOfChannels: 2,
    },
    fastStart: 'in-memory',
  })

  const videoEncoder = new VideoEncoder({
    output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
    error: e => { throw e },
  })
  videoEncoder.configure({
    codec: 'avc1.640028',
    width,
    height,
    bitrate: BITRATE[resolution],
    framerate: FPS,
  })

  const audioEncoder = new AudioEncoder({
    output: (chunk, meta) => muxer.addAudioChunk(chunk, meta),
    error: e => { throw e },
  })
  audioEncoder.configure({
    codec: 'mp4a.40.2',
    sampleRate: audioBuffer.sampleRate,
    numberOfChannels: 2,
    bitrate: 192_000,
  })

  const canvas = new OffscreenCanvas(width, height)

  // 비디오 프레임 인코딩
  for (let fi = 0; fi < frameCount; fi++) {
    const timeSec = fi / FPS
    const sampleOffset = Math.floor(timeSec * audioBuffer.sampleRate)
    const frequencyData = computeFrequencyBands(pcmData, sampleOffset, 2048, 80)

    const trackIdx = findCurrentTrackIndex(trackBoundaries, timeSec)
    const currentTrack = tracks[trackIdx % tracks.length]

    drawFrame({ ...frameInputBase, canvas, frequencyData, currentTrack, currentTrackIndex: trackIdx % tracks.length })

    const videoFrame = new VideoFrame(canvas, {
      timestamp: Math.round(timeSec * 1_000_000),
      duration: Math.round((1 / FPS) * 1_000_000),
    })
    videoEncoder.encode(videoFrame, { keyFrame: fi % 60 === 0 })
    videoFrame.close()

    input.onProgress((fi / frameCount) * 80)
  }
  await videoEncoder.flush()

  // 오디오 인코딩 (f32-planar: ch0 먼저, ch1 뒤)
  const ch0 = audioBuffer.getChannelData(0)
  const ch1 = audioBuffer.getChannelData(1)
  const CHUNK = 4096
  const sr = audioBuffer.sampleRate
  for (let offset = 0; offset < audioBuffer.length; offset += CHUNK) {
    const end = Math.min(offset + CHUNK, audioBuffer.length)
    const size = end - offset
    const planar = new Float32Array(size * 2)
    planar.set(ch0.subarray(offset, end), 0)
    planar.set(ch1.subarray(offset, end), size)
    const audioData = new AudioData({
      format: 'f32-planar',
      sampleRate: sr,
      numberOfFrames: size,
      numberOfChannels: 2,
      timestamp: Math.round((offset / sr) * 1_000_000),
      data: planar,
    })
    audioEncoder.encode(audioData)
    audioData.close()
  }
  await audioEncoder.flush()

  input.onProgress(95)
  muxer.finalize()
  return new Blob([target.buffer], { type: 'video/mp4' })
}

function findCurrentTrackIndex(boundaries: number[], timeSec: number): number {
  let idx = 0
  for (let i = 0; i < boundaries.length; i++) {
    if (boundaries[i] <= timeSec) idx = i
    else break
  }
  return idx
}
```

- [ ] **Step 2: TypeScript 컴파일 확인**

```
npx tsc --noEmit
```

Expected: 에러 없음 (VideoEncoder, AudioEncoder, AudioData는 TS 5.x DOM 타입에 포함됨). 에러 발생 시 `tsconfig.json`의 `lib` 배열에 `"dom"` 이 있는지 확인.

- [ ] **Step 3: Commit**

```
git add src/lib/renderer/videoEncoder.ts
git commit -m "feat: VideoEncoder + AudioEncoder + mp4-muxer H.264 MP4 인코더 구현"
```

---

## Task 6: `src/lib/renderer/index.ts` — renderVideo() 진입점

**Files:**
- Create: `src/lib/renderer/index.ts`
- Create: `src/lib/renderer/index.test.ts`

- [ ] **Step 1: 실패 테스트 작성**

`src/lib/renderer/index.test.ts`:

```ts
// renderVideo 오케스트레이션 테스트
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderVideo } from './index'
import type { RenderInput } from './index'

vi.mock('./audioProcessor', () => ({
  processAudio: vi.fn().mockResolvedValue({
    audioBuffer: {
      duration: 10,
      length: 480000,
      sampleRate: 48000,
      numberOfChannels: 2,
      getChannelData: () => new Float32Array(480000),
    },
    trackBoundaries: [0],
    frameCount: 300,
    durationSec: 10,
  }),
}))

vi.mock('./videoEncoder', () => ({
  encodeVideo: vi.fn().mockResolvedValue(new Blob(['fake'], { type: 'video/mp4' })),
}))

vi.mock('./frameRenderer', () => ({
  loadImageBitmap: vi.fn().mockResolvedValue({} as ImageBitmap),
  drawFrame: vi.fn(),
}))

vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
  blob: () => Promise.resolve(new Blob()),
}))
vi.stubGlobal('createImageBitmap', vi.fn().mockResolvedValue({}))

const base: RenderInput = {
  tracks: [],
  theme: 'midnight',
  background: { type: 'gradient' },
  stickers: [],
  effects: { vis: true, crossfade: false, ducking: false, blur: false },
  visualizer: { type: 'bars', intensity: 70, opacity: 85 },
  typography: { titleSize: 48, letterSpacing: -15 },
  exportSettings: {
    filename: 'test', format: 'mp4', resolution: '1080p', thumbnail: false, chapters: false,
  },
  loops: 1,
}

describe('renderVideo', () => {
  beforeEach(() => vi.clearAllMocks())

  it('Blob을 반환한다', async () => {
    const blob = await renderVideo(base, vi.fn())
    expect(blob).toBeInstanceOf(Blob)
  })

  it('진행률 콜백을 호출한다', async () => {
    const onProgress = vi.fn()
    await renderVideo(base, onProgress)
    expect(onProgress).toHaveBeenCalledWith(0)
    expect(onProgress).toHaveBeenCalledWith(100)
  })

  it('processAudio를 호출한다', async () => {
    const { processAudio } = await import('./audioProcessor')
    await renderVideo(base, vi.fn())
    expect(processAudio).toHaveBeenCalledWith({
      tracks: base.tracks,
      loops: base.loops,
      crossfade: base.effects.crossfade,
    })
  })
})
```

- [ ] **Step 2: 테스트 실행 — 실패 확인**

```
npm test -- renderer/index
```

Expected: `Cannot find module './index'`

- [ ] **Step 3: index.ts 구현**

`src/lib/renderer/index.ts`:

```ts
// renderVideo() — 오디오 처리 → 이미지 로딩 → MP4 인코딩 진입점

import type { Track, Background, Effects, Visualizer, Typography, ExportSettings } from '../../types'
import { processAudio } from './audioProcessor'
import { encodeVideo } from './videoEncoder'
import { loadImageBitmap } from './frameRenderer'

const THEME_COLORS: Record<string, [string, string]> = {
  midnight: ['#0c1a2e', '#050813'],
  cyanwave: ['#042f3f', '#0a647a'],
  sunset:   ['#2a0f2e', '#6d2c4a'],
  forest:   ['#0c1e16', '#1f3d2c'],
  cream:    ['#f3ead8', '#d9c7a3'],
  mono:     ['#0a0a0a', '#2a2a2a'],
}

const RESOLUTION: Record<string, [number, number]> = {
  '720p': [1280, 720],
  '1080p': [1920, 1080],
  '4k': [3840, 2160],
}

export interface RenderInput {
  tracks: Track[]
  theme: string
  background: Background
  logo?: string
  watermark?: string
  stickers: string[]
  effects: Effects
  visualizer: Visualizer
  typography: Typography
  exportSettings: ExportSettings
  loops: 1 | 2 | 3
}

export async function renderVideo(input: RenderInput, onProgress: (pct: number) => void): Promise<Blob> {
  onProgress(0)

  const audioResult = await processAudio({
    tracks: input.tracks,
    loops: input.loops,
    crossfade: input.effects.crossfade,
  })
  onProgress(40)

  const [backgroundImage, logoImage, watermarkImage, ...stickerImages] = await Promise.all([
    input.background.src ? loadImageBitmap(input.background.src) : Promise.resolve(undefined),
    input.logo ? loadImageBitmap(input.logo) : Promise.resolve(undefined),
    input.watermark ? loadImageBitmap(input.watermark) : Promise.resolve(undefined),
    ...input.stickers.map(loadImageBitmap),
  ])

  const [width, height] = RESOLUTION[input.exportSettings.resolution]
  const themeGradient = THEME_COLORS[input.theme] ?? THEME_COLORS['midnight']

  const blob = await encodeVideo({
    audioResult,
    frameInputBase: {
      width,
      height,
      themeGradient,
      background: input.background,
      backgroundImage,
      logoImage,
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

  onProgress(100)
  return blob
}
```

- [ ] **Step 4: 테스트 실행 — 통과 확인**

```
npm test -- renderer/index
```

Expected: 3 tests passed

- [ ] **Step 5: 전체 테스트 통과 확인**

```
npm test
```

Expected: 기존 73개 + 신규 17개 = 90개 이상 passed

- [ ] **Step 6: Commit**

```
git add src/lib/renderer/index.ts src/lib/renderer/index.test.ts
git commit -m "feat: renderVideo() 진입점 구현"
```

---

## Task 7: Step3 props 추가 + App.tsx 연결

**Files:**
- Modify: `src/components/steps/Step3/Step3.tsx` (Props 인터페이스 + 수신)
- Modify: `src/components/steps/Step3/Step3.test.tsx` (새 props 포함)
- Modify: `src/App.tsx` (Step3에 새 props 전달)

- [ ] **Step 1: 실패 테스트 추가**

`src/components/steps/Step3/Step3.test.tsx` 파일의 `base` 객체 아래에 다음 테스트를 추가한다. `base` 객체는 수정하지 않는다. 대신 `baseV2`를 따로 정의한다.

`Step3.test.tsx` 파일 맨 위에 아래 import 추가:

```ts
import type { Background, Typography } from '../../../types'
```

파일 끝(`describe` 블록 닫는 괄호 앞)에 다음 테스트 추가:

```ts
  describe('Step3 새 props 수용', () => {
    const baseV2 = {
      ...base,
      background: { type: 'gradient' } as Background,
      stickers: [] as string[],
      typography: { titleSize: 48, letterSpacing: -15 } as Typography,
    }

    it('background prop을 받아도 정상 렌더링된다', () => {
      render(<Step3 {...baseV2} />)
      expect(screen.getByText('영상 출력')).toBeInTheDocument()
    })

    it('logo prop을 받아도 정상 렌더링된다', () => {
      render(<Step3 {...baseV2} logo="blob:fake" />)
      expect(screen.getByText('영상 출력')).toBeInTheDocument()
    })
  })
```

- [ ] **Step 2: 테스트 실행 — 실패 확인**

```
npm test -- Step3
```

Expected: TypeScript 컴파일 에러로 테스트 실패 (Step3가 background prop을 아직 받지 않음)

- [ ] **Step 3: Step3.tsx Props 인터페이스 수정**

`src/components/steps/Step3/Step3.tsx`의 `Step3Props` 인터페이스를 아래로 교체:

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
  watermark?: string
  stickers: string[]
  typography: Typography
}
```

`Step3.tsx` import 라인을 아래로 교체:

```ts
import type { Track, Effects, Visualizer, ExportSettings, Background, Typography } from '../../../types'
```

함수 시그니처를 아래로 교체:

```ts
export default function Step3({ tracks, theme, effects, visualizer, exportSettings, setExportSettings, loops, quality, onBack, background, logo, watermark, stickers, typography }: Step3Props) {
```

- [ ] **Step 4: App.tsx에서 Step3에 새 props 전달**

`src/App.tsx`의 `step === 3` 블록을 아래로 교체:

```tsx
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
            background={background}
            logo={logo}
            watermark={watermark}
            stickers={stickers}
            typography={typography}
          />
        )}
```

- [ ] **Step 5: 테스트 실행 — 통과 확인**

```
npm test -- Step3
```

Expected: 10 tests passed (기존 8 + 신규 2)

- [ ] **Step 6: Commit**

```
git add src/components/steps/Step3/Step3.tsx src/components/steps/Step3/Step3.test.tsx src/App.tsx
git commit -m "feat: Step3에 background/logo/watermark/stickers/typography props 추가 및 App.tsx 연결"
```

---

## Task 8: Step3 startRender → renderVideo 실제 연결 + 에러 처리

**Files:**
- Modify: `src/components/steps/Step3/Step3.tsx`
- Modify: `src/components/steps/Step3/Step3.test.tsx`

- [ ] **Step 1: 실패 테스트 추가**

`Step3.test.tsx` 파일 상단에 아래 import 추가:

```ts
import { renderVideo } from '../../../lib/renderer'
```

파일 상단 import 바로 아래에 mock 추가 (`base` 정의 위에):

```ts
vi.mock('../../../lib/renderer', () => ({
  renderVideo: vi.fn().mockResolvedValue(new Blob(['fake'], { type: 'video/mp4' })),
}))
```

마지막 `describe` 블록 안에 테스트 추가:

```ts
  it('"렌더링 시작" 클릭 시 renderVideo가 올바른 인자로 호출된다', async () => {
    const bgV2: Background = { type: 'gradient' }
    const typo: Typography = { titleSize: 48, letterSpacing: -15 }
    render(<Step3 {...base} background={bgV2} stickers={[]} typography={typo} />)
    fireEvent.click(screen.getByText(/렌더링 시작/))
    await vi.waitFor(() => {
      expect(renderVideo).toHaveBeenCalledWith(
        expect.objectContaining({ tracks: base.tracks }),
        expect.any(Function),
      )
    })
  })

  it('렌더링 완료 시 "렌더링 완료" 메시지가 표시된다', async () => {
    const bgV2: Background = { type: 'gradient' }
    const typo: Typography = { titleSize: 48, letterSpacing: -15 }
    render(<Step3 {...base} background={bgV2} stickers={[]} typography={typo} />)
    fireEvent.click(screen.getByText(/렌더링 시작/))
    await screen.findByText(/렌더링 완료/)
  })
```

- [ ] **Step 2: 테스트 실행 — 실패 확인**

```
npm test -- Step3
```

Expected: renderVideo 관련 테스트 2개 실패

- [ ] **Step 3: Step3.tsx startRender 교체**

`Step3.tsx`에서 `import` 목록에 아래 추가:

```ts
import { renderVideo } from '../../../lib/renderer'
```

`startRender` 함수와 `useEffect` 블록을 아래로 교체 (기존 `startRender`, `useEffect` 삭제):

```ts
  const startRender = async () => {
    setRenderState('rendering')
    setProgress(0)
    try {
      const blob = await renderVideo(
        { tracks, theme, effects, visualizer, typography, background, logo, watermark, stickers, exportSettings, loops },
        pct => setProgress(Math.round(pct)),
      )
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${exportSettings.filename}.${exportSettings.format}`
      a.click()
      URL.revokeObjectURL(url)
      setRenderState('done')
    } catch (err) {
      console.error('렌더링 실패:', err)
      setRenderState('idle')
    }
  }
```

- [ ] **Step 4: render-progress 진행 텍스트 수정**

`Step3.tsx`의 `render-progress__text` 부분에서 `렌더링 중... {progress}%` 텍스트를 확인한다. 기존 코드 그대로 유지 (이미 올바름).

- [ ] **Step 5: 테스트 실행 — 통과 확인**

```
npm test -- Step3
```

Expected: 12 tests passed

- [ ] **Step 6: 전체 테스트 통과 확인**

```
npm test
```

Expected: 90개 이상 passed, 0 failed

- [ ] **Step 7: Commit**

```
git add src/components/steps/Step3/Step3.tsx src/components/steps/Step3/Step3.test.tsx
git commit -m "feat: Step3 startRender를 실제 renderVideo()에 연결 + 다운로드 트리거"
```

---

## 최종 확인

- [ ] `npm test` — 전체 테스트 통과
- [ ] `npm run build` — 빌드 성공
- [ ] `npm run dev` → Step3 이동 → "렌더링 시작" 클릭 → 진행률 업데이트 → MP4 다운로드 확인 (Chrome 94+ 환경 필요)
