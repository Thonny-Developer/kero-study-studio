import type { Creative as C } from '../../lib/types'

/** Сторис-креатив 9:16 в стилях из макета */
export function Creative({ c, large }: { c: C; large?: boolean }) {
  const k = large ? 1.6 : 1
  switch (c.kind) {
    case 'sale':
      return (
        <div
          className="flex h-full flex-col items-center justify-center gap-0.5 p-2 text-center"
          style={{ background: c.bg ?? '#FFE2D8', color: c.color ?? '#B3341A' }}
        >
          <div className="font-display font-extrabold" style={{ fontSize: 13 * k }}>
            {c.top}
          </div>
          <div className="font-display font-extrabold tracking-[-.05em]" style={{ fontSize: 32 * k }}>
            {c.big}
          </div>
          <div className="font-semibold opacity-80" style={{ fontSize: 11 * k }}>
            {c.bottom}
          </div>
        </div>
      )
    case 'pov':
      return (
        <div className="flex h-full flex-col justify-between bg-[#1B1722] px-[9px] py-2.5 text-left" style={{ padding: large ? 16 : undefined }}>
          <div className="flex gap-[3px]">
            <div className="h-0.5 flex-1 rounded-[1px] bg-white" />
            <div className="h-0.5 flex-1 rounded-[1px] bg-white/30" />
          </div>
          <div className="flex flex-col gap-[5px]">
            <span className="font-mono font-bold text-[#FF8A6A]" style={{ fontSize: 10 * k }}>
              {c.label}
            </span>
            <span className="font-extrabold leading-[1.25] text-white" style={{ fontSize: 12.5 * k }}>
              {c.text}
            </span>
          </div>
          <div className="self-start rounded-md bg-[#F25A35] px-1.5 py-1 font-bold text-white" style={{ fontSize: 9.5 * k }}>
            {c.tag}
          </div>
        </div>
      )
    case 'brand':
      return (
        <div className="flex h-full flex-col items-center justify-center gap-2 bg-[#F1EFEA] p-2 text-center">
          <div className="grid h-11 w-11 place-items-center rounded-full bg-[#3B2A20] font-display text-lg font-extrabold text-[#F6EFE6]">
            {c.letter}
          </div>
          <div className="font-display text-xs font-bold text-[#3B2A20]">{c.name}</div>
          <div className="text-[11px] font-semibold text-[#6B5A4C]">{c.caption}</div>
        </div>
      )
    case 'wall':
      return (
        <div className="flex h-full flex-col justify-center bg-white p-2 text-left">
          <div className="text-[8.5px] leading-[1.35] text-[#3a3a3a]">{c.text}</div>
        </div>
      )
  }
}
