// Firebase Cloud Messaging Service Worker
// Project: rj-fashion-collection

importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyBMkLwyXZINxOdq-hw7jFTVlnlFLdO_oTw",
  authDomain: "rj-fashion-collection.firebaseapp.com",
  projectId: "rj-fashion-collection",
  storageBucket: "rj-fashion-collection.firebasestorage.app",
  messagingSenderId: "136818820501",
  appId: "1:136818820501:web:251f54494df4209854a29c",
  measurementId: "G-LL5KRD9639"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message:', payload);
  const notificationTitle = payload.notification?.title || 'RJ Fashion Collection ✨';
  const notificationOptions = {
    body: payload.notification?.body || 'You have an update on your royal fashion order.',
    icon: '/images/favicon.png',
    badge: '/images/favicon.png',
    data: payload.data || { url: '/orders.html' }
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = event.notification.data?.url || '/orders.html';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (let client of windowClients) {
        if (client.url.includes(urlToOpen) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
