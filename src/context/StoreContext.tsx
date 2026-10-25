import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';

/* =========================================================================
   TYPES & INTERFACES
   ========================================================================= */

export interface ProductItem {
  id: string | number;
  name: string;
  brand?: string;
  category?: string;
  category_id?: number;
  price: number;
  original_price?: number;
  discount?: number;
  rating?: number;
  reviews_count?: number;
  image: string;
  additional_images?: string[] | string;
  stock?: number;
  available_sizes?: string[] | string;
  badge?: string;
  subcategory?: string;
  department?: string;
}

export interface CartItem extends ProductItem {
  cart_id: string;
  quantity: number;
  selected_size: string;
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
  addressType?: 'HOME' | 'WORK' | 'OTHER';
  isDefault?: boolean;
}

export interface UserProfile {
  id: string | number;
  name: string;
  email: string;
  phone: string;
  avatarUrl: string;
  tier: string;
  memberSince: string;
}

export type CheckoutStep = 'cart' | 'delivery' | 'payment' | 'confirmation';
export type PaymentMethod = 'upi' | 'card' | 'cod';

export interface ToastNotice {
  id: string;
  message: string;
  type: 'success' | 'info' | 'warning' | 'error';
}

export interface StoreContextType {
  // Theme
  isDarkMode: boolean;
  toggleDarkMode: () => void;

  // Cart
  cart: CartItem[];
  cartCount: number;
  cartSubtotal: number;
  promoCode: string | null;
  promoDiscount: number;
  shippingFee: number;
  cartTotal: number;
  addToCart: (product: ProductItem, size?: string, qty?: number) => void;
  buyNow: (product: ProductItem, size?: string) => void;
  removeFromCart: (cartId: string) => void;
  updateQuantity: (cartId: string, qty: number) => void;
  applyPromoCode: (code: string) => boolean;
  removePromoCode: () => void;
  clearCart: () => void;

  // Wishlist
  wishlist: ProductItem[];
  wishlistCount: number;
  isInWishlist: (productId: string | number) => boolean;
  toggleWishlist: (product: ProductItem) => void;
  removeFromWishlist: (productId: string | number) => void;

  // Auth & Profile
  user: UserProfile | null;
  isAuthenticated: boolean;
  login: (email: string) => void;
  logout: () => void;
  updateProfile: (data: Partial<UserProfile>) => void;

  // Addresses
  addresses: SavedAddress[];
  selectedAddress: SavedAddress | null;
  setSelectedAddress: (address: SavedAddress) => void;
  addAddress: (address: Omit<SavedAddress, 'id'>) => SavedAddress;
  deleteAddress: (id: string | number) => void;

  // Checkout Flow
  checkoutStep: CheckoutStep;
  setCheckoutStep: (step: CheckoutStep) => void;
  paymentMethod: PaymentMethod;
  setPaymentMethod: (method: PaymentMethod) => void;
  deliveryNotes: string;
  setDeliveryNotes: (notes: string) => void;
  placeOrder: () => Promise<{ success: boolean; orderId?: string }>;

  // AI Virtual Try-On Modal
  isTryOnOpen: boolean;
  tryOnProduct: ProductItem | null;
  openTryOn: (product: ProductItem) => void;
  closeTryOn: () => void;

  // Toast Feedback
  toasts: ToastNotice[];
  showToast: (message: string, type?: ToastNotice['type']) => void;
  dismissToast: (id: string) => void;
}

/* =========================================================================
   DEFAULT MOCK DATA
   ========================================================================= */

const DEFAULT_USER: UserProfile = {
  id: 'usr_84920',
  name: 'Om',
  email: 'omvin@example.com',
  phone: '+91 7894093586',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
  tier: 'RJ Royale VIP',
  memberSince: 'March 2026'
};

const DEFAULT_ADDRESSES: SavedAddress[] = [
  {
    id: 'addr_1',
    fullName: 'Om',
    phone: '+91 7894093586',
    houseFlat: 'Penthouse 1204, Royal Palms Residency',
    street: 'Jubilee Hills, Road No. 36',
    city: 'Hyderabad',
    state: 'Telangana',
    pinCode: '500033',
    addressType: 'HOME',
    isDefault: true
  },
  {
    id: 'addr_2',
    fullName: 'Om',
    phone: '+91 7894093586',
    houseFlat: 'Plot No. 42, Green Valley Villa',
    street: 'Sarbhal, Near Royal Palace',
    city: 'Jharsuguda',
    state: 'Odisha',
    pinCode: '768201',
    addressType: 'WORK',
    isDefault: false
  }
];

const DEFAULT_INITIAL_CART: CartItem[] = [
  {
    id: 1,
    cart_id: 'cart_init_1',
    name: 'Royal Kanjivaram Pure Silk Zari Saree',
    price: 3499,
    original_price: 6999,
    discount: 50,
    rating: 4.9,
    reviews_count: 38,
    image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80',
    quantity: 1,
    selected_size: 'Free Size'
  },
  {
    id: 65,
    cart_id: 'cart_init_2',
    name: 'Organic Cotton Printed Baby Sleepsuit & Bib Combo (Set of 3)',
    price: 899,
    original_price: 1299,
    discount: 30,
    rating: 4.8,
    reviews_count: 42,
    image: 'https://images.unsplash.com/photo-1519689680058-324335c77eba?auto=format&fit=crop&w=800&q=80',
    quantity: 1,
    selected_size: '0–3 Months'
  }
];

/* =========================================================================
   REACT CONTEXT & PROVIDER
   ========================================================================= */

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. Dark Mode
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('rjfc_theme');
      return stored === 'dark';
    }
    return false;
  });

  const toggleDarkMode = useCallback(() => {
    setIsDarkMode((prev) => {
      const next = !prev;
      if (typeof window !== 'undefined') {
        localStorage.setItem('rjfc_theme', next ? 'dark' : 'light');
        document.documentElement.classList.toggle('dark', next);
      }
      return next;
    });
  }, []);

  // 2. Auth & User
  const [user, setUser] = useState<UserProfile | null>(DEFAULT_USER);
  const isAuthenticated = !!user;

  const login = useCallback((email: string) => {
    setUser({
      id: `usr_${Date.now()}`,
      name: email.split('@')[0].toUpperCase(),
      email,
      phone: '+91 9876543210',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      tier: 'RJ Royale VIP',
      memberSince: 'October 2026'
    });
  }, []);

  const logout = useCallback(() => {
    setUser(null);
  }, []);

  const updateProfile = useCallback((data: Partial<UserProfile>) => {
    setUser((prev) => (prev ? { ...prev, ...data } : null));
  }, []);

  // 3. Cart State
  const [cart, setCart] = useState<CartItem[]>(() => {
    if (typeof window !== 'undefined') {
      const local = localStorage.getItem('rjfc_react_cart');
      if (local) {
        try {
          return JSON.parse(local);
        } catch (_) {}
      }
    }
    return DEFAULT_INITIAL_CART;
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('rjfc_react_cart', JSON.stringify(cart));
    }
  }, [cart]);

  const [promoCode, setPromoCode] = useState<string | null>('GRANDRJ');

  // Calculations
  const cartCount = useMemo(() => cart.reduce((sum, item) => sum + item.quantity, 0), [cart]);
  const cartSubtotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cart]
  );

  const promoDiscount = useMemo(() => {
    if (!promoCode) return 0;
    if (promoCode === 'GRANDRJ') return Math.min(500, Math.round(cartSubtotal * 0.15));
    if (promoCode === 'ROYAL10') return Math.round(cartSubtotal * 0.1);
    if (promoCode === 'WELCOME500' && cartSubtotal >= 2999) return 500;
    return 0;
  }, [promoCode, cartSubtotal]);

  const shippingFee = useMemo(() => (cartSubtotal >= 999 || cartSubtotal === 0 ? 0 : 49), [cartSubtotal]);
  const cartTotal = useMemo(
    () => Math.max(0, cartSubtotal - promoDiscount + shippingFee),
    [cartSubtotal, promoDiscount, shippingFee]
  );

  // 4. Wishlist State
  const [wishlist, setWishlist] = useState<ProductItem[]>(() => {
    if (typeof window !== 'undefined') {
      const local = localStorage.getItem('rjfc_react_wishlist');
      if (local) {
        try {
          return JSON.parse(local);
        } catch (_) {}
      }
    }
    return [];
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('rjfc_react_wishlist', JSON.stringify(wishlist));
    }
  }, [wishlist]);

  const wishlistCount = wishlist.length;

  const isInWishlist = useCallback(
    (productId: string | number) => wishlist.some((p) => String(p.id) === String(productId)),
    [wishlist]
  );

  // 5. Addresses & Checkout
  const [addresses, setAddresses] = useState<SavedAddress[]>(DEFAULT_ADDRESSES);
  const [selectedAddress, setSelectedAddress] = useState<SavedAddress | null>(DEFAULT_ADDRESSES[0]);
  const [checkoutStep, setCheckoutStep] = useState<CheckoutStep>('cart');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('upi');
  const [deliveryNotes, setDeliveryNotes] = useState<string>('');

  // 6. Virtual Try-On Modal
  const [isTryOnOpen, setIsTryOnOpen] = useState(false);
  const [tryOnProduct, setTryOnProduct] = useState<ProductItem | null>(null);

  const openTryOn = useCallback((product: ProductItem) => {
    setTryOnProduct(product);
    setIsTryOnOpen(true);
  }, []);

  const closeTryOn = useCallback(() => {
    setIsTryOnOpen(false);
    setTryOnProduct(null);
  }, []);

  // 7. Toast System
  const [toasts, setToasts] = useState<ToastNotice[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: ToastNotice['type'] = 'success') => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => dismissToast(id), 4000);
  }, [dismissToast]);

  // Cart Handlers
  const addToCart = useCallback((product: ProductItem, size = 'Free Size', qty = 1) => {
    setCart((prev) => {
      const existing = prev.find((i) => String(i.id) === String(product.id) && i.selected_size === size);
      if (existing) {
        return prev.map((i) =>
          i.cart_id === existing.cart_id ? { ...i, quantity: i.quantity + qty } : i
        );
      }
      const newItem: CartItem = {
        ...product,
        cart_id: `cart_${Date.now()}_${product.id}`,
        selected_size: size,
        quantity: qty
      };
      return [...prev, newItem];
    });
    showToast(`Added "${product.name}" to shopping bag!`, 'success');
  }, [showToast]);

  const buyNow = useCallback((product: ProductItem, size = 'Free Size') => {
    addToCart(product, size, 1);
    setCheckoutStep('delivery');
  }, [addToCart]);

  const removeFromCart = useCallback((cartId: string) => {
    setCart((prev) => prev.filter((i) => i.cart_id !== cartId));
    showToast('Item removed from shopping bag.', 'info');
  }, [showToast]);

  const updateQuantity = useCallback((cartId: string, qty: number) => {
    if (qty <= 0) {
      removeFromCart(cartId);
      return;
    }
    setCart((prev) => prev.map((i) => (i.cart_id === cartId ? { ...i, quantity: qty } : i)));
  }, [removeFromCart]);

  const applyPromoCode = useCallback((code: string) => {
    const upper = code.trim().toUpperCase();
    if (upper === 'GRANDRJ' || upper === 'ROYAL10' || upper === 'WELCOME500') {
      setPromoCode(upper);
      showToast(`Promo code "${upper}" applied successfully!`, 'success');
      return true;
    }
    showToast('Invalid promo code or minimum spend requirement not met.', 'error');
    return false;
  }, [showToast]);

  const removePromoCode = useCallback(() => {
    setPromoCode(null);
    showToast('Promo code removed.', 'info');
  }, [showToast]);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  // Wishlist Handlers
  const toggleWishlist = useCallback((product: ProductItem) => {
    setWishlist((prev) => {
      const exists = prev.some((p) => String(p.id) === String(product.id));
      if (exists) {
        showToast(`Removed "${product.name}" from saved looks.`, 'info');
        return prev.filter((p) => String(p.id) !== String(product.id));
      }
      showToast(`Saved "${product.name}" to your royal wishlist!`, 'success');
      return [...prev, product];
    });
  }, [showToast]);

  const removeFromWishlist = useCallback((productId: string | number) => {
    setWishlist((prev) => prev.filter((p) => String(p.id) !== String(productId)));
    showToast('Removed from saved looks.', 'info');
  }, [showToast]);

  // Address Handlers
  const addAddress = useCallback((addrData: Omit<SavedAddress, 'id'>) => {
    const newAddr: SavedAddress = {
      ...addrData,
      id: `addr_${Date.now()}`
    };
    setAddresses((prev) => {
      if (newAddr.isDefault) {
        return [newAddr, ...prev.map((a) => ({ ...a, isDefault: false }))];
      }
      return [...prev, newAddr];
    });
    setSelectedAddress(newAddr);
    showToast('New delivery address added successfully.', 'success');
    return newAddr;
  }, [showToast]);

  const deleteAddress = useCallback((id: string | number) => {
    setAddresses((prev) => prev.filter((a) => String(a.id) !== String(id)));
    showToast('Delivery address removed.', 'info');
  }, [showToast]);

  // Place Order Simulation
  const placeOrder = useCallback(async () => {
    const orderId = `RJFC-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;
    clearCart();
    setCheckoutStep('confirmation');
    showToast(`Order #${orderId} confirmed successfully!`, 'success');
    return { success: true, orderId };
  }, [clearCart, showToast]);

  const value = useMemo(
    () => ({
      isDarkMode,
      toggleDarkMode,
      cart,
      cartCount,
      cartSubtotal,
      promoCode,
      promoDiscount,
      shippingFee,
      cartTotal,
      addToCart,
      buyNow,
      removeFromCart,
      updateQuantity,
      applyPromoCode,
      removePromoCode,
      clearCart,
      wishlist,
      wishlistCount,
      isInWishlist,
      toggleWishlist,
      removeFromWishlist,
      user,
      isAuthenticated,
      login,
      logout,
      updateProfile,
      addresses,
      selectedAddress,
      setSelectedAddress,
      addAddress,
      deleteAddress,
      checkoutStep,
      setCheckoutStep,
      paymentMethod,
      setPaymentMethod,
      deliveryNotes,
      setDeliveryNotes,
      placeOrder,
      isTryOnOpen,
      tryOnProduct,
      openTryOn,
      closeTryOn,
      toasts,
      showToast,
      dismissToast
    }),
    [
      isDarkMode,
      toggleDarkMode,
      cart,
      cartCount,
      cartSubtotal,
      promoCode,
      promoDiscount,
      shippingFee,
      cartTotal,
      addToCart,
      buyNow,
      removeFromCart,
      updateQuantity,
      applyPromoCode,
      removePromoCode,
      clearCart,
      wishlist,
      wishlistCount,
      isInWishlist,
      toggleWishlist,
      removeFromWishlist,
      user,
      isAuthenticated,
      login,
      logout,
      updateProfile,
      addresses,
      selectedAddress,
      addAddress,
      deleteAddress,
      checkoutStep,
      paymentMethod,
      deliveryNotes,
      placeOrder,
      isTryOnOpen,
      tryOnProduct,
      openTryOn,
      closeTryOn,
      toasts,
      showToast,
      dismissToast
    ]
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
};

export const useStore = (): StoreContextType => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};

export default StoreContext;
