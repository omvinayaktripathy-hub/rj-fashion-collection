// RJ FASHION COLLECTION - WISHLIST CONTROLLER
// Supports Firebase Hosting static mode & local storage sync

async function loadWishlist() {
  const container = document.getElementById('wishlist-grid');
  const countDisplay = document.getElementById('wishlist-count-display');
  const emptyState = document.getElementById('wishlist-empty-state');

  if (!container) return;

  container.innerHTML = `
    <div style="grid-column: 1 / -1; text-align: center; padding: 40px 0; color: var(--muted);">
      Loading your saved favorites...
    </div>
  `;

  let items = null;

  // 1. Try server API first
  try {
    const res = await fetch(`${API_BASE}/wishlist`);
    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.items)) {
        items = data.items;
      }
    }
  } catch (_) {}

  // 2. Fallback to localStorage for Firebase Hosting static mode
  if (items === null) {
    try {
      const savedIds = JSON.parse(localStorage.getItem('rjfc_wishlist') || '[]');
      if (savedIds.length === 0) {
        items = [];
      } else {
        const pRes = await fetch('/data/products.json');
        const pData = await pRes.json();
        const allProducts = pData.products || [];
        items = allProducts.filter(p => savedIds.some(id => String(id) === String(p.id)));
      }
    } catch (e) {
      items = [];
    }
  }

  // Handle Empty State
  if (!items || items.length === 0) {
    if (emptyState) emptyState.style.display = 'block';
    container.innerHTML = '';
    if (countDisplay) countDisplay.textContent = '0 items';
    updateWishlistCount();
    return;
  }

  // Render Wishlist Items
  if (emptyState) emptyState.style.display = 'none';
  if (countDisplay) countDisplay.textContent = `${items.length} item${items.length > 1 ? 's' : ''}`;

  container.innerHTML = items.map(p => {
    const isOutOfStock = p.stock <= 0;
    return `
      <div class="product-card" id="wishlist-item-${p.id}">
        <div class="product-image-wrap">
          <a href="/product.html?id=${p.id}">
            <img src="${p.image}" alt="${p.name}" onerror="this.src='https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=600&q=80'">
          </a>
          ${p.discount > 0 ? `<span class="badge-discount">${p.discount}% OFF</span>` : ''}
          <button class="wishlist-toggle-btn active" onclick="removeFromWishlist(${p.id})" title="Remove from Wishlist" style="color: var(--primary); background: rgba(255,255,255,0.9);">✕</button>
        </div>

        <div class="product-details">
          <span class="product-brand">${p.brand || 'RJ Collection'}</span>
          <h3 class="product-title"><a href="/product.html?id=${p.id}">${p.name}</a></h3>

          <div class="product-price-row">
            <span class="price-current">${formatPrice(p.price)}</span>
            ${p.original_price > p.price ? `<span class="price-original">${formatPrice(p.original_price)}</span>` : ''}
            ${p.discount > 0 ? `<span class="price-discount">${p.discount}% off</span>` : ''}
          </div>

          <div class="product-actions" style="grid-template-columns: 1fr;">
            <button class="btn btn-card btn-primary"
              onclick="moveToCartFromWishlist(${p.id})"
              ${isOutOfStock ? 'disabled style="opacity:0.5; cursor:not-allowed;"' : ''}>
              ${isOutOfStock ? 'Out of Stock' : '🛒 Move to Cart'}
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');

  updateWishlistCount();
}

async function removeFromWishlist(productId) {
  // Try server first
  try {
    await fetch(`${API_BASE}/wishlist/${productId}`, { method: 'DELETE' });
  } catch (_) {}

  // Update local storage
  try {
    let savedIds = JSON.parse(localStorage.getItem('rjfc_wishlist') || '[]');
    savedIds = savedIds.filter(id => String(id) !== String(productId));
    localStorage.setItem('rjfc_wishlist', JSON.stringify(savedIds));
  } catch (_) {}

  showToast('Item removed from wishlist', 'info');
  loadWishlist();
  updateWishlistCount();
}

async function moveToCartFromWishlist(productId) {
  const added = await addToCart(productId);
  if (added) {
    showToast('Product moved to your cart!', 'success');
    removeFromWishlist(productId);
    updateCartCount();
  }
}

document.addEventListener('DOMContentLoaded', loadWishlist);
