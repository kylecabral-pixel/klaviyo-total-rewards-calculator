/**
 * @param {import('express').Express} app
 */
export function registerHealthRoutes(app) {
  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, service: 'klaviyo-wealth-model-api' })
  })
}
