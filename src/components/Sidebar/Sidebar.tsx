// 좌측 사이드바 — 브랜드, 프로젝트 카드, 워크플로우, 빠른 액션, 유저 카드
import './Sidebar.css'
import Icon from '../../icons'
import type { Track } from '../../types'

interface SidebarProps {
  step: 1 | 2 | 3
  setStep: (n: 1 | 2 | 3) => void
  tracks: Track[]
}

const STEPS = [
  { num: 1 as const, label: '미디어 준비', sub: '오디오 · 배경 · 로고' },
  { num: 2 as const, label: '비주얼 편집', sub: '효과 · 테마 · 타이포' },
  { num: 3 as const, label: '영상 출력',   sub: 'MP4 · 렌더링' },
]

function calcProgress(stepNum: 1 | 2 | 3, currentStep: 1 | 2 | 3, trackCount: number): number {
  if (stepNum === 1) return Math.min(100, Math.round((trackCount / 15) * 100))
  if (stepNum === 2) return currentStep >= 2 ? 65 : 0
  return currentStep >= 3 ? 30 : 0
}

export default function Sidebar({ step, setStep, tracks }: SidebarProps) {
  return (
    <aside className="rail">
      <div className="rail__brand">
        <div className="rail__logo"><Icon name="logo" size={22} /></div>
        <div className="rail__brand-text">
          <div className="rail__wordmark">Spectra</div>
          <div className="rail__wordmark-sub">STUDIO</div>
        </div>
        <span className="rail__pro-badge">PRO</span>
      </div>

      <div className="rail__project">
        <div className="rail__project-label">
          <span>현재 프로젝트</span>
          <Icon name="chevronDown" size={11} />
        </div>
        <div className="rail__project-name">가을 산책 플레이리스트</div>
        <div className="rail__project-meta">
          <div className="rail__project-dot" />
          <span>자동 저장 · 1분 전</span>
        </div>
      </div>

      <div className="rail__section">워크플로우</div>
      <div className="rail__steps">
        {STEPS.map(s => {
          const isActive = step === s.num
          const isDone = step > s.num
          const progress = calcProgress(s.num, step, tracks.length)
          return (
            <button
              type="button"
              key={s.num}
              className={`rail-step${isActive ? ' rail-step--active' : ''}${isDone ? ' rail-step--done' : ''}`}
              onClick={() => setStep(s.num)}
            >
              <div className="rail-step__num">{s.num}</div>
              <div className="rail-step__label">{s.label}</div>
              <div className="rail-step__caret"><Icon name="chevronRight" size={14} /></div>
              <div className="rail-step__sub">{s.sub}</div>
              {isActive && (
                <div className="rail-step__bar">
                  <div className="rail-step__bar-fill" style={{ width: `${progress}%` }} />
                </div>
              )}
            </button>
          )
        })}
      </div>

      <div className="rail__spacer" />

      <div className="rail__util">
        <button type="button" className="rail__util-row">
          <Icon name="help" size={15} /><span className="util-label">사용자 가이드</span>
        </button>
        <button type="button" className="rail__util-row">
          <Icon name="keyboard" size={15} /><span className="util-label">키보드 단축키</span>
          <span className="kbd">?</span>
        </button>
        <button type="button" className="rail__util-row">
          <Icon name="settings" size={15} /><span className="util-label">설정</span>
        </button>
      </div>

      <div className="rail__user">
        <div className="rail__avatar">하</div>
        <div className="rail__user-info">
          <div className="rail__user-name">하나 크리에이터</div>
          <div className="rail__user-plan">Pro · 12.4 / 50 GB</div>
        </div>
        <div className="rail__user-menu"><Icon name="more" size={16} /></div>
      </div>
    </aside>
  )
}
