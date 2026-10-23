import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { useShallow } from 'zustand/react/shallow'
import { api, ApiError, onUnauthorized, setToken } from '../lib/api'
import type { Course, LessonResult, LessonView, Me, ShopItemId, Track } from '../lib/types'
import { toast } from './toast'

// Вся игровая логика (XP, сердечки, стрик, проверка ответов) — на бэкенде. Здесь только UI-состояние.

export const SB_PASS = 60
export const XP_PROJECT = 50

export type Screen = 'welcome' | 'onboarding' | 'login' | 'forgot' | 'verify' | 'map' | 'lesson' | 'end' | 'noHearts' | 'project' | 'league' | 'shop' | 'profile'
export type Theme = 'light' | 'dark'

export interface Draft {
  goal: string | null
  level: string | null
  mins: number | null
}

/** Черновик ответа на текущее задание до «Проверить» */
interface Ui {
  key: string
  sel: number | null
  chosen: string[]
  sbText: string
}

interface StudyState {
  nodeId: string
  text: string
  done: boolean
}

interface Data {
  token: string | null
  theme: Theme
  screen: Screen
  obStep: number
  draft: Draft
  ui: Ui
  study: StudyState
  result: LessonResult | null
  projectUnit: string | null
  // не сохраняются
  me: Me | null
  course: Course | null
  booted: boolean
  busy: boolean
  /** трек, который сейчас открыт на карте (сохраняется на сервере) */
  track: Track
  /** когда отправили последнее письмо с кодом — для таймера «отправить ещё раз» */
  codeSentAt: number
}

interface Actions {
  boot: () => Promise<void>
  refresh: () => Promise<void>
  setTheme: (t: Theme) => void
  go: (s: Screen) => void
  setObStep: (n: number) => void
  setDraft: (d: Partial<Draft>) => void
  register: (name: string, email: string, password: string) => Promise<boolean>
  login: (login: string, password: string) => Promise<boolean>
  sendEmailCode: (email?: string) => Promise<boolean>
  verifyEmail: (code: string) => Promise<boolean>
  forgot: (email: string) => Promise<boolean>
  resetPassword: (email: string, code: string, password: string) => Promise<boolean>
  logout: () => Promise<void>
  rename: (name: string) => Promise<boolean>
  setTrack: (t: Track) => void
  toggleInfiniteHearts: (enabled: boolean) => Promise<void>
  /** Обмен XP → монеты; 'price-changed' — курс сменился, пока юзер смотрел */
  exchange: (coins: number, price: number) => Promise<boolean | 'price-changed'>
  buy: (item: ShopItemId) => Promise<boolean>
  openNode: (id: string) => Promise<void>
  openProject: (unitId: string) => void
  select: (i: number) => void
  addBlock: (id: string) => void
  removeBlock: (id: string) => void
  reorder: (ids: string[]) => void
  setSbText: (t: string) => void
  check: () => Promise<void>
  next: () => Promise<void>
  quitLesson: () => Promise<void>
  retryLesson: () => Promise<void>
  setStudyText: (nodeId: string, text: string) => void
  finishStudy: (nodeId: string) => void
  continueAfterEnd: () => void
}

export type GameState = Data & Actions

const EMPTY_UI: Ui = { key: '', sel: null, chosen: [], sbText: '' }
const EMPTY_STUDY: StudyState = { nodeId: '', text: '', done: false }

const taskKey = (l: LessonView | null) => (l ? `${l.nodeId}:${l.idx}:${l.startedAt}` : '')

function fail(e: unknown) {
  toast(e instanceof ApiError ? e.message : 'Что-то пошло не так')
}

/** Экран, на котором должен быть юзер, исходя из состояния сервера */
function screenFor(me: Me, current: Screen): Screen {
  if (me.lesson) {
    if (current === 'noHearts' || (me.hearts <= 0 && !me.lesson.checked)) return 'noHearts'
    return 'lesson'
  }
  if (['lesson', 'noHearts', 'welcome', 'onboarding', 'login', 'forgot'].includes(current)) return 'map'
  return current
}

export const useGame = create<GameState>()(
  persist(
    (set, get) => {
      const applyMe = (me: Me, extra: Partial<Data> = {}) => {
        const key = taskKey(me.lesson)
        set({ me, track: get().me ? get().track : me.user.track, ...(get().ui.key !== key ? { ui: { ...EMPTY_UI, key } } : {}), ...extra })
      }

      const signedIn = async (token: string) => {
        setToken(token)
        set({ token, study: EMPTY_STUDY })
        const me = await api<Me>('/api/me')
        applyMe(me, { track: me.user.track, screen: screenFor(me, 'map'), obStep: 0 })
      }

      return {
        token: null,
        theme: typeof matchMedia !== 'undefined' && matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light',
        screen: 'welcome',
        obStep: 0,
        draft: { goal: null, level: null, mins: null },
        ui: EMPTY_UI,
        study: EMPTY_STUDY,
        result: null,
        projectUnit: null,
        me: null,
        course: null,
        booted: false,
        busy: false,
        track: 'code',
        codeSentAt: 0,

        boot: async () => {
          const { token } = get()
          setToken(token)
          try {
            const [course, me] = await Promise.all([api<Course>('/api/course'), token ? api<Me>('/api/me') : Promise.resolve(null)])
            set({ course })
            if (me) applyMe(me, { track: me.user.track, screen: screenFor(me, get().screen) })
            else if (!['welcome', 'onboarding', 'login'].includes(get().screen)) set({ screen: 'welcome' })
          } catch (e) {
            fail(e)
          } finally {
            set({ booted: true })
          }
        },

        refresh: async () => {
          if (!get().token) return
          try {
            applyMe(await api<Me>('/api/me'))
          } catch {
            /* фоновое обновление — молча */
          }
        },

        setTheme: (theme) => set({ theme }),
        go: (screen) => set({ screen }),
        setObStep: (obStep) => set({ obStep }),
        setDraft: (d) => set({ draft: { ...get().draft, ...d } }),

        register: async (name, email, password) => {
          set({ busy: true })
          try {
            const r = await api<{ token: string; emailSent: boolean }>('/api/auth/register', {
              body: { name, email, password, ...get().draft },
              timeout: 40_000,
            })
            await signedIn(r.token)
            set({ screen: 'verify', codeSentAt: r.emailSent ? Date.now() : 0 })
            if (!r.emailSent) toast('Аккаунт создан, но письмо не ушло — отправь код ещё раз')
            return true
          } catch (e) {
            fail(e)
            return false
          } finally {
            set({ busy: false })
          }
        },

        login: async (login, password) => {
          set({ busy: true })
          try {
            const { token } = await api<{ token: string }>('/api/auth/login', { body: { login, password } })
            await signedIn(token)
            return true
          } catch (e) {
            fail(e)
            return false
          } finally {
            set({ busy: false })
          }
        },

        sendEmailCode: async (email) => {
          set({ busy: true })
          try {
            const r = await api<{ email: string; state: Me }>('/api/email/send', { body: email ? { email } : {}, timeout: 40_000 })
            applyMe(r.state, { screen: 'verify', codeSentAt: Date.now() })
            toast(`Код отправлен на ${r.email}`)
            return true
          } catch (e) {
            fail(e)
            return false
          } finally {
            set({ busy: false })
          }
        },

        verifyEmail: async (code) => {
          set({ busy: true })
          try {
            const r = await api<{ state: Me }>('/api/email/verify', { body: { code } })
            applyMe(r.state)
            return true
          } catch (e) {
            fail(e)
            return false
          } finally {
            set({ busy: false })
          }
        },

        forgot: async (email) => {
          set({ busy: true })
          try {
            await api('/api/auth/forgot', { body: { email }, timeout: 40_000 })
            set({ codeSentAt: Date.now() })
            return true
          } catch (e) {
            fail(e)
            return false
          } finally {
            set({ busy: false })
          }
        },

        resetPassword: async (email, code, password) => {
          set({ busy: true })
          try {
            const { token } = await api<{ token: string }>('/api/auth/reset', { body: { email, code, password } })
            await signedIn(token)
            toast('Пароль обновлён')
            return true
          } catch (e) {
            fail(e)
            return false
          } finally {
            set({ busy: false })
          }
        },

        logout: async () => {
          await api('/api/auth/logout', { body: {} }).catch(() => {})
          setToken(null)
          set({ token: null, me: null, screen: 'welcome', result: null, projectUnit: null, ui: EMPTY_UI, study: EMPTY_STUDY })
        },

        rename: async (name) => {
          try {
            applyMe(await api<Me>('/api/me', { method: 'PATCH', body: { name } }))
            return true
          } catch (e) {
            fail(e)
            return false
          }
        },

        setTrack: (track) => {
          set({ track })
          api<Me>('/api/me', { method: 'PATCH', body: { track } }).catch(() => {})
        },

        toggleInfiniteHearts: async (enabled) => {
          if (get().busy) return
          set({ busy: true })
          try {
            applyMe(await api<Me>('/api/admin/infinite-hearts', { body: { enabled } }))
          } catch (e) {
            fail(e)
          } finally {
            set({ busy: false })
          }
        },

        exchange: async (coins, price) => {
          if (get().busy) return false
          set({ busy: true })
          try {
            applyMe((await api<{ state: Me }>('/api/shop/exchange', { body: { coins, price } })).state)
            return true
          } catch (e) {
            fail(e)
            return e instanceof ApiError && e.code === 'price-changed' ? 'price-changed' : false
          } finally {
            set({ busy: false })
          }
        },

        buy: async (item) => {
          if (get().busy) return false
          set({ busy: true })
          try {
            applyMe((await api<{ state: Me }>('/api/shop/buy', { body: { item } })).state)
            return true
          } catch (e) {
            fail(e)
            return false
          } finally {
            set({ busy: false })
          }
        },

        openNode: async (id) => {
          if (get().busy) return
          set({ busy: true })
          try {
            const r = await api<{ open: string; toast?: string; unitId?: string; state: Me }>(`/api/nodes/${id}/open`, { body: {} })
            if (r.open === 'chest') {
              applyMe(r.state)
              toast(r.toast!)
            } else if (r.open === 'project') applyMe(r.state, { projectUnit: r.unitId!, screen: 'project' })
            else applyMe(r.state, { screen: r.open === 'noHearts' ? 'noHearts' : 'lesson', track: r.state.lesson?.track ?? get().track })
          } catch (e) {
            fail(e)
          } finally {
            set({ busy: false })
          }
        },

        openProject: (unitId) => set({ projectUnit: unitId, screen: 'project' }),

        select: (i) => {
          if (!get().me?.lesson?.checked) set({ ui: { ...get().ui, sel: i } })
        },
        addBlock: (id) => {
          const ui = get().ui
          if (!get().me?.lesson?.checked && id && !ui.chosen.includes(id)) set({ ui: { ...ui, chosen: [...ui.chosen, id] } })
        },
        removeBlock: (id) => {
          const ui = get().ui
          if (!get().me?.lesson?.checked) set({ ui: { ...ui, chosen: ui.chosen.filter((x) => x !== id) } })
        },
        reorder: (chosen) => {
          if (!get().me?.lesson?.checked) set({ ui: { ...get().ui, chosen } })
        },
        setSbText: (sbText) => {
          if (!get().me?.lesson?.checked) set({ ui: { ...get().ui, sbText } })
        },

        check: async () => {
          const { me, ui, busy } = get()
          const l = me?.lesson
          if (!l || l.checked || busy) return
          set({ busy: true })
          try {
            const r =
              l.task.type === 'sb'
                ? await api<{ state: Me }>('/api/lesson/sandbox', { body: { prompt: ui.sbText }, timeout: 90_000 })
                : await api<{ state: Me }>('/api/lesson/answer', { body: l.task.type === 'asm' ? { chosen: ui.chosen } : { sel: ui.sel } })
            applyMe(r.state)
          } catch (e) {
            fail(e)
            if (e instanceof ApiError && e.status === 409) get().refresh()
          } finally {
            set({ busy: false })
          }
        },

        next: async () => {
          if (get().busy) return
          set({ busy: true })
          try {
            const r = await api<{ state: Me; result?: LessonResult; noHearts?: boolean }>('/api/lesson/next', { body: {} })
            if (r.noHearts) applyMe(r.state, { screen: 'noHearts' })
            else if (r.result) applyMe(r.state, { result: r.result, screen: 'end' })
            else applyMe(r.state)
          } catch (e) {
            fail(e)
          } finally {
            set({ busy: false })
          }
        },

        quitLesson: async () => {
          try {
            const r = await api<{ state: Me }>('/api/lesson/quit', { body: {} })
            applyMe(r.state, { screen: 'map' })
          } catch (e) {
            fail(e)
          }
        },

        retryLesson: async () => {
          try {
            const r = await api<{ state: Me }>('/api/lesson/retry', { body: {} })
            applyMe(r.state, { screen: 'lesson' })
          } catch (e) {
            fail(e)
          }
        },

        setStudyText: (nodeId, text) =>
          set((s) => ({ study: { nodeId, text, done: s.study.nodeId === nodeId && s.study.done } })),

        finishStudy: (nodeId) => set((s) => ({
          study: { nodeId, text: s.study.nodeId === nodeId ? s.study.text : '', done: true },
        })),

        continueAfterEnd: () => {
          const r = get().result
          if (r?.isProject) set({ projectUnit: r.unitId, screen: 'project' })
          else set({ screen: 'map' })
        },
      }
    },
    {
      name: 'vibely',
      version: 2,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        token: s.token,
        theme: s.theme,
        screen: s.screen,
        obStep: s.obStep,
        draft: s.draft,
        ui: s.ui,
        study: s.study,
        result: s.result,
        projectUnit: s.projectUnit,
        codeSentAt: s.codeSentAt,
      }),
      // старое локальное состояние (до бэкенда) не переносим
      migrate: (persisted, version) => (version < 2 ? {} : persisted) as Partial<GameState>,
    },
  ),
)

onUnauthorized(() => {
  setToken(null)
  useGame.setState({ token: null, me: null, screen: 'login' })
  toast('Сессия истекла, войди заново')
})

/* ---------- Селекторы для заданий ---------- */

export interface AnswerView {
  checked: boolean
  sel: number | null
  chosen: string[]
  sbText: string
  correctIndex: number
  right: string[]
}

const NONE: string[] = []

/** Ответ на текущее задание: до проверки — черновик, после — то, что принял сервер */
export function answerView(s: GameState): AnswerView {
  const l = s.me?.lesson
  if (l?.checked) {
    return {
      checked: true,
      sel: l.answer?.sel ?? null,
      chosen: l.answer?.chosen ?? NONE,
      sbText: l.answer?.prompt ?? s.ui.sbText,
      correctIndex: l.feedback?.correctIndex ?? -1,
      right: l.feedback?.right ?? NONE,
    }
  }
  return { checked: false, sel: s.ui.sel, chosen: s.ui.chosen, sbText: s.ui.sbText, correctIndex: -1, right: NONE }
}

export function nodeStatus(done: string[], order: string[], id: string): 'done' | 'cur' | 'lock' {
  if (done.includes(id)) return 'done'
  return order.find((x) => !done.includes(x)) === id ? 'cur' : 'lock'
}

export const useAnswer = () => useGame(useShallow(answerView))
