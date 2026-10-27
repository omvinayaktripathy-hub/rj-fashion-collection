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

export interface NavCategory {
  id: string;
  label: string;
  href: string;
  hasDropdown?: boolean;
  highlight?: boolean;
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
   EXACT 11 CATEGORIES WITH LUXURY EDITORIAL FLYOUTS & MEGA MENUS
   ========================================================================= */

export const UPDATED_11_CATEGORIES: NavCategory[] = [
  {
    id: 'home',
    label: 'Home',
    href: '/'
  },
  {
    id: 'girls',
    label: 'Girls',
    href: '/shop.html?category=kids-ethnic&gender=girls',
    hasDropdown: true,
    megaMenu: {
      columns: [
        {
          title: 'Festive & Traditional',
          links: [
            { label: 'Embroidered Lehengas', href: '/shop.html?category=kids-ethnic&search=lehenga' },
            { label: 'Anarkali & Sharara Sets', href: '/shop.html?category=kids-ethnic&search=anarkali' },
            { label: 'Silk Pavadais & Kurtis', href: '/shop.html?category=kids-ethnic&search=silk' },
            { label: 'Festive Party Wear', href: '/shop.html?category=kids-ethnic&search=festive' }
          ]
        },
        {
          title: 'Celebration Dresses',
          links: [
            { label: 'Sequin Net Gowns', href: '/shop.html?category=kids-western&search=gown' },
            { label: 'Flared Princess Frocks', href: '/shop.html?category=kids-western&search=frock' },
            { label: 'Indo-Western Fusion', href: '/shop.html?category=kids-western&search=fusion' },
            { label: 'Tiered Party Frocks', href: '/shop.html?category=kids-western&search=party' }
          ]
        }
      ],
      featuredCard: {
        badge: 'Little Royals',
        image: 'https://images.unsplash.com/photo-1621786030685-2c8c4a4e1017?auto=format&fit=crop&w=400&q=80',
        title: 'Girls Festive Coutures',
        subtitle: 'Intricate zardozi and gentle fabrics curated for little celebrations.',
        href: '/shop.html?category=kids-ethnic&gender=girls',
        ctaText: 'SHOP GIRLS →'
      }
    }
  },
  {
    id: 'women',
    label: 'Women',
    href: '/shop.html?department=women',
    hasDropdown: true,
    megaMenu: {
      columns: [
        {
          title: 'Heritage Silks',
          links: [
            { label: 'Kanjivaram Silk Sarees', href: '/shop.html?category=sarees&subcategory=kanjivaram' },
            { label: 'Banarasi Woven Sarees', href: '/shop.html?category=sarees&subcategory=banarasi' },
            { label: 'Tussar & Raw Silk', href: '/shop.html?category=sarees&subcategory=tussar' },
            { label: 'Chanderi Zari Sarees', href: '/shop.html?category=sarees&subcategory=chanderi' }
          ]
        },
        {
          title: 'Contemporary & Festive',
          links: [
            { label: 'Organza Floral Sarees', href: '/shop.html?category=sarees&subcategory=organza' },
            { label: 'Embroidered Georgette', href: '/shop.html?category=sarees&subcategory=georgette' },
            { label: 'Ready to Wear Sarees', href: '/shop.html?category=sarees&subcategory=ready-to-wear' },
            { label: 'Lightweight Chiffon', href: '/shop.html?category=sarees&subcategory=chiffon' }
          ]
        }
      ],
      featuredCard: {
        badge: 'The Atelier',
        image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=400&q=80',
        title: 'Women’s Signature Edit',
        subtitle: 'Grand bridal silhouettes and pure zari weaves for royal celebrations.',
        href: '/shop.html?department=women',
        ctaText: 'EXPLORE WOMEN →'
      }
    }
  },
  {
    id: 'boy',
    label: 'Boy',
    href: '/shop.html?category=kids-ethnic&gender=boys',
    hasDropdown: true,
    megaMenu: {
      columns: [
        {
          title: 'Royal Ethnic Wear',
          links: [
            { label: 'Kurta Pyjama Sets', href: '/shop.html?category=kids-ethnic&search=kurta' },
            { label: 'Silk Dhoti Kurta Sets', href: '/shop.html?category=kids-ethnic&search=dhoti' },
            { label: 'Nehru & Bundi Jackets', href: '/shop.html?category=kids-ethnic&search=jacket' },
            { label: 'Little Sherwani Sets', href: '/shop.html?category=kids-ethnic&search=sherwani' }
          ]
        },
        {
          title: 'Celebration Formals',
          links: [
            { label: 'Indo-Western Blazers', href: '/shop.html?category=kids-western&search=blazer' },
            { label: 'Party Waistcoat Sets', href: '/shop.html?category=kids-western&search=waistcoat' },
            { label: 'Festive Cotton Sets', href: '/shop.html?category=kids-western&search=cotton' },
            { label: 'Classic Formal Suits', href: '/shop.html?category=kids-western&search=suit' }
          ]
        }
      ],
      featuredCard: {
        badge: 'Young Royals',
        image: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&q=80',
        title: 'Boys Festive Regalia',
        subtitle: 'Bespoke tailoring and breathable linens for young celebrations.',
        href: '/shop.html?category=kids-ethnic&gender=boys',
        ctaText: 'SHOP BOY →'
      }
    }
  },
  {
    id: 'man',
    label: 'Man',
    href: '/shop.html?category=men-ethnic',
    hasDropdown: true,
    megaMenu: {
      columns: [
        {
          title: 'Traditional Couture',
          links: [
            { label: 'Royal Wedding Sherwanis', href: '/shop.html?category=men-ethnic&search=sherwani' },
            { label: 'Raw Silk Kurta Pajamas', href: '/shop.html?category=men-ethnic&search=kurta' },
            { label: 'Brocade Bundi Jackets', href: '/shop.html?category=men-ethnic&search=jacket' },
            { label: 'Bandhgala Jodhpuri Suits', href: '/shop.html?category=men-ethnic&search=bandhgala' }
          ]
        },
        {
          title: 'Modern Occasion',
          links: [
            { label: 'Linen Kurta Sets', href: '/shop.html?category=men-ethnic&search=linen' },
            { label: 'Festive Tuxedos & Blazers', href: '/shop.html?category=men-western&search=blazer' },
            { label: 'Indo-Western Achkans', href: '/shop.html?category=men-ethnic&search=achkan' },
            { label: 'Embroidered Waistcoats', href: '/shop.html?category=men-ethnic&search=waistcoat' }
          ]
        }
      ],
      featuredCard: {
        badge: 'Bespoke Men',
        image: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=400&q=80',
        title: 'Men’s Festive Atelier',
        subtitle: 'Regal cuts, heirloom embroideries, and structured bridal fits.',
        href: '/shop.html?category=men-ethnic',
        ctaText: 'EXPLORE MAN →'
      }
    }
  },
  {
    id: 'jewellery',
    label: 'Jewellery',
    href: '/shop.html?category=jewelry',
    hasDropdown: true,
    megaMenu: {
      columns: [
        {
          title: 'Heritage Adornments',
          links: [
            { label: 'Royal Kundan Chokers', href: '/shop.html?category=jewelry&subcategory=kundan' },
            { label: 'Polki Bridal Sets', href: '/shop.html?category=jewelry&subcategory=polki' },
            { label: 'Temple Jewellery Sets', href: '/shop.html?category=jewelry&subcategory=temple-jewellery' },
            { label: 'Meenakari Enamel Sets', href: '/shop.html?category=jewelry&subcategory=meenakari' }
          ]
        },
        {
          title: 'Fine Accents',
          links: [
            { label: 'Chandbalis & Jhumkas', href: '/shop.html?category=jewelry&subcategory=jhumkas' },
            { label: 'Kadas & Gold Bangles', href: '/shop.html?category=jewelry&subcategory=bangles' },
            { label: 'Maang Tikkas & Mathapattis', href: '/shop.html?category=jewelry&subcategory=maang-tikka' },
            { label: 'Cocktail Statement Rings', href: '/shop.html?category=jewelry&subcategory=rings' }
          ]
        }
      ],
      featuredCard: {
        badge: 'The Vault',
        image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=400&q=80',
        title: 'Royal Jewellery Vault',
        subtitle: 'Artisanal antique finish adornments for celebrations.',
        href: '/shop.html?category=jewelry',
        ctaText: 'EXPLORE JEWELLERY →'
      }
    }
  },
  {
    id: 'sunglass',
    label: 'Sunglass',
    href: '/shop.html?category=accessories&search=sunglasses',
    hasDropdown: true,
    megaMenu: {
      columns: [
        {
          title: 'Luxury Acetate',
          links: [
            { label: 'Oversized Statement Frames', href: '/shop.html?category=accessories&search=oversized' },
            { label: 'Classic Aviator Sunglasses', href: '/shop.html?category=accessories&search=aviator' },
            { label: 'Cat-Eye Vintage Silhouettes', href: '/shop.html?category=accessories&search=cat-eye' },
            { label: 'Tortoiseshell Modern Shades', href: '/shop.html?category=accessories&search=tortoiseshell' }
          ]
        },
        {
          title: 'Protection & Lenses',
          links: [
            { label: 'UV400 Polarized Lenses', href: '/shop.html?category=accessories&search=polarized' },
            { label: 'Gradient Gold Accent Frames', href: '/shop.html?category=accessories&search=gold-frames' },
            { label: 'Festive Daywear Shades', href: '/shop.html?category=accessories&search=daywear' },
            { label: 'Unisex Luxury Acetate', href: '/shop.html?category=accessories&search=acetate' }
          ]
        }
      ],
      featuredCard: {
        badge: 'New Season',
        image: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=400&q=80',
        title: 'Luxury Sunglasses',
        subtitle: 'Premium acetate frames with 100% UV protection optics.',
        href: '/shop.html?category=accessories&search=sunglasses',
        ctaText: 'EXPLORE EYEWEAR →'
      }
    }
  },
  {
    id: 'bags',
    label: 'Bags',
    href: '/shop.html?category=accessories&search=bags',
    hasDropdown: true,
    megaMenu: {
      columns: [
        {
          title: 'Artisan Clutches',
          links: [
            { label: 'Bridal Zardozi Potlis', href: '/shop.html?category=accessories&subcategory=bridal-potlis' },
            { label: 'Embroidered Velvet Clutches', href: '/shop.html?category=accessories&subcategory=clutches' },
            { label: 'Box Clutches with Stone Work', href: '/shop.html?category=accessories&search=box-clutch' },
            { label: 'Festive Evening Purses', href: '/shop.html?category=accessories&subcategory=party-wear' }
          ]
        },
        {
          title: 'Daywear & Totes',
          links: [
            { label: 'Structured Handbags', href: '/shop.html?category=accessories&subcategory=handbags' },
            { label: 'Luxury Leather Totes', href: '/shop.html?category=accessories&search=tote' },
            { label: 'Crossbody Evening Bags', href: '/shop.html?category=accessories&search=crossbody' },
            { label: 'Celebration Mini Bags', href: '/shop.html?category=accessories&search=mini-bag' }
          ]
        }
      ],
      featuredCard: {
        badge: 'Handcrafted',
        image: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=400&q=80',
        title: 'Artisan Potlis & Bags',
        subtitle: 'Delicate gold tassels, antique sequins, and silk linings.',
        href: '/shop.html?category=accessories&search=bags',
        ctaText: 'EXPLORE BAGS →'
      }
    }
  },
  {
    id: 'wallet',
    label: 'Wallet',
    href: '/shop.html?category=accessories&search=wallets',
    hasDropdown: true,
    megaMenu: {
      columns: [
        {
          title: 'Leather Craft',
          links: [
            { label: 'Classic Bi-Fold Leather Wallets', href: '/shop.html?category=accessories&subcategory=wallets' },
            { label: 'Slim RFID Cardholders', href: '/shop.html?category=accessories&search=cardholder' },
            { label: 'Zip-Around Travel Wallets', href: '/shop.html?category=accessories&search=travel-wallet' },
            { label: 'Long Passport Cases', href: '/shop.html?category=accessories&search=passport' }
          ]
        },
        {
          title: 'Gift Sets',
          links: [
            { label: 'Leather Wallet & Belt Sets', href: '/shop.html?category=accessories&search=wallet-belt' },
            { label: 'Monogram Card Sleeves', href: '/shop.html?category=accessories&search=sleeve' },
            { label: 'Handcrafted Coin Pouches', href: '/shop.html?category=accessories&search=coin-pouch' },
            { label: 'Executive Leather Combos', href: '/shop.html?category=accessories&search=leather-combo' }
          ]
        }
      ],
      featuredCard: {
        badge: 'Full Grain',
        image: 'https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=400&q=80',
        title: 'Artisan Leather Wallets',
        subtitle: 'Precision edge-painting, durable stitching, and sleek profiles.',
        href: '/shop.html?category=accessories&search=wallets',
        ctaText: 'EXPLORE WALLETS →'
      }
    }
  },
  {
    id: 'gifts',
    label: 'Gifts',
    href: '/shop.html?category=accessories&search=gifts',
    hasDropdown: true,
    megaMenu: {
      columns: [
        {
          title: 'Celebration Boxes',
          links: [
            { label: 'Royal Festive Gift Hampers', href: '/shop.html?category=accessories&subcategory=gift-sets' },
            { label: 'Bridal Shagun Envelopes & Boxes', href: '/shop.html?category=accessories&subcategory=shagun' },
            { label: 'Jewelry Storage Keepsakes', href: '/shop.html?category=accessories&subcategory=jewelry-boxes' },
            { label: 'Couple Wedding Gift Sets', href: '/shop.html?category=accessories&search=couple-gift' }
          ]
        },
        {
          title: 'Special Occasions',
          links: [
            { label: 'Diwali & Festive Gifting', href: '/shop.html?category=accessories&search=diwali-gift' },
            { label: 'Silver-Toned Coin Mementos', href: '/shop.html?category=accessories&search=coin' },
            { label: 'Personalized Gift Combos', href: '/shop.html?category=accessories&search=personalized' },
            { label: 'Corporate Celebration Sets', href: '/shop.html?category=accessories&search=corporate' }
          ]
        }
      ],
      featuredCard: {
        badge: 'Curated Gifts',
        image: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=400&q=80',
        title: 'Festive Gifting Suites',
        subtitle: 'Elevated presentation, brocade ribbons, and celebratory luxury.',
        href: '/shop.html?category=accessories&search=gifts',
        ctaText: 'EXPLORE GIFTS →'
      }
    }
  },
  {
    id: 'new-arrivals',
    label: 'New Arrivals',
    href: '/shop.html?newArrival=true',
    highlight: true
  }
];

/* =========================================================================
   HEADER COMPONENT WITH 11 CATEGORIES & CENTERED NAVIGATION
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
    if (onThemeToggle) onThemeToggle(nextDark);
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between text-xs tracking-wide">
          
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-6 lg:gap-8">

          {/* Mobile Menu Button (Left on Mobile) */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(true)}
            className="lg:hidden p-2 -ml-2 text-neutral-800 dark:text-neutral-200 hover:text-black dark:hover:text-white"
            aria-label="Open navigation menu"
          >
            <Menu className="w-6 h-6" />
          </button>

          {/* Composite Brand Logo Lockup */}
          <a
            href="/"
            className="flex items-center gap-2.5 sm:gap-3.5 group text-left transition-opacity duration-200 hover:opacity-90 flex-shrink-0"
            title="RJ Fashion Collection Homepage"
            aria-label="RJ Fashion Collection - Haute Couture & Bridal"
          >
            {/* Monogram Mark with Dark Mode Contrast Adaptation */}
            <div className="relative w-8 h-8 sm:w-10 sm:h-10 lg:w-11 lg:h-11 flex-shrink-0">
              <img
                src="/images/rj-logo-monogram.svg"
                alt="RJ Monogram"
                width={44}
                height={44}
                className="w-full h-full object-contain dark:hidden transition-transform duration-300 group-hover:scale-105"
                loading="eager"
              />
              <img
                src="/images/rj-logo-monogram-dark.svg"
                alt="RJ Monogram (Dark Mode)"
                width={44}
                height={44}
                className="w-full h-full object-contain hidden dark:block transition-transform duration-300 group-hover:scale-105"
                loading="eager"
              />
            </div>

            {/* Editorial Wordmark Typography */}
            <div className="flex flex-col justify-center">
              <span className="font-serif text-base sm:text-lg lg:text-xl font-semibold tracking-[0.2em] text-neutral-900 dark:text-white uppercase leading-none group-hover:text-[#8C6D3F] dark:group-hover:text-[#D4AF37] transition-colors">
                RJ FASHION COLLECTION
              </span>
              <span className="text-[8px] sm:text-[9px] uppercase tracking-[0.3em] text-[#C5A880] font-medium mt-1 leading-none">
                HAUTE COUTURE &amp; BRIDAL
              </span>
            </div>
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

            {/* User Account / Sign In */}
            {userName && userName !== 'Sign In' && userName !== 'Login' ? (
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
            ) : (
              <a
                href="/login.html"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-neutral-800 dark:text-neutral-200 border border-neutral-300 dark:border-neutral-700 hover:border-black dark:hover:border-white transition-colors"
                title="Sign In / Register"
              >
                <User className="w-3.5 h-3.5 text-[#C5A880]" />
                <span className="hidden sm:inline">Sign In</span>
              </a>
            )}

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
          3. CATEGORY NAVIGATION BAR (EXACT 11 CATEGORIES - CENTERED & BALANCED)
          ========================================================================= */}
      <nav
        aria-label="Category Navigation"
        className="hidden md:block w-full border-b border-gray-100 dark:border-neutral-800 bg-white dark:bg-[#111111] transition-colors"
      >
        <div className="max-w-7xl mx-auto px-4 overflow-x-auto scrollbar-none [scrollbar-width:none] [-ms-overflow-style:none]">
          <ul className="flex items-center justify-center gap-4 sm:gap-5 lg:gap-7 xl:gap-8 py-3 m-0 p-0 list-none min-w-max mx-auto">
            {UPDATED_11_CATEGORIES.map((cat) => {
              const isActive = activeTab.toLowerCase() === cat.id;

              return (
                <li key={cat.id} className="relative group flex-shrink-0">
                  <a
                    href={cat.href}
                    className={`inline-flex items-center gap-1 py-1 uppercase text-[11px] lg:text-xs tracking-widest font-medium whitespace-nowrap transition-colors relative ${
                      isActive
                        ? 'text-black dark:text-white font-bold'
                        : cat.highlight
                        ? 'text-[#8C6D3F] dark:text-[#C5A880] hover:text-black dark:hover:text-white font-semibold'
                        : 'text-gray-700 dark:text-neutral-300 hover:text-black dark:hover:text-white'
                    }`}
                  >
                    {/* Warm Accent Dot on New Arrivals */}
                    {cat.highlight && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#C5A880] inline-block mr-0.5 animate-pulse" aria-hidden="true" />
                    )}

                    <span>{cat.label}</span>

                    {/* Micro Chevron for Dropdown Categories */}
                    {cat.hasDropdown && (
                      <ChevronDown className="w-3 h-3 text-neutral-400 group-hover:text-black dark:group-hover:text-white transition-transform duration-200 group-hover:rotate-180" />
                    )}

                    {/* Active State Bottom Underline Indicator */}
                    {isActive && (
                      <span
                        className="absolute bottom-0 left-0 right-0 h-[2px] bg-black dark:bg-[#C5A880] pb-0 -mb-[13px]"
                        aria-hidden="true"
                      />
                    )}
                  </a>

                  {/* Mega Menu Dropdown */}
                  {cat.hasDropdown && cat.megaMenu && (
                    <div className="absolute top-full left-1/2 -translate-x-1/2 pt-3 w-[740px] max-w-[90vw] opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-200 z-50">
                      <div className="bg-white dark:bg-[#161616] border border-gray-200 dark:border-neutral-800 rounded-xl shadow-2xl p-6 grid grid-cols-3 gap-6">

                        {/* Column 1 & 2: Subcategories */}
                        {cat.megaMenu.columns.map((col, idx) => (
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
                        {cat.megaMenu.featuredCard && (
                          <div className="bg-[#FAF8F5] dark:bg-[#1c1c1c] border border-gray-100 dark:border-neutral-800 rounded-lg p-3.5 flex flex-col justify-between">
                            <div>
                              <div className="relative rounded overflow-hidden mb-2.5 aspect-[4/3]">
                                <img
                                  src={cat.megaMenu.featuredCard.image}
                                  alt={cat.megaMenu.featuredCard.title}
                                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                                  loading="lazy"
                                />
                                <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/70 backdrop-blur-md text-white text-[9px] font-bold uppercase tracking-wider">
                                  {cat.megaMenu.featuredCard.badge}
                                </span>
                              </div>
                              <h4 className="font-serif text-sm font-bold text-neutral-900 dark:text-white m-0">
                                {cat.megaMenu.featuredCard.title}
                              </h4>
                              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1 leading-snug">
                                {cat.megaMenu.featuredCard.subtitle}
                              </p>
                            </div>
                            <a
                              href={cat.megaMenu.featuredCard.href}
                              className="mt-3 text-[10px] font-bold tracking-widest uppercase text-[#8C6D3F] dark:text-[#C5A880] hover:underline inline-block"
                            >
                              {cat.megaMenu.featuredCard.ctaText}
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
          4. MOBILE SLIDING NAVIGATION DRAWER (ALL 11 CATEGORIES)
          ========================================================================= */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop Blur Overlay */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer Container */}
          <div className="fixed inset-y-0 left-0 w-full max-w-xs bg-white dark:bg-[#121212] shadow-2xl flex flex-col z-10 transition-transform">
            
            {/* Drawer Header with Composite Brand Logo */}
            <div className="p-4 border-b border-gray-200 dark:border-neutral-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="relative w-8 h-8 flex-shrink-0">
                  <img
                    src="/images/rj-logo-monogram.svg"
                    alt="RJ"
                    width={32}
                    height={32}
                    className="w-full h-full object-contain dark:hidden"
                  />
                  <img
                    src="/images/rj-logo-monogram-dark.svg"
                    alt="RJ"
                    width={32}
                    height={32}
                    className="w-full h-full object-contain hidden dark:block"
                  />
                </div>
                <div className="flex flex-col">
                  <span className="font-serif font-semibold text-sm tracking-[0.16em] text-neutral-900 dark:text-white leading-tight">
                    RJ FASHION COLLECTION
                  </span>
                  <span className="text-[8px] uppercase tracking-[0.25em] text-[#C5A880] mt-0.5 font-medium">
                    HAUTE COUTURE &amp; BRIDAL
                  </span>
                </div>
              </div>
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
                  placeholder="Search 11 categories..."
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

            {/* Navigation Links Accordion (All 11 Categories) */}
            <div className="flex-1 overflow-y-auto p-4 space-y-1">
              {UPDATED_11_CATEGORIES.map((cat) => {
                const isExpanded = expandedMobileCategory === cat.id;

                return (
                  <div key={cat.id} className="border-b border-gray-50 dark:border-neutral-800/50 pb-1">
                    <div className="flex items-center justify-between py-2.5">
                      <a
                        href={cat.href}
                        onClick={() => !cat.hasDropdown && setIsMobileMenuOpen(false)}
                        className={`text-xs uppercase tracking-wider font-semibold flex items-center gap-1.5 ${
                          cat.highlight
                            ? 'text-[#8C6D3F] dark:text-[#C5A880] font-bold'
                            : 'text-neutral-800 dark:text-neutral-200 hover:text-black dark:hover:text-white'
                        }`}
                      >
                        {cat.highlight && (
                          <span className="w-1.5 h-1.5 rounded-full bg-[#C5A880]" aria-hidden="true" />
                        )}
                        <span>{cat.label}</span>
                      </a>
                      {cat.hasDropdown && (
                        <button
                          type="button"
                          onClick={() => setExpandedMobileCategory(isExpanded ? null : cat.id)}
                          className="p-1 text-neutral-400"
                          aria-label={`Expand ${cat.label}`}
                        >
                          <ChevronDown
                            className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                          />
                        </button>
                      )}
                    </div>

                    {/* Accordion Submenu */}
                    {cat.hasDropdown && isExpanded && cat.megaMenu && (
                      <div className="pl-3 pb-2 space-y-3">
                        {cat.megaMenu.columns.map((col, cIdx) => (
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
                href={userName && userName !== 'Sign In' && userName !== 'Login' ? "/account.html" : "/login.html"}
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-2 py-1.5 text-neutral-800 dark:text-neutral-200 font-semibold"
              >
                <User className="w-4 h-4 text-[#8C6D3F] dark:text-[#C5A880]" />
                <span>{userName && userName !== 'Sign In' && userName !== 'Login' ? `My Account (${userName})` : 'Sign In / Register'}</span>
              </a>
            </div>

          </div>
        </div>
      )}

    </header>
  );
};

export default Header;
