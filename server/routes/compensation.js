import { performCompensationLookup } from '../services/compensationLookup.js'

/**
 * @param {import('express').Express} app
 */
export function registerCompensationRoutes(app) {
  app.get('/api/compensation/lookup', (req, res) => {
    const roleText = req.query.q ?? req.query.roleText ?? ''
    const region = req.query.region ?? 'US'
    return sendLookup(res, roleText, region)
  })

  app.post('/api/compensation/lookup', (req, res) => {
    const roleText = req.body?.roleText ?? ''
    const region = req.body?.region ?? 'US'
    return sendLookup(res, roleText, region)
  })
}

/**
 * @param {import('express').Response} res
 * @param {string} roleText
 * @param {string} region
 */
function sendLookup(res, roleText, region) {
  const out = performCompensationLookup(roleText, region)
  if (out.kind === 'bad_request') {
    return res.status(400).json(out.body)
  }
  if (out.kind === 'not_found') {
    return res.status(404).json(out.body)
  }
  return res.json(out.body)
}
