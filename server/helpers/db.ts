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

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!_db) {
    // Ensure data directory exists
    const dataDir = path.dirname(DB_PATH);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    _db = new Database(DB_PATH);
    _db.pragma("journal_mode = WAL");
    _db.pragma("busy_timeout = 5000");
    initSchema(_db);
    seedIfEmpty(_db);
  }
  return _db;
}

function initSchema(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      price REAL NOT NULL,
      stock INTEGER NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
    CREATE INDEX IF NOT EXISTS idx_products_price ON products(price);

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      role TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

    CREATE TABLE IF NOT EXISTS orders (
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
}

function seedIfEmpty(db: Database.Database): void {
  const row = db.prepare("SELECT COUNT(*) as count FROM products").get() as { count: number };
  if (row.count > 0) return;

  console.log("[db] Database empty — auto-seeding with benchmark data...");
  seed(db, 1000, 500, 5000);
  console.log("[db] Auto-seed complete (1000 products, 500 users, 5000 orders)");
}

function seed(db: Database.Database, productCount: number, userCount: number, orderCount: number): void {
  const PRODUCT_CATEGORIES = ["Electronics", "Clothing", "Food", "Books", "Sports"];
  const USER_ROLES = ["admin", "user", "moderator"];
  const ORDER_STATUSES = ["pending", "shipped", "delivered", "cancelled"];

  function randomId(): string {
    return Math.random().toString(36).substring(2, 15);
  }

  function randomDate(start: Date, end: Date): string {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime())).toISOString();
  }

  // Seed products
  const insertProduct = db.prepare("INSERT INTO products (id, name, category, price, stock, created_at) VALUES (?, ?, ?, ?, ?, ?)");
  const seedProducts = db.transaction(() => {
    for (let i = 0; i < productCount; i++) {
      insertProduct.run(
        randomId(),
        `Product ${i}`,
        PRODUCT_CATEGORIES[i % PRODUCT_CATEGORIES.length],
        Math.round(Math.random() * 1000 * 100) / 100,
        Math.floor(Math.random() * 500),
        randomDate(new Date("2023-01-01"), new Date()),
      );
    }
  });
  seedProducts();
  const productIds = db.prepare("SELECT id FROM products").all().map((r: any) => r.id);

  // Seed users
  const insertUser = db.prepare("INSERT INTO users (id, name, email, role, created_at) VALUES (?, ?, ?, ?, ?)");
  const seedUsers = db.transaction(() => {
    for (let i = 0; i < userCount; i++) {
      insertUser.run(
        randomId(),
        `User ${i}`,
        `user${i}@example.com`,
        USER_ROLES[i % USER_ROLES.length],
        randomDate(new Date("2023-01-01"), new Date()),
      );
    }
  });
  seedUsers();
  const userIds = db.prepare("SELECT id FROM users").all().map((r: any) => r.id);

  // Seed orders
  const insertOrder = db.prepare("INSERT INTO orders (id, user_id, product_id, qty, total, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)");
  const seedOrders = db.transaction(() => {
    for (let i = 0; i < orderCount; i++) {
      const productId = productIds[Math.floor(Math.random() * productIds.length)];
      const userId = userIds[Math.floor(Math.random() * userIds.length)];
      const qty = Math.floor(Math.random() * 10) + 1;
      insertOrder.run(
        randomId(),
        userId,
        productId,
        qty,
        Math.round(Math.random() * 5000 * 100) / 100,
        ORDER_STATUSES[Math.floor(Math.random() * ORDER_STATUSES.length)],
        randomDate(new Date("2024-01-01"), new Date()),
      );
    }
  });
  seedOrders();
}

export function closeDb(): void {
  if (_db) {
    _db.close();
    _db = null;
  }
}
