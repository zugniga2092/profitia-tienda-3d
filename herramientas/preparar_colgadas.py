"""Prepara las fotos de camisetas COLGADAS hechas con IA (frente, espalda y lado).

Uso:  python herramientas/preparar_colgadas.py

Lee  fotos/  (pon ahí las fotos de tus camisetas colgadas) y, para cada camiseta de FOTOS:
  - recorta el sobrante transparente,
  - la deja a 1400 px de alto en WebP con transparencia en img/colgadas/,
  - mide la silueta del frente (para "Medir la prenda"),
  - escribe colgadas.js para la tienda.
"""
import json
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

BASE = Path(__file__).resolve().parent.parent
SRC = BASE / "fotos"
OUT = BASE / "img" / "colgadas"
OUT.mkdir(parents=True, exist_ok=True)
H = 1400

# id de la camiseta -> sus tres fotos (frente, espalda, lado). Nombre, colección y color solo para las nuevas.
FOTOS = {
    # Ejemplo: fotos de la MISMA camiseta colgada (PNG con fondo transparente) dentro de fotos/mi-camiseta/
    # "mi-camiseta": {
    #     "frente": "mi-camiseta/frente.png",
    #     "espalda": "mi-camiseta/espalda.png",
    #     "lado": "mi-camiseta/lado.png",          # opcional: de perfil, para colgarla de lado en el perchero
    #     "name": "Mi Camiseta", "collection": "negras", "color": "Negro",   # collection: negras | drops | top
    # },
}


def limpiar(path):
    im = Image.open(path).convert("RGBA")
    a = np.array(im)[:, :, 3]
    m = a > 20
    lab, n = ndimage.label(m)
    if n > 1:  # fuera motas sueltas
        sizes = ndimage.sum(m, lab, range(1, n + 1))
        keep = np.isin(lab, [i + 1 for i in range(n) if sizes[i] > sizes.max() * .02])
        arr = np.array(im); arr[:, :, 3] = np.where(keep, arr[:, :, 3], 0); im = Image.fromarray(arr)
    im = im.crop(im.getbbox())
    return im.resize((round(im.width * H / im.height), H), Image.LANCZOS)


def metricas(im):
    """Silueta del frente sin el gancho: cuerpo izq/der y altura de axila (fracciones de la imagen)."""
    a = np.array(im)[:, :, 3] > 128
    h, w = a.shape
    widths = a.sum(axis=1)
    top = int(np.argmax(widths > w * .25))           # primera fila ancha = hombros (el gancho es estrecho)
    lo, hi = top + int((h - top) * .15), top + int((h - top) * .6)
    d = np.diff(widths[lo:hi].astype(int))
    armpit = lo + int(np.argmin(d)) + 4
    row = int(min(h - 1, armpit + (h - top) * .08))
    xs = np.where(a[row])[0]
    return {"bodyL": round(xs.min() / w, 4), "bodyR": round(xs.max() / w, 4),
            "chestY": round(armpit / h, 4), "teeTop": round(top / h, 4)}


data = {}
for pid, f in FOTOS.items():
    item = {k: f[k] for k in ("name", "collection", "color") if k in f}
    for vista in ("frente", "espalda", "lado"):
        src, dst = SRC / f[vista], OUT / f"{pid}-{vista}.webp"
        im = None
        if dst.exists() and dst.stat().st_mtime >= src.stat().st_mtime:
            try: im = Image.open(dst).convert("RGBA")       # ya procesada: no se repite (va mucho más rápido)
            except Exception: im = None                      # archivo a medio guardar: se rehace
        if im is None:
            im = limpiar(src)
            im.save(dst, quality=92, alpha_quality=100, method=4)
        item[vista] = f"img/colgadas/{pid}-{vista}.webp"
        item[vista + "Aspect"] = round(im.width / im.height, 4)
        if vista == "frente":
            item.update(metricas(im))
    data[pid] = item
    print(pid, {k: v for k, v in item.items() if "Aspect" in k or k in ("bodyL", "bodyR", "chestY", "teeTop")})

(BASE / "colgadas.js").write_text(
    "// Generado por herramientas/preparar_colgadas.py — fotos de camisetas colgadas (frente, espalda, lado).\n"
    "window.COLGADAS = " + json.dumps(data, ensure_ascii=False, separators=(",", ":")) + ";\n", encoding="utf8")
