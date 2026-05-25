// 상단 헤더 — 컨텍스트 + 단계 알약 + 액션 버튼
import './Header.css'
import Icon from '../../icons'
import Button from '../shared/Button'

interface HeaderProps {
  step: 1 | 2 | 3
  setStep: (n: 1 | 2 | 3) => void
  onSave: () => void
  onExport: () => void
}

const STEPS = [
  { num: 1 as const, label: '미디어 준비' },
  { num: 2 as const, label: '비주얼 편집' },
  { num: 3 as const, label: '영상 출력' },
]

export default function Header({ step, setStep, onSave, onExport }: HeaderProps) {
  return (
    <header className="header">
      <div className="header__left">
        <div className="crumbs">
          <Icon name="film" size={14} />
          <span>플레이리스트 영상 만들기</span>
        </div>
      </div>

      <div className="header__center">
        {STEPS.map(s => (
          <button
            key={s.num}
            type="button"
            className={`step-pill${step === s.num ? ' step-pill--active' : ''}${step > s.num ? ' step-pill--done' : ''}`}
            onClick={() => setStep(s.num)}
          >
            <span className="step-pill__num">{step > s.num ? '✓' : s.num}</span>
            {s.label}
          </button>
        ))}
      </div>

      <div className="header__right">
        <Button variant="ghost" onClick={onSave}>
          <Icon name="download" size={14} /> 저장
        </Button>
        <Button variant="primary" onClick={onExport}>
          <Icon name="export" size={14} /> 출력
        </Button>
      </div>
    </header>
  )
}
