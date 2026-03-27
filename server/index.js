/**
 * Local HTTP entry. Vercel uses `api/index.js` + `serverless-http` with the same `app`.
 * Route modules: `server/routes/*`; integrations: `server/integrations/*`.
 */
import app from './app.js'
import { SERVICE_NAME, SERVICE_VERSION } from './meta.js'

const PORT = Number(process.env.PORT) || 3001

app.listen(PORT, () => {
  console.log(
    `[${SERVICE_NAME}] v${SERVICE_VERSION} → http://localhost:${PORT}`,
  )
  console.log('  GET /api  ·  GET /api/health')
  if (!process.env.RECRUITER_API_KEY) {
    console.warn(
      '[warn] RECRUITER_API_KEY not set; using insecure dev default for recruiter routes',
    )
  }
})
