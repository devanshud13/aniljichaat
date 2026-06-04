# Anil Ji Chaat — Restaurant Platform

Full-stack restaurant website and management system for **Anil Ji Chaat** (Ambala, Haryana).

## Architecture

- **`apps/web`** — Next.js 15 (Vercel) — public site, QR ordering, staff dashboards
- **`apps/server`** — Express + Socket.io (Render) — REST API, auth, payments
- **`packages/shared`** — enums, Zod schemas, API types
- **`packages/database`** — Mongoose models and indexes

## Prerequisites

- Node.js 20+
- pnpm 9 (`npx pnpm@9.15.0`)
- MongoDB (local or Atlas)

## Quick Start

```bash
# Install dependencies
npx pnpm@9.15.0 install

# Build shared packages
npx pnpm@9.15.0 --filter @anilji/shared build
npx pnpm@9.15.0 --filter @anilji/database build

# Configure environment
cp .env.example apps/server/.env
cp .env.example apps/web/.env.local
# Edit MONGODB_URI and secrets in apps/server/.env

# Seed database
npx pnpm@9.15.0 seed

# Run API (terminal 1)
npx pnpm@9.15.0 dev:server

# Run web (terminal 2)
npx pnpm@9.15.0 dev:web
```

- **Website:** http://localhost:3000
- **API:** http://localhost:4000
- **Staff login:** http://localhost:3000/login  
  Default: `admin` / `Admin@123` (from seed)

## QR Ordering

Table URLs: `http://localhost:3000/order/table-1?outlet=ambala`

Generate QR codes in **Admin → Tables & QR**.

## Razorpay (Test Mode)

1. Add test keys to `apps/server/.env` and `NEXT_PUBLIC_RAZORPAY_KEY_ID` in web `.env.local`
2. Customer selects **Pay Online** on order checkout
3. Payment is verified server-side via signature — never trust client status

Test card: use Razorpay test mode documentation.

## Deployment

### Vercel (Web)

- Root directory: `apps/web`
- Set `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SOCKET_URL`, `NEXT_PUBLIC_SITE_URL`

### Render (API)

- Use `render.yaml` or create Web Service from `apps/server`
- Health check: `GET /health`
- Set all server env vars from `.env.example`

### MongoDB Atlas

- Allow Render outbound IPs
- Set `MONGODB_URI`

### Cloudinary

- Same credentials for dev and production
- All uploads go to Cloudinary (no local storage)

## Roles

| Role | Access |
|------|--------|
| ADMIN | Full CMS, menu, users, tables, audit |
| MANAGER | Orders, payments, billing |
| KITCHEN | Order status (NEW → PREPARING → READY) |

## API

Base URL: `/api/v1`

Standard response:

```json
{ "success": true, "data": {}, "message": "" }
```

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Run web + server in parallel |
| `pnpm dev:web` | Next.js dev server |
| `pnpm dev:server` | API + Socket.io |
| `pnpm seed` | Seed outlet, menu, admin, tables |
| `pnpm build` | Build all packages |

## License

Private — Anil Ji Chaat
