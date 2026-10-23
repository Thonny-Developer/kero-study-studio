import { motion, type TargetAndTransition } from 'framer-motion'
import type { ReactNode } from 'react'

export type Mood = 'idle' | 'happy' | 'sad' | 'wow'
export type MascotAnim = 'bob' | 'jump' | 'tilt' | 'none'

const G = '#8CFFC1'
const K = '#16141D'
const stroke = { stroke: G, strokeWidth: 4.5, fill: 'none', strokeLinecap: 'round' as const }

const ANIM: Record<MascotAnim, TargetAndTransition | undefined> = {
  bob: { y: ['0%', '-6%', '0%'], transition: { duration: 2.6, ease: 'easeInOut', repeat: Infinity } },
  jump: {
    y: ['0%', '-16%', '0%', '0%'],
    rotate: [0, -6, 5, 0],
    transition: { duration: 1.1, ease: 'easeInOut', times: [0, 0.3, 0.6, 1], repeat: Infinity },
  },
  tilt: { rotate: [0, -8, 0], transition: { duration: 1.8, ease: 'easeInOut', repeat: Infinity } },
  none: undefined,
}

function Face({ mood }: { mood: Mood }) {
  switch (mood) {
    case 'happy':
      return (
        <>
          <path d="M34 59 Q40 49 46 59" {...stroke} />
          <path d="M54 59 Q60 49 66 59" {...stroke} />
          <path d="M43 65 Q50 72 57 65" {...stroke} strokeWidth={3.5} />
        </>
      )
    case 'sad':
      return (
        <>
          <rect x={36} y={54} width={8} height={7} rx={2.5} fill={G} />
          <rect x={56} y={54} width={8} height={7} rx={2.5} fill={G} />
          <path d="M34 49 L44 52M66 49 L56 52" {...stroke} strokeWidth={3} />
          <path d="M44 69 Q50 64 56 69" {...stroke} strokeWidth={3.5} />
        </>
      )
    case 'wow':
      return (
        <>
          <circle cx={40} cy={55} r={6} fill={G} />
          <circle cx={60} cy={55} r={6} fill={G} />
          <circle cx={50} cy={67} r={3.5} fill={G} />
        </>
      )
    default:
      return (
        <>
          <g className="animate-blink" style={{ transformOrigin: '50px 55px' }}>
            <rect x={36} y={48} width={8} height={13} rx={2.5} fill={G} />
            <rect x={56} y={48} width={8} height={13} rx={2.5} fill={G} />
          </g>
          <rect x={45} y={66} width={10} height={3.5} rx={1.75} fill={G} />
        </>
      )
  }
}

/** Блинк — робот-курсор. Красится в цвет активного трека. */
export function Mascot({
  size = 84,
  mood = 'idle',
  anim = 'bob',
  color = 'var(--acc)',
  children,
}: {
  size?: number
  mood?: Mood
  anim?: MascotAnim
  color?: string
  /** Аксессуары: двигаются вместе с Блинком */
  children?: ReactNode
}) {
  return (
    <motion.div
      key={`${mood}-${anim}`}
      style={{ position: 'relative', width: size, height: size, transformOrigin: '50% 90%', flexShrink: 0 }}
      animate={ANIM[anim]}
    >
      <svg width={size} height={size} viewBox="0 0 100 100" style={{ display: 'block', overflow: 'visible' }} aria-hidden>
        <path d="M50 27V15" stroke={color} strokeWidth={4} strokeLinecap="round" />
        <path d="M45 2L45 18L49 14.5L52 21L55 19.6L52 13.2L57 13.2Z" fill={color} stroke={color} strokeWidth={2.5} strokeLinejoin="round" />
        <rect x={29} y={83} width={15} height={10} rx={5} fill={color} />
        <rect x={56} y={83} width={15} height={10} rx={5} fill={color} />
        <rect x={16} y={26} width={68} height={62} rx={22} fill={color} />
        <rect x={24} y={31} width={18} height={4.5} rx={2.25} fill="#fff" opacity={0.4} />
        <rect x={25} y={40} width={50} height={36} rx={12} fill={K} />
        <Face mood={mood} />
      </svg>
      {children}
    </motion.div>
  )
}
