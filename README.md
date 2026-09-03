# HouseHunt

A premium full-stack real-estate marketplace — find a place you'll love to call home.

HouseHunt is a MERN application with a cinematic, editorial frontend and a verified
REST API. Browse published listings, search and filter, save favorites, request
bookings, manage your account, and administer the marketplace — all backed by real,
persistent data.

Live deployments run frontend and API on Vercel, MongoDB on Atlas, with listing
photos stored in the database via GridFS — see [`DEPLOYMENT.md`](DEPLOYMENT.md).

> Built by **Hariraj K**

---

## Technology Stack

| Layer    | Tech |
| -------- | ---- |
| Frontend | React (Create React App), React Router, Redux Toolkit + redux-persist, custom CSS design system, react-toastify |
| Backend  | Node.js, Express, JWT authentication, bcrypt, multer image upload |
| Database | MongoDB (Mongoose ODM) |
| Testing  | Jest + Supertest (backend), Jest + React Testing Library (frontend utilities) |

## Repository Layout

```
househunt-main/
├── backend/            # Express REST API (port 3001)
│   ├── routes/api.v1/  # auth, users, properties, favorites, bookings, admin, upload
│   ├── controllers/    # request handlers
│   ├── services/       # business logic
│   ├── models/         # Mongoose schemas
│   ├── middleware/     # auth + error handling
│   ├── tests/          # Jest integration suite
│   └── .env.example    # environment template (copy to .env)
├── frontend/           # React SPA (dev port 3000)
│   ├── src/pages/      # Home, Explore, Details, Login, Register, Favorites,
│   │                   #   Bookings, Account, Create Listing, Admin
│   ├── src/components/ # reusable UI + motion components
│   ├── src/hooks/      # useAuth, useProperties, useFavorites, useBookings, useAdmin
│   ├── src/styles/     # design tokens + global stylesheet
│   └── public/assets/  # bundled category / hero imagery
└── .gitignore
```

## Features

- **Authentication** — register, login, JWT sessions, protected routes, admin
  role authorization. Passwords are bcrypt-hashed.
- **Properties** — create listings with real multi-image upload, publish
  lifecycle (`draft` / `published`), keyword search across title/description/type,
  filters (listing type, property type, price, bedrooms, bathrooms), pagination.
- **Public visibility rules** — only `published` listings appear on public
  pages; drafts are visible only to their owner and to admins.
- **Favorites** — save and remove homes, dedicated saved-homes page.
- **Bookings** — request a booking with move-in/move-out dates, monthly pricing,
  status tracking, and cancellation with confirmation.
- **Account** — profile view and editing via the authenticated user API.
- **Admin dashboard** — real statistics, users, properties, bookings, and
  publish/deactivate actions against the admin API.
- **Uploads** — property photos stored on disk and served from `/uploads`.

## Live Demo

The application is architected for permanent cloud hosting (frontend + backend on
Vercel, database on MongoDB Atlas, images persisted in Atlas via GridFS). Once
deployed, the public URL goes here — see `DEPLOYMENT.md` for the exact
step-by-step hosting guide.

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB running locally on `localhost:27017`

### 1. Backend

```bash
cd backend
cp .env.example .env    # then fill in JWT_SECRET and FRONTEND_URL
npm install
npm start               # http://localhost:3001
```

Required environment variables (see `backend/.env.example`):

| Variable       | Purpose                                             |
| -------------- | --------------------------------------------------- |
| `NODE_ENV`     | `development` by default                            |
| `PORT`         | API port (`3001`)                                   |
| `MONGODB_URI`  | MongoDB connection string                           |
| `JWT_SECRET`   | Strong random secret for signing JWTs — never commit |
| `FRONTEND_URL` | Comma-separated allowed CORS origins (e.g. `http://localhost:3000`) |

Optional `MONGODB_USER` / `MONGODB_PASS` / `MONGODB_HOST` / `MONGODB_PORT` /
`MONGODB_DB` only when MongoDB requires credentials; when `MONGODB_USER` is unset
the app connects without authentication.

### 2. Frontend

```bash
cd frontend
npm install
npm start               # http://localhost:3000 (API calls go to localhost:3001)
```

The frontend derives its API base URL from the current origin: `localhost` uses
`http://localhost:3001/api/v1`, other origins use a same-origin `/api/v1`.

### 3. Verify

- Open http://localhost:3000 — homepage hero, featured homes, category tiles.
- Explore → search/filter published listings.
- Register an account to favorite homes, request bookings, and list a property.
- Promote a user to `role: "admin"` in MongoDB to access the admin dashboard.

## API Overview

Base path: `/api/v1`

| Area        | Examples                                              |
| ----------- | ----------------------------------------------------- |
| Auth        | `POST /auth/register`, `POST /auth/login`, `GET/PUT /auth/me` |
| Users       | `GET /users`, `GET /users/:id`                        |
| Properties  | `GET /properties` (published only), `GET/PATCH/DELETE /properties/:id`, `POST /properties` |
| Favorites   | `GET /favorites`, `POST/DELETE /favorites/:propertyId` |
| Bookings    | `GET /bookings`, `POST /bookings`, `DELETE /bookings/:id` |
| Admin       | `GET /admin/dashboard`, users/properties/bookings lists, status PATCHes |
| Uploads     | `POST /upload` (authenticated, multipart `images` field) |

## Testing

Backend integration suite (uses an isolated `househunt_test` database — it never
touches your development data):

```bash
cd backend
npx jest --runInBand
```

Frontend unit tests and production build:

```bash
cd frontend
npm test
npm run build
```

## Deployment

Production hosting is documented in detail in [`DEPLOYMENT.md`](DEPLOYMENT.md).
In short:

- **Frontend** — Vercel static project (Create React App, `frontend/`), with SPA
  fallback so deep links work; `REACT_APP_API_URL` is baked in at build time.
- **Backend** — Vercel project rooted at `backend/`; Vercel runs the exported
  Express app as a single function (zero-config). Requires `MONGODB_URI`,
  `JWT_SECRET`, `FRONTEND_URL`, and `STORAGE_DRIVER=gridfs`.
- **Database & images** — MongoDB Atlas M0; property photos are stored in
  MongoDB GridFS (`STORAGE_DRIVER=gridfs`) so uploads survive redeploys.
  Locally the default `STORAGE_DRIVER=disk` is unchanged.

Environment variable **names** only (never commit values):

| App | Variables |
| --- | --------- |
| Backend | `MONGODB_URI`, `JWT_SECRET`, `FRONTEND_URL`, `STORAGE_DRIVER`, `PORT`, `NODE_ENV` |
| Frontend (build) | `REACT_APP_API_URL` |

## Design System

Deep-navy and champagne-gold palette, Inter + Cormorant Garamond typography,
generous photography, and a restrained motion language (hero ken-burns, scroll
reveals, card lifts, modal/gallery transitions). All animation respects
`prefers-reduced-motion`.

## Security Notes

- Secrets live only in environment variables; `.env` files are git-ignored.
- JWT verification never falls back to a hardcoded secret — the server refuses
  to start without `JWT_SECRET`.
- Passwords are hashed with bcrypt; plaintext is never stored.
- Uploaded files are restricted to image MIME types with a size limit.
