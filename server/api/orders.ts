import { getDb } from "../helpers/db.js";

interface Order {
  id: string;
  user_id: string;
  product_id: string;
  qty: number;
  total: number;
  status: string;
  created_at: string;
}

export async function listOrders(payload: {
  page?: number;
  limit?: number;
  status?: string;
  userId?: string;
  sortDir?: "asc" | "desc";
}): Promise<{ orders: Order[]; total: number; page: number }> {
  const db = getDb();
  const page = payload.page ?? 1;
  const limit = Math.min(payload.limit ?? 20, 100);
  const offset = (page - 1) * limit;

  const conditions: string[] = [];
  const params: any[] = [];
  if (payload.status) { conditions.push("o.status = ?"); params.push(payload.status); }
  if (payload.userId) { conditions.push("o.user_id = ?"); params.push(payload.userId); }

  const where = conditions.length > 0 ? "WHERE " + conditions.join(" AND ") : "";
  const sortDir = payload.sortDir ?? "desc";

  const total = (db.prepare(`SELECT COUNT(*) as count FROM orders o ${where}`).get(...params) as any).count;
  const orders = db.prepare(`
    SELECT o.*, u.name as user_name, p.name as product_name
    FROM orders o
    LEFT JOIN users u ON u.id = o.user_id
    LEFT JOIN products p ON p.id = o.product_id
    ${where}
    ORDER BY o.created_at ${sortDir}
    LIMIT ? OFFSET ?
  `).all(...params, limit, offset) as Order[];
  return { orders, total, page };
}

export async function getOrderStats(): Promise<{
  total: number;
  totalRevenue: number;
  avgOrderValue: number;
  pendingCount: number;
  shippedCount: number;
  deliveredCount: number;
  cancelledCount: number;
}> {
  const db = getDb();
  const stats = db.prepare(`
    SELECT
      COUNT(*) as total,
      SUM(total) as totalRevenue,
      AVG(total) as avgOrderValue,
      SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pendingCount,
      SUM(CASE WHEN status = 'shipped' THEN 1 ELSE 0 END) as shippedCount,
      SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) as deliveredCount,
      SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelledCount
    FROM orders
  `).get() as any;
  return {
    ...stats,
    totalRevenue: Math.round(stats.totalRevenue * 100) / 100,
    avgOrderValue: Math.round(stats.avgOrderValue * 100) / 100,
  };
}

export async function getRecentOrders(payload: { limit?: number }): Promise<Order[]> {
  const db = getDb();
  const limit = Math.min(payload.limit ?? 10, 50);
  return db.prepare(`
    SELECT o.*, u.name as user_name, p.name as product_name
    FROM orders o
    LEFT JOIN users u ON u.id = o.user_id
    LEFT JOIN products p ON p.id = o.product_id
    ORDER BY o.created_at DESC LIMIT ?
  `).all(limit) as Order[];
}
