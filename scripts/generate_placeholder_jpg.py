from PIL import Image, ImageDraw, ImageFont
import os

target_path = 'public/images/placeholder.jpg'
logo_path = 'public/images/rj-logo-monogram-dark.png'

# Create 600x600 image with luxury dark slate background
img = Image.new('RGB', (600, 600), color=(15, 23, 42)) # #0f172a
draw = ImageDraw.Draw(img)

# Draw elegant gold border
border_gold = (212, 175, 55) # #D4AF37
draw.rectangle([(20, 20), (579, 579)], outline=border_gold, width=2)
draw.rectangle([(28, 28), (571, 571)], outline=(114, 19, 42), width=1) # subtle maroon inner border

# Paste centered logo if exists
if os.path.exists(logo_path):
    logo = Image.open(logo_path).convert('RGBA')
    logo = logo.resize((240, 240), Image.Resampling.LANCZOS)
    # paste with alpha mask
    paste_x = (600 - 240) // 2
    paste_y = (600 - 240) // 2 - 30
    img.paste(logo, (paste_x, paste_y), logo)

# Draw subtle text below
# Simple fallback text drawing without external ttf dependency
draw.text((300, 420), "RJ FASHION COLLECTION", fill=border_gold, anchor="mm")
draw.text((300, 450), "Luxury Ethnic Couture", fill=(148, 163, 184), anchor="mm")

# Save as optimized JPEG
img.save(target_path, 'JPEG', quality=90, optimize=True)
print(f"Successfully generated {target_path} (size: {os.path.getsize(target_path)} bytes)")
