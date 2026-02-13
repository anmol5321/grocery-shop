const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const dbPath = path.join(dataDir, 'inventory.db');
const db = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    flavor TEXT,
    price REAL NOT NULL,
    image_url TEXT,
    stock INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  )
`);

// Seed data: snacks, biscuits, masale, chocolates
const seed = [
  { name: 'Kurkure Masala', category: 'Snacks', flavor: 'Masala', price: 20, image_url: 'https://images.unsplash.com/photo-1613919113640-cb3ae4b3b2b6?w=200', stock: 50 },
  { name: 'Lays Classic', category: 'Snacks', flavor: 'Classic', price: 20, image_url: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=200', stock: 40 },
  { name: 'Bingo Mad Angles', category: 'Snacks', flavor: 'Tangy', price: 10, image_url: 'https://images.unsplash.com/photo-1599490659213-e2b9527bd087?w=200', stock: 60 },
  { name: 'Parle-G', category: 'Biscuits', flavor: 'Sweet', price: 10, image_url: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=200', stock: 100 },
  { name: 'Britannia Good Day', category: 'Biscuits', flavor: 'Butter', price: 30, image_url: 'https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?w=200', stock: 45 },
  { name: 'Oreo', category: 'Biscuits', flavor: 'Chocolate', price: 30, image_url: 'https://images.unsplash.com/photo-1612203985729-70726954388c?w=200', stock: 35 },
  { name: 'MDH Chana Masala', category: 'Masale', flavor: 'Spiced', price: 45, image_url: 'https://images.unsplash.com/photo-1596040033229-a0b2c2c1e9c8?w=200', stock: 25 },
  { name: 'Everest Garam Masala', category: 'Masale', flavor: 'Aromatic', price: 55, image_url: 'https://images.unsplash.com/photo-1506368249639-73a05d6f6488?w=200', stock: 30 },
  { name: 'MDH Pav Bhaji Masala', category: 'Masale', flavor: 'Pav Bhaji', price: 50, image_url: 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=200', stock: 20 },
  { name: 'Dairy Milk', category: 'Chocolates', flavor: 'Milk', price: 50, image_url: 'https://images.unsplash.com/photo-1511381939415-e44015466834?w=200', stock: 55 },
  { name: '5 Star', category: 'Chocolates', flavor: 'Chocolate', price: 20, image_url: 'https://images.unsplash.com/photo-1606312619070-d48b4c392a9d?w=200', stock: 70 },
  { name: 'KitKat', category: 'Chocolates', flavor: 'Wafer', price: 30, image_url: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=200', stock: 40 },
];

const insert = db.prepare(
  'INSERT INTO items (name, category, flavor, price, image_url, stock) VALUES (?, ?, ?, ?, ?, ?)'
);
const count = db.prepare('SELECT COUNT(*) as c FROM items').get();
if (count.c === 0) {
  const insertMany = db.transaction((rows) => {
    for (const row of rows) insert.run(row.name, row.category, row.flavor, row.price, row.image_url, row.stock);
  });
  insertMany(seed);
  console.log('Seeded', seed.length, 'items.');
} else {
  console.log('Database already has data. Skipping seed.');
}
db.close();
