import { getDb, closeDb } from "./db.js";

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
  console.log("Seeding database...");
  const db = getDb();

  const productCount = parseInt(process.argv[2] || "1000", 10);
  const userCount = parseInt(process.argv[3] || "500", 10);
  const orderCount = parseInt(process.argv[4] || "5000", 10);

  db.exec("DELETE FROM orders; DELETE FROM products; DELETE FROM users;");

  seedProducts(db, productCount);
  const productIds = db.prepare("SELECT id FROM products").all().map((r: any) => r.id);
  console.log(`  ${productCount} products`);

  seedUsers(db, userCount);
  const userIds = db.prepare("SELECT id FROM users").all().map((r: any) => r.id);
  console.log(`  ${userCount} users`);

  seedOrders(db, orderCount, productIds, userIds);
  console.log(`  ${orderCount} orders`);

  closeDb();
  console.log("Done.");
}

main().catch(console.error);
