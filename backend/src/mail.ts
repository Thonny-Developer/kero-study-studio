import dns from 'node:dns/promises'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import nodemailer, { type Transporter } from 'nodemailer'
import { env } from './env.js'
import { HttpError } from './http.js'

const here = path.dirname(fileURLToPath(import.meta.url))
const MASCOT = fs.readFileSync(path.join(here, '../assets/blink.png'))

let transport: Transporter | null = null

/**
 * Подключаемся по IPv4: на сетях без IPv6 nodemailer иначе может выбрать AAAA-адрес и висеть до таймаута.
 * Сертификат при этом проверяется по настоящему имени хоста (servername).
 */
async function mailer() {
  if (!env.smtp.host || !env.smtp.user) throw new HttpError(503, 'Почта не настроена на сервере', 'mail')
  if (transport) return transport
  // Не переключаемся обратно на hostname при ошибке DNS: Nodemailer выполнит
  // тот же неудачный lookup ещё раз. Повторяем разрешение до создания транспорта.
  let ip: string | undefined
  for (let attempt = 0; attempt < 3 && !ip; attempt++) {
    try {
      ip = (await dns.lookup(env.smtp.host, { family: 4 })).address
    } catch (err) {
      if (attempt === 2) throw err
      await new Promise((resolve) => setTimeout(resolve, 300 * 2 ** attempt))
    }
  }
  transport = nodemailer.createTransport({
    host: ip!,
    port: env.smtp.port,
    secure: env.smtp.port === 465,
    requireTLS: env.smtp.tls && env.smtp.port !== 465,
    tls: { servername: env.smtp.host },
    auth: { user: env.smtp.user, pass: env.smtp.pass },
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
  })
  return transport
}

const NETWORK_ERRORS = new Set(['ETIMEDOUT', 'ECONNECTION', 'ESOCKET', 'ECONNRESET', 'EDNS', 'EAI_AGAIN'])

/** MAIL_FROM может быть просто именем — тогда адрес берём из SMTP_USER */
function fromHeader() {
  const f = env.smtp.from.trim()
  return f.includes('@') ? f : { name: f || 'Vibely', address: env.smtp.user }
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)

export type MailKind = 'verify' | 'reset'

const COPY: Record<MailKind, { subject: string; title: (n: string) => string; lead: string; button: string; foot: string }> = {
  verify: {
    subject: 'Подтверди почту в Vibely',
    title: (n) => `Привет, ${n}! Подтверди почту`,
    lead: 'Остался один шаг: введи код в приложении или нажми кнопку. Почта привяжется к аккаунту — сможешь войти с любого устройства и восстановить пароль.',
    button: 'Подтвердить почту',
    foot: 'Если ты не регистрировался в Vibely — просто проигнорируй письмо, аккаунт без подтверждения к почте не привяжется.',
  },
  reset: {
    subject: 'Сброс пароля в Vibely',
    title: (n) => `${n}, держи код для сброса пароля`,
    lead: 'Введи код в приложении на экране «Забыли пароль?» и придумай новый пароль. Прогресс, XP и стрик останутся на месте.',
    button: '',
    foot: 'Если ты не запрашивал сброс — ничего не делай. Пароль останется прежним.',
  },
}

const FONT = "'Onest','Segoe UI',Roboto,Helvetica,Arial,sans-serif"
const DISPLAY = "'Unbounded','Arial Black','Segoe UI',Helvetica,Arial,sans-serif"
const MONO = "'JetBrains Mono',ui-monospace,Menlo,Consolas,monospace"

/** HTML письма: таблицы и инлайн-стили — так оно одинаково выглядит в Gmail, Почте и Outlook */
export function renderMail(kind: MailKind, p: { name: string; code: string; link?: string; minutes: number }) {
  const c = COPY[kind]
  const digits = p.code
    .split('')
    .map(
      (d) =>
        `<td style="padding:0 4px"><div style="width:44px;height:56px;line-height:56px;border-radius:14px;background:#EEEAFF;border:2px solid #7A5CFF;border-bottom-width:5px;border-bottom-color:#5B3FE0;font-family:${MONO};font-size:28px;font-weight:700;color:#5B3FE0;text-align:center">${d}</div></td>`,
    )
    .join('')

  const button = p.link && c.button
    ? `<tr><td align="center" style="padding:28px 32px 0">
        <table role="presentation" cellpadding="0" cellspacing="0"><tr><td style="border-radius:18px;background:#7A5CFF;border-bottom:5px solid #5B3FE0">
          <a href="${esc(p.link)}" target="_blank" style="display:inline-block;padding:17px 34px;font-family:${FONT};font-size:17px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:18px">${c.button}</a>
        </td></tr></table>
      </td></tr>
      <tr><td align="center" style="padding:14px 32px 0;font-family:${FONT};font-size:12px;line-height:18px;color:#9A96A8">Кнопка не работает? Скопируй ссылку:<br><a href="${esc(p.link)}" style="color:#5B3FE0;word-break:break-all">${esc(p.link)}</a></td></tr>`
    : ''

  const html = `<!doctype html>
<html lang="ru"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light"><meta name="supported-color-schemes" content="light">
<title>${c.subject}</title>
<link href="https://fonts.googleapis.com/css2?family=Unbounded:wght@800&family=Onest:wght@400;600;700&family=JetBrains+Mono:wght@700&display=swap" rel="stylesheet">
</head>
<body style="margin:0;padding:0;background:#F6F5F9;-webkit-font-smoothing:antialiased">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent">Код: ${p.code.slice(0, 3)} ${p.code.slice(3)} · действует ${p.minutes} минут&#8199;&#65279;&#847;&#8199;&#65279;&#847;&#8199;&#65279;&#847;</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F6F5F9"><tr><td align="center" style="padding:32px 12px">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px">
    <tr><td style="padding:0 8px 18px;font-family:${DISPLAY};font-size:26px;font-weight:800;letter-spacing:-1px;color:#16141D">vibely<span style="color:#7A5CFF">_</span></td></tr>
    <tr><td style="background:#ffffff;border:1.5px solid #E3E0EA;border-radius:28px;box-shadow:0 6px 0 #E3E0EA">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr><td align="center" style="padding:36px 32px 0">
          <img src="cid:blink" width="112" height="112" alt="Блинк" style="display:block;border:0;width:112px;height:112px">
        </td></tr>
        <tr><td align="center" style="padding:18px 32px 0;font-family:${DISPLAY};font-size:24px;line-height:30px;font-weight:800;letter-spacing:-.5px;color:#16141D">${esc(c.title(p.name))}</td></tr>
        <tr><td align="center" style="padding:12px 36px 0;font-family:${FONT};font-size:15px;line-height:23px;color:#5E5A6C">${c.lead}</td></tr>
        <tr><td align="center" style="padding:28px 24px 0">
          <div style="font-family:${MONO};font-size:11px;font-weight:700;letter-spacing:2px;color:#9A96A8;padding-bottom:10px">ТВОЙ КОД</div>
          <table role="presentation" cellpadding="0" cellspacing="0"><tr>${digits}</tr></table>
        </td></tr>
        <tr><td align="center" style="padding:14px 32px 0">
          <span style="display:inline-block;padding:6px 12px;border-radius:10px;background:#FFF3D6;font-family:${MONO};font-size:12px;font-weight:700;color:#8A5A00">⏱ действует ${p.minutes} минут</span>
        </td></tr>
        ${button}
        <tr><td style="padding:32px 32px 0"><div style="height:1px;background:#E3E0EA;line-height:1px;font-size:0">&nbsp;</div></td></tr>
        <tr><td style="padding:18px 32px 32px;font-family:${FONT};font-size:13px;line-height:20px;color:#9A96A8">${c.foot}</td></tr>
      </table>
    </td></tr>
    <tr><td align="center" style="padding:22px 16px 0;font-family:${FONT};font-size:12px;line-height:18px;color:#9A96A8">
      Vibely · вайбкодинг и маркетинг по 5 минут в день<br>Письмо отправлено автоматически, отвечать на него не нужно.
    </td></tr>
  </table>
</td></tr></table>
</body></html>`

  const text = [
    c.title(p.name),
    '',
    c.lead,
    '',
    `Код: ${p.code} (действует ${p.minutes} минут)`,
    p.link && c.button ? `\nИли перейди по ссылке: ${p.link}` : '',
    '',
    c.foot,
    '',
    '— Vibely',
  ].join('\n')

  return { subject: c.subject, html, text }
}

export async function sendMail(kind: MailKind, to: string, p: { name: string; code: string; link?: string; minutes: number }) {
  const { subject, html, text } = renderMail(kind, p)
  const message = { from: fromHeader(), to, subject, html, text, attachments: [{ filename: 'blink.png', content: MASCOT, cid: 'blink' }] }
  for (let attempt = 0; ; attempt++) {
    try {
      await (await mailer()).sendMail(message)
      return
    } catch (err) {
      if (err instanceof HttpError) throw err
      const code = (err as { code?: string }).code ?? ''
      console.error(`[mail] попытка ${attempt + 1}: ${code} ${(err as Error).message}`)
      if (code === 'EAUTH') throw new HttpError(503, 'Почтовый сервер отклонил логин — проверь SMTP_USER и SMTP_PASSWORD', 'mail')
      // сетевой сбой — пересоздаём соединение и пробуем ещё раз
      transport = null
      if (attempt >= 1 || !NETWORK_ERRORS.has(code)) throw new HttpError(502, 'Не получилось отправить письмо, попробуй ещё раз', 'mail')
    }
  }
}
