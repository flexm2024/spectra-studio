// Step2 컴포넌트 테스트
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Step2 from './Step2'
import { sampleTracks } from '../../../data/sampleTracks'
import type { Background, LogoPosition, TitleBaseStyle, TitleDecoStyle, TitlePositionPreset } from '../../../types'

const base = {
  tracks: sampleTracks,
  theme: 'midnight',
  setTheme: vi.fn(),
  effects: { vis: true, crossfade: false, ducking: true, blur: true },
  setEffects: vi.fn(),
  visualizer: { type: 'bars' as const, intensity: 70, opacity: 85, y: 75, size: 50, width: 85, color: 'rainbow' },
  setVisualizer: vi.fn(),
  typography: {
    titleSize: 48,
    letterSpacing: -15,
    titlePosition: { x: 50, y: 48 },
    subPosition: { x: 50, y: 55 },
    showTitle: true,
    showSub: true,
    subSize: 18,
    subLetterSpacing: 0,
    titleStyle: 'minimal' as const,
    titleDeco: 'none' as const,
    titleFont: 'inter',
    titlePositionPreset: 'bc' as const,
    titleCaptionTop: '',
    titleCaptionBottom: '',
    titleSubOffset: 0,
  },
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
  onSeek: vi.fn(),
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
    fireEvent.click(screen.getByRole('button', { name: '효과' }))
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
    render(<Step2 {...base} typography={{ ...base.typography, titleSize: 60 }} />)
    const title = document.querySelector('.s2-frame__title') as HTMLElement
    expect(title.style.fontSize).toBe('60px')
  })

  it('typography.letterSpacing이 스테이지 제목 letter-spacing에 반영된다', () => {
    render(<Step2 {...base} typography={{ ...base.typography, letterSpacing: 20 }} />)
    const title = document.querySelector('.s2-frame__title') as HTMLElement
    expect(title.style.letterSpacing).toBe('0.02em')
  })

  it('visualizer.type이 bars일 때 wave-svg가 렌더링된다', () => {
    render(<Step2 {...base} visualizer={{ type: 'bars', intensity: 70, opacity: 85, y: 75, size: 50, width: 85, color: '#00d4ff' }} />)
    expect(document.querySelector('.s2-frame__wave-svg')).toBeInTheDocument()
  })

  it('visualizer.type이 glow일 때 bars-canvas가 렌더링된다', () => {
    render(<Step2 {...base} visualizer={{ type: 'glow', intensity: 70, opacity: 85, y: 75, size: 50, width: 85, color: '#00d4ff' }} />)
    expect(document.querySelector('.s2-frame__bars-canvas')).toBeInTheDocument()
  })

  it('visualizer.type이 peak일 때 bars-canvas가 렌더링된다', () => {
    render(<Step2 {...base} visualizer={{ type: 'peak', intensity: 70, opacity: 85, y: 75, size: 50, width: 85, color: '#00d4ff' }} />)
    expect(document.querySelector('.s2-frame__bars-canvas')).toBeInTheDocument()
  })

  it('effects.vis가 false일 때 비주얼라이저가 렌더링되지 않는다', () => {
    render(<Step2 {...base} effects={{ vis: false, crossfade: false, ducking: true, blur: false }} />)
    expect(document.querySelector('.s2-frame__wave')).not.toBeInTheDocument()
    expect(document.querySelector('.s2-frame__bars-canvas')).not.toBeInTheDocument()
  })

  it('effects.blur가 true일 때 blur overlay가 렌더링된다', () => {
    render(<Step2 {...base} effects={{ vis: true, crossfade: false, ducking: true, blur: true }} />)
    expect(document.querySelector('.s2-frame__blur-overlay')).toBeInTheDocument()
  })

  it('bars 타입 렌더링 시 SVG rect에 fill 색상이 적용된다', () => {
    render(<Step2 {...base} />)
    const firstRect = document.querySelector('.s2-frame__wave-svg rect') as SVGRectElement
    expect(firstRect).toBeInTheDocument()
    expect(firstRect.getAttribute('fill')).toMatch(/hsl/)
  })

  it('particle 타입 렌더링 시 particle canvas가 렌더링된다', () => {
    render(<Step2 {...base} visualizer={{ type: 'particle', intensity: 70, opacity: 85, y: 75, size: 50, width: 85, color: '#00d4ff' }} />)
    expect(document.querySelector('.s2-frame__particle-canvas')).toBeInTheDocument()
  })

  // --- 타이틀 탭 테스트 ---

  it('"타이틀" 탭 버튼이 렌더링된다', () => {
    render(<Step2 {...base} />)
    expect(screen.getByRole('button', { name: '타이틀' })).toBeInTheDocument()
  })

  it('"타이틀" 탭 클릭 시 기본 스타일 섹션이 표시된다', () => {
    render(<Step2 {...base} />)
    fireEvent.click(screen.getByRole('button', { name: '타이틀' }))
    expect(screen.getByText('기본 스타일')).toBeInTheDocument()
  })

  it('"효과" 탭 클릭 시 크로스페이드 효과 칩이 표시된다', () => {
    render(<Step2 {...base} />)
    fireEvent.click(screen.getByRole('button', { name: '타이틀' }))
    fireEvent.click(screen.getByRole('button', { name: '효과' }))
    expect(screen.getByText('크로스페이드')).toBeInTheDocument()
  })

  it('기본 스타일 버튼 클릭 시 setTypography가 titleStyle로 호출된다', () => {
    const setTypography = vi.fn()
    render(<Step2 {...base} setTypography={setTypography} />)
    fireEvent.click(screen.getByRole('button', { name: '타이틀' }))
    fireEvent.click(screen.getByRole('button', { name: '네온' }))
    expect(setTypography).toHaveBeenCalled()
    const updater = setTypography.mock.calls[0][0]
    const result = typeof updater === 'function' ? updater(base.typography) : updater
    expect(result.titleStyle).toBe('neon')
  })

  it('이미 선택된 데코 스타일을 다시 클릭하면 titleDeco가 none으로 해제된다', () => {
    const setTypography = vi.fn()
    const typo = { ...base.typography, titleDeco: 'divider' as TitleDecoStyle }
    render(<Step2 {...base} typography={typo} setTypography={setTypography} />)
    fireEvent.click(screen.getByRole('button', { name: '타이틀' }))
    fireEvent.click(screen.getByRole('button', { name: '디바이더' }))
    const updater = setTypography.mock.calls[0][0]
    const result = typeof updater === 'function' ? updater(typo) : updater
    expect(result.titleDeco).toBe('none')
  })

  it('titleDeco가 caption일 때 캡션 입력 필드가 표시된다', () => {
    const typo = { ...base.typography, titleDeco: 'caption' as TitleDecoStyle }
    render(<Step2 {...base} typography={typo} />)
    fireEvent.click(screen.getByRole('button', { name: '타이틀' }))
    expect(screen.getByPlaceholderText('상단 캡션')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('하단 캡션')).toBeInTheDocument()
  })

  it('titleDeco가 none일 때 캡션 입력 필드가 표시되지 않는다', () => {
    render(<Step2 {...base} />)
    fireEvent.click(screen.getByRole('button', { name: '타이틀' }))
    expect(screen.queryByPlaceholderText('상단 캡션')).not.toBeInTheDocument()
  })

  it('폰트 버튼 클릭 시 setTypography가 titleFont로 호출된다', () => {
    const setTypography = vi.fn()
    render(<Step2 {...base} setTypography={setTypography} />)
    fireEvent.click(screen.getByRole('button', { name: '타이틀' }))
    fireEvent.click(screen.getByRole('button', { name: '가나 주아체' }))
    const updater = setTypography.mock.calls[0][0]
    const result = typeof updater === 'function' ? updater(base.typography) : updater
    expect(result.titleFont).toBe('jua')
  })

  it('위치 bc 버튼 클릭 시 titlePosition이 {x:50, y:80}으로 설정된다', () => {
    const setTypography = vi.fn()
    render(<Step2 {...base} setTypography={setTypography} />)
    fireEvent.click(screen.getByRole('button', { name: '타이틀' }))
    fireEvent.click(document.querySelector('.title-pos-btn[data-preset="bc"]')!)
    const updater = setTypography.mock.calls[0][0]
    const result = typeof updater === 'function' ? updater(base.typography) : updater
    expect(result.titlePosition).toEqual({ x: 50, y: 80 })
    expect(result.titlePositionPreset).toBe('bc')
  })

  it('titleStyle이 neon일 때 스테이지에 title-style-neon 클래스가 있다', () => {
    const typo = { ...base.typography, titleStyle: 'neon' as TitleBaseStyle }
    render(<Step2 {...base} typography={typo} />)
    expect(document.querySelector('.title-style-neon')).toBeInTheDocument()
  })

  it('titleDeco가 divider일 때 스테이지에 title-deco-divider 클래스가 있다', () => {
    const typo = { ...base.typography, titleDeco: 'divider' as TitleDecoStyle }
    render(<Step2 {...base} typography={typo} />)
    expect(document.querySelector('.title-deco-divider')).toBeInTheDocument()
  })

  it('titleSize가 48일 때 s2-frame__title의 font-size가 48px가 된다', () => {
    const typo = { ...base.typography, titleSize: 48 }
    render(<Step2 {...base} typography={typo} />)
    const title = document.querySelector('.s2-frame__title') as HTMLElement
    expect(title.style.fontSize).toBe('48px')
  })
})
