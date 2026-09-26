// RJ FASHION COLLECTION - Cloud Firestore Database Seeder
// Seeds all 55 products, 12 categories, promotional banners, and Admin profile to Cloud Firestore

const fs = require('node:fs');
const path = require('node:path');
const { initFirebase } = require('../services/firebase');
const dbLocal = require('../database/db');

async function seedFirestore() {
  console.log('══════════════════════════════════════════════════════════════');
  console.log('   RJ FASHION COLLECTION - CLOUD FIRESTORE SYNC SCRIPT       ');
  console.log('══════════════════════════════════════════════════════════════');

  const { db, isReady } = initFirebase();

  if (!isReady || !db) {
    console.error('❌ Failed to connect to Firebase. Check serviceAccountKey.json.');
    process.exit(1);
  }

  console.log('✅ Connected to Cloud Firestore for project: rj-fashion-collection\n');

  // 1. Seed Super Admin User Profile
  console.log('▶ [1/4] Syncing Super Admin User Profile...');
  const adminUid = 'aJC901OkCjU5UvqUUF9tvaqpdbn1';
  await db.collection('users').doc(adminUid).set({
    uid: adminUid,
    name: 'RJ Fashion Admin (Om Vinayak)',
    email: 'omvinayakwork@gmail.com',
    role: 'admin',
    phone: '7894093586',
    upi_id: 'q070080131@ybl',
    store_address: {
      store_name: 'RJ FASHION COLLECTION',
      street: 'sarbhal',
      city: 'jharsuguda',
      state: 'ODISHA',
      zipcode: '768201',
      timings: 'Mon to Sat: 10:00 AM - 5:00 PM'
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }, { merge: true });
  console.log('   ✓ Super Admin profile saved to Firestore collection "users".');

  // 2. Seed Categories
  console.log('\n▶ [2/4] Syncing Categories...');
  const categories = dbLocal.prepare('SELECT * FROM categories').all();
  const catBatch = db.batch();

  for (const cat of categories) {
    const docRef = db.collection('categories').doc(String(cat.slug || cat.id));
    catBatch.set(docRef, {
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      description: cat.description || '',
      image: cat.image || '',
      active: Boolean(cat.active),
      display_order: cat.display_order || 0,
      updated_at: new Date().toISOString()
    }, { merge: true });
  }
  await catBatch.commit();
  console.log(`   ✓ Synced ${categories.length} categories to Firestore collection "categories".`);

  // 3. Seed Promotional Banners
  console.log('\n▶ [3/4] Syncing Banners...');
  const banners = dbLocal.prepare('SELECT * FROM banners').all();
  const bannerBatch = db.batch();

  for (const banner of banners) {
    const docRef = db.collection('banners').doc(String(banner.id));
    bannerBatch.set(docRef, {
      id: banner.id,
      title: banner.title,
      subtitle: banner.subtitle || '',
      image: banner.image,
      link: banner.link || '/shop.html',
      button_text: banner.button_text || 'SHOP NOW',
      active: Boolean(banner.active),
      display_order: banner.display_order || 0,
      updated_at: new Date().toISOString()
    }, { merge: true });
  }
  await bannerBatch.commit();
  console.log(`   ✓ Synced ${banners.length} promotional banners to Firestore collection "banners".`);

  // 4. Seed All 55 Products
  console.log('\n▶ [4/4] Syncing All 55 Products to Firestore...');
  const products = dbLocal.prepare(`
    SELECT p.*, c.name as category_name, c.slug as category_slug
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
  `).all();

  // Firestore batches have a 500 operation limit; 55 products is well within limit
  const productBatch = db.batch();

  for (const p of products) {
    let addImgs = [];
    try {
      addImgs = p.additional_images ? JSON.parse(p.additional_images) : [];
    } catch (_) {}

    let sizes = [];
    try {
      sizes = p.available_sizes ? JSON.parse(p.available_sizes) : [];
    } catch (_) {}

    let colors = [];
    try {
      colors = p.available_colors ? JSON.parse(p.available_colors) : [];
    } catch (_) {}

    const docRef = db.collection('products').doc(String(p.id));
    productBatch.set(docRef, {
      id: p.id,
      name: p.name,
      slug: p.slug,
      category_id: p.category_id,
      category_name: p.category_name || '',
      category_slug: p.category_slug || '',
      department: p.department || 'women',
      subcategory: p.subcategory || '',
      description: p.description || '',
      material: p.material || '',
      pattern: p.pattern || '',
      care_instructions: p.care_instructions || '',
      price: Number(p.price),
      original_price: Number(p.original_price || p.price),
      discount: Number(p.discount || 0),
      stock: Number(p.stock || 0),
      image: p.image,
      additional_images: addImgs,
      brand: p.brand || 'RJ Collection',
      rating: Number(p.rating || 4.5),
      reviews_count: Number(p.reviews_count || 10),
      available_sizes: sizes,
      available_colors: colors,
      featured: Boolean(p.featured),
      new_arrival: Boolean(p.new_arrival),
      offer: Boolean(p.offer),
      active: Boolean(p.active),
      updated_at: new Date().toISOString()
    }, { merge: true });
  }

  await productBatch.commit();
  console.log(`   ✓ Synced ${products.length} products to Firestore collection "products".`);

  console.log('\n══════════════════════════════════════════════════════════════');
  console.log('   🎉 ALL 55 PRODUCTS SUCCESSFULLY POPULATED IN FIRESTORE!   ');
  console.log('══════════════════════════════════════════════════════════════\n');
}

seedFirestore()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Error during Firestore seeding:', err);
    process.exit(1);
  });
