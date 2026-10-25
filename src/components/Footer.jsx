import React, { useState } from 'react';
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  Instagram,
  Facebook,
  Youtube,
  ShieldCheck,
  CheckCircle2,
  Lock
} from 'lucide-react';

const PinterestIcon = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738.098.119.112.224.083.345-.09.375-.291 1.199-.332 1.365-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12 0-6.628-5.373-12-12-12z" />
  </svg>
);

export const Footer = ({ onSubscribe }) => {
  const [emailInput, setEmailInput] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e) => {
    e.preventDefault();
    const cleanEmail = emailInput.trim();
    if (!cleanEmail) return;

    if (onSubscribe) {
      onSubscribe(cleanEmail);
    }
    setSubscribed(true);
    setEmailInput('');
  };

  return (
    <footer className="w-full bg-[#0d0d0d] text-[#9CA3AF] border-t border-[#222222] font-sans transition-colors duration-300">
      {/* 5-Column Centered Grid Container */}
      <div className="max-w-7xl mx-auto px-6 py-16 sm:py-20 box-border">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8 items-start">

          {/* =========================================================================
              COL 1 & 2: BRAND BIO & FORMATTED CONTACT CARD (Spans 2 columns on lg)
              ========================================================================= */}
          <div className="lg:col-span-2 space-y-6">
            <div>
              {/* Gold Serif Brand Logo */}
              <h3 className="font-serif text-2xl sm:text-3xl font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] via-[#E5C158] to-[#B38B22] mb-3">
                RJ FASHION COLLECTION
              </h3>
              {/* Refined Brand Summary */}
              <p className="text-sm text-[#9CA3AF] leading-relaxed max-w-md font-light">
                India's premier online boutique for royal bridal sarees, intricate Kundan jewelry, and contemporary festive ethnic ensembles designed for celebrations.
              </p>
            </div>

            {/* Formatted Contact Details Card */}
            <div className="space-y-3 pt-2 text-xs sm:text-sm text-[#9CA3AF] border-t border-[#222222] pt-4">
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-[#C5A880] flex-shrink-0 mt-0.5" />
                <span className="leading-snug">
                  <strong className="text-white font-medium">Store Address:</strong> RJ FASHION COLLECTION, ODISHA, Jharsuguda, Sarbhal, Zipcode - 768201
                </span>
              </div>

              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-[#C5A880] flex-shrink-0" />
                <span>
                  <strong className="text-white font-medium">Phone:</strong>{' '}
                  <a
                    href="tel:+917894093586"
                    className="text-[#E5E7EB] hover:text-[#D4AF37] transition-colors underline-offset-4 hover:underline"
                  >
                    +91 7894093586
                  </a>
                </span>
              </div>

              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-[#C5A880] flex-shrink-0" />
                <span>
                  <strong className="text-white font-medium">Email:</strong>{' '}
                  <a
                    href="mailto:rjfashioncollection@gmail.com"
                    className="text-[#E5E7EB] hover:text-[#D4AF37] transition-colors underline-offset-4 hover:underline"
                  >
                    rjfashioncollection@gmail.com
                  </a>
                </span>
              </div>

              <div className="flex items-center gap-3">
                <Clock className="w-4 h-4 text-[#C5A880] flex-shrink-0" />
                <span>
                  <strong className="text-white font-medium">Available:</strong> Mon to Sat (10:00 AM – 5:00 PM)
                </span>
              </div>
            </div>
          </div>

          {/* =========================================================================
              COL 3: QUICK LINKS
              ========================================================================= */}
          <div className="lg:col-span-1 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-[#C5A880]">
              Quick Links
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <a href="/shop.html" className="text-[#9CA3AF] hover:text-[#D4AF37] hover:translate-x-1 inline-block transition-all">
                  Shop All
                </a>
              </li>
              <li>
                <a href="/categories.html" className="text-[#9CA3AF] hover:text-[#D4AF37] hover:translate-x-1 inline-block transition-all">
                  Categories
                </a>
              </li>
              <li>
                <a href="/shop.html?category=sarees" className="text-[#9CA3AF] hover:text-[#D4AF37] hover:translate-x-1 inline-block transition-all">
                  Silk Sarees
                </a>
              </li>
              <li>
                <a href="/shop.html?category=jewelry" className="text-[#9CA3AF] hover:text-[#D4AF37] hover:translate-x-1 inline-block transition-all">
                  Jewelry
                </a>
              </li>
              <li>
                <a href="/sale.html" className="text-[#9CA3AF] hover:text-[#D4AF37] hover:translate-x-1 inline-block transition-all font-semibold">
                  Hot Deals
                </a>
              </li>
            </ul>
          </div>

          {/* =========================================================================
              COL 4: CUSTOMER CARE
              ========================================================================= */}
          <div className="lg:col-span-1 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-[#C5A880]">
              Customer Care
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <a href="/account.html" className="text-[#9CA3AF] hover:text-[#D4AF37] hover:translate-x-1 inline-block transition-all">
                  My Account
                </a>
              </li>
              <li>
                <a href="/orders.html" className="text-[#9CA3AF] hover:text-[#D4AF37] hover:translate-x-1 inline-block transition-all">
                  My Orders
                </a>
              </li>
              <li>
                <a href="/wishlist.html" className="text-[#9CA3AF] hover:text-[#D4AF37] hover:translate-x-1 inline-block transition-all">
                  Wishlist
                </a>
              </li>
              <li>
                <a href="/faq.html" className="text-[#9CA3AF] hover:text-[#D4AF37] hover:translate-x-1 inline-block transition-all">
                  FAQs
                </a>
              </li>
              <li>
                <a href="/contact.html" className="text-[#9CA3AF] hover:text-[#D4AF37] hover:translate-x-1 inline-block transition-all">
                  Customer Support
                </a>
              </li>
            </ul>
          </div>

          {/* =========================================================================
              COL 5: MAILING LIST & SOCIALS (Fills empty right side)
              ========================================================================= */}
          <div className="lg:col-span-1 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-[#C5A880]">
              Join Our Mailing List
            </h4>
            <p className="text-xs text-[#9CA3AF] leading-relaxed">
              Receive private invites to trunk shows and seasonal sales.
            </p>

            {/* Sleek Subscription Input */}
            <form onSubmit={handleSubscribe} className="space-y-2 pt-1">
              <div className="flex flex-col sm:flex-row lg:flex-col gap-2">
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="Enter your email"
                  required
                  className="w-full bg-[#171717] border border-[#2a2a2a] focus:border-[#C5A880] rounded-lg px-3.5 py-2.5 text-xs text-white placeholder-[#6B7280] outline-none transition-colors"
                />
                <button
                  type="submit"
                  className="w-full sm:w-auto lg:w-full px-4 py-2.5 bg-[#C5A880] hover:bg-[#D4AF37] text-[#0d0d0d] font-bold text-xs uppercase tracking-wider rounded-lg transition-colors whitespace-nowrap"
                >
                  Subscribe
                </button>
              </div>
              {subscribed && (
                <p className="text-[11px] text-[#10B981] flex items-center gap-1.5 pt-1">
                  <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>Welcome to our private circle.</span>
                </p>
              )}
            </form>

            {/* Social Icons */}
            <div className="pt-2">
              <div className="flex items-center gap-2.5 text-[#9CA3AF]">
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-full border border-[#262626] flex items-center justify-center hover:text-[#D4AF37] hover:border-[#D4AF37] hover:bg-[#1a1a1a] transition-all"
                  title="Instagram"
                  aria-label="Instagram"
                >
                  <Instagram className="w-3.5 h-3.5" />
                </a>
                <a
                  href="https://facebook.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-full border border-[#262626] flex items-center justify-center hover:text-[#D4AF37] hover:border-[#D4AF37] hover:bg-[#1a1a1a] transition-all"
                  title="Facebook"
                  aria-label="Facebook"
                >
                  <Facebook className="w-3.5 h-3.5" />
                </a>
                <a
                  href="https://pinterest.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-full border border-[#262626] flex items-center justify-center hover:text-[#D4AF37] hover:border-[#D4AF37] hover:bg-[#1a1a1a] transition-all"
                  title="Pinterest"
                  aria-label="Pinterest"
                >
                  <PinterestIcon className="w-3.5 h-3.5" />
                </a>
                <a
                  href="https://youtube.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-full border border-[#262626] flex items-center justify-center hover:text-[#D4AF37] hover:border-[#D4AF37] hover:bg-[#1a1a1a] transition-all"
                  title="YouTube"
                  aria-label="YouTube"
                >
                  <Youtube className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* =========================================================================
          BOTTOM BAR (NO TYPO: STRICTLY "© 2026")
          ========================================================================= */}
      <div className="border-t border-[#1f1f1f] py-6 bg-[#080808]">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-[#6B7280]">
          {/* Left: Copyright */}
          <div className="text-center md:text-left">
            &copy; 2026 RJ Fashion Collection. All rights reserved. Crafted with elegance for Indian celebrations.
          </div>

          {/* Right: Policies & Security Badges with Mini Payment Badges */}
          <div className="flex flex-wrap items-center justify-center md:justify-end gap-x-3 gap-y-1 text-center">
            <a href="/about.html#privacy" className="hover:text-[#D4AF37] transition-colors">Privacy Policy</a>
            <span>•</span>
            <a href="/about.html#terms" className="hover:text-[#D4AF37] transition-colors">Terms & Conditions</a>
            <span>•</span>
            <span className="inline-flex items-center gap-1.5 text-[#9CA3AF]">
              <Lock className="w-3 h-3 text-[#10B981]" />
              <span>100% Secure Checkout</span>
            </span>
            <span>•</span>
            <span>Authentic Products</span>

            {/* Payment Method Badges */}
            <div className="flex items-center gap-1.5 ml-1 pt-1 sm:pt-0">
              <span className="px-1.5 py-0.5 rounded bg-[#1a1a1a] border border-[#2d2d2d] text-[10px] font-bold text-[#E5E7EB] tracking-wider">
                UPI
              </span>
              <span className="px-1.5 py-0.5 rounded bg-[#1a1a1a] border border-[#2d2d2d] text-[10px] font-bold text-[#E5E7EB] tracking-wider">
                RuPay
              </span>
              <span className="px-1.5 py-0.5 rounded bg-[#1a1a1a] border border-[#2d2d2d] text-[10px] font-bold text-[#E5E7EB] tracking-wider">
                VISA
              </span>
              <span className="px-1.5 py-0.5 rounded bg-[#1a1a1a] border border-[#2d2d2d] text-[10px] font-bold text-[#E5E7EB] tracking-wider">
                Mastercard
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
