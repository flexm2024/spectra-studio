// renderVideo() 오케스트레이션 테스트
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
  logoPosition: { x: 85, y: 8 },
  logoSize: 52,
  stickers: [],
  effects: { vis: true, crossfade: false, ducking: false, blur: false },
  visualizer: { type: 'bars', intensity: 70, opacity: 85, y: 75, size: 50, width: 85, color: 'rainbow' },
  typography: { titleSize: 48, letterSpacing: -15, titlePosition: { x: 50, y: 48 }, subPosition: { x: 50, y: 55 } },
  exportSettings: { filename: 'test', resolution: '1080p' },
  loops: 1,
  quality: '192k' as const,
}

describe('renderVideo', () => {
  beforeEach(() => vi.clearAllMocks())

  it('Blob을 반환한다', async () => {
    const blob = await renderVideo(base, vi.fn())
    expect(blob).toBeInstanceOf(Blob)
  })

  it('진행률 콜백을 호출한다 — 0%와 100% 포함', async () => {
    const onProgress = vi.fn()
    await renderVideo(base, onProgress)
    expect(onProgress).toHaveBeenCalledWith(0)
    expect(onProgress).toHaveBeenCalledWith(100)
  })

  it('processAudio를 올바른 인자로 호출한다', async () => {
    const { processAudio } = await import('./audioProcessor')
    await renderVideo(base, vi.fn())
    expect(processAudio).toHaveBeenCalledWith(
      expect.objectContaining({
        tracks: base.tracks,
        loops: base.loops,
        crossfade: base.effects.crossfade,
        ducking: base.effects.ducking,
        onProgress: expect.any(Function),
      })
    )
  })
})
