// RJ FASHION COLLECTION - WISHLIST CONTROLLER

async function loadWishlist() {
  const container = document.getElementById('wishlist-grid');
  const countDisplay = document.getElementById('wishlist-count-display');
  const emptyState = document.getElementById('wishlist-empty-state');

  if (!container) return;

  try {
    const res = await fetch(`${API_BASE}/wishlist`);

    if (res.status === 401) {
      container.innerHTML = `
        <div style="grid-column: 1 / -1;" class="empty-state">
          <div class="empty-state-icon">🔒</div>
          <h3>Login Required</h3>
          <p>Please log in to your RJ Fashion Collection account to view and save items in your wishlist.</p>
          <a href="/login.html?redirect=/wishlist.html" class="btn btn-primary">Login Now</a>
        </div>
      `;
      return;
    }

    const data = await res.json();
    if (!data.success || !data.items || data.items.length === 0) {
      if (emptyState) emptyState.style.display = 'block';
      container.innerHTML = '';
      if (countDisplay) countDisplay.textContent = '0 items';
      updateWishlistCount();
      return;
    }

    if (emptyState) emptyState.style.display = 'none';
    if (countDisplay) countDisplay.textContent = `${data.items.length} items`;

    container.innerHTML = data.items.map(p => {
      const isOutOfStock = p.stock <= 0;
      return `
        <div class="product-card" id="wishlist-item-${p.id}">
          <div class="product-image-wrap">
            <a href="/product.html?id=${p.id}">
              <img src="${p.image}" alt="${p.name}">
            </a>
            ${p.discount > 0 ? `<span class="badge-discount">${p.discount}% OFF</span>` : ''}
            <button class="wishlist-toggle-btn active" onclick="removeFromWishlist(${p.id})" title="Remove from Wishlist">✕</button>
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
  } catch (err) {
    console.error('Error loading wishlist:', err);
    container.innerHTML = `<p>Failed to load wishlist.</p>`;
  }
}

async function removeFromWishlist(productId) {
  try {
    const res = await fetch(`${API_BASE}/wishlist/${productId}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
      showToast('Item removed from wishlist', 'info');
      loadWishlist();
    } else {
      showToast(data.message || 'Could not remove item', 'error');
    }
  } catch (err) {
    showToast('Failed to remove item', 'error');
  }
}

async function moveToCartFromWishlist(productId) {
  try {
    const res = await fetch(`${API_BASE}/wishlist/${productId}/move-to-cart`, { method: 'POST' });
    const data = await res.json();
    if (data.success) {
      showToast('Product moved to your cart!', 'success');
      loadWishlist();
      updateCartCount();
    } else {
      showToast(data.message || 'Could not move product', 'error');
    }
  } catch (err) {
    showToast('Failed to move item to cart', 'error');
  }
}

document.addEventListener('DOMContentLoaded', loadWishlist);
