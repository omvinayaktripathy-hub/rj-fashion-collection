import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { AIVirtualTryOnModal } from './AIVirtualTryOnModal';

export const VirtualTryOnButton = ({
  product,
  onOpen,
  className = '',
  onAddToCartWithFit
}) => {
  const [isTryOnModalOpen, setIsTryOnModalOpen] = useState(false);

  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsTryOnModalOpen(true);
    if (onOpen) onOpen();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setIsTryOnModalOpen(true);
      if (onOpen) onOpen();
    }
  };

  return (
    <>
      <div className={`w-full ${className}`}>
        <button
          type="button"
          role="button"
          tabIndex={0}
          aria-haspopup="dialog"
          aria-expanded={isTryOnModalOpen}
          aria-label="AI Virtual Dressing Room — Try On in Real-Time"
          onClick={handleClick}
          onKeyDown={handleKeyDown}
          title="AI Virtual Dressing Room — Try On in Real-Time"
          className="w-full relative overflow-hidden group py-3 px-4 sm:px-5 rounded-xl bg-gradient-to-r from-amber-900 via-rose-900 to-amber-700 text-white font-bold text-xs sm:text-sm tracking-wider uppercase shadow-lg shadow-rose-950/30 border border-amber-500/30 hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2 sm:gap-2.5 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2"
        >
          {/* Subtle Shimmer Ray Animation */}
          <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full duration-1000 bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform ease-out pointer-events-none" />

          {/* Animated Sparkle Icon */}
          <Sparkles className="w-4 h-4 text-amber-300 animate-pulse shrink-0" />

          {/* Bold Tracked Text */}
          <span className="truncate">
            AI VIRTUAL DRESSING ROOM — TRY ON IN REAL-TIME
          </span>
        </button>
      </div>

      {/* Interactive Try-On Modal */}
      <AIVirtualTryOnModal
        isOpen={isTryOnModalOpen}
        onClose={() => setIsTryOnModalOpen(false)}
        product={product}
        onAddToCartWithFit={onAddToCartWithFit}
      />
    </>
  );
};

export default VirtualTryOnButton;
