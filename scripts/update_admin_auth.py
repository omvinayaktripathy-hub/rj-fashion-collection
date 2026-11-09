path = 'C:/Users/omvin/.gemini/antigravity/scratch/RJ-Fashion-Collection/public/js/admin.js'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

old_admin_config = '''function ensureFirebaseInitialized() {
  if (typeof firebase !== 'undefined') {
    if (!firebase.apps || !firebase.apps.length) {
      const config = window.firebaseConfig || {
        apiKey: "AIzaSyBMkLwyXZINxOdq-hw7jFTVlnlFLdO_oTw",
        authDomain: "rj-fashion-collection.firebaseapp.com",
        projectId: "rj-fashion-collection",
        storageBucket: "rj-fashion-collection.firebasestorage.app",
        messagingSenderId: "136818820501",
        appId: "1:136818820501:web:251f54494df4209854a29c",
        measurementId: "G-LL5KRD9639"
      };
      firebase.initializeApp(config);'''

new_admin_config = '''function ensureFirebaseInitialized() {
  if (typeof firebase !== 'undefined') {
    if (!firebase.apps || !firebase.apps.length) {
      const currentHost = (typeof window !== 'undefined' && window.location && window.location.hostname) ? window.location.hostname : '';
      const resolvedAuthDomain = (currentHost && (currentHost.includes('web.app') || currentHost.includes('firebaseapp.com')))
        ? currentHost
        : "rj-fashion-collection.firebaseapp.com";

      const config = window.firebaseConfig || {
        apiKey: "AIzaSyBMkLwyXZINxOdq-hw7jFTVlnlFLdO_oTw",
        authDomain: resolvedAuthDomain,
        projectId: "rj-fashion-collection",
        storageBucket: "rj-fashion-collection.firebasestorage.app",
        messagingSenderId: "136818820501",
        appId: "1:136818820501:web:251f54494df4209854a29c",
        measurementId: "G-LL5KRD9639"
      };
      firebase.initializeApp(config);'''

for sep in ['\n', '\r\n']:
    target = old_admin_config if sep == '\n' else old_admin_config.replace('\n', '\r\n')
    rep = new_admin_config if sep == '\n' else new_admin_config.replace('\n', '\r\n')
    if target in content:
        content = content.replace(target, rep)
        print("Updated ensureFirebaseInitialized in admin.js")
        break

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
