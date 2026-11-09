import re

about_html_path = 'C:/Users/omvin/.gemini/antigravity/scratch/RJ-Fashion-Collection/public/about.html'

with open(about_html_path, 'r', encoding='utf-8') as f:
    html = f.read()

# Luxury main section replacement
new_main_content = '''  <!-- About, Terms & Legal Hub -->
  <main class="container" style="padding-top: 36px; padding-bottom: 70px; max-width: 1040px;">

    <!-- Editorial Hero Title Lockup -->
    <div style="text-align: center; margin-bottom: 32px;">
      <div style="display: inline-flex; align-items: center; gap: 8px; font-size: 0.76rem; font-weight: 800; color: #8C6D3F; text-transform: uppercase; letter-spacing: 0.22em; margin-bottom: 10px;">
        <span>THE ROYAL HOUSE</span>
        <span>•</span>
        <span>EST. ODISHA</span>
      </div>
      <h1 style="font-family: 'Playfair Display', Georgia, serif; font-size: 2.6rem; font-weight: 700; color: var(--deliv-text-primary, #111111); margin: 0 0 12px 0; line-height: 1.2;">
        RJ Fashion Collection
      </h1>
      <p style="font-size: 1.05rem; color: var(--deliv-text-secondary, #4b5563); max-width: 640px; margin: 0 auto; line-height: 1.6;">
        Where Fashion Meets Family. Handcrafted royal bridal sarees, heirloom Banarasi weaves, celebration sherwanis, and artisanal jewelry.
      </p>
    </div>

    <!-- Quick Navigation Pill Bar (Smooth Scroll Anchor Links) -->
    <nav class="policy-pill-nav" aria-label="Legal Navigation" style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; margin-bottom: 36px;">
      <a href="#heritage" class="policy-pill-btn">🏛️ Atelier Heritage</a>
      <a href="#terms" class="policy-pill-btn policy-pill-active">📜 Terms &amp; Conditions</a>
      <a href="#privacy" class="policy-pill-btn">🔒 Privacy Policy</a>
      <a href="#shipping" class="policy-pill-btn">🚚 Shipping &amp; Transit</a>
      <a href="#authenticity" class="policy-pill-btn">✨ Authenticity &amp; Returns</a>
      <a href="#grievance" class="policy-pill-btn">⚖️ Grievance Redressal</a>
    </nav>

    <!-- Main Editorial Container Card -->
    <div class="policy-card-shell" style="background: var(--card-bg, #ffffff); border-radius: 16px; border: 1px solid var(--border, #E5E0D8); padding: 40px 48px; box-shadow: 0 10px 30px -10px rgba(0,0,0,0.06);">

      <!-- SECTION 1: HERITAGE & ATELIER -->
      <section id="heritage" class="policy-section-block" style="margin-bottom: 48px;">
        <div class="policy-section-header">
          <span class="policy-badge">HERITAGE &amp; ARTISANS</span>
          <h2 class="policy-title">Our Heritage &amp; Artisanal Atelier</h2>
        </div>
        <p class="policy-text">
          Founded with a lifelong dedication to the royal textile traditions of India, <strong>RJ Fashion Collection</strong> represents the confluence of timeless handloom craftsmanship and contemporary family celebrations. From generational silk weavers in Kanchipuram, Varanasi, and Chanderi to our master goldsmiths crafting antique bridal adornments, our collections celebrate the sacred spirit of Indian festivities.
        </p>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 20px; margin-top: 24px;">
          <div class="feature-subcard">
            <h3 style="font-family: 'Playfair Display', serif; font-size: 1.12rem; margin: 0 0 6px 0; color: var(--deliv-text-primary, #111);">Master Weaver Alliances</h3>
            <p style="font-size: 0.88rem; color: var(--deliv-text-secondary, #4b5563); margin: 0; line-height: 1.55;">Direct partnerships with generational weaving clusters in Varanasi, Kanchipuram, and Paithan ensuring 100% authentic pure silk sarees.</p>
          </div>
          <div class="feature-subcard">
            <h3 style="font-family: 'Playfair Display', serif; font-size: 1.12rem; margin: 0 0 6px 0; color: var(--deliv-text-primary, #111);">Bespoke Family Ensembles</h3>
            <p style="font-size: 0.88rem; color: var(--deliv-text-secondary, #4b5563); margin: 0; line-height: 1.55;">Coordinated regal edits for brides, grooms, festive girls, and young royals tailored for celebratory harmony.</p>
          </div>
          <div class="feature-subcard">
            <h3 style="font-family: 'Playfair Display', serif; font-size: 1.12rem; margin: 0 0 6px 0; color: var(--deliv-text-primary, #111);">Physical Showroom</h3>
            <p style="font-size: 0.88rem; color: var(--deliv-text-secondary, #4b5563); margin: 0; line-height: 1.55;">Visit our flagship store at <strong>RJ FASHION COLLECTION, Sarbhal, Jharsuguda, Odisha - 768201</strong> for tactile bridal consultations.</p>
          </div>
        </div>
      </section>

      <hr class="policy-divider">

      <!-- SECTION 2: TERMS & CONDITIONS (#terms) -->
      <section id="terms" class="policy-section-block" style="margin: 48px 0;">
        <div class="policy-section-header">
          <span class="policy-badge" style="background: rgba(184, 134, 11, 0.12); color: #8C6D3F; border-color: rgba(184, 134, 11, 0.3);">OFFICIAL LEGAL CONTRACT</span>
          <h2 class="policy-title">Terms &amp; Conditions</h2>
          <div style="font-size: 0.82rem; color: var(--deliv-text-secondary, #6b7280); margin-top: 4px;">Last Updated: November 2026 • Compliant with Consumer Protection (E-Commerce) Rules, 2020 &amp; Information Technology Act, 2000</div>
        </div>

        <div class="policy-clause">
          <h3 class="clause-title">1. Merchant Identity &amp; Operating Entity</h3>
          <p class="policy-text">
            This website (<strong>https://rj-fashion-collection.web.app</strong>) is owned and operated by <strong>RJ FASHION COLLECTION</strong>, a registered Indian retail and e-commerce establishment located at:
            <br>
            <strong style="color: var(--deliv-text-primary, #111);">Store Address:</strong> RJ FASHION COLLECTION, Sarbhal, Jharsuguda, Odisha, Postal Code - 768201, India.
            <br>
            <strong style="color: var(--deliv-text-primary, #111);">Customer Support &amp; Concierge:</strong> +91 7894093586 • <strong style="color: var(--deliv-text-primary, #111);">Email:</strong> rjfashioncollection@gmail.com.
          </p>
        </div>

        <div class="policy-clause">
          <h3 class="clause-title">2. Acceptance of Terms &amp; User Eligibility</h3>
          <p class="policy-text">
            By browsing, creating an account, or purchasing from this website, you irrevocably agree to be bound by these Terms and Conditions. Purchases are restricted to individuals who are legally capable of entering into binding contracts under the Indian Contract Act, 1872 (minimum 18 years of age). If purchasing on behalf of a family member, you warrant that you are authorized to provide their delivery information.
          </p>
        </div>

        <div class="policy-clause">
          <h3 class="clause-title">3. Handcrafted Product Variations &amp; Visual Authenticity</h3>
          <p class="policy-text">
            Every Banarasi silk saree, Kanchipuram weave, hand-embroidered bridal lehenga, and micro-plated Kundan necklace featured on RJ Fashion Collection is handcrafted by master artisans. Subtle natural variations in thread texture, zari luster, motif alignment, and dye saturation are intrinsic hallmarks of genuine artisan weaving and cannot be treated as manufacturing defects. We capture products under balanced daylight studio lighting; minor color variations may occur depending on your device’s screen calibration.
          </p>
        </div>

        <div class="policy-clause">
          <h3 class="clause-title">4. Pricing, GST &amp; Currency</h3>
          <p class="policy-text">
            All prices listed on our digital storefront are quoted in <strong>Indian National Rupees (₹ INR)</strong> and are inclusive of all applicable Goods and Services Tax (GST). RJ Fashion Collection reserves the right to revise catalog pricing, festive promotional tiers, and discounts at any time prior to confirmed order placement.
          </p>
        </div>

        <div class="policy-clause">
          <h3 class="clause-title">5. Payment Gateways &amp; Merchant Terminal Authentication</h3>
          <p class="policy-text">
            We support certified, encrypted payment channels. All digital payments are processed through:
          </p>
          <ul class="policy-list">
            <li><strong>PhonePe Official Payment Gateway:</strong> Supporting UPI (Google Pay, PhonePe, Paytm, BHIM), RuPay, Visa, Mastercard, Net Banking, and Enabled Wallets.</li>
            <li><strong>Official Merchant UPI ID:</strong> <code style="background: rgba(0,0,0,0.06); padding: 2px 6px; border-radius: 4px; font-weight: 700;">Q070080131@ybl</code> • <strong>Terminal ID:</strong> Terminal 1-Q070080131 • <strong>Merchant:</strong> RJ FASHION.</li>
            <li><strong>Global Card Gateway:</strong> 256-Bit SSL 3D-Secure 2.0 card processing powered by Stripe.</li>
            <li><strong>Zero Surcharge:</strong> We charge zero additional convenience fees or payment surcharges on checkout.</li>
          </ul>
        </div>

        <div class="policy-clause">
          <h3 class="clause-title">6. Coupon Code Fair Usage &amp; Anti-Abuse Rules</h3>
          <p class="policy-text">
            Promotional coupons and festive discount codes (such as <code style="font-weight: 700;">GRANDRJ</code>, <code style="font-weight: 700;">ROYAL10</code>, and <code style="font-weight: 700;">WELCOME500</code>) are governed by strict fair usage policies:
          </p>
          <ul class="policy-list">
            <li><strong>Strictly Once Per Customer &amp; Once Per IP Address:</strong> To preserve fair access for genuine patrons, each promotional code may be redeemed only once per household/IP address.</li>
            <li><strong>Multi-Account Prevention:</strong> Attempts to circumvent single-use restrictions through secondary accounts, alias emails, disposable credentials, or automated scripts will result in immediate coupon cancellation and order rejection.</li>
          </ul>
        </div>

        <div class="policy-clause">
          <h3 class="clause-title">7. Shipping, Pan-India Dispatch &amp; Transit Insurance</h3>
          <p class="policy-text">
            Orders placed on RJ Fashion Collection are verified, packed in tamper-proof luxury packaging, and dispatched within <strong>24 to 48 hours</strong> via our air express logistics partners (Blue Dart, Delhivery Priority Air, India Post Speed Post). Doorstep delivery across major Indian metropolitan areas typically arrives in <strong>2 to 4 business days</strong>, and <strong>3 to 5 business days</strong> for all other postal zones.
          </p>
        </div>

        <div class="policy-clause">
          <h3 class="clause-title">8. Artisanal Final Sale &amp; Transit Damage Replacement Guarantee</h3>
          <p class="policy-text">
            Due to the delicate nature of handmade pure zari brocades and custom bridal jewellery, our products are sold on a <strong>Final Sale</strong> basis. In the rare event that an ensemble or jewelry box is damaged during transit:
          </p>
          <ul class="policy-list">
            <li><strong>Guaranteed Replacement:</strong> We guarantee an immediate, free replacement for transit-damaged items.</li>
            <li><strong>Continuous Unboxing Video Required:</strong> Customers must record a clear, continuous, unedited video of the parcel opening, showing the external shipping label and damaged item.</li>
            <li><strong>48-Hour Notice SLA:</strong> Notice with video proof must be submitted via email to <strong style="color: var(--deliv-text-primary, #111);">rjfashioncollection@gmail.com</strong> or our WhatsApp Concierge (<strong style="color: var(--deliv-text-primary, #111);">+91 7894093586</strong>) within 48 hours of recorded carrier delivery.</li>
          </ul>
        </div>

        <div class="policy-clause">
          <h3 class="clause-title">9. Intellectual Property Rights</h3>
          <p class="policy-text">
            All content published on this website—including the RJ Fashion Collection brand name, royal monogram mark, textile designs, photographs, graphics, software, and marketing materials—is the exclusive proprietary property of RJ Fashion Collection and is protected under the Copyright Act, 1957 and Trade Marks Act, 1999 of India.
          </p>
        </div>

        <div class="policy-clause">
          <h3 class="clause-title">10. Governing Law &amp; Jurisdiction</h3>
          <p class="policy-text">
            These Terms &amp; Conditions and all commercial transactions shall be governed by and construed in accordance with the laws of the Republic of India. Any disputes arising in connection with orders or services shall be subject to the exclusive jurisdiction of the competent courts of <strong>Jharsuguda, Odisha, India</strong>.
          </p>
        </div>
      </section>

      <hr class="policy-divider">

      <!-- SECTION 3: PRIVACY POLICY (#privacy) -->
      <section id="privacy" class="policy-section-block" style="margin: 48px 0;">
        <div class="policy-section-header">
          <span class="policy-badge" style="background: rgba(16, 185, 129, 0.1); color: #065f46; border-color: rgba(16, 185, 129, 0.3);">DATA PRIVACY &amp; ENCRYPTION</span>
          <h2 class="policy-title">Privacy Policy</h2>
          <div style="font-size: 0.82rem; color: var(--deliv-text-secondary, #6b7280); margin-top: 4px;">Rigorous Client Confidentiality • Zero Third-Party Data Monetization</div>
        </div>

        <p class="policy-text">
          At RJ Fashion Collection, the confidentiality and privacy of our patrons is of paramount importance. This Privacy Policy details how we collect, safeguard, and utilize customer information:
        </p>

        <div class="policy-clause">
          <h3 class="clause-title">1. Information We Collect</h3>
          <ul class="policy-list">
            <li><strong>Account &amp; Order Credentials:</strong> Full name, telephone number, email address, and doorstep delivery address.</li>
            <li><strong>Transactional Records:</strong> Order numbers, item selections, payment status, and PhonePe merchant transaction references.</li>
            <li><strong>Device &amp; Security Telemetry:</strong> Anonymized browser signatures and IP addresses exclusively to prevent coupon abuse, block automated bot attacks, and protect customer accounts.</li>
          </ul>
        </div>

        <div class="policy-clause">
          <h3 class="clause-title">2. Absolute Non-Disclosure &amp; Zero Sale Commitment</h3>
          <p class="policy-text">
            We <strong>never</strong> sell, rent, monetize, or trade your personal data to advertisers, data brokers, or third-party marketing firms. Customer information is used strictly by our internal concierge team and authorized express logistics carriers (Blue Dart / Delhivery) to fulfill your orders.
          </p>
        </div>

        <div class="policy-clause">
          <h3 class="clause-title">3. Enterprise 256-Bit SSL Encryption</h3>
          <p class="policy-text">
            All data transmitted between your browser and our servers is secured with 256-Bit Transport Layer Security (TLS/SSL). Sensitive payment tokens are handled directly by PCI-DSS Level 1 compliant gateway partners (PhonePe &amp; Stripe); our servers never see or record your credit card numbers, CVVs, or UPI PINs.
          </p>
        </div>
      </section>

      <hr class="policy-divider">

      <!-- SECTION 4: SHIPPING & DELIVERY (#shipping) -->
      <section id="shipping" class="policy-section-block" style="margin: 48px 0;">
        <div class="policy-section-header">
          <span class="policy-badge">LOGISTICS &amp; TRANSIT</span>
          <h2 class="policy-title">Shipping &amp; Delivery Policy</h2>
        </div>
        <p class="policy-text">
          We ensure every piece of bridal couture and heirloom weave reaches your doorstep with absolute care:
        </p>
        <ul class="policy-list">
          <li><strong>Complimentary Insured Shipping:</strong> Available on all orders with a cart value of ₹999 or above across India. A nominal ₹99 shipping fee applies to orders below ₹999.</li>
          <li><strong>Dispatch Timeline:</strong> Ready-to-ship ensembles are dispatched within 24 to 48 hours of order confirmation.</li>
          <li><strong>Transit Timeline:</strong> Metro cities: 2 to 3 business days. Non-metro and regional locations: 3 to 5 business days.</li>
          <li><strong>Live Milestone Tracking:</strong> Real-time shipment tracking with carrier tracking numbers is accessible directly under <a href="/orders.html" style="color: var(--deliv-text-primary, #111); font-weight: 700; text-decoration: underline;">My Orders</a>.</li>
        </ul>
      </section>

      <hr class="policy-divider">

      <!-- SECTION 5: GRIEVANCE REDRESSAL (#grievance) -->
      <section id="grievance" class="policy-section-block" style="margin-top: 48px;">
        <div class="policy-section-header">
          <span class="policy-badge">CONSUMER COMPLIANCE</span>
          <h2 class="policy-title">Grievance Redressal &amp; Concierge Contact</h2>
        </div>
        <p class="policy-text">
          In compliance with the Consumer Protection (E-Commerce) Rules, 2020, the designated Grievance Officer for RJ Fashion Collection is detailed below:
        </p>

        <div style="background: rgba(0,0,0,0.02); border: 1px solid var(--border, #E5E0D8); border-radius: 12px; padding: 22px; margin-top: 18px;">
          <div style="font-weight: 700; font-size: 1.05rem; color: var(--deliv-text-primary, #111); margin-bottom: 6px;">Grievance Officer: Customer Redressal Cell</div>
          <div style="font-size: 0.9rem; color: var(--deliv-text-secondary, #4b5563); line-height: 1.6;">
            <strong>Atelier Address:</strong> RJ FASHION COLLECTION, Sarbhal, Jharsuguda, Odisha - 768201, India
            <br>
            <strong>Direct Phone:</strong> <a href="tel:+917894093586" style="color: var(--deliv-text-primary, #111); text-decoration: underline; font-weight: 600;">+91 7894093586</a>
            <br>
            <strong>Official Email:</strong> <a href="mailto:rjfashioncollection@gmail.com" style="color: var(--deliv-text-primary, #111); text-decoration: underline; font-weight: 600;">rjfashioncollection@gmail.com</a>
            <br>
            <strong>Acknowledgement SLA:</strong> Within 48 hours • <strong>Resolution SLA:</strong> Within 30 days of grievance receipt.
          </div>
        </div>
      </section>

    </div>
  </main>'''

# Add styling for policy pills and sections
custom_policy_styles = '''
  <style>
    .policy-pill-nav {
      position: sticky;
      top: 76px;
      z-index: 20;
      background: rgba(255, 255, 255, 0.92);
      backdrop-filter: blur(10px);
      padding: 10px 16px;
      border-radius: 9999px;
      border: 1px solid var(--border, #E5E0D8);
      max-width: 900px;
      margin-left: auto;
      margin-right: auto;
      box-shadow: 0 4px 16px rgba(0,0,0,0.04);
    }
    [data-theme="dark"] .policy-pill-nav,
    .dark-theme .policy-pill-nav {
      background: rgba(18, 18, 24, 0.92);
      border-color: rgba(255, 255, 255, 0.1);
    }
    .policy-pill-btn {
      padding: 7px 16px;
      border-radius: 9999px;
      font-size: 0.8rem;
      font-weight: 700;
      text-decoration: none;
      color: var(--deliv-text-secondary, #4b5563);
      background: transparent;
      transition: all 0.2s ease;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .policy-pill-btn:hover,
    .policy-pill-btn:focus {
      background: rgba(0,0,0,0.06);
      color: var(--deliv-text-primary, #111111);
    }
    [data-theme="dark"] .policy-pill-btn:hover,
    .dark-theme .policy-pill-btn:hover {
      background: rgba(255,255,255,0.1);
      color: #ffffff;
    }
    .policy-section-header {
      margin-bottom: 20px;
    }
    .policy-badge {
      display: inline-block;
      font-size: 0.7rem;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.14em;
      padding: 3px 10px;
      border-radius: 4px;
      background: rgba(15, 56, 42, 0.08);
      color: #0F382A;
      border: 1px solid rgba(15, 56, 42, 0.2);
      margin-bottom: 8px;
    }
    [data-theme="dark"] .policy-badge,
    .dark-theme .policy-badge {
      background: rgba(16, 185, 129, 0.15);
      color: #34d399;
      border-color: rgba(52, 211, 153, 0.3);
    }
    .policy-title {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 1.85rem;
      font-weight: 700;
      color: var(--deliv-text-primary, #111111);
      margin: 4px 0 0 0;
    }
    .policy-text {
      font-size: 0.95rem;
      line-height: 1.78;
      color: var(--deliv-text-secondary, #4b5563);
      margin: 0 0 16px 0;
    }
    .policy-clause {
      margin-top: 24px;
      padding-left: 14px;
      border-left: 2px solid var(--border, #E5E0D8);
    }
    .clause-title {
      font-size: 1.05rem;
      font-weight: 700;
      color: var(--deliv-text-primary, #111111);
      margin: 0 0 6px 0;
      font-family: 'Playfair Display', Georgia, serif;
    }
    .policy-list {
      margin: 10px 0 16px 20px;
      color: var(--deliv-text-secondary, #4b5563);
      font-size: 0.92rem;
      line-height: 1.7;
    }
    .policy-divider {
      border: none;
      height: 1px;
      background: var(--border, #E5E0D8);
      margin: 40px 0;
    }
    .feature-subcard {
      background: rgba(0,0,0,0.02);
      border-radius: 10px;
      padding: 18px 20px;
      border-left: 3px solid #8C6D3F;
    }
    [data-theme="dark"] .feature-subcard,
    .dark-theme .feature-subcard {
      background: rgba(255,255,255,0.03);
    }
    /* URL Hash Highlighting Animation */
    :target {
      scroll-margin-top: 140px;
      animation: targetHighlight 2.4s ease-out;
    }
    @keyframes targetHighlight {
      0% { background: rgba(184, 134, 11, 0.18); border-radius: 8px; }
      100% { background: transparent; }
    }
  </style>
'''

# Insert styles before </head>
if '</head>' in html:
    html = html.replace('</head>', f'{custom_policy_styles}\n</head>')

# Replace <main>...</main>
main_pattern = r'<main class="container".*?</main>'
html = re.sub(main_pattern, new_main_content, html, flags=re.DOTALL)

with open(about_html_path, 'w', encoding='utf-8') as f:
    f.write(html)

print("Upgraded public/about.html with luxury legal hub & #terms policy")
