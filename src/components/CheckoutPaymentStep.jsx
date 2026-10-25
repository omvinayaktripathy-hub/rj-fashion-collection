import React, { useState } from 'react';
import {
  Check,
  Lock,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Truck,
  Sparkles,
  Gift,
  Banknote,
  Tag,
  Headphones,
  Award
} from 'lucide-react';

const DEFAULT_ADDRESS = {
  fullName: 'Om',
  phone: '+91 9876543210',
  houseFlat: 'Flat No. 402, Royal Palms Residency',
  street: 'MG Road, Jubilee Hills',
  city: 'Hyderabad',
  state: 'Telangana',
  pinCode: '500033',
  addressType: 'HOME',
  estimatedDelivery: 'Arrives in 3–5 Business Days via Express Air'
};

const DEFAULT_ITEMS = [
  {
    id: 65,
    name: 'Organic Cotton Printed Baby Sleepsuit & Bib Combo (Set of 3)',
    variant: 'Size: 0–3 Months • Qty: 1',
    quantity: 1,
    price: 899,
    originalPrice: 1799,
    image: 'https://images.unsplash.com/photo-1519689680058-324335c77eba?auto=format&fit=crop&w=800&q=80'
  }
];

const DEFAULT_SUMMARY = {
  bagTotal: 1799,
  festiveDiscount: 900,
  couponDiscount: 0,
  deliveryFee: 0,
  payableAmount: 899
};

export const CheckoutPaymentStep = ({
  isLoading = false,
  address = DEFAULT_ADDRESS,
  items = DEFAULT_ITEMS,
  summary = DEFAULT_SUMMARY,
  onAddressChange,
  onPlaceOrder
}) => {
  const [selectedMethod, setSelectedMethod] = useState('upi');
  const [upiId, setUpiId] = useState('');
  const [cardData, setCardData] = useState({
    number: '',
    name: '',
    expiry: '',
    cvv: ''
  });

  const [isItemsOpen, setIsItemsOpen] = useState(false);

  const [promoInput, setPromoInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponSavings, setCouponSavings] = useState(summary.couponDiscount || 0);

  const [isGiftBoxSelected, setIsGiftBoxSelected] = useState(true);
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentPayable = Math.max(0, summary.payableAmount - couponSavings);

  const handleApplyCoupon = (code) => {
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) return;

    if (cleanCode === 'ROYAL10') {
      const discount = Math.round(summary.payableAmount * 0.1);
      setAppliedCoupon('ROYAL10');
      setCouponSavings(discount);
    } else if (cleanCode === 'WELCOME500') {
      const discount = Math.min(500, summary.payableAmount);
      setAppliedCoupon('WELCOME500');
      setCouponSavings(discount);
    } else {
      setAppliedCoupon(cleanCode);
      setCouponSavings(100);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponSavings(0);
    setPromoInput('');
  };

  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (typeof onPlaceOrder === 'function') {
        await onPlaceOrder({
          paymentMethod: selectedMethod,
          giftPackaging: isGiftBoxSelected,
          deliveryNotes,
          couponCode: appliedCoupon,
          cardDetails:
            selectedMethod === 'card'
              ? {
                  cardNumber: cardData.number,
                  cardHolder: cardData.name,
                  expiry: cardData.expiry,
                  cvv: cardData.cvv
                }
              : undefined,
          upiId: selectedMethod === 'upi' ? upiId : undefined
        });
      } else {
        await new Promise((r) => setTimeout(r, 1200));
        window.location.href = '/account.html';
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FBF9F5] text-[#111111] font-sans antialiased">
      
      {/* 1. LUXURY 3-STEP CHECKOUT STEPPER */}
      <section className="bg-white border-b border-neutral-200/80 py-4 sm:py-5 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
        <div className="max-w-4xl mx-auto px-4">
          <nav aria-label="Checkout Progress" className="flex items-center justify-center">
            
            <a
              href="/cart.html"
              className="flex items-center gap-2 group text-neutral-800 hover:text-black transition-colors"
            >
              <span className="w-6 h-6 rounded-full bg-[#0F382A] text-white flex items-center justify-center text-[11px] font-bold shadow-sm">
                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
              </span>
              <span className="text-xs font-semibold tracking-wider text-neutral-800">
                01 Bag & Cart
              </span>
            </a>

            <div className="w-10 sm:w-20 h-[1.5px] bg-[#0F382A]/40 mx-2 sm:mx-4" />

            <a
              href="/delivery.html"
              className="flex items-center gap-2 group text-neutral-800 hover:text-black transition-colors"
            >
              <span className="w-6 h-6 rounded-full bg-[#0F382A] text-white flex items-center justify-center text-[11px] font-bold shadow-sm">
                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
              </span>
              <span className="text-xs font-semibold tracking-wider text-neutral-800">
                02 Shipping Details
              </span>
            </a>

            <div className="w-10 sm:w-20 h-[1.5px] bg-[#111111]/40 mx-2 sm:mx-4" />

            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full ring-2 ring-[#111111] ring-offset-2 bg-[#111111] text-white flex items-center justify-center text-[11px] font-bold shadow-sm">
                03
              </span>
              <span className="text-xs font-bold tracking-wider text-[#111111]">
                Review & Payment
              </span>
            </div>

          </nav>
        </div>
      </section>

      {/* 2. TWO-COLUMN CHECKOUT LAYOUT */}
      <main className="max-w-6xl mx-auto px-4 lg:px-8 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: 8 Cols */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* CARD 1: SHIPPING ADDRESS SUMMARY */}
          <div className="bg-white rounded-xl border border-neutral-200/90 shadow-sm p-5 sm:p-6 transition-all">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#0F382A]" />
                <h2 className="text-xs font-bold tracking-[0.15em] uppercase text-neutral-900">
                  Delivery Address
                </h2>
              </div>
              <button
                type="button"
                onClick={onAddressChange || (() => (window.location.href = '/delivery.html'))}
                className="text-xs font-semibold text-[#8C6D37] hover:text-[#5E4720] transition-colors underline underline-offset-4"
              >
                Change
              </button>
            </div>

            {isLoading ? (
              <div className="animate-pulse space-y-2.5 py-1">
                <div className="h-4 bg-neutral-200/70 rounded w-1/3" />
                <div className="h-3.5 bg-neutral-200/60 rounded w-3/4" />
                <div className="h-3 bg-neutral-200/50 rounded w-1/2" />
              </div>
            ) : address ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <strong className="text-sm font-semibold text-neutral-900">
                    {address.fullName}
                  </strong>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-[#FAF4EB] text-[#8C6D37] border border-[#C5A880]/40">
                    {address.addressType || 'HOME'}
                  </span>
                  <span className="text-xs text-neutral-500 font-medium">
                    {address.phone}
                  </span>
                </div>
                <p className="text-xs text-neutral-600 leading-relaxed font-normal">
                  {address.houseFlat}, {address.street}, {address.city}, {address.state} –{' '}
                  <strong className="font-semibold text-neutral-800">{address.pinCode}</strong>
                </p>
                <div className="pt-2 flex items-center gap-2 text-[11px] font-medium text-[#0F382A]">
                  <Truck className="w-3.5 h-3.5 shrink-0" />
                  <span>{address.estimatedDelivery || 'Arrives in 3–5 Business Days via Express Air'}</span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-neutral-500">No delivery address selected.</p>
            )}
          </div>

          {/* CARD 2: ORDER ITEMS DROPDOWN PREVIEW */}
          <div className="bg-white rounded-xl border border-neutral-200/90 shadow-sm overflow-hidden">
            <div
              onClick={() => setIsItemsOpen(!isItemsOpen)}
              className="px-5 py-4 flex items-center justify-between cursor-pointer hover:bg-neutral-50/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="flex items-center -space-x-2 overflow-hidden">
                  {items.slice(0, 3).map((it, idx) => (
                    <img
                      key={idx}
                      src={it.image}
                      alt={it.name}
                      className="w-9 h-9 rounded-full object-cover border-2 border-white shadow-xs"
                    />
                  ))}
                </div>
                <div>
                  <h3 className="text-xs font-bold tracking-wider uppercase text-neutral-900">
                    Order Items ({items.length})
                  </h3>
                  <span className="text-[11px] text-neutral-500 font-normal">
                    Tap to {isItemsOpen ? 'collapse' : 'review bag items'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs font-semibold text-neutral-700">
                <span>₹{items.reduce((s, i) => s + i.price * i.quantity, 0).toLocaleString('en-IN')}</span>
                {isItemsOpen ? (
                  <ChevronUp className="w-4 h-4 text-neutral-500" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-neutral-500" />
                )}
              </div>
            </div>

            {isItemsOpen && (
              <div className="border-t border-neutral-100 p-5 space-y-3 bg-neutral-50/30 animate-in fade-in">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 py-2 border-b border-neutral-100 last:border-b-0">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-12 h-14 object-cover rounded-md border border-neutral-200"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-semibold text-neutral-900 truncate">
                        {item.name}
                      </h4>
                      <p className="text-[11px] text-neutral-500">
                        {item.variant}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-neutral-900">
                        ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* CARD 3: CURATED FESTIVE OFFERS & PROMO CODE */}
          <div className="bg-white rounded-xl border border-neutral-200/90 shadow-sm p-5 sm:p-6 space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <Tag className="w-3.5 h-3.5 text-[#8C6D37]" />
              <h3 className="text-xs font-bold tracking-[0.15em] uppercase text-neutral-900">
                Coupons & Festive Offers
              </h3>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={promoInput}
                onChange={(e) => setPromoInput(e.target.value)}
                placeholder="Enter promo coupon code"
                className="flex-1 text-xs px-3.5 py-2.5 rounded-lg border border-neutral-300 uppercase tracking-wider focus:outline-none focus:border-neutral-900 bg-white"
              />
              <button
                type="button"
                onClick={() => handleApplyCoupon(promoInput)}
                className="bg-[#111111] hover:bg-black text-white text-xs font-semibold px-5 py-2.5 rounded-lg uppercase tracking-wider transition-colors"
              >
                Apply
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => handleApplyCoupon('ROYAL10')}
                className={`text-[11px] font-semibold px-3 py-1 rounded-full border transition-all ${
                  appliedCoupon === 'ROYAL10'
                    ? 'bg-[#FAF4EB] border-[#C5A880] text-[#8C6D37]'
                    : 'bg-neutral-50 border-neutral-200 text-neutral-600 hover:border-neutral-400'
                }`}
              >
                ROYAL10 • 10% Festive Off
              </button>

              <button
                type="button"
                onClick={() => handleApplyCoupon('WELCOME500')}
                className={`text-[11px] font-semibold px-3 py-1 rounded-full border transition-all ${
                  appliedCoupon === 'WELCOME500'
                    ? 'bg-[#FAF4EB] border-[#C5A880] text-[#8C6D37]'
                    : 'bg-neutral-50 border-neutral-200 text-neutral-600 hover:border-neutral-400'
                }`}
              >
                WELCOME500 • Save ₹500
              </button>

              {appliedCoupon && (
                <button
                  type="button"
                  onClick={handleRemoveCoupon}
                  className="text-[11px] text-rose-600 hover:underline font-semibold ml-auto"
                >
                  Remove Coupon
                </button>
              )}
            </div>
          </div>

          {/* CARD 4: LUXURY ADD-ON */}
          <div className="bg-white rounded-xl border border-neutral-200/90 shadow-sm p-4 sm:p-5 flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#FAF4EB] border border-[#C5A880]/30 flex items-center justify-center text-[#8C6D37] shrink-0 mt-0.5">
                <Gift className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-neutral-900 tracking-wide">
                  🎁 Complimentary Royal Gift Box & Handwritten Card
                </h4>
                <p className="text-[11px] text-neutral-500 mt-0.5 leading-relaxed">
                  Includes heritage gold-embossed keepsake box, protective muslin wrap, and a personalized calligraphy message.
                </p>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
              <input
                type="checkbox"
                checked={isGiftBoxSelected}
                onChange={(e) => setIsGiftBoxSelected(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-neutral-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#0F382A]" />
            </label>
          </div>

          {/* CARD 5: PAYMENT OPTIONS */}
          <div className="bg-white rounded-xl border border-neutral-200/90 shadow-sm p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#0F382A]" />
                <h2 className="text-xs font-bold tracking-[0.15em] uppercase text-neutral-900">
                  Payment Options
                </h2>
              </div>
              <span className="text-[11px] font-semibold text-[#0F382A] flex items-center gap-1">
                <Lock className="w-3 h-3" />
                100% Encrypted & Safe
              </span>
            </div>

            <div className="space-y-3">
              
              {/* Option 1: Direct UPI */}
              <div
                onClick={() => setSelectedMethod('upi')}
                className={`p-4 rounded-xl border transition-all cursor-pointer ${
                  selectedMethod === 'upi'
                    ? 'border-[#C5A880] bg-[#FDFBF7] ring-1 ring-[#C5A880]/30'
                    : 'border-neutral-200 hover:border-neutral-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                        selectedMethod === 'upi' ? 'border-[#111111] bg-[#111111]' : 'border-neutral-300'
                      }`}
                    >
                      {selectedMethod === 'upi' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                    <div>
                      <span className="text-xs font-bold text-neutral-900 block">
                        Direct UPI (Instant, Zero Fee)
                      </span>
                      <span className="text-[11px] text-neutral-500">
                        Google Pay, PhonePe, Paytm, or any UPI App
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-neutral-100 text-neutral-700">GPay</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-neutral-100 text-neutral-700">PhonePe</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-neutral-100 text-neutral-700">Paytm</span>
                  </div>
                </div>

                {selectedMethod === 'upi' && (
                  <div className="mt-3 pt-3 border-t border-neutral-200/60 animate-in fade-in">
                    <label className="text-[11px] font-semibold text-neutral-700 block mb-1">
                      Enter UPI ID / VPA
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                        placeholder="e.g. mobile@upi / username@okhdfcbank"
                        className="flex-1 text-xs px-3.5 py-2 rounded-lg border border-neutral-300 focus:outline-none focus:border-neutral-900 bg-white"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Option 2: Cards & Net Banking */}
              <div
                onClick={() => setSelectedMethod('card')}
                className={`p-4 rounded-xl border transition-all cursor-pointer ${
                  selectedMethod === 'card'
                    ? 'border-[#C5A880] bg-[#FDFBF7] ring-1 ring-[#C5A880]/30'
                    : 'border-neutral-200 hover:border-neutral-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                        selectedMethod === 'card' ? 'border-[#111111] bg-[#111111]' : 'border-neutral-300'
                      }`}
                    >
                      {selectedMethod === 'card' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                    <div>
                      <span className="text-xs font-bold text-neutral-900 block">
                        Credit / Debit Cards & Net Banking
                      </span>
                      <span className="text-[11px] text-neutral-500">
                        Visa, Mastercard, RuPay, American Express
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-neutral-100 text-neutral-700">VISA</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-neutral-100 text-neutral-700">MC</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-neutral-100 text-neutral-700">RuPay</span>
                  </div>
                </div>

                {selectedMethod === 'card' && (
                  <div className="mt-3 pt-3 border-t border-neutral-200/60 space-y-3 animate-in fade-in">
                    <div>
                      <label className="text-[11px] font-semibold text-neutral-700 block mb-1">
                        Card Number
                      </label>
                      <input
                        type="text"
                        maxLength={19}
                        value={cardData.number}
                        onChange={(e) => setCardData({ ...cardData, number: e.target.value })}
                        placeholder="•••• •••• •••• ••••"
                        className="w-full text-xs px-3.5 py-2 rounded-lg border border-neutral-300 focus:outline-none focus:border-neutral-900 bg-white"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-semibold text-neutral-700 block mb-1">
                          Expiry (MM/YY)
                        </label>
                        <input
                          type="text"
                          maxLength={5}
                          value={cardData.expiry}
                          onChange={(e) => setCardData({ ...cardData, expiry: e.target.value })}
                          placeholder="MM/YY"
                          className="w-full text-xs px-3.5 py-2 rounded-lg border border-neutral-300 focus:outline-none focus:border-neutral-900 bg-white"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-neutral-700 block mb-1">
                          CVV
                        </label>
                        <input
                          type="password"
                          maxLength={4}
                          value={cardData.cvv}
                          onChange={(e) => setCardData({ ...cardData, cvv: e.target.value })}
                          placeholder="•••"
                          className="w-full text-xs px-3.5 py-2 rounded-lg border border-neutral-300 focus:outline-none focus:border-neutral-900 bg-white"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Option 3: Cash on Delivery */}
              <div
                onClick={() => setSelectedMethod('cod')}
                className={`p-4 rounded-xl border transition-all cursor-pointer ${
                  selectedMethod === 'cod'
                    ? 'border-[#C5A880] bg-[#FDFBF7] ring-1 ring-[#C5A880]/30'
                    : 'border-neutral-200 hover:border-neutral-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                        selectedMethod === 'cod' ? 'border-[#111111] bg-[#111111]' : 'border-neutral-300'
                      }`}
                    >
                      {selectedMethod === 'cod' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                    <div>
                      <span className="text-xs font-bold text-neutral-900 block">
                        Cash on Delivery (Pay at Doorstep)
                      </span>
                      <span className="text-[11px] text-neutral-500">
                        Pay via Cash or UPI QR to courier upon delivery
                      </span>
                    </div>
                  </div>
                  <Banknote className="w-4 h-4 text-neutral-600" />
                </div>
              </div>

            </div>
          </div>

          {/* CARD 6: DELIVERY INSTRUCTIONS */}
          <div className="bg-white rounded-xl border border-neutral-200/90 shadow-sm p-4 sm:p-5">
            <label className="text-xs font-bold tracking-[0.15em] uppercase text-neutral-900 block mb-2">
              Delivery Instructions (Optional)
            </label>
            <textarea
              rows={2}
              value={deliveryNotes}
              onChange={(e) => setDeliveryNotes(e.target.value)}
              placeholder="e.g. Please leave package with security concierge if unavailable..."
              className="w-full text-xs p-3 rounded-lg border border-neutral-300 focus:outline-none focus:border-neutral-900 bg-white"
            />
          </div>

          {/* PRIMARY ORDER CTA */}
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleSubmitOrder}
            className="w-full bg-[#111111] hover:bg-black text-white py-4 px-6 rounded-xl font-bold text-xs sm:text-sm tracking-widest uppercase transition-all shadow-lg hover:shadow-xl active:scale-[0.99] flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50"
          >
            <Lock className="w-4 h-4 text-[#C5A880]" />
            <span>
              {isSubmitting
                ? 'Processing Your Order...'
                : `Complete & Pay ₹${currentPayable.toLocaleString('en-IN')} →`}
            </span>
          </button>

        </div>

        {/* RIGHT COLUMN: STICKY SUMMARY (4 Cols) */}
        <aside className="lg:col-span-4 sticky top-24 space-y-4">
          
          <div className="rounded-xl border border-neutral-200/90 bg-white p-6 shadow-sm space-y-5">
            <div className="border-b border-neutral-100 pb-3 flex items-center justify-between">
              <h2 className="text-xs font-bold tracking-[0.15em] uppercase text-neutral-900">
                Order Summary
              </h2>
              <span className="text-xs text-neutral-400">
                ({items.length} Item{items.length > 1 ? 's' : ''})
              </span>
            </div>

            {isLoading ? (
              <div className="animate-pulse space-y-3 py-2">
                <div className="h-4 bg-neutral-200/70 rounded w-full" />
                <div className="h-4 bg-neutral-200/60 rounded w-4/5" />
                <div className="h-5 bg-neutral-200/80 rounded w-full" />
              </div>
            ) : (
              <div className="space-y-3 text-xs">
                <div className="flex justify-between text-neutral-600">
                  <span>Bag Total</span>
                  <span className="font-medium text-neutral-900">
                    ₹{summary.bagTotal.toLocaleString('en-IN')}
                  </span>
                </div>

                {summary.festiveDiscount > 0 && (
                  <div className="flex justify-between text-neutral-600">
                    <span>Festive Discount</span>
                    <span className="font-semibold text-[#0F382A]">
                      −₹{summary.festiveDiscount.toLocaleString('en-IN')}
                    </span>
                  </div>
                )}

                {couponSavings > 0 && (
                  <div className="flex justify-between text-neutral-600">
                    <span>Coupon Savings ({appliedCoupon})</span>
                    <span className="font-semibold text-[#8C6D37]">
                      −₹{couponSavings.toLocaleString('en-IN')}
                    </span>
                  </div>
                )}

                <div className="flex justify-between text-neutral-600">
                  <span>Express Air Shipping</span>
                  <span className="font-semibold text-[#0F382A] flex items-center gap-1.5">
                    <span className="line-through text-neutral-400 font-normal">₹49</span>
                    <span>FREE</span>
                  </span>
                </div>

                <div className="border-t border-dashed border-neutral-200 pt-3 flex justify-between items-baseline">
                  <span className="text-sm font-bold text-neutral-900">Total Amount Payable</span>
                  <span className="text-xl font-bold text-[#111111] font-serif">
                    ₹{currentPayable.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            )}

            {(summary.festiveDiscount > 0 || couponSavings > 0) && (
              <div className="p-3 rounded-lg bg-[#EBF5F0] border border-[#0F382A]/20 flex items-center gap-2 text-xs font-semibold text-[#0F382A]">
                <Sparkles className="w-4 h-4 shrink-0 text-[#0F382A]" />
                <span>
                  ✨ Total savings: ₹{(summary.festiveDiscount + couponSavings).toLocaleString('en-IN')}!
                </span>
              </div>
            )}

            <div className="flex items-center justify-center gap-1.5 text-[11px] text-neutral-500 pt-1">
              <Lock className="w-3.5 h-3.5 text-neutral-400" />
              <span>256-Bit Bank-Grade SSL Encrypted Checkout</span>
            </div>

          </div>

          <div className="rounded-xl border border-neutral-200/90 bg-white p-5 shadow-sm space-y-3">
            <h3 className="text-[11px] font-bold tracking-wider uppercase text-neutral-700">
              Couture Assurance
            </h3>
            
            <div className="space-y-2 text-xs text-neutral-600">
              <div className="flex items-center gap-2.5">
                <Award className="w-4 h-4 text-[#8C6D37] shrink-0" />
                <span>100% Certified Authentic Artisanal Silk</span>
              </div>
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-4 h-4 text-[#8C6D37] shrink-0" />
                <span>Express Insured Air Delivery</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Lock className="w-4 h-4 text-[#8C6D37] shrink-0" />
                <span>256-Bit Bank-Grade SSL Encryption</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Headphones className="w-4 h-4 text-[#8C6D37] shrink-0" />
                <span>VIP Concierge Support (+91 7894093586)</span>
              </div>
            </div>
          </div>

        </aside>

      </main>

    </div>
  );
};

export default CheckoutPaymentStep;
