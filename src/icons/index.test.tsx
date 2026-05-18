import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import Icon from './index'

describe('Icon', () => {
  it('알려진 아이콘을 SVG로 렌더링한다', () => {
    const { container } = render(<Icon name="logo" />)
    expect(container.querySelector('svg')).toBeTruthy()
  })
  it('size prop이 width/height에 반영된다', () => {
    const { container } = render(<Icon name="play" size={20} />)
    expect(container.querySelector('svg')!.getAttribute('width')).toBe('20')
  })
  it('알 수 없는 이름은 빈 SVG를 반환한다', () => {
    const { container } = render(<Icon name="nonexistent" />)
    expect(container.querySelector('svg')).toBeTruthy()
  })
})
