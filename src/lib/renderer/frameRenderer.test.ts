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

  it('effects.blur가 true면 filter에 blur를 설정한다', () => {
    drawFrame({ ...base, effects: { ...base.effects, blur: true } })
    expect(mockCtx.filter).toContain('blur')
  })

  it('logoImage가 있으면 drawImage를 호출한다', () => {
    const fakeImg = {} as ImageBitmap
    drawFrame({ ...base, logoImage: fakeImg })
    expect(mockCtx.drawImage).toHaveBeenCalledWith(
      fakeImg,
      expect.any(Number), expect.any(Number),
      expect.any(Number), expect.any(Number),
    )
  })
})
