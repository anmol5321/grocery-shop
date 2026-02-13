const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
const dbPath = path.join(dataDir, 'inventory.db');
const db = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    sort_order INTEGER DEFAULT 0
  );
  CREATE TABLE IF NOT EXISTS items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category_id INTEGER NOT NULL REFERENCES categories(id),
    flavor TEXT,
    price REAL NOT NULL,
    image_url TEXT,
    stock INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );
`);

// Migrate old schema (items.category TEXT) to new (items.category_id)
const cols = db.prepare("PRAGMA table_info(items)").all().map((c) => c.name);
if (cols.includes('category') && !cols.includes('category_id')) {
  const distinct = db.prepare('SELECT DISTINCT category FROM items').all();
  db.exec('DELETE FROM categories');
  const insCat = db.prepare('INSERT INTO categories (name, sort_order) VALUES (?, ?)');
  const catNameToId = {};
  distinct.forEach((r, i) => {
    insCat.run(r.category, i);
    catNameToId[r.category] = db.prepare('SELECT last_insert_rowid()').pluck().get();
  });
  db.exec(`
    CREATE TABLE items_new (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category_id INTEGER NOT NULL,
      flavor TEXT,
      price REAL NOT NULL,
      image_url TEXT,
      stock INTEGER DEFAULT 0,
      created_at TEXT
    );
    INSERT INTO items_new (id, name, category_id, flavor, price, image_url, stock, created_at)
    SELECT id, name, (SELECT id FROM categories c WHERE c.name = items.category LIMIT 1), flavor, price, image_url, stock, created_at FROM items;
    DROP TABLE items;
    ALTER TABLE items_new RENAME TO items;
  `);
}

function getCategories() {
  const stmt = db.prepare('SELECT id, name, sort_order FROM categories ORDER BY sort_order, name');
  return stmt.all();
}

function getCategoryById(id) {
  const stmt = db.prepare('SELECT id, name, sort_order FROM categories WHERE id = ?');
  return stmt.get(id);
}

function createCategory({ name }) {
  const stmt = db.prepare('INSERT INTO categories (name) VALUES (?)');
  const result = stmt.run(String(name).trim() || 'Uncategorized');
  return result.lastInsertRowid;
}

function updateCategory(id, { name }) {
  const cat = getCategoryById(id);
  if (!cat) throw new Error('Category not found');
  const stmt = db.prepare('UPDATE categories SET name = ? WHERE id = ?');
  stmt.run(name !== undefined ? String(name).trim() : cat.name, id);
  return id;
}

function deleteCategory(id) {
  const cat = getCategoryById(id);
  if (!cat) throw new Error('Category not found');
  const other = db.prepare('SELECT id FROM categories WHERE id != ? LIMIT 1').get(id);
  if (other) {
    db.prepare('UPDATE items SET category_id = ? WHERE category_id = ?').run(other.id, id);
  } else {
    throw new Error('Cannot delete the only category. Add another category first.');
  }
  db.prepare('DELETE FROM categories WHERE id = ?').run(id);
  return id;
}

function getItems(categoryId = null) {
  if (categoryId != null && categoryId !== '') {
    const stmt = db.prepare(`
      SELECT i.*, c.name AS category_name
      FROM items i
      JOIN categories c ON c.id = i.category_id
      WHERE i.category_id = ?
      ORDER BY i.name
    `);
    return stmt.all(Number(categoryId));
  }
  const stmt = db.prepare(`
    SELECT i.*, c.name AS category_name
    FROM items i
    JOIN categories c ON c.id = i.category_id
    ORDER BY c.sort_order, c.name, i.name
  `);
  return stmt.all();
}

function getItemById(id) {
  const stmt = db.prepare(`
    SELECT i.*, c.name AS category_name
    FROM items i
    JOIN categories c ON c.id = i.category_id
    WHERE i.id = ?
  `);
  return stmt.get(id);
}

function createItem({ name, category_id, flavor, price, image_url, stock }) {
  const cid = Number(category_id);
  if (!cid) throw new Error('Category is required');
  const stmt = db.prepare(
    'INSERT INTO items (name, category_id, flavor, price, image_url, stock) VALUES (?, ?, ?, ?, ?, ?)'
  );
  const result = stmt.run(
    name || '',
    cid,
    flavor || '',
    Number(price) || 0,
    image_url || '',
    Number(stock) || 0
  );
  const row = getItemById(result.lastInsertRowid);
  return row.id;
}

function updateItem(id, { name, category_id, flavor, price, image_url, stock }) {
  const item = getItemById(id);
  if (!item) throw new Error('Item not found');
  const cid = category_id !== undefined ? Number(category_id) : item.category_id;
  const stmt = db.prepare(
    'UPDATE items SET name=?, category_id=?, flavor=?, price=?, image_url=?, stock=? WHERE id=?'
  );
  stmt.run(
    name !== undefined ? name : item.name,
    cid,
    flavor !== undefined ? flavor : item.flavor,
    price !== undefined ? Number(price) : item.price,
    image_url !== undefined ? image_url : item.image_url,
    stock !== undefined ? Number(stock) : item.stock,
    id
  );
  return id;
}

function deleteItem(id) {
  const stmt = db.prepare('DELETE FROM items WHERE id = ?');
  const result = stmt.run(id);
  if (result.changes === 0) throw new Error('Item not found');
}

const DEFAULT_CATEGORIES = ['Snacks', 'Biscuits', 'Masale', 'Chocolates'];
const SEED_ITEMS = [
  { name: 'Kurkure Masala', category_name: 'Snacks', flavor: 'Masala', price: 20, image_url: 'https://images.unsplash.com/photo-1613919113640-cb3ae4b3b2b6?w=200', stock: 50 },
  { name: 'Lays Classic', category_name: 'Snacks', flavor: 'Classic', price: 20, image_url: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=200', stock: 40 },
  { name: 'Bingo Mad Angles', category_name: 'Snacks', flavor: 'Tangy', price: 10, image_url: 'https://images.unsplash.com/photo-1599490659213-e2b9527bd087?w=200', stock: 60 },
  { name: 'Parle-G', category_name: 'Biscuits', flavor: 'Sweet', price: 10, image_url: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=200', stock: 100 },
  { name: 'Britannia Good Day', category_name: 'Biscuits', flavor: 'Butter', price: 30, image_url: 'https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?w=200', stock: 45 },
  { name: 'Oreo', category_name: 'Biscuits', flavor: 'Chocolate', price: 30, image_url: 'https://images.unsplash.com/photo-1612203985729-70726954388c?w=200', stock: 35 },
  { name: 'MDH Chana Masala', category_name: 'Masale', flavor: 'Spiced', price: 45, image_url: 'https://images.unsplash.com/photo-1596040033229-a0b2c2c1e9c8?w=200', stock: 25 },
  { name: 'Everest Garam Masala', category_name: 'Masale', flavor: 'Aromatic', price: 55, image_url: 'https://images.unsplash.com/photo-1506368249639-73a05d6f6488?w=200', stock: 30 },
  { name: 'MDH Pav Bhaji Masala', category_name: 'Masale', flavor: 'Pav Bhaji', price: 50, image_url: 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=200', stock: 20 },
  { name: 'Dairy Milk', category_name: 'Chocolates', flavor: 'Milk', price: 50, image_url: 'https://images.unsplash.com/photo-1511381939415-e44015466834?w=200', stock: 55 },
  { name: '5 Star', category_name: 'Chocolates', flavor: 'Chocolate', price: 20, image_url: 'https://images.unsplash.com/photo-1606312619070-d48b4c392a9d?w=200', stock: 70 },
  { name: 'KitKat', category_name: 'Chocolates', flavor: 'Wafer', price: 30, image_url: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=200', stock: 40 },
];

function seedIfEmpty() {
  const categories = getCategories();
  if (categories.length === 0) {
    const insCat = db.prepare('INSERT INTO categories (name, sort_order) VALUES (?, ?)');
    DEFAULT_CATEGORIES.forEach((name, i) => insCat.run(name, i));
    console.log('Seeded', DEFAULT_CATEGORIES.length, 'categories.');
  }
  const itemCount = db.prepare('SELECT COUNT(*) AS c FROM items').get().c;
  if (itemCount === 0 && getCategories().length > 0) {
    const catMap = {};
    getCategories().forEach((c) => { catMap[c.name] = c.id; });
    const insItem = db.prepare('INSERT INTO items (name, category_id, flavor, price, image_url, stock) VALUES (?, ?, ?, ?, ?, ?)');
    for (const row of SEED_ITEMS) {
      const cid = catMap[row.category_name] || catMap['Snacks'];
      insItem.run(row.name, cid, row.flavor, row.price, row.image_url, row.stock);
    }
    console.log('Seeded', SEED_ITEMS.length, 'sample items.');
  }
}

module.exports = {
  db,
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  getItems,
  getItemById,
  createItem,
  updateItem,
  deleteItem,
  seedIfEmpty,
};
