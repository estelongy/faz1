"""
EsteStore consumer app — temporary launcher icons + splash generator.
Matches the esteklinikpro asset structure so the Capacitor build picks them up.
Run once: `python scripts/gen_estestore_assets.py`
Re-run after changing colors / text.
"""
from PIL import Image, ImageDraw, ImageFont
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DEST = ROOT / 'mobile' / 'android' / 'app' / 'src' / 'estestore' / 'res'

VIOLET_900 = (76, 29, 149)
VIOLET_700 = (109, 40, 217)
VIOLET_500 = (139, 92, 246)
WHITE = (255, 255, 255)
GOLD = (201, 169, 97)

ICON_DENSITIES = {
    'ldpi':    36,
    'mdpi':    48,
    'hdpi':    72,
    'xhdpi':   96,
    'xxhdpi':  144,
    'xxxhdpi': 192,
}

# (width, height) — Android splash sizes from esteklinikpro reference
SPLASH_DENSITIES_PORT = {
    'ldpi':    (240, 320),
    'mdpi':    (320, 480),
    'hdpi':    (480, 800),
    'xhdpi':   (720, 1280),
    'xxhdpi':  (960, 1600),
    'xxxhdpi': (1280, 1920),
}
SPLASH_DENSITIES_LAND = {
    'ldpi':    (320, 240),
    'mdpi':    (480, 320),
    'hdpi':    (800, 480),
    'xhdpi':   (1280, 720),
    'xxhdpi':  (1600, 960),
    'xxxhdpi': (1920, 1280),
}


def find_font(prefer_bold=True, size=64):
    candidates = [
        'C:/Windows/Fonts/segoeuib.ttf' if prefer_bold else 'C:/Windows/Fonts/segoeui.ttf',
        'C:/Windows/Fonts/arialbd.ttf' if prefer_bold else 'C:/Windows/Fonts/arial.ttf',
        'C:/Windows/Fonts/calibrib.ttf' if prefer_bold else 'C:/Windows/Fonts/calibri.ttf',
    ]
    for p in candidates:
        if Path(p).exists():
            return ImageFont.truetype(p, size)
    return ImageFont.load_default()


def make_solid_bg(size, color):
    img = Image.new('RGBA', (size, size), color + (255,))
    return img


def make_icon_background(size):
    """Solid violet block — adaptive icon needs full-bleed bg layer."""
    return make_solid_bg(size, VIOLET_700)


def make_icon_foreground(size):
    """Transparent layer with 'ES' centered."""
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    font_size = int(size * 0.50)
    font = find_font(prefer_bold=True, size=font_size)
    text = 'ES'
    bbox = draw.textbbox((0, 0), text, font=font)
    w = bbox[2] - bbox[0]
    h = bbox[3] - bbox[1]
    x = (size - w) // 2 - bbox[0]
    y = (size - h) // 2 - bbox[1]
    draw.text((x, y), text, fill=WHITE, font=font)
    return img


def make_icon_legacy(size):
    """Flat icon for pre-adaptive Android — solid bg + 'ES'."""
    img = make_solid_bg(size, VIOLET_700)
    draw = ImageDraw.Draw(img)
    font_size = int(size * 0.45)
    font = find_font(prefer_bold=True, size=font_size)
    text = 'ES'
    bbox = draw.textbbox((0, 0), text, font=font)
    w = bbox[2] - bbox[0]
    h = bbox[3] - bbox[1]
    x = (size - w) // 2 - bbox[0]
    y = (size - h) // 2 - bbox[1]
    draw.text((x, y), text, fill=WHITE, font=font)
    return img


def make_round_icon(size):
    """Round mask + legacy icon body."""
    base = make_icon_legacy(size)
    mask = Image.new('L', (size, size), 0)
    mdraw = ImageDraw.Draw(mask)
    mdraw.ellipse((0, 0, size, size), fill=255)
    out = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    out.paste(base, (0, 0), mask)
    return out


def make_splash(w, h):
    """Vertical gradient violet bg + 'ESTESTORE' title + 'estelongy' subtitle."""
    img = Image.new('RGBA', (w, h), VIOLET_900 + (255,))
    px = img.load()
    for y in range(h):
        t = y / max(h - 1, 1)
        r = int(VIOLET_900[0] * (1 - t) + VIOLET_700[0] * t)
        g = int(VIOLET_900[1] * (1 - t) + VIOLET_700[1] * t)
        b = int(VIOLET_900[2] * (1 - t) + VIOLET_700[2] * t)
        for x in range(w):
            px[x, y] = (r, g, b, 255)
    draw = ImageDraw.Draw(img)

    title_size = max(28, int(min(w, h) * 0.10))
    title_font = find_font(prefer_bold=True, size=title_size)
    title = 'ESTESTORE'
    bbox = draw.textbbox((0, 0), title, font=title_font)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    tx = (w - tw) // 2 - bbox[0]
    ty = (h - th) // 2 - bbox[1] - int(th * 0.4)
    draw.text((tx, ty), title, fill=WHITE, font=title_font)

    sub_size = max(14, int(title_size * 0.40))
    sub_font = find_font(prefer_bold=False, size=sub_size)
    sub = 'by Estelongy'
    sbbox = draw.textbbox((0, 0), sub, font=sub_font)
    sw = sbbox[2] - sbbox[0]
    sx = (w - sw) // 2 - sbbox[0]
    sy = ty + th + int(th * 0.4)
    draw.text((sx, sy), sub, fill=GOLD, font=sub_font)

    return img


def write_png(img, dst: Path):
    dst.parent.mkdir(parents=True, exist_ok=True)
    img.save(dst, 'PNG')


def main():
    print('Generating EsteStore launcher icons + splash...')

    # Adaptive icon XML (v26+)
    adaptive_xml = '''<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background>
        <inset android:drawable="@mipmap/ic_launcher_background" android:inset="16.7%" />
    </background>
    <foreground>
        <inset android:drawable="@mipmap/ic_launcher_foreground" android:inset="16.7%" />
    </foreground>
</adaptive-icon>
'''
    anydpi = DEST / 'mipmap-anydpi-v26'
    anydpi.mkdir(parents=True, exist_ok=True)
    (anydpi / 'ic_launcher.xml').write_text(adaptive_xml, encoding='utf-8')
    (anydpi / 'ic_launcher_round.xml').write_text(adaptive_xml, encoding='utf-8')

    for density, size in ICON_DENSITIES.items():
        d = DEST / f'mipmap-{density}'
        write_png(make_icon_legacy(size), d / 'ic_launcher.png')
        write_png(make_round_icon(size), d / 'ic_launcher_round.png')
        write_png(make_icon_background(size), d / 'ic_launcher_background.png')
        write_png(make_icon_foreground(size), d / 'ic_launcher_foreground.png')
        print(f'  icon {density} ({size}x{size}) OK')

    # Splash — default drawable + port/land per density
    write_png(make_splash(320, 480), DEST / 'drawable' / 'splash.png')
    for density, (w, h) in SPLASH_DENSITIES_PORT.items():
        write_png(make_splash(w, h), DEST / f'drawable-port-{density}' / 'splash.png')
        print(f'  splash port {density} ({w}x{h}) OK')
    for density, (w, h) in SPLASH_DENSITIES_LAND.items():
        write_png(make_splash(w, h), DEST / f'drawable-land-{density}' / 'splash.png')
        print(f'  splash land {density} ({w}x{h}) OK')

    print(f'\nDone — written to {DEST}')


if __name__ == '__main__':
    main()
