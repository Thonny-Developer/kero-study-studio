import { app } from './app.js'
import { ready } from './db.js'
import { env } from './env.js'

await ready()
app.listen(env.port, () => {
  console.log(`Vibely API: http://localhost:${env.port} · БД: ${env.databaseUrl} · модель: ${env.mistralModel}`)
})
