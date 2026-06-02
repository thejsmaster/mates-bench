// client/BenchPage.ts
// Benchmark page — click a button to run SSR benchmarks on the server.

import { html, asyncAction, atom } from "mates";
import { runBenchmarks } from "../server/api/benchmark.ts";

interface BenchResult {
  name: string;
  iterations: number;
  avgMs: number;
  minMs: number;
  maxMs: number;
  ops: number;
}

export const BenchPage = () => {
  const results = atom<BenchResult[] | null>(null);
  const serverInfo = atom<Record<string, unknown> | null>(null);
  const running = atom(false);
  const error = atom<string | null>(null);

  const run = asyncAction(async () => {
    running.set(true);
    error.set(null);
    results.set(null);
    serverInfo.set(null);
    try {
      const res = await runBenchmarks({ iterations: 30 });
      results.set(res.results);
      serverInfo.set(res.serverInfo);
    } catch (e: any) {
      error.set(e?.message ?? String(e));
    }
    running.set(false);
  });

  return () => html`
    <div style="font-family:system-ui,sans-serif;max-width:800px;margin:2rem auto;padding:0 1rem">
      <h1>SSR Benchmark</h1>
      <p>Runs SSR renders with SQLite queries and measures end-to-end time.</p>

      <button
        @click=${run}
        ?disabled=${running()}
        style="padding:0.75rem 2rem;font-size:1rem;background:#0066cc;color:white;border:none;border-radius:6px;cursor:pointer;${running() ? 'opacity:0.6' : ''}"
      >
        ${running() ? "Running..." : "Run Benchmarks"}
      </button>

      ${error()
        ? html`<div style="margin-top:1rem;padding:1rem;background:#fee;border-radius:6px;color:#c00">Error: ${error()}</div>`
        : ""}

      ${serverInfo()
        ? html`
          <div style="margin-top:1rem;padding:0.75rem;background:#f5f5f5;border-radius:6px;font-size:0.85rem">
            <strong>Server:</strong>
            Node ${serverInfo()?.node} · ${serverInfo()?.cpuCount} CPUs · ${serverInfo()?.memory} RAM · ${serverInfo()?.platform}
          </div>
        `
        : ""}

      ${results()
        ? html`
          <table style="margin-top:1.5rem;width:100%;border-collapse:collapse;background:white;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1)">
            <thead>
              <tr style="background:#fafafa">
                <th style="padding:0.75rem 1rem;text-align:left;border-bottom:2px solid #eee">Benchmark</th>
                <th style="padding:0.75rem 1rem;text-align:right;border-bottom:2px solid #eee">Runs</th>
                <th style="padding:0.75rem 1rem;text-align:right;border-bottom:2px solid #eee">Avg (ms)</th>
                <th style="padding:0.75rem 1rem;text-align:right;border-bottom:2px solid #eee">Min (ms)</th>
                <th style="padding:0.75rem 1rem;text-align:right;border-bottom:2px solid #eee">Max (ms)</th>
                <th style="padding:0.75rem 1rem;text-align:right;border-bottom:2px solid #eee">Ops/s</th>
              </tr>
            </thead>
            <tbody>
              ${results()!.map(
                (r: BenchResult) => html`
                  <tr>
                    <td style="padding:0.75rem 1rem;border-bottom:1px solid #eee">${r.name}</td>
                    <td style="padding:0.75rem 1rem;text-align:right;border-bottom:1px solid #eee">${r.iterations}</td>
                    <td style="padding:0.75rem 1rem;text-align:right;border-bottom:1px solid #eee;font-weight:bold">${r.avgMs}</td>
                    <td style="padding:0.75rem 1rem;text-align:right;border-bottom:1px solid #eee">${r.minMs}</td>
                    <td style="padding:0.75rem 1rem;text-align:right;border-bottom:1px solid #eee">${r.maxMs}</td>
                    <td style="padding:0.75rem 1rem;text-align:right;border-bottom:1px solid #eee;font-weight:bold">${r.ops}</td>
                  </tr>
                `,
              )}
            </tbody>
          </table>
        `
        : ""}

      <p style="margin-top:1rem;font-size:0.85rem;color:#888">
        Benchmarks run server-side via <code>renderToString()</code>.
        Results do not include network overhead.
      </p>
    </div>
  `;
};
