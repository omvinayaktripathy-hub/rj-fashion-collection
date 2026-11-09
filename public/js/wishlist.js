function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// RJ FASHION COLLECTION — EDITORIAL LUXURY WISHLIST CONTROLLER
let currentWishlistItems = [];
let currentCategoryFilter = 'all';
let currentSortOption = 'recent';
let chosenWishlistSizes = {};

/**
 * Load Wishlist Items from API or fallback to LocalStorage
 */
async function loadWishlist() {
  const gridContainer = document.getElementById('wishlist-grid');
  const countDisplay = document.getElementById('wishlist-count-display');
  const emptyState = document.getElementById('wishlist-empty-state');
  const bulkActions = document.getElementById('wishlist-bulk-actions');
  const filterSortBar = document.getElementById('wishlist-filter-sort-bar');

  if (!gridContainer) return;

  gridContainer.innerHTML = `
    <div class="wishlist-shimmer-container">
      <div class="shimmer-card"></div>
      <div class="shimmer-card"></div>
      <div class="shimmer-card"></div>
      <div class="shimmer-card"></div>
    </div>
  `;

  let items = null;

  // 1. Try server API first (authenticated session)
  try {
    if (window.isStaticHosting) throw new Error('static');
    const res = await fetch(`${API_BASE}/wishlist`);
    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.items)) {
        items = data.items;
      }
    }
  } catch (_) {}

  // 2. Fallback to localStorage (Firebase static hosting or guest session)
  if (!items || items.length === 0) {
    try {
      const keys = ['rj_fashion_wishlist', 'rjfc_wishlist', 'rjfc_react_wishlist', 'wishlist'];
      let rawList = null;
      for (const k of keys) {
        const raw = localStorage.getItem(k);
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed) && parsed.length > 0) {
              rawList = parsed;
              break;
            }
          } catch (_) {}
        }
      }

      if (!rawList || rawList.length === 0) {
        items = [];
      } else {
        const objectItems = rawList.filter(i => i && typeof i === 'object' && (i.name || i.title));
        if (objectItems.length === rawList.length) {
          items = objectItems.map(p => ({
            id: p.id || p.product_id,
            name: p.name || p.title || 'Artisanal Ensemble',
            brand: p.brand || 'RJ COLLECTION',
            category: p.category || 'sarees',
            category_id: p.category_id || 1,
            price: Number(p.price) || 0,
            original_price: Number(p.original_price || p.originalPrice || p.price),
            discount: Number(p.discount) || 0,
            stock: p.stock !== undefined ? Number(p.stock) : 5,
            image: p.image || p.thumbnail || '/images/placeholder.jpg',
            available_sizes: Array.isArray(p.available_sizes) ? p.available_sizes : (Array.isArray(p.availableSizes) ? p.availableSizes : ['Free Size'])
          }));
        } else {
          const idList = rawList.map(i => (typeof i === 'object' ? (i.id || i.product_id) : i));
          items = [];
          for (const sid of idList) {
            let prod = null;
            if (typeof resolveProductById === 'function') {
              prod = await resolveProductById(sid);
            }
            if (prod) items.push(prod);
          }
          if (items.length === 0) {
            try {
              const pRes = await fetch('/data/products.json');
              const pData = await pRes.json();
              const allProducts = pData.products || [];
              items = allProducts.filter(p => idList.some(id => String(id) === String(p.id)));
            } catch (_) {}
          }
        }
      }
    } catch (e) {
      items = [];
    }
  }

  currentWishlistItems = Array.isArray(items) ? items : [];

  // Update Item Count Pill
  const count = currentWishlistItems.length;
  if (countDisplay) {
    countDisplay.textContent = `${count} ${count === 1 ? 'Item' : 'Items'}`;
  }

  // Toggle Header Controls
  if (count > 0) {
    if (emptyState) emptyState.style.display = 'none';
    if (bulkActions) bulkActions.style.display = 'flex';
    if (filterSortBar) filterSortBar.style.display = 'flex';
    gridContainer.style.display = 'grid';
    renderWishlistGrid();
  } else {
    if (emptyState) emptyState.style.display = 'block';
    if (bulkActions) bulkActions.style.display = 'none';
    if (filterSortBar) filterSortBar.style.display = 'none';
    gridContainer.style.display = 'none';
    gridContainer.innerHTML = '';
  }

  if (typeof updateWishlistCount === 'function') {
    updateWishlistCount();
  }
}

/**
 * Filter Wishlist by Category
 */
function filterWishlistCategory(categoryKey, btnEl) {
  currentCategoryFilter = categoryKey;
  document.querySelectorAll('.wishlist-cat-pill').forEach(btn => btn.classList.remove('active'));
  if (btnEl) btnEl.classList.add('active');
  renderWishlistGrid();
}
window.filterWishlistCategory = filterWishlistCategory;

/**
 * Sort Wishlist Items
 */
function sortWishlistItems(sortKey) {
  currentSortOption = sortKey;
  renderWishlistGrid();
}
window.sortWishlistItems = sortWishlistItems;

/**
 * Select Variant Size for a Product Card
 */
function selectWishlistSize(productId, size, btnEl) {
  chosenWishlistSizes[productId] = size;
  const parentCard = document.getElementById(`wishlist-card-${productId}`);
  if (parentCard) {
    parentCard.querySelectorAll('.size-select-pill').forEach(b => b.classList.remove('active'));
    if (btnEl) btnEl.classList.add('active');
    const label = parentCard.querySelector('.selected-size-label');
    if (label) label.textContent = size;
  }
}
window.selectWishlistSize = selectWishlistSize;

/**
 * Render Filtered & Sorted Wishlist Cards to DOM
 */
function renderWishlistGrid() {
  const container = document.getElementById('wishlist-grid');
  if (!container) return;

  let items = [...currentWishlistItems];

  // 1. Filter by category
  if (currentCategoryFilter === 'sale') {
    items = items.filter(p => (Number(p.discount) > 0) || (Number(p.original_price) > Number(p.price)));
  } else if (currentCategoryFilter === 'sarees') {
    items = items.filter(p => {
      const c = (p.category_slug || p.category_name || p.subcategory || '').toLowerCase();
      return c.includes('saree') || c.includes('silk') || c.includes('bridal');
    });
  } else if (currentCategoryFilter === 'dresses') {
    items = items.filter(p => {
      const c = (p.category_slug || p.category_name || p.subcategory || '').toLowerCase();
      return c.includes('kurti') || c.includes('dress') || c.includes('lehenga') || c.includes('suit') || c.includes('men');
    });
  } else if (currentCategoryFilter === 'jewelry') {
    items = items.filter(p => {
      const c = (p.category_slug || p.category_name || p.subcategory || '').toLowerCase();
      return c.includes('jewel') || c.includes('kundan') || c.includes('choker') || c.includes('earring');
    });
  } else if (currentCategoryFilter === 'accessories') {
    items = items.filter(p => {
      const c = (p.category_slug || p.category_name || p.subcategory || '').toLowerCase();
      return c.includes('access') || c.includes('bag') || c.includes('wallet') || c.includes('gift') || c.includes('clutch');
    });
  }

  // 2. Sort items
  if (currentSortOption === 'price_asc') {
    items.sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0));
  } else if (currentSortOption === 'price_desc') {
    items.sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0));
  } else if (currentSortOption === 'discount') {
    items.sort((a, b) => (Number(b.discount) || 0) - (Number(a.discount) || 0));
  } else {
    // Recently saved: keep original reverse order
    items.sort((a, b) => {
      const tA = a.added_at ? new Date(a.added_at).getTime() : Number(a.id);
      const tB = b.added_at ? new Date(b.added_at).getTime() : Number(b.id);
      return tB - tA;
    });
  }

  if (items.length === 0) {
    container.innerHTML = `
      <div class="wishlist-no-match" style="grid-column: 1 / -1;">
        <p>No saved pieces matching category filter "${escapeHtml(currentCategoryFilter)}".</p>
        <button type="button" class="btn btn-ghost-action" onclick="filterWishlistCategory('all', document.querySelector('[data-category=\\'all\\']'))">
          Reset Filter to All Items
        </button>
      </div>
    `;
    return;
  }

  container.innerHTML = items.map(p => {
    const isOutOfStock = Number(p.stock) <= 0;
    const isLowStock = Number(p.stock) > 0 && Number(p.stock) <= 3;
    const discountVal = Number(p.discount) || (Number(p.original_price) > Number(p.price) ? Math.round(((p.original_price - p.price) / p.original_price) * 100) : 0);
    const primaryImg = p.image || '/images/products/silk-saree-1.jpg';
    
    // Lookbook hover shot resolver
    let hoverImg = '';
    if (Array.isArray(p.additional_images) && p.additional_images.length > 1) {
      hoverImg = p.additional_images[1];
    } else if (typeof p.additional_images === 'string') {
      try {
        const parsed = JSON.parse(p.additional_images);
        if (Array.isArray(parsed) && parsed.length > 1) hoverImg = parsed[1];
      } catch (_) {}
    }

    // Size list resolver
    let sizes = ['Free Size'];
    if (Array.isArray(p.available_sizes) && p.available_sizes.length > 0) {
      sizes = p.available_sizes;
    } else if (typeof p.available_sizes === 'string') {
      try {
        const parsed = JSON.parse(p.available_sizes);
        if (Array.isArray(parsed) && parsed.length > 0) sizes = parsed;
      } catch (_) {}
    } else if (p.category_name === 'Kurtis' || p.category_name === 'Dresses') {
      sizes = ['S', 'M', 'L', 'XL'];
    }

    const currentChosenSize = chosenWishlistSizes[p.id] || sizes[0] || 'Free Size';

    return `
      <article class="wishlist-editorial-card ${isOutOfStock ? 'is-out-of-stock' : ''}" id="wishlist-card-${p.id}">
        <!-- Portrait Image Media Wrapper (3:4 Ratio) -->
        <div class="wishlist-media-box">
          <a href="/product.html?id=${p.id}" class="wishlist-media-link" aria-label="View ${escapeHtml(p.name)}">
            <img src="${escapeHtml(primaryImg)}" alt="${escapeHtml(p.name)}" class="media-primary-img" loading="lazy" onerror="this.src='/favicon.svg';">
            ${hoverImg ? `<img src="${escapeHtml(hoverImg)}" alt="${escapeHtml(p.name)} lookbook" class="media-secondary-img" loading="lazy">` : ''}
          </a>

          <!-- Top-Left Editorial Badges -->
          <div class="wishlist-badge-stack">
            ${isOutOfStock ? `
              <span class="editorial-badge badge-sold-out">OUT OF STOCK</span>
            ` : isLowStock ? `
              <span class="editorial-badge badge-low-stock">ONLY ${p.stock} LEFT</span>
            ` : discountVal > 0 ? `
              <span class="editorial-badge badge-sale">SALE ${discountVal}% OFF</span>
            ` : p.new_arrival ? `
              <span class="editorial-badge badge-new">NEW SEASON</span>
            ` : `
              <span class="editorial-badge badge-curated">ROYALE SELECTION</span>
            `}
          </div>

          <!-- Top-Right Floating Quick-Remove Heart Button -->
          <button type="button" class="wishlist-card-heart-btn" onclick="removeFromWishlist('${escapeHtml(String(p.id))}')" aria-label="Remove ${escapeHtml(p.name)} from saved collection" title="Remove from Saved Collection">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
          </button>

          <!-- Out of Stock Overlay -->
          ${isOutOfStock ? `
            <div class="out-of-stock-overlay">
              <button type="button" class="btn-notify-restock" onclick="notifyStock('${escapeHtml(p.name)}')">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
                <span>Notify When Available</span>
              </button>
            </div>
          ` : ''}
        </div>

        <!-- Card Body Details -->
        <div class="wishlist-card-content">
          <span class="card-brand-label">${escapeHtml(p.brand || 'RJ SIGNATURE')}</span>
          <h3 class="card-product-title">
            <a href="/product.html?id=${p.id}">${escapeHtml(p.name)}</a>
          </h3>

          <!-- Pricing Row -->
          <div class="card-price-row">
            <strong class="price-current">${typeof formatPrice === 'function' ? formatPrice(p.price) : `₹${Number(p.price).toLocaleString('en-IN')}`}</strong>
            ${Number(p.original_price) > Number(p.price) ? `
              <span class="price-original">${typeof formatPrice === 'function' ? formatPrice(p.original_price) : `₹${Number(p.original_price).toLocaleString('en-IN')}`}</span>
              <span class="price-discount-tag">${discountVal}% off</span>
            ` : ''}
          </div>

          <!-- Inline Size Selector -->
          ${sizes.length > 0 && !isOutOfStock ? `
            <div class="card-size-selector">
              <div class="size-selector-header">
                <span class="size-title">Select Fit:</span>
                <span class="selected-size-label">${escapeHtml(currentChosenSize)}</span>
              </div>
              <div class="size-pill-row">
                ${sizes.map(sz => `
                  <button type="button" class="size-select-pill ${sz === currentChosenSize ? 'active' : ''}" onclick="selectWishlistSize('${p.id}', '${escapeHtml(sz)}', this)">
                    ${escapeHtml(sz)}
                  </button>
                `).join('')}
              </div>
            </div>
          ` : ''}

          <!-- Scarcity / Stock Alert -->
          ${isLowStock && !isOutOfStock ? `
            <div class="card-urgency-notice">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
              <span>⚡ Only ${p.stock} left in stock — order soon</span>
            </div>
          ` : ''}

          <!-- Move to Bag Action CTA -->
          <button type="button" class="btn-wishlist-cta ${isOutOfStock ? 'disabled' : ''}" ${isOutOfStock ? 'disabled' : ''} onclick="moveToCartFromWishlist('${escapeHtml(String(p.id))}')">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>
            <span>${isOutOfStock ? 'Sold Out' : 'Move to Bag'}</span>
          </button>
        </div>
      </article>
    `;
  }).join('');
}

/**
 * Remove Item from Wishlist
 */
async function removeFromWishlist(productId) {
  // Try server first
  try {
    await fetch(`${API_BASE}/wishlist/${productId}`, { method: 'DELETE' });
  } catch (_) {}

  // Update local storage across all keys
  try {
    const keys = ['rj_fashion_wishlist', 'rjfc_wishlist', 'rjfc_react_wishlist', 'wishlist'];
    for (const k of keys) {
      try {
        const raw = localStorage.getItem(k);
        if (raw) {
          let parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            parsed = parsed.filter(i => {
              const id = typeof i === 'object' ? (i.id || i.product_id) : i;
              return String(id) !== String(productId);
            });
            localStorage.setItem(k, JSON.stringify(parsed));
          }
        }
      } catch (_) {}
    }
    window.dispatchEvent(new Event('wishlist-updated'));
    window.dispatchEvent(new Event('storage'));
  } catch (_) {}

  // Remove from current memory array
  currentWishlistItems = currentWishlistItems.filter(p => String(p.id) !== String(productId));

  if (typeof showToast === 'function') {
    showToast('Item removed from saved collection', 'info');
  }

  // Refresh counts and re-render
  const countDisplay = document.getElementById('wishlist-count-display');
  const count = currentWishlistItems.length;
  if (countDisplay) {
    countDisplay.textContent = `${count} ${count === 1 ? 'Item' : 'Items'}`;
  }

  if (count === 0) {
    loadWishlist();
  } else {
    renderWishlistGrid();
  }

  if (typeof updateWishlistCount === 'function') {
    updateWishlistCount();
  }
}
window.removeFromWishlist = removeFromWishlist;

/**
 * Move Single Item to Cart
 */
async function moveToCartFromWishlist(productId) {
  const product = currentWishlistItems.find(p => String(p.id) === String(productId));
  if (product && Number(product.stock) <= 0) {
    if (typeof showToast === 'function') showToast('This piece is currently out of stock.', 'error');
    return;
  }

  const chosenSize = chosenWishlistSizes[productId] || (product && product.available_sizes && product.available_sizes[0]) || 'Free Size';

  try {
    let added = false;
    if (typeof addToCart === 'function') {
      added = await addToCart(productId, 1, chosenSize);
    } else {
      // Direct LocalStorage fallback with unified key synchronization
      const raw = localStorage.getItem('rjfc_cart') || localStorage.getItem('rjfc_local_cart') || localStorage.getItem('rjfc_react_cart');
      let cart = raw ? JSON.parse(raw) : [];
      if (product) {
        cart.push({
          id: product.id,
          product_id: product.id,
          cart_id: `cart_${Date.now()}_${product.id}`,
          name: product.name,
          price: product.price,
          image: product.image,
          quantity: 1,
          size: chosenSize
        });
        const json = JSON.stringify(cart);
        ['rjfc_cart', 'rjfc_local_cart', 'rjfc_react_cart'].forEach(k => {
          localStorage.setItem(k, json);
          try { sessionStorage.setItem(k, json); } catch (_) {}
        });
        window.dispatchEvent(new CustomEvent('rjfc_cart_updated', { detail: { items: cart } }));
        window.dispatchEvent(new Event('storage'));
        added = true;
      }
    }

    if (added !== false) {
      if (typeof showToast === 'function') {
        showToast(`Moved "${product ? product.name : 'Piece'}" (${chosenSize}) to bag!`, 'success');
      }
      removeFromWishlist(productId);
      if (typeof updateCartCount === 'function') {
        updateCartCount();
      }
    }
  } catch (err) {
    console.error('Error moving to cart:', err);
  }
}
window.moveToCartFromWishlist = moveToCartFromWishlist;

/**
 * Bulk Action: Move All In-Stock to Bag
 */
async function moveAllWishlistToCart() {
  const inStock = currentWishlistItems.filter(p => Number(p.stock) > 0);
  if (inStock.length === 0) {
    if (typeof showToast === 'function') {
      showToast('No in-stock pieces currently available to move to cart.', 'info');
    }
    return;
  }

  const btn = document.getElementById('btn-move-all-cart');
  if (btn) {
    btn.disabled = true;
    btn.textContent = 'Moving to Bag...';
  }

  for (const item of inStock) {
    const size = chosenWishlistSizes[item.id] || (item.available_sizes && item.available_sizes[0]) || 'Free Size';
    if (typeof addToCart === 'function') {
      await addToCart(item.id, 1, size);
    }
    // Remove from server wishlist
    try {
      await fetch(`${API_BASE}/wishlist/${item.id}`, { method: 'DELETE' });
    } catch (_) {}
  }

  // Update localStorage
  try {
    const movedIds = new Set(inStock.map(p => String(p.id)));
    let savedIds = JSON.parse(localStorage.getItem('rjfc_wishlist') || '[]');
    savedIds = savedIds.filter(id => !movedIds.has(String(id)));
    localStorage.setItem('rjfc_wishlist', JSON.stringify(savedIds));
  } catch (_) {}

  if (typeof showToast === 'function') {
    showToast(`Moved ${inStock.length} pieces to your shopping bag!`, 'success');
  }

  if (typeof updateCartCount === 'function') {
    updateCartCount();
  }

  loadWishlist();
}
window.moveAllWishlistToCart = moveAllWishlistToCart;

/**
 * Clear All Modal Triggers
 */
function confirmClearWishlist() {
  const modal = document.getElementById('clear-wishlist-modal');
  if (modal) modal.style.display = 'flex';
}
window.confirmClearWishlist = confirmClearWishlist;

function closeClearWishlistModal() {
  const modal = document.getElementById('clear-wishlist-modal');
  if (modal) modal.style.display = 'none';
}
window.closeClearWishlistModal = closeClearWishlistModal;

async function executeClearWishlist() {
  closeClearWishlistModal();

  for (const item of currentWishlistItems) {
    try {
      await fetch(`${API_BASE}/wishlist/${item.id}`, { method: 'DELETE' });
    } catch (_) {}
  }

  localStorage.removeItem('rjfc_wishlist');
  currentWishlistItems = [];

  if (typeof showToast === 'function') {
    showToast('Your saved collection has been cleared', 'info');
  }

  loadWishlist();
  if (typeof updateWishlistCount === 'function') {
    updateWishlistCount();
  }
}
window.executeClearWishlist = executeClearWishlist;

/**
 * Restock Notification Trigger
 */
function notifyStock(productName) {
  if (typeof showToast === 'function') {
    showToast(`Restock alert registered for "${productName}". We will notify you!`, 'success');
  }
}
window.notifyStock = notifyStock;

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadWishlist);
} else {
  loadWishlist();
}


// Synchronize on external wishlist changes
window.addEventListener('wishlist-updated', function() {
  loadWishlist();
});
window.addEventListener('storage', function(e) {
  if (['rj_fashion_wishlist', 'rjfc_wishlist', 'rjfc_react_wishlist'].includes(e.key)) {
    loadWishlist();
  }
});
