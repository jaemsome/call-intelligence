import { cn } from '@/lib/utils'
import { Spinner } from './Spinner'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'

const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-accent text-white hover:brightness-110',
  secondary: 'border border-line bg-surface text-ink hover:bg-surface-2',
  ghost: 'text-ink-2 hover:bg-surface-2 hover:text-ink',
  danger: 'bg-bad text-white hover:brightness-110',
}

export function buttonClasses(variant: ButtonVariant = 'primary', className?: string) {
  return cn(
    'inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition-[filter,background-color,color] duration-200 disabled:cursor-not-allowed disabled:opacity-60',
    VARIANTS[variant],
    className,
  )
}

type Props = React.ComponentProps<'button'> & { variant?: ButtonVariant; loading?: boolean; loadingLabel?: string }

export function Button({ variant = 'primary', loading = false, loadingLabel, className, children, disabled, type = 'button', ...rest }: Props) {
  return (
    <button type={type} {...rest} disabled={disabled || loading} aria-busy={loading || undefined} className={buttonClasses(variant, className)}>
      {loading ? (<><Spinner />{loadingLabel ?? children}</>) : children}
    </button>
  )
}
