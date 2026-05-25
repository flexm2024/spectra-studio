// 오디오 믹싱 순수함수 + Web Audio mock 테스트
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { computeTrackBoundaries, processAudio, calcRMS, calcNormGain } from './audioProcessor'
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

const makeMockBuffer = (duration = MOCK_DURATION) => ({
  duration,
  length: duration * SAMPLE_RATE,
  sampleRate: SAMPLE_RATE,
  numberOfChannels: 2,
  getChannelData: () => new Float32Array(duration * SAMPLE_RATE),
})

const makeMockCtx = () => ({
  decodeAudioData: vi.fn().mockResolvedValue(makeMockBuffer()),
  createBuffer: vi.fn().mockImplementation((_ch: number, len: number, sr: number) => makeMockBuffer(len / sr)),
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
  length: MOCK_DURATION * 2 * SAMPLE_RATE,
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
      ducking: false,
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
      ducking: false,
    })
    expect(result.trackBoundaries).toHaveLength(2)
    expect(result.trackBoundaries[0]).toBe(0)
  })

  it('ducking: true일 때 createGain이 트랙당 한 번 추가 호출된다', async () => {
    let ctxRef: ReturnType<typeof makeMockCtx> | null = null
    vi.stubGlobal('OfflineAudioContext', vi.fn().mockImplementation(() => {
      ctxRef = makeMockCtx()
      return ctxRef
    }))
    await processAudio({
      tracks: [makeTrack(), makeTrack({ id: 't2', audioUrl: 'blob:test2' })],
      loops: 1,
      crossfade: false,
      ducking: true,
    })
    // 2 트랙에 대해 normGain 각 1개씩 = 최소 2회 createGain 호출
    expect(ctxRef!.createGain).toHaveBeenCalledTimes(2)
  })

  it('ducking: true + crossfade: true일 때 createGain이 트랙당 2개 생성된다', async () => {
    let ctxRef: ReturnType<typeof makeMockCtx> | null = null
    vi.stubGlobal('OfflineAudioContext', vi.fn().mockImplementation(() => {
      ctxRef = makeMockCtx()
      return ctxRef
    }))
    await processAudio({
      tracks: [makeTrack(), makeTrack({ id: 't2', audioUrl: 'blob:test2' })],
      loops: 1,
      crossfade: true,
      ducking: true,
    })
    // 2 트랙 × (normGain + fadeGain) = 4회
    expect(ctxRef!.createGain).toHaveBeenCalledTimes(4)
  })
})

// ─── calcRMS / calcNormGain 순수함수 테스트 ──────────────────────────────────

function makeAudioBufferWith(value: number, channels = 1, samples = 1024): AudioBuffer {
  const data = new Float32Array(samples).fill(value)
  return {
    duration: samples / 48000,
    length: samples,
    sampleRate: 48000,
    numberOfChannels: channels,
    getChannelData: () => data,
    copyFromChannel: () => {},
    copyToChannel: () => {},
  } as unknown as AudioBuffer
}

describe('calcRMS', () => {
  it('무음 버퍼(0)의 RMS는 0이다', () => {
    expect(calcRMS(makeAudioBufferWith(0))).toBe(0)
  })

  it('상수 0.5 버퍼의 RMS는 0.5이다', () => {
    expect(calcRMS(makeAudioBufferWith(0.5))).toBeCloseTo(0.5)
  })

  it('상수 1.0 (풀스케일) 버퍼의 RMS는 1.0이다', () => {
    expect(calcRMS(makeAudioBufferWith(1.0))).toBeCloseTo(1.0)
  })
})

describe('calcNormGain', () => {
  it('무음 버퍼는 게인 1을 반환한다', () => {
    expect(calcNormGain(makeAudioBufferWith(0))).toBe(1)
  })

  it('RMS=1.0 (0 dBFS) → 게인 ≈ 0.2 (−14 dB)', () => {
    const gain = calcNormGain(makeAudioBufferWith(1.0))
    expect(gain).toBeCloseTo(Math.pow(10, -14 / 20), 2)
  })

  it('조용한 트랙 (RMS=0.05, −26 dBFS) → 게인 ≈ 3.16 (+10 dB)', () => {
    const gain = calcNormGain(makeAudioBufferWith(0.05))
    expect(gain).toBeCloseTo(Math.pow(10, ((-14) - 20 * Math.log10(0.05)) / 20), 1)
  })

  it('반환 게인은 MAX_NORM_GAIN(4.0)을 초과하지 않는다', () => {
    // 매우 조용한 트랙: RMS = 0.001
    const gain = calcNormGain(makeAudioBufferWith(0.001))
    expect(gain).toBeLessThanOrEqual(4.0)
  })

  it('반환 게인은 MIN_NORM_GAIN(0.1) 미만이 되지 않는다', () => {
    // 매우 큰 트랙: RMS = 0.99
    const gain = calcNormGain(makeAudioBufferWith(0.99))
    expect(gain).toBeGreaterThanOrEqual(0.1)
  })
})
