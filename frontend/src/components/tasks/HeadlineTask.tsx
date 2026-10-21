import { AnimatePresence, motion } from 'framer-motion'
import type { TaskOf } from '../../lib/types'
import { useAnswer, useGame } from '../../store/game'
import { OptionCard, optionState } from '../ui/OptionCard'

/** Выбор заголовка с живым превью лендинга */
export function HeadlineTask({ task }: { task: TaskOf<'head'> }) {
  const { sel, checked, correctIndex } = useAnswer()
  const select = useGame((s) => s.select)
  const preview = sel != null ? task.options[sel] : 'Тут будет твой заголовок'

  return (
    <>
      {task.ctx && <div className="text-pretty text-[14.5px] leading-[1.45] text-ink-2">{task.ctx}</div>}
      <div className="overflow-hidden rounded-2xl border-[1.5px] border-line bg-sf">
        <div className="flex h-7 items-center gap-[5px] border-b border-line px-2.5">
          <div className="h-[7px] w-[7px] rounded-full bg-line" />
          <div className="h-[7px] w-[7px] rounded-full bg-line" />
          <div className="ml-1.5 flex h-4 flex-1 items-center rounded-[5px] bg-sf2 pl-2 font-mono text-[10px] text-ink-3">{task.site.url}</div>
        </div>
        <div className="flex min-h-[112px] flex-col gap-2.5 bg-[#F6EFE6] px-4 py-[18px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={preview}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15 }}
              className="font-display text-base font-bold leading-[1.2] tracking-[-.02em]"
              style={{ color: sel != null ? '#2A1D15' : '#B9A998' }}
            >
              {preview}
            </motion.div>
          </AnimatePresence>
          <div className="flex items-center gap-2">
            <div className="rounded-[9px] bg-[#3B2A20] px-3 py-1.5 text-[11px] font-bold text-[#F6EFE6]">{task.site.cta}</div>
            <div className="h-1.5 w-20 rounded-[3px] bg-[#E5D9CB]" />
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-3">
        {task.options.map((text, i) => (
          <OptionCard key={i} index={i} state={optionState(i, sel, checked, correctIndex)} onClick={() => select(i)}>
            {text}
          </OptionCard>
        ))}
      </div>
    </>
  )
}
