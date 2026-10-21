import { useEffect, useState } from 'react'
import { Mascot } from '../components/Mascot'
import { Button } from '../components/ui/Button'
import { CodeInput, formatLeft, useResendLeft } from '../components/ui/CodeInput'
import { Field } from '../components/ui/Field'
import { Icon } from '../lib/icons'
import { useGame } from '../store/game'

/** Сброс пароля: почта → код из письма → новый пароль */
export function ForgotScreen() {
  const busy = useGame((s) => s.busy)
  const sentAt = useGame((s) => s.codeSentAt)
  const { forgot, resetPassword, go } = useGame.getState()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [now, setNow] = useState(Date.now())
  const left = useResendLeft(sentAt, now)

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])

  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())
  const send = async () => {
    if (emailOk && !busy && (await forgot(email.trim()))) setSent(true)
  }
  const ready = code.length === 6 && password.length >= 6
  const submit = () => {
    if (ready && !busy) resetPassword(email.trim(), code, password)
  }

  return (
    <div className="absolute inset-0 flex flex-col" style={{ paddingTop: 'var(--top)' }}>
      <div className="px-5 py-2.5">
        <button type="button" onClick={() => (sent ? setSent(false) : go('login'))} className="grid h-10 w-10 place-items-center text-ink-3" aria-label="Назад">
          <Icon name="back" size={22} />
        </button>
      </div>
      <form
        className="no-scrollbar flex flex-1 flex-col gap-6 overflow-y-auto px-5 py-3.5"
        onSubmit={(e) => {
          e.preventDefault()
          if (sent) submit()
          else send()
        }}
      >
        <div className="flex items-end gap-2.5">
          <Mascot size={84} mood={sent ? 'happy' : 'wow'} anim={busy ? 'jump' : 'bob'} />
          <div className="flex flex-1 flex-col gap-1.5 rounded-[22px_22px_22px_6px] border-2 border-line bg-sf px-4 py-3.5">
            <div className="font-display text-[17px] font-bold tracking-[-.02em]">{sent ? 'Код в пути' : 'Забыли пароль?'}</div>
            <div className="text-pretty text-sm leading-[1.45] text-ink-2">
              {sent
                ? 'Если почта привязана к аккаунту, письмо с кодом уже летит. Введи код и новый пароль.'
                : 'Не страшно. Укажи почту, к которой привязан аккаунт, — пришлю код для сброса.'}
            </div>
          </div>
        </div>

        {!sent ? (
          <Field label="ПОЧТА" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@mail.com" autoComplete="email" autoFocus />
        ) : (
          <>
            <CodeInput value={code} onChange={setCode} />
            <Field
              label="НОВЫЙ ПАРОЛЬ"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Минимум 6 символов"
              autoComplete="new-password"
            />
            <button type="button" disabled={left > 0 || busy} onClick={send} className="self-center text-sm font-bold text-acc-ink disabled:text-ink-3">
              {left > 0 ? `Отправить ещё раз через ${formatLeft(left)}` : 'Отправить код ещё раз'}
            </button>
          </>
        )}
        <button type="submit" hidden />
      </form>
      <div className="px-5 pt-3.5" style={{ paddingBottom: 'calc(var(--bottom) + 10px)' }}>
        {sent ? (
          <Button disabled={!ready || busy} onClick={submit}>
            {busy ? 'Сохраняем…' : 'Сменить пароль и войти'}
          </Button>
        ) : (
          <Button disabled={!emailOk || busy} onClick={send}>
            {busy ? 'Отправляем…' : 'Прислать код'}
          </Button>
        )}
      </div>
    </div>
  )
}
