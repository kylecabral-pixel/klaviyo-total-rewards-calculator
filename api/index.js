/**
 * Vercel entry: default-export the Express app (Vercel runs it as a Node function).
 * Rewrites: `/api` and `/api/*` → this function (`vercel.json`).
 * Local dev: `npm run dev:api` loads `server/index.js`, which imports the same `app`.
 */
export { default } from '../server/app.js'
