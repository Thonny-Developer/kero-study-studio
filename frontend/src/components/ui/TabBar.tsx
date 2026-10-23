import { useGame, type Screen } from '../../store/game'
import { Icon, type IconName } from '../../lib/icons'

export const TABS: { screen: Screen; label: string; icon: IconName }[] = [
  { screen: 'map', label: 'Путь', icon: 'map' },
  { screen: 'league', label: 'Лиги', icon: 'league' },
  { screen: 'pet', label: 'Питомец', icon: 'pet' },
  { screen: 'shop', label: 'Магазин', icon: 'gift' },
  { screen: 'profile', label: 'Профиль', icon: 'user' },
]

export function TabBar() {
  const screen = useGame((s) => s.screen)
  const go = useGame((s) => s.go)
  return (
    <nav
      className="absolute inset-x-0 bottom-0 z-10 grid grid-cols-5 border-t border-line bg-bg px-2 pt-2"
      style={{ paddingBottom: 'var(--bottom)' }}
    >
      {TABS.map((t) => {
        const active = screen === t.screen
        return (
          <button
            key={t.screen}
            type="button"
            onClick={() => go(t.screen)}
            className={`flex h-[52px] flex-col items-center justify-center gap-1 text-[11px] font-bold ${active ? 'text-acc-ink' : 'text-ink-3'}`}
          >
            <div className={`grid h-[30px] w-[46px] place-items-center rounded-xl transition-colors ${active ? 'bg-acc-soft' : ''}`}>
              <Icon name={t.icon} size={21} />
            </div>
            {t.label}
          </button>
        )
      })}
    </nav>
  )
}

export const TAB_SCREENS: Screen[] = ['map', 'league', 'pet', 'shop', 'profile']
