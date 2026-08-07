from PIL import Image, ImageDraw, ImageFont

BG_COLOR = (99, 102, 241)  # indigo, matches app palette
FG_COLOR = (255, 255, 255)


def draw_icon(size: int, padding_ratio: float = 0.0) -> Image.Image:
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    pad = int(size * padding_ratio)
    corner_radius = int(size * 0.22)
    draw.rounded_rectangle(
        [pad, pad, size - pad, size - pad], radius=corner_radius, fill=BG_COLOR
    )

    glyph = "€"  # euro sign
    font_size = int((size - 2 * pad) * 0.55)
    try:
        font = ImageFont.truetype(
            "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", font_size
        )
    except OSError:
        font = ImageFont.load_default()

    bbox = draw.textbbox((0, 0), glyph, font=font)
    text_w = bbox[2] - bbox[0]
    text_h = bbox[3] - bbox[1]
    x = (size - text_w) / 2 - bbox[0]
    y = (size - text_h) / 2 - bbox[1]
    draw.text((x, y), glyph, font=font, fill=FG_COLOR)

    return img


sizes = {
    "pwa-192x192.png": (192, 0.0),
    "pwa-512x512.png": (512, 0.0),
    "pwa-maskable-512x512.png": (512, 0.12),
    "apple-touch-icon.png": (180, 0.0),
}

for filename, (size, padding_ratio) in sizes.items():
    icon = draw_icon(size, padding_ratio)
    icon.save(f"public/{filename}")
    print(f"generated public/{filename}")
