// ===================================================================
// RJ FASHION COLLECTION - AUTHORITATIVE SERVER-SIDE PRICING ENGINE
// Computes item prices, coupons, shipping, and grand totals directly
// from database records. Never trusts client-supplied prices or discounts.
// ===================================================================

const db = require('../database/db');

/**
 * Valid promotional coupons recognized by RJ Fashion Collection.
 */
const VALID_COUPONS = {
  ROYAL10: {
    type: 'percentage',
    rate: 0.10, // 10% discount
    minSubtotal: 0,
    maxDiscount: 5000,
    description: '10% Royal Festive Celebration Discount'
  },
  FESTIVE10: {
    type: 'percentage',
    rate: 0.10,
    minSubtotal: 0,
    maxDiscount: 5000,
    description: '10% Festive Season Special'
  },
  RJFESTIVE: {
    type: 'percentage',
    rate: 0.10,
    minSubtotal: 0,
    maxDiscount: 5000,
    description: '10% RJ Festive Offer'
  },
  WELCOME500: {
    type: 'fixed',
    amount: 500,
    minSubtotal: 2999,
    description: '₹500 Welcome Discount on orders above ₹2999'
  }
};

/**
 * Validates a coupon code and calculates the discount against a subtotal.
 * @param {string} couponCode
 * @param {number} subtotal
 */
function evaluateCoupon(couponCode, subtotal) {
  if (!couponCode) return { valid: false, discount: 0, coupon: null };
  const normalized = String(couponCode).trim().toUpperCase();
  const rule = VALID_COUPONS[normalized];

  if (!rule) {
    return { valid: false, discount: 0, coupon: null, message: 'Invalid or expired coupon code.' };
  }

  if (subtotal < rule.minSubtotal) {
    return {
      valid: false,
      discount: 0,
      coupon: null,
      message: `Coupon ${normalized} requires a minimum order of ₹${rule.minSubtotal}.`
    };
  }

  let discount = 0;
  if (rule.type === 'percentage') {
    discount = Math.round(subtotal * rule.rate);
    if (rule.maxDiscount) discount = Math.min(discount, rule.maxDiscount);
  } else if (rule.type === 'fixed') {
    discount = Math.min(rule.amount, subtotal);
  }

  return {
    valid: true,
    discount,
    coupon: normalized,
    description: rule.description
  };
}

/**
 * Calculates authoritative server-side order totals.
 * Every product price is resolved directly from the database `products` table.
 * Client-provided prices, subtotals, and discounts are strictly ignored.
 *
 * @param {Array} rawCartItems - array of items with product_id (or id) and quantity
 * @param {string} couponCode - optional promotional coupon string
 */
function calculateServerPricing(rawCartItems, couponCode = '') {
  let subtotal = 0;
  const verifiedItems = [];

  for (const item of rawCartItems) {
    const prodId = Number(item.product_id || item.productId || item.id);
    if (!prodId || isNaN(prodId)) {
      continue;
    }

    // Always fetch authoritative price, stock, and info from database
    const prod = db.prepare('SELECT id, name, price, stock, image FROM products WHERE id = ?').get(prodId);
    if (!prod) {
      throw new Error(`Product ID #${prodId} was not found in catalog.`);
    }

    const qty = Math.max(1, Math.floor(Number(item.quantity) || 1));
    const itemPrice = Number(prod.price);
    const lineTotal = itemPrice * qty;

    subtotal += lineTotal;
    verifiedItems.push({
      product_id: prod.id,
      productId: prod.id,
      name: prod.name,
      price: itemPrice,
      quantity: qty,
      size: item.size || 'Free Size',
      color: item.color || '',
      image: prod.image,
      stock: prod.stock,
      lineTotal
    });
  }

  if (verifiedItems.length === 0) {
    return {
      subtotal: 0,
      shipping: 0,
      discount: 0,
      couponCode: null,
      total: 0,
      verifiedItems: []
    };
  }

  // Shipping calculation: Free over ₹999, else ₹49
  const shipping = subtotal > 999 ? 0 : 49;

  // Authoritative discount evaluation
  const couponResult = evaluateCoupon(couponCode, subtotal);
  const discount = couponResult.discount;

  // Grand total
  const total = Math.max(0, subtotal + shipping - discount);

  return {
    subtotal,
    shipping,
    discount,
    couponCode: couponResult.coupon,
    total,
    verifiedItems
  };
}

module.exports = {
  VALID_COUPONS,
  evaluateCoupon,
  calculateServerPricing
};
