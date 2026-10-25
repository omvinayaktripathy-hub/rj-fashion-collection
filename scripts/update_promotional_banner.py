import re

# 1. Update public/css/style.css
style_path = r'public\css\style.css'
with open(style_path, 'r', encoding='utf-8') as f:
    css = f.read()

# Pattern to replace old grand-campaign-strip CSS block up to .our-story
old_block_pattern = re.compile(
    r'/\* Grand Opening Celebration Campaign Bar & Countdown \*/.*?(?=/\* Brand Storytelling Section)',
    re.DOTALL
)

new_campaign_css = """/* Grand Opening Celebration Campaign Bar & Digital Countdown Banner */
.grand-campaign-strip {
  margin-top: 32px;
  position: relative;
  background: #0A0A0C;
  border-radius: var(--radius-lg);
  padding: 30px 36px;
  display: grid;
  grid-template-columns: 1.15fr 0.85fr;
  gap: 32px;
  align-items: center;
  box-sizing: border-box;
  overflow: hidden;
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.55);
  border: 1.5px solid transparent;
  background-image: linear-gradient(#0A0A0C, #0A0A0C), linear-gradient(135deg, rgba(212, 175, 55, 0.65) 0%, rgba(197, 168, 128, 0.15) 50%, rgba(212, 175, 55, 0.55) 100%);
  background-origin: border-box;
  background-clip: padding-box, border-box;
}

/* Subtle ambient gold radial lighting */
.grand-campaign-strip::before {
  content: '';
  position: absolute;
  top: -60px;
  right: -60px;
  width: 280px;
  height: 280px;
  background: radial-gradient(circle, rgba(212, 175, 55, 0.15) 0%, rgba(197, 168, 128, 0.05) 50%, transparent 70%);
  border-radius: 50%;
  pointer-events: none;
  z-index: 1;
}

[data-theme="dark"] .grand-campaign-strip,
.dark-theme .grand-campaign-strip {
  background: #0A0A0C;
  border-color: transparent;
  background-image: linear-gradient(#0A0A0C, #0A0A0C), linear-gradient(135deg, rgba(212, 175, 55, 0.7) 0%, rgba(197, 168, 128, 0.2) 50%, rgba(212, 175, 55, 0.6) 100%);
}

.campaign-privilege-box {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.campaign-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  align-self: flex-start;
  font-size: 0.72rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  color: #E5D5BE;
  background: rgba(212, 175, 55, 0.12);
  border: 1px solid rgba(212, 175, 55, 0.4);
  padding: 5px 14px;
  border-radius: 20px;
}

[data-theme="dark"] .campaign-badge,
.dark-theme .campaign-badge {
  background: rgba(212, 175, 55, 0.15);
  color: #E5D5BE;
  border-color: rgba(212, 175, 55, 0.5);
}

.campaign-title {
  font-family: 'Cinzel', 'Playfair Display', Georgia, serif;
  font-size: clamp(1.45rem, 2.5vw, 1.85rem);
  font-weight: 700;
  color: #FFFFFF;
  margin: 0;
  letter-spacing: 0.4px;
}

[data-theme="dark"] .campaign-title,
.dark-theme .campaign-title {
  color: #FFFFFF;
}

.campaign-desc {
  font-size: 0.88rem;
  color: #A8A199;
  line-height: 1.6;
  margin: 0;
}

.countdown-timer-wrap {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
}

.timer-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(18, 16, 22, 0.85);
  border: 1px solid rgba(212, 175, 55, 0.35);
  border-radius: 12px;
  width: 76px;
  height: 76px;
  text-align: center;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5), inset 0 1px 1px rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  transition: border-color 0.25s ease, transform 0.25s ease;
  box-sizing: border-box;
}

.timer-box:hover {
  border-color: rgba(212, 175, 55, 0.7);
  transform: translateY(-2px);
}

[data-theme="dark"] .timer-box,
.dark-theme .timer-box {
  background: rgba(18, 16, 22, 0.9);
  border-color: rgba(212, 175, 55, 0.4);
}

/* Glowing metallic countdown digits */
.timer-num {
  font-size: 1.85rem;
  font-weight: 800;
  font-family: 'Cinzel', 'Playfair Display', monospace, Georgia, serif;
  line-height: 1;
  background: linear-gradient(180deg, #FFFFFF 0%, #F5EFEB 40%, #D4AF37 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  filter: drop-shadow(0 0 10px rgba(212, 175, 55, 0.5));
}

[data-theme="dark"] .timer-num,
.dark-theme .timer-num {
  background: linear-gradient(180deg, #FFFFFF 0%, #F5EFEB 40%, #D4AF37 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  filter: drop-shadow(0 0 10px rgba(212, 175, 55, 0.5));
}

.timer-lbl {
  font-size: 0.65rem;
  text-transform: uppercase;
  font-weight: 700;
  letter-spacing: 1.5px;
  color: #C5A880;
  margin-top: 5px;
}

@media (max-width: 991px) {
  .grand-campaign-strip {
    grid-template-columns: 1fr;
    padding: 24px;
    gap: 24px;
  }
  .countdown-timer-wrap {
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .grand-campaign-strip {
    padding: 20px 12px;
    gap: 20px;
    margin-top: 20px;
  }
  .countdown-timer-wrap {
    gap: 8px;
    width: 100%;
    justify-content: space-between;
  }
  .timer-box {
    width: auto;
    flex: 1;
    min-width: 54px;
    height: 64px;
    padding: 6px 2px;
  }
  .timer-num {
    font-size: 1.45rem;
  }
  .timer-lbl {
    font-size: 0.58rem;
    letter-spacing: 1px;
    margin-top: 3px;
  }
}

"""

if old_block_pattern.search(css):
    css = old_block_pattern.sub(new_campaign_css, css)
    print("Replaced old campaign strip CSS in style.css.")
else:
    print("Could not match old campaign strip block directly, appending...")
    css += "\n" + new_campaign_css

with open(style_path, 'w', encoding='utf-8') as f:
    f.write(css)

# 2. Update public/index.html with subtle linear gold border and privilege styling
index_path = r'public\index.html'
with open(index_path, 'r', encoding='utf-8') as f:
    html = f.read()

# Enhance code tag in campaign paragraph to match luxury styling
html = re.sub(
    r'<strong style="color:var\(--primary\);[^"]*">GRANDRJ</strong>',
    '<strong class="campaign-code-highlight" style="color: #E6CA85; font-weight: 800; letter-spacing: 0.8px; background: rgba(255,255,255,0.06); border: 1px solid rgba(212,175,55,0.4); padding: 2px 8px; border-radius: 6px;">GRANDRJ</strong>',
    html
)

with open(index_path, 'w', encoding='utf-8') as f:
    f.write(html)
print("Updated public/index.html with refined campaign highlight.")
