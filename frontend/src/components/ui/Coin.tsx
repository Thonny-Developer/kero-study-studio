import { useId } from 'react'

/** Монетка Vibely: золотой диск с ободком и выбитой «V» */
export function Coin({ size = 18, className = '' }: { size?: number; className?: string }) {
  const id = useId().replace(/:/g, '')
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" className={`shrink-0 ${className}`} aria-hidden>
      <defs>
        <linearGradient id={`${id}f`} x1="4" y1="2" x2="28" y2="30" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#FFE38A" />
          <stop offset=".45" stopColor="#FFC233" />
          <stop offset="1" stopColor="#F29A00" />
        </linearGradient>
        <linearGradient id={`${id}i`} x1="26" y1="26" x2="6" y2="6" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#FFD45C" />
          <stop offset="1" stopColor="#FFB21E" />
        </linearGradient>
      </defs>
      {/* ребро монеты */}
      <circle cx="16" cy="17.4" r="14" fill="#C97A00" />
      <circle cx="16" cy="15.6" r="14" fill={`url(#${id}f)`} />
      <circle cx="16" cy="15.6" r="10.4" fill={`url(#${id}i)`} stroke="#E08A00" strokeWidth="1.3" />
      {/* выбитая V: тень + светлая грань */}
      <path d="M11.3 10.8l4.7 10 4.7-10" fill="none" stroke="#FFE9A8" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" transform="translate(0 .9)" />
      <path d="M11.3 10.8l4.7 10 4.7-10" fill="none" stroke="#B86E00" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      {/* блик */}
      <path d="M7.4 10.6a10 10 0 0 1 6-5.3" fill="none" stroke="#FFF6D6" strokeWidth="1.8" strokeLinecap="round" opacity=".9" />
    </svg>
  )
}
