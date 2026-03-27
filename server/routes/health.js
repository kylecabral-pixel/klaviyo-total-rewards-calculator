import {
  API_ENDPOINTS,
  PACKAGE_NAME,
  SERVICE_NAME,
  SERVICE_VERSION,
  getDeploymentMeta,
} from '../meta.js'

/**
 * @param {import('express').Express} app
 */
export function registerHealthRoutes(app) {
  app.get('/api/health', (_req, res) => {
    res.json({
      ok: true,
      service: SERVICE_NAME,
      package: PACKAGE_NAME,
      version: SERVICE_VERSION,
      ...getDeploymentMeta(),
    })
  })

  /** Discovery — lists route prefixes (no auth). */
  app.get('/api', (_req, res) => {
    res.json({
      ok: true,
      service: SERVICE_NAME,
      package: PACKAGE_NAME,
      version: SERVICE_VERSION,
      ...getDeploymentMeta(),
      endpoints: API_ENDPOINTS,
    })
  })
}
