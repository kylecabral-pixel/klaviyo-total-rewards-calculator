/**
 * Vercel entry: default-export the Express app (supported natively; no serverless-http).
 * Rewrites: `/api` and `/api/*` → this function (`vercel.json`).
 * Local dev: `npm run dev:api` uses `server/index.js` with the same `app`.
 */
export { default } from '../server/app.js'
