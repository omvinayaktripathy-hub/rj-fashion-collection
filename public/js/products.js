// RJ FASHION COLLECTION - SHOP & PRODUCT LISTING LOGIC
// High performance: Supports Direct Cloud Static data & Node API fallback

let currentFilters = {
  search: '',
  department: '',
  subcategory: '',
  category: '',
  minPrice: '',
  maxPrice: '',
  rating: '',
  discount: '',
  inStock: false,
  offer: false,
  newArrival: false,
  sort: 'relevance',
  page: 1,
  limit: 12
};

// Parse URL params
function parseUrlParams() {
  const params = new URLSearchParams(window.location.search);
  currentFilters.search = params.get('search') || '';
  currentFilters.department = params.get('department') || '';
  currentFilters.subcategory = params.get('subcategory') || '';
  currentFilters.category = params.get('category') || '';
  currentFilters.minPrice = params.get('minPrice') || '';
  currentFilters.maxPrice = params.get('maxPrice') || '';
  currentFilters.rating = params.get('rating') || '';
  currentFilters.discount = params.get('discount') || '';
  currentFilters.sort = params.get('sort') || 'relevance';
  currentFilters.page = Number(params.get('page')) || 1;
  currentFilters.offer = params.get('offer') === 'true';
  currentFilters.newArrival = params.get('newArrival') === 'true';
  if (params.get('inStock') === 'true') currentFilters.inStock = true;
}

// Generate Product Card HTML
function createProductCard(p) {
  const isOutOfStock = (p.stock || 0) <= 0;
  const isLowStock = (p.stock || 0) > 0 && (p.stock || 0) <= 4;

  let isWishlisted = false;
  try {
    const saved = JSON.parse(localStorage.getItem('rjfc_wishlist') || '[]');
    isWishlisted = saved.some(id => String(id) === String(p.id));
  } catch (_) {}

  return `
    <div class="product-card ${isOutOfStock ? 'is-out-of-stock' : ''}" data-id="${p.id}">
      <div class="product-image-wrap">
        <a href="/product.html?id=${p.id}">
          <img src="${p.image}" alt="${p.name}" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=600&q=80'">
        </a>
        ${p.discount > 0 ? `<span class="badge-discount">${p.discount}% OFF</span>` : ''}
        ${isOutOfStock ? `<span class="badge-out-of-stock">OUT OF STOCK</span>` : (isLowStock ? `<span class="badge-stock" style="background:#d97706; color:#ffffff;">Only ${p.stock} left</span>` : '')}
        <button class="wishlist-toggle-btn ${isWishlisted ? 'active' : ''}" onclick="toggleWishlist(${p.id}, this)" title="Add to Wishlist" style="${isWishlisted ? 'color:var(--primary);' : ''}">${isWishlisted ? '♥' : '♡'}</button>
      </div>

      <div class="product-details">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
          <span class="product-brand" style="margin-bottom: 0;">${p.brand || 'RJ Collection'}</span>
          ${isOutOfStock 
            ? `<span class="stock-status-pill stock-pill-out">🔴 Out of Stock</span>` 
            : (isLowStock 
                ? `<span class="stock-status-pill stock-pill-low">⚡ Only ${p.stock} left</span>` 
                : `<span class="stock-status-pill stock-pill-in">🟢 In Stock</span>`)}
        </div>
        <h3 class="product-title">
          <a href="/product.html?id=${p.id}" title="${p.name}">${p.name}</a>
        </h3>

        <div class="product-rating">
          <span class="rating-badge">★ ${p.rating ? Number(p.rating).toFixed(1) : '4.5'}</span>
          <span class="rating-count">(${p.reviews_count || 12})</span>
        </div>

        <div class="product-price-row">
          <span class="price-current">${formatPrice(p.price)}</span>
          ${p.original_price > p.price ? `<span class="price-original">${formatPrice(p.original_price)}</span>` : ''}
          ${p.discount > 0 ? `<span class="price-discount">${p.discount}% off</span>` : ''}
        </div>

        <div class="product-actions">
          <button class="btn btn-card btn-outline-primary"
            onclick="addToCart(${p.id})"
            ${isOutOfStock ? 'disabled style="opacity:0.55; cursor:not-allowed; background:#f8fafc; color:#94a3b8; border-color:#cbd5e1;"' : ''}>
            ${isOutOfStock ? 'Out of Stock' : '🛒 Add'}
          </button>
          <button class="btn btn-card btn-primary"
            onclick="quickBuy(${p.id})"
            ${isOutOfStock ? 'disabled style="opacity:0.55; cursor:not-allowed; background:#cbd5e1; color:#64748b; border-color:#cbd5e1;"' : ''}>
            ${isOutOfStock ? 'Sold Out' : '⚡ Buy Now'}
          </button>
        </div>
      </div>
    </div>
  `;
}

// Quick Buy
async function quickBuy(productId) {
  const added = await addToCart(productId);
  if (added) {
    window.location.href = '/delivery.html';
  }
}

// Fetch and Render Products
async function loadProducts() {
  const container = document.getElementById('shop-product-grid');
  const countDisplay = document.getElementById('product-count-display');
  const titleDisplay = document.getElementById('page-heading-title');
  const paginationContainer = document.getElementById('pagination-container');

  if (!container) return;

  container.innerHTML = `
    <div style="grid-column: 1 / -1; text-align: center; padding: 60px 0;">
      <p style="font-size: 1.1rem; color: var(--muted);">Loading royal fashion collection...</p>
    </div>
  `;

  let products = [];
  let total = 0;

  // Determine if static host (Firebase Hosting, Netlify, Github Pages)
  const isStaticHost = window.location.hostname.includes('firebaseapp.com') ||
                       window.location.hostname.includes('web.app') ||
                       window.location.hostname.includes('netlify.app') ||
                       window.location.protocol === 'file:';

  if (!isStaticHost) {
    // Try Server API first on localhost / node
    try {
      const q = new URLSearchParams();
      if (currentFilters.search) q.append('search', currentFilters.search);
      if (currentFilters.department) q.append('department', currentFilters.department);
      if (currentFilters.subcategory) q.append('subcategory', currentFilters.subcategory);
      if (currentFilters.category) q.append('category', currentFilters.category);
      if (currentFilters.minPrice) q.append('minPrice', currentFilters.minPrice);
      if (currentFilters.maxPrice) q.append('maxPrice', currentFilters.maxPrice);
      if (currentFilters.rating) q.append('rating', currentFilters.rating);
      if (currentFilters.discount) q.append('discount', currentFilters.discount);
      if (currentFilters.inStock) q.append('inStock', 'true');
      if (currentFilters.offer) q.append('offer', 'true');
      if (currentFilters.newArrival) q.append('newArrival', 'true');
      if (currentFilters.sort) q.append('sort', currentFilters.sort);
      q.append('page', currentFilters.page);
      q.append('limit', currentFilters.limit);

      const res = await fetch(`${API_BASE}/products?${q.toString()}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.products)) {
          products = data.products;
          total = data.pagination?.total || products.length;
        }
      }
    } catch (_) {}
  }

  // Load from static products.json if server didn't provide
  if (products.length === 0 && total === 0) {
    try {
      const fbRes = await fetch('/data/products.json');
      const staticData = await fbRes.json();
      let all = staticData.products || [];

      // Filter: Search
      if (currentFilters.search) {
        const s = currentFilters.search.toLowerCase().trim();
        all = all.filter(p => 
          (p.name && p.name.toLowerCase().includes(s)) ||
          (p.description && p.description.toLowerCase().includes(s)) ||
          (p.brand && p.brand.toLowerCase().includes(s)) ||
          (p.subcategory && p.subcategory.toLowerCase().includes(s)) ||
          (p.material && p.material.toLowerCase().includes(s))
        );
      }

      // Filter: Department
      if (currentFilters.department && currentFilters.department.toLowerCase() !== 'all') {
        const dept = currentFilters.department.toLowerCase();
        all = all.filter(p => (p.department || '').toLowerCase() === dept);
      }

      // Filter: Category / Subcategory
      if (currentFilters.category) {
        const cat = currentFilters.category.toLowerCase().replace(/-/g, ' ');
        all = all.filter(p => 
          (p.category_slug && p.category_slug.toLowerCase() === currentFilters.category.toLowerCase()) ||
          (p.category_name && p.category_name.toLowerCase().replace(/-/g, ' ').includes(cat)) ||
          (p.subcategory && p.subcategory.toLowerCase().replace(/-/g, ' ').includes(cat))
        );
      }

      if (currentFilters.subcategory) {
        const sub = currentFilters.subcategory.toLowerCase().replace(/-/g, ' ');
        all = all.filter(p => 
          (p.subcategory && p.subcategory.toLowerCase().replace(/-/g, ' ').includes(sub)) ||
          (p.category_slug && p.category_slug.toLowerCase().includes(currentFilters.subcategory.toLowerCase()))
        );
      }

      // Filter: In Stock
      if (currentFilters.inStock) {
        all = all.filter(p => (p.stock || 0) > 0);
      }

      // Filter: Offers & New Arrival
      if (currentFilters.offer) {
        all = all.filter(p => Boolean(p.offer) || (p.discount || 0) > 0);
      }
      if (currentFilters.newArrival) {
        all = all.filter(p => Boolean(p.new_arrival));
      }

      // Filter: Price Range
      if (currentFilters.minPrice) {
        all = all.filter(p => Number(p.price) >= Number(currentFilters.minPrice));
      }
      if (currentFilters.maxPrice) {
        all = all.filter(p => Number(p.price) <= Number(currentFilters.maxPrice));
      }

      // Filter: Rating
      if (currentFilters.rating) {
        all = all.filter(p => Number(p.rating || 4.5) >= Number(currentFilters.rating));
      }

      // Filter: Discount
      if (currentFilters.discount) {
        all = all.filter(p => Number(p.discount || 0) >= Number(currentFilters.discount));
      }

      // Sort
      if (currentFilters.sort === 'price-low') {
        all.sort((a, b) => Number(a.price) - Number(b.price));
      } else if (currentFilters.sort === 'price-high') {
        all.sort((a, b) => Number(b.price) - Number(a.price));
      } else if (currentFilters.sort === 'rating') {
        all.sort((a, b) => Number(b.rating || 4.5) - Number(a.rating || 4.5));
      } else if (currentFilters.sort === 'discount') {
        all.sort((a, b) => Number(b.discount || 0) - Number(a.discount || 0));
      }

      total = all.length;
      const limit = currentFilters.limit || 12;
      const page = currentFilters.page || 1;
      const start = (page - 1) * limit;
      products = all.slice(start, start + limit);
    } catch (err) {
      console.error('Failed to load local products.json:', err);
    }
  }

  // Update Heading Title
  if (titleDisplay) {
    if (currentFilters.search) {
      titleDisplay.textContent = `Search results for: "${currentFilters.search}"`;
    } else if (currentFilters.subcategory) {
      const deptPrefix = currentFilters.department ? (currentFilters.department.toUpperCase() + ' • ') : '';
      titleDisplay.textContent = `${deptPrefix}${currentFilters.subcategory.replace(/-/g, ' ').toUpperCase()}`;
    } else if (currentFilters.category) {
      titleDisplay.textContent = `Collection: ${currentFilters.category.toUpperCase().replace(/-/g, ' ')}`;
    } else if (currentFilters.department) {
      titleDisplay.textContent = `${currentFilters.department.toUpperCase()}'S FASHION COLLECTION`;
    } else if (currentFilters.offer) {
      titleDisplay.textContent = `Exclusive Festive Offers`;
    } else if (currentFilters.newArrival) {
      titleDisplay.textContent = `New Arrivals`;
    } else {
      titleDisplay.textContent = `All Products`;
    }
  }

  // Update Count
  if (countDisplay) {
    countDisplay.textContent = `Showing ${products.length} of ${total} products`;
  }

  // Render Empty State
  if (products.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1;" class="empty-state">
        <div class="empty-state-icon">🔍</div>
        <h3>No Products Found</h3>
        <p>We couldn't find any products matching your current filters. Try changing or resetting your search criteria.</p>
        <button class="btn btn-primary" onclick="resetFilters()">Reset All Filters</button>
      </div>
    `;
    if (paginationContainer) paginationContainer.innerHTML = '';
    return;
  }

  // Render Product Cards
  container.innerHTML = products.map(createProductCard).join('');

  // Render Pagination
  renderPagination({
    total,
    page: currentFilters.page,
    limit: currentFilters.limit,
    totalPages: Math.ceil(total / currentFilters.limit) || 1
  });
}

// Render Pagination
function renderPagination(pagination) {
  const container = document.getElementById('pagination-container');
  if (!container) return;

  const { page, totalPages } = pagination;
  if (totalPages <= 1) {
    container.innerHTML = '';
    return;
  }

  let html = `<div style="display: flex; justify-content: center; gap: 8px; margin-top: 40px; flex-wrap: wrap;">`;
  if (page > 1) {
    html += `<button class="btn btn-outline-primary" style="padding: 6px 14px;" onclick="goToPage(${page - 1})">« Prev</button>`;
  }

  for (let i = 1; i <= totalPages; i++) {
    const isActive = i === page;
    html += `
      <button class="btn ${isActive ? 'btn-primary' : 'btn-outline-primary'}"
        style="padding: 6px 12px; min-width: 38px;"
        onclick="goToPage(${i})">${i}</button>
    `;
  }

  if (page < totalPages) {
    html += `<button class="btn btn-outline-primary" style="padding: 6px 14px;" onclick="goToPage(${page + 1})">Next »</button>`;
  }

  html += `</div>`;
  container.innerHTML = html;
}

function goToPage(p) {
  currentFilters.page = p;
  loadProducts();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function resetFilters() {
  currentFilters = {
    search: '',
    department: '',
    subcategory: '',
    category: '',
    minPrice: '',
    maxPrice: '',
    rating: '',
    discount: '',
    inStock: false,
    offer: false,
    newArrival: false,
    sort: 'relevance',
    page: 1,
    limit: 12
  };
  window.history.pushState({}, '', '/shop.html');
  loadProducts();
  syncFilterInputs();
  loadSidebarCategories();
}

function syncFilterInputs() {
  const sortSelect = document.getElementById('filter-sort');
  if (sortSelect) sortSelect.value = currentFilters.sort;

  const inStockCheck = document.getElementById('filter-instock');
  if (inStockCheck) inStockCheck.checked = currentFilters.inStock;

  const minPriceInput = document.getElementById('filter-min-price');
  if (minPriceInput) minPriceInput.value = currentFilters.minPrice || '';

  const maxPriceInput = document.getElementById('filter-max-price');
  if (maxPriceInput) maxPriceInput.value = currentFilters.maxPrice || '';

  const ratingRadios = document.querySelectorAll('input[name="rating-filter"]');
  ratingRadios.forEach(r => { r.checked = r.value === (currentFilters.rating || ''); });

  const discountRadios = document.querySelectorAll('input[name="discount-filter"]');
  discountRadios.forEach(d => { d.checked = d.value === (currentFilters.discount || ''); });

  document.querySelectorAll('.dept-filter-pill').forEach(pill => {
    const pillDept = pill.getAttribute('data-department') || '';
    if (pillDept === (currentFilters.department || '')) {
      pill.classList.add('active');
    } else {
      pill.classList.remove('active');
    }
  });
}

function setDepartmentFilter(dept) {
  currentFilters.department = dept;
  currentFilters.subcategory = '';
  currentFilters.category = '';
  currentFilters.page = 1;
  const url = new URL(window.location);
  if (dept) {
    url.searchParams.set('department', dept);
  } else {
    url.searchParams.delete('department');
  }
  url.searchParams.delete('subcategory');
  url.searchParams.delete('category');
  window.history.pushState({}, '', url);
  syncFilterInputs();
  loadProducts();
  loadSidebarCategories();
}

function setRatingFilter(val) {
  currentFilters.rating = val;
  currentFilters.page = 1;
  loadProducts();
}

function setDiscountFilter(val) {
  currentFilters.discount = val;
  currentFilters.page = 1;
  loadProducts();
}

// Populate Categories in Sidebar
async function loadSidebarCategories() {
  const list = document.getElementById('sidebar-category-list');
  if (!list) return;

  let categories = [];
  try {
    const res = await fetch('/data/categories.json');
    if (res.ok) {
      const data = await res.json();
      if (data.categories) categories = data.categories;
    }
  } catch (_) {}

  if (categories.length === 0) {
    categories = [
      { name: 'Sarees', slug: 'sarees', product_count: 7 },
      { name: 'Jewelry', slug: 'jewelry', product_count: 6 },
      { name: 'Lehengas', slug: 'lehengas', product_count: 5 },
      { name: 'Kurtis', slug: 'kurtis', product_count: 5 },
      { name: 'Ethnic Wear', slug: 'ethnic-wear', product_count: 8 },
      { name: 'Dresses', slug: 'dresses', product_count: 4 }
    ];
  }

  list.innerHTML = `
    <li style="margin-bottom: 8px;">
      <a href="#" onclick="applyCategoryFilter(''); return false;" style="font-size: 0.88rem; font-weight: ${!currentFilters.category ? '700; color:var(--primary)' : '500; color:var(--dark)'}">
        All Categories
      </a>
    </li>
  ` + categories.map(cat => `
    <li style="margin-bottom: 8px;">
      <a href="#" onclick="applyCategoryFilter('${cat.slug}'); return false;"
         style="display: flex; justify-content: space-between; font-size: 0.88rem; font-weight: ${currentFilters.category === cat.slug ? '700; color:var(--primary)' : '500; color:var(--dark)'}">
        <span>${cat.name}</span>
        <span style="color:var(--muted); font-size:0.75rem;">(${cat.product_count || 5})</span>
      </a>
    </li>
  `).join('');
}

function applyCategoryFilter(slug) {
  currentFilters.category = slug;
  currentFilters.page = 1;
  const url = new URL(window.location);
  if (slug) {
    url.searchParams.set('category', slug);
  } else {
    url.searchParams.delete('category');
  }
  window.history.pushState({}, '', url);
  loadProducts();
  loadSidebarCategories();
}

// Init Shop Page
function initShop() {
  parseUrlParams();
  syncFilterInputs();
  loadSidebarCategories();
  loadProducts();

  // Sorting Listener
  const sortSelect = document.getElementById('filter-sort');
  if (sortSelect) {
    sortSelect.onchange = (e) => {
      currentFilters.sort = e.target.value;
      currentFilters.page = 1;
      loadProducts();
    };
  }

  // Price filter button
  const priceBtn = document.getElementById('apply-price-filter');
  if (priceBtn) {
    priceBtn.onclick = () => {
      const min = document.getElementById('filter-min-price')?.value;
      const max = document.getElementById('filter-max-price')?.value;
      currentFilters.minPrice = min;
      currentFilters.maxPrice = max;
      currentFilters.page = 1;
      loadProducts();
    };
  }

  // In stock toggle
  const inStockCheck = document.getElementById('filter-instock');
  if (inStockCheck) {
    inStockCheck.onchange = (e) => {
      currentFilters.inStock = e.target.checked;
      currentFilters.page = 1;
      loadProducts();
    };
  }
}

// Immediate execution if DOM already loaded, or on DOMContentLoaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initShop);
} else {
  initShop();
}
