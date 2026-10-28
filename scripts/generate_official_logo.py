import os
import base64
import io
from PIL import Image, ImageEnhance, ImageFilter
import numpy as np

def generate_logos():
    src_path = 'C:/Users/omvin/.gemini/antigravity/brain/06f1869d-6800-43d7-a186-40ba50f38d09/.user_uploaded/media_1793095156573_709a992d.jpg'
    output_dir = 'C:/Users/omvin/.gemini/antigravity/scratch/RJ-Fashion-Collection/public/images'
    public_dir = 'C:/Users/omvin/.gemini/antigravity/scratch/RJ-Fashion-Collection/public'
    
    os.makedirs(output_dir, exist_ok=True)
    
    img = Image.open(src_path)
    rgb = np.array(img, dtype=float)
    H, W, _ = rgb.shape

    # 1. Precise 12x12 parity map for the fake checkerboard
    y_coords, x_coords = np.mgrid[0:H, 0:W]
    block_parity = ((y_coords // 12) + (x_coords // 12)) % 2

    hsv = np.array(img.convert('HSV'))
    S = hsv[:, :, 1]
    V = hsv[:, :, 2]
    is_pure_bg = (S <= 2) & (V >= 230)

    c0 = rgb[is_pure_bg & (block_parity == 0)].mean(axis=0)
    c1 = rgb[is_pure_bg & (block_parity == 1)].mean(axis=0)

    B = np.where(block_parity[:, :, None] == 0, c0, c1)
    diff = np.linalg.norm(rgb - B, axis=2)

    # 2. Smooth alpha matting
    t_low = 26.0
    t_high = 65.0
    alpha = np.clip((diff - t_low) / (t_high - t_low), 0.0, 1.0)
    alpha = alpha * alpha * (3 - 2 * alpha) # Hermite smoothstep

    # 3. Unmix foreground color on semi-transparent edge pixels
    F = np.zeros_like(rgb)
    mask = alpha > 0.01
    inv_alpha = np.where(mask, 1.0 / np.maximum(alpha, 0.08), 0)
    for c in range(3):
        f_channel = (rgb[:, :, c] - (1.0 - alpha) * B[:, :, c]) * inv_alpha
        F[:, :, c] = np.clip(f_channel, 0, 255)
    F[~mask] = 0

    # Clean isolated single-pixel noise if any
    alpha_clean = np.where(diff < t_low, 0.0, alpha)

    # 4. Light Mode Master RGBA
    rgba_light = np.dstack([F, alpha_clean * 255]).astype(np.uint8)
    img_light_raw = Image.fromarray(rgba_light, 'RGBA')
    bbox = img_light_raw.getbbox()
    cropped_light = img_light_raw.crop(bbox)

    # Square with elegant royal breathing margin (6%)
    max_dim = max(cropped_light.width, cropped_light.height)
    pad = int(max_dim * 0.06)
    target_dim = max_dim + pad * 2

    square_light = Image.new('RGBA', (target_dim, target_dim), (0, 0, 0, 0))
    offset_x = (target_dim - cropped_light.width) // 2
    offset_y = (target_dim - cropped_light.height) // 2
    square_light.paste(cropped_light, (offset_x, offset_y), cropped_light)

    # High-resolution 1024x1024 master
    master_light = square_light.resize((1024, 1024), Image.Resampling.LANCZOS)

    # 5. Dark Mode Master RGBA
    # For dark canvas (#060B18), keep the crown & flourishes gold, while boosting
    # the emerald letters with vibrant jewel-tone luminescence [30, 175, 120] and a subtle gold rim
    is_gold = (F[:, :, 0] > 130) & (F[:, :, 1] > 90) & (F[:, :, 2] < 120) & mask
    is_emerald = mask & (~is_gold)

    F_dark = F.copy()
    # Boost emerald vibrancy and luminance for high contrast on navy
    F_dark[is_emerald, 0] = np.clip(F[is_emerald, 0] * 1.5 + 20, 0, 255)
    F_dark[is_emerald, 1] = np.clip(F[is_emerald, 1] * 2.6 + 50, 0, 255)
    F_dark[is_emerald, 2] = np.clip(F[is_emerald, 2] * 2.3 + 35, 0, 255)

    # Enhance gold highlights
    F_dark[is_gold, 0] = np.clip(F[is_gold, 0] * 1.12 + 20, 0, 255)
    F_dark[is_gold, 1] = np.clip(F[is_gold, 1] * 1.10 + 15, 0, 255)

    rgba_dark = np.dstack([F_dark, alpha_clean * 255]).astype(np.uint8)
    img_dark_raw = Image.fromarray(rgba_dark, 'RGBA')
    cropped_dark = img_dark_raw.crop(bbox)

    square_dark = Image.new('RGBA', (target_dim, target_dim), (0, 0, 0, 0))
    square_dark.paste(cropped_dark, (offset_x, offset_y), cropped_dark)
    master_dark = square_dark.resize((1024, 1024), Image.Resampling.LANCZOS)

    # 6. Save PNGs
    light_png_path = os.path.join(output_dir, 'rj-logo-monogram.png')
    dark_png_path = os.path.join(output_dir, 'rj-logo-monogram-dark.png')
    master_light.save(light_png_path, 'PNG', optimize=True)
    master_dark.save(dark_png_path, 'PNG', optimize=True)

    # Also save general rj-logo.png
    master_light.save(os.path.join(output_dir, 'rj-logo.png'), 'PNG', optimize=True)
    master_dark.save(os.path.join(output_dir, 'rj-logo-dark.png'), 'PNG', optimize=True)

    print(f"SUCCESS: Saved PNGs to {output_dir}")

    # 7. Generate base64 data URIs for embedding in SVGs
    def to_base64_png(pil_img, size=(512, 512)):
        resized = pil_img.resize(size, Image.Resampling.LANCZOS)
        buf = io.BytesIO()
        resized.save(buf, format='PNG', optimize=True)
        return base64.b64encode(buf.getvalue()).decode('ascii')

    b64_light = to_base64_png(master_light, (512, 512))
    b64_dark = to_base64_png(master_dark, (512, 512))

    # 8. Create Scalable, 100% compliant SVGs without any problematic filters
    svg_light = f'''<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 512 512" width="512" height="512" aria-label="RJ Fashion Collection Royal Monogram">
  <image href="data:image/png;base64,{b64_light}" xlink:href="data:image/png;base64,{b64_light}" x="0" y="0" width="512" height="512" preserveAspectRatio="xMidYMid meet" />
</svg>'''

    svg_dark = f'''<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 512 512" width="512" height="512" aria-label="RJ Fashion Collection Royal Monogram (Dark Mode)">
  <image href="data:image/png;base64,{b64_dark}" xlink:href="data:image/png;base64,{b64_dark}" x="0" y="0" width="512" height="512" preserveAspectRatio="xMidYMid meet" />
</svg>'''

    with open(os.path.join(output_dir, 'rj-logo-monogram.svg'), 'w', encoding='utf-8') as f:
        f.write(svg_light)
    with open(os.path.join(output_dir, 'rj-logo-monogram-dark.svg'), 'w', encoding='utf-8') as f:
        f.write(svg_dark)
    print(f"SUCCESS: Generated clean SVGs: rj-logo-monogram.svg, rj-logo-monogram-dark.svg")

    # 9. Generate Favicon with Imperial Emerald Tile & Gold Monogram
    b64_fav = to_base64_png(master_dark, (128, 128))
    favicon_svg = f'''<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 160 160" width="160" height="160">
  <!-- Royal Deep Imperial Emerald Background Tile -->
  <rect width="160" height="160" rx="36" fill="#061A13" />
  <rect x="3" y="3" width="154" height="154" rx="33" fill="none" stroke="#D4AF37" stroke-width="2.5" opacity="0.75" />
  <image href="data:image/png;base64,{b64_fav}" xlink:href="data:image/png;base64,{b64_fav}" x="16" y="16" width="128" height="128" preserveAspectRatio="xMidYMid meet" />
</svg>'''

    with open(os.path.join(public_dir, 'favicon.svg'), 'w', encoding='utf-8') as f:
        f.write(favicon_svg)
    print(f"SUCCESS: Generated favicon.svg")

    # 10. Generate favicon.ico
    fav_tile = Image.new('RGBA', (256, 256), (6, 26, 19, 255))
    # Draw border
    from PIL import ImageDraw
    draw = ImageDraw.Draw(fav_tile)
    draw.rounded_rectangle([(4, 4), (251, 251)], radius=48, outline=(212, 175, 55, 200), width=4)
    # Paste centered monogram
    monogram_fav = master_dark.resize((200, 200), Image.Resampling.LANCZOS)
    fav_tile.paste(monogram_fav, (28, 28), monogram_fav)

    fav_tile.save(os.path.join(public_dir, 'favicon.ico'), format='ICO', sizes=[(16, 16), (32, 32), (48, 48), (64, 64)])
    print(f"SUCCESS: Generated favicon.ico")

if __name__ == '__main__':
    generate_logos()
