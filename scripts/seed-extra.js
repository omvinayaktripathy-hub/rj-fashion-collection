const { DatabaseSync } = require('node:sqlite');
const path = require('node:path');

// Use the existing db module
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const db = require('../database/db');

const insertProd = db.prepare(`
  INSERT OR IGNORE INTO products (
    name, slug, category_id, description, material, pattern, care_instructions,
    price, original_price, discount, stock, image, additional_images, brand,
    rating, reviews_count, featured, new_arrival, offer, available_sizes, available_colors
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const extraProducts = [
  // More Sarees (cat 1)
  ['Pure Mysore Silk Saree with Woven Border', 'pure-mysore-silk-saree-woven-border', 1,
   'Lustrous Mysore pure silk saree with traditional woven golden border and matching blouse piece. Perfect for weddings and ceremonies.',
   'Pure Mysore Silk', 'Woven Zari Border', 'Dry Clean Only',
   2799, 5499, 49, 15,
   'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80',
   JSON.stringify(['https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80']),
   'RJ Heritage', 4.7, 33, 1, 0, 1,
   JSON.stringify(['Free Size (5.5m + Blouse)']), JSON.stringify(['Golden Yellow', 'Classic Red', 'Peacock Green'])],

  ['Bandhani Tie-Dye Silk Saree', 'bandhani-tie-dye-silk-saree', 1,
   'Authentic Gujarati Bandhani (tie-dye) silk saree with vibrant multicolor dots pattern and golden zari border. Festive and elegant.',
   'Pure Silk', 'Bandhani Tie-Dye', 'Dry Clean Only',
   1899, 3799, 50, 20,
   'https://images.unsplash.com/photo-1609357605129-26f69add5d6e?auto=format&fit=crop&w=800&q=80',
   JSON.stringify(['https://images.unsplash.com/photo-1609357605129-26f69add5d6e?auto=format&fit=crop&w=800&q=80']),
   'RJ Heritage', 4.5, 22, 0, 1, 1,
   JSON.stringify(['Free Size']), JSON.stringify(['Red & Yellow', 'Pink & Green', 'Blue & Gold'])],

  ['Designer Net Saree with Sequin Work', 'designer-net-saree-sequin-work', 1,
   'Glamorous party-wear net saree with all-over sequin embellishments, embroidered border and inner satin petticoat included.',
   'Premium Net with Satin Lining', 'All-Over Sequin Embroidery', 'Dry Clean Only',
   2199, 4499, 51, 10,
   'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80',
   JSON.stringify(['https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80']),
   'RJ Contemporary', 4.6, 18, 1, 0, 1,
   JSON.stringify(['Free Size']), JSON.stringify(['Black & Gold', 'Maroon & Silver', 'Navy & Gold'])],

  // More Jewelry (cat 2)
  ['Oxidised Silver Tribal Necklace Set', 'oxidised-silver-tribal-necklace-set', 2,
   'Bold oxidised silver necklace with matching chandbali earrings featuring tribal motifs and turquoise stone accents.',
   'Zinc Alloy with Oxidised Finish', 'Tribal Motif with Turquoise Stones', 'Wipe dry after use',
   899, 1799, 50, 35,
   'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=800&q=80',
   JSON.stringify(['https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=800&q=80']),
   'RJ Jewels', 4.4, 28, 0, 1, 0,
   JSON.stringify(['One Size']), JSON.stringify(['Oxidised Silver & Turquoise'])],

  ['Gold-Plated Meenakari Bangles Set of 6', 'gold-plated-meenakari-bangles-set-6', 2,
   'Intricately hand-painted Meenakari enamel work on gold-plated brass bangles. Set of 6 bangles in vibrant colours.',
   'Brass with Meenakari Enamel', 'Hand-Painted Meenakari', 'Keep away from water',
   1199, 2399, 50, 28,
   'https://images.unsplash.com/photo-1611591475841-fcf0b0e50f3b?auto=format&fit=crop&w=800&q=80',
   JSON.stringify(['https://images.unsplash.com/photo-1611591475841-fcf0b0e50f3b?auto=format&fit=crop&w=800&q=80']),
   'RJ Jewels', 4.6, 41, 1, 0, 1,
   JSON.stringify(['2.4', '2.6', '2.8']), JSON.stringify(['Gold & Red', 'Gold & Green', 'Gold & Blue'])],

  ['Bridal Maang Tikka with Pearls', 'bridal-maang-tikka-with-pearls', 2,
   'Elegant bridal maang tikka featuring layered pearl drops and Kundan centre stone with adjustable chain.',
   'Gold-Plated Alloy with Faux Pearls', 'Kundan & Pearl Danglers', 'Store in velvet pouch',
   649, 1299, 50, 50,
   'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=800&q=80',
   JSON.stringify(['https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=800&q=80']),
   'RJ Jewels', 4.8, 56, 1, 1, 1,
   JSON.stringify(['Adjustable']), JSON.stringify(['Gold & White', 'Rose Gold & White'])],

  // More Ethnic Wear (cat 3)
  ['Palazzo Suit with Floral Embroidery', 'palazzo-suit-floral-embroidery', 3,
   'Contemporary palazzo suit set with floral thread embroidery on yoke, matching wide-leg palazzo pants and printed dupatta.',
   'Chanderi Silk Top, Rayon Palazzo', 'Floral Thread Embroidery', 'Gentle hand wash',
   1599, 3199, 50, 22,
   'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80',
   JSON.stringify(['https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80']),
   'RJ Festive', 4.5, 19, 0, 1, 0,
   JSON.stringify(['S', 'M', 'L', 'XL', 'XXL']), JSON.stringify(['Peach', 'Sky Blue', 'Mint Green'])],

  ['Phulkari Embroidered Dupatta', 'phulkari-embroidered-dupatta', 3,
   'Traditional Punjab Phulkari hand-embroidered dupatta with vibrant floral motifs on cotton base. Perfect pair for any ethnic outfit.',
   'Pure Cotton with Silk Thread Work', 'Phulkari Hand Embroidery', 'Hand wash separately',
   699, 1399, 50, 45,
   'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=800&q=80',
   JSON.stringify(['https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=800&q=80']),
   'RJ Ethnic', 4.7, 67, 1, 0, 1,
   JSON.stringify(['Free Size (2.5m)']), JSON.stringify(['Multicolor on Red', 'Multicolor on Black', 'Multicolor on Orange'])],

  // More Kurtis (cat 4)
  ['Rayon Printed Long Kurti with Pants', 'rayon-printed-long-kurti-pants', 4,
   'Breezy lightweight rayon long kurti with digital mandala print, matching flared palazzo pants. Comfortable for daily wear.',
   '100% Rayon', 'Digital Mandala Print', 'Machine wash cold',
   799, 1599, 50, 40,
   'https://images.unsplash.com/photo-1609357605129-26f69add5d6e?auto=format&fit=crop&w=800&q=80',
   JSON.stringify(['https://images.unsplash.com/photo-1609357605129-26f69add5d6e?auto=format&fit=crop&w=800&q=80']),
   'RJ Daily Grace', 4.3, 88, 0, 0, 1,
   JSON.stringify(['S', 'M', 'L', 'XL', 'XXL', 'XXXL']), JSON.stringify(['Indigo', 'Rust Red', 'Forest Green'])],

  ['Asymmetric Kurti with Dhoti Pant', 'asymmetric-kurti-dhoti-pant', 4,
   'Trendy asymmetric hemline kurti with metallic thread accents paired with comfortable dhoti pants. Perfect for office to party.',
   'Poly Crepe', 'Metallic Thread Embellishment', 'Dry clean recommended',
   1099, 2199, 50, 18,
   'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=800&q=80',
   JSON.stringify(['https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=800&q=80']),
   'RJ Daily Grace', 4.5, 31, 0, 1, 0,
   JSON.stringify(['S', 'M', 'L', 'XL']), JSON.stringify(['Wine', 'Teal', 'Dusty Pink'])],

  // More Lehengas (cat 5)
  ['Pastel Floral Lehenga Choli for Mehendi', 'pastel-floral-lehenga-choli-mehendi', 5,
   'Light and breezy pastel floral lehenga ideal for mehendi and haldi ceremonies. Comes with matching choli and organza dupatta.',
   'Georgette with Organza Dupatta', 'Digital Floral Print with Embroidered Border', 'Dry clean only',
   3299, 6499, 49, 12,
   'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=800&q=80',
   JSON.stringify(['https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=800&q=80']),
   'RJ Royal Couture', 4.8, 24, 1, 1, 1,
   JSON.stringify(['Semi-Stitched (Fits up to 40 Bust)']), JSON.stringify(['Pastel Yellow', 'Blush Pink', 'Mint Green'])],

  ['Designer Net Lehenga with 3D Florals', 'designer-net-lehenga-3d-florals', 5,
   'Statement-making reception wear net lehenga adorned with 3D fabric flowers, sequin embroidery and matching veil dupatta.',
   'Net with Raw Silk Lining', '3D Fabric Flowers & Sequin Work', 'Professional Dry Clean Only',
   5499, 10999, 50, 6,
   'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=800&q=80',
   JSON.stringify(['https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=800&q=80']),
   'RJ Royal Couture', 4.9, 15, 1, 0, 1,
   JSON.stringify(['Semi-Stitched (Fits up to 42 Bust)']), JSON.stringify(['Ivory & Gold', 'Blush & Rose Gold'])],

  // More Dresses (cat 6)
  ['Embroidered Kaftan Maxi Dress', 'embroidered-kaftan-maxi-dress', 6,
   'Free-flowing kaftan maxi dress with intricate neckline embroidery, bell sleeves and side slits. One size fits all.',
   'Viscose Rayon', 'Embroidered Neckline & Cuffs', 'Gentle wash',
   1299, 2599, 50, 25,
   'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=800&q=80',
   JSON.stringify(['https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=800&q=80']),
   'RJ Fusion', 4.4, 29, 0, 1, 0,
   JSON.stringify(['Free Size (Fits S-XL)']), JSON.stringify(['Turquoise', 'Fuchsia Pink', 'Saffron'])],

  ['Ethnic Fusion Shirt Dress with Belt', 'ethnic-fusion-shirt-dress-belt', 6,
   'Contemporary A-line shirt dress with mandarin collar, ethnic block print and a matching tie-up waist belt.',
   '100% Cambric Cotton', 'Block Print', 'Machine wash cold',
   1099, 2199, 50, 30,
   'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=800&q=80',
   JSON.stringify(['https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=800&q=80']),
   'RJ Fusion', 4.3, 36, 0, 0, 1,
   JSON.stringify(['S', 'M', 'L', 'XL']), JSON.stringify(['Indigo', 'Burgundy', 'Olive Green'])],

  // More Accessories (cat 7)
  ['Beaded Tassel Chandbali Earrings', 'beaded-tassel-chandbali-earrings', 7,
   'Statement chandbali earrings with layered seed bead tassels and enamel work. Light-weight despite their glamorous look.',
   'Brass with Bead Work', 'Chandbali Drop with Tassel', 'Store in pouch',
   549, 1099, 50, 60,
   'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=800&q=80',
   JSON.stringify(['https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=800&q=80']),
   'RJ Accessories', 4.6, 73, 1, 1, 1,
   JSON.stringify(['Standard Pierced']), JSON.stringify(['Gold & Maroon', 'Silver & Navy', 'Gold & Green'])],

  ['Embroidered Ethnic Clutch Purse', 'embroidered-ethnic-clutch-purse', 7,
   'Handcrafted embroidered clutch purse with mirror work and tassel detail. Perfect for weddings and festive occasions.',
   'Velvet with Mirror Embroidery', 'Mirror Work & Tassel', 'Spot clean only',
   799, 1599, 50, 20,
   'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80',
   JSON.stringify(['https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80']),
   'RJ Accessories', 4.5, 22, 0, 0, 0,
   JSON.stringify(['Standard']), JSON.stringify(['Maroon', 'Royal Blue', 'Emerald Green'])],

  ['Pearl Kundan Hair Accessories Set', 'pearl-kundan-hair-accessories-set', 7,
   'Bridal hair accessories set including juda pin, matha patti and hair comb adorned with Kundan stones and pearl drops.',
   'Zinc Alloy with Kundan & Faux Pearls', 'Kundan & Pearl Setting', 'Keep dry',
   1099, 2199, 50, 15,
   'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80',
   JSON.stringify(['https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80']),
   'RJ Accessories', 4.7, 18, 1, 0, 1,
   JSON.stringify(['One Size']), JSON.stringify(['Gold & White', 'Gold & Pink'])],

  // New Arrivals category (cat 8)
  ['Ikat Silk Saree with Temple Border', 'ikat-silk-saree-temple-border', 8,
   'Exquisite hand-woven Ikat silk saree with geometric patola pattern and traditional temple zari border from Odisha artisans.',
   'Handwoven Ikat Silk', 'Ikat Patola & Temple Border', 'Dry Clean Only',
   3199, 6399, 50, 8,
   'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80',
   JSON.stringify(['https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80']),
   'RJ Heritage', 4.9, 12, 1, 1, 1,
   JSON.stringify(['Free Size']), JSON.stringify(['Brick Red', 'Indigo Blue', 'Mustard'])],

  ['Designer Crop Top Lehenga with Cape', 'designer-crop-top-lehenga-cape', 8,
   'Trendy fusion wear set featuring embroidered crop top, flared lehenga skirt and sheer embellished cape. Perfect for sangeet.',
   'Georgette & Net', 'Sequin & Thread Embroidery', 'Dry Clean Only',
   4299, 8599, 50, 7,
   'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=800&q=80',
   JSON.stringify(['https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=800&q=80']),
   'RJ Royal Couture', 4.8, 9, 1, 1, 0,
   JSON.stringify(['XS', 'S', 'M', 'L']), JSON.stringify(['Gold & White', 'Maroon & Gold'])],

  ['Wool Embroidered Kashmiri Stole', 'wool-embroidered-kashmiri-stole', 8,
   'Authentic Kashmiri hand-embroidered wool stole with traditional Sozni needlework floral motifs. Warm and luxurious.',
   'Pure Wool with Silk Thread Embroidery', 'Sozni Hand Embroidery', 'Dry clean only',
   1499, 2999, 50, 20,
   'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=800&q=80',
   JSON.stringify(['https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=800&q=80']),
   'RJ Accessories', 4.6, 27, 0, 1, 0,
   JSON.stringify(['Free Size (2m)']), JSON.stringify(['Ivory', 'Cream & Maroon', 'Black & Gold'])]
];

let inserted = 0;
for (const p of extraProducts) {
  const result = insertProd.run(...p);
  if (result.changes > 0) inserted++;
}
console.log(`Inserted ${inserted} new products.`);

// Add more reviews
const insertRev = db.prepare('INSERT OR IGNORE INTO reviews (product_id, user_name, rating, comment) VALUES (?, ?, ?, ?)');
const moreReviews = [
  [2, 'Divya Mehta', 5, 'Beautiful Banarasi saree! The georgette is so light yet the Meenakari work is stunning.'],
  [3, 'Sonal Gupta', 4, 'Lovely organza saree, the scalloped border is exquisite. Color is exactly as shown.'],
  [4, 'Rashmi Pillai', 5, 'The Chanderi silk is wonderfully lightweight. Gota patti work is gorgeous!'],
  [6, 'Neha Joshi', 5, 'These jhumkas are absolutely beautiful. The temple motif is very detailed.'],
  [7, 'Preethi Kumar', 4, 'Rose gold bangles look premium. Excellent gift for a sister!'],
  [9, 'Anita Sharma', 5, 'Sharara set is perfect for my cousin\'s wedding. So many compliments!'],
  [10, 'Rekha Iyer', 4, 'The Anarkali is elegant and the zari weaving is beautiful.'],
  [11, 'Lakshmi Rao', 5, 'Chikankari quality is authentic, you can tell real artisan work!'],
  [12, 'Pooja Verma', 4, 'Great everyday kurti, comfortable and the block print is vibrant.'],
  [13, 'Sunita Das', 5, 'The tiered maxi dress is perfect for a sangeet. So flowy and beautiful!'],
  [14, 'Archana Nair', 5, 'Potli bag is absolutely gorgeous. The zardozi work is exceptional.'],
];
let revInserted = 0;
for (const r of moreReviews) {
  const result = insertRev.run(...r);
  if (result.changes > 0) revInserted++;
}
console.log(`Inserted ${revInserted} new reviews.`);

// Update product ratings based on new reviews
const products = db.prepare('SELECT id FROM products').all();
for (const p of products) {
  const stats = db.prepare('SELECT COUNT(*) as cnt, AVG(rating) as avg FROM reviews WHERE product_id = ?').get(p.id);
  if (stats.cnt > 0) {
    db.prepare('UPDATE products SET rating = ?, reviews_count = ? WHERE id = ?').run(
      Math.round(stats.avg * 10) / 10, stats.cnt, p.id
    );
  }
}
console.log('Updated product ratings.');

// Add 3rd banner
const bannerExists = db.prepare('SELECT COUNT(*) as count FROM banners').get();
if (bannerExists.count < 3) {
  db.prepare(`
    INSERT INTO banners (title, subtitle, image, link, button_text, active, display_order)
    VALUES (?, ?, ?, ?, ?, 1, 3)
  `).run(
    'New Arrivals — Season Collection',
    'Fresh Festive Designs • Kurtis, Accessories & Designer Lehengas',
    'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=1600&q=85',
    '/shop.html?newArrival=true',
    'EXPLORE NEW ARRIVALS'
  );
  console.log('Added 3rd banner.');
}

console.log('\n✅ Extra seed data script complete!');
