import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ArrowRight, Heart } from 'lucide-react';

/* =========================================================================
   TYPE DEFINITIONS
   ========================================================================= */

export interface DepartmentItem {
  id: string;
  title: string;
  subtitle: string;
  tag: string;
  cta: string;
  image: string;
  href: string;
}

export interface ShopByDepartmentProps {
  overline?: string;
  headline?: string;
  subtitle?: string;
  departments?: DepartmentItem[];
  className?: string;
  onDepartmentClick?: (dept: DepartmentItem) => void;
  onWishlistToggle?: (dept: DepartmentItem, isFavorited: boolean) => void;
}

/* =========================================================================
   DEFAULT 9 HIGH-FASHION DEPARTMENTS
   ========================================================================= */

export const DEFAULT_DEPARTMENTS: DepartmentItem[] = [
  {
    id: 'womens-fashion',
    title: "Women's Fashion",
    subtitle: "Sarees, Lehengas, Kurtis & Designer Wear",
    tag: "Signature Couture",
    cta: "EXPLORE WOMEN →",
    image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80",
    href: "/shop.html?category=sarees",
  },
  {
    id: 'mens-fashion',
    title: "Men's Fashion",
    subtitle: "Suits, Sherwanis, Kurta Sets & Formals",
    tag: "Bespoke Men",
    cta: "EXPLORE MEN →",
    image: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=800&q=80",
    href: "/shop.html?category=mens-fashion",
  },
  {
    id: 'kids-children',
    title: "Kids & Children",
    subtitle: "Festive Embroidered & Comfortable Sets",
    tag: "Little Royals",
    cta: "EXPLORE KIDS →",
    image: "https://images.unsplash.com/photo-1622290291468-a28f7a7dc6a8?auto=format&fit=crop&w=800&q=80",
    href: "/shop.html?category=kids-fashion",
  },
  {
    id: 'bags-wallets',
    title: "Bags & Wallets",
    subtitle: "Artisan Clutches, Handbags & Leather Wallets",
    tag: "Artisan Leather",
    cta: "EXPLORE BAGS →",
    image: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=800&q=80",
    href: "/shop.html?category=bags",
  },
  {
    id: 'sunglasses-eyewear',
    title: "Sunglasses & Eyewear",
    subtitle: "Luxury Acetate Frames & UV Protection Shades",
    tag: "New Season",
    cta: "EXPLORE EYEWEAR →",
    image: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=800&q=80",
    href: "/shop.html?category=eyewear",
  },
  {
    id: 'fashion-jewelry',
    title: "Fashion Jewelry",
    subtitle: "Kundan, Antique Finish & Statement Chokers",
    tag: "Trending Jewels",
    cta: "EXPLORE JEWELRY →",
    image: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=800&q=80",
    href: "/shop.html?category=jewelry",
  },
  {
    id: 'curated-gifts',
    title: "Curated Gifts & Hampers",
    subtitle: "Luxury Festive Boxes & Keepsake Packs",
    tag: "Gift Ready",
    cta: "EXPLORE GIFTS →",
    image: "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=800&q=80",
    href: "/shop.html?category=gifts",
  },
  {
    id: 'mens-innerwear',
    title: "Men's Innerwear & Loungewear",
    subtitle: "Premium Modal Cotton Basics, Trunks & Robes",
    tag: "Ultra Comfort",
    cta: "EXPLORE INNERWEAR →",
    image: "https://images.unsplash.com/photo-1516257984-b1b4d707412e?auto=format&fit=crop&w=800&q=80",
    href: "/shop.html?category=mens-loungewear",
  },
  {
    id: 'womens-lingerie',
    title: "Women's & Girls' Lingerie & Sleepwear",
    subtitle: "Satin Sleepwear, Everyday Bras & Intimate Sets",
    tag: "Delicate Luxuries",
    cta: "EXPLORE LINGERIE →",
    image: "https://images.unsplash.com/photo-1596704017254-9b121068fb31?auto=format&fit=crop&w=800&q=80",
    href: "/shop.html?category=lingerie",
  },
];

/* =========================================================================
   INDIVIDUAL DEPARTMENT CARD COMPONENT
   ========================================================================= */

interface DepartmentCardProps {
  dept: DepartmentItem;
  index: number;
  onDepartmentClick?: (dept: DepartmentItem) => void;
  onWishlistToggle?: (dept: DepartmentItem, isFavorited: boolean) => void;
}

export const DepartmentCard: React.FC<DepartmentCardProps> = ({
  dept,
  index,
  onDepartmentClick,
  onWishlistToggle,
}) => {
  const [isFavorited, setIsFavorited] = useState(false);

  const handleWishlistClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const nextState = !isFavorited;
    setIsFavorited(nextState);
    if (onWishlistToggle) {
      onWishlistToggle(dept, nextState);
    }
  };

  const handleCardClick = (e: React.MouseEvent) => {
    if (onDepartmentClick) {
      onDepartmentClick(dept);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-30px' }}
      transition={{
        duration: 0.55,
        delay: (index % 3) * 0.08,
        ease: [0.16, 1, 0.3, 1],
      }}
      className="relative aspect-[4/5] min-h-[440px] sm:min-h-[460px] rounded-2xl overflow-hidden group cursor-pointer border border-amber-500/20 hover:border-amber-400/60 shadow-[0_12px_30px_rgba(0,0,0,0.55)] hover:shadow-[0_0_30px_rgba(212,175,55,0.22)] transition-all duration-500 box-border bg-[#0E0E12]"
      style={{
        WebkitBackdropFilter: 'blur(12px)',
        backdropFilter: 'blur(12px)',
      }}
    >
      <a
        href={dept.href}
        onClick={handleCardClick}
        className="block w-full h-full text-left no-underline select-none"
      >
        {/* Full-Bleed Cover Image with Zoom Effect */}
        <div className="absolute inset-0 w-full h-full overflow-hidden bg-[#121217]">
          <img
            src={dept.image}
            alt={dept.title}
            loading="lazy"
            className="w-full h-full object-cover object-center transform group-hover:scale-105 transition-transform duration-700 ease-out will-change-transform"
          />
        </div>

        {/* High-Contrast Luxury Gradient Overlay */}
        <div
          className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/45 to-transparent pointer-events-none"
          aria-hidden="true"
        />

        {/* Top Floating Row: Badge Tag & Wishlist Button */}
        <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between pointer-events-none">
          {/* Frosted Glass Tag Pill */}
          <span
            className="inline-flex items-center px-3 py-1 rounded-full bg-black/55 border border-amber-400/35 text-amber-200 text-[11px] font-bold uppercase tracking-wider shadow-[0_4px_12px_rgba(0,0,0,0.4)] pointer-events-auto"
            style={{
              WebkitBackdropFilter: 'blur(8px)',
              backdropFilter: 'blur(8px)',
            }}
          >
            {dept.tag}
          </span>

          {/* Frosted Heart Button with Bounce Tap */}
          <motion.button
            type="button"
            onClick={handleWishlistClick}
            whileTap={{ scale: 0.82 }}
            whileHover={{ scale: 1.08 }}
            aria-label={`Save ${dept.title} to Wishlist`}
            className={`w-9 h-9 rounded-full flex items-center justify-center border transition-all duration-300 pointer-events-auto ${
              isFavorited
                ? 'bg-red-500/20 border-red-400/60 text-red-400 shadow-[0_0_14px_rgba(239,68,68,0.4)]'
                : 'bg-black/50 border-white/20 text-white/80 hover:text-white hover:border-amber-400/50 shadow-[0_4px_12px_rgba(0,0,0,0.4)]'
            }`}
            style={{
              WebkitBackdropFilter: 'blur(8px)',
              backdropFilter: 'blur(8px)',
            }}
          >
            <Heart
              className={`w-4 h-4 transition-colors ${
                isFavorited ? 'fill-red-400 text-red-400' : 'text-white'
              }`}
            />
          </motion.button>
        </div>

        {/* Bottom Content: Title, Subtitle, and Gold-Accented Pill CTA */}
        <div className="absolute inset-x-0 bottom-0 z-20 p-5 sm:p-6 flex flex-col justify-end text-left pointer-events-none">
          {/* Department Title */}
          <h3 className="font-serif text-2xl sm:text-[1.65rem] lg:text-[1.75rem] font-extrabold text-white tracking-tight leading-snug group-hover:text-amber-100 transition-colors drop-shadow-[0_2px_8px_rgba(0,0,0,0.7)]">
            {dept.title}
          </h3>

          {/* Subtitle */}
          <p className="text-[#B5ACA3] text-xs sm:text-sm line-clamp-2 leading-relaxed mt-1.5 font-normal drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)]">
            {dept.subtitle}
          </p>

          {/* Action Button with Arrow Slide Micro-Interaction */}
          <div className="mt-4 pointer-events-auto">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold tracking-wider uppercase text-amber-300 bg-amber-400/10 border border-amber-400/30 group-hover:bg-gradient-to-r group-hover:from-amber-300 group-hover:via-amber-400 group-hover:to-amber-600 group-hover:text-[#0A0A0C] group-hover:border-transparent group-hover:shadow-[0_4px_20px_rgba(212,175,55,0.4)] transition-all duration-300">
              <span>{dept.cta.replace(' →', '')}</span>
              <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1.5 transition-transform duration-300" />
            </span>
          </div>
        </div>
      </a>
    </motion.div>
  );
};

/* =========================================================================
   MAIN SHOP BY DEPARTMENT SECTION COMPONENT
   ========================================================================= */

export const ShopByDepartment: React.FC<ShopByDepartmentProps> = ({
  overline = "CURATED FOR EVERYONE",
  headline = "SHOP BY DEPARTMENT",
  subtitle = "Discover boutique collections meticulously curated across high-fashion apparel, heirloom accessories, and elevated everyday essentials.",
  departments = DEFAULT_DEPARTMENTS,
  className = "",
  onDepartmentClick,
  onWishlistToggle,
}) => {
  const [activeSlide, setActiveSlide] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Update active slide indicator based on mobile carousel scroll position
  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const scrollLeft = container.scrollLeft;
    const cardWidth = container.offsetWidth * 0.82;
    const index = Math.round(scrollLeft / (cardWidth + 16));
    const clamped = Math.max(0, Math.min(departments.length - 1, index));
    if (clamped !== activeSlide) {
      setActiveSlide(clamped);
    }
  }, [departments.length, activeSlide]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  // Click on indicator dot to smoothly scroll to that card
  const scrollToCard = (index: number) => {
    const card = cardRefs.current[index];
    if (card && scrollContainerRef.current) {
      card.scrollIntoView({
        behavior: 'smooth',
        inline: 'center',
        block: 'nearest',
      });
      setActiveSlide(index);
    }
  };

  return (
    <section
      className={`relative w-full max-w-full overflow-hidden bg-[#0A0A0C] text-white py-14 sm:py-20 px-4 sm:px-6 lg:px-12 box-border ${className}`}
      aria-labelledby="shop-by-department-heading"
    >
      {/* Ambient Golden Radial Highlights */}
      <div
        className="absolute top-1/4 -left-32 w-96 h-96 bg-[radial-gradient(circle,rgba(212,175,55,0.08)_0%,rgba(10,10,12,0)_70%)] pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute bottom-1/4 -right-32 w-96 h-96 bg-[radial-gradient(circle,rgba(212,175,55,0.08)_0%,rgba(10,10,12,0)_70%)] pointer-events-none"
        aria-hidden="true"
      />

      <div className="relative z-10 w-full max-w-7xl mx-auto">
        {/* ================= HEADER SECTION ================= */}
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-14">
          {/* Overline with Sparkle */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/5 border border-amber-400/30 text-[#D4AF37] text-xs font-bold uppercase tracking-[0.25em] mb-3 shadow-[0_0_12px_rgba(212,175,55,0.15)]"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>{overline}</span>
          </motion.div>

          {/* Main Headline in Serif Luxury Typography */}
          <motion.h2
            id="shop-by-department-heading"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55, delay: 0.08 }}
            className="font-serif text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight text-transparent bg-clip-text bg-gradient-to-b from-white via-[#F5EFEB] to-[#D4AF37]"
          >
            {headline}
          </motion.h2>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55, delay: 0.16 }}
            className="mt-3.5 text-sm sm:text-base text-[#A8A199] leading-relaxed max-w-2xl mx-auto font-normal"
          >
            {subtitle}
          </motion.p>
        </div>

        {/* ================= MOBILE VIEW (< 768px): SNAP CAROUSEL ================= */}
        <div className="block md:hidden w-full max-w-full">
          <div
            ref={scrollContainerRef}
            className="flex overflow-x-auto snap-x snap-mandatory scroll-smooth gap-4 px-4 pb-6 pt-1 -mx-4 box-border"
            style={{
              WebkitOverflowScrolling: 'touch',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
            }}
          >
            {departments.map((dept, index) => (
              <div
                key={dept.id}
                ref={(el) => {
                  cardRefs.current[index] = el;
                }}
                className="w-[82vw] max-w-[340px] flex-shrink-0 snap-center"
              >
                <DepartmentCard
                  dept={dept}
                  index={index}
                  onDepartmentClick={onDepartmentClick}
                  onWishlistToggle={onWishlistToggle}
                />
              </div>
            ))}
          </div>

          {/* Interactive Swipe Indicator Dots / Pills */}
          <div className="flex items-center justify-center gap-1.5 mt-2">
            {departments.map((dept, idx) => (
              <button
                key={`dot-${dept.id}`}
                type="button"
                onClick={() => scrollToCard(idx)}
                aria-label={`Scroll to ${dept.title}`}
                className={`h-2 rounded-full transition-all duration-300 ${
                  activeSlide === idx
                    ? 'w-7 bg-gradient-to-r from-amber-400 to-amber-600 shadow-[0_0_8px_rgba(212,175,55,0.5)]'
                    : 'w-2 bg-white/20 hover:bg-white/40'
                }`}
              />
            ))}
          </div>
        </div>

        {/* ================= TABLET & DESKTOP (≥ 768px): 3-COLUMN GRID ================= */}
        <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {departments.map((dept, index) => (
            <DepartmentCard
              key={dept.id}
              dept={dept}
              index={index}
              onDepartmentClick={onDepartmentClick}
              onWishlistToggle={onWishlistToggle}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default ShopByDepartment;
