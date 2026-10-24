import os
import re

BASE_DIR = r"C:\Users\omvin\.gemini\antigravity\scratch\RJ-Fashion-Collection"

# 1. Update public/css/style.css
style_path = os.path.join(BASE_DIR, "public", "css", "style.css")
with open(style_path, "r", encoding="utf-8") as f:
    style_content = f.read()

motion_css = '''
/* ===================================================================
   CINEMATIC MOTION SYSTEM (FRAMER MOTION INSPIRED SPECIFICATION)
   Directional Entrances, Spring Physics, Staggered Reveals & Reduced Motion
   =================================================================== */

/* Base Motion Properties */
.motion-fade-up,
.motion-fade-down,
.motion-fade-left,
.motion-fade-right,
.motion-scale-in,
.product-card,
.category-card,
.our-story-grid,
.spotlight-card,
.review-card,
.grand-campaign-strip {
  will-change: transform, opacity;
  backface-visibility: hidden;
  transition-property: transform, opacity, box-shadow;
  transition-duration: 0.5s;
  transition-timing-function: cubic-bezier(0.16, 1, 0.3, 1);
  transition-delay: calc(var(--motion-index, 0) * 60ms);
}

/* Direction 1: Bottom to Top (Product Cards, Headings, Section Reveals) */
.motion-fade-up,
.product-card,
.category-card,
.review-card {
  opacity: 0;
  transform: translateY(24px);
}
.motion-fade-up.motion-in-view,
.product-card.motion-in-view,
.category-card.motion-in-view,
.review-card.motion-in-view {
  opacity: 1;
  transform: translateY(0);
}

/* Direction 2: Top to Bottom (Announcements, Nav dropdowns) */
.motion-fade-down {
  opacity: 0;
  transform: translateY(-20px);
}
.motion-fade-down.motion-in-view {
  opacity: 1;
  transform: translateY(0);
}

/* Direction 3: Left to Right (Editorial Text & Storytelling Panels) */
.motion-fade-right,
.our-story-content {
  opacity: 0;
  transform: translateX(-32px);
}
.motion-fade-right.motion-in-view,
.our-story-grid.motion-in-view .our-story-content {
  opacity: 1;
  transform: translateX(0);
}

/* Direction 4: Right to Left (Complementary Imagery & Product Details) */
.motion-fade-left,
.our-story-img-wrap {
  opacity: 0;
  transform: translateX(32px);
}
.motion-fade-left.motion-in-view,
.our-story-grid.motion-in-view .our-story-img-wrap {
  opacity: 1;
  transform: translateX(0);
}

/* Direction 5: Subtle Scale & Opacity (Hero imagery, Campaign Spotlights) */
.motion-scale-in,
.grand-campaign-strip,
.spotlight-card {
  opacity: 0;
  transform: scale(0.96);
}
.motion-scale-in.motion-in-view,
.grand-campaign-strip.motion-in-view,
.spotlight-card.motion-in-view {
  opacity: 1;
  transform: scale(1);
}

/* Micro-interaction whileHover & whileTap Springs */
.grand-btn-primary,
.grand-btn-secondary,
.btn-primary,
.exp-card,
.top-bar-code-pill {
  transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s ease, background 0.2s ease, border-color 0.2s ease !important;
}
.grand-btn-primary:active,
.grand-btn-secondary:active,
.btn-primary:active,
.exp-card:active,
.top-bar-code-pill:active {
  transform: scale(0.97) !important;
}

/* Hero Section Staged Entrance Sequence */
.grand-hero-section.motion-hero-ready .motion-hero-gallery {
  animation: heroImgReveal 0.9s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
.grand-hero-section.motion-hero-ready .motion-hero-tag {
  animation: heroTagReveal 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.15s forwards;
  opacity: 0;
}
.grand-hero-section.motion-hero-ready .motion-hero-title {
  animation: heroTextReveal 0.75s cubic-bezier(0.16, 1, 0.3, 1) 0.28s forwards;
  opacity: 0;
}
.grand-hero-section.motion-hero-ready .motion-hero-sub {
  animation: heroTextReveal 0.75s cubic-bezier(0.16, 1, 0.3, 1) 0.42s forwards;
  opacity: 0;
}
.grand-hero-section.motion-hero-ready .motion-hero-actions {
  animation: heroTextReveal 0.75s cubic-bezier(0.16, 1, 0.3, 1) 0.55s forwards;
  opacity: 0;
}
.grand-hero-section.motion-hero-ready .motion-hero-float {
  animation: heroFloatCardReveal 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.7s forwards, subtleFloat 4s ease-in-out 1.5s infinite;
  opacity: 0;
}

@keyframes heroImgReveal {
  0% { opacity: 0; transform: scale(1.04) translateX(20px); }
  100% { opacity: 1; transform: scale(1) translateX(0); }
}
@keyframes heroTagReveal {
  0% { opacity: 0; transform: translateY(-12px); }
  100% { opacity: 1; transform: translateY(0); }
}
@keyframes heroTextReveal {
  0% { opacity: 0; transform: translateY(22px); }
  100% { opacity: 1; transform: translateY(0); }
}
@keyframes heroFloatCardReveal {
  0% { opacity: 0; transform: translateY(30px) scale(0.95); }
  100% { opacity: 1; transform: translateY(0) scale(1); }
}

/* Reduced Motion Override */
@media (prefers-reduced-motion: reduce) {
  .motion-fade-up,
  .motion-fade-down,
  .motion-fade-left,
  .motion-fade-right,
  .motion-scale-in,
  .product-card,
  .category-card,
  .our-story-grid,
  .our-story-content,
  .our-story-img-wrap,
  .spotlight-card,
  .review-card,
  .grand-campaign-strip,
  .motion-hero-tag,
  .motion-hero-title,
  .motion-hero-sub,
  .motion-hero-actions,
  .motion-hero-gallery,
  .motion-hero-float {
    opacity: 1 !important;
    transform: none !important;
    transition: none !important;
    animation: none !important;
  }
}
'''

if "CINEMATIC MOTION SYSTEM" not in style_content:
    style_content += "\n" + motion_css
    with open(style_path, "w", encoding="utf-8", newline="\r\n") as f:
        f.write(style_content)
    print("Added Cinematic Motion System to style.css!")
else:
    print("Cinematic Motion System already present in style.css.")

# 2. Update public/js/app.js
app_path = os.path.join(BASE_DIR, "public", "js", "app.js")
with open(app_path, "r", encoding="utf-8") as f:
    app_content = f.read()

# Remove duplicate initLuxuryStyle block if present
dup_pattern = r'function initLuxuryStyle\(\) \{\s+let saved = \'editorial-impact\';.*?if \(document\.readyState === \'loading\'\) \{\s+document\.addEventListener\(\'DOMContentLoaded\', initLuxuryStyle\);\s+\} else \{\s+initLuxuryStyle\(\);\s+\}\s+function initLuxuryStyle\(\) \{'
if re.search(dup_pattern, app_content, re.DOTALL):
    app_content = re.sub(
        r'function initLuxuryStyle\(\) \{\s+let saved = \'editorial-impact\';.*?if \(document\.readyState === \'loading\'\) \{\s+document\.addEventListener\(\'DOMContentLoaded\', initLuxuryStyle\);\s+\} else \{\s+initLuxuryStyle\(\);\s+\}\s+',
        '',
        app_content,
        count=1,
        flags=re.DOTALL
    )
    print("Cleaned up duplicated initLuxuryStyle in app.js!")

motion_js = '''
// ===================================================================
// FRAMER MOTION INSPIRED UNIFIED CINEMATIC MOTION CONTROLLER
// Directional reveals, spring physics, viewport observation, reduced motion
// ===================================================================
const MotionSystem = {
  observer: null,
  init() {
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      document.documentElement.classList.add('reduced-motion');
      return;
    }

    if ('IntersectionObserver' in window) {
      this.observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('motion-in-view');
            this.observer.unobserve(entry.target);
          }
        });
      }, {
        root: null,
        rootMargin: '0px 0px -40px 0px',
        threshold: 0.1
      });

      this.observeAll();
    }

    this.animateHeroSequence();
  },

  observeAll() {
    if (!this.observer) return;
    const elements = document.querySelectorAll(`
      .motion-reveal,
      .motion-fade-up,
      .motion-fade-down,
      .motion-fade-left,
      .motion-fade-right,
      .motion-scale-in,
      .product-card,
      .category-card,
      .our-story-grid,
      .spotlight-card,
      .review-card,
      .grand-campaign-strip
    `);

    elements.forEach((el, idx) => {
      if (!el.style.getPropertyValue('--motion-index')) {
        el.style.setProperty('--motion-index', (idx % 6).toString());
      }
      this.observer.observe(el);
    });
  },

  animateHeroSequence() {
    const heroSection = document.querySelector('.grand-hero-section');
    if (!heroSection) return;

    const tag = heroSection.querySelector('.grand-opening-tag');
    const title = heroSection.querySelector('.grand-hero-title');
    const subtitle = heroSection.querySelector('.grand-hero-subtitle');
    const actions = heroSection.querySelector('.grand-hero-actions');
    const gallery = heroSection.querySelector('.grand-hero-gallery');
    const floatCard = heroSection.querySelector('.grand-hero-float-card');

    if (tag) tag.classList.add('motion-hero-tag');
    if (title) title.classList.add('motion-hero-title');
    if (subtitle) subtitle.classList.add('motion-hero-sub');
    if (actions) actions.classList.add('motion-hero-actions');
    if (gallery) gallery.classList.add('motion-hero-gallery');
    if (floatCard) floatCard.classList.add('motion-hero-float');

    heroSection.classList.add('motion-hero-ready');
  }
};
window.MotionSystem = MotionSystem;

// Initialize Motion on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => MotionSystem.init());
} else {
  MotionSystem.init();
}
'''

if "FRAMER MOTION INSPIRED UNIFIED CINEMATIC MOTION CONTROLLER" not in app_content:
    app_content += "\n" + motion_js
    with open(app_path, "w", encoding="utf-8", newline="\r\n") as f:
        f.write(app_content)
    print("Added MotionSystem to app.js!")
else:
    print("MotionSystem already present in app.js.")
