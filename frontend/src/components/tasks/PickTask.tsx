import type { TaskOf } from '../../lib/types'
import { useAnswer, useGame } from '../../store/game'
import { Mascot } from '../Mascot'
import { OptionCard, optionState } from '../ui/OptionCard'

/** Выбор промпта / ответа */
export function PickTask({ task }: { task: TaskOf<'pick'> }) {
  const { sel, checked, correctIndex } = useAnswer()
  const select = useGame((s) => s.select)

  return (
    <>
      {task.ctx && (
        <div className="flex items-end gap-2.5">
          <Mascot size={56} />
          <div className="flex-1 text-pretty rounded-[18px_18px_18px_6px] border-2 border-line bg-sf px-3.5 py-3 text-[14.5px] leading-[1.45]">
            {task.ctx}
          </div>
        </div>
      )}
      <div className="flex flex-col gap-3">
        {task.options.map((text, i) => (
          <OptionCard key={i} index={i} mono={task.mono} state={optionState(i, sel, checked, correctIndex)} onClick={() => select(i)}>
            {text}
          </OptionCard>
        ))}
      </div>
    </>
  )
}
