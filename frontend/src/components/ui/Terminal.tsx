import type { ReactNode } from 'react'

/** Окно терминала/редактора из макета: три точки и имя файла */
export function Terminal({
  title,
  right,
  children,
  ...rest
}: {
  title: ReactNode
  right?: ReactNode
  children: ReactNode
} & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className="overflow-hidden rounded-btn border border-term-line bg-term" {...rest}>
      <div className="flex items-center gap-1.5 border-b border-term-line px-3.5 py-2.5">
        <div className="h-2.5 w-2.5 rounded-full bg-[#FF5F57]" />
        <div className="h-2.5 w-2.5 rounded-full bg-[#FEBC2E]" />
        <div className="h-2.5 w-2.5 rounded-full bg-[#28C840]" />
        <span className="ml-2 flex-1 truncate font-mono text-xs text-term-mute">{title}</span>
        {right}
      </div>
      {children}
    </div>
  )
}
