# Personalizar tu tienda

## 1. Lo básico: `tienda.config.js`

Abre el archivo y cambia los textos entre comillas. Al recargar la página verás los cambios.

| Campo | Para qué sirve |
|---|---|
| `nombre` | Tu marca. Sale en la sala 3D, la pantalla de carga, el pedido y la ficha del diseño. |
| `eslogan` | Sale en la pared de graffiti y en la carga. |
| `whatsapp` | Tu número **solo con números** y prefijo de país: España `34600111222`, México `5215512345678`. |
| `moneda`, `idioma` | Por ejemplo `"EUR"` y `"es-ES"`, o `"MXN"` y `"es-MX"`. |
| `precios.unLado` / `precios.dosLados` | Precio con un estampado y con estampado delante y detrás. |
| `conEspalda` | Ids de tus camisetas que llevan estampado detrás (cobran `dosLados`). |
| `destacadas` | Las 3 que van en la pared "Lo más top". |
| `envio` | Texto del envío en el carrito. |
| `zonas` | Nombres de las zonas de la sala. |

## 2. Logo, mural e iconos

- `img/logo-blanco.png` → tu logo en **blanco sobre transparente** (PNG). Se ve en la carga, arriba y en la sala.
- `img/mural.webp` → la pared grande del eslogan (2400 × 1200 px recomendado).
- `img/favicon*.png`, `img/favicon.ico`, `img/apple-touch-icon.png` → iconos de la pestaña y del móvil.

¿Sin diseñador a mano? `npm run ejemplos -- "MI MARCA" "MI ESLOGAN"` los crea con tu nombre en un momento.

## 3. Tus camisetas

La tienda usa **fotos de camisetas colgadas en percha** con el fondo transparente (PNG). Por cada camiseta:

- `frente` (obligatoria) y `espalda` (obligatoria; si no lleva estampado detrás, la foto de la espalda lisa),
- `lado` (opcional): de perfil, para que cuelgue de lado en el perchero.

Consejos para que queden bien:

- Mismo encuadre en todas: camiseta entera con su percha, de frente y centrada.
- Fondo transparente (puedes quitarlo con cualquier herramienta de "quitar fondo").
- Si las generas con IA, pide "camiseta oversize colgada en percha de madera, fondo transparente, estampado grande que baja hasta el bajo".

### Pasos

1. Instala Python y las librerías: `pip install pillow numpy scipy`
2. Crea la carpeta `fotos/` (no se sube a GitHub) y dentro una carpeta por camiseta:
   ```
   fotos/
   └── mi-camiseta/
       ├── frente.png
       ├── espalda.png
       └── lado.png
   ```
3. Abre `herramientas/preparar_colgadas.py` y añade cada camiseta en `FOTOS` (hay un ejemplo comentado).
   - `collection`: `negras` (Colección), `drops` (pared de Drops) o `top`.
   - `color`: `Negro` o `Blanco`.
4. Ejecuta `python herramientas/preparar_colgadas.py`. Recorta, optimiza y mide cada foto, y escribe `colgadas.js`.
5. Pon sus ids en `conEspalda` / `destacadas` de `tienda.config.js` si hace falta.
6. Comprueba con `npm run check` y recarga.

## 4. "Haz tu estampado"

Usa dos fotos lisas, una negra y otra blanca: `img/colgadas/custom-negra-lisa.webp` y `custom-blanca-lisa.webp`, más las mismas con tu logo de muestra (`custom-*-frente.webp`). Si quieres usar tus propias camisetas lisas, `herramientas/preparar_lisas.py` saca la versión lisa a partir de una foto con tu logo (lee `fotos/custom/negra.png` y `blanca.png`; necesita además `pip install opencv-python`).

## 5. Dominio propio

1. En Vercel: **Settings → Domains → Add** y escribe tu dominio.
2. En tu proveedor del dominio pon los registros que te indique Vercel (normalmente un `A` a la IP que muestra y un `CNAME` para `www`).
3. Añade tu dominio a la variable `ALLOWED_ORIGINS` (ver README), para que el diseñador y el probador funcionen desde él.
