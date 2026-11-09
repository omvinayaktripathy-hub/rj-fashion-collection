function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
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
// Skeleton Loading Card Generator
function createSkeletonCard() {
  return `
    <div class="skeleton-card">
      <div class="skeleton-img skeleton-shimmer"></div>
      <div class="skeleton-content">
        <div class="skeleton-line short skeleton-shimmer"></div>
        <div class="skeleton-line long skeleton-shimmer"></div>
        <div class="skeleton-line medium skeleton-shimmer"></div>
        <div class="skeleton-line short skeleton-shimmer" style="margin-top: 8px;"></div>
      </div>
    </div>
  `;
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

  // Parse additional images for secondary image hover flip
  let addImages = [];
  if (Array.isArray(p.additional_images)) {
    addImages = p.additional_images;
  } else if (typeof p.additional_images === 'string' && p.additional_images.startsWith('[')) {
    try { addImages = JSON.parse(p.additional_images); } catch (_) {}
  }
  const hoverImg = (addImages.length > 1 && addImages[1] !== p.image) 
    ? addImages[1] 
    : (addImages.length > 0 && addImages[0] !== p.image ? addImages[0] : null);

  // Parse sizes for card display
  let sizes = [];
  if (Array.isArray(p.available_sizes)) {
    sizes = p.available_sizes;
  } else if (typeof p.available_sizes === 'string' && p.available_sizes.startsWith('[')) {
    try { sizes = JSON.parse(p.available_sizes); } catch (_) {}
  }
  const displaySizes = sizes.map(s => String(s).replace(/\s*\(.*\)/, '').trim()).filter(Boolean).slice(0, 4);

  return `
    <div class="product-card ${isOutOfStock ? 'is-out-of-stock' : ''}" data-id="${p.id}">
      <div class="product-image-wrap">
        <a href="/product.html?id=${p.id}" class="product-img-link">
          <img class="product-primary-img" src="${p.image}" alt="${escapeHtml(p.name)}" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=600&q=80'">
          ${hoverImg ? `<img class="product-hover-img" src="${hoverImg}" alt="${escapeHtml(p.name)} alternate angle" loading="lazy">` : ''}
        </a>
        ${p.discount > 0 ? `<span class="badge-discount">${p.discount}% OFF</span>` : ''}
        ${isOutOfStock ? `<span class="badge-out-of-stock">OUT OF STOCK</span>` : (isLowStock ? `<span class="badge-stock">Only ${p.stock} left</span>` : '')}
        <button class="wishlist-toggle-btn ${isWishlisted ? 'active' : ''}" onclick="toggleWishlist('${escapeHtml(String(p.id))}', this)" title="${isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}" aria-label="Wishlist">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="${isWishlisted ? '#ef4444' : 'none'}" stroke="${isWishlisted ? '#ef4444' : '#111111'}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
          </svg>
        </button>
        <button class="quick-view-btn" onclick="openQuickView('${escapeHtml(String(p.id))}', event)" title="Quick View">Quick View</button>
      </div>

      <div class="product-details">
        <div class="product-card-meta-row">
          <span class="product-brand">${escapeHtml(p.brand || 'RJ COLLECTION')}</span>
          ${isOutOfStock 
            ? `<span class="stock-status-pill stock-pill-out"><span class="status-dot dot-out"></span>Sold Out</span>` 
            : `<span class="stock-status-pill stock-pill-in"><span class="status-dot dot-in"></span>In Stock</span>`}
        </div>
        <h3 class="product-title">
          <a href="/product.html?id=${p.id}" title="${escapeHtml(p.name)}">${escapeHtml(p.name)}</a>
        </h3>

        ${displaySizes.length > 0 ? `
          <div class="product-card-sizes" title="Select Size">
            ${displaySizes.map((sz, idx) => `<span class="product-size-chip ${idx === 0 ? 'selected' : ''}" data-size="${escapeHtml(sz)}" onclick="selectCardSize('${escapeHtml(String(p.id))}', '${escapeHtml(sz)}', this, event)">${escapeHtml(sz)}</span>`).join('')}
          </div>
        ` : ''}

        <div class="product-rating">
          <span class="rating-badge">&#9733; ${p.rating ? Number(p.rating).toFixed(1) : '4.8'}</span>
          <span class="rating-count">(${p.reviews_count || 32})</span>
        </div>

        <div class="product-price-row">
          <span class="price-current">${formatPrice(p.price)}</span>
          ${p.original_price > p.price ? `<span class="price-original">${formatPrice(p.original_price)}</span>` : ''}
          ${p.discount > 0 ? `<span class="price-discount">${p.discount}% OFF</span>` : ''}
        </div>

        <div class="product-actions">
          <button class="btn-card-add"
            onclick="handleCardAddToCart('${escapeHtml(String(p.id))}', event)"
            ${isOutOfStock ? 'disabled' : ''}
            title="${isOutOfStock ? 'Item out of stock' : 'Add to Shopping Bag'}">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-2px;margin-right:4px;">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <path d="M16 10a4 4 0 0 1-8 0"></path>
            </svg>
            <span>${isOutOfStock ? 'OUT OF STOCK' : 'ADD TO BAG'}</span>
          </button>
          <button class="btn-card-buy"
            onclick="handleCardBuyNow('${escapeHtml(String(p.id))}', event)"
            ${isOutOfStock ? 'disabled' : ''}
            title="${isOutOfStock ? 'Item out of stock' : 'Proceed directly to checkout'}">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" style="vertical-align:-2px;margin-right:4px;">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
            </svg>
            <span>BUY NOW</span>
          </button>
        </div>
      </div>
    </div>
  `;
}

// Select Card Size
function selectCardSize(productId, size, el, event) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }
  const card = el ? el.closest('.product-card') : document.querySelector(`.product-card[data-id="${productId}"]`);
  if (card) {
    card.setAttribute('data-selected-size', size);
    card.querySelectorAll('.product-size-chip').forEach(c => c.classList.remove('selected'));
    if (el) el.classList.add('selected');
  }
}

// Card Add To Bag Handler
async function handleCardAddToCart(productId, event) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }
  const card = event && event.target ? event.target.closest('.product-card') : document.querySelector(`.product-card[data-id="${productId}"]`);
  let selectedSize = card ? card.getAttribute('data-selected-size') : null;

  if (!selectedSize) {
    let p = null;
    if (window.catalogProducts && Array.isArray(window.catalogProducts)) {
      p = window.catalogProducts.find(item => String(item.id) === String(productId));
    }
    if (p && p.available_sizes) {
      let sizes = [];
      if (Array.isArray(p.available_sizes)) sizes = p.available_sizes;
      else if (typeof p.available_sizes === 'string' && p.available_sizes.startsWith('[')) {
        try { sizes = JSON.parse(p.available_sizes); } catch (_) {}
      }
      if (sizes.length > 0) {
        selectedSize = String(sizes[0]).replace(/\s*\(.*\)/, '').trim();
      }
    }
  }

  await addToCart(productId, 1, selectedSize || 'Free Size');
}

// Card Buy Now Handler - Instant Direct Checkout Flow
async function handleCardBuyNow(productId, event) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }
  const card = event && event.target ? event.target.closest('.product-card') : document.querySelector(`.product-card[data-id="${productId}"]`);
  let selectedSize = card ? card.getAttribute('data-selected-size') : null;

  if (!selectedSize) {
    let p = null;
    if (window.catalogProducts && Array.isArray(window.catalogProducts)) {
      p = window.catalogProducts.find(item => String(item.id) === String(productId));
    }
    if (p && p.available_sizes) {
      let sizes = [];
      if (Array.isArray(p.available_sizes)) sizes = p.available_sizes;
      else if (typeof p.available_sizes === 'string' && p.available_sizes.startsWith('[')) {
        try { sizes = JSON.parse(p.available_sizes); } catch (_) {}
      }
      if (sizes.length > 0) {
        selectedSize = String(sizes[0]).replace(/\s*\(.*\)/, '').trim();
      }
    }
  }

  const added = await addToCart(productId, 1, selectedSize || 'Free Size');
  if (added) {
    window.location.href = '/checkout.html';
  }
}

// Quick Buy
async function quickBuy(productId) {
  return handleCardBuyNow(productId);
}

window.selectCardSize = selectCardSize;
window.handleCardAddToCart = handleCardAddToCart;
window.handleCardBuyNow = handleCardBuyNow;
window.quickBuy = quickBuy;

// ================= QUICK VIEW MODAL CONTROLLER =================
let currentQuickViewProduct = null;
let selectedQuickViewSize = null;

async function openQuickView(productId, event) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }

  let p = null;
  if (window.catalogProducts && Array.isArray(window.catalogProducts)) {
    p = window.catalogProducts.find(item => String(item.id) === String(productId));
  }
  if (!p && window.homepageFullCatalog && Array.isArray(window.homepageFullCatalog)) {
    p = window.homepageFullCatalog.find(item => String(item.id) === String(productId));
  }
  if (!p) {
    try {
      const res = await fetch('/data/products.json');
      if (res.ok) {
        const data = await res.json();
        p = (data.products || []).find(item => String(item.id) === String(productId));
      }
    } catch (_) {}
  }
  if (!p) {
    try {
      const res = await fetch(`/api/products/${productId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.product) p = data.product;
      }
    } catch (_) {}
  }
  if (!p) {
    window.location.href = `/product.html?id=${productId}`;
    return;
  }

  currentQuickViewProduct = p;

  let allImages = [p.image];
  let addImages = [];
  if (Array.isArray(p.additional_images)) {
    addImages = p.additional_images;
  } else if (typeof p.additional_images === 'string' && p.additional_images.startsWith('[')) {
    try { addImages = JSON.parse(p.additional_images); } catch (_) {}
  }
  addImages.forEach(img => {
    if (img && !allImages.includes(img)) allImages.push(img);
  });

  let sizes = ['Free Size'];
  if (Array.isArray(p.available_sizes) && p.available_sizes.length > 0) {
    sizes = p.available_sizes;
  } else if (typeof p.available_sizes === 'string' && p.available_sizes.startsWith('[')) {
    try { sizes = JSON.parse(p.available_sizes); } catch (_) {}
  }
  selectedQuickViewSize = sizes[0] || 'Free Size';

  let modalBackdrop = document.getElementById('rj-quick-view-backdrop');
  if (!modalBackdrop) {
    modalBackdrop = document.createElement('div');
    modalBackdrop.id = 'rj-quick-view-backdrop';
    modalBackdrop.className = 'quick-view-modal-backdrop';
    document.body.appendChild(modalBackdrop);
  }

  const isOutOfStock = (p.stock || 0) <= 0;

  modalBackdrop.innerHTML = `
    <div class="quick-view-modal" onclick="event.stopPropagation()">
      <button class="quick-view-close-btn" onclick="closeQuickView()" title="Close">&times;</button>
      
      <div class="quick-view-gallery">
        <div class="quick-view-main-wrap">
          <img id="qv-main-img" class="quick-view-main-img" src="${allImages[0]}" alt="${escapeHtml(p.name)}">
        </div>
        ${allImages.length > 1 ? `
          <div class="quick-view-thumbs">
            ${allImages.map((img, idx) => `
              <img src="${img}" class="quick-view-thumb ${idx === 0 ? 'is-active' : ''}" 
                   onclick="setQuickViewImage('${img}', this)" alt="Thumbnail ${idx + 1}">
            `).join('')}
          </div>
        ` : ''}
      </div>

      <div class="quick-view-info">
        <span class="quick-view-brand">${escapeHtml(p.brand || 'RJ Collection')}</span>
        <h2 class="quick-view-title">${escapeHtml(p.name)}</h2>
        
        <div class="quick-view-price-row">
          <span class="quick-view-current-price">${formatPrice(p.price)}</span>
          ${p.original_price > p.price ? `<span class="quick-view-original-price">${formatPrice(p.original_price)}</span>` : ''}
          ${p.discount > 0 ? `<span class="quick-view-discount">${p.discount}% OFF</span>` : ''}
        </div>

        <div style="display: flex; align-items: center; gap: 8px;">
          ${isOutOfStock 
            ? `<span class="stock-status-pill stock-pill-out">🔴 Out of Stock</span>` 
            : `<span class="stock-status-pill stock-pill-in">🟢 In Stock (${p.stock} units available)</span>`}
        </div>

        <p class="quick-view-desc">${escapeHtml(p.description || 'Crafted with premium authentic textiles and signature Indian couture detailing.')}</p>

        <div>
          <div class="quick-view-sizes-label">
            <span>Select Size</span>
            <span style="font-size:0.75rem; color:var(--muted);">${escapeHtml(p.category_name || p.category || '')}</span>
          </div>
          <div class="quick-view-sizes-grid">
            ${sizes.map((sz, idx) => `
              <button type="button" class="quick-view-size-chip ${idx === 0 ? 'is-active' : ''}" 
                      onclick="selectQuickViewSize('${escapeHtml(sz)}', this)">${escapeHtml(sz)}</button>
            `).join('')}
          </div>
        </div>

        <div class="quick-view-actions">
          <button class="btn btn-primary" onclick="quickViewAddToCart('${escapeHtml(String(p.id))}')" ${isOutOfStock ? 'disabled' : ''}>
            ${isOutOfStock ? 'Sold Out' : '🛒 Add to Cart'}
          </button>
          <button class="btn btn-outline" style="border: 1.5px solid var(--primary); color: var(--primary);" 
                  onclick="quickViewBuyNow('${escapeHtml(String(p.id))}')" ${isOutOfStock ? 'disabled' : ''}>
            ⚡ Instant Buy
          </button>
        </div>

        <a href="/product.html?id=${p.id}" class="quick-view-more-link">
          View Complete Product Specifications & Lightbox Gallery &rarr;
        </a>
      </div>
    </div>
  `;

  modalBackdrop.onclick = closeQuickView;
  modalBackdrop.classList.add('is-open');
  document.body.style.overflow = 'hidden';
}

function setQuickViewImage(imgUrl, thumbEl) {
  const mainImg = document.getElementById('qv-main-img');
  if (mainImg) mainImg.src = imgUrl;
  document.querySelectorAll('.quick-view-thumb').forEach(t => t.classList.remove('is-active'));
  if (thumbEl) thumbEl.classList.add('is-active');
}

function selectQuickViewSize(size, chipEl) {
  selectedQuickViewSize = size;
  document.querySelectorAll('.quick-view-size-chip').forEach(c => c.classList.remove('is-active'));
  if (chipEl) chipEl.classList.add('is-active');
}

function closeQuickView() {
  const modalBackdrop = document.getElementById('rj-quick-view-backdrop');
  if (modalBackdrop) {
    modalBackdrop.classList.remove('is-open');
  }
  document.body.style.overflow = '';
}

async function quickViewAddToCart(productId) {
  const size = selectedQuickViewSize || 'Free Size';
  await addToCart(productId, 1, size);
  closeQuickView();
}

async function quickViewBuyNow(productId) {
  const size = selectedQuickViewSize || 'Free Size';
  const added = await addToCart(productId, 1, size);
  if (added) {
    closeQuickView();
    window.location.href = '/delivery.html';
  }
}

window.openQuickView = openQuickView;
window.closeQuickView = closeQuickView;
window.setQuickViewImage = setQuickViewImage;
window.selectQuickViewSize = selectQuickViewSize;
window.quickViewAddToCart = quickViewAddToCart;
window.quickViewBuyNow = quickViewBuyNow;

// Fetch and Render Products
async function loadProducts() {
  const container = document.getElementById('shop-product-grid');
  const countDisplay = document.getElementById('product-count-display');
  const titleDisplay = document.getElementById('page-heading-title');
  const paginationContainer = document.getElementById('pagination-container');

  if (!container) return;

  container.innerHTML = Array.from({ length: 8 }, createSkeletonCard).join('');

  let products = [];
  let total = 0;

  // Determine if static host (Firebase Hosting, Netlify, Github Pages)
  const isStaticHost = window.location.hostname.includes('firebaseapp.com') ||
                       window.location.hostname.includes('web.app') ||
                       window.location.hostname.includes('netlify.app') ||
                       window.location.protocol === 'file:' ||
                       (window.location.hostname === '127.0.0.1' && window.location.port !== '3000') ||
                       (window.location.hostname === 'localhost' && window.location.port !== '3000');

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

  // Load from Cloud Firestore or static products.json if server didn't provide
  if (products.length === 0 && total === 0) {
    try {
      let all = [];
      // 1. Try fetching from Cloud Firestore
      if (typeof firebase !== 'undefined' && firebase.firestore) {
        try {
          const db = firebase.firestore();
          const snap = await db.collection('products').get();
          if (!snap.empty) {
            snap.forEach(doc => {
              const d = doc.data();
              all.push({ ...d, id: d.id || doc.id });
            });
          }
        } catch (fsErr) {
          console.warn('Firestore storefront fetch notice:', fsErr);
        }
      }

      // 2. Fallback to static products.json if Firestore returned no products
      if (all.length === 0) {
        const fbRes = await fetch('/data/products.json');
        const staticData = await fbRes.json();
        all = staticData.products || [];
      }

      // 3. Merge any offline cached custom products from localStorage
      try {
        const customLocal = JSON.parse(localStorage.getItem('rjfc_custom_products') || '[]');
        if (customLocal.length > 0) {
          customLocal.forEach(cp => {
            const idx = all.findIndex(p => String(p.id) === String(cp.id));
            if (idx >= 0) all[idx] = { ...all[idx], ...cp };
            else all.unshift(cp);
          });
        }
      } catch (_) {}

      // Keep only active products on the storefront
      all = all.filter(p => p.active !== false && p.active !== 0 && p.active !== '0');

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
      } else {
        // Default: Newest products first so newly added products are visible immediately at top of page 1!
        all.sort((a, b) => (Number(b.id) || 0) - (Number(a.id) || 0));
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
  window.catalogProducts = products;
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

function toggleMobileFilterDrawer(forceState) {
  const sidebar = document.getElementById('shop-filter-sidebar');
  const backdrop = document.getElementById('filter-drawer-backdrop');
  if (!sidebar) return;
  const shouldOpen = (typeof forceState === 'boolean') ? forceState : !sidebar.classList.contains('active');
  if (shouldOpen) {
    sidebar.classList.add('active');
    backdrop?.classList.add('active');
    document.body.style.overflow = 'hidden';
  } else {
    sidebar.classList.remove('active');
    backdrop?.classList.remove('active');
    document.body.style.overflow = '';
  }
}

function syncSortAndApply(sortVal) {
  currentFilters.sort = sortVal;
  currentFilters.page = 1;
  const desktopSort = document.getElementById('filter-sort');
  if (desktopSort && desktopSort.value !== sortVal) desktopSort.value = sortVal;
  const mobSort = document.getElementById('filter-sort-mob');
  if (mobSort && mobSort.value !== sortVal) mobSort.value = sortVal;
  loadProducts();
}

function syncFilterInputs() {
  const sortSelect = document.getElementById('filter-sort');
  if (sortSelect) sortSelect.value = currentFilters.sort;

  const mobSort = document.getElementById('filter-sort-mob');
  if (mobSort) mobSort.value = currentFilters.sort;

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

  document.querySelectorAll('.dept-filter-chip').forEach(chip => {
    const chipDept = chip.getAttribute('data-department') || '';
    if (chipDept === (currentFilters.department || '')) {
      chip.classList.add('active');
    } else {
      chip.classList.remove('active');
    }
  });

  // Calculate active filters count for mobile badge
  let activeCount = 0;
  if (currentFilters.department) activeCount++;
  if (currentFilters.category) activeCount++;
  if (currentFilters.minPrice || currentFilters.maxPrice) activeCount++;
  if (currentFilters.rating) activeCount++;
  if (currentFilters.discount) activeCount++;
  if (currentFilters.inStock) activeCount++;

  const badge = document.getElementById('mobile-filter-badge');
  if (badge) {
    if (activeCount > 0) {
      badge.textContent = activeCount;
      badge.style.display = 'inline-flex';
    } else {
      badge.style.display = 'none';
    }
  }
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
  syncFilterInputs();
  loadProducts();
}

function setDiscountFilter(val) {
  currentFilters.discount = val;
  currentFilters.page = 1;
  syncFilterInputs();
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
  if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initShop);
} else {
  initShop();
}
} else {
  initShop();
}
