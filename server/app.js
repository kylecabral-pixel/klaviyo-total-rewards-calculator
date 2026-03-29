import express from 'express'
import cors from 'cors'
import { mountGreenhouseWebhook } from './routes/greenhouseWebhook.js'
import { registerAuthRoutes } from './routes/auth.js'
import { siteAuthMiddleware } from './middleware/siteAuth.js'
import { registerApiRoutes } from './routes/index.js'

const app = express()
app.use(
  cors({
    origin: true,
    credentials: true,
  }),
)

/** Greenhouse HMAC requires raw body — must run before express.json(). */
mountGreenhouseWebhook(app)

app.use(express.json())
registerAuthRoutes(app)
app.use(siteAuthMiddleware)
registerApiRoutes(app)

export default app
