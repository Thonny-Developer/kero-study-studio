export type Track = 'code' | 'mkt'

interface TaskBase {
  title: string
  /** пояснение под заголовком задания */
  ctx?: string
  /** заголовок шита при верном ответе */
  okTitle?: string
  okText: string
  badText: string
  /** что показать в блоке «Правильный ответ» */
  answer?: string
}

/** Выбор варианта: промпт (mono) или обычный текст */
export interface PickTask extends TaskBase {
  type: 'pick'
  options: string[]
  correct: number
  mono?: boolean
}

/** Сборка промпта из блоков (тап или drag&drop) */
export interface AsmTask extends TaskBase {
  type: 'asm'
  file?: string
  blocks: Record<string, string>
  /** порядок блоков в пуле */
  pool: string[]
  /** правильная последовательность id */
  right: string[]
}

/** Найди строку с ошибкой */
export interface BugTask extends TaskBase {
  type: 'bug'
  file: string
  lang: 'js' | 'py' | 'html' | 'text'
  lines: string[]
  correct: number
}

/** Выбор заголовка с превью лендинга */
export interface HeadTask extends TaskBase {
  type: 'head'
  site: { url: string; cta: string }
  options: string[]
  correct: number
}

export type Creative =
  | { kind: 'sale'; top: string; big: string; bottom: string; bg?: string; color?: string }
  | { kind: 'pov'; label: string; text: string; tag: string }
  | { kind: 'brand'; letter: string; name: string; caption: string }
  | { kind: 'wall'; text: string }

/** Выбор креатива из трёх сторис */
export interface CreTask extends TaskBase {
  type: 'cre'
  options: [Creative, Creative, Creative]
  correct: number
}

/** AI-песочница: свободный промпт с оценкой Claude */
export interface SbTask {
  type: 'sb'
  title: string
  task: string
  example: string
}

export type Task = PickTask | AsmTask | BugTask | HeadTask | CreTask | SbTask
export type TaskType = Task['type']

/** Что генерирует AI по финальному промпту проекта */
export type ArtifactKind = 'html' | 'code' | 'text'

export interface ProjectInfo {
  title: string
  artifact: ArtifactKind
  achievement: string
  achievementIcon: string
  /** карточка в портфолио профиля */
  folio: { title: string; tag: string; icon: string }
}

export type NodeKind = 'lesson' | 'chest' | 'project'

export interface LessonNode {
  id: string
  kind: 'lesson' | 'project'
  name: string
  tasks: Task[]
}

export interface ChestNode {
  id: string
  kind: 'chest'
  name: string
  xp: number
}

export type PathNode = LessonNode | ChestNode

export interface Unit {
  id: string
  title: string
  sub: string
  nodes: PathNode[]
  project: ProjectInfo
}
