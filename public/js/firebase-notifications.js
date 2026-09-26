// Firebase Notifications Client
// Project: rj-fashion-app

async function requestNotificationPermission() {
  if (!('Notification' in window) || !('serviceWorker' in navigator)) {
    console.log('Push notifications are not supported in this browser.');
    return;
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      const reg = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
      console.log('Firebase Service Worker registered:', reg.scope);

      // If Firebase SDK is loaded on page, get FCM token
      if (window.firebase && window.firebase.messaging) {
        const messaging = window.firebase.messaging();
        const token = await messaging.getToken({
          serviceWorkerRegistration: reg
        });
        if (token) {
          await fetch('/api/notifications/register-token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token })
          });
          console.log('Registered FCM Token with server.');
        }
      }
    }
  } catch (err) {
    console.warn('Notification permission or registration notice:', err.message);
  }
}
