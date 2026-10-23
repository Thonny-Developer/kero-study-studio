import { AnimatePresence, motion } from 'framer-motion'
import { useRef, useState } from 'react'
import { Mascot } from '../components/Mascot'
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

/** Разбивает вступление на главное определение и практическое правило */
function splitIntro(intro: string): { lead: string; rule: string | null } {
  const parts = intro
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean)
  if (parts.length <= 1) return { lead: intro, rule: null }
  return {
    lead: parts[0],
    rule: parts.slice(1).join(' '),
  }
}

type ParsedExample =
  | { kind: 'compare'; badLabel: string; bad: string; goodLabel: string; good: string }
  | { kind: 'steps'; items: string[] }
  | { kind: 'quote'; text: string }

/** Умный разбор примера: «Слабо / Точнее», «Вместо … — …» или пошаговая цепочка */
function parseExample(raw: string): ParsedExample {
  const weakStrong = raw.match(/^(Слабо|Общее):\s*(.+?)\.\s*(Точнее|Конкретнее):\s*(.+)$/i)
  if (weakStrong) {
    return {
      kind: 'compare',
      badLabel: weakStrong[1],
      bad: weakStrong[2].replace(/^[«"]|[»".]+$/g, ''),
      goodLabel: weakStrong[3],
      good: weakStrong[4].replace(/^[«"]|[»".]+$/g, ''),
    }
  }

  const instead = raw.match(/^Вместо\s+[«"](.+?)[»"]\s*[:—-]\s*[«"]?(.+?)[»".]*$/i)
  if (instead) {
    return {
      kind: 'compare',
      badLabel: 'Слабо',
      bad: instead[1].trim(),
      goodLabel: 'Точнее',
      good: instead[2].replace(/[»".]+$/, '').trim(),
    }
  }

  if (raw.includes('→')) {
    const items = raw
      .split('→')
      .map((s) => s.trim())
      .filter(Boolean)
    if (items.length >= 2) return { kind: 'steps', items }
  }

  if (raw.includes(';')) {
    const items = raw
      .split(';')
      .map((s) => s.trim().replace(/\.$/, ''))
      .filter(Boolean)
    if (items.length >= 3) return { kind: 'steps', items }
  }

  return { kind: 'quote', text: raw }
}

const cardVariants = {
  hidden: { opacity: 0, y: 18, scale: 0.97 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      delay: i * 0.09,
      type: 'spring' as const,
      stiffness: 340,
      damping: 26,
    },
  }),
}

function StudyPage({ name, study }: { name: string; study: LessonView['study'] }) {
  const [mascotJump, setMascotJump] = useState(false)
  const { lead, rule } = splitIntro(study.intro)
  const example = parseExample(study.example)

  return (
    <div className="flex flex-col gap-3.5">
      {/* 1. Главная карточка: Заголовок + Блинк + Суть + Главное правило */}
      <motion.div
        custom={0}
        variants={cardVariants}
        initial="hidden"
        animate="show"
        className="relative overflow-hidden rounded-card border-[1.5px] border-line bg-sf p-4 shadow-card"
      >
        {/* Мягкое фоновое свечение */}
        <motion.div
          className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-acc/10 blur-2xl"
          animate={{ scale: [1, 1.25, 1], opacity: [0.5, 0.85, 0.5] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        />

        <div className="relative flex items-start justify-between gap-3">
          <div className="flex-1">
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.08, duration: 0.25 }}
              className="inline-flex items-center gap-1.5 rounded-lg bg-acc-soft px-2.5 py-1 font-mono text-[10.5px] font-extrabold tracking-[.06em] text-acc-ink"
            >
              <motion.span
                animate={{ rotate: [0, 18, -12, 0], scale: [1, 1.15, 1] }}
                transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
              >
                <Icon name="spark" size={12} />
              </motion.span>
              КОРОТКИЙ УРОК
            </motion.div>
            <h1 className="mt-2 font-display text-[22px] font-extrabold leading-tight tracking-[-.03em] text-ink">
              {name}
            </h1>
          </div>

          <motion.button
            type="button"
            whileTap={{ scale: 0.9 }}
            onClick={() => {
              setMascotJump(true)
              setTimeout(() => setMascotJump(false), 1100)
            }}
            className="shrink-0 cursor-pointer"
            aria-label="Блинк"
          >
            <Mascot size={58} mood={mascotJump ? 'wow' : 'happy'} anim={mascotJump ? 'jump' : 'bob'} />
          </motion.button>
        </div>

        <motion.p
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.14, duration: 0.25 }}
          className="mt-3 text-[15px] font-bold leading-[1.48] text-ink"
        >
          {lead}
        </motion.p>

        {rule && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.22, type: 'spring', stiffness: 320, damping: 26 }}
            className="mt-3 flex items-start gap-2.5 rounded-xl border border-acc/25 bg-acc-soft/60 p-3"
          >
            <motion.span
              animate={{ scale: [1, 1.12, 1] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
              className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md bg-acc text-white"
            >
              <Icon name="bolt" size={12} />
            </motion.span>
            <p className="text-[13.5px] font-semibold leading-[1.45] text-ink">{rule}</p>
          </motion.div>
        )}
      </motion.div>

      {/* 2. Наглядный разбор примера */}
      <motion.div
        custom={1}
        variants={cardVariants}
        initial="hidden"
        animate="show"
        className="rounded-card border-[1.5px] border-line bg-sf p-4"
      >
        <div className="mb-3 flex items-center gap-2 font-mono text-[11px] font-extrabold tracking-[.08em] text-ink-3">
          <Icon name="code" size={14} />
          РАЗБЕРЁМ НА ПРИМЕРЕ
        </div>

        {example.kind === 'compare' && (
          <div className="flex flex-col gap-2.5">
            <motion.div
              initial={{ opacity: 0, x: -14 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.22, type: 'spring', stiffness: 320, damping: 26 }}
              whileHover={{ scale: 1.01 }}
              className="flex items-start gap-2.5 rounded-xl border border-err/30 bg-err-soft p-3"
            >
              <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-err text-white">
                <Icon name="x" size={12} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="font-mono text-[10px] font-extrabold uppercase tracking-wider text-err-ink">
                  {example.badLabel}
                </div>
                <div className="mt-0.5 text-[13.5px] font-semibold leading-snug text-ink">
                  «{example.bad}»
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 14 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.32, type: 'spring', stiffness: 320, damping: 24 }}
              whileHover={{ scale: 1.01 }}
              className="flex items-start gap-2.5 rounded-xl border border-ok/35 bg-ok-soft p-3"
            >
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.42, type: 'spring', stiffness: 420, damping: 18 }}
                className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-ok text-white"
              >
                <Icon name="check" size={12} />
              </motion.span>
              <div className="min-w-0 flex-1">
                <div className="font-mono text-[10px] font-extrabold uppercase tracking-wider text-ok-ink">
                  {example.goodLabel}
                </div>
                <div className="mt-0.5 text-[13.5px] font-bold leading-snug text-ink">
                  «{example.good}»
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {example.kind === 'steps' && (
          <div className="flex flex-col gap-2">
            {example.items.map((step, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + idx * 0.08, type: 'spring', stiffness: 320, damping: 26 }}
                className="flex items-center gap-2.5 rounded-xl border border-line bg-sf2 px-3 py-2.5"
              >
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-acc-soft font-mono text-xs font-extrabold text-acc-ink">
                  {idx + 1}
                </span>
                <span className="text-[13.5px] font-semibold leading-snug text-ink">{step}</span>
              </motion.div>
            ))}
          </div>
        )}

        {example.kind === 'quote' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.24, duration: 0.25 }}
            className="rounded-xl border-l-4 border-acc bg-sf2 p-3.5 font-mono text-[13px] font-semibold leading-[1.55] text-ink"
          >
            {example.text}
          </motion.div>
        )}
      </motion.div>

      {/* 3. Шпаргалка / Готовый шаблон */}
      <motion.div
        custom={2}
        variants={cardVariants}
        initial="hidden"
        animate="show"
        className="rounded-card border-[1.5px] border-acc/30 bg-acc-soft/45 p-4"
      >
        <div className="mb-2 flex items-center gap-2 font-mono text-[11px] font-extrabold tracking-[.08em] text-acc-ink">
          <Icon name="star" size={14} />
          ГОТОВЫЙ ШАБЛОН
        </div>
        <div className="rounded-xl border border-line bg-sf p-3 font-mono text-[13px] font-semibold leading-[1.5] text-ink shadow-sm">
          {study.sample}
        </div>
      </motion.div>
    </div>
  )
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
  const infiniteHearts = useGame((s) => s.me?.infiniteHearts ?? false)
  const busy = useGame((s) => s.busy)
  const study = useGame((s) => s.study)
  const { check, quitLesson, finishStudy } = useGame.getState()
  const answer = useAnswer()

  // Последний урок держим, чтобы экран не мигал пустотой во время анимации выхода
  const last = useRef<LessonView | null>(null)
  if (live) last.current = live
  const l = last.current
  if (!l) return null
  const { task } = l
  const showingStudy = study.nodeId !== l.nodeId || !study.done
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
          {infiniteHearts ? '∞' : hearts}
        </motion.div>
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={`${l.nodeId}-${l.idx}-${l.startedAt}-${showingStudy ? 'study' : 'task'}`}
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -40 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          className="no-scrollbar flex flex-1 flex-col gap-[18px] overflow-y-auto px-5 pb-6 pt-3.5 [&>*]:shrink-0"
        >
          {showingStudy ? (
            <StudyPage key={l.nodeId} name={l.name} study={l.study} />
          ) : (
            <>
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
            </>
          )}
        </motion.div>
      </AnimatePresence>

      <div className="border-t border-line px-5 pt-3.5" style={{ paddingBottom: 'calc(var(--bottom) + 10px)' }}>
        <Button
          disabled={showingStudy ? false : !ready || l.checked || busy}
          onClick={() => (showingStudy ? finishStudy(l.nodeId) : check())}
        >
          {showingStudy ? 'Перейти к заданиям' : thinking ? 'Блинк думает…' : 'Проверить'}
        </Button>
      </div>

      <FeedbackSheet type={task.type} fb={l.checked ? l.feedback : null} />
    </div>
  )
}
