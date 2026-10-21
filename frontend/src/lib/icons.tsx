// Иконки из макета: [s]troke или [f]ill, viewBox 24×24
const P = {
  back: ['s', 'M15 5l-7 7 7 7'],
  x: ['s', 'M6 6l12 12M18 6L6 18'],
  check: ['s', 'M5 12.5l4.5 4.5L19 7.5'],
  heart: ['f', 'M12 20.5s-7.5-4.4-7.5-10.1A4.2 4.2 0 0 1 12 7.6a4.2 4.2 0 0 1 7.5 2.8c0 5.7-7.5 10.1-7.5 10.1z'],
  flame: ['f', 'M12 2.5c.6 3.4 4.8 5.3 4.8 10.2a4.8 4.8 0 0 1-9.6 0c0-2.2 1.1-3.7 2.3-4.7.1 1.6.8 2.6 1.9 2.9-.4-3 .1-5.9.6-8.4z'],
  bolt: ['f', 'M13.5 2 4.5 13.5h6.5L10 22l9.5-12h-6.5z'],
  star: ['f', 'M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z'],
  lock: ['f', 'M7 10.5V8a5 5 0 0 1 10 0v2.5h.5A2.5 2.5 0 0 1 20 13v5.5a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 18.5V13a2.5 2.5 0 0 1 2.5-2.5zm2.5 0h5V8a2.5 2.5 0 0 0-5 0z'],
  code: ['s', 'M8 7l-5 5 5 5M16 7l5 5-5 5M13.5 5l-3 14'],
  mega: ['s', 'M4 10v4h3l7 4V6L7 10zM17.5 9a4 4 0 0 1 0 6'],
  trophy: ['s', 'M7 4h10v5a5 5 0 0 1-10 0zM7 6H4a3 3 0 0 0 3 4M17 6h3a3 3 0 0 1-3 4M12 14v4M8 20h8'],
  target: ['s', 'M12 3a9 9 0 1 0 9 9M12 7a5 5 0 1 0 5 5M12 12l7-7M16 5h3v3'],
  sun: ['s', 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4'],
  moon: ['s', 'M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z'],
  share: ['s', 'M12 3v12M7 8l5-5 5 5M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6'],
  map: ['s', 'M9 4L3 6.5v13.5l6-2.5 6 2.5 6-2.5V4l-6 2.5zM9 4v13.5M15 6.5V20'],
  league: ['s', 'M12 2.5l7 3v6c0 4.5-3 8-7 10-4-2-7-5.5-7-10v-6zM9 11.5l2 2 4-4'],
  user: ['s', 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4.5 21a7.5 7.5 0 0 1 15 0'],
  gift: ['s', 'M4 11h16v9H4zM3 7.5h18V11H3zM12 7.5V20M12 7.5S10 3 7.5 4.5 9 7.5 12 7.5zM12 7.5s2-4.5 4.5-3S15 7.5 12 7.5z'],
  rocket: ['s', 'M14 4h6v6l-7 7-6-6zM7 11l-3 1 2 2M13 17l-1 3-2-2M15.5 8.5h.01'],
  spark: ['f', 'M12 2l1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8z'],
  sand: ['s', 'M4 5h16v11H4zM8 20h8M12 16v4M7.5 9l2.5 2-2.5 2M12 13h4'],
  bug: ['s', 'M8 9a4 4 0 0 1 8 0v5a4 4 0 0 1-8 0zM12 9v9M4 13h4M16 13h4M5 8l3 2M19 8l-3 2M5 19l3-2.5M19 19l-3-2.5M9.5 5L8 3M14.5 5L16 3'],
  blocks: ['s', 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM15 15h4v4h-4z'],
  list: ['s', 'M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01'],
  type: ['s', 'M4 7V5h16v2M12 5v14M9 19h6'],
  img: ['s', 'M4 4h16v16H4zM4 16l5-5 4 4 2-2 5 5M15 8.5h.01'],
  ext: ['s', 'M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5'],
  clock: ['s', 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 7v5l3 2'],
  edit: ['s', 'M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4'],
  refresh: ['s', 'M20 11a8 8 0 0 0-14.5-4.5M4 4v4h4M4 13a8 8 0 0 0 14.5 4.5M20 20v-4h-4'],
} as const

export type IconName = keyof typeof P

export function Icon({ name, size = 20, className }: { name: IconName; size?: number; className?: string }) {
  const [kind, d] = P[name]
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} style={{ display: 'block' }} aria-hidden>
      <path
        d={d}
        fill={kind === 'f' ? 'currentColor' : 'none'}
        stroke={kind === 's' ? 'currentColor' : 'none'}
        strokeWidth={2.4}
        strokeLinecap="round"
        strokeLinejoin="round"
        fillRule="evenodd"
      />
    </svg>
  )
}
