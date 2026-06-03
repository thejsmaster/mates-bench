# Mates Bench — SSR Benchmark App

A full-stack benchmarking application for the [Mates](https://github.com/freeman-jiang/mates) framework with SQLite. Measures SSR rendering performance with real database queries.

## Quick Start

```bash
# Install dependencies
npm install

# Seed the database (1000 products, 500 users, 5000 orders)
npm run seed

# Start the development server with hot reload
npm run dev

# Production build
npm run build

# Start the production server
npm start
```

Then open **http://localhost:3000** to see the dashboard, or **http://localhost:3000/bench** to run SSR benchmarks.

## Routes

| Path      | Description                                        |
|-----------|----------------------------------------------------|
| `/`       | SSR Dashboard — product, user, and order stats     |
| `/bench`  | Benchmark page — click to run SSR performance tests |
| `/health` | Health check endpoint (used by Railway)             |

## Database

The app uses **better-sqlite3** with the database stored at `data/bench.db`.

- **Auto-seed**: The database is automatically seeded when the app starts if it's empty (first run or fresh deployment).
- **Re-seed manually**: Run `npm run seed [products] [users] [orders]` to replace all data with fresh random data.

## Deployment (Railway)

The included `railway.json` handles deployment on Railway:

```bash
railway login
railway up
```

The server's `/health` endpoint is used as the Railway health check.

## Project Structure

```
mates-bench/
├── client/
│   ├── App.ts          # Root component (SSR dashboard)
│   ├── BenchPage.ts    # Benchmark page
│   └── client.ts       # Browser hydration entry
├── server/
│   ├── api/
│   │   ├── benchmark.ts  # Benchmark RPC
│   │   ├── orders.ts     # Order queries
│   │   ├── products.ts   # Product queries
│   │   └── users.ts      # User queries
│   ├── helpers/
│   │   ├── db.ts         # Database connection + auto-seed
│   │   └── seed.ts       # Standalone seed script
│   └── main.ts           # Server middleware
├── data/                  # SQLite database (gitignored)
├── mates.config.ts        # Mates framework config
├── railway.json           # Railway deployment config
└── package.json
```

## Benchmarks

On the `/bench` page, click "Run Benchmarks" to measure:

1. **SSR / (dashboard, via HTTP)** — Full SSR render with 5 SQLite queries
2. **SSR / (second run)** — Cached/repeated render
3. **SQLite: 5 queries (match SSR)** — Raw SQLite query performance
4. **SQLite: COUNT(*) products** — Minimal query overhead
