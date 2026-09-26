// RJ FASHION COLLECTION - GLOBAL APP LOGIC

const API_BASE = '/api';

// Currency Formatter
function formatPrice(amount) {
  return '₹' + Number(amount || 0).toLocaleString('en-IN');
}

// Toast Notification
function showToast(message, type = 'info') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<span>${message}</span>`;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// Global Auth State
let currentUser = null;

async function checkAuth() {
  try {
    const res = await fetch(`${API_BASE}/me`);
    const data = await res.json();
    if (data.success && data.user) {
      currentUser = data.user;
      renderAuthNav(data.user);
    } else {
      currentUser = null;
      renderAuthNav(null);
    }
  } catch (err) {
    console.error('Auth check failed:', err);
    renderAuthNav(null);
  }
}

function renderAuthNav(user) {
  const accountNavContainers = document.querySelectorAll('.auth-nav-slot');
  accountNavContainers.forEach(container => {
    if (user) {
      container.innerHTML = `
        <div class="user-dropdown-wrap" style="position: relative; display: inline-block;">
          <a href="/account.html" class="action-btn" title="My Account">
            <span>👤 ${user.name.split(' ')[0]}</span>
          </a>
        </div>
      `;
    } else {
      container.innerHTML = `
        <a href="/login.html" class="action-btn">
          <span>👤 Login / Account</span>
        </a>
      `;
    }
  });

  const mobileAccountLink = document.getElementById('mobile-account-link');
  if (mobileAccountLink) {
    mobileAccountLink.href = user ? '/account.html' : '/login.html';
  }
}

// Update Badges
async function updateCartCount() {
  let count = 0;
  try {
    const res = await fetch(`${API_BASE}/cart`);
    if (res.ok) {
      const data = await res.json();
      if (data.success) {
        count = data.itemCount || 0;
      }
    } else {
      throw new Error();
    }
  } catch (err) {
    try {
      const local = JSON.parse(localStorage.getItem('rjfc_local_cart') || '[]');
      count = local.reduce((s, i) => s + (i.quantity || 1), 0);
    } catch(e) {}
  }
  document.querySelectorAll('.cart-count-badge').forEach(badge => {
    badge.textContent = count;
    badge.style.display = count > 0 ? 'inline-flex' : 'none';
  });
}

async function updateWishlistCount() {
  if (!currentUser) {
    document.querySelectorAll('.wishlist-count-badge').forEach(badge => badge.style.display = 'none');
    return;
  }
  try {
    const res = await fetch(`${API_BASE}/wishlist`);
    if (res.status === 401) return;
    const data = await res.json();
    if (data.success) {
      const count = data.count || 0;
      document.querySelectorAll('.wishlist-count-badge').forEach(badge => {
        badge.textContent = count;
        badge.style.display = count > 0 ? 'inline-flex' : 'none';
      });
    }
  } catch (err) {
    console.error('Failed to update wishlist count:', err);
  }
}

// Global Add to Cart
async function addToCart(productId, quantity = 1, size = 'Free Size') {
  try {
    const res = await fetch(`${API_BASE}/cart`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId, quantity, size })
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success) {
        showToast(data.message || 'Added to cart!', 'success');
        updateCartCount();
        return true;
      }
    }
    throw new Error('API cart failed');
  } catch (err) {
    // Netlify static fallback using localStorage
    try {
      const fbRes = await fetch('/data/products.json');
      const fbData = await fbRes.json();
      const product = (fbData.products || []).find(p => String(p.id) === String(productId));
      if (product) {
        const local = JSON.parse(localStorage.getItem('rjfc_local_cart') || '[]');
        const existing = local.find(i => String(i.product_id) === String(productId) && i.size === size);
        if (existing) {
          existing.quantity = (existing.quantity || 1) + quantity;
        } else {
          local.push({
            id: Date.now(),
            product_id: product.id,
            name: product.name,
            price: product.price,
            original_price: product.original_price,
            discount: product.discount,
            image: product.image,
            brand: product.brand,
            size: size,
            quantity: quantity,
            stock: product.stock
          });
        }
        localStorage.setItem('rjfc_local_cart', JSON.stringify(local));
        showToast('Added to cart!', 'success');
        updateCartCount();
        return true;
      }
    } catch(e2) {}
    showToast('Failed to add item to cart', 'error');
    return false;
  }
}

// Global Toggle Wishlist
async function toggleWishlist(productId, btnElement) {
  if (!currentUser) {
    showToast('Please login to use your wishlist', 'info');
    setTimeout(() => {
      window.location.href = `/login.html?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`;
    }, 1200);
    return;
  }

  try {
    const isSaved = btnElement && btnElement.classList.contains('active');
    if (isSaved) {
      const res = await fetch(`${API_BASE}/wishlist/${productId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        if (btnElement) {
          btnElement.classList.remove('active');
          btnElement.innerHTML = '♡';
        }
        showToast('Removed from wishlist', 'info');
        updateWishlistCount();
      }
    } else {
      const res = await fetch(`${API_BASE}/wishlist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId })
      });
      const data = await res.json();
      if (data.success) {
        if (btnElement) {
          btnElement.classList.add('active');
          btnElement.innerHTML = '♥';
        }
        showToast('Added to wishlist!', 'success');
        updateWishlistCount();
      } else {
        showToast(data.message || 'Could not update wishlist', 'error');
      }
    }
  } catch (err) {
    showToast('Error updating wishlist', 'error');
  }
}

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
  checkAuth().then(() => {
    updateCartCount();
    updateWishlistCount();
  });

  // Global search form listener
  const searchForms = document.querySelectorAll('.header-search-form');
  searchForms.forEach(form => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = form.querySelector('input[name="search"]');
      const val = input ? input.value.trim() : '';
      if (val) {
        window.location.href = `/shop.html?search=${encodeURIComponent(val)}`;
      } else {
        window.location.href = '/shop.html';
      }
    });
  });
});
