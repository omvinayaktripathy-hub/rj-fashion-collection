// RJ FASHION COLLECTION - Official PhonePe Payment Gateway Service
// Supports UPI (PhonePe, GPay, Paytm, BHIM), Credit/Debit Cards, Net Banking, Wallets, and EMI
// Standard Checkout Pay Page Integration with Cryptographic Checksum Validation

const crypto = require('node:crypto');

// Configuration from environment variables / Secret Manager
const PHONEPE_ENV = process.env.PHONEPE_ENV || 'sandbox'; // 'sandbox' or 'production'
const PHONEPE_MERCHANT_ID = process.env.PHONEPE_MERCHANT_ID || 'PGTESTPAYUAT86';
const PHONEPE_SALT_KEY = process.env.PHONEPE_SALT_KEY || '96434309-7796-489d-8924-ab56988a6076';
const PHONEPE_SALT_INDEX = process.env.PHONEPE_SALT_INDEX || '1';
const PHONEPE_ENABLED = process.env.PHONEPE_ENABLED !== 'false';

// Host URLs as defined by PhonePe Official Documentation
const PHONEPE_HOST_URL = process.env.PHONEPE_HOST_URL || (
  PHONEPE_ENV === 'production'
    ? 'https://api.phonepe.com/apis/hermes'
    : 'https://api-preprod.phonepe.com/apis/pg-sandbox'
);

// Official Merchant UPI and Terminal identifiers
const MERCHANT_UPI_ID = process.env.MERCHANT_UPI_ID || 'Q070080131@ybl';
const MERCHANT_TERMINAL_ID = process.env.MERCHANT_TERMINAL_ID || 'Terminal 1-Q070080131';
const MERCHANT_DISPLAY_NAME = 'RJ FASHION';

/**
 * Generate unique merchant transaction ID
 * Example: MT_RJFC_1794240000000_9281
 */
function generateMerchantTransactionId(prefix = 'MT_RJFC') {
  const timestamp = Date.now();
  const randomBytes = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `${prefix}_${timestamp}_${randomBytes}`;
}

/**
 * Generate SHA256 checksum for PhonePe requests
 * @param {string} payloadString - Base64 payload or path string
 * @param {string} endpoint - API path (e.g. '/pg/v1/pay') or empty
 * @param {string} saltKey - PhonePe salt key
 * @param {string|number} saltIndex - PhonePe salt index
 */
function generateChecksum(payloadString, endpoint = '', saltKey = PHONEPE_SALT_KEY, saltIndex = PHONEPE_SALT_INDEX) {
  const stringToHash = `${payloadString}${endpoint}${saltKey}`;
  const sha256 = crypto.createHash('sha256').update(stringToHash).digest('hex');
  return `${sha256}###${saltIndex}`;
}

/**
 * Cryptographically verify PhonePe response / webhook signature
 * Uses timingSafeEqual to guard against timing side-channel attacks
 * @param {string} base64Response - Base64 encoded response string from PhonePe
 * @param {string} receivedXVerify - Value of X-VERIFY header
 * @param {string} saltKey - PhonePe salt key
 * @param {string|number} saltIndex - PhonePe salt index
 */
function verifySignature(base64Response, receivedXVerify, saltKey = PHONEPE_SALT_KEY, saltIndex = PHONEPE_SALT_INDEX) {
  if (!base64Response || !receivedXVerify) return false;

  const expectedChecksum = generateChecksum(base64Response, '', saltKey, saltIndex);
  try {
    const receivedBuffer = Buffer.from(receivedXVerify);
    const expectedBuffer = Buffer.from(expectedChecksum);
    if (receivedBuffer.length !== expectedBuffer.length) {
      return false;
    }
    return crypto.timingSafeEqual(receivedBuffer, expectedBuffer);
  } catch (err) {
    return false;
  }
}

/**
 * Verify status API signature
 * @param {string} merchantId
 * @param {string} merchantTransactionId
 * @param {string} receivedXVerify
 */
function verifyStatusSignature(merchantId, merchantTransactionId, receivedXVerify, saltKey = PHONEPE_SALT_KEY, saltIndex = PHONEPE_SALT_INDEX) {
  if (!merchantId || !merchantTransactionId || !receivedXVerify) return false;
  const path = `/pg/v1/status/${merchantId}/${merchantTransactionId}`;
  const expectedChecksum = generateChecksum(path, '', saltKey, saltIndex);
  try {
    const receivedBuffer = Buffer.from(receivedXVerify);
    const expectedBuffer = Buffer.from(expectedChecksum);
    if (receivedBuffer.length !== expectedBuffer.length) {
      return false;
    }
    return crypto.timingSafeEqual(receivedBuffer, expectedBuffer);
  } catch (err) {
    return false;
  }
}

/**
 * Initiate a Standard Checkout payment with PhonePe (POST /pg/v1/pay)
 * @param {Object} params
 * @param {string} params.merchantTransactionId - Unique transaction ID
 * @param {string|number} params.merchantUserId - Customer ID or customer identifier
 * @param {number} params.amountInPaise - Exact amount in paise (1 INR = 100 paise)
 * @param {string} params.redirectUrl - Customer browser redirect URL after payment
 * @param {string} params.callbackUrl - Server-to-server webhook URL
 * @param {string} [params.mobileNumber] - Customer mobile number (10 digits)
 */
async function initiatePayment({
  merchantTransactionId,
  merchantUserId,
  amountInPaise,
  redirectUrl,
  callbackUrl,
  mobileNumber = '9999999999',
  paymentType = 'PAY_PAGE',
  targetApp = '',
  deviceOS = 'ANDROID',
  redirectMode = 'REDIRECT'
}) {
  if (!amountInPaise || amountInPaise <= 0 || !Number.isInteger(amountInPaise)) {
    throw new Error('Invalid amount in paise: must be a positive integer');
  }
  if (!merchantTransactionId) {
    throw new Error('merchantTransactionId is required');
  }

  // Format clean 10-digit mobile number for PhonePe
  const cleanMobile = String(mobileNumber || '').replace(/\D/g, '').slice(-10) || '9999999999';

  // Map friendly app alias to official Android package name when UPI_INTENT is requested
  const appPackageMap = {
    PHONEPE: 'com.phonepe.app',
    GPAY: 'com.google.android.apps.nbu.paisa.user',
    PAYTM: 'net.one97.paytm',
    BHIM: 'in.org.npci.upiapp'
  };
  const normalizedApp = String(targetApp || '').toUpperCase();
  const useIntent = paymentType === 'UPI_INTENT' || Boolean(normalizedApp && normalizedApp !== 'PAY_PAGE');

  const paymentInstrument = useIntent
    ? {
        type: 'UPI_INTENT',
        ...(appPackageMap[normalizedApp] ? { targetApp: appPackageMap[normalizedApp] } : {})
      }
    : { type: 'PAY_PAGE' };

  const payload = {
    merchantId: PHONEPE_MERCHANT_ID,
    merchantTransactionId,
    merchantUserId: String(merchantUserId || 'guest_user'),
    amount: amountInPaise,
    redirectUrl,
    redirectMode: redirectMode === 'POST' ? 'POST' : 'REDIRECT',
    callbackUrl,
    mobileNumber: cleanMobile,
    ...(useIntent ? { deviceContext: { deviceOS: String(deviceOS || 'ANDROID').toUpperCase() } } : {}),
    paymentInstrument
  };

  const base64Payload = Buffer.from(JSON.stringify(payload)).toString('base64');
  const xVerify = generateChecksum(base64Payload, '/pg/v1/pay', PHONEPE_SALT_KEY, PHONEPE_SALT_INDEX);

  // If in simulated offline test mode
  if (process.env.PHONEPE_SIMULATE === 'true') {
    return {
      success: true,
      code: 'PAYMENT_INITIATED',
      message: 'Simulated Payment Initiated Successfully',
      data: {
        merchantId: PHONEPE_MERCHANT_ID,
        merchantTransactionId,
        instrumentResponse: useIntent
          ? {
              type: 'UPI_INTENT',
              intentUrl: `${redirectUrl}&merchantTransactionId=${merchantTransactionId}&simulated=true`
            }
          : {
              type: 'PAY_PAGE',
              redirectInfo: {
                url: `${redirectUrl}?merchantTransactionId=${merchantTransactionId}&simulated=true`,
                method: 'GET'
              }
            }
      }
    };
  }

  try {
    const response = await fetch(`${PHONEPE_HOST_URL}/pg/v1/pay`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-VERIFY': xVerify
      },
      body: JSON.stringify({
        request: base64Payload
      })
    });

    const data = await response.json();
    return data;
  } catch (err) {
    console.error('[PhonePe Service] initiatePayment error:', err.message);
    throw new Error(`PhonePe Payment Initiation Failed: ${err.message}`);
  }
}

/**
 * Check payment status directly with PhonePe (GET /pg/v1/status/{merchantId}/{merchantTransactionId})
 * Authoritative server-to-server check
 * @param {string} merchantTransactionId - The merchant transaction ID to check
 */
async function checkPaymentStatus(merchantTransactionId) {
  if (!merchantTransactionId) {
    throw new Error('merchantTransactionId is required for status check');
  }

  const endpointPath = `/pg/v1/status/${PHONEPE_MERCHANT_ID}/${merchantTransactionId}`;
  const xVerify = generateChecksum(endpointPath, '', PHONEPE_SALT_KEY, PHONEPE_SALT_INDEX);

  // If in simulated offline test mode
  if (process.env.PHONEPE_SIMULATE === 'true') {
    return {
      success: true,
      code: 'PAYMENT_SUCCESS',
      message: 'Simulated Payment Successful',
      data: {
        merchantId: PHONEPE_MERCHANT_ID,
        merchantTransactionId,
        transactionId: `TXN_${Date.now()}`,
        amount: 10000,
        state: 'COMPLETED',
        responseCode: 'SUCCESS',
        paymentInstrument: {
          type: 'UPI',
          utr: `UTR${Date.now()}`
        }
      }
    };
  }

  try {
    const response = await fetch(`${PHONEPE_HOST_URL}${endpointPath}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-VERIFY': xVerify,
        'X-MERCHANT-ID': PHONEPE_MERCHANT_ID
      }
    });

    const data = await response.json();
    return data;
  } catch (err) {
    console.error('[PhonePe Service] checkPaymentStatus error:', err.message);
    throw new Error(`PhonePe Status Verification Failed: ${err.message}`);
  }
}

/**
 * Verify and decode an incoming PhonePe webhook callback
 * @param {string} base64Response - Base64 encoded response string from request body
 * @param {string} xVerifyHeader - X-VERIFY header sent by PhonePe
 */
function verifyAndDecodeCallback(base64Response, xVerifyHeader) {
  if (!base64Response || !xVerifyHeader) {
    return {
      isValid: false,
      error: 'Missing response payload or X-VERIFY signature header',
      payload: null
    };
  }

  const isValid = verifySignature(base64Response, xVerifyHeader, PHONEPE_SALT_KEY, PHONEPE_SALT_INDEX);
  if (!isValid) {
    return {
      isValid: false,
      error: 'Invalid cryptographic signature in X-VERIFY header',
      payload: null
    };
  }

  try {
    const decodedString = Buffer.from(base64Response, 'base64').toString('utf8');
    const parsedPayload = JSON.parse(decodedString);
    return {
      isValid: true,
      payload: parsedPayload,
      error: null
    };
  } catch (err) {
    return {
      isValid: false,
      error: `Failed to decode or parse JSON payload: ${err.message}`,
      payload: null
    };
  }
}

/**
 * Process a Refund with PhonePe (POST /pg/v1/refund)
 * Requires admin authorization
 * @param {Object} params
 * @param {string} params.originalTransactionId - PhonePe transactionId or merchantTransactionId
 * @param {string} params.refundTransactionId - New unique merchant transaction ID for refund
 * @param {string|number} params.merchantUserId - Customer ID
 * @param {number} params.amountInPaise - Exact refund amount in paise
 * @param {string} [params.callbackUrl] - Webhook callback for refund status
 */
async function processRefund({
  originalTransactionId,
  refundTransactionId,
  merchantUserId,
  amountInPaise,
  callbackUrl = ''
}) {
  if (!amountInPaise || amountInPaise <= 0 || !Number.isInteger(amountInPaise)) {
    throw new Error('Invalid refund amount: must be a positive integer in paise');
  }
  if (!originalTransactionId) {
    throw new Error('originalTransactionId is required for refund');
  }

  const refId = refundTransactionId || generateMerchantTransactionId('REF_RJFC');

  const payload = {
    merchantId: PHONEPE_MERCHANT_ID,
    merchantUserId: String(merchantUserId || 'admin'),
    originalTransactionId,
    merchantTransactionId: refId,
    amount: amountInPaise,
    callbackUrl
  };

  const base64Payload = Buffer.from(JSON.stringify(payload)).toString('base64');
  const xVerify = generateChecksum(base64Payload, '/pg/v1/refund', PHONEPE_SALT_KEY, PHONEPE_SALT_INDEX);

  if (process.env.PHONEPE_SIMULATE === 'true') {
    return {
      success: true,
      code: 'PAYMENT_SUCCESS',
      message: 'Simulated Refund Processed Successfully',
      data: {
        merchantId: PHONEPE_MERCHANT_ID,
        merchantTransactionId: refId,
        transactionId: `REF_${Date.now()}`,
        amount: amountInPaise,
        state: 'COMPLETED',
        responseCode: 'SUCCESS'
      }
    };
  }

  try {
    const response = await fetch(`${PHONEPE_HOST_URL}/pg/v1/refund`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-VERIFY': xVerify,
        'X-MERCHANT-ID': PHONEPE_MERCHANT_ID
      },
      body: JSON.stringify({
        request: base64Payload
      })
    });

    const data = await response.json();
    return data;
  } catch (err) {
    console.error('[PhonePe Service] processRefund error:', err.message);
    throw new Error(`PhonePe Refund Failed: ${err.message}`);
  }
}

module.exports = {
  PHONEPE_ENV,
  PHONEPE_MERCHANT_ID,
  PHONEPE_SALT_KEY,
  PHONEPE_SALT_INDEX,
  PHONEPE_ENABLED,
  PHONEPE_HOST_URL,
  MERCHANT_UPI_ID,
  MERCHANT_TERMINAL_ID,
  MERCHANT_DISPLAY_NAME,
  generateMerchantTransactionId,
  generateChecksum,
  verifySignature,
  verifyStatusSignature,
  initiatePayment,
  checkPaymentStatus,
  verifyAndDecodeCallback,
  processRefund
};
