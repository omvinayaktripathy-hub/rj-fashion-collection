import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingBag,
  Trash2,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Check,
  Tag,
  X
} from 'lucide-react';
import StoreContext, { CartItem as StoreCartItem } from '../context/StoreContext';

/* =========================================================================
   TYPE DEFINITIONS
   ========================================================================= */

export interface CartItem {
  id: string | number;
  product_id?: string | number;
  cart_id?: string;
  name: string;
  category?: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  image: string;
  quantity: number;
  size?: string;
  selected_size?: string;
  color?: string;
  sku?: string;
  stock?: number;
}

export interface CartPageProps {
  initialItems?: CartItem[];
  onProceedToCheckout?: () => void;
  onExploreCatalog?: () => void;
}

/* =========================================================================
   STORAGE KEYS & UNIFIED STORAGE HELPERS
   ========================================================================= */

export const CART_STORAGE_KEYS = ['rjfc_cart', 'rjfc_local_cart', 'rjfc_react_cart'] as const;

export function normalizeCartItem(item: any, idx = 0): CartItem {
  if (!item || typeof item !== 'object') {
    return {
      id: `fallback-${idx + 1}`,
      name: 'Artisanal Ensemble',
      category: 'Luxury Couture',
      price: 0,
      image: '/images/placeholder.jpg',
      quantity: 1,
      size: 'Free Size',
      selected_size: 'Free Size',
      color: 'Signature Tone',
      sku: `RJ-${String(idx + 100).padStart(4, '0')}`,
      stock: 99
    };
  }

  const pId = item.id || item.product_id || `item-${idx + 1}`;
  const cId = item.cart_id || `cart_${pId}_${item.selected_size || item.size || 'default'}`;
  const price = Number(item.price) || 0;
  const originalPrice = Number(item.original_price || item.originalPrice || price);
  const discount = Number(item.discount) || (originalPrice > price ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0);
  const size = item.selected_size || item.size || 'Free Size';
  const color = item.color || item.colorway || 'Signature Tone';
  const category = item.category || item.category_name || item.department || 'Luxury Couture';
  const image = item.image || item.thumbnail || (Array.isArray(item.images) && item.images[0]) || '/images/placeholder.jpg';
  const quantity = Math.max(1, Number(item.quantity) || 1);
  const stock = item.stock !== undefined ? Number(item.stock) : 99;

  return {
    id: pId,
    product_id: pId,
    cart_id: cId,
    name: item.name || item.title || 'Artisanal Ensemble',
    category,
    price,
    originalPrice,
    discount,
    image,
    quantity,
    size,
    selected_size: size,
    color,
    sku: item.sku || `RJ-${String(pId).padStart(4, '0')}`,
    stock
  };
}

export function readStorageCart(): CartItem[] {
  if (typeof window === 'undefined') return [];
  for (const key of CART_STORAGE_KEYS) {
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((it, i) => normalizeCartItem(it, i));
        }
      }
    } catch (_) {}
  }
  for (const key of CART_STORAGE_KEYS) {
    try {
      const sRaw = sessionStorage.getItem(key);
      if (sRaw) {
        const parsed = JSON.parse(sRaw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((it, i) => normalizeCartItem(it, i));
        }
      }
    } catch (_) {}
  }
  return [];
}

export function writeStorageCart(items: CartItem[]): void {
  if (typeof window === 'undefined') return;
  const json = JSON.stringify(items);
  for (const key of CART_STORAGE_KEYS) {
    try { localStorage.setItem(key, json); } catch (_) {}
    try { sessionStorage.setItem(key, json); } catch (_) {}
  }
  if ((window as any)._rjfc_memory_cart) {
    (window as any)._rjfc_memory_cart = items;
  }
  try {
    window.dispatchEvent(new CustomEvent('rjfc_cart_updated', { detail: { items } }));
    window.dispatchEvent(new Event('storage'));
  } catch (_) {}
  try {
    if (typeof (window as any).updateCartCount === 'function') {
      (window as any).updateCartCount();
    }
  } catch (_) {}
}

/* =========================================================================
   MOCK EDITORIAL HIGH-FASHION CART DATA (FALLBACK CATALOG)
   ========================================================================= */

export const DEFAULT_CART_ITEMS: CartItem[] = [
  {
    id: 1,
    product_id: 1,
    cart_id: 'cart_init_1',
    name: 'Royal Pure Silk Zari Saree',
    category: 'Sarees & Couture',
    price: 3499,
    originalPrice: 6999,
    discount: 50,
    image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80',
    quantity: 1,
    size: 'Free Size (5.5m + Blouse)',
    selected_size: 'Free Size (5.5m + Blouse)',
    color: 'Crimson Vermilion',
    sku: 'RJ-SLK-0491',
    stock: 4
  },
  {
    id: 65,
    product_id: 65,
    cart_id: 'cart_init_2',
    name: 'Organic Cotton Printed Baby Sleepsuit & Bib Combo (Set of 3)',
    category: 'Kids & Apparel',
    price: 899,
    originalPrice: 1299,
    discount: 30,
    image: 'https://images.unsplash.com/photo-1519689680058-324335c77eba?auto=format&fit=crop&w=800&q=80',
    quantity: 1,
    size: '0–3 Months',
    selected_size: '0–3 Months',
    color: 'Pastel Meadow',
    sku: 'RJ-KID-0065',
    stock: 12
  }
];

export const CartPage: React.FC<CartPageProps> = ({
  initialItems,
  onProceedToCheckout,
  onExploreCatalog
}) => {
  const store = React.useContext(StoreContext);
  const isUsingStore = Boolean(store && !initialItems);

  // Standalone / fallback items state
  const [localItems, setLocalItems] = useState<CartItem[]>(() => {
    if (initialItems && initialItems.length > 0) {
      return initialItems.map((it, i) => normalizeCartItem(it, i));
    }
    const fromStorage = readStorageCart();
    if (fromStorage.length > 0) {
      return fromStorage;
    }
    return DEFAULT_CART_ITEMS;
  });

  // Effective items (store or local fallback)
  const items: CartItem[] = useMemo(() => {
    if (isUsingStore && store) {
      return (store.cart || []).map((it, i) => normalizeCartItem(it, i));
    }
    return localItems;
  }, [isUsingStore, store, localItems]);

  // Promo code state
  const [promoCodeInput, setPromoCodeInput] = useState<string>('');
  const [localAppliedPromo, setLocalAppliedPromo] = useState<string | null>(() => {
    try {
      return sessionStorage.getItem('rjfc_cart_promo_code') || localStorage.getItem('rjfc_cart_promo_code') || 'GRANDRJ';
    } catch (_) {
      return 'GRANDRJ';
    }
  });
  const [promoError, setPromoError] = useState<string | null>(null);

  const appliedPromo = isUsingStore && store ? store.promoCode : localAppliedPromo;

  // Real-time synchronization with localStorage and window events
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleSync = () => {
      if (!isUsingStore) {
        const updated = readStorageCart();
        if (updated.length > 0) {
          setLocalItems(updated);
        }
      }
    };

    window.addEventListener('rjfc_cart_updated', handleSync);
    window.addEventListener('storage', handleSync);

    // If local cart is empty, also try to fetch from /api/cart (e.g. backend session)
    if (localItems.length === 0 && !isUsingStore) {
      fetch('/api/cart')
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data && data.success && Array.isArray(data.items) && data.items.length > 0) {
            const fetched = data.items.map((it: any, i: number) => normalizeCartItem(it, i));
            setLocalItems(fetched);
            writeStorageCart(fetched);
          }
        })
        .catch(() => {});
    }

    return () => {
      window.removeEventListener('rjfc_cart_updated', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, [isUsingStore, localItems.length]);

  // Sync changes to storage when in standalone mode
  useEffect(() => {
    if (!isUsingStore) {
      writeStorageCart(localItems);
    }
  }, [isUsingStore, localItems]);

  // Pricing calculations
  const itemCount = useMemo(() => {
    return items.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0);
  }, [items]);

  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 1), 0);
  }, [items]);

  const isComplimentaryShipping = subtotal >= 999;
  const shippingFee = subtotal === 0 || isComplimentaryShipping ? 0 : 49;

  // Promo discount calculation
  const promoDiscount = useMemo(() => {
    if (isUsingStore && store) {
      return store.promoDiscount;
    }
    if (!appliedPromo || subtotal === 0) return 0;
    if (appliedPromo === 'ROYALE10' || appliedPromo === 'ROYAL10' || appliedPromo === 'FESTIVE10') {
      return Math.round(subtotal * 0.10);
    } else if (appliedPromo === 'GRANDRJ') {
      return Math.min(500, Math.round(subtotal * 0.15));
    } else if (appliedPromo === 'WELCOME500' && subtotal >= 2999) {
      return 500;
    }
    return 0;
  }, [isUsingStore, store, appliedPromo, subtotal]);

  const total = Math.max(0, subtotal - promoDiscount + shippingFee);

  const formatPrice = (amount: number) => {
    return '₹' + Number(amount || 0).toLocaleString('en-IN');
  };

  const handleQuantityChange = useCallback((id: string | number, newQty: number) => {
    if (newQty <= 0) {
      handleRemoveItem(id);
      return;
    }
    if (isUsingStore && store) {
      const match = store.cart.find((i) => String(i.cart_id) === String(id) || String(i.id) === String(id));
      if (match) {
        store.updateQuantity(match.cart_id, newQty);
        return;
      }
    }
    setLocalItems((prev) =>
      prev.map((item) => (item.id === id || item.cart_id === id ? { ...item, quantity: newQty } : item))
    );
  }, [isUsingStore, store]);

  const handleRemoveItem = useCallback((id: string | number) => {
    if (isUsingStore && store) {
      const match = store.cart.find((i) => String(i.cart_id) === String(id) || String(i.id) === String(id));
      if (match) {
        store.removeFromCart(match.cart_id);
        return;
      }
    }
    setLocalItems((prev) => prev.filter((item) => item.id !== id && item.cart_id !== id));
  }, [isUsingStore, store]);

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    setPromoError(null);
    const code = promoCodeInput.trim().toUpperCase();
    if (!code) return;

    if (code === 'GRANDRJ' || code === 'ROYALE10' || code === 'ROYAL10' || code === 'FESTIVE10' || code === 'WELCOME500') {
      if (isUsingStore && store) {
        store.applyPromoCode(code);
      } else {
        setLocalAppliedPromo(code);
        try {
          sessionStorage.setItem('rjfc_cart_promo_code', code);
          localStorage.setItem('rjfc_cart_promo_code', code);
        } catch (_) {}
      }
      setPromoCodeInput('');
    } else {
      setPromoError('Invalid promo code or minimum spend requirement not met');
    }
  };

  const handleRemovePromo = () => {
    if (isUsingStore && store) {
      store.removePromoCode();
    } else {
      setLocalAppliedPromo(null);
      try {
        sessionStorage.removeItem('rjfc_cart_promo_code');
        localStorage.removeItem('rjfc_cart_promo_code');
      } catch (_) {}
    }
  };

  const handleProceed = () => {
    if (onProceedToCheckout) {
      onProceedToCheckout();
    } else if (typeof window !== 'undefined') {
      window.location.href = '/delivery.html';
    }
  };

  const handleExplore = () => {
    if (onExploreCatalog) {
      onExploreCatalog();
    } else if (typeof window !== 'undefined') {
      window.location.href = '/shop.html?newArrival=true';
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#F8F8F7] text-[#111111] dark:bg-[#0D0D0F] dark:text-[#F5EFEB] font-sans selection:bg-[#D4AF37] selection:text-black py-8 sm:py-12 px-4 sm:px-6 lg:px-12 box-border transition-colors duration-300">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* =========================================================================
            1. PAGE HEADER & HIERARCHY (EXACT WISHLIST MATCH)
            ========================================================================= */}
        <header className="space-y-6 border-b border-[#E5E5E5] dark:border-white/10 pb-8">
          {/* Breadcrumbs: HOME / SHOPPING BAG */}
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs uppercase tracking-wider text-[#78716C] dark:text-[#A8A29E]">
            <a href="/" className="hover:text-[#111111] dark:hover:text-white transition-colors">Home</a>
            <span className="opacity-40">/</span>
            <span className="font-semibold text-[#111111] dark:text-white">Shopping Bag</span>
          </nav>

          {/* Title Row & Item Counter Pill */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              {/* Gold Eyebrow Tag */}
              <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#B38B22] dark:text-[#D4AF37] mb-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>✨ REVIEW YOUR SELECTION</span>
              </div>
              <div className="flex items-center gap-4">
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold tracking-tight text-inherit">
                  My Shopping Bag
                </h1>
                <span className="inline-flex items-center justify-center px-3.5 py-1 rounded-full text-xs font-semibold bg-[#111111] text-white dark:bg-[#D4AF37] dark:text-black transition-colors">
                  [ {itemCount} {itemCount === 1 ? 'Item' : 'Items'} ]
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* =========================================================================
            2. EMPTY STATE (EXACT WISHLIST MATCH)
            ========================================================================= */}
        {items.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="text-center py-16 px-6 max-w-lg mx-auto"
          >
            {/* Centered Circular Outline Icon in Muted Gold */}
            <div className="w-[76px] h-[76px] rounded-full bg-[rgba(212,175,55,0.1)] border border-[rgba(212,175,55,0.3)] text-[#B38B22] dark:text-[#E5C158] flex items-center justify-center mx-auto mb-5 shadow-sm">
              <ShoppingBag className="w-9 h-9" strokeWidth={1.3} />
            </div>

            {/* Heading in Elegant Serif */}
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-inherit mb-2 tracking-tight">
              Your Shopping Bag is Empty
            </h2>

            {/* Subtitle */}
            <p className="text-sm text-[#78716C] dark:text-[#A8A29E] max-w-md mx-auto leading-relaxed mb-6 font-normal">
              Explore our latest arrivals and discover royal silhouettes, handcrafted ethnic wear, and statement jewellery.
            </p>

            {/* Black Pill Button Matching "DISCOVER NEW ARRIVALS" */}
            <div className="flex justify-center">
              <button
                type="button"
                onClick={handleExplore}
                className="inline-flex items-center gap-2 px-7 py-3 rounded-lg text-xs font-bold uppercase tracking-wider bg-[#111111] text-white hover:bg-[#2B2520] dark:bg-gradient-to-r dark:from-[#d4af37] dark:to-[#b38b22] dark:text-[#0d0d0f] transition-all shadow-sm hover:shadow cursor-pointer"
              >
                <span>EXPLORE NEW ARRIVALS →</span>
              </button>
            </div>
          </motion.div>
        ) : (
          /* =========================================================================
             3. ACTIVE CART: 2-COLUMN BALANCED DESKTOP GRID / FLUID MOBILE
             ========================================================================= */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            
            {/* LEFT COLUMN: Minimalist Product Cards (7 cols) */}
            <div className="lg:col-span-7 space-y-6">
              <div className="bg-white dark:bg-[#141418] border border-[#E5E5E5] dark:border-white/10 rounded-xl p-4 sm:p-6 shadow-sm">
                <div className="divide-y divide-[#EAEAEA] dark:divide-white/10">
                  <AnimatePresence initial={false}>
                    {items.map((item, idx) => {
                      const itemKey = item.cart_id || item.id || `cart-item-${idx}`;
                      const prodId = item.product_id || item.id;
                      const selectedSize = item.selected_size || item.size || 'Free Size';
                      const selectedColor = item.color || 'Signature Tone';

                      return (
                        <motion.div
                          key={itemKey}
                          layout
                          initial={{ opacity: 1, height: 'auto' }}
                          exit={{
                            opacity: 0,
                            height: 0,
                            marginBottom: 0,
                            overflow: 'hidden',
                            transition: { duration: 0.3 }
                          }}
                          className="py-6 first:pt-0 last:pb-0 flex gap-4 sm:gap-6 items-start"
                        >
                          {/* Tall 3:4 Aspect Ratio Portrait Thumbnail */}
                          <div className="w-[105px] sm:w-[125px] flex-shrink-0">
                            <a href={`/product.html?id=${prodId}`} className="block aspect-[3/4] bg-[#F3F4F6] dark:bg-zinc-800 rounded-lg overflow-hidden border border-[#EAEAEA] dark:border-white/10 group">
                              <img
                                src={item.image}
                                alt={item.name}
                                className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
                                loading="lazy"
                              />
                            </a>
                          </div>

                          {/* Item Details */}
                          <div className="flex-1 flex flex-col justify-between min-h-[140px] sm:min-h-[160px] py-1">
                            <div className="space-y-1">
                              {/* Category Tag */}
                              {item.category && (
                                <p className="text-[10px] uppercase font-bold tracking-widest text-[#B38B22] dark:text-[#D4AF37]">
                                  {item.category}
                                </p>
                              )}

                              {/* Product Title in Serif */}
                              <h2 className="text-base sm:text-lg font-serif font-bold text-inherit leading-snug">
                                <a href={`/product.html?id=${prodId}`} className="hover:text-[#B38B22] dark:hover:text-[#D4AF37] transition-colors">
                                  {item.name}
                                </a>
                              </h2>

                              {/* Selected Variant (Size / Color) */}
                              <div className="pt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-[#78716C] dark:text-[#A8A29E]">
                                {selectedColor && (
                                  <span>Color: <strong className="text-inherit font-medium">{selectedColor}</strong></span>
                                )}
                                <span>Size: <strong className="text-inherit font-medium">{selectedSize}</strong></span>
                              </div>
                            </div>

                            {/* Pricing & Inline Controls */}
                            <div className="flex items-center justify-between pt-4 border-t border-[#F3F4F6] dark:border-white/5 mt-4">
                              {/* Minimal Inline Stepper (- 1 +) */}
                              <div className="inline-flex items-center border border-[#E5E5E5] dark:border-white/10 rounded-md bg-[#F9F9F8] dark:bg-zinc-900 overflow-hidden">
                                <button
                                  type="button"
                                  onClick={() => handleQuantityChange(item.cart_id || item.id, item.quantity - 1)}
                                  aria-label="Decrease quantity"
                                  className="w-8 h-8 flex items-center justify-center text-[#78716C] hover:text-[#111111] dark:hover:text-white transition-colors text-sm font-bold cursor-pointer"
                                >
                                  −
                                </button>
                                <span className="w-7 text-center text-xs font-bold text-inherit">
                                  {item.quantity}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleQuantityChange(item.cart_id || item.id, item.quantity + 1)}
                                  disabled={item.stock !== undefined && item.quantity >= item.stock}
                                  aria-label="Increase quantity"
                                  className="w-8 h-8 flex items-center justify-center text-[#78716C] hover:text-[#111111] dark:hover:text-white transition-colors text-sm font-bold cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                                >
                                  +
                                </button>
                              </div>

                              {/* Unit Price in Bold & Discreet Remove Link */}
                              <div className="flex items-center gap-5">
                                <span className="text-sm sm:text-base font-bold text-inherit">
                                  {formatPrice(item.price * item.quantity)}
                                </span>

                                <button
                                  type="button"
                                  onClick={() => handleRemoveItem(item.cart_id || item.id)}
                                  className="text-xs uppercase font-semibold tracking-wider text-[#78716C] hover:text-[#DC2626] dark:text-[#A8A29E] dark:hover:text-rose-400 underline-offset-4 hover:underline transition-colors cursor-pointer"
                                >
                                  Remove
                                </button>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Order Summary Card (5 cols, Sticky) */}
            <aside className="lg:col-span-5">
              <div className="bg-white dark:bg-[#141418] border border-[#E5E5E5] dark:border-white/10 rounded-xl p-6 sm:p-7 shadow-sm sticky top-24 space-y-6">
                <h2 className="text-lg font-serif font-bold text-inherit border-b border-[#E5E5E5] dark:border-white/10 pb-4">
                  Order Summary
                </h2>

                {/* Summary Rows */}
                <div className="space-y-3.5 text-xs sm:text-sm">
                  <div className="flex justify-between items-center text-[#78716C] dark:text-[#A8A29E]">
                    <span>Subtotal</span>
                    <span className="font-semibold text-inherit">{formatPrice(subtotal)}</span>
                  </div>

                  {appliedPromo && promoDiscount > 0 && (
                    <div className="flex justify-between items-center text-[#059669] dark:text-[#34D399]">
                      <div className="flex items-center gap-1.5">
                        <Tag className="w-3.5 h-3.5" />
                        <span>Promo ({appliedPromo})</span>
                        <button
                          type="button"
                          onClick={handleRemovePromo}
                          className="text-[10px] text-zinc-400 hover:text-zinc-700 dark:hover:text-white ml-1 cursor-pointer"
                          title="Remove promo code"
                        >
                          ✕
                        </button>
                      </div>
                      <span className="font-semibold">− {formatPrice(promoDiscount)}</span>
                    </div>
                  )}

                  <div className="flex justify-between items-center text-[#78716C] dark:text-[#A8A29E]">
                    <span>Shipping</span>
                    <span className="font-semibold">
                      {isComplimentaryShipping ? (
                        <span className="text-[#059669] dark:text-[#34D399] font-bold">Complimentary</span>
                      ) : (
                        formatPrice(shippingFee)
                      )}
                    </span>
                  </div>

                  <div className="border-t border-[#E5E5E5] dark:border-white/10 pt-4 flex justify-between items-baseline">
                    <span className="text-base font-serif font-bold text-inherit">Total</span>
                    <span className="text-xl font-bold text-inherit">{formatPrice(total)}</span>
                  </div>
                </div>

                {/* Minimal Promo Code Input */}
                <form onSubmit={handleApplyPromo} className="space-y-2 pt-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={promoCodeInput}
                      onChange={(e) => setPromoCodeInput(e.target.value)}
                      placeholder="USE CODE: GRANDRJ"
                      className="flex-1 bg-[#F9F9F8] dark:bg-zinc-900 border border-[#E5E5E5] dark:border-white/10 rounded-lg px-3.5 py-2.5 text-xs uppercase tracking-wider text-inherit placeholder-[#A8A29E] focus:outline-none focus:border-[#B38B22] dark:focus:border-[#D4AF37]"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider bg-[#111111] text-white hover:bg-[#2B2520] dark:bg-[#D4AF37] dark:text-black dark:hover:bg-[#E5C158] transition-colors cursor-pointer"
                    >
                      Apply
                    </button>
                  </div>
                  {promoError && (
                    <p className="text-[11px] text-[#DC2626] dark:text-rose-400">{promoError}</p>
                  )}
                </form>

                {/* Primary CTA: Black Pill Button Matching "DISCOVER NEW ARRIVALS" */}
                <button
                  type="button"
                  onClick={handleProceed}
                  disabled={items.length === 0}
                  className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-6 rounded-lg text-xs font-bold uppercase tracking-wider bg-[#111111] text-white hover:bg-[#2B2520] dark:bg-gradient-to-r dark:from-[#d4af37] dark:to-[#b38b22] dark:text-[#0d0d0f] transition-all shadow-sm hover:shadow cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <span>PROCEED TO CHECKOUT →</span>
                </button>

                {/* Secure Badge Text */}
                <div className="flex items-center justify-center gap-2 text-[11px] text-[#78716C] dark:text-[#A8A29E] pt-2 text-center">
                  <ShieldCheck className="w-4 h-4 text-[#B38B22] dark:text-[#D4AF37] flex-shrink-0" />
                  <span>Authentic Luxury Guaranteed • Complimentary Express Delivery</span>
                </div>
              </div>
            </aside>

          </div>
        )}

      </div>
    </div>
  );
};

export default CartPage;
