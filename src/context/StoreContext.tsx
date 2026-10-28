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
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>;
  syncCartFromStorage: () => void;

  // Wishlist
  wishlist: ProductItem[];
  wishlistCount: number;
  isInWishlist: (productId: string | number) => boolean;
  isItemInWishlist: (productId: string | number) => boolean;
  toggleWishlist: (product: ProductItem) => void;
  addToWishlist: (product: ProductItem) => void;
  removeFromWishlist: (productId: string | number) => void;
  clearWishlist: () => void;
  setWishlist: React.Dispatch<React.SetStateAction<ProductItem[]>>;

  // Auth & Profile
  user: UserProfile | null;
  isAuthenticated: boolean;
  login: (userData: string | Partial<UserProfile>) => void;
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
  tier: 'Patron',
  memberSince: 'March 2026'
};

export function readStoredUser(): UserProfile | null {
  if (typeof window === 'undefined') return DEFAULT_USER;
  try {
    const raw = localStorage.getItem('rj_user') || localStorage.getItem('rjfc_user');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return {
          id: parsed.id || parsed.uid || 'usr_84920',
          name: parsed.name || parsed.displayName || 'Om',
          email: parsed.email || 'omvin@example.com',
          phone: parsed.phone || parsed.phoneNumber || '+91 7894093586',
          avatarUrl: parsed.avatarUrl || parsed.photo || parsed.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
          tier: 'Patron',
          memberSince: parsed.memberSince || 'March 2026'
        };
      }
    }
  } catch (_) {}
  return DEFAULT_USER;
}

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

export const CART_STORAGE_KEYS = ['rjfc_cart', 'rjfc_local_cart', 'rjfc_react_cart'] as const;

export function normalizeStoreCartItem(item: any, idx = 0): CartItem | null {
  if (!item || typeof item !== 'object') return null;
  const pId = item.id || item.product_id || `item_${idx + 1}`;
  const cId = item.cart_id || `cart_${pId}_${item.selected_size || item.size || 'default'}`;
  const price = Number(item.price) || 0;
  const originalPrice = Number(item.original_price || item.originalPrice || price);
  const discount = Number(item.discount) || (originalPrice > price ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0);
  const size = item.selected_size || item.size || 'Free Size';

  return {
    id: pId,
    cart_id: cId,
    name: item.name || item.title || 'Artisanal Ensemble',
    brand: item.brand || 'RJ Fashion Collection',
    category: item.category || item.category_name || item.department || 'Luxury Couture',
    price,
    original_price: originalPrice,
    discount,
    rating: Number(item.rating) || 4.9,
    reviews_count: Number(item.reviews_count) || 28,
    image: item.image || item.thumbnail || (Array.isArray(item.images) && item.images[0]) || '/images/placeholder.jpg',
    quantity: Math.max(1, Number(item.quantity) || 1),
    selected_size: size,
    stock: item.stock !== undefined ? Number(item.stock) : 99
  };
}

export function readUnifiedCartFromStorage(): CartItem[] | null {
  if (typeof window === 'undefined') return null;
  for (const key of CART_STORAGE_KEYS) {
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const normalized = parsed.map(normalizeStoreCartItem).filter(Boolean) as CartItem[];
          if (normalized.length > 0) return normalized;
        }
      }
    } catch (_) {}
  }
  for (const key of CART_STORAGE_KEYS) {
    try {
      const sRaw = sessionStorage.getItem(key);
      if (sRaw) {
        const parsed = JSON.parse(sRaw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const normalized = parsed.map(normalizeStoreCartItem).filter(Boolean) as CartItem[];
          if (normalized.length > 0) return normalized;
        }
      }
    } catch (_) {}
  }
  return null;
}

export function writeUnifiedCartToStorage(cartItems: CartItem[]): void {
  if (typeof window === 'undefined') return;
  const json = JSON.stringify(cartItems);
  for (const key of CART_STORAGE_KEYS) {
    try { localStorage.setItem(key, json); } catch (_) {}
    try { sessionStorage.setItem(key, json); } catch (_) {}
  }
  if ((window as any)._rjfc_memory_cart) {
    (window as any)._rjfc_memory_cart = cartItems;
  }
  try {
    window.dispatchEvent(new CustomEvent('rjfc_cart_updated', { detail: { items: cartItems } }));
    window.dispatchEvent(new Event('storage'));
  } catch (_) {}
  try {
    if (typeof (window as any).updateCartCount === 'function') {
      (window as any).updateCartCount();
    }
  } catch (_) {}
}

export const WISHLIST_STORAGE_KEY = 'rj_fashion_wishlist';
export const LEGACY_WISHLIST_KEYS = ['rjfc_wishlist', 'rjfc_react_wishlist'] as const;

export function normalizeStoreWishlistItem(item: any, idx = 0): ProductItem | null {
  if (!item) return null;
  if (typeof item === 'string' || typeof item === 'number') {
    return {
      id: item,
      name: `Artisanal Ensemble #${item}`,
      category: 'Luxury Couture',
      price: 2999,
      original_price: 4999,
      discount: 40,
      image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80',
      stock: 5,
      rating: 4.9
    };
  }
  if (typeof item === 'object') {
    const pId = item.id || item.product_id || `wish_${idx + 1}`;
    const price = Number(item.price) || 0;
    const originalPrice = Number(item.original_price || item.originalPrice || price);
    const discount = Number(item.discount) || (originalPrice > price ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0);

    return {
      id: pId,
      name: item.name || item.title || 'Artisanal Ensemble',
      brand: item.brand || 'RJ Fashion Collection',
      category: item.category || item.category_name || item.department || 'Luxury Couture',
      price,
      original_price: originalPrice,
      discount,
      rating: Number(item.rating) || 4.9,
      reviews_count: Number(item.reviews_count) || 24,
      image: item.image || item.thumbnail || (Array.isArray(item.images) && item.images[0]) || 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80',
      stock: item.stock !== undefined ? Number(item.stock) : 5,
      badge: item.badge || (discount >= 30 ? 'Special' : undefined),
      available_sizes: item.available_sizes || item.availableSizes || ['Free Size']
    };
  }
  return null;
}

export function readUnifiedWishlistFromStorage(): ProductItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const primary = localStorage.getItem(WISHLIST_STORAGE_KEY);
    if (primary) {
      const parsed = JSON.parse(primary);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map(normalizeStoreWishlistItem).filter(Boolean) as ProductItem[];
      }
    }
  } catch (_) {}

  for (const key of LEGACY_WISHLIST_KEYS) {
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map(normalizeStoreWishlistItem).filter(Boolean) as ProductItem[];
        }
      }
    } catch (_) {}
  }
  return [];
}

export function writeUnifiedWishlistToStorage(items: ProductItem[]): void {
  if (typeof window === 'undefined') return;
  const json = JSON.stringify(items);
  try {
    localStorage.setItem(WISHLIST_STORAGE_KEY, json);
    sessionStorage.setItem(WISHLIST_STORAGE_KEY, json);
  } catch (_) {}
  for (const key of LEGACY_WISHLIST_KEYS) {
    try {
      localStorage.setItem(key, json);
      sessionStorage.setItem(key, json);
    } catch (_) {}
  }
  try {
    window.dispatchEvent(new Event('wishlist-updated'));
    window.dispatchEvent(new CustomEvent('rjfc_wishlist_updated', { detail: { items } }));
    window.dispatchEvent(new Event('storage'));
  } catch (_) {}
  try {
    if (typeof (window as any).updateWishlistCount === 'function') {
      (window as any).updateWishlistCount();
    }
  } catch (_) {}
}

/* =========================================================================
   REACT CONTEXT & PROVIDER
   ========================================================================= */

export const StoreContext = createContext<StoreContextType | undefined>(undefined);

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
  const [user, setUser] = useState<UserProfile | null>(() => readStoredUser());
  const isAuthenticated = !!user;

  const login = useCallback((userData: string | Partial<UserProfile>) => {
    let newUser: UserProfile;
    if (typeof userData === 'string') {
      newUser = {
        id: `usr_${Date.now()}`,
        name: userData.split('@')[0].toUpperCase(),
        email: userData,
        phone: '+91 7894093586',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
        tier: 'Patron',
        memberSince: 'March 2026'
      };
    } else {
      newUser = {
        id: userData.id || (userData as any).uid || `usr_${Date.now()}`,
        name: userData.name || (userData as any).displayName || userData.email?.split('@')[0] || 'Om',
        email: userData.email || 'omvin@example.com',
        phone: userData.phone || '+91 7894093586',
        avatarUrl: userData.avatarUrl || (userData as any).photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
        tier: 'Patron',
        memberSince: 'March 2026',
        ...userData
      };
    }
    setUser(newUser);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('rj_user', JSON.stringify(newUser));
        localStorage.setItem('rjfc_user', JSON.stringify(newUser));
        sessionStorage.setItem('rj_user', JSON.stringify(newUser));
        sessionStorage.setItem('rjfc_user', JSON.stringify(newUser));
        window.dispatchEvent(new CustomEvent('rjfc_user_updated', { detail: { user: newUser } }));
        window.dispatchEvent(new Event('storage'));
      } catch (_) {}
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    if (typeof window !== 'undefined') {
      try {
        ['rj_user', 'rjfc_user', 'token', 'session_token', 'auth_token', 'id_token', 'jwt', 'rjfc_token', 'rj_session_token'].forEach(k => {
          localStorage.removeItem(k);
          sessionStorage.removeItem(k);
        });
        window.dispatchEvent(new CustomEvent('rjfc_user_updated', { detail: { user: null } }));
        window.dispatchEvent(new Event('storage'));
      } catch (_) {}
    }
  }, []);

  const updateProfile = useCallback((data: Partial<UserProfile>) => {
    setUser((prev) => {
      if (!prev) return null;
      const updated = { ...prev, ...data };
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('rj_user', JSON.stringify(updated));
          localStorage.setItem('rjfc_user', JSON.stringify(updated));
          window.dispatchEvent(new CustomEvent('rjfc_user_updated', { detail: { user: updated } }));
        } catch (_) {}
      }
      return updated;
    });
  }, []);

  // Listen for storage / cross-tab / cross-component user updates in real-time
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleUserUpdate = () => {
      const stored = readStoredUser();
      setUser(stored);
    };

    window.addEventListener('rjfc_user_updated', handleUserUpdate as EventListener);
    window.addEventListener('storage', handleUserUpdate);
    return () => {
      window.removeEventListener('rjfc_user_updated', handleUserUpdate as EventListener);
      window.removeEventListener('storage', handleUserUpdate);
    };
  }, []);

  // 3. Cart State
  const [cart, setCart] = useState<CartItem[]>(() => {
    const stored = readUnifiedCartFromStorage();
    if (stored && stored.length > 0) return stored;
    return DEFAULT_INITIAL_CART;
  });

  const cartRef = React.useRef(cart);
  useEffect(() => {
    cartRef.current = cart;
  }, [cart]);

  // Synchronize cart changes across all storage keys and fire update events
  useEffect(() => {
    writeUnifiedCartToStorage(cart);
  }, [cart]);

  // Listen for storage / cross-tab / cross-component cart updates in real-time
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleExternalCartUpdate = () => {
      try {
        const stored = readUnifiedCartFromStorage();
        if (stored) {
          if (JSON.stringify(stored) !== JSON.stringify(cartRef.current)) {
            setCart(stored);
          }
        }
      } catch (_) {}
    };

    window.addEventListener('rjfc_cart_updated', handleExternalCartUpdate);
    window.addEventListener('storage', handleExternalCartUpdate);
    return () => {
      window.removeEventListener('rjfc_cart_updated', handleExternalCartUpdate);
      window.removeEventListener('storage', handleExternalCartUpdate);
    };
  }, []);

  const syncCartFromStorage = useCallback(() => {
    const stored = readUnifiedCartFromStorage();
    if (stored) {
      setCart(stored);
    }
  }, []);

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
    return readUnifiedWishlistFromStorage();
  });

  const wishlistRef = React.useRef(wishlist);
  useEffect(() => {
    wishlistRef.current = wishlist;
  }, [wishlist]);

  // Synchronize whenever wishlist state changes
  useEffect(() => {
    writeUnifiedWishlistToStorage(wishlist);
  }, [wishlist]);

  // Listen for storage / cross-tab / cross-component wishlist updates in real-time
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleExternalWishlistUpdate = () => {
      try {
        const stored = readUnifiedWishlistFromStorage();
        if (JSON.stringify(stored) !== JSON.stringify(wishlistRef.current)) {
          setWishlist(stored);
        }
      } catch (_) {}
    };

    window.addEventListener('wishlist-updated', handleExternalWishlistUpdate);
    window.addEventListener('rjfc_wishlist_updated', handleExternalWishlistUpdate);
    window.addEventListener('storage', handleExternalWishlistUpdate);

    return () => {
      window.removeEventListener('wishlist-updated', handleExternalWishlistUpdate);
      window.removeEventListener('rjfc_wishlist_updated', handleExternalWishlistUpdate);
      window.removeEventListener('storage', handleExternalWishlistUpdate);
    };
  }, []);

  const wishlistCount = wishlist.length;

  const isItemInWishlist = useCallback(
    (productId: string | number) => wishlist.some((p) => String(p.id) === String(productId)),
    [wishlist]
  );
  const isInWishlist = isItemInWishlist;

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
  const addToWishlist = useCallback((product: ProductItem) => {
    setWishlist((prev) => {
      if (prev.some((p) => String(p.id) === String(product.id))) return prev;
      showToast('Added to Your Saved Collection', 'success');
      return [...prev, product];
    });
  }, [showToast]);

  const removeFromWishlist = useCallback((productId: string | number) => {
    setWishlist((prev) => {
      showToast('Removed from Wishlist', 'info');
      return prev.filter((p) => String(p.id) !== String(productId));
    });
  }, [showToast]);

  const toggleWishlist = useCallback((product: ProductItem) => {
    setWishlist((prev) => {
      const exists = prev.some((p) => String(p.id) === String(product.id));
      if (exists) {
        showToast('Removed from Wishlist', 'info');
        return prev.filter((p) => String(p.id) !== String(product.id));
      }
      showToast('Added to Your Saved Collection', 'success');
      return [...prev, product];
    });
  }, [showToast]);

  const clearWishlist = useCallback(() => {
    setWishlist([]);
    showToast('Saved collection cleared.', 'info');
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
      setCart,
      syncCartFromStorage,
      wishlist,
      wishlistCount,
      isInWishlist,
      isItemInWishlist,
      toggleWishlist,
      addToWishlist,
      removeFromWishlist,
      clearWishlist,
      setWishlist,
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
      setCart,
      syncCartFromStorage,
      wishlist,
      wishlistCount,
      isInWishlist,
      isItemInWishlist,
      toggleWishlist,
      addToWishlist,
      removeFromWishlist,
      clearWishlist,
      setWishlist,
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
