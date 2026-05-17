// 세그먼티드 컨트롤 — 2~3개 옵션, hint 라벨 지원
import './SegmentedControl.css'

interface SegOption<T> {
  value: T
  label: string
  hint?: string
}

interface SegmentedControlProps<T extends string | number> {
  options: SegOption<T>[]
  value: T
  onChange: (v: T) => void
}

export default function SegmentedControl<T extends string | number>({ options, value, onChange }: SegmentedControlProps<T>) {
  return (
    <div className={`seg seg--${options.length}`}>
      {options.map(opt => (
        <button
          type="button"
          key={String(opt.value)}
          className={`seg__opt${value === opt.value ? ' seg__opt--active' : ''}`}
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
          {opt.hint && <span className="seg__hint">{opt.hint}</span>}
        </button>
      ))}
    </div>
  )
}
