// 앱 루트 — 전체 상태 관리 및 레이아웃 조합
import { useState, useRef } from 'react'
import type { Track, Background, Effects, Visualizer, Typography, ExportSettings, LogoPosition } from './types'
import Sidebar from './components/Sidebar/Sidebar'
import Header from './components/Header/Header'
import StatusBar from './components/StatusBar/StatusBar'
import Step1 from './components/steps/Step1/Step1'
import Step2 from './components/steps/Step2/Step2'
import Step3 from './components/steps/Step3/Step3'

export default function App() {
  const audioRef = useRef<HTMLAudioElement>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [tracks, setTracks] = useState<Track[]>([])
  const [playingId, setPlayingId] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [loops, setLoops] = useState<1 | 2 | 3>(1)
  const [quality, setQuality] = useState<'96k' | '128k' | '192k'>('192k')
  const [theme, setTheme] = useState('midnight')
  const [effects, setEffects] = useState<Effects>({ vis: true, crossfade: false, ducking: true, blur: true })
  const [visualizer, setVisualizer] = useState<Visualizer>({ type: 'bars', intensity: 70, opacity: 85, y: 75, size: 50 })
  const [typography, setTypography] = useState<Typography>({ titleSize: 48, letterSpacing: -15 })
  const [exportSettings, setExportSettings] = useState<ExportSettings>({
    filename: 'my-playlist',
    format: 'mp4',
    resolution: '1080p',
    thumbnail: true,
    chapters: false,
  })
  const [background, setBackground] = useState<Background>({ type: 'gradient' })
  const [logo, setLogo] = useState<string | undefined>(undefined)
  const [logoPosition, setLogoPosition] = useState<LogoPosition>({ x: 85, y: 8 })
  const [logoSize, setLogoSize] = useState(52)
  const [watermark, setWatermark] = useState<string | undefined>(undefined)
  const [stickers, setStickers] = useState<string[]>([])
  const [audioCurrentTime, setAudioCurrentTime] = useState(0)

  function ensureAudioContext() {
    if (analyserRef.current || !audioRef.current) return
    try {
      const ctx = new AudioContext()
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 256
      const source = ctx.createMediaElementSource(audioRef.current)
      source.connect(analyser)
      analyser.connect(ctx.destination)
      audioCtxRef.current = ctx
      analyserRef.current = analyser
    } catch {
      // AudioContext 미지원 환경 (테스트 등) 무시
    }
  }

  const onPlay = (id: string) => {
    ensureAudioContext()
    const track = tracks.find(t => t.id === id)
    setPlayingId(id)
    if (track?.audioUrl && audioRef.current) {
      if (audioRef.current.src !== track.audioUrl) {
        audioRef.current.src = track.audioUrl
      }
      audioRef.current.play().catch(() => setIsPlaying(false))
    } else {
      setIsPlaying(true)
    }
  }

  const onPause = () => {
    audioRef.current?.pause()
    setIsPlaying(false)
  }

  const onSkipNext = () => {
    if (playingId === null) return
    const idx = tracks.findIndex(t => t.id === playingId)
    const next = tracks[idx + 1]
    if (next) onPlay(next.id)
  }

  const onSkipPrev = () => {
    if (audioRef.current && audioRef.current.currentTime > 2) {
      audioRef.current.currentTime = 0
      return
    }
    if (playingId === null) return
    const idx = tracks.findIndex(t => t.id === playingId)
    const prev = tracks[idx - 1]
    if (prev) onPlay(prev.id)
  }

  const handleTrackEnded = () => onSkipNext()

  return (
    <div className="app">
      <audio
        ref={audioRef}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={handleTrackEnded}
        onTimeUpdate={e => setAudioCurrentTime(e.currentTarget.currentTime)}
      />
      <Sidebar step={step} setStep={setStep} tracks={tracks} />
      <Header step={step} setStep={setStep} />
      <main className="main">
        {step === 1 && (
          <Step1
            tracks={tracks}
            setTracks={setTracks}
            playingId={playingId}
            isPlaying={isPlaying}
            loops={loops}
            setLoops={setLoops}
            quality={quality}
            setQuality={setQuality}
            onPlay={onPlay}
            onPause={onPause}
            onSkipNext={onSkipNext}
            onSkipPrev={onSkipPrev}
            onNext={() => setStep(2)}
            background={background}
            setBackground={setBackground}
            logo={logo}
            setLogo={setLogo}
            watermark={watermark}
            setWatermark={setWatermark}
            stickers={stickers}
            setStickers={setStickers}
            currentTime={audioCurrentTime}
          />
        )}
        {step === 2 && (
          <Step2
            tracks={tracks}
            theme={theme}
            setTheme={setTheme}
            effects={effects}
            setEffects={setEffects}
            visualizer={visualizer}
            setVisualizer={setVisualizer}
            typography={typography}
            setTypography={setTypography}
            playingId={playingId}
            isPlaying={isPlaying}
            onPlay={onPlay}
            onPause={onPause}
            onSkipNext={onSkipNext}
            onSkipPrev={onSkipPrev}
            onBack={() => setStep(1)}
            onNext={() => setStep(3)}
            background={background}
            logo={logo}
            logoPosition={logoPosition}
            setLogoPosition={setLogoPosition}
            logoSize={logoSize}
            setLogoSize={setLogoSize}
            currentTime={audioCurrentTime}
            analyserRef={analyserRef}
          />
        )}
        {step === 3 && (
          <Step3
            tracks={tracks}
            theme={theme}
            effects={effects}
            visualizer={visualizer}
            exportSettings={exportSettings}
            setExportSettings={setExportSettings}
            loops={loops}
            quality={quality}
            onBack={() => setStep(2)}
            background={background}
            logo={logo}
            logoPosition={logoPosition}
            logoSize={logoSize}
            watermark={watermark}
            stickers={stickers}
            typography={typography}
          />
        )}
      </main>
      <StatusBar tracks={tracks} />
    </div>
  )
}
