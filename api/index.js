/**
 * Vercel serverless entry: all /api/* traffic is rewritten here (see vercel.json).
 */
import serverless from 'serverless-http'
import app from '../server/app.js'

export default serverless(app, {
  binary: ['application/json', 'application/*+json'],
})
