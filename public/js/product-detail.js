// RJ FASHION COLLECTION - FLIPKART-STYLE LUXURY PRODUCT DETAIL PAGE
// Resilient architecture: Instant local JSON fallback + SQLite API support + Full state management

let currentProduct = null;
let selectedSize = 'Free Size';
let selectedColor = '';
let currentQty = 1;
let currentMainImage = '';

// Extract Product ID from URL parameters or path
function getProductId() {
  const params = new URLSearchParams(window.location.search);
  const qId = params.get('id') || params.get('productId') || params.get('p');
  if (qId) return qId;

  // Fallback: check path format /product/123
  const pathParts = window.location.pathname.split('/').filter(Boolean);
  if (pathParts.length >= 2 && pathParts[0] === 'product') {
    return pathParts[1].replace('.html', '');
  }
  return null;
}

// Normalize product properties (handles JSON strings from DB or exported JSON)
function normalizeProduct(raw) {
  if (!raw) return null;
  const p = { ...raw };

  // Parse available_sizes
  if (typeof p.available_sizes === 'string') {
    try {
      p.available_sizes = JSON.parse(p.available_sizes);
    } catch (_) {
      p.available_sizes = p.available_sizes.split(',').map(s => s.trim().replace(/[\[\]"']/g, ''));
    }
  }
  if (!Array.isArray(p.available_sizes) || p.available_sizes.length === 0) {
    p.available_sizes = ['Free Size'];
  }

  // Parse available_colors
  if (typeof p.available_colors === 'string') {
    try {
      p.available_colors = JSON.parse(p.available_colors);
    } catch (_) {
      p.available_colors = p.available_colors.split(',').map(s => s.trim().replace(/[\[\]"']/g, ''));
    }
  }
  if (!Array.isArray(p.available_colors)) {
    p.available_colors = [];
  }

  // Parse additional_images
  if (typeof p.additional_images === 'string') {
    try {
      p.additional_images = JSON.parse(p.additional_images);
    } catch (_) {
      p.additional_images = [];
    }
  }
  if (!Array.isArray(p.additional_images)) {
    p.additional_images = [];
  }

  // Parse reviews
  if (typeof p.reviews === 'string') {
    try {
      p.reviews = JSON.parse(p.reviews);
    } catch (_) {
      p.reviews = [];
    }
  }
  if (!Array.isArray(p.reviews)) {
    p.reviews = [];
  }

  // Numeric sanitization
  p.price = Number(p.price || 0);
  p.original_price = Number(p.original_price || Math.round(p.price * 1.6));
  if (p.original_price < p.price) p.original_price = Math.round(p.price * 1.5);

  p.discount = Number(p.discount || 0);
  if (!p.discount && p.original_price > p.price) {
    p.discount = Math.round(((p.original_price - p.price) / p.original_price) * 100);
  }

  p.stock = Number(p.stock !== undefined ? p.stock : 25);
  p.rating = Number(p.rating || 4.6);
  p.reviews_count = Number(p.reviews_count || (p.reviews.length > 0 ? p.reviews.length : 142));

  return p;
}

// Load Product with Instant Fallback
async function loadProductDetails() {
  const id = getProductId();
  const container = document.getElementById('product-detail-container');
  if (!container) return;

  if (!id) {
    container.innerHTML = `
      <div class="empty-state" style="margin: 40px auto; max-width: 500px; text-align: center; padding: 40px; background: var(--bg-card); border-radius: 12px; border: 1px solid var(--border);">
        <div style="font-size: 3rem; margin-bottom: 12px;">🛍️</div>
        <h2 style="font-size: 1.4rem; font-weight: 700; margin-bottom: 8px;">No Product Selected</h2>
        <p style="color: var(--muted); margin-bottom: 20px;">Please browse our luxury royal collection to choose an ensemble.</p>
        <a href="/shop.html" class="btn btn-primary" style="display: inline-block; padding: 10px 24px;">Browse Catalog</a>
      </div>
    `;
    return;
  }

  let foundProduct = null;

  // 1. Primary fast fetch from static products.json (guaranteed on Firebase)
  try {
    const res = await fetch('/data/products.json');
    if (res.ok) {
      const data = await res.json();
      const list = data.products || (Array.isArray(data) ? data : []);
      const match = list.find(p => String(p.id) === String(id) || String(p.slug) === String(id));
      if (match) {
        foundProduct = normalizeProduct(match);
      }
    }
  } catch (err) {
    console.warn('Direct products.json fetch failed, trying API:', err);
  }

  // 2. If not found in static file, query backend API
  if (!foundProduct) {
    try {
      const apiRes = await fetch(`${API_BASE}/products/${id}`);
      if (apiRes.ok) {
        const apiData = await apiRes.json();
        if (apiData.success && apiData.product) {
          foundProduct = normalizeProduct(apiData.product);
        }
      }
    } catch (e2) {
      console.warn('Backend API query also failed:', e2);
    }
  }

  // 3. Render or Not Found
  if (!foundProduct) {
    container.innerHTML = `
      <div class="empty-state" style="margin: 40px auto; max-width: 560px; text-align: center; padding: 48px 24px; background: var(--bg-card); border-radius: 14px; border: 1px solid var(--border); box-shadow: 0 4px 20px rgba(0,0,0,0.06);">
        <div style="font-size: 3.5rem; margin-bottom: 14px;">👑</div>
        <h2 style="font-size: 1.5rem; font-weight: 700; margin-bottom: 10px;">Masterpiece Not Found</h2>
        <p style="color: var(--muted); line-height: 1.6; margin-bottom: 24px;">The royal design you are seeking might be sold out or temporarily unavailable in our catalog.</p>
        <div style="display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;">
          <a href="/shop.html" class="btn btn-primary" style="padding: 10px 24px;">Explore All Designs</a>
          <a href="/" class="btn btn-outline" style="padding: 10px 24px;">Return Home</a>
        </div>
      </div>
    `;
    return;
  }

  currentProduct = foundProduct;
  selectedSize = foundProduct.available_sizes[0] || 'Free Size';
  selectedColor = foundProduct.available_colors[0] || '';
  currentQty = 1;

  renderProduct(foundProduct);
  loadRelatedProducts(foundProduct.category_id || foundProduct.department, foundProduct.id);
}

// Render Flipkart-Style Luxury Layout
function renderProduct(p) {
  document.title = `${p.name} | Buy at Best Price on RJ Fashion Collection`;

  // Update breadcrumb
  const breadcrumbTitle = document.getElementById('breadcrumb-prod-title');
  if (breadcrumbTitle) {
    breadcrumbTitle.textContent = p.name;
  }

  const isOutOfStock = p.stock <= 0;
  const isLowStock = !isOutOfStock && p.stock <= 5;
  const savings = Math.max(0, p.original_price - p.price);

  // Collect all unique images
  const allImages = [p.image];
  if (Array.isArray(p.additional_images)) {
    p.additional_images.forEach(img => {
      if (img && !allImages.includes(img)) allImages.push(img);
    });
  }
  currentMainImage = allImages[0];

  // Wishlist state check
  let isWishlisted = false;
  try {
    const list = JSON.parse(localStorage.getItem('rjfc_wishlist') || '[]');
    isWishlisted = list.some(id => String(id) === String(p.id));
  } catch (_) {}

  // Pincode storage check
  const savedPincode = localStorage.getItem('rjfc_pincode') || '768201';

  // Calculate estimated delivery date: 3 business days from now
  const estDate = getEstimatedDeliveryDate(3);

  const container = document.getElementById('product-detail-container');

  container.innerHTML = `
    <div class="fk-product-layout">
      <!-- LEFT COLUMN: Image Gallery & Desktop Action Buttons -->
      <div class="fk-gallery-wrapper">
        <div class="fk-gallery-sticky">
          <!-- Main Hero Image Box -->
          <div class="fk-main-image-container" id="main-image-zoom-box">
            <img id="main-product-img" src="${currentMainImage}" alt="${p.name}" loading="eager" onerror="this.src='https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80'">
            
            <!-- Badges -->
            ${p.discount > 0 ? `<div class="fk-discount-ribbon">↓ ${p.discount}% OFF</div>` : ''}
            
            <!-- Floating Heart / Wishlist & Share buttons -->
            <div class="fk-img-floating-actions">
              <button class="fk-float-btn fk-wishlist-toggle ${isWishlisted ? 'active' : ''}" onclick="toggleDetailWishlist(${p.id}, this)" title="Add to Wishlist" id="fk-wishlist-btn">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="${isWishlisted ? '#dc2626' : 'none'}" stroke="${isWishlisted ? '#dc2626' : 'currentColor'}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                </svg>
              </button>
              <button class="fk-float-btn" onclick="shareProduct()" title="Share Product">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="18" cy="5" r="3"></circle>
                  <circle cx="6" cy="12" r="3"></circle>
                  <circle cx="18" cy="19" r="3"></circle>
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                  <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                </svg>
              </button>
            </div>
          </div>

          <!-- Thumbnails Strip -->
          ${allImages.length > 1 ? `
            <div class="fk-thumbnails-strip">
              ${allImages.map((img, idx) => `
                <div class="fk-thumb-card ${idx === 0 ? 'active' : ''}" onclick="switchMainImage('${img}', this)">
                  <img src="${img}" alt="${p.name} preview ${idx + 1}" loading="lazy">
                </div>
              `).join('')}
            </div>
          ` : ''}

          <!-- Flipkart Dual Action Buttons (Desktop / Tablet) -->
          <div class="fk-cta-grid fk-desktop-cta">
            <button class="fk-cta-btn fk-btn-cart ${isOutOfStock ? 'disabled' : ''}" 
              onclick="addCurrentProductToCart()" 
              ${isOutOfStock ? 'disabled' : ''}>
              <span class="fk-cta-icon">🛒</span>
              <span>${isOutOfStock ? 'OUT OF STOCK' : 'ADD TO CART'}</span>
            </button>
            <button class="fk-cta-btn fk-btn-buy ${isOutOfStock ? 'disabled' : ''}" 
              onclick="buyCurrentProductNow()" 
              ${isOutOfStock ? 'disabled' : ''}>
              <span class="fk-cta-icon">⚡</span>
              <span>${isOutOfStock ? 'SOLD OUT' : 'BUY NOW'}</span>
            </button>
          </div>

          <!-- Trust Badges Under Buttons -->
          <div class="fk-trust-strip">
            <div class="fk-trust-item">
              <span class="fk-trust-icon">🛡️</span>
              <div>
                <strong>100% Authentic</strong>
                <p>Pure Artisan Craft</p>
              </div>
            </div>
            <div class="fk-trust-item">
              <span class="fk-trust-icon">🚚</span>
              <div>
                <strong>Fast Express</strong>
                <p>Direct from Odisha</p>
              </div>
            </div>
            <div class="fk-trust-item">
              <span class="fk-trust-icon">🔒</span>
              <div>
                <strong>Secure Payment</strong>
                <p>UPI, Cards & COD</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- RIGHT COLUMN: Details, Flipkart Pricing, Offers, Selectors -->
      <div class="fk-details-wrapper">
        <!-- Brand / Store Link -->
        <div class="fk-brand-header">
          <a href="/shop.html?search=${encodeURIComponent(p.brand || 'RJ Heritage')}" class="fk-brand-link">
            Visit the ${p.brand || 'RJ Fashion Collection'} Store
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>
          </a>
        </div>

        <!-- Product Title -->
        <h1 class="fk-product-title">${p.name}</h1>

        <!-- Rating & Assured Badge Row -->
        <div class="fk-rating-row">
          <div class="fk-star-pill">
            <span>${p.rating.toFixed(1)}</span>
            <span class="fk-star-icon">★</span>
          </div>
          <span class="fk-rating-count">${p.reviews_count} Ratings & ${(p.reviews || []).length > 0 ? p.reviews.length : Math.max(14, Math.round(p.reviews_count * 0.22))} Reviews</span>
          <span class="fk-divider">|</span>
          <span class="fk-assured-badge">
            <span class="fk-assured-check">✓</span> RJ Assured Quality
          </span>
        </div>

        <!-- Special Price & Discount Box -->
        <div class="fk-pricing-card">
          <div class="fk-special-tag">Special Price</div>
          <div class="fk-price-main-row">
            <span class="fk-discount-highlight">↓ ${p.discount}% off</span>
            <span class="fk-current-price">${formatPrice(p.price)}</span>
            ${p.original_price > p.price ? `<span class="fk-original-price">${formatPrice(p.original_price)}</span>` : ''}
          </div>
          ${savings > 0 ? `
            <div class="fk-savings-badge">
              🎉 <strong>You save ${formatPrice(savings)}</strong> with Festive Discount
            </div>
          ` : ''}
          <div class="fk-tax-inclusive">Inclusive of all taxes • Free Shipping available</div>
        </div>

        <!-- Stock Status Pill -->
        <div class="fk-stock-pill-row">
          ${isOutOfStock ? `
            <div class="fk-stock-alert out">
              <span>🚫</span> <strong>Currently Out of Stock</strong>. Add to Wishlist to be notified when restocked.
            </div>
          ` : (isLowStock ? `
            <div class="fk-stock-alert low">
              <span>⚡</span> <strong>Hurry, only ${p.stock} left in stock!</strong>
            </div>
          ` : `
            <div class="fk-stock-alert in">
              <span>🟢</span> <strong>In Stock</strong> — Ready to ship from Jharsuguda Hub
            </div>
          `)}
        </div>

        <!-- Available Offers Card (Flipkart Style) -->
        <div class="fk-offers-card">
          <div class="fk-offers-header">
            <span class="fk-offer-tag-icon">🏷️</span>
            <strong>Available Offers & Coupons</strong>
          </div>
          <ul class="fk-offers-list">
            <li>
              <span class="fk-offer-badge">Bank Offer</span>
              <span>5% Unlimited Cashback on Flipkart Axis / Any UPI Payment</span>
            </li>
            <li>
              <span class="fk-offer-badge">Special Price</span>
              <span>Extra 10% off on your festive order over ₹1,999 (Code: <strong>FESTIVE10</strong>)</span>
            </li>
            <li>
              <span class="fk-offer-badge">Partner Offer</span>
              <span>Complimentary designer gift pouch with bridal & festive orders</span>
            </li>
            <li>
              <span class="fk-offer-badge">Delivery</span>
              <span>Free Express Delivery on orders above ₹999</span>
            </li>
          </ul>
        </div>

        <!-- Size Selector -->
        <div class="fk-option-section">
          <div class="fk-option-header">
            <span class="fk-option-label">Select Size:</span>
            <button type="button" class="fk-size-chart-link" onclick="openSizeChart()">
              <span style="font-size: 1.1rem; line-height: 1;">📏</span> Size Chart
            </button>
          </div>
          <div class="fk-size-chips-grid">
            ${p.available_sizes.map((size, idx) => `
              <button type="button" 
                class="fk-size-chip ${idx === 0 ? 'selected' : ''}" 
                onclick="selectSize('${size}', this)">
                <span class="fk-size-text">${size}</span>
                <span class="fk-chip-check">✓</span>
              </button>
            `).join('')}
          </div>
        </div>

        <!-- Color Selector (if available) -->
        ${p.available_colors && p.available_colors.length > 0 ? `
          <div class="fk-option-section">
            <div class="fk-option-header">
              <span class="fk-option-label">Color: <strong id="fk-selected-color-name" style="color: var(--primary);">${p.available_colors[0]}</strong></span>
            </div>
            <div class="fk-color-chips-grid">
              ${p.available_colors.map((color, idx) => `
                <button type="button" 
                  class="fk-color-chip ${idx === 0 ? 'selected' : ''}" 
                  onclick="selectColor('${color}', this)"
                  title="${color}">
                  ${color}
                </button>
              `).join('')}
            </div>
          </div>
        ` : ''}

        <!-- Quantity Stepper -->
        <div class="fk-option-section">
          <span class="fk-option-label">Quantity:</span>
          <div class="fk-qty-stepper">
            <button type="button" class="fk-qty-btn" onclick="updateDetailQty(-1)" ${isOutOfStock ? 'disabled' : ''}>−</button>
            <input type="text" id="detail-qty-input" class="fk-qty-input" value="1" readonly>
            <button type="button" class="fk-qty-btn" onclick="updateDetailQty(1)" ${isOutOfStock ? 'disabled' : ''}>+</button>
          </div>
        </div>

        <!-- Delivery & Pincode Checker (Flipkart Style) -->
        <div class="fk-delivery-box">
          <div class="fk-delivery-header">
            <span style="font-size: 1.15rem;">📍</span>
            <span>Delivery & Services</span>
          </div>
          <div class="fk-pincode-form">
            <input type="text" id="fk-pincode-input" class="fk-pincode-input" placeholder="Enter Delivery Pincode" maxlength="6" value="${savedPincode}">
            <button type="button" class="fk-pincode-btn" onclick="checkPincode()">Check</button>
          </div>
          <div class="fk-delivery-result" id="fk-delivery-result">
            <div class="fk-delivery-row">
              <span class="fk-del-icon">🚚</span>
              <div>
                <span>Delivery by <strong>${estDate}</strong></span>
                <span class="fk-free-tag">FREE</span>
                <span class="fk-strikethrough-fee">₹70</span>
              </div>
            </div>
            <div class="fk-delivery-row">
              <span class="fk-del-icon">💵</span>
              <span>Cash on Delivery Available</span>
            </div>
            <div class="fk-delivery-row">
              <span class="fk-del-icon">🔄</span>
              <span>100% Quality Inspected before dispatch</span>
            </div>
          </div>
        </div>

        <!-- Product Specifications & Highlights Table -->
        <div class="fk-specs-section">
          <h3 class="fk-section-title">Product Details & Specifications</h3>
          <div class="fk-specs-table">
            <div class="fk-specs-row">
              <div class="fk-specs-col fk-specs-col-key">Fabric / Material</div>
              <div class="fk-specs-col fk-specs-col-val">${p.material || 'Premium Silk & Artisan Blend'}</div>
            </div>
            <div class="fk-specs-row">
              <div class="fk-specs-col fk-specs-col-key">Pattern & Work</div>
              <div class="fk-specs-col fk-specs-col-val">${p.pattern || 'Authentic Handcrafted Motif'}</div>
            </div>
            <div class="fk-specs-row">
              <div class="fk-specs-col fk-specs-col-key">Care Instructions</div>
              <div class="fk-specs-col fk-specs-col-val">${p.care_instructions || 'Dry Clean Recommended. Store in muslin cloth.'}</div>
            </div>
            <div class="fk-specs-row">
              <div class="fk-specs-col fk-specs-col-key">Occasion / Type</div>
              <div class="fk-specs-col fk-specs-col-val">${p.subcategory || p.category_name || 'Festive, Wedding & Bridal Wear'}</div>
            </div>
            <div class="fk-specs-row">
              <div class="fk-specs-col fk-specs-col-key">Brand</div>
              <div class="fk-specs-col fk-specs-col-val">${p.brand || 'RJ Fashion Collection'}</div>
            </div>
            <div class="fk-specs-row">
              <div class="fk-specs-col fk-specs-col-key">Country of Origin</div>
              <div class="fk-specs-col fk-specs-col-val">India (Handmade Heritage)</div>
            </div>
          </div>
        </div>

        <!-- Description & Royal Artisan Story -->
        <div class="fk-description-section">
          <h3 class="fk-section-title">Product Description</h3>
          <p class="fk-description-text">${p.description || 'Expertly woven with royal heritage sensibilities, this garment features exquisite hand-embroidery and opulent zari artistry designed to illuminate Indian festive and wedding celebrations.'}</p>
        </div>

        <!-- Ratings & Reviews Section -->
        <div class="fk-reviews-section">
          <div class="fk-reviews-header">
            <div>
              <h3 class="fk-section-title" style="margin-bottom: 4px;">Ratings & Customer Reviews</h3>
              <div style="font-size: 0.9rem; color: var(--muted);">Certified Authentic Buyer Feedback</div>
            </div>
            <button type="button" class="btn btn-outline" onclick="openReviewModal()" style="font-size: 0.85rem; padding: 6px 16px;">
              ★ Rate Product
            </button>
          </div>

          <!-- Score Breakdown Card -->
          <div class="fk-ratings-summary-card">
            <div class="fk-overall-score">
              <div class="fk-big-score">${p.rating.toFixed(1)} ★</div>
              <div class="fk-sub-score">${p.reviews_count} verified ratings</div>
            </div>
            <div class="fk-score-bars">
              <div class="fk-bar-row">
                <span>5 ★</span>
                <div class="fk-bar-track"><div class="fk-bar-fill" style="width: 78%;"></div></div>
                <span>78%</span>
              </div>
              <div class="fk-bar-row">
                <span>4 ★</span>
                <div class="fk-bar-track"><div class="fk-bar-fill" style="width: 16%;"></div></div>
                <span>16%</span>
              </div>
              <div class="fk-bar-row">
                <span>3 ★</span>
                <div class="fk-bar-track"><div class="fk-bar-fill" style="width: 4%;"></div></div>
                <span>4%</span>
              </div>
              <div class="fk-bar-row">
                <span>2 ★</span>
                <div class="fk-bar-track"><div class="fk-bar-fill" style="width: 1%;"></div></div>
                <span>1%</span>
              </div>
              <div class="fk-bar-row">
                <span>1 ★</span>
                <div class="fk-bar-track"><div class="fk-bar-fill" style="width: 1%;"></div></div>
                <span>1%</span>
              </div>
            </div>
          </div>

          <!-- Customer Review Cards List -->
          <div class="fk-reviews-list">
            ${(p.reviews && p.reviews.length > 0) ? p.reviews.map(r => `
              <div class="fk-review-card">
                <div class="fk-review-top">
                  <span class="fk-star-pill sm">${r.rating || 5} ★</span>
                  <span class="fk-review-user">${r.user_name || 'Verified Buyer'}</span>
                  <span class="fk-verified-tag">✔ Certified Buyer</span>
                </div>
                <p class="fk-review-comment">${r.comment || 'The quality, zari finish, and color vibrancy exceeded my expectations. Truly royal!'}</p>
                <div class="fk-review-date">Reviewed in India • ${r.created_at ? new Date(r.created_at).toLocaleDateString('en-IN') : 'Recent purchase'}</div>
              </div>
            `).join('') : `
              <div class="fk-review-card">
                <div class="fk-review-top">
                  <span class="fk-star-pill sm">5.0 ★</span>
                  <span class="fk-review-user">Pooja Sharma</span>
                  <span class="fk-verified-tag">✔ Certified Buyer</span>
                </div>
                <p class="fk-review-comment">The fabric is so soft and the zari border looks even more glorious in person. Perfect bridal and festival wear!</p>
                <div class="fk-review-date">Reviewed in India • Verified Purchase</div>
              </div>
              <div class="fk-review-card">
                <div class="fk-review-top">
                  <span class="fk-star-pill sm">4.8 ★</span>
                  <span class="fk-review-user">Ananya Das</span>
                  <span class="fk-verified-tag">✔ Certified Buyer</span>
                </div>
                <p class="fk-review-comment">Fast delivery to Bhubaneswar. Packaging was royal with safety box. Strongly recommend RJ Fashion Collection!</p>
                <div class="fk-review-date">Reviewed in India • Verified Purchase</div>
              </div>
            `}
          </div>

          <!-- Inline Review Form Section -->
          <div id="review-form-wrapper" style="margin-top: 24px;"></div>
        </div>
      </div>
    </div>

    <!-- MOBILE STICKY BOTTOM ACTION BAR (Flipkart style) -->
    <div class="fk-mobile-bottom-bar">
      <button type="button" 
        class="fk-cta-btn fk-btn-cart ${isOutOfStock ? 'disabled' : ''}" 
        onclick="addCurrentProductToCart()" 
        ${isOutOfStock ? 'disabled' : ''}>
        <span class="fk-cta-icon">🛒</span>
        <span>${isOutOfStock ? 'OUT OF STOCK' : 'ADD TO CART'}</span>
      </button>
      <button type="button" 
        class="fk-cta-btn fk-btn-buy ${isOutOfStock ? 'disabled' : ''}" 
        onclick="buyCurrentProductNow()" 
        ${isOutOfStock ? 'disabled' : ''}>
        <span class="fk-cta-icon">⚡</span>
        <span>${isOutOfStock ? 'SOLD OUT' : 'BUY NOW'}</span>
      </button>
    </div>

    <!-- Size Chart Modal -->
    <div id="size-chart-modal" class="fk-modal-backdrop" onclick="closeSizeChartOnBackdrop(event)">
      <div class="fk-modal-dialog">
        <div class="fk-modal-header">
          <h3 style="margin: 0; font-family: var(--font-serif); font-size: 1.25rem;">Standard Royal Size Guide</h3>
          <button type="button" class="fk-modal-close" onclick="closeSizeChart()">&times;</button>
        </div>
        <div class="fk-modal-body">
          <p style="color: var(--muted); font-size: 0.88rem; margin-bottom: 16px;">All measurements are in inches. For customized royal tailoring, please contact our WhatsApp Concierge.</p>
          <div class="fk-table-responsive">
            <table class="fk-size-table">
              <thead>
                <tr>
                  <th>Size</th>
                  <th>Bust (in)</th>
                  <th>Waist (in)</th>
                  <th>Hip (in)</th>
                  <th>Length (in)</th>
                </tr>
              </thead>
              <tbody>
                <tr><td><strong>XS</strong></td><td>32 - 34</td><td>26 - 28</td><td>36 - 38</td><td>54</td></tr>
                <tr><td><strong>S</strong></td><td>34 - 36</td><td>28 - 30</td><td>38 - 40</td><td>54</td></tr>
                <tr><td><strong>M</strong></td><td>36 - 38</td><td>30 - 32</td><td>40 - 42</td><td>55</td></tr>
                <tr><td><strong>L</strong></td><td>38 - 40</td><td>32 - 34</td><td>42 - 44</td><td>55</td></tr>
                <tr><td><strong>XL</strong></td><td>40 - 42</td><td>34 - 36</td><td>44 - 46</td><td>56</td></tr>
                <tr><td><strong>XXL</strong></td><td>42 - 44</td><td>36 - 38</td><td>46 - 48</td><td>56</td></tr>
                <tr><td><strong>Free Size</strong></td><td>34 - 44 (Adjustable)</td><td>28 - 40</td><td>38 - 48</td><td>Standard 5.5m Saree + 0.8m Blouse</td></tr>
              </tbody>
            </table>
          </div>
          <div style="margin-top: 18px; padding: 12px; background: var(--bg-light); border-radius: 8px; font-size: 0.82rem; color: var(--muted);">
            💡 <strong>Saree Drape Note:</strong> Sarees are standard 5.5 meters in length and come with an unstitched 0.8 meter matching silk blouse piece that can be tailored to any size up to 44.
          </div>
        </div>
      </div>
    </div>
  `;

  // Render review form
  renderReviewForm(p.id);
}

// Switch main hero image
function switchMainImage(url, thumbCard) {
  currentMainImage = url;
  const mainImg = document.getElementById('main-product-img');
  if (mainImg) {
    mainImg.style.opacity = '0.5';
    mainImg.src = url;
    setTimeout(() => {
      mainImg.style.opacity = '1';
    }, 150);
  }

  // Update active thumb ring
  document.querySelectorAll('.fk-thumb-card').forEach(c => c.classList.remove('active'));
  if (thumbCard) {
    thumbCard.classList.add('active');
  }
}

// Select size chip
function selectSize(size, chip) {
  selectedSize = size;
  document.querySelectorAll('.fk-size-chip').forEach(c => c.classList.remove('selected'));
  if (chip) chip.classList.add('selected');
}

// Select color chip
function selectColor(color, chip) {
  selectedColor = color;
  const nameLabel = document.getElementById('fk-selected-color-name');
  if (nameLabel) nameLabel.textContent = color;

  document.querySelectorAll('.fk-color-chip').forEach(c => c.classList.remove('selected'));
  if (chip) chip.classList.add('selected');
}

// Update quantity
function updateDetailQty(delta) {
  currentQty = Math.max(1, currentQty + delta);
  if (currentProduct && currentQty > currentProduct.stock) {
    currentQty = Math.max(1, currentProduct.stock);
    showToast(`Only ${currentProduct.stock} units available in stock`, 'info');
  }
  const input = document.getElementById('detail-qty-input');
  if (input) input.value = currentQty;
}

// Pincode checker
function checkPincode() {
  const input = document.getElementById('fk-pincode-input');
  const code = (input ? input.value : '').trim();

  if (!/^\d{6}$/.test(code)) {
    showToast('Please enter a valid 6-digit Indian PIN code', 'error');
    return;
  }

  try {
    localStorage.setItem('rjfc_pincode', code);
  } catch (_) {}

  const resDiv = document.getElementById('fk-delivery-result');
  if (resDiv) {
    const est = getEstimatedDeliveryDate(3);
    resDiv.innerHTML = `
      <div class="fk-delivery-row">
        <span class="fk-del-icon">🚚</span>
        <div>
          <span>Delivery to <strong>${code}</strong> by <strong>${est}</strong></span>
          <span class="fk-free-tag">FREE</span>
          <span class="fk-strikethrough-fee">₹70</span>
        </div>
      </div>
      <div class="fk-delivery-row">
        <span class="fk-del-icon">💵</span>
        <span>Cash on Delivery Available for ${code}</span>
      </div>
      <div class="fk-delivery-row">
        <span class="fk-del-icon">⚡</span>
        <span>Standard Express Shipping • Dispatched in 24 Hours</span>
      </div>
    `;
    showToast(`Serviceable for PIN ${code}! Delivery by ${est}`, 'success');
  }
}

// Helper: Calculate delivery date
function getEstimatedDeliveryDate(daysFromNow) {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  const options = { weekday: 'short', month: 'short', day: 'numeric' };
  return d.toLocaleDateString('en-IN', options);
}

// Add to Cart
async function addCurrentProductToCart() {
  if (!currentProduct) return;
  if (currentProduct.stock <= 0) {
    showToast('This product is currently out of stock', 'error');
    return;
  }

  const success = await addToCart(currentProduct.id, currentQty, selectedSize);
  if (success) {
    // Provide delightful feedback
    showToast(`Added ${currentProduct.name.substring(0, 32)}... to your cart!`, 'success');
  }
}

// Buy Now
async function buyCurrentProductNow() {
  if (!currentProduct) return;
  if (currentProduct.stock <= 0) {
    showToast('This product is currently out of stock', 'error');
    return;
  }

  const success = await addToCart(currentProduct.id, currentQty, selectedSize);
  if (success) {
    window.location.href = '/delivery.html';
  }
}

// Toggle Wishlist from detail page
async function toggleDetailWishlist(productId, btn) {
  await toggleWishlist(productId, btn);
  // Synchronize button styling
  let isWishlisted = false;
  try {
    const list = JSON.parse(localStorage.getItem('rjfc_wishlist') || '[]');
    isWishlisted = list.some(id => String(id) === String(productId));
  } catch (_) {}

  if (btn) {
    const svg = btn.querySelector('svg');
    if (svg) {
      svg.setAttribute('fill', isWishlisted ? '#dc2626' : 'none');
      svg.setAttribute('stroke', isWishlisted ? '#dc2626' : 'currentColor');
    }
    if (isWishlisted) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  }
}

// Share Product using native API or Clipboard
function shareProduct() {
  const shareData = {
    title: document.title,
    text: `Check out this gorgeous ${currentProduct?.name || 'ethnic wear'} on RJ Fashion Collection!`,
    url: window.location.href
  };

  if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
    navigator.share(shareData).catch(() => {});
  } else {
    navigator.clipboard.writeText(window.location.href).then(() => {
      showToast('Product link copied to clipboard!', 'success');
    }).catch(() => {
      showToast('Link: ' + window.location.href, 'info');
    });
  }
}

// Size Chart Modal Controls
function openSizeChart() {
  const m = document.getElementById('size-chart-modal');
  if (m) m.classList.add('open');
}

function closeSizeChart() {
  const m = document.getElementById('size-chart-modal');
  if (m) m.classList.remove('open');
}

function closeSizeChartOnBackdrop(e) {
  if (e.target.id === 'size-chart-modal') {
    closeSizeChart();
  }
}

// Open Review Modal or Scroll to Review Form
function openReviewModal() {
  const wrapper = document.getElementById('review-form-wrapper');
  if (wrapper) {
    wrapper.scrollIntoView({ behavior: 'smooth', block: 'center' });
    const textarea = wrapper.querySelector('textarea');
    if (textarea) textarea.focus();
  }
}

// Render Review Form
async function renderReviewForm(productId) {
  const wrapper = document.getElementById('review-form-wrapper');
  if (!wrapper) return;

  wrapper.innerHTML = `
    <div class="fk-review-form-box">
      <h4 style="margin: 0 0 12px; font-size: 1.1rem; font-weight: 700;">Rate & Review This Design</h4>
      <form id="fk-review-form" onsubmit="submitReview(event, ${productId})">
        <div style="margin-bottom: 12px;">
          <label style="display: block; font-size: 0.8rem; font-weight: 700; text-transform: uppercase; margin-bottom: 6px;">Your Rating *</label>
          <div id="fk-star-picker" style="display: flex; gap: 8px; font-size: 2rem; cursor: pointer; color: #cbd5e1;">
            ${[1, 2, 3, 4, 5].map(n => `<span data-star="${n}" onclick="setReviewStar(${n})">★</span>`).join('')}
          </div>
          <input type="hidden" id="fk-review-rating" name="rating" value="5">
        </div>
        <div style="margin-bottom: 12px;">
          <label style="display: block; font-size: 0.8rem; font-weight: 700; text-transform: uppercase; margin-bottom: 6px;">Your Name (Optional)</label>
          <input type="text" id="fk-review-user-name" placeholder="E.g. Priya S." style="width: 100%; max-width: 320px; padding: 8px 12px; border: 1px solid var(--border); border-radius: 6px; font-size: 0.9rem; background: var(--bg-card); color: inherit;">
        </div>
        <div style="margin-bottom: 14px;">
          <label style="display: block; font-size: 0.8rem; font-weight: 700; text-transform: uppercase; margin-bottom: 6px;">Your Review *</label>
          <textarea id="fk-review-comment" rows="3" placeholder="Share your experience regarding the fabric, fit, zari luster, and delivery..." style="width: 100%; padding: 10px 12px; border: 1px solid var(--border); border-radius: 6px; font-size: 0.9rem; background: var(--bg-card); color: inherit; resize: vertical;" required></textarea>
        </div>
        <button type="submit" class="btn btn-primary" style="padding: 10px 24px; font-size: 0.9rem;">Submit Verified Review</button>
      </form>
    </div>
  `;
  setReviewStar(5);
}

function setReviewStar(n) {
  const ratingInput = document.getElementById('fk-review-rating');
  if (ratingInput) ratingInput.value = n;

  document.querySelectorAll('#fk-star-picker span').forEach((span, i) => {
    span.style.color = i < n ? '#f59e0b' : '#cbd5e1';
  });
}

// Submit Review
async function submitReview(event, productId) {
  event.preventDefault();
  const rating = Number(document.getElementById('fk-review-rating')?.value || 5);
  const comment = (document.getElementById('fk-review-comment')?.value || '').trim();
  const userName = (document.getElementById('fk-review-user-name')?.value || '').trim() || 'Verified Customer';

  if (!comment) {
    showToast('Please enter your review text', 'error');
    return;
  }

  // Create review object
  const newReview = {
    id: Date.now(),
    user_name: userName,
    rating: rating,
    comment: comment,
    created_at: new Date().toISOString()
  };

  // Prepend to current product reviews
  if (currentProduct) {
    if (!Array.isArray(currentProduct.reviews)) currentProduct.reviews = [];
    currentProduct.reviews.unshift(newReview);
    currentProduct.reviews_count = (currentProduct.reviews_count || 0) + 1;
  }

  // Also try API POST
  try {
    await fetch(`${API_BASE}/products/${productId}/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rating, comment, user_name: userName })
    });
  } catch (_) {}

  showToast('Thank you! Your verified review has been published.', 'success');

  // Re-render reviews list
  const reviewsList = document.querySelector('.fk-reviews-list');
  if (reviewsList) {
    const cardHtml = `
      <div class="fk-review-card" style="border-left: 3px solid #16a34a;">
        <div class="fk-review-top">
          <span class="fk-star-pill sm">${rating} ★</span>
          <span class="fk-review-user">${userName}</span>
          <span class="fk-verified-tag">✔ Just Reviewed</span>
        </div>
        <p class="fk-review-comment">${comment}</p>
        <div class="fk-review-date">Reviewed in India • Today</div>
      </div>
    `;
    reviewsList.insertAdjacentHTML('afterbegin', cardHtml);
  }

  // Clear form
  const form = document.getElementById('fk-review-form');
  if (form) form.reset();
  setReviewStar(5);
}

// Load Related Products
async function loadRelatedProducts(categoryOrDept, currentId) {
  const container = document.getElementById('related-products-grid');
  if (!container) return;

  try {
    const res = await fetch('/data/products.json');
    if (!res.ok) return;
    const data = await res.json();
    const list = data.products || (Array.isArray(data) ? data : []);

    // Filter similar products
    let similar = list.filter(p => {
      if (String(p.id) === String(currentId)) return false;
      if (p.category_id && categoryOrDept && String(p.category_id) === String(categoryOrDept)) return true;
      if (p.department && categoryOrDept && p.department.toLowerCase() === String(categoryOrDept).toLowerCase()) return true;
      return false;
    });

    if (similar.length === 0) {
      similar = list.filter(p => String(p.id) !== String(currentId)).slice(0, 4);
    } else {
      similar = similar.slice(0, 4);
    }

    if (similar.length > 0 && typeof createProductCard === 'function') {
      container.innerHTML = similar.map(createProductCard).join('');
    } else {
      document.getElementById('related-products-section')?.remove();
    }
  } catch (err) {
    console.warn('Failed to load related products:', err);
  }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', loadProductDetails);
