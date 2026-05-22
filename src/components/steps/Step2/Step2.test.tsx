// Step2 컴포넌트 테스트
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Step2 from './Step2'
import { sampleTracks } from '../../../data/sampleTracks'
import type { Background, LogoPosition } from '../../../types'

const base = {
  tracks: sampleTracks,
  theme: 'midnight',
  setTheme: vi.fn(),
  effects: { vis: true, crossfade: false, ducking: true, blur: true },
  setEffects: vi.fn(),
  visualizer: { type: 'bars' as const, intensity: 70, opacity: 85, position: 'bottom' as const, size: 50 },
  setVisualizer: vi.fn(),
  typography: { titleSize: 48, letterSpacing: -15 },
  setTypography: vi.fn(),
  onBack: vi.fn(),
  onNext: vi.fn(),
  playingId: null as string | null,
  isPlaying: false,
  onPlay: vi.fn(),
  onPause: vi.fn(),
  onSkipNext: vi.fn(),
  onSkipPrev: vi.fn(),
  background: { type: 'gradient' } as Background,
  logo: undefined as string | undefined,
  logoPosition: { x: 85, y: 8 } as LogoPosition,
  setLogoPosition: vi.fn(),
  logoSize: 52,
  setLogoSize: vi.fn(),
  currentTime: 0,
  analyserRef: { current: null },
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

  it('타임라인 클립 클릭 시 onPlay가 해당 트랙 id로 호출된다', () => {
    const onPlay = vi.fn()
    render(<Step2 {...base} onPlay={onPlay} />)
    const clips = document.querySelectorAll('.s2-clip')
    fireEvent.click(clips[1])
    expect(onPlay).toHaveBeenCalledWith(sampleTracks[1].id)
  })

  it('스테이지 재생 버튼 클릭 시 onPlay가 playingTrack.id로 호출된다 (재생 중 아닐 때)', () => {
    const onPlay = vi.fn()
    render(<Step2 {...base} onPlay={onPlay} isPlaying={false} playingId={null} />)
    fireEvent.click(document.querySelector('.s2-play-btn')!)
    expect(onPlay).toHaveBeenCalledWith(sampleTracks[0].id)
  })

  it('스테이지 재생 버튼 클릭 시 onPause가 호출된다 (재생 중일 때)', () => {
    const onPause = vi.fn()
    render(<Step2 {...base} onPause={onPause} isPlaying={true} playingId={sampleTracks[0].id} />)
    fireEvent.click(document.querySelector('.s2-play-btn')!)
    expect(onPause).toHaveBeenCalledTimes(1)
  })

  it('스테이지 스킵 이전 버튼 클릭 시 onSkipPrev가 호출된다', () => {
    const onSkipPrev = vi.fn()
    render(<Step2 {...base} onSkipPrev={onSkipPrev} />)
    fireEvent.click(screen.getByTestId('stage-skip-prev'))
    expect(onSkipPrev).toHaveBeenCalledTimes(1)
  })

  it('스테이지 스킵 다음 버튼 클릭 시 onSkipNext가 호출된다', () => {
    const onSkipNext = vi.fn()
    render(<Step2 {...base} onSkipNext={onSkipNext} />)
    fireEvent.click(screen.getByTestId('stage-skip-next'))
    expect(onSkipNext).toHaveBeenCalledTimes(1)
  })

  it('currentTime이 타임코드에 MM:SS 형식으로 표시된다', () => {
    render(<Step2 {...base} currentTime={90} />)
    expect(screen.getByText(/01:30/)).toBeInTheDocument()
  })

  it('typography.titleSize가 스테이지 제목 font-size에 반영된다', () => {
    render(<Step2 {...base} typography={{ titleSize: 60, letterSpacing: -15 }} />)
    const title = document.querySelector('.s2-frame__title') as HTMLElement
    expect(title.style.fontSize).toBe('60px')
  })

  it('typography.letterSpacing이 스테이지 제목 letter-spacing에 반영된다', () => {
    render(<Step2 {...base} typography={{ titleSize: 48, letterSpacing: 20 }} />)
    const title = document.querySelector('.s2-frame__title') as HTMLElement
    expect(title.style.letterSpacing).toBe('0.02em')
  })

  it('visualizer.type이 wave일 때 SVG 파형이 렌더링된다', () => {
    render(<Step2 {...base} visualizer={{ type: 'wave', intensity: 70, opacity: 85 }} />)
    expect(document.querySelector('.s2-frame__wave-svg')).toBeInTheDocument()
  })

  it('visualizer.type이 orb일 때 orb 컨테이너가 렌더링된다', () => {
    render(<Step2 {...base} visualizer={{ type: 'orb', intensity: 70, opacity: 85 }} />)
    expect(document.querySelector('.s2-frame__orb')).toBeInTheDocument()
  })

  it('effects.vis가 false일 때 비주얼라이저가 렌더링되지 않는다', () => {
    render(<Step2 {...base} effects={{ vis: false, crossfade: false, ducking: true, blur: false }} />)
    expect(document.querySelector('.s2-frame__wave')).not.toBeInTheDocument()
    expect(document.querySelector('.s2-frame__orb')).not.toBeInTheDocument()
  })

  it('effects.blur가 true일 때 blur overlay가 렌더링된다', () => {
    render(<Step2 {...base} effects={{ vis: true, crossfade: false, ducking: true, blur: true }} />)
    expect(document.querySelector('.s2-frame__blur-overlay')).toBeInTheDocument()
  })
})
