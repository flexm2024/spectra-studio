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
  strokeText: vi.fn(),
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
  shadowBlur: 0,
  shadowColor: 'transparent',
  createLinearGradient: vi.fn().mockReturnValue({ addColorStop: vi.fn() }),
  measureText: vi.fn().mockReturnValue({ width: 100 }),
  closePath: vi.fn(),
  strokeRect: vi.fn(),
  roundRect: vi.fn(),
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
  logoPosition: { x: 85, y: 8 },
  logoSize: 52,
  stickerImages: [],
  effects: { vis: true, crossfade: false, ducking: false, blur: false },
  visualizer: { type: 'bars', intensity: 70, opacity: 85, y: 75, size: 50, width: 85, color: 'rainbow' },
  typography: { titleSize: 48, letterSpacing: -15, titlePosition: { x: 50, y: 48 }, subPosition: { x: 50, y: 55 }, showTitle: true, showSub: true, subSize: 18, subLetterSpacing: 0, titleStyle: 'minimal' as const, titleDeco: 'none' as const, titleFont: 'inter', titlePositionPreset: 'bc' as const, titleCaptionTop: '', titleCaptionBottom: '', titleAlign: 'center' as const, titleStroke: { enabled: true, width: 2, color: '#000000' } },
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

  it('logoPosition x=50, y=50이면 drawImage가 캔버스 중앙에서 호출된다', () => {
    mockCtx.drawImage.mockClear()
    const img = {} as ImageBitmap
    // canvasLogoSize = Math.round(52 * (1920 / 640)) = 156
    // x: (50/100)*1920 - 156/2 = 960 - 78 = 882
    // y: (50/100)*1080 - 156/2 = 540 - 78 = 462
    drawFrame({ ...base, logoImage: img, logoPosition: { x: 50, y: 50 } })
    const call = mockCtx.drawImage.mock.calls.find(c => c[0] === img)
    expect(call).toBeDefined()
    expect(call![1]).toBe(882)
    expect(call![2]).toBe(462)
  })

  it('bars 타입에서 non-zero 주파수 데이터가 있으면 shadowBlur가 설정됐다가 0으로 리셋된다', () => {
    const shadowBlurSets: number[] = []
    Object.defineProperty(mockCtx, 'shadowBlur', {
      set(v: number) { shadowBlurSets.push(v) },
      get() { return shadowBlurSets[shadowBlurSets.length - 1] ?? 0 },
      configurable: true,
    })
    const freqData = new Float32Array(80).fill(0.5)
    drawFrame({ ...base, frequencyData: freqData })
    Object.defineProperty(mockCtx, 'shadowBlur', { value: 0, writable: true, configurable: true })
    expect(shadowBlurSets.some(v => v > 0)).toBe(true)
    expect(shadowBlurSets[shadowBlurSets.length - 1]).toBe(0)
  })
})
