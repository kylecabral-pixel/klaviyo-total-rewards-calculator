# Deploy to Vercel

This app is a **Vite static frontend** plus an **Express API** packaged as one **serverless function** (`api/index.js` via `serverless-http`).

## One-time setup

1. Push the `klaviyo-wealth-model` folder to GitHub (or GitLab / Bitbucket).
2. In [vercel.com](https://vercel.com): **Add New Project** → import that repo.
3. Set **Root Directory** to `klaviyo-wealth-model` if the repo contains other folders.
4. Vercel will read [`vercel.json`](vercel.json): build runs `npm run build`, static output is `dist`, and `/api/*` is routed to the serverless API.

## Environment variables (Project → Settings → Environment Variables)

| Variable | Required | Notes |
|----------|----------|--------|
| `RECRUITER_API_KEY` | Yes (production) | Recruiter `POST`/`PUT` `/api/recruiter/*` returns 500 if unset when `NODE_ENV=production`. |
| `GREENHOUSE_WEBHOOK_SECRET` | If using GH webhooks | Required in production for `POST /api/webhooks/greenhouse`. |
| `GREENHOUSE_API_KEY` | Optional | Enriches webhook payloads via Harvest. |

Optional: `LUMPAGES_*`, `GDRIVE_*` per [`.env.example`](.env.example).

## After deploy

- **App:** `https://YOUR_PROJECT.vercel.app`
- **Demo offer:** `https://YOUR_PROJECT.vercel.app/?offer=klaviyo-hackathon-demo-offer-token`
- **API health:** `https://YOUR_PROJECT.vercel.app/api/health`

## Limits (serverless)

- **Offer JSON writes** (`createOffer`, `updateOffer`, Greenhouse upsert) **fail on Vercel** because the filesystem is read-only. Reads (`GET /api/offer`) work from the bundled `server/data/offers.json`. For editable offers in production, add a database or external store.
- Cold starts and a **60s** (Pro) / **10s** (Hobby) function limit apply to the API route.

## Local parity

```bash
npm run dev:all
```

Still runs Vite + Express on your machine; Vercel only affects the hosted URL.
