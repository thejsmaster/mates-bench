import { html, asyncAction, pathAtom, date, stylesheet } from "mates";
import type { Props } from "mates";
import { getProductStats, getCategories } from "../server/api/products.ts";
import { getUserStats } from "../server/api/users.ts";
import { getOrderStats, getRecentOrders } from "../server/api/orders.ts";
import { BenchPage } from "./BenchPage.ts";

const { css: cl, mount: mountStyles } = stylesheet();

const _ = cl({
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "1rem",
    margin: "1rem 0",
  },
  card: {
    background: "white",
    borderRadius: "8px",
    padding: "1rem",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
  },
  cardH3: {
    margin: "0 0 0.5rem",
    color: "#666",
    fontSize: "0.875rem",
    textTransform: "uppercase",
  },
  cardValue: {
    fontSize: "1.5rem",
    fontWeight: "bold",
    color: "#222",
  },
  section: {
    margin: "2rem 0",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    background: "white",
    borderRadius: "8px",
    overflow: "hidden",
  },
  th: {
    padding: "0.5rem 1rem",
    textAlign: "left",
    borderBottom: "1px solid #eee",
    background: "#fafafa",
    fontWeight: 600,
  },
  td: {
    padding: "0.5rem 1rem",
    textAlign: "left",
    borderBottom: "1px solid #eee",
  },
  h1: {
    color: "#333",
  },
  body: {
    fontFamily: "system-ui, sans-serif",
    margin: "2rem",
    background: "#f5f5f5",
  },
});

let t = date().format("hh:mm:ss");
export const App = (_p: Props<{}>) => {
  // If on /bench, render the BenchPage directly
  if (pathAtom() === "/bench") {
    return BenchPage(_p);
  }

  mountStyles();

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
    <h1 class="${cl.h1}">SSR Benchmark Dashboard</h1>

    <div class="${cl.section}">
      <h2>Products</h2>
      <div class="${cl.grid}">
        <div class="${cl.card}">
          <h3 class="${cl.cardH3}">Total Products</h3>
          <div class="${cl.cardValue}">${productStats.data?.()?.total ?? "..."}</div>
        </div>
        <div class="${cl.card}">
          <h3 class="${cl.cardH3}">Categories</h3>
          <div class="${cl.cardValue}">
            ${productStats.data?.()?.categories ?? "..."}
          </div>
        </div>
        <div class="${cl.card}">
          <h3 class="${cl.cardH3}">Avg Price</h3>
          <div class="${cl.cardValue}">
            $${productStats.data?.()?.avgPrice ?? "..."}
          </div>
        </div>
        <div class="${cl.card}">
          <h3 class="${cl.cardH3}">Total Stock</h3>
          <div class="${cl.cardValue}">
            ${productStats.data?.()?.totalStock ?? "..."}
          </div>
        </div>
      </div>
    </div>

    <div class="${cl.section}">
      <h2>Users</h2>
      <div class="${cl.grid}">
        <div class="${cl.card}">
          <h3 class="${cl.cardH3}">Total Users</h3>
          <div class="${cl.cardValue}">${userStats.data?.()?.total ?? "..."}</div>
        </div>
        <div class="${cl.card}">
          <h3 class="${cl.cardH3}">Admins</h3>
          <div class="${cl.cardValue}">
            ${userStats.data?.()?.adminCount ?? "..."}
          </div>
        </div>
        <div class="${cl.card}">
          <h3 class="${cl.cardH3}">Users</h3>
          <div class="${cl.cardValue}">${userStats.data?.()?.userCount ?? "..."}</div>
        </div>
        <div class="${cl.card}">
          <h3 class="${cl.cardH3}">Moderators</h3>
          <div class="${cl.cardValue}">
            ${userStats.data?.()?.moderatorCount ?? "..."}
          </div>
        </div>
      </div>
    </div>

    <div class="${cl.section}">
      <h2>Orders</h2>
      <div class="${cl.grid}">
        <div class="${cl.card}">
          <h3 class="${cl.cardH3}">Total Orders</h3>
          <div class="${cl.cardValue}">${orderStats.data?.()?.total ?? "..."}</div>
        </div>
        <div class="${cl.card}">
          <h3 class="${cl.cardH3}">Revenue</h3>
          <div class="${cl.cardValue}">
            $${orderStats.data?.()?.totalRevenue ?? "..."}
          </div>
        </div>
        <div class="${cl.card}">
          <h3 class="${cl.cardH3}">Avg Order</h3>
          <div class="${cl.cardValue}">
            $${orderStats.data?.()?.avgOrderValue ?? "..."}
          </div>
        </div>
        <div class="${cl.card}">
          <h3 class="${cl.cardH3}">Pending</h3>
          <div class="${cl.cardValue}">
            ${orderStats.data?.()?.pendingCount ?? "..."}
          </div>
        </div>
        <div class="${cl.card}">
          <h3 class="${cl.cardH3}">Shipped</h3>
          <div class="${cl.cardValue}">
            ${orderStats.data?.()?.shippedCount ?? "..."}
          </div>
        </div>
        <div class="${cl.card}">
          <h3 class="${cl.cardH3}">Delivered</h3>
          <div class="${cl.cardValue}">
            ${orderStats.data?.()?.deliveredCount ?? "..."}
          </div>
        </div>
        <div class="${cl.card}">
          <h3 class="${cl.cardH3}">Cancelled</h3>
          <div class="${cl.cardValue}">
            ${orderStats.data?.()?.cancelledCount ?? "..."}
          </div>
        </div>
      </div>
    </div>

    <div class="${cl.section}">
      <h2>Categories</h2>
      <ul>
        ${(categories.data?.() ?? []).map(
          (cat: string) => html`<li>${cat}</li>`,
        )}
      </ul>
    </div>

    <div class="${cl.section}">
      <h2>Recent Orders</h2>
      <table class="${cl.table}">
        <thead>
          <tr>
            <th class="${cl.th}">ID</th>
            <th class="${cl.th}">User</th>
            <th class="${cl.th}">Product</th>
            <th class="${cl.th}">Qty</th>
            <th class="${cl.th}">Total</th>
            <th class="${cl.th}">Status</th>
            <th class="${cl.th}">Date</th>
          </tr>
        </thead>
        <tbody>
          ${(recentOrders.data?.() ?? []).map(
            (o: any) => html`<tr>
              <td class="${cl.td}">${o.id?.slice(0, 8)}</td>
              <td class="${cl.td}">${o.user_name ?? "N/A"}</td>
              <td class="${cl.td}">${o.product_name ?? "N/A"}</td>
              <td class="${cl.td}">${o.qty}</td>
              <td class="${cl.td}">$${o.total}</td>
              <td class="${cl.td}">${o.status}</td>
              <td class="${cl.td}">${o.created_at?.slice(0, 10)}</td>
            </tr>`,
          )}
        </tbody>
      </table>
    </div>
  `;
};

export default App;