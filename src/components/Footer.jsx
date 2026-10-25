import React from 'react';
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  Instagram,
  Facebook,
  Youtube,
  Lock
} from 'lucide-react';

/* =========================================================================
   CUSTOM PINTEREST SVG ICON
   ========================================================================= */
const PinterestIcon = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738.098.119.112.224.083.345-.09.375-.291 1.199-.332 1.365-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12 0-6.628-5.373-12-12-12z" />
  </svg>
);

export const Footer = () => {
  return (
    <footer className="w-full bg-[#FDFBF7] text-[#555555] border-t border-[#E5E0D8] font-sans transition-colors duration-300 dark:bg-[#161616] dark:border-[#262626] dark:text-[#A1A1AA]">
      {/* 4-Column Centered Grid Container */}
      <div className="max-w-7xl mx-auto px-6 py-14 box-border">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 items-start">

          {/* =========================================================================
              COLUMN 1: BRAND PROFILE
              ========================================================================= */}
          <div className="space-y-4">
            <h3 className="font-serif text-2xl font-bold tracking-wider text-[#8C6D3F] dark:text-[#D4AF37] m-0">
              RJ FASHION COLLECTION
            </h3>
            <p className="text-sm text-[#555555] dark:text-[#A1A1AA] leading-relaxed font-normal">
              India's premier online boutique for royal bridal sarees, intricate Kundan jewelry, and contemporary festive ethnic ensembles designed for celebrations.
            </p>

            {/* Social Links beneath bio */}
            <div className="pt-2">
              <div className="flex items-center gap-3">
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-full border border-[#D5CFBF] dark:border-[#333333] flex items-center justify-center text-[#555555] dark:text-[#A1A1AA] hover:text-[#000000] hover:border-[#8C6D3F] dark:hover:text-[#FFFFFF] dark:hover:border-[#D4AF37] hover:bg-[#F4EFE6] dark:hover:bg-[#222222] transition-all"
                  title="Instagram"
                  aria-label="Instagram"
                >
                  <Instagram className="w-4 h-4" />
                </a>
                <a
                  href="https://facebook.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-full border border-[#D5CFBF] dark:border-[#333333] flex items-center justify-center text-[#555555] dark:text-[#A1A1AA] hover:text-[#000000] hover:border-[#8C6D3F] dark:hover:text-[#FFFFFF] dark:hover:border-[#D4AF37] hover:bg-[#F4EFE6] dark:hover:bg-[#222222] transition-all"
                  title="Facebook"
                  aria-label="Facebook"
                >
                  <Facebook className="w-4 h-4" />
                </a>
                <a
                  href="https://pinterest.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-full border border-[#D5CFBF] dark:border-[#333333] flex items-center justify-center text-[#555555] dark:text-[#A1A1AA] hover:text-[#000000] hover:border-[#8C6D3F] dark:hover:text-[#FFFFFF] dark:hover:border-[#D4AF37] hover:bg-[#F4EFE6] dark:hover:bg-[#222222] transition-all"
                  title="Pinterest"
                  aria-label="Pinterest"
                >
                  <PinterestIcon className="w-4 h-4" />
                </a>
                <a
                  href="https://youtube.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-full border border-[#D5CFBF] dark:border-[#333333] flex items-center justify-center text-[#555555] dark:text-[#A1A1AA] hover:text-[#000000] hover:border-[#8C6D3F] dark:hover:text-[#FFFFFF] dark:hover:border-[#D4AF37] hover:bg-[#F4EFE6] dark:hover:bg-[#222222] transition-all"
                  title="YouTube"
                  aria-label="YouTube"
                >
                  <Youtube className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>

          {/* =========================================================================
              COLUMN 2: STORE & CONCIERGE DETAILS (VISIT & CONTACT)
              ========================================================================= */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-[#1A1A1A] dark:text-[#E5E7EB] m-0">
              VISIT & CONTACT
            </h4>
            <div className="space-y-3 text-xs sm:text-sm text-[#555555] dark:text-[#A1A1AA]">
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-[#8C6D3F] dark:text-[#C5A880] flex-shrink-0 mt-0.5" />
                <span className="leading-snug">
                  <strong className="text-[#1A1A1A] dark:text-white font-medium">Store Address:</strong> RJ FASHION COLLECTION, ODISHA, Jharsuguda, Sarbhal, Zipcode - 768201
                </span>
              </div>

              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-[#8C6D3F] dark:text-[#C5A880] flex-shrink-0" />
                <span>
                  <strong className="text-[#1A1A1A] dark:text-white font-medium">Phone:</strong>{' '}
                  <a
                    href="tel:+917894093586"
                    className="text-[#1A1A1A] dark:text-[#E5E7EB] hover:text-[#8C6D3F] dark:hover:text-[#D4AF37] transition-colors underline-offset-4 hover:underline font-medium"
                  >
                    +91 7894093586
                  </a>
                </span>
              </div>

              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-[#8C6D3F] dark:text-[#C5A880] flex-shrink-0" />
                <span>
                  <strong className="text-[#1A1A1A] dark:text-white font-medium">Email:</strong>{' '}
                  <a
                    href="mailto:rjfashioncollection@gmail.com"
                    className="text-[#1A1A1A] dark:text-[#E5E7EB] hover:text-[#8C6D3F] dark:hover:text-[#D4AF37] transition-colors underline-offset-4 hover:underline font-medium"
                  >
                    rjfashioncollection@gmail.com
                  </a>
                </span>
              </div>

              <div className="flex items-center gap-3">
                <Clock className="w-4 h-4 text-[#8C6D3F] dark:text-[#C5A880] flex-shrink-0" />
                <span>
                  <strong className="text-[#1A1A1A] dark:text-white font-medium">Support Hours:</strong> Mon to Sat (10:00 AM – 5:00 PM)
                </span>
              </div>
            </div>
          </div>

          {/* =========================================================================
              COLUMN 3: QUICK LINKS
              ========================================================================= */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-[#1A1A1A] dark:text-[#E5E7EB] m-0">
              QUICK LINKS
            </h4>
            <ul className="space-y-2.5 text-sm list-none p-0 m-0">
              <li>
                <a
                  href="/shop.html"
                  className="text-[#555555] dark:text-[#A1A1AA] hover:text-[#000000] dark:hover:text-[#FFFFFF] hover:translate-x-1 inline-block transition-all"
                >
                  Shop All
                </a>
              </li>
              <li>
                <a
                  href="/categories.html"
                  className="text-[#555555] dark:text-[#A1A1AA] hover:text-[#000000] dark:hover:text-[#FFFFFF] hover:translate-x-1 inline-block transition-all"
                >
                  Categories
                </a>
              </li>
              <li>
                <a
                  href="/shop.html?category=sarees"
                  className="text-[#555555] dark:text-[#A1A1AA] hover:text-[#000000] dark:hover:text-[#FFFFFF] hover:translate-x-1 inline-block transition-all"
                >
                  Silk Sarees
                </a>
              </li>
              <li>
                <a
                  href="/shop.html?category=jewelry"
                  className="text-[#555555] dark:text-[#A1A1AA] hover:text-[#000000] dark:hover:text-[#FFFFFF] hover:translate-x-1 inline-block transition-all"
                >
                  Jewelry
                </a>
              </li>
              <li>
                <a
                  href="/sale.html"
                  className="text-[#555555] dark:text-[#A1A1AA] hover:text-[#000000] dark:hover:text-[#FFFFFF] hover:translate-x-1 inline-block transition-all font-semibold"
                >
                  Hot Deals
                </a>
              </li>
            </ul>
          </div>

          {/* =========================================================================
              COLUMN 4: CUSTOMER CARE
              ========================================================================= */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-[#1A1A1A] dark:text-[#E5E7EB] m-0">
              CUSTOMER CARE
            </h4>
            <ul className="space-y-2.5 text-sm list-none p-0 m-0">
              <li>
                <a
                  href="/account.html"
                  className="text-[#555555] dark:text-[#A1A1AA] hover:text-[#000000] dark:hover:text-[#FFFFFF] hover:translate-x-1 inline-block transition-all"
                >
                  My Account
                </a>
              </li>
              <li>
                <a
                  href="/orders.html"
                  className="text-[#555555] dark:text-[#A1A1AA] hover:text-[#000000] dark:hover:text-[#FFFFFF] hover:translate-x-1 inline-block transition-all"
                >
                  My Orders
                </a>
              </li>
              <li>
                <a
                  href="/wishlist.html"
                  className="text-[#555555] dark:text-[#A1A1AA] hover:text-[#000000] dark:hover:text-[#FFFFFF] hover:translate-x-1 inline-block transition-all"
                >
                  Wishlist
                </a>
              </li>
              <li>
                <a
                  href="/faq.html"
                  className="text-[#555555] dark:text-[#A1A1AA] hover:text-[#000000] dark:hover:text-[#FFFFFF] hover:translate-x-1 inline-block transition-all"
                >
                  FAQs
                </a>
              </li>
              <li>
                <a
                  href="/contact.html"
                  className="text-[#555555] dark:text-[#A1A1AA] hover:text-[#000000] dark:hover:text-[#FFFFFF] hover:translate-x-1 inline-block transition-all"
                >
                  Customer Support
                </a>
              </li>
            </ul>
          </div>

        </div>

        {/* =========================================================================
            BOTTOM BAR (STRICTLY SINGLE "© 2026")
            ========================================================================= */}
        <div className="border-t border-[#E5E0D8] dark:border-[#262626] pt-6 mt-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-[#777777] dark:text-[#888888]">
            {/* Left: Copyright */}
            <div className="text-center md:text-left">
              &copy; 2026 RJ Fashion Collection. All rights reserved. Crafted with elegance for Indian celebrations.
            </div>

            {/* Right: Policies & Verification Badges */}
            <div className="flex flex-wrap items-center justify-center md:justify-end gap-x-3 gap-y-1.5 text-center">
              <a
                href="/about.html#privacy"
                className="hover:text-[#000000] dark:hover:text-[#FFFFFF] transition-colors"
              >
                Privacy Policy
              </a>
              <span className="opacity-40">•</span>
              <a
                href="/about.html#terms"
                className="hover:text-[#000000] dark:hover:text-[#FFFFFF] transition-colors"
              >
                Terms & Conditions
              </a>
              <span className="opacity-40">•</span>
              <span className="inline-flex items-center gap-1.5 text-[#555555] dark:text-[#A1A1AA]">
                <Lock className="w-3 h-3 text-[#10B981]" />
                <span>100% Secure Checkout</span>
              </span>
              <span className="opacity-40">•</span>
              <span>Authentic Products</span>

              {/* Payment Pills */}
              <div className="flex items-center gap-1.5 ml-1 pt-1 sm:pt-0">
                <span className="px-1.5 py-0.5 rounded bg-[#F0EBE1] dark:bg-[#222222] border border-[#DDD6C8] dark:border-[#333333] text-[10px] font-bold text-[#333333] dark:text-[#E5E7EB] tracking-wider">
                  UPI
                </span>
                <span className="px-1.5 py-0.5 rounded bg-[#F0EBE1] dark:bg-[#222222] border border-[#DDD6C8] dark:border-[#333333] text-[10px] font-bold text-[#333333] dark:text-[#E5E7EB] tracking-wider">
                  RuPay
                </span>
                <span className="px-1.5 py-0.5 rounded bg-[#F0EBE1] dark:bg-[#222222] border border-[#DDD6C8] dark:border-[#333333] text-[10px] font-bold text-[#333333] dark:text-[#E5E7EB] tracking-wider">
                  VISA
                </span>
                <span className="px-1.5 py-0.5 rounded bg-[#F0EBE1] dark:bg-[#222222] border border-[#DDD6C8] dark:border-[#333333] text-[10px] font-bold text-[#333333] dark:text-[#E5E7EB] tracking-wider">
                  Mastercard
                </span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </footer>
  );
};

export default Footer;
