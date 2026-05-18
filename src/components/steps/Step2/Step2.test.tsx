// Step2 컴포넌트 테스트
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Step2 from './Step2'
import { sampleTracks } from '../../../data/sampleTracks'

const base = {
  tracks: sampleTracks,
  theme: 'midnight',
  setTheme: vi.fn(),
  effects: { vis: true, crossfade: false, ducking: true, blur: true },
  setEffects: vi.fn(),
  visualizer: { type: 'bars' as const, intensity: 70, opacity: 85 },
  setVisualizer: vi.fn(),
  typography: { titleSize: 48, letterSpacing: -15 },
  setTypography: vi.fn(),
  onBack: vi.fn(),
  onNext: vi.fn(),
}

describe('Step2', () => {
  it('"테마 & 비주얼" 패널 헤딩을 렌더링한다', () => {
    render(<Step2 {...base} />)
    expect(screen.getByText('테마 & 비주얼')).toBeInTheDocument()
  })
  it('테마 카드 6개를 표시한다', () => {
    render(<Step2 {...base} />)
    expect(screen.getByText('Midnight')).toBeInTheDocument()
    expect(screen.getByText('Cyan Wave')).toBeInTheDocument()
    expect(screen.getByText('Sunset')).toBeInTheDocument()
    expect(screen.getByText('Forest')).toBeInTheDocument()
    expect(screen.getByText('Cream')).toBeInTheDocument()
    expect(screen.getByText('Mono')).toBeInTheDocument()
  })
  it('테마 카드 클릭 시 setTheme이 해당 id로 호출된다', () => {
    const setTheme = vi.fn()
    render(<Step2 {...base} setTheme={setTheme} />)
    fireEvent.click(screen.getByText('Sunset').closest('.theme-card')!)
    expect(setTheme).toHaveBeenCalledWith('sunset')
  })
  it('효과 칩 클릭 시 setEffects가 호출된다', () => {
    const setEffects = vi.fn()
    render(<Step2 {...base} setEffects={setEffects} />)
    fireEvent.click(screen.getByText('크로스페이드').closest('.effect-chip')!)
    expect(setEffects).toHaveBeenCalled()
  })
  it('"다음" 버튼 클릭 시 onNext가 호출된다', () => {
    const onNext = vi.fn()
    render(<Step2 {...base} onNext={onNext} />)
    fireEvent.click(screen.getByText('다음'))
    expect(onNext).toHaveBeenCalledTimes(1)
  })
})
