import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart,
  ShoppingBag,
  Trash2,
  ArrowRight,
  Filter,
  Check,
  Bell,
  Sparkles,
  AlertCircle,
  ChevronDown,
  X,
} from 'lucide-react';

/* =========================================================================
   TYPE DEFINITIONS
   ========================================================================= */

export type WishlistCategory =
  | 'all'
  | 'sarees'
  | 'dresses'
  | 'jewelry'
  | 'accessories'
  | 'sale';

export type WishlistSort =
  | 'recent'
  | 'price_asc'
  | 'price_desc'
  | 'discount';

export interface WishlistProduct {
  id: string | number;
  name: string;
  brand?: string;
  category: string;
  categoryLabel?: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  stock: number;
  image: string;
  secondaryImage?: string;
  availableSizes?: string[];
  selectedSize?: string;
  badge?: 'Low Stock' | 'Sale' | 'Trending' | 'New Season';
  addedAt?: string;
}

export interface WishlistPageProps {
  initialItems?: WishlistProduct[];
  onMoveToCart?: (product: WishlistProduct, size: string) => void;
  onRemoveItem?: (productId: string | number) => void;
  onMoveAllToCart?: (products: WishlistProduct[]) => void;
  onClearAll?: () => void;
  onExploreCatalog?: () => void;
}

/* =========================================================================
   MOCK EDITORIAL HIGH-FASHION WISHLIST DATA
   ========================================================================= */

export const DEFAULT_WISHLIST_ITEMS: WishlistProduct[] = [
  {
    id: 1,
    name: 'Royal Kanjivaram Pure Silk Zari Saree',
    brand: 'RJ SIGNATURE',
    category: 'sarees',
    categoryLabel: 'Sarees & Couture',
    price: 3499,
    originalPrice: 6999,
    discount: 50,
    stock: 2, // Low stock cue
    image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80',
    secondaryImage: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=800&q=80',
    availableSizes: ['Free Size (5.5m + Blouse)'],
    selectedSize: 'Free Size (5.5m + Blouse)',
    badge: 'Low Stock',
    addedAt: '2026-10-24T10:00:00Z',
  },
  {
    id: 2,
    name: 'Crimson Velvet Bridal Lehenga with Zardozi Work',
    brand: 'RJ ROYAL HERITAGE',
    category: 'dresses',
    categoryLabel: 'Kurtis & Lehengas',
    price: 8999,
    originalPrice: 14999,
    discount: 40,
    stock: 5,
    image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80',
    secondaryImage: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80',
    availableSizes: ['XS', 'S', 'M', 'L', 'Custom'],
    selectedSize: 'M',
    badge: 'Trending',
    addedAt: '2026-10-23T14:30:00Z',
  },
  {
    id: 3,
    name: 'Handcrafted Kundan Polki Choker & Jhumka Ensemble',
    brand: 'RJ JEWELS VAULT',
    category: 'jewelry',
    categoryLabel: 'Jewellery & Chokers',
    price: 2499,
    originalPrice: 4999,
    discount: 50,
    stock: 8,
    image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=800&q=80',
    secondaryImage: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=800&q=80',
    availableSizes: ['Standard Choker Fit'],
    selectedSize: 'Standard Choker Fit',
    badge: 'Sale',
    addedAt: '2026-10-22T09:15:00Z',
  },
  {
    id: 4,
    name: 'Midnight Black Embroidered Sherwani Tuxedo Ensemble',
    brand: 'RJ BESPOKE MEN',
    category: 'dresses',
    categoryLabel: 'Kurtis & Lehengas',
    price: 6499,
    originalPrice: 9999,
    discount: 35,
    stock: 0, // Out of stock cue
    image: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=800&q=80',
    secondaryImage: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=800&q=80',
    availableSizes: ['38', '40', '42', '44'],
    selectedSize: '40',
    addedAt: '2026-10-21T18:00:00Z',
  },
  {
    id: 5,
    name: 'Artisan Raw Silk Potli Clutch with Pearl Tassels',
    brand: 'RJ ACCESSORIES',
    category: 'accessories',
    categoryLabel: 'Bags & Gifts',
    price: 1299,
    originalPrice: 1999,
    discount: 35,
    stock: 12,
    image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=800&q=80',
    secondaryImage: 'https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?auto=format&fit=crop&w=800&q=80',
    availableSizes: ['One Size'],
    selectedSize: 'One Size',
    badge: 'New Season',
    addedAt: '2026-10-20T11:45:00Z',
  },
  {
    id: 6,
    name: 'Emerald Floral Printed Georgette Anarkali Suit',
    brand: 'RJ SIGNATURE',
    category: 'dresses',
    categoryLabel: 'Kurtis & Lehengas',
    price: 2899,
    originalPrice: 4499,
    discount: 36,
    stock: 1, // High urgency cue
    image: 'https://images.unsplash.com/photo-1609357605129-26f69add5d6e?auto=format&fit=crop&w=800&q=80',
    secondaryImage: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80',
    availableSizes: ['XS', 'S', 'M', 'L'],
    selectedSize: 'S',
    badge: 'Low Stock',
    addedAt: '2026-10-19T16:20:00Z',
  },
];

/* =========================================================================
   MAIN COMPONENT: WishlistPage
   ========================================================================= */

export const WishlistPage: React.FC<WishlistPageProps> = ({
  initialItems = DEFAULT_WISHLIST_ITEMS,
  onMoveToCart,
  onRemoveItem,
  onMoveAllToCart,
  onClearAll,
  onExploreCatalog,
}) => {
  const [items, setItems] = useState<WishlistProduct[]>(initialItems);
  const [activeCategory, setActiveCategory] = useState<WishlistCategory>('all');
  const [activeSort, setActiveSort] = useState<WishlistSort>('recent');
  const [selectedSizes, setSelectedSizes] = useState<Record<string | number, string>>(() => {
    const initial: Record<string | number, string> = {};
    initialItems.forEach((item) => {
      if (item.selectedSize) {
        initial[item.id] = item.selectedSize;
      } else if (item.availableSizes && item.availableSizes.length > 0) {
        initial[item.id] = item.availableSizes[0];
      }
    });
    return initial;
  });
  const [hoveredCardId, setHoveredCardId] = useState<string | number | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Trigger Toast Helper
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Handle Remove Item
  const handleRemove = (productId: string | number) => {
    setItems((prev) => prev.filter((p) => p.id !== productId));
    triggerToast('Item removed from saved collection');
    if (onRemoveItem) onRemoveItem(productId);
  };

  // Handle Move Item to Bag
  const handleMoveToCart = (product: WishlistProduct) => {
    if (product.stock <= 0) return;
    const size = selectedSizes[product.id] || product.availableSizes?.[0] || 'Standard';
    setItems((prev) => prev.filter((p) => p.id !== product.id));
    triggerToast(`Moved "${product.name}" (${size}) to your shopping bag`);
    if (onMoveToCart) onMoveToCart(product, size);
  };

  // Handle Move All In-Stock to Bag
  const handleMoveAllToCart = () => {
    const inStockItems = items.filter((p) => p.stock > 0);
    if (inStockItems.length === 0) {
      triggerToast('No in-stock items available to move to cart');
      return;
    }
    setItems((prev) => prev.filter((p) => p.stock <= 0));
    triggerToast(`Moved ${inStockItems.length} items to your shopping bag`);
    if (onMoveAllToCart) onMoveAllToCart(inStockItems);
  };

  // Handle Clear All Wishlist Items
  const handleClearAll = () => {
    setItems([]);
    setShowClearConfirm(false);
    triggerToast('Your saved collection has been cleared');
    if (onClearAll) onClearAll();
  };

  // Handle Size Selection
  const handleSizeSelect = (productId: string | number, size: string) => {
    setSelectedSizes((prev) => ({ ...prev, [productId]: size }));
  };

  // Filter & Sort Logic
  const filteredAndSortedItems = useMemo(() => {
    let result = [...items];

    // 1. Filter by category
    if (activeCategory === 'sale') {
      result = result.filter((p) => (p.discount && p.discount > 0) || p.badge === 'Sale');
    } else if (activeCategory !== 'all') {
      result = result.filter((p) => p.category === activeCategory);
    }

    // 2. Sort items
    if (activeSort === 'price_asc') {
      result.sort((a, b) => a.price - b.price);
    } else if (activeSort === 'price_desc') {
      result.sort((a, b) => b.price - a.price);
    } else if (activeSort === 'discount') {
      result.sort((a, b) => (b.discount || 0) - (a.discount || 0));
    } else {
      // Recent (default by addedAt or id)
      result.sort((a, b) => {
        const dateA = a.addedAt ? new Date(a.addedAt).getTime() : Number(a.id);
        const dateB = b.addedAt ? new Date(b.addedAt).getTime() : Number(b.id);
        return dateB - dateA;
      });
    }

    return result;
  }, [items, activeCategory, activeSort]);

  // Categories Array
  const categoryFilters: { id: WishlistCategory; label: string }[] = [
    { id: 'all', label: 'All Items' },
    { id: 'sarees', label: 'Sarees & Couture' },
    { id: 'dresses', label: 'Kurtis & Lehengas' },
    { id: 'jewelry', label: 'Jewellery' },
    { id: 'accessories', label: 'Bags & Gifts' },
    { id: 'sale', label: 'On Sale' },
  ];

  return (
    <div className="w-full min-h-screen bg-[#F8F8F7] text-[#111111] dark:bg-[#0D0D0F] dark:text-[#F5EFEB] font-sans selection:bg-[#D4AF37] selection:text-black py-8 sm:py-12 px-4 sm:px-6 lg:px-12 box-border transition-colors duration-300">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* =========================================================================
            1. PAGE HEADER & CONTROL BAR
            ========================================================================= */}
        <header className="space-y-6 border-b border-[#E5E5E5] dark:border-white/10 pb-8">
          {/* Breadcrumbs */}
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs uppercase tracking-wider text-[#78716C] dark:text-[#A8A29E]">
            <a href="/" className="hover:text-[#111111] dark:hover:text-white transition-colors">Home</a>
            <span className="opacity-40">/</span>
            <span className="font-semibold text-[#111111] dark:text-white">Wishlist</span>
          </nav>

          {/* Title Row & Item Counter Pill */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#B38B22] dark:text-[#D4AF37] mb-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Curated Client Selection</span>
              </div>
              <div className="flex items-center gap-4">
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold tracking-tight text-inherit">
                  My Saved Collection
                </h1>
                <span className="inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-semibold bg-[#111111] text-white dark:bg-[#D4AF37] dark:text-black transition-colors">
                  {items.length} {items.length === 1 ? 'Item' : 'Items'}
                </span>
              </div>
            </div>

            {/* Bulk Action Controls */}
            {items.length > 0 && (
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleMoveAllToCart}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider bg-[#111111] text-white hover:bg-[#2B2520] dark:bg-[#D4AF37] dark:text-black dark:hover:bg-[#E5C158] transition-all shadow-sm hover:shadow"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Move All to Bag</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowClearConfirm(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-semibold text-[#78716C] hover:text-[#DC2626] dark:text-[#A8A29E] dark:hover:text-[#F87171] hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear All</span>
                </button>
              </div>
            )}
          </div>

          {/* Category Filter Pills & Sort Bar */}
          {items.length > 0 && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
              {/* Category Pills (Horizontal Swipeable) */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 scrollbar-none max-w-full">
                {categoryFilters.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setActiveCategory(cat.id)}
                    className={`px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                      activeCategory === cat.id
                        ? 'bg-[#111111] text-white dark:bg-white dark:text-[#111111] shadow-sm font-semibold'
                        : 'bg-white dark:bg-[#141418] border border-[#E5E5E5] dark:border-white/10 text-[#57534E] dark:text-[#A8A29E] hover:border-[#111111] dark:hover:border-white'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Sort Dropdown */}
              <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                <span className="text-xs font-medium text-[#78716C] dark:text-[#A8A29E]">Sort by:</span>
                <div className="relative inline-block">
                  <select
                    value={activeSort}
                    onChange={(e) => setActiveSort(e.target.value as WishlistSort)}
                    aria-label="Sort Wishlist Items"
                    className="appearance-none bg-white dark:bg-[#141418] border border-[#E5E5E5] dark:border-white/10 rounded-lg px-3 py-2 pr-8 text-xs font-semibold text-[#111111] dark:text-white cursor-pointer focus:outline-none focus:border-[#D4AF37]"
                  >
                    <option value="recent">Recently Saved</option>
                    <option value="price_asc">Price: Low to High</option>
                    <option value="price_desc">Price: High to Low</option>
                    <option value="discount">Highest Discount</option>
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-[#78716C]" />
                </div>
              </div>
            </div>
          )}
        </header>

        {/* =========================================================================
            2. PRODUCT CARD ARCHITECTURE (Editorial High-Fashion Grid)
            ========================================================================= */}
        {filteredAndSortedItems.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8 items-start">
            <AnimatePresence>
              {filteredAndSortedItems.map((product) => {
                const isOutOfStock = product.stock <= 0;
                const isLowStock = product.stock > 0 && product.stock <= 3;
                const activeSize = selectedSizes[product.id] || product.availableSizes?.[0] || 'Free Size';
                const isHovered = hoveredCardId === product.id;

                return (
                  <motion.article
                    key={product.id}
                    layout
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.25 }}
                    onMouseEnter={() => setHoveredCardId(product.id)}
                    onMouseLeave={() => setHoveredCardId(null)}
                    className="group relative flex flex-col bg-white dark:bg-[#141418] border border-[#E5E5E5] dark:border-white/10 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                  >
                    {/* Vertical Fashion Image Container (3:4 ratio) */}
                    <div className="relative w-full aspect-[3/4] overflow-hidden bg-[#F1EDE6] dark:bg-[#19191F]">
                      <a href={`/product.html?id=${product.id}`} className="block w-full h-full">
                        {/* Primary Image */}
                        <img
                          src={product.image}
                          alt={product.name}
                          loading="lazy"
                          className={`w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105 ${
                            isOutOfStock ? 'grayscale opacity-60' : ''
                          }`}
                        />

                        {/* Secondary Lookbook Shot (Hover Crossfade) */}
                        {product.secondaryImage && !isOutOfStock && (
                          <img
                            src={product.secondaryImage}
                            alt={`${product.name} alternate view`}
                            loading="lazy"
                            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ease-in-out ${
                              isHovered ? 'opacity-100 scale-105' : 'opacity-0'
                            }`}
                          />
                        )}
                      </a>

                      {/* Top-Left Editorial Badges */}
                      <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10 pointer-events-none">
                        {isOutOfStock ? (
                          <span className="px-2.5 py-1 rounded-sm text-[10px] font-bold uppercase tracking-wider bg-black/80 text-white backdrop-blur-md">
                            Out of Stock
                          </span>
                        ) : (
                          <>
                            {product.badge && (
                              <span
                                className={`px-2.5 py-1 rounded-sm text-[10px] font-bold uppercase tracking-wider backdrop-blur-md ${
                                  product.badge === 'Low Stock'
                                    ? 'bg-[#B91C1C]/90 text-white'
                                    : product.badge === 'Sale'
                                    ? 'bg-[#111111]/90 text-white dark:bg-[#D4AF37]/90 dark:text-black'
                                    : 'bg-[#059669]/90 text-white'
                                }`}
                              >
                                {product.badge}
                              </span>
                            )}
                            {product.discount && product.discount > 0 && !product.badge && (
                              <span className="px-2.5 py-1 rounded-sm text-[10px] font-bold uppercase tracking-wider bg-[#111111]/90 text-white dark:bg-[#D4AF37]/90 dark:text-black backdrop-blur-md">
                                {product.discount}% OFF
                              </span>
                            )}
                          </>
                        )}
                      </div>

                      {/* Top-Right Quick Remove Heart Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          handleRemove(product.id);
                        }}
                        aria-label={`Remove ${product.name} from wishlist`}
                        title="Remove from Saved Collection"
                        className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 dark:bg-[#141418]/90 text-[#DC2626] dark:text-[#F87171] hover:bg-white dark:hover:bg-[#19191F] flex items-center justify-center shadow-md backdrop-blur-sm transition-transform hover:scale-110 active:scale-95 z-10"
                      >
                        <Heart className="w-4 h-4 fill-current stroke-current" />
                      </button>

                      {/* Out of Stock Grayscale Overlay Banner */}
                      {isOutOfStock && (
                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center p-4">
                          <button
                            type="button"
                            onClick={() => triggerToast(`Notification requested: We'll email you when "${product.name}" is restocked.`)}
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold bg-white/95 text-black hover:bg-white shadow-lg backdrop-blur-md transition-transform hover:scale-105"
                          >
                            <Bell className="w-3.5 h-3.5" />
                            <span>Notify When Restocked</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Card Editorial Details */}
                    <div className="flex flex-col flex-1 p-4 sm:p-5 space-y-3">
                      {/* Subtitle / Collection */}
                      <span className="text-[11px] font-bold uppercase tracking-widest text-[#8C827A] dark:text-[#A8A29E]">
                        {product.brand || 'RJ SIGNATURE'}
                      </span>

                      {/* Product Headline */}
                      <h3 className="text-sm font-medium text-inherit line-clamp-2 leading-snug">
                        <a href={`/product.html?id=${product.id}`} className="hover:underline">
                          {product.name}
                        </a>
                      </h3>

                      {/* Pricing Row */}
                      <div className="flex items-baseline gap-2 pt-0.5">
                        <span className="text-base font-bold text-inherit">
                          ₹{product.price.toLocaleString('en-IN')}
                        </span>
                        {product.originalPrice && product.originalPrice > product.price && (
                          <span className="text-xs text-[#78716C] dark:text-[#A8A29E] line-through">
                            ₹{product.originalPrice.toLocaleString('en-IN')}
                          </span>
                        )}
                        {product.discount && product.discount > 0 && (
                          <span className="text-[11px] font-bold text-[#059669] dark:text-[#34D399]">
                            ({product.discount}% off)
                          </span>
                        )}
                      </div>

                      {/* Size Selector Pills (Inline Interactive) */}
                      {product.availableSizes && product.availableSizes.length > 0 && (
                        <div className="pt-1 space-y-1.5">
                          <div className="flex items-center justify-between text-[11px] text-[#78716C] dark:text-[#A8A29E]">
                            <span>Size:</span>
                            <span className="font-semibold text-inherit">{activeSize}</span>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {product.availableSizes.map((size) => (
                              <button
                                key={size}
                                type="button"
                                onClick={() => handleSizeSelect(product.id, size)}
                                className={`px-2.5 py-1 rounded text-[11px] font-medium border transition-colors ${
                                  activeSize === size
                                    ? 'bg-[#111111] text-white border-[#111111] dark:bg-[#D4AF37] dark:text-black dark:border-[#D4AF37] font-bold'
                                    : 'bg-white dark:bg-[#141418] border-[#E5E5E5] dark:border-white/10 text-[#57534E] dark:text-[#A8A29E] hover:border-black dark:hover:border-white'
                                }`}
                              >
                                {size}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Stock & Scarcity Urgency Cue */}
                      {isLowStock && (
                        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#B91C1C] dark:text-[#F87171] pt-0.5">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>Only {product.stock} left in stock — order soon</span>
                        </div>
                      )}

                      {/* Spacer to push CTA to bottom */}
                      <div className="flex-1" />

                      {/* Move to Bag CTA Button */}
                      <button
                        type="button"
                        disabled={isOutOfStock}
                        onClick={() => handleMoveToCart(product)}
                        className={`w-full inline-flex items-center justify-center gap-2 py-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                          isOutOfStock
                            ? 'bg-[#E5E5E5] text-[#A8A29E] dark:bg-white/5 dark:text-white/30 cursor-not-allowed'
                            : 'bg-[#111111] text-white hover:bg-[#2B2520] dark:bg-[#D4AF37] dark:text-black dark:hover:bg-[#E5C158] shadow-sm hover:shadow active:scale-[0.99]'
                        }`}
                      >
                        <ShoppingBag className="w-4 h-4" />
                        <span>{isOutOfStock ? 'Sold Out' : 'Move to Bag'}</span>
                      </button>
                    </div>
                  </motion.article>
                );
              })}
            </AnimatePresence>
          </div>
        ) : (
          /* =========================================================================
              3. EMPTY WISHLIST STATE (Minimalist Editorial Aesthetic)
              ========================================================================= */
          <div className="py-20 px-4 text-center max-w-lg mx-auto space-y-6">
            <div className="w-20 h-20 mx-auto rounded-full bg-[#111111]/5 dark:bg-white/5 border border-[#E5E5E5] dark:border-white/10 flex items-center justify-center text-[#78716C] dark:text-[#A8A29E]">
              <Heart className="w-9 h-9 stroke-[1.2]" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-inherit">
                Your Wishlist is Empty
              </h2>
              <p className="text-sm text-[#78716C] dark:text-[#A8A29E] leading-relaxed">
                Explore our latest arrivals and save your favorite royal bridal silhouettes, statement jewellery, and handcrafted ethnic wear for upcoming celebrations.
              </p>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  if (onExploreCatalog) onExploreCatalog();
                  else window.location.href = '/shop.html?newArrival=true';
                }}
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-lg text-xs font-bold uppercase tracking-wider bg-[#111111] text-white hover:bg-[#2B2520] dark:bg-[#D4AF37] dark:text-black dark:hover:bg-[#E5C158] transition-all shadow-md hover:shadow-lg"
              >
                <span>Discover New Arrivals</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

      </div>

      {/* =========================================================================
          4. CLEAR ALL CONFIRMATION MODAL
          ========================================================================= */}
      <AnimatePresence>
        {showClearConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-white dark:bg-[#141418] border border-[#E5E5E5] dark:border-white/10 rounded-2xl p-6 shadow-2xl space-y-5"
            >
              <div className="flex justify-between items-start">
                <div className="w-10 h-10 rounded-full bg-[#DC2626]/10 text-[#DC2626] flex items-center justify-center">
                  <Trash2 className="w-5 h-5" />
                </div>
                <button
                  type="button"
                  onClick={() => setShowClearConfirm(false)}
                  className="text-[#78716C] hover:text-[#111111] dark:hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-1.5">
                <h3 className="text-lg font-bold font-serif text-inherit">Clear Saved Collection?</h3>
                <p className="text-xs text-[#78716C] dark:text-[#A8A29E] leading-relaxed">
                  Are you sure you want to remove all {items.length} items from your wishlist? This action cannot be undone.
                </p>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="flex-1 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider bg-[#DC2626] text-white hover:bg-[#B91C1C] transition-colors"
                >
                  Yes, Clear All
                </button>
                <button
                  type="button"
                  onClick={() => setShowClearConfirm(false)}
                  className="flex-1 py-2.5 rounded-lg text-xs font-semibold text-[#57534E] dark:text-[#A8A29E] border border-[#E5E5E5] dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* =========================================================================
          5. MICRO-TOAST NOTIFICATION
          ========================================================================= */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 right-6 z-50 max-w-sm px-4 py-3 rounded-xl bg-[#111111] text-white dark:bg-white dark:text-[#111111] shadow-2xl flex items-center gap-3 text-xs font-medium"
          >
            <Check className="w-4 h-4 text-[#D4AF37] dark:text-[#B38B22] shrink-0" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default WishlistPage;
