import { motion, type HTMLMotionProps } from 'framer-motion'
import type { ReactNode } from 'react'

export type ButtonVariant = 'acc' | 'ok' | 'err' | 'gold' | 'secondary' | 'disabled'

// Радиус 18, «нажимаемая» тень 5px (у вторичной — 4px), как в макете
const VARIANTS: Record<ButtonVariant, { cls: string; depth: number }> = {
  acc: { cls: 'bg-acc text-white shadow-btn-acc', depth: 5 },
  ok: { cls: 'bg-ok text-white shadow-btn-ok', depth: 5 },
  err: { cls: 'bg-err text-white shadow-btn-err', depth: 5 },
  gold: { cls: 'bg-gold text-white shadow-btn-gold', depth: 5 },
  secondary: { cls: 'bg-sf text-ink border-2 border-line shadow-btn-2', depth: 4 },
  disabled: { cls: 'bg-sf2 text-ink-3 shadow-btn-lock', depth: 0 },
}

interface Props extends Omit<HTMLMotionProps<'button'>, 'children'> {
  variant?: ButtonVariant
  size?: 'lg' | 'md'
  children: ReactNode
}

export function Button({ variant = 'acc', size = 'lg', className = '', children, disabled, ...rest }: Props) {
  const v = VARIANTS[disabled ? 'disabled' : variant]
  return (
    <motion.button
      type="button"
      disabled={disabled}
      whileTap={v.depth ? { y: v.depth, boxShadow: '0 0 0 rgba(0,0,0,0)' } : undefined}
      transition={{ duration: 0.08 }}
      className={`flex w-full items-center justify-center gap-2 rounded-btn font-bold ${size === 'lg' ? 'h-14 text-[17px]' : 'h-[52px] text-base'} ${v.cls} ${className}`}
      {...rest}
    >
      {children}
    </motion.button>
  )
}
