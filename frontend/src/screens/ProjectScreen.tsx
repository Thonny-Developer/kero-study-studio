import { motion } from 'framer-motion'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Mascot } from '../components/Mascot'
import { Button } from '../components/ui/Button'
import { Terminal } from '../components/ui/Terminal'
import { api, ApiError, backendUrl } from '../lib/api'
import { Icon, type IconName } from '../lib/icons'
import type { Project } from '../lib/types'
import { useGame, XP_PROJECT } from '../store/game'
import { toast } from '../store/toast'

function Preview({ p }: { p: Project }) {
  if (!p.output) return null
  if (p.kind === 'html')
    return (
      // Сгенерированная страница без доступа к нашему origin
      <div className="relative h-[420px] overflow-hidden bg-white">
        <iframe
          title="Превью проекта"
          srcDoc={p.output}
          sandbox="allow-scripts"
          className="absolute left-0 top-0 h-[200%] w-[200%] origin-top-left scale-50 border-0"
        />
      </div>
    )
  if (p.kind === 'code')
    return (
      <pre className="no-scrollbar max-h-[420px] overflow-auto bg-term p-3.5 font-mono text-[11.5px] leading-[1.55] text-term-text">{p.output}</pre>
    )
  return <div className="no-scrollbar max-h-[420px] overflow-auto whitespace-pre-wrap p-4 text-[14px] leading-[1.55] text-ink">{p.output}</div>
}

/** Финал юнита: AI выполнил промпт юзера — показываем результат и даём ссылку */
export function ProjectScreen() {
  const unitId = useGame((s) => s.projectUnit)
  const course = useGame((s) => s.course)
  const stats = useGame((s) => (unitId ? s.me?.units[unitId] : undefined))
  const { go, refresh } = useGame.getState()
  const [project, setProject] = useState<Project | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [building, setBuilding] = useState(false)
  const inFlight = useRef(false)

  const found = course && unitId ? (['code', 'mkt'] as const).flatMap((t) => course.tracks[t].map((u, i) => ({ u, i }))).find((x) => x.u.id === unitId) : undefined

  const build = useCallback(
    async (force: boolean) => {
      if (!unitId || inFlight.current) return
      inFlight.current = true
      setBuilding(true)
      setError(null)
      try {
        setProject(await api<Project>(`/api/projects/${unitId}/build`, { body: { force }, timeout: 120_000 }))
        refresh()
      } catch (e) {
        setError(e instanceof ApiError ? e.message : 'Не получилось собрать проект')
      } finally {
        inFlight.current = false
        setBuilding(false)
      }
    },
    [unitId, refresh],
  )

  useEffect(() => {
    if (!unitId) return
    let alive = true
    api<Project>(`/api/projects/${unitId}`)
      .then((p) => {
        if (!alive) return
        setProject(p)
        if (!p.output) build(false)
      })
      .catch((e) => alive && setError(e instanceof ApiError ? e.message : 'Не получилось загрузить проект'))
    return () => {
      alive = false
    }
  }, [unitId, build])

  if (!found) return null
  const { u: unit, i: index } = found
  const info = unit.project
  const url = project?.output ? backendUrl(`/p/${project.id}`) : null

  const share = async () => {
    if (!url) return
    const text = `${info.folio.title} — сделано в Vibely`
    try {
      if (navigator.share) await navigator.share({ title: 'Vibely', text, url })
      else {
        await navigator.clipboard.writeText(url)
        toast('Ссылка скопирована')
      }
    } catch {
      /* юзер закрыл шаринг */
    }
  }

  const statTiles = [
    { v: stats?.lessons ?? 0, l: 'уроков пройдено' },
    { v: stats?.tasks ?? 0, l: 'заданий решено' },
    { v: stats?.xp ?? 0, l: 'XP за юнит' },
  ]

  return (
    <div className="absolute inset-0 flex flex-col" style={{ paddingTop: 'var(--top)' }}>
      <div className="flex items-center justify-between px-5 pt-2.5">
        <button type="button" onClick={() => go('map')} aria-label="Закрыть" className="grid h-9 w-9 place-items-center text-ink-3">
          <Icon name="x" size={22} />
        </button>
        <div className="font-mono text-xs font-bold tracking-[.08em] text-acc-ink">ЮНИТ {index + 1} · ПРОЕКТ</div>
        <div className="w-9" />
      </div>

      <div className="no-scrollbar flex flex-1 flex-col gap-[18px] overflow-y-auto px-5 pb-5 pt-4 [&>*]:shrink-0">
        <div className="flex items-center gap-3">
          <div className="text-balance flex-1 font-display text-[26px] font-extrabold leading-[1.12] tracking-[-.035em]">{info.title}</div>
          <Mascot size={76} mood={building ? 'wow' : error ? 'sad' : 'happy'} anim={building ? 'jump' : 'bob'} />
        </div>

        <motion.div
          className="overflow-hidden rounded-unit border-2 border-line bg-sf shadow-[0_6px_0_var(--line)]"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 22 }}
        >
          <div className="flex items-center gap-2 border-b border-line px-3 py-2.5">
            <div className="flex gap-[5px]">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-[9px] w-[9px] rounded-full bg-line" />
              ))}
            </div>
            <div className="flex h-6 min-w-0 flex-1 items-center gap-1.5 rounded-lg bg-sf2 px-2.5 font-mono text-[11.5px] text-ink-2">
              <span className={`h-[7px] w-[7px] shrink-0 rounded-full ${url ? 'bg-ok' : 'bg-gold'}`} />
              <span className="truncate">{url ? url.replace(/^https?:\/\//, '') : building ? 'собираем…' : 'ещё не собран'}</span>
            </div>
          </div>
          {project?.output ? (
            <Preview p={project} />
          ) : (
            <div className="flex min-h-[220px] flex-col items-center justify-center gap-3 p-6 text-center">
              {error ? (
                <>
                  <div className="text-sm font-semibold text-err-ink">{error}</div>
                  <Button size="md" variant="secondary" className="w-auto px-5" onClick={() => build(false)}>
                    Попробовать ещё раз
                  </Button>
                </>
              ) : (
                <>
                  <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }} className="text-acc">
                    <Icon name="spark" size={28} />
                  </motion.div>
                  <div className="text-sm font-semibold text-ink-2">AI выполняет твой промпт. Обычно это 10–30 секунд.</div>
                </>
              )}
            </div>
          )}
        </motion.div>

        {project && (
          <Terminal title="твой промпт">
            <div className="p-3.5 font-mono text-[12px] leading-[1.55] text-term-text">{project.prompt}</div>
          </Terminal>
        )}

        <div className="grid grid-cols-3 gap-2">
          {statTiles.map((s) => (
            <div key={s.l} className="flex flex-col gap-0.5 rounded-2xl border-[1.5px] border-line bg-sf p-3">
              <span className="font-display text-lg font-bold">{s.v}</span>
              <span className="text-xs font-semibold leading-tight text-ink-2">{s.l}</span>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3 rounded-btn bg-gold-soft px-3.5 py-3">
          <div className="grid h-11 w-11 place-items-center rounded-tile bg-gold text-white shadow-[0_3px_0_var(--goldSh)]">
            <Icon name={info.achievementIcon as IconName} size={22} />
          </div>
          <div className="flex flex-1 flex-col gap-0.5">
            <span className="text-xs font-bold tracking-[.04em] text-gold-ink">АЧИВКА</span>
            <span className="text-[15px] font-extrabold">{info.achievement}</span>
          </div>
          <span className="font-mono text-[13px] font-bold text-gold-ink">+{XP_PROJECT} XP</span>
        </div>

        {project?.output && (
          <button type="button" onClick={() => build(true)} disabled={building} className="flex items-center justify-center gap-2 text-sm font-bold text-acc-ink">
            <Icon name="refresh" size={16} />
            {building ? 'Пересобираем…' : 'Пересобрать заново'}
          </button>
        )}
      </div>

      <div className="flex flex-col gap-3 px-5 pt-3" style={{ paddingBottom: 'calc(var(--bottom) + 10px)' }}>
        <Button onClick={share} disabled={!url}>
          <Icon name="share" size={22} />
          Поделиться
        </Button>
        <Button variant="secondary" size="md" disabled={!url} onClick={() => url && window.open(url, '_blank', 'noopener')}>
          <Icon name="ext" size={18} />
          Открыть по ссылке
        </Button>
      </div>
    </div>
  )
}
