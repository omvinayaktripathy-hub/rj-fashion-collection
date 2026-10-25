import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export interface PromotionalCountdownProps {
  badge?: string;
  headline?: string;
  description?: string;
  promoCode?: string;
  discountText?: string;
  initialDays?: number;
  initialHours?: number;
  initialMins?: number;
  initialSecs?: number;
  targetDate?: string | null;
}

/**
 * PromotionalCountdown - RJ Fashion Collection Flagship Promotional Banner (TypeScript)
 * 
 * Features:
 * - Responsive promotional countdown banner
 * - Dark obsidian background (#0A0A0C) with subtle linear gold gradient border
 * - Headline "The Grand Opening Campaign" followed by exclusive privileges paragraph
 * - Sleek digital countdown component (Days, Hours, Minutes, Seconds) with glowing metallic text
 */
export const PromotionalCountdown: React.FC<PromotionalCountdownProps> = ({
  badge = "Inaugural Celebration Privilege",
  headline = "The Grand Opening Campaign",
  description = "Celebrate our official launch with complimentary express shipping on all orders above ₹999. Use promotional code",
  promoCode = "GRANDRJ",
  discountText = "at checkout for an exclusive 10% Inaugural Privilege.",
  initialDays = 18,
  initialHours = 9,
  initialMins = 42,
  initialSecs = 30,
  targetDate = null,
}) => {
  const [timeLeft, setTimeLeft] = useState({
    days: initialDays,
    hours: initialHours,
    minutes: initialMins,
    seconds: initialSecs,
  });

  useEffect(() => {
    const target = targetDate
      ? new Date(targetDate).getTime()
      : Date.now() + (initialDays * 86400 + initialHours * 3600 + initialMins * 60 + initialSecs) * 1000;

    const interval = setInterval(() => {
      const now = Date.now();
      const diff = Math.max(0, target - now);

      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [targetDate, initialDays, initialHours, initialMins, initialSecs]);

  const timeUnits = [
    { label: 'Days', value: String(timeLeft.days).padStart(2, '0') },
    { label: 'Hours', value: String(timeLeft.hours).padStart(2, '0') },
    { label: 'Mins', value: String(timeLeft.minutes).padStart(2, '0') },
    { label: 'Secs', value: String(timeLeft.seconds).padStart(2, '0') },
  ];

  return (
    <motion.section
      initial={{ opacity: 0, scale: 0.98 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="relative w-full max-w-7xl mx-auto my-8 p-6 sm:p-8 lg:p-9 rounded-2xl bg-[#0A0A0C] border border-[#d4af37]/35 shadow-[0_15px_35px_rgba(0,0,0,0.65),inset_0_0_24px_rgba(212,175,55,0.06)] overflow-hidden"
      style={{
        background: 'linear-gradient(#0A0A0C, #0A0A0C) padding-box, linear-gradient(135deg, rgba(212,175,55,0.55), rgba(197,168,128,0.15), rgba(212,175,55,0.45)) border-box',
        border: '1.5px solid transparent',
      }}
    >
      <div className="absolute -right-16 -top-16 w-80 h-80 bg-gradient-to-br from-[#d4af37]/15 via-[#c5a880]/5 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -left-16 -bottom-16 w-80 h-80 bg-gradient-to-tr from-[#d4af37]/10 via-transparent to-transparent rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        <div className="lg:col-span-7 flex flex-col items-start text-left">
          {badge && (
            <div className="inline-flex items-center gap-2 bg-[#d4af37]/10 border border-[#d4af37]/35 rounded-full px-3.5 py-1 text-xs font-bold text-[#E5D5BE] uppercase tracking-[1.4px] mb-3">
              <span className="text-[#d4af37] text-[10px]">✦</span>
              <span>{badge}</span>
            </div>
          )}

          <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight leading-tight mb-3">
            {headline}
          </h2>

          <p className="text-[#A8A199] text-sm sm:text-base leading-relaxed max-w-2xl font-normal">
            {description}{' '}
            <strong className="text-[#E6CA85] font-extrabold tracking-wider bg-white/5 border border-[#d4af37]/40 px-2 py-0.5 rounded-md inline-block shadow-sm">
              {promoCode}
            </strong>{' '}
            {discountText}
          </p>
        </div>

        <div className="lg:col-span-5 flex items-center justify-start lg:justify-end">
          <div className="grid grid-cols-4 gap-2.5 sm:gap-3.5 w-full max-w-md">
            {timeUnits.map((unit) => (
              <div
                key={unit.label}
                className="relative flex flex-col items-center justify-center py-3 sm:py-4 px-2 rounded-xl bg-[#141217]/85 border border-[#d4af37]/30 backdrop-blur-md shadow-[0_8px_20px_rgba(0,0,0,0.45),inset_0_1px_1px_rgba(255,255,255,0.08)] group hover:border-[#d4af37]/60 transition-colors"
              >
                <span className="font-serif text-2xl sm:text-3xl lg:text-4xl font-extrabold leading-none bg-gradient-to-b from-white via-[#F5EFEB] to-[#D4AF37] bg-clip-text text-transparent drop-shadow-[0_0_12px_rgba(212,175,55,0.5)]">
                  {unit.value}
                </span>

                <span className="text-[10px] sm:text-xs font-bold text-[#C5A880] tracking-widest uppercase mt-1 sm:mt-1.5 opacity-90">
                  {unit.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.section>
  );
};

export default PromotionalCountdown;
