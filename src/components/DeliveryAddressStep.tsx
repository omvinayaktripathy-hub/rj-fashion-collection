import React, { useState } from 'react';
import {
  Check,
  User,
  ArrowRight,
  Plus,
  Plane,
  ShieldCheck,
  Gift,
  Headphones,
  Edit2,
  Trash2,
  Sparkles,
  Lock,
  ChevronRight
} from 'lucide-react';

/* =========================================================================
   TYPES & INTERFACES
   ========================================================================= */

export interface DeliveryAddress {
  id: string | number;
  fullName: string;
  phone: string;
  houseFlat: string;
  street: string;
  city: string;
  state: string;
  pinCode: string;
  isDefault?: boolean;
  addressType?: 'HOME' | 'WORK' | 'OTHER';
}

export interface ShipmentItem {
  id: string | number;
  name: string;
  variant: string;
  quantity: number;
  price: number;
  originalPrice?: number;
  image: string;
}

export interface DeliveryPriceSummary {
  itemsCount: number;
  totalMrp: number;
  festiveDiscount: number;
  deliveryFee: number; // 0 for free
  payableAmount: number;
}

export interface DeliveryAddressStepProps {
  user?: {
    name: string;
    email: string;
  };
  addresses?: DeliveryAddress[];
  selectedAddressId?: string | number;
  onSelectAddress?: (id: string | number) => void;
  onProceedToPayment?: (selectedAddress: DeliveryAddress) => void;
  onAddNewAddress?: (address: Omit<DeliveryAddress, 'id'>) => void;
  onEditAddress?: (address: DeliveryAddress) => void;
  shipmentItems?: ShipmentItem[];
  priceSummary?: DeliveryPriceSummary;
}

/* =========================================================================
   DEFAULT MOCK DATA
   ========================================================================= */

const DEFAULT_USER = {
  name: 'Om',
  email: 'omvinayak94@gmail.com'
};

const DEFAULT_ADDRESSES: DeliveryAddress[] = [
  {
    id: 1,
    fullName: 'Om',
    phone: '+91 9876543210',
    houseFlat: 'Flat No. 402, Royal Palms Residency',
    street: 'MG Road, Jubilee Hills',
    city: 'Hyderabad',
    state: 'Telangana',
    pinCode: '500033',
    isDefault: true,
    addressType: 'HOME'
  }
];

const DEFAULT_SHIPMENT_ITEMS: ShipmentItem[] = [
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

const DEFAULT_PRICE_SUMMARY: DeliveryPriceSummary = {
  itemsCount: 1,
  totalMrp: 1799,
  festiveDiscount: 900,
  deliveryFee: 0,
  payableAmount: 899
};

/* =========================================================================
   COMPONENT: DeliveryAddressStep
   ========================================================================= */

export const DeliveryAddressStep: React.FC<DeliveryAddressStepProps> = ({
  user = DEFAULT_USER,
  addresses = DEFAULT_ADDRESSES,
  selectedAddressId: propSelectedId,
  onSelectAddress,
  onProceedToPayment,
  onAddNewAddress,
  onEditAddress,
  shipmentItems = DEFAULT_SHIPMENT_ITEMS,
  priceSummary = DEFAULT_PRICE_SUMMARY
}) => {
  const [selectedId, setSelectedId] = useState<string | number>(
    propSelectedId || addresses[0]?.id || 1
  );
  const [isAddingNew, setIsAddingNew] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string | number | null>(null);

  // Form State for Adding / Editing Address
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    houseFlat: '',
    street: '',
    city: '',
    state: '',
    pinCode: '',
    isDefault: false,
    addressType: 'HOME' as 'HOME' | 'WORK' | 'OTHER'
  });

  const activeAddress = addresses.find((a) => a.id === selectedId) || addresses[0];

  const handleSelect = (id: string | number) => {
    setSelectedId(id);
    if (onSelectAddress) onSelectAddress(id);
  };

  const handleProceed = () => {
    if (activeAddress && onProceedToPayment) {
      onProceedToPayment(activeAddress);
    } else {
      window.location.href = '/checkout.html';
    }
  };

  const handleStartEdit = (addr: DeliveryAddress) => {
    setEditingId(addr.id);
    setFormData({
      fullName: addr.fullName,
      phone: addr.phone.replace('+91 ', ''),
      houseFlat: addr.houseFlat,
      street: addr.street,
      city: addr.city,
      state: addr.state,
      pinCode: addr.pinCode,
      isDefault: !!addr.isDefault,
      addressType: addr.addressType || 'HOME'
    });
    setIsAddingNew(true);
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      if (onEditAddress) {
        onEditAddress({
          id: editingId,
          ...formData,
          phone: formData.phone.startsWith('+91') ? formData.phone : `+91 ${formData.phone}`
        });
      }
    } else {
      if (onAddNewAddress) {
        onAddNewAddress({
          ...formData,
          phone: formData.phone.startsWith('+91') ? formData.phone : `+91 ${formData.phone}`
        });
      }
    }
    setIsAddingNew(false);
    setEditingId(null);
  };

  return (
    <div className="min-h-screen bg-[#FBF9F5] text-[#111111] font-sans antialiased">
      
      {/* =====================================================================
          1. STEPPER BREADCRUMBS (Top of Page)
          ===================================================================== */}
      <section className="bg-white border-b border-neutral-200/80 py-4 sm:py-5 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
        <div className="max-w-4xl mx-auto px-4">
          <nav aria-label="Checkout Progress" className="flex items-center justify-center">
            
            {/* Step 1: Bag & Cart (Completed) */}
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

            {/* Connecting Hairline */}
            <div className="w-12 sm:w-20 h-[1.5px] bg-[#0F382A]/40 mx-2 sm:mx-4" />

            {/* Step 2: Delivery Address (Active) */}
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full ring-2 ring-[#111111] ring-offset-2 bg-[#111111] text-white flex items-center justify-center text-[11px] font-bold shadow-sm">
                02
              </span>
              <span className="text-xs font-bold tracking-wider text-[#111111]">
                Delivery Address
              </span>
            </div>

            {/* Connecting Hairline */}
            <div className="w-12 sm:w-20 h-[1.5px] bg-neutral-200 mx-2 sm:mx-4" />

            {/* Step 3: Payment & Review (Pending) */}
            <div className="flex items-center gap-2 text-neutral-400">
              <span className="w-6 h-6 rounded-full border border-neutral-300 bg-neutral-100 flex items-center justify-center text-[11px] font-medium text-neutral-400">
                03
              </span>
              <span className="text-xs font-medium tracking-wider text-neutral-400 hidden xs:inline">
                Payment & Review
              </span>
              <span className="text-xs font-medium tracking-wider text-neutral-400 xs:hidden">
                Payment
              </span>
            </div>

          </nav>
        </div>
      </section>

      {/* =====================================================================
          2. ACCOUNT QUICK-BAR (Discreet & Borderless)
          ===================================================================== */}
      <section className="max-w-6xl mx-auto px-4 lg:px-8 pt-5 pb-1">
        <div className="flex items-center justify-between text-xs text-neutral-600 bg-white/60 backdrop-blur-sm px-4 py-2.5 rounded-xl border border-neutral-200/60 shadow-xs">
          <div className="flex items-center gap-2 truncate">
            <span className="w-6 h-6 rounded-full bg-neutral-100 border border-neutral-200 flex items-center justify-center text-neutral-600 shrink-0">
              <User className="w-3.5 h-3.5" />
            </span>
            <span className="truncate">
              Logged in as <strong className="text-neutral-900 font-semibold">{user.name}</strong> ({user.email})
            </span>
          </div>
          <a
            href="/login.html?redirect=/delivery.html"
            className="text-neutral-800 hover:text-black font-semibold tracking-wide ml-4 shrink-0 transition-colors flex items-center gap-1 group"
          >
            <span>Switch Account</span>
            <span className="group-hover:translate-x-0.5 transition-transform">→</span>
          </a>
        </div>
      </section>

      {/* =====================================================================
          3. MAIN TWO-COLUMN CHECKOUT LAYOUT (Left: 65% / Right: 35%)
          ===================================================================== */}
      <main className="max-w-6xl mx-auto px-4 lg:px-8 py-6 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* ==================== LEFT COLUMN: MAIN CONTENT (8 Cols) ==================== */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* ---------------- SECTION 1: SELECT DELIVERY ADDRESS ---------------- */}
          <div className="bg-white rounded-xl border border-neutral-200/90 shadow-sm overflow-hidden">
            
            {/* Header Row */}
            <div className="px-5 py-4 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/50">
              <div className="flex items-center gap-2.5">
                <span className="w-2 h-2 rounded-full bg-[#C5A880]" />
                <h2 className="text-xs sm:text-sm font-bold tracking-[0.15em] uppercase text-neutral-900">
                  Select Delivery Address
                </h2>
              </div>
              <span className="text-[11px] font-semibold text-[#0F382A] tracking-wider uppercase bg-[#0F382A]/8 px-2.5 py-0.5 rounded-full border border-[#0F382A]/15">
                Step 2 of 3
              </span>
            </div>

            <div className="p-5 sm:p-6 space-y-4">
              
              {/* Address Cards List */}
              <div className="space-y-3">
                {addresses.map((addr) => {
                  const isSelected = addr.id === selectedId;
                  return (
                    <div
                      key={addr.id}
                      onClick={() => handleSelect(addr.id)}
                      className={`relative rounded-xl p-5 sm:p-6 cursor-pointer transition-all border ${
                        isSelected
                          ? 'bg-[#FDFBF7] border-[#C5A880] ring-1 ring-[#C5A880]/30 shadow-sm'
                          : 'bg-white border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50/40'
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        
                        {/* Custom Luxury Radio Selector */}
                        <div className="mt-1 shrink-0">
                          <div
                            className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                              isSelected
                                ? 'border-[#111111] bg-[#111111]'
                                : 'border-neutral-300 bg-white'
                            }`}
                          >
                            {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                          </div>
                        </div>

                        {/* Address Content */}
                        <div className="flex-1 min-w-0">
                          
                          {/* Name, Badges & Action Bar */}
                          <div className="flex items-center justify-between gap-3 flex-wrap">
                            <div className="flex items-center gap-2.5 flex-wrap">
                              <span className="font-semibold text-sm sm:text-base text-neutral-900">
                                {addr.fullName}
                              </span>

                              {/* DEFAULT / TYPE BADGE */}
                              {addr.isDefault && (
                                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-[#FAF4EB] text-[#8C6D37] border border-[#C5A880]/40">
                                  Default
                                </span>
                              )}

                              <span className="text-[10px] uppercase font-semibold tracking-wider px-2 py-0.5 rounded-md bg-neutral-100 text-neutral-600 border border-neutral-200">
                                {addr.addressType || 'HOME'}
                              </span>

                              {/* Phone Chip */}
                              <span className="text-xs font-medium text-neutral-600">
                                {addr.phone}
                              </span>
                            </div>

                            {/* Minimalist Edit Address Action Link */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStartEdit(addr);
                              }}
                              className="text-xs font-semibold text-[#8C6D37] hover:text-[#5E4720] transition-colors flex items-center gap-1 underline underline-offset-4"
                            >
                              <Edit2 className="w-3 h-3" />
                              <span>Edit Address</span>
                            </button>
                          </div>

                          {/* Full Formatted Address with Generous Line-Height */}
                          <p className="mt-2.5 text-xs sm:text-sm text-neutral-600 leading-relaxed font-normal">
                            {addr.houseFlat}, {addr.street}, {addr.city}, {addr.state} –{' '}
                            <strong className="font-semibold text-neutral-900">{addr.pinCode}</strong>
                          </p>

                          {/* Primary CTA Button (when card is selected) */}
                          {isSelected && (
                            <div className="mt-5 pt-4 border-t border-neutral-200/60 flex items-center justify-between flex-wrap gap-4">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleProceed();
                                }}
                                className="w-full sm:w-auto bg-[#111111] hover:bg-black text-white py-3.5 px-7 rounded-lg font-medium text-xs tracking-widest uppercase transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 group cursor-pointer"
                              >
                                <span>DELIVER TO THIS ADDRESS & PROCEED</span>
                                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                              </button>
                              
                              <span className="text-[11px] text-neutral-500 hidden sm:inline-block">
                                Safe, contactless delivery guaranteed
                              </span>
                            </div>
                          )}

                        </div>

                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Add New Address Outline Button */}
              {!isAddingNew ? (
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(null);
                    setFormData({
                      fullName: '',
                      phone: '',
                      houseFlat: '',
                      street: '',
                      city: '',
                      state: '',
                      pinCode: '',
                      isDefault: false,
                      addressType: 'HOME'
                    });
                    setIsAddingNew(true);
                  }}
                  className="w-full py-3.5 px-4 rounded-xl border border-neutral-300 hover:border-neutral-900 bg-white hover:bg-neutral-50/80 text-neutral-800 hover:text-black font-semibold text-xs tracking-wider transition-all flex items-center justify-center gap-2 shadow-xs group"
                >
                  <Plus className="w-4 h-4 text-neutral-600 group-hover:text-black transition-colors" />
                  <span>+ Add New Delivery Address</span>
                </button>
              ) : (
                /* Inline Clean Add/Edit Form */
                <div className="p-5 sm:p-6 rounded-xl border border-[#C5A880]/50 bg-[#FAF8F5] space-y-4 animate-in fade-in">
                  <div className="flex items-center justify-between border-b border-neutral-200/60 pb-3">
                    <h3 className="text-xs font-bold tracking-wider uppercase text-neutral-900">
                      {editingId ? 'Edit Delivery Address' : 'Add New Delivery Address'}
                    </h3>
                    <button
                      type="button"
                      onClick={() => setIsAddingNew(false)}
                      className="text-xs font-semibold text-neutral-500 hover:text-neutral-900"
                    >
                      Cancel
                    </button>
                  </div>

                  <form onSubmit={handleSaveForm} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[11px] font-semibold text-neutral-700 uppercase tracking-wider block mb-1">
                          Receiver Full Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.fullName}
                          onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                          placeholder="e.g. Om"
                          className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-neutral-300 bg-white focus:border-neutral-900 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-neutral-700 uppercase tracking-wider block mb-1">
                          10-Digit Mobile Number *
                        </label>
                        <input
                          type="tel"
                          required
                          maxLength={10}
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          placeholder="e.g. 9876543210"
                          className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-neutral-300 bg-white focus:border-neutral-900 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-neutral-700 uppercase tracking-wider block mb-1">
                        Flat, House No., Apartment, Suite *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.houseFlat}
                        onChange={(e) => setFormData({ ...formData, houseFlat: e.target.value })}
                        placeholder="e.g. Flat No. 402, Royal Palms Residency"
                        className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-neutral-300 bg-white focus:border-neutral-900 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-neutral-700 uppercase tracking-wider block mb-1">
                        Area, Street, Sector, Landmark *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.street}
                        onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                        placeholder="e.g. MG Road, Jubilee Hills"
                        className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-neutral-300 bg-white focus:border-neutral-900 focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="text-[11px] font-semibold text-neutral-700 uppercase tracking-wider block mb-1">
                          City *
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.city}
                          onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                          placeholder="e.g. Hyderabad"
                          className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-neutral-300 bg-white focus:border-neutral-900 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-neutral-700 uppercase tracking-wider block mb-1">
                          State *
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.state}
                          onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                          placeholder="e.g. Telangana"
                          className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-neutral-300 bg-white focus:border-neutral-900 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-neutral-700 uppercase tracking-wider block mb-1">
                          PIN Code *
                        </label>
                        <input
                          type="text"
                          required
                          maxLength={6}
                          value={formData.pinCode}
                          onChange={(e) => setFormData({ ...formData, pinCode: e.target.value })}
                          placeholder="e.g. 500033"
                          className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-neutral-300 bg-white focus:border-neutral-900 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-3 pt-2">
                      <button
                        type="submit"
                        className="bg-[#111111] hover:bg-black text-white text-xs font-semibold py-3 px-6 rounded-lg uppercase tracking-wider transition-colors shadow-sm"
                      >
                        {editingId ? 'Save & Update Address' : 'Save & Select Address'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsAddingNew(false)}
                        className="text-xs font-semibold text-neutral-600 hover:text-black px-4 py-3"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              )}

            </div>

          </div>

          {/* ---------------- SECTION 2: ITEMS IN THIS SHIPMENT (1) ---------------- */}
          <div className="bg-white rounded-xl border border-neutral-200/90 shadow-sm overflow-hidden">
            
            <div className="px-5 py-4 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/50">
              <h2 className="text-xs sm:text-sm font-bold tracking-[0.15em] uppercase text-neutral-900">
                Items in this Shipment ({shipmentItems.length})
              </h2>
              <a
                href="/cart.html"
                className="text-xs font-semibold text-[#8C6D37] hover:text-[#5E4720] transition-colors underline underline-offset-4"
              >
                Modify Bag
              </a>
            </div>

            <div className="p-5 sm:p-6 divide-y divide-neutral-100">
              {shipmentItems.map((item) => (
                <div key={item.id} className="flex items-center gap-4 py-3 first:pt-0 last:pb-0">
                  {/* Portrait 3:4 Thumbnail of Baby Apparel */}
                  <div className="w-16 h-20 sm:w-20 sm:h-24 rounded-lg overflow-hidden border border-neutral-200 shrink-0 bg-neutral-100">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Item Description */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xs sm:text-sm font-semibold text-neutral-900 line-clamp-1">
                      {item.name}
                    </h3>
                    <p className="text-xs text-neutral-500 mt-1 font-medium">
                      {item.variant}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs sm:text-sm font-bold text-neutral-900">
                        ₹{item.price.toLocaleString('en-IN')}
                      </span>
                      {item.originalPrice && item.originalPrice > item.price && (
                        <span className="text-xs text-neutral-400 line-through">
                          ₹{item.originalPrice.toLocaleString('en-IN')}
                        </span>
                      )}
                      <span className="text-[10px] uppercase font-bold text-[#0F382A] bg-[#0F382A]/10 px-2 py-0.5 rounded">
                        50% Off
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

          </div>

          {/* ---------------- SECTION 3: DELIVERY GUARANTEE & TRUST ---------------- */}
          <div className="bg-white rounded-xl border border-neutral-200/90 shadow-sm p-5 sm:p-6">
            <h2 className="text-xs font-bold tracking-[0.15em] uppercase text-neutral-900 mb-4 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0F382A]" />
              Delivery Guarantee & Trust
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Feature 1 */}
              <div className="p-3.5 rounded-lg border border-neutral-100 bg-neutral-50/50 flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#FAF4EB] border border-[#C5A880]/30 flex items-center justify-center text-[#8C6D37] shrink-0 mt-0.5">
                  <Plane className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-neutral-900">
                    Express Air Shipping
                  </h4>
                  <p className="text-[11px] text-neutral-500 mt-0.5 leading-relaxed">
                    Dispatched via Blue Dart & Delhivery Priority Air • 3-4 days doorstep delivery.
                  </p>
                </div>
              </div>

              {/* Feature 2 */}
              <div className="p-3.5 rounded-lg border border-neutral-100 bg-neutral-50/50 flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#FAF4EB] border border-[#C5A880]/30 flex items-center justify-center text-[#8C6D37] shrink-0 mt-0.5">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-neutral-900">
                    100% Transit Insured
                  </h4>
                  <p className="text-[11px] text-neutral-500 mt-0.5 leading-relaxed">
                    Every luxury parcel is fully insured against damage or loss in transit.
                  </p>
                </div>
              </div>

              {/* Feature 3 */}
              <div className="p-3.5 rounded-lg border border-neutral-100 bg-neutral-50/50 flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#FAF4EB] border border-[#C5A880]/30 flex items-center justify-center text-[#8C6D37] shrink-0 mt-0.5">
                  <Gift className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-neutral-900">
                    Royal Gift Packaging
                  </h4>
                  <p className="text-[11px] text-neutral-500 mt-0.5 leading-relaxed">
                    Tamper-evident keepsake box wrapped in protective muslin.
                  </p>
                </div>
              </div>

              {/* Feature 4 */}
              <div className="p-3.5 rounded-lg border border-neutral-100 bg-neutral-50/50 flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#FAF4EB] border border-[#C5A880]/30 flex items-center justify-center text-[#8C6D37] shrink-0 mt-0.5">
                  <Headphones className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-neutral-900">
                    VIP Concierge Support
                  </h4>
                  <p className="text-[11px] text-neutral-500 mt-0.5 leading-relaxed">
                    Live assistance via WhatsApp or Call: +91 7894093586.
                  </p>
                </div>
              </div>

            </div>
          </div>

        </div>

        {/* ==================== RIGHT COLUMN: STICKY SUMMARY (4 Cols) ==================== */}
        <aside className="lg:col-span-4 sticky top-24">
          <div className="rounded-xl border border-neutral-200/90 bg-white p-6 shadow-sm space-y-5">
            
            {/* Heading */}
            <div className="border-b border-neutral-100 pb-3 flex items-center justify-between">
              <h2 className="text-xs font-bold tracking-[0.15em] uppercase text-neutral-900">
                Price Details
              </h2>
              <span className="text-xs text-neutral-400">
                ({priceSummary.itemsCount} Item)
              </span>
            </div>

            {/* Line Items */}
            <div className="space-y-3 text-xs">
              
              <div className="flex justify-between text-neutral-600">
                <span>Price ({priceSummary.itemsCount} item)</span>
                <span className="font-medium text-neutral-900">
                  ₹{priceSummary.totalMrp.toLocaleString('en-IN')}
                </span>
              </div>

              <div className="flex justify-between text-neutral-600">
                <span>Special Festive Discount</span>
                <span className="font-semibold text-[#0F382A]">
                  −₹{priceSummary.festiveDiscount.toLocaleString('en-IN')}
                </span>
              </div>

              <div className="flex justify-between text-neutral-600">
                <span>Express Pan-India Delivery</span>
                <span className="font-semibold text-[#0F382A] flex items-center gap-1.5">
                  <span className="line-through text-neutral-400 font-normal">₹49</span>
                  <span>FREE</span>
                </span>
              </div>

              <div className="border-t border-dashed border-neutral-200 pt-3 flex justify-between items-baseline">
                <span className="text-sm font-bold text-neutral-900">Total Amount Payable</span>
                <span className="text-lg font-bold text-[#111111] font-serif">
                  ₹{priceSummary.payableAmount.toLocaleString('en-IN')}
                </span>
              </div>

            </div>

            {/* Festive Savings Banner */}
            {priceSummary.festiveDiscount > 0 && (
              <div className="p-3 rounded-lg bg-[#EBF5F0] border border-[#0F382A]/20 flex items-center gap-2 text-xs font-semibold text-[#0F382A]">
                <Sparkles className="w-4 h-4 shrink-0 text-[#0F382A]" />
                <span>
                  ✨ You are saving ₹{priceSummary.festiveDiscount.toLocaleString('en-IN')} on this festive order!
                </span>
              </div>
            )}

            {/* Accepted Payment Badges */}
            <div className="pt-2 border-t border-neutral-100">
              <div className="text-[10px] font-bold tracking-wider uppercase text-neutral-400 mb-2.5">
                Accepted Payment Methods
              </div>
              <div className="flex flex-wrap gap-1.5">
                <span className="text-[10px] font-medium px-2.5 py-1 rounded-md bg-neutral-100 text-neutral-700 border border-neutral-200/80">
                  UPI (GPay / PhonePe)
                </span>
                <span className="text-[10px] font-medium px-2.5 py-1 rounded-md bg-neutral-100 text-neutral-700 border border-neutral-200/80">
                  Credit / Debit Cards
                </span>
                <span className="text-[10px] font-medium px-2.5 py-1 rounded-md bg-neutral-100 text-neutral-700 border border-neutral-200/80">
                  Net Banking
                </span>
                <span className="text-[10px] font-medium px-2.5 py-1 rounded-md bg-neutral-100 text-neutral-700 border border-neutral-200/80">
                  Cash on Delivery
                </span>
              </div>
            </div>

            {/* Bank Grade Security Seal */}
            <div className="flex items-center justify-center gap-1.5 text-[11px] text-neutral-500 pt-1">
              <Lock className="w-3.5 h-3.5 text-neutral-400" />
              <span>256-Bit Bank-Grade SSL Encrypted Checkout</span>
            </div>

          </div>
        </aside>

      </main>

    </div>
  );
};

export default DeliveryAddressStep;
