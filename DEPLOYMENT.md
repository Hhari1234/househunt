# HouseHunt — Production Deployment

HouseHunt is architected to run 100% in the cloud so it stays live with your PC
off. Nothing here depends on localhost or on `npm start` running on your machine.

## Architecture

| Layer            | Hosting                        | Why |
| ---------------- | ------------------------------ | --- |
| Frontend (React) | Render Static Site             | Global CDN, HTTPS, automatic SPA fallback |
| Backend (Express)| Render Web Service             | Long-running Node/Express service with environment variables |
| Database         | MongoDB Atlas M0 (free tier)   | Persistent cloud MongoDB |
| Images           | MongoDB GridFS (in Atlas)      | Uploads are stored as files in the database — they survive every redeploy; no separate storage account needed |

The API project reads `STORAGE_DRIVER=gridfs` and streams photos out of the
database. Local development keeps `STORAGE_DRIVER=disk` unchanged.

## Free-tier reality (read this)

- **Render free tier:** Render offers a free tier for Static Sites and Web
   Services with limits on bandwidth and compute; review Render's current
   quotas before production. Keep uploaded image sizes small (compressed
   JPEG/WebP) — typical listing photos should remain under a few MB.
- **MongoDB Atlas M0 (free):** $0. **Atlas auto-pauses M0 clusters after ~30
   days with zero connections.** Any traffic (even a periodic health ping) keeps
   it awake; if it ever pauses, resume it in the Atlas UI (data is retained).


## One-time setup — MongoDB Atlas (you)

1. Go to https://www.mongodb.com/cloud/atlas → **Try Free** → sign up.
2. Create a free **M0** cluster (any region, e.g. `us-east-1`).
3. **Database Access → Add New User**: create a user with read/write on the
   database, and save the password **directly into your password manager**.
4. **Network Access → Add IP Address → Allow access from anywhere**
   (`0.0.0.0/0`) — required so cloud-hosted services can connect.
5. **Connect → Drivers**: copy the connection string
   (`mongodb+srv://<user>:<password>@<cluster>.../?retryWrites=true&w=majority`).
   Do not paste it into chat — you'll enter it only in the Render dashboard.

## One-time setup — Render

1. Sign in to https://dashboard.render.com using your GitHub account and create two services from this repository: one Static Site (frontend) and one Web Service (backend).

### API service (Web Service)
1. New → Web Service → Connect GitHub repo → set **Root Directory** to `backend`.
2. Build Command: leave blank (backend has no build); the service will `npm install` during deployment if you provide a build hook in the dashboard. Use the **Start Command**: `npm start`.
3. Set Environment Variables (Render > Environment > Add Variable):
   - `NODE_ENV=production`
   - `MONGODB_URI=<your MongoDB Atlas connection string>`
   - `JWT_SECRET=<strong random secret>`
   - `STORAGE_DRIVER=gridfs`
   - `FRONTEND_URL=https://<your-frontend-render-url>` (comma-separated origins are supported)
4. Health check path: `/health` — Render will use this to probe service health.

### Frontend service (Static Site)
1. New → Static Site → Connect GitHub repo → set **Root Directory** to `frontend`.
2. Build Command: `npm install && npm run build`
3. Publish Directory: `build`
4. Set Environment Variables (Render > Environment > Add Variable):
   - `REACT_APP_API_URL=https://<your-backend-render-url>/api/v1`
5. Configure the Static Site to rewrite unknown routes to `/index.html` so React Router deep links work.

Because the frontend and API are separate origins, the API's CORS allow-list
must include the real frontend URL (`FRONTEND_URL` above). Local development is
unaffected — dev falls back to `http://localhost:3001`.

## CLI alternative

You can also deploy via the Render CLI or the dashboard. The dashboard is
recommended for first-time deploys so you can set environment variables.

Render CLI quickstart (after installing and logging in):

```bash
render login
# Create services via the dashboard or use the CLI/Infrastructure-as-code
```

## Deploying updates

Push to the connected Git branch or trigger a redeploy from the Render
dashboard/CLI. Images live in Atlas, so photo uploads survive every redeploy.

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

If you later want guaranteed always-on DB (no idle pause) or more bandwidth,
consider upgrading Atlas and Render paid plans. The code needs no changes.
