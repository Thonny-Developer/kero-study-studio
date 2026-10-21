import { useEffect, useState } from 'react'
import { Mascot } from '../components/Mascot'
import { Button } from '../components/ui/Button'
import { CodeInput, formatLeft, useResendLeft } from '../components/ui/CodeInput'
import { Icon } from '../lib/icons'
import { useGame } from '../store/game'
import { toast } from '../store/toast'

/** Подтверждение почты кодом из письма */
export function VerifyScreen() {
  const email = useGame((s) => s.me?.user.email ?? '')
  const verified = useGame((s) => !!s.me?.user.emailVerified)
  const busy = useGame((s) => s.busy)
  const sentAt = useGame((s) => s.codeSentAt)
  const { verifyEmail, sendEmailCode, go } = useGame.getState()
  const [code, setCode] = useState('')
  const [now, setNow] = useState(Date.now())
  const left = useResendLeft(sentAt, now)

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])

  // подтвердили по кнопке из письма в другой вкладке — подхватываем при возврате
  useEffect(() => {
    if (verified) {
      toast('Почта подтверждена')
      go('map')
    }
  }, [verified, go])

  const submit = async (v = code) => {
    if (v.length !== 6 || busy) return
    if (!(await verifyEmail(v))) setCode('')
  }

  return (
    <div className="absolute inset-0 flex flex-col" style={{ paddingTop: 'var(--top)' }}>
      <div className="px-5 py-2.5">
        <button type="button" onClick={() => go('map')} className="grid h-10 w-10 place-items-center text-ink-3" aria-label="Закрыть">
          <Icon name="x" size={22} />
        </button>
      </div>
      <div className="no-scrollbar flex flex-1 flex-col gap-7 overflow-y-auto px-5 py-3.5">
        <div className="flex items-end gap-2.5">
          <Mascot size={84} mood={code.length === 6 ? 'happy' : 'wow'} anim={busy ? 'jump' : 'bob'} />
          <div className="flex flex-1 flex-col gap-1.5 rounded-[22px_22px_22px_6px] border-2 border-line bg-sf px-4 py-3.5">
            <div className="font-display text-[17px] font-bold tracking-[-.02em]">Проверь почту</div>
            <div className="text-pretty text-sm leading-[1.45] text-ink-2">
              Отправил 6-значный код на <b className="break-all text-ink">{email}</b>. Письмо может идти до минуты — загляни и в «Спам».
            </div>
          </div>
        </div>

        <CodeInput value={code} onChange={setCode} onComplete={submit} />

        <div className="flex flex-col items-center gap-3 text-center">
          <button
            type="button"
            disabled={left > 0 || busy}
            onClick={() => sendEmailCode()}
            className="flex items-center gap-1.5 text-sm font-bold text-acc-ink disabled:text-ink-3"
          >
            <Icon name="mail" size={16} />
            {left > 0 ? `Отправить ещё раз через ${formatLeft(left)}` : 'Отправить код ещё раз'}
          </button>
          <div className="text-[13px] leading-snug text-ink-3">В письме есть кнопка — можно подтвердить и по ней.</div>
        </div>
      </div>
      <div className="flex flex-col gap-3 px-5 pt-3.5" style={{ paddingBottom: 'calc(var(--bottom) + 10px)' }}>
        <Button disabled={code.length !== 6 || busy} onClick={() => submit()}>
          {busy ? 'Проверяем…' : 'Подтвердить'}
        </Button>
        <Button variant="secondary" size="md" onClick={() => go('map')}>
          Подтвержу позже
        </Button>
      </div>
    </div>
  )
}
