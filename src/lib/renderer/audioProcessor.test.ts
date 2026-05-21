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
