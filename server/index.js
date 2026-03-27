/**
 * HTTP entrypoint. Route modules live under server/routes/;
 * integrations under server/integrations/{greenhouse,lumpages,gdrive}.
 */
import app from './app.js'

const PORT = Number(process.env.PORT) || 3001

app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`)
  if (!process.env.RECRUITER_API_KEY) {
    console.warn(
      '[warn] RECRUITER_API_KEY not set; using insecure dev default for recruiter routes',
    )
  }
})
