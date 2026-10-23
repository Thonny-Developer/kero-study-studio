import { Icon } from '../../lib/icons'
import { useGame, type Screen } from '../../store/game'
import { Logo } from './Logo'

/** Панель слева от телефона на десктопе: тема и быстрые переходы */
export function SidePanel() {
  const theme = useGame((s) => s.theme)
  const screen = useGame((s) => s.screen)
  const me = useGame((s) => s.me)
  const { setTheme, go, logout } = useGame.getState()

  const jumps: { label: string; screen: Screen }[] = [
    { label: 'Карта пути', screen: 'map' },
    { label: 'Лиги', screen: 'league' },
    { label: 'Магазин', screen: 'shop' },
    { label: 'Профиль', screen: 'profile' },
  ]
  const seg = (on: boolean) => (on ? 'bg-sf text-ink' : 'text-ink-2')
  const inLesson = screen === 'lesson' || screen === 'noHearts'

  return (
    <div className="flex flex-col gap-3.5 pt-3">
      <Logo size={34} />
      <div className="text-pretty text-[15px] leading-normal text-ink-2">
        Вайбкодинг и маркетинг по 5 минут в день. Открой с телефона и добавь на экран «Домой» — прогресс подтянется с сервера.
      </div>
      <div className="mt-1.5 grid grid-cols-2 gap-1 rounded-tile bg-sf2 p-1">
        <button type="button" onClick={() => setTheme('light')} className={`flex h-[38px] items-center justify-center gap-1.5 rounded-[10px] text-sm font-bold ${seg(theme === 'light')}`}>
          <Icon name="sun" size={16} />
          Светлая
        </button>
        <button type="button" onClick={() => setTheme('dark')} className={`flex h-[38px] items-center justify-center gap-1.5 rounded-[10px] text-sm font-bold ${seg(theme === 'dark')}`}>
          <Icon name="moon" size={16} />
          Тёмная
        </button>
      </div>
      {me && (
        <div className="flex flex-col gap-0.5 rounded-card border border-line bg-sf p-2">
          <div className="px-3 pb-1 pt-1.5 font-mono text-[11px] font-bold tracking-[.08em] text-ink-3">{me.user.name.toUpperCase()}</div>
          {jumps.map((j, i) => (
            <button
              key={j.label}
              type="button"
              disabled={inLesson}
              onClick={() => go(j.screen)}
              className={`flex items-center gap-3 rounded-xl px-3 py-[9px] text-left text-sm font-semibold disabled:opacity-40 ${screen === j.screen ? 'bg-acc-soft text-acc-ink' : 'text-ink'}`}
            >
              <span className="w-[18px] font-mono text-[11px] text-ink-3">{String(i + 1).padStart(2, '0')}</span>
              {j.label}
            </button>
          ))}
          <button type="button" onClick={logout} className="rounded-xl px-3 py-[9px] text-left text-sm font-semibold text-ink-3 hover:bg-sf2">
            Выйти
          </button>
        </div>
      )}
    </div>
  )
}
