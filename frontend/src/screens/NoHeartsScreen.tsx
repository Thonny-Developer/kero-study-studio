import { useEffect, useState } from 'react'
import { Mascot } from '../components/Mascot'
import { Button } from '../components/ui/Button'
import { formatDuration } from '../lib/date'
import { Icon } from '../lib/icons'
import { useGame } from '../store/game'

/** 0 сердечек: подождать восстановления (таймер с сервера) или начать урок заново */
export function NoHeartsScreen() {
  const me = useGame((s) => s.me)
  const { refresh, retryLesson, quitLesson, go } = useGame.getState()
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    const r = setInterval(refresh, 15_000)
    return () => {
      clearInterval(t)
      clearInterval(r)
    }
  }, [refresh])

  const hearts = me?.hearts ?? 0
  const left = me?.heartsAt ? Math.max(0, me.heartsAt + me.heartMs - now) : 0
  // как только таймер дошёл до нуля — забираем новое сердечко с сервера
  useEffect(() => {
    if (hearts <= 0 && me?.heartsAt && left === 0) refresh()
  }, [hearts, left, me?.heartsAt, refresh])

  const back = hearts > 0

  return (
    <div className="absolute inset-0 flex flex-col px-6" style={{ paddingTop: 'calc(var(--top) + 10px)', paddingBottom: 'calc(var(--bottom) + 10px)' }}>
      <div className="flex flex-1 flex-col items-center justify-center gap-5 text-center">
        <Mascot size={130} mood={back ? 'happy' : 'sad'} anim={back ? 'jump' : 'tilt'} color="var(--err)" />
        <div className="font-display text-[26px] font-extrabold tracking-[-.03em]">{back ? 'Сердечко вернулось!' : 'Сердечки закончились'}</div>
        <div className="max-w-[290px] text-pretty text-[15.5px] leading-[1.45] text-ink-2">
          {back
            ? 'Можно продолжать. Не торопись с ответом — читай задание до конца.'
            : 'Ошибаться нормально — так и учатся. Подожди, пока сердечко восстановится по таймеру.'}
        </div>
        <div className="flex gap-1.5">
          {Array.from({ length: me?.maxHearts ?? 5 }, (_, i) => (
            <span key={i} className={i < hearts ? 'text-err' : 'text-sf2'}>
              <Icon name="heart" size={30} />
            </span>
          ))}
        </div>
        {!back && me?.heartsAt && (
          <div className="flex items-center gap-2 rounded-tile bg-err-soft px-3.5 py-2 font-mono text-[13px] font-bold text-err-ink">
            <Icon name="clock" size={16} />
            +1 сердечко через {formatDuration(left)}
          </div>
        )}
      </div>
      <div className="flex flex-col gap-3.5">
        {back ? (
          <>
            <Button onClick={() => go('lesson')}>Продолжить урок</Button>
            <Button variant="secondary" onClick={retryLesson}>
              <Icon name="refresh" size={20} />
              Повторить урок
            </Button>
          </>
        ) : (
          <Button variant="err" disabled>
            <Icon name="refresh" size={20} />
            Повторить урок
          </Button>
        )}
        <Button variant="secondary" onClick={quitLesson}>
          {back ? 'На карту' : 'Подождать'}
        </Button>
      </div>
    </div>
  )
}
