import re

# 1. Update public/index.html
index_path = r'public\index.html'
with open(index_path, 'r', encoding='utf-8') as f:
    html = f.read()

old_hero_pattern = re.compile(
    r'<!-- Grand Opening Cinematic Hero Section -->\s*<section class="grand-hero-section">.*?</section>',
    re.DOTALL
)

new_hero_html = """<!-- Modern Luxury E-Commerce Hero Section (React/Framer-Motion Specification) -->
    <section class="luxury-hero-section" id="luxury-hero-section">
      <!-- Ambient Fluid Wave Canvas Mesh Background -->
      <canvas id="hero-fluid-mesh-canvas" class="hero-fluid-canvas" aria-hidden="true"></canvas>
      <div class="hero-radial-vignette" aria-hidden="true"></div>

      <div class="luxury-hero-grid">
        <!-- LEFT COLUMN: Editorial Typography & Actions -->
        <div class="luxury-hero-content">
          <!-- Sleek Pill Tag -->
          <div class="hero-luxury-pill">
            <span class="hero-pill-sparkle" aria-hidden="true">✦</span>
            <span id="hero-badge-text">✨ RJ FASHION COLLECTION</span>
          </div>

          <!-- Editorial Headline -->
          <h1 class="hero-editorial-title" id="hero-headline-text">STYLE THAT SPEAKS WITHOUT WORDS</h1>

          <!-- Muted Luxury Subtext -->
          <p class="hero-editorial-subtext" id="hero-subtitle-text">
            Discover timeless silhouettes, authentic handloom weaves, and contemporary Indian couture. An exquisite curation by RJ Fashion Collection.
          </p>

          <!-- Action Buttons -->
          <div class="hero-editorial-actions">
            <!-- Primary CTA with Ripple Effect & Gold/Brass Gradient -->
            <a href="/shop.html" class="hero-cta-gold ripple-btn" id="hero-cta-prim">
              <span>EXPLORE COLLECTION →</span>
            </a>

            <!-- Secondary Glassmorphism CTA -->
            <a href="/shop.html?newArrival=true" class="hero-cta-glass" id="hero-cta-sec">
              <span>DISCOVER NEW ARRIVALS</span>
            </a>
          </div>
        </div>

        <!-- RIGHT COLUMN: Featured Arched Model Showcase & Glassmorphic Floating Badges -->
        <div class="luxury-hero-visual-wrap">
          <div class="hero-ambient-backlight" aria-hidden="true"></div>

          <!-- Arched Luxury Model Container with Sine-Wave Floating Physics -->
          <div class="hero-model-arched-frame">
            <div class="hero-model-inner-mask">
              <img src="https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1200&q=85"
                   alt="Featured Luxury Collection Model"
                   class="hero-model-inner-img"
                   id="hero-main-img"
                   loading="eager">
              <div class="hero-img-bottom-shade" aria-hidden="true"></div>
            </div>

            <!-- Glassmorphism Floating Badge 1: The Kundan Vault (Top Right) -->
            <div class="hero-float-glass-card card-kundan" id="hero-float-card">
              <img src="https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=200&q=80"
                   alt="Royal Kundan Vault"
                   class="float-card-thumb"
                   id="hero-float-thumb">
              <div class="float-card-meta">
                <h4 class="float-card-title" id="hero-float-title">The Kundan Vault</h4>
                <span class="float-card-tag">24K GOLD ACCENTS</span>
              </div>
            </div>

            <!-- Glassmorphism Floating Badge 2: 100% Certified Handloom (Bottom Left) -->
            <div class="hero-float-glass-card card-handloom">
              <div class="float-card-icon" aria-hidden="true">✦</div>
              <div class="float-card-meta">
                <h4 class="float-card-title">100% Certified Handloom</h4>
                <span class="float-card-tag" style="color: #c5a880;">Pure Mulberry Silk &amp; Zari</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>"""

if old_hero_pattern.search(html):
    html = old_hero_pattern.sub(new_hero_html, html)
    print("Replaced grand-hero-section in index.html with new luxury hero section.")
else:
    print("Pattern not matched directly, checking alternative replacement...")

# Also inject script tag if not present
if 'luxury-hero-mesh.js' not in html:
    html = html.replace(
        '</body>',
        '  <script src="/js/luxury-hero-mesh.js?v=20261025-01" defer></script>\n</body>'
    )
    print("Injected luxury-hero-mesh.js into index.html.")

with open(index_path, 'w', encoding='utf-8') as f:
    f.write(html)

# 2. Append CSS into public/css/style.css
style_path = r'public\css\style.css'
with open(style_path, 'r', encoding='utf-8') as f:
    style_css = f.read()

hero_css_marker = '/* === MODERN LUXURY HERO SECTION (REACT / TAILWIND / FRAMER MOTION SPEC) === */'
if hero_css_marker in style_css:
    style_css = style_css.split(hero_css_marker)[0].strip()

hero_css = """
/* === MODERN LUXURY HERO SECTION (REACT / TAILWIND / FRAMER MOTION SPEC) === */

.luxury-hero-section {
  position: relative;
  background: #0d0d0f;
  min-height: 86vh;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  padding: 56px 0;
  border-radius: 16px;
  margin: 12px 0 36px;
  box-shadow: 0 25px 60px rgba(0, 0, 0, 0.45);
  box-sizing: border-box;
}

.hero-fluid-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1;
}

.hero-radial-vignette {
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 50% 50%, rgba(0,0,0,0) 0%, rgba(10,10,12,0.7) 100%);
  pointer-events: none;
  z-index: 1;
}

.luxury-hero-grid {
  position: relative;
  z-index: 2;
  width: 100%;
  max-width: 1320px;
  margin: 0 auto;
  padding: 0 24px;
  display: grid;
  grid-template-columns: 1.15fr 0.85fr;
  gap: 40px;
  align-items: center;
  box-sizing: border-box;
}

/* Left Column Typography */
.luxury-hero-content {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  text-align: left;
}

.hero-luxury-pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(212, 175, 55, 0.45);
  border-radius: 50px;
  padding: 6px 16px;
  font-size: 0.78rem;
  font-weight: 700;
  color: #E5D5BE;
  letter-spacing: 2px;
  text-transform: uppercase;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  margin-bottom: 20px;
  box-shadow: 0 0 16px rgba(212, 175, 55, 0.15);
}

.hero-pill-sparkle {
  color: #d4af37;
  font-size: 0.85rem;
}

.hero-editorial-title {
  font-family: 'Cinzel', 'Playfair Display', Georgia, serif;
  font-size: clamp(2.2rem, 5.2vw, 4.3rem);
  font-weight: 800;
  line-height: 1.08;
  letter-spacing: 0.5px;
  margin: 0 0 20px 0;
  background: linear-gradient(180deg, #FFFFFF 0%, #F5EFEB 60%, #D4AF37 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.hero-editorial-subtext {
  font-size: clamp(0.92rem, 1.25vw, 1.10rem);
  color: #A8A199;
  line-height: 1.65;
  max-width: 540px;
  margin: 0 0 32px 0;
  font-weight: 400;
}

.hero-editorial-actions {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.hero-cta-gold {
  position: relative;
  overflow: hidden;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  background: linear-gradient(135deg, #E6CA85 0%, #D4AF37 50%, #BF953F 100%);
  color: #141210 !important;
  font-weight: 800;
  font-size: 0.92rem;
  letter-spacing: 1px;
  padding: 15px 32px;
  border-radius: 12px;
  text-decoration: none;
  box-shadow: 0 4px 24px rgba(212, 175, 55, 0.35);
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  min-height: 48px;
  touch-action: manipulation;
}

.hero-cta-gold:hover {
  background: linear-gradient(135deg, #F0D898 0%, #DEC050 50%, #CCA248 100%);
  box-shadow: 0 8px 32px rgba(212, 175, 55, 0.5);
  transform: translateY(-2px);
  color: #141210 !important;
}

.hero-cta-gold:active {
  transform: scale(0.98);
}

.hero-btn-ripple {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.45);
  transform: scale(0);
  animation: heroRippleEffect 0.6s linear;
  pointer-events: none;
}

@keyframes heroRippleEffect {
  to {
    transform: scale(3.5);
    opacity: 0;
  }
}

.hero-cta-glass {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.22);
  color: #F0E7DB !important;
  font-weight: 700;
  font-size: 0.90rem;
  letter-spacing: 1px;
  padding: 15px 28px;
  border-radius: 12px;
  text-decoration: none;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  min-height: 48px;
  touch-action: manipulation;
}

.hero-cta-glass:hover {
  border-color: rgba(212, 175, 55, 0.7);
  color: #D4AF37 !important;
  background: rgba(255, 255, 255, 0.08);
  transform: translateY(-2px);
}

/* Right Column Arched Visual */
.luxury-hero-visual-wrap {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.hero-ambient-backlight {
  position: absolute;
  inset: -12px;
  background: radial-gradient(circle, rgba(212, 175, 55, 0.22) 0%, rgba(197, 168, 128, 0.1) 40%, transparent 70%);
  border-radius: 50%;
  filter: blur(36px);
  pointer-events: none;
}

.hero-model-arched-frame {
  position: relative;
  width: 100%;
  max-width: 410px;
  aspect-ratio: 3/4;
  border-radius: 140px 140px 28px 28px;
  border: 1.5px solid rgba(212, 175, 55, 0.4);
  box-shadow: 0 25px 60px rgba(0, 0, 0, 0.8), 0 0 30px rgba(212, 175, 55, 0.18);
  animation: heroFloatingSine 5.5s ease-in-out infinite;
  transform-style: preserve-3d;
  transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes heroFloatingSine {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-14px);
  }
}

.hero-model-inner-mask {
  width: 100%;
  height: 100%;
  border-radius: 140px 140px 28px 28px;
  overflow: hidden;
  position: relative;
  background: #181615;
}

.hero-model-inner-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  display: block;
  transition: transform 0.7s ease-out;
}

.hero-model-arched-frame:hover .hero-model-inner-img {
  transform: scale(1.04);
}

.hero-img-bottom-shade {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(13, 13, 15, 0.8) 0%, transparent 60%);
  pointer-events: none;
}

/* Glassmorphic Floating Badges */
.hero-float-glass-card {
  position: absolute;
  background: rgba(20, 18, 17, 0.82);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(212, 175, 55, 0.45);
  border-radius: 16px;
  padding: 10px 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  box-shadow: 0 14px 34px rgba(0, 0, 0, 0.6);
  z-index: 5;
  transition: border-color 0.25s ease;
}

.hero-float-glass-card:hover {
  border-color: #D4AF37;
}

.card-kundan {
  top: -16px;
  right: -20px;
}

.float-card-thumb {
  width: 46px;
  height: 46px;
  border-radius: 10px;
  object-fit: cover;
  border: 1px solid rgba(212, 175, 55, 0.4);
}

.card-handloom {
  bottom: -20px;
  left: -20px;
  border-color: rgba(255, 255, 255, 0.22);
}

.float-card-icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: linear-gradient(135deg, #d4af37, #8c7326);
  color: #0d0d0f;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
}

.float-card-meta {
  display: flex;
  flex-direction: column;
}

.float-card-title {
  margin: 0;
  font-size: 0.82rem;
  font-weight: 700;
  color: #F7F2EA;
  line-height: 1.25;
}

.float-card-tag {
  font-size: 0.68rem;
  font-weight: 700;
  color: #D4AF37;
  letter-spacing: 1px;
  margin-top: 2px;
}

/* Responsive Hero Section */
@media (max-width: 991px) {
  .luxury-hero-section {
    padding: 44px 0 54px;
    margin: 8px 0 28px;
    border-radius: 12px;
  }
  .luxury-hero-grid {
    grid-template-columns: 1fr;
    gap: 40px;
    padding: 0 16px;
  }
  .luxury-hero-content {
    align-items: center;
    text-align: center;
  }
  .hero-editorial-subtext {
    max-width: 100%;
  }
  .hero-editorial-actions {
    justify-content: center;
    width: 100%;
  }
  .card-kundan {
    top: -12px;
    right: 0px;
  }
  .card-handloom {
    bottom: -16px;
    left: 0px;
  }
}

@media (max-width: 480px) {
  .luxury-hero-section {
    padding: 32px 0 44px;
  }
  .hero-editorial-actions {
    flex-direction: column;
    width: 100%;
  }
  .hero-cta-gold,
  .hero-cta-glass {
    width: 100%;
    text-align: center;
  }
  .hero-model-arched-frame {
    max-width: 310px;
  }
  .hero-float-glass-card {
    padding: 8px 12px;
  }
  .float-card-thumb {
    width: 38px;
    height: 38px;
  }
}
"""

with open(style_path, 'w', encoding='utf-8') as f:
    f.write(style_css + '\n' + hero_css)
print("Updated public/css/style.css with luxury hero CSS.")
