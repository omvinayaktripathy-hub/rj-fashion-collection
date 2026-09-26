# RJ FASHION COLLECTION 🛍️👑

> A complete, production-style full-stack Indian fashion e-commerce platform crafted with **Node.js**, **Express.js**, and **SQLite**. Inspired by the scale and fluidity of modern Indian e-commerce platforms like Flipkart, featuring an original royal luxury design identity for Sarees, Bridal Jewelry, and Ethnic Festive Wear.

---

## 🌟 Features & Highlights

- **Front-End Experience**: Clean, modern Indian luxury fashion aesthetic (Royal Ruby Maroon, Soft Gold accents, Charcoal, crisp White cards, smooth micro-interactions).
- **Zero Static Demo**: 100% full-stack connected with real Express REST APIs and SQLite relational database.
- **Dynamic Product Catalog**: High-resolution gallery, multi-variant size and color selections, live stock tracking, discount computation, and customer reviews.
- **Live Search & Multi-Faceted Filters**: Real-time database query filtering across Category, Price Range, Ratings, Availability (In-Stock), and Sorting (Relevance, Price Low/High, Rating, Newest).
- **Persistent Shopping Cart**: Database-backed cart supporting both guest sessions and logged-in customer carts, item quantity steppers (-/+), savings calculation, and free delivery thresholds.
- **Customer Wishlist**: Stored per customer in the database with instant 1-click "Move to Cart" action.
- **Secure Customer Authentication**: Bcrypt-salted password hashing, express-session state management, input validation, and account profile management.
- **Checkout Flow**: 5-step checkout with delivery address management, order summary verification, and Cash on Delivery (COD) plus gateway-ready payment structures.
- **Order Management & Tracking**: Unique order IDs generated in `RJFC-YYYYMMDD-XXXX` format, status progression (Pending → Confirmed → Packed → Shipped → Out for Delivery → Delivered → Cancelled).
- **Completely Private Admin Panel**: Strict role-based isolation at `/admin`. Normal storefront customers NEVER see any admin links, dashboard buttons, or credentials.
- **Admin Dashboard & CRUD**: Metrics (Total Sales, Total Orders, Total Products, Total Customers, Low Stock Alerts), Product CRUD, Category Management, Order Status Transitions, and Customer Lifetime Spend analytics.
- **Responsive & Mobile-First**: Adaptive desktop layout, responsive tablet grid, and mobile bottom navigation bar (Home, Categories, Wishlist, Cart, Account).

---

## 📋 Comprehensive Setup Guide

### 1. Installing Node.js
If Node.js is not already installed on your system:
- Download the **LTS Version** (v20+ or v22+) from [nodejs.org](https://nodejs.org/).
- Run the installer and ensure the option to **Add to PATH** is checked.
- Verify installation in your terminal:
  ```bash
  node -v
  npm -v
  ```

### 2. Opening the Project in VS Code
- Open VS Code.
- Go to **File → Open Folder...**
- Select the project directory:
  `C:\Users\omvin\.gemini\antigravity\scratch\RJ-Fashion-Collection`
- Open the built-in terminal (**Ctrl + `** or **Terminal → New Terminal**).

### 3. Running `npm install`
Install all project dependencies with a single command:
```bash
npm install
```
Dependencies installed:
- `express`: Fast REST API backend framework
- `express-session`: Session management for authentication & cart sessions
- `bcryptjs`: Secure cryptographic salted password hashing
- `dotenv`: Environment configuration
- `cors`: Cross-origin request security
- `multer`: File/image uploads

### 4. Creating `.env`
An automated `.env` file is already provided. If creating from scratch or deploying to production, create a `.env` file in the project root:
```env
PORT=3000
SESSION_SECRET=rj_fashion_collection_secure_secret_2026_xyz987
NODE_ENV=development
```

### 5. Starting the Server
Start the full-stack server using the standard npm command:
```bash
npm start
```
Or for auto-reload during development:
```bash
npm run dev
```

### 6. Opening the Website
Once started, open your web browser (Chrome, Edge, Firefox, Safari) and navigate to:
```
http://localhost:3000
```
> **Note**: Do NOT use VS Code Live Server! The Express backend serves the complete website and handles all API routes automatically.

---

## 🔒 Private Admin Panel Guide

### 7. Accessing the Private Admin Panel
The admin portal is strictly separated from the public website and cannot be accessed via any public navigation links or footer buttons.

Navigate directly to the private URL:
```
http://localhost:3000/admin
```

### 8. Admin Credentials & First Account Setup
On first startup, the database automatically initializes with secure default accounts:

#### **Super Administrator Account:**
- **URL**: `http://localhost:3000/admin`
- **Email**: `admin@rjfashion.com`
- **Password**: `Admin@123`

#### **Demo Customer Account:**
- **URL**: `http://localhost:3000/login.html`
- **Email**: `priya@example.com`
- **Password**: `Customer@123`

*(You can also register brand new customer accounts on `/login.html` or change passwords anytime in `/account.html`).*

---

## 🗄️ Database Architecture

### 9. Database Location
The SQLite database file is stored locally at:
```
RJ-Fashion-Collection/database/database.sqlite
```
- It uses SQLite WAL (Write-Ahead Logging) mode and foreign keys for high performance and relational integrity.
- You can inspect the database anytime using tools like **DB Browser for SQLite**, **DBeaver**, or **VS Code SQLite extensions**.
- **Migration**: The schema uses standard SQL syntax (`users`, `categories`, `products`, `addresses`, `cart_items`, `wishlist_items`, `orders`, `order_items`, `reviews`, `banners`), allowing direct migration to **PostgreSQL** or **MySQL** in production by swapping the connection client.

---

## 🛠️ REST API Reference

| Endpoint | Method | Auth Required | Description |
|---|---|---|---|
| `/api/auth/register` | `POST` | Public | Register new customer account |
| `/api/auth/login` | `POST` | Public | Customer authentication |
| `/api/auth/admin-login` | `POST` | Private | Admin portal login |
| `/api/auth/logout` | `POST` | Public | Destroy session |
| `/api/me` | `GET` | Public | Get active session profile |
| `/api/products` | `GET` | Public | List products with search, filters, pagination |
| `/api/products/:id` | `GET` | Public | Detailed product data with reviews |
| `/api/categories` | `GET` | Public | Active categories with product counts |
| `/api/cart` | `GET` | Session | Get cart items & calculated summary |
| `/api/cart` | `POST` | Session | Add product to cart with stock validation |
| `/api/cart/:id` | `PUT` | Session | Update item quantity |
| `/api/cart/:id` | `DELETE` | Session | Remove item from cart |
| `/api/wishlist` | `GET` | Customer | Customer wishlist items |
| `/api/wishlist` | `POST` | Customer | Add to wishlist |
| `/api/wishlist/:id` | `DELETE` | Customer | Remove from wishlist |
| `/api/wishlist/:id/move-to-cart` | `POST` | Customer | Move wishlist item to cart |
| `/api/addresses` | `GET`/`POST` | Customer | Customer saved delivery addresses |
| `/api/orders` | `POST` | Customer | Place order & decrement product inventory |
| `/api/orders` | `GET` | Customer | Customer order history |
| `/api/admin/stats` | `GET` | Admin | Metrics (Sales, Orders, Products, Low Stock) |
| `/api/admin/products` | `GET`/`POST` | Admin | Product catalog management |
| `/api/admin/products/:id` | `PUT`/`DELETE` | Admin | Update / Delete product |
| `/api/admin/products/:id/stock` | `PATCH` | Admin | Quick inventory update |
| `/api/admin/orders` | `GET` | Admin | View all customer orders |
| `/api/admin/orders/:id` | `PATCH` | Admin | Update order status |
| `/api/admin/customers` | `GET` | Admin | View registered customers & lifetime spend |
| `/api/admin/categories` | `GET`/`POST`/`DELETE` | Admin | Category CRUD |

---

## 🔧 Troubleshooting Common Errors

1. **Port 3000 Already in Use**:
   If port 3000 is occupied by another service:
   - Edit `.env` and set `PORT=3001` or another free port.
   - Or kill the process using port 3000:
     ```powershell
     Stop-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess -Force
     ```

2. **Module Not Found**:
   If you see `Error: Cannot find module 'express'`:
   - Run `npm install` inside the `RJ-Fashion-Collection` directory.

3. **Database locked error**:
   - The application uses Node's built-in high-performance SQLite engine with WAL mode enabled. If you opened the database file in an external editor, close the external connection or commit any pending transaction.

4. **Product Images not loading**:
   - The seed products use royalty-free Unsplash CDN images with local fallback handling. Ensure your internet connection is active to load remote image assets.

---

## 👑 Brand Identity & Design Standards
- **Brand**: RJ Fashion Collection
- **Domain**: Premium Indian Ethnic Wear & Bridal Fashion
- **Color Palette**: Royal Ruby Maroon (`#7a003c`), Soft Gold (`#c59b27`), Dark Charcoal (`#1a1a1a`), Pure White (`#ffffff`), Soft Cool Gray (`#f8f9fa`).
- **No Copyright Infringements**: 100% original brand assets, layouts, typography, and styling inspired by modern Indian luxury e-commerce.
