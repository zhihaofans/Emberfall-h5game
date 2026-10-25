#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""生成 PWA 图标全套 + iOS 启动图（余烬/火焰主题，零外部素材）"""
import math, os
from PIL import Image, ImageDraw, ImageFilter

BG_DEEP = (12, 9, 6)
BG_OUT = (26, 20, 15)
FONT_ZH = "/usr/share/fonts/opentype/noto/NotoSerifCJK-Bold.ttc"

def smooth_closed(pts, samples=14):
    """Catmull-Rom 闭合样条，把控制点变成平滑轮廓"""
    out = []
    n = len(pts)
    for i in range(n):
        p0, p1, p2, p3 = pts[(i-1) % n], pts[i], pts[(i+1) % n], pts[(i+2) % n]
        for s in range(samples):
            t = s / samples
            t2, t3 = t*t, t*t*t
            x = 0.5*((2*p1[0]) + (-p0[0]+p2[0])*t + (2*p0[0]-5*p1[0]+4*p2[0]-p3[0])*t2 + (-p0[0]+3*p1[0]-3*p2[0]+p3[0])*t3)
            y = 0.5*((2*p1[1]) + (-p0[1]+p2[1])*t + (2*p0[1]-5*p1[1]+4*p2[1]-p3[1])*t2 + (-p0[1]+3*p1[1]-3*p2[1]+p3[1])*t3)
            out.append((x, y))
    return out

def flame_pts(cx, top, base, half_w, ctrl_shoulder=0.62, ctrl_bulge=0.98):
    """火焰轮廓控制点（对称）：尖顶 → 右肩内凹 → 右鼓 → 右下 → 底中 → 镜像"""
    h = base - top
    return [
        (cx, top),
        (cx + half_w*ctrl_shoulder, top + h*0.34),
        (cx + half_w*ctrl_bulge,     top + h*0.66),
        (cx + half_w*0.86,           base - h*0.06),
        (cx,                         base),
        (cx - half_w*0.86,           base - h*0.06),
        (cx - half_w*ctrl_bulge,     top + h*0.66),
        (cx - half_w*ctrl_shoulder,  top + h*0.34),
    ]

def vgrad(size, c_bottom, c_top):
    """竖直渐变图"""
    w, h = size
    g = Image.new("RGB", (1, h))
    px = g.load()
    for y in range(h):
        t = y / max(1, h-1)
        px[0, y] = tuple(int(c_bottom[i] + (c_top[i]-c_bottom[i])*t) for i in range(3))
    return g.resize((w, h), Image.BILINEAR)

def make_bg(S, glow=True):
    """深色背景 + 中心暖光晕"""
    bg = vgrad((S, S), BG_OUT, BG_DEEP).convert("RGBA")
    if glow:
        g = Image.new("RGBA", (S, S), (0, 0, 0, 0))
        gd = ImageDraw.Draw(g)
        r = S*0.52
        gd.ellipse([S/2-r, S*0.58-r, S/2+r, S*0.58+r], fill=(224, 123, 57, 34))
        g = g.filter(ImageFilter.GaussianBlur(S*0.10))
        bg = Image.alpha_composite(bg, g)
    return bg

def draw_flame(S, scale=1.0, cx_ratio=0.5, base_ratio=0.80, top_ratio=0.155):
    """返回 (火焰层 RGBA, 发光层 RGBA)"""
    cx = S*cx_ratio
    base = S*base_ratio
    top = S*top_ratio
    # 外层 / 中层 / 内层：颜色由暗红橙 → 亮橙 → 明黄
    layers = [
        dict(k=1.00, top_off=0.00, c_bot=(150, 46, 16),  c_top=(214, 96, 32)),
        dict(k=0.70, top_off=0.055, c_bot=(224, 123, 57), c_top=(232, 160, 70)),
        dict(k=0.42, top_off=0.13,  c_bot=(255, 226, 120), c_top=(248, 200, 92)),
    ]
    flame = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    for L in layers:
        k = L["k"]*scale
        fh = (base-top)
        f_top = base - fh*k + fh*L["top_off"]
        f_half = S*0.165*k*scale
        pts = smooth_closed(flame_pts(cx, f_top, base - fh*(1-k)*0.10, f_half))
        mask = Image.new("L", (S, S), 0)
        ImageDraw.Draw(mask).polygon(pts, fill=255)
        # 渐变填充（按该层高度裁切）
        y0, y1 = int(max(0, f_top)), int(min(S, base+2))
        if y1 <= y0: continue
        grad = vgrad((S, y1-y0), L["c_bot"], L["c_top"])
        color = Image.new("RGBA", (S, S), (0, 0, 0, 0))
        color.paste(grad.convert("RGBA"), (0, y0))
        color.putalpha(mask)
        flame = Image.alpha_composite(flame, color)
    # 火星
    sparks = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    sd = ImageDraw.Draw(sparks)
    pts_r = [(0.5, 0.075, 0.012), (0.615, 0.135, 0.008), (0.385, 0.115, 0.009),
             (0.665, 0.225, 0.006), (0.335, 0.205, 0.007), (0.55, 0.045, 0.006)]
    for rx, ry, rr in pts_r:
        r = S*rr*scale
        sd.ellipse([S*rx-r, S*ry-r, S*rx+r, S*ry+r], fill=(255, 205, 120, 235))
    sparks = sparks.filter(ImageFilter.GaussianBlur(S*0.002))
    flame = Image.alpha_composite(flame, sparks)
    # 发光
    glow = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    glow.paste((255, 150, 60, 150), (0, 0), flame.split()[3])
    glow = glow.filter(ImageFilter.GaussianBlur(S*0.045))
    return flame, glow

def build_icon(S, maskable=False):
    bg = make_bg(S, glow=True)
    if maskable:
        bg = Image.new("RGBA", (S, S), (18, 14, 10, 255))  # maskable 用纯色满铺，防裁切露白
    scale = 0.74 if maskable else 1.0
    flame, glow = draw_flame(S, scale=scale, base_ratio=(0.78 if maskable else 0.82))
    out = Image.alpha_composite(bg, glow)
    out = Image.alpha_composite(out, flame)
    return out

def build_splash(W, H, zh="末日余烬", en="EMBERFALL"):
    bg = Image.new("RGBA", (W, H), BG_DEEP)
    # 中心光晕
    g = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    gd = ImageDraw.Draw(g)
    r = min(W, H)*0.42
    gd.ellipse([W/2-r, H*0.46-r, W/2+r, H*0.46+r], fill=(224, 123, 57, 30))
    bg = Image.alpha_composite(bg, g.filter(ImageFilter.GaussianBlur(min(W,H)*0.09)))
    # 居中火焰标记
    S = int(min(W, H)*0.42)
    mark = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    flame, glow = draw_flame(S, scale=1.0, base_ratio=0.84)
    mark = Image.alpha_composite(mark, glow)
    mark = Image.alpha_composite(mark, flame)
    bg.alpha_composite(mark, (int(W/2-S/2), int(H*0.46-S/2)))
    # 文字
    try:
        from PIL import ImageFont
        f1 = ImageFont.truetype(FONT_ZH, int(min(W, H)*0.075))
        f2 = ImageFont.truetype(FONT_ZH, int(min(W, H)*0.032))
        d = ImageDraw.Draw(bg)
        def center(txt, font, y, color):
            bb = d.textbbox((0, 0), txt, font=font)
            d.text(((W-(bb[2]-bb[0]))/2, y), txt, font=font, fill=color)
        center(zh, f1, H*0.615, (232, 220, 200, 255))
        center(en, f2, H*0.615 + min(W, H)*0.095, (150, 120, 95, 255))
    except Exception as e:
        print("font skip:", e)
    return bg.convert("RGB")

def main():
    base = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # 仓库根
    out = os.path.join(base, "icons")
    sp = os.path.join(base, "splash")
    os.makedirs(out, exist_ok=True)
    os.makedirs(sp, exist_ok=True)

    S = 1024
    master = build_icon(S, maskable=False)
    master.save(f"{out}/icon-1024.png", "PNG")
    for size in (512, 192, 180, 128, 32):
        img = master.resize((size, size), Image.LANCZOS)
        name = {512: "icon-512.png", 192: "icon-192.png", 180: "apple-touch-icon-180.png",
                128: "icon-128.png", 32: "favicon-32.png"}[size]
        img.convert("RGB").save(f"{out}/{name}", "PNG")
    mask = build_icon(S, maskable=True).resize((512, 512), Image.LANCZOS)
    mask.convert("RGB").save(f"{out}/icon-maskable-512.png", "PNG")

    splashes = [(1179, 2556, "iphone15pro"), (1290, 2796, "iphone15promax"),
                (1170, 2532, "iphone13"), (1125, 2436, "iphonex"),
                (750, 1334, "iphoneSE"), (2048, 2732, "ipad12")]
    for W, H, tag in splashes:
        build_splash(W, H).save(f"{sp}/splash-{tag}-{W}x{H}.png", "PNG")
    print("done")

if __name__ == "__main__":
    main()
