# HouseHunt — Production Deployment

HouseHunt is architected to run 100% in the cloud so it stays live with your PC
off. Nothing here depends on localhost or on `npm start` running on your machine.

## Architecture

| Layer            | Hosting                        | Why |
| ---------------- | ------------------------------ | --- |
| Frontend (React) | Vercel (static, free Hobby)    | Global CDN, HTTPS, automatic SPA fallback, never sleeps |
| Backend (Express)| Vercel (Function, free Hobby)  | Vercel runs an exported Express app as a single Fluid-compute Function — no spin-down, no always-on container cost |
| Database         | MongoDB Atlas M0 (free tier)   | Persistent cloud MongoDB |
| Images           | MongoDB GridFS (in Atlas)      | Uploads are stored as files in the database — they survive every redeploy; no separate storage account needed |

The API project reads `STORAGE_DRIVER=gridfs` and streams photos out of the
database. Local development keeps `STORAGE_DRIVER=disk` unchanged.

## Free-tier reality (read this)

- **Vercel Hobby (free):** durable and does not sleep. Limits (2026): 100 GB
  bandwidth, ~1M function invocations, 4 CPU-hours/month, **4.5 MB max request
  body per function call**. Listing photos are compressed in the browser before
  upload (max 2560 px, JPEG) so uploads stay ~0.3–2 MB.
- **MongoDB Atlas M0 (free):** $0. **Atlas auto-pauses M0 clusters after ~30
  days with zero connections.** Any traffic (even a periodic health ping) keeps
  it awake; if it ever pauses, resume it in the Atlas UI (data is retained).
- Vercel functions may have brief cold starts on the first request after idle,
  typically well under a second with Fluid compute.

## One-time setup — MongoDB Atlas (you)

1. Go to https://www.mongodb.com/cloud/atlas → **Try Free** → sign up.
2. Create a free **M0** cluster (any region, e.g. `us-east-1`).
3. **Database Access → Add New User**: create a user with read/write on the
   database, and save the password **directly into your password manager**.
4. **Network Access → Add IP Address → Allow access from anywhere**
   (`0.0.0.0/0`) — required so Vercel functions can connect.
5. **Connect → Drivers**: copy the connection string
   (`mongodb+srv://<user>:<password>@<cluster>.../?retryWrites=true&w=majority`).
   Do not paste it into chat — you'll enter it only in the Vercel dashboard.

## One-time setup — Vercel (you)

1. Go to https://vercel.com → **Sign up** (GitHub/Google are fine).
2. Two projects will be created from this repository:

### API project (`househunt-api`)
1. **New Project → Import** this repo → set **Root Directory** to `backend`.
2. Vercel auto-detects Express from `backend/server.js` (it exports the app).
   Build/start commands stay blank (zero-config).
3. **Settings → Environment Variables**:
   - `MONGODB_URI` = your Atlas connection string
   - `JWT_SECRET` = long random string (e.g. `openssl rand -hex 32`)
   - `FRONTEND_URL` = `https://<frontend-project>.vercel.app`
   - `STORAGE_DRIVER` = `gridfs`
4. **Deploy.** The API URL will look like `https://househunt-api-xxx.vercel.app`.
   Health check: `https://househunt-api-xxx.vercel.app/health` → `{"success":true,"status":"ok"}`.

### Frontend project (`househunt`)
1. **New Project → Import** this repo → set **Root Directory** to `frontend`.
2. Framework preset: **Create React App** (auto-detected). `vercel.json` already
   adds SPA fallback so deep links like `/properties/<id>` work on direct open
   and refresh.
3. **Settings → Environment Variables**:
   - `REACT_APP_API_URL` = `https://househunt-api-xxx.vercel.app/api/v1`
4. **Deploy.** Site URL looks like `https://househunt-xxx.vercel.app`.

Because the frontend and API are separate origins, the API's CORS allow-list
must include the real frontend URL (`FRONTEND_URL` above). Local development is
unaffected — dev falls back to `http://localhost:3001`.

## CLI alternative

With the Vercel CLI installed and logged in (`npm i -g vercel && vercel login`),
the same two projects can be deployed from the command line:

```bash
cd backend && vercel --prod        # API project (env vars set in dashboard)
cd frontend && vercel --prod       # frontend project
```

## Deploying updates

Push to the imported Git branch (or rerun `vercel --prod`). Images live in
Atlas, so photo uploads survive every redeploy.

## Independent verification checklist

Open the **production site URL only**, from a fresh/incognito browser, with all
local servers stopped:

- [ ] Homepage loads over HTTPS
- [ ] Explore, search, and filters work
- [ ] Property detail + gallery images load
- [ ] Register → Login → Logout
- [ ] Favorites add/remove
- [ ] Booking request + cancel
- [ ] Account loads and updates
- [ ] `/admin` blocks non-admins; admin dashboard shows real data
- [ ] Direct open of `/properties/<id>` and refresh on a route both work
- [ ] `https://<api>/health` returns ok
- [ ] Upload a photo on a new listing, redeploy, confirm the photo still renders

## Upgrading beyond free tier (not required)

If you later want guaranteed always-on DB (no idle pause) or more
bandwidth/invocations, the Atlas Flex tier (~$8–30/mo with a hard cap) and a
Vercel Pro plan are the natural next steps. The code needs no changes.
