import os
import re

BASE_DIR = r"C:\Users\omvin\.gemini\antigravity\scratch\RJ-Fashion-Collection"

def fix_app_js():
    path = os.path.join(BASE_DIR, "public", "js", "app.js")
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    # Define replacement for addToCart & helpers
    new_cart_code = '''// Resilient Product Resolver for Storefront, Cart, and Wishlist
async function resolveProductById(productId) {
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

  // 5. LocalStorage custom products (added via Admin or local session)
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

  // 7. Cloud Firestore
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

  // 8. Static /data/products.json
  try {
    const fbRes = await fetch('/data/products.json');
    if (fbRes.ok) {
      const fbData = await fbRes.json();
      const list = fbData.products || (Array.isArray(fbData) ? fbData : []);
      const found = list.find(p => p && (String(p.id) === pIdStr || String(p.slug) === pIdStr));
      if (found) return found;
    }
  } catch (_) {}

  // 9. Server API
  try {
    const apiRes = await fetch(`${API_BASE}/products/${encodeURIComponent(pIdStr)}`);
    if (apiRes.ok) {
      const apiData = await apiRes.json();
      if (apiData && apiData.success && apiData.product) {
        return apiData.product;
      }
    }
  } catch (_) {}

  // 10. DOM Card Fallback (Safety Net)
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

// Global Add to Cart
async function addToCart(productId, quantity = 1, size = 'Free Size') {
  if (productId === undefined || productId === null || productId === '') {
    showToast('Product ID is required', 'error');
    return false;
  }
  const qty = Math.max(1, parseInt(quantity, 10) || 1);
  const selectedSize = size || 'Free Size';

  // 1. Resolve product details across all sources
  const product = await resolveProductById(productId);

  // 2. Try server API first if running with backend
  let apiSuccess = false;
  try {
    const res = await fetch(`${API_BASE}/cart`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId, quantity: qty, size: selectedSize })
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.success) {
        apiSuccess = true;
      }
    }
  } catch (_) {}

  // 3. Always maintain and sync client-side cart (handles Firebase static hosting & offline)
  try {
    const local = JSON.parse(localStorage.getItem('rjfc_local_cart') || '[]');
    const existing = local.find(i => String(i.product_id) === String(productId) && i.size === selectedSize);

    if (existing) {
      existing.quantity = (Number(existing.quantity) || 1) + qty;
    } else {
      const pName = product ? (product.name || product.title) : `RJ Fashion Item (${productId})`;
      const pPrice = product ? Number(product.price) : 0;
      const pOrigPrice = product ? (Number(product.original_price) || pPrice) : pPrice;
      const pDiscount = product ? (Number(product.discount) || (pOrigPrice > pPrice ? Math.round(((pOrigPrice - pPrice) / pOrigPrice) * 100) : 0)) : 0;
      const pImage = product ? (product.image || (Array.isArray(product.images) ? product.images[0] : '/images/placeholder.jpg')) : '/images/placeholder.jpg';
      const pBrand = product ? (product.brand || 'RJ Collection') : 'RJ Collection';
      const pStock = product ? (Number(product.stock) || 99) : 99;

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
    localStorage.setItem('rjfc_local_cart', JSON.stringify(local));
    showToast('Added to cart!', 'success');
    updateCartCount();
    return true;
  } catch (err) {
    console.error('Local cart storage error:', err);
    if (apiSuccess) {
      showToast('Added to cart!', 'success');
      updateCartCount();
      return true;
    }
    showToast('Failed to add item to cart', 'error');
    return false;
  }
}'''

    # Pattern to find old addToCart function
    pattern = re.compile(r'// Global Add to Cart\s*async function addToCart\(productId,.*?\n}\n', re.DOTALL)
    if not pattern.search(content):
        print("Could not find addToCart pattern in app.js")
        return False
    
    content = pattern.sub(new_cart_code + "\n", content, count=1)
    
    with open(path, "w", encoding="utf-8", newline="\r\n") as f:
        f.write(content)
    print("Updated app.js successfully!")
    return True

def fix_products_js():
    path = os.path.join(BASE_DIR, "public", "js", "products.js")
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    # Quote onclick handlers in products.js
    replacements = [
        ('onclick="toggleWishlist(${p.id}, this)"', "onclick=\"toggleWishlist('${escapeHtml(String(p.id))}', this)\""),
        ('onclick="openQuickView(${p.id}, event)"', "onclick=\"openQuickView('${escapeHtml(String(p.id))}', event)\""),
        ('onclick="addToCart(${p.id})"', "onclick=\"addToCart('${escapeHtml(String(p.id))}')\""),
        ('onclick="quickBuy(${p.id})"', "onclick=\"quickBuy('${escapeHtml(String(p.id))}')\""),
        ('onclick="quickViewAddToCart(${p.id})"', "onclick=\"quickViewAddToCart('${escapeHtml(String(p.id))}')\""),
        ('onclick="quickViewBuyNow(${p.id})"', "onclick=\"quickViewBuyNow('${escapeHtml(String(p.id))}')\"")
    ]

    for old, new in replacements:
        if old in content:
            content = content.replace(old, new)
            print(f"Replaced {old[:30]} in products.js")
        else:
            print(f"Notice: {old[:30]} not found in products.js")

    with open(path, "w", encoding="utf-8", newline="\r\n") as f:
        f.write(content)
    print("Updated products.js successfully!")

def fix_wishlist_js():
    path = os.path.join(BASE_DIR, "public", "js", "wishlist.js")
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    replacements = [
        ('onclick="removeFromWishlist(${p.id})"', "onclick=\"removeFromWishlist('${escapeHtml(String(p.id))}')\""),
        ('onclick="moveToCartFromWishlist(${p.id})"', "onclick=\"moveToCartFromWishlist('${escapeHtml(String(p.id))}')\"")
    ]

    for old, new in replacements:
        if old in content:
            content = content.replace(old, new)
            print(f"Replaced {old[:30]} in wishlist.js")

    # In loadWishlist fallback, improve product lookup using resolveProductById
    old_fallback = '''      const savedIds = JSON.parse(localStorage.getItem('rjfc_wishlist') || '[]');
      if (savedIds.length === 0) {
        items = [];
      } else {
        const pRes = await fetch('/data/products.json');
        const pData = await pRes.json();
        const allProducts = pData.products || [];
        items = allProducts.filter(p => savedIds.some(id => String(id) === String(p.id)));
      }'''

    new_fallback = '''      const savedIds = JSON.parse(localStorage.getItem('rjfc_wishlist') || '[]');
      if (savedIds.length === 0) {
        items = [];
      } else {
        items = [];
        for (const sid of savedIds) {
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
            items = allProducts.filter(p => savedIds.some(id => String(id) === String(p.id)));
          } catch (_) {}
        }
      }'''

    if old_fallback in content:
        content = content.replace(old_fallback, new_fallback)
        print("Upgraded wishlist fallback to use resolveProductById!")

    with open(path, "w", encoding="utf-8", newline="\r\n") as f:
        f.write(content)
    print("Updated wishlist.js successfully!")

def fix_admin_js():
    path = os.path.join(BASE_DIR, "public", "js", "admin.js")
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    replacements = [
        ('onclick="quickAdjustStock(${p.id}, 10)"', "onclick=\"quickAdjustStock('${p.id}', 10)\""),
        ('onclick="quickAdjustStock(${p.id}, -1)"', "onclick=\"quickAdjustStock('${p.id}', -1)\""),
        ('onclick="quickAdjustStock(${p.id}, 1)"', "onclick=\"quickAdjustStock('${p.id}', 1)\""),
        ('onclick="toggleProductStock(${p.id}, ${p.stock})"', "onclick=\"toggleProductStock('${p.id}', ${p.stock})\""),
        ('onclick="quickUpdateStockPrompt(${p.id}, ${p.stock})"', "onclick=\"quickUpdateStockPrompt('${p.id}', ${p.stock})\""),
        ('onclick="openEditProductModal(${p.id})"', "onclick=\"openEditProductModal('${p.id}')\""),
        ('onclick="deleteProduct(${p.id})"', "onclick=\"deleteProduct('${p.id}')\""),
        ('onclick="adjustProductStock(${p.id}, -1)"', "onclick=\"adjustProductStock('${p.id}', -1)\""),
        ('onclick="adjustProductStock(${p.id}, 1)"', "onclick=\"adjustProductStock('${p.id}', 1)\""),
        ('onchange="setDirectProductStock(${p.id}, this.value)"', "onchange=\"setDirectProductStock('${p.id}', this.value)\""),
        ('onclick="toggleProductAvailability(${p.id})"', "onclick=\"toggleProductAvailability('${p.id}')\""),
        ('onclick="deleteCategory(${cat.id})"', "onclick=\"deleteCategory('${cat.id}')\""),
        ('onclick="deleteBanner(${b.id})"', "onclick=\"deleteBanner('${b.id}')\""),
        ('onclick="deletePromotion(${p.id})"', "onclick=\"deletePromotion('${p.id}')\""),
        ('onclick="toggleReviewVerification(${r.id}, ${r.verified ? 1 : 0})"', "onclick=\"toggleReviewVerification('${r.id}', ${r.verified ? 1 : 0})\"")
    ]

    for old, new in replacements:
        if old in content:
            content = content.replace(old, new)
            print(f"Replaced {old[:35]} in admin.js")

    with open(path, "w", encoding="utf-8", newline="\r\n") as f:
        f.write(content)
    print("Updated admin.js successfully!")

if __name__ == '__main__':
    fix_app_js()
    fix_products_js()
    fix_wishlist_js()
    fix_admin_js()
