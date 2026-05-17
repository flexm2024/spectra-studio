// 공용 버튼 컴포넌트
import type { ButtonHTMLAttributes } from 'react'
import './Button.css'

type ButtonVariant = 'default' | 'ghost' | 'primary' | 'danger-ghost'
type ButtonSize = 'default' | 'lg' | 'icon'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
}

export default function Button({ variant = 'default', size = 'default', className = '', children, ...rest }: ButtonProps) {
  const cls = [
    'btn',
    variant !== 'default' ? `btn--${variant}` : '',
    size !== 'default' ? `btn--${size}` : '',
    className,
  ].filter(Boolean).join(' ')
  return <button className={cls} {...rest}>{children}</button>
}
