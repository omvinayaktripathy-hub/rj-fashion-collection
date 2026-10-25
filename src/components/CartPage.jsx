import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const DEFAULT_SAMPLE_ITEMS = [
  {
    id: 'cart-1',
    product_id: 1,
    name: 'Raw Mulberry Silk Draped Saree',
    price: 18500,
    original_price: 22000,
    image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=85',
    quantity: 1,
    size: 'Free Size',
    color: 'Onyx Noir',
    sku: 'RJ-SLK-0491'
  },
  {
    id: 'cart-2',
    product_id: 2,
    name: 'Structured Raw Silk Bandhgala Jacket',
    price: 14200,
    original_price: 16500,
    image: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=800&q=85',
    quantity: 1,
    size: '40 Regular',
    color: 'Ivory Bone',
    sku: 'RJ-JKT-1028'
  }
];

export const CartPage = ({
  initialItems,
  onProceedToCheckout,
  onContinueShopping
}) => {
  const [items, setItems] = useState(() => {
    if (initialItems && initialItems.length > 0) return initialItems;
    try {
      const stored = localStorage.getItem('rjfc_local_cart');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((item, idx) => ({
            id: item.id || `item-${idx}`,
            product_id: item.product_id || item.id,
            name: item.name || 'Artisanal Garment',
            price: Number(item.price) || 0,
            original_price: Number(item.original_price) || Number(item.price) || 0,
            image: item.image || '/images/placeholder.jpg',
            quantity: Number(item.quantity) || 1,
            size: item.size || 'Standard',
            color: item.color || 'Signature Tone',
            sku: item.sku || `RJ-${String(item.product_id || idx + 100).padStart(4, '0')}`
          }));
        }
      }
    } catch (_) {}
    return DEFAULT_SAMPLE_ITEMS;
  });

  const [promoExpanded, setPromoExpanded] = useState(false);
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState(() => {
    try {
      return sessionStorage.getItem('rjfc_cart_promo_code') || null;
    } catch (_) {
      return null;
    }
  });
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [promoError, setPromoError] = useState(null);

  // Sync with localStorage
  useEffect(() => {
    try {
      localStorage.setItem('rjfc_local_cart', JSON.stringify(items));
      if (typeof window !== 'undefined' && window.updateCartCount) {
        window.updateCartCount();
      }
    } catch (_) {}
  }, [items]);

  // Pricing calculations
  const itemCount = items.reduce((acc, item) => acc + (Number(item.quantity) || 1), 0);
  const subtotal = items.reduce((acc, item) => acc + (Number(item.price) || 0) * (Number(item.quantity) || 1), 0);

  // Update promo discount when subtotal or appliedPromo changes
  useEffect(() => {
    if (!appliedPromo) {
      setPromoDiscount(0);
      return;
    }
    if (appliedPromo === 'ROYALE10' || appliedPromo === 'ROYAL10') {
      setPromoDiscount(Math.round(subtotal * 0.10));
    } else if (appliedPromo === 'GRANDRJ') {
      setPromoDiscount(subtotal >= 2000 ? 500 : Math.round(subtotal * 0.15));
    } else {
      setPromoDiscount(Math.round(subtotal * 0.10));
    }
  }, [subtotal, appliedPromo]);

  const total = Math.max(0, subtotal - promoDiscount);

  const formatPrice = (val) => {
    return '₹' + Number(val || 0).toLocaleString('en-IN');
  };

  const handleQuantityChange = useCallback((id, newQty) => {
    if (newQty <= 0) {
      handleRemoveItem(id);
      return;
    }
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, quantity: newQty } : item))
    );
  }, []);

  const handleRemoveItem = useCallback((id) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const handleApplyPromo = (e) => {
    e.preventDefault();
    setPromoError(null);
    const code = promoCodeInput.trim().toUpperCase();
    if (!code) return;

    if (code === 'GRANDRJ' || code === 'ROYALE10' || code === 'ROYAL10' || code === 'FESTIVE10') {
      setAppliedPromo(code);
      try {
        sessionStorage.setItem('rjfc_cart_promo_code', code);
      } catch (_) {}
      setPromoCodeInput('');
      setPromoExpanded(false);
    } else {
      setPromoError('Invalid code');
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

  const handleContinue = () => {
    if (onContinueShopping) {
      onContinueShopping();
    } else if (typeof window !== 'undefined') {
      window.location.href = '/shop.html';
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFFFF] text-[#0F0F0F] antialiased selection:bg-[#0F0F0F] selection:text-[#FFFFFF]">
      <main className="max-w-[1280px] mx-auto px-6 sm:px-10 lg:px-16 pt-12 pb-24 md:pt-16 md:pb-32">
        {/* Header: Title & Discreet Continue Shopping */}
        <header className="flex items-baseline justify-between border-b border-[#EAEAEA] pb-6 mb-12 sm:mb-16">
          <div className="flex items-baseline gap-3">
            <h1 className="font-serif text-2xl sm:text-3xl font-light tracking-[0.05em] text-[#0F0F0F]">
              Shopping Bag
            </h1>
            <span className="font-sans text-[13px] tracking-widest text-[#707070] font-light">
              ({itemCount})
            </span>
          </div>

          <button
            type="button"
            onClick={handleContinue}
            className="font-sans text-[12px] uppercase tracking-[0.14em] text-[#707070] hover:text-[#0F0F0F] transition-colors underline-offset-4 hover:underline"
          >
            Continue Shopping
          </button>
        </header>

        {/* Empty State */}
        {items.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="py-24 sm:py-36 text-center max-w-[480px] mx-auto"
          >
            <p className="font-serif text-xl sm:text-2xl font-light tracking-[0.03em] text-[#0F0F0F] mb-8">
              Your bag is currently empty.
            </p>
            <button
              type="button"
              onClick={handleContinue}
              className="inline-block font-sans text-[12px] uppercase tracking-[0.18em] text-[#0F0F0F] border-b border-[#0F0F0F] pb-1 hover:text-[#707070] hover:border-[#707070] transition-all"
            >
              Explore the Collection
            </button>
          </motion.div>
        ) : (
          /* 2-Column Balanced Grid */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-start">
            {/* Left Side: Items List (7 cols) */}
            <div className="lg:col-span-7">
              <div className="divide-y divide-[#EAEAEA]">
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
                        transition: { duration: 0.35, ease: [0.25, 1, 0.5, 1] }
                      }}
                      className="py-8 sm:py-10 first:pt-0 flex gap-6 sm:gap-10 items-start"
                    >
                      {/* Portrait Thumbnail (3:4 aspect ratio) */}
                      <div className="w-[110px] sm:w-[130px] flex-shrink-0">
                        <div className="aspect-[3/4] bg-[#F7F7F7] overflow-hidden">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-full h-full object-cover object-center transition-transform duration-700 hover:scale-105"
                            loading="lazy"
                          />
                        </div>
                      </div>

                      {/* Item Specifications & Actions */}
                      <div className="flex-1 flex flex-col justify-between min-h-[145px] sm:min-h-[173px] py-0.5">
                        <div className="space-y-1.5">
                          {/* SKU / Item Code */}
                          {item.sku && (
                            <p className="font-sans text-[10px] tracking-[0.16em] uppercase text-[#707070]">
                              {item.sku}
                            </p>
                          )}

                          {/* Product Title */}
                          <h2 className="font-serif text-lg sm:text-xl font-normal text-[#0F0F0F] tracking-[0.02em] leading-snug">
                            {item.name}
                          </h2>

                          {/* Color & Size */}
                          <div className="pt-1 flex flex-wrap gap-x-4 gap-y-1 font-sans text-[12px] tracking-wider text-[#707070]">
                            {item.color && <span>Color: {item.color}</span>}
                            <span>Size: {item.size || 'Standard'}</span>
                          </div>
                        </div>

                        {/* Bottom Row: Minimal Inline Quantity Stepper, Price, and Remove */}
                        <div className="flex items-center justify-between pt-6 border-t border-[#F2F2F2] mt-4">
                          {/* Minimalist Inline Stepper */}
                          <div className="flex items-center gap-3 font-sans text-[13px] text-[#0F0F0F]">
                            <button
                              type="button"
                              onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                              aria-label="Decrease quantity"
                              className="w-5 h-5 flex items-center justify-center text-[#707070] hover:text-[#0F0F0F] transition-colors font-light text-base"
                            >
                              −
                            </button>
                            <span className="w-5 text-center font-normal tracking-wide text-[12px]">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                              aria-label="Increase quantity"
                              className="w-5 h-5 flex items-center justify-center text-[#707070] hover:text-[#0F0F0F] transition-colors font-light text-base"
                            >
                              +
                            </button>
                          </div>

                          {/* Price & Remove */}
                          <div className="flex items-center gap-6">
                            <span className="font-sans text-[13px] sm:text-[14px] font-normal tracking-wide text-[#0F0F0F]">
                              {formatPrice(item.price * item.quantity)}
                            </span>

                            <button
                              type="button"
                              onClick={() => handleRemoveItem(item.id)}
                              className="font-sans text-[11px] uppercase tracking-[0.12em] text-[#707070] hover:text-[#0F0F0F] underline-offset-4 hover:underline transition-colors"
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

            {/* Right Side: Clean Borderless Summary & Checkout (5 cols, Sticky) */}
            <div className="lg:col-span-5 lg:pl-6">
              <div className="lg:sticky lg:top-24 space-y-8">
                {/* Summary Rows */}
                <div className="space-y-4 pt-2">
                  <div className="flex justify-between items-baseline font-sans text-[13px] tracking-wide text-[#707070]">
                    <span>Subtotal</span>
                    <span className="text-[#0F0F0F] font-normal">{formatPrice(subtotal)}</span>
                  </div>

                  {appliedPromo && promoDiscount > 0 && (
                    <div className="flex justify-between items-baseline font-sans text-[13px] tracking-wide text-[#707070]">
                      <div className="flex items-center gap-2">
                        <span>Promo ({appliedPromo})</span>
                        <button
                          type="button"
                          onClick={handleRemovePromo}
                          className="text-[10px] text-[#707070] hover:text-[#0F0F0F]"
                          title="Remove promo"
                        >
                          ✕
                        </button>
                      </div>
                      <span className="text-[#0F0F0F] font-normal">− {formatPrice(promoDiscount)}</span>
                    </div>
                  )}

                  <div className="flex justify-between items-baseline font-sans text-[13px] tracking-wide text-[#707070]">
                    <span>Shipping</span>
                    <span className="text-[#707070] text-[12px]">Calculated at checkout</span>
                  </div>

                  <div className="border-t border-[#EAEAEA] pt-5 flex justify-between items-baseline">
                    <span className="font-serif text-lg tracking-[0.04em] text-[#0F0F0F] font-light">
                      Total
                    </span>
                    <span className="font-sans text-base sm:text-lg font-normal tracking-wide text-[#0F0F0F]">
                      {formatPrice(total)}
                    </span>
                  </div>
                </div>

                {/* Collapsible Discreet Promo Code */}
                <div className="pt-2 border-t border-[#F2F2F2]">
                  {!promoExpanded && !appliedPromo && (
                    <button
                      type="button"
                      onClick={() => setPromoExpanded(true)}
                      className="font-sans text-[11px] uppercase tracking-[0.14em] text-[#707070] hover:text-[#0F0F0F] transition-colors underline-offset-4 hover:underline"
                    >
                      + Add Promo Code
                    </button>
                  )}

                  {promoExpanded && !appliedPromo && (
                    <form onSubmit={handleApplyPromo} className="space-y-3 pt-2">
                      <div className="flex items-end gap-3">
                        <div className="flex-1">
                          <input
                            type="text"
                            value={promoCodeInput}
                            onChange={(e) => setPromoCodeInput(e.target.value)}
                            placeholder="ENTER CODE"
                            className="w-full bg-transparent border-b border-[#0F0F0F] pb-1 font-sans text-[12px] tracking-[0.16em] uppercase text-[#0F0F0F] placeholder-[#A0A0A0] focus:outline-none"
                            autoFocus
                          />
                        </div>
                        <button
                          type="submit"
                          className="font-sans text-[11px] uppercase tracking-[0.14em] text-[#0F0F0F] pb-1 border-b border-[#0F0F0F] hover:text-[#707070] hover:border-[#707070] transition-colors"
                        >
                          Apply
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setPromoExpanded(false);
                            setPromoError(null);
                          }}
                          className="font-sans text-[11px] uppercase tracking-[0.14em] text-[#707070] pb-1 hover:text-[#0F0F0F]"
                        >
                          Cancel
                        </button>
                      </div>
                      {promoError && (
                        <p className="font-sans text-[11px] text-[#A00000] tracking-wide">{promoError}</p>
                      )}
                    </form>
                  )}
                </div>

                {/* Primary Action Button: Solid Matte Black, 2px radius */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleProceed}
                    className="w-full bg-[#0F0F0F] text-[#FFFFFF] hover:bg-black transition-colors rounded-[2px] py-4 px-6 font-sans text-[12px] font-medium tracking-[0.2em] uppercase text-center block"
                  >
                    Proceed to Checkout
                  </button>
                </div>

                {/* Trust Note */}
                <p className="font-sans text-[11px] tracking-wide text-center text-[#707070] pt-2">
                  Complimentary returns within 14 days • Encrypted checkout
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default CartPage;
