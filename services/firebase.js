// RJ FASHION COLLECTION - Firebase Integration Service
// Project: rj-fashion-app
// Features: Firestore Database, Cloud Messaging (FCM Push Notifications), Cloud Storage

const path = require('node:path');
const fs = require('node:fs');

let admin = null;
let db = null;
let messaging = null;

const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID || 'rj-fashion-app';
const serviceAccountPath = path.join(__dirname, '..', 'serviceAccountKey.json');

function initFirebase() {
  if (admin) return { admin, db, messaging, isReady: true };

  try {
    admin = require('firebase-admin');

    if (fs.existsSync(serviceAccountPath)) {
      const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: FIREBASE_PROJECT_ID
      });
      console.log(`[Firebase] Initialized with Service Account for project: ${FIREBASE_PROJECT_ID}`);
    } else {
      // Initialize with Application Default Credentials or Project ID
      admin.initializeApp({
        projectId: FIREBASE_PROJECT_ID
      });
      console.log(`[Firebase] Initialized in default mode for project: ${FIREBASE_PROJECT_ID}`);
    }

    try {
      db = admin.firestore();
    } catch (e) {
      console.warn('[Firebase] Firestore not initialized:', e.message);
    }

    try {
      messaging = admin.messaging();
    } catch (e) {
      console.warn('[Firebase] Cloud Messaging not initialized:', e.message);
    }

    return { admin, db, messaging, isReady: true };
  } catch (err) {
    console.warn('[Firebase] Note: Firebase initialized in simulated mode. Place serviceAccountKey.json to activate full live cloud sync.', err.message);
    return { admin: null, db: null, messaging: null, isReady: false };
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
        click_action: data.url || 'https://rj-fashion-collection.netlify.app/orders.html'
      },
      webpush: {
        fcmOptions: {
          link: data.url || 'https://rj-fashion-collection.netlify.app/orders.html'
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
  const { db, isReady } = initFirebase();
  if (!isReady || !db) return false;

  try {
    await db.collection('orders').doc(order.order_number).set({
      ...order,
      synced_at: new Date().toISOString()
    }, { merge: true });
    console.log(`[Firestore] Synced order #${order.order_number}`);
    return true;
  } catch (err) {
    console.warn('[Firestore] Sync order failed:', err.message);
    return false;
  }
}

module.exports = {
  initFirebase,
  sendPushNotification,
  syncOrderToFirestore,
  FIREBASE_PROJECT_ID
};
