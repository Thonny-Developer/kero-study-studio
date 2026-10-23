import plugin from 'tailwindcss/plugin'
import type { Config } from 'tailwindcss'

// Токены из макета Vibely. Значения живут в CSS-переменных (src/index.css),
// чтобы светлая/тёмная тема и цвет трека переключались без перерендера классов.
const v = (name: string) => `var(--${name})`
// цвет с поддержкой прозрачности: border-acc/25, bg-acc-soft/60 и т.п.
const c = (name: string) => `color-mix(in srgb, var(--${name}) calc(<alpha-value> * 100%), transparent)`

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // треки
        code: { DEFAULT: c('code'), sh: c('codeSh'), soft: c('codeSoft'), ink: c('codeInk') },
        mkt: { DEFAULT: c('mkt'), sh: c('mktSh'), soft: c('mktSoft'), ink: c('mktInk') },
        // активный трек
        acc: { DEFAULT: c('acc'), sh: c('accSh'), soft: c('accSoft'), ink: c('accInk') },
        // статусы
        ok: { DEFAULT: c('ok'), sh: c('okSh'), soft: c('okSoft'), ink: c('okInk') },
        err: { DEFAULT: c('err'), sh: c('errSh'), soft: c('errSoft'), ink: c('errInk') },
        gold: { DEFAULT: c('gold'), sh: c('goldSh'), soft: c('goldSoft'), ink: c('goldInk') },
        // нейтрали
        page: c('page'),
        bg: c('bg'),
        sf: c('sf'),
        sf2: c('sf2'),
        ink: { DEFAULT: c('ink'), 2: c('ink2'), 3: c('ink3') },
        line: c('line'),
        lock: c('lockSh'),
        term: { DEFAULT: c('term'), line: c('termLine'), text: '#E9E6F2', mute: '#8E89A0', green: '#8CFFC1' },
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
