import { AnimatePresence, motion } from 'framer-motion'
import { useRef } from 'react'
import { AssembleTask } from '../components/tasks/AssembleTask'
import { BugTask } from '../components/tasks/BugTask'
import { CreativeTask } from '../components/tasks/CreativeTask'
import { HeadlineTask } from '../components/tasks/HeadlineTask'
import { PickTask } from '../components/tasks/PickTask'
import { SandboxTask } from '../components/tasks/SandboxTask'
import { Button } from '../components/ui/Button'
import { FeedbackSheet } from '../components/ui/FeedbackSheet'
import { ProgressBar } from '../components/ui/ProgressBar'
import { Icon, type IconName } from '../lib/icons'
import type { LessonView, Task } from '../lib/types'
import { useAnswer, useGame, type AnswerView } from '../store/game'

const META: Record<Task['type'], { label: string; icon: IconName }> = {
  pick: { label: 'Выбери промпт', icon: 'list' },
  asm: { label: 'Собери промпт', icon: 'blocks' },
  bug: { label: 'Найди баг', icon: 'bug' },
  head: { label: 'Заголовок', icon: 'type' },
  cre: { label: 'Креатив', icon: 'img' },
  sb: { label: 'AI-песочница', icon: 'sand' },
}

function taskLabel(t: Task) {
  if (t.type === 'pick') return t.mono ? 'Выбери промпт' : 'Выбери ответ'
  if (t.type === 'asm' && t.file) return 'Собери из блоков'
  if (t.type === 'bug' && t.lang === 'text') return 'Найди ошибку'
  return META[t.type].label
}

function canCheck(t: Task, a: AnswerView) {
  if (t.type === 'asm') return a.chosen.length > 0
  if (t.type === 'sb') return a.sbText.trim().length >= 10
  return a.sel != null
}

function TaskBody({ task, busy }: { task: Task; busy: boolean }) {
  switch (task.type) {
    case 'pick':
      return <PickTask task={task} />
    case 'asm':
      return <AssembleTask task={task} />
    case 'bug':
      return <BugTask task={task} />
    case 'head':
      return <HeadlineTask task={task} />
    case 'cre':
      return <CreativeTask task={task} />
    case 'sb':
      return <SandboxTask task={task} busy={busy} />
  }
}

export function LessonScreen() {
  const live = useGame((s) => s.me?.lesson ?? null)
  const hearts = useGame((s) => s.me?.hearts ?? 0)
  const busy = useGame((s) => s.busy)
  const { check, quitLesson } = useGame.getState()
  const answer = useAnswer()

  // Последний урок держим, чтобы экран не мигал пустотой во время анимации выхода
  const last = useRef<LessonView | null>(null)
  if (live) last.current = live
  const l = last.current
  if (!l) return null
  const { task } = l
  const ready = canCheck(task, answer)
  const thinking = busy && task.type === 'sb' && !l.checked

  return (
    <div className="absolute inset-0 flex flex-col" style={{ paddingTop: 'var(--top)' }}>
      <div className="flex items-center gap-3.5 px-5 pb-1.5 pt-2.5">
        <button type="button" onClick={quitLesson} aria-label="Выйти из урока" className="grid h-9 w-9 place-items-center text-ink-3">
          <Icon name="x" size={22} />
        </button>
        <ProgressBar value={l.got / l.total} />
        <motion.div key={hearts} initial={{ scale: 1.4 }} animate={{ scale: 1 }} className="flex items-center gap-[5px] text-base font-extrabold">
          <span className="text-err">
            <Icon name="heart" size={22} />
          </span>
          {hearts}
        </motion.div>
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={`${l.nodeId}-${l.idx}-${l.startedAt}`}
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -40 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          className="no-scrollbar flex flex-1 flex-col gap-[18px] overflow-y-auto px-5 pb-6 pt-3.5 [&>*]:shrink-0"
        >
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-[.08em] text-acc-ink">
              <span className="flex items-center gap-1.5">
                <Icon name={META[task.type].icon} size={14} />
                {taskLabel(task)}
              </span>
              {l.idx >= l.total && <span className="rounded-md bg-err-soft px-2 py-0.5 text-[10.5px] text-err-ink">Работа над ошибками</span>}
            </div>
            <div className="text-pretty font-display text-[22px] font-bold leading-[1.2] tracking-[-.025em]">{task.title}</div>
          </div>
          <TaskBody task={task} busy={thinking} />
        </motion.div>
      </AnimatePresence>

      <div className="border-t border-line px-5 pt-3.5" style={{ paddingBottom: 'calc(var(--bottom) + 10px)' }}>
        <Button disabled={!ready || l.checked || busy} onClick={check}>
          {thinking ? 'Блинк думает…' : 'Проверить'}
        </Button>
      </div>

      <FeedbackSheet type={task.type} fb={l.checked ? l.feedback : null} />
    </div>
  )
}
