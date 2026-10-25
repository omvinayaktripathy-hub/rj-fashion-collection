import React, { useState, useEffect } from 'react';
import {
  Search,
  Heart,
  ShoppingBag,
  User,
  Sun,
  Moon,
  Menu,
  X,
  ChevronDown,
  Check,
  Copy,
  Sparkles
} from 'lucide-react';

/* =========================================================================
   TYPE DEFINITIONS
   ========================================================================= */

export interface MegaMenuColumn {
  title: string;
  links: { label: string; href: string }[];
}

export interface MegaFeaturedCard {
  badge: string;
  image: string;
  title: string;
  subtitle: string;
  href: string;
  ctaText: string;
}

export interface NavItem {
  id: string;
  label: string;
  href: string;
  hasDropdown?: boolean;
  megaMenu?: {
    columns: MegaMenuColumn[];
    featuredCard?: MegaFeaturedCard;
  };
}

export interface HeaderProps {
  activeTab?: string;
  userName?: string;
  userAvatar?: string;
  wishlistCount?: number;
  cartCount?: number;
  promoCode?: string;
  onSearch?: (query: string) => void;
  onThemeToggle?: (isDark: boolean) => void;
}

/* =========================================================================
   NAVIGATION DATA (8 CATEGORIES WITH LUXURY MEGA-MENUS)
   ========================================================================= */

export const DEFAULT_NAV_ITEMS: NavItem[] = [
  {
    id: 'home',
    label: 'HOME',
    href: '/'
  },
  {
    id: 'shop',
    label: 'SHOP',
    href: '/shop.html'
  },
  {
    id: 'sarees',
    label: 'SAREES',
    href: '/shop.html?category=sarees',
    hasDropdown: true,
    megaMenu: {
      columns: [
        {
          title: 'Heritage Silks',
          links: [
            { label: 'Kanjivaram Silk Sarees', href: '/shop.html?category=sarees&subcategory=kanjivaram' },
            { label: 'Banarasi Woven Sarees', href: '/shop.html?category=sarees&subcategory=banarasi' },
            { label: 'Tussar & Raw Silk', href: '/shop.html?category=sarees&subcategory=tussar' },
            { label: 'Chanderi Zari Sarees', href: '/shop.html?category=sarees&subcategory=chanderi' },
          ]
        },
        {
          title: 'Contemporary & Festive',
          links: [
            { label: 'Organza Floral Sarees', href: '/shop.html?category=sarees&subcategory=organza' },
            { label: 'Embroidered Georgette', href: '/shop.html?category=sarees&subcategory=georgette' },
            { label: 'Ready to Wear Sarees', href: '/shop.html?category=sarees&subcategory=ready-to-wear' },
            { label: 'Lightweight Chiffon', href: '/shop.html?category=sarees&subcategory=chiffon' },
          ]
        }
      ],
      featuredCard: {
        badge: 'The Atelier',
        image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=400&q=80',
        title: 'The Bridal Atelier',
        subtitle: 'Pure zari craftsmanship crafted for grand celebrations.',
        href: '/shop.html?category=sarees',
        ctaText: 'EXPLORE SAREES →'
      }
    }
  },
  {
    id: 'kurtis',
    label: 'KURTIS',
    href: '/shop.html?category=kurtis',
    hasDropdown: true,
    megaMenu: {
      columns: [
        {
          title: 'Styles & Cuts',
          links: [
            { label: 'Anarkali Kurtis', href: '/shop.html?category=kurtis&subcategory=anarkali' },
            { label: 'Straight Cut Kurtis', href: '/shop.html?category=kurtis&subcategory=straight-cut' },
            { label: 'Lucknowi Chikankari', href: '/shop.html?category=kurtis&subcategory=chikankari' },
            { label: 'A-Line Festive Kurtis', href: '/shop.html?category=kurtis&subcategory=a-line' },
          ]
        },
        {
          title: 'Kurta Sets',
          links: [
            { label: 'Kurta with Palazzo Sets', href: '/shop.html?category=kurtis&subcategory=kurta-palazzo' },
            { label: 'Kurta Pant Dupatta Sets', href: '/shop.html?category=kurtis&subcategory=kurta-dupatta' },
            { label: 'Daily Cotton Kurtis', href: '/shop.html?category=kurtis&subcategory=daily-wear' },
            { label: 'Festive Embroidered Sets', href: '/shop.html?category=kurtis&subcategory=festive-sets' },
          ]
        }
      ],
      featuredCard: {
        badge: 'Fresh Arrivals',
        image: 'https://images.unsplash.com/photo-1609357605129-26f69add5d6e?auto=format&fit=crop&w=400&q=80',
        title: 'Chikankari Elegance',
        subtitle: 'Intricate needlecraft on breathable pure mulmul & silk.',
        href: '/shop.html?category=kurtis',
        ctaText: 'EXPLORE KURTIS →'
      }
    }
  },
  {
    id: 'dresses',
    label: 'DRESSES',
    href: '/shop.html?category=dresses',
    hasDropdown: true,
    megaMenu: {
      columns: [
        {
          title: 'Occasion & Festive',
          links: [
            { label: 'Indo-Western Fusion Dresses', href: '/shop.html?category=dresses&subcategory=indo-western' },
            { label: 'Floor-Length Evening Gowns', href: '/shop.html?category=dresses&subcategory=evening-gowns' },
            { label: 'Celebration Party Dresses', href: '/shop.html?category=dresses&subcategory=party-dresses' },
            { label: 'Festive Flared Maxi Dresses', href: '/shop.html?category=dresses&subcategory=festive-maxi' },
          ]
        },
        {
          title: 'Contemporary Silhouettes',
          links: [
            { label: 'Tiered Flared Dresses', href: '/shop.html?category=dresses&subcategory=tiered-dresses' },
            { label: 'Fit & Flare Silhouettes', href: '/shop.html?category=dresses&subcategory=fit-and-flare' },
            { label: 'Wrap & Cape Dresses', href: '/shop.html?category=dresses&subcategory=wrap-dresses' },
            { label: 'Ethnic Co-ord Ensembles', href: '/shop.html?category=dresses&subcategory=co-ords' },
          ]
        }
      ],
      featuredCard: {
        badge: 'Celebration Wear',
        image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=400&q=80',
        title: 'Modern Royalty',
        subtitle: 'Western cuts reimagined with heritage Indian craftsmanship.',
        href: '/shop.html?category=dresses',
        ctaText: 'EXPLORE DRESSES →'
      }
    }
  },
  {
    id: 'jewellery',
    label: 'JEWELLERY',
    href: '/shop.html?category=jewelry',
    hasDropdown: true,
    megaMenu: {
      columns: [
        {
          title: 'Heritage Adornments',
          links: [
            { label: 'Royal Kundan Choker Sets', href: '/shop.html?category=jewelry&subcategory=kundan' },
            { label: 'Polki Bridal Necklaces', href: '/shop.html?category=jewelry&subcategory=polki' },
            { label: 'Traditional Temple Jewellery', href: '/shop.html?category=jewelry&subcategory=temple-jewellery' },
            { label: 'Meenakari Enamel Sets', href: '/shop.html?category=jewelry&subcategory=meenakari' },
          ]
        },
        {
          title: 'Fine Accents',
          links: [
            { label: 'Royal Chandbalis & Jhumkas', href: '/shop.html?category=jewelry&subcategory=jhumkas' },
            { label: 'Kadas & Bangles', href: '/shop.html?category=jewelry&subcategory=bangles' },
            { label: 'Maang Tikkas & Mathapattis', href: '/shop.html?category=jewelry&subcategory=maang-tikka' },
            { label: 'Statement Cocktail Rings', href: '/shop.html?category=jewelry&subcategory=rings' },
          ]
        }
      ],
      featuredCard: {
        badge: 'The Vault',
        image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=400&q=80',
        title: 'Kundan & Polki Vault',
        subtitle: 'Heirloom artisanal gold-finished jewelry curated for grand celebrations.',
        href: '/shop.html?category=jewelry',
        ctaText: 'EXPLORE JEWELLERY →'
      }
    }
  },
  {
    id: 'new-arrivals',
    label: 'NEW ARRIVALS',
    href: '/shop.html?newArrival=true'
  },
  {
    id: 'bags-gifts',
    label: 'BAGS & GIFTS',
    href: '/shop.html?category=accessories',
    hasDropdown: true,
    megaMenu: {
      columns: [
        {
          title: 'Designer Bags',
          links: [
            { label: 'Bridal Potli Bags', href: '/shop.html?category=accessories&subcategory=bridal-potlis' },
            { label: 'Ethnic Clutches & Purses', href: '/shop.html?category=accessories&subcategory=clutches' },
            { label: 'Festive Evening Bags', href: '/shop.html?category=accessories&subcategory=party-wear' },
            { label: 'Boutique Handbags', href: '/shop.html?category=accessories&subcategory=handbags' },
          ]
        },
        {
          title: 'Celebration Gifts',
          links: [
            { label: 'Festive Gift Sets', href: '/shop.html?category=accessories&subcategory=gift-sets' },
            { label: 'Leather Wallet & Belt Sets', href: '/shop.html?category=accessories&subcategory=wallets' },
            { label: 'Royal Jewelry Gift Boxes', href: '/shop.html?category=accessories&subcategory=jewelry-boxes' },
            { label: 'Bridal Shagun Ensembles', href: '/shop.html?category=accessories&subcategory=shagun' },
          ]
        }
      ],
      featuredCard: {
        badge: 'Gifting Edit',
        image: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=400&q=80',
        title: 'Bags & Festive Gifts',
        subtitle: 'Exquisite Zardozi potli bags and curated celebration gift hampers.',
        href: '/shop.html?category=accessories',
        ctaText: 'EXPLORE BAGS & GIFTS →'
      }
    }
  }
];

/* =========================================================================
   HEADER COMPONENT
   ========================================================================= */

export const Header: React.FC<HeaderProps> = ({
  activeTab = 'home',
  userName = 'Om',
  userAvatar,
  wishlistCount = 0,
  cartCount = 0,
  promoCode = 'GRANDRJ',
  onSearch,
  onThemeToggle
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [expandedMobileCategory, setExpandedMobileCategory] = useState<string | null>(null);

  // Initialize theme from DOM or localStorage
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem('rjfc_theme');
      const isDark = savedTheme === 'dark' || document.documentElement.classList.contains('dark') || document.documentElement.getAttribute('data-theme') === 'dark';
      setIsDarkMode(isDark);
    } catch (_) {}
  }, []);

  const handleCopyCode = () => {
    try {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(promoCode);
      }
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2200);
    } catch (_) {}
  };

  const handleThemeToggle = () => {
    const nextDark = !isDarkMode;
    setIsDarkMode(nextDark);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('rjfc_theme', nextDark ? 'dark' : 'light');
        if (nextDark) {
          document.documentElement.classList.add('dark');
          document.documentElement.setAttribute('data-theme', 'dark');
        } else {
          document.documentElement.classList.remove('dark');
          document.documentElement.removeAttribute('data-theme');
        }
        if (window.updateAllThemeToggles) {
          window.updateAllThemeToggles(nextDark ? 'dark' : 'light');
        }
      } catch (_) {}
    }
    if (onThemeToggle) {
      onThemeToggle(nextDark);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;
    if (onSearch) {
      onSearch(q);
    } else if (typeof window !== 'undefined') {
      window.location.href = `/shop.html?search=${encodeURIComponent(q)}`;
    }
  };

  return (
    <header className="w-full relative z-50 font-sans select-none bg-white dark:bg-[#111111] transition-colors duration-300">

      {/* =========================================================================
          1. TOP ANNOUNCEMENT BAR
          ========================================================================= */}
      <aside
        id="announcement-bar"
        aria-label="Announcement"
        className="w-full bg-[#111111] text-[#E5E5E5] border-b border-[#222222] transition-colors"
      >
        <div className="max-w-7xl mx-auto px-6 py-2.5 flex items-center justify-between text-xs tracking-wide">
          
          {/* Left: Brand Pill Tag */}
          <div className="flex items-center gap-1.5 font-serif font-bold text-[#C5A880] tracking-wider text-[11px] sm:text-xs">
            <span>✨ RJ FASHION COLLECTION</span>
          </div>

          {/* Center: Seasonal Highlight / Complimentary Shipping */}
          <div className="hidden md:flex items-center gap-2 text-neutral-300 text-center font-light">
            <span>Discover the New Season</span>
            <span className="opacity-40" aria-hidden="true">•</span>
            <span>Complimentary Express Shipping on Orders Above ₹999</span>
          </div>

          {/* Right: Coupon Badge Pill with Click-to-Copy */}
          <div className="flex items-center">
            <button
              type="button"
              onClick={handleCopyCode}
              title={`Click to copy coupon code ${promoCode}`}
              className="group relative inline-flex items-center gap-2 px-3 py-1 rounded-full border border-dashed border-[#C5A880]/60 hover:border-[#C5A880] bg-[#1a1a1a] hover:bg-[#222222] text-[11px] font-medium transition-all cursor-pointer outline-none focus:ring-1 focus:ring-[#C5A880]"
            >
              <span className="text-neutral-400 group-hover:text-neutral-200 uppercase text-[10px] tracking-wider">
                USE CODE:
              </span>
              <strong className="text-[#C5A880] tracking-wider font-bold">
                {promoCode}
              </strong>
              {isCopied ? (
                <Check className="w-3 h-3 text-[#10B981] animate-in fade-in zoom-in" />
              ) : (
                <Copy className="w-3 h-3 text-neutral-400 group-hover:text-[#C5A880] transition-colors" />
              )}

              {/* Copied Tooltip */}
              {isCopied && (
                <span className="absolute -bottom-7 right-0 px-2 py-0.5 rounded bg-[#C5A880] text-[#111111] text-[10px] font-bold tracking-wider shadow-lg animate-in fade-in slide-in-from-top-1">
                  COPIED!
                </span>
              )}
            </button>
          </div>

        </div>
      </aside>

      {/* =========================================================================
          2. MAIN BRAND & ACTIONS ROW
          ========================================================================= */}
      <div className="w-full border-b border-gray-100 dark:border-neutral-800 bg-white/95 dark:bg-[#111111]/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-6 lg:gap-8">

          {/* Mobile Menu Button (Left on Mobile) */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(true)}
            className="lg:hidden p-2 -ml-2 text-neutral-800 dark:text-neutral-200 hover:text-black dark:hover:text-white"
            aria-label="Open navigation menu"
          >
            <Menu className="w-6 h-6" />
          </button>

          {/* Brand Logo (Serif Luxury Styling) */}
          <a
            href="/"
            className="flex flex-col group text-left"
            title="RJ Fashion Collection Homepage"
          >
            <span className="font-serif text-xl sm:text-2xl font-bold tracking-[0.08em] text-neutral-900 dark:text-white uppercase group-hover:text-[#8C6D3F] dark:group-hover:text-[#D4AF37] transition-colors">
              RJ FASHION COLLECTION
            </span>
            <span className="text-[10px] uppercase tracking-[0.28em] text-[#8C6D3F] dark:text-[#C5A880] font-medium hidden sm:inline-block">
              Luxury Ethnic Couture
            </span>
          </a>

          {/* Center: Sleek Pill Search Bar */}
          <div className="hidden sm:block flex-1 max-w-md w-full relative">
            <form onSubmit={handleSearchSubmit} className="relative w-full">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search royal bridal sarees, kurtis, jewelry..."
                className="w-full bg-neutral-50 dark:bg-neutral-800/80 border border-gray-200 dark:border-neutral-700/80 rounded-full pl-5 pr-12 py-2.5 text-xs sm:text-sm text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none focus:border-black dark:focus:border-neutral-400 focus:bg-white dark:focus:bg-neutral-800 transition-all shadow-sm"
              />
              <button
                type="submit"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black text-white dark:bg-white dark:text-black flex items-center justify-center hover:opacity-90 transition-opacity"
                aria-label="Submit search"
              >
                <Search className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>

          {/* Right: Actions Group */}
          <div className="flex items-center gap-3 sm:gap-5 lg:gap-6">

            {/* Minimal Dark Mode Toggle */}
            <button
              type="button"
              onClick={handleThemeToggle}
              title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              className="flex items-center gap-2 p-2 rounded-full text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              aria-label="Toggle theme mode"
            >
              {isDarkMode ? (
                <Sun className="w-4 h-4 text-[#E5C158]" />
              ) : (
                <Moon className="w-4 h-4 text-neutral-700" />
              )}
            </button>

            {/* User Account with Label "Om" */}
            <a
              href="/account.html"
              className="flex items-center gap-2 text-neutral-700 dark:text-neutral-300 hover:text-black dark:hover:text-white transition-colors group"
              title="My Account"
            >
              {userAvatar ? (
                <img
                  src={userAvatar}
                  alt={userName}
                  className="w-7 h-7 rounded-full object-cover border border-neutral-300 dark:border-neutral-700"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-[#F4EFE6] dark:bg-neutral-800 border border-[#D5CFBF] dark:border-neutral-700 flex items-center justify-center text-[#8C6D3F] dark:text-[#C5A880] text-xs font-bold">
                  {userName.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="hidden md:inline-block text-xs font-semibold tracking-wide">
                {userName}
              </span>
            </a>

            {/* Wishlist Icon with Badge */}
            <a
              href="/wishlist.html"
              className="relative p-2 text-neutral-700 dark:text-neutral-300 hover:text-black dark:hover:text-white transition-colors"
              title="My Wishlist"
              aria-label="Wishlist"
            >
              <Heart className="w-5 h-5" />
              {wishlistCount > 0 && (
                <span className="absolute top-0.5 right-0.5 min-w-[17px] h-[17px] px-1 rounded-full bg-[#8C6D3F] text-white text-[10px] font-bold flex items-center justify-center shadow-sm">
                  {wishlistCount}
                </span>
              )}
            </a>

            {/* Shopping Bag / Cart Icon with Badge */}
            <a
              href="/cart.html"
              className="relative p-2 text-neutral-700 dark:text-neutral-300 hover:text-black dark:hover:text-white transition-colors"
              title="Shopping Cart"
              aria-label="Shopping Cart"
            >
              <ShoppingBag className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute top-0.5 right-0.5 min-w-[17px] h-[17px] px-1 rounded-full bg-black dark:bg-[#C5A880] text-white dark:text-black text-[10px] font-bold flex items-center justify-center shadow-sm">
                  {cartCount}
                </span>
              )}
            </a>

          </div>

        </div>
      </div>

      {/* =========================================================================
          3. CATEGORY NAVIGATION BAR (CENTERED WITH BALANCED SPACING)
          ========================================================================= */}
      <nav
        aria-label="Category Navigation"
        className="hidden lg:block w-full border-b border-gray-100 dark:border-neutral-800 bg-white dark:bg-[#111111] transition-colors"
      >
        <div className="max-w-7xl mx-auto px-6">
          <ul className="flex items-center justify-center gap-7 xl:gap-9 py-3 m-0 p-0 list-none">
            {DEFAULT_NAV_ITEMS.map((item) => {
              const isActive = activeTab.toLowerCase() === item.id;

              return (
                <li key={item.id} className="relative group">
                  <a
                    href={item.href}
                    className={`inline-flex items-center gap-1 py-1 text-xs font-semibold tracking-[0.14em] uppercase transition-colors relative ${
                      isActive
                        ? 'text-black dark:text-white font-bold'
                        : 'text-neutral-600 dark:text-neutral-300 hover:text-black dark:hover:text-white'
                    }`}
                  >
                    <span>{item.label}</span>
                    {item.hasDropdown && (
                      <ChevronDown className="w-3 h-3 transition-transform duration-200 group-hover:rotate-180 text-neutral-400 group-hover:text-black dark:group-hover:text-white" />
                    )}

                    {/* Active Tab Underline Indicator */}
                    {isActive && (
                      <span
                        className="absolute bottom-0 left-0 right-0 h-[2px] bg-black dark:bg-[#C5A880] -mb-[13px]"
                        aria-hidden="true"
                      />
                    )}
                  </a>

                  {/* Mega Menu Dropdown */}
                  {item.hasDropdown && item.megaMenu && (
                    <div className="absolute top-full left-1/2 -translate-x-1/2 pt-3 w-[780px] opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-200 z-50">
                      <div className="bg-white dark:bg-[#161616] border border-gray-200 dark:border-neutral-800 rounded-xl shadow-2xl p-6 grid grid-cols-3 gap-6">

                        {/* Column 1 & 2: Subcategory Links */}
                        {item.megaMenu.columns.map((col, idx) => (
                          <div key={idx} className="space-y-3">
                            <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#8C6D3F] dark:text-[#C5A880] block border-b border-gray-100 dark:border-neutral-800 pb-2">
                              {col.title}
                            </span>
                            <ul className="space-y-2 list-none p-0 m-0">
                              {col.links.map((link, lIdx) => (
                                <li key={lIdx}>
                                  <a
                                    href={link.href}
                                    className="text-xs text-neutral-600 dark:text-neutral-300 hover:text-black dark:hover:text-[#C5A880] hover:translate-x-1 inline-block transition-all"
                                  >
                                    {link.label}
                                  </a>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}

                        {/* Column 3: Featured Atelier Card */}
                        {item.megaMenu.featuredCard && (
                          <div className="bg-[#FAF8F5] dark:bg-[#1c1c1c] border border-gray-100 dark:border-neutral-800 rounded-lg p-3.5 flex flex-col justify-between">
                            <div>
                              <div className="relative rounded overflow-hidden mb-2.5 aspect-[4/3]">
                                <img
                                  src={item.megaMenu.featuredCard.image}
                                  alt={item.megaMenu.featuredCard.title}
                                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                                  loading="lazy"
                                />
                                <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/70 backdrop-blur-md text-white text-[9px] font-bold uppercase tracking-wider">
                                  {item.megaMenu.featuredCard.badge}
                                </span>
                              </div>
                              <h4 className="font-serif text-sm font-bold text-neutral-900 dark:text-white m-0">
                                {item.megaMenu.featuredCard.title}
                              </h4>
                              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1 leading-snug">
                                {item.megaMenu.featuredCard.subtitle}
                              </p>
                            </div>
                            <a
                              href={item.megaMenu.featuredCard.href}
                              className="mt-3 text-[10px] font-bold tracking-widest uppercase text-[#8C6D3F] dark:text-[#C5A880] hover:underline inline-block"
                            >
                              {item.megaMenu.featuredCard.ctaText}
                            </a>
                          </div>
                        )}

                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </nav>

      {/* =========================================================================
          4. MOBILE SLIDING NAVIGATION DRAWER
          ========================================================================= */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop Blur Overlay */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer Container */}
          <div className="fixed inset-y-0 left-0 w-full max-w-xs bg-white dark:bg-[#121212] shadow-2xl flex flex-col z-10 transition-transform">
            
            {/* Drawer Header */}
            <div className="p-4 border-b border-gray-200 dark:border-neutral-800 flex items-center justify-between">
              <span className="font-serif font-bold text-base tracking-wider text-neutral-900 dark:text-white">
                RJ FASHION COLLECTION
              </span>
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1.5 rounded-full text-neutral-500 hover:text-black dark:hover:text-white"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mobile Search Input */}
            <div className="p-4 border-b border-gray-100 dark:border-neutral-800">
              <form onSubmit={handleSearchSubmit} className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search products..."
                  className="w-full bg-neutral-100 dark:bg-neutral-800 border-none rounded-full px-4 py-2 text-xs text-neutral-900 dark:text-white placeholder-neutral-400 outline-none"
                />
                <button
                  type="submit"
                  className="absolute right-1 top-1/2 -translate-y-1/2 p-1.5 text-neutral-500"
                  aria-label="Search"
                >
                  <Search className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>

            {/* Navigation Links Accordion */}
            <div className="flex-1 overflow-y-auto p-4 space-y-1">
              {DEFAULT_NAV_ITEMS.map((item) => {
                const isExpanded = expandedMobileCategory === item.id;

                return (
                  <div key={item.id} className="border-b border-gray-50 dark:border-neutral-800/50 pb-1">
                    <div className="flex items-center justify-between py-2.5">
                      <a
                        href={item.href}
                        onClick={() => !item.hasDropdown && setIsMobileMenuOpen(false)}
                        className="text-xs font-bold uppercase tracking-wider text-neutral-800 dark:text-neutral-200 hover:text-[#8C6D3F] dark:hover:text-[#C5A880]"
                      >
                        {item.label}
                      </a>
                      {item.hasDropdown && (
                        <button
                          type="button"
                          onClick={() => setExpandedMobileCategory(isExpanded ? null : item.id)}
                          className="p-1 text-neutral-400"
                          aria-label={`Expand ${item.label}`}
                        >
                          <ChevronDown
                            className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                          />
                        </button>
                      )}
                    </div>

                    {/* Accordion Submenu */}
                    {item.hasDropdown && isExpanded && item.megaMenu && (
                      <div className="pl-3 pb-2 space-y-3">
                        {item.megaMenu.columns.map((col, cIdx) => (
                          <div key={cIdx} className="space-y-1.5">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C6D3F] dark:text-[#C5A880]">
                              {col.title}
                            </span>
                            <ul className="pl-2 space-y-1.5 list-none m-0 p-0">
                              {col.links.map((link, lIdx) => (
                                <li key={lIdx}>
                                  <a
                                    href={link.href}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="text-[11px] text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white block py-0.5"
                                  >
                                    {link.label}
                                  </a>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Mobile Footer Area */}
            <div className="p-4 border-t border-gray-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-neutral-600 dark:text-neutral-400">Theme</span>
                <button
                  type="button"
                  onClick={handleThemeToggle}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 font-medium text-[11px]"
                >
                  {isDarkMode ? <Sun className="w-3.5 h-3.5 text-[#E5C158]" /> : <Moon className="w-3.5 h-3.5" />}
                  <span>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
                </button>
              </div>

              <a
                href="/account.html"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-2 py-1.5 text-neutral-800 dark:text-neutral-200 font-semibold"
              >
                <User className="w-4 h-4 text-[#8C6D3F] dark:text-[#C5A880]" />
                <span>My Account ({userName})</span>
              </a>
            </div>

          </div>
        </div>
      )}

    </header>
  );
};

export default Header;
