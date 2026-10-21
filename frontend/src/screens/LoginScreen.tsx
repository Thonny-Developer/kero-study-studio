import { useState } from 'react'
import { Mascot } from '../components/Mascot'
import { Button } from '../components/ui/Button'
import { Field } from '../components/ui/Field'
import { Icon } from '../lib/icons'
import { useGame } from '../store/game'

export function LoginScreen() {
  const busy = useGame((s) => s.busy)
  const { login, go, setObStep } = useGame.getState()
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const ready = name.trim().length > 0 && password.length > 0

  const submit = () => {
    if (ready && !busy) login(name.trim(), password)
  }

  return (
    <div className="absolute inset-0 flex flex-col" style={{ paddingTop: 'var(--top)' }}>
      <div className="px-5 py-2.5">
        <button type="button" onClick={() => go('welcome')} className="grid h-10 w-10 place-items-center text-ink-3" aria-label="Назад">
          <Icon name="back" size={22} />
        </button>
      </div>
      <form
        className="no-scrollbar flex flex-1 flex-col gap-[26px] overflow-y-auto px-5 py-3.5"
        onSubmit={(e) => {
          e.preventDefault()
          submit()
        }}
      >
        <div className="flex items-end gap-2.5">
          <Mascot size={84} mood={ready ? 'happy' : 'idle'} anim={ready ? 'jump' : 'bob'} />
          <div className="flex flex-1 flex-col gap-1.5 rounded-[22px_22px_22px_6px] border-2 border-line bg-sf px-4 py-3.5">
            <div className="font-display text-[17px] font-bold tracking-[-.02em]">С возвращением!</div>
            <div className="text-pretty text-sm leading-[1.45] text-ink-2">Войди — и продолжим с того же места: XP, стрик и уроки на месте.</div>
          </div>
        </div>
        <div className="flex flex-col gap-4">
          <Field label="ИМЯ" value={name} onChange={(e) => setName(e.target.value)} autoComplete="username" autoFocus />
          <Field label="ПАРОЛЬ" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
        </div>
        <button type="submit" hidden />
        <button
          type="button"
          onClick={() => {
            setObStep(0)
            go('onboarding')
          }}
          className="self-center text-sm font-bold text-acc-ink"
        >
          Нет аккаунта? Создать
        </button>
      </form>
      <div className="px-5 pt-3.5" style={{ paddingBottom: 'calc(var(--bottom) + 10px)' }}>
        <Button disabled={!ready || busy} onClick={submit}>
          {busy ? 'Входим…' : 'Войти'}
        </Button>
      </div>
    </div>
  )
}
