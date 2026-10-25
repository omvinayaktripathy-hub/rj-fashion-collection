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

/* =========================================================================
   TYPE DEFINITIONS
   ========================================================================= */

export interface CartItem {
  id: string | number;
  product_id?: string | number;
  name: string;
  category?: string;
  price: number;
  originalPrice?: number;
  image: string;
  quantity: number;
  size?: string;
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
   MOCK EDITORIAL HIGH-FASHION CART DATA (MATCHING WISHLIST CATALOG)
   ========================================================================= */

export const DEFAULT_CART_ITEMS: CartItem[] = [
  {
    id: 1,
    product_id: 1,
    name: 'Royal Pure Silk Zari Saree',
    category: 'Sarees & Couture',
    price: 3499,
    originalPrice: 6999,
    image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80',
    quantity: 1,
    size: 'Free Size (5.5m + Blouse)',
    color: 'Crimson Vermilion',
    sku: 'RJ-SLK-0491',
    stock: 4
  },
  {
    id: 2,
    product_id: 2,
    name: 'Crimson Velvet Bridal Lehenga with Zardozi Work',
    category: 'Kurtis & Lehengas',
    price: 8999,
    originalPrice: 14999,
    image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80',
    quantity: 1,
    size: 'M (Custom Tailored)',
    color: 'Imperial Ruby',
    sku: 'RJ-LHG-1028',
    stock: 2
  }
];

export const CartPage: React.FC<CartPageProps> = ({
  initialItems,
  onProceedToCheckout,
  onExploreCatalog
}) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    if (initialItems && initialItems.length > 0) return initialItems;
    try {
      const stored = localStorage.getItem('rjfc_local_cart');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((item, idx) => ({
            id: item.id || `item-${idx}`,
            product_id: item.product_id || item.id,
            name: item.name || 'Artisanal Ensemble',
            category: item.category || 'Luxury Couture',
            price: Number(item.price) || 0,
            originalPrice: Number(item.original_price) || Number(item.originalPrice) || Number(item.price) || 0,
            image: item.image || '/images/placeholder.jpg',
            quantity: Number(item.quantity) || 1,
            size: item.size || 'Free Size',
            color: item.color || item.colorway || 'Signature Tone',
            sku: item.sku || `RJ-${String(item.product_id || idx + 100).padStart(4, '0')}`,
            stock: Number(item.stock) || 5
          }));
        }
      }
    } catch (_) {}
    return DEFAULT_CART_ITEMS;
  });

  const [promoCodeInput, setPromoCodeInput] = useState<string>('');
  const [appliedPromo, setAppliedPromo] = useState<string | null>(() => {
    try {
      return sessionStorage.getItem('rjfc_cart_promo_code') || null;
    } catch (_) {
      return null;
    }
  });
  const [promoDiscount, setPromoDiscount] = useState<number>(0);
  const [promoError, setPromoError] = useState<string | null>(null);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('rjfc_local_cart', JSON.stringify(items));
      if (typeof window !== 'undefined' && (window as any).updateCartCount) {
        (window as any).updateCartCount();
      }
    } catch (_) {}
  }, [items]);

  // Pricing calculations
  const itemCount = useMemo(() => {
    return items.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0);
  }, [items]);

  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 1), 0);
  }, [items]);

  const isComplimentaryShipping = subtotal >= 999;
  const shippingFee = isComplimentaryShipping ? 0 : 49;

  // Handle applied promo calculations
  useEffect(() => {
    if (!appliedPromo) {
      setPromoDiscount(0);
      return;
    }
    if (appliedPromo === 'ROYALE10' || appliedPromo === 'ROYAL10' || appliedPromo === 'FESTIVE10') {
      setPromoDiscount(Math.round(subtotal * 0.10));
    } else if (appliedPromo === 'GRANDRJ') {
      setPromoDiscount(subtotal >= 2000 ? 500 : Math.round(subtotal * 0.15));
    } else if (appliedPromo === 'WELCOME500' && subtotal >= 2999) {
      setPromoDiscount(500);
    } else {
      setPromoDiscount(Math.round(subtotal * 0.10));
    }
  }, [subtotal, appliedPromo]);

  const total = Math.max(0, subtotal - promoDiscount + shippingFee);

  const formatPrice = (amount: number) => {
    return '₹' + Number(amount || 0).toLocaleString('en-IN');
  };

  const handleQuantityChange = useCallback((id: string | number, newQty: number) => {
    if (newQty <= 0) {
      handleRemoveItem(id);
      return;
    }
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, quantity: newQty } : item))
    );
  }, []);

  const handleRemoveItem = useCallback((id: string | number) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    setPromoError(null);
    const code = promoCodeInput.trim().toUpperCase();
    if (!code) return;

    if (code === 'GRANDRJ' || code === 'ROYALE10' || code === 'ROYAL10' || code === 'FESTIVE10' || code === 'WELCOME500') {
      setAppliedPromo(code);
      try {
        sessionStorage.setItem('rjfc_cart_promo_code', code);
      } catch (_) {}
      setPromoCodeInput('');
    } else {
      setPromoError('Invalid promo code or minimum order amount not met');
    }
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null);
    setPromoDiscount(0);
    try {
      sessionStorage.removeItem('rjfc_cart_promo_code');
    } catch (_) {}
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
                className="inline-flex items-center gap-2 px-7 py-3 rounded-lg text-xs font-bold uppercase tracking-wider bg-[#111111] text-white hover:bg-[#2B2520] dark:bg-gradient-to-r dark:from-[#d4af37] dark:to-[#b38b22] dark:text-[#0d0d0f] transition-all shadow-sm hover:shadow"
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
                    {items.map((item) => (
                      <motion.div
                        key={item.id}
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
                          <div className="aspect-[3/4] bg-[#F3F4F6] dark:bg-zinc-800 rounded-lg overflow-hidden border border-[#EAEAEA] dark:border-white/10">
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-full h-full object-cover object-center transition-transform duration-500 hover:scale-105"
                              loading="lazy"
                            />
                          </div>
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
                              {item.name}
                            </h2>

                            {/* Selected Variant (Size / Color) */}
                            <div className="pt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-[#78716C] dark:text-[#A8A29E]">
                              {item.color && <span>Color: <strong className="text-inherit font-medium">{item.color}</strong></span>}
                              <span>Size: <strong className="text-inherit font-medium">{item.size || 'Free Size'}</strong></span>
                            </div>
                          </div>

                          {/* Pricing & Inline Controls */}
                          <div className="flex items-center justify-between pt-4 border-t border-[#F3F4F6] dark:border-white/5 mt-4">
                            {/* Minimal Inline Stepper (- 1 +) */}
                            <div className="inline-flex items-center border border-[#E5E5E5] dark:border-white/10 rounded-md bg-[#F9F9F8] dark:bg-zinc-900 overflow-hidden">
                              <button
                                type="button"
                                onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                                aria-label="Decrease quantity"
                                className="w-8 h-8 flex items-center justify-center text-[#78716C] hover:text-[#111111] dark:hover:text-white transition-colors text-sm font-bold"
                              >
                                −
                              </button>
                              <span className="w-7 text-center text-xs font-bold text-inherit">
                                {item.quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                                aria-label="Increase quantity"
                                className="w-8 h-8 flex items-center justify-center text-[#78716C] hover:text-[#111111] dark:hover:text-white transition-colors text-sm font-bold"
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
                                onClick={() => handleRemoveItem(item.id)}
                                className="text-xs uppercase font-semibold tracking-wider text-[#78716C] hover:text-[#DC2626] dark:text-[#A8A29E] dark:hover:text-rose-400 underline-offset-4 hover:underline transition-colors"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
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
                          className="text-[10px] text-zinc-400 hover:text-zinc-700 dark:hover:text-white ml-1"
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
                      className="px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider bg-[#111111] text-white hover:bg-[#2B2520] dark:bg-[#D4AF37] dark:text-black dark:hover:bg-[#E5C158] transition-colors"
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
                  className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-6 rounded-lg text-xs font-bold uppercase tracking-wider bg-[#111111] text-white hover:bg-[#2B2520] dark:bg-gradient-to-r dark:from-[#d4af37] dark:to-[#b38b22] dark:text-[#0d0d0f] transition-all shadow-sm hover:shadow"
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
