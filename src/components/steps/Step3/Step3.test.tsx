// Step3 컴포넌트 테스트
import { beforeAll, afterAll, describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Step3 from './Step3'
import { sampleTracks } from '../../../data/sampleTracks'
import type { Background, LogoPosition, Typography } from '../../../types'
import { renderVideo } from '../../../lib/renderer'

vi.mock('../../../lib/renderer', () => ({
  renderVideo: vi.fn().mockResolvedValue(new Blob(['fake'], { type: 'video/mp4' })),
}))

// WebCodecs API는 jsdom에서 미지원 — 렌더링 테스트가 작동하도록 스텁
beforeAll(() => {
  vi.stubGlobal('VideoEncoder', class {})
  vi.stubGlobal('AudioEncoder', class {})
  vi.stubGlobal('OffscreenCanvas', class {})
})
afterAll(() => {
  vi.unstubAllGlobals()
})

const base = {
  tracks: sampleTracks,
  theme: 'midnight',
  effects: { vis: true, crossfade: false, ducking: true, blur: true },
  visualizer: { type: 'bars' as const, intensity: 70, opacity: 85, y: 75, size: 50, width: 85, color: 'rainbow' },
  exportSettings: {
    filename: 'my-playlist',
    resolution: '1080p' as const,
  },
  loops: 1 as const,
  setLoops: vi.fn(),
  quality: '192k' as const,
  setQuality: vi.fn(),
  setExportSettings: vi.fn(),
  onBack: vi.fn(),
  background: { type: 'gradient' } as Background,
  logoPosition: { x: 85, y: 8 } as LogoPosition,
  logoSize: 52,
  stickers: [] as string[],
  typography: { titleSize: 48, letterSpacing: -15, titlePosition: { x: 50, y: 48 }, subPosition: { x: 50, y: 55 }, showTitle: true, showSub: true, subSize: 18, subLetterSpacing: 0 } as Typography,
}

describe('Step3', () => {
  it('"영상 출력" 제목을 렌더링한다', () => {
    render(<Step3 {...base} />)
    expect(screen.getByText('영상 출력')).toBeInTheDocument()
  })
  it('트랙 수 통계를 표시한다', () => {
    render(<Step3 {...base} />)
    expect(screen.getByText('15')).toBeInTheDocument()
  })
  it('총 길이를 계산해 분:초 형식으로 표시한다', () => {
    render(<Step3 {...base} />)
    expect(screen.getByText(/^\d+:\d{2}$/, { selector: '.s3-stat__value' })).toBeInTheDocument()
  })
  it('"렌더링 시작" 클릭 시 렌더링 진행 UI가 표시된다', () => {
    render(<Step3 {...base} />)
    fireEvent.click(screen.getByText(/렌더링 시작/))
    expect(screen.getByText(/렌더링 중\.\.\./)).toBeInTheDocument()
  })
  it('"편집으로 돌아가기" 클릭 시 onBack이 호출된다', () => {
    const onBack = vi.fn()
    render(<Step3 {...base} onBack={onBack} />)
    fireEvent.click(screen.getByText('편집으로 돌아가기'))
    expect(onBack).toHaveBeenCalledTimes(1)
  })
  it('loops prop이 반복 횟수 표시에 반영된다', () => {
    render(<Step3 {...base} loops={3} />)
    expect(screen.getByText('반복 3회')).toBeInTheDocument()
  })
  it('quality prop이 오디오 설정 요약에 반영된다', () => {
    render(<Step3 {...base} quality="96k" />)
    expect(screen.getByText(/96 kbps/)).toBeInTheDocument()
  })
describe('Step3 새 props 수용', () => {
    const baseV2 = { ...base }

    it('background prop을 받아도 정상 렌더링된다', () => {
      render(<Step3 {...baseV2} />)
      expect(screen.getByText('영상 출력')).toBeInTheDocument()
    })

    it('logo prop을 받아도 정상 렌더링된다', () => {
      render(<Step3 {...baseV2} logo="blob:fake" />)
      expect(screen.getByText('영상 출력')).toBeInTheDocument()
    })
  })

  describe('Step3 렌더링 연결', () => {
    it('"렌더링 시작" 클릭 시 renderVideo가 올바른 인자로 호출된다', async () => {
      render(<Step3 {...base} />)
      fireEvent.click(screen.getByText(/렌더링 시작/))
      await vi.waitFor(() => {
        expect(renderVideo).toHaveBeenCalledWith(
          expect.objectContaining({ tracks: base.tracks }),
          expect.any(Function),
          expect.any(Function),
        )
      })
    })

    it('렌더링 완료 시 "렌더링 완료" 메시지가 표시된다', async () => {
      render(<Step3 {...base} />)
      fireEvent.click(screen.getByText(/렌더링 시작/))
      await screen.findByText(/렌더링 완료/)
    })
  })
})
