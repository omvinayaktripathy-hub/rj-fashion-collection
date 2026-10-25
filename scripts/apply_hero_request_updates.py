import re

# 1. Update public/index.html
index_path = r'public\index.html'
with open(index_path, 'r', encoding='utf-8') as f:
    html = f.read()

# Replace subtitle
html = re.sub(
    r'(<p class="hero-editorial-subtext" id="hero-subtitle-text">\s*).*?(\s*</p>)',
    r'\1Curated contemporary ethnic wear, trendy fashion, and modern statement accessories.\2',
    html,
    flags=re.DOTALL
)

# Replace primary CTA button text to: EXPLORE COLLECTION ->
html = re.sub(
    r'(<a [^>]*id="hero-cta-prim"[^>]*>\s*<span>).*?(</span>\s*</a>)',
    r'\1EXPLORE COLLECTION -&gt;\2',
    html,
    flags=re.DOTALL
)

# Replace Secondary button text: DISCOVER NEW ARRIVALS
html = re.sub(
    r'(<a [^>]*id="hero-cta-sec"[^>]*>\s*<span>).*?(</span>\s*</a>)',
    r'\1DISCOVER NEW ARRIVALS\2',
    html,
    flags=re.DOTALL
)

# Replace Floating Badge 1: Fashion Jewelry Vault / Premium Brass & Kundan Polish
html = re.sub(
    r'<h4 class="float-card-title" id="hero-float-title">.*?</h4>\s*<span class="float-card-tag">.*?</span>',
    '<h4 class="float-card-title" id="hero-float-title">Fashion Jewelry Vault</h4>\n                <span class="float-card-tag">Premium Brass &amp; Kundan Polish</span>',
    html
)

# Replace Floating Badge 2: Premium Quality / Handpicked Fabrics & Fine Stitching
html = re.sub(
    r'<h4 class="float-card-title">100% Certified Handloom</h4>\s*<span class="float-card-tag"[^>]*>.*?</span>',
    '<h4 class="float-card-title">Premium Quality</h4>\n                <span class="float-card-tag" style="color: #c5a880;">Handpicked Fabrics &amp; Fine Stitching</span>',
    html
)

with open(index_path, 'w', encoding='utf-8') as f:
    f.write(html)
print("Updated public/index.html with exact hero content.")

# 2. Update public/css/style.css
style_path = r'public\css\style.css'
with open(style_path, 'r', encoding='utf-8') as f:
    style_css = f.read()

# Replace hero background #0d0d0f with dark obsidian #0A0A0C
style_css = style_css.replace(
    'background: #0d0d0f;\n  min-height: 86vh;',
    'background: #0A0A0C;\n  min-height: 86vh;'
)

# Update backlight to subtle warm gold glow
style_css = style_css.replace(
    'background: radial-gradient(circle, rgba(212, 175, 55, 0.22) 0%, rgba(197, 168, 128, 0.1) 40%, transparent 70%);',
    'background: radial-gradient(circle, rgba(212, 175, 55, 0.25) 0%, rgba(197, 168, 128, 0.12) 40%, transparent 70%);'
)

# Update floating animation duration to 6s soft floating
style_css = style_css.replace(
    'animation: heroFloatingSine 5.5s ease-in-out infinite;',
    'animation: heroFloatingSine 6s ease-in-out infinite;'
)
style_css = style_css.replace(
    'transform: translateY(-14px);',
    'transform: translateY(-12px);'
)

with open(style_path, 'w', encoding='utf-8') as f:
    f.write(style_css)
print("Updated public/css/style.css with dark obsidian #0A0A0C and warm gold glow.")

# 3. Update public/js/luxury-hero-mesh.js
mesh_path = r'public\js\luxury-hero-mesh.js'
with open(mesh_path, 'r', encoding='utf-8') as f:
    mesh_js = f.read()

mesh_js = mesh_js.replace("baseGrad.addColorStop(0, '#0d0d0f');", "baseGrad.addColorStop(0, '#0A0A0C');")
mesh_js = mesh_js.replace("baseGrad.addColorStop(0.5, '#121217');", "baseGrad.addColorStop(0.5, '#0E0E12');")
mesh_js = mesh_js.replace("baseGrad.addColorStop(1, '#09090b');", "baseGrad.addColorStop(1, '#070709');")
mesh_js = mesh_js.replace("rgba(212, 175, 55, 0.18)", "rgba(212, 175, 55, 0.22)")
mesh_js = mesh_js.replace("rgba(13, 13, 15, 0)", "rgba(10, 10, 12, 0)")

with open(mesh_path, 'w', encoding='utf-8') as f:
    f.write(mesh_js)
print("Updated public/js/luxury-hero-mesh.js with dark obsidian and warm gold glow.")

# 4. Update src/components/LuxuryHero.jsx
jsx_path = r'src\components\LuxuryHero.jsx'
with open(jsx_path, 'r', encoding='utf-8') as f:
    jsx = f.read()

# Replace defaults
jsx = jsx.replace(
    'subtext = "Discover timeless silhouettes, authentic handloom weaves, and contemporary Indian couture. An exquisite curation by RJ Fashion Collection."',
    'subtext = "Curated contemporary ethnic wear, trendy fashion, and modern statement accessories."'
)
jsx = jsx.replace(
    'primaryCtaText = "EXPLORE COLLECTION →"',
    'primaryCtaText = "EXPLORE COLLECTION ->"'
)
jsx = jsx.replace("bg-[#0d0d0f]", "bg-[#0A0A0C]")
jsx = jsx.replace("baseGrad.addColorStop(0, '#0d0d0f');", "baseGrad.addColorStop(0, '#0A0A0C');")
jsx = jsx.replace("duration: 5.5,", "duration: 6,")
jsx = jsx.replace("y: [0, -14, 0]", "y: [0, -12, 0]")

# Replace Badge 1 in JSX
jsx = jsx.replace(
    'The Kundan Vault',
    'Fashion Jewelry Vault'
)
jsx = jsx.replace(
    '24K Gold Accents',
    'Premium Brass & Kundan Polish'
)

# Replace Badge 2 in JSX
jsx = jsx.replace(
    '100% Certified Handloom',
    'Premium Quality'
)
jsx = jsx.replace(
    'Pure Mulberry Silk &amp; Zari',
    'Handpicked Fabrics & Fine Stitching'
)
jsx = jsx.replace(
    'Pure Mulberry Silk & Zari',
    'Handpicked Fabrics & Fine Stitching'
)

with open(jsx_path, 'w', encoding='utf-8') as f:
    f.write(jsx)
print("Updated src/components/LuxuryHero.jsx.")

# 5. Update src/components/LuxuryHero.tsx
tsx_path = r'src\components\LuxuryHero.tsx'
with open(tsx_path, 'r', encoding='utf-8') as f:
    tsx = f.read()

tsx = tsx.replace(
    'subtext = "Discover timeless silhouettes, authentic handloom weaves, and contemporary Indian couture. An exquisite curation by RJ Fashion Collection."',
    'subtext = "Curated contemporary ethnic wear, trendy fashion, and modern statement accessories."'
)
tsx = tsx.replace(
    'primaryCtaText = "EXPLORE COLLECTION →"',
    'primaryCtaText = "EXPLORE COLLECTION ->"'
)
tsx = tsx.replace("bg-[#0d0d0f]", "bg-[#0A0A0C]")
tsx = tsx.replace("baseGrad.addColorStop(0, '#0d0d0f');", "baseGrad.addColorStop(0, '#0A0A0C');")
tsx = tsx.replace("duration: 5.5,", "duration: 6,")
tsx = tsx.replace("y: [0, -14, 0]", "y: [0, -12, 0]")

tsx = tsx.replace('The Kundan Vault', 'Fashion Jewelry Vault')
tsx = tsx.replace('24K Gold Accents', 'Premium Brass & Kundan Polish')
tsx = tsx.replace('100% Certified Handloom', 'Premium Quality')
tsx = tsx.replace('Pure Mulberry Silk &amp; Zari', 'Handpicked Fabrics & Fine Stitching')
tsx = tsx.replace('Pure Mulberry Silk & Zari', 'Handpicked Fabrics & Fine Stitching')

with open(tsx_path, 'w', encoding='utf-8') as f:
    f.write(tsx)
print("Updated src/components/LuxuryHero.tsx.")
