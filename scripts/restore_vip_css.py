style_path = r'public\css\style.css'
with open(style_path, 'r', encoding='utf-8') as f:
    css = f.read()

target = "/* Brand Storytelling Section (Our Story) */"

vip_css = """/* VIP Invitation Section */
.vip-invitation-section {
  margin-top: 48px;
  background: linear-gradient(135deg, #18151c 0%, #291b24 100%);
  border-radius: var(--radius-lg);
  padding: 48px;
  color: #ffffff;
  text-align: center;
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(197, 160, 89, 0.3);
}

.vip-invitation-wrap {
  max-width: 640px;
  margin: 0 auto;
  position: relative;
  z-index: 2;
}

.vip-invitation-badge {
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 2px;
  color: #c5a059;
  text-transform: uppercase;
  margin-bottom: 8px;
  display: inline-block;
}

.vip-invitation-title {
  font-family: var(--font-serif);
  font-size: 2.2rem;
  font-weight: 700;
  margin: 0 0 10px 0;
  color: #ffffff;
}

.vip-invitation-sub {
  font-size: 0.95rem;
  color: #cbd5e1;
  margin: 0 0 24px 0;
  line-height: 1.5;
}

.vip-form {
  display: flex;
  gap: 10px;
  max-width: 500px;
  margin: 0 auto;
}

.vip-input {
  flex: 1;
  padding: 13px 18px;
  border-radius: 6px;
  border: 1px solid rgba(255,255,255,0.25);
  background: rgba(255,255,255,0.08);
  color: #ffffff;
  font-size: 0.9rem;
  outline: none;
  backdrop-filter: blur(8px);
}

.vip-input::placeholder {
  color: #94a3b8;
}

.vip-input:focus {
  border-color: #c5a059;
  box-shadow: 0 0 0 3px rgba(197, 160, 89, 0.25);
}

.vip-submit-btn {
  background: linear-gradient(135deg, #c5a059 0%, #e2c589 100%);
  color: #121013;
  border: none;
  font-weight: 700;
  font-size: 0.85rem;
  letter-spacing: 0.8px;
  text-transform: uppercase;
  padding: 13px 24px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.25s ease;
  white-space: nowrap;
}

.vip-submit-btn:hover {
  background: #ffffff;
  color: #72132a;
  transform: translateY(-2px);
}

"""

if "vip-invitation-section" not in css:
    css = css.replace(target, vip_css + "\n" + target)
    with open(style_path, 'w', encoding='utf-8') as f:
        f.write(css)
    print("Added back vip-invitation-section CSS.")
else:
    print("Already present.")
