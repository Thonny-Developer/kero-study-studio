import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { Mascot } from '../Mascot'

// Фоны юнитов на карте в духе мобильных игр: вид сверху-сбоку, земля с текстурой,
// дорожка через узлы, по краям ряды деревьев (или их аналогов), на поле — живность.
// Покадровые анимации — CSS keyframes sc-* из index.css, чтобы скролл не грузил JS.

type Vars = Record<`--${string}`, string>
type Pt = [number, number]

const anim = (name: string, dur: number, delay = 0, vars: Vars = {}, ease = 'ease-in-out'): CSSProperties =>
  ({
    animation: `sc-${name} ${dur}s ${ease} ${-delay}s infinite`,
    ...vars,
  }) as CSSProperties

/** Анимируется только часть однотипных предметов: живо, но без сотен бесконечных анимаций */
const lively = (seed: number, share = 0.35) => rnd(seed, 77) < share

/** Детерминированный «рандом», чтобы сцена не прыгала между рендерами */
const rnd = (i: number, seed = 1) => {
  const x = Math.sin(i * 127.1 + seed * 311.7) * 43758.5453
  return x - Math.floor(x)
}

const svg = (w: number, vb: string, children: ReactNode, overflow = false) => (
  <svg width={w} viewBox={vb} style={{ display: 'block', overflow: overflow ? 'visible' : undefined }} aria-hidden>
    {children}
  </svg>
)

const Shadow = ({ cx, cy, rx, ry = rx * 0.32, o = 0.18 }: { cx: number; cy: number; rx: number; ry?: number; o?: number }) => (
  <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="#1A1033" opacity={o} />
)

/* ═════════════ Общие персонажи ═════════════ */

/** Птичка: клюёт землю и иногда подпрыгивает */
function Bird({ body, belly, wing, seed, scale = 1 }: { body: string; belly: string; wing: string; seed: number; scale?: number }) {
  const flip = rnd(seed, 5) > 0.5
  return (
    <div
      style={anim('hop', 4 + rnd(seed, 6) * 3, rnd(seed, 7) * 6, {
        '--hx': `${flip ? -6 : 6}px`,
      })}
    >
      <div style={{ transform: flip ? 'scaleX(-1)' : undefined }}>
        {svg(
          26 * scale,
          '0 0 26 24',
          <>
            <Shadow cx={13} cy={22} rx={8} o={0.2} />
            <path d="M3 12l-3-3 1 6z" fill={wing} />
            <ellipse cx={11} cy={14} rx={8} ry={6.5} fill={body} />
            <ellipse cx={12} cy={16} rx={5.5} ry={4} fill={belly} />
            <path d="M6 12q5-4 10 1-5 3-10-1z" fill={wing} />
            <path d="M10 20v2.5M13 20v2.5" stroke="#E8A040" strokeWidth={1.2} strokeLinecap="round" />
            <g
              style={{
                transformOrigin: '17px 12px',
                ...anim('peck', 2.2 + rnd(seed, 8) * 1.5, rnd(seed, 9) * 3),
              }}
            >
              <circle cx={19} cy={9} r={4.5} fill={body} />
              <circle cx={20.3} cy={8} r={1.1} fill="#16141D" />
              <circle cx={20.6} cy={7.7} r={0.35} fill="#fff" />
              <path d="M23 9l3 1-3 1.2z" fill="#F2A33A" />
            </g>
          </>,
          true,
        )}
      </div>
    </div>
  )
}



/** Блинк в костюме — камео на сцене */
function Blinky({ costume, seed }: { costume: 'space' | 'angel' | 'devil' | 'winter' | 'diver'; seed: number }) {
  const color = {
    space: '#7A5CFF',
    angel: '#FFC94D',
    devil: '#E5484D',
    winter: '#4FB3F6',
    diver: '#FF8A3D',
  }[costume]
  return (
    <div
      style={anim('bob', 3 + rnd(seed, 3), rnd(seed, 4) * 3, {
        '--amp': costume === 'angel' || costume === 'space' ? '-10px' : '-3px',
      })}
    >
      <div className="relative" style={{ width: 46, height: 46 }}>
        {costume === 'angel' && (
          <svg className="absolute -left-4 top-1" width={78} height={36} viewBox="0 0 78 36" style={{ overflow: 'visible' }} aria-hidden>
            <g
              style={{
                transformOrigin: '22px 18px',
                ...anim('sway', 0.9, 0, { '--sw': '-12deg' }),
              }}
            >
              <path d="M24 18C14 2 2 4 0 10c6 0 4 6 10 6-4 2 0 8 6 6 2 2 6 1 8-4z" fill="#fff" stroke="#E8DFF5" />
            </g>
            <g
              style={{
                transformOrigin: '56px 18px',
                ...anim('sway', 0.9, 0, { '--sw': '12deg' }),
              }}
            >
              <path d="M54 18C64 2 76 4 78 10c-6 0-4 6-10 6 4 2 0 8-6 6-2 2-6 1-8-4z" fill="#fff" stroke="#E8DFF5" />
            </g>
          </svg>
        )}
        <Mascot size={46} anim="none" mood="happy" color={color}>
          {costume === 'space' && (
            <svg className="pointer-events-none absolute -inset-[6px]" viewBox="0 0 58 58" aria-hidden>
              <circle cx={29} cy={30} r={27} fill="#BDEBFF" opacity={0.28} stroke="#E8F7FF" strokeWidth={2.5} />
              <path d="M14 18a18 18 0 0 1 12-8" stroke="#fff" strokeWidth={3} strokeLinecap="round" fill="none" opacity={0.9} />
            </svg>
          )}
          {costume === 'angel' && (
            <svg className="pointer-events-none absolute -top-[8px] left-[9px]" width={28} height={10} viewBox="0 0 28 10" aria-hidden>
              <ellipse cx={14} cy={5} rx={12} ry={3.5} fill="none" stroke="#FFD166" strokeWidth={3} />
            </svg>
          )}
          {costume === 'devil' && (
            <svg className="pointer-events-none absolute -top-[6px] left-0" width={46} height={20} viewBox="0 0 46 20" aria-hidden>
              <path d="M8 18C4 10 6 4 10 0c0 6 3 10 6 13zM38 18c4-8 2-14-2-18 0 6-3 10-6 13z" fill="#7A0F1F" />
            </svg>
          )}
          {costume === 'winter' && (
            <svg className="pointer-events-none absolute -top-[9px] left-[4px]" width={38} height={44} viewBox="0 0 38 44" aria-hidden>
              <path d="M5 16C5 6 33 6 33 16z" fill="#E5484D" />
              <rect x={3} y={14} width={32} height={5} rx={2.5} fill="#fff" />
              <circle cx={19} cy={4} r={4} fill="#fff" />
              <path d="M4 38h30v5H4zM26 40l4 4h-6z" fill="#E5484D" />
            </svg>
          )}
          {costume === 'diver' && (
            <svg className="pointer-events-none absolute left-[7px] top-[13px]" width={32} height={18} viewBox="0 0 32 18" aria-hidden>
              <rect x={1} y={2} width={30} height={13} rx={6} fill="#BDEBFF" opacity={0.55} stroke="#16141D" strokeWidth={2} />
              <path d="M31 6h3v-6" stroke="#FFD166" strokeWidth={3} fill="none" />
            </svg>
          )}
        </Mascot>
        {costume === 'devil' && (
          <svg
            className="absolute -right-3 bottom-1"
            width={18}
            height={20}
            viewBox="0 0 18 20"
            style={{
              transformOrigin: '0 20px',
              ...anim('sway', 1.2, 0, { '--sw': '-14deg' }),
            }}
            aria-hidden
          >
            <path d="M0 18Q12 18 10 6" stroke="#7A0F1F" strokeWidth={2.5} fill="none" />
            <path d="M10 0l5 7-9 0z" fill="#7A0F1F" />
          </svg>
        )}
      </div>
    </div>
  )
}

/* ═════════════ Парк ═════════════ */

function Tree({ seed, c1 = '#5DBB4E', c2 = '#3F9A3A', c3 = '#9BE07F', fruit }: { seed: number; c1?: string; c2?: string; c3?: string; fruit?: string }) {
  const w = 64 + rnd(seed, 1) * 26
  return (
    <div
      style={{
        transformOrigin: '50% 100%',
        ...(lively(seed)
          ? anim('sway', 5 + rnd(seed, 2) * 3, rnd(seed, 3) * 5, {
              '--sw': `${1 + rnd(seed, 4) * 1.5}deg`,
            })
          : {}),
      }}
    >
      {svg(
        w,
        '0 0 80 92',
        <>
          <Shadow cx={42} cy={86} rx={30} ry={7} o={0.22} />
          <path d="M36 70h8l2 16h-12z" fill="#8A5A3C" />
          <path d="M40 70v16" stroke="#6E4630" strokeWidth={2} />
          <circle cx={22} cy={48} r={20} fill={c2} />
          <circle cx={58} cy={46} r={21} fill={c2} />
          <circle cx={40} cy={60} r={22} fill={c2} />
          <circle cx={40} cy={34} r={28} fill={c1} />
          <circle cx={24} cy={46} r={15} fill={c1} />
          <circle cx={56} cy={44} r={16} fill={c1} />
          <circle cx={30} cy={24} r={10} fill={c3} opacity={0.8} />
          <circle cx={48} cy={20} r={5} fill={c3} opacity={0.6} />
          <circle cx={20} cy={40} r={5} fill={c3} opacity={0.55} />
          {fruit &&
            [
              [30, 42],
              [52, 34],
              [44, 54],
              [62, 50],
              [22, 54],
            ].map(([x, y]) => <circle key={x} cx={x} cy={y} r={3.2} fill={fruit} stroke="#fff" strokeOpacity={0.5} />)}
        </>,
      )}
    </div>
  )
}

const Bush = ({ seed }: { seed: number }) =>
  svg(
    44 + rnd(seed, 1) * 14,
    '0 0 60 36',
    <>
      <Shadow cx={30} cy={32} rx={26} ry={5} />
      <circle cx={16} cy={22} r={12} fill="#3F9A3A" />
      <circle cx={44} cy={22} r={13} fill="#3F9A3A" />
      <circle cx={30} cy={16} r={15} fill="#5DBB4E" />
      <circle cx={24} cy={11} r={5} fill="#9BE07F" opacity={0.7} />
      {rnd(seed, 2) > 0.4 &&
        [
          [20, 18],
          [36, 12],
          [44, 22],
        ].map(([x, y]) => <circle key={x} cx={x} cy={y} r={2.6} fill={rnd(seed, 3) > 0.5 ? '#FF6F91' : '#FFD166'} />)}
    </>,
  )

const Flowers = ({ seed }: { seed: number }) => {
  const c = ['#FF6F91', '#FFD166', '#fff', '#B39DFF'][Math.floor(rnd(seed, 1) * 4)]
  return svg(
    26,
    '0 0 26 18',
    <>
      {[
        [5, 12],
        [13, 7],
        [21, 13],
      ].map(([x, y], i) => (
        <g key={i}>
          <path d={`M${x} ${y}v5`} stroke="#3F9A3A" strokeWidth={1.4} />
          {[0, 90, 180, 270].map((r) => (
            <ellipse key={r} cx={x} cy={y - 2.2} rx={1.8} ry={2.4} fill={c} transform={`rotate(${r} ${x} ${y})`} />
          ))}
          <circle cx={x} cy={y} r={1.4} fill="#F2A33A" />
        </g>
      ))}
    </>,
  )
}

const Stone = ({ seed, c = '#B8B2C8', c2 = '#D6D1E2' }: { seed: number; c?: string; c2?: string }) =>
  svg(
    16 + rnd(seed, 1) * 12,
    '0 0 24 16',
    <>
      <Shadow cx={12} cy={13} rx={11} ry={3} />
      <path d="M2 12c0-6 5-10 10-10s10 4 10 10z" fill={c} />
      <path d="M6 7c2-3 6-4 9-3" stroke={c2} strokeWidth={2} strokeLinecap="round" fill="none" />
    </>,
  )

const Mushroom = () =>
  svg(
    18,
    '0 0 18 18',
    <>
      <Shadow cx={9} cy={16} rx={7} ry={2} />
      <rect x={6.5} y={9} width={5} height={7} rx={2} fill="#FFF3D6" />
      <path d="M1 10a8 7 0 0 1 16 0z" fill="#E5484D" />
      <circle cx={6} cy={6} r={1.4} fill="#fff" />
      <circle cx={11.5} cy={7.5} r={1.1} fill="#fff" />
    </>,
  )

const Tuft = ({ c = '#6CC24A' }: { c?: string }) =>
  svg(18, '0 0 18 12', <path d="M2 12q1-7 4-10M7 12q0-8 2-11M12 12q1-7 4-9" stroke={c} strokeWidth={1.8} strokeLinecap="round" fill="none" />)


const Bench = () =>
  svg(
    46,
    '0 0 46 30',
    <>
      <Shadow cx={23} cy={27} rx={21} ry={3} />
      <rect x={4} y={4} width={38} height={6} rx={2} fill="#B57A4D" />
      <rect x={4} y={13} width={38} height={6} rx={2} fill="#C68A5B" />
      <path d="M8 19v8M38 19v8M8 10v3M38 10v3" stroke="#4B4560" strokeWidth={3} />
    </>,
  )

const Lamp = () =>
  svg(
    22,
    '0 0 22 64',
    <>
      <Shadow cx={11} cy={61} rx={7} ry={2} />
      <circle cx={11} cy={10} r={11} fill="#FFE38A" opacity={0.35} style={anim('pulse', 3, 0, { '--lo': '0.5' })} />
      <rect x={9.5} y={14} width={3} height={47} rx={1.5} fill="#4B4560" />
      <path d="M5 8h12l-2 7H7z" fill="#4B4560" />
      <rect x={7} y={9} width={8} height={5} rx={1} fill="#FFE38A" />
      <path d="M8 4h6l2 4H6z" fill="#3A3550" />
    </>,
  )

/* ═════════════ Город ═════════════ */

function Building({ seed }: { seed: number }) {
  const roofs = ['#8E86C2', '#7C8DB5', '#B58FB6', '#8DA6C9']
  const walls = ['#6E66A8', '#5C6B94', '#93709A', '#6C86AB']
  const k = Math.floor(rnd(seed, 1) * 4)
  const floors = 2 + Math.floor(rnd(seed, 2) * 3)
  const h = floors * 13 + 6
  return svg(
    70,
    `0 0 70 ${h + 46}`,
    <>
      <Shadow cx={38} cy={h + 40} rx={34} ry={6} o={0.22} />
      <rect x={4} y={34} width={62} height={h} fill={walls[k]} />
      {Array.from({ length: floors }, (_, r) =>
        [0, 1, 2, 3].map((c) => {
          const on = rnd(r * 5 + c, seed) > 0.4
          return (
            <rect
              key={`${r}${c}`}
              x={9 + c * 14.5}
              y={39 + r * 13}
              width={9}
              height={8}
              rx={1.2}
              fill={on ? '#FFE38A' : '#3E4A6B'}
              style={on && lively(seed, 0.4) && rnd(r * 5 + c, seed + 9) > 0.85 ? anim('pulse', 3 + rnd(r, c) * 3, rnd(c, r) * 4) : undefined}
            />
          )
        }),
      )}
      <rect x={4} y={34 + h - 12} width={62} height={12} fill="#000" opacity={0.12} />
      <rect x={28} y={34 + h - 11} width={14} height={11} rx={1} fill="#3A3550" />
      <path d="M0 34L4 4h62l4 30z" fill={roofs[k]} />
      <rect x={6} y={6} width={58} height={4} fill="#fff" opacity={0.25} />
      {rnd(seed, 3) > 0.45 ? (
        <>
          <rect x={14} y={14} width={14} height={10} rx={1.5} fill="#C8C2D6" />
          <circle
            cx={21}
            cy={19}
            r={3.2}
            fill="#9A93B0"
            style={{
              transformOrigin: '21px 19px',
              ...(lively(seed, 0.4) ? anim('spin', 1.5, 0, {}, 'linear') : {}),
            }}
          />
          <rect x={40} y={16} width={16} height={8} rx={4} fill="#4FB3F6" opacity={0.8} />
        </>
      ) : (
        <>
          <ellipse cx={46} cy={20} rx={9} ry={7} fill="#B57A4D" />
          <rect x={37} y={12} width={18} height={4} rx={2} fill="#8A5A3C" />
          <path d="M18 24V10M18 10l8 4-8 4" stroke="#E5484D" strokeWidth={2} fill="#E5484D" />
        </>
      )}
    </>,
  )
}

const StreetTree = ({ seed }: { seed: number }) => (
  <div>
    {svg(
      40,
      '0 0 40 46',
      <>
        <rect x={6} y={30} width={28} height={14} rx={2} fill="#A39DB5" />
        <rect x={9} y={32} width={22} height={9} rx={1} fill="#7A5A3C" />
        <Shadow cx={22} cy={40} rx={16} ry={4} o={0.25} />
        <circle cx={20} cy={20} r={16} fill={rnd(seed, 1) > 0.5 ? '#4CAF50' : '#6CC24A'} />
        <circle cx={14} cy={14} r={6} fill="#9BE07F" opacity={0.7} />
      </>,
    )}
  </div>
)

const Hydrant = () =>
  svg(
    14,
    '0 0 14 22',
    <>
      <Shadow cx={7} cy={20} rx={6} ry={2} />
      <rect x={3} y={6} width={8} height={14} rx={2} fill="#E5484D" />
      <rect x={1} y={10} width={12} height={3} rx={1.5} fill="#C93545" />
      <path d="M3 6a4 4 0 0 1 8 0z" fill="#C93545" />
    </>,
  )

const Car = ({ seed }: { seed: number }) => {
  const c = ['#FFB547', '#4FB3F6', '#FF6F91', '#8CFFC1'][Math.floor(rnd(seed, 1) * 4)]
  return svg(
    22,
    '0 0 22 40',
    <>
      <Shadow cx={11} cy={36} rx={10} ry={3} />
      <rect x={2} y={2} width={18} height={34} rx={6} fill={c} />
      <rect x={4} y={9} width={14} height={7} rx={2} fill="#3E4A6B" opacity={0.8} />
      <rect x={4} y={24} width={14} height={5} rx={2} fill="#3E4A6B" opacity={0.6} />
      <rect x={4} y={1} width={4} height={2.5} rx={1} fill="#FFE38A" />
      <rect x={14} y={1} width={4} height={2.5} rx={1} fill="#FFE38A" />
    </>,
  )
}

/* ═════════════ Космос ═════════════ */

const Asteroid = ({ seed }: { seed: number }) => {
  const w = 34 + rnd(seed, 1) * 34
  return (
    <div
      style={
        lively(seed)
          ? anim('bob', 5 + rnd(seed, 2) * 3, rnd(seed, 3) * 4, {
              '--amp': '-5px',
            })
          : undefined
      }
    >
      {svg(
        w,
        '0 0 60 50',
        <>
          <path d="M8 26C4 12 18 2 32 4s26 10 24 24-16 20-30 18S12 40 8 26z" fill="#5A4F8A" />
          <path d="M12 24C10 14 20 7 31 8s20 8 19 18" stroke="#7C70B5" strokeWidth={4} fill="none" strokeLinecap="round" />
          <circle cx={24} cy={28} r={6} fill="#463C70" />
          <circle cx={40} cy={18} r={4} fill="#463C70" />
          <circle cx={42} cy={34} r={3} fill="#463C70" />
        </>,
      )}
    </div>
  )
}

const Crystal = ({ seed }: { seed: number }) => {
  const c = rnd(seed, 1) > 0.5 ? ['#8CFFC1', '#3FD69A'] : ['#C9A8FF', '#8E6BFF']
  return svg(
    30,
    '0 0 30 36',
    <>
      <Shadow cx={15} cy={33} rx={12} ry={3} o={0.4} />
      <circle cx={15} cy={20} r={14} fill={c[0]} opacity={0.18} style={lively(seed, 0.4) ? anim('pulse', 2.4, rnd(seed, 2) * 2, { '--lo': '0.3' }) : undefined} />
      <path d="M15 2l6 14-6 18-6-18z" fill={c[0]} />
      <path d="M15 2l6 14-6 18z" fill={c[1]} />
      <path d="M5 16l4 6-3 11-4-9zM25 14l3 8-4 11-2-11z" fill={c[1]} />
    </>,
  )
}

const MiniPlanet = ({ seed }: { seed: number }) => {
  const [a, b] = rnd(seed, 1) > 0.5 ? ['#FF8A65', '#FFD166'] : ['#4FB3F6', '#8CFFC1']
  return (
    <div style={anim('bob', 7, rnd(seed, 2) * 5, { '--amp': '-8px' })}>
      {svg(
        66,
        '0 0 100 70',
        <>
          <path d="M8 40a42 12 -12 0 1 84-12" stroke={b} strokeWidth={5} fill="none" />
          <circle cx={50} cy={35} r={24} fill={a} />
          <path d="M30 28q20 6 40-2M28 40q22 7 44-1" stroke="#fff" strokeWidth={3} opacity={0.25} fill="none" />
          <circle cx={42} cy={24} r={6} fill="#fff" opacity={0.3} />
          <path d="M92 28a42 12 -12 0 1 -84 12" stroke={b} strokeWidth={5} fill="none" />
        </>,
      )}
    </div>
  )
}

const Sparkle = ({ c = '#fff', s = 8 }: { c?: string; s?: number }) => (
  <div style={anim('twinkle', 2 + (s % 3), s % 4)}>{svg(s, '0 0 10 10', <path d="M5 0l1.2 3.8L10 5 6.2 6.2 5 10 3.8 6.2 0 5l3.8-1.2z" fill={c} />)}</div>
)

const Alien = ({ seed }: { seed: number }) => (
  <div
    style={anim('walk', 6 + rnd(seed, 1) * 3, rnd(seed, 2) * 4, {
      '--wx': `${rnd(seed, 3) > 0.5 ? 22 : -22}px`,
    })}
  >
    {svg(
      26,
      '0 0 26 30',
      <>
        <Shadow cx={13} cy={28} rx={9} ry={2.5} o={0.4} />
        <path d="M9 4L7 0M17 4l2-4" stroke="#8CFFC1" strokeWidth={1.6} />
        <circle cx={7} cy={0.5} r={1.6} fill="#FFD166" />
        <circle cx={19} cy={0.5} r={1.6} fill="#FFD166" />
        <ellipse cx={13} cy={12} rx={9} ry={8} fill="#8CFFC1" />
        <ellipse cx={13} cy={12} rx={4} ry={4.5} fill="#fff" />
        <circle cx={13} cy={12.5} r={2.2} fill="#16141D" />
        <rect x={7} y={18} width={12} height={8} rx={4} fill="#3FD69A" />
        <path d="M9 26v2M17 26v2" stroke="#3FD69A" strokeWidth={2.2} strokeLinecap="round" />
      </>,
      true,
    )}
  </div>
)

const Ufo = () => (
  <div style={anim('bob', 3, 0, { '--amp': '-10px' })}>
    {svg(
      60,
      '0 0 70 60',
      <>
        <path d="M24 30L10 60h50L46 30z" fill="#8CFFC1" opacity={0.3} style={anim('pulse', 1.6, 0, { '--lo': '0.1' })} />
        <ellipse cx={35} cy={18} rx={13} ry={12} fill="#BDEBFF" opacity={0.9} />
        <circle cx={35} cy={18} r={6} fill="#8CFFC1" />
        <ellipse cx={35} cy={27} rx={32} ry={8} fill="#A8A3B8" />
        <ellipse cx={35} cy={25} rx={32} ry={6} fill="#C8C2D6" />
        {[12, 24, 35, 46, 58].map((x, i) => (
          <circle key={x} cx={x} cy={27} r={2} fill="#FFD166" style={anim('pulse', 1, i * 0.2)} />
        ))}
      </>,
      true,
    )}
  </div>
)


/* ═════════════ Рай ═════════════ */

const CloudPuff = ({ seed }: { seed: number }) => (
  <div
    style={
      lively(seed)
        ? anim('bob', 6 + rnd(seed, 1) * 3, rnd(seed, 2) * 4, {
            '--amp': '-4px',
          })
        : undefined
    }
  >
    {svg(
      70 + rnd(seed, 3) * 24,
      '0 0 90 50',
      <>
        <Shadow cx={45} cy={46} rx={38} ry={5} o={0.1} />
        <circle cx={22} cy={30} r={16} fill="#F1EBFA" />
        <circle cx={66} cy={30} r={17} fill="#F1EBFA" />
        <circle cx={44} cy={22} r={21} fill="#fff" />
        <circle cx={26} cy={26} r={13} fill="#fff" />
        <circle cx={64} cy={26} r={14} fill="#fff" />
        <rect x={10} y={30} width={70} height={14} rx={7} fill="#fff" />
        <circle cx={36} cy={14} r={6} fill="#fff" />
      </>,
    )}
  </div>
)

const Column = () =>
  svg(
    26,
    '0 0 26 70',
    <>
      <Shadow cx={13} cy={66} rx={14} ry={3.5} />
      <rect x={1} y={60} width={24} height={7} rx={1.5} fill="#E8DFF5" />
      <rect x={4} y={10} width={18} height={50} fill="#fff" />
      {[8, 13, 18].map((x) => (
        <path key={x} d={`M${x} 12v46`} stroke="#E8DFF5" strokeWidth={1.6} />
      ))}
      <rect x={0} y={4} width={26} height={7} rx={1.5} fill="#F3EEFA" />
      <path d="M2 4q3-4 6 0M18 4q3-4 6 0" stroke="#E8DFF5" strokeWidth={2} fill="none" />
    </>,
  )

const Dove = ({ seed }: { seed: number }) => <Bird body="#fff" belly="#F4F0FA" wing="#E3DCF0" seed={seed} />

const Feather = () => svg(10, '0 0 12 26', <path d="M6 1C12 8 10 18 6 25 2 18 0 8 6 1z" fill="#fff" stroke="#E8DFF5" />)

/* ═════════════ Ад ═════════════ */

const LavaPool = ({ seed }: { seed: number }) =>
  svg(
    70 + rnd(seed, 1) * 30,
    '0 0 100 44',
    <>
      <ellipse cx={50} cy={24} rx={48} ry={18} fill="#1A0404" />
      <ellipse cx={50} cy={22} rx={42} ry={14} fill="#FF5A1F" />
      <ellipse cx={50} cy={21} rx={30} ry={8} fill="#FFB547" style={anim('pulse', 2.2, rnd(seed, 2) * 2, { '--lo': '0.45' })} />
      {[
        [34, 0],
        [58, 0.7],
        [70, 1.4],
      ].map(([x, d]) => (
        <circle key={x} cx={x} cy={20} r={3} fill="#FFE08A" style={anim('rise', 1.8, d + rnd(seed, 3), { '--dist': '-12px', '--sx': '0px' }, 'ease-out')} />
      ))}
    </>,
    true,
  )

const Spire = ({ seed }: { seed: number }) =>
  svg(
    40 + rnd(seed, 1) * 20,
    '0 0 50 70',
    <>
      <Shadow cx={26} cy={66} rx={22} ry={4} o={0.4} />
      <path d="M4 66L14 30 20 40 28 4 36 36 42 26 48 66z" fill="#4A1210" />
      <path d="M28 4l8 32-6-4-2 34H20z" fill="#2A0806" opacity={0.6} />
      <path d="M14 30l2 14M28 4l-1 20M42 26l1 14" stroke="#FF5A1F" strokeWidth={1.6} style={anim('pulse', 2, rnd(seed, 2) * 2, { '--lo': '0.3' })} />
    </>,
  )

const Flame = ({ seed }: { seed: number }) => {
  const s = 0.7 + rnd(seed, 1) * 0.6
  return svg(
    30 * s,
    '0 0 40 56',
    <g
      style={{
        transformOrigin: '20px 56px',
        ...anim('flicker', 0.5 + rnd(seed, 2) * 0.3),
      }}
    >
      <ellipse cx={20} cy={52} rx={14} ry={4} fill="#FF5A1F" opacity={0.35} />
      <path d="M20 0C30 14 38 24 38 36a18 18 0 0 1-36 0C2 26 10 20 12 10c3 8 6 10 8 10C20 12 18 6 20 0z" fill="#FF5A1F" />
      <path d="M20 18c6 8 10 13 10 20a10 10 0 0 1-20 0c0-6 4-9 5-14 2 4 3 5 5 5 0-4-1-7 0-11z" fill="#FFB547" />
      <path d="M20 34c3 3 5 5 5 8a5 5 0 0 1-10 0c0-3 2-5 5-8z" fill="#FFF3B0" />
    </g>,
    true,
  )
}

const Bones = () =>
  svg(
    26,
    '0 0 26 18',
    <>
      <Shadow cx={13} cy={15} rx={11} ry={2.5} o={0.4} />
      <path d="M4 12l18-6" stroke="#E8DFD2" strokeWidth={3} strokeLinecap="round" />
      <circle cx={3} cy={11} r={2.2} fill="#E8DFD2" />
      <circle cx={5} cy={14} r={2.2} fill="#E8DFD2" />
      <circle cx={23} cy={5} r={2.2} fill="#E8DFD2" />
      <circle cx={21} cy={3} r={2.2} fill="#E8DFD2" />
    </>,
  )


/* ═════════════ Океан ═════════════ */

const Coral = ({ seed }: { seed: number }) => {
  const c = ['#FF7A9A', '#FF9F5A', '#B98CFF'][Math.floor(rnd(seed, 1) * 3)]
  return svg(
    50 + rnd(seed, 2) * 16,
    '0 0 60 54',
    <>
      <Shadow cx={30} cy={50} rx={26} ry={4} />
      <path d="M30 50V30M30 36l-12-14M30 32l10-16M18 22l-4-8M40 16l6-6M30 30V12" stroke={c} strokeWidth={6} strokeLinecap="round" fill="none" />
      <path d="M8 50c0-10 8-12 12-6 2-8 12-6 10 6z" fill="#FFD166" />
      <circle cx={48} cy={46} r={6} fill="#4FB3F6" opacity={0.8} />
    </>,
  )
}

const Seaweed = ({ seed }: { seed: number }) => (
  <div
    style={{
      transformOrigin: '50% 100%',
      ...anim('sway', 3 + rnd(seed, 1) * 2, rnd(seed, 2) * 3, {
        '--sw': '-7deg',
      }),
    }}
  >
    {svg(
      26,
      '0 0 30 70',
      <>
        <Shadow cx={15} cy={67} rx={10} ry={2.5} />
        <path d="M15 68C6 56 24 46 15 34S24 14 15 2" stroke="#2E9E6A" strokeWidth={7} fill="none" strokeLinecap="round" />
        <path d="M15 48c-7-2-9-7-9-11M16 28c7-2 9-7 9-11" stroke="#3FBF7F" strokeWidth={4.5} fill="none" strokeLinecap="round" />
      </>,
    )}
  </div>
)

const Starfish = ({ seed }: { seed: number }) =>
  svg(
    20,
    '0 0 20 20',
    <path
      d="M10 1l2.4 5.6 6 .5-4.6 4 1.4 6L10 14l-5.2 3.1 1.4-6-4.6-4 6-.5z"
      fill={rnd(seed, 1) > 0.5 ? '#FF8A65' : '#FFB547'}
      stroke="#fff"
      strokeOpacity={0.4}
      transform={`rotate(${rnd(seed, 2) * 70} 10 10)`}
    />,
  )

const Shell = () =>
  svg(
    16,
    '0 0 16 14',
    <>
      <path d="M8 13L1 6a7 7 0 0 1 14 0z" fill="#FFE1EC" />
      <path d="M8 13L4 3M8 13V1M8 13l4-10" stroke="#F5A9C3" strokeWidth={1} />
    </>,
  )

const Crab = ({ seed }: { seed: number }) => (
  <div
    style={anim('walk', 3 + rnd(seed, 1) * 2, rnd(seed, 2) * 3, {
      '--wx': `${rnd(seed, 3) > 0.5 ? 20 : -20}px`,
    })}
  >
    {svg(
      28,
      '0 0 32 22',
      <>
        <Shadow cx={16} cy={20} rx={11} ry={2.5} />
        <path d="M6 16l-4 4M9 17l-3 4M26 16l4 4M23 17l3 4" stroke="#E5484D" strokeWidth={1.8} strokeLinecap="round" />
        <ellipse cx={16} cy={13} rx={10} ry={7} fill="#FF6B5B" />
        <g
          style={{
            transformOrigin: '6px 8px',
            ...anim('sway', 0.8, 0, { '--sw': '-15deg' }),
          }}
        >
          <path d="M8 9L3 4a3 3 0 1 1 3-3z" fill="#FF6B5B" />
        </g>
        <g
          style={{
            transformOrigin: '26px 8px',
            ...anim('sway', 0.8, 0.4, { '--sw': '15deg' }),
          }}
        >
          <path d="M24 9l5-5a3 3 0 1 0-3-3z" fill="#FF6B5B" />
        </g>
        <circle cx={13} cy={7} r={1.8} fill="#fff" />
        <circle cx={19} cy={7} r={1.8} fill="#fff" />
        <circle cx={13} cy={7} r={0.9} fill="#16141D" />
        <circle cx={19} cy={7} r={0.9} fill="#16141D" />
      </>,
      true,
    )}
  </div>
)


const Chest = () =>
  svg(
    40,
    '0 0 40 34',
    <>
      <Shadow cx={20} cy={31} rx={18} ry={3} />
      <circle cx={20} cy={14} r={14} fill="#FFD166" opacity={0.3} style={anim('pulse', 2)} />
      <rect x={4} y={14} width={32} height={16} rx={2} fill="#A86F45" />
      <path d="M4 14a16 10 0 0 1 32 0z" fill="#C68A5B" />
      <path d="M4 14h32M20 8v22" stroke="#FFD166" strokeWidth={2.5} />
      <rect x={17} y={14} width={6} height={6} rx={1} fill="#FFD166" />
      <circle cx={12} cy={12} r={2} fill="#FFE38A" />
      <circle cx={28} cy={11} r={1.6} fill="#fff" />
    </>,
  )

/* ═════════════ Зима ═════════════ */

const SnowPine = ({ seed }: { seed: number }) => {
  const w = 50 + rnd(seed, 1) * 24
  const lights = rnd(seed, 2) > 0.6
  return svg(
    w,
    '0 0 70 96',
    <>
      <Shadow cx={38} cy={90} rx={28} ry={6} o={0.16} />
      <rect x={31} y={78} width={8} height={14} fill="#8A5A3C" />
      <path d="M35 2L10 44h50zM35 24L6 66h58zM35 46L2 86h66z" fill="#2E8F6A" />
      <path d="M35 46L2 86h33zM35 24L6 66h29zM35 2L10 44h25z" fill="#26795A" />
      <path d="M35 2l-9 16c5 2 13 2 18 0zM35 24L20 48c8 4 22 4 30 0zM35 46L14 72c12 5 30 5 42 0z" fill="#fff" />
      {lights &&
        [
          [22, 62, '#E5484D'],
          [48, 76, '#FFD166'],
          [40, 40, '#4FB3F6'],
          [28, 80, '#8CFFC1'],
        ].map(([x, y, c], i) => <circle key={i} cx={Number(x)} cy={Number(y)} r={2.6} fill={String(c)} style={anim('pulse', 1.4, i * 0.35)} />)}
    </>,
  )
}

const SnowPile = ({ seed }: { seed: number }) =>
  svg(
    30 + rnd(seed, 1) * 20,
    '0 0 40 18',
    <>
      <path d="M2 16c2-10 10-14 18-12 6-6 16 0 18 12z" fill="#fff" />
      <path d="M6 15c3-6 8-8 14-6" stroke="#D6E4F5" strokeWidth={2} fill="none" />
    </>,
  )

const Snowman = () =>
  svg(
    42,
    '0 0 60 90',
    <>
      <Shadow cx={30} cy={86} rx={24} ry={5} />
      <circle cx={30} cy={64} r={22} fill="#fff" />
      <circle cx={30} cy={33} r={16} fill="#fff" />
      <path d="M22 24a16 16 0 0 1 16 0" stroke="#DCE8F8" strokeWidth={3} fill="none" />
      <rect x={18} y={6} width={24} height={14} rx={2} fill="#3E4A6B" />
      <rect x={14} y={18} width={32} height={4} rx={2} fill="#3E4A6B" />
      <circle cx={25} cy={30} r={2} fill="#16141D" />
      <circle cx={35} cy={30} r={2} fill="#16141D" />
      <path d="M30 34l10 3-10 2z" fill="#FF7A1A" />
      <path d="M18 45q12 6 24 0l2 6q-14 5-28 0z" fill="#E5484D" />
      <path d="M10 56L0 46M50 56l10-10" stroke="#8A5A3C" strokeWidth={3} strokeLinecap="round" />
    </>,
  )

const Bullfinch = ({ seed }: { seed: number }) => <Bird body="#3E4A6B" belly="#E5484D" wing="#2A3350" seed={seed} />

const Penguin = ({ seed }: { seed: number }) => (
  <div
    style={anim('walk', 5 + rnd(seed, 1) * 2, rnd(seed, 2) * 4, {
      '--wx': `${rnd(seed, 3) > 0.5 ? 16 : -16}px`,
    })}
  >
    <div
      style={{
        transformOrigin: '50% 100%',
        ...anim('sway', 0.6, 0, { '--sw': '-6deg' }),
      }}
    >
      {svg(
        24,
        '0 0 24 32',
        <>
          <Shadow cx={12} cy={30} rx={9} ry={2.5} />
          <ellipse cx={12} cy={17} rx={10} ry={13} fill="#2A2E45" />
          <ellipse cx={12} cy={20} rx={6.5} ry={9} fill="#fff" />
          <circle cx={9} cy={10} r={1.4} fill="#fff" />
          <circle cx={15} cy={10} r={1.4} fill="#fff" />
          <circle cx={9} cy={10} r={0.7} fill="#16141D" />
          <circle cx={15} cy={10} r={0.7} fill="#16141D" />
          <path d="M10 13h4l-2 2.5z" fill="#F2A33A" />
          <ellipse cx={8} cy={30} rx={3} ry={1.5} fill="#F2A33A" />
          <ellipse cx={16} cy={30} rx={3} ry={1.5} fill="#F2A33A" />
        </>,
        true,
      )}
    </div>
  </div>
)


/* ═════════════ Конфетная страна ═════════════ */

const LollipopTree = ({ seed }: { seed: number }) => {
  const c = ['#FF6FA8', '#7A5CFF', '#3FAE6A', '#FF9F1C'][Math.floor(rnd(seed, 1) * 4)]
  return (
    <div
      style={{
        transformOrigin: '50% 100%',
        ...anim('sway', 4 + rnd(seed, 2) * 2, rnd(seed, 3) * 3, {
          '--sw': '2deg',
        }),
      }}
    >
      {svg(
        34 + rnd(seed, 4) * 12,
        '0 0 50 96',
        <>
          <Shadow cx={27} cy={92} rx={14} ry={3.5} />
          <rect x={23} y={44} width={4.5} height={48} rx={2} fill="#fff" stroke="#EADCEA" />
          <g
            style={{
              transformOrigin: '25px 25px',
              ...(lively(seed, 0.5) ? anim('spin', 9 + rnd(seed, 5) * 5, 0, {}, 'linear') : {}),
            }}
          >
            <circle cx={25} cy={25} r={23} fill="#fff" />
            <path d="M25 25m0-18a18 18 0 1 1-1 0M25 25m0-11a11 11 0 1 1-1 0M25 25m0-4a4 4 0 1 1-1 0" stroke={c} strokeWidth={5.5} fill="none" />
          </g>
          <ellipse cx={16} cy={14} rx={5} ry={3} fill="#fff" opacity={0.7} transform="rotate(-35 16 14)" />
        </>,
      )}
    </div>
  )
}

const CandyCane = () =>
  svg(
    22,
    '0 0 40 100',
    <>
      <Shadow cx={28} cy={96} rx={10} ry={3} />
      <path d="M28 96V24a10 10 0 0 0-20 0" stroke="#fff" strokeWidth={9} fill="none" strokeLinecap="round" />
      <path d="M28 96V24a10 10 0 0 0-20 0" stroke="#E5484D" strokeWidth={9} strokeDasharray="7 7" fill="none" strokeLinecap="round" />
    </>,
  )

const Gumdrop = ({ seed }: { seed: number }) => {
  const c = ['#FF6FA8', '#FFD166', '#8CFFC1', '#4FB3F6', '#B98CFF'][Math.floor(rnd(seed, 1) * 5)]
  return svg(
    20 + rnd(seed, 2) * 10,
    '0 0 24 22',
    <>
      <Shadow cx={12} cy={20} rx={10} ry={2.5} />
      <path d="M2 19C2 8 6 2 12 2s10 6 10 17z" fill={c} />
      <ellipse cx={8} cy={8} rx={2} ry={3} fill="#fff" opacity={0.6} />
      {[
        [7, 14],
        [14, 10],
        [16, 16],
        [11, 6],
      ].map(([x, y]) => (
        <circle key={x} cx={x} cy={y} r={0.9} fill="#fff" opacity={0.8} />
      ))}
    </>,
  )
}

const Cupcake = () =>
  svg(
    40,
    '0 0 60 70',
    <>
      <Shadow cx={30} cy={67} rx={20} ry={3.5} />
      <path d="M10 38h40l-6 30H16z" fill="#7A5CFF" />
      <path d="M18 38l2 30M30 38v30M42 38l-2 30" stroke="#5B3FE0" strokeWidth={2} />
      <path d="M8 40c-4-12 8-16 10-12 0-10 24-14 26-2 6-4 14 4 8 14z" fill="#FFB3D1" />
      <circle cx={30} cy={14} r={6} fill="#E5484D" />
      <path d="M30 8q2-6 6-6" stroke="#3FAE6A" strokeWidth={2} fill="none" />
    </>,
  )

const GummyBear = ({ seed }: { seed: number }) => {
  const c = ['#FF6B6B', '#FFD166', '#8CFFC1', '#FF9F1C'][Math.floor(rnd(seed, 1) * 4)]
  return (
    <div
      style={anim('hop', 2.4 + rnd(seed, 2), rnd(seed, 3) * 3, {
        '--hx': `${rnd(seed, 4) > 0.5 ? 8 : -8}px`,
      })}
    >
      {svg(
        22,
        '0 0 22 28',
        <>
          <Shadow cx={11} cy={26} rx={8} ry={2} />
          <g opacity={0.9}>
            <circle cx={5} cy={4} r={3} fill={c} />
            <circle cx={17} cy={4} r={3} fill={c} />
            <circle cx={11} cy={8} r={7} fill={c} />
            <ellipse cx={11} cy={18} rx={8} ry={8} fill={c} />
            <circle cx={4} cy={14} r={2.5} fill={c} />
            <circle cx={18} cy={14} r={2.5} fill={c} />
            <circle cx={6} cy={24} r={3} fill={c} />
            <circle cx={16} cy={24} r={3} fill={c} />
          </g>
          <circle cx={8.5} cy={7} r={1.1} fill="#16141D" />
          <circle cx={13.5} cy={7} r={1.1} fill="#16141D" />
          <ellipse cx={7} cy={15} rx={2} ry={3} fill="#fff" opacity={0.4} />
        </>,
        true,
      )}
    </div>
  )
}


/* ═════════════ Темы ═════════════ */

type Make = (seed: number) => ReactNode

interface Theme {
  /** земля днём и ночью */
  day: string
  night: string
  light: boolean
  /** текстура земли (тайл 80×80) */
  texture: ReactNode
  path: {
    edge: string
    fill: string
    detail: string
    dash: string
    dw: number
    glow?: boolean
  }
  /** ряды по краям */
  side: Make[]
  /** мелочи на поле */
  field: Make[]
  /** живность на поле */
  critters: Make[]
}

const tex = (children: ReactNode) => children

export const THEMES: Theme[] = [
  // Парк
  {
    day: 'linear-gradient(180deg, #A6DC82 0%, #94D274 100%)',
    night: 'linear-gradient(180deg, #1D3A2A 0%, #173024 100%)',
    light: true,
    texture: tex(
      <>
        <path d="M10 20q1-5 3-7M14 20q0-5 1-7M40 60q1-5 3-7M44 60q0-5 1-7M62 28q1-4 3-6" stroke="#7FC25D" strokeWidth={1.6} strokeLinecap="round" fill="none" />
        <circle cx={30} cy={40} r={1.3} fill="#fff" opacity={0.7} />
        <circle cx={70} cy={70} r={1.3} fill="#FFD166" opacity={0.8} />
      </>,
    ),
    path: {
      edge: '#C9A46B',
      fill: '#EBD19D',
      detail: '#D8B983',
      dash: '2 15',
      dw: 6,
    },
    side: [
      (s) => <Tree seed={s} />,
      (s) => <Tree seed={s} c1="#7CC94F" c2="#5AA83A" c3="#B7EE95" fruit="#E5484D" />,
      (s) => <Tree seed={s} c1="#4FB06A" c2="#2E8A4E" />,
      (s) => <Bush seed={s} />,
    ],
    field: [(s) => <Flowers seed={s} />, () => <Tuft />, (s) => <Stone seed={s} />, () => <Mushroom />, (s) => <Flowers seed={s + 1} />, () => <Tuft />],
    critters: [
      (s) => <Bird body="#A8714D" belly="#F2D7B5" wing="#7A4E33" seed={s} />,
      (s) => <Bird body="#4FB3F6" belly="#FFE38A" wing="#2E7FD1" seed={s} />,
      (s) => <Bird body="#A8714D" belly="#F2D7B5" wing="#7A4E33" seed={s} />,
      () => <Bench />,
      () => <Lamp />,
    ],
  },
  // Город
  {
    day: 'linear-gradient(180deg, #E4E1EC 0%, #D8D4E4 100%)',
    night: 'linear-gradient(180deg, #23213A 0%, #1C1A30 100%)',
    light: true,
    texture: tex(<path d="M0 0H80M0 40H80M0 0V80M40 0V80" stroke="#CBC6DA" strokeWidth={1.5} />),
    path: {
      edge: '#4E4B63',
      fill: '#64607C',
      detail: '#FFE38A',
      dash: '12 12',
      dw: 3,
    },
    side: [(s) => <Building seed={s} />, (s) => <Building seed={s + 7} />, (s) => <StreetTree seed={s} />],
    field: [() => <Hydrant />, (s) => <StreetTree seed={s} />, (s) => <Car seed={s} />],
    critters: [(s) => <Bird body="#9A93B0" belly="#C8C2D6" wing="#6E6888" seed={s} />, (s) => <Bird body="#9A93B0" belly="#B0E0C8" wing="#6E6888" seed={s} />, () => <Lamp />],
  },
  // Космос
  {
    day: 'linear-gradient(180deg, #160F3D 0%, #22155A 100%)',
    night: 'linear-gradient(180deg, #110B30 0%, #1B1148 100%)',
    light: false,
    texture: tex(
      <>
        <circle cx={10} cy={14} r={0.9} fill="#fff" />
        <circle cx={50} cy={30} r={0.7} fill="#BDEBFF" />
        <circle cx={28} cy={62} r={1} fill="#fff" />
        <circle cx={70} cy={70} r={0.7} fill="#FFE58A" />
        <circle cx={66} cy={8} r={0.6} fill="#fff" />
      </>,
    ),
    path: {
      edge: 'rgba(140,255,193,.18)',
      fill: '#2E2470',
      detail: '#8CFFC1',
      dash: '2 14',
      dw: 3.5,
      glow: true,
    },
    side: [(s) => <Asteroid seed={s} />, (s) => <Crystal seed={s} />, (s) => <Asteroid seed={s + 3} />],
    field: [(s) => <Sparkle c={['#fff', '#FFE58A', '#BDEBFF'][s % 3]} s={6 + (s % 3) * 3} />, (s) => <Crystal seed={s} />],
    critters: [(s) => <Alien seed={s} />, (s) => <Blinky costume="space" seed={s} />, (s) => <MiniPlanet seed={s} />, () => <Ufo />],
  },
  // Рай
  {
    day: 'linear-gradient(180deg, #FFF3DA 0%, #FDE6F2 60%, #EAF0FF 100%)',
    night: 'linear-gradient(180deg, #3A2C4E 0%, #33264A 60%, #262B4C 100%)',
    light: true,
    texture: tex(
      <>
        <circle cx={20} cy={20} r={10} fill="#fff" opacity={0.45} />
        <circle cx={32} cy={22} r={7} fill="#fff" opacity={0.45} />
        <circle cx={60} cy={60} r={9} fill="#fff" opacity={0.4} />
        <circle cx={72} cy={62} r={6} fill="#fff" opacity={0.4} />
      </>,
    ),
    path: {
      edge: '#E0A93B',
      fill: '#F6D27A',
      detail: '#FFF3D6',
      dash: '7 9',
      dw: 5,
    },
    side: [(s) => <CloudPuff seed={s} />, () => <Column />, (s) => <CloudPuff seed={s + 2} />],
    field: [(s) => <Sparkle c="#FFD166" s={7 + (s % 3) * 3} />, () => <Feather />, (s) => <Flowers seed={s} />],
    critters: [(s) => <Dove seed={s} />, (s) => <Blinky costume="angel" seed={s} />, (s) => <Dove seed={s + 1} />],
  },
  // Ад
  {
    day: 'linear-gradient(180deg, #3A0D0A 0%, #2A0806 100%)',
    night: 'linear-gradient(180deg, #32090A 0%, #220505 100%)',
    light: false,
    texture: tex(<path d="M6 10l10 8 4-6 12 10M46 50l8 10 10-4 8 12M60 6l4 10" stroke="#5A1A10" strokeWidth={1.6} fill="none" />),
    path: {
      edge: '#160303',
      fill: '#57443F',
      detail: '#3B2D2A',
      dash: '3 16',
      dw: 24,
    },
    side: [(s) => <Spire seed={s} />, (s) => <LavaPool seed={s} />, (s) => <Flame seed={s} />],
    field: [(s) => <Flame seed={s} />, () => <Bones />, (s) => <Stone seed={s} c="#4A1A16" c2="#6A2A20" />],
    critters: [(s) => <Blinky costume="devil" seed={s} />, (s) => <LavaPool seed={s + 5} />],
  },
  // Океан
  {
    day: 'linear-gradient(180deg, #CBE6D8 0%, #B5DCD4 100%)',
    night: 'linear-gradient(180deg, #0F2E46 0%, #0A2238 100%)',
    light: true,
    texture: tex(<path d="M0 20q10-6 20 0t20 0 20 0 20 0M0 60q10-6 20 0t20 0 20 0 20 0" stroke="#A9D3C6" strokeWidth={2} fill="none" />),
    path: {
      edge: '#D9C38A',
      fill: '#F3E5B8',
      detail: '#fff',
      dash: '1 11',
      dw: 5,
    },
    side: [(s) => <Coral seed={s} />, (s) => <Seaweed seed={s} />, (s) => <Coral seed={s + 4} />, (s) => <Seaweed seed={s + 1} />],
    field: [(s) => <Starfish seed={s} />, () => <Shell />, (s) => <Stone seed={s} c="#9FB8B0" c2="#C3D8D0" />],
    critters: [(s) => <Crab seed={s} />, (s) => <Blinky costume="diver" seed={s} />, () => <Chest />, (s) => <Crab seed={s + 2} />],
  },
  // Зима
  {
    day: 'linear-gradient(180deg, #F2F7FF 0%, #E4EDFA 100%)',
    night: 'linear-gradient(180deg, #1B2642 0%, #172036 100%)',
    light: true,
    texture: tex(
      <>
        <circle cx={14} cy={18} r={1} fill="#B8CBE6" />
        <circle cx={52} cy={44} r={1} fill="#B8CBE6" />
        <path d="M60 12l2 2m0-2l-2 2M24 64l2 2m0-2l-2 2" stroke="#9FB7DA" strokeWidth={1} />
      </>,
    ),
    path: {
      edge: '#CBD9EE',
      fill: '#F7FAFF',
      detail: '#C6D6EC',
      dash: '4 9',
      dw: 6,
    },
    side: [(s) => <SnowPine seed={s} />, (s) => <SnowPine seed={s + 4} />, (s) => <SnowPile seed={s} />],
    field: [(s) => <SnowPile seed={s} />, (s) => <Stone seed={s} c="#B8C4D8" c2="#fff" />],
    critters: [(s) => <Bullfinch seed={s} />, (s) => <Penguin seed={s} />, () => <Snowman />, (s) => <Blinky costume="winter" seed={s} />, (s) => <Bullfinch seed={s + 1} />],
  },
  // Конфетная страна
  {
    day: 'linear-gradient(180deg, #FFDDEE 0%, #FFE9D6 100%)',
    night: 'linear-gradient(180deg, #3A1B3E 0%, #2E1838 100%)',
    light: true,
    texture: tex(
      <>
        <rect x={10} y={14} width={7} height={2.5} rx={1.25} fill="#FF6FA8" transform="rotate(30 13 15)" />
        <rect x={50} y={30} width={7} height={2.5} rx={1.25} fill="#4FB3F6" transform="rotate(-40 53 31)" />
        <rect x={28} y={60} width={7} height={2.5} rx={1.25} fill="#FFD166" transform="rotate(70 31 61)" />
        <rect x={66} y={68} width={7} height={2.5} rx={1.25} fill="#8CFFC1" transform="rotate(10 69 69)" />
      </>,
    ),
    path: {
      edge: '#5E3220',
      fill: '#8A4B2D',
      detail: '#6B3A22',
      dash: '3 15',
      dw: 24,
    },
    side: [(s) => <LollipopTree seed={s} />, () => <CandyCane />, (s) => <Gumdrop seed={s + 5} />, () => <Cupcake />],
    field: [(s) => <Gumdrop seed={s} />, (s) => <Gumdrop seed={s + 1} />],
    critters: [(s) => <GummyBear seed={s} />, (s) => <GummyBear seed={s + 3} />, () => <Cupcake />],
  },
]

/* ═════════════ Раскладка ═════════════ */

/** Плавная кривая через точки (Catmull-Rom → кубические Безье) */
function smoothPath(p: Pt[]) {
  if (p.length < 2) return ''
  let d = `M${p[0][0]} ${p[0][1]}`
  for (let i = 0; i < p.length - 1; i++) {
    const p0 = p[i - 1] ?? p[i]
    const p1 = p[i]
    const p2 = p[i + 1]
    const p3 = p[i + 2] ?? p2
    d += ` C${p1[0] + (p2[0] - p0[0]) / 6} ${p1[1] + (p2[1] - p0[1]) / 6} ${p2[0] - (p3[0] - p1[0]) / 6} ${p2[1] - (p3[1] - p1[1]) / 6} ${p2[0]} ${p2[1]}`
  }
  return d
}

function distToPolyline(x: number, y: number, p: Pt[]) {
  let best = Infinity
  for (let i = 0; i < p.length - 1; i++) {
    const [ax, ay] = p[i]
    const [bx, by] = p[i + 1]
    const dx = bx - ax
    const dy = by - ay
    const t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy || 1)))
    best = Math.min(best, Math.hypot(x - ax - t * dx, y - ay - t * dy))
  }
  return best
}

interface Placed {
  x: number
  y: number
  el: ReactNode
}

function layout(t: Theme, seed: number, w: number, h: number, path: Pt[]) {
  const ground: Placed[] = []
  let k = 0
  // ряды по краям; на широком экране — несколько рядов, вплоть до дорожки
  const cols = Math.min(3, Math.max(1, Math.floor((w / 2 - 170) / 62)))
  for (const side of [0, 1])
    for (let c = 0; c < cols; c++) {
      for (let y = 30 + rnd(side + c * 2, seed) * 40; y < h - 10; y += 52 + rnd(k, seed + 2) * 34 + c * 8) {
        k++
        const inset = 8 + c * 62 + rnd(k, seed + 3) * 26
        const x = side ? w - inset : inset
        if (distToPolyline(x, y, path) < 44) continue
        ground.push({
          x,
          y,
          el: t.side[Math.floor(rnd(k, seed + 4) * t.side.length)](seed * 100 + k),
        })
      }
    }
  // мелочи и живность на поле — подальше от дорожки
  const area = Math.min(1.6, w / 390)
  const tries = Math.round((h / 16) * area)
  let critters = 0
  for (let i = 0; i < tries; i++) {
    const x = 26 + rnd(i, seed + 10) * (w - 52)
    const y = 20 + rnd(i, seed + 11) * (h - 40)
    const isCritter = rnd(i, seed + 12) > 0.72 && critters < (h / 160) * area
    if (distToPolyline(x, y, path) < (isCritter ? 46 : 38)) continue
    if (ground.some((g) => Math.hypot(g.x - x, g.y - y) < 30)) continue
    if (isCritter) critters++
    const pool = isCritter ? t.critters : t.field
    ground.push({
      x,
      y,
      el: pool[Math.floor(rnd(i, seed + 13) * pool.length)](seed * 1000 + i),
    })
  }
  ground.sort((a, b) => a.y - b.y)
  return ground
}

const TILE = 80

/** Сцена выходит за колонку контента до краёв скролл-контейнера (container query) */
const BLEED = 'calc((100% - 100cqw) / 2 - 20px)'

const BAND_H = 120
/** Гряда рисуется с запасом по ширине и обрезается колонкой — без растяжения */
const BAND_W = 2400
/** На сколько сцена юнита заходит вверх под облака предыдущего юнита */
const BAND_UP = 84

/** Облачная гряда на стыке двух тем: два слоя плывут навстречу, сверху покачиваются клочки */
function CloudBand({ seed }: { seed: number }) {
  const bumps = (y: number, rMin: number, rMax: number, step: number, k: number) =>
    Array.from({ length: Math.ceil(BAND_W / step) + 2 }, (_, i) => {
      const x = -30 + i * step + rnd(i, seed + k) * step * 0.4
      const r = rMin + rnd(i, seed + k + 1) * (rMax - rMin)
      return <circle key={`${k}-${i}`} cx={x} cy={y} r={r} />
    })
  const layer = (top: number, bottom: number, k: number, big = 1) => (
    <>
      {bumps(top, 18 * big, 30 * big, 34, k)}
      {bumps(bottom, 14 * big, 22 * big, 30, k + 5)}
      <rect x={-30} y={top} width={BAND_W + 60} height={bottom - top} />
    </>
  )
  return (
    <div className="sc-band pointer-events-none absolute inset-x-0 top-0" style={{ height: BAND_H }}>
      <svg className="absolute left-1/2 top-0 -translate-x-1/2" width={BAND_W} height={BAND_H} viewBox={`0 0 ${BAND_W} ${BAND_H}`} aria-hidden>
        <defs>
          <linearGradient id={`cb${seed}`} x1="0" y1="30" x2="0" y2="108" gradientUnits="userSpaceOnUse">
            <stop offset="0.35" stopColor="var(--cl-front)" />
            <stop offset="1" stopColor="var(--cl-low)" />
          </linearGradient>
        </defs>
        <g
          fill="var(--cl-back)"
          style={{
            ...anim('drift', 9, 0, { '--from': '-14px', '--to': '14px' }),
            animationDirection: 'alternate',
          }}
        >
          {layer(44, 74, 1, 1.15)}
        </g>
        <g
          style={{
            ...anim('drift', 11, 3, { '--from': '12px', '--to': '-12px' }),
            animationDirection: 'alternate',
          }}
        >
          <g fill="var(--cl-shade)" transform="translate(0 5)">
            {layer(58, 82, 11)}
          </g>
          <g fill={`url(#cb${seed})`}>{layer(58, 82, 11)}</g>
          {Array.from({ length: Math.ceil(BAND_W / 52) }, (_, i) => {
            const x = -20 + i * 52 + rnd(i, seed + 40) * 20
            return (
              <path key={i} d={`M${x - 9} ${50 + rnd(i, seed + 41) * 5}a14 14 0 0 1 16-7`} stroke="#fff" strokeOpacity={0.9} strokeWidth={3} strokeLinecap="round" fill="none" />
            )
          })}
        </g>
      </svg>
      {/* отдельные клочки над грядой */}
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="absolute"
          style={{
            left: `${12 + i * 32 + rnd(i, seed + 50) * 10}%`,
            top: 4 + rnd(i, seed + 51) * 18,
            ...anim('bob', 4 + i, i * 1.3, { '--amp': '-6px' }),
          }}
        >
          <svg width={34 + rnd(i, seed + 52) * 16} viewBox="0 0 50 26" style={{ display: 'block' }} aria-hidden>
            <path d="M8 24a8 8 0 0 1 2-15 11 11 0 0 1 20-4 9 9 0 0 1 15 7 7 7 0 0 1-1 12z" fill="var(--cl-front)" />
            <path d="M12 12a6 6 0 0 1 7-4" stroke="#fff" strokeWidth={2.5} strokeLinecap="round" fill="none" />
          </svg>
        </div>
      ))}
      {[0, 1, 2, 3].map((i) => (
        <div
          key={`s${i}`}
          className="absolute"
          style={{
            left: `${8 + i * 26 + rnd(i, seed + 60) * 12}%`,
            top: 14 + rnd(i, seed + 61) * 40,
          }}
        >
          <Sparkle c="#FFD166" s={7 + (i % 2) * 3} />
        </div>
      ))}
    </div>
  )
}

/** Фон юнита: земля с текстурой, дорожка через узлы, декор по краям, живность.
 * Декор строится только рядом с экраном и выгружается вдали; вне экрана анимации на паузе. */
export function UnitScene({ index, first, last }: { index: number; first: boolean; last: boolean }) {
  const t = THEMES[index % THEMES.length]
  const ref = useRef<HTMLDivElement>(null)
  const world = useRef<HTMLDivElement>(null)
  const [geo, setGeo] = useState<{ w: number; h: number; pts: Pt[] } | null>(null)
  const [near, setNear] = useState(false)
  const [visible, setVisible] = useState(false)
  const pid = `sc${index}`

  useLayoutEffect(() => {
    const el = world.current
    const section = ref.current?.parentElement
    if (!el || !section) return
    let last = ''
    const measure = () => {
      const box = el.getBoundingClientRect()
      const head = section.querySelector('[data-unit-head]')?.getBoundingClientRect()
      const nodes = [...section.querySelectorAll('[data-node]')].map((n) => {
        const r = n.getBoundingClientRect()
        return [Math.round(r.left + r.width / 2 - box.left), Math.round(r.top + r.height / 2 - box.top)] as Pt
      })
      const w = Math.round(box.width)
      const h = Math.round(box.height)
      const start: Pt[] = head ? [[w / 2, Math.round(head.bottom - box.top - 8)]] : []
      const end: Pt[] = nodes.length ? [[w / 2, h + 4]] : []
      const pts = [...start, ...nodes, ...end]
      // ResizeObserver срабатывает часто — пересчитываем раскладку, только если геометрия реально изменилась
      const key = `${w}|${h}|${pts.join(';')}`
      if (key === last) return
      last = key
      setGeo({ w, h, pts })
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(section)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const root = el.closest('[data-map-scroll]')
    const nearIo = new IntersectionObserver(([e]) => setNear(e.isIntersecting), { root, rootMargin: '400px 0px' })
    const visIo = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { root })
    nearIo.observe(el)
    visIo.observe(el)
    return () => {
      nearIo.disconnect()
      visIo.disconnect()
    }
  }, [])

  const placed = useMemo(() => (geo && near ? layout(t, index + 1, geo.w, geo.h, geo.pts) : null), [geo, near, t, index])

  // мягкое затухание только у первой (сверху) и последней (снизу) сцены, между юнитами — облака
  const fade = `linear-gradient(180deg, ${first ? 'transparent 0, #000 40px' : '#000 0'}, ${last ? '#000 calc(100% - 40px), transparent 100%' : '#000 100%'})`
  const d = geo ? smoothPath(geo.pts) : ''

  return (
    <div
      ref={ref}
      className={`map-scene pointer-events-none absolute -bottom-3 overflow-hidden ${visible ? '' : 'sc-paused'}`}
      data-light={t.light ? '' : undefined}
      style={
        {
          top: first ? -12 : -BAND_UP,
          left: BLEED,
          right: BLEED,
          contain: 'layout paint style',
          '--sky-day': t.day,
          '--sky-night': t.night,
        } as CSSProperties
      }
      aria-hidden
    >
      <div
        ref={world}
        className="sc-world absolute inset-x-0 bottom-0 overflow-hidden"
        style={{
          top: first ? 0 : BAND_UP - 12,
          maskImage: fade,
          WebkitMaskImage: fade,
        }}
      >
        <div className="sc-tex absolute inset-0">
          <svg width="100%" height="100%">
            <defs>
              <pattern id={`${pid}t`} width={TILE} height={TILE} patternUnits="userSpaceOnUse">
                {t.texture}
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill={`url(#${pid}t)`} />
          </svg>
        </div>

        {geo && near && (
          <svg className="absolute inset-0" width={geo.w} height={geo.h}>
            {/* дорожка «прорисовывается» при появлении */}
            <g className="sc-draw">
              {t.path.glow && <path d={d} pathLength={1} stroke="#8CFFC1" strokeOpacity={0.12} strokeWidth={56} fill="none" strokeLinecap="round" />}
              <path d={d} pathLength={1} stroke="#1A1033" strokeOpacity={0.12} strokeWidth={42} fill="none" strokeLinecap="round" transform="translate(0 4)" />
              <path d={d} pathLength={1} stroke={t.path.edge} strokeWidth={40} fill="none" strokeLinecap="round" />
              <path d={d} pathLength={1} stroke={t.path.fill} strokeWidth={30} fill="none" strokeLinecap="round" />
            </g>
            <g className="sc-fade-late">
              <path
                d={d}
                stroke={t.path.detail}
                strokeWidth={t.path.dw}
                strokeDasharray={t.path.dash}
                strokeLinecap={t.path.dw > 10 ? 'butt' : 'round'}
                fill="none"
                style={t.path.glow ? anim('pulse', 2, 0, { '--lo': '0.4' }) : undefined}
              />
            </g>
          </svg>
        )}

        {placed && geo && (
          <div className="absolute inset-0">
            {placed.map((p, i) => (
              <div key={i} className="absolute" style={{ left: p.x, top: p.y, transform: 'translate(-50%, -100%)' }}>
                {/* предметы выпрыгивают сверху вниз, волной вдоль сцены */}
                <div className="sc-pop" style={{ animationDelay: `${0.1 + (p.y / geo.h) * 0.7 + rnd(i, index) * 0.15}s` }}>
                  {p.el}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ночь для светлых тем: дешёвый оверлей вместо CSS-фильтра на анимированном слое */}
        <div className="sc-dim absolute inset-0" />
      </div>
      {!first && <CloudBand seed={index * 7 + 3} />}
    </div>
  )
}
