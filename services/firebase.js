// RJ FASHION COLLECTION - Firebase Production Security & Integration Service
// Project: rj-fashion-collection
// Features: Cloud Firestore, Firebase Authentication, Cloud Storage, Cloud Messaging (FCM)

const path = require('node:path');
const fs = require('node:fs');

let adminApp = null;
let db = null;
let messaging = null;
let auth = null;
let storage = null;

const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID || 'rj-fashion-collection';
const FIREBASE_STORAGE_BUCKET = process.env.FIREBASE_STORAGE_BUCKET || `${FIREBASE_PROJECT_ID}.firebasestorage.app`;
const serviceAccountPath = path.join(__dirname, '..', 'serviceAccountKey.json');

function initFirebase() {
  if (db && auth) {
    return { adminApp, db, messaging, auth, storage, isReady: true };
  }

  try {
    const { getApps, initializeApp, cert } = require('firebase-admin/app');
    const { getFirestore } = require('firebase-admin/firestore');
    const { getMessaging } = require('firebase-admin/messaging');
    const { getAuth } = require('firebase-admin/auth');
    const { getStorage } = require('firebase-admin/storage');

    if (getApps().length > 0) {
      adminApp = getApps()[0];
    } else if (fs.existsSync(serviceAccountPath)) {
      const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
      adminApp = initializeApp({
        credential: cert(serviceAccount),
        projectId: FIREBASE_PROJECT_ID,
        storageBucket: FIREBASE_STORAGE_BUCKET
      });
      console.log(`[Firebase] Initialized with Service Account for project: ${FIREBASE_PROJECT_ID}`);
    } else {
      adminApp = initializeApp({
        projectId: FIREBASE_PROJECT_ID,
        storageBucket: FIREBASE_STORAGE_BUCKET
      });
      console.log(`[Firebase] Initialized in default mode for project: ${FIREBASE_PROJECT_ID}`);
    }

    try {
      db = getFirestore(adminApp);
    } catch (e) {
      console.warn('[Firebase] Firestore not initialized:', e.message);
    }

    try {
      messaging = getMessaging(adminApp);
    } catch (e) {
      console.warn('[Firebase] Cloud Messaging not initialized:', e.message);
    }

    try {
      auth = getAuth(adminApp);
    } catch (e) {
      console.warn('[Firebase] Auth not initialized:', e.message);
    }

    try {
      storage = getStorage(adminApp);
    } catch (e) {
      console.warn('[Firebase] Storage not initialized:', e.message);
    }

    return { adminApp, db, messaging, auth, storage, isReady: !!(db || auth) };
  } catch (err) {
    console.warn('[Firebase] Running in simulated mode:', err.message);
    return { adminApp: null, db: null, messaging: null, auth: null, storage: null, isReady: false };
  }
}

// ─────────────────────────────────────────────────────────────
// Firebase Authentication: Server-Side ID Token Verification
// ─────────────────────────────────────────────────────────────
async function verifyFirebaseToken(idToken) {
  if (!idToken || typeof idToken !== 'string') return null;
  const { auth, isReady } = initFirebase();
  if (!isReady || !auth) return null;

  try {
    const decodedToken = await auth.verifyIdToken(idToken);
    return decodedToken;
  } catch (err) {
    console.warn('[Firebase Auth] Verification failed:', err.message);
    return null;
  }
}

// Set custom claims (e.g. { admin: true, role: 'admin' })
async function setAdminCustomClaim(uid, isAdmin = true) {
  const { auth, isReady } = initFirebase();
  if (!isReady || !auth || !uid) return false;

  try {
    await auth.setCustomUserClaims(uid, {
      admin: !!isAdmin,
      role: isAdmin ? 'admin' : 'customer'
    });
    console.log(`[Firebase Auth] Updated custom claims for UID: ${uid} (admin: ${isAdmin})`);
    return true;
  } catch (err) {
    console.error('[Firebase Auth] Failed to set custom claims:', err.message);
    return false;
  }
}

// ─────────────────────────────────────────────────────────────
// Cloud Storage: Signed Short-Lived URL Generation
// ─────────────────────────────────────────────────────────────
async function getSecureStorageUrl(filePath, expiryMinutes = 60) {
  const { storage, isReady } = initFirebase();
  if (!isReady || !storage || !filePath) return null;

  try {
    const bucket = storage.bucket();
    const file = bucket.file(filePath);
    const [exists] = await file.exists();
    if (!exists) return null;

    const [signedUrl] = await file.getSignedUrl({
      action: 'read',
      expires: Date.now() + expiryMinutes * 60 * 1000
    });
    return signedUrl;
  } catch (err) {
    console.warn('[Firebase Storage] Signed URL generation failed:', err.message);
    return null;
  }
}

// ─────────────────────────────────────────────────────────────
// Cloud Messaging: Send Web Push Notifications
// ─────────────────────────────────────────────────────────────
async function sendPushNotification(token, title, body, data = {}) {
  const { messaging, isReady } = initFirebase();
  if (!isReady || !messaging || !token) {
    console.log(`[FCM Simulated] Notification to [${token?.slice(0, 10)}...]: "${title}" - ${body}`);
    return { success: true, simulated: true };
  }

  try {
    const message = {
      token,
      notification: {
        title,
        body
      },
      data: {
        ...data,
        click_action: data.url || 'https://rj-fashion-collection.web.app/orders.html'
      },
      webpush: {
        fcmOptions: {
          link: data.url || 'https://rj-fashion-collection.web.app/orders.html'
        }
      }
    };

    const response = await messaging.send(message);
    console.log('[FCM] Successfully sent message:', response);
    return { success: true, response };
  } catch (err) {
    console.error('[FCM] Error sending message:', err.message);
    return { success: false, error: err.message };
  }
}

// ─────────────────────────────────────────────────────────────
// Cloud Sync: Sync Orders to Firestore
// ─────────────────────────────────────────────────────────────
async function syncOrderToFirestore(order) {
  const { db, auth: fbAuth, isReady } = initFirebase();
  if (!isReady || !db) return false;

  try {
    let resolvedUserId = order.userId || order.firebase_uid || null;
    if (!resolvedUserId && fbAuth && order.customer_email) {
      try {
        const fbUser = await fbAuth.getUserByEmail(String(order.customer_email).trim());
        if (fbUser && fbUser.uid) resolvedUserId = fbUser.uid;
      } catch (_) {}
    }

    const payload = {
      ...order,
      synced_at: new Date().toISOString()
    };
    if (resolvedUserId) {
      payload.userId = resolvedUserId;
    }

    await db.collection('orders').doc(order.order_number).set(payload, { merge: true });
    console.log(`[Firestore] Synced order #${order.order_number}`);
    return true;
  } catch (err) {
    console.warn('[Firestore] Sync order failed:', err.message);
    return false;
  }
}

module.exports = {
  initFirebase,
  verifyFirebaseToken,
  setAdminCustomClaim,
  getSecureStorageUrl,
  sendPushNotification,
  syncOrderToFirestore,
  FIREBASE_PROJECT_ID,
  FIREBASE_STORAGE_BUCKET
};
