import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useId, useMemo, useRef, useState, type PointerEvent } from 'react'

const H = 150

export const fmtPrice = (n: number) => n.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const fmtTime = (t: number, week: boolean) =>
  new Intl.DateTimeFormat('ru-RU', week ? { weekday: 'short', hour: '2-digit', minute: '2-digit' } : { hour: '2-digit', minute: '2-digit' }).format(t)

/** Сглаженная линия через середины отрезков */
function smooth(pts: [number, number][]) {
  let d = `M${pts[0][0]},${pts[0][1]}`
  for (let i = 1; i < pts.length - 1; i++) {
    const [x, y] = pts[i]
    const [nx, ny] = pts[i + 1]
    d += ` Q${x},${y} ${(x + nx) / 2},${(y + ny) / 2}`
  }
  const [lx, ly] = pts[pts.length - 1]
  return `${d} L${lx},${ly}`
}

/** График курса монеты: линия с заливкой, пульсирующая текущая точка и подсказка по касанию */
export function PriceChart({ points, week = false }: { points: [number, number][]; week?: boolean }) {
  const id = useId().replace(/:/g, '')
  const [hover, setHover] = useState<number | null>(null)
  const box = useRef<HTMLDivElement>(null)
  // рисуем в реальных пикселях, чтобы линия не растягивалась
  const [W, setW] = useState(300)
  useEffect(() => {
    const el = box.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => setW(Math.max(1, Math.round(e.contentRect.width))))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const { xy, line, area, min, max } = useMemo(() => {
    const prices = points.map((p) => p[1])
    const min = Math.min(...prices)
    const max = Math.max(...prices)
    const pad = (max - min || 1) * 0.18
    const lo = min - pad
    const hi = max + pad
    const xy = points.map(([, p], i): [number, number] => [(i / (points.length - 1)) * W, 8 + (1 - (p - lo) / (hi - lo)) * (H - 16)])
    const line = smooth(xy)
    return { xy, line, area: `${line} L${W},${H} L0,${H} Z`, min, max }
  }, [points, W])

  if (points.length < 2) return <div ref={box} className="h-[150px]" />

  const last = xy[xy.length - 1]
  const pick = (e: PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    const f = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width))
    setHover(Math.round(f * (points.length - 1)))
  }
  const h = hover === null ? null : xy[hover]
  const pct = (p: [number, number]) => ({ left: `${(p[0] / W) * 100}%`, top: `${(p[1] / H) * 100}%` })
  const drawKey = `${week}-${points[0][0]}`

  return (
    <div
      ref={box}
      className="relative h-[150px] touch-none select-none"
      onPointerDown={pick}
      onPointerMove={pick}
      onPointerLeave={() => setHover(null)}
      onPointerUp={(e) => e.pointerType !== 'mouse' && setHover(null)}
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 h-full w-full overflow-visible">
        <defs>
          <linearGradient id={`${id}a`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="var(--acc)" stopOpacity=".28" />
            <stop offset="1" stopColor="var(--acc)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map((f) => (
          <line key={f} x1="0" x2={W} y1={H * f} y2={H * f} stroke="var(--line)" strokeWidth="1" strokeDasharray="3 5" />
        ))}
        <motion.path
          key={`a-${drawKey}`}
          d={area}
          fill={`url(#${id}a)`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.35 }}
        />
        <line x1="0" x2={W} y1={last[1]} y2={last[1]} stroke="var(--acc)" strokeOpacity=".45" strokeWidth="1.2" strokeDasharray="4 4" />
        <motion.path
          key={`l-${drawKey}`}
          d={line}
          fill="none"
          stroke="var(--acc)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
         
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.8, ease: 'easeInOut' }}
        />
        {h && <line x1={h[0]} x2={h[0]} y1="0" y2={H} stroke="var(--ink3)" strokeWidth="1.2" strokeDasharray="2 3" />}
      </svg>

      <span className="pointer-events-none absolute right-0 top-0 font-mono text-[9.5px] font-bold text-ink-3">макс {fmtPrice(max)}</span>
      <span className="pointer-events-none absolute bottom-0 right-0 font-mono text-[9.5px] font-bold text-ink-3">мин {fmtPrice(min)}</span>

      {/* текущая цена */}
      <motion.div
        key={`d-${drawKey}`}
        className="pointer-events-none absolute"
        style={pct(last)}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 18, delay: 0.75 }}
      >
        <motion.span
          className="absolute -left-[9px] -top-[9px] h-[18px] w-[18px] rounded-full bg-acc"
          animate={{ scale: [1, 2.2], opacity: [0.45, 0] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: 'easeOut' }}
        />
        <span className="absolute -left-[6px] -top-[6px] h-3 w-3 rounded-full border-[2.5px] border-sf bg-acc" />
      </motion.div>

      <AnimatePresence>
        {h && hover !== null && (
          <motion.div
            className="pointer-events-none absolute"
            style={pct(h)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
          >
            <span className="absolute -left-[5px] -top-[5px] h-2.5 w-2.5 rounded-full border-2 border-sf bg-ink" />
            <div
              className="absolute bottom-3 whitespace-nowrap rounded-[10px] bg-ink px-2 py-1 text-center text-bg shadow-tip"
              style={{ transform: `translateX(${-Math.min(88, Math.max(12, (h[0] / W) * 100))}%)` }}
            >
              <div className="text-[12.5px] font-extrabold leading-tight">{fmtPrice(points[hover][1])} XP</div>
              <div className="font-mono text-[9.5px] font-bold opacity-70">{fmtTime(points[hover][0], week)}</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
