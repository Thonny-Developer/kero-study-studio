import { animate, useMotionValue, useMotionValueEvent } from 'framer-motion'
import { useEffect, useState } from 'react'

/** Число, которое «докручивается» до нового значения */
export function AnimatedNumber({ value, format = (n) => Math.round(n).toLocaleString('ru-RU') }: { value: number; format?: (n: number) => string }) {
  const mv = useMotionValue(value)
  const [text, setText] = useState(() => format(value))
  useMotionValueEvent(mv, 'change', (v) => setText(format(v)))
  useEffect(() => {
    const c = animate(mv, value, { duration: 0.6, ease: 'easeOut' })
    return () => c.stop()
  }, [mv, value])
  return <span className="tabular-nums">{text}</span>
}
