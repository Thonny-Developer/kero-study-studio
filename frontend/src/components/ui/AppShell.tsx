import { useEffect, useState, type ReactNode } from 'react'

const DESKTOP = '(min-width: 900px)'

export function useIsDesktop() {
  const [desktop, setDesktop] = useState(() => matchMedia(DESKTOP).matches)
  useEffect(() => {
    const mq = matchMedia(DESKTOP)
    const on = () => setDesktop(mq.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])
  return desktop
}

/**
 * Телефон — приложение на весь экран (на планшете колонка по центру).
 * Десктоп — меню слева, экран в центральной колонке, виджеты справа; уроки и вход — колонка без меню.
 */
export function AppShell({
  children,
  tabBar,
  nav,
  rail,
  tabbed,
  wide = false,
}: {
  children: ReactNode
  tabBar: ReactNode
  nav: ReactNode
  rail: ReactNode
  tabbed: boolean
  /** экран сам держит колонку контента (карта с фоном на всю ширину) */
  wide?: boolean
}) {
  const desktop = useIsDesktop()

  if (!desktop) {
    return (
      <div className="h-[100dvh] w-full bg-bg">
        <div className="relative mx-auto h-full w-full max-w-[600px] overflow-hidden bg-bg text-ink">
          {children}
          {tabbed && tabBar}
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-[100dvh] w-full bg-bg text-ink">
      {tabbed && <aside className="no-scrollbar flex w-[232px] shrink-0 flex-col overflow-y-auto border-r-[1.5px] border-line px-4 py-6 xl:w-[264px]">{nav}</aside>}
      <main className="flex min-w-0 flex-1 justify-center">
        <div className={`desk relative h-full w-full overflow-hidden ${wide ? '' : tabbed ? 'max-w-[600px]' : 'max-w-[680px]'}`}>{children}</div>
      </main>
      {tabbed && <aside className="no-scrollbar hidden w-[340px] shrink-0 overflow-y-auto px-6 py-6 min-[1200px]:block">{rail}</aside>}
    </div>
  )
}
