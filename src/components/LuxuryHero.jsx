import React, { useState, useEffect, useRef } from 'react';
import { motion, useMotionValue, useTransform, useSpring } from 'framer-motion';

/**
 * LuxuryHero Component for RJ Fashion Collection
 * Inspired by ultra-luxury Indian couture (Sabyasachi, Manish Malhotra, Raw Mango)
 * 
 * Tech Stack: React, Tailwind CSS, Framer Motion
 */
export default function LuxuryHero({
  brandName = "RJ FASHION COLLECTION",
  headlineLine1 = "ROYAL WEAVES,",
  headlineLine2 = "Timeless Grace.",
  subtext = "Discover timeless silhouettes, authentic artisanal weaves, and contemporary Indian couture. An exquisite curation by RJ Fashion Collection.",
  primaryCtaText = "EXPLORE COLLECTION →",
  secondaryCtaText = "DISCOVER NEW ARRIVALS",
  primaryCtaLink = "/shop.html",
  secondaryCtaLink = "/shop.html?newArrival=true",
  modelImage = "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1200&q=85",
  kundanThumb = "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=200&q=80",
}) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  // 1. Mouse Parallax Motion Values
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { damping: 25, stiffness: 120 };
  const smoothMouseX = useSpring(mouseX, springConfig);
  const smoothMouseY = useSpring(mouseY, springConfig);

  // 3D Tilt and Parallax Shifts
  const modelRotateX = useTransform(smoothMouseY, [-300, 300], [5, -5]);
  const modelRotateY = useTransform(smoothMouseX, [-300, 300], [-5, 5]);
  const badge1X = useTransform(smoothMouseX, [-300, 300], [-14, 14]);
  const badge1Y = useTransform(smoothMouseY, [-300, 300], [-10, 10]);
  const badge2X = useTransform(smoothMouseX, [-300, 300], [16, -16]);
  const badge2Y = useTransform(smoothMouseY, [-300, 300], [14, -14]);

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

  // 2. Interactive Fluid Ambient Wave Canvas Background
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
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

      // Deep dark royal obsidian background
      const baseGrad = ctx.createLinearGradient(0, 0, width, height);
      baseGrad.addColorStop(0, '#0C0A09');
      baseGrad.addColorStop(0.5, '#16120E');
      baseGrad.addColorStop(1, '#0C0A09');
      ctx.fillStyle = baseGrad;
      ctx.fillRect(0, 0, width, height);

      // Ambient Glowing Fluid Orbs (Champagne & Golden Brass Pulses)
      const orb1X = width * 0.72 + Math.sin(step) * 50;
      const orb1Y = height * 0.40 + Math.cos(step * 0.8) * 40;
      const grad1 = ctx.createRadialGradient(orb1X, orb1Y, 10, orb1X, orb1Y, Math.min(width * 0.45, 420));
      grad1.addColorStop(0, 'rgba(212, 175, 55, 0.20)');
      grad1.addColorStop(0.5, 'rgba(180, 83, 9, 0.10)');
      grad1.addColorStop(1, 'rgba(12, 10, 9, 0)');
      ctx.fillStyle = grad1;
      ctx.beginPath();
      ctx.arc(orb1X, orb1Y, Math.min(width * 0.45, 420), 0, Math.PI * 2);
      ctx.fill();

      // Fluid Wave Ribbons
      ctx.beginPath();
      ctx.moveTo(0, height * 0.58);
      for (let x = 0; x <= width; x += 25) {
        const y = height * 0.58 + Math.sin(x * 0.0028 + step) * 26 + Math.cos(x * 0.0055 + step * 1.1) * 14;
        ctx.lineTo(x, y);
      }
      ctx.strokeStyle = 'rgba(212, 175, 55, 0.08)';
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

  // 3. Button Click Ripple Effect
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

  // 4. Staggered Text Reveal Animations
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.12, delayChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
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
      className="relative w-full min-h-[85vh] lg:min-h-[680px] flex flex-col justify-between overflow-hidden bg-gradient-to-b from-[#0C0A09] via-[#16120E] to-[#0C0A09] text-white selection:bg-[#d4af37] selection:text-black border border-amber-500/20 rounded-2xl shadow-2xl"
    >
      {/* Background Interactive Canvas Mesh */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none z-0"
      />

      {/* Warm Amber Halo Backlight */}
      <div className="absolute top-1/4 right-[15%] w-96 h-96 bg-amber-600/15 rounded-full blur-3xl pointer-events-none z-0" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(0,0,0,0)_0%,rgba(12,10,9,0.75)_100%)] pointer-events-none z-0" />

      {/* Main Content Grid (Split 2-Column Responsive Layout) */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 lg:px-12 pt-12 pb-6 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center flex-1">
        
        {/* ================= LEFT COLUMN: Editorial Typography & CTAs ================= */}
        <motion.div
          className="lg:col-span-7 flex flex-col items-start text-left space-y-5"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Eyebrow Pill Tag with Gold Hairline Border */}
          <motion.div
            variants={itemVariants}
            className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white/[0.04] border border-[#D4AF37]/45 backdrop-blur-md shadow-[0_0_15px_rgba(212,175,55,0.15)]"
          >
            <span className="text-[#D4AF37] text-xs">✦</span>
            <span className="text-xs font-bold tracking-[0.25em] text-[#D4AF37] uppercase">
              ✦ {brandName}
            </span>
          </motion.div>

          {/* Grand Headline (2-Line Composition) */}
          <motion.h1
            variants={itemVariants}
            className="flex flex-col tracking-tight leading-[1.08] m-0"
          >
            <span className="font-sans font-extrabold text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-white tracking-wide uppercase drop-shadow-md">
              {headlineLine1}
            </span>
            <span className="font-serif italic font-medium text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-[#FBF8F3] drop-shadow-[0_2px_20px_rgba(212,175,55,0.25)]">
              {headlineLine2}
            </span>
          </motion.h1>

          {/* Curated Subtext */}
          <motion.p
            variants={itemVariants}
            className="text-neutral-400 text-sm md:text-base max-w-lg leading-relaxed mt-2 mb-6 font-normal"
          >
            {subtext}
          </motion.p>

          {/* Dual Luxury Action CTAs */}
          <motion.div
            variants={itemVariants}
            className="flex flex-wrap items-center gap-4 pt-2 w-full sm:w-auto"
          >
            {/* Primary CTA with Metallic Gold Gradient */}
            <a
              href={primaryCtaLink}
              onClick={createRipple}
              className="relative overflow-hidden inline-flex items-center justify-center px-8 py-4 rounded-full text-xs font-semibold tracking-wider text-black bg-gradient-to-r from-[#D4AF37] to-[#AA7C11] shadow-lg shadow-amber-900/30 hover:scale-105 active:scale-95 transition-all duration-300"
            >
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
            </a>

            {/* Secondary Translucent Glass CTA */}
            <a
              href={secondaryCtaLink}
              className="inline-flex items-center justify-center px-8 py-4 rounded-full text-xs font-medium tracking-wider text-[#FBF8F3] border border-[#D4AF37]/40 hover:bg-white/5 backdrop-blur-md transition-all duration-300 hover:border-[#D4AF37]"
            >
              {secondaryCtaText}
            </a>
          </motion.div>
        </motion.div>

        {/* ================= RIGHT COLUMN: Architectural Couture Showcase ================= */}
        <div className="lg:col-span-5 relative flex items-center justify-center pt-6 lg:pt-0">
          
          {/* Ambient Golden Halo Backlight */}
          <div className="absolute -inset-6 bg-gradient-to-tr from-[#D4AF37]/25 via-amber-600/15 to-transparent rounded-full blur-3xl pointer-events-none" />

          {/* Grand Royal Temple Arch Container */}
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
            className="relative w-full max-w-[340px] sm:max-w-[380px] lg:max-w-[420px] aspect-[3/4] rounded-t-[160px] rounded-b-2xl overflow-visible border border-amber-500/25 shadow-[0_20px_50px_rgba(0,0,0,0.85)] group"
          >
            {/* Inner Arched Mask with Deep Red Crimson Backing */}
            <div className="w-full h-full rounded-t-[160px] rounded-b-2xl overflow-hidden bg-[#3B0811] relative">
              <img
                src={modelImage}
                alt="RJ Fashion Collection Haute Couture Model in Banarasi Zari Saree"
                className="w-full h-full object-cover object-center transform group-hover:scale-105 transition-transform duration-700 ease-out"
                loading="eager"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0C0A09]/80 via-transparent to-transparent pointer-events-none" />
            </div>

            {/* Floating Micro-Badge #1: The Signature Vault (Top Right) */}
            <motion.div
              style={{ x: badge1X, y: badge1Y }}
              className="absolute -top-4 -right-4 sm:-right-6 flex items-center gap-3 p-2.5 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 shadow-xl cursor-pointer hover:border-[#D4AF37]/60 transition-colors"
            >
              <img
                src={kundanThumb}
                alt="The Signature Vault - Fine Artisanal Accents"
                className="w-10 h-10 rounded-lg object-cover border border-[#D4AF37]/40"
              />
              <div className="pr-1">
                <p className="text-xs font-bold text-[#FBF8F3] leading-tight m-0">
                  The Signature Vault
                </p>
                <p className="text-[10px] font-semibold text-[#D4AF37] tracking-wider uppercase mt-0.5 mb-0">
                  Fine Artisanal Accents
                </p>
              </div>
            </motion.div>

            {/* Floating Micro-Badge #2: 100% Certified Authentic (Bottom Left) */}
            <motion.div
              style={{ x: badge2X, y: badge2Y }}
              className="absolute -bottom-5 -left-4 sm:-left-6 flex items-center gap-3 p-2.5 px-3.5 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 shadow-xl hover:border-[#D4AF37]/60 transition-colors"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#D4AF37] to-[#8C7326] flex items-center justify-center text-black font-extrabold text-xs shadow-inner">
                ✦
              </div>
              <div>
                <p className="text-xs font-bold text-[#FBF8F3] leading-tight m-0">
                  100% Certified Authentic
                </p>
                <p className="text-[10px] font-medium text-[#C5A880] tracking-wide mt-0.5 mb-0">
                  Artisanal Couture & Fine Finishing
                </p>
              </div>
            </motion.div>
          </motion.div>
        </div>

      </div>

      {/* ================= INTEGRATED VALUE PROPOSITION BAR ================= */}
      <div className="relative z-10 w-full bg-white/[0.03] backdrop-blur-md border-t border-white/10 py-5 px-6 lg:px-12 mt-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-center">
          
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-[#D4AF37]/10 border border-[#D4AF37]/25 flex items-center justify-center text-[#D4AF37] shrink-0">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path></svg>
            </div>
            <div>
              <h4 className="text-xs font-bold text-white tracking-wide m-0">100% Certified Authentic</h4>
              <p className="text-[11px] text-[#C5A880] font-normal m-0 mt-0.5">Pure Kanjivaram Silks & Royal Kundan</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-[#D4AF37]/10 border border-[#D4AF37]/25 flex items-center justify-center text-[#D4AF37] shrink-0">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg>
            </div>
            <div>
              <h4 className="text-xs font-bold text-white tracking-wide m-0">Complimentary Shipping</h4>
              <p className="text-[11px] text-[#C5A880] font-normal m-0 mt-0.5">Pan-India express delivery on orders above ₹999</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-[#D4AF37]/10 border border-[#D4AF37]/25 flex items-center justify-center text-[#D4AF37] shrink-0">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
            </div>
            <div>
              <h4 className="text-xs font-bold text-white tracking-wide m-0">Secure Checkout</h4>
              <p className="text-[11px] text-[#C5A880] font-normal m-0 mt-0.5">Direct UPI, Net Banking, Cards & Gateway</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-[#D4AF37]/10 border border-[#D4AF37]/25 flex items-center justify-center text-[#D4AF37] shrink-0">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
            </div>
            <div>
              <h4 className="text-xs font-bold text-white tracking-wide m-0">Boutique Concierge</h4>
              <p className="text-[11px] text-[#C5A880] font-normal m-0 mt-0.5">Personal styling assistance via WhatsApp</p>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
