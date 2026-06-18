# Deployment Guide

ICP runs as three pieces: a **MongoDB Atlas** database, a **Node/Express API**
(`server/`), and a static **React build** (`frontend/`). There is no Docker — each
piece is deployed independently.

## 0. Prerequisites
- A MongoDB Atlas cluster (already set up: `studentportal`).
- The schema/seed loaded once: `cd database/mongodb && npm install && npm run setup`.
- Node 18+ on the API host.

## 1. MongoDB Atlas
- **Network Access → IP Access List:** add the API host's IP (or `0.0.0.0/0` only for
  testing). Without this the API cannot connect.
- **Database Access:** use a dedicated user with a strong password.
- Rotate any password that has been shared in plaintext.

## 2. Backend API (`server/`)
Deploy to any Node host (Render, Railway, Fly.io, a VM, etc.).

Environment variables (see `server/.env.example`):
| Var | Example | Notes |
|---|---|---|
| `MONGODB_URI` | `mongodb+srv://user:pass@cluster.mongodb.net/...` | from Atlas |
| `MONGODB_DB` | `studentportal` | |
| `JWT_SECRET` | long random string | **change from the dev value** |
| `PORT` | `8080` | host may inject its own |
| `CORS_ORIGIN` | `https://app.yourdomain.com` | the deployed frontend origin(s), comma-separated |
| `TRUST_PROXY` | `1` | set when behind a reverse proxy/load balancer |

Start command: `npm install && npm start`.
Health check path for the platform: `GET /api/health`.

> Uploaded files are written to `server/uploads/`. On ephemeral hosts this disk is not
> persistent — mount a volume or move file storage to S3/GCS for production durability.
> For multiple API instances, move the in-memory token blacklist to a Mongo TTL collection.

## 3. Frontend (`frontend/`)
Static build deployed to Netlify, Vercel, Cloudflare Pages, S3+CDN, etc.

Set the API origin at **build time**:
```
VITE_API_ORIGIN=https://api.yourdomain.com
```
Build: `npm install && npm run build` → serve the `dist/` folder.

## 4. Post-deploy checklist
- [ ] Atlas IP allowlist includes the API host.
- [ ] `JWT_SECRET` rotated; DB password rotated.
- [ ] `CORS_ORIGIN` set to the real frontend URL (not localhost).
- [ ] `TRUST_PROXY=1` if behind a proxy.
- [ ] `VITE_API_ORIGIN` baked into the frontend build.
- [ ] `GET /api/health` returns `{ status: "ok" }`.
- [ ] Login works with a seeded/admin account.

## CI
`.github/workflows/ci.yml` runs backend unit tests (`server`: `npm test`) and the
frontend production build (`frontend`: `npm run build`) on pushes/PRs to `dev`/`main`.
