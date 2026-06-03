import { html, asyncAction, atom, on, pathAtom, date } from "mates";
import type { Props } from "mates";
import { getProductStats, getCategories } from "../server/api/products.ts";
import { getUserStats } from "../server/api/users.ts";
import { getOrderStats, getRecentOrders } from "../server/api/orders.ts";
import { BenchPage } from "./BenchPage.ts";

let t = date().format("hh:mm:ss");
export const App = (_: Props<{}>) => {
  // If on /bench, render the BenchPage directly
  if (pathAtom() === "/bench") {
    return BenchPage(_);
  }

  console.log(t);

  t = date().format("hh:mm:ss");

  const productStats = asyncAction(() => getProductStats());
  const categories = asyncAction(() => getCategories());
  const userStats = asyncAction(() => getUserStats());
  const orderStats = asyncAction(() => getOrderStats());
  const recentOrders = asyncAction(() => getRecentOrders({ limit: 10 }));

  productStats();
  categories();
  userStats();
  orderStats();
  recentOrders();

  return () => html`
    <html>
      <head>
        <title>SSR Benchmark</title>
        <style>
          body {
            font-family: system-ui, sans-serif;
            margin: 2rem;
            background: #f5f5f5;
          }
          h1 {
            color: #333;
          }
          .grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1rem;
            margin: 1rem 0;
          }
          .card {
            background: white;
            border-radius: 8px;
            padding: 1rem;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          }
          .card h3 {
            margin: 0 0 0.5rem;
            color: #666;
            font-size: 0.875rem;
            text-transform: uppercase;
          }
          .card .value {
            font-size: 1.5rem;
            font-weight: bold;
            color: #222;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            background: white;
            border-radius: 8px;
            overflow: hidden;
          }
          th,
          td {
            padding: 0.5rem 1rem;
            text-align: left;
            border-bottom: 1px solid #eee;
          }
          th {
            background: #fafafa;
            font-weight: 600;
          }
          .section {
            margin: 2rem 0;
          }
        </style>
      </head>
      <body>
        <h1>SSR Benchmark Dashboard</h1>

        <div class="section">
          <h2>Products</h2>
          <div class="grid">
            <div class="card">
              <h3>Total Products</h3>
              <div class="value">${productStats.data?.()?.total ?? "..."}</div>
            </div>
            <div class="card">
              <h3>Categories</h3>
              <div class="value">
                ${productStats.data?.()?.categories ?? "..."}
              </div>
            </div>
            <div class="card">
              <h3>Avg Price</h3>
              <div class="value">
                $${productStats.data?.()?.avgPrice ?? "..."}
              </div>
            </div>
            <div class="card">
              <h3>Total Stock</h3>
              <div class="value">
                ${productStats.data?.()?.totalStock ?? "..."}
              </div>
            </div>
          </div>
        </div>

        <div class="section">
          <h2>Users</h2>
          <div class="grid">
            <div class="card">
              <h3>Total Users</h3>
              <div class="value">${userStats.data?.()?.total ?? "..."}</div>
            </div>
            <div class="card">
              <h3>Admins</h3>
              <div class="value">
                ${userStats.data?.()?.adminCount ?? "..."}
              </div>
            </div>
            <div class="card">
              <h3>Users</h3>
              <div class="value">${userStats.data?.()?.userCount ?? "..."}</div>
            </div>
            <div class="card">
              <h3>Moderators</h3>
              <div class="value">
                ${userStats.data?.()?.moderatorCount ?? "..."}
              </div>
            </div>
          </div>
        </div>

        <div class="section">
          <h2>Orders</h2>
          <div class="grid">
            <div class="card">
              <h3>Total Orders</h3>
              <div class="value">${orderStats.data?.()?.total ?? "..."}</div>
            </div>
            <div class="card">
              <h3>Revenue</h3>
              <div class="value">
                $${orderStats.data?.()?.totalRevenue ?? "..."}
              </div>
            </div>
            <div class="card">
              <h3>Avg Order</h3>
              <div class="value">
                $${orderStats.data?.()?.avgOrderValue ?? "..."}
              </div>
            </div>
            <div class="card">
              <h3>Pending</h3>
              <div class="value">
                ${orderStats.data?.()?.pendingCount ?? "..."}
              </div>
            </div>
            <div class="card">
              <h3>Shipped</h3>
              <div class="value">
                ${orderStats.data?.()?.shippedCount ?? "..."}
              </div>
            </div>
            <div class="card">
              <h3>Delivered</h3>
              <div class="value">
                ${orderStats.data?.()?.deliveredCount ?? "..."}
              </div>
            </div>
            <div class="card">
              <h3>Cancelled</h3>
              <div class="value">
                ${orderStats.data?.()?.cancelledCount ?? "..."}
              </div>
            </div>
          </div>
        </div>

        <div class="section">
          <h2>Categories</h2>
          <ul>
            ${(categories.data?.() ?? []).map(
              (cat: string) => html`<li>${cat}</li>`,
            )}
          </ul>
        </div>

        <div class="section">
          <h2>Recent Orders</h2>
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>User</th>
                <th>Product</th>
                <th>Qty</th>
                <th>Total</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              ${(recentOrders.data?.() ?? []).map(
                (o: any) => html`
                  <tr>
                    <td>${o.id?.slice(0, 8)}</td>
                    <td>${o.user_name ?? "N/A"}</td>
                    <td>${o.product_name ?? "N/A"}</td>
                    <td>${o.qty}</td>
                    <td>$${o.total}</td>
                    <td>${o.status}</td>
                    <td>${o.created_at?.slice(0, 10)}</td>
                  </tr>
                `,
              )}
            </tbody>
          </table>
        </div>
      </body>
    </html>
  `;
};

export default App;
