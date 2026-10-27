import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package,
  Heart,
  MapPin,
  Settings,
  LogOut,
  Camera,
  CheckCircle2,
  Clock,
  Truck,
  Box,
  ChevronRight,
  ShieldCheck,
  Plus,
  Trash2,
  AlertCircle,
  Eye,
  EyeOff,
  Printer,
  X,
  ShoppingBag,
  ExternalLink
} from 'lucide-react';
import { useStore } from '../context';

/* =========================================================================
   DEFAULT SEED DATA & HELPERS
   ========================================================================= */

const FALLBACK_USER = {
  id: 'usr_84920',
  name: 'Om',
  email: 'omvin@example.com',
  phone: '+91 7894093586',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
  tier: 'Patron',
  memberSince: 'March 2026'
};

const DEFAULT_ORDERS = [
  {
    id: 'RJFC-20261025-9921',
    order_number: 'RJFC-20261025-9921',
    date: '25 Oct 2026',
    status: 'In Transit',
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
        size: 'Free Size'
      },
      {
        id: '6',
        name: 'Heritage Antique Kundan Choker & Earrings Set',
        image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=600&q=80',
        price: 7999,
        quantity: 1,
        color: 'Antique Gold Polish',
        size: 'One Size'
      }
    ]
  },
  {
    id: 'RJFC-20260918-6410',
    order_number: 'RJFC-20260918-6410',
    date: '18 Sep 2026',
    status: 'Delivered',
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
        color: 'Ivory Gold'
      }
    ]
  }
];

function formatIndianPrice(amount) {
  return '₹' + Number(amount || 0).toLocaleString('en-IN');
}

function formatDate(dateStr) {
  if (!dateStr) return 'Recent';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  } catch (_) {
    return dateStr;
  }
}

function readStoredOrders() {
  if (typeof window === 'undefined') return DEFAULT_ORDERS;
  try {
    const raw = localStorage.getItem('rj_orders');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((o, idx) => {
          const id = o.id || o.order_number || `RJFC-${idx + 1000}`;
          const items = Array.isArray(o.items)
            ? o.items.map((it, iIdx) => ({
                id: it.id || `item_${iIdx}`,
                name: it.name || it.title || 'Artisanal Ensemble',
                image: it.image || it.thumbnail || 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=600&q=80',
                price: Number(it.price) || 0,
                quantity: Number(it.quantity) || 1,
                size: it.selected_size || it.size || 'Free Size',
                color: it.color
              }))
            : [];
          return {
            id,
            order_number: o.order_number || id,
            date: o.date || (o.created_at ? formatDate(o.created_at) : 'Recent'),
            status: o.status || 'Confirmed',
            total: Number(o.total || o.total_amount || 0),
            items,
            carrier: o.carrier || 'BlueDart Luxury Express',
            trackingNumber: o.trackingNumber || o.tracking_number || `BD${id.replace(/\D/g, '') || '78940935'}IN`,
            deliveryEstimate: o.deliveryEstimate || 'Express Delivery within 2–4 Business Days',
            address: o.address || null
          };
        });
      }
    }
  } catch (_) {}
  return DEFAULT_ORDERS;
}

function getStatusBadge(status) {
  const s = String(status || '').toLowerCase();
  if (s.includes('deliver')) {
    return {
      label: 'Delivered',
      className: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/25'
    };
  }
  if (s.includes('transit') || s.includes('ship') || s.includes('delivery')) {
    return {
      label: 'In Transit',
      className: 'bg-sky-500/10 text-sky-700 dark:text-sky-400 border border-sky-500/25'
    };
  }
  if (s.includes('cancel')) {
    return {
      label: 'Cancelled',
      className: 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/25'
    };
  }
  return {
    label: 'Processing',
    className: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/25'
  };
}

/* =========================================================================
   MAIN COMPONENT: AccountDashboard (JSX)
   ========================================================================= */

export const AccountDashboard = ({
  initialUser,
  initialOrders,
  initialAddresses,
  initialTab = 'orders',
  onLogout,
  onExploreCatalog
}) => {
  // 1. Central Global Store integration with graceful fallback
  let store = null;
  try {
    store = useStore();
  } catch (_) {
    store = null;
  }

  // 2. Active Tab State ('orders' | 'wishlist' | 'addresses' | 'security')
  const [activeTab, setActiveTab] = useState(initialTab);

  // 3. User State synchronization
  const currentUser = useMemo(() => {
    if (store?.user) return store.user;
    if (initialUser) return initialUser;
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('rj_user') || localStorage.getItem('rjfc_user');
        if (stored) return JSON.parse(stored);
      } catch (_) {}
    }
    return FALLBACK_USER;
  }, [store?.user, initialUser]);

  // 4. Orders State
  const [orders, setOrders] = useState(() => {
    if (initialOrders && initialOrders.length > 0) return initialOrders;
    return readStoredOrders();
  });

  // Keep orders synced with localStorage changes
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const syncOrders = () => {
      setOrders(readStoredOrders());
    };
    window.addEventListener('storage', syncOrders);
    return () => window.removeEventListener('storage', syncOrders);
  }, []);

  // 5. Wishlist State (from Central Store)
  const wishlist = store?.wishlist || [];

  // 6. Addresses State (from Central Store)
  const addresses = store?.addresses || initialAddresses || [];
  const defaultAddress = useMemo(
    () => addresses.find((a) => a.isDefault) || addresses[0] || null,
    [addresses]
  );

  // 7. Profile Form State
  const [profileName, setProfileName] = useState(currentUser.name || 'Om');
  const [profilePhone, setProfilePhone] = useState(currentUser.phone || '+91 7894093586');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // 8. Password Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // 9. Add Address Form State
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [newAddr, setNewAddr] = useState({
    fullName: '',
    phone: '',
    houseFlat: '',
    street: '',
    city: '',
    state: '',
    pinCode: '',
    addressType: 'HOME',
    isDefault: false
  });

  // 10. Selected Order for Invoice / Details Modal
  const [selectedOrderForInvoice, setSelectedOrderForInvoice] = useState(null);

  // Handlers
  const handleProfileSubmit = (e) => {
    e.preventDefault();
    setIsUpdatingProfile(true);
    setTimeout(() => {
      if (store?.updateProfile) {
        store.updateProfile({ name: profileName, phone: profilePhone });
      }
      if (typeof window !== 'undefined') {
        try {
          const updated = { ...currentUser, name: profileName, phone: profilePhone };
          localStorage.setItem('rj_user', JSON.stringify(updated));
          localStorage.setItem('rjfc_user', JSON.stringify(updated));
        } catch (_) {}
      }
      if (store?.showToast) {
        store.showToast('Profile information updated successfully! ✨', 'success');
      }
      setIsUpdatingProfile(false);
    }, 400);
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      if (store?.showToast) {
        store.showToast('New password must be at least 6 characters.', 'error');
      }
      return;
    }
    if (newPassword !== confirmPassword) {
      if (store?.showToast) {
        store.showToast('Passwords do not match. Please verify.', 'error');
      }
      return;
    }

    setIsUpdatingPassword(true);
    setTimeout(() => {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setIsUpdatingPassword(false);
      if (store?.showToast) {
        store.showToast('Security credentials updated successfully! 🔒', 'success');
      }
    }, 450);
  };

  const handleSaveAddress = (e) => {
    e.preventDefault();
    if (store?.addAddress) {
      store.addAddress({
        fullName: newAddr.fullName,
        phone: newAddr.phone,
        houseFlat: newAddr.houseFlat,
        street: newAddr.street,
        city: newAddr.city,
        state: newAddr.state,
        pinCode: newAddr.pinCode,
        addressType: newAddr.addressType,
        isDefault: newAddr.isDefault
      });
    }

    setNewAddr({
      fullName: '',
      phone: '',
      houseFlat: '',
      street: '',
      city: '',
      state: '',
      pinCode: '',
      addressType: 'HOME',
      isDefault: false
    });
    setShowAddressForm(false);
  };

  const handleDeleteAddress = (id) => {
    if (store?.deleteAddress) {
      store.deleteAddress(id);
    }
  };

  const handleMoveToBag = (product) => {
    if (store?.addToCart) {
      store.addToCart(product);
    }
    if (store?.removeFromWishlist) {
      store.removeFromWishlist(product.id);
    }
    if (store?.showToast) {
      store.showToast(`Moved "${product.name}" to shopping bag! 👑`, 'success');
    }
  };

  const handleRemoveFromWishlist = (productId) => {
    if (store?.removeFromWishlist) {
      store.removeFromWishlist(productId);
    }
  };

  const handleReorder = (order) => {
    if (order.items && order.items.length > 0 && store?.addToCart) {
      order.items.forEach((item) => {
        store.addToCart({
          id: item.id,
          name: item.name,
          price: item.price,
          image: item.image,
          rating: 4.9
        }, item.size || 'Free Size', item.quantity || 1);
      });
      if (store?.showToast) {
        store.showToast(`Items from Order #${order.id} added to bag!`, 'success');
      }
    }
  };

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
      return;
    }
    if (store?.logout) {
      store.logout();
    }
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('rj_user');
        localStorage.removeItem('rjfc_user');
      } catch (_) {}
      window.location.href = '/';
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#FDFBF7] dark:bg-[#0A0A0C] text-[#111111] dark:text-[#F5EFEB] font-sans py-8 px-4 sm:px-6 lg:px-12 transition-colors duration-300">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* =========================================================================
            1. REFINED LUXURY PROFILE BANNER HEADER
            ========================================================================= */}
        <section
          aria-label="Customer Profile Header"
          className="rounded-2xl border border-neutral-200 dark:border-white/10 bg-[#FDFBF7] dark:bg-[#141418] p-6 sm:p-8 shadow-sm transition-all relative overflow-hidden"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            {/* Left: Avatar & Patron Details */}
            <div className="flex items-center gap-4 sm:gap-6">
              {/* Refined Avatar Circle with Initials or Photo */}
              <div className="relative group shrink-0">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden border-2 border-[#C5A880] shadow-sm bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
                  {currentUser.avatarUrl ? (
                    <img
                      src={currentUser.avatarUrl}
                      alt={currentUser.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <span className="font-serif text-xl sm:text-2xl font-bold text-[#111111] dark:text-white">
                      {(currentUser.name || 'O').charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div
                  className="absolute bottom-0 right-0 p-1.5 rounded-full bg-[#111111] dark:bg-white text-white dark:text-[#111111] shadow-md border border-white/20"
                  title="Verified Account"
                >
                  <ShieldCheck className="w-3 h-3 text-[#C5A880]" />
                </div>
              </div>

              {/* Patron Credentials */}
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h1 className="font-serif text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-white tracking-tight">
                    {currentUser.name || 'Om'}
                  </h1>
                  {/* Verified Patron Badge */}
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium text-[#0F382A] dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 shadow-sm">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Verified Patron</span>
                  </span>
                </div>

                <div className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 flex flex-wrap items-center gap-x-2.5 gap-y-1">
                  <span>{currentUser.email || 'omvin@example.com'}</span>
                  <span className="text-neutral-300 dark:text-neutral-700">•</span>
                  <span>{currentUser.phone || '+91 7894093586'}</span>
                </div>
              </div>
            </div>

            {/* Right: Discrete Sign Out CTA */}
            <div className="shrink-0 self-start md:self-center">
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold tracking-wider uppercase border border-neutral-300 dark:border-white/15 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-white/5 hover:border-neutral-400 transition-all active:scale-95 shadow-sm"
              >
                <LogOut className="w-3.5 h-3.5 text-rose-500" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </section>

        {/* =========================================================================
            2. STREAMLINED 3-CARD SUMMARY GRID
            ========================================================================= */}
        <section aria-label="Account Summary Overview" className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {/* Card 1: Total Orders */}
          <button
            type="button"
            onClick={() => setActiveTab('orders')}
            className={`p-5 sm:p-6 rounded-xl border bg-white dark:bg-[#141418] shadow-sm text-left group transition-all duration-300 ${
              activeTab === 'orders'
                ? 'border-[#C5A880] ring-1 ring-[#C5A880]/30 shadow-md'
                : 'border-[#E5E0D8] dark:border-white/10 hover:border-[#C5A880] hover:shadow-md'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                Total Orders
              </span>
              <div className="w-9 h-9 rounded-full bg-[#C5A880]/15 flex items-center justify-center text-[#C5A880] group-hover:scale-110 transition-transform">
                <Package className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-serif font-bold text-neutral-900 dark:text-white">
              {orders.length}
            </div>
            <div className="text-xs text-[#C5A880] font-medium mt-2 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
              <span>View order history</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </button>

          {/* Card 2: Saved in Wishlist */}
          <button
            type="button"
            onClick={() => setActiveTab('wishlist')}
            className={`p-5 sm:p-6 rounded-xl border bg-white dark:bg-[#141418] shadow-sm text-left group transition-all duration-300 ${
              activeTab === 'wishlist'
                ? 'border-[#C5A880] ring-1 ring-[#C5A880]/30 shadow-md'
                : 'border-[#E5E0D8] dark:border-white/10 hover:border-[#C5A880] hover:shadow-md'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                Saved in Wishlist
              </span>
              <div className="w-9 h-9 rounded-full bg-rose-500/15 flex items-center justify-center text-rose-500 group-hover:scale-110 transition-transform">
                <Heart className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-serif font-bold text-neutral-900 dark:text-white">
              {wishlist.length}
            </div>
            <div className="text-xs text-[#C5A880] font-medium mt-2 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
              <span>View saved looks</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </button>

          {/* Card 3: Default Address */}
          <button
            type="button"
            onClick={() => setActiveTab('addresses')}
            className={`p-5 sm:p-6 rounded-xl border bg-white dark:bg-[#141418] shadow-sm text-left group transition-all duration-300 ${
              activeTab === 'addresses'
                ? 'border-[#C5A880] ring-1 ring-[#C5A880]/30 shadow-md'
                : 'border-[#E5E0D8] dark:border-white/10 hover:border-[#C5A880] hover:shadow-md'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                Default Address
              </span>
              <div className="w-9 h-9 rounded-full bg-emerald-500/15 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
                <MapPin className="w-4 h-4" />
              </div>
            </div>
            <div className="text-base sm:text-lg font-serif font-bold text-neutral-900 dark:text-white truncate">
              {defaultAddress
                ? `${defaultAddress.city} • ${defaultAddress.pinCode}`
                : 'No default address'}
            </div>
            <div className="text-xs text-[#C5A880] font-medium mt-2 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
              <span>Manage addresses</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </button>
        </section>

        {/* =========================================================================
            3. LUXURY LAYOUT & 4-TAB NAVIGATION WORKSPACE
            ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* NAVIGATION SIDEBAR / TABS */}
          <div className="lg:col-span-3 w-full">
            {/* Desktop Navigation Column (>= 1024px) */}
            <nav
              aria-label="Dashboard Tabs"
              className="hidden lg:flex flex-col gap-1.5 p-2 rounded-2xl bg-white dark:bg-[#121217] border border-neutral-200 dark:border-white/10 shadow-sm"
            >
              <button
                type="button"
                onClick={() => setActiveTab('orders')}
                className={`flex items-center justify-between w-full px-4 py-3.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  activeTab === 'orders'
                    ? 'bg-[#111111] text-white dark:bg-white dark:text-[#111111] shadow-sm'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Package className="w-4 h-4 text-[#C5A880]" />
                  <span>My Orders</span>
                </div>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-mono ${
                    activeTab === 'orders'
                      ? 'bg-white/20 dark:bg-black/20 text-inherit'
                      : 'bg-neutral-100 dark:bg-white/10 text-neutral-600 dark:text-neutral-300'
                  }`}
                >
                  {orders.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('wishlist')}
                className={`flex items-center justify-between w-full px-4 py-3.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  activeTab === 'wishlist'
                    ? 'bg-[#111111] text-white dark:bg-white dark:text-[#111111] shadow-sm'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Heart className="w-4 h-4 text-[#C5A880]" />
                  <span>Saved Looks &amp; Wishlist</span>
                </div>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-mono ${
                    activeTab === 'wishlist'
                      ? 'bg-white/20 dark:bg-black/20 text-inherit'
                      : 'bg-neutral-100 dark:bg-white/10 text-neutral-600 dark:text-neutral-300'
                  }`}
                >
                  {wishlist.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('addresses')}
                className={`flex items-center justify-between w-full px-4 py-3.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  activeTab === 'addresses'
                    ? 'bg-[#111111] text-white dark:bg-white dark:text-[#111111] shadow-sm'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-3">
                  <MapPin className="w-4 h-4 text-[#C5A880]" />
                  <span>Saved Addresses</span>
                </div>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-mono ${
                    activeTab === 'addresses'
                      ? 'bg-white/20 dark:bg-black/20 text-inherit'
                      : 'bg-neutral-100 dark:bg-white/10 text-neutral-600 dark:text-neutral-300'
                  }`}
                >
                  {addresses.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('security')}
                className={`flex items-center justify-between w-full px-4 py-3.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  activeTab === 'security'
                    ? 'bg-[#111111] text-white dark:bg-white dark:text-[#111111] shadow-sm'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Settings className="w-4 h-4 text-[#C5A880]" />
                  <span>Profile &amp; Security</span>
                </div>
              </button>
            </nav>

            {/* Mobile Horizontal Scrolling Tab Pill Row (< 1024px) */}
            <div className="flex lg:hidden overflow-x-auto no-scrollbar gap-2 pb-2">
              <button
                type="button"
                onClick={() => setActiveTab('orders')}
                className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all shadow-sm ${
                  activeTab === 'orders'
                    ? 'bg-[#111111] text-white dark:bg-white dark:text-[#111111]'
                    : 'bg-white dark:bg-[#141418] text-neutral-600 dark:text-neutral-300 border border-neutral-200 dark:border-white/10'
                }`}
              >
                <Package className="w-3.5 h-3.5 text-[#C5A880]" />
                <span>Orders ({orders.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('wishlist')}
                className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all shadow-sm ${
                  activeTab === 'wishlist'
                    ? 'bg-[#111111] text-white dark:bg-white dark:text-[#111111]'
                    : 'bg-white dark:bg-[#141418] text-neutral-600 dark:text-neutral-300 border border-neutral-200 dark:border-white/10'
                }`}
              >
                <Heart className="w-3.5 h-3.5 text-[#C5A880]" />
                <span>Saved Looks ({wishlist.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('addresses')}
                className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all shadow-sm ${
                  activeTab === 'addresses'
                    ? 'bg-[#111111] text-white dark:bg-white dark:text-[#111111]'
                    : 'bg-white dark:bg-[#141418] text-neutral-600 dark:text-neutral-300 border border-neutral-200 dark:border-white/10'
                }`}
              >
                <MapPin className="w-3.5 h-3.5 text-[#C5A880]" />
                <span>Addresses ({addresses.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('security')}
                className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all shadow-sm ${
                  activeTab === 'security'
                    ? 'bg-[#111111] text-white dark:bg-white dark:text-[#111111]'
                    : 'bg-white dark:bg-[#141418] text-neutral-600 dark:text-neutral-300 border border-neutral-200 dark:border-white/10'
                }`}
              >
                <Settings className="w-3.5 h-3.5 text-[#C5A880]" />
                <span>Security</span>
              </button>
            </div>
          </div>

          {/* MAIN CONTENT WORKSPACE */}
          <div className="lg:col-span-9 w-full min-h-[500px]">
            <AnimatePresence mode="wait">
              {/* ===============================================================
                  TAB 1: MY ORDERS
                  =============================================================== */}
              {activeTab === 'orders' && (
                <motion.div
                  key="orders-tab"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-6"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-neutral-200 dark:border-white/10">
                    <div>
                      <h2 className="font-serif text-2xl font-bold text-neutral-900 dark:text-white tracking-tight">
                        Order History
                      </h2>
                      <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400">
                        Track live shipments, download official invoices, and manage past purchases.
                      </p>
                    </div>
                    <span className="text-xs font-semibold text-[#0F382A] dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 px-3 py-1 rounded-full self-start sm:self-auto">
                      {orders.length} {orders.length === 1 ? 'Order' : 'Orders'} Placed
                    </span>
                  </div>

                  {orders.length === 0 ? (
                    /* Elegant Empty State */
                    <div className="text-center py-16 px-4 rounded-2xl bg-white dark:bg-[#141418] border border-neutral-200 dark:border-white/10 space-y-4 shadow-sm">
                      <div className="w-16 h-16 rounded-full bg-neutral-100 dark:bg-white/5 flex items-center justify-center mx-auto text-neutral-400">
                        <Package className="w-8 h-8" />
                      </div>
                      <h3 className="font-serif text-xl font-bold text-neutral-900 dark:text-white">
                        You have no active orders yet
                      </h3>
                      <p className="text-sm text-neutral-500 dark:text-neutral-400 max-w-md mx-auto">
                        Your bespoke wardrobe awaits. Explore our handcrafted royal bridal and celebratory edits.
                      </p>
                      <a
                        href="/"
                        onClick={(e) => {
                          if (onExploreCatalog) {
                            e.preventDefault();
                            onExploreCatalog();
                          }
                        }}
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#111111] hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-[#111111] font-semibold text-xs tracking-wider uppercase shadow-md transition-all active:scale-95"
                      >
                        <span>START SHOPPING →</span>
                      </a>
                    </div>
                  ) : (
                    /* Orders Card Stack */
                    <div className="space-y-5">
                      {orders.map((order) => {
                        const badge = getStatusBadge(order.status);
                        return (
                          <div
                            key={order.id}
                            className="rounded-2xl bg-white dark:bg-[#141418] border border-neutral-200 dark:border-white/10 hover:border-[#C5A880]/60 shadow-sm transition-all duration-300 overflow-hidden"
                          >
                            {/* Card Header */}
                            <div className="p-4 sm:p-6 bg-neutral-50/70 dark:bg-white/[0.02] border-b border-neutral-200 dark:border-white/10 flex flex-wrap items-center justify-between gap-4">
                              <div className="space-y-0.5">
                                <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                                  Order ID
                                </span>
                                <h4 className="font-mono text-sm sm:text-base font-bold text-neutral-900 dark:text-white">
                                  {order.id}
                                </h4>
                              </div>

                              <div className="space-y-0.5 text-left sm:text-right">
                                <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                                  Placed On
                                </span>
                                <p className="text-xs sm:text-sm font-medium text-neutral-800 dark:text-neutral-200">
                                  {order.date}
                                </p>
                              </div>

                              <div className="space-y-0.5 text-left sm:text-right">
                                <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                                  Total Paid
                                </span>
                                <p className="text-sm sm:text-base font-serif font-bold text-[#111111] dark:text-[#C5A880]">
                                  {formatIndianPrice(order.total)}
                                </p>
                              </div>

                              <div>
                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${badge.className}`}>
                                  {badge.label}
                                </span>
                              </div>
                            </div>

                            {/* Logistics Shipped Bar */}
                            <div className="px-4 py-3 sm:px-6 bg-neutral-100/50 dark:bg-white/[0.01] border-b border-neutral-200/80 dark:border-white/5 flex flex-wrap items-center justify-between text-xs text-neutral-600 dark:text-neutral-400 gap-2">
                              <div className="flex items-center gap-2">
                                <Truck className="w-4 h-4 text-[#C5A880]" />
                                <span className="font-medium text-neutral-900 dark:text-neutral-200">
                                  {order.carrier || 'BlueDart Luxury Express'}
                                </span>
                                {order.trackingNumber && (
                                  <span className="font-mono text-neutral-500">({order.trackingNumber})</span>
                                )}
                              </div>
                              <div className="text-[11px]">
                                {order.deliveryEstimate || 'Express Transit'}
                              </div>
                            </div>

                            {/* Order Item Thumbnails (3:4 aspect ratio) */}
                            <div className="p-4 sm:p-6 divide-y divide-neutral-100 dark:divide-white/5 space-y-3">
                              {order.items.map((item) => (
                                <div key={item.id} className="pt-3 first:pt-0 flex items-center gap-4">
                                  <div className="w-16 h-20 sm:w-20 sm:h-24 rounded-xl overflow-hidden bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-white/10 shrink-0">
                                    <img
                                      src={item.image}
                                      alt={item.name}
                                      className="w-full h-full object-cover"
                                      loading="lazy"
                                    />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <h5 className="font-serif text-sm sm:text-base font-semibold text-neutral-900 dark:text-white truncate">
                                      {item.name}
                                    </h5>
                                    <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 flex flex-wrap items-center gap-2">
                                      <span>Qty: {item.quantity}</span>
                                      {item.size && <span>• Size: {item.size}</span>}
                                      {item.color && <span>• Color: {item.color}</span>}
                                    </div>
                                    <div className="text-sm font-semibold text-neutral-900 dark:text-white mt-1">
                                      {formatIndianPrice(item.price)}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>

                            {/* Card Actions */}
                            <div className="p-4 sm:p-6 bg-neutral-50/50 dark:bg-white/[0.01] border-t border-neutral-200 dark:border-white/10 flex flex-wrap items-center justify-end gap-3">
                              <button
                                type="button"
                                onClick={() => setSelectedOrderForInvoice(order)}
                                className="px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider text-neutral-800 dark:text-neutral-200 bg-white dark:bg-white/5 hover:bg-neutral-100 dark:hover:bg-white/10 border border-neutral-300 dark:border-white/15 transition-colors shadow-sm"
                              >
                                Invoice / Details
                              </button>
                              <button
                                type="button"
                                onClick={() => handleReorder(order)}
                                className="px-5 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider text-white bg-[#111111] hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 dark:text-[#111111] transition-all shadow-sm active:scale-95"
                              >
                                Buy Again
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </motion.div>
              )}

              {/* ===============================================================
                  TAB 2: SAVED LOOKS & WISHLIST
                  =============================================================== */}
              {activeTab === 'wishlist' && (
                <motion.div
                  key="wishlist-tab"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-6"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-neutral-200 dark:border-white/10">
                    <div>
                      <h2 className="font-serif text-2xl font-bold text-neutral-900 dark:text-white tracking-tight">
                        Saved Looks &amp; Curated Wishlist
                      </h2>
                      <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400">
                        Pieces you have favorited for upcoming celebrations and seasonal edits.
                      </p>
                    </div>
                    <span className="text-xs font-semibold text-[#0F382A] dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 px-3 py-1 rounded-full self-start sm:self-auto">
                      {wishlist.length} {wishlist.length === 1 ? 'Piece' : 'Pieces'} Saved
                    </span>
                  </div>

                  {wishlist.length === 0 ? (
                    /* Elegant Empty State */
                    <div className="text-center py-16 px-4 rounded-2xl bg-white dark:bg-[#141418] border border-neutral-200 dark:border-white/10 space-y-4 shadow-sm">
                      <div className="w-16 h-16 rounded-full bg-rose-50 dark:bg-rose-950/20 flex items-center justify-center mx-auto text-rose-500">
                        <Heart className="w-8 h-8" />
                      </div>
                      <h3 className="font-serif text-xl font-bold text-neutral-900 dark:text-white">
                        Your Wishlist is Empty
                      </h3>
                      <p className="text-sm text-neutral-500 dark:text-neutral-400 max-w-md mx-auto">
                        Save pieces you adore to review and purchase later.
                      </p>
                      <a
                        href="/"
                        onClick={(e) => {
                          if (onExploreCatalog) {
                            e.preventDefault();
                            onExploreCatalog();
                          }
                        }}
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#111111] hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-[#111111] font-semibold text-xs tracking-wider uppercase shadow-md transition-all active:scale-95"
                      >
                        <span>EXPLORE CURATIONS →</span>
                      </a>
                    </div>
                  ) : (
                    /* Compact Wishlist Grid */
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {wishlist.map((item) => (
                        <div
                          key={item.id}
                          className="rounded-2xl overflow-hidden bg-white dark:bg-[#141418] border border-neutral-200 dark:border-white/10 hover:border-[#C5A880]/60 shadow-sm transition-all duration-300 flex flex-col group"
                        >
                          {/* 3:4 Aspect Ratio Portrait Thumbnail */}
                          <div className="relative aspect-[3/4] overflow-hidden bg-neutral-100 dark:bg-neutral-800">
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              loading="lazy"
                            />
                            {item.badge && (
                              <span className="absolute top-3 left-3 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider text-neutral-900 bg-white/90 backdrop-blur-md shadow-sm">
                                {item.badge}
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={() => handleRemoveFromWishlist(item.id)}
                              aria-label="Remove item from wishlist"
                              className="absolute top-3 right-3 p-2 rounded-full bg-white/90 dark:bg-black/80 text-rose-500 hover:scale-110 shadow-sm transition-transform"
                            >
                              <Heart className="w-4 h-4 fill-current" />
                            </button>
                          </div>

                          {/* Card Content */}
                          <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-4">
                            <div className="space-y-1">
                              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#C5A880]">
                                {item.category || 'Luxury Ensemble'}
                              </span>
                              <h4 className="font-serif text-sm sm:text-base font-bold text-neutral-900 dark:text-white line-clamp-2">
                                {item.name}
                              </h4>
                              <div className="flex items-baseline gap-2 pt-1">
                                <span className="font-serif text-base font-bold text-neutral-900 dark:text-white">
                                  {formatIndianPrice(item.price)}
                                </span>
                                {item.original_price && item.original_price > item.price && (
                                  <span className="text-xs text-neutral-400 line-through">
                                    {formatIndianPrice(item.original_price)}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Actions: Move to Bag & Remove */}
                            <div className="space-y-2 pt-2 border-t border-neutral-100 dark:border-white/5">
                              <button
                                type="button"
                                onClick={() => handleMoveToBag(item)}
                                className="w-full py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider text-white bg-[#111111] hover:bg-[#C5A880] transition-colors shadow-sm flex items-center justify-center gap-2 active:scale-95"
                              >
                                <ShoppingBag className="w-3.5 h-3.5" />
                                <span>Move to Bag</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemoveFromWishlist(item.id)}
                                className="w-full py-1 text-xs text-neutral-500 hover:text-rose-500 flex items-center justify-center gap-1 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Remove</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {/* ===============================================================
                  TAB 3: SAVED ADDRESSES
                  =============================================================== */}
              {activeTab === 'addresses' && (
                <motion.div
                  key="addresses-tab"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-6"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-neutral-200 dark:border-white/10">
                    <div>
                      <h2 className="font-serif text-2xl font-bold text-neutral-900 dark:text-white tracking-tight">
                        Saved Delivery Addresses
                      </h2>
                      <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400">
                        Manage your residential and celebration shipping destinations.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowAddressForm(!showAddressForm)}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider text-white bg-[#111111] hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 dark:text-[#111111] transition-all shadow-sm self-start sm:self-auto active:scale-95"
                    >
                      <Plus className="w-4 h-4" />
                      <span>{showAddressForm ? 'Close Form' : '+ Add New Address'}</span>
                    </button>
                  </div>

                  {/* Add New Address Form Modal/Drawer */}
                  <AnimatePresence>
                    {showAddressForm && (
                      <motion.form
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        onSubmit={handleSaveAddress}
                        className="rounded-2xl p-6 bg-white dark:bg-[#141418] border border-[#C5A880]/50 space-y-4 overflow-hidden shadow-md"
                      >
                        <h4 className="font-serif text-base font-bold text-neutral-900 dark:text-white">
                          New Delivery Address Details
                        </h4>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                              Full Name / Recipient *
                            </label>
                            <input
                              type="text"
                              required
                              value={newAddr.fullName}
                              onChange={(e) => setNewAddr({ ...newAddr, fullName: e.target.value })}
                              placeholder="e.g. Radhika Sharma"
                              className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-50 dark:bg-black/50 border border-neutral-300 dark:border-white/15 focus:border-[#C5A880] text-sm text-neutral-900 dark:text-white focus:outline-none transition-colors"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                              10-Digit Phone Number *
                            </label>
                            <input
                              type="tel"
                              required
                              pattern="[0-9]{10}"
                              value={newAddr.phone}
                              onChange={(e) => setNewAddr({ ...newAddr, phone: e.target.value })}
                              placeholder="e.g. 9876543210"
                              className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-50 dark:bg-black/50 border border-neutral-300 dark:border-white/15 focus:border-[#C5A880] text-sm text-neutral-900 dark:text-white focus:outline-none transition-colors"
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                            Flat / House / Building *
                          </label>
                          <input
                            type="text"
                            required
                            value={newAddr.houseFlat}
                            onChange={(e) => setNewAddr({ ...newAddr, houseFlat: e.target.value })}
                            placeholder="e.g. Penthouse 402, Royale Crest"
                            className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-50 dark:bg-black/50 border border-neutral-300 dark:border-white/15 focus:border-[#C5A880] text-sm text-neutral-900 dark:text-white focus:outline-none transition-colors"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                            Street / Locality / Landmark *
                          </label>
                          <input
                            type="text"
                            required
                            value={newAddr.street}
                            onChange={(e) => setNewAddr({ ...newAddr, street: e.target.value })}
                            placeholder="e.g. Road No. 36, Jubilee Hills"
                            className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-50 dark:bg-black/50 border border-neutral-300 dark:border-white/15 focus:border-[#C5A880] text-sm text-neutral-900 dark:text-white focus:outline-none transition-colors"
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div className="space-y-1">
                            <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">City *</label>
                            <input
                              type="text"
                              required
                              value={newAddr.city}
                              onChange={(e) => setNewAddr({ ...newAddr, city: e.target.value })}
                              placeholder="e.g. Hyderabad"
                              className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-50 dark:bg-black/50 border border-neutral-300 dark:border-white/15 focus:border-[#C5A880] text-sm text-neutral-900 dark:text-white focus:outline-none transition-colors"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">State *</label>
                            <input
                              type="text"
                              required
                              value={newAddr.state}
                              onChange={(e) => setNewAddr({ ...newAddr, state: e.target.value })}
                              placeholder="e.g. Telangana"
                              className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-50 dark:bg-black/50 border border-neutral-300 dark:border-white/15 focus:border-[#C5A880] text-sm text-neutral-900 dark:text-white focus:outline-none transition-colors"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">PIN Code *</label>
                            <input
                              type="text"
                              required
                              pattern="[0-9]{6}"
                              value={newAddr.pinCode}
                              onChange={(e) => setNewAddr({ ...newAddr, pinCode: e.target.value })}
                              placeholder="e.g. 500033"
                              className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-50 dark:bg-black/50 border border-neutral-300 dark:border-white/15 focus:border-[#C5A880] text-sm text-neutral-900 dark:text-white focus:outline-none transition-colors"
                            />
                          </div>
                        </div>

                        <div className="flex items-center gap-2 pt-2">
                          <input
                            type="checkbox"
                            id="default-check-react-jsx"
                            checked={newAddr.isDefault}
                            onChange={(e) => setNewAddr({ ...newAddr, isDefault: e.target.checked })}
                            className="rounded accent-[#111111]"
                          />
                          <label htmlFor="default-check-react-jsx" className="text-xs text-neutral-600 dark:text-neutral-400 cursor-pointer">
                            Set as primary default delivery destination
                          </label>
                        </div>

                        <div className="flex items-center gap-3 pt-2">
                          <button
                            type="submit"
                            className="px-6 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider bg-[#111111] hover:bg-neutral-800 text-white dark:bg-white dark:hover:bg-neutral-200 dark:text-[#111111] transition-all shadow-sm"
                          >
                            Save Address
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowAddressForm(false)}
                            className="px-4 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-white/5 transition-all"
                          >
                            Cancel
                          </button>
                        </div>
                      </motion.form>
                    )}
                  </AnimatePresence>

                  {/* Active Address Cards Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {addresses.map((addr) => (
                      <div
                        key={addr.id}
                        className={`rounded-2xl p-5 sm:p-6 border transition-all duration-300 flex flex-col justify-between ${
                          addr.isDefault
                            ? 'bg-white dark:bg-[#141418] border-[#C5A880] shadow-sm'
                            : 'bg-white dark:bg-[#121217] border-neutral-200 dark:border-white/10 hover:border-neutral-300 dark:hover:border-white/20'
                        }`}
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <h4 className="font-serif text-base font-bold text-neutral-900 dark:text-white">
                              {addr.fullName}
                            </h4>
                            {addr.isDefault && (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#0F382A] text-emerald-100 border border-emerald-700/50">
                                Default
                              </span>
                            )}
                          </div>

                          <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                            {addr.houseFlat}, {addr.street}
                            <br />
                            {addr.city}, {addr.state} — {addr.pinCode}
                          </p>

                          <p className="text-xs font-mono text-neutral-700 dark:text-neutral-300">
                            Phone: {addr.phone}
                          </p>
                        </div>

                        <div className="pt-4 mt-4 border-t border-neutral-100 dark:border-white/5 flex items-center justify-between">
                          <span className="text-[11px] text-neutral-500 dark:text-neutral-400 flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-[#C5A880]" />
                            <span>{addr.addressType || 'HOME'}</span>
                          </span>

                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => handleDeleteAddress(addr.id)}
                              className="text-xs text-rose-500 hover:text-rose-600 dark:hover:text-rose-400 flex items-center gap-1 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Delete</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* ===============================================================
                  TAB 4: PROFILE & SECURITY
                  =============================================================== */}
              {activeTab === 'security' && (
                <motion.div
                  key="security-tab"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-8"
                >
                  {/* Personal Information Form Card */}
                  <div className="rounded-2xl p-6 sm:p-8 bg-white dark:bg-[#141418] border border-neutral-200 dark:border-white/10 space-y-6 shadow-sm">
                    <div>
                      <h3 className="font-serif text-xl font-bold text-neutral-900 dark:text-white">
                        Personal Information
                      </h3>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">
                        Update your contact information for order confirmations and dispatch alerts.
                      </p>
                    </div>

                    <form onSubmit={handleProfileSubmit} className="space-y-4 max-w-xl">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                          Full Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={profileName}
                          onChange={(e) => setProfileName(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-xl bg-neutral-50 dark:bg-black/40 border border-neutral-300 dark:border-white/15 focus:border-[#C5A880] text-sm text-neutral-900 dark:text-white focus:outline-none transition-colors"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                          Email Address (Locked)
                        </label>
                        <input
                          type="email"
                          disabled
                          value={currentUser.email || 'omvin@example.com'}
                          className="w-full px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-sm text-neutral-400 dark:text-neutral-500 cursor-not-allowed"
                        />
                        <span className="text-[11px] text-neutral-400">
                          Email is tied to your primary authentication identity.
                        </span>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                          Contact Number *
                        </label>
                        <input
                          type="tel"
                          value={profilePhone}
                          onChange={(e) => setProfilePhone(e.target.value)}
                          placeholder="+91 7894093586"
                          className="w-full px-4 py-2.5 rounded-xl bg-neutral-50 dark:bg-black/40 border border-neutral-300 dark:border-white/15 focus:border-[#C5A880] text-sm text-neutral-900 dark:text-white focus:outline-none transition-colors"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={isUpdatingProfile}
                        className="px-6 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider text-white bg-[#111111] hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 dark:text-[#111111] disabled:opacity-50 transition-all shadow-sm active:scale-95"
                      >
                        {isUpdatingProfile ? 'Saving...' : 'Save Profile Changes'}
                      </button>
                    </form>
                  </div>

                  {/* Password & Security Card */}
                  <div className="rounded-2xl p-6 sm:p-8 bg-white dark:bg-[#141418] border border-neutral-200 dark:border-white/10 space-y-6 shadow-sm">
                    <div>
                      <h3 className="font-serif text-xl font-bold text-neutral-900 dark:text-white">
                        Password &amp; Security
                      </h3>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">
                        Reinforce your account authentication with a strong, encrypted password.
                      </p>
                    </div>

                    <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-xl">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                          Current Password *
                        </label>
                        <div className="relative">
                          <input
                            type={showPassword ? 'text' : 'password'}
                            required
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            placeholder="Enter current password"
                            className="w-full px-4 py-2.5 rounded-xl bg-neutral-50 dark:bg-black/40 border border-neutral-300 dark:border-white/15 focus:border-[#C5A880] text-sm text-neutral-900 dark:text-white focus:outline-none transition-colors pr-10"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            aria-label="Toggle password visibility"
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                          New Password (min 6 characters) *
                        </label>
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          minLength={6}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Enter new secure password"
                          className="w-full px-4 py-2.5 rounded-xl bg-neutral-50 dark:bg-black/40 border border-neutral-300 dark:border-white/15 focus:border-[#C5A880] text-sm text-neutral-900 dark:text-white focus:outline-none transition-colors"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                          Confirm New Password *
                        </label>
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          minLength={6}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Re-enter new secure password"
                          className="w-full px-4 py-2.5 rounded-xl bg-neutral-50 dark:bg-black/40 border border-neutral-300 dark:border-white/15 focus:border-[#C5A880] text-sm text-neutral-900 dark:text-white focus:outline-none transition-colors"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={isUpdatingPassword}
                        className="px-6 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider text-white bg-[#111111] hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 dark:text-[#111111] disabled:opacity-50 transition-all shadow-sm active:scale-95"
                      >
                        {isUpdatingPassword ? 'Updating...' : 'Update Password'}
                      </button>
                    </form>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* =========================================================================
            4. INVOICE / ORDER DETAILS MODAL
            ========================================================================= */}
        <AnimatePresence>
          {selectedOrderForInvoice && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-2xl bg-white dark:bg-[#141418] rounded-2xl border border-neutral-200 dark:border-white/15 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
              >
                {/* Modal Header */}
                <div className="p-6 border-b border-neutral-200 dark:border-white/10 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#C5A880]">
                      OFFICIAL ATELIER INVOICE
                    </span>
                    <h3 className="font-serif text-xl font-bold text-neutral-900 dark:text-white">
                      Order #{selectedOrderForInvoice.id}
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedOrderForInvoice(null)}
                    className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-white/10 text-neutral-500 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Modal Body */}
                <div className="p-6 overflow-y-auto space-y-6">
                  {/* Order Overview Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-neutral-50 dark:bg-white/[0.02] border border-neutral-200 dark:border-white/5 text-xs">
                    <div>
                      <span className="text-neutral-500 block">Date</span>
                      <strong className="text-neutral-900 dark:text-white">{selectedOrderForInvoice.date}</strong>
                    </div>
                    <div>
                      <span className="text-neutral-500 block">Status</span>
                      <strong className="text-neutral-900 dark:text-white capitalize">{selectedOrderForInvoice.status}</strong>
                    </div>
                    <div>
                      <span className="text-neutral-500 block">Carrier</span>
                      <strong className="text-neutral-900 dark:text-white">{selectedOrderForInvoice.carrier || 'Express'}</strong>
                    </div>
                    <div>
                      <span className="text-neutral-500 block">Payment</span>
                      <strong className="text-neutral-900 dark:text-white">Prepaid / Verified</strong>
                    </div>
                  </div>

                  {/* Itemized Table */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                      Purchased Items
                    </h4>
                    <div className="divide-y divide-neutral-200 dark:divide-white/10">
                      {selectedOrderForInvoice.items.map((it) => (
                        <div key={it.id} className="py-3 flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={it.image}
                              alt={it.name}
                              className="w-12 h-14 rounded-lg object-cover border border-neutral-200 dark:border-white/10"
                            />
                            <div>
                              <div className="text-sm font-semibold text-neutral-900 dark:text-white">
                                {it.name}
                              </div>
                              <div className="text-xs text-neutral-500">
                                Qty: {it.quantity} {it.size ? `• Size: ${it.size}` : ''}
                              </div>
                            </div>
                          </div>
                          <div className="font-semibold text-sm text-neutral-900 dark:text-white">
                            {formatIndianPrice(it.price * it.quantity)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Summary Totals */}
                  <div className="p-4 rounded-xl bg-neutral-50 dark:bg-white/[0.02] border border-neutral-200 dark:border-white/5 space-y-2 text-xs">
                    <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
                      <span>Subtotal</span>
                      <span>{formatIndianPrice(selectedOrderForInvoice.total)}</span>
                    </div>
                    <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
                      <span>Express Shipping</span>
                      <span className="text-[#0F382A] dark:text-emerald-400 font-semibold">COMPLIMENTARY</span>
                    </div>
                    <div className="pt-2 border-t border-neutral-200 dark:border-white/10 flex justify-between text-sm font-serif font-bold text-neutral-900 dark:text-white">
                      <span>Grand Total</span>
                      <span className="text-[#C5A880]">{formatIndianPrice(selectedOrderForInvoice.total)}</span>
                    </div>
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="p-6 border-t border-neutral-200 dark:border-white/10 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      if (typeof window !== 'undefined') window.print();
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 border border-neutral-300 dark:border-white/20 hover:bg-neutral-100 dark:hover:bg-white/5 transition-all"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Print Invoice</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedOrderForInvoice(null)}
                    className="px-5 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider text-white bg-[#111111] hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 dark:text-[#111111] transition-all"
                  >
                    Close
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
};

export default AccountDashboard;
