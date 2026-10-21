import { motion } from 'framer-motion'
import type { TaskOf } from '../../lib/types'
import { useAnswer, useGame } from '../../store/game'
import { LETTERS, OPTION_STYLES, optionState } from '../ui/OptionCard'
import { Creative } from './Creative'

const BORDER = { default: 'var(--line)', selected: 'var(--acc)', ok: 'var(--ok)', err: 'var(--err)' }
const LETTER = { default: 'var(--ink2)', selected: 'var(--accInk)', ok: 'var(--okInk)', err: 'var(--errInk)' }

/** Выбор креатива из трёх сторис */
export function CreativeTask({ task }: { task: TaskOf<'cre'> }) {
  const { sel, checked, correctIndex } = useAnswer()
  const select = useGame((s) => s.select)

  return (
    <>
      {task.ctx && <div className="text-pretty text-[14.5px] leading-[1.45] text-ink-2">{task.ctx}</div>}
      <div className="grid grid-cols-3 gap-2.5">
        {task.options.map((c, i) => {
          const st = optionState(i, sel, checked, correctIndex)
          return (
            <button key={i} type="button" onClick={() => select(i)} className="flex flex-col items-center gap-2 text-ink">
              <motion.div
                whileTap={{ y: 4, boxShadow: '0 0 0 transparent' }}
                animate={{ scale: st === 'selected' ? 1.03 : 1 }}
                transition={{ duration: 0.12 }}
                className="aspect-[9/16] w-full overflow-hidden rounded-2xl border-[3px] transition-colors"
                style={{ borderColor: BORDER[st], boxShadow: `0 4px 0 ${OPTION_STYLES[st].sh}` }}
              >
                <Creative c={c} />
              </motion.div>
              <span className="font-mono text-[13px] font-bold" style={{ color: LETTER[st] }}>
                {LETTERS[i]}
              </span>
            </button>
          )
        })}
      </div>
    </>
  )
}
