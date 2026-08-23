import os
from PIL import Image, ImageDraw, ImageFont

# Create high-res transparent image for Plymouth watermark
width = 600
height = 160
img = Image.new("RGBA", (width, height), (0, 0, 0, 0))
draw = ImageDraw.Draw(img)

# Outer glowing circle for icon
cx, cy, r = 70, 70, 48
# Outer glow ring
draw.ellipse([cx - r, cy - r, cx + r, cy + r], outline=(0, 229, 255, 180), width=4)
# Inner triangle / Aether delta symbol
points = [(cx, cy - 26), (cx - 24, cy + 24), (cx + 24, cy + 24)]
draw.polygon(points, outline=(0, 229, 255, 255), fill=(0, 229, 255, 60))
draw.line([(cx - 16, cy + 8), (cx + 16, cy + 8)], fill=(0, 229, 255, 255), width=3)

# Text Rendering
try:
    font_title = ImageFont.truetype("arial.ttf", 52)
    font_sub = ImageFont.truetype("arial.ttf", 18)
except:
    font_title = ImageFont.load_default()
    font_sub = ImageFont.load_default()

# Title: AetherOS
draw.text((140, 32), "AetherOS", fill=(240, 246, 252, 255), font=font_title)
# Subtitle: NEXT-GEN WORKSTATION OS
draw.text((144, 94), "NEXT-GEN WORKSTATION OS", fill=(0, 229, 255, 230), font=font_sub)

# Target directory
out_dir = "iso-overlay/usr/share/plymouth/themes/aetheros"
os.makedirs(out_dir, exist_ok=True)
out_path = os.path.join(out_dir, "watermark.png")
img.save(out_path, "PNG")
print(f"Generated updated Plymouth watermark at: {out_path}")
