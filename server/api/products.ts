import { getDb } from "../helpers/db.js";

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  created_at: string;
}

export async function listProducts(payload: {
  page?: number;
  limit?: number;
  category?: string;
  sortBy?: string;
  sortDir?: "asc" | "desc";
}): Promise<{ products: Product[]; total: number; page: number }> {
  const db = getDb();
  const page = payload.page ?? 1;
  const limit = Math.min(payload.limit ?? 20, 100);
  const offset = (page - 1) * limit;

  let where = "";
  const params: any[] = [];
  if (payload.category) {
    where = "WHERE category = ?";
    params.push(payload.category);
  }

  const sortBy = payload.sortBy ?? "created_at";
  const sortDir = payload.sortDir ?? "desc";
  const orderBy = `ORDER BY ${sortBy} ${sortDir}`;

  const total = (db.prepare(`SELECT COUNT(*) as count FROM products ${where}`).get(...params) as any).count;
  const products = db.prepare(`SELECT * FROM products ${where} ${orderBy} LIMIT ? OFFSET ?`).all(...params, limit, offset) as Product[];

  return { products, total, page };
}

export async function getProduct(payload: { id: string }): Promise<Product | null> {
  const db = getDb();
  return (db.prepare("SELECT * FROM products WHERE id = ?").get(payload.id) as Product) ?? null;
}

export async function getCategories(): Promise<string[]> {
  const db = getDb();
  return (db.prepare("SELECT DISTINCT category FROM products ORDER BY category").all() as any[]).map(r => r.category);
}

export async function getProductStats(): Promise<{
  total: number;
  avgPrice: number;
  totalStock: number;
  categories: number;
}> {
  const db = getDb();
  const stats = db.prepare(`
    SELECT COUNT(*) as total, AVG(price) as avgPrice, SUM(stock) as totalStock, COUNT(DISTINCT category) as categories
    FROM products
  `).get() as any;
  return {
    total: stats.total,
    avgPrice: Math.round(stats.avgPrice * 100) / 100,
    totalStock: stats.totalStock,
    categories: stats.categories,
  };
}

export async function searchProducts(payload: { q: string; limit?: number }): Promise<Product[]> {
  const db = getDb();
  const limit = Math.min(payload.limit ?? 10, 50);
  const q = `%${payload.q}%`;
  return db.prepare("SELECT * FROM products WHERE name LIKE ? OR category LIKE ? LIMIT ?").all(q, q, limit) as Product[];
}

export async function getProductsByCategory(payload: { category: string }): Promise<{
  category: string;
  products: Product[];
  count: number;
  avgPrice: number;
}> {
  const db = getDb();
  const products = db.prepare("SELECT * FROM products WHERE category = ? ORDER BY price ASC").all(payload.category) as Product[];
  const stats = db.prepare("SELECT COUNT(*) as count, AVG(price) as avgPrice FROM products WHERE category = ?").get(payload.category) as any;
  return {
    category: payload.category,
    products,
    count: stats.count,
    avgPrice: Math.round(stats.avgPrice * 100) / 100,
  };
}
