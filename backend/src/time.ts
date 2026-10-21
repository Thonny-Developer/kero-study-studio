// Дни и недели считаются в таймзоне юзера (заголовок X-Timezone), иначе стрик ломается на границе суток

export function safeTz(tz: unknown): string {
  if (typeof tz !== 'string' || !tz) return 'UTC'
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: tz })
    return tz
  } catch {
    return 'UTC'
  }
}

/** 2026-10-21 в указанной таймзоне */
export function dayKey(tz: string, d = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(d)
}

export function shiftDay(key: string, delta: number) {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d + delta)).toISOString().slice(0, 10)
}

/** 0 = понедельник */
export function weekday(key: string) {
  const [y, m, d] = key.split('-').map(Number)
  return (new Date(Date.UTC(y, m - 1, d)).getUTCDay() + 6) % 7
}

/** Ключ недели — дата её понедельника */
export function weekKey(day: string) {
  return shiftDay(day, -weekday(day))
}
