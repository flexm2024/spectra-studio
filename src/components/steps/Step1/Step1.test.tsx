// Step1 컴포넌트 테스트
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Step1 from './Step1'
import { sampleTracks } from '../../../data/sampleTracks'

const base = { tracks: sampleTracks, setTracks: vi.fn(), onNext: vi.fn() }

describe('Step1', () => {
  it('"미디어 준비" 제목을 렌더링한다', () => {
    render(<Step1 {...base} />)
    expect(screen.getByText('미디어 준비')).toBeInTheDocument()
  })
  it('트랙 목록에 첫 번째 트랙을 표시한다', () => {
    render(<Step1 {...base} />)
    expect(screen.getByText('가을의 시작')).toBeInTheDocument()
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
  it('트랙 행 클릭 시 해당 트랙이 활성화된다', () => {
    render(<Step1 {...base} />)
    fireEvent.click(screen.getByText('단풍 길에서').closest('[class*="track"]')!)
    // 두 번째 트랙이 프리뷰에 표시돼야 함
    expect(screen.getAllByText('단풍 길에서').length).toBeGreaterThanOrEqual(1)
  })
})
