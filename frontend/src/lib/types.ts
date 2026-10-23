// Формы ответов API (backend/src/views.ts, backend/src/game.ts)

export type Track = 'code' | 'mkt'

export type Creative =
  | { kind: 'sale'; top: string; big: string; bottom: string; bg?: string; color?: string }
  | { kind: 'pov'; label: string; text: string; tag: string }
  | { kind: 'brand'; letter: string; name: string; caption: string }
  | { kind: 'wall'; text: string }

export type Task =
  | { type: 'pick'; title: string; ctx?: string; options: string[]; mono?: boolean }
  | { type: 'asm'; title: string; ctx?: string; file?: string; blocks: Record<string, string>; pool: string[] }
  | { type: 'bug'; title: string; ctx?: string; file: string; lang: 'js' | 'py' | 'html' | 'text'; lines: string[] }
  | { type: 'head'; title: string; ctx?: string; site: { url: string; cta: string }; options: string[] }
  | { type: 'cre'; title: string; ctx?: string; options: Creative[] }
  | { type: 'sb'; title: string; task: string; example: string }

export type TaskType = Task['type']
export type TaskOf<T extends TaskType> = Extract<Task, { type: T }>

export interface Feedback {
  correct: boolean
  title: string
  text: string
  answer?: string
  correctIndex?: number
  right?: string[]
  score?: number
  xp: number
}

export interface LessonView {
  nodeId: string
  name: string
  kind: 'lesson' | 'project'
  track: Track
  unitId: string
  study: { intro: string; example: string; practice: string; sample: string }
  idx: number
  total: number
  got: number
  mist: number
  xp: number
  startedAt: number
  task: Task
  checked: boolean
  answer: { sel?: number; chosen?: string[]; prompt?: string } | null
  feedback: Feedback | null
}

export interface Me {
  user: { id: string; name: string; email: string | null; emailVerified: boolean; goal: string | null; level: string | null; mins: number | null; track: Track; createdAt: number }
  isAdmin: boolean
  infiniteHearts: boolean
  xp: number
  /** XP, которые ещё можно обменять на монеты */
  xpBalance: number
  coins: number
  /** купленное оформление */
  owned: ShopItemId[]
  /** надетая рамка аватара */
  avatarFrame: AvatarFrameId | null
  /** активный окрас имени */
  nameColor: NameColorId | null
  doubleXpUntil: number | null
  weekXp: number
  hearts: number
  heartsAt: number | null
  heartMs: number
  maxHearts: number
  streak: number
  maxStreak: number
  bugs: number
  today: string
  days: string[]
  todayLessons: number
  questGoal: number
  questXp: number
  questDone: boolean
  done: string[]
  units: Record<string, { lessons: number; tasks: number; xp: number }>
  projects: { id: string; unitId: string; kind: ArtifactKind; ready: boolean }[]
  lesson: LessonView | null
}

export interface LessonResult {
  nodeId: string
  unitId: string
  track: Track
  isProject: boolean
  earned: number
  flawlessBonus: number
  questBonus: number
  projectBonus: number
  boostBonus: number
  accuracy: number
  timeMs: number
  streak: number
}

export type ArtifactKind = 'html' | 'code' | 'text'

export interface ProjectInfo {
  title: string
  artifact: ArtifactKind
  achievement: string
  achievementIcon: string
  folio: { title: string; tag: string; icon: string }
}

export interface NodeView {
  id: string
  kind: 'lesson' | 'project' | 'chest'
  name: string
  tasks: number
}

export interface UnitView {
  id: string
  title: string
  sub: string
  project: ProjectInfo
  nodes: NodeView[]
}

export interface Course {
  tracks: Record<Track, UnitView[]>
}

export interface League {
  daysLeft: number
  total: number
  me: number
  rows: { rank: number; id: string; name: string; frame: AvatarFrameId | null; nameColor: NameColorId | null; xp: number; me: boolean }[]
}

export interface Project {
  id: string
  unitId: string
  kind: ArtifactKind
  prompt: string
  output: string | null
  model: string | null
  updatedAt: number
}

export type AvatarFrameId =
  | 'frame'
  | 'frame_emerald'
  | 'frame_ice'
  | 'frame_neon'
  | 'frame_thunder'
  | 'frame_sakura'
  | 'frame_fire'
  | 'frame_glitch'
  | 'frame_cosmos'
  | 'frame_dragon'
  | 'frame_void'

export type NameColorId =
  | 'color_gold'
  | 'color_emerald'
  | 'color_sunset'
  | 'color_ocean'
  | 'color_cyber'
  | 'color_fire'
  | 'color_aurora'
  | 'color_royal'

export type ShopItemId = 'heart' | 'double' | 'blink' | AvatarFrameId | NameColorId

export interface ShopMarket {
  /** Давление рынка от -100 (сжигание/скидка) до +100 (высокий спрос) */
  pressure: number
  netImpulse: number
  bought24h: number
  sold24h: number
  burned24h: number
  xp24h: number
}

/** Курс монеты в XP и цены товаров */
export interface Shop {
  price: number
  sellPrice: number
  /** изменение за сутки, % */
  change: number
  nextAt: number
  live: [number, number][]
  day: [number, number][]
  week: [number, number][]
  market: ShopMarket
  items: Record<ShopItemId, number>
}
