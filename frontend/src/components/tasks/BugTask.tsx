import { highlight } from '../../lib/highlight'
import type { TaskOf } from '../../lib/types'
import { useAnswer, useGame } from '../../store/game'
import { Terminal } from '../ui/Terminal'

/** Найди строку с багом */
export function BugTask({ task }: { task: TaskOf<'bug'> }) {
  const { sel, checked, correctIndex } = useAnswer()
  const select = useGame((s) => s.select)

  return (
    <>
      {task.ctx && <div className="text-pretty text-[14.5px] leading-[1.45] text-ink-2">{task.ctx}</div>}
      <Terminal title={task.file}>
        <div className="no-scrollbar overflow-x-auto py-2">
          {task.lines.map((line, i) => {
            const a = i === sel
            const ok = checked && i === correctIndex
            let bg = 'transparent'
            if (ok) bg = 'rgba(22,163,74,.32)'
            else if (checked && a) bg = 'rgba(239,62,88,.32)'
            else if (a) bg = 'color-mix(in srgb, var(--acc) 32%, transparent)'
            return (
              <button
                key={i}
                type="button"
                onClick={() => select(i)}
                className={`flex items-start gap-3 px-3.5 py-1.5 text-left font-mono text-[13px] leading-normal transition-colors duration-100 ${task.lang === 'text' ? 'w-full whitespace-pre-wrap' : 'w-max min-w-full whitespace-pre'}`}
                style={{ background: bg }}
              >
                <span className="w-4 shrink-0 text-right font-bold" style={{ color: a || ok ? '#fff' : '#5E5A6C' }}>
                  {i + 1}
                </span>
                <span className="min-w-0">
                  {highlight(line, task.lang).map((g, k) => (
                    <span key={k} style={{ color: g.c }}>
                      {g.t}
                    </span>
                  ))}
                </span>
              </button>
            )
          })}
        </div>
      </Terminal>
    </>
  )
}
