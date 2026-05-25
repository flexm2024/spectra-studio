// Header 컴포넌트 단위 테스트
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Header from './Header'

const base = { step: 1 as const, setStep: vi.fn(), onSave: vi.fn(), onExport: vi.fn() }

describe('Header', () => {
  it('"플레이리스트 영상 만들기"를 표시한다', () => {
    render(<Header {...base} />)
    expect(screen.getByText('플레이리스트 영상 만들기')).toBeInTheDocument()
  })
  it('3개의 단계 알약을 표시한다', () => {
    render(<Header {...base} />)
    expect(screen.getByText('미디어 준비')).toBeInTheDocument()
    expect(screen.getByText('비주얼 편집')).toBeInTheDocument()
    expect(screen.getByText('영상 출력')).toBeInTheDocument()
  })
  it('활성 단계 알약에 step-pill--active 클래스가 붙는다', () => {
    render(<Header step={2} setStep={vi.fn()} onSave={vi.fn()} onExport={vi.fn()} />)
    expect(screen.getByText('비주얼 편집').closest('button')).toHaveClass('step-pill--active')
  })
  it('단계 알약 클릭 시 setStep이 호출된다', () => {
    const setStep = vi.fn()
    render(<Header step={1} setStep={setStep} onSave={vi.fn()} onExport={vi.fn()} />)
    fireEvent.click(screen.getByText('영상 출력').closest('button')!)
    expect(setStep).toHaveBeenCalledWith(3)
  })
})
