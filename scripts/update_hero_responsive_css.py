css_path = r'public\css\style.css'
with open(css_path, 'r', encoding='utf-8') as f:
    content = f.read()

marker = '/* === MODERN LUXURY HERO SECTION (REACT / TAILWIND / FRAMER MOTION SPEC) === */'
base = content.split(marker)[0].strip()

new_hero_css = """/* === MODERN LUXURY HERO SECTION (REACT / TAILWIND / FRAMER MOTION SPEC) === */

.luxury-hero-section,
.luxury-hero-section *,
.luxury-hero-section *::before,
.luxury-hero-section *::after {
  box-sizing: border-box;
}

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
  max-width: 100%;
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
  box-sizing: border-box;
  max-width: 100%;
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
  max-width: 100%;
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
  max-width: 100%;
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
  box-sizing: border-box;
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
  box-sizing: border-box;
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
  max-width: 100%;
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
  box-sizing: border-box;
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
  box-sizing: border-box;
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
    gap: 36px;
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
    padding: 28px 0 36px;
    margin: 6px 0 20px;
    border-radius: 10px;
    max-width: 100%;
    overflow: hidden;
  }
  .luxury-hero-grid {
    padding: 0 8px;
    gap: 28px;
    max-width: 100%;
  }
  .hero-luxury-pill {
    font-size: 0.66rem;
    letter-spacing: 0.8px;
    padding: 5px 12px;
    max-width: 100%;
    white-space: normal;
    text-align: center;
    margin-bottom: 14px;
  }
  .hero-editorial-title {
    font-size: clamp(1.5rem, 7.2vw, 2.0rem);
    line-height: 1.15;
    margin-bottom: 14px;
    max-width: 100%;
    word-break: break-word;
  }
  .hero-editorial-subtext {
    font-size: 0.86rem;
    line-height: 1.55;
    margin-bottom: 24px;
    max-width: 100%;
    padding: 0 4px;
  }
  .hero-editorial-actions {
    flex-direction: column;
    width: 100%;
    gap: 12px;
  }
  .hero-cta-gold,
  .hero-cta-glass {
    width: 100%;
    max-width: 100%;
    padding: 13px 18px;
    font-size: 0.84rem;
    text-align: center;
    box-sizing: border-box;
  }
  .hero-model-arched-frame {
    max-width: 240px;
    width: 100%;
    margin: 0 auto;
    border-radius: 110px 110px 22px 22px;
  }
  .hero-model-inner-mask {
    border-radius: 110px 110px 22px 22px;
  }
  .hero-float-glass-card {
    padding: 6px 10px;
    gap: 8px;
    max-width: 170px;
  }
  .card-kundan {
    top: -8px;
    right: -4px;
  }
  .card-handloom {
    bottom: -10px;
    left: -4px;
  }
  .float-card-thumb {
    width: 32px;
    height: 32px;
    border-radius: 8px;
  }
  .float-card-icon {
    width: 28px;
    height: 28px;
    font-size: 0.85rem;
  }
  .float-card-title {
    font-size: 0.70rem;
  }
  .float-card-tag {
    font-size: 0.58rem;
  }
}
"""

with open(css_path, 'w', encoding='utf-8') as f:
    f.write(base + '\n\n' + new_hero_css)

print("Successfully updated hero section CSS with complete responsive guarantees!")
