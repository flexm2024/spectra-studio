// 하단 상태 바 — 트랙 수, 총 길이, 해상도, 비트레이트, 단축키
import './StatusBar.css'
import Icon from '../../icons'
import type { Track } from '../../types'

interface StatusBarProps {
  tracks: Track[]
}

export default function StatusBar({ tracks }: StatusBarProps) {
  const totalSec = tracks.reduce((acc, t) => acc + t.durationSec, 0)
  const totalDur = `${Math.floor(totalSec / 60)}:${String(totalSec % 60).padStart(2, '0')}`

  return (
    <footer className="status">
      <div className="status__group">
        <Icon name="music" size={13} />
        <span className="status__num">{tracks.length}</span>
        <span>트랙</span>
      </div>
      <div className="status__group">
        <Icon name="film" size={13} />
        <span className="status__num">{totalDur}</span>
        <span>총 길이</span>
      </div>
      <div className="status__group">
        <Icon name="hd" size={13} />
        <span>1920 × 1080 · 30fps</span>
      </div>
      <div className="status__group">
        <Icon name="settings" size={13} />
        <span>192 kbps · AAC</span>
      </div>
    </footer>
  )
}
