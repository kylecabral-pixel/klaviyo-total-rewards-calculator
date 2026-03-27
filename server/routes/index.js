import { registerHealthRoutes } from './health.js'
import { registerIntegrationsRoutes } from './integrations.js'
import { registerCompensationRoutes } from './compensation.js'
import { registerBenefitsRoutes } from './benefits.js'
import { registerOfferRoutes } from './offers.js'

/**
 * JSON body routes only — call after `express.json()` and after Greenhouse raw webhook is mounted.
 * @param {import('express').Express} app
 */
export function registerApiRoutes(app) {
  registerHealthRoutes(app)
  registerIntegrationsRoutes(app)
  registerCompensationRoutes(app)
  registerBenefitsRoutes(app)
  registerOfferRoutes(app)
}
