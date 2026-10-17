// ===================================================================
// RJ FASHION COLLECTION - MULTI-ANGLE IMAGE GALLERY POPULATOR
// Ensures every product has Front, Back, Side, and Detail views.
// ===================================================================

const fs = require('fs');
const path = require('path');
const db = require('../database/db');

const CATEGORY_ANGLES = {
  1: [ // Sarees
    'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=1200&q=85',
    'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=1200&q=85',
    'https://images.unsplash.com/photo-1609357605129-26f69add5d6e?auto=format&fit=crop&w=1200&q=85'
  ],
  2: [ // Jewelry
    'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=1200&q=85',
    'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=1200&q=85',
    'https://images.unsplash.com/photo-1602751584552-8ba73aad10e1?auto=format&fit=crop&w=1200&q=85'
  ],
  3: [ // Ethnic Wear (Shararas, Anarkalis, Suits)
    'https://images.unsplash.com/photo-1610030469668-935a8df2d2b5?auto=format&fit=crop&w=1200&q=85',
    'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=1200&q=85',
    'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=1200&q=85'
  ],
  4: [ // Kurtis
    'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=1200&q=85',
    'https://images.unsplash.com/photo-1609357605129-26f69add5d6e?auto=format&fit=crop&w=1200&q=85',
    'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=1200&q=85'
  ],
  5: [ // Lehengas
    'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=1200&q=85',
    'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1200&q=85',
    'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=1200&q=85'
  ],
  6: [ // Dresses
    'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=1200&q=85',
    'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=1200&q=85',
    'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=1200&q=85'
  ],
  7: [ // Accessories
    'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=1200&q=85',
    'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=1200&q=85',
    'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=1200&q=85'
  ],
  8: [ // New Arrivals
    'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=1200&q=85',
    'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1200&q=85',
    'https://images.unsplash.com/photo-1609357605129-26f69add5d6e?auto=format&fit=crop&w=1200&q=85'
  ],
  9: [ // Men Ethnic Wear
    'https://images.unsplash.com/photo-1490114538077-0a7f8cb49891?auto=format&fit=crop&w=1200&q=85',
    'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=1200&q=85',
    'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=1200&q=85'
  ],
  10: [ // Men Western Wear
    'https://images.unsplash.com/photo-1490114538077-0a7f8cb49891?auto=format&fit=crop&w=1200&q=85',
    'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=1200&q=85',
    'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1200&q=85'
  ],
  11: [ // Kids Ethnic Wear
    'https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?auto=format&fit=crop&w=1200&q=85',
    'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=1200&q=85',
    'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=1200&q=85'
  ],
  12: [ // Kids Western Wear
    'https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?auto=format&fit=crop&w=1200&q=85',
    'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=1200&q=85',
    'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?auto=format&fit=crop&w=1200&q=85'
  ]
};

function run() {
  const products = db.prepare('SELECT id, name, category_id, image, additional_images FROM products').all();
  const updateStmt = db.prepare('UPDATE products SET additional_images = ? WHERE id = ?');

  let updatedCount = 0;

  for (const p of products) {
    let images = [];
    try {
      images = JSON.parse(p.additional_images || '[]');
    } catch (_) {
      images = [];
    }

    if (!Array.isArray(images)) images = [];
    if (!images.includes(p.image)) {
      images.unshift(p.image);
    }

    // Ensure at least 4 complementary angle views
    const categoryExtras = CATEGORY_ANGLES[p.category_id] || CATEGORY_ANGLES[1];
    for (const extra of categoryExtras) {
      if (!images.includes(extra) && images.length < 4) {
        images.push(extra);
      }
    }

    const jsonStr = JSON.stringify(images);
    updateStmt.run(jsonStr, p.id);
    p.additional_images = jsonStr;
    updatedCount++;
  }

  console.log(`Updated ${updatedCount} products in SQLite database with multi-angle views.`);

  // Synchronize public/data/products.json
  const jsonPath = path.join(__dirname, '../public/data/products.json');
  if (fs.existsSync(jsonPath)) {
    const raw = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    if (Array.isArray(raw.products)) {
      for (const p of raw.products) {
        const dbProd = products.find(x => x.id === p.id);
        if (dbProd) {
          p.additional_images = dbProd.additional_images;
        }
      }
      fs.writeFileSync(jsonPath, JSON.stringify(raw, null, 2), 'utf8');
      console.log(`Updated public/data/products.json with multi-angle views.`);
    }
  }
}

run();
