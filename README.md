# Grocery Shop Inventory

A simple inventory manager for a grocery shop: **Snacks**, **Biscuits**, **Masale**, and **Chocolates**. View items with image, price, and flavor; add, edit, and delete items. Easy to run and deploy on any server with Node.js.

## Features

- **List view**: All items with image, name, category, flavor, and price (₹)
- **Categories**: Filter by Snacks, Biscuits, Masale, Chocolates
- **Manage inventory**: Add, edit, delete items
- **SQLite database**: No separate database server; data stored in `data/inventory.db`
- **Sample data**: Auto-seeded on first run

## Quick start (local)

```bash
# Install dependencies
npm install

# Start server (creates DB and seeds sample data on first run)
npm start
```

Open **http://localhost:3000** in your browser.

---

## Host easily (recommended)

The easiest way to get your app online is to use a platform that deploys from Git. Both options below give you a public URL in minutes.

### Option A: Railway (simple, free tier)

1. **Push your project to GitHub** (if not already):
   ```bash
   git init
   git add .
   git commit -m "Grocery inventory app"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/grocery-shop.git
   git push -u origin main
   ```

2. Go to [railway.app](https://railway.app) and sign in with GitHub.

3. Click **New Project** → **Deploy from GitHub repo** → choose your `grocery-shop` repo.

4. Railway will detect Node.js. It will run `npm install` and `npm start` automatically. No extra config needed.

5. Click your service → **Settings** → **Networking** → **Generate Domain**. You’ll get a URL like `https://grocery-shop-production-xxxx.up.railway.app`.

6. **(Optional)** To keep your SQLite data across deploys, add a **Volume**:  
   **Variables** → **Add Volume** → mount path `/app/data`. Your DB file will persist in `data/inventory.db`.

**Done.** Open the generated URL on your phone or desktop.

---

### Option B: Render (free tier)

1. Push your project to GitHub (same as step 1 above).

2. Go to [render.com](https://render.com) and sign in with GitHub.

3. Click **New +** → **Web Service**. Connect your `grocery-shop` repo.

4. Use these settings:
   - **Build command:** `npm install`
   - **Start command:** `npm start`
   - **Instance type:** Free

5. Click **Create Web Service**. Render will build and deploy. Your app will be at `https://grocery-shop-xxxx.onrender.com`.

**Note:** On the free tier, the disk is ephemeral, so SQLite data can reset when the app sleeps or redeploys. For long-term data, use Railway with a Volume, or a paid Render plan with a persistent disk.

---

### Quick comparison

| | Railway | Render |
|---|--------|--------|
| **Free tier** | Yes | Yes |
| **Persistent SQLite** | Yes (add Volume) | No on free tier |
| **Setup** | Connect repo, add domain | Connect repo, set start command |
| **Best for** | Keeping data | Trying out / demos |

---

## Deploy on your own server (VPS)

### 1. Copy project to server

Upload the project folder (e.g. via Git, SCP, or FTP):

```bash
git clone <your-repo-url> grocery-shop
cd grocery-shop
```

### 2. Install and run

```bash
npm install --production
npm start
```

The app listens on `PORT` environment variable or **3000** by default.

### 3. Use a process manager (recommended)

**PM2** (Node process manager):

```bash
npm install -g pm2
PORT=3000 pm2 start server.js --name grocery-inventory
pm2 save
pm2 startup   # run the command it prints to start on boot
```

**systemd** (Linux):

Create `/etc/systemd/system/grocery-inventory.service`:

```ini
[Unit]
Description=Grocery Shop Inventory
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/path/to/grocery-shop
Environment=PORT=3000
ExecStart=/usr/bin/node server.js
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

Then:

```bash
sudo systemctl daemon-reload
sudo systemctl enable grocery-inventory
sudo systemctl start grocery-inventory
```

### 4. Reverse proxy (optional)

To serve behind Nginx on port 80:

```nginx
server {
  listen 80;
  server_name your-domain.com;
  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
  }
}
```

## Environment

| Variable | Description |
|----------|-------------|
| `PORT`   | Port to listen on (default: 3000) |

## Project structure

```
grocery-shop/
├── server.js       # Express server + API
├── db.js           # SQLite DB + seed
├── package.json
├── data/           # SQLite file (created at runtime)
├── public/
│   ├── index.html
│   ├── css/style.css
│   └── js/app.js
├── scripts/
│   └── init-db.js  # Optional: run once to reset/seed DB
└── README.md
```

## API

- `GET /api/categories` – list categories
- `POST /api/categories` – create category
- `PUT /api/categories/:id` – update category
- `DELETE /api/categories/:id` – delete category
- `GET /api/items` – list items (optional: `?category_id=1`)
- `GET /api/items/:id` – get one item
- `POST /api/items` – create item (JSON body)
- `PUT /api/items/:id` – update item
- `DELETE /api/items/:id` – delete item

Item fields: `name`, `category_id`, `flavor`, `price`, `image_url`, `stock`. Category: `name`.

## License

MIT
