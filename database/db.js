const { DatabaseSync } = require('node:sqlite');
const path = require('node:path');
const fs = require('node:fs');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, 'database.sqlite');
const dbDir = path.dirname(dbPath);

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new DatabaseSync(dbPath);

// Enable WAL mode and foreign keys for high performance and integrity
db.exec('PRAGMA foreign_keys = ON;');
db.exec('PRAGMA journal_mode = WAL;');

function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      phone TEXT,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'customer',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      slug TEXT NOT NULL UNIQUE,
      description TEXT,
      image TEXT,
      active INTEGER DEFAULT 1,
      display_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      category_id INTEGER,
      description TEXT,
      material TEXT,
      pattern TEXT,
      care_instructions TEXT,
      price REAL NOT NULL,
      original_price REAL NOT NULL,
      discount INTEGER DEFAULT 0,
      stock INTEGER NOT NULL DEFAULT 10,
      image TEXT NOT NULL,
      additional_images TEXT,
      brand TEXT DEFAULT 'RJ Collection',
      rating REAL DEFAULT 4.5,
      reviews_count INTEGER DEFAULT 12,
      featured INTEGER DEFAULT 0,
      new_arrival INTEGER DEFAULT 0,
      offer INTEGER DEFAULT 0,
      active INTEGER DEFAULT 1,
      available_sizes TEXT DEFAULT '["Free Size"]',
      available_colors TEXT DEFAULT '["Maroon", "Red", "Gold"]',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES categories (id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS addresses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      full_name TEXT NOT NULL,
      phone TEXT NOT NULL,
      house_flat TEXT NOT NULL,
      street TEXT NOT NULL,
      city TEXT NOT NULL,
      state TEXT NOT NULL,
      pin_code TEXT NOT NULL,
      is_default INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS cart_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      session_id TEXT,
      product_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 1,
      size TEXT DEFAULT 'Free Size',
      color TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS wishlist_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, product_id),
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_number TEXT NOT NULL UNIQUE,
      user_id INTEGER NOT NULL,
      address_id INTEGER,
      customer_name TEXT NOT NULL,
      customer_email TEXT NOT NULL,
      customer_phone TEXT NOT NULL,
      delivery_address TEXT NOT NULL,
      subtotal REAL NOT NULL,
      discount REAL DEFAULT 0,
      shipping REAL DEFAULT 0,
      total REAL NOT NULL,
      payment_method TEXT NOT NULL DEFAULT 'Cash on Delivery',
      payment_status TEXT NOT NULL DEFAULT 'Pending',
      status TEXT NOT NULL DEFAULT 'Confirmed',
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      product_id INTEGER,
      product_name TEXT NOT NULL,
      product_image TEXT,
      size TEXT,
      color TEXT,
      quantity INTEGER NOT NULL,
      price REAL NOT NULL,
      total REAL NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS banners (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      subtitle TEXT,
      image TEXT NOT NULL,
      link TEXT DEFAULT '/shop.html',
      button_text TEXT DEFAULT 'SHOP NOW',
      active INTEGER DEFAULT 1,
      display_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      user_id INTEGER,
      user_name TEXT NOT NULL,
      rating INTEGER NOT NULL,
      comment TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE
    );
  `);
}

function seedInitialData() {
  const usersCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  if (usersCount === 0) {
    const adminHash = bcrypt.hashSync('OMvinayak@01092003', 10);
    const customerHash = bcrypt.hashSync('Customer@123', 10);

    const insertUser = db.prepare(`
      INSERT INTO users (name, email, phone, password_hash, role)
      VALUES (?, ?, ?, ?, ?)
    `);

    insertUser.run('RJ Fashion Admin (Om Vinayak)', 'omvinayakwork@gmail.com', '7894093586', adminHash, 'admin');
    insertUser.run('Priya Sharma', 'priya@example.com', '+91 98765 12345', customerHash, 'customer');
    console.log('Seeded default Admin and Demo Customer accounts.');
  }

  const catCount = db.prepare('SELECT COUNT(*) as count FROM categories').get().count;
  if (catCount === 0) {
    const insertCat = db.prepare(`
      INSERT INTO categories (name, slug, description, image, display_order)
      VALUES (?, ?, ?, ?, ?)
    `);

    const categories = [
      ['Sarees', 'sarees', 'Handcrafted Silk, Kanjivaram, Banarasi, and Georgette sarees with royal zari work', 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=700&q=80', 1],
      ['Jewelry', 'jewelry', 'Bridal necklaces, Kundan sets, temple jewelry, jhumkas, and bangles', 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=700&q=80', 2],
      ['Ethnic Wear', 'ethnic-wear', 'Anarkalis, Shararas, Ghararas, and festive celebratory attire', 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=700&q=80', 3],
      ['Kurtis', 'kurtis', 'Embroidered, printed, and festive designer kurtis and tunic sets', 'https://images.unsplash.com/photo-1609357605129-26f69add5d6e?auto=format&fit=crop&w=700&q=80', 4],
      ['Lehengas', 'lehengas', 'Bridal and party-wear lehenga cholis with elaborate embroidery', 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=700&q=80', 5],
      ['Dresses', 'dresses', 'Fusion Indo-Western dresses, gowns, and contemporary evening wear', 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=700&q=80', 6],
      ['Accessories', 'accessories', 'Potli bags, clutch purses, dupattas, and ornate ethnic footwear', 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=700&q=80', 7],
      ['New Arrivals', 'new-arrivals', 'Fresh festive season arrivals and trending runway designs', 'https://images.unsplash.com/photo-1610030469668-935a8df2d2b5?auto=format&fit=crop&w=700&q=80', 8]
    ];

    for (const cat of categories) {
      insertCat.run(...cat);
    }
    console.log('Seeded categories.');
  }

  const prodCount = db.prepare('SELECT COUNT(*) as count FROM products').get().count;
  if (prodCount === 0) {
    const insertProd = db.prepare(`
      INSERT INTO products (
        name, slug, category_id, description, material, pattern, care_instructions,
        price, original_price, discount, stock, image, additional_images, brand,
        rating, reviews_count, featured, new_arrival, offer, available_sizes, available_colors
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const products = [
      // Sarees
      [
        'Royal Kanjivaram Pure Silk Zari Saree',
        'royal-kanjivaram-pure-silk-zari-saree',
        1,
        'Exquisite ruby maroon Kanjivaram pure silk saree woven with genuine gold zari borders and intricate floral pallu motifs. Includes matching unstitched blouse piece.',
        'Pure Kanjivaram Silk with Gold Zari',
        'Traditional Temple Zari Motif',
        'Dry Clean Only. Store wrapped in muslin cloth.',
        3499,
        6999,
        50,
        18,
        'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80',
        JSON.stringify([
          'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=800&q=80'
        ]),
        'RJ Heritage',
        4.8,
        48,
        1,
        1,
        1,
        JSON.stringify(['Free Size (5.5m + 0.8m Blouse)']),
        JSON.stringify(['Ruby Maroon', 'Emerald Green', 'Royal Blue'])
      ],
      [
        'Banarasi Handwoven Georgette Saree',
        'banarasi-handwoven-georgette-saree',
        1,
        'Lightweight yet opulent handwoven Banarasi georgette saree featuring intricate Meenakari floral jaal and antique gold border.',
        'Pure Banarasi Khaddi Georgette',
        'Meenakari Floral Jaal',
        'Dry clean only',
        2499,
        4999,
        50,
        12,
        'https://images.unsplash.com/photo-1609357605129-26f69add5d6e?auto=format&fit=crop&w=800&q=80',
        JSON.stringify(['https://images.unsplash.com/photo-1609357605129-26f69add5d6e?auto=format&fit=crop&w=800&q=80']),
        'RJ Heritage',
        4.6,
        34,
        1,
        0,
        1,
        JSON.stringify(['Free Size']),
        JSON.stringify(['Mustard Gold', 'Deep Wine', 'Peacock Blue'])
      ],
      [
        'Floral Organza Saree with Scalloped Embroidered Border',
        'floral-organza-saree-scalloped-border',
        1,
        'Breezy pastel organza saree featuring delicate digital botanical prints and resham thread scalloped borders with pearls.',
        'Premium Sheer Organza',
        'Botanical Floral with Resham Work',
        'Dry clean only',
        1799,
        3299,
        45,
        22,
        'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80',
        JSON.stringify(['https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80']),
        'RJ Contemporary',
        4.5,
        19,
        0,
        1,
        0,
        JSON.stringify(['Free Size']),
        JSON.stringify(['Blush Pink', 'Mint Green', 'Powder Blue'])
      ],
      [
        'Festive Chanderi Silk Saree with Gota Patti',
        'festive-chanderi-silk-saree-gota-patti',
        1,
        'Traditional Chanderi silk saree adorned with hand-stitched Gota Patti accents and tassels. Lightweight and breathable for wedding ceremonies.',
        'Chanderi Cotton Silk Blend',
        'Gota Patti Handwork',
        'Dry clean recommended',
        1999,
        3999,
        50,
        15,
        'https://images.unsplash.com/photo-1610030469668-935a8df2d2b5?auto=format&fit=crop&w=800&q=80',
        JSON.stringify(['https://images.unsplash.com/photo-1610030469668-935a8df2d2b5?auto=format&fit=crop&w=800&q=80']),
        'RJ Collection',
        4.7,
        26,
        1,
        0,
        1,
        JSON.stringify(['Free Size']),
        JSON.stringify(['Rust Orange', 'Maroon', 'Bottle Green'])
      ],

      // Jewelry
      [
        'Kundan & Pearl Choker Bridal Necklace Set',
        'kundan-pearl-choker-bridal-necklace-set',
        2,
        'Regal 22k gold-plated Kundan choker necklace embellished with clusters of dangling faux pearls and matching heavy chandelier jhumkas and maang tikka.',
        'Brass with 22k Matte Gold Micron Plating',
        'Handcrafted Kundan Meenakari',
        'Wipe with soft dry cloth. Keep away from water & perfumes.',
        1899,
        3799,
        50,
        25,
        'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=800&q=80',
        JSON.stringify(['https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=800&q=80']),
        'RJ Jewels',
        4.9,
        64,
        1,
        1,
        1,
        JSON.stringify(['Adjustable Dori']),
        JSON.stringify(['Gold & White', 'Gold & Green', 'Gold & Ruby'])
      ],
      [
        'Temple Matte Gold Antique Jhumka Earrings',
        'temple-matte-gold-antique-jhumka-earrings',
        2,
        'Traditional South Indian temple design jhumka earrings featuring goddess Lakshmi motif with hanging micro pearls and ruby cz stones.',
        'High Grade Alloy with Antique Matte Finish',
        'Temple Carving & Jhumka Drop',
        'Store in airtight velvet pouch.',
        799,
        1599,
        50,
        40,
        'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=800&q=80',
        JSON.stringify(['https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=800&q=80']),
        'RJ Jewels',
        4.7,
        42,
        1,
        0,
        1,
        JSON.stringify(['Standard Pierced']),
        JSON.stringify(['Antique Gold'])
      ],
      [
        'Rose Gold American Diamond Designer Bangle Set',
        'rose-gold-american-diamond-bangle-set',
        2,
        'Set of 4 shimmering American Diamond (Cubic Zirconia) openable bangles crafted in radiant rose gold finish for celebrations.',
        'Brass with Swiss CZ Stones',
        'Prong Set Eternity Pattern',
        'Keep away from chemicals and perfumes.',
        1299,
        2499,
        48,
        20,
        'https://images.unsplash.com/photo-1611591475841-fcf0b0e50f3b?auto=format&fit=crop&w=800&q=80',
        JSON.stringify(['https://images.unsplash.com/photo-1611591475841-fcf0b0e50f3b?auto=format&fit=crop&w=800&q=80']),
        'RJ Jewels',
        4.6,
        18,
        0,
        1,
        0,
        JSON.stringify(['2.4', '2.6', '2.8']),
        JSON.stringify(['Rose Gold', 'Silver Rhodium', 'Yellow Gold'])
      ],

      // Ethnic Wear & Lehengas
      [
        'Embroidered Velvet Bridal Lehenga Choli',
        'embroidered-velvet-bridal-lehenga-choli',
        5,
        'Majestic deep crimson velvet lehenga intricately decorated with heavy dori, zardozi, and sequin craftsmanship. Comes with netted embroidered dupatta.',
        'Micro Velvet & Net Dupatta',
        'Zardozi & Sequin Hand Embroidery',
        'Professional Dry Clean Only',
        6499,
        12999,
        50,
        8,
        'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=800&q=80',
        JSON.stringify(['https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=800&q=80']),
        'RJ Royal Couture',
        4.9,
        31,
        1,
        1,
        1,
        JSON.stringify(['Semi-Stitched (Fits up to 44 Bust/Waist)']),
        JSON.stringify(['Crimson Red', 'Royal Maroon'])
      ],
      [
        'Georgette Mirror Work Sharara Suit Set',
        'georgette-mirror-work-sharara-suit-set',
        3,
        'Contemporary festive 3-piece sharara set with flared peplum top, heavy faux mirror work, flared bottoms, and sheer organza dupatta.',
        'Heavy Faux Georgette with Shantoon Lining',
        'Original Foil Mirror & Thread Embroidery',
        'Dry clean only',
        2699,
        4999,
        46,
        14,
        'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80',
        JSON.stringify(['https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80']),
        'RJ Festive',
        4.6,
        28,
        1,
        0,
        0,
        JSON.stringify(['S', 'M', 'L', 'XL', 'XXL']),
        JSON.stringify(['Teal Blue', 'Hot Pink', 'Lime Yellow'])
      ],
      [
        'Anarkali Silk Gown with Zari Embellishment',
        'anarkali-silk-gown-zari-embellishment',
        3,
        'Floor-length flared Anarkali silhouette in rich chanderi silk with metallic foil print border and beaded neckline.',
        'Art Silk with Cotton Inner',
        'Zari Weaving and Foil Highlights',
        'Gentle hand wash or dry clean',
        2299,
        4499,
        48,
        16,
        'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=800&q=80',
        JSON.stringify(['https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=800&q=80']),
        'RJ Collection',
        4.4,
        15,
        0,
        1,
        0,
        JSON.stringify(['S', 'M', 'L', 'XL']),
        JSON.stringify(['Wine Purple', 'Deep Emerald', 'Navy Blue'])
      ],

      // Kurtis
      [
        'Hand Embroidered Lucknowi Chikankari Kurti Set',
        'lucknowi-chikankari-kurti-set',
        4,
        'Authentic Lucknowi hand-embroidered georgette kurti paired with matching palazzo pants and inner lining slip. Soft pastel elegance.',
        'Georgette with Pure Cotton Inner',
        'Handcrafted Chikankari & Mukaish work',
        'Hand wash with mild detergent',
        1499,
        2999,
        50,
        20,
        'https://images.unsplash.com/photo-1609357605129-26f69add5d6e?auto=format&fit=crop&w=800&q=80',
        JSON.stringify(['https://images.unsplash.com/photo-1609357605129-26f69add5d6e?auto=format&fit=crop&w=800&q=80']),
        'RJ Daily Grace',
        4.7,
        52,
        1,
        1,
        1,
        JSON.stringify(['38 (M)', '40 (L)', '42 (XL)', '44 (XXL)']),
        JSON.stringify(['Lavender', 'Peach', 'Baby Pink'])
      ],
      [
        'Printed Cotton A-Line Kurti with Pant Set',
        'printed-cotton-a-line-kurti-pant-set',
        4,
        'Comfortable breathable 100% pure cotton daily wear kurti set featuring Jaipuri block print and button placket.',
        '100% Pure Cambric Cotton',
        'Jaipuri Floral Block Print',
        'Machine wash cold, dry in shade',
        899,
        1799,
        50,
        35,
        'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=800&q=80',
        JSON.stringify(['https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=800&q=80']),
        'RJ Cotton Craft',
        4.3,
        39,
        0,
        0,
        1,
        JSON.stringify(['S', 'M', 'L', 'XL', 'XXL']),
        JSON.stringify(['Indigo Blue', 'Mustard Yellow', 'Crimson'])
      ],

      // Dresses & Accessories
      [
        'Indo-Western Tiered Maxi Dress with Belt',
        'indo-western-tiered-maxi-dress-belt',
        6,
        'Flowy tiered chiffon maxi dress infused with ethnic golden foil motifs and an embellished metallic belt for modern festive celebrations.',
        'Poly Chiffon with Butter Crepe Lining',
        'Tiered Flounce with Metallic Print',
        'Dry clean or gentle wash',
        1699,
        3199,
        47,
        17,
        'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=800&q=80',
        JSON.stringify(['https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=800&q=80']),
        'RJ Fusion',
        4.5,
        21,
        0,
        1,
        0,
        JSON.stringify(['XS', 'S', 'M', 'L', 'XL']),
        JSON.stringify(['Deep Maroon', 'Bottle Green'])
      ],
      [
        'Handcrafted Zardozi Bridal Potli Bag',
        'handcrafted-zardozi-bridal-potli-bag',
        7,
        'Opulent silk drawstring potli pouch adorned with intricate hand zardozi beadwork, pearl latkans, and braided gold wrist handle.',
        'Raw Silk & Glass Pearls',
        'Zardozi & Cutdana Hand Embroidery',
        'Spot clean only',
        649,
        1299,
        50,
        30,
        'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80',
        JSON.stringify(['https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80']),
        'RJ Accessories',
        4.8,
        37,
        1,
        0,
        1,
        JSON.stringify(['Standard']),
        JSON.stringify(['Gold', 'Maroon', 'Champagne'])
      ]
    ];

    for (const p of products) {
      insertProd.run(...p);
    }
    console.log('Seeded products.');
  }

  // Seed Banners
  const bannerCount = db.prepare('SELECT COUNT(*) as count FROM banners').get().count;
  if (bannerCount === 0) {
    const insertBanner = db.prepare(`
      INSERT INTO banners (title, subtitle, image, link, button_text, display_order)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    insertBanner.run(
      'Discover Your Style',
      'Elegant Fashion for Every Occasion • Royal Sarees & Bridal Jewels',
      'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1600&q=85',
      '/shop.html?category=sarees',
      'SHOP SAREES',
      1
    );
    insertBanner.run(
      'Royal Wedding Collection',
      'Handcrafted Kanjivaram Silks, Bridal Lehengas & Kundan Jewelry',
      'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=1600&q=85',
      '/shop.html?offer=true',
      'EXPLORE COLLECTION',
      2
    );
    console.log('Seeded banners.');
  }

  // Seed demo reviews
  const revCount = db.prepare('SELECT COUNT(*) as count FROM reviews').get().count;
  if (revCount === 0) {
    const insertRev = db.prepare(`
      INSERT INTO reviews (product_id, user_name, rating, comment)
      VALUES (?, ?, ?, ?)
    `);
    insertRev.run(1, 'Ananya Desai', 5, 'The zari work on this Kanjivaram saree is magnificent! Looked royal on my cousin’s wedding.');
    insertRev.run(1, 'Meera Nair', 5, 'Exceptional quality silk, feels rich and heavy. Exactly like the pictures.');
    insertRev.run(5, 'Sneha Patel', 5, 'The Kundan choker set exceeded my expectations. So many compliments received!');
    insertRev.run(8, 'Kavita Roy', 5, 'Gorgeous bridal velvet lehenga, stitching quality is top-notch.');
    console.log('Seeded reviews.');
  }
}

// Initialize tables and seed
initSchema();
seedInitialData();

module.exports = db;
