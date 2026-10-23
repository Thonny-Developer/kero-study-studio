import plugin from 'tailwindcss/plugin'
import type { Config } from 'tailwindcss'

// Токены из макета Vibely. Значения живут в CSS-переменных (src/index.css),
// чтобы светлая/тёмная тема и цвет трека переключались без перерендера классов.
const v = (name: string) => `var(--${name})`

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // треки
        code: { DEFAULT: v('code'), sh: v('codeSh'), soft: v('codeSoft'), ink: v('codeInk') },
        mkt: { DEFAULT: v('mkt'), sh: v('mktSh'), soft: v('mktSoft'), ink: v('mktInk') },
        // активный трек
        acc: { DEFAULT: v('acc'), sh: v('accSh'), soft: v('accSoft'), ink: v('accInk') },
        // статусы
        ok: { DEFAULT: v('ok'), sh: v('okSh'), soft: v('okSoft'), ink: v('okInk') },
        err: { DEFAULT: v('err'), sh: v('errSh'), soft: v('errSoft'), ink: v('errInk') },
        gold: { DEFAULT: v('gold'), sh: v('goldSh'), soft: v('goldSoft'), ink: v('goldInk') },
        // нейтрали
        page: v('page'),
        bg: v('bg'),
        sf: v('sf'),
        sf2: v('sf2'),
        ink: { DEFAULT: v('ink'), 2: v('ink2'), 3: v('ink3') },
        line: v('line'),
        lock: v('lockSh'),
        term: { DEFAULT: v('term'), line: v('termLine'), text: '#E9E6F2', mute: '#8E89A0', green: '#8CFFC1' },
      },
      fontFamily: {
        display: ['Unbounded', 'sans-serif'],
        sans: ['Onest', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      borderRadius: {
        btn: '18px',
        card: '20px',
        tile: '14px',
        unit: '22px',
        sheet: '28px',
        phone: '54px',
      },
      boxShadow: {
        // «нажимаемые» тени кнопок: 5px у основных, 4px у вторичных и карточек
        'btn-acc': `0 5px 0 ${v('accSh')}`,
        'btn-code': `0 5px 0 ${v('codeSh')}`,
        'btn-mkt': `0 5px 0 ${v('mktSh')}`,
        'btn-ok': `0 5px 0 ${v('okSh')}`,
        'btn-err': `0 5px 0 ${v('errSh')}`,
        'btn-gold': `0 5px 0 ${v('goldSh')}`,
        'btn-lock': `0 5px 0 ${v('lockSh')}`,
        'btn-2': `0 4px 0 ${v('line')}`,
        'node-acc': `0 6px 0 ${v('accSh')}`,
        'node-gold': `0 6px 0 ${v('goldSh')}`,
        'node-lock': `0 6px 0 ${v('lockSh')}`,
        'unit-acc': `0 5px 0 ${v('accSh')}`,
        'unit-lock': `0 5px 0 ${v('lockSh')}`,
        tip: `0 3px 0 ${v('line')}`,
        seg: `0 2px 0 ${v('line')}`,
        phone: '0 0 0 11px #0B0A0F, 0 0 0 12px #2A2833, 0 40px 90px rgba(20,10,40,.28)',
      },
      keyframes: {
        caret: { '50%': { opacity: '0' } },
        pulse: { '0%': { transform: 'scale(1)', opacity: '.9' }, '100%': { transform: 'scale(1.3)', opacity: '0' } },
        float: { '0%,100%': { transform: 'translate(-50%,0)' }, '50%': { transform: 'translate(-50%,-5px)' } },
        fall: { from: { transform: 'translateY(-40px) rotate(0)' }, to: { transform: 'translateY(900px) rotate(560deg)' } },
        blink: { '0%,90%,100%': { transform: 'scaleY(1)' }, '94%': { transform: 'scaleY(.1)' } },
      },
      animation: {
        caret: 'caret 1s steps(1) infinite',
        'node-pulse': 'pulse 1.6s ease-out infinite',
        float: 'float 2s ease-in-out infinite',
        blink: 'blink 4s infinite',
      },
    },
  },
  // desk: — стили центральной колонки десктопа (AppShell вешает .desk)
  plugins: [plugin(({ addVariant }) => addVariant('desk', '.desk &'))],
} satisfies Config
