import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

export type OptionState = 'default' | 'selected' | 'ok' | 'err'

// Состояния карточек ответа из макета: по умолчанию / выбрано (цвет трека) / верно / неверно
export const OPTION_STYLES: Record<OptionState, { card: string; letter: string; sh: string }> = {
  default: { card: 'border-line bg-sf', letter: 'border-line text-ink-2', sh: 'var(--line)' },
  selected: { card: 'border-acc bg-acc-soft', letter: 'border-acc text-acc-ink', sh: 'var(--acc)' },
  ok: { card: 'border-ok bg-ok-soft', letter: 'border-ok text-ok-ink', sh: 'var(--ok)' },
  err: { card: 'border-err bg-err-soft', letter: 'border-err text-err-ink', sh: 'var(--err)' },
}

export const LETTERS = 'АБВГД'

export function optionState(i: number, sel: number | null, checked: boolean, correct: number): OptionState {
  if (checked) {
    if (i === correct) return 'ok'
    if (i === sel) return 'err'
    return 'default'
  }
  return i === sel ? 'selected' : 'default'
}

export function OptionCard({
  index,
  state,
  onClick,
  mono,
  children,
}: {
  index: number
  state: OptionState
  onClick: () => void
  mono?: boolean
  children: ReactNode
}) {
  const s = OPTION_STYLES[state]
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={{ y: 4, boxShadow: '0 0 0 transparent' }}
      transition={{ duration: 0.08 }}
      style={{ boxShadow: `0 4px 0 ${s.sh}` }}
      className={`flex gap-3 rounded-btn border-2 p-3.5 text-left text-ink transition-colors duration-100 ${mono ? 'items-start' : 'items-center'} ${s.card}`}
    >
      <span
        className={`grid h-7 w-7 shrink-0 place-items-center rounded-[9px] border-2 font-mono text-[13px] font-bold ${s.letter}`}
      >
        {LETTERS[index]}
      </span>
      <span className={mono ? 'font-mono text-[13px] leading-[1.55]' : 'text-[15px] font-semibold leading-[1.35]'}>{children}</span>
    </motion.button>
  )
}
