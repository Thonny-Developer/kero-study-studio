import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, type ReactNode } from 'react'
import { Mascot } from './components/Mascot'
import { Button } from './components/ui/Button'
import { Logo } from './components/ui/Logo'
import { AppShell } from './components/ui/AppShell'
import { RightRail } from './components/ui/RightRail'
import { SidePanel } from './components/ui/SidePanel'
import { TabBar, TAB_SCREENS } from './components/ui/TabBar'
import { Toast } from './components/ui/Toast'
import { EndScreen } from './screens/EndScreen'
import { ForgotScreen } from './screens/ForgotScreen'
import { LeagueScreen } from './screens/LeagueScreen'
import { LessonScreen } from './screens/LessonScreen'
import { LoginScreen } from './screens/LoginScreen'
import { MapScreen } from './screens/MapScreen'
import { NoHeartsScreen } from './screens/NoHeartsScreen'
import { Onboarding } from './screens/Onboarding'
import { PetScreen } from './screens/PetScreen'
import { ProfileScreen } from './screens/ProfileScreen'
import { ProjectScreen } from './screens/ProjectScreen'
import { ShopScreen } from './screens/ShopScreen'
import { VerifyScreen } from './screens/VerifyScreen'
import { Welcome } from './screens/Welcome'
import { useGame, type GameState, type Screen } from './store/game'
import { toast } from './store/toast'

const SCREENS: Record<Screen, () => ReactNode> = {
  welcome: Welcome,
  onboarding: Onboarding,
  login: LoginScreen,
  forgot: ForgotScreen,
  verify: VerifyScreen,
  map: MapScreen,
  lesson: LessonScreen,
  end: EndScreen,
  noHearts: NoHeartsScreen,
  project: ProjectScreen,
  league: LeagueScreen,
  pet: PetScreen,
  shop: ShopScreen,
  profile: ProfileScreen,
}

const GUEST: Screen[] = ['welcome', 'onboarding', 'login', 'forgot']

/** Экран, который реально можно показать: защита от рассинхрона после перезагрузки */
function safeScreen(s: GameState): Screen | 'splash' {
  if (!s.token) return GUEST.includes(s.screen) ? s.screen : 'welcome'
  if (!s.me || !s.course) return 'splash'
  if (GUEST.includes(s.screen)) return 'map'
  if ((s.screen === 'lesson' || s.screen === 'noHearts') && !s.me.lesson) return 'map'
  if (s.screen === 'end' && !s.result) return 'map'
  if (s.screen === 'project' && !s.projectUnit) return 'map'
  return s.screen
}

function Splash() {
  const booted = useGame((s) => s.booted)
  const boot = useGame((s) => s.boot)
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 px-8 text-center">
      <Mascot size={110} mood={booted ? 'sad' : 'idle'} anim={booted ? 'tilt' : 'bob'} />
      <Logo size={32} />
      {booted ? (
        <>
          <div className="text-sm text-ink-2">Не получилось связаться с сервером.</div>
          <Button size="md" variant="secondary" className="w-auto px-6" onClick={boot}>
            Повторить
          </Button>
        </>
      ) : (
        <div className="text-sm text-ink-2">Загружаем твой прогресс…</div>
      )}
    </div>
  )
}

export function App() {
  const theme = useGame((s) => s.theme)
  const track = useGame((s) => s.me?.lesson?.track ?? s.track)
  const { boot, refresh } = useGame.getState()
  const screen = useGame(safeScreen)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    document.documentElement.dataset.track = track
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#0F0E14' : '#F6F5F9')
  }, [theme, track])

  // Состояние живёт на сервере: тянем при старте и при возврате во вкладку
  useEffect(() => {
    // Вернулись по кнопке из письма: /?verified=1
    const params = new URLSearchParams(window.location.search)
    const verified = params.get('verified')
    if (verified !== null) {
      toast(verified === '1' ? 'Почта подтверждена' : 'Ссылка устарела — запроси новый код')
      window.history.replaceState(null, '', window.location.pathname)
      if (verified === '1' && useGame.getState().screen === 'verify') useGame.setState({ screen: 'map' })
    }
    boot()
    const onVis = () => document.visibilityState === 'visible' && refresh()
    document.addEventListener('visibilitychange', onVis)
    const t = setInterval(refresh, 60_000)
    return () => {
      document.removeEventListener('visibilitychange', onVis)
      clearInterval(t)
    }
  }, [boot, refresh])

  const View = screen === 'splash' ? Splash : SCREENS[screen]
  const tabbed = screen !== 'splash' && TAB_SCREENS.includes(screen)

  return (
    <AppShell tabbed={tabbed} wide={screen === 'map' || screen === 'shop' || screen === 'profile' || screen === 'pet'} nav={<SidePanel />} rail={<RightRail />} tabBar={<TabBar />}>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.div
          key={tabbed ? `tab-${screen}` : screen}
          className="absolute inset-0"
          initial={{ opacity: 0, y: tabbed ? 0 : 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
        >
          <View />
        </motion.div>
      </AnimatePresence>
      <Toast />
    </AppShell>
  )
}
