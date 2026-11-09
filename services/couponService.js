/**
 * RJ FASHION COLLECTION — STRICT COUPON & OFFER ANTI-ABUSE ENGINE
 * 
 * Business Policy:
 * "Each coupon code and offer code is strictly SINGLE-USE per customer AND SINGLE-USE per IP.
 * If the same person creates another ID/email or tries the same coupon code from the same IP,
 * it must be rejected as invalid."
 * 
 * Protections:
 * 1. Customer Isolation: 1 redemption per user ID & 1 redemption per email address.
 * 2. IP Quarantine: 1 redemption per IP address across all accounts (blocks multi-accounting).
 * 3. Authoritative Order Validation: Verified both during validation and at order creation.
 * 4. Comprehensive Audit Ledger: All redemptions permanently tracked in `coupon_redemptions`.
 */

const db = require('../database/db');

// Built-in promotions fallback in case they are not yet in promotions table
const BUILTIN_COUPONS = {
  GRANDRJ: {
    code: 'GRANDRJ',
    description: 'Inaugural Grand Opening 10% Privilege',
    discount_type: 'percentage',
    discount_value: 10,
    min_order_amount: 500,
    max_discount_amount: 500
  },
  ROYAL10: {
    code: 'ROYAL10',
    description: '10% Royal Festive Celebration Discount',
    discount_type: 'percentage',
    discount_value: 10,
    min_order_amount: 0,
    max_discount_amount: 5000
  },
  FESTIVE10: {
    code: 'FESTIVE10',
    description: '10% Festive Season Special',
    discount_type: 'percentage',
    discount_value: 10,
    min_order_amount: 0,
    max_discount_amount: 5000
  },
  RJFESTIVE: {
    code: 'RJFESTIVE',
    description: '10% RJ Festive Offer',
    discount_type: 'percentage',
    discount_value: 10,
    min_order_amount: 0,
    max_discount_amount: 5000
  },
  ROYAL100: {
    code: 'ROYAL100',
    description: 'Flat ₹100 Off on Celebration Wear',
    discount_type: 'fixed',
    discount_value: 100,
    min_order_amount: 999,
    max_discount_amount: 100
  },
  WELCOME500: {
    code: 'WELCOME500',
    description: '₹500 Welcome Discount on orders above ₹2,999',
    discount_type: 'fixed',
    discount_value: 500,
    min_order_amount: 2999,
    max_discount_amount: 500
  }
};

/**
 * Normalizes client IP address, handling proxies, load balancers, and IPv6 formatting
 */
function extractClientIp(req) {
  if (!req) return '127.0.0.1';
  let ip = '';
  const xForwardedFor = req.headers ? req.headers['x-forwarded-for'] : null;
  if (xForwardedFor) {
    ip = xForwardedFor.split(',')[0].trim();
  }
  if (!ip && req.headers) {
    ip = req.headers['x-real-ip'] || req.headers['cf-connecting-ip'] || req.headers['fastly-client-ip'];
  }
  if (!ip) {
    ip = req.ip || req.socket?.remoteAddress || req.connection?.remoteAddress || '127.0.0.1';
  }

  // Normalize IPv6-mapped IPv4 e.g. ::ffff:192.168.1.1 -> 192.168.1.1
  if (ip.startsWith('::ffff:')) {
    ip = ip.substring(7);
  }
  if (ip === '::1' || ip === 'localhost') {
    ip = '127.0.0.1';
  }
  return ip.trim();
}

/**
 * Resolves promotion definition from database or built-in dictionary
 */
function getPromotionDefinition(code) {
  if (!code) return null;
  const cleanCode = String(code).trim().toUpperCase();

  // 1. Check promotions table
  try {
    const promo = db.prepare('SELECT * FROM promotions WHERE UPPER(code) = ? AND active = 1').get(cleanCode);
    if (promo) return promo;
  } catch (_) {}

  // 2. Check built-in fallback
  if (BUILTIN_COUPONS[cleanCode]) {
    return BUILTIN_COUPONS[cleanCode];
  }

  return null;
}

/**
 * Authoritative Check: Is this coupon code eligible to be redeemed by this customer and IP?
 * Enforces:
 * 1. Single redemption per customer ID
 * 2. Single redemption per customer email
 * 3. Single redemption per client IP address (blocks multiple accounts / alternative IDs from same device/network)
 */
function checkCouponEligibility(couponCode, { userId = null, userEmail = '', userIp = '127.0.0.1', orderAmount = 0 } = {}) {
  if (!couponCode) {
    return { eligible: false, message: 'Please enter a coupon code.' };
  }

  const cleanCode = String(couponCode).trim().toUpperCase();
  const cleanEmail = String(userEmail || '').trim().toLowerCase();
  const cleanIp = String(userIp || '127.0.0.1').trim();
  const subtotal = Math.max(0, Number(orderAmount) || 0);

  // 1. Validate promotion exists & is active
  const promo = getPromotionDefinition(cleanCode);
  if (!promo) {
    return {
      eligible: false,
      code: cleanCode,
      message: `Coupon code "${cleanCode}" is invalid or has expired.`
    };
  }

  // 2. Check global usage limit if defined
  if (promo.usage_limit && promo.times_used && promo.times_used >= promo.usage_limit) {
    return {
      eligible: false,
      code: cleanCode,
      message: `Coupon code "${cleanCode}" has reached its maximum total redemptions.`
    };
  }

  // 3. CHECK USER ID REDEMPTION HISTORY
  if (userId) {
    // Check coupon_redemptions table
    const usedByUser = db.prepare(`
      SELECT id, order_number FROM coupon_redemptions 
      WHERE coupon_code = ? AND user_id = ?
    `).get(cleanCode, Number(userId));

    if (usedByUser) {
      return {
        eligible: false,
        code: cleanCode,
        reason: 'ALREADY_USED_BY_USER',
        message: `You have already redeemed coupon "${cleanCode}" on order #${usedByUser.order_number || usedByUser.id}. Each coupon code can only be used once per customer.`
      };
    }

    // Also check historical orders table
    const usedInOrders = db.prepare(`
      SELECT id, order_number FROM orders 
      WHERE coupon_code = ? AND user_id = ?
    `).get(cleanCode, Number(userId));

    if (usedInOrders) {
      return {
        eligible: false,
        code: cleanCode,
        reason: 'ALREADY_USED_BY_USER',
        message: `You have already redeemed coupon "${cleanCode}" on a previous order. Each offer code is single-use only.`
      };
    }
  }

  // 4. CHECK EMAIL REDEMPTION HISTORY (Prevents logging in with another session on same email)
  if (cleanEmail) {
    const usedByEmail = db.prepare(`
      SELECT id, order_number FROM coupon_redemptions 
      WHERE coupon_code = ? AND LOWER(user_email) = ?
    `).get(cleanCode, cleanEmail);

    if (usedByEmail) {
      return {
        eligible: false,
        code: cleanCode,
        reason: 'ALREADY_USED_BY_EMAIL',
        message: `Coupon "${cleanCode}" has already been redeemed with email address ${cleanEmail}. Each coupon code is valid for single use only.`
      };
    }

    const usedInOrdersEmail = db.prepare(`
      SELECT id, order_number FROM orders 
      WHERE coupon_code = ? AND LOWER(customer_email) = ?
    `).get(cleanCode, cleanEmail);

    if (usedInOrdersEmail) {
      return {
        eligible: false,
        code: cleanCode,
        reason: 'ALREADY_USED_BY_EMAIL',
        message: `Coupon "${cleanCode}" has already been redeemed with your email address on a previous order.`
      };
    }
  }

  // 5. CHECK IP ADDRESS REDEMPTION HISTORY (Crucial Anti-Abuse: Blocks multi-accounting on same IP)
  if (cleanIp && cleanIp !== 'unknown') {
    const usedByIp = db.prepare(`
      SELECT id, order_number, user_email FROM coupon_redemptions 
      WHERE coupon_code = ? AND user_ip = ?
    `).get(cleanCode, cleanIp);

    if (usedByIp) {
      return {
        eligible: false,
        code: cleanCode,
        reason: 'ALREADY_USED_BY_IP',
        message: `This coupon code has already been redeemed from your IP address / device. To ensure fairness, each offer is strictly limited to one redemption per IP.`
      };
    }

    const usedInOrdersIp = db.prepare(`
      SELECT id, order_number FROM orders 
      WHERE coupon_code = ? AND user_ip = ?
    `).get(cleanCode, cleanIp);

    if (usedInOrdersIp) {
      return {
        eligible: false,
        code: cleanCode,
        reason: 'ALREADY_USED_BY_IP',
        message: `This offer code has already been claimed from your device or IP address. Each promotion is single-use per IP.`
      };
    }
  }

  // 6. Check Minimum Spend Requirement
  const minOrder = Number(promo.min_order_amount) || 0;
  if (minOrder > 0 && subtotal > 0 && subtotal < minOrder) {
    return {
      eligible: false,
      code: cleanCode,
      reason: 'MIN_ORDER_NOT_MET',
      message: `Coupon "${cleanCode}" requires a minimum order amount of ₹${minOrder.toLocaleString('en-IN')}. (Your subtotal is ₹${subtotal.toLocaleString('en-IN')})`
    };
  }

  // 7. Calculate Discount Amount
  let discount = 0;
  if (promo.discount_type === 'percentage') {
    discount = Math.round((subtotal * promo.discount_value) / 100);
    if (promo.max_discount_amount && discount > promo.max_discount_amount) {
      discount = promo.max_discount_amount;
    }
  } else {
    // Fixed amount
    discount = Math.min(subtotal > 0 ? subtotal : promo.discount_value, promo.discount_value);
  }

  return {
    eligible: true,
    code: cleanCode,
    description: promo.description || `Special Privilege (${cleanCode})`,
    discount_type: promo.discount_type,
    discount_value: promo.discount_value,
    discount_amount: discount,
    min_order_amount: minOrder,
    message: `${promo.description || cleanCode} applied successfully! 🎉`
  };
}

/**
 * Records a successful coupon redemption upon order completion
 */
function recordCouponRedemption({ couponCode, userId = null, userEmail = '', userIp = '127.0.0.1', orderId = null, orderNumber = '', discountAmount = 0 }) {
  if (!couponCode) return null;
  const cleanCode = String(couponCode).trim().toUpperCase();
  const cleanEmail = String(userEmail || '').trim().toLowerCase();
  const cleanIp = String(userIp || '127.0.0.1').trim();

  try {
    const insert = db.prepare(`
      INSERT INTO coupon_redemptions (
        coupon_code, user_id, user_email, user_ip, order_id, order_number, discount_amount
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const result = insert.run(
      cleanCode,
      userId ? Number(userId) : null,
      cleanEmail,
      cleanIp,
      orderId ? Number(orderId) : null,
      orderNumber,
      Number(discountAmount) || 0
    );

    // Update promotions times_used counter
    try {
      db.prepare('UPDATE promotions SET times_used = times_used + 1 WHERE UPPER(code) = ?').run(cleanCode);
    } catch (_) {}

    console.log(`[COUPON-SERVICE] 🎟️ Redemption recorded: Coupon "${cleanCode}" for User ${userId || cleanEmail} on IP ${cleanIp} (Order: ${orderNumber})`);

    return {
      id: Number(result.lastInsertRowid),
      couponCode: cleanCode,
      userIp: cleanIp,
      userEmail: cleanEmail
    };
  } catch (err) {
    console.error('[COUPON-SERVICE] Failed to record redemption:', err.message);
    return null;
  }
}

module.exports = {
  extractClientIp,
  getPromotionDefinition,
  checkCouponEligibility,
  recordCouponRedemption
};
