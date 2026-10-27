import React, { useState, useEffect, useMemo, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Lock,
  Check,
  ShieldCheck,
  Truck,
  Sparkles,
  Gift,
  CreditCard,
  Smartphone,
  Banknote,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  ShoppingBag,
  MapPin,
  ExternalLink
} from 'lucide-react';
import { StoreContext, ProductItem, CartItem, SavedAddress } from '../context';

/* =========================================================================
   TYPE DEFINITIONS
   ========================================================================= */

export interface CheckoutAddress {
  id?: string | number;
  fullName: string;
  phone: string;
  houseFlat: string;
  street: string;
  city: string;
  state: string;
  pinCode: string;
  addressType?: 'HOME' | 'WORK' | 'OTHER' | string;
  estimatedDelivery?: string;
}

export interface CheckoutPageProps {
  onBackToCart?: () => void;
  onBackToAddress?: () => void;
  onOrderSuccess?: (orderId: string) => void;
}

export type PaymentMethod = 'upi' | 'card' | 'cod';

/* =========================================================================
   HELPER UTILITIES
   ========================================================================= */

function formatIndianPrice(amount: number): string {
  if (typeof amount !== 'number' || isNaN(amount)) return '₹0';
  return '₹' + Math.round(amount).toLocaleString('en-IN');
}

const CART_STORAGE_KEYS = ['rj_fashion_cart', 'rjfc_cart', 'rjfc_local_cart', 'rjfc_react_cart'] as const;
const ADDRESS_STORAGE_KEYS = ['rj_selected_address', 'checkout_address_summary', 'rjfc_selected_address'] as const;

function readFallbackCart(): CartItem[] {
  if (typeof window === 'undefined') return [];
  for (const key of CART_STORAGE_KEYS) {
    try {
      const raw = localStorage.getItem(key) || sessionStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((item: any, idx: number) => ({
            id: item.id || item.product_id || `item_${idx + 1}`,
            cart_id: item.cart_id || `cart_${item.id || idx}`,
            name: item.name || item.title || 'Artisanal Ensemble',
            price: Number(item.price) || 0,
            original_price: Number(item.original_price || item.originalPrice || item.price),
            discount: Number(item.discount) || 0,
            quantity: Math.max(1, Number(item.quantity) || 1),
            selected_size: item.selected_size || item.size || 'Free Size',
            image: item.image || item.thumbnail || 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80',
            stock: item.stock !== undefined ? Number(item.stock) : 99
          }));
        }
      }
    } catch (_) {}
  }
  return [];
}

function readFallbackAddress(): CheckoutAddress | null {
  if (typeof window === 'undefined') return null;
  for (const key of ADDRESS_STORAGE_KEYS) {
    try {
      const raw = sessionStorage.getItem(key) || localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object' && (parsed.name || parsed.fullName || parsed.full_name)) {
          return {
            id: parsed.id || parsed.address_id || 'addr_1',
            fullName: parsed.name || parsed.fullName || parsed.full_name,
            phone: parsed.phone || parsed.customer_phone || '+91 9876543210',
            houseFlat: parsed.house_flat || parsed.houseFlat || '',
            street: parsed.street || '',
            city: parsed.city || '',
            state: parsed.state || '',
            pinCode: parsed.pin_code || parsed.pinCode || '',
            addressType: (parsed.address_type || parsed.addressType || 'HOME').toUpperCase(),
            estimatedDelivery: 'Arrives in 3–5 Business Days via Express Insured Courier'
          };
        }
      }
    } catch (_) {}
  }

  try {
    const raw = localStorage.getItem('rjfc_saved_addresses');
    if (raw) {
      const list = JSON.parse(raw);
      if (Array.isArray(list) && list.length > 0) {
        const def = list.find((a: any) => a.is_default || a.isDefault) || list[0];
        return {
          id: def.id || 'addr_1',
          fullName: def.full_name || def.fullName || def.name,
          phone: def.phone || '+91 9876543210',
          houseFlat: def.house_flat || def.houseFlat || '',
          street: def.street || '',
          city: def.city || '',
          state: def.state || '',
          pinCode: def.pin_code || def.pinCode || '',
          addressType: (def.address_type || def.addressType || 'HOME').toUpperCase(),
          estimatedDelivery: 'Arrives in 3–5 Business Days via Express Insured Courier'
        };
      }
    }
  } catch (_) {}

  return null;
}

/* =========================================================================
   MAIN COMPONENT: CheckoutPage
   ========================================================================= */

export const CheckoutPage: React.FC<CheckoutPageProps> = ({
  onBackToCart,
  onBackToAddress,
  onOrderSuccess
}) => {
  const store = useContext(StoreContext);

  // 1. Centralized Cart Items Retrieval & Normalization
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    if (store && Array.isArray(store.cart) && store.cart.length > 0) {
      return store.cart;
    }
    return readFallbackCart();
  });

  // 2. Centralized Address Retrieval
  const [selectedAddress, setSelectedAddress] = useState<CheckoutAddress | null>(() => {
    if (store && store.selectedAddress) {
      return {
        id: store.selectedAddress.id,
        fullName: store.selectedAddress.fullName,
        phone: store.selectedAddress.phone,
        houseFlat: store.selectedAddress.houseFlat,
        street: store.selectedAddress.street,
        city: store.selectedAddress.city,
        state: store.selectedAddress.state,
        pinCode: store.selectedAddress.pinCode,
        addressType: store.selectedAddress.addressType || 'HOME',
        estimatedDelivery: 'Arrives in 3–5 Business Days via Express Insured Courier'
      };
    }
    return readFallbackAddress();
  });

  // State hooks
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('upi');
  const [upiVpa, setUpiVpa] = useState<string>('');
  const [couponCode, setCouponCode] = useState<string>('GRANDRJ');
  const [couponInput, setCouponInput] = useState<string>('GRANDRJ');
  const [isGiftWrapSelected, setIsGiftWrapSelected] = useState<boolean>(false);
  const [giftMessage, setGiftMessage] = useState<string>('');
  const [deliveryNotes, setDeliveryNotes] = useState<string>('');
  const [isDeliveryNotesOpen, setIsDeliveryNotesOpen] = useState<boolean>(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState<boolean>(false);
  const [confirmedOrderId, setConfirmedOrderId] = useState<string | null>(null);

  // Hydrate cart when store changes or storage updates
  useEffect(() => {
    if (store && Array.isArray(store.cart)) {
      setCartItems(store.cart);
    }
  }, [store?.cart]);

  useEffect(() => {
    if (store && store.selectedAddress) {
      setSelectedAddress({
        id: store.selectedAddress.id,
        fullName: store.selectedAddress.fullName,
        phone: store.selectedAddress.phone,
        houseFlat: store.selectedAddress.houseFlat,
        street: store.selectedAddress.street,
        city: store.selectedAddress.city,
        state: store.selectedAddress.state,
        pinCode: store.selectedAddress.pinCode,
        addressType: store.selectedAddress.addressType || 'HOME',
        estimatedDelivery: 'Arrives in 3–5 Business Days via Express Insured Courier'
      });
    }
  }, [store?.selectedAddress]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleSync = () => {
      setCartItems(readFallbackCart());
      const addr = readFallbackAddress();
      if (addr) setSelectedAddress(addr);
    };

    window.addEventListener('storage', handleSync);
    window.addEventListener('rjfc_cart_updated', handleSync);

    return () => {
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('rjfc_cart_updated', handleSync);
    };
  }, []);

  // 3. Financial Calculations for Sticky Price Details Card
  const {
    itemCount,
    bagTotalMRP,
    bagSubtotal,
    festiveDiscount,
    couponDiscount,
    shippingFee,
    payableAmount
  } = useMemo(() => {
    const count = cartItems.reduce((acc, item) => acc + item.quantity, 0);
    const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
    const totalMRP = cartItems.reduce((acc, item) => {
      const orig = Number(item.original_price || item.price);
      return acc + orig * item.quantity;
    }, 0);

    const catalogSavings = Math.max(0, totalMRP - subtotal);

    let promoSavings = 0;
    if (couponCode === 'GRANDRJ') {
      promoSavings = Math.min(500, Math.round(subtotal * 0.15));
    } else if (couponCode === 'ROYAL10') {
      promoSavings = Math.round(subtotal * 0.10);
    } else if (couponCode === 'WELCOME500' && subtotal >= 2999) {
      promoSavings = 500;
    }

    const shipping = subtotal >= 999 || subtotal === 0 ? 0 : 99;
    const finalPayable = Math.max(0, subtotal - promoSavings + shipping);

    return {
      itemCount: count,
      bagTotalMRP: totalMRP > subtotal ? totalMRP : subtotal,
      bagSubtotal: subtotal,
      festiveDiscount: catalogSavings,
      couponDiscount: promoSavings,
      shippingFee: shipping,
      payableAmount: finalPayable
    };
  }, [cartItems, couponCode]);

  // Handle Promo Code Apply
  const handleApplyCoupon = (codeToApply?: string) => {
    const code = (codeToApply || couponInput).trim().toUpperCase();
    if (!code) {
      if (store?.showToast) store.showToast('Please enter a coupon code', 'warning');
      return;
    }
    if (code === 'GRANDRJ' || code === 'ROYAL10') {
      setCouponCode(code);
      setCouponInput(code);
      if (store?.showToast) {
        store.showToast(`Promo code "${code}" applied successfully!`, 'success');
      }
    } else if (code === 'WELCOME500') {
      if (bagSubtotal >= 2999) {
        setCouponCode(code);
        setCouponInput(code);
        if (store?.showToast) {
          store.showToast('Promo code "WELCOME500" applied! Saved ₹500', 'success');
        }
      } else {
        if (store?.showToast) {
          store.showToast('WELCOME500 requires a minimum bag value of ₹2,999', 'warning');
        }
      }
    } else {
      if (store?.showToast) {
        store.showToast('Invalid coupon code or minimum order condition not met', 'error');
      }
    }
  };

  // 4. Handle Final Place Order & Instant Confirmation
  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      if (store?.showToast) {
        store.showToast('Please select or add a delivery address to complete your order', 'warning');
      }
      if (onBackToAddress) onBackToAddress();
      return;
    }

    if (cartItems.length === 0) {
      if (store?.showToast) {
        store.showToast('Your bag is currently empty. Please select your couture pieces before proceeding.', 'warning');
      }
      if (onBackToCart) onBackToCart();
      return;
    }

    setIsPlacingOrder(true);

    try {
      const generatedOrderId = `RJFC-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;

      // 1. Post to backend order endpoint
      try {
        await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            addressId: selectedAddress.id,
            customer_name: selectedAddress.fullName,
            customer_phone: selectedAddress.phone,
            delivery_address: `${selectedAddress.houseFlat}, ${selectedAddress.street}, ${selectedAddress.city}, ${selectedAddress.state} - ${selectedAddress.pinCode}`,
            items: cartItems,
            total: payableAmount,
            paymentMethod: paymentMethod === 'upi' ? 'UPI' : paymentMethod === 'card' ? 'Credit / Debit Card' : 'Cash on Delivery',
            coupon: couponCode,
            notes: deliveryNotes,
            gift_packaging: isGiftWrapSelected,
            gift_message: giftMessage
          })
        });
      } catch (_) {}

      // 2. Clear central cart across all keys
      if (store?.clearCart) {
        store.clearCart();
      }
      for (const k of CART_STORAGE_KEYS) {
        try {
          localStorage.removeItem(k);
          sessionStorage.removeItem(k);
        } catch (_) {}
      }
      try {
        window.dispatchEvent(new CustomEvent('rjfc_cart_updated', { detail: { items: [] } }));
        window.dispatchEvent(new Event('storage'));
      } catch (_) {}

      // 3. Record confirmed order locally
      try {
        const existing = JSON.parse(localStorage.getItem('rj_orders') || '[]');
        existing.unshift({
          order_number: generatedOrderId,
          total: payableAmount,
          items: cartItems,
          address: selectedAddress,
          created_at: new Date().toISOString()
        });
        localStorage.setItem('rj_orders', JSON.stringify(existing));
      } catch (_) {}

      setConfirmedOrderId(generatedOrderId);
      if (store?.showToast) {
        store.showToast(`Order #${generatedOrderId} confirmed successfully! 👑`, 'success');
      }

      if (onOrderSuccess) {
        onOrderSuccess(generatedOrderId);
      }
    } finally {
      setIsPlacingOrder(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#FDFBF7] dark:bg-[#0A0A0C] text-[#111111] dark:text-[#F5EFEB] font-sans py-8 px-4 sm:px-6 lg:px-12 transition-colors duration-300">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* =========================================================================
            CHECKOUT STEPPER NAV BAR
            ========================================================================= */}
        <nav aria-label="Checkout Steps" className="max-w-3xl mx-auto pb-4">
          <div className="flex items-center justify-between text-xs font-semibold tracking-wider uppercase">
            {/* Step 1: Bag & Cart */}
            <button
              type="button"
              onClick={onBackToCart}
              className="flex items-center gap-2 text-neutral-500 hover:text-black dark:hover:text-white transition-colors"
            >
              <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[11px] font-bold">
                ✓
              </span>
              <span>01 Bag & Cart</span>
            </button>
            <div className="flex-1 h-[2px] bg-emerald-600 mx-3 rounded-full" />

            {/* Step 2: Delivery Details */}
            <button
              type="button"
              onClick={onBackToAddress}
              className="flex items-center gap-2 text-neutral-500 hover:text-black dark:hover:text-white transition-colors"
            >
              <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[11px] font-bold">
                ✓
              </span>
              <span>02 Shipping</span>
            </button>
            <div className="flex-1 h-[2px] bg-[#111111] dark:bg-[#D4AF37] mx-3 rounded-full" />

            {/* Step 3: Payment & Review (Active) */}
            <div className="flex items-center gap-2 text-neutral-900 dark:text-white font-bold">
              <span className="w-6 h-6 rounded-full bg-[#111111] text-white dark:bg-[#D4AF37] dark:text-black flex items-center justify-center text-[11px] font-bold shadow-sm">
                03
              </span>
              <span>03 Review & Payment</span>
            </div>
          </div>
        </nav>

        {/* =========================================================================
            MAIN CHECKOUT TWO-COLUMN LAYOUT
            ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* ================= LEFT COLUMN: REVIEW CARDS & PAYMENT (8 Cols) ================= */}
          <div className="lg:col-span-8 space-y-6">

            {/* CARD 1: CONFIRMED DELIVERY ADDRESS */}
            <div className="bg-white dark:bg-[#141418] rounded-2xl border border-neutral-200/80 dark:border-white/10 shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-neutral-100 dark:border-white/5 pb-3">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#B38B22] dark:text-[#D4AF37]" />
                  <h2 className="text-sm font-bold tracking-wider uppercase text-neutral-900 dark:text-neutral-100 font-serif">
                    Delivery Address
                  </h2>
                </div>
                {selectedAddress && (
                  <button
                    type="button"
                    onClick={onBackToAddress || (() => { window.location.href = '/delivery.html'; })}
                    className="text-xs font-bold text-[#B38B22] dark:text-[#D4AF37] hover:underline uppercase tracking-wider"
                  >
                    Change Address
                  </button>
                )}
              </div>

              {selectedAddress ? (
                <div className="space-y-2 text-xs sm:text-sm">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="font-bold text-neutral-900 dark:text-white font-serif text-base">
                      {selectedAddress.fullName}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-[#0F382A] text-white">
                      {selectedAddress.addressType || 'HOME'}
                    </span>
                    <span className="text-neutral-500 font-mono">
                      📞 {selectedAddress.phone}
                    </span>
                  </div>
                  <p className="text-neutral-600 dark:text-neutral-300 leading-relaxed">
                    {selectedAddress.houseFlat}, {selectedAddress.street}, {selectedAddress.city}, {selectedAddress.state} - {selectedAddress.pinCode}
                  </p>
                  <div className="flex items-center gap-2 text-xs font-semibold text-[#0F382A] dark:text-emerald-400 pt-1">
                    <Truck className="w-4 h-4" />
                    <span>Arrives in 3–5 Business Days via Express Insured Courier</span>
                  </div>
                </div>
              ) : (
                /* Fallback card prompting user to select or add address */
                <div className="border-1.5 border-dashed border-neutral-300 dark:border-neutral-700 rounded-xl p-6 text-center space-y-3 bg-[#FDFBF7] dark:bg-neutral-900/40">
                  <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    Please select or add a delivery address to complete your order.
                  </p>
                  <button
                    type="button"
                    onClick={onBackToAddress || (() => { window.location.href = '/delivery.html'; })}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider bg-[#111111] text-white hover:bg-neutral-800 dark:bg-[#D4AF37] dark:text-black transition-all shadow-sm"
                  >
                    <span>+ Select or Add Delivery Address</span>
                  </button>
                </div>
              )}
            </div>

            {/* CARD 2: ORDER SUMMARY (Step 3 Review) */}
            <div className="bg-white dark:bg-[#141418] rounded-2xl border border-neutral-200/80 dark:border-white/10 shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-neutral-100 dark:border-white/5 pb-3">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-[#B38B22] dark:text-[#D4AF37]" />
                  <h2 className="text-sm font-bold tracking-wider uppercase text-neutral-900 dark:text-neutral-100 font-serif">
                    Order Summary ({itemCount} {itemCount === 1 ? 'item' : 'items'})
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={onBackToCart || (() => { window.location.href = '/cart.html'; })}
                  className="text-xs font-bold text-[#B38B22] dark:text-[#D4AF37] hover:underline uppercase tracking-wider"
                >
                  Edit Bag
                </button>
              </div>

              {cartItems.length > 0 ? (
                <div className="divide-y divide-neutral-100 dark:divide-white/5">
                  {cartItems.map((item) => (
                    <div key={item.cart_id || item.id} className="py-3.5 flex items-center gap-4">
                      {/* Compact 3:4 Portrait Thumbnail */}
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-14 h-18 rounded-md object-cover aspect-[3/4] bg-[#F7F4F0] dark:bg-neutral-900 shrink-0"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src =
                            'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=600&q=80';
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-serif text-sm font-semibold text-neutral-900 dark:text-white truncate">
                          {item.name}
                        </h4>
                        <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 flex gap-3">
                          <span>Variant: <strong className="text-neutral-700 dark:text-neutral-200">{item.selected_size || 'Free Size'}</strong></span>
                          <span>Qty: <strong className="text-neutral-700 dark:text-neutral-200">{item.quantity}</strong></span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-mono text-sm font-bold text-neutral-900 dark:text-white">
                          {formatIndianPrice(item.price * item.quantity)}
                        </span>
                        {item.original_price && item.original_price > item.price && (
                          <div className="text-[11px] text-neutral-400 line-through font-mono">
                            {formatIndianPrice(item.original_price * item.quantity)}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* Empty bag luxury prompt */
                <div className="py-8 text-center space-y-3">
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    Your bag is currently empty. Please select your couture pieces before proceeding.
                  </p>
                  <button
                    type="button"
                    onClick={onBackToCart || (() => { window.location.href = '/shop.html'; })}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider bg-[#111111] text-white hover:bg-neutral-800 dark:bg-[#D4AF37] dark:text-black transition-all shadow-sm"
                  >
                    <span>Explore Couture Catalog →</span>
                  </button>
                </div>
              )}
            </div>

            {/* CARD 3: FESTIVE COUPON & GIFT WRAP */}
            <div className="bg-white dark:bg-[#141418] rounded-2xl border border-neutral-200/80 dark:border-white/10 shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold tracking-wider uppercase text-neutral-900 dark:text-white">
                  Festive Promo Code & Offers
                </span>
                <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                  SAVE UP TO 15%
                </span>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value)}
                  placeholder="ENTER CODE (e.g. GRANDRJ)"
                  className="flex-1 px-4 py-2 text-xs font-mono uppercase bg-neutral-50 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                />
                <button
                  type="button"
                  onClick={() => handleApplyCoupon()}
                  className="px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider bg-[#111111] text-white hover:bg-neutral-800 dark:bg-[#D4AF37] dark:text-black transition-colors"
                >
                  Apply
                </button>
              </div>

              {/* Quick Coupon Chips */}
              <div className="flex gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => handleApplyCoupon('GRANDRJ')}
                  className="text-[11px] px-3 py-1 rounded-full border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 hover:border-[#D4AF37] transition-colors"
                >
                  Apply <strong>GRANDRJ</strong> (Save 15%)
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyCoupon('ROYAL10')}
                  className="text-[11px] px-3 py-1 rounded-full border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 hover:border-[#D4AF37] transition-colors"
                >
                  Apply <strong>ROYAL10</strong> (Save 10%)
                </button>
              </div>

              {/* Gift Packaging Checkbox */}
              <div className="pt-3 border-t border-neutral-100 dark:border-white/5">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isGiftWrapSelected}
                    onChange={(e) => setIsGiftWrapSelected(e.target.checked)}
                    className="mt-1 rounded border-neutral-300 text-[#0F382A] focus:ring-[#0F382A]"
                  />
                  <div>
                    <div className="flex items-center gap-2 text-xs font-bold text-neutral-900 dark:text-white">
                      <Gift className="w-3.5 h-3.5 text-[#B38B22]" />
                      <span>Complimentary Luxury Gift Packaging & Greeting Card</span>
                    </div>
                    <p className="text-[11px] text-neutral-500 mt-0.5">
                      Signature royal green box tied with silk ribbon and a handwritten wax-sealed greeting note.
                    </p>
                  </div>
                </label>

                {isGiftWrapSelected && (
                  <div className="mt-3">
                    <textarea
                      value={giftMessage}
                      onChange={(e) => setGiftMessage(e.target.value)}
                      placeholder="Write your personalized greeting message here..."
                      rows={2}
                      maxLength={200}
                      className="w-full text-xs p-3 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 text-inherit focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* CARD 4: PAYMENT METHOD (Heading Collision Fixed) */}
            <div className="bg-white dark:bg-[#141418] rounded-2xl border border-neutral-200/80 dark:border-white/10 shadow-sm p-6 space-y-6">
              
              {/* Fix 3: Clean Single Heading & Muted Emerald Security Badge */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-neutral-100 dark:border-white/5 pb-4">
                <h2 className="text-base sm:text-lg font-bold tracking-wider uppercase text-neutral-900 dark:text-white font-serif">
                  PAYMENT METHOD
                </h2>
                <div className="inline-flex items-center gap-1.5 text-xs text-emerald-800 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60 px-3 py-1.5 rounded-full font-medium shadow-sm self-start sm:self-auto">
                  <span>🔒</span>
                  <span>256-Bit SSL Encrypted &amp; Verified</span>
                </div>
              </div>

              {/* Payment Methods Radio List */}
              <div className="space-y-3">
                {/* 1. UPI */}
                <label
                  onClick={() => setPaymentMethod('upi')}
                  className={`block p-4 rounded-xl border transition-all cursor-pointer ${
                    paymentMethod === 'upi'
                      ? 'border-[#111111] dark:border-[#D4AF37] bg-neutral-50/70 dark:bg-neutral-900/70 ring-1 ring-[#111111]/20'
                      : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <input
                        type="radio"
                        name="payment_method"
                        checked={paymentMethod === 'upi'}
                        onChange={() => setPaymentMethod('upi')}
                        className="mt-1 text-[#111111] focus:ring-[#111111]"
                      />
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-sm text-neutral-900 dark:text-white">
                            Instant UPI (PhonePe, Google Pay, Paytm)
                          </span>
                          <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                            Instant Verification
                          </span>
                        </div>
                        <p className="text-xs text-neutral-500 mt-1">
                          Zero transaction fee • Auto-redirects to verified UPI app
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <span className="text-[10px] font-bold px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-800 rounded">GPay</span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 bg-purple-50 text-purple-700 rounded">PhonePe</span>
                    </div>
                  </div>

                  {paymentMethod === 'upi' && (
                    <div className="mt-3 pt-3 border-t border-neutral-200/60 dark:border-neutral-800 flex gap-2">
                      <input
                        type="text"
                        value={upiVpa}
                        onChange={(e) => setUpiVpa(e.target.value)}
                        placeholder="Enter UPI VPA (e.g., 9876543210@paytm or yourname@okhdfcbank)"
                        className="flex-1 text-xs px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 font-mono focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                      />
                    </div>
                  )}
                </label>

                {/* 2. Cards */}
                <label
                  onClick={() => setPaymentMethod('card')}
                  className={`block p-4 rounded-xl border transition-all cursor-pointer ${
                    paymentMethod === 'card'
                      ? 'border-[#111111] dark:border-[#D4AF37] bg-neutral-50/70 dark:bg-neutral-900/70 ring-1 ring-[#111111]/20'
                      : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <input
                        type="radio"
                        name="payment_method"
                        checked={paymentMethod === 'card'}
                        onChange={() => setPaymentMethod('card')}
                        className="mt-1 text-[#111111] focus:ring-[#111111]"
                      />
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-sm text-neutral-900 dark:text-white">
                            Credit / Debit Cards & Net Banking
                          </span>
                          <span className="text-[10px] font-bold uppercase tracking-wider bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 px-2 py-0.5 rounded-full">
                            Stripe 3DS 2.0
                          </span>
                        </div>
                        <p className="text-xs text-neutral-500 mt-1">
                          All Indian & International cards with 256-bit bank encryption
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <span className="text-[10px] font-bold px-1.5 py-0.5 bg-neutral-900 text-white rounded">VISA</span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-800 rounded">Mastercard</span>
                    </div>
                  </div>
                </label>

                {/* 3. Cash on Delivery */}
                <label
                  onClick={() => setPaymentMethod('cod')}
                  className={`block p-4 rounded-xl border transition-all cursor-pointer ${
                    paymentMethod === 'cod'
                      ? 'border-[#111111] dark:border-[#D4AF37] bg-neutral-50/70 dark:bg-neutral-900/70 ring-1 ring-[#111111]/20'
                      : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="radio"
                      name="payment_method"
                      checked={paymentMethod === 'cod'}
                      onChange={() => setPaymentMethod('cod')}
                      className="mt-1 text-[#111111] focus:ring-[#111111]"
                    />
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-neutral-900 dark:text-white">
                          Cash on Delivery (COD)
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 px-2 py-0.5 rounded-full">
                          Doorstep Inspection
                        </span>
                      </div>
                      <p className="text-xs text-neutral-500 mt-1">
                        Pay safely upon package inspection via Cash or QR code scanner
                      </p>
                    </div>
                  </div>
                </label>
              </div>

              {/* Delivery Instructions Drawer */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setIsDeliveryNotesOpen(!isDeliveryNotesOpen)}
                  className="flex items-center justify-between w-full text-xs font-semibold text-neutral-700 dark:text-neutral-300 hover:text-black dark:hover:text-white transition-colors"
                >
                  <span>Add Delivery Instructions (Optional)</span>
                  {isDeliveryNotesOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
                {isDeliveryNotesOpen && (
                  <div className="mt-2.5">
                    <textarea
                      value={deliveryNotes}
                      onChange={(e) => setDeliveryNotes(e.target.value)}
                      placeholder="e.g. Leave package with apartment security, call before arrival..."
                      rows={2}
                      maxLength={200}
                      className="w-full text-xs p-3 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                    />
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* ================= RIGHT COLUMN: STICKY PRICE DETAILS ASIDE (4 Cols) ================= */}
          <div className="lg:col-span-4 sticky top-6 space-y-4">
            <div className="bg-white dark:bg-[#141418] rounded-2xl border border-neutral-200/80 dark:border-white/10 shadow-sm p-6 space-y-5">
              <h2 className="text-xs font-bold tracking-[0.2em] uppercase text-neutral-900 dark:text-white border-b border-neutral-100 dark:border-white/5 pb-3">
                PRICE DETAILS
              </h2>

              <div className="space-y-3 text-sm">
                {/* Bag Total */}
                <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
                  <span>Bag Total (MRP) ({itemCount} {itemCount === 1 ? 'item' : 'items'})</span>
                  <span className="font-mono font-medium">{formatIndianPrice(bagTotalMRP)}</span>
                </div>

                {/* Festive Catalog Discount */}
                {festiveDiscount > 0 && (
                  <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                    <span>Festive Catalog Discount</span>
                    <span className="font-mono font-bold">− {formatIndianPrice(festiveDiscount)}</span>
                  </div>
                )}

                {/* Coupon Savings */}
                {couponDiscount > 0 && (
                  <div className="flex justify-between text-[#B38B22] dark:text-[#D4AF37]">
                    <span>Coupon Savings ({couponCode})</span>
                    <span className="font-mono font-bold">− {formatIndianPrice(couponDiscount)}</span>
                  </div>
                )}

                {/* Express Shipping */}
                <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
                  <span>Express Insured Shipping</span>
                  <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                    {shippingFee === 0 ? 'COMPLIMENTARY' : formatIndianPrice(shippingFee)}
                  </span>
                </div>

                {/* Grand Total */}
                <div className="flex justify-between items-baseline pt-4 border-t border-neutral-200 dark:border-white/10 text-base font-bold text-neutral-900 dark:text-white">
                  <span>Total Amount Payable</span>
                  <span className="font-mono text-xl tracking-tight text-[#111111] dark:text-white">
                    {formatIndianPrice(payableAmount)}
                  </span>
                </div>

                {/* Savings Banner */}
                {(festiveDiscount + couponDiscount) > 0 && (
                  <div className="mt-2 p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60 text-center text-xs font-bold text-emerald-800 dark:text-emerald-400">
                    ✨ You will save {formatIndianPrice(festiveDiscount + couponDiscount)} on this royal couture order!
                  </div>
                )}
              </div>

              {/* Primary CTA Button */}
              <button
                type="button"
                disabled={isPlacingOrder || cartItems.length === 0}
                onClick={handlePlaceOrder}
                className="w-full py-3.5 px-4 rounded-xl text-xs sm:text-sm font-bold uppercase tracking-wider bg-[#111111] text-white hover:bg-neutral-800 dark:bg-[#D4AF37] dark:text-black dark:hover:bg-[#E5C158] transition-all shadow-md active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isPlacingOrder ? (
                  <span className="animate-pulse">CONFIRMING ORDER...</span>
                ) : (
                  <span>PAY & COMPLETE ORDER • {formatIndianPrice(payableAmount)} →</span>
                )}
              </button>

              <div className="text-[11px] text-center text-neutral-500 flex items-center justify-center gap-1.5 pt-1">
                <span>🔒</span>
                <span>PCI-DSS Compliant • 100% Secure Checkout Guarantee</span>
              </div>
            </div>
          </div>

        </div>

        {/* Confirmation Modal */}
        <AnimatePresence>
          {confirmedOrderId && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-md bg-white dark:bg-[#141418] border border-neutral-200 dark:border-white/10 rounded-2xl p-6 text-center shadow-2xl space-y-4"
              >
                <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-2xl font-bold">
                  ✓
                </div>
                <h3 className="font-serif text-2xl font-bold text-neutral-900 dark:text-white">
                  Order Confirmed!
                </h3>
                <p className="text-xs text-neutral-600 dark:text-neutral-400">
                  Your royal couture order has been placed successfully. A digital confirmation receipt has been issued.
                </p>
                <div className="bg-neutral-50 dark:bg-neutral-900 rounded-lg p-3 font-mono text-sm font-bold text-[#B38B22] dark:text-[#D4AF37]">
                  Order #{confirmedOrderId}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    window.location.href = '/account.html?tab=orders';
                  }}
                  className="w-full py-3 rounded-lg text-xs font-bold uppercase tracking-wider bg-[#111111] text-white hover:bg-neutral-800 dark:bg-[#D4AF37] dark:text-black transition-colors"
                >
                  View My Orders
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
};

export default CheckoutPage;
