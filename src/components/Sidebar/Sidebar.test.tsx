import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Sidebar from './Sidebar'
import { sampleTracks } from '../../data/sampleTracks'

const base = { step: 1 as const, setStep: vi.fn(), tracks: sampleTracks }

describe('Sidebar', () => {
  it('"Spectra" 워드마크를 렌더링한다', () => {
    render(<Sidebar {...base} />)
    expect(screen.getByText('Spectra')).toBeInTheDocument()
  })
  it('"STUDIO" 서브텍스트를 렌더링한다', () => {
    render(<Sidebar {...base} />)
    expect(screen.getByText('STUDIO')).toBeInTheDocument()
  })
  it('3개의 워크플로우 단계를 렌더링한다', () => {
    render(<Sidebar {...base} />)
    expect(screen.getByText('미디어 준비')).toBeInTheDocument()
    expect(screen.getByText('비주얼 편집')).toBeInTheDocument()
    expect(screen.getByText('영상 출력')).toBeInTheDocument()
  })
  it('단계 클릭 시 setStep이 호출된다', () => {
    const setStep = vi.fn()
    render(<Sidebar {...base} setStep={setStep} />)
    fireEvent.click(screen.getByText('비주얼 편집').closest('button')!)
    expect(setStep).toHaveBeenCalledWith(2)
  })
  it('활성 단계에 rail-step--active 클래스가 붙는다', () => {
    render(<Sidebar {...base} step={1} />)
    expect(screen.getByText('미디어 준비').closest('button')).toHaveClass('rail-step--active')
  })
  it('완료된 단계에 rail-step--done 클래스가 붙는다', () => {
    render(<Sidebar {...base} step={2} />)
    expect(screen.getByText('미디어 준비').closest('button')).toHaveClass('rail-step--done')
  })
})
