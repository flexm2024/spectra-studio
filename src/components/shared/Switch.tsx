// 토글 스위치 컴포넌트 — 32×18, 시안
import './Switch.css'

interface SwitchProps {
  on: boolean
  onChange: (v: boolean) => void
}

export default function Switch({ on, onChange }: SwitchProps) {
  return (
    <button
      className={`switch${on ? ' switch--on' : ''}`}
      onClick={() => onChange(!on)}
      role="switch"
      aria-checked={on}
    />
  )
}
