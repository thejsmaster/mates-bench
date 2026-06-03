/**
 * Standalone seed script.
 * Run: npm run seed [products] [users] [orders]
 *
 * Deletes all existing data and re-seeds the database with fresh random data.
 */
import Database from "better-sqlite3";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function findProjectRoot(dir: string): string {
  const root = path.parse(dir).root;
  let current = dir;
  while (current !== root) {
    if (fs.existsSync(path.join(current, "package.json"))) return current;
    current = path.dirname(current);
  }
  return dir;
}

const PROJECT_ROOT = findProjectRoot(__dirname);
const DB_PATH = path.resolve(PROJECT_ROOT, "data/bench.db");

const PRODUCT_CATEGORIES = ["Electronics", "Clothing", "Food", "Books", "Sports"];
const USER_ROLES = ["admin", "user", "moderator"];
const ORDER_STATUSES = ["pending", "shipped", "delivered", "cancelled"];

function randomId(): string {
  return Math.random().toString(36).substring(2, 15);
}

function randomDate(start: Date, end: Date): string {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime())).toISOString();
}

function seedProducts(db: any, count: number): void {
  const insert = db.prepare("INSERT INTO products (id, name, category, price, stock, created_at) VALUES (?, ?, ?, ?, ?, ?)");
  const insertMany = db.transaction((items: any[]) => {
    for (const item of items) insert.run(...Object.values(item));
  });

  const items = [];
  for (let i = 0; i < count; i++) {
    items.push({
      id: randomId(),
      name: `Product ${i}`,
      category: PRODUCT_CATEGORIES[i % PRODUCT_CATEGORIES.length],
      price: Math.round(Math.random() * 1000 * 100) / 100,
      stock: Math.floor(Math.random() * 500),
      created_at: randomDate(new Date("2023-01-01"), new Date()),
    });
  }
  insertMany(items);
}

function seedUsers(db: any, count: number): void {
  const insert = db.prepare("INSERT INTO users (id, name, email, role, created_at) VALUES (?, ?, ?, ?, ?)");
  const insertMany = db.transaction((items: any[]) => {
    for (const item of items) insert.run(...Object.values(item));
  });

  const items = [];
  for (let i = 0; i < count; i++) {
    items.push({
      id: randomId(),
      name: `User ${i}`,
      email: `user${i}@example.com`,
      role: USER_ROLES[i % USER_ROLES.length],
      created_at: randomDate(new Date("2023-01-01"), new Date()),
    });
  }
  insertMany(items);
}

function seedOrders(db: any, count: number, productIds: string[], userIds: string[]): void {
  const insert = db.prepare("INSERT INTO orders (id, user_id, product_id, qty, total, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)");
  const insertMany = db.transaction((items: any[]) => {
    for (const item of items) insert.run(...Object.values(item));
  });

  const items = [];
  for (let i = 0; i < count; i++) {
    const productId = productIds[Math.floor(Math.random() * productIds.length)];
    const userId = userIds[Math.floor(Math.random() * userIds.length)];
    const qty = Math.floor(Math.random() * 10) + 1;
    items.push({
      id: randomId(),
      user_id: userId,
      product_id: productId,
      qty,
      total: Math.round(Math.random() * 5000 * 100) / 100,
      status: ORDER_STATUSES[Math.floor(Math.random() * ORDER_STATUSES.length)],
      created_at: randomDate(new Date("2024-01-01"), new Date()),
    });
  }
  insertMany(items);
}

async function main() {
  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");

  const productCount = parseInt(process.argv[2] || "1000", 10);
  const userCount = parseInt(process.argv[3] || "500", 10);
  const orderCount = parseInt(process.argv[4] || "5000", 10);

  console.log(`Seeding database at ${DB_PATH}...`);

  db.exec("DROP TABLE IF EXISTS orders; DROP TABLE IF EXISTS products; DROP TABLE IF EXISTS users;");

  // Recreate schema
  db.exec(`
    CREATE TABLE products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      price REAL NOT NULL,
      stock INTEGER NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
    CREATE INDEX IF NOT EXISTS idx_products_price ON products(price);

    CREATE TABLE users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      role TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

    CREATE TABLE orders (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      qty INTEGER NOT NULL,
      total REAL NOT NULL,
      status TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (product_id) REFERENCES products(id)
    );
    CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
    CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
    CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at);
  `);

  seedProducts(db, productCount);
  const productIds = db.prepare("SELECT id FROM products").all().map((r: any) => r.id);
  console.log(`  ${productCount} products`);

  seedUsers(db, userCount);
  const userIds = db.prepare("SELECT id FROM users").all().map((r: any) => r.id);
  console.log(`  ${userCount} users`);

  seedOrders(db, orderCount, productIds, userIds);
  console.log(`  ${orderCount} orders`);

  db.close();
  console.log("Done.");
}

main().catch(console.error);
