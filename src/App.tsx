// 앱 루트 — 전체 상태 관리 및 레이아웃 조합
import { useState } from 'react'
import type { Track } from './types'
import { sampleTracks } from './data/sampleTracks'
import Sidebar from './components/Sidebar/Sidebar'
import Header from './components/Header/Header'
import StatusBar from './components/StatusBar/StatusBar'
import Step1 from './components/steps/Step1/Step1'

export default function App() {
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [tracks, setTracks] = useState<Track[]>(sampleTracks)

  return (
    <div className="app">
      <Sidebar step={step} setStep={setStep} tracks={tracks} />
      <Header step={step} setStep={setStep} />
      <main className="main">
        {step === 1 && <Step1 tracks={tracks} setTracks={setTracks} onNext={() => setStep(2)} />}
        {step === 2 && <p style={{ padding: 20, color: 'var(--ink-3)' }}>Step 2 — 구현 예정</p>}
        {step === 3 && <p style={{ padding: 20, color: 'var(--ink-3)' }}>Step 3 — 구현 예정</p>}
      </main>
      <StatusBar tracks={tracks} />
    </div>
  )
}
