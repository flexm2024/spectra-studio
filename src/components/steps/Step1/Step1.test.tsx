// Step1 컴포넌트 테스트
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Step1 from './Step1'
import { sampleTracks } from '../../../data/sampleTracks'
import type { Track } from '../../../types'

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
})
