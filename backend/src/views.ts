// Что уходит клиенту. Правильные ответы и тексты разборов не покидают сервер до проверки.
import { COURSE, TRACKS } from './content/lessons.js'
import type { Creative, Task, Track } from './content/types.js'

export type PublicTask =
  | { type: 'pick'; title: string; ctx?: string; options: string[]; mono?: boolean }
  | { type: 'asm'; title: string; ctx?: string; file?: string; blocks: Record<string, string>; pool: string[] }
  | { type: 'bug'; title: string; ctx?: string; file: string; lang: 'js' | 'py' | 'html' | 'text'; lines: string[] }
  | { type: 'head'; title: string; ctx?: string; site: { url: string; cta: string }; options: string[] }
  | { type: 'cre'; title: string; ctx?: string; options: Creative[] }
  | { type: 'sb'; title: string; task: string; example: string }

export function publicTask(t: Task): PublicTask {
  switch (t.type) {
    case 'pick':
      return { type: t.type, title: t.title, ctx: t.ctx, options: t.options, mono: t.mono }
    case 'asm':
      return { type: t.type, title: t.title, ctx: t.ctx, file: t.file, blocks: t.blocks, pool: t.pool }
    case 'bug':
      return { type: t.type, title: t.title, ctx: t.ctx, file: t.file, lang: t.lang, lines: t.lines }
    case 'head':
      return { type: t.type, title: t.title, ctx: t.ctx, site: t.site, options: t.options }
    case 'cre':
      return { type: t.type, title: t.title, ctx: t.ctx, options: t.options }
    case 'sb':
      return { type: t.type, title: t.title, task: t.task, example: t.example }
  }
}

/** Структура курса для карты — без заданий */
export function courseView() {
  const tracks = {} as Record<Track, unknown[]>
  for (const track of TRACKS) {
    tracks[track] = COURSE[track].map((u) => ({
      id: u.id,
      title: u.title,
      sub: u.sub,
      project: u.project,
      nodes: u.nodes.map((n) => ({ id: n.id, kind: n.kind, name: n.name, tasks: n.kind === 'chest' ? 0 : n.tasks.length })),
    }))
  }
  return { tracks }
}
