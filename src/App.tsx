// 앱 루트 — 전체 상태 관리 및 레이아웃 조합
import { useState } from 'react'
import type { Track, Effects, Visualizer, Typography, ExportSettings } from './types'
import { sampleTracks } from './data/sampleTracks'
import Sidebar from './components/Sidebar/Sidebar'
import Header from './components/Header/Header'
import StatusBar from './components/StatusBar/StatusBar'
import Step1 from './components/steps/Step1/Step1'
import Step2 from './components/steps/Step2/Step2'

export default function App() {
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [tracks, setTracks] = useState<Track[]>(sampleTracks)
  const [theme, setTheme] = useState('midnight')
  const [effects, setEffects] = useState<Effects>({ vis: true, crossfade: false, ducking: true, blur: true })
  const [visualizer, setVisualizer] = useState<Visualizer>({ type: 'bars', intensity: 70, opacity: 85 })
  const [typography, setTypography] = useState<Typography>({ titleSize: 48, letterSpacing: -15 })
  const [exportSettings, setExportSettings] = useState<ExportSettings>({
    filename: 'my-playlist',
    format: 'mp4',
    resolution: '1080p',
    thumbnail: true,
    chapters: false,
  })

  return (
    <div className="app">
      <Sidebar step={step} setStep={setStep} tracks={tracks} />
      <Header step={step} setStep={setStep} />
      <main className="main">
        {step === 1 && (
          <Step1 tracks={tracks} setTracks={setTracks} onNext={() => setStep(2)} />
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
            onBack={() => setStep(1)}
            onNext={() => setStep(3)}
          />
        )}
        {step === 3 && (
          <p style={{ padding: 20, color: 'var(--ink-3)' }}>Step 3 — 구현 예정</p>
        )}
      </main>
      <StatusBar tracks={tracks} />
    </div>
  )
}
