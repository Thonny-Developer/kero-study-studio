import { COURSE, TRACKS } from './content/lessons.js'
import { publicProject } from './game.js'

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)

function unitTitle(unitId: string) {
  for (const t of TRACKS) {
    const u = COURSE[t].find((x) => x.id === unitId)
    if (u) return u.project.folio.title
  }
  return 'Проект'
}

/** HTML для /p/:id: сгенерированная страница как есть, код и текст — в простой обёртке */
export async function projectPage(id: string) {
  const p = await publicProject(id)
  if (!p || !p.output) return null
  if (p.kind === 'html') return p.output

  const title = `${unitTitle(p.unit_id)} · ${p.author}`
  const body =
    p.kind === 'code'
      ? `<pre class="code">${esc(p.output)}</pre>`
      : `<div class="text">${esc(p.output)}</div>`
  return `<!doctype html>
<html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?family=Unbounded:wght@700;800&family=Onest:wght@400;600&family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet">
<style>
:root{color-scheme:light dark;--bg:#F6F5F9;--sf:#fff;--ink:#16141D;--ink2:#5E5A6C;--line:#E3E0EA;--acc:${p.kind === 'code' ? '#7A5CFF' : '#F25A35'}}
@media (prefers-color-scheme:dark){:root{--bg:#0F0E14;--sf:#1A1822;--ink:#F3F1F8;--ink2:#A9A4B8;--line:#2F2B3A}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font-family:Onest,sans-serif;-webkit-font-smoothing:antialiased}
main{max-width:760px;margin:0 auto;padding:32px 16px 48px}
.tag{font-family:'JetBrains Mono',monospace;font-size:12px;font-weight:700;letter-spacing:.08em;color:var(--acc)}
h1{font-family:Unbounded,sans-serif;font-weight:800;font-size:clamp(24px,5vw,34px);letter-spacing:-.03em;margin:8px 0 6px}
.by{color:var(--ink2);font-size:14px;margin-bottom:24px}
.code{margin:0;padding:18px;border-radius:18px;background:#16141D;color:#E9E6F2;font:13px/1.6 'JetBrains Mono',monospace;overflow-x:auto}
.text{white-space:pre-wrap;padding:20px;border-radius:18px;background:var(--sf);border:1.5px solid var(--line);font-size:16px;line-height:1.6}
footer{margin-top:24px;font-size:13px;color:var(--ink2)}
</style></head>
<body><main>
<div class="tag">VIBELY · ${p.kind === 'code' ? 'КОД' : 'ТЕКСТ'}</div>
<h1>${esc(unitTitle(p.unit_id))}</h1>
<div class="by">Автор — ${esc(p.author)}${p.model ? ` · собрано ${esc(p.model)}` : ''}</div>
${body}
<footer>Сделано в Vibely: вайбкодинг и маркетинг по 5 минут в день</footer>
</main></body></html>`
}
