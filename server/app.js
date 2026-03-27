import express from 'express'
import cors from 'cors'
import { mountGreenhouseWebhook } from './routes/greenhouseWebhook.js'
import { registerApiRoutes } from './routes/index.js'

const app = express()
app.use(cors())

/** Greenhouse HMAC requires raw body — must run before express.json(). */
mountGreenhouseWebhook(app)

app.use(express.json())
registerApiRoutes(app)

export default app
