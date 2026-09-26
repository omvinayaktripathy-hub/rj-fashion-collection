# RJ FASHION COLLECTION — Production Deployment & Configuration Guide

This guide details everything needed to take the **RJ Fashion Collection** e-commerce application from local development to production.

---

## 1. Environment Configuration (.env)

Your `.env` file should be placed in the project root:

```env
# Application Port and Environment
PORT=3000
NODE_ENV=production

# Session Security (Generate a strong 64-character random string)
SESSION_SECRET=your_super_strong_random_secret_here_64_characters_min

# Razorpay Payment Gateway (Live or Test keys)
# Obtain keys at: https://dashboard.razorpay.com/app/keys
RAZORPAY_KEY_ID=rzp_live_your_actual_key_id
RAZORPAY_KEY_SECRET=your_actual_key_secret
RAZORPAY_ENABLED=true

# Nodemailer Email Configuration (SMTP)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=orders@rjfashion.com
EMAIL_PASS=your_gmail_app_password
EMAIL_FROM="RJ Fashion Collection <orders@rjfashion.com>"
EMAIL_ENABLED=true
```

> **Note on Gmail SMTP**: If using Gmail, generate an **App Password** from Google Account → Security → 2-Step Verification → App Passwords. Do NOT use your regular account password.

---

## 2. Process Management with PM2

Install and use PM2 to keep the application running continuously with automatic restarts and clustering:

```bash
# Install PM2 globally
npm install -g pm2

# Start the application
pm2 start server.js --name "rj-fashion" -i max

# Save process list to restart automatically on server reboot
pm2 save
pm2 startup
```

Useful PM2 commands:
```bash
pm2 status             # View process status
pm2 logs rj-fashion    # Stream real-time logs
pm2 reload rj-fashion  # Zero-downtime reload
pm2 restart rj-fashion # Restart process
```

---

## 3. Reverse Proxy & HTTPS with Nginx

Set up Nginx as a reverse proxy in front of Node.js with Let's Encrypt SSL:

```nginx
# /etc/nginx/sites-available/rjfashion.com
server {
    listen 80;
    server_name rjfashion.com www.rjfashion.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name rjfashion.com www.rjfashion.com;

    ssl_certificate /etc/letsencrypt/live/rjfashion.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/rjfashion.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Gzip Compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml image/svg+xml;

    # Proxy to Node.js backend
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Static assets caching
    location ~* \.(css|js|jpg|jpeg|png|gif|ico|svg|woff2)$ {
        proxy_pass http://127.0.0.1:3000;
        expires 7d;
        add_header Cache-Control "public, no-transform";
    }
}
```

Obtain SSL certificate with Certbot:
```bash
sudo certbot --nginx -d rjfashion.com -d www.rjfashion.com
```

---

## 4. Production Session Store

In `server.js`, replace the default in-memory session store with a persistent store:

### Option A: SQLite Session Store (`connect-sqlite3`)
```bash
npm install connect-sqlite3
```
```js
const SQLiteStore = require('connect-sqlite3')(session);

app.use(session({
  store: new SQLiteStore({ db: 'sessions.sqlite', dir: './database' }),
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production', // true for HTTPS
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000
  }
}));
```

### Option B: Redis Session Store (`connect-redis`)
```bash
npm install connect-redis redis
```

---

## 5. Migrating from SQLite to MySQL / PostgreSQL

All database queries in `database/db.js` use standard SQL. To migrate to PostgreSQL or MySQL:

1. **Schema**: The 11 table definitions use standard SQL types (`INTEGER`, `TEXT`, `REAL`, `DATETIME`, `FOREIGN KEY`). Replace `AUTOINCREMENT` with `AUTO_INCREMENT` (MySQL) or `SERIAL` (PostgreSQL).
2. **Client library**: Replace `node:sqlite` with `pg` (PostgreSQL) or `mysql2/promise` (MySQL).
3. **Database connection pool**:
```js
// PostgreSQL Example
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
```

---

## 6. Security Best Practices Checklist

- [ ] Change default admin password (`admin@rjfashion.com` / `Admin@123`) immediately after deployment.
- [ ] Set `cookie.secure = true` in session configuration when running over HTTPS.
- [ ] Install `helmet` for HTTP security headers: `npm install helmet` → `app.use(helmet())`.
- [ ] Set rate limiting on auth endpoints with `express-rate-limit`.
- [ ] Keep `.env` out of version control (already configured in `.gitignore`).
- [ ] Schedule regular automated backups of `database/database.sqlite`.

---

## 7. Useful Administration Links

| Resource | URL |
|---|---|
| Public Storefront | `http://localhost:3000` (or `https://rjfashion.com`) |
| Private Admin Portal | `http://localhost:3000/admin` |
| Mega Sale & Offers | `http://localhost:3000/sale` |
| Frequently Asked Questions | `http://localhost:3000/faq` |
| Sizing & Measurement Guide | `http://localhost:3000/size-guide` |
| Admin Default Credentials | `admin@rjfashion.com` / `Admin@123` |
| Demo Customer Credentials | `priya@example.com` / `Customer@123` |
