import { useGame, type Screen } from '../../store/game'
import { Icon, type IconName } from '../../lib/icons'

const TABS: { screen: Screen; label: string; icon: IconName }[] = [
  { screen: 'map', label: 'Путь', icon: 'map' },
  { screen: 'league', label: 'Лиги', icon: 'league' },
  { screen: 'profile', label: 'Профиль', icon: 'user' },
]

export function TabBar() {
  const screen = useGame((s) => s.screen)
  const go = useGame((s) => s.go)
  return (
    <nav
      className="absolute inset-x-0 bottom-0 z-10 grid grid-cols-3 border-t border-line bg-bg px-6 pt-2"
      style={{ paddingBottom: 'var(--bottom)' }}
    >
      {TABS.map((t) => {
        const active = screen === t.screen
        return (
          <button
            key={t.screen}
            type="button"
            onClick={() => go(t.screen)}
            className={`flex h-[52px] flex-col items-center justify-center gap-1 text-[11.5px] font-bold ${active ? 'text-acc-ink' : 'text-ink-3'}`}
          >
            <div className={`grid h-[30px] w-[52px] place-items-center rounded-xl transition-colors ${active ? 'bg-acc-soft' : ''}`}>
              <Icon name={t.icon} size={22} />
            </div>
            {t.label}
          </button>
        )
      })}
    </nav>
  )
}

export const TAB_SCREENS: Screen[] = ['map', 'league', 'profile']
