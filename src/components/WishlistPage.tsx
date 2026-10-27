import React, { useState, useMemo, useEffect, useContext, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart,
  ShoppingBag,
  Trash2,
  ArrowRight,
  Sparkles,
  AlertCircle,
  X,
  Check
} from 'lucide-react';
import { StoreContext, ProductItem } from '../context';

/* =========================================================================
   TYPE DEFINITIONS
   ========================================================================= */

export type WishlistCategory =
  | 'all'
  | 'sarees'
  | 'dresses'
  | 'jewelry'
  | 'accessories'
  | 'sale';

export type WishlistSort =
  | 'recent'
  | 'price_asc'
  | 'price_desc'
  | 'discount';

export interface WishlistProduct {
  id: string | number;
  name: string;
  brand?: string;
  category: string;
  categoryLabel?: string;
  price: number;
  originalPrice?: number;
  original_price?: number;
  discount?: number;
  stock: number;
  image: string;
  secondaryImage?: string;
  additional_images?: string[] | string;
  availableSizes?: string[];
  available_sizes?: string[] | string;
  selectedSize?: string;
  badge?: string;
  addedAt?: string;
}

export interface WishlistPageProps {
  initialItems?: WishlistProduct[];
  onMoveToCart?: (product: WishlistProduct, size: string) => void;
  onRemoveItem?: (productId: string | number) => void;
  onMoveAllToCart?: (products: WishlistProduct[]) => void;
  onClearAll?: () => void;
  onExploreCatalog?: () => void;
  onAddToCart?: (product: ProductItem, size?: string) => void;
}

/* =========================================================================
   HELPER UTILITIES
   ========================================================================= */

function formatIndianPrice(amount: number): string {
  if (typeof amount !== 'number' || isNaN(amount)) return '₹0';
  return '₹' + Math.round(amount).toLocaleString('en-IN');
}

function parseSizesList(sizesInput?: string[] | string): string[] {
  if (!sizesInput) return ['Free Size'];
  if (Array.isArray(sizesInput)) {
    const list = sizesInput.map(s => String(s).replace(/\s*\(.*\)/, '').trim()).filter(Boolean);
    return list.length > 0 ? list : ['Free Size'];
  }
  if (typeof sizesInput === 'string') {
    const trimmed = sizesInput.trim();
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          const list = parsed.map(s => String(s).replace(/\s*\(.*\)/, '').trim()).filter(Boolean);
          return list.length > 0 ? list : ['Free Size'];
        }
      } catch (_) {}
    }
    const list = trimmed.split(',').map(s => s.replace(/\s*\(.*\)/, '').trim()).filter(Boolean);
    return list.length > 0 ? list : ['Free Size'];
  }
  return ['Free Size'];
}

function normalizeWishlistProduct(item: any, idx = 0): WishlistProduct | null {
  if (!item) return null;
  if (typeof item === 'string' || typeof item === 'number') {
    return {
      id: item,
      name: `Artisanal Ensemble #${item}`,
      brand: 'RJ COLLECTION',
      category: 'sarees',
      categoryLabel: 'Sarees & Couture',
      price: 2999,
      originalPrice: 4999,
      original_price: 4999,
      discount: 40,
      stock: 5,
      image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80',
      availableSizes: ['Free Size'],
      selectedSize: 'Free Size'
    };
  }

  const pId = item.id || item.product_id || `wish_${idx + 1}`;
  const price = Number(item.price) || 0;
  const originalPrice = Number(item.originalPrice || item.original_price || price);
  const discount = Number(item.discount) || (originalPrice > price ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0);
  const sizes = parseSizesList(item.availableSizes || item.available_sizes);
  const cat = String(item.category || item.category_name || item.department || 'sarees').toLowerCase();

  return {
    id: pId,
    name: item.name || item.title || 'Artisanal Ensemble',
    brand: item.brand || 'RJ COLLECTION',
    category: cat.includes('saree') ? 'sarees' : cat.includes('jewel') ? 'jewelry' : cat.includes('dress') || cat.includes('kurti') ? 'dresses' : 'accessories',
    categoryLabel: item.categoryLabel || item.category || 'Luxury Couture',
    price,
    originalPrice,
    original_price: originalPrice,
    discount,
    stock: item.stock !== undefined ? Number(item.stock) : 5,
    image: item.image || item.thumbnail || (Array.isArray(item.images) && item.images[0]) || 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80',
    secondaryImage: item.secondaryImage || (Array.isArray(item.additional_images) && item.additional_images[0]),
    availableSizes: sizes,
    selectedSize: item.selectedSize || sizes[0] || 'Free Size',
    badge: item.badge || (discount >= 30 ? 'Sale' : undefined),
    addedAt: item.addedAt || new Date().toISOString()
  };
}

function readLocalWishlistFallback(): WishlistProduct[] {
  if (typeof window === 'undefined') return [];
  const keys = ['rj_fashion_wishlist', 'rjfc_wishlist', 'rjfc_react_wishlist', 'wishlist'];
  for (const k of keys) {
    try {
      const raw = localStorage.getItem(k);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const list = parsed.map(normalizeWishlistProduct).filter(Boolean) as WishlistProduct[];
          if (list.length > 0) return list;
        }
      }
    } catch (_) {}
  }
  return [];
}

/* =========================================================================
   MAIN COMPONENT: WishlistPage
   ========================================================================= */

export const WishlistPage: React.FC<WishlistPageProps> = ({
  initialItems,
  onMoveToCart,
  onRemoveItem,
  onMoveAllToCart,
  onClearAll,
  onExploreCatalog,
  onAddToCart,
}) => {
  const store = useContext(StoreContext);

  // Sync internal items from StoreContext or storage fallback
  const resolveCurrentItems = useCallback((): WishlistProduct[] => {
    if (store && Array.isArray(store.wishlist)) {
      return store.wishlist.map(normalizeWishlistProduct).filter(Boolean) as WishlistProduct[];
    }
    if (initialItems && initialItems.length > 0) {
      return initialItems;
    }
    return readLocalWishlistFallback();
  }, [store, initialItems]);

  const [items, setItems] = useState<WishlistProduct[]>(resolveCurrentItems);
  const [activeCategory, setActiveCategory] = useState<WishlistCategory>('all');
  const [activeSort, setActiveSort] = useState<WishlistSort>('recent');
  const [selectedSizes, setSelectedSizes] = useState<Record<string | number, string>>({});
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [movingIds, setMovingIds] = useState<Record<string | number, boolean>>({});

  // Sync with store wishlist changes
  useEffect(() => {
    if (store && Array.isArray(store.wishlist)) {
      setItems(store.wishlist.map(normalizeWishlistProduct).filter(Boolean) as WishlistProduct[]);
    }
  }, [store?.wishlist]);

  // Real-time listener for cross-tab and cross-component updates
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleSync = () => {
      setItems(resolveCurrentItems());
    };

    window.addEventListener('wishlist-updated', handleSync);
    window.addEventListener('rjfc_wishlist_updated', handleSync);
    window.addEventListener('storage', handleSync);

    return () => {
      window.removeEventListener('wishlist-updated', handleSync);
      window.removeEventListener('rjfc_wishlist_updated', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, [resolveCurrentItems]);

  // Toast feedback helper
  const triggerToast = (msg: string) => {
    if (store?.showToast) {
      store.showToast(msg, 'info');
    } else {
      setToastMessage(msg);
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  // Handle Remove Item
  const handleRemove = (productId: string | number) => {
    if (store) {
      store.removeFromWishlist(productId);
    } else {
      setItems((prev) => {
        const next = prev.filter((p) => String(p.id) !== String(productId));
        try {
          const json = JSON.stringify(next);
          localStorage.setItem('rj_fashion_wishlist', json);
          localStorage.setItem('rjfc_wishlist', JSON.stringify(next.map(i => String(i.id))));
          localStorage.setItem('rjfc_react_wishlist', json);
          window.dispatchEvent(new Event('wishlist-updated'));
          window.dispatchEvent(new Event('storage'));
        } catch (_) {}
        return next;
      });
      triggerToast('Item removed from saved collection');
    }
    if (onRemoveItem) onRemoveItem(productId);
  };

  // Handle Move Item to Bag
  const handleMoveToCart = async (product: WishlistProduct) => {
    if (product.stock <= 0) return;
    const size = selectedSizes[product.id] || product.selectedSize || product.availableSizes?.[0] || 'Free Size';

    setMovingIds(prev => ({ ...prev, [product.id]: true }));

    try {
      if (store) {
        store.addToCart(product as any, size, 1);
        store.removeFromWishlist(product.id);
      } else if (onAddToCart) {
        onAddToCart(product as any, size);
        handleRemove(product.id);
      } else if (onMoveToCart) {
        onMoveToCart(product, size);
        handleRemove(product.id);
      } else if (typeof window !== 'undefined') {
        // Direct local storage fallback
        const raw = localStorage.getItem('rjfc_cart') || localStorage.getItem('rjfc_local_cart') || localStorage.getItem('rjfc_react_cart');
        const cart = raw ? JSON.parse(raw) : [];
        cart.push({
          id: Date.now(),
          product_id: product.id,
          cart_id: `cart_${Date.now()}_${product.id}`,
          name: product.name,
          price: product.price,
          original_price: product.originalPrice || product.price,
          discount: product.discount || 0,
          image: product.image,
          brand: product.brand || 'RJ Collection',
          size,
          quantity: 1,
          stock: product.stock
        });
        const cartJson = JSON.stringify(cart);
        ['rjfc_cart', 'rjfc_local_cart', 'rjfc_react_cart'].forEach(k => {
          localStorage.setItem(k, cartJson);
        });
        window.dispatchEvent(new CustomEvent('rjfc_cart_updated', { detail: { items: cart } }));
        window.dispatchEvent(new Event('storage'));
        if (typeof (window as any).updateCartCount === 'function') {
          (window as any).updateCartCount();
        }
        handleRemove(product.id);
        triggerToast(`Moved "${product.name}" (${size}) to your shopping bag`);
      }
    } finally {
      setMovingIds(prev => ({ ...prev, [product.id]: false }));
    }
  };

  // Handle Move All In-Stock to Bag
  const handleMoveAllToCart = () => {
    const inStockItems = items.filter((p) => p.stock > 0);
    if (inStockItems.length === 0) {
      triggerToast('No in-stock items available to move to cart');
      return;
    }
    inStockItems.forEach(item => {
      const size = selectedSizes[item.id] || item.selectedSize || item.availableSizes?.[0] || 'Free Size';
      if (store) {
        store.addToCart(item as any, size, 1);
        store.removeFromWishlist(item.id);
      } else if (onAddToCart) {
        onAddToCart(item as any, size);
      }
    });

    if (!store) {
      const remaining = items.filter(p => p.stock <= 0);
      setItems(remaining);
      try {
        const json = JSON.stringify(remaining);
        localStorage.setItem('rj_fashion_wishlist', json);
        localStorage.setItem('rjfc_wishlist', JSON.stringify(remaining.map(i => String(i.id))));
        localStorage.setItem('rjfc_react_wishlist', json);
        window.dispatchEvent(new Event('wishlist-updated'));
        window.dispatchEvent(new Event('storage'));
      } catch (_) {}
    }

    triggerToast(`Moved ${inStockItems.length} items to your shopping bag`);
    if (onMoveAllToCart) onMoveAllToCart(inStockItems);
  };

  // Handle Clear All Wishlist Items
  const handleClearAll = () => {
    if (store) {
      store.clearWishlist();
    } else {
      setItems([]);
      try {
        localStorage.removeItem('rj_fashion_wishlist');
        localStorage.setItem('rjfc_wishlist', '[]');
        localStorage.setItem('rjfc_react_wishlist', '[]');
        window.dispatchEvent(new Event('wishlist-updated'));
        window.dispatchEvent(new Event('storage'));
      } catch (_) {}
    }
    setShowClearConfirm(false);
    triggerToast('Your saved collection has been cleared');
    if (onClearAll) onClearAll();
  };

  // Handle Size Selection
  const handleSizeSelect = (productId: string | number, size: string) => {
    setSelectedSizes((prev) => ({ ...prev, [productId]: size }));
  };

  // Filter & Sort Logic
  const filteredAndSortedItems = useMemo(() => {
    let result = [...items];

    // 1. Filter by category
    if (activeCategory === 'sale') {
      result = result.filter((p) => (p.discount && p.discount > 0) || p.badge === 'Sale');
    } else if (activeCategory !== 'all') {
      result = result.filter((p) => p.category === activeCategory);
    }

    // 2. Sort items
    if (activeSort === 'price_asc') {
      result.sort((a, b) => a.price - b.price);
    } else if (activeSort === 'price_desc') {
      result.sort((a, b) => b.price - a.price);
    } else if (activeSort === 'discount') {
      result.sort((a, b) => (b.discount || 0) - (a.discount || 0));
    } else {
      // Recent (default by addedAt or id)
      result.sort((a, b) => {
        const dateA = a.addedAt ? new Date(a.addedAt).getTime() : Number(a.id);
        const dateB = b.addedAt ? new Date(b.addedAt).getTime() : Number(b.id);
        return dateB - dateA;
      });
    }

    return result;
  }, [items, activeCategory, activeSort]);

  // Categories Array
  const categoryFilters: { id: WishlistCategory; label: string }[] = [
    { id: 'all', label: 'All Items' },
    { id: 'sarees', label: 'Sarees & Couture' },
    { id: 'dresses', label: 'Kurtis & Lehengas' },
    { id: 'jewelry', label: 'Jewellery' },
    { id: 'accessories', label: 'Bags & Gifts' },
    { id: 'sale', label: 'On Sale' },
  ];

  const handleExploreCatalog = () => {
    if (onExploreCatalog) {
      onExploreCatalog();
    } else if (typeof window !== 'undefined') {
      window.location.href = '/shop.html?newArrival=true';
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#FDFBF7] text-[#111111] dark:bg-[#0A0A0C] dark:text-[#F5EFEB] font-sans selection:bg-[#D4AF37] selection:text-black py-8 sm:py-12 px-4 sm:px-6 lg:px-12 box-border transition-colors duration-300">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* =========================================================================
            1. PAGE HEADER & CONTROL BAR
            ========================================================================= */}
        <header className="space-y-6 border-b border-neutral-200/80 dark:border-white/10 pb-8">
          {/* Breadcrumbs */}
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs uppercase tracking-wider text-[#78716C] dark:text-[#A8A29E]">
            <a href="/" className="hover:text-[#111111] dark:hover:text-white transition-colors">Home</a>
            <span className="opacity-40">/</span>
            <span className="font-semibold text-[#111111] dark:text-white">Wishlist</span>
          </nav>

          {/* Title Row & Item Counter Pill */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#B38B22] dark:text-[#D4AF37] mb-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Curated Client Selection</span>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold tracking-tight text-inherit">
                  My Saved Collection
                </h1>
                <span className="inline-flex items-center justify-center px-3.5 py-1 rounded-full text-xs font-semibold bg-[#111111] text-white dark:bg-[#D4AF37] dark:text-black transition-colors font-mono shadow-sm">
                  [ {items.length} {items.length === 1 ? 'Item' : 'Items'} ]
                </span>
              </div>
            </div>

            {/* Bulk Action Controls */}
            {items.length > 0 && (
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleMoveAllToCart}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider bg-[#111111] text-white hover:bg-neutral-800 dark:bg-[#D4AF37] dark:text-black dark:hover:bg-[#E5C158] transition-all shadow-sm hover:shadow"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Move All to Bag</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowClearConfirm(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-semibold text-[#78716C] hover:text-[#DC2626] dark:text-[#A8A29E] dark:hover:text-[#F87171] hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear All</span>
                </button>
              </div>
            )}
          </div>

          {/* Category Filter Pills & Sort Bar */}
          {items.length > 0 && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
              {/* Category Pills (Horizontal Swipeable) */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 scrollbar-none max-w-full">
                {categoryFilters.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setActiveCategory(cat.id)}
                    className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                      activeCategory === cat.id
                        ? 'bg-[#111111] text-white dark:bg-[#D4AF37] dark:text-black shadow-sm'
                        : 'bg-white dark:bg-[#141418] border border-neutral-200/80 dark:border-white/10 text-neutral-600 dark:text-neutral-400 hover:border-black dark:hover:border-white'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Sort Selector */}
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs uppercase tracking-wider text-neutral-500 font-semibold">Sort By:</span>
                <select
                  value={activeSort}
                  onChange={(e) => setActiveSort(e.target.value as WishlistSort)}
                  className="text-xs font-semibold bg-white dark:bg-[#141418] border border-neutral-200/80 dark:border-white/10 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#D4AF37] transition-colors"
                >
                  <option value="recent">Recently Added</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                  <option value="discount">Biggest Discount</option>
                </select>
              </div>
            </div>
          )}
        </header>

        {/* =========================================================================
            2. PRODUCT CARDS GRID (Luxury 4-Column Responsive Layout)
            ========================================================================= */}
        {filteredAndSortedItems.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto px-4 md:px-6 py-8">
            <AnimatePresence>
              {filteredAndSortedItems.map((product) => {
                const isOutOfStock = product.stock <= 0;
                const isLowStock = !isOutOfStock && product.stock <= 3;
                const activeSize = selectedSizes[product.id] || product.selectedSize || product.availableSizes?.[0] || 'Free Size';
                const isMoving = !!movingIds[product.id];

                return (
                  <motion.article
                    key={product.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.25 }}
                    className="group relative flex flex-col justify-between bg-white dark:bg-[#141418] border border-neutral-200/80 dark:border-white/10 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 hover:border-[#D4AF37]/50 transition-all duration-300"
                  >
                    {/* Media Container (3:4 Portrait Ratio) */}
                    <div className="relative w-full aspect-[3/4] bg-[#F7F4F0] dark:bg-neutral-900 overflow-hidden">
                      <a
                        href={`/product.html?id=${product.id}`}
                        className="block w-full h-full relative overflow-hidden"
                        title={product.name}
                      >
                        <img
                          src={product.image}
                          alt={product.name}
                          loading="lazy"
                          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src =
                              'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=600&q=80';
                          }}
                        />
                      </a>

                      {/* Top-Right Remove Button (X) */}
                      <button
                        type="button"
                        onClick={() => handleRemove(product.id)}
                        className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/85 dark:bg-neutral-900/85 backdrop-blur-md flex items-center justify-center text-neutral-600 hover:text-red-600 dark:text-neutral-300 dark:hover:text-red-400 transition-colors shadow-sm z-10 hover:scale-110"
                        aria-label="Remove from Wishlist"
                        title="Remove from saved collection"
                      >
                        <X className="w-4 h-4" />
                      </button>

                      {/* Badges */}
                      <div className="absolute top-3 left-3 flex flex-col gap-1 z-10">
                        {product.discount && product.discount > 0 && (
                          <span className="bg-red-600 text-white text-[10px] font-bold tracking-wider px-2 py-0.5 rounded-full uppercase shadow-sm">
                            {product.discount}% OFF
                          </span>
                        )}
                        {isOutOfStock ? (
                          <span className="bg-neutral-900/90 text-white text-[9px] font-bold tracking-wider px-2 py-0.5 rounded-full uppercase backdrop-blur-sm">
                            Sold Out
                          </span>
                        ) : isLowStock ? (
                          <span className="bg-amber-600/90 text-white text-[9px] font-bold tracking-wider px-2 py-0.5 rounded-full uppercase backdrop-blur-sm">
                            Only {product.stock} left
                          </span>
                        ) : null}
                      </div>
                    </div>

                    {/* Card Content */}
                    <div className="flex flex-col flex-1 p-4 gap-2.5">
                      {/* Gold Category Tag */}
                      <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#B38B22] dark:text-[#D4AF37]">
                        {product.categoryLabel || product.category || 'Luxury Couture'}
                      </span>

                      {/* Product Title */}
                      <h3 className="font-serif text-sm font-semibold text-inherit line-clamp-2 leading-snug min-h-[38px]">
                        <a
                          href={`/product.html?id=${product.id}`}
                          className="hover:text-[#D4AF37] transition-colors"
                          title={product.name}
                        >
                          {product.name}
                        </a>
                      </h3>

                      {/* Price & Discount */}
                      <div className="flex items-baseline gap-2 pt-0.5">
                        <span className="text-base font-bold text-inherit font-mono tracking-tight">
                          {formatIndianPrice(product.price)}
                        </span>
                        {product.originalPrice && product.originalPrice > product.price && (
                          <span className="text-xs text-neutral-400 line-through font-mono">
                            {formatIndianPrice(product.originalPrice)}
                          </span>
                        )}
                        {product.discount && product.discount > 0 && (
                          <span className="text-[11px] font-bold text-red-600 dark:text-red-400">
                            ({product.discount}% off)
                          </span>
                        )}
                      </div>

                      {/* Size Selector Pills (if variants exist) */}
                      {product.availableSizes && product.availableSizes.length > 1 && (
                        <div className="flex flex-wrap gap-1 pt-1">
                          {product.availableSizes.slice(0, 4).map((size) => (
                            <button
                              key={size}
                              type="button"
                              onClick={() => handleSizeSelect(product.id, size)}
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded transition-all ${
                                activeSize === size
                                  ? 'bg-[#111111] text-white dark:bg-[#D4AF37] dark:text-black shadow-xs font-bold'
                                  : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                              }`}
                            >
                              {size}
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Scarcity Alert */}
                      {isLowStock && (
                        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-rose-600 dark:text-rose-400 pt-0.5">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>Only {product.stock} left in stock — order soon</span>
                        </div>
                      )}

                      {/* Push CTA to card bottom */}
                      <div className="flex-1" />

                      {/* Full-Width CTA: MOVE TO BAG */}
                      <button
                        type="button"
                        disabled={isOutOfStock || isMoving}
                        onClick={() => handleMoveToCart(product)}
                        className={`w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                          isOutOfStock
                            ? 'bg-neutral-200 text-neutral-400 dark:bg-white/5 dark:text-neutral-500 cursor-not-allowed'
                            : 'bg-[#111111] text-white hover:bg-neutral-800 dark:bg-[#D4AF37] dark:text-black dark:hover:bg-[#E5C158] shadow-sm hover:shadow active:scale-[0.99]'
                        }`}
                      >
                        {isMoving ? (
                          <span className="animate-pulse">MOVING...</span>
                        ) : (
                          <>
                            <ShoppingBag className="w-4 h-4" />
                            <span>{isOutOfStock ? 'Sold Out' : 'MOVE TO BAG'}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </motion.article>
                );
              })}
            </AnimatePresence>
          </div>
        ) : (
          /* =========================================================================
              3. EMPTY WISHLIST STATE (Refined Minimalist Editorial Aesthetic)
              ========================================================================= */
          <div className="py-20 px-4 text-center max-w-lg mx-auto space-y-6">
            <div className="w-20 h-20 mx-auto rounded-full border-2 border-[#D4AF37] flex items-center justify-center text-[#D4AF37] bg-[#D4AF37]/5 shadow-sm">
              <Heart className="w-9 h-9 stroke-[1.5]" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-inherit">
                Your Wishlist is Empty
              </h2>
              <p className="text-sm text-neutral-600 dark:text-neutral-400 max-w-md mx-auto leading-relaxed">
                Explore our latest arrivals and save your favorite royal bridal silhouettes, statement jewellery, and handcrafted ethnic wear for upcoming celebrations.
              </p>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={handleExploreCatalog}
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-lg text-xs font-bold uppercase tracking-wider bg-[#111111] text-white hover:bg-neutral-800 dark:bg-[#D4AF37] dark:text-black dark:hover:bg-[#E5C158] transition-all shadow-md hover:shadow-lg"
              >
                <span>DISCOVER NEW ARRIVALS →</span>
              </button>
            </div>
          </div>
        )}

      </div>

      {/* =========================================================================
          4. CLEAR ALL CONFIRMATION MODAL
          ========================================================================= */}
      <AnimatePresence>
        {showClearConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-white dark:bg-[#141418] border border-neutral-200/80 dark:border-white/10 rounded-2xl p-6 shadow-2xl space-y-5"
            >
              <div className="flex justify-between items-start">
                <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center">
                  <Trash2 className="w-5 h-5" />
                </div>
                <button
                  type="button"
                  onClick={() => setShowClearConfirm(false)}
                  className="text-neutral-500 hover:text-black dark:hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-1.5">
                <h3 className="text-lg font-bold font-serif text-inherit">Clear Saved Collection?</h3>
                <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                  Are you sure you want to remove all {items.length} items from your wishlist? This action cannot be undone.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowClearConfirm(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-neutral-600 hover:text-black dark:text-neutral-400 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider bg-red-600 hover:bg-red-700 text-white transition-colors shadow-sm"
                >
                  Clear Collection
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Standalone Toast Notice */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 right-6 z-50 bg-[#111111] text-white dark:bg-white dark:text-black px-4 py-3 rounded-xl shadow-2xl text-xs font-semibold flex items-center gap-2 border border-neutral-700"
          >
            <Check className="w-4 h-4 text-emerald-500" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default WishlistPage;
