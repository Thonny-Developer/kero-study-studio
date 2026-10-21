import { AnimatePresence, motion } from 'framer-motion'
import { checkPrompt } from '../../lib/prompt-check'
import type { TaskOf } from '../../lib/types'
import { Icon } from '../../lib/icons'
import { useAnswer, useGame } from '../../store/game'
import { Mascot } from '../Mascot'

/** AI-песочница: свободный промпт, чипы критериев подсвечиваются на лету */
export function SandboxTask({ task, busy }: { task: TaskOf<'sb'>; busy: boolean }) {
  const { sbText: text, checked } = useAnswer()
  const setSbText = useGame((s) => s.setSbText)
  const chips = checkPrompt(text)

  return (
    <>
      <div className="flex items-end gap-2.5">
        <Mascot size={56} mood={busy ? 'wow' : 'idle'} anim={busy ? 'jump' : 'bob'} />
        <div className="flex flex-1 flex-col gap-1 rounded-[18px_18px_18px_6px] border-2 border-line bg-sf px-3.5 py-3">
          <span className="font-mono text-[11px] font-bold tracking-[.06em] text-acc-ink">ЗАДАЧА</span>
          <span className="text-pretty text-[14.5px] leading-[1.45]">{task.task}</span>
        </div>
      </div>
      <div className="overflow-hidden rounded-btn border border-term-line bg-term">
        <div className="flex items-center justify-between border-b border-term-line px-3.5 py-2.5">
          <span className="font-mono text-xs text-term-green">you@vibely:~$ prompt</span>
          <button
            type="button"
            onClick={() => setSbText(task.example)}
            disabled={checked || busy}
            className="rounded-[7px] bg-white/[.08] px-2 py-1 text-[11.5px] font-bold text-[#C9C4D6]"
          >
            Пример
          </button>
        </div>
        <textarea
          value={text}
          onChange={(e) => setSbText(e.target.value)}
          readOnly={checked || busy}
          placeholder="Ты — ... Сделай ... для ... Ответь в формате ..."
          rows={6}
          maxLength={2000}
          className="block w-full resize-none border-none bg-transparent p-3.5 font-mono text-[13px] leading-[1.55] text-term-text outline-none placeholder:text-term-mute"
        />
      </div>
      <div className="flex flex-col gap-2">
        <div className="text-[12.5px] font-semibold text-ink-3">Блинк проверяет на лету:</div>
        <div className="flex flex-wrap gap-1.5">
          {chips.map((c) => (
            <motion.div
              key={c.label}
              layout
              animate={{ scale: c.hit ? [1, 1.08, 1] : 1 }}
              transition={{ duration: 0.25 }}
              className={`flex items-center gap-1 rounded-[10px] border-[1.5px] px-2.5 py-1.5 text-[12.5px] font-bold transition-colors duration-200 ${c.hit ? 'border-ok bg-ok-soft text-ok-ink' : 'border-line text-ink-3'}`}
            >
              <AnimatePresence initial={false}>
                {c.hit && (
                  <motion.span initial={{ width: 0, opacity: 0 }} animate={{ width: 'auto', opacity: 1 }} exit={{ width: 0, opacity: 0 }}>
                    <Icon name="check" size={13} />
                  </motion.span>
                )}
              </AnimatePresence>
              {c.label}
            </motion.div>
          ))}
        </div>
      </div>
    </>
  )
}
