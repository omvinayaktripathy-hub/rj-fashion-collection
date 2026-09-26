// RJ FASHION COLLECTION - PRODUCT DETAIL PAGE

let currentProduct = null;
let selectedSize = 'Free Size';
let selectedColor = '';
let currentQty = 1;

function getProductId() {
  const params = new URLSearchParams(window.location.search);
  return params.get('id');
}

async function loadProductDetails() {
  const id = getProductId();
  if (!id) {
    window.location.href = '/shop.html';
    return;
  }

  const container = document.getElementById('product-detail-container');
  if (!container) return;

  try {
    const res = await fetch(`${API_BASE}/products/${id}`);
    const data = await res.json();

    if (!data.success || !data.product) {
      container.innerHTML = `
        <div class="empty-state" style="margin: 40px auto; max-width: 600px;">
          <h3>Product Not Found</h3>
          <p>The product you are looking for is currently unavailable or may have been removed.</p>
          <a href="/shop.html" class="btn btn-primary">Return to Shop</a>
        </div>
      `;
      return;
    }

    currentProduct = data.product;
    renderProduct(data.product);
    loadRelatedProducts(data.product.id);
  } catch (err) {
    console.error('Error fetching product details:', err);
    container.innerHTML = `<div class="empty-state"><p>Failed to load product details.</p></div>`;
  }
}

function renderProduct(p) {
  document.title = `${p.name} - RJ Fashion Collection`;

  const isOutOfStock = p.stock <= 0;
  selectedSize = p.available_sizes?.[0] || 'Free Size';
  selectedColor = p.available_colors?.[0] || '';

  const images = [p.image, ...(p.additional_images || [])];

  const html = `
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 40px; margin-top: 24px;">
      <!-- Product Images Gallery -->
      <div>
        <div style="background: #fff; border-radius: var(--radius-md); border: 1px solid var(--border); overflow: hidden; padding: 12px; position: relative;">
          <img id="main-product-image" src="${p.image}" alt="${p.name}" style="width: 100%; height: 480px; object-fit: cover; border-radius: 8px; ${isOutOfStock ? 'filter: grayscale(35%) contrast(0.92); opacity: 0.88;' : ''}">
          ${isOutOfStock ? `<span class="badge-out-of-stock" style="top:20px; left:20px; font-size: 0.8rem; padding: 6px 14px;">OUT OF STOCK</span>` : (p.discount > 0 ? `<span class="badge-discount" style="top:20px; left:20px;">${p.discount}% OFF</span>` : '')}
        </div>

        ${images.length > 1 ? `
          <div style="display: flex; gap: 10px; margin-top: 14px; overflow-x: auto;">
            ${images.map((img, i) => `
              <div onclick="switchMainImage('${img}')" style="width: 72px; height: 86px; border: 2px solid ${i === 0 ? 'var(--primary)' : 'var(--border)'}; border-radius: 6px; overflow: hidden; cursor: pointer; flex-shrink: 0;">
                <img src="${img}" style="width: 100%; height: 100%; object-fit: cover;">
              </div>
            `).join('')}
          </div>
        ` : ''}
      </div>

      <!-- Product Information & Order Box -->
      <div style="display: flex; flex-direction: column;">
        <span style="font-size: 0.82rem; font-weight: 700; color: var(--gold); text-transform: uppercase; letter-spacing: 1px;">${p.brand || 'RJ Collection'}</span>
        <h1 style="font-family: var(--font-serif); font-size: 1.85rem; font-weight: 700; margin: 6px 0 12px; line-height: 1.3;">${p.name}</h1>

        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px; flex-wrap: wrap;">
          <span class="rating-badge" style="font-size: 0.85rem; padding: 3px 8px;">★ ${Number(p.rating || 4.5).toFixed(1)}</span>
          <span style="color: var(--muted); font-size: 0.88rem;">${p.reviews_count || 12} Verified Ratings & Reviews</span>
          <span style="color: var(--border);">|</span>
          <span class="stock-status-pill ${isOutOfStock ? 'stock-pill-out' : (p.stock <= 4 ? 'stock-pill-low' : 'stock-pill-in')}" style="font-size: 0.82rem; padding: 3px 9px;">
            ${isOutOfStock ? '🔴 Out of Stock' : (p.stock <= 4 ? `⚡ Only ${p.stock} units left!` : `🟢 In Stock (${p.stock} units)`)}
          </span>
        </div>

        <div style="display: flex; align-items: baseline; gap: 14px; padding: 14px 0; border-top: 1px solid var(--border); border-bottom: 1px solid var(--border); margin-bottom: 20px;">
          <span style="font-size: 1.8rem; font-weight: 700; color: var(--primary);">${formatPrice(p.price)}</span>
          ${p.original_price > p.price ? `<span style="font-size: 1.1rem; color: var(--muted); text-decoration: line-through;">${formatPrice(p.original_price)}</span>` : ''}
          ${p.discount > 0 ? `<span style="font-size: 1rem; font-weight: 700; color: var(--success);">${p.discount}% OFF</span>` : ''}
          <span style="font-size: 0.78rem; color: var(--muted);">Inclusive of all taxes</span>
        </div>

        ${isOutOfStock ? `
          <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 14px; margin-bottom: 18px; display: flex; align-items: center; gap: 12px;">
            <span style="font-size: 1.5rem;">🚫</span>
            <div>
              <div style="font-weight: 700; color: #b91c1c; font-size: 0.95rem;">Currently Out of Stock</div>
              <div style="font-size: 0.82rem; color: #7f1d1d; margin-top: 2px;">This royal design is currently sold out. Save it to your Wishlist to be notified when back in stock.</div>
            </div>
          </div>
        ` : ''}

        <!-- Size Selection -->
        ${p.available_sizes && p.available_sizes.length > 0 ? `
          <div style="margin-bottom: 18px;">
            <label style="display: block; font-size: 0.85rem; font-weight: 700; margin-bottom: 8px; text-transform: uppercase;">Select Size:</label>
            <div style="display: flex; gap: 10px; flex-wrap: wrap;">
              ${p.available_sizes.map((size, index) => `
                <button class="size-btn ${index === 0 ? 'active' : ''}"
                  onclick="selectSize('${size}', this)"
                  style="padding: 8px 16px; border: 1px solid var(--border); border-radius: 6px; font-weight: 600; font-size: 0.85rem; background: #fff; cursor: pointer;">
                  ${size}
                </button>
              `).join('')}
            </div>
          </div>
        ` : ''}

        <!-- Color Selection -->
        ${p.available_colors && p.available_colors.length > 0 ? `
          <div style="margin-bottom: 18px;">
            <label style="display: block; font-size: 0.85rem; font-weight: 700; margin-bottom: 8px; text-transform: uppercase;">Available Colors:</label>
            <div style="display: flex; gap: 10px; flex-wrap: wrap;">
              ${p.available_colors.map((color, index) => `
                <button class="color-btn ${index === 0 ? 'active' : ''}"
                  onclick="selectColor('${color}', this)"
                  style="padding: 6px 14px; border: 1px solid var(--border); border-radius: 20px; font-size: 0.82rem; font-weight: 600; background: #fff; cursor: pointer;">
                  ${color}
                </button>
              `).join('')}
            </div>
          </div>
        ` : ''}

        <!-- Quantity Selector -->
        <div style="margin-bottom: 24px;">
          <label style="display: block; font-size: 0.85rem; font-weight: 700; margin-bottom: 8px; text-transform: uppercase;">Quantity:</label>
          <div class="qty-stepper">
            <button class="qty-btn" onclick="updateDetailQty(-1)" ${isOutOfStock ? 'disabled' : ''}>-</button>
            <input id="detail-qty-input" type="text" class="qty-input" value="1" readonly>
            <button class="qty-btn" onclick="updateDetailQty(1)" ${isOutOfStock ? 'disabled' : ''}>+</button>
          </div>
        </div>

        <!-- Action Buttons -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 14px;">
          <button class="btn btn-outline-primary"
            onclick="addCurrentProductToCart()"
            ${isOutOfStock ? 'disabled style="opacity:0.55; cursor:not-allowed; background:#f8fafc; color:#94a3b8; border-color:#cbd5e1;"' : ''}>
            ${isOutOfStock ? 'OUT OF STOCK' : '🛒 ADD TO CART'}
          </button>
          <button class="btn btn-primary"
            onclick="buyCurrentProductNow()"
            ${isOutOfStock ? 'disabled style="opacity:0.55; cursor:not-allowed; background:#cbd5e1; color:#64748b; border-color:#cbd5e1;"' : ''}>
            ${isOutOfStock ? 'SOLD OUT' : '⚡ BUY NOW'}
          </button>
        </div>

        <div>
          <button class="btn btn-block"
            onclick="toggleWishlist(${p.id}, this)"
            style="background: #fff; border: 1px solid var(--border); color: var(--dark); font-weight: 600;">
            ♡ ADD TO WISHLIST
          </button>
        </div>

        <!-- Delivery & Service Highlights -->
        <div style="margin-top: 24px; padding: 16px; background: #fff; border-radius: 8px; border: 1px solid var(--border); display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; text-align: center;">
          <div>
            <div style="font-size: 1.2rem;">🚚</div>
            <div style="font-size: 0.78rem; font-weight: 700; margin-top: 4px;">Free Shipping</div>
            <div style="font-size: 0.7rem; color: var(--muted);">On orders over ₹999</div>
          </div>
          <div>
            <div style="font-size: 1.2rem;">🛡️</div>
            <div style="font-size: 0.78rem; font-weight: 700; margin-top: 4px;">100% Authentic</div>
            <div style="font-size: 0.7rem; color: var(--muted);">Genuine Artisan Craft</div>
          </div>
          <div>
            <div style="font-size: 1.2rem;">💵</div>
            <div style="font-size: 0.78rem; font-weight: 700; margin-top: 4px;">Cash on Delivery</div>
            <div style="font-size: 0.7rem; color: var(--muted);">Pay when you receive</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Product Description & Specifications Tabs/Sections -->
    <div style="margin-top: 40px; background: #fff; border-radius: var(--radius-md); border: 1px solid var(--border); padding: 30px;">
      <h3 style="font-family: var(--font-serif); font-size: 1.35rem; margin-bottom: 14px;">Product Description & Story</h3>
      <p style="color: #4b5563; line-height: 1.7; margin-bottom: 24px;">${p.description || 'Designed with premium fabric and traditional craftsmanship for celebrations.'}</p>

      <h3 style="font-family: var(--font-serif); font-size: 1.35rem; margin-bottom: 14px;">Specifications</h3>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 16px;">
        <div style="background: var(--bg-light); padding: 12px 16px; border-radius: 6px;">
          <span style="font-size: 0.78rem; color: var(--muted); text-transform: uppercase;">Fabric & Material</span>
          <div style="font-weight: 600; font-size: 0.92rem; margin-top: 2px;">${p.material || 'Fine Silk Blend'}</div>
        </div>
        <div style="background: var(--bg-light); padding: 12px 16px; border-radius: 6px;">
          <span style="font-size: 0.78rem; color: var(--muted); text-transform: uppercase;">Pattern / Work</span>
          <div style="font-weight: 600; font-size: 0.92rem; margin-top: 2px;">${p.pattern || 'Zari Embellished'}</div>
        </div>
        <div style="background: var(--bg-light); padding: 12px 16px; border-radius: 6px;">
          <span style="font-size: 0.78rem; color: var(--muted); text-transform: uppercase;">Care Instructions</span>
          <div style="font-weight: 600; font-size: 0.92rem; margin-top: 2px;">${p.care_instructions || 'Dry clean recommended'}</div>
        </div>
        <div style="background: var(--bg-light); padding: 12px 16px; border-radius: 6px;">
          <span style="font-size: 0.78rem; color: var(--muted); text-transform: uppercase;">Brand</span>
          <div style="font-weight: 600; font-size: 0.92rem; margin-top: 2px;">${p.brand || 'RJ Fashion Collection'}</div>
        </div>
      </div>

      <!-- Customer Reviews -->
      <div style="margin-top: 36px; border-top: 1px solid var(--border); padding-top: 24px;">
        <h3 style="font-family: var(--font-serif); font-size: 1.35rem; margin-bottom: 16px;">Customer Reviews & Ratings</h3>
        ${p.reviews && p.reviews.length > 0 ? `
          <div style="display: flex; flex-direction: column; gap: 14px;">
            ${p.reviews.map(r => `
              <div style="background: #fafafa; border: 1px solid var(--border); border-radius: 8px; padding: 14px 18px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                  <span style="font-weight: 700; font-size: 0.92rem;">${r.user_name}</span>
                  <span class="rating-badge">★ ${r.rating}</span>
                </div>
                <p style="font-size: 0.88rem; color: #4b5563; margin: 0;">${r.comment}</p>
              </div>
            `).join('')}
          </div>
        ` : `
          <p style="color: var(--muted); font-size: 0.92rem;">Be the first to review this product!</p>
        `}
      </div>

      <!-- Write a Review Form (shown only for logged-in users) -->
      <div id="review-form-section" style="margin-top: 28px; padding-top: 24px; border-top: 1px solid var(--border);">
        <h3 style="font-family: var(--font-serif); font-size: 1.2rem; margin-bottom: 14px;">Write a Review</h3>
        <div id="review-form-wrapper">
          <!-- Will be populated by JS after auth check -->
        </div>
      </div>
    </div>
  `;

  container.innerHTML = html;

  // Now render review form based on auth state
  renderReviewForm(p.id);
}

function switchMainImage(url) {
  const main = document.getElementById('main-product-image');
  if (main) main.src = url;
}

function selectSize(size, btn) {
  selectedSize = size;
  document.querySelectorAll('.size-btn').forEach(b => {
    b.style.borderColor = 'var(--border)';
    b.style.color = 'var(--dark)';
  });
  btn.style.borderColor = 'var(--primary)';
  btn.style.color = 'var(--primary)';
}

function selectColor(color, btn) {
  selectedColor = color;
  document.querySelectorAll('.color-btn').forEach(b => {
    b.style.borderColor = 'var(--border)';
    b.style.color = 'var(--dark)';
  });
  btn.style.borderColor = 'var(--primary)';
  btn.style.color = 'var(--primary)';
}

function updateDetailQty(delta) {
  currentQty = Math.max(1, currentQty + delta);
  if (currentProduct && currentQty > currentProduct.stock) {
    currentQty = currentProduct.stock;
    showToast(`Only ${currentProduct.stock} items in stock`, 'info');
  }
  const input = document.getElementById('detail-qty-input');
  if (input) input.value = currentQty;
}

async function addCurrentProductToCart() {
  if (!currentProduct) return;
  await addToCart(currentProduct.id, currentQty, selectedSize);
}

async function buyCurrentProductNow() {
  if (!currentProduct) return;
  const added = await addToCart(currentProduct.id, currentQty, selectedSize);
  if (added) {
    window.location.href = '/delivery.html';
  }
}

// Related Products
async function loadRelatedProducts(id) {
  const container = document.getElementById('related-products-grid');
  if (!container) return;

  try {
    const res = await fetch(`${API_BASE}/products/${id}/related`);
    const data = await res.json();
    if (data.success && data.products.length > 0) {
      container.innerHTML = data.products.map(createProductCard).join('');
    } else {
      document.getElementById('related-products-section')?.remove();
    }
  } catch (err) {
    console.error('Failed to load related products:', err);
  }
}

async function renderReviewForm(productId) {
  const wrapper = document.getElementById('review-form-wrapper');
  if (!wrapper) return;

  try {
    const res = await fetch('/api/me');
    const data = await res.json();
    if (!data.success || !data.user) {
      wrapper.innerHTML = `<p style="color: var(--muted); font-size: 0.9rem;">Please <a href="/login.html?redirect=/product.html?id=${productId}" style="color: var(--primary); font-weight: 600;">login</a> to write a review.</p>`;
      return;
    }

    wrapper.innerHTML = `
      <form id="review-form" onsubmit="submitReview(event, ${productId})" style="background: #fafafa; border: 1px solid var(--border); border-radius: 10px; padding: 20px;">
        <div style="margin-bottom: 14px;">
          <label style="display: block; font-size: 0.82rem; font-weight: 700; text-transform: uppercase; margin-bottom: 8px;">Your Rating *</label>
          <div id="star-rating" style="display: flex; gap: 6px; font-size: 1.8rem; cursor: pointer;">
            ${[1,2,3,4,5].map(n => `<span data-star="${n}" onclick="setReviewStar(${n})" style="color: #d1d5db; transition: color 0.1s;">★</span>`).join('')}
          </div>
          <input type="hidden" id="review-rating" name="rating" value="">
        </div>
        <div style="margin-bottom: 16px;">
          <label style="display: block; font-size: 0.82rem; font-weight: 700; text-transform: uppercase; margin-bottom: 8px;">Your Review * <span style="font-weight: 400; color: var(--muted);">(min. 10 characters)</span></label>
          <textarea id="review-comment" name="comment" rows="4" placeholder="Share your honest experience with this product..." style="width: 100%; padding: 10px 14px; border: 1px solid var(--border); border-radius: 6px; font-family: inherit; font-size: 0.9rem; resize: vertical; box-sizing: border-box;"></textarea>
        </div>
        <button type="submit" class="btn btn-primary" style="padding: 10px 28px;">Submit Review</button>
      </form>
    `;
  } catch (err) {
    console.error('Failed to render review form:', err);
  }
}

function setReviewStar(n) {
  document.getElementById('review-rating').value = n;
  document.querySelectorAll('#star-rating span').forEach((el, i) => {
    el.style.color = i < n ? '#c59b27' : '#d1d5db';
  });
}

async function submitReview(event, productId) {
  event.preventDefault();
  const rating = document.getElementById('review-rating').value;
  const comment = document.getElementById('review-comment').value.trim();

  if (!rating) {
    showToast('Please select a star rating.', 'error');
    return;
  }
  if (comment.length < 10) {
    showToast('Review must be at least 10 characters long.', 'error');
    return;
  }

  const btn = event.target.querySelector('button[type="submit"]');
  btn.disabled = true;
  btn.textContent = 'Submitting...';

  try {
    const res = await fetch(`${API_BASE}/products/${productId}/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rating: Number(rating), comment })
    });
    const data = await res.json();
    if (data.success) {
      showToast('Review submitted! Thank you.', 'success');
      // Reload the page after a short delay so new review appears
      setTimeout(() => window.location.reload(), 1500);
    } else {
      showToast(data.message || 'Failed to submit review.', 'error');
      btn.disabled = false;
      btn.textContent = 'Submit Review';
    }
  } catch (err) {
    showToast('Network error. Please try again.', 'error');
    btn.disabled = false;
    btn.textContent = 'Submit Review';
  }
}

document.addEventListener('DOMContentLoaded', loadProductDetails);
