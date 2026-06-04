# Deploy Anil Ji Chaat (Render + Vercel)

This monorepo runs in two places:


| Service              | Platform                     | App                     |
| -------------------- | ---------------------------- | ----------------------- |
| **API + WebSockets** | [Render](https://render.com) | `apps/server` (Express) |
| **Website**          | [Vercel](https://vercel.com) | `apps/web` (Next.js 15) |


MongoDB should be hosted on **[MongoDB Atlas](https://www.mongodb.com/cloud/atlas)** (free tier works).

---

## Architecture

```
Browser
   │
   ├─► https://your-app.vercel.app          (Next.js — pages, admin UI)
   │       /api-proxy/*  ──rewrite──►  Render API /api/v1/*
   │
   └─► wss://your-api.onrender.com         (Socket.io — live orders)
```

- **REST / auth cookies**: Browser calls `/api-proxy/...` on the Vercel domain (same-origin cookies).
- **Socket.io**: Connects directly to the Render API URL (`NEXT_PUBLIC_SOCKET_URL`).
- **Razorpay webhooks**: Hit Render directly at `/webhooks/razorpay`.

---

## Prerequisites

1. GitHub repo pushed (Render + Vercel connect to Git).
2. **MongoDB Atlas** cluster + database user.
  - Network Access: allow `0.0.0.0/0` (or Render’s egress IPs if you restrict).
3. Optional: **Cloudinary**, **Razorpay**, **Gmail App Password** (thank-you emails).

Generate strong secrets (32+ chars):

```bash
openssl rand -base64 32   # use for JWT_SECRET
openssl rand -base64 32   # use for JWT_REFRESH_SECRET
```

---

## 1. Deploy API on Render

### Option A — Blueprint (`render.yaml`)

The repo includes `[render.yaml](./render.yaml)`. In Render:

1. **New → Blueprint** → connect this repo.
2. Review the `anilji-chaat-api` service and add secret env values when prompted.
3. Deploy.

### Option B — Manual Web Service

1. **New → Web Service** → connect repo.
2. Settings:


| Setting               | Value                                                                                                                                                                                                                             |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Root Directory**    | `apps/server`                                                                                                                                                                                                                     |
| **Runtime**           | Node                                                                                                                                                                                                                              |
| **Build Command**     | `cd ../.. && corepack enable && corepack prepare pnpm@9.15.0 --activate && NODE_ENV=development pnpm install && pnpm --filter @anilji/shared build && pnpm --filter @anilji/database build && pnpm --filter @anilji/server build` |
| **Start Command**     | `node dist/index.js`                                                                                                                                                                                                              |
| **Health Check Path** | `/health`                                                                                                                                                                                                                         |


1. **Environment variables** (Render dashboard → Environment):


| Variable                  | Required          | Example / notes                                                                  |
| ------------------------- | ----------------- | -------------------------------------------------------------------------------- |
| `NODE_ENV`                | Yes               | `production`                                                                     |
| `MONGODB_URI`             | Yes               | `mongodb+srv://user:pass@cluster.mongodb.net/anilji?retryWrites=true&w=majority` |
| `JWT_SECRET`              | Yes               | 32+ random characters                                                            |
| `JWT_REFRESH_SECRET`      | Yes               | 32+ random characters                                                            |
| `CORS_ORIGINS`            | Yes               | `https://your-app.vercel.app` (comma-separated if multiple)                      |
| `SITE_URL`                | Yes               | `https://your-app.vercel.app` (logo in emails, links)                            |
| `PORT`                    | Auto              | Render sets this; do not hardcode                                                |
| `CLOUDINARY_CLOUD_NAME`   | If using uploads  |                                                                                  |
| `CLOUDINARY_API_KEY`      | If using uploads  |                                                                                  |
| `CLOUDINARY_API_SECRET`   | If using uploads  |                                                                                  |
| `RAZORPAY_KEY_ID`         | If using payments |                                                                                  |
| `RAZORPAY_KEY_SECRET`     | If using payments |                                                                                  |
| `RAZORPAY_WEBHOOK_SECRET` | If using webhooks | From Razorpay dashboard                                                          |
| `SMTP_HOST`               | Optional          | `smtp.gmail.com`                                                                 |
| `SMTP_PORT`               | Optional          | `587`                                                                            |
| `SMTP_USER`               | Optional          | Gmail address                                                                    |
| `SMTP_PASS`               | Optional          | [Google App Password](https://myaccount.google.com/apppasswords)                 |
| `SMTP_FROM_NAME`          | Optional          | `Anil Ji Chaat`                                                                  |
| `COOKIE_DOMAIN`           | Usually empty     | Leave blank when using Vercel `/api-proxy` (same-site cookies on Vercel domain)  |
| `SEED_ADMIN_USERNAME`     | First deploy only | `admin`                                                                          |
| `SEED_ADMIN_PASSWORD`     | First deploy only | Strong password                                                                  |


1. Deploy and note the URL, e.g. `https://anilji-chaat-api.onrender.com`.

### Seed database (once)

After the first successful deploy, open **Render → Shell** (or run locally with production `MONGODB_URI`):

```bash
cd apps/server
node dist/scripts/seed.js
```

This creates the default admin user and baseline CMS data. Change the admin password after first login.

### Razorpay webhook (production)

In Razorpay Dashboard → Webhooks:

- **URL**: `https://<your-render-service>.onrender.com/webhooks/razorpay`
- **Secret**: same as `RAZORPAY_WEBHOOK_SECRET` on Render

---

## 2. Deploy Web on Vercel

1. **Add New Project** → import the same GitHub repo.
2. **Root Directory**: `apps/web` (important for monorepo).
3. Framework preset: **Next.js** (uses `[apps/web/vercel.json](./apps/web/vercel.json)`).

### Recommended Vercel settings

If the default install fails, override in **Project Settings → General**:


| Setting             | Value                                                                                    |
| ------------------- | ---------------------------------------------------------------------------------------- |
| **Install Command** | `cd ../.. && corepack enable && corepack prepare pnpm@9.15.0 --activate && pnpm install` |
| **Build Command**   | `cd ../.. && pnpm --filter @anilji/shared build && pnpm --filter @anilji/web build`      |


(`vercel.json` may already define similar commands; use the UI overrides only if builds fail.)

### Environment variables (Vercel)


| Variable                            | Required    | Example                                                     |
| ----------------------------------- | ----------- | ----------------------------------------------------------- |
| `NEXT_PUBLIC_API_URL`               | Yes         | `https://anilji-chaat-api.onrender.com` (no trailing slash) |
| `NEXT_PUBLIC_SOCKET_URL`            | Yes         | Same as API URL                                             |
| `NEXT_PUBLIC_SITE_URL`              | Yes         | `https://your-app.vercel.app`                               |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID`       | If payments | `rzp_live_...`                                              |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | If uploads  |                                                             |


Redeploy after changing env vars.

---

## 3. Wire Render ↔ Vercel

After Vercel gives you a URL (e.g. `https://anil-ji-chaat.vercel.app`):

1. **Render** → update:
  - `CORS_ORIGINS` = `https://anil-ji-chaat.vercel.app`
  - `SITE_URL` = `https://anil-ji-chaat.vercel.app`
2. **Redeploy** the Render service (CORS is read at startup).
3. Confirm **Vercel** `NEXT_PUBLIC_API_URL` / `NEXT_PUBLIC_SOCKET_URL` point to the Render API URL.

### Smoke test


| Check       | How                                                                      |
| ----------- | ------------------------------------------------------------------------ |
| API health  | `curl https://<render-host>/health` → `{"success":true,"message":"OK"}`  |
| Proxy       | Open site → DevTools → Network → calls to `/api-proxy/...` return 200    |
| Admin login | `/admin` with seeded credentials                                         |
| Socket      | Kitchen/manager view updates when order status changes                   |
| Email       | Admin → Settings → enable thank-you emails; complete an order with email |


---

## 4. Custom domains (optional)

### Vercel (e.g. `www.aniljichaat.com`)

1. Vercel → Project → **Domains** → add domain.
2. Update DNS per Vercel instructions.
3. Set `NEXT_PUBLIC_SITE_URL` to the custom domain.
4. Update Render `CORS_ORIGINS` and `SITE_URL` to the same domain.

### Render (e.g. `api.aniljichaat.com`)

1. Render → service → **Custom Domains**.
2. Update Vercel `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_SOCKET_URL` to the custom API domain.

---

## 5. Production checklist

- MongoDB Atlas user has least privilege; IP access configured.
- `JWT_SECRET` / `JWT_REFRESH_SECRET` are unique and not committed to Git.
- Default seed admin password changed after first login.
- `CORS_ORIGINS` matches exact Vercel URL (include `https://`, no trailing slash).
- Razorpay **live** keys + webhook URL on Render.
- Cloudinary configured if menu/gallery uploads are used.
- SMTP + Admin → Settings toggle for thank-you emails.
- Render free tier **spins down** after inactivity (cold starts ~30–60s) — upgrade plan for always-on production.

---

## 6. Troubleshooting

### CORS / login fails on Vercel

- `CORS_ORIGINS` on Render must include your exact Vercel origin.
- Redeploy Render after changing env.
- Do not set `COOKIE_DOMAIN` unless you know you need cross-subdomain cookies.

### `/api-proxy` returns 502 / timeout

- Check `NEXT_PUBLIC_API_URL` on Vercel points to the live Render URL.
- Render service must be running (`/health` works).
- Free Render instances sleep — wake with a request or upgrade plan.

### Socket not connecting

- `NEXT_PUBLIC_SOCKET_URL` must be the Render API origin (same as `NEXT_PUBLIC_API_URL`).
- `CORS_ORIGINS` must include the Vercel site URL.

### Thank-you emails not sent

- Admin → **Settings** → toggle ON.
- Order must have `customerEmail` and status **Completed**.
- `SMTP_USER` / `SMTP_PASS` set on Render (Gmail App Password, not normal password).
- Log shows `ENETUNREACH` + IPv6 (`2607:f8b0:...`): Render has no IPv6 egress to Gmail — the server forces IPv4 for SMTP (`family: 4` in mailer). Redeploy after pulling latest server code.

### Build fails on Vercel (pnpm / workspace)

- Set **Root Directory** to `apps/web`.
- Use install command from section 2 that runs `pnpm install` from repo root.

---

## 7. Local vs production env files


| File                  | Used by                       |
| --------------------- | ----------------------------- |
| `apps/server/.env`    | Local API (`pnpm dev:server`) |
| `apps/web/.env.local` | Local web (`pnpm dev:web`)    |


Never commit real secrets. Use Render / Vercel dashboards for production values.

See also:

- `[apps/server/.env.example](./apps/server/.env.example)` — server variable list
- `[apps/web/.env.example](./apps/web/.env.example)` — web variable list
- `[render.yaml](./render.yaml)` — Render blueprint
- `[apps/web/vercel.json](./apps/web/vercel.json)` — Vercel build hints

