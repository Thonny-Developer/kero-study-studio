import { motion } from 'framer-motion'
import { Mascot } from '../components/Mascot'
import { Button } from '../components/ui/Button'
import { Logo } from '../components/ui/Logo'
import { Icon } from '../lib/icons'
import { useGame } from '../store/game'

export function Welcome() {
  const go = useGame((s) => s.go)
  const setObStep = useGame((s) => s.setObStep)

  return (
    <div className="absolute inset-0 flex flex-col px-6" style={{ paddingTop: 'calc(var(--top) + 10px)', paddingBottom: 'calc(var(--bottom) + 10px)' }}>
      <div className="flex flex-1 flex-col items-center justify-center gap-[30px]">
        <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: [0.6, 1.06, 1], opacity: 1 }} transition={{ duration: 0.5 }}>
          <Mascot size={150} mood="happy" anim="jump" />
        </motion.div>
        <div className="flex flex-col items-center gap-3 text-center">
          <Logo size={42} />
          <div className="max-w-[290px] text-pretty text-[17px] leading-[1.45] text-ink-2">
            Собирай продукты с AI и продвигай их. По 5 минут в день, без занудства.
          </div>
        </div>
        <div className="flex gap-2">
          <div className="flex items-center gap-1.5 rounded-xl bg-code-soft px-3 py-[7px] text-[13px] font-bold text-code-ink">
            <Icon name="code" size={16} />
            Вайбкодинг
          </div>
          <div className="flex items-center gap-1.5 rounded-xl bg-mkt-soft px-3 py-[7px] text-[13px] font-bold text-mkt-ink">
            <Icon name="mega" size={16} />
            Маркетинг
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-3.5">
        <Button
          onClick={() => {
            setObStep(0)
            go('onboarding')
          }}
        >
          Погнали
        </Button>
        <Button variant="secondary" onClick={() => go('login')}>
          У меня уже есть аккаунт
        </Button>
      </div>
    </div>
  )
}
