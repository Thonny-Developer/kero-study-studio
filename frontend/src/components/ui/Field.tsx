import type { InputHTMLAttributes } from 'react'

export function Field({ label, ...rest }: { label: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="font-mono text-[11px] font-bold tracking-[.08em] text-ink-3">{label}</span>
      <input
        {...rest}
        className="h-14 rounded-btn border-2 border-line bg-sf px-4 text-base font-semibold text-ink shadow-btn-2 outline-none transition-colors placeholder:font-medium placeholder:text-ink-3 focus:border-acc"
      />
    </label>
  )
}
