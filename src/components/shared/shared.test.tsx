import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Button from './Button'
import SegmentedControl from './SegmentedControl'
import Switch from './Switch'

describe('Button', () => {
  it('기본 variant로 렌더링된다', () => {
    render(<Button>저장</Button>)
    expect(screen.getByRole('button', { name: '저장' })).toBeInTheDocument()
  })
  it('primary variant에 btn--primary 클래스를 가진다', () => {
    render(<Button variant="primary">출력</Button>)
    expect(screen.getByRole('button')).toHaveClass('btn--primary')
  })
  it('클릭 시 onClick이 호출된다', () => {
    const onClick = vi.fn()
    render(<Button onClick={onClick}>클릭</Button>)
    fireEvent.click(screen.getByRole('button'))
    expect(onClick).toHaveBeenCalledTimes(1)
  })
})

describe('SegmentedControl', () => {
  const options = [
    { value: 'a', label: 'A' },
    { value: 'b', label: 'B' },
    { value: 'c', label: 'C' },
  ]
  it('모든 옵션을 렌더링한다', () => {
    render(<SegmentedControl options={options} value="a" onChange={vi.fn()} />)
    expect(screen.getByText('A')).toBeInTheDocument()
    expect(screen.getByText('B')).toBeInTheDocument()
  })
  it('활성 옵션에 seg__opt--active 클래스가 붙는다', () => {
    render(<SegmentedControl options={options} value="b" onChange={vi.fn()} />)
    expect(screen.getByText('B').closest('button')).toHaveClass('seg__opt--active')
  })
  it('옵션 클릭 시 onChange가 값과 함께 호출된다', () => {
    const onChange = vi.fn()
    render(<SegmentedControl options={options} value="a" onChange={onChange} />)
    fireEvent.click(screen.getByText('C'))
    expect(onChange).toHaveBeenCalledWith('c')
  })
})

describe('Switch', () => {
  it('on=false일 때 switch--on 클래스가 없다', () => {
    const { container } = render(<Switch on={false} onChange={vi.fn()} />)
    expect(container.firstChild).not.toHaveClass('switch--on')
  })
  it('on=true일 때 switch--on 클래스가 있다', () => {
    const { container } = render(<Switch on={true} onChange={vi.fn()} />)
    expect(container.firstChild).toHaveClass('switch--on')
  })
  it('클릭 시 onChange(!on)이 호출된다', () => {
    const onChange = vi.fn()
    const { container } = render(<Switch on={false} onChange={onChange} />)
    fireEvent.click(container.firstChild!)
    expect(onChange).toHaveBeenCalledWith(true)
  })
})
