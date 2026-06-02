// server/api/benchmark.ts
// RPC function that runs SSR benchmarks and returns results.
// Makes HTTP requests to localhost to measure end-to-end SSR time.

import http from "node:http";
import { getDb } from "../helpers/db.js";

interface BenchResult {
  name: string;
  iterations: number;
  totalMs: number;
  avgMs: number;
  minMs: number;
  maxMs: number;
  ops: number;
}

function httpGet(port: number): Promise<string> {
  return new Promise((resolve, reject) => {
    http
      .get(`http://localhost:${port}/`, (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => resolve(data));
      })
      .on("error", reject);
  });
}

async function bench(
  name: string,
  fn: () => Promise<void>,
  iterations: number,
): Promise<BenchResult> {
  for (let i = 0; i < Math.min(iterations, 5); i++) {
    try {
      await fn();
    } catch {
      /* ignore warmup failures */
    }
  }
  const times: number[] = [];
  for (let i = 0; i < iterations; i++) {
    try {
      const start = performance.now();
      await fn();
      times.push(performance.now() - start);
    } catch {
      /* skip */
    }
  }
  if (times.length === 0) {
    return {
      name,
      iterations: 0,
      totalMs: 0,
      avgMs: 0,
      minMs: 0,
      maxMs: 0,
      ops: 0,
    };
  }
  const totalMs = times.reduce((a, b) => a + b, 0);
  const avgMs = totalMs / times.length;
  return {
    name,
    iterations: times.length,
    totalMs: Math.round(totalMs),
    avgMs: Math.round(avgMs * 100) / 100,
    minMs: Math.round(Math.min(...times) * 100) / 100,
    maxMs: Math.round(Math.max(...times) * 100) / 100,
    ops: Math.round(1000 / avgMs),
  };
}

export async function runBenchmarks(payload: {
  iterations?: number;
}): Promise<{ results: BenchResult[]; serverInfo: Record<string, unknown> }> {
  const iterations = payload.iterations ?? 30;
  const port = parseInt(process.env.PORT || "3000", 10);

  // Warm DB and ensure server is ready
  getDb();
  await httpGet(port).catch(() => {});

  const results: BenchResult[] = [];

  // Benchmark 1: SSR dashboard via HTTP
  results.push(
    await bench(
      "SSR / (dashboard, via HTTP)",
      async () => {
        await httpGet(port);
      },
      iterations,
    ),
  );

  // Benchmark 2: Same page, second run
  results.push(
    await bench(
      "SSR / (second run)",
      async () => {
        await httpGet(port);
      },
      iterations,
    ),
  );

  // Benchmark 3: Raw SQLite queries
  const db = getDb();
  if (db) {
    results.push(
      await bench(
        "SQLite: 5 queries (match SSR)",
        async () => {
          db.prepare(
            "SELECT COUNT(*) as total, AVG(price) as avgPrice, SUM(stock) as totalStock, COUNT(DISTINCT category) as categories FROM products",
          ).get();
          db.prepare(
            "SELECT DISTINCT category FROM products ORDER BY category",
          ).all();
          db.prepare(
            "SELECT COUNT(*) as total, SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END) as adminCount FROM users",
          ).get();
          db.prepare(
            "SELECT COUNT(*) as total, SUM(total) as totalRevenue, AVG(total) as avgOrderValue FROM orders",
          ).get();
          db.prepare(
            "SELECT o.*, u.name as user_name, p.name as product_name FROM orders o LEFT JOIN users u ON u.id = o.user_id LEFT JOIN products p ON p.id = o.product_id ORDER BY o.created_at DESC LIMIT 10",
          ).all();
        },
        iterations,
      ),
    );

    results.push(
      await bench(
        "SQLite: COUNT(*) products",
        async () => {
          db.prepare("SELECT COUNT(*) as count FROM products").get();
        },
        iterations * 3,
      ),
    );
  }

  const os = await import("node:os");
  const serverInfo = {
    node: process.version,
    platform: process.platform,
    arch: process.arch,
    cpuCount: os.cpus().length,
    memory: (os.totalmem() / 1024 / 1024 / 1024).toFixed(1) + " GB",
  };

  return { results, serverInfo };
}
