# Gera "fotos" ilustradas (dados de exemplo) para o demo.
import random, sys
from PIL import Image, ImageDraw, ImageFilter
out = sys.argv[1]
W, H = 1200, 900

def steel_bg(d, seed, warm=False):
    r = random.Random(seed)
    for y in range(H):
        t = y / H
        base = 150 - int(60 * t) + r.randint(-2, 2)
        c = (base + (10 if warm else 0), base + 4, base + 10 - (8 if warm else 0))
        d.line([(0, y), (W, y)], fill=c)

def noise(img, seed):
    r = random.Random(seed)
    px = img.load()
    for _ in range(60000):
        x, y = r.randrange(W), r.randrange(H)
        v = r.randint(-18, 18)
        p = px[x, y]
        px[x, y] = tuple(max(0, min(255, c + v)) for c in p[:3])
    return img

def vignette(img):
    m = Image.new('L', (W, H), 0)
    dm = ImageDraw.Draw(m)
    dm.ellipse([-200, -150, W + 200, H + 150], fill=255)
    m = m.filter(ImageFilter.GaussianBlur(160))
    dark = Image.new('RGB', (W, H), (20, 18, 30))
    return Image.composite(img, dark, m)

def trolley(seed, lid):
    r = random.Random(seed)
    img = Image.new('RGB', (W, H)); d = ImageDraw.Draw(img)
    steel_bg(d, seed)
    # moldura do trolley
    d.rounded_rectangle([90, 40, W - 90, H - 40], 26, fill=(70, 74, 86), outline=(190, 194, 204), width=10)
    rows = 5
    for i in range(rows):
        y0 = 80 + i * 160
        d.rectangle([120, y0 + 118, W - 120, y0 + 128], fill=(160, 164, 176))  # trilho
        x = 140
        while x < W - 260:
            w = r.randint(190, 230)
            d.rounded_rectangle([x, y0 + 14, x + w, y0 + 116], 10, fill=(236, 236, 240))
            d.rounded_rectangle([x + 10, y0 + 24, x + w - 10, y0 + 60], 8, fill=lid)
            d.rectangle([x + 18, y0 + 72, x + w * 0.55, y0 + 82], fill=(200, 200, 208))
            d.rectangle([x + 18, y0 + 90, x + w * 0.4, y0 + 98], fill=(210, 210, 216))
            x += w + 18
    return img

def forno(seed):
    r = random.Random(seed)
    img = Image.new('RGB', (W, H)); d = ImageDraw.Draw(img)
    steel_bg(d, seed, warm=True)
    d.rounded_rectangle([70, 50, W - 70, H - 50], 20, fill=(54, 56, 64), outline=(176, 178, 186), width=12)
    for i in range(4):
        y0 = 90 + i * 195
        d.rectangle([100, y0 + 170, W - 100, y0 + 176], fill=(140, 142, 150))
        x = 120
        while x < W - 300:
            w = r.randint(230, 270)
            # casserole de alumínio
            d.rounded_rectangle([x, y0 + 30, x + w, y0 + 165], 14, fill=(205, 208, 214), outline=(150, 152, 160), width=4)
            for k in range(6):
                yy = y0 + 45 + k * 20
                d.line([(x + 14, yy), (x + w - 14, yy + r.randint(-3, 3))], fill=(225, 228, 234), width=3)
            d.rounded_rectangle([x + 20, y0 + 120, x + 110, y0 + 150], 6, fill=(250, 250, 250))
            x += w + 26
    return img

def caixas(seed, tone):
    r = random.Random(seed)
    img = Image.new('RGB', (W, H)); d = ImageDraw.Draw(img)
    steel_bg(d, seed)
    d.rectangle([0, H - 220, W, H], fill=(92, 94, 104))
    for i in range(r.randint(5, 7)):
        x = 80 + i * 170 + r.randint(-20, 20)
        h = r.randint(260, 430); w = r.randint(140, 180)
        y = H - 200 - h + r.randint(0, 40)
        d.rounded_rectangle([x, y, x + w, y + h], 12, fill=tone, outline=(40, 30, 40), width=4)
        d.rectangle([x + 16, y + 30, x + w - 16, y + 80], fill=(245, 245, 245))
        d.rectangle([x + 24, y + 44, x + w - 50, y + 52], fill=(120, 120, 130))
        d.rectangle([x + w // 2 - 22, y - 16, x + w // 2 + 22, y + 4], fill=(60, 60, 70))
    return img

jobs = {
    'trolley_a': lambda: trolley(1, (237, 22, 80)),
    'trolley_b': lambda: trolley(2, (60, 120, 220)),
    'trolley_c': lambda: trolley(3, (255, 176, 32)),
    'trolley_d': lambda: trolley(4, (53, 176, 115)),
    'forno_a': lambda: forno(5),
    'forno_b': lambda: forno(6),
    'caixas_a': lambda: caixas(7, (180, 60, 90)),
    'caixas_b': lambda: caixas(8, (90, 90, 160)),
}
for name, fn in jobs.items():
    img = vignette(noise(fn(), hash(name) & 0xffff)).filter(ImageFilter.GaussianBlur(1.1))
    img.save(f'{out}/{name}.jpg', quality=86)
print('ok')
