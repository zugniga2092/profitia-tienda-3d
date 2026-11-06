"""Camisetas para "Haz tu estampado": a partir de las fotos colgadas con el logo de muestra,
saca una versión LISA (sin logo) para poner encima el diseño del cliente.

Uso:  python herramientas/preparar_lisas.py
Entrada: fotos/custom/negra.png y blanca.png (tu camiseta colgada con un logo de muestra en el pecho)
Salida:  img/colgadas/custom-<color>-frente.webp  (con logo, para colgar en la tienda)
         img/colgadas/custom-<color>-lisa.webp    (sin logo, base para el diseño del cliente)
         y añade las entradas en colgadas.js (lo hace preparar_colgadas.py leyendo CUSTOM)
"""
from pathlib import Path

import cv2
import numpy as np
from PIL import Image
from scipy import ndimage

BASE = Path(__file__).resolve().parent.parent
SRC = BASE / "fotos" / "custom"
OUT = BASE / "img" / "colgadas"
H = 1400

for color in ("negra", "blanca"):
    im = Image.open(SRC / f"{color}.png").convert("RGBA")
    im = im.crop(im.getbbox())
    im = im.resize((round(im.width * H / im.height), H), Image.LANCZOS)
    arr = np.array(im)
    rgb = arr[:, :, :3].astype(np.float32)
    alpha = arr[:, :, 3] > 128
    lum = rgb.mean(axis=2)

    # Zona del pecho donde está el logo (franja central); dentro de ella, el logo es lo que contrasta con la tela
    h, w = lum.shape
    zona = np.zeros_like(alpha); zona[int(h * .2):int(h * .62), int(w * .08):int(w * .92)] = True
    tela = np.median(lum[alpha & ~zona])
    contraste = np.abs(lum - tela) > (45 if color == "negra" else 55)
    logo = zona & alpha & contraste
    logo = ndimage.binary_opening(logo, iterations=1)
    lab, n = ndimage.label(logo)
    if n:
        sizes = ndimage.sum(logo, lab, range(1, n + 1))
        logo = np.isin(lab, [i + 1 for i in range(n) if sizes[i] > 30])
    logo = ndimage.binary_dilation(logo, iterations=4)          # incluye el borde suave de la tinta

    bgr = cv2.cvtColor(arr[:, :, :3], cv2.COLOR_RGB2BGR)
    limpio = cv2.inpaint(bgr, (logo * 255).astype(np.uint8), 9, cv2.INPAINT_TELEA)
    limpio = cv2.cvtColor(limpio, cv2.COLOR_BGR2RGB)
    # Grano de tela encima del parche, para que no quede liso como plástico
    ruido = np.random.default_rng(1).normal(0, 3.0, limpio.shape[:2])[..., None]
    limpio = np.where(logo[..., None], np.clip(limpio + ruido, 0, 255), limpio).astype(np.uint8)

    Image.fromarray(arr).save(OUT / f"custom-{color}-frente.webp", quality=92, alpha_quality=100, method=4)
    Image.fromarray(np.dstack([limpio, arr[:, :, 3]])).save(OUT / f"custom-{color}-lisa.webp", quality=92, alpha_quality=100, method=4)
    print(color, "logo px:", int(logo.sum()), "tamaño:", im.size)
