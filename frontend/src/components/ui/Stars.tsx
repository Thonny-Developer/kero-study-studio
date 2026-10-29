import { useState } from 'react'
import { Icon } from '../../lib/icons'

/** Оценка 1–5. С onChange — кликабельная, с подсветкой при наведении */
export function Stars({ value, size = 18, onChange }: { value: number; size?: number; onChange?: (v: number) => void }) {
  const [hover, setHover] = useState(0)
  const shown = hover || value
  return (
    <div className="flex items-center gap-0.5" onPointerLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map((n) => {
        const star = (
          <span className={`transition-colors ${n <= shown ? 'text-gold' : 'text-sf2'}`}>
            <Icon name="star" size={size} />
          </span>
        )
        if (!onChange) return <span key={n}>{star}</span>
        return (
          <button
            key={n}
            type="button"
            aria-label={`${n} из 5`}
            onPointerEnter={(e) => e.pointerType === 'mouse' && setHover(n)}
            onClick={() => onChange(n)}
            className="p-0.5 transition-transform active:scale-90"
          >
            {star}
          </button>
        )
      })}
    </div>
  )
}
