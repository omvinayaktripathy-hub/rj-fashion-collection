const express = require('express');
const router = express.Router();
const db = require('../database/db');

// List products with rich filtering, search, sorting and pagination
router.get('/', (req, res) => {
  try {
    const {
      search,
      category,
      minPrice,
      maxPrice,
      rating,
      discount,
      minDiscount,
      inStock,
      featured,
      newArrival,
      offer,
      sort,
      department,
      subcategory,
      page = 1,
      limit = 12
    } = req.query;

    let query = `
      SELECT p.*, c.name as category_name, c.slug as category_slug
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.active = 1
    `;
    const params = [];

    // Department filter (women, men, kids)
    if (department && department.trim()) {
      query += ` AND (LOWER(p.department) = LOWER(?) OR (p.department IS NULL AND LOWER(?) = 'women'))`;
      params.push(department.trim(), department.trim());
    }

    // Subcategory filter
    if (subcategory && subcategory.trim()) {
      const rawSub = subcategory.trim();
      const spacedSub = rawSub.replace(/-/g, ' ');
      const stem = (rawSub.endsWith('s') && !rawSub.endsWith('ss') && rawSub.length > 3) ? rawSub.slice(0, -1) : rawSub;
      const spacedStem = stem.replace(/-/g, ' ');

      query += ` AND (
        LOWER(p.subcategory) LIKE LOWER(?) OR 
        LOWER(p.subcategory) LIKE LOWER(?) OR 
        LOWER(p.name) LIKE LOWER(?) OR 
        LOWER(p.name) LIKE LOWER(?) OR
        LOWER(p.name) LIKE LOWER(?) OR
        LOWER(c.slug) LIKE LOWER(?) OR
        LOWER(c.name) LIKE LOWER(?)
      )`;
      params.push(`%${rawSub}%`, `%${spacedSub}%`, `%${rawSub}%`, `%${spacedSub}%`, `%${spacedStem}%`, `%${rawSub}%`, `%${spacedSub}%`);
    }

    // Search filter
    if (search && search.trim()) {
      const searchTerm = `%${search.trim()}%`;
      query += ` AND (p.name LIKE ? OR p.description LIKE ? OR p.material LIKE ? OR p.brand LIKE ? OR c.name LIKE ? OR p.subcategory LIKE ?)`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
    }

    // Category filter (slug or id)
    if (category) {
      if (!isNaN(category)) {
        query += ` AND p.category_id = ?`;
        params.push(Number(category));
      } else {
        query += ` AND (c.slug = ? OR LOWER(c.name) = LOWER(?))`;
        params.push(category.trim(), category.trim());
      }
    }

    // Price filters
    if (minPrice && !isNaN(minPrice)) {
      query += ` AND p.price >= ?`;
      params.push(Number(minPrice));
    }
    if (maxPrice && !isNaN(maxPrice)) {
      query += ` AND p.price <= ?`;
      params.push(Number(maxPrice));
    }

    // Rating filter
    if (rating && !isNaN(rating)) {
      query += ` AND p.rating >= ?`;
      params.push(Number(rating));
    }

    // Discount filter
    const effectiveDiscount = minDiscount || discount;
    if (effectiveDiscount && !isNaN(effectiveDiscount)) {
      query += ` AND p.discount >= ?`;
      params.push(Number(effectiveDiscount));
    }

    // Stock availability
    if (inStock === 'true' || inStock === '1') {
      query += ` AND p.stock > 0`;
    }

    // Flags
    if (featured === 'true' || featured === '1') {
      query += ` AND p.featured = 1`;
    }
    if (newArrival === 'true' || newArrival === '1') {
      query += ` AND p.new_arrival = 1`;
    }
    if (offer === 'true' || offer === '1') {
      query += ` AND (p.offer = 1 OR p.discount >= 40)`;
    }

    // Count total matching items before pagination
    const countQuery = `SELECT COUNT(*) as count FROM (${query})`;
    const countStmt = db.prepare(countQuery);
    const totalCount = countStmt.get(...params).count;

    // Sorting
    switch (sort) {
      case 'price_asc':
        query += ` ORDER BY p.price ASC`;
        break;
      case 'price_desc':
        query += ` ORDER BY p.price DESC`;
        break;
      case 'rating':
        query += ` ORDER BY p.rating DESC, p.reviews_count DESC`;
        break;
      case 'newest':
        query += ` ORDER BY p.created_at DESC`;
        break;
      case 'discount':
        query += ` ORDER BY p.discount DESC`;
        break;
      case 'relevance':
      default:
        query += ` ORDER BY p.featured DESC, p.id DESC`;
        break;
    }

    // Pagination
    const numLimit = Math.max(1, Math.min(100, Number(limit)));
    const numPage = Math.max(1, Number(page));
    const offset = (numPage - 1) * numLimit;

    query += ` LIMIT ? OFFSET ?`;
    params.push(numLimit, offset);

    const stmt = db.prepare(query);
    const rawProducts = stmt.all(...params);

    const products = rawProducts.map(p => ({
      ...p,
      additional_images: p.additional_images ? JSON.parse(p.additional_images) : [],
      available_sizes: p.available_sizes ? JSON.parse(p.available_sizes) : ['Free Size'],
      available_colors: p.available_colors ? JSON.parse(p.available_colors) : []
    }));

    res.json({
      success: true,
      products,
      pagination: {
        total: totalCount,
        page: numPage,
        limit: numLimit,
        totalPages: Math.ceil(totalCount / numLimit) || 1
      }
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve products' });
  }
});

// Single product details
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    let product;

    if (!isNaN(id)) {
      product = db.prepare(`
        SELECT p.*, c.name as category_name, c.slug as category_slug
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE p.id = ? AND p.active = 1
      `).get(Number(id));
    } else {
      product = db.prepare(`
        SELECT p.*, c.name as category_name, c.slug as category_slug
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE p.slug = ? AND p.active = 1
      `).get(id);
    }

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Parse JSON arrays
    product.additional_images = product.additional_images ? JSON.parse(product.additional_images) : [];
    product.available_sizes = product.available_sizes ? JSON.parse(product.available_sizes) : ['Free Size'];
    product.available_colors = product.available_colors ? JSON.parse(product.available_colors) : [];

    // Fetch product reviews
    const reviews = db.prepare('SELECT id, user_name, rating, comment, created_at FROM reviews WHERE product_id = ? ORDER BY created_at DESC').all(product.id);
    product.reviews = reviews;

    res.json({ success: true, product });
  } catch (error) {
    console.error('Error fetching product details:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve product details' });
  }
});

// Related products
router.get('/:id/related', (req, res) => {
  try {
    const { id } = req.params;
    const current = db.prepare('SELECT id, category_id FROM products WHERE id = ?').get(Number(id));
    if (!current) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const related = db.prepare(`
      SELECT p.*, c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.category_id = ? AND p.id != ? AND p.active = 1
      ORDER BY p.rating DESC, p.id DESC
      LIMIT 4
    `).all(current.category_id, current.id);

    res.json({ success: true, products: related });
  } catch (error) {
    console.error('Error fetching related products:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve related products' });
  }
});

// Submit a product review (requires login)
router.post('/:id/reviews', (req, res) => {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;
    const user = req.session && req.session.user;

    if (!user) {
      return res.status(401).json({ success: false, message: 'Please login to submit a review.' });
    }
    if (!rating || !comment || comment.trim().length < 10) {
      return res.status(400).json({ success: false, message: 'Rating and a comment of at least 10 characters are required.' });
    }
    const ratingNum = Number(rating);
    if (ratingNum < 1 || ratingNum > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5.' });
    }

    // Check product exists
    const product = db.prepare('SELECT id FROM products WHERE id = ? AND active = 1').get(Number(id));
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    // Prevent duplicate reviews by same user
    const existing = db.prepare('SELECT id FROM reviews WHERE product_id = ? AND user_id = ?').get(Number(id), user.id);
    if (existing) {
      return res.status(409).json({ success: false, message: 'You have already reviewed this product.' });
    }

    db.prepare('INSERT INTO reviews (product_id, user_id, user_name, rating, comment) VALUES (?, ?, ?, ?, ?)').run(
      Number(id), user.id, user.name, ratingNum, comment.trim()
    );

    // Update product average rating and reviews_count
    const stats = db.prepare('SELECT COUNT(*) as cnt, AVG(rating) as avg FROM reviews WHERE product_id = ?').get(Number(id));
    db.prepare('UPDATE products SET rating = ?, reviews_count = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(
      Math.round(stats.avg * 10) / 10, stats.cnt, Number(id)
    );

    res.status(201).json({ success: true, message: 'Review submitted successfully. Thank you!' });
  } catch (error) {
    console.error('Error submitting review:', error);
    res.status(500).json({ success: false, message: 'Failed to submit review.' });
  }
});

module.exports = router;
