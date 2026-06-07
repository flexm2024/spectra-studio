// 앱 루트 — 전체 상태 관리 및 레이아웃 조합
import { useState, useRef, useEffect } from 'react'
import type { Track, Background, Effects, Visualizer, Typography, ExportSettings, LogoPosition, ParticleOverlay } from './types'
import type { ProjectSnapshot, SavedProject } from './types'
import { saveProject, getProject, getCurrentId, setCurrentId, exportSpectraFile, parseSpectraFile } from './lib/projectStorage'
import Sidebar from './components/Sidebar/Sidebar'
import Header from './components/Header/Header'
import StatusBar from './components/StatusBar/StatusBar'
import Step1 from './components/steps/Step1/Step1'
import Step2 from './components/steps/Step2/Step2'
import Step3 from './components/steps/Step3/Step3'
import ProjectModal from './components/ProjectModal/ProjectModal'

const DEFAULT_PARTICLE_OVERLAY: ParticleOverlay = {
  enabled: false,
  type: 'snow',
  intensity: 50,
  speed: 50,
  size: 50,
  opacity: 70,
  color: 'rainbow',
}

function loadInitialProject(): { id: string; name: string; snapshot: ProjectSnapshot | null } {
  try {
    const currentId = getCurrentId()
    if (currentId) {
      const project = getProject(currentId)
      if (project) return { id: project.id, name: project.name, snapshot: project.snapshot }
    }
  } catch { /* localStorage 접근 불가 환경 */ }
  return { id: crypto.randomUUID(), name: '새 프로젝트', snapshot: null }
}

async function blobUrlToBase64(url: string): Promise<string> {
  const resp = await fetch(url)
  const blob = await resp.blob()
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

export default function App() {
  const _initRef = useRef<ReturnType<typeof loadInitialProject> | null>(null)
  if (_initRef.current === null) _initRef.current = loadInitialProject()
  const _init = _initRef.current

  const [projectId, setProjectId] = useState(_init.id)
  const [projectName, setProjectName] = useState(_init.name)
  const [lastSaved, setLastSaved] = useState<number | null>(null)
  const [projectModalOpen, setProjectModalOpen] = useState(false)

  const audioRef = useRef<HTMLAudioElement>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [tracks, setTracks] = useState<Track[]>(
    _init.snapshot?.tracks.map(t => ({ ...t, src: '', audioUrl: undefined })) ?? []
  )
  const [playingId, setPlayingId] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [loops, setLoops] = useState<1 | 2 | 3>(_init.snapshot?.loops ?? 1)
  const [quality, setQuality] = useState<'96k' | '128k' | '192k'>(_init.snapshot?.quality ?? '192k')
  const [theme, setTheme] = useState(_init.snapshot?.theme ?? 'midnight')
  const [effects, setEffects] = useState<Effects>(_init.snapshot?.effects ?? { vis: true, crossfade: false, ducking: true, blur: true })
  const [visualizer, setVisualizer] = useState<Visualizer>(_init.snapshot?.visualizer ?? { type: 'bars', intensity: 70, opacity: 85, y: 75, size: 50, width: 100, color: 'rainbow' })
  const [typography, setTypography] = useState<Typography>(_init.snapshot?.typography ?? {
    titleSize: 20,
    letterSpacing: -15,
    titlePosition: { x: 50, y: 48 },
    subPosition: { x: 50, y: 55 },
    showTitle: true,
    showSub: true,
    subSize: 18,
    subLetterSpacing: 0,
    titleStyle: 'minimal',
    titleDeco: 'none',
    titleFont: 'inter',
    titlePositionPreset: 'bc',
    titleCaptionTop: '',
    titleCaptionBottom: '',
    titleAlign: 'center' as const,
  })
  const [exportSettings, setExportSettings] = useState<ExportSettings>(_init.snapshot?.exportSettings ?? {
    filename: 'my-playlist',
    resolution: '1080p',
  })
  const [background, setBackground] = useState<Background>(_init.snapshot?.background ?? { type: 'gradient' })
  const [logo, setLogo] = useState<string | undefined>(undefined)
  const [logoPosition, setLogoPosition] = useState<LogoPosition>(_init.snapshot?.logoPosition ?? { x: 8, y: 8 })
  const [logoSize, setLogoSize] = useState(_init.snapshot?.logoSize ?? 52)
  const [particleOverlay, setParticleOverlay] = useState<ParticleOverlay>(
    _init.snapshot?.particleOverlay ?? DEFAULT_PARTICLE_OVERLAY
  )
  const [watermark, setWatermark] = useState<string | undefined>(undefined)
  const [stickers, setStickers] = useState<string[]>([])
  const [audioCurrentTime, setAudioCurrentTime] = useState(0)
  const [pendingExport, setPendingExport] = useState(false)

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      const snapshot: ProjectSnapshot = {
        theme, effects, visualizer, typography, exportSettings, loops, quality, background,
        logoPosition, logoSize, particleOverlay,
        tracks: tracks.map(({ id, title, artist, duration, durationSec, tag, bpm, waveform }) =>
          ({ id, title, artist, duration, durationSec, tag, bpm, waveform })
        ),
      }
      const now = Date.now()
      const existing = getProject(projectId)
      const project: SavedProject = {
        id: projectId,
        name: projectName,
        createdAt: existing?.createdAt ?? now,
        updatedAt: now,
        snapshot,
      }
      saveProject(project)
      setCurrentId(projectId)
      setLastSaved(now)
    }, 1000)
    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current) }
  }, [theme, effects, visualizer, typography, exportSettings, loops, quality, background, logoPosition, logoSize, particleOverlay, tracks, projectId, projectName])

  const goToStep = (n: 1 | 2 | 3) => {
    if (n === 3) onPause()
    setStep(n)
  }

  const handleSave = () => {
    const data = { theme, effects, visualizer, typography, exportSettings, loops, quality }
    const json = JSON.stringify(data, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${exportSettings.filename}.spectra.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    setTimeout(() => URL.revokeObjectURL(url), 60_000)
  }

  function handleLoadProject(id: string) {
    const project = getProject(id)
    if (!project) return
    const { snapshot } = project
    onPause()
    setProjectId(project.id)
    setProjectName(project.name)
    setTheme(snapshot.theme)
    setEffects(snapshot.effects)
    setVisualizer(snapshot.visualizer)
    setTypography(snapshot.typography)
    setExportSettings(snapshot.exportSettings)
    setLoops(snapshot.loops)
    setQuality(snapshot.quality)
    setBackground(snapshot.background)
    setLogoPosition(snapshot.logoPosition)
    setLogoSize(snapshot.logoSize)
    setParticleOverlay(snapshot.particleOverlay ?? DEFAULT_PARTICLE_OVERLAY)
    setTracks(snapshot.tracks.map(t => ({ ...t, src: '', audioUrl: undefined })))
    setLogo(undefined)
    setWatermark(undefined)
    setStickers([])
    setCurrentId(id)
    setLastSaved(project.updatedAt)
    setProjectModalOpen(false)
    setStep(1)
  }

  function handleNewProject() {
    const newId = crypto.randomUUID()
    onPause()
    setProjectId(newId)
    setProjectName('새 프로젝트')
    setTheme('midnight')
    setEffects({ vis: true, crossfade: false, ducking: true, blur: true })
    setVisualizer({ type: 'bars', intensity: 70, opacity: 85, y: 75, size: 50, width: 100, color: 'rainbow' })
    setTypography({ titleSize: 20, letterSpacing: -15, titlePosition: { x: 50, y: 48 }, subPosition: { x: 50, y: 55 }, showTitle: true, showSub: true, subSize: 18, subLetterSpacing: 0, titleStyle: 'minimal', titleDeco: 'none', titleFont: 'inter', titlePositionPreset: 'bc', titleCaptionTop: '', titleCaptionBottom: '', titleAlign: 'center' as const, })
    setExportSettings({ filename: 'my-playlist', resolution: '1080p' })
    setLoops(1)
    setQuality('192k')
    setBackground({ type: 'gradient' })
    setLogoPosition({ x: 8, y: 8 })
    setLogoSize(52)
    setParticleOverlay(DEFAULT_PARTICLE_OVERLAY)
    setTracks([])
    setLogo(undefined)
    setWatermark(undefined)
    setStickers([])
    setCurrentId(newId)
    setLastSaved(null)
    setProjectModalOpen(false)
    setStep(1)
  }

  async function handleExportFile() {
    const existing = getProject(projectId)
    if (!existing) return
    const audioTracks: { id: string; audioBase64: string }[] = []
    for (const track of tracks) {
      if (track.audioUrl) {
        audioTracks.push({ id: track.id, audioBase64: await blobUrlToBase64(track.audioUrl) })
      }
    }
    const [logoBase64, watermarkBase64, backgroundBase64] = await Promise.all([
      logo ? blobUrlToBase64(logo) : Promise.resolve(undefined),
      watermark ? blobUrlToBase64(watermark) : Promise.resolve(undefined),
      background.src ? blobUrlToBase64(background.src) : Promise.resolve(undefined),
    ])
    const blob = exportSpectraFile(existing, audioTracks, logoBase64, watermarkBase64, backgroundBase64)
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${projectName}.spectra`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    setTimeout(() => URL.revokeObjectURL(url), 60_000)
  }

  async function handleImportFile(file: File) {
    try {
      const { project, audioUrls, logoBase64, watermarkBase64, backgroundBase64 } = await parseSpectraFile(file)
      const { snapshot } = project

      function base64ToBlobUrl(b64: string): string {
        const arr = b64.split(',')
        const mime = arr[0].match(/:(.*?);/)?.[1] ?? 'application/octet-stream'
        const bstr = atob(arr[1])
        const ab = new ArrayBuffer(bstr.length)
        const ia = new Uint8Array(ab)
        for (let i = 0; i < bstr.length; i++) ia[i] = bstr.charCodeAt(i)
        return URL.createObjectURL(new Blob([ab], { type: mime }))
      }

      onPause()
      setProjectId(project.id)
      setProjectName(project.name)
      setTheme(snapshot.theme)
      setEffects(snapshot.effects)
      setVisualizer(snapshot.visualizer)
      setTypography(snapshot.typography)
      setExportSettings(snapshot.exportSettings)
      setLoops(snapshot.loops)
      setQuality(snapshot.quality)
      setBackground({
        ...snapshot.background,
        src: backgroundBase64 ? base64ToBlobUrl(backgroundBase64) : undefined,
      })
      setLogoPosition(snapshot.logoPosition)
      setLogoSize(snapshot.logoSize)
      setParticleOverlay(snapshot.particleOverlay ?? DEFAULT_PARTICLE_OVERLAY)
      setTracks(snapshot.tracks.map(t => ({
        ...t, src: '',
        audioUrl: audioUrls.has(t.id) ? base64ToBlobUrl(audioUrls.get(t.id)!) : undefined,
      })))
      setLogo(logoBase64 ? base64ToBlobUrl(logoBase64) : undefined)
      setWatermark(watermarkBase64 ? base64ToBlobUrl(watermarkBase64) : undefined)
      setStickers([])
      setCurrentId(project.id)
      setLastSaved(project.updatedAt)
      setProjectModalOpen(false)
      setStep(1)
    } catch (err) {
      console.error('파일 불러오기 실패:', err)
    }
  }

  function ensureAudioContext() {
    if (analyserRef.current || !audioRef.current) return
    try {
      const ctx = new AudioContext()
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 2048
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

  const onSeek = (playlistTime: number) => {
    ensureAudioContext()
    let acc = 0
    for (const track of tracks) {
      const end = acc + track.durationSec
      if (playlistTime < end || track === tracks[tracks.length - 1]) {
        const offset = Math.max(0, playlistTime - acc)
        setPlayingId(track.id)
        setIsPlaying(true)
        if (track.audioUrl && audioRef.current) {
          if (audioRef.current.src !== track.audioUrl) {
            audioRef.current.src = track.audioUrl
            audioRef.current.addEventListener('canplay', () => {
              if (audioRef.current) {
                audioRef.current.currentTime = offset
                audioRef.current.play().catch(() => {})
              }
            }, { once: true })
          } else {
            audioRef.current.currentTime = offset
            audioRef.current.play().catch(() => {})
          }
        } else {
          setAudioCurrentTime(offset)
        }
        return
      }
      acc += track.durationSec
    }
  }

  return (
    <div className="app">
      <audio
        ref={audioRef}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={handleTrackEnded}
        onTimeUpdate={e => setAudioCurrentTime(e.currentTarget.currentTime)}
      />
      <Sidebar
        step={step}
        setStep={goToStep}
        tracks={tracks}
        projectName={projectName}
        lastSaved={lastSaved}
        onOpenProjectModal={() => setProjectModalOpen(true)}
      />
      <Header
        step={step}
        setStep={goToStep}
        onSave={handleSave}
        onExport={() => { onPause(); setStep(3); setPendingExport(true) }}
      />
      <main className="main">
        {step === 1 && (
          <Step1
            tracks={tracks}
            setTracks={setTracks}
            playingId={playingId}
            isPlaying={isPlaying}
            onPlay={onPlay}
            onPause={onPause}
            onSkipNext={onSkipNext}
            onSkipPrev={onSkipPrev}
            onNext={() => setStep(2)}
            background={background}
            setBackground={setBackground}
            logo={logo}
            setLogo={setLogo}
            logoPosition={logoPosition}
            logoSize={logoSize}
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
            onNext={() => { onPause(); setStep(3) }}
            background={background}
            logo={logo}
            logoPosition={logoPosition}
            setLogoPosition={setLogoPosition}
            logoSize={logoSize}
            setLogoSize={setLogoSize}
            currentTime={audioCurrentTime}
            onSeek={onSeek}
            particleOverlay={particleOverlay}
            setParticleOverlay={setParticleOverlay}
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
            setLoops={setLoops}
            quality={quality}
            setQuality={setQuality}
            onBack={() => setStep(2)}
            background={background}
            logo={logo}
            logoPosition={logoPosition}
            logoSize={logoSize}
            watermark={watermark}
            stickers={stickers}
            typography={typography}
            onSave={handleSave}
            autoStart={pendingExport}
            onAutoStartDone={() => setPendingExport(false)}
          />
        )}
      </main>
      <StatusBar tracks={tracks} />
      <ProjectModal
        open={projectModalOpen}
        projectId={projectId}
        projectName={projectName}
        onClose={() => setProjectModalOpen(false)}
        onChangeName={setProjectName}
        onLoadProject={handleLoadProject}
        onNewProject={handleNewProject}
        onExportFile={handleExportFile}
        onImportFile={handleImportFile}
      />
    </div>
  )
}
