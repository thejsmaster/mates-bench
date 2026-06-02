import { getDb } from "../helpers/db.js";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  created_at: string;
}

export async function listUsers(payload: {
  page?: number;
  limit?: number;
  role?: string;
}): Promise<{ users: User[]; total: number; page: number }> {
  const db = getDb();
  const page = payload.page ?? 1;
  const limit = Math.min(payload.limit ?? 20, 100);
  const offset = (page - 1) * limit;

  let where = "";
  const params: any[] = [];
  if (payload.role) {
    where = "WHERE role = ?";
    params.push(payload.role);
  }

  const total = (db.prepare(`SELECT COUNT(*) as count FROM users ${where}`).get(...params) as any).count;
  const users = db.prepare(`SELECT * FROM users ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`).all(...params, limit, offset) as User[];
  return { users, total, page };
}

export async function getUserStats(): Promise<{
  total: number;
  adminCount: number;
  userCount: number;
  moderatorCount: number;
}> {
  const db = getDb();
  const stats = db.prepare(`
    SELECT
      COUNT(*) as total,
      SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END) as adminCount,
      SUM(CASE WHEN role = 'user' THEN 1 ELSE 0 END) as userCount,
      SUM(CASE WHEN role = 'moderator' THEN 1 ELSE 0 END) as moderatorCount
    FROM users
  `).get() as any;
  return stats;
}
