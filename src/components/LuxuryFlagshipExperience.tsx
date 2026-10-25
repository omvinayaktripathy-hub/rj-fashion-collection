import React, { useState, useEffect, useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Truck,
  Lock,
  MessageCircle,
  Gem,
  Award,
} from 'lucide-react';

/* =========================================================================
   TYPE DEFINITIONS
   ========================================================================= */

export interface HeroSectionProps {
  brandBadge?: string;
  headline?: string;
  subtext?: string;
  primaryCtaText?: string;
  primaryCtaLink?: string;
  secondaryCtaText?: string;
  secondaryCtaLink?: string;
  modelImageUrl?: string;
  signatureVaultThumbUrl?: string;
}

export interface PromotionalBannerProps {
  badge?: string;
  heading?: string;
  bodyCopy?: string;
  targetDate?: string | null;
  initialDays?: number;
  initialHours?: number;
  initialMins?: number;
  initialSecs?: number;
}

export interface TrustBadgeItem {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}

export interface LuxuryFlagshipExperienceProps {
  heroProps?: HeroSectionProps;
  promoProps?: PromotionalBannerProps;
  trustBadges?: TrustBadgeItem[];
}

interface Ripple {
  x: number;
  y: number;
  size: number;
  id: number;
}

/* =========================================================================
   PART 1: HERO SECTION
   ========================================================================= */

export const HeroSection: React.FC<HeroSectionProps> = ({
  brandBadge = "✨ RJ FASHION COLLECTION",
  headline = "STYLE THAT SPEAKS WITHOUT WORDS",
  subtext = "Discover timeless silhouettes, authentic artisanal weaves, and contemporary Indian couture. An exquisite curation by RJ Fashion Collection.",
  primaryCtaText = "EXPLORE COLLECTION →",
  primaryCtaLink = "/shop.html",
  secondaryCtaText = "DISCOVER NEW ARRIVALS",
  secondaryCtaLink = "/shop.html?newArrival=true",
  modelImageUrl = "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1200&q=85",
  signatureVaultThumbUrl = "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=200&q=80",
}) => {
  const containerRef = useRef<HTMLElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [ripples, setRipples] = useState<Ripple[]>([]);

  // 3D Parallax Tracking
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springConfig = { damping: 25, stiffness: 120 };
  const smoothMouseX = useSpring(mouseX, springConfig);
  const smoothMouseY = useSpring(mouseY, springConfig);

  const modelRotateX = useTransform(smoothMouseY, [-250, 250], [5, -5]);
  const modelRotateY = useTransform(smoothMouseX, [-250, 250], [-5, 5]);
  const badge1X = useTransform(smoothMouseX, [-250, 250], [-14, 14]);
  const badge1Y = useTransform(smoothMouseY, [-250, 250], [-10, 10]);
  const badge2X = useTransform(smoothMouseX, [-250, 250], [16, -16]);
  const badge2Y = useTransform(smoothMouseY, [-250, 250], [14, -14]);

  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    mouseX.set(e.clientX - centerX);
    mouseY.set(e.clientY - centerY);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  // Click Ripple for Primary CTA
  const handlePrimaryClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const newRipple: Ripple = {
      x: e.clientX - rect.left - size / 2,
      y: e.clientY - rect.top - size / 2,
      size,
      id: Date.now(),
    };
    setRipples((prev) => [...prev, newRipple]);
    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== newRipple.id));
    }, 600);
  };

  // Ambient Pulsing Fluid Canvas Mesh
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = canvas.offsetWidth);
    let height = (canvas.height = canvas.offsetHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
    };
    window.addEventListener('resize', handleResize, { passive: true });

    let step = 0;
    const render = () => {
      step += 0.005;
      ctx.clearRect(0, 0, width, height);

      // Deep Obsidian Palette
      const baseGrad = ctx.createLinearGradient(0, 0, width, height);
      baseGrad.addColorStop(0, '#0A0A0C');
      baseGrad.addColorStop(0.5, '#121217');
      baseGrad.addColorStop(1, '#08080A');
      ctx.fillStyle = baseGrad;
      ctx.fillRect(0, 0, width, height);

      // Subtle Champagne Gold Radial Highlight Orbs
      const orb1X = width * 0.72 + Math.sin(step) * 45;
      const orb1Y = height * 0.42 + Math.cos(step * 0.8) * 35;
      const grad1 = ctx.createRadialGradient(orb1X, orb1Y, 10, orb1X, orb1Y, Math.min(width * 0.45, 420));
      grad1.addColorStop(0, 'rgba(212, 175, 55, 0.18)');
      grad1.addColorStop(0.5, 'rgba(197, 168, 128, 0.07)');
      grad1.addColorStop(1, 'rgba(10, 10, 12, 0)');
      ctx.fillStyle = grad1;
      ctx.beginPath();
      ctx.arc(orb1X, orb1Y, Math.min(width * 0.45, 420), 0, Math.PI * 2);
      ctx.fill();

      const orb2X = width * 0.22 + Math.cos(step * 0.7) * 50;
      const orb2Y = height * 0.68 + Math.sin(step * 0.9) * 40;
      const grad2 = ctx.createRadialGradient(orb2X, orb2Y, 10, orb2X, orb2Y, Math.min(width * 0.4, 360));
      grad2.addColorStop(0, 'rgba(212, 175, 55, 0.14)');
      grad2.addColorStop(0.6, 'rgba(197, 168, 128, 0.05)');
      grad2.addColorStop(1, 'rgba(10, 10, 12, 0)');
      ctx.fillStyle = grad2;
      ctx.beginPath();
      ctx.arc(orb2X, orb2Y, Math.min(width * 0.4, 360), 0, Math.PI * 2);
      ctx.fill();

      // Fluid Wave Pulsing Ribbon
      ctx.beginPath();
      ctx.moveTo(0, height * 0.58);
      for (let x = 0; x <= width; x += 25) {
        const y = height * 0.58 + Math.sin(x * 0.0028 + step) * 24 + Math.cos(x * 0.0055 + step * 1.1) * 12;
        ctx.lineTo(x, y);
      }
      ctx.strokeStyle = 'rgba(212, 175, 55, 0.07)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      animId = requestAnimationFrame(render);
    };
    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animId);
    };
  }, []);

  // Staggered Text Reveal Variants
  const headlineWords = headline.split(' ');
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08, delayChildren: 0.15 },
    },
  };
  const wordVariants = {
    hidden: { opacity: 0, y: 24 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
    },
  };

  return (
    <section
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative w-full min-h-[86vh] flex items-center justify-center overflow-hidden bg-[#0A0A0C] text-white px-4 sm:px-6 lg:px-12 py-12 lg:py-20 rounded-2xl shadow-[0_25px_60px_rgba(0,0,0,0.6)] box-border"
    >
      {/* Ambient Pulsating Fluid Mesh Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none z-0"
        aria-hidden="true"
      />
      {/* Champagne Radial Vignette */}
      <div
        className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(0,0,0,0)_0%,rgba(10,10,12,0.7)_100%)] pointer-events-none z-0"
        aria-hidden="true"
      />

      <div className="relative z-10 w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
        {/* ================= LEFT COLUMN ================= */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="lg:col-span-7 flex flex-col items-center lg:items-start text-center lg:text-left will-change-transform"
        >
          {/* Frosted Glass Pill Tag */}
          <motion.div
            variants={wordVariants}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-amber-400/30 text-amber-200/90 text-xs sm:text-sm font-semibold tracking-wider uppercase backdrop-blur-md mb-5 shadow-[0_0_16px_rgba(212,175,55,0.15)]"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>{brandBadge}</span>
          </motion.div>

          {/* Staggered Line/Word Reveal Headline */}
          <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.08] mb-5 bg-gradient-to-b from-white via-[#F5EFEB] to-[#D4AF37] bg-clip-text text-transparent flex flex-wrap justify-center lg:justify-start gap-x-3 gap-y-1">
            {headlineWords.map((word, index) => (
              <motion.span
                key={`${word}-${index}`}
                variants={wordVariants}
                className="inline-block"
              >
                {word}
              </motion.span>
            ))}
          </h1>

          {/* Subtext */}
          <motion.p
            variants={wordVariants}
            className="text-[#A8A199] text-base sm:text-lg leading-relaxed max-w-xl mb-8 font-normal"
          >
            {subtext}
          </motion.p>

          {/* CTAs */}
          <motion.div
            variants={wordVariants}
            className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto"
          >
            {/* Primary CTA */}
            <a
              href={primaryCtaLink}
              onClick={handlePrimaryClick}
              className="relative overflow-hidden w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-xl text-sm sm:text-base font-extrabold tracking-wider text-[#0A0A0C] bg-gradient-to-r from-amber-300 via-amber-400 to-amber-600 shadow-[0_4px_24px_rgba(212,175,55,0.35)] hover:shadow-[0_0_25px_rgba(212,175,55,0.4)] active:scale-98 transition-all duration-300 min-h-[48px]"
            >
              <span className="relative z-10">{primaryCtaText}</span>
              <ArrowRight className="w-4 h-4 relative z-10" />

              {/* Click Ripple */}
              {ripples.map((ripple) => (
                <span
                  key={ripple.id}
                  style={{
                    top: ripple.y,
                    left: ripple.x,
                    width: ripple.size,
                    height: ripple.size,
                  }}
                  className="absolute rounded-full bg-white/40 pointer-events-none animate-ping opacity-60"
                />
              ))}
            </a>

            {/* Secondary CTA */}
            <a
              href={secondaryCtaLink}
              className="w-full sm:w-auto inline-flex items-center justify-center px-7 py-4 rounded-xl text-sm sm:text-base font-semibold text-[#f0e7db] bg-white/[0.04] border border-amber-400/40 hover:border-amber-400 hover:text-amber-300 hover:bg-white/[0.08] backdrop-blur-lg transition-all duration-300 min-h-[48px]"
            >
              <span>{secondaryCtaText}</span>
            </a>
          </motion.div>
        </motion.div>

        {/* ================= RIGHT COLUMN: MODEL SHOWCASE ================= */}
        <div className="lg:col-span-5 relative flex items-center justify-center pt-8 lg:pt-0 will-change-transform">
          {/* Subtle Ambient Backlight Glow */}
          <div className="absolute -inset-4 bg-gradient-to-tr from-[#d4af37]/25 via-[#c5a880]/12 to-transparent rounded-full blur-3xl pointer-events-none" />

          {/* Arched Portrait Frame with Continuous Levitation */}
          <motion.div
            style={{
              rotateX: modelRotateX,
              rotateY: modelRotateY,
              transformStyle: 'preserve-3d',
            }}
            animate={{
              y: [-8, 8, -8],
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="relative w-full max-w-[340px] sm:max-w-[400px] aspect-[3/4] rounded-[2.5rem] border border-amber-400/40 shadow-[0_25px_60px_rgba(0,0,0,0.8),0_0_30px_rgba(212,175,55,0.18)] group"
          >
            {/* Inner Mask for High-Resolution Imagery */}
            <div className="w-full h-full rounded-[2.5rem] overflow-hidden bg-[#181615] relative">
              <img
                src={modelImageUrl}
                alt="RJ Fashion Collection Festive Couture Model"
                className="w-full h-full object-cover object-center transform group-hover:scale-105 transition-transform duration-700 ease-out"
                loading="eager"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0C]/80 via-transparent to-transparent pointer-events-none" />
            </div>

            {/* Glassmorphic Badge #1: The Signature Vault (Top Right) */}
            <motion.div
              style={{ x: badge1X, y: badge1Y }}
              className="absolute -top-4 -right-4 sm:-right-6 flex items-center gap-3 p-2.5 sm:px-4 sm:py-2.5 rounded-2xl bg-[#141211]/85 backdrop-blur-xl border border-amber-400/45 shadow-[0_12px_32px_rgba(0,0,0,0.55)] cursor-pointer hover:border-amber-400 transition-colors"
            >
              <img
                src={signatureVaultThumbUrl}
                alt="The Signature Vault - Fine Artisanal Accents"
                className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl object-cover border border-amber-400/40"
              />
              <div className="pr-1">
                <p className="text-xs sm:text-sm font-bold text-[#f7f2ea] leading-tight">
                  The Signature Vault
                </p>
                <p className="text-[10px] sm:text-xs font-semibold text-amber-300 tracking-wider uppercase mt-0.5">
                  Fine Artisanal Accents
                </p>
              </div>
            </motion.div>

            {/* Glassmorphic Badge #2: 100% Certified Authentic (Bottom Left) */}
            <motion.div
              style={{ x: badge2X, y: badge2Y }}
              className="absolute -bottom-5 -left-4 sm:-left-6 flex items-center gap-3 px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-2xl bg-[#141211]/85 backdrop-blur-xl border border-white/20 shadow-[0_12px_32px_rgba(0,0,0,0.55)] hover:border-amber-400/60 transition-colors"
            >
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-700 flex items-center justify-center text-[#0A0A0C] font-extrabold text-sm shadow-inner">
                <ShieldCheck className="w-5 h-5 text-[#0A0A0C]" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-bold text-white leading-tight">
                  100% Certified Authentic
                </p>
                <p className="text-[10px] sm:text-xs font-medium text-amber-200/80 tracking-wide mt-0.5">
                  Artisanal Couture & Fine Finishing
                </p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

/* =========================================================================
   PART 2: PROMOTIONAL COUNTDOWN BANNER & TRUST BADGES ROW
   ========================================================================= */

const DEFAULT_TRUST_BADGES: TrustBadgeItem[] = [
  {
    id: 'authentic',
    title: '100% Certified Authentic',
    description: 'Pure Kanjivaram Silks & Royal Kundan',
    icon: <ShieldCheck className="w-5 h-5 text-amber-400" />,
  },
  {
    id: 'shipping',
    title: 'Complimentary Shipping',
    description: 'Pan-India express delivery on orders above ₹999',
    icon: <Truck className="w-5 h-5 text-amber-400" />,
  },
  {
    id: 'security',
    title: 'Secure Checkout',
    description: 'Direct UPI, Net Banking, Cards & Verified Gateway',
    icon: <Lock className="w-5 h-5 text-amber-400" />,
  },
  {
    id: 'concierge',
    title: 'Boutique Concierge',
    description: 'Personal styling & order assistance via WhatsApp',
    icon: <MessageCircle className="w-5 h-5 text-amber-400" />,
  },
];

export const PromotionalCountdownBanner: React.FC<
  PromotionalBannerProps & { trustBadges?: TrustBadgeItem[] }
> = ({
  badge = "INAUGURAL CELEBRATION PRIVILEGE",
  heading = "The Grand Opening Campaign",
  bodyCopy = "Celebrate our official launch with complimentary express shipping on all orders above ₹999. Use promotional code at checkout for an exclusive 10% Inaugural Privilege.",
  targetDate = null,
  initialDays = 18,
  initialHours = 9,
  initialMins = 42,
  initialSecs = 30,
  trustBadges = DEFAULT_TRUST_BADGES,
}) => {
  const [timeLeft, setTimeLeft] = useState({
    days: initialDays,
    hours: initialHours,
    minutes: initialMins,
    seconds: initialSecs,
  });

  // Real-time Countdown Timer Hook
  useEffect(() => {
    const target = targetDate
      ? new Date(targetDate).getTime()
      : Date.now() + (initialDays * 86400 + initialHours * 3600 + initialMins * 60 + initialSecs) * 1000;

    const timer = setInterval(() => {
      const now = Date.now();
      const diff = Math.max(0, target - now);

      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate, initialDays, initialHours, initialMins, initialSecs]);

  const countdownUnits = [
    { label: 'DAYS', value: String(timeLeft.days).padStart(2, '0') },
    { label: 'HOURS', value: String(timeLeft.hours).padStart(2, '0') },
    { label: 'MINS', value: String(timeLeft.minutes).padStart(2, '0') },
    { label: 'SECS', value: String(timeLeft.seconds).padStart(2, '0') },
  ];

  return (
    <div className="w-full max-w-7xl mx-auto my-10 space-y-6">
      {/* 1. Main Obsidian Card Architecture with Iridescent Linear Gold Border */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-40px' }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative rounded-2xl bg-[#0A0A0C] p-6 sm:p-8 lg:p-9 border border-amber-500/30 hover:border-amber-400/60 shadow-[0_16px_40px_rgba(0,0,0,0.65),inset_0_0_24px_rgba(212,175,55,0.05)] transition-colors duration-300 backdrop-blur-md overflow-hidden"
        style={{
          background: 'linear-gradient(#0A0A0C, #0A0A0C) padding-box, linear-gradient(135deg, rgba(212,175,55,0.65), rgba(197,168,128,0.15), rgba(212,175,55,0.55)) border-box',
          border: '1.5px solid transparent',
        }}
      >
        {/* Subtle Ambient Gold Radial Glow */}
        <div className="absolute -top-16 -right-16 w-72 h-72 bg-gradient-to-br from-amber-400/15 via-amber-200/5 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Editorial Content */}
          <div className="lg:col-span-7 flex flex-col items-start text-left">
            <span className="inline-block text-xs font-bold uppercase tracking-[0.2em] text-amber-400/90 mb-3 bg-amber-400/10 border border-amber-400/30 px-3.5 py-1 rounded-full">
              {badge}
            </span>

            <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight leading-tight mb-3">
              {heading}
            </h2>

            <p className="text-[#A8A199] text-sm sm:text-base leading-relaxed max-w-2xl font-normal">
              {bodyCopy}
            </p>
          </div>

          {/* Interactive Digital Countdown Timer */}
          <div className="lg:col-span-5 flex items-center justify-start lg:justify-end w-full">
            <div className="grid grid-cols-4 gap-2.5 sm:gap-3.5 w-full max-w-md">
              {countdownUnits.map((unit) => (
                <div
                  key={unit.label}
                  className="flex flex-col items-center justify-center py-3.5 sm:py-4 px-2 rounded-xl bg-black/60 border border-white/5 backdrop-blur-md shadow-[0_8px_20px_rgba(0,0,0,0.45),inset_0_1px_1px_rgba(255,255,255,0.08)] hover:border-amber-400/40 transition-colors"
                >
                  {/* Glowing Metallic Digits */}
                  <span className="font-serif text-2xl sm:text-3xl lg:text-4xl font-extrabold leading-none text-amber-300 drop-shadow-[0_0_12px_rgba(212,175,55,0.4)]">
                    {unit.value}
                  </span>
                  {/* Warm-Gray Tracked Unit Label */}
                  <span className="text-[10px] sm:text-xs font-bold text-[#A8A199] tracking-widest uppercase mt-1.5 opacity-90">
                    {unit.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.section>

      {/* 2. Trust Badges Row (Below Timer) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {trustBadges.map((badgeItem, idx) => (
          <motion.div
            key={badgeItem.id}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: idx * 0.08 }}
            className="flex items-center gap-3.5 p-4 rounded-xl bg-white/[0.03] border border-white/10 hover:border-amber-400/40 backdrop-blur-md transition-all duration-300 group shadow-sm hover:shadow-[0_4px_20px_rgba(0,0,0,0.3)]"
          >
            <div className="w-10 h-10 rounded-lg bg-amber-400/10 border border-amber-400/25 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              {badgeItem.icon}
            </div>
            <div className="min-w-0">
              <h4 className="text-xs sm:text-sm font-bold text-white truncate leading-snug">
                {badgeItem.title}
              </h4>
              <p className="text-[11px] sm:text-xs text-[#A8A199] truncate mt-0.5 leading-snug">
                {badgeItem.description}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

/* =========================================================================
   MASTER EXPORT: LUXURY FLAGSHIP EXPERIENCE
   ========================================================================= */

export const LuxuryFlagshipExperience: React.FC<LuxuryFlagshipExperienceProps> = ({
  heroProps,
  promoProps,
  trustBadges,
}) => {
  return (
    <div className="w-full min-h-screen bg-[#0A0A0C] text-white selection:bg-amber-400 selection:text-black py-4 px-2 sm:px-4">
      {/* Part 1: Hero Section */}
      <HeroSection {...heroProps} />

      {/* Part 2: Promotional Countdown Banner & Trust Badges */}
      <PromotionalCountdownBanner {...promoProps} trustBadges={trustBadges} />
    </div>
  );
};

export default LuxuryFlagshipExperience;
