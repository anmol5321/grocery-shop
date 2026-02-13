const express = require('express');
const path = require('path');
const db = require('./db');

db.seedIfEmpty();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ----- Categories -----
app.get('/api/categories', (req, res) => {
  try {
    res.json(db.getCategories());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/categories', (req, res) => {
  try {
    const id = db.createCategory(req.body);
    const cat = db.getCategoryById(id);
    res.status(201).json(cat);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/categories/:id', (req, res) => {
  try {
    db.updateCategory(Number(req.params.id), req.body);
    res.json(db.getCategoryById(Number(req.params.id)));
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/categories/:id', (req, res) => {
  try {
    db.deleteCategory(Number(req.params.id));
    res.status(204).send();
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ----- Items -----
app.get('/api/items', (req, res) => {
  try {
    const categoryId = req.query.category_id;
    const items = db.getItems(categoryId || null);
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/items/:id', (req, res) => {
  try {
    const item = db.getItemById(Number(req.params.id));
    if (!item) return res.status(404).json({ error: 'Item not found' });
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/items', (req, res) => {
  try {
    const id = db.createItem(req.body);
    res.status(201).json(db.getItemById(id));
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/items/:id', (req, res) => {
  try {
    db.updateItem(Number(req.params.id), req.body);
    res.json(db.getItemById(Number(req.params.id)));
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/items/:id', (req, res) => {
  try {
    db.deleteItem(Number(req.params.id));
    res.status(204).send();
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Grocery inventory running at http://localhost:${PORT}`);
});
