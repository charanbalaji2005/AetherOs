import os
import math
from PIL import Image, ImageDraw, ImageFilter, ImageFont

def create_plymouth_assets(output_dir):
    os.makedirs(output_dir, exist_ok=True)
    print(f"Generating Plymouth assets in {output_dir}...")

    # 1. Background (1920x1080 dark glass with radial vignette and subtle cyan glow)
    bg = Image.new("RGBA", (1920, 1080), (13, 17, 23, 255))
    draw_bg = ImageDraw.Draw(bg)
    
    # Subtle central radial glow
    glow = Image.new("RGBA", (1920, 1080), (0, 0, 0, 0))
    draw_glow = ImageDraw.Draw(glow)
    center_x, center_y = 960, 540
    
    for r in range(400, 0, -20):
        alpha = int(18 * (1 - r / 400))
        draw_glow.ellipse(
            [center_x - r, center_y - r, center_x + r, center_y + r],
            fill=(86, 212, 221, alpha)
        )
    glow = glow.filter(ImageFilter.GaussianBlur(40))
    bg.alpha_composite(glow)
    bg.save(os.path.join(output_dir, "background.png"), "PNG")
    print("  [+] background.png created")

    # 2. Logo (360x140: Glowing AetherOS symbol + text)
    logo_img = Image.new("RGBA", (360, 140), (0, 0, 0, 0))
    d_logo = ImageDraw.Draw(logo_img)
    
    # Outer glow for emblem
    emblem_center = (60, 70)
    for rad in range(45, 25, -2):
        a = int(35 * (1 - (rad - 25) / 20))
        d_logo.ellipse(
            [emblem_center[0] - rad, emblem_center[1] - rad, emblem_center[0] + rad, emblem_center[1] + rad],
            outline=(86, 212, 221, a), width=2
        )
    
    # Inner emblem circle
    d_logo.ellipse(
        [emblem_center[0] - 28, emblem_center[1] - 28, emblem_center[0] + 28, emblem_center[1] + 28],
        fill=(22, 27, 34, 230), outline=(86, 212, 221, 255), width=3
    )
    
    # Modern Geometric 'A' / Delta symbol inside emblem
    p1 = (emblem_center[0], emblem_center[1] - 16)
    p2 = (emblem_center[0] - 14, emblem_center[1] + 14)
    p3 = (emblem_center[0] + 14, emblem_center[1] + 14)
    d_logo.polygon([p1, p2, p3], outline=(124, 199, 255, 255), width=3)
    d_logo.line([(emblem_center[0] - 8, emblem_center[1] + 4), (emblem_center[0] + 8, emblem_center[1] + 4)], fill=(86, 212, 221, 255), width=2)
    
    # Text: "AetherOS"
    try:
        font_large = ImageFont.truetype("arial.ttf", 38)
        font_sub = ImageFont.truetype("arial.ttf", 13)
    except Exception:
        font_large = ImageFont.load_default()
        font_sub = ImageFont.load_default()

    d_logo.text((115, 42), "AetherOS", fill=(230, 241, 245, 255), font=font_large)
    d_logo.text((118, 86), "NEXT-GEN HYPRLAND OS", fill=(86, 212, 221, 230), font=font_sub)
    logo_img.save(os.path.join(output_dir, "logo.png"), "PNG")
    print("  [+] logo.png created")

    # 3. Spinner Frames (24 frames of a glowing rotating neon arc)
    for frame in range(24):
        sp_img = Image.new("RGBA", (64, 64), (0, 0, 0, 0))
        d_sp = ImageDraw.Draw(sp_img)
        
        start_angle = (frame * 15) % 360
        # Background faint ring
        d_sp.ellipse([8, 8, 56, 56], outline=(76, 85, 97, 60), width=3)
        
        # Primary glowing arc
        d_sp.arc([8, 8, 56, 56], start=start_angle, end=start_angle + 120, fill=(86, 212, 221, 255), width=4)
        # Gradient tail arc
        d_sp.arc([8, 8, 56, 56], start=start_angle + 120, end=start_angle + 200, fill=(124, 199, 255, 120), width=3)
        
        sp_img.save(os.path.join(output_dir, f"spinner-{frame}.png"), "PNG")
    print("  [+] 24 spinner frames created (spinner-0.png to spinner-23.png)")

    # 4. Progress Box / Container (360x10 rounded glass track)
    box_img = Image.new("RGBA", (360, 10), (0, 0, 0, 0))
    d_box = ImageDraw.Draw(box_img)
    d_box.rounded_rectangle([0, 0, 359, 9], radius=5, fill=(22, 27, 34, 200), outline=(76, 85, 97, 180), width=1)
    box_img.save(os.path.join(output_dir, "progress_box.png"), "PNG")
    print("  [+] progress_box.png created")

    # 5. Progress Bar / Fill (360x10 rounded glowing cyan gradient)
    bar_img = Image.new("RGBA", (360, 10), (0, 0, 0, 0))
    d_bar = ImageDraw.Draw(bar_img)
    for x in range(360):
        ratio = x / 360.0
        r = int(86 * (1 - ratio) + 124 * ratio)
        g = int(212 * (1 - ratio) + 199 * ratio)
        b = int(221 * (1 - ratio) + 255 * ratio)
        d_bar.line([(x, 1), (x, 8)], fill=(r, g, b, 255), width=1)
    # Mask rounded corners
    mask = Image.new("L", (360, 10), 0)
    d_mask = ImageDraw.Draw(mask)
    d_mask.rounded_rectangle([1, 1, 358, 8], radius=4, fill=255)
    bar_rounded = Image.new("RGBA", (360, 10), (0, 0, 0, 0))
    bar_rounded.paste(bar_img, (0, 0), mask=mask)
    bar_rounded.save(os.path.join(output_dir, "progress_bar.png"), "PNG")
    print("  [+] progress_bar.png created")

    # 6. Bullet for Password Prompt (16x16 glowing cyan dot)
    bullet_img = Image.new("RGBA", (16, 16), (0, 0, 0, 0))
    d_bullet = ImageDraw.Draw(bullet_img)
    d_bullet.ellipse([3, 3, 12, 12], fill=(86, 212, 221, 255), outline=(124, 199, 255, 255), width=1)
    bullet_img.save(os.path.join(output_dir, "bullet.png"), "PNG")
    print("  [+] bullet.png created")

    # 7. Lock for Password Prompt (32x32 glowing lock icon)
    lock_img = Image.new("RGBA", (32, 32), (0, 0, 0, 0))
    d_lock = ImageDraw.Draw(lock_img)
    # Shackle
    d_lock.arc([9, 4, 23, 18], start=180, end=0, fill=(86, 212, 221, 255), width=3)
    d_lock.line([(9, 11), (9, 16)], fill=(86, 212, 221, 255), width=3)
    d_lock.line([(23, 11), (23, 16)], fill=(86, 212, 221, 255), width=3)
    # Body
    d_lock.rounded_rectangle([6, 14, 26, 29], radius=3, fill=(22, 27, 34, 240), outline=(86, 212, 221, 255), width=2)
    # Keyhole
    d_lock.ellipse([14, 18, 18, 22], fill=(86, 212, 221, 255))
    d_lock.line([(16, 22), (16, 25)], fill=(86, 212, 221, 255), width=2)
    lock_img.save(os.path.join(output_dir, "lock.png"), "PNG")
    print("  [+] lock.png created")

if __name__ == "__main__":
    target_dir = r"c:\Users\Charan Balaji\Downloads\AetherOS\AetherOS\branding\plymouth\aetheros-glow"
    create_plymouth_assets(target_dir)
