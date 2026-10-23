import { useGame } from '../store/game'

/** Как выглядит спутник игрока: цвет робота (Золотой Блинк) или скин Verity */
export function useBlinkLook(fallback = 'var(--acc)') {
  const skin = useGame((s) => s.me?.blinkSkin ?? null)
  return { color: skin === 'blink' ? 'var(--gold)' : fallback, skin: skin === 'verity' ? ('verity' as const) : null }
}
