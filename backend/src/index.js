import dotenv from 'dotenv'
dotenv.config()

import { createServer } from 'node:http'
import { app } from './app.js'
import { initDatabase } from './db/init.js'
import { attachRealtime } from './realtime.js'

try {
  await initDatabase()
  const PORT = process.env.PORT
  const server = createServer(app)
  attachRealtime(server)
  server.listen(PORT, () => {
    console.info(`express server running on http://localhost:${PORT}`)
  })
} catch (err) {
  console.error('error connecting to database:', err)
}
