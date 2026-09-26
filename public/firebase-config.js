// Firebase Web Configuration & Analytics Initialization
// Project: rj-fashion-collection

window.firebaseConfig = {
  apiKey: "AIzaSyBMkLwyXZINxOdq-hw7jFTVlnlFLdO_oTw",
  authDomain: "rj-fashion-collection.firebaseapp.com",
  projectId: "rj-fashion-collection",
  storageBucket: "rj-fashion-collection.firebasestorage.app",
  messagingSenderId: "136818820501",
  appId: "1:136818820501:web:251f54494df4209854a29c",
  measurementId: "G-LL5KRD9639"
};

// Initialize Firebase if compat libraries are present
if (typeof firebase !== 'undefined') {
  try {
    if (!firebase.apps.length) {
      firebase.initializeApp(window.firebaseConfig);
      console.log('🔥 [Firebase] Client app initialized for rj-fashion-collection');
    }
    if (typeof firebase.analytics === 'function') {
      firebase.analytics();
      console.log('📊 [Firebase] Analytics (G-LL5KRD9639) active');
    }
  } catch (err) {
    console.warn('[Firebase] Init notice:', err.message);
  }
}
