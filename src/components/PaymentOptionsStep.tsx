import React, { useState } from 'react';
import {
  Lock,
  ShieldCheck,
  CreditCard,
  Smartphone,
  Banknote,
  ChevronDown,
  ChevronUp,
  Check,
  QrCode,
  ArrowRight,
  Sparkles,
  Truck,
  Award,
  RefreshCw,
  Info
} from 'lucide-react';

/* =========================================================================
   TYPES & INTERFACES
   ========================================================================= */

export type PaymentMethodType = 'upi' | 'card' | 'cod';

export interface PaymentItemPreview {
  id: string | number;
  name: string;
  variant: string;
  quantity: number;
  price: number;
  image: string;
}

export interface PaymentSummary {
  subtotal: number;
  discount: number;
  couponCode?: string | null;
  shippingFee: number;
  total: number;
}

export interface PaymentOptionsStepProps {
  summary?: PaymentSummary;
  items?: PaymentItemPreview[];
  onPlaceOrder?: (payload: {
    paymentMethod: PaymentMethodType;
    upiId?: string;
    cardDetails?: {
      cardNumber: string;
      cardHolder: string;
      expiry: string;
      cvv: string;
      saveCard?: boolean;
    };
    deliveryNotes?: string;
  }) => Promise<void> | void;
  isProcessing?: boolean;
  onBackToAddress?: () => void;
}

/* =========================================================================
   DEFAULT MOCK DATA
   ========================================================================= */

const DEFAULT_SUMMARY: PaymentSummary = {
  subtotal: 3998,
  discount: 999,
  couponCode: 'ROYAL10',
  shippingFee: 0,
  total: 2999
};

const DEFAULT_ITEMS: PaymentItemPreview[] = [
  {
    id: 65,
    name: 'Organic Cotton Printed Baby Sleepsuit & Bib Combo',
    variant: 'Size: 0–3 Months • Qty: 1',
    quantity: 1,
    price: 899,
    image: 'https://images.unsplash.com/photo-1522771930-78848d9293e8?w=500&auto=format&fit=crop&q=80'
  },
  {
    id: 1,
    name: 'Royal Kanjivaram Pure Silk Zari Saree',
    variant: 'Size: Free Size • Blouse Unstitched',
    quantity: 1,
    price: 2100,
    image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=500&auto=format&fit=crop&q=80'
  }
];

/* =========================================================================
   SVG BRAND BADGES (MONOCHROME & LUXURY PALETTE)
   ========================================================================= */

const UpiMicroIcons = () => (
  <div className="flex items-center gap-1.5 opacity-90">
    <span className="text-[10px] font-bold tracking-tight px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-800 border border-neutral-200">
      GPay
    </span>
    <span className="text-[10px] font-bold tracking-tight px-1.5 py-0.5 rounded bg-purple-50 text-purple-900 border border-purple-200">
      PhonePe
    </span>
    <span className="text-[10px] font-bold tracking-tight px-1.5 py-0.5 rounded bg-sky-50 text-sky-900 border border-sky-200">
      Paytm
    </span>
    <span className="text-[10px] font-bold tracking-tight px-1.5 py-0.5 rounded bg-emerald-50 text-[#0F382A] border border-emerald-200">
      BHIM
    </span>
  </div>
);

const CardMicroIcons = () => (
  <div className="flex items-center gap-1.5 opacity-85">
    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-neutral-900 text-white tracking-wider">
      VISA
    </span>
    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-800 border border-neutral-200 tracking-tight">
      Mastercard
    </span>
    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-[#0F382A] border border-emerald-200 font-serif">
      RuPay
    </span>
    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-900 border border-blue-200">
      AMEX
    </span>
  </div>
);

/* =========================================================================
   MAIN COMPONENT: PAYMENT OPTIONS STEP
   ========================================================================= */

export const PaymentOptionsStep: React.FC<PaymentOptionsStepProps> = ({
  summary = DEFAULT_SUMMARY,
  items = DEFAULT_ITEMS,
  onPlaceOrder,
  isProcessing = false,
  onBackToAddress
}) => {
  // Active payment method
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodType>('upi');

  // UPI sub-state
  const [upiMode, setUpiMode] = useState<'qr' | 'id'>('qr');
  const [upiId, setUpiId] = useState('');
  const [upiVerified, setUpiVerified] = useState(false);
  const [isVerifyingUpi, setIsVerifyingUpi] = useState(false);

  // Card details state
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [saveCard, setSaveCard] = useState(true);

  // Delivery Instructions Accordion state
  const [isNotesOpen, setIsNotesOpen] = useState(false);
  const [deliveryNotes, setDeliveryNotes] = useState('');

  // Format price helper
  const formatPrice = (val: number) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);

  // Card formatting helpers
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 16);
    const formatted = raw.replace(/(\d{4})(?=\d)/g, '$1 ');
    setCardNumber(formatted);
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 4);
    if (raw.length >= 3) {
      setExpiry(`${raw.slice(0, 2)}/${raw.slice(2)}`);
    } else {
      setExpiry(raw);
    }
  };

  const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 4);
    setCvv(raw);
  };

  const verifyUpi = () => {
    if (!upiId || !upiId.includes('@')) return;
    setIsVerifyingUpi(true);
    setTimeout(() => {
      setIsVerifyingUpi(false);
      setUpiVerified(true);
    }, 700);
  };

  // Submit Order Trigger
  const handleConfirmPay = () => {
    if (onPlaceOrder) {
      onPlaceOrder({
        paymentMethod: selectedMethod,
        upiId: selectedMethod === 'upi' ? upiId : undefined,
        cardDetails:
          selectedMethod === 'card'
            ? {
                cardNumber,
                cardHolder,
                expiry,
                cvv,
                saveCard
              }
            : undefined,
        deliveryNotes
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFCF9] text-neutral-900 py-8 px-4 sm:px-6 lg:px-8 font-sans selection:bg-[#C5A880]/20 selection:text-neutral-900">
      <div className="max-w-6xl mx-auto">
        {/* =========================================================================
            BREADCRUMB / STEPPER (01 Bag -> 02 Shipping -> 03 Review & Payment)
            ========================================================================= */}
        <div className="mb-8 border-b border-neutral-200/80 pb-5">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-2 sm:gap-4 text-xs font-medium tracking-wider">
              <span className="text-neutral-500 hover:text-neutral-800 transition-colors cursor-pointer flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-[#0F382A] text-white flex items-center justify-center text-[10px]">
                  ✓
                </span>
                <span>01 BAG &amp; CART</span>
              </span>
              <span className="text-neutral-300">/</span>
              <span
                onClick={onBackToAddress}
                className="text-neutral-500 hover:text-neutral-800 transition-colors cursor-pointer flex items-center gap-1.5"
                title="Return to Shipping Details"
              >
                <span className="w-5 h-5 rounded-full bg-[#0F382A] text-white flex items-center justify-center text-[10px]">
                  ✓
                </span>
                <span>02 SHIPPING DETAILS</span>
              </span>
              <span className="text-neutral-300">/</span>
              <span className="text-neutral-900 font-semibold flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-[#111111] text-white flex items-center justify-center text-[10px]">
                  03
                </span>
                <span>03 REVIEW &amp; PAYMENT</span>
              </span>
            </div>

            {/* Back link */}
            {onBackToAddress && (
              <button
                type="button"
                onClick={onBackToAddress}
                className="text-xs text-neutral-500 hover:text-neutral-900 font-medium transition-colors"
              >
                ← Back to Address
              </button>
            )}
          </div>
        </div>

        {/* =========================================================================
            TWO-COLUMN PAYMENT LAYOUT (65% Payment Options / 35% Sticky Summary)
            ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT COLUMN: PAYMENT METHOD CONTAINER */}
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white rounded-2xl border border-neutral-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.02)] p-6 sm:p-8">
              {/* 1. SECTION HEADER & TRUST SEAL */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-6 border-b border-neutral-100">
                <div>
                  <h1 className="text-lg font-semibold tracking-wider text-neutral-900 uppercase font-serif">
                    PAYMENT METHOD
                  </h1>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    Select your preferred transaction method for instant order confirmation.
                  </p>
                </div>

                {/* Right-aligned SSL Trust Seal */}
                <div className="inline-flex items-center gap-1.5 text-xs text-emerald-800 bg-emerald-50/90 border border-emerald-200/60 px-3 py-1.5 rounded-full font-medium shadow-sm self-start sm:self-auto">
                  <Lock className="w-3.5 h-3.5 text-emerald-700" />
                  <span>256-Bit SSL Encrypted &amp; Verified</span>
                </div>
              </div>

              {/* 2. PAYMENT OPTION CARDS (ACCORDION / CLEAN RADIO GROUP) */}
              <div className="mt-6 space-y-4">
                {/* ───────────────────────────────────────────────────────────
                    OPTION 1: DIRECT INSTANT UPI (PHONEPE, GPAY, PAYTM)
                    ─────────────────────────────────────────────────────────── */}
                <div
                  onClick={() => setSelectedMethod('upi')}
                  className={`relative rounded-xl transition-all duration-200 cursor-pointer overflow-hidden ${
                    selectedMethod === 'upi'
                      ? 'bg-[#FCFAF7] border-[1.5px] border-[#111111] shadow-[0_4px_16px_rgba(17,17,17,0.06)]'
                      : 'bg-white border border-neutral-200 hover:border-neutral-300'
                  }`}
                >
                  {/* Card Header Row */}
                  <div className="p-5 flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3.5">
                      {/* Custom Radio Circle */}
                      <div className="mt-0.5 flex items-center justify-center">
                        <div
                          className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                            selectedMethod === 'upi'
                              ? 'border-[#111111] bg-[#111111]'
                              : 'border-neutral-300 bg-white'
                          }`}
                        >
                          {selectedMethod === 'upi' && (
                            <div className="w-2 h-2 rounded-full bg-white" />
                          )}
                        </div>
                      </div>

                      {/* Title & Subtitle */}
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-neutral-900 tracking-wide">
                            Instant UPI (PhonePe, Google Pay, Paytm)
                          </span>
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-[#0F382A] bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-full">
                            Instant Verification
                          </span>
                        </div>
                        <p className="text-xs text-neutral-500 mt-1">
                          Zero transaction fees • Instant order confirmation
                        </p>
                      </div>
                    </div>

                    {/* Micro Icons */}
                    <div className="hidden sm:block">
                      <UpiMicroIcons />
                    </div>
                  </div>

                  {/* Active Expanded State: QR Code / UPI ID */}
                  {selectedMethod === 'upi' && (
                    <div
                      className="px-5 pb-5 pt-2 border-t border-neutral-200/60 space-y-4 animate-in fade-in duration-200"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* Mode Tabs: Scan QR vs UPI ID */}
                      <div className="flex items-center gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setUpiMode('qr')}
                          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold tracking-wider transition-all flex items-center gap-1.5 ${
                            upiMode === 'qr'
                              ? 'bg-neutral-900 text-white shadow-sm'
                              : 'bg-neutral-100 text-neutral-600 hover:text-neutral-900'
                          }`}
                        >
                          <QrCode className="w-3.5 h-3.5" />
                          <span>Scan QR Code</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setUpiMode('id')}
                          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold tracking-wider transition-all flex items-center gap-1.5 ${
                            upiMode === 'id'
                              ? 'bg-neutral-900 text-white shadow-sm'
                              : 'bg-neutral-100 text-neutral-600 hover:text-neutral-900'
                          }`}
                        >
                          <Smartphone className="w-3.5 h-3.5" />
                          <span>Enter UPI ID / VPA</span>
                        </button>
                      </div>

                      {/* QR Mode Container */}
                      {upiMode === 'qr' ? (
                        <div className="p-4 rounded-xl bg-white border border-neutral-200/80 flex flex-col sm:flex-row items-center gap-5">
                          {/* Simulated Royal QR */}
                          <div className="relative w-36 h-36 bg-neutral-900 p-2 rounded-xl flex items-center justify-center shrink-0 shadow-inner">
                            <div className="w-full h-full bg-white rounded-lg p-2 flex flex-col items-center justify-center relative">
                              {/* QR Pattern Placeholder */}
                              <div className="w-full h-full border-2 border-dashed border-neutral-300 rounded flex flex-col items-center justify-center text-center p-1">
                                <QrCode className="w-12 h-12 text-neutral-800" />
                                <span className="text-[9px] font-mono font-bold text-neutral-500 mt-1">
                                  RJ-ROYALE-UPI
                                </span>
                              </div>
                              {/* Monogram Badge in Center */}
                              <div className="absolute w-7 h-7 bg-[#111111] text-[#C5A880] rounded-full flex items-center justify-center text-[10px] font-serif font-bold shadow-md border border-[#C5A880]/40">
                                RJ
                              </div>
                            </div>
                          </div>

                          <div className="space-y-2 text-center sm:text-left">
                            <div className="text-xs font-semibold text-neutral-900">
                              Scan with any UPI App to Pay {formatPrice(summary.total)}
                            </div>
                            <p className="text-xs text-neutral-500 leading-relaxed">
                              Open Google Pay, PhonePe, Paytm, or BHIM and point your camera to complete the transfer.
                            </p>
                            <div className="flex items-center justify-center sm:justify-start gap-1.5 text-[11px] text-emerald-700 font-medium pt-1">
                              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                              <span>Dynamic QR Active • Auto-verifies upon payment</span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        /* UPI ID Input Container */
                        <div className="p-4 rounded-xl bg-white border border-neutral-200/80 space-y-3">
                          <label className="block text-xs font-medium text-neutral-700">
                            Enter Virtual Payment Address (VPA) / UPI ID
                          </label>
                          <div className="flex items-center gap-2">
                            <div className="relative flex-1">
                              <input
                                type="text"
                                value={upiId}
                                onChange={(e) => {
                                  setUpiId(e.target.value);
                                  setUpiVerified(false);
                                }}
                                placeholder="e.g. yourname@okhdfcbank or 9876543210@paytm"
                                className="w-full px-3.5 py-2.5 rounded-lg border border-neutral-200 text-xs focus:outline-none focus:border-neutral-900 transition-colors font-mono"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={verifyUpi}
                              disabled={!upiId.includes('@') || isVerifyingUpi}
                              className={`px-4 py-2.5 rounded-lg text-xs font-semibold tracking-wider transition-all ${
                                upiVerified
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-neutral-900 hover:bg-neutral-800 text-white disabled:opacity-40 disabled:cursor-not-allowed'
                              }`}
                            >
                              {isVerifyingUpi ? (
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              ) : upiVerified ? (
                                '✓ Verified'
                              ) : (
                                'Verify & Pay'
                              )}
                            </button>
                          </div>
                          {upiVerified && (
                            <p className="text-[11px] text-emerald-700 font-medium flex items-center gap-1">
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span>UPI ID verified. You will receive a payment prompt on your app.</span>
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* ───────────────────────────────────────────────────────────
                    OPTION 2: CARDS & GLOBAL GATEWAYS (STRIPE / SECURE)
                    ─────────────────────────────────────────────────────────── */}
                <div
                  onClick={() => setSelectedMethod('card')}
                  className={`relative rounded-xl transition-all duration-200 cursor-pointer overflow-hidden ${
                    selectedMethod === 'card'
                      ? 'bg-[#FCFAF7] border-[1.5px] border-[#111111] shadow-[0_4px_16px_rgba(17,17,17,0.06)]'
                      : 'bg-white border border-neutral-200 hover:border-neutral-300'
                  }`}
                >
                  {/* Card Header Row */}
                  <div className="p-5 flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3.5">
                      {/* Custom Radio Circle */}
                      <div className="mt-0.5 flex items-center justify-center">
                        <div
                          className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                            selectedMethod === 'card'
                              ? 'border-[#111111] bg-[#111111]'
                              : 'border-neutral-300 bg-white'
                          }`}
                        >
                          {selectedMethod === 'card' && (
                            <div className="w-2 h-2 rounded-full bg-white" />
                          )}
                        </div>
                      </div>

                      {/* Title & Subtitle */}
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-neutral-900 tracking-wide">
                            Credit / Debit Card &amp; Net Banking
                          </span>
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-700 bg-neutral-100 border border-neutral-200 px-2 py-0.5 rounded-full">
                            Stripe Verified
                          </span>
                        </div>
                        <p className="text-xs text-neutral-500 mt-1">
                          All domestic &amp; international cards • 3D Secure 2.0 Protection
                        </p>
                      </div>
                    </div>

                    {/* Micro Icons */}
                    <div className="hidden sm:block">
                      <CardMicroIcons />
                    </div>
                  </div>

                  {/* Active Expanded State: Minimalist Stripe-like Inputs */}
                  {selectedMethod === 'card' && (
                    <div
                      className="px-5 pb-5 pt-2 border-t border-neutral-200/60 space-y-4 animate-in fade-in duration-200"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="p-4 rounded-xl bg-white border border-neutral-200/80 space-y-3.5">
                        {/* Card Number */}
                        <div>
                          <label className="block text-[11px] font-semibold tracking-wider text-neutral-700 uppercase mb-1">
                            Card Number
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              value={cardNumber}
                              onChange={handleCardNumberChange}
                              placeholder="4111 2222 3333 4444"
                              maxLength={19}
                              className="w-full px-3.5 py-2.5 rounded-lg border border-neutral-200 text-xs font-mono tracking-widest focus:outline-none focus:border-neutral-900 transition-colors pr-10"
                            />
                            <CreditCard className="w-4 h-4 text-neutral-400 absolute right-3.5 top-3 pointer-events-none" />
                          </div>
                        </div>

                        {/* Cardholder Name */}
                        <div>
                          <label className="block text-[11px] font-semibold tracking-wider text-neutral-700 uppercase mb-1">
                            Cardholder Name
                          </label>
                          <input
                            type="text"
                            value={cardHolder}
                            onChange={(e) => setCardHolder(e.target.value)}
                            placeholder="e.g. PRIYA SHARMA"
                            className="w-full px-3.5 py-2.5 rounded-lg border border-neutral-200 text-xs uppercase tracking-wider focus:outline-none focus:border-neutral-900 transition-colors"
                          />
                        </div>

                        {/* Expiry & CVV Grid */}
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] font-semibold tracking-wider text-neutral-700 uppercase mb-1">
                              Expiry Date
                            </label>
                            <input
                              type="text"
                              value={expiry}
                              onChange={handleExpiryChange}
                              placeholder="MM/YY"
                              maxLength={5}
                              className="w-full px-3.5 py-2.5 rounded-lg border border-neutral-200 text-xs font-mono tracking-widest focus:outline-none focus:border-neutral-900 transition-colors"
                            />
                          </div>

                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <label className="block text-[11px] font-semibold tracking-wider text-neutral-700 uppercase">
                                CVV / CVC
                              </label>
                              <span className="text-[10px] text-neutral-400 flex items-center gap-0.5">
                                <Lock className="w-2.5 h-2.5" /> 3 digits
                              </span>
                            </div>
                            <input
                              type="password"
                              value={cvv}
                              onChange={handleCvvChange}
                              placeholder="•••"
                              maxLength={4}
                              className="w-full px-3.5 py-2.5 rounded-lg border border-neutral-200 text-xs font-mono tracking-widest focus:outline-none focus:border-neutral-900 transition-colors"
                            />
                          </div>
                        </div>

                        {/* Save Card Checkbox */}
                        <label className="flex items-center gap-2.5 cursor-pointer pt-1 text-xs text-neutral-600">
                          <input
                            type="checkbox"
                            checked={saveCard}
                            onChange={(e) => setSaveCard(e.target.checked)}
                            className="w-4 h-4 rounded text-neutral-900 border-neutral-300 focus:ring-0 accent-neutral-900"
                          />
                          <span>Save this card securely for faster checkout in accordance with RBI guidelines</span>
                        </label>
                      </div>
                    </div>
                  )}
                </div>

                {/* ───────────────────────────────────────────────────────────
                    OPTION 3: CASH ON DELIVERY (PAY AT DOORSTEP)
                    ─────────────────────────────────────────────────────────── */}
                <div
                  onClick={() => setSelectedMethod('cod')}
                  className={`relative rounded-xl transition-all duration-200 cursor-pointer overflow-hidden ${
                    selectedMethod === 'cod'
                      ? 'bg-[#FCFAF7] border-[1.5px] border-[#111111] shadow-[0_4px_16px_rgba(17,17,17,0.06)]'
                      : 'bg-white border border-neutral-200 hover:border-neutral-300'
                  }`}
                >
                  {/* Card Header Row */}
                  <div className="p-5 flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3.5">
                      {/* Custom Radio Circle */}
                      <div className="mt-0.5 flex items-center justify-center">
                        <div
                          className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                            selectedMethod === 'cod'
                              ? 'border-[#111111] bg-[#111111]'
                              : 'border-neutral-300 bg-white'
                          }`}
                        >
                          {selectedMethod === 'cod' && (
                            <div className="w-2 h-2 rounded-full bg-white" />
                          )}
                        </div>
                      </div>

                      {/* Title & Subtitle */}
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-neutral-900 tracking-wide">
                            Cash on Delivery (COD)
                          </span>
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-600 bg-neutral-100 border border-neutral-200 px-2 py-0.5 rounded-full">
                            Doorstep Inspection
                          </span>
                        </div>
                        <p className="text-xs text-neutral-500 mt-1">
                          Pay via Cash or QR at delivery • Zero advance payment required
                        </p>
                      </div>
                    </div>

                    <Banknote className="w-5 h-5 text-neutral-400 shrink-0" />
                  </div>

                  {/* Active Expanded State: Warm Neutral Assurance Banner */}
                  {selectedMethod === 'cod' && (
                    <div
                      className="px-5 pb-5 pt-2 border-t border-neutral-200/60 animate-in fade-in duration-200"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200/60 flex items-start gap-3">
                        <Info className="w-4 h-4 text-amber-800 shrink-0 mt-0.5" />
                        <div className="text-xs text-amber-900 leading-relaxed">
                          <span className="font-semibold block mb-0.5">Doorstep Peace of Mind:</span>
                          Pay securely to the courier partner upon package inspection. The delivery executive carries a handheld digital UPI scanner if you prefer contactless digital payment at arrival.
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* ───────────────────────────────────────────────────────────
                  4. COLLAPSIBLE DELIVERY INSTRUCTIONS & NOTES
                  ─────────────────────────────────────────────────────────── */}
              <div className="mt-6 pt-6 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setIsNotesOpen(!isNotesOpen)}
                  className="flex items-center justify-between w-full text-left py-2 text-xs font-semibold tracking-wider text-neutral-700 hover:text-neutral-900 transition-colors group"
                >
                  <span className="flex items-center gap-2">
                    <span>Add Delivery Instructions (Optional)</span>
                    {deliveryNotes.trim().length > 0 && (
                      <span className="w-2 h-2 rounded-full bg-[#0F382A]" />
                    )}
                  </span>
                  <span className="text-neutral-400 group-hover:text-neutral-700 transition-transform">
                    {isNotesOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </span>
                </button>

                {isNotesOpen && (
                  <div className="mt-3 space-y-2 animate-in fade-in duration-200">
                    <textarea
                      value={deliveryNotes}
                      onChange={(e) => setDeliveryNotes(e.target.value.slice(0, 200))}
                      placeholder="e.g., Leave package with security desk, ring bell twice, call before arrival..."
                      rows={3}
                      className="w-full p-3.5 rounded-xl border border-neutral-200 text-xs text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-900 transition-colors resize-none bg-neutral-50/50"
                    />
                    <div className="flex justify-between items-center text-[10px] text-neutral-400">
                      <span>Instructions will be printed on the courier transit label.</span>
                      <span>{deliveryNotes.length} / 200</span>
                    </div>
                  </div>
                )}
              </div>

              {/* ───────────────────────────────────────────────────────────
                  5. PRIMARY CTA BUTTON & MICRO-TRUST NOTE
                  ─────────────────────────────────────────────────────────── */}
              <div className="mt-8 pt-6 border-t border-neutral-100 space-y-3">
                <button
                  type="button"
                  onClick={handleConfirmPay}
                  disabled={isProcessing}
                  className="w-full bg-[#111111] hover:bg-black text-white py-4 px-6 rounded-xl font-semibold text-xs tracking-widest transition-all shadow-[0_4px_16px_rgba(0,0,0,0.18)] active:scale-[0.99] flex items-center justify-center gap-2 uppercase disabled:opacity-50 disabled:cursor-not-allowed group cursor-pointer"
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-white" />
                      <span>SECURING &amp; PROCESSING...</span>
                    </>
                  ) : (
                    <>
                      <span>PAY &amp; COMPLETE ORDER • {formatPrice(summary.total)}</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>

                <p className="text-center text-[11px] text-neutral-500 flex items-center justify-center gap-1.5 leading-tight pt-1">
                  <Lock className="w-3 h-3 text-neutral-400 shrink-0" />
                  <span>
                    By placing this order, you agree to RJ Fashion Collection&apos;s Terms and Return Policies.
                  </span>
                </p>
              </div>
            </div>

            {/* Couture Trust Badges Dock */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="flex items-center gap-3 p-3.5 rounded-xl bg-white border border-neutral-200/70">
                <div className="w-9 h-9 rounded-lg bg-emerald-50 text-[#0F382A] flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-neutral-900">100% Authentic</h4>
                  <p className="text-[11px] text-neutral-500">Certified master-crafted garments</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3.5 rounded-xl bg-white border border-neutral-200/70">
                <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-900 flex items-center justify-center shrink-0">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-neutral-900">Express Air Shipping</h4>
                  <p className="text-[11px] text-neutral-500">Pan-India insured priority dispatch</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3.5 rounded-xl bg-white border border-neutral-200/70">
                <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-900 flex items-center justify-center shrink-0">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-neutral-900">7-Day Royal Exchange</h4>
                  <p className="text-[11px] text-neutral-500">Hassle-free doorstep exchanges</p>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: COMPACT STICKY ORDER SUMMARY */}
          <div className="lg:col-span-4 sticky top-6 space-y-4">
            <div className="bg-white rounded-2xl border border-neutral-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.02)] overflow-hidden">
              {/* Header */}
              <div className="px-5 py-4 border-b border-neutral-100 flex items-center justify-between">
                <h3 className="text-xs font-semibold tracking-wider text-neutral-900 uppercase font-serif">
                  PRICE DETAILS
                </h3>
                <span className="text-[11px] font-medium text-neutral-500">
                  {items.length} {items.length === 1 ? 'item' : 'items'}
                </span>
              </div>

              {/* Items Mini Thumbnail Preview */}
              <div className="p-5 border-b border-neutral-100 space-y-3">
                {items.slice(0, 3).map((item) => (
                  <div key={item.id} className="flex items-center gap-3">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-12 h-14 object-cover rounded-lg border border-neutral-200/80 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-neutral-900 truncate">
                        {item.name}
                      </p>
                      <p className="text-[11px] text-neutral-500 truncate">{item.variant}</p>
                      <p className="text-xs font-semibold text-neutral-900 mt-0.5">
                        {formatPrice(item.price)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Price Breakdown */}
              <div className="p-5 space-y-3 text-xs">
                <div className="flex justify-between text-neutral-600">
                  <span>Bag Subtotal</span>
                  <span className="font-medium text-neutral-900">{formatPrice(summary.subtotal)}</span>
                </div>

                {summary.discount > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span className="flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      <span>Festive Savings {summary.couponCode ? `(${summary.couponCode})` : ''}</span>
                    </span>
                    <span className="font-semibold">− {formatPrice(summary.discount)}</span>
                  </div>
                )}

                <div className="flex justify-between text-neutral-600">
                  <span>Pan-India Express Air</span>
                  <span className="font-semibold text-emerald-700">
                    <span className="line-through text-neutral-400 font-normal mr-1.5">₹49</span>
                    FREE
                  </span>
                </div>

                {/* Total Row */}
                <div className="pt-3 border-t border-neutral-200 flex justify-between items-baseline">
                  <span className="text-sm font-semibold text-neutral-900 font-serif">
                    Total Amount
                  </span>
                  <span className="text-base font-bold text-neutral-900 font-serif">
                    {formatPrice(summary.total)}
                  </span>
                </div>
              </div>

              {/* Savings Ribbon */}
              {summary.discount > 0 && (
                <div className="px-5 py-2.5 bg-emerald-50/80 border-t border-emerald-100 text-[11px] font-medium text-[#0F382A] text-center flex items-center justify-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  <span>You are saving {formatPrice(summary.discount)} on this royal ethnic order!</span>
                </div>
              )}
            </div>

            {/* Micro Safe Shopping Assurance */}
            <div className="p-4 rounded-xl bg-neutral-100/70 border border-neutral-200/60 text-center">
              <p className="text-[11px] text-neutral-600 flex items-center justify-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#0F382A]" />
                <span>RJ Royale Insured Delivery • Tamper-proof security seal</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentOptionsStep;
