// Step1 컴포넌트 테스트
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Step1 from './Step1'
import { sampleTracks } from '../../../data/sampleTracks'
import type { Track, Background } from '../../../types'

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
  background: { type: 'gradient' } as Background,
  setBackground: vi.fn(),
  logo: undefined as string | undefined,
  setLogo: vi.fn(),
  watermark: undefined as string | undefined,
  setWatermark: vi.fn(),
  stickers: [] as string[],
  setStickers: vi.fn(),
  currentTime: 0,
}

describe('Step1', () => {
  it('"미디어 준비" 제목을 렌더링한다', () => {
    render(<Step1 {...base} />)
    expect(screen.getByText('미디어 준비')).toBeInTheDocument()
  })
  it('트랙 목록에 첫 번째 트랙을 표시한다', () => {
    render(<Step1 {...base} />)
    expect(screen.getAllByText('가을의 시작').length).toBeGreaterThanOrEqual(1)
  })
  it('트랙 삭제 버튼 클릭 시 setTracks가 호출된다', () => {
    const setTracks = vi.fn()
    render(<Step1 {...base} setTracks={setTracks} />)
    const delButtons = screen.getAllByTitle('삭제')
    fireEvent.click(delButtons[0])
    expect(setTracks).toHaveBeenCalled()
    // 삭제 후 14개여야 함
    const newTracks = setTracks.mock.calls[0][0]
    expect(newTracks).toHaveLength(14)
  })
  it('"스튜디오 입장" CTA 클릭 시 onNext가 호출된다', () => {
    const onNext = vi.fn()
    render(<Step1 {...base} onNext={onNext} />)
    fireEvent.click(screen.getByText(/스튜디오 입장/))
    expect(onNext).toHaveBeenCalledTimes(1)
  })
  it('트랙 행 클릭 시 onPlay가 해당 트랙 id로 호출된다', () => {
    const onPlay = vi.fn()
    render(<Step1 {...base} onPlay={onPlay} />)
    fireEvent.click(screen.getByText('단풍 길에서').closest('[class*="track"]')!)
    expect(onPlay).toHaveBeenCalledWith(sampleTracks[1].id)
  })

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

  it('프리뷰 플레이 버튼 클릭 시 onPlay가 호출된다 (재생 중이 아닐 때)', () => {
    const onPlay = vi.fn()
    render(<Step1 {...base} onPlay={onPlay} isPlaying={false} playingId={null} />)
    fireEvent.click(document.querySelector('.preview-play')!)
    expect(onPlay).toHaveBeenCalledWith(sampleTracks[0].id)
  })

  it('프리뷰 플레이 버튼이 재생 중일 때 onPause를 호출한다', () => {
    const onPause = vi.fn()
    render(<Step1 {...base} onPause={onPause} isPlaying={true} playingId={sampleTracks[0].id} />)
    fireEvent.click(document.querySelector('.preview-play')!)
    expect(onPause).toHaveBeenCalledTimes(1)
  })

  it('초기화 버튼 클릭 시 setLoops(1)과 setQuality("192k")가 호출된다', () => {
    const setLoops = vi.fn()
    const setQuality = vi.fn()
    render(<Step1 {...base} setLoops={setLoops} setQuality={setQuality} loops={3} quality="96k" />)
    fireEvent.click(screen.getByText('초기화'))
    expect(setLoops).toHaveBeenCalledWith(1)
    expect(setQuality).toHaveBeenCalledWith('192k')
  })

  it('프리뷰 스킵 이전 버튼 클릭 시 onSkipPrev가 호출된다', () => {
    const onSkipPrev = vi.fn()
    render(<Step1 {...base} onSkipPrev={onSkipPrev} />)
    fireEvent.click(document.querySelector('.preview-controls button:first-child')!)
    expect(onSkipPrev).toHaveBeenCalledTimes(1)
  })

  it('프리뷰 스킵 다음 버튼 클릭 시 onSkipNext가 호출된다', () => {
    const onSkipNext = vi.fn()
    render(<Step1 {...base} onSkipNext={onSkipNext} />)
    const buttons = document.querySelectorAll('.preview-controls button')
    // buttons: [skipBack, preview-play, skipForward] (Button renders as <button>)
    fireEvent.click(buttons[buttons.length - 1])
    expect(onSkipNext).toHaveBeenCalledTimes(1)
  })

  it('배경 파일 선택 시 setBackground가 type: image로 호출된다', () => {
    const setBackground = vi.fn()
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:fake-bg')
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
    render(<Step1 {...base} setBackground={setBackground} />)
    const bgInput = document.querySelector('[data-testid="bg-file-input"]') as HTMLInputElement
    const file = new File([''], 'bg.jpg', { type: 'image/jpeg' })
    fireEvent.change(bgInput, { target: { files: [file] } })
    expect(setBackground).toHaveBeenCalledWith({ type: 'image', src: 'blob:fake-bg' })
    vi.restoreAllMocks()
  })

  it('로고 파일 선택 시 setLogo가 호출된다', () => {
    const setLogo = vi.fn()
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:fake-logo')
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
    render(<Step1 {...base} setLogo={setLogo} />)
    fireEvent.click(screen.getByText('로고'))
    const logoInput = document.querySelector('[data-testid="logo-file-input"]') as HTMLInputElement
    const file = new File([''], 'logo.png', { type: 'image/png' })
    fireEvent.change(logoInput, { target: { files: [file] } })
    expect(setLogo).toHaveBeenCalledWith('blob:fake-logo')
    vi.restoreAllMocks()
  })

  it('스티커가 있을 때 뱃지가 "N / 5"로 표시된다', () => {
    render(<Step1 {...base} stickers={['blob:1', 'blob:2', 'blob:3']} />)
    expect(screen.getByText('3 / 5')).toBeInTheDocument()
  })

  it('currentTime이 주어질 때 진행바 너비가 비율로 계산된다', () => {
    const track = sampleTracks[0]  // durationSec = 131
    render(<Step1 {...base} playingId={track.id} currentTime={track.durationSec / 2} />)
    const fill = document.querySelector('.preview-controls__fill') as HTMLElement
    expect(fill.style.width).toBe('50%')
  })
})
