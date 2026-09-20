// ============================================
// FIREBASE SETUP (no secrets in this file)
// ============================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getFirestore, collection, addDoc, getDocs, deleteDoc,
  doc, query, orderBy, updateDoc, where
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import {
  getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged,
  GoogleAuthProvider, signInWithPopup, RecaptchaVerifier, signInWithPhoneNumber
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { firebaseConfig, UPI_ID, UPI_PAYEE_NAME } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// ============================================
// GLOBAL STATE
// ============================================
let products = [];
let filteredProducts = [];
let activeCategory = null;
let cart = JSON.parse(localStorage.getItem("cart")) || [];
let wishlist = JSON.parse(localStorage.getItem("wishlist")) || [];
// UPI_ID is imported from firebase-config.js — no longer hardcoded here


let currentMediaList = [];
let currentMediaIndex = 0;
const cardImageIndex = {};

// ============================================
// CART HELPERS
// ============================================
function saveCart() { localStorage.setItem("cart", JSON.stringify(cart)); }
function updateCartCount() {
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const counter = document.getElementById("cartCount");
  if (counter) counter.textContent = totalItems;
}

// ============================================
// WISHLIST HELPERS
// ============================================
function saveWishlist() { localStorage.setItem("wishlist", JSON.stringify(wishlist)); }
function toggleWishlist(productId) {
  const index = wishlist.indexOf(productId);
  if (index > -1) wishlist.splice(index, 1);
  else wishlist.push(productId);
  saveWishlist();
  renderWishlistPage();
}
function isInWishlist(productId) { return wishlist.includes(productId); }
function isOutOfStock(product) { return product.stockStatus === "out"; }

// ============================================
// LOAD PRODUCTS
// ============================================
async function loadProducts() {
  try {
    const snapshot = await getDocs(collection(db, "products"));
    products = [];
    snapshot.forEach(d => {
      const data = d.data();
      if (!data.images && data.image) data.images = [data.image];
      if (data.stockStatus !== "out") data.stockStatus = "in";
      products.push({ id: d.id, ...data });
    });
    console.log("✅ Loaded products:", products.length);
  } catch (err) {
    console.error("❌ Load products:", err);
    products = [];
  }
}

// ============================================
// CATEGORY FILTER
// ============================================
function applyCategoryFilter() {
  const params = new URLSearchParams(window.location.search);
  const cat = params.get("category");

  const bar = document.getElementById("categoryFilterBar");
  const chip = document.getElementById("activeCategoryChip");
  const titleEl = document.getElementById("sectionTitle");
  const subtitleEl = document.getElementById("sectionSubtitle");

  if (!cat) {
    activeCategory = null;
    filteredProducts = products;
    if (bar) bar.style.display = "none";
    if (titleEl) titleEl.textContent = "Featured Products";
    if (subtitleEl) subtitleEl.textContent = "Handpicked women's fashion essentials designed to bring style and confidence to your everyday.";
    return;
  }

  activeCategory = cat;
  filteredProducts = products.filter(p =>
    (p.category || "").toLowerCase() === cat.toLowerCase()
  );

  if (bar) bar.style.display = "flex";
  if (chip) chip.textContent = cat;
  if (titleEl) titleEl.textContent = cat;
  if (subtitleEl) subtitleEl.textContent = `${filteredProducts.length} product${filteredProducts.length !== 1 ? "s" : ""} in "${cat}"`;
}

function setupFilterClear() {
  const btn = document.getElementById("clearFilterBtn");
  if (!btn) return;
  btn.addEventListener("click", () => {
    window.location.href = "index.html";
  });
}

// ============================================
// CUSTOMER AUTH (Google + Phone)
// ============================================
function setupCustomerAuth() {
  const authSection = document.getElementById('authSection');
  const accountSection = document.getElementById('accountSection');
  if (!authSection || !accountSection) return;

  const googleBtn = document.getElementById('googleLoginBtn');
  const sendOtpBtn = document.getElementById('sendOtpBtn');
  const verifyOtpBtn = document.getElementById('verifyOtpBtn');
  const resendOtpBtn = document.getElementById('resendOtpBtn');
  const phoneInput = document.getElementById('phoneInput');
  const otpInput = document.getElementById('otpInput');
  const otpGroup = document.getElementById('otpGroup');
  const authError = document.getElementById('authError');
  const logoutAccountBtn = document.getElementById('logoutAccountBtn');

  let confirmationResult = null;
  let recaptchaVerifier = null;

  googleBtn.addEventListener('click', async () => {
    authError.textContent = '';
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      console.error(err);
      authError.textContent = '❌ ' + (err.message || 'Google sign-in failed.');
    }
  });

  function setupRecaptcha() {
    if (recaptchaVerifier) return;
    recaptchaVerifier = new RecaptchaVerifier(auth, 'sendOtpBtn', {
      size: 'invisible',
      callback: () => {}
    });
  }

  sendOtpBtn.addEventListener('click', async () => {
    authError.textContent = '';
    const phone = phoneInput.value.trim();
    if (!/^[0-9]{10}$/.test(phone)) {
      authError.textContent = '❌ Please enter a valid 10-digit mobile number.';
      return;
    }
    sendOtpBtn.disabled = true;
    sendOtpBtn.textContent = '⏳ Sending…';
    try {
      setupRecaptcha();
      const phoneNumber = '+91' + phone;
      confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier);
      otpGroup.style.display = 'block';
      sendOtpBtn.textContent = '✅ OTP Sent';
      authError.style.color = '#16a34a';
      authError.textContent = '✅ OTP sent! Check your SMS.';
      setTimeout(() => { authError.style.color = ''; authError.textContent = ''; }, 5000);
    } catch (err) {
      console.error(err);
      authError.style.color = '#e03e3e';
      authError.textContent = '❌ ' + (err.message || 'Failed to send OTP.');
      sendOtpBtn.disabled = false;
      sendOtpBtn.textContent = 'Send OTP';
    }
  });

  verifyOtpBtn.addEventListener('click', async () => {
    authError.textContent = '';
    const otp = otpInput.value.trim();
    if (!/^[0-9]{6}$/.test(otp)) {
      authError.textContent = '❌ Please enter the 6-digit OTP.';
      return;
    }
    if (!confirmationResult) {
      authError.textContent = '❌ Please request an OTP first.';
      return;
    }
    verifyOtpBtn.disabled = true;
    verifyOtpBtn.textContent = '⏳ Verifying…';
    try {
      await confirmationResult.confirm(otp);
    } catch (err) {
      console.error(err);
      authError.textContent = '❌ Invalid OTP. Please try again.';
      verifyOtpBtn.disabled = false;
      verifyOtpBtn.textContent = 'Verify & Login';
    }
  });

  resendOtpBtn.addEventListener('click', async () => {
    otpGroup.style.display = 'none';
    sendOtpBtn.disabled = false;
    sendOtpBtn.textContent = 'Send OTP';
    phoneInput.focus();
  });

  logoutAccountBtn.addEventListener('click', async () => {
    await signOut(auth);
    location.reload();
  });

  onAuthStateChanged(auth, (user) => {
    if (user) {
      authSection.style.display = 'none';
      accountSection.style.display = 'block';
      const nameEl = document.getElementById('accountName');
      const emailEl = document.getElementById('accountEmail');
      const avatarEl = document.getElementById('accountAvatar');
      const displayName = user.displayName || (user.phoneNumber ? 'User' : 'Customer');
      const email = user.email || user.phoneNumber || '—';
      nameEl.textContent = `Welcome, ${displayName}!`;
      emailEl.textContent = email;
      if (user.photoURL) {
        avatarEl.innerHTML = `<img src="${user.photoURL}" alt="Avatar" style="width:100%;height:100%;border-radius:50%;object-fit:cover;" />`;
      } else {
        avatarEl.textContent = '👤';
      }
    } else {
      authSection.style.display = 'flex';
      accountSection.style.display = 'none';
    }
  });
}

// ============================================
// LIGHTBOX
// ============================================
function openLightboxWithList(mediaList, startIndex) {
  currentMediaList = mediaList;
  currentMediaIndex = startIndex;
  let lightbox = document.getElementById("lightbox");
  if (!lightbox) {
    lightbox = document.createElement("div");
    lightbox.id = "lightbox";
    lightbox.className = "lightbox";
    document.body.appendChild(lightbox);
  }
  lightbox.innerHTML = `
    <button class="lightbox-close" onclick="closeLightbox()">✕</button>
    ${mediaList.length > 1 ? `
      <button class="lightbox-nav lightbox-prev" onclick="lightboxPrev()">‹</button>
      <button class="lightbox-nav lightbox-next" onclick="lightboxNext()">›</button>
    ` : ''}
    <div id="lightboxContent"></div>
    ${mediaList.length > 1 ? `<div class="lightbox-counter" id="lightboxCounter"></div>` : ''}
  `;
  renderLightboxMedia();
  lightbox.classList.add("active");
}

function renderLightboxMedia() {
  const content = document.getElementById("lightboxContent");
  const counter = document.getElementById("lightboxCounter");
  if (!content) return;
  const item = currentMediaList[currentMediaIndex];
  content.innerHTML = "";
  if (item.type === "video") {
    const url = item.url;
    if (url.includes("youtube.com") || url.includes("youtu.be")) {
      let videoId = "";
      if (url.includes("youtu.be/")) videoId = url.split("youtu.be/")[1].split("?")[0];
      else if (url.includes("v=")) videoId = url.split("v=")[1].split("&")[0];
      content.innerHTML = `<iframe width="800" height="450" src="https://www.youtube.com/embed/${videoId}?autoplay=1&mute=0&rel=0" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>`;
    } else {
      content.innerHTML = `<video src="${url}" controls autoplay playsinline style="max-width:95%;max-height:90vh;"></video>`;
    }
  } else {
    content.innerHTML = `<img src="${item.url}" alt="Product Image" style="max-width:95%;max-height:90vh;object-fit:contain;border-radius:8px;" />`;
  }
  if (counter) counter.textContent = `${currentMediaIndex + 1} / ${currentMediaList.length}`;
}

window.lightboxPrev = function () {
  if (currentMediaList.length <= 1) return;
  currentMediaIndex = (currentMediaIndex - 1 + currentMediaList.length) % currentMediaList.length;
  renderLightboxMedia();
};
window.lightboxNext = function () {
  if (currentMediaList.length <= 1) return;
  currentMediaIndex = (currentMediaIndex + 1) % currentMediaList.length;
  renderLightboxMedia();
};
window.closeLightbox = function () {
  const lightbox = document.getElementById("lightbox");
  if (lightbox) {
    lightbox.classList.remove("active");
    const content = document.getElementById("lightboxContent");
    if (content) content.innerHTML = "";
  }
};

document.addEventListener("keydown", (e) => {
  const lightbox = document.getElementById("lightbox");
  if (!lightbox || !lightbox.classList.contains("active")) return;
  if (e.key === "ArrowLeft") window.lightboxPrev();
  if (e.key === "ArrowRight") window.lightboxNext();
  if (e.key === "Escape") window.closeLightbox();
});

// ============================================
// RENDER PRODUCTS
// ============================================
const productGrid = document.getElementById("productGrid");

function renderProducts() {
  if (!productGrid) return;
  productGrid.innerHTML = "";

  if (filteredProducts.length === 0) {
    const msg = activeCategory
      ? `No products found in "${activeCategory}" yet.`
      : "No products available yet.";
    productGrid.innerHTML = `<p style="text-align:center;color:#999;padding:40px;width:100%;font-size:15px;">${msg}</p>`;
    return;
  }

  filteredProducts.forEach(product => {
    const card = document.createElement("div");
    card.classList.add("product-card");
    card.dataset.productId = product.id;

    const isWishlisted = isInWishlist(product.id);
    const images = product.images || (product.image ? [product.image] : []);
    const cover = images[0] || "https://via.placeholder.com/400?text=No+Image";
    const outOfStock = isOutOfStock(product);
    const totalMedia = images.length + (product.video ? 1 : 0);
    cardImageIndex[product.id] = 0;

    let dotsHTML = "";
    if (totalMedia > 1) {
      dotsHTML = `<div class="image-dots" data-product-id="${product.id}">`;
      for (let i = 0; i < totalMedia; i++) {
        dotsHTML += `<span class="image-dot ${i === 0 ? 'active' : ''}" data-index="${i}"></span>`;
      }
      dotsHTML += `</div>`;
    }

    let navHTML = "";
    if (totalMedia > 1) {
      navHTML = `
        <button class="image-nav-btn image-nav-prev" data-product-id="${product.id}" aria-label="Previous image">‹</button>
        <button class="image-nav-btn image-nav-next" data-product-id="${product.id}" aria-label="Next image">›</button>
      `;
    }

    card.innerHTML = `
      <div class="product-image-wrap">
        <img src="${cover}" alt="${product.name}" class="product-image" data-product-id="${product.id}" onerror="this.src='https://via.placeholder.com/400x400?text=No+Image'" />
        <button class="wishlist-btn ${isWishlisted ? 'active' : ''}" data-id="${product.id}" aria-label="Add to wishlist">
          ${isWishlisted ? '♥' : '♡'}
        </button>
        ${navHTML}
        ${dotsHTML}
        ${outOfStock ? `<span style="position:absolute; bottom:10px; left:10px; background:#e03e3e; color:white; font-size:10px; padding:2px 8px; border-radius:10px; font-weight:600; z-index:4;">OUT OF STOCK</span>` : ''}
      </div>
      <div class="product-info">
        <p class="product-category">${product.category || ""}</p>
        <h3 class="product-name">${product.name}</h3>
        <p class="product-price">₹${Number(product.price).toFixed(2)}</p>
        ${outOfStock
          ? `<button class="add-to-cart" disabled style="background:#ccc; cursor:not-allowed;">Out of Stock</button>`
          : `<button class="add-to-cart" data-id="${product.id}">Add to Cart</button>`
        }
        <button class="review-btn" data-id="${product.id}">⭐ Reviews</button>
      </div>
    `;
    productGrid.appendChild(card);
  });
  attachButtonEvents();
  updateCarouselButtons();
}

function getProductMedia(product) {
  const media = [];
  const images = product.images || (product.image ? [product.image] : []);
  images.forEach(img => media.push({ type: "image", url: img }));
  if (product.video) media.push({ type: "video", url: product.video });
  return media;
}

function switchCardImage(productId, newIndex) {
  const product = products.find(p => p.id === productId);
  if (!product) return;
  const media = getProductMedia(product);
  if (newIndex < 0 || newIndex >= media.length) return;
  cardImageIndex[productId] = newIndex;
  const card = document.querySelector(`.product-card[data-product-id="${productId}"]`);
  if (!card) return;
  const img = card.querySelector(".product-image");
  const item = media[newIndex];
  if (item.type === "video") {
    const firstImage = media.find(m => m.type === "image");
    img.src = firstImage ? firstImage.url : "https://via.placeholder.com/400?text=Video";
  } else {
    img.src = item.url;
  }
  card.querySelectorAll(".image-dot").forEach((dot, i) => {
    dot.classList.toggle("active", i === newIndex);
  });
}

// ============================================
// CAROUSEL ARROWS
// ============================================
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");

function getScrollAmount() {
  const firstCard = productGrid.querySelector(".product-card");
  if (!firstCard) return 300;
  const cardWidth = firstCard.offsetWidth;
  const gap = 30;
  return cardWidth + gap;
}

if (nextBtn) {
  nextBtn.addEventListener("click", () => {
    productGrid.scrollBy({ left: getScrollAmount(), behavior: "smooth" });
  });
}
if (prevBtn) {
  prevBtn.addEventListener("click", () => {
    productGrid.scrollBy({ left: -getScrollAmount(), behavior: "smooth" });
  });
}

function updateCarouselButtons() {
  if (!productGrid || !prevBtn || !nextBtn) return;
  const maxScroll = productGrid.scrollWidth - productGrid.clientWidth;
  if (maxScroll <= 5) {
    prevBtn.style.display = "none";
    nextBtn.style.display = "none";
    return;
  }
  prevBtn.style.display = "flex";
  nextBtn.style.display = "flex";
  prevBtn.disabled = productGrid.scrollLeft <= 5;
  nextBtn.disabled = productGrid.scrollLeft >= maxScroll - 5;
}

if (productGrid) {
  productGrid.addEventListener("scroll", updateCarouselButtons);
  window.addEventListener("resize", updateCarouselButtons);
}

// ============================================
// BUTTON EVENTS
// ============================================
function attachButtonEvents() {
  document.querySelectorAll(".add-to-cart").forEach(btn => {
    if (btn.disabled) return;
    btn.addEventListener("click", () => addToCart(btn.dataset.id));
  });

  document.querySelectorAll(".wishlist-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const id = btn.dataset.id;
      toggleWishlist(id);
      const isNowWishlisted = isInWishlist(id);
      btn.classList.toggle("active", isNowWishlisted);
      btn.textContent = isNowWishlisted ? "♥" : "♡";
    });
  });

  document.querySelectorAll(".product-image").forEach(img => {
    img.addEventListener("click", () => {
      const productId = img.dataset.productId;
      const p = products.find(x => x.id === productId);
      if (!p) return;
      const mediaList = getProductMedia(p);
      const startIndex = cardImageIndex[productId] || 0;
      openLightboxWithList(mediaList, startIndex);
    });
  });

  document.querySelectorAll(".image-nav-prev").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const id = btn.dataset.productId;
      const current = cardImageIndex[id] || 0;
      const product = products.find(p => p.id === id);
      if (!product) return;
      const total = getProductMedia(product).length;
      switchCardImage(id, (current - 1 + total) % total);
    });
  });
  document.querySelectorAll(".image-nav-next").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const id = btn.dataset.productId;
      const current = cardImageIndex[id] || 0;
      const product = products.find(p => p.id === id);
      if (!product) return;
      const total = getProductMedia(product).length;
      switchCardImage(id, (current + 1) % total);
    });
  });

  document.querySelectorAll(".image-dot").forEach(dot => {
    dot.addEventListener("click", (e) => {
      e.stopPropagation();
      const container = dot.closest(".image-dots");
      const id = container.dataset.productId;
      const index = parseInt(dot.dataset.index);
      switchCardImage(id, index);
    });
  });

  document.querySelectorAll(".review-btn").forEach(btn => {
    btn.addEventListener("click", () => openReviewModal(btn.dataset.id));
  });
}

// ============================================
// REVIEW SYSTEM
// ============================================
async function openReviewModal(productId) {
  const product = products.find(p => p.id === productId);
  if (!product) return;

  let modal = document.getElementById("reviewModal");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "reviewModal";
    modal.className = "review-modal";
    document.body.appendChild(modal);
  }

  modal.innerHTML = `
    <div class="review-modal-content">
      <button class="review-modal-close" onclick="closeReviewModal()">✕</button>
      <h2>${product.name}</h2>
      <p class="review-subtitle">Share your experience with this product</p>

      <form class="review-form" id="reviewForm">
        <div class="form-group">
          <label>Your Name *</label>
          <input type="text" id="reviewName" required placeholder="Your name" style="width:100%;padding:12px 14px;border:1.5px solid #ede7df;border-radius:10px;font-size:14px;background:#fafafa;outline:none;font-family:inherit;" />
        </div>
        <div class="form-group">
          <label>Rating *</label>
          <div class="star-input" id="starInput">
            <span class="star" data-value="1">★</span>
            <span class="star" data-value="2">★</span>
            <span class="star" data-value="3">★</span>
            <span class="star" data-value="4">★</span>
            <span class="star" data-value="5">★</span>
          </div>
        </div>
        <div class="form-group">
          <label>Your Review *</label>
          <textarea id="reviewText" required placeholder="Write your review..."></textarea>
        </div>
        <button type="submit" class="btn-primary" style="width:100%;">Submit Review</button>
      </form>

      <div class="reviews-list" id="reviewsList">
        <h3>Customer Reviews</h3>
        <p class="no-reviews">Loading...</p>
      </div>
    </div>
  `;

  modal.classList.add("active");

  let selectedRating = 0;
  const stars = modal.querySelectorAll("#starInput .star");
  stars.forEach(star => {
    star.addEventListener("click", () => {
      selectedRating = parseInt(star.dataset.value);
      stars.forEach(s => {
        s.classList.toggle("active", parseInt(s.dataset.value) <= selectedRating);
      });
    });
    star.addEventListener("mouseenter", () => {
      const val = parseInt(star.dataset.value);
      stars.forEach(s => s.classList.toggle("active", parseInt(s.dataset.value) <= val));
    });
  });

  modal.querySelector("#starInput").addEventListener("mouseleave", () => {
    stars.forEach(s => s.classList.toggle("active", parseInt(s.dataset.value) <= selectedRating));
  });

  modal.querySelector("#reviewForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    if (selectedRating === 0) { alert("Please select a rating."); return; }
    const name = modal.querySelector("#reviewName").value.trim();
    const text = modal.querySelector("#reviewText").value.trim();
    try {
      await addDoc(collection(db, "reviews"), {
        productId: product.id,
        name,
        rating: selectedRating,
        text,
        createdAt: new Date().toISOString()
      });
      modal.querySelector("#reviewForm").reset();
      selectedRating = 0;
      stars.forEach(s => s.classList.remove("active"));
      alert("✅ Review submitted! Thank you.");
      loadReviews(product.id);
    } catch (err) {
      console.error(err);
      alert("Failed to submit review: " + (err.message || ""));
    }
  });

  loadReviews(product.id);
}

window.closeReviewModal = function () {
  const modal = document.getElementById("reviewModal");
  if (modal) modal.classList.remove("active");
};

async function loadReviews(productId) {
  const listEl = document.getElementById("reviewsList");
  if (!listEl) return;
  try {
    const q = query(collection(db, "reviews"), where("productId", "==", productId));
    const snapshot = await getDocs(q);
    let reviews = [];
    snapshot.forEach(d => reviews.push(d.data()));
    if (reviews.length === 0) {
      listEl.innerHTML = `<h3>Customer Reviews</h3><p class="no-reviews">No reviews yet. Be the first!</p>`;
      return;
    }
    reviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    let html = `<h3>Customer Reviews (${reviews.length})</h3>`;
    reviews.forEach(r => {
      const stars = "★".repeat(r.rating) + "☆".repeat(5 - r.rating);
      html += `
        <div class="review-item">
          <div class="review-header">
            <strong>${r.name}</strong>
            <span class="review-date">${new Date(r.createdAt).toLocaleDateString()}</span>
          </div>
          <div class="review-stars">${stars}</div>
          <p class="review-text">${r.text}</p>
        </div>
      `;
    });
    listEl.innerHTML = html;
  } catch (err) {
    console.error(err);
    listEl.innerHTML = `<h3>Customer Reviews</h3><p class="no-reviews">Failed to load reviews.</p>`;
  }
}

// ============================================
// WISHLIST PAGE
// ============================================
function renderWishlistPage() {
  const wishlistGrid = document.getElementById("wishlistGrid");
  if (!wishlistGrid) return;
  const emptyEl = document.getElementById("wishlistEmpty");

  if (wishlist.length === 0) {
    if (emptyEl) emptyEl.style.display = "block";
    wishlistGrid.innerHTML = "";
    return;
  }
  if (emptyEl) emptyEl.style.display = "none";
  wishlistGrid.innerHTML = "";

  wishlist.forEach(productId => {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    const images = product.images || (product.image ? [product.image] : []);
    const cover = images[0] || "https://via.placeholder.com/400?text=No+Image";
    const outOfStock = isOutOfStock(product);

    const card = document.createElement("div");
    card.classList.add("product-card");
    card.innerHTML = `
      <div class="product-image-wrap">
        <img src="${cover}" alt="${product.name}" class="product-image" data-product-id="${product.id}" onerror="this.src='https://via.placeholder.com/400x400?text=No+Image'" />
        <button class="wishlist-btn active" data-id="${product.id}" aria-label="Remove from wishlist">♥</button>
        ${outOfStock ? `<span style="position:absolute; bottom:10px; left:10px; background:#e03e3e; color:white; font-size:10px; padding:2px 8px; border-radius:10px; font-weight:600;">OUT OF STOCK</span>` : ''}
      </div>
      <div class="product-info">
        <p class="product-category">${product.category || ""}</p>
        <h3 class="product-name">${product.name}</h3>
        <p class="product-price">₹${Number(product.price).toFixed(2)}</p>
        ${outOfStock
          ? `<button class="add-to-cart" disabled style="background:#ccc; cursor:not-allowed;">Out of Stock</button>`
          : `<button class="add-to-cart" data-id="${product.id}">Add to Cart</button>`
        }
        <button class="review-btn" data-id="${product.id}">⭐ Reviews</button>
      </div>
    `;
    wishlistGrid.appendChild(card);
  });

  wishlistGrid.querySelectorAll(".wishlist-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const id = btn.dataset.id;
      toggleWishlist(id);
      renderWishlistPage();
    });
  });
  wishlistGrid.querySelectorAll(".add-to-cart").forEach(btn => {
    if (btn.disabled) return;
    btn.addEventListener("click", () => addToCart(btn.dataset.id));
  });
  wishlistGrid.querySelectorAll(".product-image").forEach(img => {
    img.addEventListener("click", () => {
      const productId = img.dataset.productId;
      const p = products.find(x => x.id === productId);
      if (!p) return;
      const mediaList = getProductMedia(p);
      openLightboxWithList(mediaList, 0);
    });
  });
  wishlistGrid.querySelectorAll(".review-btn").forEach(btn => {
    btn.addEventListener("click", () => openReviewModal(btn.dataset.id));
  });
}

// ============================================
// ADD TO CART
// ============================================
function addToCart(productId) {
  const product = products.find(p => p.id === productId);
  if (!product) return;
  if (isOutOfStock(product)) {
    alert("Sorry, this item is out of stock.");
    return;
  }
  const existing = cart.find(i => i.id === productId);
  if (existing) existing.quantity += 1;
  else cart.push({ id: productId, quantity: 1 });
  saveCart();
  updateCartCount();
  const btn = document.querySelector(`.add-to-cart[data-id="${productId}"]`);
  if (btn) {
    const orig = btn.textContent;
    btn.textContent = "✓ Added!";
    btn.style.background = "#c17a45";
    setTimeout(() => { btn.textContent = orig; btn.style.background = ""; }, 1200);
  }
}

// ============================================
// CART PAGE
// ============================================
function renderCartPage() {
  const cartItemsEl = document.getElementById("cartItems");
  if (!cartItemsEl) return;
  const emptyEl = document.getElementById("cartEmpty");
  const contentEl = document.getElementById("cartContent");

  if (cart.length === 0) {
    emptyEl.style.display = "flex";
    contentEl.style.display = "none";
    return;
  }
  emptyEl.style.display = "none";
  contentEl.style.display = "grid";
  cartItemsEl.innerHTML = "";
  let subtotal = 0;

  cart.forEach(item => {
    const product = products.find(p => p.id === item.id);
    if (!product) return;
    const line = product.price * item.quantity;
    subtotal += line;
    const cover = (product.images && product.images[0]) || product.image || "https://via.placeholder.com/90?text=?";
    const outOfStock = isOutOfStock(product);

    const row = document.createElement("div");
    row.classList.add("cart-item");
    row.innerHTML = `
      <img src="${cover}" alt="${product.name}" class="cart-item-image" onerror="this.src='https://via.placeholder.com/90x90?text=?'" />
      <div class="cart-item-info">
        <h3>${product.name}</h3>
        <p class="cart-item-category">${product.category || ""}</p>
        <p class="cart-item-price">₹${Number(product.price).toFixed(2)}</p>
        ${outOfStock ? `<p style="font-size:11px; color:#e03e3e; font-weight:700; margin-top:4px;">⚠️ Out of Stock</p>` : ''}
      </div>
      <div class="cart-item-qty">
        <button class="qty-btn" data-id="${product.id}" data-action="decrease">−</button>
        <span>${item.quantity}</span>
        <button class="qty-btn" data-id="${product.id}" data-action="increase" ${outOfStock ? 'disabled style="opacity:0.5; cursor:not-allowed;"' : ''}>+</button>
      </div>
      <div class="cart-item-total">₹${line.toFixed(2)}</div>
      <button class="remove-btn" data-id="${product.id}">✕</button>
    `;
    cartItemsEl.appendChild(row);
  });

  document.getElementById("subtotal").textContent = `₹${subtotal.toFixed(2)}`;
  document.getElementById("total").textContent = `₹${subtotal.toFixed(2)}`;
  attachCartEvents();
}

function attachCartEvents() {
  document.querySelectorAll(".qty-btn").forEach(btn => {
    if (btn.disabled) return;
    btn.addEventListener("click", () => {
      const id = btn.dataset.id;
      const action = btn.dataset.action;
      const item = cart.find(i => i.id === id);
      if (!item) return;
      const product = products.find(p => p.id === id);
      if (product && isOutOfStock(product)) {
        alert("This item is out of stock.");
        return;
      }
      if (action === "increase") item.quantity += 1;
      if (action === "decrease") item.quantity -= 1;
      if (item.quantity <= 0) cart = cart.filter(i => i.id !== id);
      saveCart();
      updateCartCount();
      renderCartPage();
    });
  });
  document.querySelectorAll(".remove-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      cart = cart.filter(i => i.id !== btn.dataset.id);
      saveCart();
      updateCartCount();
      renderCartPage();
    });
  });
  const checkoutBtn = document.getElementById("checkoutBtn");
  if (checkoutBtn) checkoutBtn.addEventListener("click", () => {
    window.location.href = "checkout.html";
  });
}

// ============================================
// CHECKOUT PAGE
// ============================================
function renderCheckoutPage() {
  const itemsEl = document.getElementById("checkoutItems");
  if (!itemsEl) return;
  if (cart.length === 0) { window.location.href = "cart.html"; return; }
  itemsEl.innerHTML = "";
  let subtotal = 0;
  cart.forEach(item => {
    const p = products.find(x => x.id === item.id);
    if (!p) return;
    const line = p.price * item.quantity;
    subtotal += line;
    const row = document.createElement("div");
    row.classList.add("checkout-item");
    row.innerHTML = `<span>${p.name} × ${item.quantity}</span><span>₹${line.toFixed(2)}</span>`;
    itemsEl.appendChild(row);
  });
  document.getElementById("subtotal").textContent = `₹${subtotal.toFixed(2)}`;
  document.getElementById("total").textContent = `₹${subtotal.toFixed(2)}`;
  document.getElementById("upiAmount").textContent = subtotal.toFixed(2);
  const upiLink = document.getElementById("upiLink");
  upiLink.href = `upi://pay?pa=${UPI_ID}&pn=RJ%20Fashion&am=${subtotal.toFixed(2)}&cu=INR&tn=Order%20Payment`;
  const form = document.getElementById("checkoutForm");
  form.addEventListener("submit", handleOrderSubmit);
}

window.copyUpi = function () {
  navigator.clipboard.writeText(UPI_ID).then(() => alert("✅ UPI ID copied!"));
};

async function handleOrderSubmit(e) {
  e.preventDefault();
  for (let item of cart) {
    const p = products.find(x => x.id === item.id);
    if (p && isOutOfStock(p)) {
      alert(`Sorry, "${p.name}" is out of stock. Please remove it from your cart.`);
      return;
    }
  }
  const order = {
    name: document.getElementById("fullName").value.trim(),
    email: document.getElementById("email").value.trim(),
    phone: document.getElementById("phone").value.trim(),
    address: document.getElementById("address").value.trim(),
    city: document.getElementById("city").value.trim(),
    postal: document.getElementById("postal").value.trim(),
    txnId: document.getElementById("txnId").value.trim(),
    items: cart.map(i => ({ id: i.id, quantity: i.quantity })),
    total: parseFloat(document.getElementById("total").textContent.replace("₹", "")),
    placedAt: new Date().toISOString(),
    status: "pending"
  };
  try {
    const docRef = await addDoc(collection(db, "orders"), order);
    localStorage.setItem("lastOrder", JSON.stringify({ id: docRef.id, ...order }));
    cart = [];
    saveCart();
    updateCartCount();
    window.location.href = "order-success.html";
  } catch (err) {
    console.error(err);
    alert("Something went wrong. Please try again.");
  }
}

// ============================================
// SUCCESS PAGE
// ============================================
function renderSuccessPage() {
  const orderIdEl = document.getElementById("orderId");
  if (!orderIdEl) return;
  const order = JSON.parse(localStorage.getItem("lastOrder"));
  if (!order) { window.location.href = "index.html"; return; }
  document.getElementById("orderId").textContent = order.id;
  document.getElementById("orderTotal").textContent = `₹${Number(order.total).toFixed(2)}`;
  document.getElementById("orderTxn").textContent = order.txnId || "—";
}

// ============================================
// START
// ============================================
async function startApp() {
  await loadProducts();
  applyCategoryFilter();
  renderProducts();
  updateCartCount();
  renderCartPage();
  renderWishlistPage();
  renderCheckoutPage();
  renderSuccessPage();
  setupCustomerAuth();
  setupFilterClear();
}

startApp();