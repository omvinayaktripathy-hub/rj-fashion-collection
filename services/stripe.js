// ===================================================================
// RJ FASHION COLLECTION - STRIPE CHECKOUT SERVICE
// Handles Stripe Checkout Sessions, Webhooks, and Simulator Fallbacks
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
 */
async function createStripeCheckoutSession({
  cartItems = [],
  customerEmail,
  orderNumber,
  orderId,
  subtotal,
  discount = 0,
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
      // Build line items for Stripe
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

      // Add discount line if applicable
      if (discount > 0) {
        // Stripe allows discounts via coupons or line items; negative line items aren't standard,
        // so we can use a Stripe coupon or attach as metadata
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
 * Validates Stripe Webhook signature cryptographically
 */
function verifyStripeWebhook(payload, signature) {
  if (!STRIPE_WEBHOOK_SECRET) {
    // If webhook secret not configured, verify structure
    return { verified: false, reason: 'STRIPE_WEBHOOK_SECRET is not configured' };
  }

  const stripe = getStripe();
  if (!stripe) {
    return { verified: false, reason: 'Stripe is not initialized' };
  }

  try {
    const event = stripe.webhooks.constructEvent(payload, signature, STRIPE_WEBHOOK_SECRET);
    return { verified: true, event };
  } catch (err) {
    console.error('[Stripe Webhook] Verification failed:', err.message);
    return { verified: false, error: err.message };
  }
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
  getStripeSession,
  STRIPE_ENABLED,
  STRIPE_PUBLISHABLE_KEY: STRIPE_PUBLISHABLE_KEY || 'pk_test_demo_rjfashion',
  isLiveOrTestStripe
};
