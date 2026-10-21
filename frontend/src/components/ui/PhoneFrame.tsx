import { useEffect, useState, type ReactNode } from 'react'

const W = 390
const H = 844

function useIsDesktop() {
  const query = '(min-width: 600px) and (min-height: 600px)'
  const [desktop, setDesktop] = useState(() => matchMedia(query).matches)
  useEffect(() => {
    const mq = matchMedia(query)
    const on = () => setDesktop(mq.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])
  return desktop
}

function useFitScale() {
  const calc = () => Math.min(1, (window.innerHeight - 48) / (H + 24))
  const [scale, setScale] = useState(calc)
  useEffect(() => {
    const on = () => setScale(calc())
    window.addEventListener('resize', on)
    return () => window.removeEventListener('resize', on)
  }, [])
  return scale
}

function useClock() {
  const fmt = () => new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
  const [time, setTime] = useState(fmt)
  useEffect(() => {
    const t = setInterval(() => setTime(fmt()), 15_000)
    return () => clearInterval(t)
  }, [])
  return time
}

function StatusBar() {
  const time = useClock()
  return (
    <>
      <div className="absolute left-1/2 top-[11px] z-[31] h-[35px] w-[122px] -translate-x-1/2 rounded-[20px] bg-black" />
      <div className="pointer-events-none absolute inset-x-0 top-0 z-30 flex h-[50px] items-center justify-between pl-10 pr-[30px] pt-1 text-ink">
        <span className="text-base font-bold">{time}</span>
        <div className="flex items-center gap-1.5">
          <div className="flex h-3 items-end gap-0.5">
            {[4, 6, 9, 12].map((h) => (
              <div key={h} className="w-[3px] rounded-[1px] bg-current" style={{ height: h }} />
            ))}
          </div>
          <div className="h-3 w-[25px] rounded border-[1.5px] border-current p-[1.5px]">
            <div className="h-full w-[78%] rounded-[1.5px] bg-current" />
          </div>
        </div>
      </div>
    </>
  )
}

/**
 * На телефоне — приложение на весь экран. На десктопе — по центру в рамке телефона 390×844,
 * слева панель как в макете.
 */
export function PhoneFrame({ children, side }: { children: ReactNode; side?: ReactNode }) {
  const desktop = useIsDesktop()
  const scale = useFitScale()

  if (!desktop) {
    return <div className="relative h-[100dvh] w-full overflow-hidden bg-bg text-ink">{children}</div>
  }

  return (
    <div className="flex min-h-full items-center justify-center gap-10 bg-page px-6 py-6 transition-colors">
      {side && <div className="hidden w-[300px] shrink-0 lg:block">{side}</div>}
      <div style={{ width: W * scale, height: H * scale }} className="shrink-0">
        <div
          className="phone-frame relative overflow-hidden rounded-phone bg-bg text-ink shadow-phone"
          style={{ width: W, height: H, transform: `scale(${scale})`, transformOrigin: 'top left' }}
        >
          <StatusBar />
          {children}
        </div>
      </div>
    </div>
  )
}
