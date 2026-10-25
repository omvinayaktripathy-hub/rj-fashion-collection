import React, { useState, useEffect, useRef } from 'react';
import { motion, useMotionValue, useTransform, useSpring } from 'framer-motion';

/**
 * LuxuryHero Component for RJ Fashion Collection
 * 
 * Tech Stack: React, Tailwind CSS, Framer Motion
 * 
 * Features:
 * 1. Deep luxury dark aesthetic (#0d0d0f to #121217) with ambient glowing canvas mesh wave.
 * 2. Left column with staged editorial typography reveals, pill tag, and ripple action buttons.
 * 3. Right column with arched luxury frame, floating physics, and glassmorphic badge overlays.
 * 4. Responsive split layout with 3D mouse parallax tracking.
 */
export default function LuxuryHero({
  brandName = "RJ FASHION COLLECTION",
  headline = "STYLE THAT SPEAKS WITHOUT WORDS",
  subtext = "Curated contemporary ethnic wear, trendy fashion, and modern statement accessories.",
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
  const badge1X = useTransform(smoothMouseX, [-300, 300], [-15, 15]);
  const badge1Y = useTransform(smoothMouseY, [-300, 300], [-12, 12]);
  const badge2X = useTransform(smoothMouseX, [-300, 300], [18, -18]);
  const badge2Y = useTransform(smoothMouseY, [-300, 300], [15, -15]);

  // Handle Mouse Move over Hero Container
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
      step += 0.006;
      ctx.clearRect(0, 0, width, height);

      // Deep dark background
      const baseGrad = ctx.createLinearGradient(0, 0, width, height);
      baseGrad.addColorStop(0, '#0A0A0C');
      baseGrad.addColorStop(0.5, '#121217');
      baseGrad.addColorStop(1, '#0a0a0c');
      ctx.fillStyle = baseGrad;
      ctx.fillRect(0, 0, width, height);

      // Ambient Glowing Fluid Orbs (Champagne & Golden Brass Pulses)
      const orb1X = width * 0.7 + Math.sin(step) * 60;
      const orb1Y = height * 0.4 + Math.cos(step * 0.8) * 50;
      const grad1 = ctx.createRadialGradient(orb1X, orb1Y, 10, orb1X, orb1Y, 380);
      grad1.addColorStop(0, 'rgba(212, 175, 55, 0.16)');
      grad1.addColorStop(0.5, 'rgba(197, 168, 128, 0.08)');
      grad1.addColorStop(1, 'rgba(13, 13, 15, 0)');
      ctx.fillStyle = grad1;
      ctx.beginPath();
      ctx.arc(orb1X, orb1Y, 380, 0, Math.PI * 2);
      ctx.fill();

      const orb2X = width * 0.25 + Math.cos(step * 0.7) * 70;
      const orb2Y = height * 0.65 + Math.sin(step * 0.9) * 50;
      const grad2 = ctx.createRadialGradient(orb2X, orb2Y, 10, orb2X, orb2Y, 320);
      grad2.addColorStop(0, 'rgba(189, 164, 119, 0.12)');
      grad2.addColorStop(0.6, 'rgba(112, 0, 55, 0.06)');
      grad2.addColorStop(1, 'rgba(13, 13, 15, 0)');
      ctx.fillStyle = grad2;
      ctx.beginPath();
      ctx.arc(orb2X, orb2Y, 320, 0, Math.PI * 2);
      ctx.fill();

      // Fluid Wave Ribbons
      ctx.beginPath();
      ctx.moveTo(0, height * 0.55);
      for (let x = 0; x <= width; x += 20) {
        const y = height * 0.55 + Math.sin(x * 0.003 + step) * 28 + Math.cos(x * 0.006 + step * 1.2) * 16;
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
      transition: { staggerChildren: 0.14, delayChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 24 },
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
      className="relative w-full min-h-[92vh] flex items-center justify-center overflow-hidden bg-[#0A0A0C] text-white px-4 sm:px-6 lg:px-12 py-16 lg:py-24 selection:bg-[#c5a880] selection:text-black"
    >
      {/* Background Interactive Canvas Mesh */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none z-0"
      />

      {/* Subtle Noise / Radial Vignette Overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(0,0,0,0)_0%,rgba(10,10,12,0.75)_100%)] pointer-events-none z-0" />

      {/* Content Container (Split 2-Column Responsive Layout) */}
      <div className="relative z-10 w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
        
        {/* ================= LEFT COLUMN: Typography & CTAs ================= */}
        <motion.div
          className="lg:col-span-7 flex flex-col items-start text-left space-y-6"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Top Sleek Pill Tag */}
          <motion.div
            variants={itemVariants}
            className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white/[0.04] border border-[#d4af37]/40 backdrop-blur-md shadow-[0_0_15px_rgba(212,175,55,0.12)]"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#d4af37] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#d4af37]"></span>
            </span>
            <span className="text-xs sm:text-sm font-semibold tracking-widest text-[#e5d5be] uppercase">
              ✨ {brandName}
            </span>
          </motion.div>

          {/* Primary Editorial Headline */}
          <motion.h1
            variants={itemVariants}
            className="font-serif text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.08] text-transparent bg-clip-text bg-gradient-to-b from-[#ffffff] via-[#f7f2eb] to-[#d6c7b2]"
          >
            {headline}
          </motion.h1>

          {/* Muted Luxury Subtext */}
          <motion.p
            variants={itemVariants}
            className="max-w-xl text-base sm:text-lg text-[#a8a199] font-normal leading-relaxed tracking-wide"
          >
            {subtext}
          </motion.p>

          {/* Action CTAs */}
          <motion.div
            variants={itemVariants}
            className="flex flex-wrap items-center gap-4 pt-2 sm:pt-4 w-full sm:w-auto"
          >
            {/* Primary Luxury CTA */}
            <a
              href={primaryCtaLink}
              onClick={createRipple}
              className="relative overflow-hidden inline-flex items-center justify-center px-8 py-4 rounded-xl text-sm sm:text-base font-bold text-[#141210] bg-gradient-to-r from-[#e6ca85] via-[#d4af37] to-[#bf953f] hover:from-[#f0d898] hover:via-[#dec050] hover:to-[#cca248] shadow-[0_4px_22px_rgba(212,175,55,0.32)] hover:shadow-[0_8px_32px_rgba(212,175,55,0.5)] transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0 active:scale-98"
            >
              <span className="relative z-10 flex items-center gap-2">
                {primaryCtaText}
              </span>
              {/* Ripple Sparks */}
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

            {/* Secondary Glassmorphism CTA */}
            <a
              href={secondaryCtaLink}
              className="inline-flex items-center justify-center px-7 py-4 rounded-xl text-sm sm:text-base font-semibold text-[#f0e7db] bg-white/[0.03] border border-white/20 hover:border-[#d4af37]/60 hover:bg-white/[0.08] backdrop-blur-lg hover:text-[#d4af37] transition-all duration-300 transform hover:-translate-y-0.5 shadow-sm"
            >
              {secondaryCtaText}
            </a>
          </motion.div>
        </motion.div>

        {/* ================= RIGHT COLUMN: Featured Hero Visual ================= */}
        <div className="lg:col-span-5 relative flex items-center justify-center pt-8 lg:pt-0">
          
          {/* Subtle Ambient Backlight Glow */}
          <div className="absolute -inset-4 bg-gradient-to-tr from-[#d4af37]/20 via-[#c5a880]/10 to-transparent rounded-full blur-3xl pointer-events-none" />

          {/* 3D Floating Arched Model Container */}
          <motion.div
            style={{
              rotateX: modelRotateX,
              rotateY: modelRotateY,
              transformStyle: 'preserve-3d',
            }}
            animate={{
              y: [0, -12, 0],
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="relative w-full max-w-[360px] sm:max-w-[420px] lg:max-w-full aspect-[3/4] rounded-t-[120px] rounded-b-[28px] overflow-visible border border-[#d4af37]/30 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.85),0_0_25px_rgba(212,175,55,0.15)] group"
          >
            {/* Inner Arched Mask for Model Photo */}
            <div className="w-full h-full rounded-t-[120px] rounded-b-[28px] overflow-hidden bg-[#181615]">
              <img
                src={modelImage}
                alt="RJ Fashion Collection Haute Couture Model"
                className="w-full h-full object-cover object-center transform group-hover:scale-105 transition-transform duration-700 ease-out"
                loading="eager"
              />
              {/* Inner Gradient Shade */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d0f]/80 via-transparent to-transparent pointer-events-none" />
            </div>

            {/* Glassmorphic Badge #1: Fashion Jewelry Vault (Top Right) */}
            <motion.div
              style={{ x: badge1X, y: badge1Y }}
              className="absolute -top-5 -right-4 sm:-right-6 flex items-center gap-3 p-2.5 sm:p-3 rounded-2xl bg-[#141211]/75 backdrop-blur-xl border border-[#d4af37]/45 shadow-[0_12px_32px_rgba(0,0,0,0.55)] cursor-pointer hover:border-[#d4af37] transition-colors"
            >
              <img
                src={kundanThumb}
                alt="Kundan Vault 24K"
                className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl object-cover border border-[#d4af37]/40"
              />
              <div className="pr-2">
                <p className="text-xs sm:text-sm font-bold text-[#f7f2ea] leading-tight">
                  Fashion Jewelry Vault
                </p>
                <p className="text-[10px] sm:text-xs font-semibold text-[#d4af37] tracking-wider uppercase mt-0.5">
                  Premium Brass & Kundan Polish
                </p>
              </div>
            </motion.div>

            {/* Glassmorphic Badge #2: Premium Quality (Bottom Left) */}
            <motion.div
              style={{ x: badge2X, y: badge2Y }}
              className="absolute -bottom-6 -left-4 sm:-left-6 flex items-center gap-3 px-4 py-3 rounded-2xl bg-[#141211]/80 backdrop-blur-xl border border-white/20 shadow-[0_12px_32px_rgba(0,0,0,0.55)] hover:border-[#d4af37]/60 transition-colors"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#d4af37] to-[#8c7326] flex items-center justify-center text-black font-extrabold text-sm shadow-inner">
                ✦
              </div>
              <div>
                <p className="text-xs sm:text-sm font-bold text-[#ffffff] leading-tight">
                  Premium Quality
                </p>
                <p className="text-[10px] sm:text-xs font-medium text-[#c5a880] tracking-wide mt-0.5">
                  Handpicked Fabrics & Fine Stitching
                </p>
              </div>
            </motion.div>
          </motion.div>
        </div>

      </div>
    </section>
  );
}
