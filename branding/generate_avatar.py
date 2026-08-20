import os
from PIL import Image, ImageDraw, ImageFilter, ImageFont

def generate_avatar(out_path):
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    size = 192
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    d.ellipse([4, 4, size - 4, size - 4], fill=(22, 27, 34, 255), outline=(255, 255, 255, 180), width=3)

    center = (size // 2, size // 2)
    d.polygon([(center[0], 35), (center[0] - 25, 75), (center[0] + 25, 75)], fill=(240, 246, 252, 255))
    d.polygon([(center[0] + 15, 60), (center[0] + 42, 70), (center[0] + 15, 80)], fill=(245, 215, 110, 255))
    
    d.ellipse([center[0] + 5, 55, center[0] + 12, 62], fill=(13, 17, 23, 255))
    d.polygon([(center[0] - 50, 150), (center[0], 85), (center[0] + 50, 150), (center[0], 135)], fill=(86, 212, 221, 255))
    d.ellipse([center[0] - 40, 110, center[0] + 40, 160], fill=(33, 38, 45, 255), outline=(124, 199, 255, 200), width=2)

    img.save(out_path, "PNG")
    print(f"Generated avatar at {out_path}")

if __name__ == "__main__":
    generate_avatar(r"c:\Users\Charan Balaji\Downloads\AetherOS\AetherOS\assets\avatar.png")
    generate_avatar(r"c:\Users\Charan Balaji\Downloads\AetherOS\AetherOS\desktop\sddm\aetheros-glass\assets\avatar.png")
