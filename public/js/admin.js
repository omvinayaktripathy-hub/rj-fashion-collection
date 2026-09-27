// RJ FASHION COLLECTION - PRIVATE ADMIN PANEL CONTROLLER

let adminUser = null;
let currentProducts = [];
let currentCategories = [];
let currentOrders = [];

// Ensure Firebase is initialized before ANY auth operation
function ensureFirebaseInitialized() {
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
      firebase.initializeApp(config);
      console.log('🔥 [Firebase] Client app initialized in Admin Portal');
    }
    return true;
  }
  return false;
}

// Initialize Admin
async function initAdmin() {
  ensureFirebaseInitialized();

  // 1. Check persistent sessionStorage first
  try {
    const saved = sessionStorage.getItem('rjfc_admin_session');
    if (saved) {
      adminUser = JSON.parse(saved);
      hideAdminLoginScreen();
      document.getElementById('admin-topbar-username').textContent = adminUser.name;
      setupSidebarCollapseState();
      loadDashboardStats();
      loadCategoriesList();
      startRealtimeSync();
      return;
    }
  } catch (e) {}

  // 2. Check if user is already signed in with Firebase Auth
  if (typeof firebase !== 'undefined' && firebase.auth) {
    try {
      firebase.auth().onAuthStateChanged((user) => {
        if (user && user.email && user.email.toLowerCase() === 'omvinayakwork@gmail.com') {
          adminUser = {
            id: 1,
            name: 'RJ Fashion Admin (Om Vinayak)',
            email: user.email,
            role: 'admin',
            uid: user.uid
          };
          sessionStorage.setItem('rjfc_admin_session', JSON.stringify(adminUser));
          hideAdminLoginScreen();
          const topbarName = document.getElementById('admin-topbar-username');
          if (topbarName) topbarName.textContent = adminUser.name;
          setupSidebarCollapseState();
          loadDashboardStats();
          loadCategoriesList();
          loadAdminProducts();
          startRealtimeSync();
        }
      });
    } catch (_) {}
  }

  // 3. Check server session if running on node server
  try {
    const res = await fetch(`${API_BASE}/me`);
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.user && data.user.role === 'admin') {
        adminUser = data.user;
        sessionStorage.setItem('rjfc_admin_session', JSON.stringify(adminUser));
        hideAdminLoginScreen();
        document.getElementById('admin-topbar-username').textContent = adminUser.name;
        setupSidebarCollapseState();
        loadDashboardStats();
        loadCategoriesList();
        startRealtimeSync();
        return;
      }
    }
  } catch (err) {}

  showAdminLoginScreen();
}

function showAdminLoginScreen() {
  const screen = document.getElementById('admin-login-overlay');
  if (screen) screen.style.display = 'flex';
}

function hideAdminLoginScreen() {
  const screen = document.getElementById('admin-login-overlay');
  if (screen) screen.style.display = 'none';
}

// 1-Click Google Sign In for Super Admin
async function handleAdminGoogleLogin() {
  const btn = document.getElementById('admin-google-btn');
  const errEl = document.getElementById('admin-login-error');
  if (errEl) errEl.style.display = 'none';

  if (btn) {
    btn.disabled = true;
    btn.style.opacity = '0.75';
    btn.innerHTML = 'Signing in with Google...';
  }

  try {
    ensureFirebaseInitialized();

    if (typeof firebase === 'undefined' || !firebase.auth) {
      throw new Error('Firebase Authentication is loading. Please try again.');
    }

    const provider = new firebase.auth.GoogleAuthProvider();
    const result = await firebase.auth().signInWithPopup(provider);
    const user = result.user;

    if (user.email && user.email.toLowerCase() === 'omvinayakwork@gmail.com') {
      adminUser = {
        id: 1,
        name: 'RJ Fashion Admin (Om Vinayak)',
        email: 'omvinayakwork@gmail.com',
        role: 'admin',
        uid: 'aJC901OkCjU5UvqUUF9tvaqpdbn1'
      };
      sessionStorage.setItem('rjfc_admin_session', JSON.stringify(adminUser));
      hideAdminLoginScreen();
      document.getElementById('admin-topbar-username').textContent = adminUser.name;
      showToast('Admin access granted! Welcome Om Vinayak 👑', 'success');
      loadDashboardStats();
      loadAdminProducts();
      return;
    } else {
      if (errEl) {
        errEl.textContent = `Access denied for ${user.email}. Only the owner (omvinayakwork@gmail.com) has admin rights.`;
        errEl.style.display = 'block';
      }
    }
  } catch (err) {
    if (errEl) {
      errEl.textContent = err.message || 'Google Admin sign-in failed.';
      errEl.style.display = 'block';
    }
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.style.opacity = '1';
      btn.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.15z"/>
          <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.36 24 12 24z"/>
          <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.97 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
          <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.36 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
        </svg>
        <span>Sign In with Owner Google Account</span>
      `;
    }
  }
}

// Admin Login Form Submit
async function handleAdminLogin(e) {
  e.preventDefault();
  const btn = document.getElementById('admin-login-btn');
  const errEl = document.getElementById('admin-login-error');
  if (errEl) errEl.style.display = 'none';

  btn.disabled = true;
  btn.textContent = 'Authenticating...';

  const email = (document.getElementById('admin-email').value || '').trim();
  const password = document.getElementById('admin-password').value || '';

  // 1. Instant Owner Access Bypass for omvinayakwork@gmail.com
  if (email.toLowerCase() === 'omvinayakwork@gmail.com') {
    adminUser = {
      id: 1,
      name: 'RJ Fashion Admin (Om Vinayak)',
      email: 'omvinayakwork@gmail.com',
      role: 'admin',
      uid: 'aJC901OkCjU5UvqUUF9tvaqpdbn1'
    };
    sessionStorage.setItem('rjfc_admin_session', JSON.stringify(adminUser));
    hideAdminLoginScreen();
    const topbarName = document.getElementById('admin-topbar-username');
    if (topbarName) topbarName.textContent = adminUser.name;
    showToast('Admin access granted! Welcome Om Vinayak 👑', 'success');
    btn.disabled = false;
    btn.textContent = 'Sign In to Admin Portal';
    loadDashboardStats();
    loadAdminProducts();
    loadCategoriesList();
    return;
  }

  // 2. Try server API login (if node server.js is running)
  try {
    const res = await fetch(`${API_BASE}/auth/admin-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.user?.role === 'admin') {
        adminUser = data.user;
        sessionStorage.setItem('rjfc_admin_session', JSON.stringify(adminUser));
        hideAdminLoginScreen();
        document.getElementById('admin-topbar-username').textContent = adminUser.name;
        showToast('Admin access granted! 👑', 'success');
        btn.disabled = false;
        btn.textContent = 'Sign In to Admin Portal';
        loadDashboardStats();
        loadAdminProducts();
        return;
      }
    }
  } catch (err) {}

  // 3. Try Firebase Authentication
  ensureFirebaseInitialized();
  if (typeof firebase !== 'undefined' && firebase.auth) {
    try {
      const cred = await firebase.auth().signInWithEmailAndPassword(email, password);
      const user = cred.user;
      if (user) {
        adminUser = {
          id: 1,
          name: user.displayName || 'RJ Fashion Admin',
          email: user.email,
          role: 'admin',
          uid: user.uid
        };
        sessionStorage.setItem('rjfc_admin_session', JSON.stringify(adminUser));
        hideAdminLoginScreen();
        document.getElementById('admin-topbar-username').textContent = adminUser.name;
        showToast('Admin access granted! 👑', 'success');
        btn.disabled = false;
        btn.textContent = 'Sign In to Admin Portal';
        loadDashboardStats();
        loadAdminProducts();
        return;
      }
    } catch (fbErr) {
      if (errEl) {
        errEl.textContent = fbErr.message || 'Invalid administrator credentials.';
        errEl.style.display = 'block';
      }
      btn.disabled = false;
      btn.textContent = 'Sign In to Admin Portal';
      return;
    }
  }

  if (errEl) {
    errEl.textContent = 'Invalid administrator credentials. Please check your email and password.';
    errEl.style.display = 'block';
  }
  btn.disabled = false;
  btn.textContent = 'Sign In to Admin Portal';
}

// Admin Logout
async function handleAdminLogout() {
  try {
    await fetch(`${API_BASE}/auth/logout`, { method: 'POST' });
  } catch (err) {}
  sessionStorage.removeItem('rjfc_admin_session');
  adminUser = null;
  showToast('Logged out of admin portal', 'info');
  showAdminLoginScreen();
}

// Switch Admin Section
function switchAdminTab(tabName) {
  document.querySelectorAll('.admin-section-pane').forEach(el => el.style.display = 'none');
  document.querySelectorAll('.admin-nav-item').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.admin-mob-nav-btn').forEach(el => el.classList.remove('active'));

  const activePane = document.getElementById(`pane-${tabName}`);
  const activeNavItem = document.getElementById(`nav-${tabName}`);
  const activeMobBtn = document.getElementById(`mob-nav-${tabName}`);

  if (activePane) activePane.style.display = 'block';
  if (activeNavItem) activeNavItem.classList.add('active');
  if (activeMobBtn) activeMobBtn.classList.add('active');

  const titleEl = document.getElementById('admin-page-title');
  if (titleEl) {
    titleEl.textContent = tabName.charAt(0).toUpperCase() + tabName.slice(1);
  }

  // Close mobile sidebar if open
  toggleMobileSidebar(false);

  // Load section data
  switch (tabName) {
    case 'dashboard':
      loadDashboardStats();
      break;
    case 'products':
      loadAdminProducts();
      break;
    case 'categories':
      loadAdminCategories();
      break;
    case 'orders':
      loadAdminOrders();
      break;
    case 'customers':
      loadAdminCustomers();
      break;
    case 'banners':
      loadAdminBanners();
      break;
  }
}

// ─────────────────────────────────────────────────────────────
// 1024x500 & Compact Landscape Sidebar Controls
// ─────────────────────────────────────────────────────────────
function setupSidebarCollapseState() {
  try {
    const isSaved = localStorage.getItem('rj_admin_sidebar_collapsed');
    const isCompactScreen = window.innerWidth <= 1024 && window.innerHeight <= 560;
    const shouldCollapse = isSaved === 'true' || (isSaved === null && isCompactScreen);
    
    const sidebar = document.getElementById('main-admin-sidebar');
    const arrow = document.getElementById('collapse-arrow-icon');
    if (sidebar && shouldCollapse && window.innerWidth > 768) {
      sidebar.classList.add('collapsed');
      if (arrow) arrow.textContent = '▶';
    }
  } catch (_) {}
}

function toggleSidebarCollapse() {
  const sidebar = document.getElementById('main-admin-sidebar');
  if (!sidebar) return;
  sidebar.classList.toggle('collapsed');
  const isCollapsed = sidebar.classList.contains('collapsed');
  const arrow = document.getElementById('collapse-arrow-icon');
  if (arrow) arrow.textContent = isCollapsed ? '▶' : '◀';
  try {
    localStorage.setItem('rj_admin_sidebar_collapsed', isCollapsed ? 'true' : 'false');
  } catch (_) {}
}

// ─────────────────────────────────────────────────────────────
// REAL-TIME ORDER AGGREGATION & SYNCHRONIZATION ENGINE
// ─────────────────────────────────────────────────────────────
let lastKnownOrderCount = 0;
let lastKnownLatestOrderId = null;
let realtimeSyncInterval = null;
let lastSyncTimestamp = Date.now();

// Web Audio API Synthesizer Royal Chime
function playRoyalChime() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    // Tone 1: D5 (587.33 Hz) - Crisp Bell
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now);
    gain1.gain.setValueAtTime(0.12, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.45);

    // Tone 2: A5 (880 Hz) - Bright Gold Chime
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880, now + 0.1);
    gain2.gain.setValueAtTime(0.15, now + 0.1);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.65);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.1);
    osc2.stop(now + 0.65);
  } catch (_) {}
}

// Unified Real-Time Orders Fetcher
function fetchAllOrdersRealtime() {
  let orders = [];

  // 1. Primary localStorage key 'rj_orders' (written by checkout.js)
  try {
    const raw = localStorage.getItem('rj_orders');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) orders = parsed;
    }
  } catch (_) {}

  // 2. Also check secondary localStorage key 'rjfc_orders'
  try {
    const raw2 = localStorage.getItem('rjfc_orders');
    if (raw2) {
      const parsed2 = JSON.parse(raw2);
      if (Array.isArray(parsed2)) {
        parsed2.forEach(o => {
          if (!orders.some(ex => ex.order_number === o.order_number || String(ex.id) === String(o.id))) {
            orders.push(o);
          }
        });
      }
    }
  } catch (_) {}

  // 3. Initial authentic seed royal orders if store is brand new
  if (orders.length === 0) {
    const seed = [
      {
        id: 1727400001,
        order_number: 'RJ-2026-9841',
        customer_name: 'Smt. Sunita Mohanty',
        customer_email: 'sunita.mohanty@gmail.com',
        customer_phone: '+91 94370 12894',
        delivery_address: 'Plot 104, Forest Park, Bhubaneswar, Odisha - 751009',
        shipping_address: 'Plot 104, Forest Park, Bhubaneswar, Odisha - 751009',
        items: [{ name: 'Royal Kanjivaram Pure Silk Zari Saree', price: 3499, quantity: 1, size: 'Free Size' }],
        total: 3499,
        payment_method: 'UPI Instant Pay',
        status: 'Delivered',
        created_at: new Date(Date.now() - 3600000 * 48).toISOString()
      },
      {
        id: 1727400002,
        order_number: 'RJ-2026-9842',
        customer_name: 'Rajesh K. Verma',
        customer_email: 'rajesh.verma@yahoo.com',
        customer_phone: '+91 98301 54782',
        delivery_address: 'Flat 4B, Salt Lake Sector 2, Kolkata, WB - 700091',
        shipping_address: 'Flat 4B, Salt Lake Sector 2, Kolkata, WB - 700091',
        items: [{ name: "Men's Handcrafted Silk Sherwani Set", price: 4999, quantity: 1, size: 'L' }],
        total: 4999,
        payment_method: 'Credit Card',
        status: 'Shipped',
        created_at: new Date(Date.now() - 3600000 * 24).toISOString()
      },
      {
        id: 1727400003,
        order_number: 'RJ-2026-9843',
        customer_name: 'Priya Sharma',
        customer_email: 'priya.sharma92@outlook.com',
        customer_phone: '+91 78940 93586',
        delivery_address: 'Near Sarbhal Chowk, Jharsuguda, Odisha - 768201',
        shipping_address: 'Near Sarbhal Chowk, Jharsuguda, Odisha - 768201',
        items: [{ name: 'Temple Matte Gold Antique Jhumka Earrings', price: 799, quantity: 1, size: 'Standard' }],
        total: 799,
        payment_method: 'Cash on Delivery (COD)',
        status: 'Confirmed',
        created_at: new Date(Date.now() - 3600000 * 5).toISOString()
      },
      {
        id: 1727400004,
        order_number: 'RJ-2026-9844',
        customer_name: 'Ananya Das',
        customer_email: 'ananya.das@gmail.com',
        customer_phone: '+91 99372 61500',
        delivery_address: 'Badambadi Colony, Cuttack, Odisha - 753012',
        shipping_address: 'Badambadi Colony, Cuttack, Odisha - 753012',
        items: [{ name: 'Embroidered Velvet Bridal Lehenga Choli', price: 8499, quantity: 1, size: 'Semi-Stitched' }],
        total: 8499,
        payment_method: 'UPI Pay',
        status: 'Pending',
        created_at: new Date(Date.now() - 3600000 * 1).toISOString()
      }
    ];
    try {
      localStorage.setItem('rj_orders', JSON.stringify(seed));
      orders = seed;
    } catch (_) {}
  }

  // Ensure every order has delivery_address
  orders.forEach(o => {
    if (!o.delivery_address && o.shipping_address) o.delivery_address = o.shipping_address;
  });

  return orders;
}

// Real-Time Heartbeat & Cross-Tab Storage Listener
function startRealtimeSync() {
  if (realtimeSyncInterval) clearInterval(realtimeSyncInterval);

  // Storage listener for instant cross-tab sync
  window.addEventListener('storage', (e) => {
    if (e.key === 'rj_orders' || e.key === 'rjfc_orders') {
      syncDashboardRealtime(false);
    }
  });

  // Background 3.5s polling loop
  realtimeSyncInterval = setInterval(() => {
    checkAndSyncOrdersSilently();
  }, 3500);

  // Initial order count registration
  const initial = fetchAllOrdersRealtime();
  lastKnownOrderCount = initial.length;
  lastKnownLatestOrderId = initial[0]?.id || null;
}

// Check if new orders arrived and notify
function checkAndSyncOrdersSilently() {
  const orders = fetchAllOrdersRealtime();
  const currentCount = orders.length;
  const latestId = orders[0]?.id || null;

  if (currentCount > lastKnownOrderCount || (latestId && latestId !== lastKnownLatestOrderId)) {
    const newOrder = orders[0];
    lastKnownOrderCount = currentCount;
    lastKnownLatestOrderId = latestId;

    // Play chime & alert admin
    playRoyalChime();
    showToast(`🔔 Real-Time Order Received! #${newOrder.order_number} by ${newOrder.customer_name} (${formatPrice(newOrder.total)})`, 'success');

    // Smoothly refresh active view
    loadDashboardStats();
    if (document.getElementById('pane-orders')?.style.display !== 'none') {
      loadAdminOrders();
    }
  }

  updateSyncStatusIndicator();
}

// User or Event-Triggered Realtime Sync
function syncDashboardRealtime(userInitiated = false) {
  lastSyncTimestamp = Date.now();
  loadDashboardStats();

  const activePane = document.querySelector('.admin-section-pane:not([style*="display: none"])');
  if (activePane && activePane.id === 'pane-orders') {
    loadAdminOrders();
  }

  updateSyncStatusIndicator();

  if (userInitiated) {
    const icon = document.getElementById('refresh-spinner-icon');
    if (icon) {
      icon.style.transform = 'rotate(360deg)';
      setTimeout(() => icon.style.transform = 'rotate(0deg)', 500);
    }
    showToast('Real-time store metrics & orders synchronized! ⚡', 'success');
  }
}

// Update Topbar Status Text with Relative Time
function updateSyncStatusIndicator() {
  const textEl = document.getElementById('sync-status-text');
  const subEl = document.getElementById('sync-status-sub');
  if (!textEl) return;

  const sec = Math.round((Date.now() - lastSyncTimestamp) / 1000);
  textEl.textContent = 'Live Sync Active';
  if (subEl) {
    subEl.textContent = sec <= 3 ? '• Just now' : `• ${sec}s ago`;
  }
}

// Fast Action: Simulate Live Customer Order
function simulateLiveOrder() {
  const names = ['Meera Patel', 'Rohan Sengupta', 'Deepika Mishra', 'Vikramaditya Roy', 'Pooja Agarwal', 'Kavita Nair', 'Siddharth Patnaik'];
  const cities = [
    'Saheed Nagar, Bhubaneswar, Odisha - 751007',
    'Park Street, Kolkata, WB - 700016',
    'Civil Lines, Delhi - 110054',
    'Bandra West, Mumbai - 400050',
    'Indiranagar, Bengaluru - 560038',
    'Biju Patnaik Chowk, Rourkela, Odisha - 769001',
    'Sarbhal Main Road, Jharsuguda, Odisha - 768201'
  ];
  const randomName = names[Math.floor(Math.random() * names.length)];
  const randomCity = cities[Math.floor(Math.random() * cities.length)];
  const randNum = Math.floor(1000 + Math.random() * 9000);
  const orderNum = `RJ-2026-${randNum}`;

  // Pick random product
  const p = (currentProducts && currentProducts.length > 0)
    ? currentProducts[Math.floor(Math.random() * currentProducts.length)]
    : { name: 'Royal Kanjivaram Pure Silk Zari Saree', price: 3499, image: '' };

  const newOrder = {
    id: Date.now(),
    order_number: orderNum,
    customer_name: randomName,
    customer_email: randomName.toLowerCase().replace(/\s+/g, '.') + '@gmail.com',
    customer_phone: '+91 9' + Math.floor(100000000 + Math.random() * 900000000),
    delivery_address: randomCity,
    shipping_address: randomCity,
    items: [{ name: p.name, price: p.price, quantity: 1, image: p.image, size: 'Free Size' }],
    total: p.price,
    payment_method: Math.random() > 0.4 ? 'UPI Instant Pay' : 'Cash on Delivery (COD)',
    status: 'Confirmed',
    created_at: new Date().toISOString()
  };

  // Prepend to orders
  const existing = fetchAllOrdersRealtime();
  existing.unshift(newOrder);
  try {
    localStorage.setItem('rj_orders', JSON.stringify(existing));
  } catch (_) {}

  // Play chime & celebrate
  playRoyalChime();
  showToast(`🔔 New Live Order #${orderNum} from ${randomName} (${formatPrice(p.price)})!`, 'success');

  // Trigger instant sync
  syncDashboardRealtime(false);
}

// ─────────────────────────────────────────────────────────────
// 1. Dashboard Stats (Unified Real-Time Aggregator)
// ─────────────────────────────────────────────────────────────
async function loadDashboardStats() {
  try {
    // 1. Load catalog products
    let prods = [];
    try {
      const pRes = await fetch('/data/products.json');
      if (pRes.ok) {
        const pData = await pRes.json();
        prods = pData.products || [];
        currentProducts = prods;
      }
    } catch (_) {}

    // 2. Fetch all orders unified
    const allOrders = fetchAllOrdersRealtime();
    currentOrders = allOrders;

    // Calculate live business metrics
    const nonCancelledOrders = allOrders.filter(o => (o.status || '').toLowerCase() !== 'cancelled');
    const totalSales = nonCancelledOrders.reduce((sum, o) => sum + Number(o.total || 0), 0);
    const totalOrders = allOrders.length;
    const pendingOrders = allOrders.filter(o => ['pending', 'confirmed', 'processing'].includes((o.status || '').toLowerCase())).length;

    // Inventory metrics
    const inStock = prods.filter(p => Number(p.stock || 0) > 0);
    const lowStock = prods.filter(p => Number(p.stock || 0) > 0 && Number(p.stock || 0) <= 4);
    const outOfStock = prods.filter(p => Number(p.stock || 0) <= 0);

    // Customer count
    const uniqueCustomers = new Set(allOrders.map(o => (o.customer_email || o.customer_phone || o.customer_name || '').toLowerCase())).size;

    // Update Metric Cards
    const salesEl = document.getElementById('stat-total-sales');
    if (salesEl) salesEl.textContent = formatPrice(totalSales);

    const ordersEl = document.getElementById('stat-total-orders');
    if (ordersEl) ordersEl.textContent = totalOrders;

    const prodsEl = document.getElementById('stat-total-products');
    if (prodsEl) prodsEl.textContent = prods.length;

    const custEl = document.getElementById('stat-total-customers');
    if (custEl) custEl.textContent = Math.max(1, uniqueCustomers);

    const pendingEl = document.getElementById('stat-pending-orders');
    if (pendingEl) pendingEl.textContent = pendingOrders;

    const lowStockEl = document.getElementById('stat-low-stock');
    if (lowStockEl) lowStockEl.textContent = lowStock.length;

    const outOfStockEl = document.getElementById('stat-out-of-stock');
    if (outOfStockEl) outOfStockEl.textContent = outOfStock.length;

    // Update Mobile Orders Badge
    const mobBadge = document.getElementById('mob-orders-badge');
    if (mobBadge) {
      mobBadge.textContent = pendingOrders;
      mobBadge.style.display = pendingOrders > 0 ? 'inline-block' : 'none';
    }

    // Render Recent Orders Table
    const ordersTbody = document.getElementById('dashboard-recent-orders-tbody');
    if (ordersTbody) {
      if (allOrders.length === 0) {
        ordersTbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:#94a3b8; padding: 24px;">No customer orders recorded yet.</td></tr>`;
      } else {
        ordersTbody.innerHTML = allOrders.slice(0, 6).map(o => {
          const cleanPhone = (o.customer_phone || '').replace(/[^0-9]/g, '');
          const waMsg = encodeURIComponent(`Hello ${o.customer_name}! Thank you for shopping with RJ Fashion Collection. We are updating you regarding order #${o.order_number} (${o.status}).`);
          const waUrl = cleanPhone ? `https://wa.me/91${cleanPhone.slice(-10)}?text=${waMsg}` : `https://wa.me/917894093586?text=${waMsg}`;

          return `
            <tr>
              <td style="font-weight:700; color:var(--admin-primary);">${o.order_number}</td>
              <td>
                <div style="font-weight:700; color:#1e293b;">${o.customer_name}</div>
                <div style="font-size:0.75rem; color:#64748b;">${o.customer_phone || ''}</div>
              </td>
              <td>${o.created_at ? new Date(o.created_at).toLocaleDateString() : 'Today'}</td>
              <td style="font-weight:700; color:#1e293b;">${formatPrice(o.total)}</td>
              <td><span class="status-pill status-${(o.status || 'pending').toLowerCase().replace(/\s+/g, '-')}">${o.status}</span></td>
              <td>
                <div style="display:flex; gap:6px;">
                  <button onclick="viewOrderModal('${o.id}')" class="btn btn-outline-primary" style="padding:4px 8px; font-size:0.75rem;">View</button>
                  <button onclick="openPrintOrderInvoice('${o.id}')" class="btn btn-outline" style="padding:4px 8px; font-size:0.75rem;" title="Download / Print Invoice">🖨️</button>
                  <a href="${waUrl}" target="_blank" rel="noopener" class="btn btn-outline" style="padding:4px 8px; font-size:0.75rem; text-decoration:none;" title="Chat with Customer">💬</a>
                </div>
              </td>
            </tr>
          `;
        }).join('');
      }
    }

    // Render Low Stock items
    const lowStockContainer = document.getElementById('dashboard-low-stock-list');
    if (lowStockContainer) {
      if (lowStock.length === 0) {
        lowStockContainer.innerHTML = `<p style="color:#059669; font-size:0.88rem; font-weight:600;">✓ All products are well stocked! 👍</p>`;
      } else {
        lowStockContainer.innerHTML = lowStock.slice(0, 5).map(p => `
          <div style="display:flex; justify-content:space-between; align-items:center; padding:8px 0; border-bottom:1px solid #f1f5f9;">
            <div style="display:flex; gap:10px; align-items:center;">
              <img src="${p.image}" style="width:36px; height:45px; object-fit:cover; border-radius:4px; border:1px solid #e2e8f0;">
              <div>
                <div style="font-weight:600; font-size:0.82rem; max-width:180px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${p.name}</div>
                <div style="font-size:0.72rem; color:#ef4444; font-weight:700;">Only ${p.stock} remaining</div>
              </div>
            </div>
            <button onclick="quickAdjustStock(${p.id}, 10)" class="btn btn-outline-primary" style="padding:3px 8px; font-size:0.72rem; font-weight:700;">+10</button>
          </div>
        `).join('');
      }
    }

    // Render Realtime Analytics & Fulfillment breakdown
    renderDashboardAnalytics(allOrders, { totalSales, totalOrders });

  } catch (err) {
    console.error('Failed to load dashboard stats:', err);
  }
}

// ─────────────────────────────────────────────────────────────
// Real-Time Analytics Bar Chart & Pipeline Distribution
// ─────────────────────────────────────────────────────────────
function renderDashboardAnalytics(orders, stats) {
  const chartContainer = document.getElementById('analytics-sales-chart');
  const statusContainer = document.getElementById('analytics-status-breakdown');

  // 1. 7-Day Sales Trend Bar Chart (Dynamic Calculation)
  if (chartContainer) {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const today = new Date();
    const dailyData = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const dayName = days[d.getDay()];
      const dateStr = d.toLocaleDateString();

      // Sum orders matching this day
      let dayTotal = 0;
      let dayCount = 0;
      (orders || []).forEach(o => {
        if (!o.created_at) return;
        const od = new Date(o.created_at).toLocaleDateString();
        if (od === dateStr && (o.status || '').toLowerCase() !== 'cancelled') {
          dayTotal += Number(o.total || 0);
          dayCount++;
        }
      });

      dailyData.push({ day: dayName, date: dateStr, total: dayTotal, count: dayCount });
    }

    const maxVal = Math.max(...dailyData.map(d => d.total), 4000);

    chartContainer.innerHTML = dailyData.map(d => {
      const heightPercent = Math.max(12, Math.round((d.total / maxVal) * 100));
      return `
        <div class="chart-col">
          <div class="chart-bar" style="height: ${heightPercent}%;" title="${d.date}: ${formatPrice(d.total)} (${d.count} orders)">
            <span class="chart-bar-tooltip">${formatPrice(d.total)}</span>
          </div>
          <span class="chart-col-label">${d.day}</span>
        </div>
      `;
    }).join('');
  }

  // 2. Order Fulfillment Status Pipeline (Dynamic Percentages)
  if (statusContainer) {
    const total = (orders || []).length || 1;
    const countStatus = (st) => (orders || []).filter(o => (o.status || '').toLowerCase() === st.toLowerCase()).length;

    const delivered = countStatus('Delivered');
    const shipped = countStatus('Shipped') + countStatus('Out for Delivery');
    const packed = countStatus('Packed') + countStatus('Confirmed');
    const pending = countStatus('Pending') + countStatus('Processing');

    const pDelivered = Math.round((delivered / total) * 100);
    const pShipped = Math.round((shipped / total) * 100);
    const pPacked = Math.round((packed / total) * 100);
    const pPending = Math.round((pending / total) * 100);

    const pipeline = [
      { label: 'Delivered', count: delivered, color: '#10b981', pct: pDelivered },
      { label: 'Shipped / Out for Delivery', count: shipped, color: '#3b82f6', pct: pShipped },
      { label: 'Packed & Confirmed', count: packed, color: '#8b5cf6', pct: pPacked },
      { label: 'Pending Processing', count: pending, color: '#f59e0b', pct: pPending }
    ];

    statusContainer.innerHTML = pipeline.map(item => `
      <div class="status-progress-item">
        <div class="status-progress-meta">
          <span>${item.label} (${item.count})</span>
          <span>${item.pct}%</span>
        </div>
        <div class="status-progress-track">
          <div class="status-progress-fill" style="width: ${item.pct}%; background: ${item.color};"></div>
        </div>
      </div>
    `).join('');
  }
}

let adminProductSearchTimeout = null;

function debounceAdminProductFilter() {
  clearTimeout(adminProductSearchTimeout);
  adminProductSearchTimeout = setTimeout(() => {
    loadAdminProducts();
  }, 300);
}

function resetAdminProductFilters() {
  const s = document.getElementById('admin-product-search');
  const sf = document.getElementById('admin-product-stock-filter');
  const df = document.getElementById('admin-product-dept-filter');
  if (s) s.value = '';
  if (sf) sf.value = '';
  if (df) df.value = '';
  loadAdminProducts();
}

// 2. Admin Products Listing & Stock Management
async function loadAdminProducts() {
  const tbody = document.getElementById('admin-products-tbody');
  const summaryEl = document.getElementById('admin-product-count-summary');
  if (!tbody) return;

  tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding:24px; color:#64748b;">Loading inventory products...</td></tr>`;

  const search = document.getElementById('admin-product-search')?.value.trim() || '';
  const stockStatus = document.getElementById('admin-product-stock-filter')?.value || '';
  const department = document.getElementById('admin-product-dept-filter')?.value || '';

  const q = new URLSearchParams();
  if (search) q.append('search', search);
  if (stockStatus) q.append('stockStatus', stockStatus);
  if (department) q.append('department', department);

  try {
    let prods = null;
    try {
      const res = await fetch(`${API_BASE}/admin/products?${q.toString()}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.products)) {
          prods = data.products;
        }
      }
    } catch (_) {}

    if (!prods) {
      // Fallback for Netlify static hosting
      const pRes = await fetch('/data/products.json');
      const pData = await pRes.json();
      prods = pData.products || [];

      // Filter locally
      if (search) {
        const sLower = search.toLowerCase();
        prods = prods.filter(p => 
          (p.name && p.name.toLowerCase().includes(sLower)) ||
          (p.brand && p.brand.toLowerCase().includes(sLower)) ||
          (p.subcategory && p.subcategory.toLowerCase().includes(sLower))
        );
      }
      if (department) {
        prods = prods.filter(p => (p.department || '').toLowerCase() === department.toLowerCase());
      }
      if (stockStatus === 'in') {
        prods = prods.filter(p => (p.stock || 0) > 0);
      } else if (stockStatus === 'low') {
        prods = prods.filter(p => (p.stock || 0) > 0 && (p.stock || 0) <= 4);
      } else if (stockStatus === 'out') {
        prods = prods.filter(p => (p.stock || 0) <= 0);
      }
    }

    currentProducts = prods;

    if (summaryEl) {
      const inStockCount = currentProducts.filter(p => p.stock > 0).length;
      const outStockCount = currentProducts.filter(p => p.stock <= 0).length;
      summaryEl.innerHTML = `Showing <strong>${currentProducts.length}</strong> items (${inStockCount} In Stock, <span style="color:#ef4444;">${outStockCount} Out of Stock</span>)`;
    }

    if (currentProducts.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding:24px; color:#64748b;">No products match the selected criteria.</td></tr>`;
      return;
    }

    tbody.innerHTML = currentProducts.map(p => {
      const isInStock = p.stock > 0;
      const isLowStock = p.stock > 0 && p.stock <= 4;
      const deptName = (p.department || 'women').toUpperCase();

      return `
        <tr>
          <td>
            <img src="${p.image}" style="width:44px; height:56px; object-fit:cover; border-radius:4px; border:1px solid #e2e8f0; ${!isInStock ? 'filter:grayscale(60%); opacity:0.75;' : ''}" onerror="this.src='https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=100&q=80'">
          </td>
          <td>
            <div style="font-weight:700; max-width:240px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; color:#1e293b;" title="${p.name}">
              ${p.name}
            </div>
            <div style="font-size:0.75rem; color:#64748b; margin-top:2px;">
              Brand: <strong>${p.brand || 'RJ Collection'}</strong>
              ${p.subcategory ? ` • <span style="color:var(--admin-primary); font-weight:600;">${p.subcategory}</span>` : ''}
            </div>
          </td>
          <td>
            <span style="font-size:0.72rem; background:#f1f5f9; padding:2px 7px; border-radius:12px; font-weight:700; color:#334155; text-transform:uppercase;">
              ${deptName}
            </span>
            <div style="font-size:0.78rem; color:#64748b; margin-top:3px;">${p.category_name || '-'}</div>
          </td>
          <td style="font-weight:700; color:#1e293b;">${formatPrice(p.price)}</td>
          <td>
            <div class="stock-control-col">
              <span class="stock-pill ${isInStock ? (isLowStock ? 'pill-low' : 'pill-in') : 'pill-out'}" id="stock-pill-${p.id}">
                ${isInStock ? (isLowStock ? `⚠️ Low (${p.stock})` : `🟢 In Stock (${p.stock})`) : `🔴 Out of Stock (0)`}
              </span>
              <div class="compact-stock-stepper" title="Fast click +/- to adjust stock">
                <button type="button" class="stepper-btn" onclick="quickAdjustStock(${p.id}, -1)" title="Reduce 1">−</button>
                <span class="stepper-val" id="stock-val-${p.id}">${p.stock}</span>
                <button type="button" class="stepper-btn" onclick="quickAdjustStock(${p.id}, 1)" title="Add 1">+</button>
              </div>
            </div>
          </td>
          <td>
            <div style="display:flex; gap:6px; align-items:center;">
              <button onclick="toggleProductStock(${p.id}, ${p.stock})"
                id="stock-toggle-btn-${p.id}"
                class="btn ${isInStock ? 'btn-warn-outline' : 'btn-success-outline'}"
                style="padding:5px 9px; font-size:0.75rem; font-weight:700; white-space:nowrap;"
                title="${isInStock ? 'Click to mark product as Out of Stock' : 'Click to mark product as In Stock'}">
                ${isInStock ? 'Mark Out 🚫' : 'Mark In ✅'}
              </button>
              <button onclick="quickUpdateStockPrompt(${p.id}, ${p.stock})"
                style="padding:5px 8px; border:1px solid #cbd5e1; border-radius:4px; background:#fff; cursor:pointer; font-size:0.75rem; color:#475569;"
                title="Edit exact stock quantity">
                ✏️ Qty
              </button>
            </div>
          </td>
          <td>
            <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:${p.active ? '#10b981' : '#94a3b8'}; margin-right:4px;"></span>
            <span style="font-size:0.8rem; font-weight:600; color:${p.active ? '#047857' : '#64748b'};">${p.active ? 'Active' : 'Hidden'}</span>
          </td>
          <td>
            <div style="display:flex; gap:6px;">
              <button onclick="openEditProductModal(${p.id})" class="btn btn-outline-primary" style="padding:4px 8px; font-size:0.75rem;">Edit</button>
              <button onclick="deleteProduct(${p.id})" class="btn btn-outline" style="padding:4px 8px; font-size:0.75rem; color:#ef4444; border-color:#fca5a5;">Delete</button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  } catch (err) {
    console.error('Error fetching admin products:', err);
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding:20px; color:#ef4444;">Error loading products. Please try again.</td></tr>`;
  }
}

// 1-Click Quick Toggle: In Stock <-> Out of Stock (Instant Optimistic UI)
async function toggleProductStock(productId, currentStock) {
  const p = currentProducts.find(item => item.id === productId);
  const currentVal = p ? p.stock : currentStock;
  const newStock = currentVal > 0 ? 0 : 15;
  if (p) p.stock = newStock;

  // In-place instant DOM update
  const valEl = document.getElementById(`stock-val-${productId}`);
  if (valEl) valEl.textContent = newStock;

  const pillEl = document.getElementById(`stock-pill-${productId}`);
  const toggleBtn = document.getElementById(`stock-toggle-btn-${productId}`);
  const isInStock = newStock > 0;
  const isLowStock = newStock > 0 && newStock <= 4;

  if (pillEl) {
    pillEl.className = `stock-pill ${isInStock ? (isLowStock ? 'pill-low' : 'pill-in') : 'pill-out'}`;
    pillEl.innerHTML = isInStock ? (isLowStock ? `⚠️ Low (${newStock})` : `🟢 In Stock (${newStock})`) : `🔴 Out of Stock (0)`;
  }
  if (toggleBtn) {
    toggleBtn.className = `btn ${isInStock ? 'btn-warn-outline' : 'btn-success-outline'}`;
    toggleBtn.textContent = isInStock ? 'Mark Out 🚫' : 'Mark In ✅';
  }

  // Update summary counts
  const summaryEl = document.getElementById('admin-product-count-summary');
  if (summaryEl && currentProducts) {
    const inStockCount = currentProducts.filter(item => item.stock > 0).length;
    const outStockCount = currentProducts.filter(item => item.stock <= 0).length;
    summaryEl.innerHTML = `Showing <strong>${currentProducts.length}</strong> items (${inStockCount} In Stock, <span style="color:#ef4444;">${outStockCount} Out of Stock</span>)`;
  }

  try {
    const res = await fetch(`${API_BASE}/admin/products/${productId}/toggle-stock`, {
      method: 'PATCH'
    });
    if (res.ok) {
      showToast(newStock > 0 ? 'Product marked In Stock' : 'Product marked Out of Stock', newStock > 0 ? 'success' : 'info');
      loadDashboardStats();
      return;
    }
  } catch (_) {}

  showToast(newStock > 0 ? 'Product marked In Stock' : 'Product marked Out of Stock', 'info');
}

function updateImagePreview(url) {
  const preview = document.getElementById('prod-image-preview');
  if (!preview) return;
  if (url && url.trim()) {
    preview.src = url.trim();
    preview.style.display = 'block';
  } else {
    preview.style.display = 'none';
  }
}

async function handleProductImageUpload(input) {
  const file = input.files && input.files[0];
  if (!file) return;

  const statusEl = document.getElementById('prod-upload-status');
  if (statusEl) statusEl.textContent = 'Uploading image...';

  const formData = new FormData();
  formData.append('image', file);

  try {
    const res = await fetch(`${API_BASE}/admin/upload`, {
      method: 'POST',
      body: formData
    });
    const data = await res.json();
    if (data.success && data.url) {
      document.getElementById('prod-form-image').value = data.url;
      updateImagePreview(data.url);
      if (statusEl) statusEl.textContent = '✅ Image uploaded successfully!';
      showToast('Image uploaded', 'success');
    } else {
      if (statusEl) statusEl.textContent = '❌ Upload failed: ' + (data.message || 'Error');
      showToast(data.message || 'Upload failed', 'error');
    }
  } catch (err) {
    if (statusEl) statusEl.textContent = '❌ Network error during upload';
    showToast('Failed to upload image file', 'error');
  } finally {
    input.value = '';
  }
}

// Modal In-Stock vs Out-of-Stock Radio Handlers
function handleModalStockStatusChange(isInStock) {
  const stockInput = document.getElementById('prod-form-stock');
  const hintEl = document.getElementById('prod-stock-status-hint');
  if (isInStock) {
    if (Number(stockInput.value) <= 0) stockInput.value = 15;
    if (hintEl) {
      hintEl.textContent = '✓ Product will show as AVAILABLE for shopping';
      hintEl.style.color = '#15803d';
    }
  } else {
    stockInput.value = 0;
    if (hintEl) {
      hintEl.textContent = '⚠️ Product marked OUT OF STOCK on website (Buy buttons disabled)';
      hintEl.style.color = '#dc2626';
    }
  }
}

function handleModalStockInput(val) {
  const num = Number(val);
  const inRadio = document.getElementById('stock-radio-in');
  const outRadio = document.getElementById('stock-radio-out');
  const hintEl = document.getElementById('prod-stock-status-hint');

  if (num > 0) {
    if (inRadio) inRadio.checked = true;
    if (hintEl) {
      hintEl.textContent = `✓ Product will show as AVAILABLE (${num} units in stock)`;
      hintEl.style.color = '#15803d';
    }
  } else {
    if (outRadio) outRadio.checked = true;
    if (hintEl) {
      hintEl.textContent = '⚠️ Product marked OUT OF STOCK on website (Buy buttons disabled)';
      hintEl.style.color = '#dc2626';
    }
  }
}

function openAddProductModal() {
  document.getElementById('product-modal-title').textContent = 'Add New Product';
  document.getElementById('product-form').reset();
  document.getElementById('prod-form-id').value = '';
  document.getElementById('prod-form-department').value = 'women';
  document.getElementById('prod-form-subcategory').value = '';
  document.getElementById('prod-form-stock').value = 15;
  document.getElementById('stock-radio-in').checked = true;
  handleModalStockStatusChange(true);
  updateImagePreview('');
  const statusEl = document.getElementById('prod-upload-status');
  if (statusEl) statusEl.textContent = '';
  populateCategorySelect('prod-form-category');
  document.getElementById('product-modal').classList.add('active');
}

function openEditProductModal(id) {
  const p = currentProducts.find(item => item.id === id);
  if (!p) return;

  document.getElementById('product-modal-title').textContent = 'Edit Product';
  document.getElementById('prod-form-id').value = p.id;
  document.getElementById('prod-form-name').value = p.name;
  document.getElementById('prod-form-department').value = p.department || 'women';
  document.getElementById('prod-form-subcategory').value = p.subcategory || '';
  document.getElementById('prod-form-price').value = p.price;
  document.getElementById('prod-form-orig-price').value = p.original_price;
  document.getElementById('prod-form-stock').value = p.stock;

  if (p.stock > 0) {
    document.getElementById('stock-radio-in').checked = true;
    handleModalStockInput(p.stock);
  } else {
    document.getElementById('stock-radio-out').checked = true;
    handleModalStockStatusChange(false);
  }

  document.getElementById('prod-form-image').value = p.image;
  updateImagePreview(p.image);
  const statusEl = document.getElementById('prod-upload-status');
  if (statusEl) statusEl.textContent = '';
  document.getElementById('prod-form-brand').value = p.brand || 'RJ Collection';
  document.getElementById('prod-form-desc').value = p.description || '';
  document.getElementById('prod-form-material').value = p.material || '';
  document.getElementById('prod-form-pattern').value = p.pattern || '';
  document.getElementById('prod-form-care').value = p.care_instructions || '';
  document.getElementById('prod-form-active').checked = p.active === 1;
  document.getElementById('prod-form-featured').checked = p.featured === 1;
  document.getElementById('prod-form-new').checked = p.new_arrival === 1;

  populateCategorySelect('prod-form-category', p.category_id);
  document.getElementById('product-modal').classList.add('active');
}

function closeProductModal() {
  document.getElementById('product-modal').classList.remove('active');
}

async function handleProductFormSubmit(e) {
  e.preventDefault();
  const id = document.getElementById('prod-form-id').value;
  const payload = {
    name: document.getElementById('prod-form-name').value.trim(),
    department: document.getElementById('prod-form-department').value,
    subcategory: document.getElementById('prod-form-subcategory').value.trim(),
    category_id: document.getElementById('prod-form-category').value,
    price: Number(document.getElementById('prod-form-price').value),
    original_price: Number(document.getElementById('prod-form-orig-price').value) || Number(document.getElementById('prod-form-price').value),
    stock: Number(document.getElementById('prod-form-stock').value),
    image: document.getElementById('prod-form-image').value.trim(),
    brand: document.getElementById('prod-form-brand').value.trim(),
    description: document.getElementById('prod-form-desc').value.trim(),
    material: document.getElementById('prod-form-material').value.trim(),
    pattern: document.getElementById('prod-form-pattern').value.trim(),
    care_instructions: document.getElementById('prod-form-care').value.trim(),
    active: document.getElementById('prod-form-active').checked,
    featured: document.getElementById('prod-form-featured').checked,
    new_arrival: document.getElementById('prod-form-new').checked
  };

  try {
    const url = id ? `${API_BASE}/admin/products/${id}` : `${API_BASE}/admin/products`;
    const method = id ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();

    if (data.success) {
      showToast(id ? 'Product updated successfully' : 'Product added successfully', 'success');
      closeProductModal();
      loadAdminProducts();
      loadDashboardStats();
    } else {
      showToast(data.message || 'Operation failed', 'error');
    }
  } catch (err) {
    showToast('Failed to save product', 'error');
  }
}

async function quickUpdateStockPrompt(productId, currentStock) {
  const newStock = prompt(`Update Stock Quantity for Product #${productId}:`, currentStock);
  if (newStock !== null && !isNaN(newStock)) {
    const num = Number(newStock);
    if (num < 0) {
      alert('Stock cannot be negative');
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/admin/products/${productId}/stock`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stock: num })
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || 'Stock updated', 'success');
        loadAdminProducts();
        loadDashboardStats();
      }
    } catch (err) {
      showToast('Failed to update stock', 'error');
    }
  }
}

async function deleteProduct(id) {
  if (!confirm('Are you sure you want to permanently remove this product from the database?')) return;
  try {
    const res = await fetch(`${API_BASE}/admin/products/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
      showToast('Product removed', 'info');
      loadAdminProducts();
    }
  } catch (err) {
    showToast('Failed to delete product', 'error');
  }
}

// 3. Admin Orders
let adminOrdersSearchTimeout = null;
function debounceAdminOrdersFilter() {
  clearTimeout(adminOrdersSearchTimeout);
  adminOrdersSearchTimeout = setTimeout(() => {
    loadAdminOrders();
  }, 250);
}

function resetAdminOrderFilters() {
  const searchInput = document.getElementById('admin-orders-search');
  const statusSelect = document.getElementById('admin-orders-filter-status');
  if (searchInput) searchInput.value = '';
  if (statusSelect) statusSelect.value = 'All';
  loadAdminOrders();
}

async function loadAdminOrders() {
  const tbody = document.getElementById('admin-orders-tbody');
  const statusFilter = document.getElementById('admin-orders-filter-status')?.value || 'All';
  const searchTerm = document.getElementById('admin-orders-search')?.value.trim().toLowerCase() || '';
  const summaryEl = document.getElementById('admin-orders-count-summary');
  if (!tbody) return;

  tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:24px; color:#64748b;">Loading customer orders...</td></tr>`;

  try {
    // 1. Fetch from unified real-time store
    let ordersList = fetchAllOrdersRealtime();

    // 2. Also try API if available
    try {
      const url = statusFilter !== 'All' ? `${API_BASE}/admin/orders?status=${encodeURIComponent(statusFilter)}` : `${API_BASE}/admin/orders`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.orders) && data.orders.length > 0) {
          ordersList = data.orders;
        }
      }
    } catch (_) {}

    // Apply Client-Side Search Filter
    if (searchTerm) {
      ordersList = ordersList.filter(o => 
        (o.order_number && o.order_number.toLowerCase().includes(searchTerm)) ||
        (o.customer_name && o.customer_name.toLowerCase().includes(searchTerm)) ||
        (o.customer_phone && o.customer_phone.toLowerCase().includes(searchTerm)) ||
        (o.customer_email && o.customer_email.toLowerCase().includes(searchTerm)) ||
        (o.delivery_address && o.delivery_address.toLowerCase().includes(searchTerm)) ||
        (o.shipping_address && o.shipping_address.toLowerCase().includes(searchTerm))
      );
    }

    if (statusFilter !== 'All') {
      ordersList = ordersList.filter(o => (o.status || '').toLowerCase() === statusFilter.toLowerCase());
    }

    currentOrders = ordersList;

    if (summaryEl) {
      const totalRev = ordersList.reduce((acc, o) => acc + Number(o.total || 0), 0);
      summaryEl.innerHTML = `Showing <strong>${ordersList.length}</strong> orders (Total Value: <strong>${formatPrice(totalRev)}</strong>)`;
    }

    if (currentOrders.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:24px; color:#64748b;">No orders found matching the filter criteria.</td></tr>`;
      return;
    }

    const statuses = ['Pending', 'Confirmed', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'];

    tbody.innerHTML = currentOrders.map(o => {
      const cleanPhone = (o.customer_phone || '').replace(/[^0-9]/g, '');
      const waMsg = encodeURIComponent(`Hello ${o.customer_name}! Thank you for shopping with RJ Fashion Collection. We are updating you regarding your order #${o.order_number} (Status: ${o.status}). Total: ${formatPrice(o.total)}. Let us know if you need assistance!`);
      const waUrl = cleanPhone ? `https://wa.me/91${cleanPhone.slice(-10)}?text=${waMsg}` : `https://wa.me/917894093586?text=${waMsg}`;

      return `
        <tr>
          <td style="font-weight:700; color:var(--admin-primary);">${o.order_number}</td>
          <td>
            <div style="font-weight:700; color:#1e293b;">${o.customer_name}</div>
            <div style="font-size:0.75rem; color:#64748b; margin-top:2px;">
              ${o.customer_phone ? `📞 ${o.customer_phone}` : ''}
              ${o.customer_email ? ` • ${o.customer_email}` : ''}
            </div>
            <div style="margin-top: 4px;">
              <a href="${waUrl}" target="_blank" rel="noopener" class="btn-whatsapp" title="Send WhatsApp order update to customer">
                <span>💬</span> WhatsApp
              </a>
            </div>
          </td>
          <td>${o.created_at ? new Date(o.created_at).toLocaleDateString() : 'Today'}</td>
          <td style="font-weight:700; color:#1e293b;">${formatPrice(o.total)}</td>
          <td><span style="font-size:0.78rem; font-weight:600; color:#475569;">${o.payment_method || 'Online'}</span></td>
          <td>
            <select onchange="updateOrderStatus('${o.id}', this.value)" style="padding:5px 8px; font-size:0.8rem; border-radius:6px; border:1px solid #cbd5e1; font-weight:700; background:#fff; cursor:pointer;">
              ${statuses.map(st => `<option value="${st}" ${o.status === st ? 'selected' : ''}>${st}</option>`).join('')}
            </select>
          </td>
          <td>
            <div style="display:flex; gap:6px;">
              <button onclick="viewOrderModal('${o.id}')" class="btn btn-outline-primary" style="padding:4px 8px; font-size:0.75rem;" title="View ordered items">View</button>
              <button onclick="openPrintOrderInvoice('${o.id}')" class="btn btn-outline" style="padding:4px 8px; font-size:0.75rem;" title="Print Packing Slip / Branded Invoice">🖨️ Invoice</button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  } catch (err) {
    console.error('Error fetching admin orders:', err);
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:20px; color:#ef4444;">Failed to load orders.</td></tr>`;
  }
}

async function updateOrderStatus(orderId, newStatus) {
  let updated = false;

  // 1. Update in local storage
  try {
    let orders = JSON.parse(localStorage.getItem('rj_orders') || '[]');
    const match = orders.find(o => String(o.id) === String(orderId) || String(o.order_number) === String(orderId));
    if (match) {
      match.status = newStatus;
      match.updated_at = new Date().toISOString();
      localStorage.setItem('rj_orders', JSON.stringify(orders));
      updated = true;
    }
  } catch (_) {}

  // 2. Also try API
  try {
    const res = await fetch(`${API_BASE}/admin/orders/${orderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success) updated = true;
    }
  } catch (_) {}

  if (updated) {
    showToast(`Order status updated to "${newStatus}"`, 'success');
    loadDashboardStats();
    if (document.getElementById('pane-orders')?.style.display !== 'none') {
      loadAdminOrders();
    }
  } else {
    showToast('Failed to update status', 'error');
  }
}

function viewOrderModal(orderId) {
  const o = currentOrders.find(ord => String(ord.id) === String(orderId) || String(ord.order_number) === String(orderId));
  if (!o) return;

  const cleanPhone = (o.customer_phone || '').replace(/[^0-9]/g, '');
  const waMsg = encodeURIComponent(`Hello ${o.customer_name}! Thank you for shopping with RJ Fashion Collection. We are updating you regarding your order #${o.order_number} (Status: ${o.status}).`);
  const waUrl = cleanPhone ? `https://wa.me/91${cleanPhone.slice(-10)}?text=${waMsg}` : `https://wa.me/917894093586?text=${waMsg}`;

  const content = document.getElementById('order-detail-modal-body');
  content.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:16px; flex-wrap:wrap; gap:12px; border-bottom:1px solid #e2e8f0; padding-bottom:14px;">
      <div>
        <div style="font-size:1.2rem; font-weight:800; color:var(--admin-primary);">${o.order_number}</div>
        <div style="font-size:0.85rem; color:#475569; margin-top:2px;">Customer: <strong>${o.customer_name}</strong></div>
        <div style="font-size:0.82rem; color:#64748b;">Phone: <strong>${o.customer_phone || 'N/A'}</strong> | Email: ${o.customer_email || 'N/A'}</div>
        <div style="font-size:0.82rem; color:#64748b; margin-top:4px;">Address: ${o.delivery_address || 'Standard Address'}</div>
      </div>
      <div style="display:flex; gap:8px;">
        <a href="${waUrl}" target="_blank" rel="noopener" class="btn-whatsapp" style="padding:6px 12px; font-size:0.82rem;">
          <span>💬</span> WhatsApp Buyer
        </a>
        <button onclick="openPrintOrderInvoice('${o.id}')" class="btn btn-primary" style="padding:6px 12px; font-size:0.82rem;">
          <span>🖨️</span> Invoice (PDF / Print)
        </button>
      </div>
    </div>

    <table style="width:100%; border-collapse:collapse; font-size:0.88rem; margin-bottom:16px;">
      <thead>
        <tr style="border-bottom:1px solid #e2e8f0; text-align:left; background:#f8fafc;">
          <th style="padding:8px 10px;">Item</th>
          <th style="padding:8px 10px;">Size</th>
          <th style="padding:8px 10px; text-align:center;">Qty</th>
          <th style="padding:8px 10px; text-align:right;">Price</th>
          <th style="padding:8px 10px; text-align:right;">Total</th>
        </tr>
      </thead>
      <tbody>
        ${(o.items && o.items.length > 0 ? o.items : [{ product_name: 'Luxury Indian Ethnic Wear', quantity: 1, price: o.total, total: o.total }]).map(it => `
          <tr style="border-bottom:1px solid #f1f5f9;">
            <td style="padding:8px 10px; font-weight:600;">${it.product_name}</td>
            <td style="padding:8px 10px;">${it.size || '-'}</td>
            <td style="padding:8px 10px; text-align:center;">${it.quantity || 1}</td>
            <td style="padding:8px 10px; text-align:right;">${formatPrice(it.price || it.total)}</td>
            <td style="padding:8px 10px; text-align:right; font-weight:700;">${formatPrice(it.total || it.price)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <div style="display:flex; justify-content:space-between; align-items:center; background:#f8fafc; padding:12px 16px; border-radius:6px; border:1px solid #e2e8f0;">
      <div>
        <span style="font-size:0.82rem; color:#64748b;">Payment Method: <strong>${o.payment_method || 'Online'}</strong></span> • 
        <span style="font-size:0.82rem; color:#64748b;">Current Status: <strong>${o.status}</strong></span>
      </div>
      <div style="font-size:1.1rem; font-weight:800; color:#1e293b;">
        Grand Total: <span style="color:var(--admin-primary);">${formatPrice(o.total)}</span>
      </div>
    </div>
  `;

  document.getElementById('order-detail-modal').classList.add('active');
}

// 4. Admin Customers
async function loadAdminCustomers() {
  const tbody = document.getElementById('admin-customers-tbody');
  if (!tbody) return;

  tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:24px; color:#64748b;">Loading registered customers...</td></tr>`;

  try {
    const deletedList = JSON.parse(localStorage.getItem('rj_deleted_customers') || '[]');

    let customers = [];
    try {
      const res = await fetch(`${API_BASE}/admin/customers`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.customers) && data.customers.length > 0) {
          customers = data.customers;
        }
      }
    } catch (_) {}

    // Fallback: If static hosting or API offline, fetch /data/customers.json
    if (!customers || customers.length === 0) {
      try {
        const cRes = await fetch('/data/customers.json');
        if (cRes.ok) {
          const cData = await cRes.json();
          if (cData.customers && Array.isArray(cData.customers)) {
            customers = cData.customers;
          }
        }
      } catch (_) {}
    }

    // Merge any real customers from orders
    const localOrders = JSON.parse(localStorage.getItem('rj_orders') || '[]');
    const customerMap = new Map();
    
    (customers || []).forEach(c => {
      const em = (c.email || '').toLowerCase();
      if (!deletedList.includes(em)) {
        customerMap.set(em, { ...c });
      }
    });

    localOrders.forEach(o => {
      const email = (o.customer_email || o.email || '').toLowerCase();
      if (!email || deletedList.includes(email)) return;
      if (customerMap.has(email)) {
        const existing = customerMap.get(email);
        existing.order_count = (existing.order_count || 1) + 1;
        existing.total_spent = (existing.total_spent || 0) + Number(o.total || 0);
      } else {
        customerMap.set(email, {
          id: 'cust-' + Date.now(),
          name: o.customer_name || o.name || 'Valued Customer',
          email: email,
          phone: o.customer_phone || o.phone || '+91 98765 43210',
          created_at: o.created_at || new Date().toISOString(),
          order_count: 1,
          total_spent: Number(o.total || 0)
        });
      }
    });

    const finalCustomers = Array.from(customerMap.values());

    if (finalCustomers.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:20px; color:#64748b;">No registered customers yet.</td></tr>`;
      return;
    }

    tbody.innerHTML = finalCustomers.map(c => `
      <tr>
        <td style="font-weight:600; color:#1e293b;">${c.name}</td>
        <td><a href="mailto:${c.email}" style="color:var(--admin-primary); text-decoration:none; font-weight:500;">${c.email}</a></td>
        <td>${c.phone || '-'}</td>
        <td>${new Date(c.created_at).toLocaleDateString()}</td>
        <td><span style="font-weight:600; background:#f1f5f9; padding:2px 8px; border-radius:12px; font-size:0.8rem;">${c.order_count} orders</span></td>
        <td style="font-weight:700; color:#1e293b;">${formatPrice(c.total_spent)}</td>
        <td>
          <button onclick="deleteCustomer('${c.email}', ${c.id ? `'${c.id}'` : 'null'})" class="btn btn-outline" style="padding:4px 8px; font-size:0.75rem; color:#ef4444; border-color:#fca5a5;" title="Remove this customer record">
            Delete
          </button>
        </td>
      </tr>
    `).join('');
  } catch (err) {
    console.error('Error in loadAdminCustomers:', err);
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:20px; color:#64748b;">Customer records will automatically populate as orders are placed.</td></tr>`;
  }
}

async function deleteCustomer(email, id) {
  if (!confirm(`Are you sure you want to remove customer record (${email})?`)) return;

  try {
    await fetch(`${API_BASE}/admin/customers/${id || encodeURIComponent(email)}`, { method: 'DELETE' });
  } catch (_) {}

  // Track deleted customers in localStorage so they stay deleted on Firebase static hosting
  const deletedList = JSON.parse(localStorage.getItem('rj_deleted_customers') || '[]');
  const normEmail = (email || '').toLowerCase();
  if (!deletedList.includes(normEmail)) {
    deletedList.push(normEmail);
    localStorage.setItem('rj_deleted_customers', JSON.stringify(deletedList));
  }

  // Remove corresponding orders from localStorage if any
  try {
    let orders = JSON.parse(localStorage.getItem('rj_orders') || '[]');
    orders = orders.filter(o => (o.customer_email || o.email || '').toLowerCase() !== normEmail);
    localStorage.setItem('rj_orders', JSON.stringify(orders));
  } catch (_) {}

  showToast('Customer record deleted successfully', 'info');
  loadAdminCustomers();
}

// 5. Admin Categories
async function loadCategoriesList() {
  try {
    let cats = null;
    try {
      const res = await fetch(`${API_BASE}/admin/categories`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.categories)) cats = data.categories;
      }
    } catch (_) {}

    if (!cats || cats.length === 0) {
      const savedCats = localStorage.getItem('rj_custom_categories');
      if (savedCats) {
        try { cats = JSON.parse(savedCats); } catch (_) {}
      }
    }

    if (!cats || cats.length === 0) {
      try {
        const res = await fetch('/data/categories.json');
        if (res.ok) {
          const data = await res.json();
          cats = data.categories || [];
        }
      } catch (_) {}
    }

    if (cats) currentCategories = cats;
  } catch (err) {
    console.error('Failed to load categories list:', err);
  }
}

function populateCategorySelect(selectId, selectedId = null) {
  const select = document.getElementById(selectId);
  if (!select) return;
  select.innerHTML = '<option value="">-- Select Category --</option>' +
    currentCategories.map(cat => `
      <option value="${cat.id}" ${selectedId === cat.id ? 'selected' : ''}>${cat.name}</option>
    `).join('');
}

async function loadAdminCategories() {
  const tbody = document.getElementById('admin-categories-tbody');
  if (!tbody) return;

  tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:24px; color:#64748b;">Loading categories...</td></tr>`;

  try {
    let cats = null;
    try {
      const res = await fetch(`${API_BASE}/admin/categories`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.categories) && data.categories.length > 0) {
          cats = data.categories;
        }
      }
    } catch (_) {}

    if (!cats || cats.length === 0) {
      const savedCats = localStorage.getItem('rj_custom_categories');
      if (savedCats) {
        try { cats = JSON.parse(savedCats); } catch (_) {}
      }
    }

    if (!cats || cats.length === 0) {
      try {
        const res = await fetch('/data/categories.json');
        if (res.ok) {
          const data = await res.json();
          cats = data.categories || [];
        }
      } catch (_) {}
    }

    currentCategories = cats || [];

    if (currentCategories.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:20px; color:#64748b;">No categories found.</td></tr>`;
      return;
    }

    tbody.innerHTML = currentCategories.map(cat => `
      <tr>
        <td>
          <img src="${cat.image}" style="width:40px; height:40px; border-radius:50%; object-fit:cover; border:1px solid #e2e8f0;" onerror="this.src='https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=100&q=80'">
        </td>
        <td style="font-weight:700; color:#1e293b;">${cat.name}</td>
        <td><code>${cat.slug}</code></td>
        <td>${cat.product_count || 0} products</td>
        <td>${cat.display_order || 1}</td>
        <td>
          <button onclick="deleteCategory(${cat.id})" class="btn btn-outline" style="padding:4px 8px; font-size:0.75rem; color:#ef4444; border-color:#fca5a5;">Delete</button>
        </td>
      </tr>
    `).join('');
  } catch (err) {
    console.error('Error fetching categories:', err);
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:20px; color:#ef4444;">Error loading categories.</td></tr>`;
  }
}

function openAddCategoryModal() {
  document.getElementById('category-form').reset();
  document.getElementById('category-modal').classList.add('active');
}

function closeCategoryModal() {
  document.getElementById('category-modal').classList.remove('active');
}

async function handleCategoryFormSubmit(e) {
  e.preventDefault();
  const name = document.getElementById('cat-form-name').value.trim();
  const image = document.getElementById('cat-form-image').value.trim();
  const description = document.getElementById('cat-form-desc').value.trim();
  const display_order = Number(document.getElementById('cat-form-order').value) || (currentCategories.length + 1);

  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const newCat = {
    id: Date.now(),
    name,
    slug,
    image: image || 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=500&q=80',
    description,
    display_order,
    product_count: 0,
    active: 1
  };

  try {
    const res = await fetch(`${API_BASE}/admin/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, image, description, display_order, active: 1 })
    });
    if (res.ok) {
      showToast('Category added successfully', 'success');
      closeCategoryModal();
      loadAdminCategories();
      loadCategoriesList();
      return;
    }
  } catch (_) {}

  // Fallback for static hosting
  currentCategories.push(newCat);
  localStorage.setItem('rj_custom_categories', JSON.stringify(currentCategories));
  showToast('Category added successfully', 'success');
  closeCategoryModal();
  loadAdminCategories();
  loadCategoriesList();
}

async function deleteCategory(id) {
  if (!confirm('Are you sure you want to delete this category?')) return;
  try {
    const res = await fetch(`${API_BASE}/admin/categories/${id}`, { method: 'DELETE' });
    if (res.ok) {
      showToast('Category deleted', 'info');
      loadAdminCategories();
      loadCategoriesList();
      return;
    }
  } catch (_) {}

  // Fallback for static hosting
  currentCategories = currentCategories.filter(c => c.id !== id);
  localStorage.setItem('rj_custom_categories', JSON.stringify(currentCategories));
  showToast('Category deleted', 'info');
  loadAdminCategories();
  loadCategoriesList();
}

// 6. Admin Banners
let adminBanners = [];

async function loadAdminBanners() {
  const tbody = document.getElementById('admin-banners-tbody');
  if (!tbody) return;

  tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:24px; color:#64748b;">Loading promotional banners...</td></tr>`;

  try {
    let banners = null;
    try {
      const res = await fetch(`${API_BASE}/admin/banners`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.banners) && data.banners.length > 0) {
          banners = data.banners;
        }
      }
    } catch (_) {}

    if (!banners || banners.length === 0) {
      const savedBanners = localStorage.getItem('rj_custom_banners');
      if (savedBanners) {
        try { banners = JSON.parse(savedBanners); } catch (_) {}
      }
    }

    if (!banners || banners.length === 0) {
      try {
        const bRes = await fetch('/data/banners.json');
        if (bRes.ok) {
          const bData = await bRes.json();
          banners = bData.banners || [];
        }
      } catch (_) {}
    }

    if (!banners || banners.length === 0) {
      banners = [
        {
          id: 1,
          title: "Discover Your Style",
          subtitle: "Elegant Fashion for Every Occasion • Pure Kanjivaram Silks & Kundan",
          image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1600&q=85",
          link: "/shop.html",
          active: 1
        },
        {
          id: 2,
          title: "Bridal & Heritage Kundan Jewelry",
          subtitle: "Handcrafted Temple & Royal Polki sets for extraordinary moments",
          image: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=1600&q=85",
          link: "/shop.html?category=jewelry",
          active: 1
        },
        {
          id: 3,
          title: "Festive Lehenga & Anarkali Cholis",
          subtitle: "Exquisite zari, sequins & velvet embroidery crafted to perfection",
          image: "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=1600&q=85",
          link: "/shop.html?category=lehengas",
          active: 1
        },
        {
          id: 4,
          title: "Men's Royal Sherwanis & Kurtas",
          subtitle: "Regal bandhgalas, raw silk kurtas, and handcrafted Nehru jackets",
          image: "https://images.unsplash.com/photo-1597983073493-88cd35cf93b0?auto=format&fit=crop&w=1600&q=85",
          link: "/shop.html?department=men",
          active: 1
        }
      ];
    }

    adminBanners = banners;

    tbody.innerHTML = adminBanners.map(b => `
      <tr>
        <td><img src="${b.image}" style="width:100px; height:50px; object-fit:cover; border-radius:4px; border:1px solid #e2e8f0;" onerror="this.src='https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=200&q=80'"></td>
        <td style="font-weight:600; color:#1e293b;">${b.title}</td>
        <td style="color:#64748b;">${b.subtitle || '-'}</td>
        <td><code>${b.link}</code></td>
        <td>
          <span style="display:inline-flex; align-items:center; gap:5px; font-size:0.8rem; font-weight:600; color:${b.active ? '#047857' : '#64748b'};">
            <span style="width:7px; height:7px; border-radius:50%; background:${b.active ? '#10b981' : '#94a3b8'};"></span>
            ${b.active ? 'Active' : 'Inactive'}
          </span>
        </td>
        <td>
          <button onclick="deleteBanner(${b.id})" class="btn btn-outline" style="padding:4px 8px; font-size:0.75rem; color:#ef4444; border-color:#fca5a5;">Delete</button>
        </td>
      </tr>
    `).join('');
  } catch (err) {
    console.error('Error fetching banners:', err);
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:20px; color:#64748b;">No banners available. Click "+ Add Banner" above.</td></tr>`;
  }
}

function openAddBannerModal() {
  document.getElementById('banner-form').reset();
  document.getElementById('banner-modal').classList.add('active');
}

function closeBannerModal() {
  document.getElementById('banner-modal').classList.remove('active');
}

async function handleBannerFormSubmit(e) {
  e.preventDefault();
  const title = document.getElementById('banner-form-title').value.trim();
  const subtitle = document.getElementById('banner-form-subtitle').value.trim();
  const image = document.getElementById('banner-form-image').value.trim();
  const link = document.getElementById('banner-form-link').value.trim();
  const button_text = document.getElementById('banner-form-btn-text')?.value.trim() || 'SHOP NOW';

  const newBanner = {
    id: Date.now(),
    title,
    subtitle,
    image,
    link,
    button_text,
    active: 1
  };

  try {
    const res = await fetch(`${API_BASE}/admin/banners`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, subtitle, image, link, button_text, active: 1 })
    });
    if (res.ok) {
      showToast('Banner added successfully', 'success');
      closeBannerModal();
      loadAdminBanners();
      return;
    }
  } catch (_) {}

  // Fallback for static hosting
  adminBanners.push(newBanner);
  localStorage.setItem('rj_custom_banners', JSON.stringify(adminBanners));
  showToast('Banner added successfully', 'success');
  closeBannerModal();
  loadAdminBanners();
}

async function deleteBanner(id) {
  if (!confirm('Delete this banner?')) return;
  try {
    const res = await fetch(`${API_BASE}/admin/banners/${id}`, { method: 'DELETE' });
    if (res.ok) {
      showToast('Banner deleted', 'info');
      loadAdminBanners();
      return;
    }
  } catch (_) {}

  // Fallback for static hosting
  adminBanners = adminBanners.filter(b => b.id !== id);
  localStorage.setItem('rj_custom_banners', JSON.stringify(adminBanners));
  showToast('Banner deleted', 'info');
  loadAdminBanners();
}

// Global modal close handlers
function closeOrderDetailModal() {
  document.getElementById('order-detail-modal').classList.remove('active');
}

document.addEventListener('DOMContentLoaded', () => {
  initAdmin();

  const loginForm = document.getElementById('admin-login-form');
  if (loginForm) loginForm.addEventListener('submit', handleAdminLogin);

  const productForm = document.getElementById('product-form');
  if (productForm) productForm.addEventListener('submit', handleProductFormSubmit);

  const categoryForm = document.getElementById('category-form');
  if (categoryForm) categoryForm.addEventListener('submit', handleCategoryFormSubmit);

  const bannerForm = document.getElementById('banner-form');
  if (bannerForm) bannerForm.addEventListener('submit', handleBannerFormSubmit);
});

// ─────────────────────────────────────────────────────────────
// Firebase Cloud Messaging Notification Handlers
// ─────────────────────────────────────────────────────────────
async function handleSendAdminNotification(e) {
  e.preventDefault();
  const title = document.getElementById('notif-title').value.trim();
  const body = document.getElementById('notif-body').value.trim();
  const url = document.getElementById('notif-url').value.trim();

  try {
    showToast('Sending Firebase push notification...', 'info');
    const res = await fetch(`${API_BASE}/notifications/test-push`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, body, url })
    });
    const data = await res.json();
    if (data.success) {
      showToast('Push notification dispatched! 🚀', 'success');
      triggerBrowserNotification(title, body, url);
    } else {
      showToast(data.message || 'Notification queued.', 'info');
    }
  } catch (err) {
    showToast('Error triggering notification: ' + err.message, 'error');
  }
}

async function triggerDeviceTestNotification() {
  if (!('Notification' in window)) {
    alert('This browser does not support desktop notifications.');
    return;
  }

  const title = document.getElementById('notif-title')?.value || 'RJ Fashion Collection ✨';
  const body = document.getElementById('notif-body')?.value || 'Your festive royal collection order has been dispatched!';
  const url = document.getElementById('notif-url')?.value || '/orders.html';

  if (Notification.permission === 'granted') {
    triggerBrowserNotification(title, body, url);
    showToast('Notification displayed on your device! 🔔', 'success');
  } else if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      triggerBrowserNotification(title, body, url);
      showToast('Notification displayed on your device! 🔔', 'success');
    } else {
      showToast('Notification permission was blocked in browser settings.', 'warning');
    }
  } else {
    showToast('Please enable notifications in your browser address bar permissions.', 'warning');
  }
}

function triggerBrowserNotification(title, body, url) {
  if ('Notification' in window && Notification.permission === 'granted') {
    const n = new Notification(title, {
      body: body,
      icon: '/images/favicon.png'
    });
    n.onclick = () => {
      window.focus();
      window.location.href = url || '/';
    };
  }
}

// ─────────────────────────────────────────────────────────────
// Executive Dashboard Helper Functions & Tools
// ─────────────────────────────────────────────────────────────

// 1. Mobile Sidebar Drawer Toggle
function toggleMobileSidebar(forceState) {
  const sidebar = document.querySelector('.admin-sidebar');
  const backdrop = document.getElementById('admin-sidebar-backdrop');
  if (!sidebar) return;
  const isOpen = sidebar.classList.contains('open');
  const newState = typeof forceState === 'boolean' ? forceState : !isOpen;
  if (newState) {
    sidebar.classList.add('open');
    if (backdrop) backdrop.classList.add('active');
  } else {
    sidebar.classList.remove('open');
    if (backdrop) backdrop.classList.remove('active');
  }
}

// 2. Fast Refresh
function refreshAdminData() {
  const icon = document.getElementById('refresh-spinner-icon');
  if (icon) {
    icon.style.display = 'inline-block';
    icon.style.transition = 'transform 0.6s ease';
    icon.style.transform = 'rotate(360deg)';
  }
  loadDashboardStats();
  const activePane = document.querySelector('.admin-section-pane:not([style*="display: none"])');
  if (activePane) {
    const paneId = activePane.id.replace('pane-', '');
    switchAdminTab(paneId);
  }
  setTimeout(() => {
    if (icon) icon.style.transform = 'rotate(0deg)';
    showToast('Admin data synced & updated live! 🔄', 'success');
  }, 600);
}

// 3. Jump and Filter Handlers
function filterAndJumpOrders(status) {
  switchAdminTab('orders');
  const select = document.getElementById('admin-orders-filter-status');
  if (select) {
    select.value = status;
    loadAdminOrders();
  }
}

function filterAndJumpProducts(stockStatus) {
  switchAdminTab('products');
  const select = document.getElementById('admin-product-stock-filter');
  if (select) {
    select.value = stockStatus;
    loadAdminProducts();
  }
}

// 4. Fast Inline Stock Quantity Adjuster (+/-) (Instant Optimistic In-Place Update)
async function quickAdjustStock(productId, delta) {
  const p = currentProducts.find(item => item.id === productId);
  if (!p) return;
  const oldStock = p.stock || 0;
  const newStock = Math.max(0, oldStock + delta);
  p.stock = newStock;

  // In-place instant DOM update (zero flicker, zero table re-render)
  const valEl = document.getElementById(`stock-val-${productId}`);
  if (valEl) valEl.textContent = newStock;

  const pillEl = document.getElementById(`stock-pill-${productId}`);
  const toggleBtn = document.getElementById(`stock-toggle-btn-${productId}`);
  const isInStock = newStock > 0;
  const isLowStock = newStock > 0 && newStock <= 4;

  if (pillEl) {
    pillEl.className = `stock-pill ${isInStock ? (isLowStock ? 'pill-low' : 'pill-in') : 'pill-out'}`;
    pillEl.innerHTML = isInStock ? (isLowStock ? `⚠️ Low (${newStock})` : `🟢 In Stock (${newStock})`) : `🔴 Out of Stock (0)`;
  }
  if (toggleBtn) {
    toggleBtn.className = `btn ${isInStock ? 'btn-warn-outline' : 'btn-success-outline'}`;
    toggleBtn.textContent = isInStock ? 'Mark Out 🚫' : 'Mark In ✅';
  }

  // Update summary counts
  const summaryEl = document.getElementById('admin-product-count-summary');
  if (summaryEl && currentProducts) {
    const inStockCount = currentProducts.filter(item => item.stock > 0).length;
    const outStockCount = currentProducts.filter(item => item.stock <= 0).length;
    summaryEl.innerHTML = `Showing <strong>${currentProducts.length}</strong> items (${inStockCount} In Stock, <span style="color:#ef4444;">${outStockCount} Out of Stock</span>)`;
  }

  try {
    const res = await fetch(`${API_BASE}/admin/products/${productId}/stock`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stock: newStock })
    });
    if (res.ok) {
      showToast(`Stock updated to ${newStock} units`, 'success');
      loadDashboardStats();
    }
  } catch (err) {
    showToast(`Stock set to ${newStock}`, 'info');
  }
}

// 5. Export Products Catalog as CSV Spreadsheet
function exportProductsCSV() {
  if (!currentProducts || currentProducts.length === 0) {
    showToast('No products available to export', 'error');
    return;
  }
  const headers = ['ID', 'Product Name', 'Brand', 'Department', 'Subcategory', 'Category', 'Price (INR)', 'Original MRP', 'Stock Quantity', 'Stock Status', 'Active', 'Image URL'];
  const rows = currentProducts.map(p => [
    p.id,
    `"${(p.name || '').replace(/"/g, '""')}"`,
    `"${(p.brand || 'RJ Collection').replace(/"/g, '""')}"`,
    p.department || 'women',
    `"${(p.subcategory || '').replace(/"/g, '""')}"`,
    `"${(p.category_name || '').replace(/"/g, '""')}"`,
    p.price || 0,
    p.original_price || p.price || 0,
    p.stock || 0,
    (p.stock > 0 ? (p.stock <= 4 ? 'Low Stock' : 'In Stock') : 'Out of Stock'),
    p.active ? 'Active' : 'Hidden',
    `"${(p.image || '').replace(/"/g, '""')}"`
  ]);

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `RJ_Fashion_Products_Catalog_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast('Products catalog exported to CSV! 📥', 'success');
}

// 6. Export Orders Ledger as CSV Spreadsheet
function exportOrdersCSV() {
  if (!currentOrders || currentOrders.length === 0) {
    showToast('No orders available to export', 'error');
    return;
  }
  const headers = ['Order Number', 'Date', 'Customer Name', 'Phone', 'Email', 'Delivery Address', 'Total (INR)', 'Payment Method', 'Status', 'Item Count'];
  const rows = currentOrders.map(o => [
    `"${o.order_number}"`,
    `"${new Date(o.created_at).toLocaleDateString()}"`,
    `"${(o.customer_name || '').replace(/"/g, '""')}"`,
    `"${(o.customer_phone || '').replace(/"/g, '""')}"`,
    `"${(o.customer_email || '').replace(/"/g, '""')}"`,
    `"${(o.delivery_address || '').replace(/"/g, '""')}"`,
    o.total || 0,
    `"${o.payment_method || 'Online'}"`,
    `"${o.status || 'Pending'}"`,
    (o.items || []).length
  ]);

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `RJ_Fashion_Orders_Ledger_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast('Orders ledger exported to CSV! 📊', 'success');
}

// ─────────────────────────────────────────────────────────────
// 7. Printable Packing Slip & Full Invoice Engine
// ─────────────────────────────────────────────────────────────
let currentInvoiceOrder = null;

// Helper: Robust Order Lookup
function findOrderById(orderId) {
  if (!orderId) return null;
  const idStr = String(orderId).trim();
  const all = (currentOrders && currentOrders.length > 0) ? currentOrders : fetchAllOrdersRealtime();
  
  let found = all.find(o => 
    String(o.id) === idStr || 
    String(o.order_number) === idStr ||
    (o.order_number && o.order_number.toLowerCase() === idStr.toLowerCase())
  );

  // If not found in current list, search directly in localStorage
  if (!found) {
    try {
      const local = JSON.parse(localStorage.getItem('rj_orders') || '[]');
      found = local.find(o => 
        String(o.id) === idStr || 
        String(o.order_number) === idStr ||
        (o.order_number && o.order_number.toLowerCase() === idStr.toLowerCase())
      );
    } catch (_) {}
  }

  return found || null;
}

// Generate Standalone, High-Res Luxury Tax Invoice HTML
function buildInvoiceHTML(o, forDownload = false) {
  const address = o.delivery_address || o.shipping_address || o.address || 'Standard Address on file';
  const cleanPhone = o.customer_phone || 'N/A';
  const cleanEmail = o.customer_email || 'N/A';
  const orderDate = o.created_at ? new Date(o.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' }) : 'Today';
  const items = (o.items && o.items.length > 0) ? o.items : [{ name: 'Luxury Indian Ethnic Ensemble', quantity: 1, price: o.total, total: o.total, size: 'Free Size' }];

  return `
    <div class="invoice-sheet" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 28px; background: #ffffff; color: #0f172a; max-width: 760px; margin: 0 auto; box-sizing: border-box;">
      <!-- Header -->
      <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #7a003c; padding-bottom: 18px; margin-bottom: 20px; flex-wrap: wrap; gap: 14px;">
        <div>
          <div style="font-size: 1.6rem; font-weight: 900; color: #7a003c; letter-spacing: 0.5px;">RJ FASHION COLLECTION</div>
          <div style="font-size: 0.85rem; color: #b45309; font-weight: 700; margin-top: 2px;">Luxury Indian Ethnic Wear • Bridal Sarees • Royal Craft</div>
          <div style="font-size: 0.78rem; color: #64748b; margin-top: 6px; line-height: 1.5;">
            📍 Sarbhal Chowk, Jharsuguda, Odisha - 768201<br>
            📞 +91 78940 93586 | ✉️ rjfashioncollection@gmail.com
          </div>
        </div>
        <div style="text-align: right;">
          <div style="font-size: 1.25rem; font-weight: 900; color: #1e293b;">TAX INVOICE / RECEIPT</div>
          <div style="font-size: 0.95rem; font-weight: 800; color: #7a003c; margin-top: 4px;">Order #${o.order_number}</div>
          <div style="font-size: 0.82rem; color: #64748b; margin-top: 2px;">Date: <strong>${orderDate}</strong></div>
          <div style="display: inline-block; padding: 3px 10px; border-radius: 4px; background: #ecfdf5; color: #065f46; font-size: 0.78rem; font-weight: 700; margin-top: 6px; border: 1px solid #a7f3d0;">
            ${o.payment_method || 'Online'} • ${o.status || 'Confirmed'}
          </div>
        </div>
      </div>

      <!-- Customer / Delivery Info Cards -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; background: #f8fafc; padding: 16px; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 22px;">
        <div>
          <div style="font-size: 0.75rem; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Billed To / Customer:</div>
          <div style="font-size: 1rem; font-weight: 800; color: #1e293b; margin-top: 4px;">${o.customer_name}</div>
          <div style="font-size: 0.85rem; color: #475569; margin-top: 2px;">Phone: <strong>${cleanPhone}</strong></div>
          <div style="font-size: 0.82rem; color: #475569;">Email: ${cleanEmail}</div>
        </div>
        <div>
          <div style="font-size: 0.75rem; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Delivery Address:</div>
          <div style="font-size: 0.88rem; color: #334155; margin-top: 4px; line-height: 1.5; font-weight: 500;">
            ${address}
          </div>
        </div>
      </div>

      <!-- Items Table -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 22px; font-size: 0.88rem;">
        <thead>
          <tr style="border-bottom: 2px solid #cbd5e1; background: #f1f5f9; text-align: left;">
            <th style="padding: 10px 12px; font-weight: 700; color: #334155; width: 36px;">#</th>
            <th style="padding: 10px 12px; font-weight: 700; color: #334155;">Product Description</th>
            <th style="padding: 10px 12px; font-weight: 700; color: #334155; width: 90px;">Size</th>
            <th style="padding: 10px 12px; font-weight: 700; color: #334155; text-align: center; width: 50px;">Qty</th>
            <th style="padding: 10px 12px; font-weight: 700; color: #334155; text-align: right; width: 110px;">Price</th>
            <th style="padding: 10px 12px; font-weight: 700; color: #334155; text-align: right; width: 110px;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${items.map((it, idx) => {
            const title = it.name || it.product_name || it.title || 'Royal Ethnic Ensembles';
            const price = Number(it.price || it.total || o.total);
            const qty = Number(it.quantity || 1);
            const lineTotal = price * qty;
            return `
              <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 12px; color: #64748b;">${idx + 1}</td>
                <td style="padding: 12px; font-weight: 600; color: #1e293b;">
                  <div>${title}</div>
                  <div style="font-size: 0.75rem; color: #64748b; margin-top: 2px;">Authentic Artisan Handcrafted</div>
                </td>
                <td style="padding: 12px; color: #475569;">${it.size || 'Free Size'}</td>
                <td style="padding: 12px; text-align: center; font-weight: 700;">${qty}</td>
                <td style="padding: 12px; text-align: right; color: #475569;">${formatPrice(price)}</td>
                <td style="padding: 12px; text-align: right; font-weight: 700; color: #1e293b;">${formatPrice(lineTotal)}</td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>

      <!-- Totals & Notes -->
      <div style="display: flex; justify-content: space-between; align-items: flex-end; padding-top: 18px; border-top: 2px solid #e2e8f0; flex-wrap: wrap; gap: 16px;">
        <div style="font-size: 0.8rem; color: #64748b; max-width: 360px; line-height: 1.5;">
          <strong style="color: #1e293b;">Thank you for shopping with RJ Fashion Collection! 👑</strong><br>
          For personalized customer care, blouse tailoring queries, or delivery updates, message our VIP WhatsApp Concierge at <strong>+91 78940 93586</strong>.
        </div>
        <div style="text-align: right; min-width: 240px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 0.88rem; color: #64748b;">
            <span>Subtotal:</span>
            <span>${formatPrice(o.total)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 0.88rem; color: #64748b;">
            <span>Express Delivery:</span>
            <span style="color: #15803d; font-weight: 700;">FREE</span>
          </div>
          <div style="display: flex; justify-content: space-between; border-top: 2px solid #0f172a; padding-top: 8px; font-size: 1.25rem; font-weight: 900; color: #7a003c;">
            <span>Grand Total:</span>
            <span>${formatPrice(o.total)}</span>
          </div>
          <div style="font-size: 0.72rem; color: #64748b; margin-top: 4px;">(Inclusive of all applicable taxes)</div>
        </div>
      </div>

      <!-- Footer / Auth Sign -->
      <div style="margin-top: 28px; padding-top: 16px; border-top: 1px dashed #cbd5e1; display: flex; justify-content: space-between; align-items: center; font-size: 0.75rem; color: #94a3b8;">
        <div>Computer generated invoice • 100% Genuine Handcrafted Ethnic Wear</div>
        <div style="font-weight: 700; color: #7a003c;">RJ FASHION COLLECTION DIRECT</div>
      </div>
    </div>
  `;
}

// Open Invoice Modal
function openPrintOrderInvoice(orderId) {
  const o = findOrderById(orderId);
  if (!o) {
    showToast('Order details could not be found for invoice generation.', 'error');
    return;
  }

  currentInvoiceOrder = o;
  const bodyEl = document.getElementById('invoice-modal-body');
  if (!bodyEl) return;

  bodyEl.innerHTML = buildInvoiceHTML(o, false);
  const modal = document.getElementById('invoice-modal');
  if (modal) {
    modal.classList.add('active');
  }
}

// Close Invoice Modal
function closeInvoiceModal() {
  const modal = document.getElementById('invoice-modal');
  if (modal) {
    modal.classList.remove('active');
  }
}

// 1-Click Direct Download of Invoice as File
function downloadCurrentInvoice() {
  if (!currentInvoiceOrder) {
    showToast('No active invoice to download', 'error');
    return;
  }
  downloadOrderInvoiceFile(currentInvoiceOrder.id);
}

function downloadOrderInvoiceFile(orderId) {
  const o = findOrderById(orderId);
  if (!o) {
    showToast('Order not found for download', 'error');
    return;
  }

  const invoiceContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Invoice - ${o.order_number} - RJ Fashion Collection</title>
  <style>
    body { margin: 0; padding: 20px; background: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    .invoice-sheet { box-shadow: 0 4px 20px rgba(0,0,0,0.08); border-radius: 8px; border: 1px solid #e2e8f0; }
    @media print {
      body { background: #fff; padding: 0; }
      .invoice-sheet { box-shadow: none; border: none; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="no-print" style="max-width: 760px; margin: 0 auto 16px; display: flex; justify-content: space-between; align-items: center; background: #fff; padding: 12px 18px; border-radius: 8px; border: 1px solid #e2e8f0;">
    <span style="font-weight: 700; color: #7a003c; font-size: 0.9rem;">RJ Fashion Collection Tax Invoice #${o.order_number}</span>
    <button onclick="window.print()" style="padding: 8px 18px; background: #7a003c; color: #fff; font-weight: 700; border: none; border-radius: 6px; cursor: pointer;">
      🖨️ Print / Save as PDF
    </button>
  </div>
  ${buildInvoiceHTML(o, true)}
</body>
</html>`;

  const blob = new Blob([invoiceContent], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `RJ_Fashion_Invoice_${o.order_number}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  showToast(`📥 Invoice downloaded for #${o.order_number}!`, 'success');
}

// Dedicated Print / Save as PDF Popup Window
function printCurrentInvoice() {
  if (!currentInvoiceOrder) {
    showToast('No active invoice to print', 'error');
    return;
  }

  const o = currentInvoiceOrder;
  const printWindow = window.open('', '_blank', 'width=840,height=900');
  if (!printWindow) {
    // Popup blocked: fallback to window.print()
    window.print();
    return;
  }

  printWindow.document.open();
  printWindow.document.write(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Invoice #${o.order_number} - RJ Fashion Collection</title>
  <style>
    body { margin: 0; padding: 24px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #fff; }
    @page { size: A4; margin: 12mm; }
    @media print {
      body { padding: 0; }
    }
  </style>
</head>
<body>
  ${buildInvoiceHTML(o, false)}
  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 250);
    };
  </script>
</body>
</html>`);
  printWindow.document.close();
}


