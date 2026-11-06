"""Genera los recursos de EJEMPLO de la tienda: logo, mural, iconos y 6 camisetas de muestra.

Uso:
    python herramientas/generar_ejemplos.py                       # "TU MARCA" / "TU ESLOGAN AQUÍ"
    python herramientas/generar_ejemplos.py "MI MARCA" "MI ESLOGAN"

Sirve para que la tienda funcione nada más descargarla. Cuando tengas tus fotos reales,
sustitúyelas con herramientas/preparar_colgadas.py (ver docs/personalizar.md).

Requisitos: pip install pillow numpy
"""
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

BASE = Path(__file__).resolve().parent.parent
IMG = BASE / "img"
COLG = IMG / "colgadas"
MARCA = (sys.argv[1] if len(sys.argv) > 1 else "TU MARCA").upper()
ESLOGAN = (sys.argv[2] if len(sys.argv) > 2 else "TU ESLOGAN AQUÍ").upper()


def fuente(tam):
    """Una letra gruesa del sistema; si no hay, la de Pillow."""
    for f in ("C:/Windows/Fonts/impact.ttf", "/System/Library/Fonts/Supplemental/Impact.ttf",
              "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", "C:/Windows/Fonts/arialbd.ttf"):
        if Path(f).exists():
            return ImageFont.truetype(f, tam)
    return ImageFont.load_default(size=tam)


def texto_ajustado(draw, texto, ancho_max, tam_max):
    tam = tam_max
    while tam > 10:
        f = fuente(tam)
        if draw.textlength(texto, font=f) <= ancho_max:
            return f
        tam -= 4
    return fuente(10)


def cromo(w, h, c1=(255, 255, 255), c2=(150, 150, 160)):
    """Degradado vertical metálico."""
    y = np.linspace(0, 1, h)[:, None]
    banda = np.where(y < .5, y * 2, (1 - y) * 2)
    rgb = np.array(c2)[None, None, :] + (np.array(c1) - np.array(c2))[None, None, :] * banda[..., None]
    return Image.fromarray(np.repeat(rgb, w, axis=1).astype(np.uint8))


def logo():
    """Logo blanco sobre transparente (se usa en la carga, la cabecera y la sala)."""
    w, h = 1400, 500
    im = Image.new("RGBA", (w, h), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    f = texto_ajustado(d, MARCA, w * .9, 300)
    d.text((w / 2, h / 2), MARCA, font=f, fill=(255, 255, 255, 255), anchor="mm")
    im.crop(im.getbbox()).save(IMG / "logo-blanco.png")


def mural():
    """Pared del eslogan: fondo de hormigón oscuro con el eslogan en cromo."""
    w, h = 2400, 1200
    rng = np.random.default_rng(7)
    base = (rng.normal(28, 6, (h, w, 1)).clip(0, 255) * np.ones((1, 1, 3))).astype(np.uint8)
    im = Image.fromarray(base).filter(ImageFilter.GaussianBlur(1.2)).convert("RGBA")
    mask = Image.new("L", (w, h), 0); dm = ImageDraw.Draw(mask)
    palabras = ESLOGAN.split(); mitad = (len(palabras) + 1) // 2
    lineas = [" ".join(palabras[:mitad]), " ".join(palabras[mitad:])] if len(palabras) > 2 else [ESLOGAN]
    f = min((texto_ajustado(dm, l, w * .86, 420) for l in lineas), key=lambda x: x.size)
    alto = f.size * 1.05
    for i, l in enumerate(lineas):
        dm.text((w / 2, h / 2 + (i - (len(lineas) - 1) / 2) * alto), l, font=f, fill=255, anchor="mm")
    im.paste(cromo(w, h).convert("RGBA"), (0, 0), mask)
    im.convert("RGB").save(IMG / "mural.webp", quality=88)


def iconos():
    """Favicon: la inicial de la marca en blanco sobre negro con un toque rojo."""
    for tam, nombre in ((32, "favicon-32.png"), (192, "favicon-192.png"), (512, "favicon-512.png"), (180, "apple-touch-icon.png")):
        im = Image.new("RGB", (tam, tam), (10, 10, 12)); d = ImageDraw.Draw(im)
        d.text((tam / 2, tam * .52), MARCA[:1], font=fuente(int(tam * .78)), fill=(245, 245, 247), anchor="mm")
        d.rectangle((0, tam * .9, tam, tam), fill=(255, 42, 74))
        im.save(IMG / nombre)
    Image.open(IMG / "favicon-32.png").save(IMG / "favicon.ico", sizes=[(32, 32)])


# Camisetas de muestra: (id, nombre, colección, color, colores del estampado, ¿espalda estampada?)
MUESTRAS = [
    ("ejemplo-01", "Ejemplo 01", "negras", "Negro", ((255, 42, 74), (255, 190, 60)), False),
    ("ejemplo-02", "Ejemplo 02", "negras", "Negro", ((120, 200, 255), (160, 90, 255)), False),
    ("ejemplo-03", "Ejemplo 03", "negras", "Negro", ((255, 255, 255), (130, 130, 140)), False),
    ("ejemplo-04", "Ejemplo 04", "top", "Blanco", ((20, 20, 24), (255, 42, 74)), False),
    ("ejemplo-05", "Ejemplo 05", "drops", "Negro", ((255, 220, 90), (255, 90, 40)), True),
    ("ejemplo-06", "Ejemplo 06", "drops", "Blanco", ((40, 90, 255), (20, 20, 24)), True),
]


def estampar(lisa, colores, rotulo, numero):
    """Pinta un estampado grande de ejemplo (de pecho a bajo) recortado a la silueta de la camiseta."""
    w, h = lisa.size; arte = Image.new("RGBA", (w, h), (0, 0, 0, 0)); d = ImageDraw.Draw(arte)
    c1, c2 = colores
    cx, top, bot = w / 2, h * .27, h * .9
    # círculo con degradado + rayos: algo vistoso pero claramente "de ejemplo"
    r = w * .27
    for i in range(60, 0, -1):
        t = i / 60; col = tuple(int(c2[k] + (c1[k] - c2[k]) * (1 - t)) for k in range(3)) + (255,)
        d.ellipse((cx - r * t, h * .5 - r * t, cx + r * t, h * .5 + r * t), fill=col)
    for k in range(12):
        ang = k * np.pi / 6; x2, y2 = cx + np.cos(ang) * r * 1.45, h * .5 + np.sin(ang) * r * 1.45
        d.line((cx + np.cos(ang) * r * 1.08, h * .5 + np.sin(ang) * r * 1.08, x2, y2), fill=c1 + (255,), width=int(w * .012))
    f = texto_ajustado(d, rotulo, w * .66, int(h * .09))
    d.text((cx, top + h * .03), rotulo, font=f, fill=c1 + (255,), anchor="mm", stroke_width=6, stroke_fill=(0, 0, 0, 255))
    f2 = fuente(int(h * .16))
    d.text((cx, bot - h * .09), numero, font=f2, fill=(255, 255, 255, 255) if c1 != (255, 255, 255) else c2 + (255,),
           anchor="mm", stroke_width=8, stroke_fill=(0, 0, 0, 255))
    out = lisa.copy(); alpha = lisa.split()[-1]
    arte.putalpha(Image.fromarray(np.minimum(np.array(arte.split()[-1]), np.array(alpha))))
    out.alpha_composite(arte)
    return out


def camisetas():
    colgadas = {}
    lisas = {"Negro": Image.open(COLG / "custom-negra-lisa.webp").convert("RGBA"),
             "Blanco": Image.open(COLG / "custom-blanca-lisa.webp").convert("RGBA")}
    for id_, nombre, coleccion, color, colores, dos in MUESTRAS:
        lisa = lisas[color]; w, h = lisa.size; num = id_.split("-")[-1]
        estampar(lisa, colores, MARCA, num).save(COLG / f"{id_}-frente.webp", quality=88)
        (estampar(lisa, colores[::-1], ESLOGAN, num) if dos else lisa).save(COLG / f"{id_}-espalda.webp", quality=88)
        colgadas[id_] = {"name": nombre, "collection": coleccion, "color": color,
                         "frente": f"img/colgadas/{id_}-frente.webp", "frenteAspect": round(w / h, 4),
                         "espalda": f"img/colgadas/{id_}-espalda.webp", "espaldaAspect": round(w / h, 4),
                         "bodyL": .14, "bodyR": .86, "chestY": .5, "teeTop": .13}
    # Fotos de "Haz tu estampado": con el logo de muestra en el pecho (la lisa queda debajo para el diseño del cliente)
    for color, c in (("Negro", "negra"), ("Blanco", "blanca")):
        lisa = lisas[color].copy(); w, h = lisa.size
        lg = Image.open(IMG / "logo-blanco.png").convert("RGBA"); lg.thumbnail((int(w * .6), int(h * .2)))
        if color == "Blanco":
            lg = Image.merge("RGBA", (*[Image.new("L", lg.size, 12)] * 3, lg.split()[-1]))
        lisa.alpha_composite(lg, (int((w - lg.width) / 2), int(h * .3)))
        lisa.save(COLG / f"custom-{c}-frente.webp", quality=88)
    (BASE / "colgadas.js").write_text(
        "// Generado por herramientas/generar_ejemplos.py (muestras) o preparar_colgadas.py (tus fotos).\n"
        f"window.COLGADAS = {json.dumps(colgadas, ensure_ascii=False)};\n", encoding="utf-8")
    (BASE / "catalog.js").write_text(
        "// Camisetas en 3D generado (sin foto). La plantilla usa solo fotos colgadas (colgadas.js).\n"
        "window.CATALOG = [];\n", encoding="utf-8")


if __name__ == "__main__":
    logo(); mural(); iconos(); camisetas()
    print(f"Listo: ejemplos con «{MARCA}» / «{ESLOGAN}» en img/ y colgadas.js")
