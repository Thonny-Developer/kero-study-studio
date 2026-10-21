// Какие модели Mistral реально доступны ключу из .env: npm run models
// В списке /v1/models бывают модели с нулевой квотой, поэтому каждую пробуем коротким запросом.
import { Mistral } from '@mistralai/mistralai'
import * as errors from '@mistralai/mistralai/models/errors'
import { env } from '../env.js'

const client = new Mistral({ apiKey: env.mistralKey })
const res = await client.models.list()
const ids = [...new Set((res.data ?? []).flatMap((m) => ('capabilities' in m && m.capabilities.completionChat ? [m.id] : [])))].sort()

console.log(`Чат-моделей в списке: ${ids.length}. Проверяем доступ…\n`)
for (const id of ids) {
  let status: string
  try {
    await client.chat.complete({ model: id, maxTokens: 1, messages: [{ role: 'user', content: 'hi' }] })
    status = 'доступна'
  } catch (e) {
    const code = e instanceof errors.MistralError ? e.statusCode : 0
    status = code === 429 ? 'нет квоты (429)' : code === 403 ? 'нет доступа (403)' : `ошибка ${code || (e as Error).message}`
  }
  const mark = id === env.mistralModel ? '  ← MISTRAL_MODEL' : id === env.mistralCodeModel ? '  ← MISTRAL_CODE_MODEL' : ''
  console.log(`${status === 'доступна' ? '✓' : '·'} ${id.padEnd(30)} ${status}${mark}`)
  await new Promise((r) => setTimeout(r, 400))
}
