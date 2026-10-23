import { AnimatePresence, motion } from 'framer-motion'
import { useId, type ReactNode } from 'react'
import type { PetDecorId } from '../../lib/types'

// Комната питомца — одна SVG-сцена 340×250: стена до y=170, дальше пол.
export const ROOM_W = 340
export const ROOM_H = 250

const loop = (duration: number, delay = 0) => ({ duration, delay, repeat: Infinity, ease: 'easeInOut' as const })

function Window() {
  const stars: [number, number, number][] = [
    [210, 40, 0],
    [224, 52, 0.7],
    [242, 37, 1.4],
    [266, 57, 0.4],
    [216, 64, 1.9],
    [229, 41, 2.4],
  ]
  const towers: [number, number, number, number][] = [
    [203, 74, 10, 24],
    [214, 66, 12, 32],
    [227, 78, 8, 20],
    [238, 62, 14, 36],
    [253, 72, 9, 26],
    [263, 68, 8, 30],
  ]
  const lit = ['#FFD166', '#FF6FA8', '#4FD6FF']
  return (
    <g>
      {/* луч света на полу */}
      <path d="M200 170H272L304 250H182Z" fill="var(--room-light)" opacity={0.22} />
      <rect x={196} y={26} width={80} height={78} rx={4} fill="#F7F2EA" />
      <rect x={202} y={32} width={68} height={66} fill="#2A1F5C" />
      <rect x={202} y={68} width={68} height={30} fill="#4A2C7A" opacity={0.7} />
      <rect x={202} y={84} width={68} height={14} fill="#8A3C8A" opacity={0.55} />
      <circle cx={257} cy={44} r={7} fill="#FFE8A3" />
      <circle cx={260} cy={41.5} r={6} fill="#2A1F5C" />
      {stars.map(([x, y, d]) => (
        <motion.circle key={`${x}-${y}`} cx={x} cy={y} r={1.1} fill="#fff" animate={{ opacity: [0.2, 1, 0.2] }} transition={loop(2.4, d)} />
      ))}
      {towers.map(([x, y, w, h], i) => (
        <g key={x}>
          <rect x={x} y={y} width={w} height={h} fill="#160F33" />
          {[0, 1, 2].map((r) => (
            <motion.rect
              key={r}
              x={x + 2 + ((r + i) % 2) * (w - 6)}
              y={y + 4 + r * 7}
              width={2}
              height={2.5}
              fill={lit[(r + i) % 3]}
              animate={{ opacity: [1, 0.35, 1] }}
              transition={loop(3 + r, i * 0.5)}
            />
          ))}
        </g>
      ))}
      <path d="M206 96L228 34H236L214 96Z" fill="#fff" opacity={0.07} />
      <rect x={234.5} y={32} width={3} height={66} fill="#F7F2EA" />
      <rect x={202} y={63.5} width={68} height={3} fill="#F7F2EA" />
      <rect x={190} y={101} width={92} height={7} rx={2} fill="#E8DFD2" />
      <rect x={190} y={106} width={92} height={2} rx={1} fill="#000" opacity={0.08} />
      {/* шторы */}
      <path d="M182 20H205C201 48 207 82 200 112H182Z" fill="#F28AAE" />
      <path d="M190 24C189 52 192 84 189 110M197 24C196 52 199 84 195 110" stroke="#D9547F" strokeWidth={1.5} fill="none" opacity={0.6} />
      <path d="M290 20H267C271 48 265 82 272 112H290Z" fill="#F28AAE" />
      <path d="M282 24C283 52 280 84 283 110M275 24C276 52 273 84 277 110" stroke="#D9547F" strokeWidth={1.5} fill="none" opacity={0.6} />
      <path d="M178 20H294" stroke="#8A5A3C" strokeWidth={3} strokeLinecap="round" />
      <circle cx={178} cy={20} r={3.5} fill="#B57A4D" />
      <circle cx={294} cy={20} r={3.5} fill="#B57A4D" />
    </g>
  )
}

function Poster() {
  return (
    <g>
      <rect x={104} y={28} width={42} height={54} rx={3} fill="#2B2140" />
      <rect x={107} y={31} width={36} height={48} fill="#FFB547" />
      <motion.circle cx={125} cy={54} r={9} fill="#FF7A59" animate={{ cy: [55, 52, 55] }} transition={loop(5)} />
      <path d="M107 70L118 57L126 64L134 54L143 65V79H107Z" fill="#7A5CFF" />
      <path d="M107 74L121 66L143 75V79H107Z" fill="#5B3FE0" />
      <text x={125} y={41} textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontWeight={800} fontSize={6} fill="#2B2140">
        SHIP IT
      </text>
      <rect x={101} y={25} width={12} height={5} rx={1} fill="#FFF3D6" opacity={0.85} transform="rotate(-20 107 27.5)" />
      <rect x={137} y={25} width={12} height={5} rx={1} fill="#FFF3D6" opacity={0.85} transform="rotate(20 143 27.5)" />
    </g>
  )
}

function Garland() {
  const colors = ['#FFD166', '#4FD6FF', '#FF6FA8', '#8CFFC1']
  const q = (t: number, a: number, b: number, c: number) => (1 - t) * (1 - t) * a + 2 * (1 - t) * t * b + t * t * c
  const bulbs: [number, number][] = []
  for (const [x0, x2] of [
    [0, 170],
    [170, 340],
  ]) {
    for (const t of [0.14, 0.38, 0.62, 0.86]) {
      bulbs.push([q(t, x0, (x0 + x2) / 2, x2), q(t, x0 === 0 ? 6 : 12, 34, x0 === 0 ? 12 : 6)])
    }
  }
  return (
    <g>
      <path d="M0 6Q85 34 170 12Q255 34 340 6" stroke="#6B5A8A" strokeWidth={1.5} fill="none" />
      {bulbs.map(([x, y], i) => {
        const c = colors[i % colors.length]
        return (
          <g key={i}>
            <motion.circle cx={x} cy={y + 6} r={8} fill={c} animate={{ opacity: [0.1, 0.45, 0.1] }} transition={loop(1.8, i * 0.25)} />
            <rect x={x - 1.8} y={y - 1} width={3.6} height={3} rx={0.8} fill="#4B4560" />
            <ellipse cx={x} cy={y + 6} rx={3} ry={4.2} fill={c} />
            <ellipse cx={x - 1} cy={y + 4.5} rx={0.9} ry={1.5} fill="#fff" opacity={0.7} />
          </g>
        )
      })}
    </g>
  )
}

function Rug() {
  return (
    <g>
      {[-1, 1].map((s) =>
        [-6, -2, 2, 6].map((dy) => (
          <path key={`${s}${dy}`} d={`M${180 + s * 80} ${222 + dy}h${s * 6}`} stroke="#F28AAE" strokeWidth={1.5} strokeLinecap="round" />
        )),
      )}
      <ellipse cx={180} cy={223} rx={81} ry={18} fill="#C9456F" />
      <ellipse cx={180} cy={222} rx={80} ry={17} fill="#E8678F" />
      <ellipse cx={180} cy={222} rx={67} ry={13} fill="#F59AB5" />
      <ellipse cx={180} cy={222} rx={52} ry={9} fill="none" stroke="#FFF3D6" strokeWidth={1.5} strokeDasharray="4 3" />
      <ellipse cx={180} cy={222} rx={28} ry={4.5} fill="#FFD166" opacity={0.75} />
    </g>
  )
}

function Plant() {
  const leaves: [number, number, number, number, number, string][] = [
    [30, 126, 6, 11, -55, '#3FAE6A'],
    [57, 124, 6, 11, 55, '#2E8F55'],
    [32, 108, 8, 15, -30, '#2E8F55'],
    [55, 104, 8, 16, 30, '#3FAE6A'],
    [43, 89, 9, 17, 0, '#49C178'],
  ]
  return (
    <g>
      <ellipse cx={43} cy={169} rx={20} ry={3.5} fill="#000" opacity={0.12} />
      <motion.g style={{ originX: '43px', originY: '140px' }} animate={{ rotate: [-2.5, 2.5, -2.5] }} transition={loop(4.5)}>
        <path d="M43 140C42 125 36 116 32 110M43 140C44 122 50 112 55 104M43 140V92M43 138C38 133 33 129 30 126M43 138C49 133 54 128 57 124" stroke="#2E7D4A" strokeWidth={2} fill="none" strokeLinecap="round" />
        {leaves.map(([cx, cy, rx, ry, rot, fill]) => (
          <g key={`${cx}-${cy}`} transform={`rotate(${rot} ${cx} ${cy})`}>
            <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={fill} />
            <path d={`M${cx} ${cy - ry + 2}V${cy + ry - 2}`} stroke="#8EE0A8" strokeWidth={1} opacity={0.7} />
          </g>
        ))}
      </motion.g>
      <path d="M29 143H57L53 168H33Z" fill="#D9774B" />
      <path d="M31 150H55" stroke="#B85E36" strokeWidth={2} />
      <rect x={26} y={137} width={34} height={7} rx={2} fill="#E8915F" />
    </g>
  )
}

function Shelf() {
  const rows: [number, [number, number, string][]][] = [
    [97, [[5, 22, '#7A5CFF'], [4, 19, '#FF7A59'], [6, 24, '#4FB3F6'], [4, 17, '#FFD166'], [5, 21, '#3FAE6A']]],
    [129, [[6, 23, '#F28AAE'], [4, 18, '#4FB3F6'], [5, 21, '#7A5CFF'], [7, 14, '#E8DFD2']]],
    [163, [[5, 20, '#FFD166'], [6, 24, '#3FAE6A'], [4, 18, '#FF7A59'], [5, 22, '#F28AAE'], [5, 19, '#7A5CFF']]],
  ]
  return (
    <g>
      <ellipse cx={43} cy={169} rx={32} ry={3} fill="#000" opacity={0.12} />
      <rect x={14} y={64} width={58} height={105} rx={3} fill="#9B6A45" />
      <rect x={18} y={68} width={50} height={97} fill="#5E3B27" />
      {rows.map(([bottom, books]) => {
        let x = 21
        return (
          <g key={bottom}>
            {books.map(([w, h, c], i) => {
              const bx = x
              x += w + 1
              const lean = i === books.length - 1 && h < 16
              return (
                <g key={i} transform={lean ? `rotate(-20 ${bx} ${bottom})` : undefined}>
                  <rect x={bx} y={bottom - h} width={w} height={h} rx={0.8} fill={c} />
                  <rect x={bx} y={bottom - h + 3} width={w} height={1.2} fill="#fff" opacity={0.35} />
                </g>
              )
            })}
          </g>
        )
      })}
      <rect x={14} y={97} width={58} height={3.5} fill="#B57A4D" />
      <rect x={14} y={129} width={58} height={3.5} fill="#B57A4D" />
      <rect x={12} y={62} width={62} height={4} rx={1.5} fill="#B57A4D" />
      {/* декор на полке */}
      <circle cx={58} cy={152} r={7} fill="#4FB3F6" />
      <path d="M53 149c3 1 5-2 8 0M52 155c4-1 6 2 11 0" stroke="#3FAE6A" strokeWidth={2} fill="none" />
      <rect x={55} y={159} width={6} height={4} fill="#B57A4D" />
      <path d="M50 62L52 52H62L64 62Z" fill="#D9774B" />
      <motion.g style={{ originX: '57px', originY: '52px' }} animate={{ rotate: [-4, 4, -4] }} transition={loop(3.5)}>
        <ellipse cx={53} cy={46} rx={3.5} ry={6} fill="#3FAE6A" transform="rotate(-30 53 46)" />
        <ellipse cx={61} cy={45} rx={3.5} ry={6.5} fill="#49C178" transform="rotate(30 61 45)" />
      </motion.g>
    </g>
  )
}

function Desk() {
  const code: [number, number, number, string][] = [
    [106, 94, 14, '#7A5CFF'],
    [122, 94, 10, '#8CFFC1'],
    [110, 99, 20, '#FFD166'],
    [110, 104, 12, '#FF7A59'],
    [124, 104, 14, '#8CFFC1'],
    [106, 109, 9, '#7A5CFF'],
  ]
  return (
    <g>
      <ellipse cx={126} cy={169} rx={48} ry={3} fill="#000" opacity={0.12} />
      <rect x={86} y={132} width={5} height={37} fill="#8A5A3C" />
      <rect x={161} y={132} width={5} height={37} fill="#8A5A3C" />
      <rect x={136} y={132} width={27} height={22} rx={1.5} fill="#B57A4D" />
      <rect x={146} y={141} width={7} height={2} rx={1} fill="#6E4630" />
      <rect x={80} y={126} width={92} height={7} rx={2} fill="#C68A5B" />
      <rect x={80} y={131} width={92} height={2} fill="#000" opacity={0.12} />
      {/* монитор */}
      <rect x={122} y={118} width={8} height={8} fill="#3A3550" />
      <rect x={114} y={124} width={24} height={2.5} rx={1.2} fill="#3A3550" />
      <rect x={100} y={88} width={52} height={32} rx={3} fill="#23202E" />
      <motion.rect x={103} y={91} width={46} height={26} fill="#141220" />
      <motion.g animate={{ opacity: [0.85, 1, 0.85] }} transition={loop(3)}>
        {code.map(([x, y, w, c]) => (
          <rect key={`${x}-${y}`} x={x} y={y} width={w} height={2.4} rx={1.2} fill={c} />
        ))}
      </motion.g>
      <motion.rect x={117} y={108.5} width={2} height={4} fill="#8CFFC1" animate={{ opacity: [1, 0, 1] }} transition={{ duration: 1, repeat: Infinity, times: [0, 0.5, 1], ease: 'linear' }} />
      <rect x={140} y={122} width={24} height={4} rx={1.2} fill="#E3DDEE" />
      {/* кружка с паром */}
      <motion.path d="M90 113c-2 2 2 3 0 5M94 112c-2 2 2 3 0 5" stroke="#B8AFC6" strokeWidth={1.3} fill="none" strokeLinecap="round" animate={{ opacity: [0, 0.9, 0], y: [2, -2, -5] }} transition={loop(2.4)} />
      <path d="M97 120h2a2.5 2.5 0 0 1 0 5h-2" stroke="#FF7A59" strokeWidth={1.6} fill="none" />
      <rect x={87} y={118} width={10} height={8} rx={1.5} fill="#FF7A59" />
    </g>
  )
}

function Lamp() {
  return (
    <g>
      <motion.circle cx={311} cy={140} r={26} fill="#FF6FA8" animate={{ opacity: [0.1, 0.28, 0.1] }} transition={loop(3)} />
      <ellipse cx={311} cy={169} rx={16} ry={2.5} fill="#000" opacity={0.15} />
      <path d="M303 120H319L322 156H300Z" fill="#6A2C8E" />
      <motion.ellipse cx={308} rx={3.5} ry={4.8} fill="#FF6FA8" animate={{ cy: [149, 128, 149], ry: [4.8, 3.6, 4.8] }} transition={loop(4.2)} />
      <motion.ellipse cx={314.5} rx={2.8} ry={3.2} fill="#FFB547" animate={{ cy: [127, 148, 127] }} transition={loop(3.4)} />
      <motion.circle cx={311} r={1.8} fill="#FF9FC4" animate={{ cy: [140, 124, 152, 140] }} transition={loop(5.5)} />
      <path d="M305 123L303.5 152" stroke="#fff" strokeWidth={1.5} strokeLinecap="round" opacity={0.3} />
      <path d="M304 120L306 113H316L318 120Z" fill="#4B4560" />
      <path d="M300 156H322L325 168H297Z" fill="#4B4560" />
      <rect x={297} y={162} width={28} height={2} fill="#000" opacity={0.15} />
    </g>
  )
}

function Arcade() {
  return (
    <g>
      <ellipse cx={310} cy={169} rx={24} ry={3} fill="#000" opacity={0.15} />
      <path d="M288 168V100L294 84H326L332 100V168Z" fill="#2D2A6E" />
      <path d="M326 84L332 100V168H326Z" fill="#1E1B4B" />
      <rect x={292} y={86} width={32} height={10} rx={1.5} fill="#FF4D8D" />
      <text x={308} y={93.5} textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontWeight={800} fontSize={6} fill="#fff">
        PLAY
      </text>
      <rect x={292} y={100} width={32} height={24} rx={2} fill="#0F1028" />
      <motion.g animate={{ x: [-6, 6, -6] }} transition={loop(2.2)}>
        <path d="M304 106h8v2h2v4h-2v2h-2v-2h-4v2h-2v-2h-2v-4h2z" fill="#8CFFC1" />
        <rect x={305.5} y={109} width={1.5} height={1.5} fill="#0F1028" />
        <rect x={309} y={109} width={1.5} height={1.5} fill="#0F1028" />
      </motion.g>
      <rect x={306} y={119} width={4} height={2} fill="#FFD166" />
      <path d="M288 130H330L332 138H288Z" fill="#3B37A0" />
      <path d="M297 133V127" stroke="#C8C2D6" strokeWidth={1.5} />
      <circle cx={297} cy={126} r={2.4} fill="#E5484D" />
      <circle cx={312} cy={134} r={2} fill="#FFD166" />
      <circle cx={320} cy={134} r={2} fill="#4FB3F6" />
      <rect x={304} y={148} width={8} height={8} rx={1} fill="#1E1B4B" />
      <motion.rect x={306} y={150} width={4} height={4} rx={0.5} fill="#FFB21E" animate={{ opacity: [1, 0.3, 1] }} transition={loop(1.4)} />
    </g>
  )
}

function Beanbag() {
  return (
    <g>
      <ellipse cx={58} cy={240} rx={40} ry={5} fill="#000" opacity={0.15} />
      <path d="M22 234C16 212 30 192 54 190C78 188 98 204 95 224C94 238 80 241 58 241C40 241 25 240 22 234Z" fill="#6646E6" />
      <path d="M24 232C19 213 31 195 54 193C76 191 94 205 92 222C91 234 79 237 58 237C41 237 27 237 24 232Z" fill="#7A5CFF" />
      <ellipse cx={60} cy={208} rx={22} ry={7} fill="#6646E6" />
      <path d="M33 205C36 198 43 195 50 194" stroke="#A996FF" strokeWidth={3} fill="none" strokeLinecap="round" />
      <path d="M40 222C48 226 70 226 80 220" stroke="#5B3FE0" strokeWidth={1.5} fill="none" strokeLinecap="round" />
    </g>
  )
}

function Cat() {
  return (
    <g>
      <ellipse cx={272} cy={238} rx={17} ry={3} fill="#000" opacity={0.15} />
      <motion.g animate={{ y: [0, -3, 0] }} transition={loop(2.2)}>
        <g transform="translate(252 196)">
          <motion.path
            d="M32 28Q38 24 36 18"
            fill="none"
            stroke="#F472B6"
            strokeWidth={3}
            strokeLinecap="round"
            style={{ originX: '32px', originY: '28px' }}
            animate={{ rotate: [-12, 14, -12] }}
            transition={loop(1.6)}
          />
          <polygon points="8,16 11,6 17,14" fill="#F472B6" />
          <polygon points="32,16 29,6 23,14" fill="#F472B6" />
          <rect x={8} y={13} width={24} height={21} rx={8} fill="#F9A8D4" />
          <rect x={11} y={17} width={18} height={10} rx={4} fill="#1F192E" />
          <motion.g style={{ originY: '22px' }} animate={{ scaleY: [1, 1, 0.1, 1] }} transition={{ duration: 3.5, repeat: Infinity, times: [0, 0.9, 0.95, 1] }}>
            <circle cx={16} cy={22} r={1.8} fill="#8CFFC1" />
            <circle cx={24} cy={22} r={1.8} fill="#8CFFC1" />
          </motion.g>
          <rect x={10} y={32} width={6} height={4} rx={2} fill="#F472B6" />
          <rect x={24} y={32} width={6} height={4} rx={2} fill="#F472B6" />
        </g>
      </motion.g>
    </g>
  )
}

function CrownArt() {
  return (
    <svg width="100%" height="100%" viewBox="-4 -4 42 30" aria-hidden>
      <path d="M3 19L6 6L12 13L17 3L22 13L28 6L31 19Z" fill="#FFD700" stroke="#B45309" strokeWidth={1.8} strokeLinejoin="round" />
      <circle cx={17} cy={13} r={2} fill="#EF4444" />
      <circle cx={10} cy={15} r={1.5} fill="#38BDF8" />
      <circle cx={24} cy={15} r={1.5} fill="#38BDF8" />
    </svg>
  )
}

function GlassesArt() {
  return (
    <svg width="100%" height="100%" viewBox="0 -4 62 26" aria-hidden>
      <rect x={4} y={3} width={23} height={11} rx={3} fill="#00F0FF" fillOpacity={0.85} stroke="#0F172A" strokeWidth={2} />
      <rect x={35} y={3} width={23} height={11} rx={3} fill="#FF00A0" fillOpacity={0.85} stroke="#0F172A" strokeWidth={2} />
      <line x1={27} y1={8} x2={35} y2={8} stroke="#0F172A" strokeWidth={2.5} />
      <line x1={7} y1={6} x2={14} y2={6} stroke="#FFF" strokeWidth={1.5} strokeLinecap="round" />
      <line x1={38} y1={6} x2={45} y2={6} stroke="#FFF" strokeWidth={1.5} strokeLinecap="round" />
    </svg>
  )
}

/** Предметы, которые рисуются в самой комнате, в порядке слоёв (сзади вперёд) */
const SCENE: { id: PetDecorId; bbox: [number, number, number, number]; el: () => ReactNode }[] = [
  { id: 'decor_window', bbox: [176, 14, 120, 98], el: Window },
  { id: 'decor_poster', bbox: [98, 22, 54, 64], el: Poster },
  { id: 'decor_shelf', bbox: [8, 36, 70, 136], el: Shelf },
  { id: 'decor_plant', bbox: [8, 70, 70, 102], el: Plant },
  { id: 'decor_desk', bbox: [76, 84, 100, 88], el: Desk },
  { id: 'decor_lamp', bbox: [282, 106, 58, 66], el: Lamp },
  { id: 'decor_arcade', bbox: [280, 80, 58, 94], el: Arcade },
  { id: 'decor_rug', bbox: [92, 200, 176, 44], el: Rug },
  { id: 'decor_garland', bbox: [0, 0, 340, 46], el: Garland },
  { id: 'decor_beanbag', bbox: [14, 184, 88, 62], el: Beanbag },
  { id: 'decor_cat', bbox: [246, 188, 52, 54], el: Cat },
]

const FRONT: PetDecorId[] = ['decor_beanbag', 'decor_cat']

function Layer({ equipped, front }: { equipped: PetDecorId[]; front: boolean }) {
  return (
    <AnimatePresence>
      {SCENE.filter((s) => equipped.includes(s.id) && FRONT.includes(s.id) === front).map(({ id, el: El }) => (
        <motion.g
          key={id}
          style={{ transformBox: 'fill-box', originX: 0.5, originY: 1 }}
          initial={{ opacity: 0, scale: 0.6, y: -14 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.7, y: 6 }}
          transition={{ type: 'spring', stiffness: 380, damping: 18 }}
        >
          <El />
        </motion.g>
      ))}
    </AnimatePresence>
  )
}

function Walls() {
  const pid = useId().replace(/:/g, '')
  return (
    <>
      <defs>
        <pattern id={`${pid}w`} width={22} height={22} patternUnits="userSpaceOnUse">
          <rect width={22} height={22} fill="var(--room-wall)" />
          <rect width={11} height={22} fill="var(--room-wall2)" />
          <circle cx={16.5} cy={6} r={1.2} fill="var(--room-base)" opacity={0.5} />
        </pattern>
        <radialGradient id={`${pid}g`}>
          <stop offset="0" stopColor="var(--room-light)" stopOpacity={0.35} />
          <stop offset="1" stopColor="var(--room-light)" stopOpacity={0} />
        </radialGradient>
      </defs>
      <rect width={ROOM_W} height={170} fill={`url(#${pid}w)`} />
      <ellipse cx={170} cy={70} rx={170} ry={110} fill={`url(#${pid}g)`} style={{ opacity: 'var(--room-glow)' }} />
      <rect y={170} width={ROOM_W} height={80} fill="var(--room-floor)" />
      {[186, 206, 230].map((y, i) => (
        <g key={y}>
          <path d={`M0 ${y}H${ROOM_W}`} stroke="var(--room-floor2)" strokeWidth={1.5} />
          {[0, 1, 2, 3, 4].map((k) => {
            const x = 40 + k * 70 + (i % 2) * 35
            return <path key={k} d={`M${x} ${y}V${[170, 186, 206][i]}`} stroke="var(--room-floor2)" strokeWidth={1.5} />
          })}
        </g>
      ))}
      <rect y={161} width={ROOM_W} height={10} fill="var(--room-base)" />
      <rect y={170} width={ROOM_W} height={3} fill="#000" opacity={0.08} />
      {/* розетка */}
      <rect x={318} y={146} width={8} height={10} rx={1.5} fill="var(--room-base)" />
      <circle cx={322} cy={149.5} r={0.9} fill="#6B5A8A" />
      <circle cx={322} cy={152.5} r={0.9} fill="#6B5A8A" />
    </>
  )
}

/** Комната целиком. children — HTML-слой питомца поверх сцены. */
export function Room({ equipped, children, className = '' }: { equipped: PetDecorId[]; children?: ReactNode; className?: string }) {
  return (
    <div className={`relative w-full overflow-hidden ${className}`} style={{ aspectRatio: `${ROOM_W} / ${ROOM_H}` }}>
      <svg className="absolute inset-0 h-full w-full" viewBox={`0 0 ${ROOM_W} ${ROOM_H}`} aria-hidden>
        <Walls />
        <ellipse cx={180} cy={233} rx={34} ry={5} fill="#000" opacity={0.16} />
        <Layer equipped={equipped} front={false} />
      </svg>
      {children}
      <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox={`0 0 ${ROOM_W} ${ROOM_H}`} aria-hidden>
        <Layer equipped={equipped} front />
      </svg>
    </div>
  )
}

/** Превью предмета для карточки */
export function DecorThumb({ id }: { id: PetDecorId }) {
  if (id === 'decor_crown') return <CrownArt />
  if (id === 'decor_glasses') return <GlassesArt />
  const s = SCENE.find((x) => x.id === id)
  if (!s) return null
  const [x, y, w, h] = s.bbox
  const El = s.el
  return (
    <svg width="100%" height="100%" viewBox={`${x} ${y} ${w} ${h}`} preserveAspectRatio="xMidYMid meet" aria-hidden>
      <El />
    </svg>
  )
}

/** Аксессуары прямо на Блинке (координаты под size=118) */
export function PetAccessories({ equipped }: { equipped: PetDecorId[] }) {
  return (
    <AnimatePresence>
      {equipped.includes('decor_crown') && (
        <motion.div
          key="crown"
          className="pointer-events-none absolute left-[38px] top-[4px] h-[30px] w-[42px]"
          initial={{ y: -30, opacity: 0, rotate: -20 }}
          animate={{ y: 0, opacity: 1, rotate: 0 }}
          exit={{ y: -30, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 14 }}
        >
          <CrownArt />
        </motion.div>
      )}
      {equipped.includes('decor_glasses') && (
        <motion.div
          key="glasses"
          className="pointer-events-none absolute left-[25px] top-[57px] h-[22px] w-[68px]"
          initial={{ y: -40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -40, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 320, damping: 16 }}
        >
          <GlassesArt />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
