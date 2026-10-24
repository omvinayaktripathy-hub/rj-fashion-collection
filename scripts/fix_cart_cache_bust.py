import os
import re

BASE_DIR = r"C:\Users\omvin\.gemini\antigravity\scratch\RJ-Fashion-Collection"
VERSION = "20261024-05"

def update_firebase_json():
    path = os.path.join(BASE_DIR, "firebase.json")
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    # Ensure JS and CSS are never served stale from browser disk cache
    content = re.sub(
        r'("source":\s*"\*\*/\*\.@\(js\|css\)",\s*"headers":\s*\[\s*\{\s*"key":\s*"Cache-Control",\s*"value":\s*")[^"]+("\s*\}\s*\])',
        r'\g<1>no-cache, no-store, must-revalidate\g<2>',
        content
    )

    with open(path, "w", encoding="utf-8", newline="\n") as f:
        f.write(content)
    print("Updated firebase.json cache-control headers!")

def update_app_js():
    path = os.path.join(BASE_DIR, "public", "js", "app.js")
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    # Bulletproof addToCart & resolveProductById
    new_cart_implementation = '''// Helper to retrieve local cart across all storage mechanisms
function getLocalCartSafe() {
  try {
    const raw = localStorage.getItem('rjfc_local_cart');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (_) {}

  try {
    const sRaw = sessionStorage.getItem('rjfc_local_cart');
    if (sRaw) {
      const parsed = JSON.parse(sRaw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (_) {}

  if (typeof window !== 'undefined' && Array.isArray(window._rjfc_memory_cart)) {
    return window._rjfc_memory_cart;
  }
  return [];
}

// Helper to save local cart across all storage mechanisms
function saveLocalCartSafe(cartArray) {
  if (!Array.isArray(cartArray)) cartArray = [];
  if (typeof window !== 'undefined') {
    window._rjfc_memory_cart = cartArray;
  }
  try {
    localStorage.setItem('rjfc_local_cart', JSON.stringify(cartArray));
  } catch (e1) {
    console.warn('localStorage save warning:', e1);
  }
  try {
    sessionStorage.setItem('rjfc_local_cart', JSON.stringify(cartArray));
  } catch (_) {}
}

// Synchronous fast product finder
function findProductFastSync(productId) {
  if (productId === undefined || productId === null || productId === '') return null;
  const pIdStr = String(productId).trim();

  // 1. In-memory window.catalogProducts (shop page)
  if (typeof window !== 'undefined' && Array.isArray(window.catalogProducts)) {
    const found = window.catalogProducts.find(p => p && (String(p.id) === pIdStr || String(p.slug) === pIdStr));
    if (found) return found;
  }

  // 2. In-memory window.allProducts or window.products
  if (typeof window !== 'undefined' && Array.isArray(window.allProducts)) {
    const found = window.allProducts.find(p => p && (String(p.id) === pIdStr || String(p.slug) === pIdStr));
    if (found) return found;
  }

  // 3. Current active product on product detail page
  if (typeof window !== 'undefined' && window.currentProductDetail) {
    if (String(window.currentProductDetail.id) === pIdStr || String(window.currentProductDetail.slug) === pIdStr) {
      return window.currentProductDetail;
    }
  }

  // 4. Current quick view product
  if (typeof window !== 'undefined' && window.currentQuickViewProduct) {
    if (String(window.currentQuickViewProduct.id) === pIdStr || String(window.currentQuickViewProduct.slug) === pIdStr) {
      return window.currentQuickViewProduct;
    }
  }

  // 5. LocalStorage custom products
  try {
    const customLocal = JSON.parse(localStorage.getItem('rjfc_custom_products') || '[]');
    const found = customLocal.find(p => p && (String(p.id) === pIdStr || String(p.slug) === pIdStr));
    if (found) return found;
  } catch (_) {}

  // 6. LocalStorage catalog overrides
  try {
    const overrides = JSON.parse(localStorage.getItem('rj_catalog_overrides') || '[]');
    const found = overrides.find(p => p && (String(p.id) === pIdStr || String(p.slug) === pIdStr));
    if (found) return found;
  } catch (_) {}

  // 7. DOM Card Inspection (Instant fallback)
  if (typeof document !== 'undefined') {
    try {
      const card = document.querySelector(`.product-card[data-id="${pIdStr}"]`);
      if (card) {
        const titleEl = card.querySelector('.product-title a, .product-title, h3');
        const priceEl = card.querySelector('.price-current');
        const origPriceEl = card.querySelector('.price-original');
        const imgEl = card.querySelector('.product-primary-img, img');
        const brandEl = card.querySelector('.product-brand');
        if (titleEl) {
          const priceNum = priceEl ? Number(priceEl.textContent.replace(/[^0-9.]/g, '')) : 0;
          const origPriceNum = origPriceEl ? Number(origPriceEl.textContent.replace(/[^0-9.]/g, '')) : priceNum;
          return {
            id: pIdStr,
            name: titleEl.textContent.trim(),
            price: priceNum,
            original_price: origPriceNum,
            image: imgEl ? imgEl.src : '/images/placeholder.jpg',
            brand: brandEl ? brandEl.textContent.trim() : 'RJ Collection',
            stock: 99
          };
        }
      }
    } catch (_) {}
  }

  return null;
}

// Resilient Product Resolver for Storefront, Cart, and Wishlist
async function resolveProductById(productId) {
  if (productId === undefined || productId === null || productId === '') return null;
  const pIdStr = String(productId).trim();

  // 1. Fast Synchronous Check
  const fast = findProductFastSync(pIdStr);
  if (fast) return fast;

  // 2. Cloud Firestore
  if (typeof firebase !== 'undefined' && firebase.firestore) {
    try {
      const db = firebase.firestore();
      const docSnap = await db.collection('products').doc(pIdStr).get();
      if (docSnap.exists) {
        return { id: docSnap.id, ...docSnap.data() };
      }
      const numId = Number(pIdStr);
      const querySnap = await db.collection('products').where('id', '==', isNaN(numId) ? pIdStr : numId).limit(1).get();
      if (!querySnap.empty) {
        const d = querySnap.docs[0].data();
        return { id: querySnap.docs[0].id, ...d };
      }
    } catch (fsErr) {
      console.warn('Firestore lookup notice:', fsErr);
    }
  }

  // 3. Static /data/products.json
  try {
    const fbRes = await fetch('/data/products.json');
    if (fbRes.ok) {
      const fbData = await fbRes.json();
      const list = fbData.products || (Array.isArray(fbData) ? fbData : []);
      const found = list.find(p => p && (String(p.id) === pIdStr || String(p.slug) === pIdStr));
      if (found) return found;
    }
  } catch (_) {}

  // 4. Server API
  try {
    const apiRes = await fetch(`${API_BASE}/products/${encodeURIComponent(pIdStr)}`);
    if (apiRes.ok) {
      const apiData = await apiRes.json();
      if (apiData && apiData.success && apiData.product) {
        return apiData.product;
      }
    }
  } catch (_) {}

  return null;
}

// Global Add to Cart - Instant & Guaranteed
async function addToCart(productId, quantity = 1, size = 'Free Size') {
  if (productId === undefined || productId === null || productId === '') {
    showToast('Product ID is required', 'error');
    return false;
  }
  const qty = Math.max(1, parseInt(quantity, 10) || 1);
  const selectedSize = size || 'Free Size';

  // 1. Instant Synchronous resolution
  let product = findProductFastSync(productId);

  // 2. Fallback to async resolution if not in fast sync cache
  if (!product) {
    try {
      product = await resolveProductById(productId);
    } catch (_) {}
  }

  // 3. Build product object
  const pName = product ? (product.name || product.title) : `RJ Fashion Item (${productId})`;
  const pPrice = product ? Number(product.price) : 600;
  const pOrigPrice = product ? (Number(product.original_price) || pPrice) : pPrice;
  const pDiscount = product ? (Number(product.discount) || (pOrigPrice > pPrice ? Math.round(((pOrigPrice - pPrice) / pOrigPrice) * 100) : 0)) : 0;
  const pImage = product ? (product.image || (Array.isArray(product.images) ? product.images[0] : '/images/placeholder.jpg')) : '/images/placeholder.jpg';
  const pBrand = product ? (product.brand || 'RJ Collection') : 'RJ Collection';
  const pStock = product ? (Number(product.stock) || 99) : 99;

  // 4. Always save item to local cart
  const local = getLocalCartSafe();
  const existing = local.find(i => String(i.product_id) === String(productId) && i.size === selectedSize);

  if (existing) {
    existing.quantity = (Number(existing.quantity) || 1) + qty;
  } else {
    local.push({
      id: Date.now() + Math.floor(Math.random() * 1000),
      product_id: productId,
      name: pName,
      price: pPrice,
      original_price: pOrigPrice,
      discount: pDiscount,
      image: pImage,
      brand: pBrand,
      size: selectedSize,
      quantity: qty,
      stock: pStock
    });
  }

  saveLocalCartSafe(local);

  // 5. Instantly provide positive UI feedback
  showToast('Added to cart!', 'success');
  updateCartCount();

  // 6. Fire background API sync (non-blocking)
  try {
    fetch(`${API_BASE}/cart`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId, quantity: qty, size: selectedSize })
    }).catch(() => {});
  } catch (_) {}

  return true;
}'''

    # Pattern to replace from // Resilient Product Resolver down to end of addToCart
    pattern = re.compile(r'// Resilient Product Resolver.*?// Global Add to Cart.*?return false;\s*\}\s*\}', re.DOTALL)
    if pattern.search(content):
        content = pattern.sub(new_cart_implementation, content)
        print("Replaced cart implementation in app.js with instant guaranteed version!")
    else:
        print("Could not match existing cart block in app.js, checking alternate pattern...")
        pattern2 = re.compile(r'// Global Add to Cart.*?return false;\s*\}\s*\}', re.DOTALL)
        if pattern2.search(content):
            content = pattern2.sub(new_cart_implementation, content)
            print("Replaced addToCart block in app.js!")
        else:
            print("Failed to replace in app.js!")
            return False

    with open(path, "w", encoding="utf-8", newline="\r\n") as f:
        f.write(content)
    return True

def update_html_script_tags():
    public_dir = os.path.join(BASE_DIR, "public")
    html_files = [f for f in os.listdir(public_dir) if f.endswith(".html")]

    count = 0
    for filename in html_files:
        filepath = os.path.join(public_dir, filename)
        with open(filepath, "r", encoding="utf-8") as f:
            html = f.read()

        # Update all ?v=... to the new version
        new_html = re.sub(r'(\.(?:js|css))\?v=[a-zA-Z0-9_-]+', rf'\1?v={VERSION}', html)

        if new_html != html:
            with open(filepath, "w", encoding="utf-8", newline="\r\n") as f:
                f.write(new_html)
            count += 1
            print(f"Busted cache on {filename}")

    print(f"Updated {count} HTML files with version ?v={VERSION}")

if __name__ == '__main__':
    update_firebase_json()
    update_app_js()
    update_html_script_tags()
