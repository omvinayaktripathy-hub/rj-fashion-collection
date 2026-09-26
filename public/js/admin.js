// RJ FASHION COLLECTION - PRIVATE ADMIN PANEL CONTROLLER

let adminUser = null;
let currentProducts = [];
let currentCategories = [];
let currentOrders = [];

// Initialize Admin
async function initAdmin() {
  // Check persistent session first
  try {
    const saved = sessionStorage.getItem('rjfc_admin_session');
    if (saved) {
      adminUser = JSON.parse(saved);
      hideAdminLoginScreen();
      document.getElementById('admin-topbar-username').textContent = adminUser.name;
      loadDashboardStats();
      loadCategoriesList();
      return;
    }
  } catch (e) {}

  try {
    const res = await fetch(`${API_BASE}/me`);
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.user && data.user.role === 'admin') {
        adminUser = data.user;
        sessionStorage.setItem('rjfc_admin_session', JSON.stringify(adminUser));
        hideAdminLoginScreen();
        document.getElementById('admin-topbar-username').textContent = adminUser.name;
        loadDashboardStats();
        loadCategoriesList();
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

// Admin Login Form Submit
async function handleAdminLogin(e) {
  e.preventDefault();
  const btn = document.getElementById('admin-login-btn');
  btn.disabled = true;
  btn.textContent = 'Authenticating...';

  const email = document.getElementById('admin-email').value.trim();
  const password = document.getElementById('admin-password').value;

  // 1. Try server API login first (localhost or node server)
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
        loadDashboardStats();
        return;
      }
    }
  } catch (err) {
    // Server not available (e.g. Netlify static hosting)
  }

  // 2. Direct verification for Owner / Super Admin
  if (email.toLowerCase() === 'omvinayakwork@gmail.com' && password === 'OMvinayak@01092003') {
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
    return;
  }

  document.getElementById('admin-login-error').textContent = 'Invalid administrator credentials. Please check your email and password.';
  document.getElementById('admin-login-error').style.display = 'block';
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

  const activePane = document.getElementById(`pane-${tabName}`);
  const activeNavItem = document.getElementById(`nav-${tabName}`);

  if (activePane) activePane.style.display = 'block';
  if (activeNavItem) activeNavItem.classList.add('active');

  const titleEl = document.getElementById('admin-page-title');
  if (titleEl) {
    titleEl.textContent = tabName.charAt(0).toUpperCase() + tabName.slice(1);
  }

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

// 1. Dashboard Stats
async function loadDashboardStats() {
  try {
    let stats = null;
    let recentOrders = [];
    let lowStockItems = [];

    try {
      const res = await fetch(`${API_BASE}/admin/stats`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          stats = data.stats;
          recentOrders = data.recentOrders || [];
          lowStockItems = data.lowStockItems || [];
        }
      }
    } catch (_) {}

    // Fallback if backend API is not available (e.g. Netlify static hosting)
    if (!stats) {
      let prods = [];
      try {
        const pRes = await fetch('/data/products.json');
        if (pRes.ok) {
          const pData = await pRes.json();
          prods = pData.products || [];
        }
      } catch (_) {}

      const inStock = prods.filter(p => (p.stock || 0) > 0);
      const lowStock = prods.filter(p => (p.stock || 0) > 0 && (p.stock || 0) <= 4);
      const outOfStock = prods.filter(p => (p.stock || 0) <= 0);

      stats = {
        totalSales: 0,
        totalOrders: 0,
        totalProducts: prods.length,
        totalCustomers: 1,
        pendingOrders: 0,
        lowStockCount: lowStock.length,
        outOfStockCount: outOfStock.length
      };
      recentOrders = [];
      lowStockItems = lowStock.slice(0, 5);
    }

    document.getElementById('stat-total-sales').textContent = formatPrice(stats.totalSales || 0);
    document.getElementById('stat-total-orders').textContent = stats.totalOrders || 0;
    document.getElementById('stat-total-products').textContent = stats.totalProducts || 0;
    document.getElementById('stat-total-customers').textContent = stats.totalCustomers || 0;
    document.getElementById('stat-pending-orders').textContent = stats.pendingOrders || 0;
    document.getElementById('stat-low-stock').textContent = stats.lowStockCount || 0;
    const outOfStockEl = document.getElementById('stat-out-of-stock');
    if (outOfStockEl) outOfStockEl.textContent = stats.outOfStockCount || 0;

    // Render Recent Orders
    const ordersTbody = document.getElementById('dashboard-recent-orders-tbody');
    if (ordersTbody) {
      if (recentOrders.length === 0) {
        ordersTbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:#94a3b8;">No orders recorded yet.</td></tr>`;
      } else {
        ordersTbody.innerHTML = recentOrders.map(o => `
          <tr>
            <td style="font-weight:700; color:var(--admin-primary);">${o.order_number}</td>
            <td>${o.customer_name}</td>
            <td>${new Date(o.created_at).toLocaleDateString()}</td>
            <td style="font-weight:700;">${formatPrice(o.total)}</td>
            <td><span class="status-pill status-${o.status.toLowerCase().replace(/\s+/g, '-')}">${o.status}</span></td>
            <td>
              <button onclick="switchAdminTab('orders')" class="btn btn-outline-primary" style="padding:4px 8px; font-size:0.75rem;">View</button>
            </td>
          </tr>
        `).join('');
      }
    }

    // Render Low Stock items
    const lowStockContainer = document.getElementById('dashboard-low-stock-list');
    if (lowStockContainer) {
      if (lowStockItems.length === 0) {
        lowStockContainer.innerHTML = `<p style="color:var(--admin-text-muted); font-size:0.88rem;">All products are well stocked! 👍</p>`;
      } else {
        lowStockContainer.innerHTML = lowStockItems.map(p => `
          <div style="display:flex; justify-content:space-between; align-items:center; padding:10px 0; border-bottom:1px solid #f1f5f9;">
            <div style="display:flex; gap:10px; align-items:center;">
              <img src="${p.image}" style="width:36px; height:45px; object-fit:cover; border-radius:4px;">
              <div>
                <div style="font-weight:600; font-size:0.85rem;">${p.name}</div>
                <div style="font-size:0.75rem; color:#ef4444; font-weight:700;">Only ${p.stock} remaining</div>
              </div>
            </div>
            <button onclick="quickUpdateStockPrompt(${p.id}, ${p.stock})" class="btn btn-outline-primary" style="padding:4px 8px; font-size:0.75rem;">Restock</button>
          </div>
        `).join('');
      }
    }
  } catch (err) {
    console.error('Failed to load dashboard stats:', err);
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
            <div style="display:flex; flex-direction:column; gap:4px;">
              <span class="stock-pill ${isInStock ? (isLowStock ? 'pill-low' : 'pill-in') : 'pill-out'}">
                ${isInStock ? (isLowStock ? `⚠️ Low (${p.stock})` : `🟢 In Stock (${p.stock})`) : `🔴 Out of Stock (0)`}
              </span>
            </div>
          </td>
          <td>
            <div style="display:flex; gap:6px; align-items:center;">
              <button onclick="toggleProductStock(${p.id}, ${p.stock})"
                class="btn ${isInStock ? 'btn-warn-outline' : 'btn-success-outline'}"
                style="padding:5px 9px; font-size:0.75rem; font-weight:700; white-space:nowrap;"
                title="${isInStock ? 'Click to mark product as Out of Stock' : 'Click to mark product as In Stock'}">
                ${isInStock ? 'Mark Out of Stock 🚫' : 'Mark In Stock ✅'}
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

// 1-Click Quick Toggle: In Stock <-> Out of Stock
async function toggleProductStock(productId, currentStock) {
  try {
    const res = await fetch(`${API_BASE}/admin/products/${productId}/toggle-stock`, {
      method: 'PATCH'
    });
    const data = await res.json();
    if (data.success) {
      showToast(data.message, data.inStock ? 'success' : 'info');
      loadAdminProducts();
      loadDashboardStats();
    } else {
      showToast(data.message || 'Failed to toggle stock', 'error');
    }
  } catch (err) {
    showToast('Network error while toggling stock', 'error');
  }
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
async function loadAdminOrders() {
  const tbody = document.getElementById('admin-orders-tbody');
  const statusFilter = document.getElementById('admin-orders-filter-status')?.value || 'All';
  if (!tbody) return;

  tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:20px;">Loading orders...</td></tr>`;

  try {
    const url = statusFilter !== 'All' ? `${API_BASE}/admin/orders?status=${encodeURIComponent(statusFilter)}` : `${API_BASE}/admin/orders`;
    const res = await fetch(url);
    const data = await res.json();
    if (!data.success) return;

    currentOrders = data.orders;

    if (currentOrders.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:20px;">No orders found.</td></tr>`;
      return;
    }

    const statuses = ['Pending', 'Confirmed', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'];

    tbody.innerHTML = currentOrders.map(o => `
      <tr>
        <td style="font-weight:700; color:var(--admin-primary);">${o.order_number}</td>
        <td>
          <div style="font-weight:600;">${o.customer_name}</div>
          <div style="font-size:0.75rem; color:#64748b;">${o.customer_phone}</div>
        </td>
        <td>${new Date(o.created_at).toLocaleDateString()}</td>
        <td style="font-weight:700;">${formatPrice(o.total)}</td>
        <td>${o.payment_method}</td>
        <td>
          <select onchange="updateOrderStatus(${o.id}, this.value)" style="padding:4px 8px; font-size:0.8rem; border-radius:4px; border:1px solid #cbd5e1; font-weight:600;">
            ${statuses.map(st => `<option value="${st}" ${o.status === st ? 'selected' : ''}>${st}</option>`).join('')}
          </select>
        </td>
        <td>
          <button onclick="viewOrderModal(${o.id})" class="btn btn-outline-primary" style="padding:4px 8px; font-size:0.75rem;">View Items</button>
        </td>
      </tr>
    `).join('');
  } catch (err) {
    console.error('Error fetching admin orders:', err);
  }
}

async function updateOrderStatus(orderId, newStatus) {
  try {
    const res = await fetch(`${API_BASE}/admin/orders/${orderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    });
    const data = await res.json();
    if (data.success) {
      showToast(`Order status updated to "${newStatus}"`, 'success');
      loadDashboardStats();
    } else {
      showToast(data.message || 'Failed to update order', 'error');
    }
  } catch (err) {
    showToast('Failed to update status', 'error');
  }
}

function viewOrderModal(orderId) {
  const o = currentOrders.find(ord => ord.id === orderId);
  if (!o) return;

  const content = document.getElementById('order-detail-modal-body');
  content.innerHTML = `
    <div style="margin-bottom:16px;">
      <div style="font-size:1.1rem; font-weight:700; color:var(--admin-primary);">${o.order_number}</div>
      <div style="font-size:0.85rem; color:#64748b;">Customer: <strong>${o.customer_name}</strong> (${o.customer_email})</div>
      <div style="font-size:0.85rem; color:#64748b; margin-top:4px;">Delivery Address: ${o.delivery_address}</div>
    </div>

    <table style="width:100%; border-collapse:collapse; font-size:0.88rem;">
      <thead>
        <tr style="border-bottom:1px solid #e2e8f0; text-align:left;">
          <th style="padding:8px 0;">Item</th>
          <th style="padding:8px 0;">Size</th>
          <th style="padding:8px 0;">Qty</th>
          <th style="padding:8px 0;">Price</th>
          <th style="padding:8px 0; text-align:right;">Total</th>
        </tr>
      </thead>
      <tbody>
        ${(o.items || []).map(it => `
          <tr style="border-bottom:1px solid #f1f5f9;">
            <td style="padding:8px 0; font-weight:600;">${it.product_name}</td>
            <td style="padding:8px 0;">${it.size || '-'}</td>
            <td style="padding:8px 0;">${it.quantity}</td>
            <td style="padding:8px 0;">${formatPrice(it.price)}</td>
            <td style="padding:8px 0; text-align:right; font-weight:700;">${formatPrice(it.total)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <div style="margin-top:16px; text-align:right; font-size:1rem; font-weight:700;">
      Grand Total: ${formatPrice(o.total)}
    </div>
  `;

  document.getElementById('order-detail-modal').classList.add('active');
}

// 4. Admin Customers
async function loadAdminCustomers() {
  const tbody = document.getElementById('admin-customers-tbody');
  if (!tbody) return;

  tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:24px; color:#64748b;">Loading registered customers...</td></tr>`;

  try {
    const res = await fetch(`${API_BASE}/admin/customers`);
    if (res.status === 401 || res.status === 403) {
      showAdminLoginScreen();
      return;
    }
    const data = await res.json();
    if (!data.success) return;

    if (!data.customers || data.customers.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:20px;">No registered customers yet.</td></tr>`;
      return;
    }

    tbody.innerHTML = data.customers.map(c => `
      <tr>
        <td style="font-weight:600;">${c.name}</td>
        <td>${c.email}</td>
        <td>${c.phone || '-'}</td>
        <td>${new Date(c.created_at).toLocaleDateString()}</td>
        <td style="font-weight:600;">${c.order_count} orders</td>
        <td style="font-weight:700;">${formatPrice(c.total_spent)}</td>
      </tr>
    `).join('');
  } catch (err) {
    console.error('Error fetching customers:', err);
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:20px; color:#ef4444;">Failed to load customers.</td></tr>`;
  }
}

// 5. Admin Categories
async function loadCategoriesList() {
  try {
    const res = await fetch(`${API_BASE}/admin/categories`);
    const data = await res.json();
    if (data.success) {
      currentCategories = data.categories;
    }
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
    const res = await fetch(`${API_BASE}/admin/categories`);
    if (res.status === 401 || res.status === 403) {
      showAdminLoginScreen();
      return;
    }
    const data = await res.json();
    if (!data.success) return;

    currentCategories = data.categories;

    tbody.innerHTML = currentCategories.map(cat => `
      <tr>
        <td>
          <img src="${cat.image}" style="width:40px; height:40px; border-radius:50%; object-fit:cover;" onerror="this.src='https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=100&q=80'">
        </td>
        <td style="font-weight:700;">${cat.name}</td>
        <td><code>${cat.slug}</code></td>
        <td>${cat.product_count} products</td>
        <td>${cat.display_order}</td>
        <td>
          <button onclick="deleteCategory(${cat.id})" class="btn btn-outline" style="padding:4px 8px; font-size:0.75rem; color:#ef4444; border-color:#fca5a5;">Delete</button>
        </td>
      </tr>
    `).join('');
  } catch (err) {
    console.error('Error fetching categories:', err);
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
  const display_order = Number(document.getElementById('cat-form-order').value) || 0;

  try {
    const res = await fetch(`${API_BASE}/admin/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, image, description, display_order, active: 1 })
    });
    const data = await res.json();
    if (data.success) {
      showToast('Category added', 'success');
      closeCategoryModal();
      loadAdminCategories();
      loadCategoriesList();
    } else {
      showToast(data.message || 'Failed to add category', 'error');
    }
  } catch (err) {
    showToast('Failed to add category', 'error');
  }
}

async function deleteCategory(id) {
  if (!confirm('Are you sure you want to delete this category?')) return;
  try {
    const res = await fetch(`${API_BASE}/admin/categories/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
      showToast('Category deleted', 'info');
      loadAdminCategories();
      loadCategoriesList();
    }
  } catch (err) {
    showToast('Failed to delete category', 'error');
  }
}

// 6. Admin Banners
async function loadAdminBanners() {
  const tbody = document.getElementById('admin-banners-tbody');
  if (!tbody) return;

  try {
    const res = await fetch(`${API_BASE}/admin/banners`);
    const data = await res.json();
    if (!data.success) return;

    tbody.innerHTML = data.banners.map(b => `
      <tr>
        <td><img src="${b.image}" style="width:100px; height:50px; object-fit:cover; border-radius:4px;"></td>
        <td style="font-weight:600;">${b.title}</td>
        <td>${b.subtitle || '-'}</td>
        <td>${b.link}</td>
        <td>${b.active ? 'Active' : 'Inactive'}</td>
        <td>
          <button onclick="deleteBanner(${b.id})" class="btn btn-outline" style="padding:4px 8px; font-size:0.75rem; color:#ef4444; border-color:#fca5a5;">Delete</button>
        </td>
      </tr>
    `).join('');
  } catch (err) {
    console.error('Error fetching banners:', err);
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
  const button_text = document.getElementById('banner-form-btn-text').value.trim();

  try {
    const res = await fetch(`${API_BASE}/admin/banners`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, subtitle, image, link, button_text, active: 1 })
    });
    const data = await res.json();
    if (data.success) {
      showToast('Banner added', 'success');
      closeBannerModal();
      loadAdminBanners();
    }
  } catch (err) {
    showToast('Failed to add banner', 'error');
  }
}

async function deleteBanner(id) {
  if (!confirm('Delete this banner?')) return;
  try {
    await fetch(`${API_BASE}/admin/banners/${id}`, { method: 'DELETE' });
    showToast('Banner deleted', 'info');
    loadAdminBanners();
  } catch (err) {
    showToast('Failed to delete banner', 'error');
  }
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
