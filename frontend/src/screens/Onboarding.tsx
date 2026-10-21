import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'
import { Mascot } from '../components/Mascot'
import { Button } from '../components/ui/Button'
import { Field } from '../components/ui/Field'
import { ONBOARDING, type ObOption } from '../data/onboarding'
import { Icon } from '../lib/icons'
import { useGame } from '../store/game'

const STEPS = ONBOARDING.length + 1

function Bubble({ title, sub, mood, jump }: { title: string; sub: string; mood: 'idle' | 'happy' | 'wow'; jump: boolean }) {
  return (
    <div className="flex items-end gap-2.5">
      <Mascot size={84} mood={mood} anim={jump ? 'jump' : 'bob'} />
      <div className="flex flex-1 flex-col gap-1.5 rounded-[22px_22px_22px_6px] border-2 border-line bg-sf px-4 py-3.5">
        <div className="font-display text-[17px] font-bold tracking-[-.02em]">{title}</div>
        <div className="text-pretty text-sm leading-[1.45] text-ink-2">{sub}</div>
      </div>
    </div>
  )
}

export function Onboarding() {
  const step = useGame((s) => s.obStep)
  const draft = useGame((s) => s.draft)
  const busy = useGame((s) => s.busy)
  const { setObStep, setDraft, go, register } = useGame.getState()
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')

  const account = step >= ONBOARDING.length
  const st = ONBOARDING[Math.min(step, ONBOARDING.length - 1)]
  const value = draft[st.key]
  const nameOk = name.trim().length >= 2
  const passOk = password.length >= 6
  const has = account ? nameOk && passOk : value != null

  const choose = (o: ObOption) => setDraft({ [st.key]: o.id })
  const next = async () => {
    if (!has || busy) return
    if (!account) return setObStep(step + 1)
    await register(name.trim(), password)
  }
  const back = () => (step > 0 ? setObStep(step - 1) : go('welcome'))

  return (
    <div className="absolute inset-0 flex flex-col" style={{ paddingTop: 'var(--top)' }}>
      <div className="flex items-center gap-3.5 px-5 py-2.5">
        <button type="button" onClick={back} className="grid h-10 w-10 place-items-center text-ink-3" aria-label="Назад">
          <Icon name="back" size={22} />
        </button>
        <div className="grid flex-1 gap-1.5" style={{ gridTemplateColumns: `repeat(${STEPS}, 1fr)` }}>
          {Array.from({ length: STEPS }, (_, i) => (
            <div key={i} className={`h-2.5 rounded-md transition-colors duration-300 ${i < step || (i === step && has) ? 'bg-acc' : 'bg-sf2'}`} />
          ))}
        </div>
        <div className="w-10 text-right font-mono text-[13px] text-ink-3">
          {step + 1}/{STEPS}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.form
          key={step}
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -24 }}
          transition={{ duration: 0.2 }}
          className="no-scrollbar flex flex-1 flex-col gap-[26px] overflow-y-auto px-5 py-3.5"
          onSubmit={(e) => {
            e.preventDefault()
            next()
          }}
        >
          {account ? (
            <>
              <Bubble
                title="Как тебя зовут?"
                sub="Имя увидят соперники в лиге. Пароль нужен, чтобы зайти с другого устройства."
                mood={has ? 'happy' : 'idle'}
                jump={has}
              />
              <div className="flex flex-col gap-4">
                <Field label="ИМЯ" value={name} onChange={(e) => setName(e.target.value)} placeholder="Например, Алекс" maxLength={24} autoComplete="username" autoFocus />
                <Field
                  label="ПАРОЛЬ"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Минимум 6 символов"
                  autoComplete="new-password"
                />
              </div>
              <button type="submit" hidden />
            </>
          ) : (
            <>
              <Bubble title={st.title} sub={st.sub} mood={has ? 'happy' : step === 1 ? 'wow' : 'idle'} jump={has} />
              {st.key !== 'mins' ? (
                <div className="flex flex-col gap-3">
                  {st.opts.map((o) => {
                    const a = value === o.id
                    return (
                      <motion.button
                        key={o.id}
                        type="button"
                        onClick={() => choose(o)}
                        whileTap={{ y: 4, boxShadow: '0 0 0 transparent' }}
                        transition={{ duration: 0.08 }}
                        style={{ boxShadow: `0 4px 0 ${a ? 'var(--acc)' : 'var(--line)'}` }}
                        className={`flex items-center gap-3.5 rounded-card border-2 px-4 py-3.5 text-left text-ink transition-colors ${a ? 'border-acc bg-acc-soft' : 'border-line bg-sf'}`}
                      >
                        <div className={`grid h-[46px] w-[46px] shrink-0 place-items-center rounded-tile ${a ? 'bg-acc text-white' : 'bg-sf2 text-ink-2'}`}>
                          {o.icon && <Icon name={o.icon} size={24} />}
                        </div>
                        <div className="flex flex-1 flex-col gap-[3px]">
                          <div className="text-base font-bold">{o.label}</div>
                          <div className="text-[13.5px] leading-[1.35] text-ink-2">{o.sub}</div>
                        </div>
                        <div className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 text-white ${a ? 'border-acc bg-acc' : 'border-line'}`}>
                          {a && <Icon name="check" size={14} />}
                        </div>
                      </motion.button>
                    )
                  })}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {st.opts.map((o) => {
                    const a = value === o.id
                    return (
                      <motion.button
                        key={o.id}
                        type="button"
                        onClick={() => choose(o)}
                        whileTap={{ y: 4, boxShadow: '0 0 0 transparent' }}
                        transition={{ duration: 0.08 }}
                        style={{ boxShadow: `0 4px 0 ${a ? 'var(--acc)' : 'var(--line)'}` }}
                        className={`relative flex flex-col items-start gap-0.5 rounded-card border-2 px-4 py-[18px] text-left text-ink ${a ? 'border-acc bg-acc-soft' : 'border-line bg-sf'}`}
                      >
                        <div className="flex items-baseline gap-1">
                          <span className={`font-display text-[34px] font-extrabold tracking-[-.04em] ${a ? 'text-acc-ink' : 'text-ink'}`}>{o.id}</span>
                          <span className="text-sm font-bold text-ink-2">мин</span>
                        </div>
                        <div className="text-[15px] font-semibold">{o.label}</div>
                        {o.tag && (
                          <div className="absolute right-2.5 top-2.5 rounded-[7px] bg-gold-soft px-[7px] py-[3px] text-[10.5px] font-extrabold tracking-[.04em] text-gold-ink">
                            {o.tag}
                          </div>
                        )}
                      </motion.button>
                    )
                  })}
                </div>
              )}
            </>
          )}
        </motion.form>
      </AnimatePresence>

      <div className="px-5 pt-3.5" style={{ paddingBottom: 'calc(var(--bottom) + 10px)' }}>
        <Button disabled={!has || busy} onClick={next}>
          {account ? (busy ? 'Создаём аккаунт…' : 'Построить мой путь') : 'Дальше'}
        </Button>
      </div>
    </div>
  )
}
