import type { ReactNode } from 'react'
import type { PetConsumableId } from '../../lib/types'

// Плоские иллюстрации угощений, viewBox 48×48
const ART: Record<PetConsumableId, ReactNode> = {
  food_cookie: (
    <>
      <circle cx={24} cy={25} r={17} fill="#B8783A" />
      <circle cx={24} cy={24} r={17} fill="#E3A65E" />
      <path d="M13 17a13 13 0 0 1 9-6" stroke="#F6CB8E" strokeWidth={3} strokeLinecap="round" fill="none" />
      <ellipse cx={18} cy={21} rx={2.6} ry={2.2} fill="#5A3420" />
      <ellipse cx={29} cy={17} rx={2.2} ry={1.9} fill="#5A3420" />
      <ellipse cx={31} cy={28} rx={2.8} ry={2.3} fill="#5A3420" />
      <ellipse cx={20} cy={31} rx={2.2} ry={1.9} fill="#5A3420" />
      <ellipse cx={25} cy={25} rx={1.5} ry={1.3} fill="#5A3420" />
    </>
  ),
  food_ramen: (
    <>
      <path d="M33 4L43 20" stroke="#8A5A3C" strokeWidth={2.6} strokeLinecap="round" />
      <path d="M38 3L45 18" stroke="#A8714D" strokeWidth={2.6} strokeLinecap="round" />
      <ellipse cx={24} cy={23} rx={19} ry={5.5} fill="#F2B866" />
      <path d="M11 22c3-3 5 3 8 0s5 3 8 0 5 3 8 0" stroke="#FFE7A8" strokeWidth={2} fill="none" strokeLinecap="round" />
      <ellipse cx={30} cy={21.5} rx={4.5} ry={3} fill="#fff" />
      <circle cx={30} cy={21.5} r={1.8} fill="#FFB21E" />
      <path d="M15 19.5h5l-1 3h-5z" fill="#F07CA0" />
      <path d="M5 23h38a19 19 0 0 1-38 0z" fill="#E5484D" />
      <path d="M8.5 31h31" stroke="#fff" strokeWidth={2} strokeDasharray="3 3" opacity={0.7} />
      <path d="M16 42h16" stroke="#B8323A" strokeWidth={3} strokeLinecap="round" />
    </>
  ),
  food_pizza: (
    <>
      <path d="M24 44L7 13q17-9 34 0z" fill="#F9C74F" />
      <path d="M24 44L7 13q17-9 34 0z" fill="none" stroke="#E9A23B" strokeWidth={1.5} strokeLinejoin="round" />
      <path d="M7 13q17-9 34 0" stroke="#D98E3A" strokeWidth={6} fill="none" strokeLinecap="round" />
      <circle cx={18} cy={20} r={3.6} fill="#E5484D" />
      <circle cx={29} cy={19} r={3.2} fill="#E5484D" />
      <circle cx={24} cy={30} r={3.2} fill="#E5484D" />
      <ellipse cx={23} cy={20} rx={2} ry={1.1} fill="#3FAE6A" transform="rotate(-30 23 20)" />
      <ellipse cx={27} cy={26} rx={1.8} ry={1} fill="#3FAE6A" transform="rotate(25 27 26)" />
      <path d="M21 36q1 4 0 6" stroke="#F9C74F" strokeWidth={2.2} strokeLinecap="round" fill="none" />
    </>
  ),
  food_burger: (
    <>
      <path d="M7 21a17 13 0 0 1 34 0z" fill="#E9A23B" />
      <path d="M11 16a14 10 0 0 1 9-6" stroke="#F6C97A" strokeWidth={2.5} strokeLinecap="round" fill="none" />
      <ellipse cx={18} cy={14} rx={1.2} ry={0.7} fill="#FFF3D6" />
      <ellipse cx={26} cy={12} rx={1.2} ry={0.7} fill="#FFF3D6" />
      <ellipse cx={31} cy={16} rx={1.2} ry={0.7} fill="#FFF3D6" />
      <path d="M5 23c3 3 5-2 8 1s5-2 8 1 5-2 8 1 5-2 8 1 4-1 6-2v-2H5z" fill="#5CC46B" />
      <path d="M8 26h32l-4 6-4-4z" fill="#FFD166" />
      <rect x={6} y={27} width={36} height={7} rx={3.5} fill="#6B3A22" />
      <path d="M7 36h34v1a5 5 0 0 1-5 5H12a5 5 0 0 1-5-5z" fill="#E9A23B" />
    </>
  ),
  food_sushi: (
    <>
      {[
        [14, 30],
        [34, 30],
        [24, 16],
      ].map(([x, y]) => (
        <g key={`${x}-${y}`}>
          <ellipse cx={x} cy={y + 3} rx={10} ry={4} fill="#000" opacity={0.15} />
          <circle cx={x} cy={y} r={10} fill="#1F2A2E" />
          <circle cx={x} cy={y} r={7.5} fill="#FBF7F0" />
          <circle cx={x} cy={y} r={4} fill="#FF8A65" />
          <circle cx={x + 1.5} cy={y - 1} r={1.6} fill="#5CC46B" />
        </g>
      ))}
    </>
  ),
  food_cake: (
    <>
      <rect x={23} y={4} width={2.4} height={9} rx={1.2} fill="#7A5CFF" />
      <path d="M24.2 0.5c2 2.5 2 4 0 5-2-1-2-2.5 0-5z" fill="#FFB21E" />
      <rect x={7} y={20} width={34} height={22} rx={5} fill="#F59AB5" />
      <rect x={7} y={30} width={34} height={4} fill="#FBE3EC" />
      <path d="M7 20a5 5 0 0 1 5-5h24a5 5 0 0 1 5 5v3c-2 0-2 4-4.5 4S34 23 31 23s-2 5-5 5-2-5-5-5-2 4-4.5 4S14 23 12 23s-2 3-5 3z" fill="#fff" />
      <path d="M14 15c-1-3 3-4 4-1z" fill="#E5484D" />
      <path d="M32 15c1-3-3-4-4-1z" fill="#E5484D" />
      <rect x={5} y={41} width={38} height={3.5} rx={1.75} fill="#C8C2D6" />
    </>
  ),
  drink_water: (
    <>
      <path d="M12 8h24l-3 34a3 3 0 0 1-3 2.7H18A3 3 0 0 1 15 42z" fill="#DDF2FF" />
      <path d="M13.6 20h20.8l-2 22a2 2 0 0 1-2 1.8H17.6a2 2 0 0 1-2-1.8z" fill="#4FB3F6" />
      <path d="M13.6 20q5 3 10.4 0t10.4 0" fill="#7CCBFF" />
      <circle cx={20} cy={32} r={1.6} fill="#fff" opacity={0.8} />
      <circle cx={27} cy={27} r={1.1} fill="#fff" opacity={0.8} />
      <circle cx={25} cy={37} r={1.3} fill="#fff" opacity={0.8} />
      <path d="M16 11l1.5 24" stroke="#fff" strokeWidth={2} strokeLinecap="round" opacity={0.8} />
      <path d="M12 8h24" stroke="#9FD6F7" strokeWidth={2} strokeLinecap="round" />
    </>
  ),
  drink_coffee: (
    <>
      <path d="M18 4c-2 3 2 4 0 7M24 3c-2 3 2 4 0 7M30 4c-2 3 2 4 0 7" stroke="#B8AFC6" strokeWidth={2} fill="none" strokeLinecap="round" />
      <ellipse cx={24} cy={41} rx={18} ry={4} fill="#D9D3E4" />
      <path d="M35 21h3a5 5 0 0 1 0 10h-3" stroke="#F2EDE6" strokeWidth={3.5} fill="none" />
      <path d="M9 16h28v10a14 14 0 0 1-28 0z" fill="#F2EDE6" />
      <ellipse cx={23} cy={16} rx={14} ry={3.5} fill="#6B3E26" />
      <ellipse cx={21} cy={15.5} rx={5} ry={1.4} fill="#C08A5C" />
      <path d="M12 21v4a11 11 0 0 0 4 8" stroke="#fff" strokeWidth={2} strokeLinecap="round" fill="none" />
    </>
  ),
  drink_matcha: (
    <>
      <path d="M35 18h2.5a5.5 5.5 0 0 1 0 11H35" stroke="#CBE7F2" strokeWidth={3.5} fill="none" />
      <path d="M10 8h26v30a5 5 0 0 1-5 5H15a5 5 0 0 1-5-5z" fill="#EAF7FB" />
      <path d="M11.5 22h23v16a3.5 3.5 0 0 1-3.5 3.5H15a3.5 3.5 0 0 1-3.5-3.5z" fill="#7DBB55" />
      <path d="M11.5 15h23v7h-23z" fill="#A9D57E" />
      <path d="M11.5 12h23v3h-23z" fill="#F4F0DE" />
      <path d="M23 28c-3 0-4 4 0 7 4-3 3-7 0-7z" fill="#F4F0DE" opacity={0.9} />
      <path d="M13 10v26" stroke="#fff" strokeWidth={2} strokeLinecap="round" opacity={0.8} />
    </>
  ),
  drink_boba: (
    <>
      <path d="M27 1l-2 14" stroke="#FF6FA8" strokeWidth={4.5} strokeLinecap="round" />
      <path d="M11 13a13 6 0 0 1 26 0z" fill="#F4EEF9" />
      <rect x={9} y={13} width={30} height={3.5} rx={1.75} fill="#D9D0E6" />
      <path d="M11.5 17h25l-2.6 24a3 3 0 0 1-3 2.6H17a3 3 0 0 1-3-2.6z" fill="#D9A877" />
      <path d="M12 21h24" stroke="#C8946A" strokeWidth={1.5} />
      {[
        [17, 39],
        [22, 40],
        [27, 39.5],
        [32, 39],
        [19.5, 35.5],
        [25, 36],
        [30, 35.5],
      ].map(([x, y]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r={2.3} fill="#2A1C16" />
      ))}
    </>
  ),
  drink_smoothie: (
    <>
      <path d="M30 2l-5 18" stroke="#3FAE6A" strokeWidth={3.5} strokeLinecap="round" />
      <path d="M31 9a7 7 0 0 1 10 2l-6 5z" fill="#FFB547" />
      <path d="M12 12h24l-3 30a3 3 0 0 1-3 2.6H18A3 3 0 0 1 15 42z" fill="#FFF1D9" />
      <path d="M13 16h22l-2.6 25.5a2 2 0 0 1-2 1.8H17.6a2 2 0 0 1-2-1.8z" fill="#FF9F1C" />
      <path d="M13 16q5.5 4 11 0t11 0l-.6 6H13.6z" fill="#FFC15E" />
      <path d="M16.5 20l1.8 19" stroke="#fff" strokeWidth={2} strokeLinecap="round" opacity={0.6} />
    </>
  ),
  drink_energy: (
    <>
      <rect x={13} y={4} width={22} height={40} rx={5} fill="#1E1B2E" />
      <rect x={14.5} y={4} width={19} height={4} rx={2} fill="#A8A3B8" />
      <rect x={14.5} y={40} width={19} height={4} rx={2} fill="#A8A3B8" />
      <path d="M26 13l-7 13h5l-2 10 8-14h-5z" fill="#8CFFC1" />
      <rect x={16} y={11} width={2.5} height={26} rx={1.25} fill="#fff" opacity={0.25} />
    </>
  ),
}

export function ItemArt({ id, size = 40 }: { id: PetConsumableId; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" style={{ display: 'block', overflow: 'visible' }} aria-hidden>
      {ART[id]}
    </svg>
  )
}
