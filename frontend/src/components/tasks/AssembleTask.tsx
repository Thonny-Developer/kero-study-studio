import { Reorder } from 'framer-motion'
import { useRef, useState } from 'react'
import type { TaskOf } from '../../lib/types'
import { useAnswer, useGame } from '../../store/game'
import { Terminal } from '../ui/Terminal'

/**
 * Сборка промпта: тап или drag&drop блока в терминал.
 * Внутри терминала блоки можно перетаскивать, меняя порядок; тап по блоку возвращает его в пул.
 */
export function AssembleTask({ task }: { task: TaskOf<'asm'> }) {
  const { chosen, checked, right: rightOrder } = useAnswer()
  const { addBlock, removeBlock, reorder } = useGame.getState()
  const [over, setOver] = useState(false)
  const dragging = useRef(false)

  return (
    <>
      {task.ctx && <div className="text-pretty text-[14.5px] leading-[1.45] text-ink-2">{task.ctx}</div>}
      <Terminal
        title={task.file ?? 'prompt.txt'}
        onDragOver={(e) => {
          e.preventDefault()
          setOver(true)
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setOver(false)
          addBlock(e.dataTransfer.getData('text/plain'))
        }}
        style={{ outline: over ? '2px dashed var(--acc)' : undefined, outlineOffset: 2 }}
      >
        <div className="min-h-[150px] p-3.5">
          <Reorder.Group axis="y" values={chosen} onReorder={reorder} className="flex flex-col items-start gap-2">
            {chosen.map((id, i) => {
              const right = rightOrder[i] === id
              return (
                <Reorder.Item
                  key={id}
                  value={id}
                  dragListener={!checked}
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.2 }}
                  onDragStart={() => (dragging.current = true)}
                  onDragEnd={() => setTimeout(() => (dragging.current = false), 50)}
                  onClick={() => !dragging.current && removeBlock(id)}
                  className="cursor-grab touch-none select-none rounded-[10px] border bg-white/[.08] px-2.5 py-[7px] text-left font-mono text-[12.5px] leading-[1.4] text-term-text active:cursor-grabbing"
                  style={{ borderColor: checked ? (right ? '#4ADE80' : '#FF7A8A') : 'rgba(255,255,255,.14)' }}
                >
                  {task.blocks[id]}
                </Reorder.Item>
              )
            })}
          </Reorder.Group>
          <div className="flex items-center gap-2">
            {chosen.length === 0 && <span className="py-[7px] font-mono text-[12.5px] text-term-mute">Тапни или перетащи блоки сюда</span>}
            <span className="animate-caret py-[5px] font-mono text-[15px] text-term-green">▍</span>
          </div>
        </div>
      </Terminal>
      <div className="flex flex-wrap gap-2.5">
        {task.pool.map((id) => {
          const used = chosen.includes(id)
          return (
            <button
              key={id}
              type="button"
              draggable={!used && !checked}
              onDragStart={(e) => e.dataTransfer.setData('text/plain', id)}
              onClick={() => addBlock(id)}
              disabled={used || checked}
              className={`rounded-tile border-2 border-line px-3 py-2.5 text-left font-mono text-[12.5px] leading-[1.4] transition-transform duration-75 ${used ? 'bg-sf2 text-transparent' : 'bg-sf text-ink shadow-[0_3px_0_var(--line)] active:translate-y-[3px] active:shadow-none'}`}
            >
              {task.blocks[id]}
            </button>
          )
        })}
      </div>
    </>
  )
}
