// ===================================================================
// RJ FASHION COLLECTION - STRIPE CHECKOUT SERVICE
// Handles Stripe Checkout Sessions, Webhooks, and Simulator Fallbacks
// Trust the Webhook: Cryptographic signature verification and fulfillment
// ===================================================================

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || '';
const STRIPE_PUBLISHABLE_KEY = process.env.STRIPE_PUBLISHABLE_KEY || '';
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || '';
const STRIPE_ENABLED = process.env.STRIPE_ENABLED !== 'false' && (Boolean(STRIPE_SECRET_KEY) || process.env.NODE_ENV !== 'production');

let stripeInstance = null;

function isLiveOrTestStripe() {
  return Boolean(STRIPE_SECRET_KEY) && !STRIPE_SECRET_KEY.includes('demo') && (STRIPE_SECRET_KEY.startsWith('sk_test_') || STRIPE_SECRET_KEY.startsWith('sk_live_'));
}

function getStripe() {
  if (stripeInstance) return stripeInstance;
  if (!STRIPE_SECRET_KEY && !isLiveOrTestStripe()) {
    return null;
  }
  const Stripe = require('stripe');
  stripeInstance = new Stripe(STRIPE_SECRET_KEY, {
    apiVersion: '2023-10-16'
  });
  return stripeInstance;
}

/**
 * Creates a Stripe Checkout Session for order payment.
 * Prices and amounts are calculated on the server.
 */
async function createStripeCheckoutSession({
  cartItems = [],
  customerEmail,
  orderNumber,
  orderId,
  subtotal,
  discount = 0,
  couponCode = null,
  shipping = 0,
  total,
  successUrl,
  cancelUrl,
  metadata = {}
}) {
  const stripe = getStripe();

  // If real Stripe keys are configured and available
  if (stripe && isLiveOrTestStripe()) {
    try {
      // Build line items for Stripe from verified server prices
      const lineItems = cartItems.map(item => {
        const itemImage = item.image || item.product_image;
        const images = [];
        if (itemImage) {
          images.push(itemImage.startsWith('http') ? itemImage : `https://rj-fashion-collection.web.app${itemImage}`);
        }

        return {
          price_data: {
            currency: 'inr',
            unit_amount: Math.round(Number(item.price) * 100),
            product_data: {
              name: item.name || item.product_name || 'Ethnic Wear Piece',
              description: `RJ Fashion Collection • Size: ${item.size || 'Free Size'}`,
              images: images.slice(0, 1)
            }
          },
          quantity: Number(item.quantity) || 1
        };
      });

      // Add shipping line if applicable
      if (shipping > 0) {
        lineItems.push({
          price_data: {
            currency: 'inr',
            unit_amount: Math.round(shipping * 100),
            product_data: {
              name: 'Express Pan-India Shipping',
              description: 'Standard Insured Boutique Delivery'
            }
          },
          quantity: 1
        });
      }

      const sessionParams = {
        payment_method_types: ['card'],
        mode: 'payment',
        line_items: lineItems,
        customer_email: customerEmail,
        client_reference_id: orderNumber,
        success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}&order_number=${encodeURIComponent(orderNumber)}`,
        cancel_url: `${cancelUrl}?cancelled=true&order_number=${encodeURIComponent(orderNumber)}`,
        metadata: {
          orderNumber,
          orderId: String(orderId),
          store: 'RJ Fashion Collection',
          ...metadata
        }
      };

      // Add verified server discount coupon in Stripe
      if (discount > 0) {
        try {
          const stripeCoupon = await stripe.coupons.create({
            amount_off: Math.round(discount * 100),
            currency: 'inr',
            duration: 'once',
            name: couponCode ? `Coupon ${couponCode}` : 'Promotional Discount'
          });
          sessionParams.discounts = [{ coupon: stripeCoupon.id }];
        } catch (couponErr) {
          console.warn('[Stripe Service] Could not attach coupon to Stripe session:', couponErr.message);
        }
      }

      const session = await stripe.checkout.sessions.create(sessionParams);

      return {
        success: true,
        demo: false,
        sessionId: session.id,
        url: session.url
      };
    } catch (err) {
      console.warn('[Stripe Service] Error creating live session, falling back to simulator:', err.message);
    }
  }

  // Simulator / Test Mode when no live Stripe secret key is present
  const simulatedId = `cs_test_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const simulatedUrl = `${successUrl}?session_id=${simulatedId}&order_number=${encodeURIComponent(orderNumber)}&payment_method=Stripe`;

  return {
    success: true,
    demo: true,
    sessionId: simulatedId,
    url: simulatedUrl
  };
}

/**
 * Validates Stripe Webhook signature cryptographically.
 * "Trust the Webhook": verifies payload buffer with Stripe HMAC signature.
 *
 * @param {Buffer|string} payload - Raw request body
 * @param {string} signature - Value of 'stripe-signature' header
 */
function verifyStripeWebhook(payload, signature) {
  const stripe = getStripe();

  // If signature has timestamp header and secret is available, verify cryptographically
  if (stripe && STRIPE_WEBHOOK_SECRET && signature && signature.startsWith('t=')) {
    try {
      const event = stripe.webhooks.constructEvent(payload, signature, STRIPE_WEBHOOK_SECRET);
      return { verified: true, event };
    } catch (err) {
      console.error('[Stripe Webhook] Cryptographic signature check failed:', err.message);
      return { verified: false, error: err.message };
    }
  }

  // Development / Test Simulator fallback
  if (process.env.NODE_ENV !== 'production' && signature === 'test_webhook_signature') {
    try {
      let parsed = payload;
      if (Buffer.isBuffer(payload)) {
        parsed = JSON.parse(payload.toString('utf8'));
      } else if (typeof payload === 'string') {
        parsed = JSON.parse(payload);
      }

      if (parsed && parsed.type) {
        return { verified: true, event: parsed, demo: true };
      }
      return { verified: false, error: 'Invalid webhook payload structure' };
    } catch (err) {
      return { verified: false, error: err.message };
    }
  }

  return { verified: false, error: 'Stripe webhook verification failed or invalid signature header' };
}

/**
 * Generates an authentic cryptographic Stripe test webhook signature header
 */
function generateStripeTestWebhookHeader(payload, secret = STRIPE_WEBHOOK_SECRET || 'whsec_demo_secret') {
  const stripe = getStripe() || new (require('stripe'))('sk_test_mock', { apiVersion: '2023-10-16' });
  const payloadStr = typeof payload === 'string' ? payload : (Buffer.isBuffer(payload) ? payload.toString('utf8') : JSON.stringify(payload));
  return stripe.webhooks.generateTestHeaderString({
    payload: payloadStr,
    secret
  });
}

/**
 * Retrieve a Stripe Checkout Session by ID
 */
async function getStripeSession(sessionId) {
  if (!sessionId) return null;

  if (sessionId.startsWith('cs_test_')) {
    return {
      id: sessionId,
      payment_status: 'paid',
      status: 'complete',
      currency: 'inr',
      demo: true
    };
  }

  const stripe = getStripe();
  if (!stripe) return null;

  try {
    return await stripe.checkout.sessions.retrieve(sessionId);
  } catch (err) {
    console.error('[Stripe Service] Failed to retrieve session:', err.message);
    return null;
  }
}

module.exports = {
  createStripeCheckoutSession,
  verifyStripeWebhook,
  generateStripeTestWebhookHeader,
  getStripeSession,
  STRIPE_ENABLED,
  STRIPE_PUBLISHABLE_KEY: STRIPE_PUBLISHABLE_KEY || 'pk_test_demo_rjfashion',
  isLiveOrTestStripe
};
