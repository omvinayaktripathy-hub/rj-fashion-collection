import React, { useState, useMemo, useCallback, useContext, useEffect } from 'react';
import { StoreContext } from '../context';
import { Heart, ShoppingBag, Zap, Eye, Star, Check } from 'lucide-react';

/* =========================================================================
   HELPER FUNCTIONS
   ========================================================================= */

function formatIndianPrice(amount) {
  if (typeof amount !== 'number' || isNaN(amount)) return '₹0';
  return '₹' + Math.round(amount).toLocaleString('en-IN');
}

function parseSizesList(sizesInput) {
  if (!sizesInput) return [];
  if (Array.isArray(sizesInput)) {
    return sizesInput.map(s => String(s).replace(/\s*\(.*\)/, '').trim()).filter(Boolean);
  }
  if (typeof sizesInput === 'string') {
    const trimmed = sizesInput.trim();
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          return parsed.map(s => String(s).replace(/\s*\(.*\)/, '').trim()).filter(Boolean);
        }
      } catch (_) {}
    }
    return trimmed.split(',').map(s => s.replace(/\s*\(.*\)/, '').trim()).filter(Boolean);
  }
  return [];
}

function parseHoverImage(p) {
  if (!p || !p.additional_images) return null;
  let imgs = [];
  if (Array.isArray(p.additional_images)) {
    imgs = p.additional_images;
  } else if (typeof p.additional_images === 'string' && p.additional_images.startsWith('[')) {
    try {
      imgs = JSON.parse(p.additional_images);
    } catch (_) {}
  }
  if (imgs.length > 1 && imgs[1] && imgs[1] !== p.image) return imgs[1];
  if (imgs.length > 0 && imgs[0] && imgs[0] !== p.image) return imgs[0];
  return null;
}

/* =========================================================================
   PRODUCT CARD COMPONENT (REACT + TAILWIND CSS)
   ========================================================================= */

export const ProductCard = ({
  product,
  onAddToCart,
  onBuyNow,
  onWishlistToggle,
  onQuickView,
  isWishlisted: initialWishlisted = false,
  checkoutUrl = '/checkout',
  cartUrl = '/cart',
  className = '',
  showQuickView = true,
  showRating = true,
}) => {
  if (!product) return null;

  // Available size variants
  const parsedSizes = useMemo(() => parseSizesList(product.available_sizes), [product.available_sizes]);
  const defaultSize = parsedSizes.length > 0 ? parsedSizes[0] : 'Free Size';

  const store = useContext(StoreContext);

  // State
  const [selectedSize, setSelectedSize] = useState(defaultSize);

  const isProductInWishlist = useMemo(() => {
    if (store) {
      return store.isInWishlist(product.id);
    }
    if (typeof window !== 'undefined') {
      try {
        const primary = localStorage.getItem('rj_fashion_wishlist');
        if (primary) {
          const parsed = JSON.parse(primary);
          if (Array.isArray(parsed) && parsed.some(p => String(p.id || p) === String(product.id))) {
            return true;
          }
        }
        const legacy = localStorage.getItem('rjfc_wishlist');
        if (legacy) {
          const parsed = JSON.parse(legacy);
          if (Array.isArray(parsed) && parsed.some(p => String(p.id || p) === String(product.id))) {
            return true;
          }
        }
      } catch (_) {}
    }
    return initialWishlisted;
  }, [store, product.id, initialWishlisted]);

  const [isWishlisted, setIsWishlisted] = useState(isProductInWishlist);

  useEffect(() => {
    setIsWishlisted(isProductInWishlist);
  }, [isProductInWishlist]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleSync = () => {
      if (store) {
        setIsWishlisted(store.isInWishlist(product.id));
      } else {
        try {
          const primary = localStorage.getItem('rj_fashion_wishlist');
          if (primary) {
            const parsed = JSON.parse(primary);
            setIsWishlisted(Array.isArray(parsed) && parsed.some(p => String(p.id || p) === String(product.id)));
            return;
          }
          const legacy = localStorage.getItem('rjfc_wishlist');
          if (legacy) {
            const parsed = JSON.parse(legacy);
            setIsWishlisted(Array.isArray(parsed) && parsed.some(p => String(p.id || p) === String(product.id)));
          }
        } catch (_) {}
      }
    };
    window.addEventListener('wishlist-updated', handleSync);
    window.addEventListener('rjfc_wishlist_updated', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('wishlist-updated', handleSync);
      window.removeEventListener('rjfc_wishlist_updated', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, [store, product.id]);
  const [isAdding, setIsAdding] = useState(false);
  const [isBuying, setIsBuying] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  // Derived attributes
  const isOutOfStock = (product.stock ?? 1) <= 0;
  const isLowStock = !isOutOfStock && (product.stock ?? 99) <= 4;
  const hoverImage = useMemo(() => parseHoverImage(product), [product]);
  const hasDiscount = (product.discount && product.discount > 0) ||
    (product.original_price && product.original_price > product.price);
  const discountPercent = product.discount ||
    (product.original_price && product.original_price > product.price
      ? Math.round(((product.original_price - product.price) / product.original_price) * 100)
      : 0);

  // Handle Wishlist Toggle
  const handleWishlistClick = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    const nextState = !isWishlisted;
    setIsWishlisted(nextState);

    if (store) {
      store.toggleWishlist(product);
    } else if (typeof window !== 'undefined') {
      try {
        let items = [];
        try {
          items = JSON.parse(localStorage.getItem('rj_fashion_wishlist') || '[]');
        } catch (_) {}
        if (!Array.isArray(items)) items = [];

        if (nextState) {
          if (!items.some(i => String(i.id || i) === String(product.id))) {
            items.push(product);
          }
        } else {
          items = items.filter(i => String(i.id || i) !== String(product.id));
        }

        const json = JSON.stringify(items);
        localStorage.setItem('rj_fashion_wishlist', json);
        try { sessionStorage.setItem('rj_fashion_wishlist', json); } catch (_) {}

        // Mirror legacy keys
        const idList = items.map(i => String(i.id || i));
        localStorage.setItem('rjfc_wishlist', JSON.stringify(idList));
        localStorage.setItem('rjfc_react_wishlist', json);

        window.dispatchEvent(new Event('wishlist-updated'));
        window.dispatchEvent(new CustomEvent('rjfc_wishlist_updated', { detail: { items } }));
        window.dispatchEvent(new Event('storage'));

        if (typeof window.showToast === 'function') {
          window.showToast(
            nextState ? 'Added to Your Saved Collection' : 'Removed from Wishlist',
            nextState ? 'success' : 'info'
          );
        }
        if (typeof window.updateWishlistCount === 'function') {
          window.updateWishlistCount();
        }
      } catch (_) {}
    }

    if (onWishlistToggle) {
      onWishlistToggle(product, nextState);
    }
  }, [isWishlisted, store, product, onWishlistToggle]);

  // Handle Quick View
  const handleQuickViewClick = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (onQuickView) {
      onQuickView(product);
    } else if (typeof window !== 'undefined' && window.openQuickView) {
      window.openQuickView(product.id, e);
    } else if (typeof window !== 'undefined') {
      window.location.href = `/product.html?id=${product.id}`;
    }
  }, [onQuickView, product]);

  // Handle ADD TO BAG
  const handleAddToCart = useCallback(async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOutOfStock || isAdding) return;

    setIsAdding(true);
    const sizeToUse = selectedSize || defaultSize;

    try {
      if (onAddToCart) {
        await onAddToCart(product, sizeToUse);
      } else if (typeof window !== 'undefined' && window.addToCart) {
        await window.addToCart(product.id, 1, sizeToUse);
      } else if (typeof window !== 'undefined') {
        const raw = localStorage.getItem('rjfc_cart') || localStorage.getItem('rjfc_local_cart') || localStorage.getItem('rjfc_react_cart');
        const cart = raw ? JSON.parse(raw) : [];
        const existing = cart.find((i) => String(i.product_id) === String(product.id) && i.size === sizeToUse);
        if (existing) {
          existing.quantity = (existing.quantity || 1) + 1;
        } else {
          cart.push({
            id: Date.now(),
            product_id: product.id,
            cart_id: `cart_${Date.now()}_${product.id}`,
            name: product.name,
            price: product.price,
            original_price: product.original_price || product.price,
            discount: discountPercent,
            image: product.image,
            brand: product.brand || 'RJ Collection',
            size: sizeToUse,
            quantity: 1,
            stock: product.stock ?? 99
          });
        }
        const json = JSON.stringify(cart);
        ['rjfc_cart', 'rjfc_local_cart', 'rjfc_react_cart'].forEach((k) => {
          localStorage.setItem(k, json);
          try { sessionStorage.setItem(k, json); } catch (_) {}
        });
        window.dispatchEvent(new CustomEvent('rjfc_cart_updated', { detail: { items: cart } }));
        window.dispatchEvent(new Event('storage'));
        if (typeof window.updateCartCount === 'function') {
          window.updateCartCount();
        }
      }

      setJustAdded(true);
      setTimeout(() => setJustAdded(false), 1800);
    } catch (err) {
      console.error('Failed to add to cart:', err);
    } finally {
      setIsAdding(false);
    }
  }, [isOutOfStock, isAdding, selectedSize, defaultSize, onAddToCart, product, discountPercent]);

  // Handle BUY NOW - Direct Checkout Flow
  const handleBuyNow = useCallback(async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOutOfStock || isBuying) return;

    setIsBuying(true);
    const sizeToUse = selectedSize || defaultSize;

    try {
      // 1. Invoke custom onBuyNow handler if provided
      if (onBuyNow) {
        await onBuyNow(product, sizeToUse);
        return;
      }

      // 2. Automatically add the item directly to active cart session
      if (typeof window !== 'undefined' && window.addToCart) {
        await window.addToCart(product.id, 1, sizeToUse);
      } else if (typeof window !== 'undefined') {
        const raw = localStorage.getItem('rjfc_cart') || localStorage.getItem('rjfc_local_cart') || localStorage.getItem('rjfc_react_cart');
        const cart = raw ? JSON.parse(raw) : [];
        const existing = cart.find((i) => String(i.product_id) === String(product.id) && i.size === sizeToUse);
        if (existing) {
          existing.quantity = (existing.quantity || 1) + 1;
        } else {
          cart.push({
            id: Date.now(),
            product_id: product.id,
            cart_id: `cart_${Date.now()}_${product.id}`,
            name: product.name,
            price: product.price,
            original_price: product.original_price || product.price,
            discount: discountPercent,
            image: product.image,
            brand: product.brand || 'RJ Collection',
            size: sizeToUse,
            quantity: 1,
            stock: product.stock ?? 99
          });
        }
        const json = JSON.stringify(cart);
        ['rjfc_cart', 'rjfc_local_cart', 'rjfc_react_cart'].forEach((k) => {
          localStorage.setItem(k, json);
          try { sessionStorage.setItem(k, json); } catch (_) {}
        });
        window.dispatchEvent(new CustomEvent('rjfc_cart_updated', { detail: { items: cart } }));
        window.dispatchEvent(new Event('storage'));
        if (typeof window.updateCartCount === 'function') {
          window.updateCartCount();
        }
      }

      // 3. Immediately redirect user straight to the checkout/cart page for instant payment
      if (typeof window !== 'undefined') {
        const targetUrl = checkoutUrl.endsWith('.html') || checkoutUrl.startsWith('/')
          ? checkoutUrl
          : `${checkoutUrl}.html`;
        window.location.href = targetUrl;
      }
    } catch (err) {
      console.error('Buy Now checkout error:', err);
      setIsBuying(false);
    }
  }, [isOutOfStock, isBuying, selectedSize, defaultSize, onBuyNow, product, discountPercent, checkoutUrl]);

  return (
    <article
      data-id={product.id}
      className={`group relative flex flex-col justify-between bg-white dark:bg-[#141418] border border-neutral-200/80 dark:border-neutral-800 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-[#C5A880]/50 pb-4 h-full ${isOutOfStock ? 'opacity-85' : ''} ${className}`}
    >
      {/* ================= TOP MEDIA SECTION ================= */}
      <div className="relative w-full aspect-[4/5] bg-[#F7F4F0] dark:bg-neutral-900 overflow-hidden">
        {/* Product Image Link */}
        <a
          href={`/product.html?id=${product.id}`}
          className="block w-full h-full relative overflow-hidden"
          title={product.name}
        >
          {/* Primary Image */}
          <img
            src={product.image}
            alt={product.name}
            loading="lazy"
            className={`w-full h-full object-cover transition-all duration-700 ease-out group-hover:scale-105 ${
              hoverImage ? 'group-hover:opacity-0' : ''
            }`}
            onError={(e) => {
              e.currentTarget.src =
                'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=600&q=80';
            }}
          />

          {/* Secondary Hover Flip Image */}
          {hoverImage && (
            <img
              src={hoverImage}
              alt={`${product.name} alternate angle`}
              loading="lazy"
              className="absolute inset-0 w-full h-full object-cover opacity-0 transition-opacity duration-500 ease-out group-hover:opacity-100 group-hover:scale-105"
            />
          )}
        </a>

        {/* Discount Badge */}
        {hasDiscount && discountPercent > 0 && (
          <span className="absolute top-3 left-3 bg-red-600 text-white text-[10px] font-bold tracking-wider px-2.5 py-0.5 rounded-full uppercase shadow-sm">
            {discountPercent}% OFF
          </span>
        )}

        {/* Stock / Sold Out Badge */}
        {isOutOfStock ? (
          <span className="absolute top-3 right-12 bg-neutral-900/90 text-white text-[9px] font-bold tracking-wider px-2 py-0.5 rounded-full uppercase backdrop-blur-sm">
            Sold Out
          </span>
        ) : isLowStock ? (
          <span className="absolute top-3 right-12 bg-amber-600/90 text-white text-[9px] font-bold tracking-wider px-2 py-0.5 rounded-full uppercase backdrop-blur-sm">
            Only {product.stock} left
          </span>
        ) : null}

        {/* Wishlist Button */}
        <button
          type="button"
          onClick={handleWishlistClick}
          aria-label={isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
          className={`absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 shadow-sm backdrop-blur-md z-10 ${
            isWishlisted
              ? 'bg-rose-50 dark:bg-rose-950/80 text-rose-600'
              : 'bg-white/85 dark:bg-neutral-900/85 text-neutral-700 hover:text-black dark:text-neutral-300 dark:hover:text-white hover:scale-110'
          }`}
        >
          <Heart
            className={`w-4 h-4 transition-transform duration-200 ${
              isWishlisted ? 'fill-rose-600 text-rose-600 scale-110' : 'text-neutral-700 hover:text-black'
            }`}
          />
        </button>

        {/* Quick View Button (Desktop Hover Overlay) */}
        {showQuickView && (
          <button
            type="button"
            onClick={handleQuickViewClick}
            className="absolute bottom-3 inset-x-3 hidden sm:flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-white/95 dark:bg-neutral-900/95 text-neutral-900 dark:text-neutral-100 text-[11px] font-semibold tracking-wider uppercase backdrop-blur-md shadow-md opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-[#C5A880] hover:text-white"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Quick View</span>
          </button>
        )}
      </div>

      {/* ================= PRODUCT DETAILS ================= */}
      <div className="flex flex-col flex-1 px-4 pt-3.5">
        {/* Brand & Stock Status Row */}
        <div className="flex items-center justify-between text-[11px] uppercase tracking-wider mb-1.5">
          <span className="font-semibold text-neutral-400 dark:text-neutral-500">
            {product.brand || 'RJ COLLECTION'}
          </span>
          {isOutOfStock ? (
            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-rose-600 dark:text-rose-400">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              Sold Out
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              In Stock
            </span>
          )}
        </div>

        {/* Product Title */}
        <h3 className="font-serif text-[15px] font-semibold text-neutral-900 dark:text-neutral-100 line-clamp-2 leading-snug min-h-[42px] mb-2">
          <a
            href={`/product.html?id=${product.id}`}
            title={product.name}
            className="hover:text-[#C5A880] transition-colors"
          >
            {product.name}
          </a>
        </h3>

        {/* Available Sizes Chip Selector */}
        {parsedSizes.length > 0 && (
          <div className="flex items-center gap-1.5 mb-2.5 flex-wrap" title="Select size">
            {parsedSizes.slice(0, 4).map((size) => {
              const isSelected = selectedSize === size;
              return (
                <button
                  key={size}
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setSelectedSize(size);
                  }}
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded transition-all ${
                    isSelected
                      ? 'bg-neutral-900 text-white dark:bg-[#C5A880] dark:text-neutral-950 shadow-xs'
                      : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                  }`}
                >
                  {size}
                </button>
              );
            })}
          </div>
        )}

        {/* Rating Row */}
        {showRating && (
          <div className="flex items-center gap-1.5 mb-2 text-xs">
            <span className="inline-flex items-center gap-1 font-bold text-amber-600 dark:text-amber-500">
              <Star className="w-3.5 h-3.5 fill-amber-500 stroke-amber-500" />
              {product.rating ? Number(product.rating).toFixed(1) : '4.8'}
            </span>
            <span className="text-neutral-400 text-[11px]">
              ({product.reviews_count || 32})
            </span>
          </div>
        )}

        {/* Price Row */}
        <div className="flex items-baseline gap-2 mb-3">
          <span className="text-base font-bold text-neutral-900 dark:text-white font-mono tracking-tight">
            {formatIndianPrice(product.price)}
          </span>
          {product.original_price && product.original_price > product.price && (
            <span className="text-xs text-neutral-400 line-through font-mono">
              {formatIndianPrice(product.original_price)}
            </span>
          )}
          {hasDiscount && discountPercent > 0 && (
            <span className="text-[11px] font-bold text-red-600 dark:text-red-400">
              {discountPercent}% OFF
            </span>
          )}
        </div>

        {/* ================= DUAL ACTION BUTTON CONTAINER ================= */}
        {/* Core Requirement 1 & 3: Balanced side-by-side buttons with clean responsive layout */}
        <div className="flex items-center gap-2 mt-auto pt-2 border-t border-neutral-100 dark:border-neutral-800">
          {/* Button 1: "ADD TO BAG" (Secondary / Outline style) */}
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={isOutOfStock || isAdding}
            title={isOutOfStock ? 'Item is out of stock' : 'Add to Shopping Bag'}
            className="border border-neutral-900 text-neutral-900 bg-transparent hover:bg-neutral-100 dark:border-neutral-300 dark:text-neutral-100 dark:hover:bg-neutral-800 text-[11px] font-semibold tracking-wider py-2.5 px-3 rounded-lg flex-1 transition-all flex items-center justify-center gap-1.5 uppercase disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {justAdded ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-600">ADDED</span>
              </>
            ) : isAdding ? (
              <span className="animate-pulse">ADDING...</span>
            ) : (
              <>
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>{isOutOfStock ? 'OUT OF STOCK' : 'ADD TO BAG'}</span>
              </>
            )}
          </button>

          {/* Button 2: "BUY NOW" (Primary / High-Intent style) */}
          <button
            type="button"
            onClick={handleBuyNow}
            disabled={isOutOfStock || isBuying}
            title={isOutOfStock ? 'Item is out of stock' : 'Proceed directly to checkout'}
            className="bg-[#111111] dark:bg-neutral-100 text-white dark:text-[#111111] hover:bg-neutral-800 dark:hover:bg-neutral-200 text-[11px] font-semibold tracking-wider py-2.5 px-3 rounded-lg flex-1 transition-all shadow-sm flex items-center justify-center gap-1.5 uppercase disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {isBuying ? (
              <span className="animate-pulse">CHECKOUT...</span>
            ) : (
              <>
                <Zap className="w-3.5 h-3.5 fill-current" />
                <span>BUY NOW</span>
              </>
            )}
          </button>
        </div>
      </div>
    </article>
  );
};

export default ProductCard;
