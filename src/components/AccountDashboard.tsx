import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package,
  Heart,
  MapPin,
  CreditCard,
  Settings,
  LogOut,
  Camera,
  CheckCircle2,
  Clock,
  Truck,
  Box,
  ChevronRight,
  ExternalLink,
  ShieldCheck,
  Plus,
  Trash2,
  AlertCircle,
  Eye,
  EyeOff,
  Sparkles,
} from 'lucide-react';

/* =========================================================================
   TYPE DEFINITIONS
   ========================================================================= */

export type AccountTab =
  | 'orders'
  | 'wishlist'
  | 'addresses'
  | 'payments'
  | 'security';

export interface UserProfile {
  id?: string | number;
  name: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  tier?: string;
  memberSince?: string;
  totalOrders?: number;
  wishlistCount?: number;
  savedAddressesCount?: number;
  loyaltyPoints?: number;
}

export interface OrderItem {
  id: string | number;
  name: string;
  image: string;
  price: number;
  quantity: number;
  size?: string;
  color?: string;
}

export interface Order {
  id: string;
  date: string;
  status: 'placed' | 'confirmed' | 'shipped' | 'out_for_delivery' | 'delivered' | 'cancelled';
  total: number;
  items: OrderItem[];
  trackingNumber?: string;
  carrier?: string;
  deliveryEstimate?: string;
}

export interface SavedAddress {
  id: string | number;
  fullName: string;
  phone: string;
  houseFlat: string;
  street: string;
  city: string;
  state: string;
  pinCode: string;
  isDefault?: boolean;
}

export interface SavedPaymentMethod {
  id: string;
  brand: 'visa' | 'mastercard' | 'upi' | 'rupay';
  last4?: string;
  vpa?: string;
  expiry?: string;
  holderName: string;
  isDefault?: boolean;
}

export interface AccountDashboardProps {
  initialUser?: UserProfile;
  initialOrders?: Order[];
  initialAddresses?: SavedAddress[];
  initialTab?: AccountTab;
  onLogout?: () => void;
}

/* =========================================================================
   SAMPLE MOCK DATA
   ========================================================================= */

const DEFAULT_USER: UserProfile = {
  id: 'usr_7894',
  name: 'Ananya Sharma',
  email: 'ananya.sharma@example.com',
  phone: '+91 98765 43210',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
  tier: 'RJ Royale VIP',
  memberSince: 'September 2025',
  totalOrders: 6,
  wishlistCount: 8,
  savedAddressesCount: 2,
  loyaltyPoints: 1450,
};

const DEFAULT_ORDERS: Order[] = [
  {
    id: 'RJFC-20261025-9921',
    date: '24 Oct 2026',
    status: 'shipped',
    total: 22998,
    carrier: 'BlueDart Luxury Express',
    trackingNumber: 'BD789409358IN',
    deliveryEstimate: 'Tomorrow, by 4:00 PM',
    items: [
      {
        id: '1',
        name: 'Royal Kanjivaram Pure Silk Zari Saree in Crimson Gold',
        image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=600&q=80',
        price: 14999,
        quantity: 1,
        color: 'Crimson & Pure Zari',
      },
      {
        id: '6',
        name: 'Heritage Antique Kundan Choker & Earrings Set',
        image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=600&q=80',
        price: 7999,
        quantity: 1,
        color: 'Antique Gold Polish',
      },
    ],
  },
  {
    id: 'RJFC-20260918-6410',
    date: '18 Sep 2026',
    status: 'delivered',
    total: 18999,
    carrier: 'Delhivery Sovereign Prime',
    trackingNumber: 'DL339482716IN',
    deliveryEstimate: 'Delivered on 21 Sep 2026',
    items: [
      {
        id: '2',
        name: 'Regal Ivory & Gold Embroidered Sherwani Set',
        image: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=600&q=80',
        price: 18999,
        quantity: 1,
        size: '40 / L',
        color: 'Ivory Gold',
      },
    ],
  },
];

const DEFAULT_ADDRESSES: SavedAddress[] = [
  {
    id: 'addr_1',
    fullName: 'Ananya Sharma',
    phone: '+91 98765 43210',
    houseFlat: 'Penthouse B-1204, Oberoi Sky Heights',
    street: 'Lokhandwala Complex, Andheri West',
    city: 'Mumbai',
    state: 'Maharashtra',
    pinCode: '400053',
    isDefault: true,
  },
  {
    id: 'addr_2',
    fullName: 'Ananya Sharma (Atelier Office)',
    phone: '+91 98765 43210',
    houseFlat: 'Suite 402, Signature One Arcade',
    street: 'Bandra Kurla Complex (BKC)',
    city: 'Mumbai',
    state: 'Maharashtra',
    pinCode: '400051',
    isDefault: false,
  },
];

const DEFAULT_PAYMENTS: SavedPaymentMethod[] = [
  {
    id: 'pay_1',
    brand: 'visa',
    last4: '4242',
    expiry: '08/29',
    holderName: 'ANANYA SHARMA',
    isDefault: true,
  },
  {
    id: 'pay_2',
    brand: 'upi',
    vpa: 'ananya.sharma@okhdfcbank',
    holderName: 'Ananya Sharma',
    isDefault: false,
  },
];

/* =========================================================================
   MAIN COMPONENT: AccountDashboard
   ========================================================================= */

export const AccountDashboard: React.FC<AccountDashboardProps> = ({
  initialUser = DEFAULT_USER,
  initialOrders = DEFAULT_ORDERS,
  initialAddresses = DEFAULT_ADDRESSES,
  initialTab = 'orders',
  onLogout,
}) => {
  const [activeTab, setActiveTab] = useState<AccountTab>(initialTab);
  const [user, setUser] = useState<UserProfile>(initialUser);
  const [orders] = useState<Order[]>(initialOrders);
  const [addresses, setAddresses] = useState<SavedAddress[]>(initialAddresses);
  const [payments] = useState<SavedPaymentMethod[]>(DEFAULT_PAYMENTS);

  // Profile Form State
  const [profileName, setProfileName] = useState(user.name);
  const [profilePhone, setProfilePhone] = useState(user.phone || '');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState('');

  // Password Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{ text: string; error: boolean } | null>(null);

  // Address Modal / Form State
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [newAddr, setNewAddr] = useState({
    fullName: '',
    phone: '',
    houseFlat: '',
    street: '',
    city: '',
    state: '',
    pinCode: '',
    isDefault: false,
  });

  // Handle Profile Update
  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingProfile(true);
    setTimeout(() => {
      setUser((prev) => ({ ...prev, name: profileName, phone: profilePhone }));
      setIsUpdatingProfile(false);
      setProfileSuccessMsg('Profile information updated successfully.');
      setTimeout(() => setProfileSuccessMsg(''), 4000);
    }, 600);
  };

  // Handle Password Change
  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setPasswordMsg({ text: 'New password must be at least 6 characters.', error: true });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ text: 'Passwords do not match.', error: true });
      return;
    }
    setPasswordMsg({ text: 'Password successfully updated.', error: false });
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setTimeout(() => setPasswordMsg(null), 4000);
  };

  // Handle Delete Address
  const handleDeleteAddress = (id: string | number) => {
    setAddresses((prev) => prev.filter((a) => a.id !== id));
  };

  // Handle Add Address
  const handleSaveAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAddr.fullName || !newAddr.houseFlat || !newAddr.city || !newAddr.pinCode) return;
    const created: SavedAddress = {
      id: `addr_${Date.now()}`,
      ...newAddr,
    };
    if (newAddr.isDefault) {
      setAddresses((prev) => [
        created,
        ...prev.map((a) => ({ ...a, isDefault: false })),
      ]);
    } else {
      setAddresses((prev) => [...prev, created]);
    }
    setShowAddressForm(false);
    setNewAddr({
      fullName: '',
      phone: '',
      houseFlat: '',
      street: '',
      city: '',
      state: '',
      pinCode: '',
      isDefault: false,
    });
  };

  // Status Step Resolver for Order Tracking
  const getStepProgress = (status: Order['status']) => {
    switch (status) {
      case 'placed':
        return 1;
      case 'confirmed':
        return 2;
      case 'shipped':
        return 3;
      case 'out_for_delivery':
        return 4;
      case 'delivered':
        return 5;
      default:
        return 1;
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#0A0A0C] text-white selection:bg-amber-400 selection:text-black py-8 sm:py-12 px-4 sm:px-6 lg:px-12 box-border">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* =========================================================================
            1. TOP PROFILE BANNER & ELEVATED STATS (Editorial Luxury)
            ========================================================================= */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="relative rounded-2xl bg-gradient-to-b from-[#141418] to-[#0E0E12] border border-amber-500/20 shadow-[0_16px_40px_rgba(0,0,0,0.65)] p-6 sm:p-8 lg:p-10 overflow-hidden"
        >
          {/* Subtle Ambient Radial Highlight */}
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-gradient-to-br from-amber-400/10 via-amber-200/5 to-transparent rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
            {/* Avatar & User Credentials */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-5">
              {/* Avatar with Upload Badge */}
              <div className="relative group">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden border-2 border-amber-400/50 shadow-[0_0_20px_rgba(212,175,55,0.25)] bg-[#1a191f]">
                  <img
                    src={user.avatarUrl}
                    alt={user.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <button
                  type="button"
                  aria-label="Change Profile Photo"
                  className="absolute bottom-0 right-0 p-2 rounded-full bg-amber-400 text-[#0A0A0C] shadow-lg hover:scale-110 active:scale-95 transition-transform"
                  title="Upload New Photo"
                >
                  <Camera className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Title & Tier Badge */}
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                  <h1 className="font-serif text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                    {user.name}
                  </h1>
                  <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider text-amber-300 bg-amber-400/10 border border-amber-400/30">
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    <span>{user.tier}</span>
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-[#A8A199] font-normal">
                  {user.email} • Member since {user.memberSince}
                </p>
                <div className="pt-1 flex items-center justify-center sm:justify-start gap-3 text-xs text-[#c5a880]">
                  <span className="flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    Verified VIP Account
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-3 gap-3 sm:gap-4 w-full lg:w-auto">
              <div className="flex flex-col items-center justify-center p-3.5 sm:p-4 rounded-xl bg-black/40 border border-white/5 backdrop-blur-md">
                <span className="text-xl sm:text-2xl font-serif font-extrabold text-white">
                  {orders.length}
                </span>
                <span className="text-[10px] sm:text-xs font-bold text-[#A8A199] tracking-wider uppercase mt-1">
                  Orders
                </span>
              </div>
              <div className="flex flex-col items-center justify-center p-3.5 sm:p-4 rounded-xl bg-black/40 border border-white/5 backdrop-blur-md">
                <span className="text-xl sm:text-2xl font-serif font-extrabold text-white">
                  {user.wishlistCount}
                </span>
                <span className="text-[10px] sm:text-xs font-bold text-[#A8A199] tracking-wider uppercase mt-1">
                  Saved Looks
                </span>
              </div>
              <div className="flex flex-col items-center justify-center p-3.5 sm:p-4 rounded-xl bg-black/40 border border-white/5 backdrop-blur-md">
                <span className="text-xl sm:text-2xl font-serif font-extrabold text-white">
                  {addresses.length}
                </span>
                <span className="text-[10px] sm:text-xs font-bold text-[#A8A199] tracking-wider uppercase mt-1">
                  Addresses
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* =========================================================================
            2. DASHBOARD BODY: SIDEBAR + MAIN CONTENT WORKSPACE
            ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* NAVIGATION SIDEBAR / TABS */}
          <div className="lg:col-span-3 w-full">
            {/* Desktop Navigation Column */}
            <nav className="hidden lg:flex flex-col gap-1.5 p-2 rounded-2xl bg-[#121217] border border-white/5 shadow-md">
              <button
                type="button"
                onClick={() => setActiveTab('orders')}
                className={`flex items-center justify-between w-full px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-300 ${
                  activeTab === 'orders'
                    ? 'bg-amber-400/15 text-amber-300 border border-amber-400/35 shadow-sm'
                    : 'text-[#A8A199] hover:text-white hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Package className="w-4 h-4 text-amber-400" />
                  <span>My Orders</span>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-white/90">
                  {orders.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('wishlist')}
                className={`flex items-center justify-between w-full px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-300 ${
                  activeTab === 'wishlist'
                    ? 'bg-amber-400/15 text-amber-300 border border-amber-400/35 shadow-sm'
                    : 'text-[#A8A199] hover:text-white hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Heart className="w-4 h-4 text-amber-400" />
                  <span>Wishlist &amp; Looks</span>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-white/90">
                  {user.wishlistCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('addresses')}
                className={`flex items-center justify-between w-full px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-300 ${
                  activeTab === 'addresses'
                    ? 'bg-amber-400/15 text-amber-300 border border-amber-400/35 shadow-sm'
                    : 'text-[#A8A199] hover:text-white hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-3">
                  <MapPin className="w-4 h-4 text-amber-400" />
                  <span>Saved Addresses</span>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-white/90">
                  {addresses.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('payments')}
                className={`flex items-center justify-between w-full px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-300 ${
                  activeTab === 'payments'
                    ? 'bg-amber-400/15 text-amber-300 border border-amber-400/35 shadow-sm'
                    : 'text-[#A8A199] hover:text-white hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-3">
                  <CreditCard className="w-4 h-4 text-amber-400" />
                  <span>Payment &amp; Wallets</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('security')}
                className={`flex items-center justify-between w-full px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-300 ${
                  activeTab === 'security'
                    ? 'bg-amber-400/15 text-amber-300 border border-amber-400/35 shadow-sm'
                    : 'text-[#A8A199] hover:text-white hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Settings className="w-4 h-4 text-amber-400" />
                  <span>Account &amp; Security</span>
                </div>
              </button>

              <div className="my-2 border-t border-white/5" />

              <button
                type="button"
                onClick={onLogout}
                className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </nav>

            {/* Mobile / Tablet Horizontal Scrolling Tab Pills (< 1024px) */}
            <div className="flex lg:hidden overflow-x-auto gap-2 pb-2 scrollbar-none no-scrollbar">
              <button
                type="button"
                onClick={() => setActiveTab('orders')}
                className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                  activeTab === 'orders'
                    ? 'bg-amber-400 text-black shadow-md'
                    : 'bg-[#141418] text-[#A8A199] border border-white/10'
                }`}
              >
                <Package className="w-3.5 h-3.5" />
                <span>Orders ({orders.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('wishlist')}
                className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                  activeTab === 'wishlist'
                    ? 'bg-amber-400 text-black shadow-md'
                    : 'bg-[#141418] text-[#A8A199] border border-white/10'
                }`}
              >
                <Heart className="w-3.5 h-3.5" />
                <span>Wishlist</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('addresses')}
                className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                  activeTab === 'addresses'
                    ? 'bg-amber-400 text-black shadow-md'
                    : 'bg-[#141418] text-[#A8A199] border border-white/10'
                }`}
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>Addresses</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('payments')}
                className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                  activeTab === 'payments'
                    ? 'bg-amber-400 text-black shadow-md'
                    : 'bg-[#141418] text-[#A8A199] border border-white/10'
                }`}
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Payments</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('security')}
                className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                  activeTab === 'security'
                    ? 'bg-amber-400 text-black shadow-md'
                    : 'bg-[#141418] text-[#A8A199] border border-white/10'
                }`}
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Settings</span>
              </button>
            </div>
          </div>

          {/* MAIN CONTENT WORKSPACE */}
          <div className="lg:col-span-9 w-full min-h-[500px]">
            <AnimatePresence mode="wait">
              {/* TAB 1: MY ORDERS */}
              {activeTab === 'orders' && (
                <motion.div
                  key="orders-tab"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.35 }}
                  className="space-y-6"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
                    <div>
                      <h2 className="font-serif text-2xl font-extrabold text-white tracking-tight">
                        Order History
                      </h2>
                      <p className="text-xs sm:text-sm text-[#A8A199]">
                        Review your bespoke Indian couture and jewelry commissions.
                      </p>
                    </div>
                    <span className="text-xs font-bold text-amber-300 bg-amber-400/10 border border-amber-400/25 px-3 py-1 rounded-full self-start sm:self-auto">
                      {orders.length} Total Placed
                    </span>
                  </div>

                  {orders.length === 0 ? (
                    /* Fashion Empty State */
                    <div className="text-center py-16 px-4 rounded-2xl bg-[#121217] border border-white/5 space-y-4">
                      <div className="w-16 h-16 rounded-full bg-amber-400/10 border border-amber-400/30 flex items-center justify-center mx-auto text-amber-400">
                        <Package className="w-8 h-8" />
                      </div>
                      <h3 className="font-serif text-xl font-bold text-white">
                        No Orders Yet
                      </h3>
                      <p className="text-sm text-[#A8A199] max-w-md mx-auto">
                        Your luxury atelier bag is awaiting its first selection. Explore our handcrafted royal bridal and celebratory edits.
                      </p>
                      <a
                        href="/shop.html"
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-extrabold text-sm shadow-md hover:shadow-amber-400/20 transition-all"
                      >
                        <span>EXPLORE NEW ARRIVALS</span>
                        <ChevronRight className="w-4 h-4" />
                      </a>
                    </div>
                  ) : (
                    /* Order Cards */
                    <div className="space-y-5">
                      {orders.map((order) => {
                        const step = getStepProgress(order.status);
                        return (
                          <div
                            key={order.id}
                            className="rounded-2xl bg-[#121217] border border-white/10 hover:border-amber-400/40 shadow-sm transition-all duration-300 overflow-hidden"
                          >
                            {/* Card Header */}
                            <div className="p-4 sm:p-6 bg-white/[0.02] border-b border-white/5 flex flex-wrap items-center justify-between gap-4">
                              <div className="space-y-1">
                                <span className="text-xs text-[#A8A199] uppercase tracking-wider">
                                  Order Reference
                                </span>
                                <h4 className="font-mono text-sm sm:text-base font-bold text-white">
                                  {order.id}
                                </h4>
                              </div>

                              <div className="space-y-1 text-left sm:text-right">
                                <span className="text-xs text-[#A8A199] uppercase tracking-wider">
                                  Placed On
                                </span>
                                <p className="text-xs sm:text-sm font-semibold text-white">
                                  {order.date}
                                </p>
                              </div>

                              <div className="space-y-1 text-left sm:text-right">
                                <span className="text-xs text-[#A8A199] uppercase tracking-wider">
                                  Grand Total
                                </span>
                                <p className="text-sm sm:text-base font-serif font-extrabold text-amber-300">
                                  ₹{order.total.toLocaleString('en-IN')}
                                </p>
                              </div>
                            </div>

                            {/* Tracking Progress Bar */}
                            <div className="p-4 sm:p-6 bg-black/30 border-b border-white/5 space-y-4">
                              <div className="flex items-center justify-between text-xs text-[#A8A199]">
                                <span className="flex items-center gap-1.5 font-bold text-white">
                                  <Truck className="w-4 h-4 text-amber-400" />
                                  <span>{order.carrier}</span>
                                </span>
                                <span>{order.deliveryEstimate}</span>
                              </div>

                              {/* Step Indicator */}
                              <div className="relative flex items-center justify-between w-full">
                                <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white/10 -translate-y-1/2 z-0" />
                                <div
                                  className="absolute top-1/2 left-0 h-0.5 bg-gradient-to-r from-amber-400 to-amber-600 -translate-y-1/2 z-0 transition-all duration-500"
                                  style={{
                                    width: `${((step - 1) / 4) * 100}%`,
                                  }}
                                />

                                {[
                                  { label: 'Placed', icon: Clock },
                                  { label: 'Confirmed', icon: CheckCircle2 },
                                  { label: 'Shipped', icon: Box },
                                  { label: 'Out for Delivery', icon: Truck },
                                  { label: 'Delivered', icon: CheckCircle2 },
                                ].map((s, idx) => {
                                  const isDone = idx + 1 <= step;
                                  const isCurrent = idx + 1 === step;
                                  return (
                                    <div
                                      key={s.label}
                                      className="relative z-10 flex flex-col items-center gap-1.5"
                                    >
                                      <div
                                        className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                                          isDone
                                            ? 'bg-amber-400 text-black shadow-[0_0_10px_rgba(212,175,55,0.4)]'
                                            : 'bg-[#18181f] text-white/40 border border-white/10'
                                        }`}
                                      >
                                        <s.icon className="w-3.5 h-3.5" />
                                      </div>
                                      <span
                                        className={`hidden sm:block text-[10px] font-semibold tracking-wider uppercase ${
                                          isCurrent
                                            ? 'text-amber-300'
                                            : isDone
                                            ? 'text-white'
                                            : 'text-white/30'
                                        }`}
                                      >
                                        {s.label}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Order Items */}
                            <div className="p-4 sm:p-6 space-y-4">
                              {order.items.map((item) => (
                                <div
                                  key={item.id}
                                  className="flex items-center gap-4 py-2 border-b border-white/5 last:border-b-0"
                                >
                                  <img
                                    src={item.image}
                                    alt={item.name}
                                    className="w-16 h-20 sm:w-20 sm:h-24 rounded-xl object-cover border border-white/10 shrink-0"
                                  />
                                  <div className="flex-1 min-w-0">
                                    <h5 className="font-serif text-sm sm:text-base font-bold text-white truncate">
                                      {item.name}
                                    </h5>
                                    <p className="text-xs text-[#A8A199] mt-0.5">
                                      Qty: {item.quantity}{' '}
                                      {item.size ? `• Size: ${item.size}` : ''}{' '}
                                      {item.color ? `• Color: ${item.color}` : ''}
                                    </p>
                                    <p className="text-sm font-semibold text-amber-300 mt-1">
                                      ₹{item.price.toLocaleString('en-IN')}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>

                            {/* Card Footer Actions */}
                            <div className="p-4 sm:p-6 bg-white/[0.01] border-t border-white/5 flex flex-wrap items-center justify-end gap-3">
                              <a
                                href={`/orders.html?id=${order.id}`}
                                className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
                              >
                                View Invoice
                              </a>
                              <a
                                href={`/shop.html`}
                                className="px-5 py-2 rounded-xl text-xs font-extrabold uppercase tracking-wider text-black bg-gradient-to-r from-amber-300 via-amber-400 to-amber-600 shadow-sm hover:shadow-amber-400/20 active:scale-95 transition-all"
                              >
                                Buy Again
                              </a>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </motion.div>
              )}

              {/* TAB 2: WISHLIST & SAVED LOOKS */}
              {activeTab === 'wishlist' && (
                <motion.div
                  key="wishlist-tab"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.35 }}
                  className="space-y-6"
                >
                  <div className="flex items-center justify-between pb-4 border-b border-white/10">
                    <div>
                      <h2 className="font-serif text-2xl font-extrabold text-white tracking-tight">
                        Wishlist &amp; Saved Looks
                      </h2>
                      <p className="text-xs sm:text-sm text-[#A8A199]">
                        Your curated bespoke wishlist and celebratory ensembles.
                      </p>
                    </div>
                    <a
                      href="/wishlist.html"
                      className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1.5"
                    >
                      <span>Open Full Wishlist</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                    {[
                      {
                        title: 'Varanasi Gold Brocade Silk Saree',
                        price: 12499,
                        img: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=600&q=80',
                        tag: 'Bestseller',
                      },
                      {
                        title: 'Handcrafted Zardozi Potli Bag in Emerald',
                        price: 3299,
                        img: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=600&q=80',
                        tag: 'Atelier Leather',
                      },
                      {
                        title: 'Royal Meenakari & Pearl Chandbali Drops',
                        price: 3299,
                        img: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=600&q=80',
                        tag: 'Trending Jewels',
                      },
                    ].map((item) => (
                      <div
                        key={item.title}
                        className="rounded-2xl overflow-hidden bg-[#121217] border border-white/10 group hover:border-amber-400/40 transition-all duration-300"
                      >
                        <div className="relative aspect-[3/4] overflow-hidden">
                          <img
                            src={item.img}
                            alt={item.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                          />
                          <span className="absolute top-3 left-3 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider text-amber-300 bg-black/60 backdrop-blur-md border border-amber-400/30">
                            {item.tag}
                          </span>
                        </div>
                        <div className="p-4 space-y-2">
                          <h4 className="font-serif text-sm font-bold text-white truncate">
                            {item.title}
                          </h4>
                          <p className="text-sm font-semibold text-amber-300">
                            ₹{item.price.toLocaleString('en-IN')}
                          </p>
                          <a
                            href="/cart.html"
                            className="block w-full text-center py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-amber-400 hover:bg-amber-300 text-black transition-colors"
                          >
                            Move to Bag
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* TAB 3: SAVED ADDRESSES */}
              {activeTab === 'addresses' && (
                <motion.div
                  key="addresses-tab"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.35 }}
                  className="space-y-6"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
                    <div>
                      <h2 className="font-serif text-2xl font-extrabold text-white tracking-tight">
                        Delivery Addresses
                      </h2>
                      <p className="text-xs sm:text-sm text-[#A8A199]">
                        Manage domestic and international express shipping destinations.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowAddressForm(!showAddressForm)}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider text-black bg-amber-400 hover:bg-amber-300 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      <span>{showAddressForm ? 'Close Form' : 'Add New Address'}</span>
                    </button>
                  </div>

                  {/* Add Address Collapsible Card */}
                  <AnimatePresence>
                    {showAddressForm && (
                      <motion.form
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        onSubmit={handleSaveAddress}
                        className="rounded-2xl p-6 bg-[#141419] border border-amber-400/30 space-y-4 overflow-hidden"
                      >
                        <h4 className="font-serif text-base font-bold text-white">
                          New Delivery Address Details
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-xs font-medium text-[#A8A199]">
                              Full Name *
                            </label>
                            <input
                              type="text"
                              required
                              value={newAddr.fullName}
                              onChange={(e) => setNewAddr({ ...newAddr, fullName: e.target.value })}
                              placeholder="Recipient full name"
                              className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/10 focus:border-amber-400 text-sm text-white focus:outline-none transition-colors"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs font-medium text-[#A8A199]">
                              Phone Number *
                            </label>
                            <input
                              type="tel"
                              required
                              value={newAddr.phone}
                              onChange={(e) => setNewAddr({ ...newAddr, phone: e.target.value })}
                              placeholder="+91 98765 43210"
                              className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/10 focus:border-amber-400 text-sm text-white focus:outline-none transition-colors"
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-medium text-[#A8A199]">
                            House / Flat / Building *
                          </label>
                          <input
                            type="text"
                            required
                            value={newAddr.houseFlat}
                            onChange={(e) => setNewAddr({ ...newAddr, houseFlat: e.target.value })}
                            placeholder="Flat / Villa / House Number"
                            className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/10 focus:border-amber-400 text-sm text-white focus:outline-none transition-colors"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-medium text-[#A8A199]">
                            Street / Locality / Landmark *
                          </label>
                          <input
                            type="text"
                            required
                            value={newAddr.street}
                            onChange={(e) => setNewAddr({ ...newAddr, street: e.target.value })}
                            placeholder="Street name, landmark"
                            className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/10 focus:border-amber-400 text-sm text-white focus:outline-none transition-colors"
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div className="space-y-1">
                            <label className="text-xs font-medium text-[#A8A199]">City *</label>
                            <input
                              type="text"
                              required
                              value={newAddr.city}
                              onChange={(e) => setNewAddr({ ...newAddr, city: e.target.value })}
                              placeholder="City"
                              className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/10 focus:border-amber-400 text-sm text-white focus:outline-none transition-colors"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs font-medium text-[#A8A199]">State *</label>
                            <input
                              type="text"
                              required
                              value={newAddr.state}
                              onChange={(e) => setNewAddr({ ...newAddr, state: e.target.value })}
                              placeholder="State"
                              className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/10 focus:border-amber-400 text-sm text-white focus:outline-none transition-colors"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs font-medium text-[#A8A199]">PIN Code *</label>
                            <input
                              type="text"
                              required
                              value={newAddr.pinCode}
                              onChange={(e) => setNewAddr({ ...newAddr, pinCode: e.target.value })}
                              placeholder="6-digit PIN"
                              className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/10 focus:border-amber-400 text-sm text-white focus:outline-none transition-colors"
                            />
                          </div>
                        </div>

                        <div className="flex items-center gap-2 pt-2">
                          <input
                            type="checkbox"
                            id="default-check"
                            checked={newAddr.isDefault}
                            onChange={(e) => setNewAddr({ ...newAddr, isDefault: e.target.checked })}
                            className="rounded accent-amber-400"
                          />
                          <label htmlFor="default-check" className="text-xs text-[#A8A199] cursor-pointer">
                            Set as primary default shipping address
                          </label>
                        </div>

                        <button
                          type="submit"
                          className="px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-amber-400 text-black hover:bg-amber-300 transition-colors"
                        >
                          Save Address
                        </button>
                      </motion.form>
                    )}
                  </AnimatePresence>

                  {/* Saved Address Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {addresses.map((addr) => (
                      <div
                        key={addr.id}
                        className={`rounded-2xl p-5 border transition-all duration-300 flex flex-col justify-between ${
                          addr.isDefault
                            ? 'bg-[#141418] border-amber-400/40 shadow-sm'
                            : 'bg-[#121217] border-white/10 hover:border-white/20'
                        }`}
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <h4 className="font-serif text-base font-bold text-white">
                              {addr.fullName}
                            </h4>
                            {addr.isDefault && (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-400/20 text-amber-300 border border-amber-400/30">
                                Default Address
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-[#A8A199] leading-relaxed">
                            {addr.houseFlat}, {addr.street}
                            <br />
                            {addr.city}, {addr.state} — {addr.pinCode}
                          </p>
                          <p className="text-xs text-white/70 font-mono">
                            Phone: {addr.phone}
                          </p>
                        </div>

                        <div className="pt-4 mt-4 border-t border-white/5 flex items-center justify-between">
                          <span className="text-[11px] text-[#A8A199] flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-amber-400" />
                            Verified PIN
                          </span>
                          <button
                            type="button"
                            onClick={() => handleDeleteAddress(addr.id)}
                            className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Remove</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* TAB 4: PAYMENT METHODS & WALLETS */}
              {activeTab === 'payments' && (
                <motion.div
                  key="payments-tab"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.35 }}
                  className="space-y-6"
                >
                  <div className="pb-4 border-b border-white/10">
                    <h2 className="font-serif text-2xl font-extrabold text-white tracking-tight">
                      Payment Methods &amp; Vault
                    </h2>
                    <p className="text-xs sm:text-sm text-[#A8A199]">
                      256-bit encrypted tokenized payment methods for seamless 1-click checkout.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {payments.map((p) => (
                      <div
                        key={p.id}
                        className="rounded-2xl p-5 bg-[#121217] border border-white/10 space-y-4 hover:border-amber-400/30 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold uppercase tracking-wider text-amber-300 bg-amber-400/10 px-2.5 py-0.5 rounded-full border border-amber-400/30">
                            {p.brand.toUpperCase()}
                          </span>
                          {p.isDefault && (
                            <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              Primary
                            </span>
                          )}
                        </div>

                        {p.last4 ? (
                          <div className="font-mono text-lg font-bold text-white tracking-widest">
                            •••• •••• •••• {p.last4}
                          </div>
                        ) : (
                          <div className="font-mono text-sm font-bold text-white">
                            {p.vpa}
                          </div>
                        )}

                        <div className="flex items-center justify-between text-xs text-[#A8A199]">
                          <span>{p.holderName}</span>
                          {p.expiry && <span>Exp: {p.expiry}</span>}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Security Notice */}
                  <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 flex items-center gap-3 text-xs text-[#A8A199]">
                    <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0" />
                    <span>
                      All transactions are protected with PCI-DSS Level 1 compliance and end-to-end tokenization. Your card numbers are never stored in raw text.
                    </span>
                  </div>
                </motion.div>
              )}

              {/* TAB 5: ACCOUNT & SECURITY */}
              {activeTab === 'security' && (
                <motion.div
                  key="security-tab"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.35 }}
                  className="space-y-8"
                >
                  {/* Profile Edit Card */}
                  <div className="rounded-2xl p-6 bg-[#121217] border border-white/10 space-y-5">
                    <div>
                      <h3 className="font-serif text-xl font-bold text-white">
                        Personal Information
                      </h3>
                      <p className="text-xs text-[#A8A199]">
                        Update your contact information for order confirmations and boutique concierge styling.
                      </p>
                    </div>

                    {profileSuccessMsg && (
                      <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>{profileSuccessMsg}</span>
                      </div>
                    )}

                    <form onSubmit={handleProfileSubmit} className="space-y-4 max-w-xl">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-[#A8A199]">
                          Full Name
                        </label>
                        <input
                          type="text"
                          required
                          value={profileName}
                          onChange={(e) => setProfileName(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 focus:border-amber-400 text-sm text-white focus:outline-none transition-colors"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-[#A8A199]">
                          Email Address (Locked)
                        </label>
                        <input
                          type="email"
                          disabled
                          value={user.email}
                          className="w-full px-4 py-2.5 rounded-xl bg-black/20 border border-white/5 text-sm text-white/50 cursor-not-allowed"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-[#A8A199]">
                          Phone Number
                        </label>
                        <input
                          type="tel"
                          value={profilePhone}
                          onChange={(e) => setProfilePhone(e.target.value)}
                          placeholder="+91 98765 43210"
                          className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 focus:border-amber-400 text-sm text-white focus:outline-none transition-colors"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={isUpdatingProfile}
                        className="px-6 py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-wider text-black bg-amber-400 hover:bg-amber-300 disabled:opacity-50 transition-colors"
                      >
                        {isUpdatingProfile ? 'Saving...' : 'Save Profile Changes'}
                      </button>
                    </form>
                  </div>

                  {/* Password Change Card */}
                  <div className="rounded-2xl p-6 bg-[#121217] border border-white/10 space-y-5">
                    <div>
                      <h3 className="font-serif text-xl font-bold text-white">
                        Password &amp; Security
                      </h3>
                      <p className="text-xs text-[#A8A199]">
                        Ensure your account is protected with a secure and unique password.
                      </p>
                    </div>

                    {passwordMsg && (
                      <div
                        className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                          passwordMsg.error
                            ? 'bg-rose-500/10 border border-rose-500/30 text-rose-400'
                            : 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                        }`}
                      >
                        {passwordMsg.error ? (
                          <AlertCircle className="w-4 h-4" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4" />
                        )}
                        <span>{passwordMsg.text}</span>
                      </div>
                    )}

                    <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-xl">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-[#A8A199]">
                          Current Password
                        </label>
                        <div className="relative">
                          <input
                            type={showPassword ? 'text' : 'password'}
                            required
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 focus:border-amber-400 text-sm text-white focus:outline-none transition-colors pr-10"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-[#A8A199]">
                          New Password (min 6 characters)
                        </label>
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          minLength={6}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 focus:border-amber-400 text-sm text-white focus:outline-none transition-colors"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-[#A8A199]">
                          Confirm New Password
                        </label>
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          minLength={6}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 focus:border-amber-400 text-sm text-white focus:outline-none transition-colors"
                        />
                      </div>

                      <button
                        type="submit"
                        className="px-6 py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-wider text-white bg-white/10 hover:bg-white/15 border border-white/10 transition-colors"
                      >
                        Update Password
                      </button>
                    </form>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountDashboard;
