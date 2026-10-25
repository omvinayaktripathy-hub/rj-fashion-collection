import React, { useState, useEffect, useRef } from 'react';
import { motion, useMotionValue, useTransform, useSpring } from 'framer-motion';

/**
 * Figma MCP Design Tokens & Theme Palettes
 */
export const LUXURY_DESIGN_TOKENS = {
  colors: {
    midnightCanvas: '#070D1E', // Deep Midnight Royal Blue
    midnightSurface: '#0B1528', // Elevated Midnight Navy Surface
    midnightDock: '#060B18', // Docked Footer & Bottom Bar
    royalNavy: '#0A1128', // Deep Royal Blue Ambient
    goldMetallic: {
      primary: '#D4AF37',
      light: '#DFBF58',
      dark: '#B38728',
      champagne: '#F3E7C4',
      eyebrowText: '#E8C568',
      glow: 'rgba(212, 175, 55, 0.18)',
    },
    crimsonBacking: '#3B0811',
    text: {
      display: '#FFFFFF',
      subtext: '#CBD5E1', // slate-300
      muted: '#94A3B8', // slate-400
    },
  },
  typography: {
    displaySans: "system-ui, -apple-system, BlinkMacSystemFont, 'Plus Jakarta Sans', 'Inter', sans-serif",
    editorialSerif: "'Playfair Display', 'Cormorant Garamond', Georgia, serif",
  },
};

/**
 * Embedded shadcn/ui Badge Variant (Luxury Royal Pill)
 */
export const LuxuryBadge = ({ className = '', children, ...props }) => (
  <div
    className={`border border-[#D4AF37]/40 bg-[#0B1528]/80 text-[#E8C568] px-4 py-1.5 text-[11px] font-medium tracking-[0.25em] uppercase rounded-full backdrop-blur-md inline-flex items-center gap-2 shadow-[0_0_20px_rgba(212,175,55,0.15)] ${className}`}
    {...props}
  >
    {children}
  </div>
);

/**
 * Embedded shadcn/ui Button Variants
 */
export const LuxuryPrimaryButton = ({ className = '', children, ...props }) => (
  <a
    className={`inline-flex items-center justify-center bg-gradient-to-r from-[#D4AF37] via-[#DFBF58] to-[#B38728] text-[#0A1128] font-semibold text-xs tracking-widest px-8 py-4 sm:py-6 rounded-full shadow-lg shadow-[#D4AF37]/20 hover:brightness-110 active:scale-95 transition-all duration-300 ${className}`}
    {...props}
  >
    {children}
  </a>
);

export const LuxurySecondaryButton = ({ className = '', children, ...props }) => (
  <a
    className={`inline-flex items-center justify-center border border-[#D4AF37]/40 bg-white/5 hover:bg-white/10 text-white font-medium text-xs tracking-widest px-8 py-4 sm:py-6 rounded-full backdrop-blur-sm active:scale-95 transition-all duration-300 ${className}`}
    {...props}
  >
    {children}
  </a>
);

/**
 * Production-Ready LuxuryHero Component for RJ Fashion Collection (JSX)
 * Architecture: shadcn/ui primitives + 21st.dev luxury design patterns + Figma MCP design tokens
 */
export const LuxuryHero = ({
  brandName = "RJ FASHION COLLECTION",
  headlineLine1 = "ROYAL WEAVES,",
  headlineLine2 = "Timeless Grace.",
  subtext = "Discover timeless silhouettes, authentic artisanal weaves, and contemporary Indian couture. An exquisite curation by RJ Fashion Collection.",
  primaryCtaText = "EXPLORE COLLECTION →",
  secondaryCtaText = "DISCOVER NEW ARRIVALS",
  primaryCtaLink = "/shop.html",
  secondaryCtaLink = "/shop.html?newArrival=true",
  modelImage = "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1200&q=85",
  vaultThumb = "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=200&q=80",
}) => {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);

  // 1. Mouse Parallax Motion Values
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { damping: 26, stiffness: 120 };
  const smoothMouseX = useSpring(mouseX, springConfig);
  const smoothMouseY = useSpring(mouseY, springConfig);

  const modelRotateX = useTransform(smoothMouseY, [-300, 300], [4, -4]);
  const modelRotateY = useTransform(smoothMouseX, [-300, 300], [-4, 4]);
  const badge1X = useTransform(smoothMouseX, [-300, 300], [-12, 12]);
  const badge1Y = useTransform(smoothMouseY, [-300, 300], [-8, 8]);
  const badge2X = useTransform(smoothMouseX, [-300, 300], [14, -14]);
  const badge2Y = useTransform(smoothMouseY, [-300, 300], [10, -10]);

  const handleMouseMove = (e) => {
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

  // 2. Interactive Ambient Canvas Wave Ribbon (Midnight Royal Blue Canvas)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId;
    let width = (canvas.width = canvas.offsetWidth);
    let height = (canvas.height = canvas.offsetHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
    };
    window.addEventListener('resize', handleResize);

    let step = 0;
    const render = () => {
      step += 0.005;
      ctx.clearRect(0, 0, width, height);

      // Deep Midnight Royal Blue luxury background
      const baseGrad = ctx.createLinearGradient(0, 0, width, height);
      baseGrad.addColorStop(0, '#070D1E');
      baseGrad.addColorStop(0.5, '#0A1128');
      baseGrad.addColorStop(1, '#060B18');
      ctx.fillStyle = baseGrad;
      ctx.fillRect(0, 0, width, height);

      // Ambient Metallic Gold & Champagne Fluid Wave Ribbons
      ctx.beginPath();
      ctx.moveTo(0, height * 0.55);
      for (let x = 0; x <= width; x += 25) {
        const y = height * 0.55 + Math.sin(x * 0.0028 + step) * 24 + Math.cos(x * 0.0055 + step * 1.1) * 12;
        ctx.lineTo(x, y);
      }
      ctx.strokeStyle = 'rgba(212, 175, 55, 0.07)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      animationFrameId = requestAnimationFrame(render);
    };

    render();
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  // 3. Button Click Wave Physics Ripple
  const [ripples, setRipples] = useState([]);
  const createRipple = (e) => {
    const button = e.currentTarget;
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;
    const newRipple = { x, y, size, id: Date.now() };
    setRipples((prev) => [...prev, newRipple]);
    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== newRipple.id));
    }, 600);
  };

  // 4. Staggered Text Animations
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.12, delayChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 18 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] },
    },
  };

  return (
    <section
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative w-full min-h-[85vh] h-[calc(100vh-80px)] max-h-[850px] flex flex-col justify-between overflow-hidden bg-[#070D1E] text-white selection:bg-[#D4AF37] selection:text-[#0A1128] border border-[#D4AF37]/30 rounded-2xl shadow-2xl"
    >
      {/* Background Interactive Ambient Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none z-0"
      />

      {/* 21st.dev Radial Ambient Lighting with Metallic Gold Highlights */}
      <div
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          background: 'radial-gradient(ellipse at 75% 50%, rgba(212,175,55,0.18), transparent 70%)',
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-[#D4AF37]/10 via-transparent to-transparent pointer-events-none z-0" />

      {/* Main Inner Wrapper: 7 / 5 Column Responsive Grid */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center w-full flex-1">
        
        {/* ================= LEFT COLUMN: Editorial Typography & Actions (7 Cols) ================= */}
        <motion.div
          className="lg:col-span-7 flex flex-col items-start text-left"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Eyebrow Badge (shadcn/ui Badge Variant) */}
          <motion.div variants={itemVariants} className="mb-4">
            <LuxuryBadge>
              <span className="text-[#D4AF37] text-xs">✦</span>
              <span>{brandName}</span>
            </LuxuryBadge>
          </motion.div>

          {/* Main Display Heading */}
          <motion.h1
            variants={itemVariants}
            className="flex flex-col tracking-tight leading-[1.08] m-0 mb-3"
          >
            <span className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white uppercase drop-shadow-md">
              {headlineLine1}
            </span>
            <span className="text-4xl sm:text-5xl lg:text-6xl text-[#F3E7C4] italic font-normal drop-shadow-[0_2px_20px_rgba(212,175,55,0.25)] font-serif">
              {headlineLine2}
            </span>
          </motion.h1>

          {/* Supporting Description */}
          <motion.p
            variants={itemVariants}
            className="text-slate-300 text-sm sm:text-base max-w-lg leading-relaxed mt-4 mb-8 font-normal"
          >
            {subtext}
          </motion.p>

          {/* Dual CTAs (shadcn/ui Button Primitives) */}
          <motion.div
            variants={itemVariants}
            className="flex flex-wrap items-center gap-4 pt-1 w-full sm:w-auto"
          >
            <div className="relative">
              <LuxuryPrimaryButton href={primaryCtaLink} onClick={createRipple}>
                <span className="relative z-10">{primaryCtaText}</span>
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
              </LuxuryPrimaryButton>
            </div>

            <LuxurySecondaryButton href={secondaryCtaLink}>
              {secondaryCtaText}
            </LuxurySecondaryButton>
          </motion.div>
        </motion.div>

        {/* ================= RIGHT COLUMN: The Architectural Arch (5 Cols) ================= */}
        <div className="lg:col-span-5 relative flex items-center justify-center">
          
          {/* Ambient Golden Radial Halo */}
          <div className="absolute -inset-8 bg-gradient-to-tr from-[#D4AF37]/25 via-[#DFBF58]/15 to-transparent rounded-full blur-3xl pointer-events-none" />

          {/* Symmetrical Temple Arch Shape Container */}
          <motion.div
            style={{
              rotateX: modelRotateX,
              rotateY: modelRotateY,
              transformStyle: 'preserve-3d',
            }}
            animate={{
              y: [-6, 6, -6],
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="relative w-full aspect-[3/4] max-w-[380px] mx-auto rounded-t-[180px] rounded-b-2xl overflow-visible border border-[#D4AF37]/30 shadow-2xl shadow-black/60 group"
          >
            {/* Deep Crimson/Ruby Inner Photo Mask */}
            <div className="w-full h-full rounded-t-[180px] rounded-b-2xl overflow-hidden bg-[#3B0811] relative">
              <img
                src={modelImage}
                alt="RJ Fashion Collection Model in Zari Banarasi/Kanjivaram Saree"
                className="w-full h-full object-cover object-center transform group-hover:scale-105 transition-transform duration-700 ease-out"
                loading="eager"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#060B18]/85 via-transparent to-transparent pointer-events-none" />
            </div>

            {/* 21st.dev Glassmorphic Floating Micro-Card Top-Right */}
            <motion.div
              style={{ x: badge1X, y: badge1Y }}
              className="absolute -top-3 -right-3 sm:-right-5 bg-[#0B1528]/80 border border-white/15 backdrop-blur-md rounded-xl p-3 shadow-xl flex items-center gap-3 cursor-pointer hover:border-[#D4AF37]/60 transition-colors"
            >
              <img
                src={vaultThumb}
                alt="The Signature Vault - Fine Artisanal Accents"
                className="w-10 h-10 rounded-lg object-cover border border-[#D4AF37]/40"
              />
              <div className="pr-1">
                <p className="text-xs font-bold text-white leading-tight m-0">
                  The Signature Vault
                </p>
                <p className="text-[10px] font-semibold text-[#D4AF37] tracking-wider uppercase mt-0.5 mb-0">
                  Fine Artisanal Accents
                </p>
              </div>
            </motion.div>

            {/* 21st.dev Glassmorphic Floating Micro-Card Bottom-Left */}
            <motion.div
              style={{ x: badge2X, y: badge2Y }}
              className="absolute -bottom-4 -left-3 sm:-left-5 bg-[#0B1528]/80 border border-white/15 backdrop-blur-md rounded-xl p-3 shadow-xl flex items-center gap-3 hover:border-[#D4AF37]/60 transition-colors"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#D4AF37] to-[#8C7326] flex items-center justify-center text-[#0A1128] font-extrabold text-xs shadow-inner">
                ✦
              </div>
              <div>
                <p className="text-xs font-bold text-white leading-tight m-0">
                  100% Certified Authentic
                </p>
                <p className="text-[10px] font-medium text-slate-300 tracking-wide mt-0.5 mb-0">
                  Artisanal Couture & Fine Finishing
                </p>
              </div>
            </motion.div>
          </motion.div>
        </div>

      </div>

      {/* ================= INTEGRATED VALUE STRIP (BOTTOM DOCK) ================= */}
      <div className="relative z-10 bg-[#060B18]/90 backdrop-blur-md border-t border-white/10 py-5 w-full">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-center">
          
          {/* Card 1: 100% Certified Authentic */}
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-[#D4AF37]/10 border border-[#D4AF37]/25 flex items-center justify-center text-[#D4AF37] shrink-0">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            </div>
            <div>
              <h4 className="text-xs font-bold text-white tracking-wide m-0">100% Certified Authentic</h4>
              <p className="text-xs text-slate-400 font-normal m-0 mt-0.5">Pure Kanjivaram Silks & Royal Kundan</p>
            </div>
          </div>

          {/* Card 2: Complimentary Shipping */}
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-[#D4AF37]/10 border border-[#D4AF37]/25 flex items-center justify-center text-[#D4AF37] shrink-0">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="1" y="3" width="15" height="13" />
                <polygon points="16 8 20 8 23 11 23 16 16 8" />
                <circle cx="5.5" cy="18.5" r="2.5" />
                <circle cx="18.5" cy="18.5" r="2.5" />
              </svg>
            </div>
            <div>
              <h4 className="text-xs font-bold text-white tracking-wide m-0">Complimentary Shipping</h4>
              <p className="text-xs text-slate-400 font-normal m-0 mt-0.5">Pan-India express delivery on orders above ₹999</p>
            </div>
          </div>

          {/* Card 3: Secure Checkout */}
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-[#D4AF37]/10 border border-[#D4AF37]/25 flex items-center justify-center text-[#D4AF37] shrink-0">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <div>
              <h4 className="text-xs font-bold text-white tracking-wide m-0">Secure Checkout</h4>
              <p className="text-xs text-slate-400 font-normal m-0 mt-0.5">Direct UPI, Net Banking, Cards & Verified Gateway</p>
            </div>
          </div>

          {/* Card 4: Boutique Concierge */}
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-[#D4AF37]/10 border border-[#D4AF37]/25 flex items-center justify-center text-[#D4AF37] shrink-0">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <div>
              <h4 className="text-xs font-bold text-white tracking-wide m-0">Boutique Concierge</h4>
              <p className="text-xs text-slate-400 font-normal m-0 mt-0.5">Personal styling & order assistance via WhatsApp</p>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default LuxuryHero;
