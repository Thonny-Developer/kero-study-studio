import { motion } from 'framer-motion'
import { Icon } from '../../lib/icons'
import { useGame } from '../../store/game'
import { Logo } from './Logo'
import { TABS } from './TabBar'

/** Боковое меню десктопа: разделы, тема, выход */
export function SidePanel() {
  const theme = useGame((s) => s.theme)
  const screen = useGame((s) => s.screen)
  const me = useGame((s) => s.me)
  const { setTheme, go, logout } = useGame.getState()
  const seg = (on: boolean) => (on ? 'bg-sf text-ink shadow-seg' : 'text-ink-2')

  return (
    <div className="flex min-h-full flex-col gap-6">
      <div className="px-3 pt-1">
        <Logo size={28} />
      </div>

      <nav className="flex flex-col gap-1">
        {TABS.map((t) => {
          const on = screen === t.screen
          return (
            <button
              key={t.screen}
              type="button"
              onClick={() => go(t.screen)}
              className={`relative flex h-12 items-center gap-3.5 rounded-tile px-3 text-[15px] font-extrabold transition-colors ${
                on ? 'text-acc-ink' : 'text-ink-2 hover:bg-sf2'
              }`}
            >
              {on && (
                <motion.span
                  layoutId="side-nav"
                  className="absolute inset-0 rounded-tile border-2 border-acc bg-acc-soft"
                  transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                />
              )}
              <span className="relative">
                <Icon name={t.icon} size={22} />
              </span>
              <span className="relative">{t.label}</span>
            </button>
          )
        })}
      </nav>

      <div className="mt-auto flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-1 rounded-tile bg-sf2 p-1">
          <button type="button" onClick={() => setTheme('light')} className={`flex h-9 items-center justify-center gap-1.5 rounded-[10px] text-[13px] font-bold ${seg(theme === 'light')}`}>
            <Icon name="sun" size={15} />
            Светлая
          </button>
          <button type="button" onClick={() => setTheme('dark')} className={`flex h-9 items-center justify-center gap-1.5 rounded-[10px] text-[13px] font-bold ${seg(theme === 'dark')}`}>
            <Icon name="moon" size={15} />
            Тёмная
          </button>
        </div>
        {me && (
          <div className="flex items-center justify-between gap-2 px-3">
            <span className="truncate font-mono text-[11px] font-bold tracking-[.08em] text-ink-3">{me.user.name.toUpperCase()}</span>
            <button type="button" onClick={logout} className="shrink-0 rounded-lg px-2 py-1 text-[13px] font-semibold text-ink-3 hover:bg-sf2 hover:text-ink">
              Выйти
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
