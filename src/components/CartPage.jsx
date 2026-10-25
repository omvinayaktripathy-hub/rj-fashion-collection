import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingBag,
  Trash2,
  Heart,
  Plus,
  Minus,
  ArrowRight,
  ShieldCheck,
  Truck,
  Tag,
  Gift,
  Lock,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  X,
} from 'lucide-react';

/* =========================================================================
   MOCK EDITORIAL CART & UPSELL DATA
   ========================================================================= */

export const DEFAULT_CART_ITEMS = [
  {
    id: 'cart_1',
    productId: 1,
    name: 'Royal Kanjivaram Pure Silk Zari Saree',
    brand: 'RJ SIGNATURE',
    price: 3499,
    originalPrice: 6999,
    discount: 50,
    quantity: 1,
    size: 'Free Size (5.5m + Blouse)',
    color: 'Ruby Maroon',
    image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80',
    stock: 2, // Urgency cue
    seller: 'RJ Fashion Boutique',
  },
  {
    id: 'cart_2',
    productId: 3,
    name: 'Handcrafted Kundan Polki Choker & Jhumka Ensemble',
    brand: 'RJ JEWELS VAULT',
    price: 2499,
    originalPrice: 4999,
    discount: 50,
    quantity: 1,
    size: 'Standard Fit',
    color: 'Antique Gold Finish',
    image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=800&q=80',
    stock: 8,
    seller: 'RJ Fashion Boutique',
  },
];

export const UPSELL_ACCESSORIES = [
  {
    id: 101,
    name: 'Artisan Raw Silk Potli Clutch with Pearls',
    category: 'Accessories',
    price: 1299,
    originalPrice: 1999,
    image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 102,
    name: 'Antique Brass Kundan Statement Drop Earrings',
    category: 'Jewellery',
    price: 899,
    originalPrice: 1499,
    image: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 103,
    name: 'Royal Multi-Strand Pearl & Gold Choker',
    category: 'Jewellery',
    price: 1699,
    originalPrice: 2499,
    image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 104,
    name: 'Classic Cat-Eye UV400 Luxury Acetate Shades',
    category: 'Eyewear',
    price: 1499,
    originalPrice: 2299,
    image: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=600&q=80',
  },
];

/* =========================================================================
   MAIN COMPONENT: CartPage
   ========================================================================= */

export const CartPage = ({
  initialItems = DEFAULT_CART_ITEMS,
  freeShippingThreshold = 999,
  onProceedToCheckout,
  onUpdateQuantity,
  onRemoveItem,
  onSaveForLater,
  onApplyCoupon,
  onQuickAddUpsell,
}) => {
  const [items, setItems] = useState(initialItems);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState('GRANDRJ');
  const [isGiftPackaging, setIsGiftPackaging] = useState(false);
  const [giftMessage, setGiftMessage] = useState('');
  const [toastMessage, setToastMessage] = useState(null);

  // Trigger Toast Notification
  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Quantity Stepper Handler
  const handleQuantityChange = (itemId, newQty) => {
    if (newQty <= 0) {
      handleRemoveItem(itemId);
      return;
    }
    setItems((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, quantity: newQty } : item))
    );
    if (onUpdateQuantity) onUpdateQuantity(itemId, newQty);
  };

  // Remove Item Handler
  const handleRemoveItem = (itemId) => {
    const itemToRemove = items.find((i) => i.id === itemId);
    setItems((prev) => prev.filter((i) => i.id !== itemId));
    triggerToast(`Removed "${itemToRemove?.name || 'Item'}" from shopping bag`);
    if (onRemoveItem) onRemoveItem(itemId);
  };

  // Save for Later (Wishlist) Handler
  const handleSaveForLater = (item) => {
    setItems((prev) => prev.filter((i) => i.id !== item.id));
    triggerToast(`Moved "${item.name}" to your wishlist`);
    if (onSaveForLater) onSaveForLater(item);
  };

  // Apply Promo Code
  const handleApplyPromo = (e) => {
    e.preventDefault();
    const cleanCode = couponCode.trim().toUpperCase();
    if (!cleanCode) return;
    if (cleanCode === 'GRANDRJ' || cleanCode === 'ROYALE10') {
      setAppliedCoupon(cleanCode);
      setCouponCode('');
      triggerToast(`Promo code "${cleanCode}" applied successfully!`);
    } else {
      triggerToast('Invalid coupon code. Try "GRANDRJ" for 10% off.');
    }
  };

  // Quick Add Upsell Item
  const handleAddUpsell = (product) => {
    const newItem = {
      id: `upsell_${Date.now()}`,
      productId: product.id,
      name: product.name,
      brand: 'RJ ACCESSORIES',
      price: product.price,
      originalPrice: product.originalPrice,
      discount: product.originalPrice ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) : 0,
      quantity: 1,
      size: 'One Size',
      image: product.image,
      stock: 10,
    };
    setItems((prev) => [...prev, newItem]);
    triggerToast(`Added "${product.name}" to your bag!`);
    if (onQuickAddUpsell) onQuickAddUpsell(product);
  };

  // Summary Calculations
  const summary = useMemo(() => {
    const subtotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
    const originalSubtotal = items.reduce(
      (acc, item) => acc + (item.originalPrice || item.price) * item.quantity,
      0
    );
    const catalogDiscount = Math.max(0, originalSubtotal - subtotal);
    const promoDiscount = appliedCoupon ? Math.round(subtotal * 0.1) : 0; // 10% promo
    const shipping = subtotal >= freeShippingThreshold || items.length === 0 ? 0 : 99;
    const total = Math.max(0, subtotal - promoDiscount + shipping);

    return {
      subtotal,
      originalSubtotal,
      discountTotal: catalogDiscount + promoDiscount,
      promoDiscount,
      shipping,
      total,
    };
  }, [items, appliedCoupon, freeShippingThreshold]);

  // Shipping Progress
  const shippingRemaining = Math.max(0, freeShippingThreshold - summary.subtotal);
  const shippingPercent = Math.min(100, Math.round((summary.subtotal / freeShippingThreshold) * 100));

  return (
    <div className="w-full min-h-screen bg-[#F9F9F8] text-[#111111] dark:bg-[#0D0D0F] dark:text-[#F5EFEB] font-sans selection:bg-[#D4AF37] selection:text-black py-8 sm:py-12 px-4 sm:px-6 lg:px-12 box-border transition-colors duration-300">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* =========================================================================
            1. BREADCRUMBS & SECTION TITLE
            ========================================================================= */}
        <header className="space-y-4 border-b border-[#E5E7EB] dark:border-white/10 pb-6">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs uppercase tracking-wider text-[#78716C] dark:text-[#A8A29E]">
            <a href="/" className="hover:text-[#111111] dark:hover:text-white transition-colors">Home</a>
            <span className="opacity-40">/</span>
            <span className="font-semibold text-[#111111] dark:text-white">Shopping Bag</span>
          </nav>

          <div className="flex items-baseline justify-between gap-4">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl sm:text-4xl font-serif font-bold tracking-tight text-inherit">
                Shopping Bag
              </h1>
              <span className="inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-semibold bg-[#111111] text-white dark:bg-[#D4AF37] dark:text-black">
                {items.length} {items.length === 1 ? 'Piece' : 'Pieces'}
              </span>
            </div>

            <span className="hidden sm:inline-flex items-center gap-1.5 text-xs text-[#059669] dark:text-[#34D399] font-semibold">
              <ShieldCheck className="w-4 h-4" />
              <span>100% Certified Designer Guarantee</span>
            </span>
          </div>
        </header>

        {items.length > 0 ? (
          /* =========================================================================
              2. ACTIVE CART LAYOUT (2-Column Grid: 65% Left / 35% Sticky Right)
              ========================================================================= */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* LEFT COLUMN: Items List, Free Shipping Bar & Upsell (approx 65%) */}
            <div className="lg:col-span-8 space-y-6">

              {/* Dynamic Free Shipping Progress Bar */}
              <div className="p-4 sm:p-5 rounded-xl bg-white dark:bg-[#141418] border border-[#E5E7EB] dark:border-white/10 shadow-sm space-y-3">
                <div className="flex items-center justify-between text-xs sm:text-sm font-medium">
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-[#059669] dark:text-[#34D399]" />
                    {shippingRemaining === 0 ? (
                      <span className="font-semibold text-[#059669] dark:text-[#34D399]">
                        🎉 You have unlocked <strong>COMPLIMENTARY EXPRESS DELIVERY</strong>!
                      </span>
                    ) : (
                      <span>
                        Add <strong>₹{shippingRemaining.toLocaleString('en-IN')}</strong> more to unlock <strong>FREE Express Shipping</strong>
                      </span>
                    )}
                  </div>
                  <span className="font-bold text-xs text-[#78716C] dark:text-[#A8A29E]">
                    {shippingPercent}%
                  </span>
                </div>

                <div className="w-full h-2 rounded-full bg-[#E5E7EB] dark:bg-white/10 overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-[#059669] to-[#10B981] dark:from-[#D4AF37] dark:to-[#E5C158] rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${shippingPercent}%` }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                  />
                </div>
              </div>

              {/* Cart Items List */}
              <div className="space-y-4">
                <AnimatePresence>
                  {items.map((item) => {
                    const isLowStock = item.stock && item.stock <= 3;
                    return (
                      <motion.div
                        key={item.id}
                        layout
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="p-4 sm:p-6 rounded-xl bg-white dark:bg-[#141418] border border-[#E5E7EB] dark:border-white/10 shadow-sm flex flex-col sm:flex-row gap-5 items-start relative group"
                      >
                        {/* 3:4 Vertical Fashion Thumbnail */}
                        <div className="w-24 sm:w-28 aspect-[3/4] rounded-lg overflow-hidden bg-[#F1EDE6] dark:bg-[#19191F] shrink-0 border border-black/5 dark:border-white/5">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        </div>

                        {/* Item Details */}
                        <div className="flex-1 space-y-2.5 w-full">
                          <div className="flex justify-between items-start gap-4">
                            <div>
                              <span className="text-[10px] font-bold uppercase tracking-widest text-[#8C827A] dark:text-[#A8A29E]">
                                {item.brand || 'RJ SIGNATURE'}
                              </span>
                              <h3 className="text-base font-semibold text-inherit leading-snug">
                                <a href={`/product.html?id=${item.productId}`} className="hover:underline">
                                  {item.name}
                                </a>
                              </h3>
                            </div>

                            {/* Line Total */}
                            <div className="text-right">
                              <div className="text-base font-bold text-inherit">
                                ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                              </div>
                              {item.originalPrice && item.originalPrice > item.price && (
                                <div className="text-xs text-[#78716C] dark:text-[#A8A29E] line-through">
                                  ₹{(item.originalPrice * item.quantity).toLocaleString('en-IN')}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Attributes & Variant Pills */}
                          <div className="flex flex-wrap items-center gap-2 text-xs text-[#57534E] dark:text-[#A8A29E]">
                            {item.size && (
                              <span className="px-2 py-0.5 rounded bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 font-medium">
                                Size: <strong>{item.size}</strong>
                              </span>
                            )}
                            {item.color && (
                              <span className="px-2 py-0.5 rounded bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 font-medium">
                                Color: <strong>{item.color}</strong>
                              </span>
                            )}
                            {item.discount && item.discount > 0 && (
                              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#059669]/10 text-[#059669] dark:text-[#34D399]">
                                {item.discount}% OFF
                              </span>
                            )}
                          </div>

                          {/* Scarcity Alert */}
                          {isLowStock && (
                            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#B91C1C] dark:text-[#F87171]">
                              <AlertCircle className="w-3.5 h-3.5" />
                              <span>⚡ Only {item.stock} left in stock — order soon</span>
                            </div>
                          )}

                          {/* Quantity Stepper & Action Controls */}
                          <div className="pt-2 flex flex-wrap items-center justify-between gap-4 border-t border-[#E5E7EB] dark:border-white/5">
                            {/* Quantity Stepper */}
                            <div className="inline-flex items-center border border-[#E5E7EB] dark:border-white/10 rounded-lg bg-white dark:bg-[#19191F]">
                              <button
                                type="button"
                                onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                                className="w-8 h-8 flex items-center justify-center text-[#78716C] hover:text-black dark:hover:text-white transition-colors"
                                aria-label="Decrease quantity"
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <span className="w-9 text-center text-xs font-bold text-inherit">
                                {item.quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                                className="w-8 h-8 flex items-center justify-center text-[#78716C] hover:text-black dark:hover:text-white transition-colors"
                                aria-label="Increase quantity"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            {/* Secondary Actions: Move to Wishlist & Remove */}
                            <div className="flex items-center gap-4 text-xs font-semibold">
                              <button
                                type="button"
                                onClick={() => handleSaveForLater(item)}
                                className="inline-flex items-center gap-1.5 text-[#57534E] dark:text-[#A8A29E] hover:text-[#B38B22] dark:hover:text-[#D4AF37] transition-colors"
                              >
                                <Heart className="w-3.5 h-3.5" />
                                <span>Save for Later</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemoveItem(item.id)}
                                className="inline-flex items-center gap-1.5 text-[#78716C] dark:text-[#A8A29E] hover:text-[#DC2626] dark:hover:text-[#F87171] transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Remove</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>

              {/* Luxury Gifting Option Drawer */}
              <div className="p-4 sm:p-5 rounded-xl bg-white dark:bg-[#141418] border border-[#E5E7EB] dark:border-white/10 shadow-sm space-y-3">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isGiftPackaging}
                    onChange={(e) => setIsGiftPackaging(e.target.checked)}
                    className="w-4 h-4 mt-0.5 rounded text-[#D4AF37] focus:ring-[#D4AF37] cursor-pointer"
                  />
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2 text-sm font-semibold text-inherit">
                      <Gift className="w-4 h-4 text-[#D4AF37]" />
                      <span>Complimentary Luxury Gift Packaging & Greeting Card</span>
                    </div>
                    <p className="text-xs text-[#78716C] dark:text-[#A8A29E]">
                      Includes premium gold-ribbon keepsake box and a handwritten royal calligraphic message card.
                    </p>
                  </div>
                </label>

                {isGiftPackaging && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="pt-2 pl-7"
                  >
                    <textarea
                      value={giftMessage}
                      onChange={(e) => setGiftMessage(e.target.value)}
                      placeholder="Write your personalized celebration greeting here (optional)..."
                      rows={2}
                      maxLength={200}
                      className="w-full p-3 rounded-lg border border-[#E5E7EB] dark:border-white/10 bg-[#F9F9F8] dark:bg-[#19191F] text-xs text-inherit focus:outline-none focus:border-[#D4AF37]"
                    />
                  </motion.div>
                )}
              </div>

              {/* Complete Your Look / Upsell Carousel */}
              <div className="pt-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-serif font-bold text-inherit">
                      Complete Your Royal Look
                    </h3>
                    <p className="text-xs text-[#78716C] dark:text-[#A8A29E]">
                      Handcrafted accessories curated to pair with your ensemble.
                    </p>
                  </div>
                  <Sparkles className="w-4 h-4 text-[#D4AF37]" />
                </div>

                {/* Horizontal Scrolling Cards */}
                <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-none max-w-full">
                  {UPSELL_ACCESSORIES.map((upsell) => (
                    <div
                      key={upsell.id}
                      className="w-48 sm:w-52 shrink-0 p-3 rounded-xl bg-white dark:bg-[#141418] border border-[#E5E7EB] dark:border-white/10 shadow-sm flex flex-col justify-between space-y-3 group"
                    >
                      <div className="w-full aspect-[3/4] rounded-lg overflow-hidden bg-[#F1EDE6] dark:bg-[#19191F]">
                        <img
                          src={upsell.image}
                          alt={upsell.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>

                      <div className="space-y-1">
                        <span className="text-[10px] uppercase font-bold text-[#8C827A] dark:text-[#A8A29E]">
                          {upsell.category}
                        </span>
                        <h4 className="text-xs font-semibold text-inherit line-clamp-1">
                          {upsell.name}
                        </h4>
                        <div className="flex items-baseline gap-2">
                          <span className="text-sm font-bold text-inherit">
                            ₹{upsell.price.toLocaleString('en-IN')}
                          </span>
                          {upsell.originalPrice && (
                            <span className="text-[11px] text-[#78716C] dark:text-[#A8A29E] line-through">
                              ₹{upsell.originalPrice.toLocaleString('en-IN')}
                            </span>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleAddUpsell(upsell)}
                        className="w-full py-2 rounded-lg text-[11px] font-bold uppercase tracking-wider bg-[#111111] text-white hover:bg-[#2B2520] dark:bg-[#D4AF37] dark:text-black dark:hover:bg-[#E5C158] transition-colors flex items-center justify-center gap-1.5"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Quick Add</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* RIGHT COLUMN: Sticky Order Summary & Checkout CTA (approx 35%) */}
            <aside className="lg:col-span-4 sticky top-24 space-y-6">
              <div className="p-6 rounded-2xl bg-white dark:bg-[#141418] border border-[#E5E7EB] dark:border-white/10 shadow-sm space-y-6">
                <h2 className="text-base font-bold uppercase tracking-wider text-inherit border-b border-[#E5E7EB] dark:border-white/10 pb-4">
                  Order Summary
                </h2>

                {/* Promo Code Input */}
                <form onSubmit={handleApplyPromo} className="space-y-2">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Tag className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#78716C]" />
                      <input
                        type="text"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        placeholder="Enter Promo Code"
                        className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-[#E5E7EB] dark:border-white/10 bg-[#F9F9F8] dark:bg-[#19191F] text-xs font-semibold text-inherit uppercase placeholder:normal-case focus:outline-none focus:border-[#D4AF37]"
                      />
                    </div>
                    <button
                      type="submit"
                      className="px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider bg-[#111111] text-white hover:bg-[#2B2520] dark:bg-[#D4AF37] dark:text-black dark:hover:bg-[#E5C158] transition-colors"
                    >
                      Apply
                    </button>
                  </div>

                  {/* Active Promo Pill */}
                  {appliedCoupon && (
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-[#059669]/10 text-[#059669] dark:text-[#34D399]">
                      <span>Code <strong>{appliedCoupon}</strong> Applied (-10%)</span>
                      <button
                        type="button"
                        onClick={() => {
                          setAppliedCoupon(null);
                          triggerToast('Promo code removed');
                        }}
                        className="hover:opacity-75"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </form>

                {/* Price Breakdown */}
                <div className="space-y-3 text-xs sm:text-sm border-t border-[#E5E7EB] dark:border-white/10 pt-4">
                  <div className="flex justify-between text-[#57534E] dark:text-[#A8A29E]">
                    <span>Original Price ({items.length} items)</span>
                    <span>₹{summary.originalSubtotal.toLocaleString('en-IN')}</span>
                  </div>

                  {summary.discountTotal > 0 && (
                    <div className="flex justify-between text-[#059669] dark:text-[#34D399] font-semibold">
                      <span>Total Savings</span>
                      <span>− ₹{summary.discountTotal.toLocaleString('en-IN')}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-[#57534E] dark:text-[#A8A29E]">
                    <span>Estimated Shipping</span>
                    {summary.shipping === 0 ? (
                      <span className="font-bold text-[#059669] dark:text-[#34D399]">
                        <span className="line-through text-[#8C827A] mr-1">₹99</span> FREE
                      </span>
                    ) : (
                      <span>₹{summary.shipping}</span>
                    )}
                  </div>

                  <div className="flex justify-between text-[#57534E] dark:text-[#A8A29E]">
                    <span>Taxes & Duties (GST)</span>
                    <span className="text-[11px] font-semibold text-[#059669] dark:text-[#34D399]">Included</span>
                  </div>

                  {/* Total Amount */}
                  <div className="flex justify-between items-baseline pt-4 border-t border-[#E5E7EB] dark:border-white/10">
                    <span className="text-base font-bold text-inherit">Estimated Total</span>
                    <span className="text-xl sm:text-2xl font-bold text-inherit">
                      ₹{summary.total.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                {/* Primary Proceed to Checkout Button */}
                <button
                  type="button"
                  onClick={() => {
                    if (onProceedToCheckout) onProceedToCheckout();
                    else window.location.href = '/delivery.html';
                  }}
                  className="w-full py-4 rounded-xl text-xs font-bold uppercase tracking-wider bg-[#111111] text-white hover:bg-[#2B2520] dark:bg-[#D4AF37] dark:text-black dark:hover:bg-[#E5C158] transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                >
                  <Lock className="w-4 h-4" />
                  <span>Proceed to Checkout</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </button>

                {/* Trust Badges & Guarantee */}
                <div className="pt-2 border-t border-[#E5E7EB] dark:border-white/10 space-y-3">
                  <div className="flex justify-center items-center gap-4 text-xs text-[#78716C] dark:text-[#A8A29E]">
                    <span>VISA</span>
                    <span>•</span>
                    <span>MASTERCARD</span>
                    <span>•</span>
                    <span>UPI INTENT</span>
                    <span>•</span>
                    <span>CASH ON DELIVERY</span>
                  </div>
                  <p className="text-[11px] text-center text-[#8C827A] dark:text-[#A8A29E] leading-normal">
                    🔒 256-Bit SSL Encrypted Checkout • Authentic Luxury Handcraft
                  </p>
                </div>
              </div>
            </aside>

          </div>
        ) : (
          /* =========================================================================
              3. REFINED EMPTY SHOPPING BAG STATE
              ========================================================================= */
          <div className="py-24 px-4 text-center max-w-lg mx-auto space-y-6">
            <div className="w-20 h-20 mx-auto rounded-full bg-[#111111]/5 dark:bg-white/5 border border-[#E5E7EB] dark:border-white/10 flex items-center justify-center text-[#78716C] dark:text-[#A8A29E]">
              <ShoppingBag className="w-9 h-9 stroke-[1.2]" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-inherit">
                Your Shopping Bag is Empty
              </h2>
              <p className="text-sm text-[#78716C] dark:text-[#A8A29E] leading-relaxed">
                Discover our royal bridal silks, festive ensembles, and statement jewelry to find the perfect silhouette for your celebrations.
              </p>
            </div>

            <div className="pt-2">
              <a
                href="/shop.html?newArrival=true"
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-lg text-xs font-bold uppercase tracking-wider bg-[#111111] text-white hover:bg-[#2B2520] dark:bg-[#D4AF37] dark:text-black dark:hover:bg-[#E5C158] transition-all shadow-md hover:shadow-lg"
              >
                <span>Explore New Arrivals</span>
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        )}

      </div>

      {/* =========================================================================
          4. MOBILE PINNED BOTTOM STICKY BAR (Zero-Scroll Purchasing)
          ========================================================================= */}
      {items.length > 0 && (
        <div className="lg:hidden fixed bottom-14 left-0 right-0 z-40 bg-white/95 dark:bg-[#141418]/95 backdrop-blur-md border-t border-[#E5E7EB] dark:border-white/10 px-4 py-3 flex items-center justify-between shadow-2xl">
          <div>
            <span className="text-[10px] uppercase font-bold text-[#78716C] dark:text-[#A8A29E] block">
              Total ({items.length} items)
            </span>
            <span className="text-lg font-bold text-inherit">
              ₹{summary.total.toLocaleString('en-IN')}
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              if (onProceedToCheckout) onProceedToCheckout();
              else window.location.href = '/delivery.html';
            }}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-xs font-bold uppercase tracking-wider bg-[#111111] text-white dark:bg-[#D4AF37] dark:text-black shadow-md"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Checkout</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* =========================================================================
          5. MICRO-TOAST NOTIFICATION
          ========================================================================= */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-24 sm:bottom-6 right-6 z-50 max-w-sm px-4 py-3 rounded-xl bg-[#111111] text-white dark:bg-white dark:text-[#111111] shadow-2xl flex items-center gap-3 text-xs font-medium"
          >
            <CheckCircle2 className="w-4 h-4 text-[#D4AF37] dark:text-[#059669] shrink-0" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CartPage;
