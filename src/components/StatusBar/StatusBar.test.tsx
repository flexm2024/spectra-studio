// StatusBar 컴포넌트 테스트
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import StatusBar from './StatusBar'
import { sampleTracks } from '../../data/sampleTracks'

describe('StatusBar', () => {
  it('트랙 수를 표시한다', () => {
    render(<StatusBar tracks={sampleTracks} />)
    expect(screen.getByText('15')).toBeInTheDocument()
  })
  it('총 길이를 계산해 표시한다', () => {
    render(<StatusBar tracks={sampleTracks} />)
    expect(screen.getByText(/^\d+:\d{2}$/)).toBeInTheDocument()
  })
  it('"다음 단계" 힌트를 표시한다', () => {
    render(<StatusBar tracks={sampleTracks} />)
    expect(screen.getByText('다음 단계')).toBeInTheDocument()
  })
})
