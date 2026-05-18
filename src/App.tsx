// 앱 루트 — 전체 상태 관리 및 레이아웃 조합
import { useState } from 'react'
import type { Track } from './types'
import { sampleTracks } from './data/sampleTracks'
import Sidebar from './components/Sidebar/Sidebar'
import Header from './components/Header/Header'
import StatusBar from './components/StatusBar/StatusBar'

export default function App() {
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [tracks, setTracks] = useState<Track[]>(sampleTracks)

  return (
    <div className="app">
      <Sidebar step={step} setStep={setStep} tracks={tracks} />
      <Header step={step} setStep={setStep} />
      <main className="main">
        <p style={{ padding: 20, color: 'var(--ink-3)', fontFamily: 'var(--f-mono)' }}>
          Step {step} — 구현 예정
        </p>
      </main>
      <StatusBar tracks={tracks} />
    </div>
  )
}
