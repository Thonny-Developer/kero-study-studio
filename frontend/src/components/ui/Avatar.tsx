import { motion } from 'framer-motion'
import { type CSSProperties, useId } from 'react'
import { initials } from '../../lib/text'
import type { AvatarFrameId, NameColorId } from '../../lib/types'

export const AVATAR_FRAMES: { id: AvatarFrameId; name: string; animated: boolean }[] = [
  { id: 'frame', name: 'Золотая корона', animated: false },
  { id: 'frame_emerald', name: 'Изумрудный кристалл', animated: false },
  { id: 'frame_ice', name: 'Арктический шторм', animated: true },
  { id: 'frame_neon', name: 'Неоновый импульс', animated: true },
  { id: 'frame_thunder', name: 'Грозовой разряд', animated: true },
  { id: 'frame_sakura', name: 'Вишнёвый вихрь', animated: true },
  { id: 'frame_fire', name: 'Солнечное пламя', animated: true },
  { id: 'frame_glitch', name: 'Кибер-глитч', animated: true },
  { id: 'frame_cosmos', name: 'Квантовая галактика', animated: true },
  { id: 'frame_dragon', name: 'Дыхание дракона', animated: true },
  { id: 'frame_void', name: 'Чёрная дыра', animated: true },
]

export const NAME_COLORS: {
  id: NameColorId
  name: string
  animated: boolean
  gradient: string
  glow?: string
}[] = [
  {
    id: 'color_gold',
    name: 'Чистое золото',
    animated: false,
    gradient: 'linear-gradient(110deg, #D97706 0%, #FBBF24 45%, #FEF08A 70%, #D97706 100%)',
  },
  {
    id: 'color_emerald',
    name: 'Ядовитый изумруд',
    animated: false,
    gradient: 'linear-gradient(110deg, #059669 0%, #10B981 50%, #A3E635 100%)',
  },
  {
    id: 'color_sunset',
    name: 'Малиновый закат',
    animated: false,
    gradient: 'linear-gradient(110deg, #FF512F 0%, #DD2476 55%, #FF8A00 100%)',
  },
  {
    id: 'color_ocean',
    name: 'Ледяной аквамарин',
    animated: false,
    gradient: 'linear-gradient(110deg, #0284C7 0%, #38BDF8 50%, #2DD4BF 100%)',
  },
  {
    id: 'color_cyber',
    name: 'Киберпанк',
    animated: true,
    gradient: 'linear-gradient(90deg, #00F0FF 0%, #7A5CFF 35%, #FF2E93 70%, #00F0FF 100%)',
    glow: '0 0 12px rgba(122,92,255,0.35)',
  },
  {
    id: 'color_fire',
    name: 'Живое пламя',
    animated: true,
    gradient: 'linear-gradient(90deg, #EF233C 0%, #FF7A00 40%, #FACC15 75%, #EF233C 100%)',
    glow: '0 0 12px rgba(255,122,0,0.35)',
  },
  {
    id: 'color_aurora',
    name: 'Северное сияние',
    animated: true,
    gradient: 'linear-gradient(90deg, #10B981 0%, #38BDF8 33%, #A855F7 66%, #EC4899 85%, #10B981 100%)',
    glow: '0 0 12px rgba(56,189,248,0.35)',
  },
  {
    id: 'color_royal',
    name: 'Имперский рубин',
    animated: true,
    gradient: 'linear-gradient(90deg, #E11D48 0%, #FBBF24 40%, #9333EA 75%, #E11D48 100%)',
    glow: '0 0 14px rgba(225,29,72,0.38)',
  },
]

const SPHERE_BG: Partial<Record<AvatarFrameId, string>> = {
  frame_ice: 'linear-gradient(135deg, #0284C7 0%, #38BDF8 55%, #0369A1 100%)',
  frame_neon: 'linear-gradient(135deg, #6D28D9 0%, #2563EB 50%, #DB2777 100%)',
  frame_thunder: 'linear-gradient(135deg, #1E3A8A 0%, #3B82F6 55%, #6366F1 100%)',
  frame_sakura: 'linear-gradient(135deg, #BE185D 0%, #EC4899 55%, #F43F5E 100%)',
  frame_fire: 'linear-gradient(135deg, #B91C1C 0%, #EA580C 55%, #D97706 100%)',
  frame_glitch: 'linear-gradient(135deg, #111827 0%, #311042 55%, #0F172A 100%)',
  frame_cosmos: 'linear-gradient(135deg, #312E81 0%, #6D28D9 50%, #BE185D 100%)',
  frame_dragon: 'linear-gradient(135deg, #064E3B 0%, #059669 55%, #B45309 100%)',
  frame_void: 'radial-gradient(circle at 38% 35%, #2E1065 0%, #090514 68%, #000000 100%)',
}

/** Окрашенное или анимированное имя пользователя */
export function StyledName({
  name,
  color = null,
  className = '',
}: {
  name: string
  color?: NameColorId | null
  className?: string
}) {
  const def = color ? NAME_COLORS.find((c) => c.id === color) : undefined
  if (!def) return <span className={className}>{name}</span>
  const style: CSSProperties = {
    backgroundImage: def.gradient,
    WebkitBackgroundClip: 'text',
    backgroundClip: 'text',
    color: 'transparent',
    WebkitTextFillColor: 'transparent',
    filter: def.glow ? `drop-shadow(${def.glow})` : undefined,
  }
  return (
    <span className={`${def.animated ? 'name-animated' : ''} ${className}`} style={style}>
      {name}
    </span>
  )
}

interface AvatarProps {
  name: string
  frame?: AvatarFrameId | null
  size?: number
  bg?: string
  className?: string
}

/** Круглая аватарка с поддержкой коллекционных и анимированных SVG-рамок и спецэффектов */
export function Avatar({ name, frame = null, size = 72, bg = 'var(--acc)', className = '' }: AvatarProps) {
  const uid = useId().replace(/:/g, '')
  const pad = frame ? Math.max(5, Math.round(size * 0.14)) : 0
  const outer = size + pad * 2
  const fontSize = Math.max(12, Math.round(size * 0.34))
  const sphereBg = (frame && SPHERE_BG[frame]) || bg

  return (
    <div
      className={`relative inline-grid shrink-0 place-items-center select-none ${className}`}
      style={{ width: size, height: size }}
    >
      {/* 1. Золотая корона */}
      {frame === 'frame' && (
        <svg
          width={outer}
          height={outer}
          viewBox="0 0 100 100"
          className="pointer-events-none absolute"
          style={{ left: -pad, top: -pad, filter: 'drop-shadow(0 3px 8px rgba(255,178,30,0.42))' }}
        >
          <defs>
            <linearGradient id={`${uid}-gold`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#FFF6B7" />
              <stop offset="30%" stopColor="#FFB800" />
              <stop offset="65%" stopColor="#D97706" />
              <stop offset="100%" stopColor="#FFE57F" />
            </linearGradient>
          </defs>
          <circle cx="50" cy="50" r="46" fill="none" stroke={`url(#${uid}-gold)`} strokeWidth="5.5" />
          <circle cx="50" cy="50" r="42.5" fill="none" stroke="#FFFBEB" strokeOpacity="0.65" strokeWidth="1" />
          <polygon points="50,0.5 54.5,6.5 50,9.5 45.5,6.5" fill="#FFF6B7" stroke="#D97706" strokeWidth="1.2" />
          <polygon points="50,99.5 53.5,94.5 50,92 46.5,94.5" fill="#FFD54F" stroke="#D97706" strokeWidth="1" />
          <polygon points="0.5,50 5.5,46.5 8,50 5.5,53.5" fill="#FFD54F" stroke="#D97706" strokeWidth="1" />
          <polygon points="99.5,50 94.5,46.5 92,50 94.5,53.5" fill="#FFD54F" stroke="#D97706" strokeWidth="1" />
        </svg>
      )}

      {/* 2. Изумрудный кристалл */}
      {frame === 'frame_emerald' && (
        <svg
          width={outer}
          height={outer}
          viewBox="0 0 100 100"
          className="pointer-events-none absolute"
          style={{ left: -pad, top: -pad, filter: 'drop-shadow(0 3px 9px rgba(16,185,129,0.42))' }}
        >
          <defs>
            <linearGradient id={`${uid}-em`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#A7F3D0" />
              <stop offset="35%" stopColor="#10B981" />
              <stop offset="70%" stopColor="#047857" />
              <stop offset="100%" stopColor="#6EE7B7" />
            </linearGradient>
          </defs>
          <circle cx="50" cy="50" r="46" fill="none" stroke={`url(#${uid}-em)`} strokeWidth="5.5" />
          <circle cx="50" cy="50" r="46" fill="none" stroke="#ECFDF5" strokeOpacity="0.55" strokeWidth="1.5" strokeDasharray="8 6" />
          {[0, 60, 120, 180, 240, 300].map((deg) => (
            <g key={deg} transform={`rotate(${deg} 50 50)`}>
              <polygon points="50,1 53,5 50,8.5 47,5" fill="#A7F3D0" stroke="#047857" strokeWidth="1" />
            </g>
          ))}
        </svg>
      )}

      {/* 3. Арктический шторм (анимированная) */}
      {frame === 'frame_ice' && (
        <div className="pointer-events-none absolute" style={{ left: -pad, top: -pad, width: outer, height: outer }}>
          <motion.div
            className="absolute inset-0 rounded-full blur-[5px]"
            style={{ background: 'radial-gradient(circle, rgba(56,189,248,0.6) 55%, rgba(2,132,199,0) 75%)' }}
            animate={{ scale: [0.97, 1.06, 0.97], opacity: [0.6, 0.95, 0.6] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.svg
            width={outer}
            height={outer}
            viewBox="0 0 100 100"
            className="absolute inset-0"
            animate={{ rotate: 360 }}
            transition={{ duration: 9, repeat: Infinity, ease: 'linear' }}
          >
            <defs>
              <linearGradient id={`${uid}-ice`} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#F0F9FF" />
                <stop offset="45%" stopColor="#38BDF8" />
                <stop offset="100%" stopColor="#0284C7" />
              </linearGradient>
            </defs>
            <circle cx="50" cy="50" r="45.5" fill="none" stroke={`url(#${uid}-ice)`} strokeWidth="5.5" />
            {[0, 60, 120, 180, 240, 300].map((deg) => (
              <g key={deg} transform={`rotate(${deg} 50 50)`}>
                <polygon points="50,0 52.5,5.5 50,9 47.5,5.5" fill="#E0F2FE" stroke="#0284C7" strokeWidth="0.9" />
              </g>
            ))}
          </motion.svg>
          <motion.svg
            width={outer}
            height={outer}
            viewBox="0 0 100 100"
            className="absolute inset-0"
            animate={{ rotate: -360 }}
            transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
          >
            <circle cx="50" cy="50" r="48" fill="none" stroke="#BAE6FD" strokeWidth="1.6" strokeDasharray="3 11" strokeLinecap="round" />
          </motion.svg>
        </div>
      )}

      {/* 4. Неоновый импульс (анимированная) */}
      {frame === 'frame_neon' && (
        <div className="pointer-events-none absolute" style={{ left: -pad, top: -pad, width: outer, height: outer }}>
          <motion.div
            className="absolute inset-0 rounded-full opacity-55 blur-[5px]"
            style={{ background: 'conic-gradient(from 0deg, #00F0FF, #7A5CFF, #FF2E93, #00F0FF)' }}
            animate={{ rotate: 360 }}
            transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
          />
          <motion.svg
            width={outer}
            height={outer}
            viewBox="0 0 100 100"
            className="absolute inset-0"
            animate={{ rotate: 360 }}
            transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
          >
            <defs>
              <linearGradient id={`${uid}-neon1`} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#00F0FF" />
                <stop offset="50%" stopColor="#7A5CFF" />
                <stop offset="100%" stopColor="#FF2E93" />
              </linearGradient>
            </defs>
            <circle cx="50" cy="50" r="45.5" fill="none" stroke={`url(#${uid}-neon1)`} strokeWidth="5.5" />
            <circle cx="50" cy="4.5" r="3.5" fill="#FFFFFF" stroke="#00F0FF" strokeWidth="1.5" />
            <circle cx="50" cy="95.5" r="3.2" fill="#FFFFFF" stroke="#FF2E93" strokeWidth="1.5" />
          </motion.svg>
          <motion.svg
            width={outer}
            height={outer}
            viewBox="0 0 100 100"
            className="absolute inset-0"
            animate={{ rotate: -360 }}
            transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
          >
            <circle cx="50" cy="50" r="48" fill="none" stroke="#00F0FF" strokeOpacity="0.7" strokeWidth="1.4" strokeDasharray="10 14" strokeLinecap="round" />
          </motion.svg>
        </div>
      )}

      {/* 5. Грозовой разряд (анимированная) */}
      {frame === 'frame_thunder' && (
        <div className="pointer-events-none absolute" style={{ left: -pad, top: -pad, width: outer, height: outer }}>
          <motion.div
            className="absolute inset-0 rounded-full blur-[5px]"
            style={{ background: 'conic-gradient(from 45deg, #FACC15, #38BDF8, #6366F1, #FACC15)' }}
            animate={{ rotate: -360, opacity: [0.45, 0.9, 0.5, 0.95, 0.45] }}
            transition={{ rotate: { duration: 3.2, repeat: Infinity, ease: 'linear' }, opacity: { duration: 1.1, repeat: Infinity } }}
          />
          <motion.svg
            width={outer}
            height={outer}
            viewBox="0 0 100 100"
            className="absolute inset-0"
            animate={{ rotate: 360 }}
            transition={{ duration: 3.5, repeat: Infinity, ease: 'linear' }}
          >
            <defs>
              <linearGradient id={`${uid}-th`} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#FEF08A" />
                <stop offset="50%" stopColor="#38BDF8" />
                <stop offset="100%" stopColor="#FACC15" />
              </linearGradient>
            </defs>
            <circle cx="50" cy="50" r="45.5" fill="none" stroke={`url(#${uid}-th)`} strokeWidth="5.5" />
            {[0, 120, 240].map((deg) => (
              <g key={deg} transform={`rotate(${deg} 50 50)`}>
                <polygon points="51,0 46,6 50,6 48,11 55,4.5 51,4.5" fill="#FEF08A" stroke="#0284C7" strokeWidth="0.6" />
              </g>
            ))}
          </motion.svg>
        </div>
      )}

      {/* 6. Вишнёвый вихрь / Сакура (анимированная) */}
      {frame === 'frame_sakura' && (
        <div className="pointer-events-none absolute" style={{ left: -pad, top: -pad, width: outer, height: outer }}>
          <motion.div
            className="absolute inset-0 rounded-full opacity-60 blur-[5px]"
            style={{ background: 'radial-gradient(circle, rgba(244,114,182,0.65) 55%, rgba(219,39,119,0) 75%)' }}
            animate={{ scale: [0.97, 1.05, 0.97] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.svg
            width={outer}
            height={outer}
            viewBox="0 0 100 100"
            className="absolute inset-0"
            animate={{ rotate: 360 }}
            transition={{ duration: 7.5, repeat: Infinity, ease: 'linear' }}
          >
            <defs>
              <linearGradient id={`${uid}-sak`} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#FCE7F3" />
                <stop offset="50%" stopColor="#F472B6" />
                <stop offset="100%" stopColor="#DB2777" />
              </linearGradient>
            </defs>
            <circle cx="50" cy="50" r="45.5" fill="none" stroke={`url(#${uid}-sak)`} strokeWidth="5.5" />
            {[0, 72, 144, 216, 288].map((deg) => (
              <g key={deg} transform={`rotate(${deg} 50 50)`}>
                <path d="M50,1 C53.5,3 54,7 50,9 C46,7 46.5,3 50,1 Z" fill="#FBCFE8" stroke="#DB2777" strokeWidth="0.8" />
              </g>
            ))}
          </motion.svg>
        </div>
      )}

      {/* 7. Солнечное пламя (анимированная) */}
      {frame === 'frame_fire' && (
        <div className="pointer-events-none absolute" style={{ left: -pad, top: -pad, width: outer, height: outer }}>
          <motion.div
            className="absolute inset-0 rounded-full blur-[5px]"
            style={{ background: 'radial-gradient(circle, rgba(255,122,0,0.65) 55%, rgba(255,30,0,0) 75%)' }}
            animate={{ scale: [0.96, 1.07, 0.96], opacity: [0.65, 0.95, 0.65] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.svg
            width={outer}
            height={outer}
            viewBox="0 0 100 100"
            className="absolute inset-0"
            animate={{ rotate: 360 }}
            transition={{ duration: 5.5, repeat: Infinity, ease: 'linear' }}
          >
            <defs>
              <linearGradient id={`${uid}-fire`} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#FFF176" />
                <stop offset="45%" stopColor="#FF7A00" />
                <stop offset="100%" stopColor="#EF233C" />
              </linearGradient>
            </defs>
            <circle cx="50" cy="50" r="45.5" fill="none" stroke={`url(#${uid}-fire)`} strokeWidth="6" />
            {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
              <g key={deg} transform={`rotate(${deg} 50 50)`}>
                <path d="M50,0.5 C53,4 54,7 50,8.5 C46,7 47,4 50,0.5 Z" fill="#FFE066" />
              </g>
            ))}
          </motion.svg>
          <motion.svg
            width={outer}
            height={outer}
            viewBox="0 0 100 100"
            className="absolute inset-0"
            animate={{ rotate: -360, scale: [1, 1.03, 1] }}
            transition={{ rotate: { duration: 3.8, repeat: Infinity, ease: 'linear' }, scale: { duration: 1.2, repeat: Infinity } }}
          >
            <circle cx="50" cy="50" r="47.5" fill="none" stroke="#FFEA00" strokeWidth="1.8" strokeDasharray="5 12" strokeLinecap="round" />
          </motion.svg>
        </div>
      )}

      {/* 8. Кибер-глитч (анимированная) */}
      {frame === 'frame_glitch' && (
        <div className="pointer-events-none absolute" style={{ left: -pad, top: -pad, width: outer, height: outer }}>
          <motion.svg
            width={outer}
            height={outer}
            viewBox="0 0 100 100"
            className="absolute inset-0"
            animate={{ x: [0, -1.5, 1.5, 0], y: [0, 1, -1, 0] }}
            transition={{ duration: 0.45, repeat: Infinity, repeatDelay: 1.8 }}
          >
            <circle cx="49" cy="50" r="45.5" fill="none" stroke="#00F5D4" strokeWidth="4.5" strokeOpacity="0.85" />
            <circle cx="51" cy="50" r="45.5" fill="none" stroke="#FF007F" strokeWidth="4.5" strokeOpacity="0.85" />
          </motion.svg>
          <motion.svg
            width={outer}
            height={outer}
            viewBox="0 0 100 100"
            className="absolute inset-0"
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
          >
            <circle cx="50" cy="50" r="46" fill="none" stroke="#FFFFFF" strokeWidth="2.2" strokeDasharray="16 22 6 18" />
            <rect x="47" y="1" width="6" height="4" fill="#00F5D4" />
            <rect x="47" y="95" width="6" height="4" fill="#FF007F" />
          </motion.svg>
        </div>
      )}

      {/* 9. Квантовая галактика (анимированная) */}
      {frame === 'frame_cosmos' && (
        <div className="pointer-events-none absolute" style={{ left: -pad, top: -pad, width: outer, height: outer }}>
          <motion.div
            className="absolute inset-0 rounded-full opacity-65 blur-[6px]"
            style={{ background: 'conic-gradient(from 90deg, #6366F1, #EC4899, #38BDF8, #F59E0B, #A855F7, #6366F1)' }}
            animate={{ rotate: 360, scale: [0.97, 1.05, 0.97] }}
            transition={{ rotate: { duration: 5, repeat: Infinity, ease: 'linear' }, scale: { duration: 2.4, repeat: Infinity, ease: 'easeInOut' } }}
          />
          <motion.svg
            width={outer}
            height={outer}
            viewBox="0 0 100 100"
            className="absolute inset-0"
            animate={{ rotate: 360 }}
            transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
          >
            <defs>
              <linearGradient id={`${uid}-cos1`} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#38BDF8" />
                <stop offset="35%" stopColor="#A855F7" />
                <stop offset="70%" stopColor="#EC4899" />
                <stop offset="100%" stopColor="#FDE047" />
              </linearGradient>
            </defs>
            <circle cx="50" cy="50" r="45.5" fill="none" stroke={`url(#${uid}-cos1)`} strokeWidth="5.8" />
            <circle cx="50" cy="50" r="42.5" fill="none" stroke="#FFFFFF" strokeOpacity="0.6" strokeWidth="1" />
          </motion.svg>
          <motion.svg
            width={outer}
            height={outer}
            viewBox="0 0 100 100"
            className="absolute inset-0"
            animate={{ rotate: -360 }}
            transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
          >
            {[0, 90, 180, 270].map((deg, idx) => (
              <g key={deg} transform={`rotate(${deg} 50 50)`}>
                <path
                  d="M50,0 L52,4.2 L56.2,6 L52,7.8 L50,12 L48,7.8 L43.8,6 L48,4.2 Z"
                  fill={idx % 2 === 0 ? '#FEF08A' : '#7DD3FC'}
                />
              </g>
            ))}
          </motion.svg>
        </div>
      )}

      {/* 10. Дыхание дракона (анимированная) */}
      {frame === 'frame_dragon' && (
        <div className="pointer-events-none absolute" style={{ left: -pad, top: -pad, width: outer, height: outer }}>
          <motion.div
            className="absolute inset-0 rounded-full opacity-65 blur-[5px]"
            style={{ background: 'conic-gradient(from 0deg, #10B981, #FACC15, #059669, #F59E0B, #10B981)' }}
            animate={{ rotate: 360 }}
            transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
          />
          <motion.svg
            width={outer}
            height={outer}
            viewBox="0 0 100 100"
            className="absolute inset-0"
            animate={{ rotate: 360 }}
            transition={{ duration: 6.5, repeat: Infinity, ease: 'linear' }}
          >
            <defs>
              <linearGradient id={`${uid}-drg`} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#FDE047" />
                <stop offset="50%" stopColor="#10B981" />
                <stop offset="100%" stopColor="#D97706" />
              </linearGradient>
            </defs>
            <circle cx="50" cy="50" r="45.5" fill="none" stroke={`url(#${uid}-drg)`} strokeWidth="6" />
            {[0, 60, 120, 180, 240, 300].map((deg) => (
              <g key={deg} transform={`rotate(${deg} 50 50)`}>
                <polygon points="50,0 54,6 50,10 46,6" fill="#FDE047" stroke="#065F46" strokeWidth="1" />
              </g>
            ))}
          </motion.svg>
        </div>
      )}

      {/* 11. Чёрная дыра / Сингулярность (легендарная анимированная) */}
      {frame === 'frame_void' && (
        <div className="pointer-events-none absolute" style={{ left: -pad, top: -pad, width: outer, height: outer }}>
          <motion.div
            className="absolute inset-0 rounded-full blur-[6px]"
            style={{ background: 'conic-gradient(from 0deg, #C084FC, #F43F5E, #FBBF24, #4F46E5, #C084FC)' }}
            animate={{ rotate: 360, scale: [0.96, 1.08, 0.96] }}
            transition={{ rotate: { duration: 3.6, repeat: Infinity, ease: 'linear' }, scale: { duration: 1.8, repeat: Infinity, ease: 'easeInOut' } }}
          />
          <motion.svg
            width={outer}
            height={outer}
            viewBox="0 0 100 100"
            className="absolute inset-0"
            animate={{ rotate: 360 }}
            transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
          >
            <defs>
              <linearGradient id={`${uid}-void`} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#FDE047" />
                <stop offset="40%" stopColor="#F43F5E" />
                <stop offset="80%" stopColor="#9333EA" />
                <stop offset="100%" stopColor="#FDE047" />
              </linearGradient>
            </defs>
            <circle cx="50" cy="50" r="45.5" fill="none" stroke={`url(#${uid}-void)`} strokeWidth="6" />
            <circle cx="50" cy="50" r="42" fill="none" stroke="#090514" strokeWidth="2.4" />
          </motion.svg>
          <motion.svg
            width={outer}
            height={outer}
            viewBox="0 0 100 100"
            className="absolute inset-0"
            animate={{ rotate: -360 }}
            transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
          >
            <circle cx="50" cy="50" r="48.5" fill="none" stroke="#FDE047" strokeWidth="1.5" strokeDasharray="4 14" strokeLinecap="round" />
          </motion.svg>
        </div>
      )}

      {/* Внутренняя круглая сфера аватара с бликом */}
      <div
        className="relative grid h-full w-full overflow-hidden place-items-center rounded-full font-display font-extrabold text-white shadow-inner"
        style={{ background: sphereBg, fontSize }}
      >
        {frame && (
          <span
            className="pointer-events-none absolute inset-0 rounded-full"
            style={{
              background: 'radial-gradient(circle at 30% 22%, rgba(255,255,255,0.28) 0%, rgba(255,255,255,0) 55%)',
            }}
          />
        )}
        <span className="relative drop-shadow-[0_1px_2px_rgba(0,0,0,0.28)]">{initials(name) || '?'}</span>
      </div>
    </div>
  )
}
