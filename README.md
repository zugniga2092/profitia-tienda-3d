# Tienda 3D de camisetas · por Profitia

Una tienda online en **3D** donde tus clientes recorren una sala con neones, miran cada camiseta colgada, calculan su talla, **diseñan su propia camiseta con IA**, se la **prueban con la cámara** y te hacen el **pedido por WhatsApp**.

Sin servidores que mantener, sin base de datos y sin pasarela de pago: se publica gratis en Vercel en unos minutos.

> Hecho por [Profitia](https://profitia.digital) — IA para negocios. Si te sirve, deja una ⭐ en el repo.

---

## Qué incluye

| | |
|---|---|
| 🏬 **Sala 3D** | Paredes con graffiti, neones, percheros, mural con tu eslogan y zonas: Colección, Drops, Lo más top, Haz tu estampado y Probador. Funciona en móvil, tablet y ordenador. |
| 👕 **Ficha de cada camiseta** | Visor 3D que se gira, foto delante y detrás, medidas de la prenda y **calculadora de talla**. |
| ✨ **Diseñador con IA** *(opcional)* | El cliente escribe su idea ("un león con corona que diga REY") y la IA dibuja el estampado en estilo streetwear. El texto lo escribe la tienda, así que **nunca sale con faltas**. Se puede retocar: "quítale el nombre", "ponle alas". Delante y detrás. |
| 📷 **Probador con cámara** *(opcional)* | El cliente se ve con la camiseta puesta en directo (Decart). |
| 💬 **Pedido por WhatsApp** | El carrito abre tu WhatsApp con el pedido escrito. Si es personalizada, descarga una ficha con el diseño para adjuntarla. |
| 🔒 **Seguridad de serie** | Cabeceras de seguridad, claves solo en el servidor, límites anti-abuso para que nadie gaste tus créditos, comprobador automático. |

---

## Instalación paso a paso

### Lo que necesitas

- Una cuenta gratis en **[GitHub](https://github.com)** y otra en **[Vercel](https://vercel.com)** (puedes entrar en Vercel con tu GitHub).
- Para probar en tu ordenador (opcional): **[Node.js 20 o superior](https://nodejs.org)**.
- Para el diseñador con IA (opcional): una clave de **[Pollinations](https://enter.pollinations.ai)**.
- Para el probador con cámara (opcional): una clave de **[Decart](https://platform.decart.ai)**.

### Opción A · Publicar directamente (5 minutos, sin instalar nada)

1. Pulsa **Use this template → Create a new repository** (arriba a la derecha en GitHub) para tener tu propia copia.
2. En tu copia, abre **`tienda.config.js`**, pulsa el lápiz ✏️ y cambia el nombre, el eslogan, **tu WhatsApp** y los precios. Guarda con **Commit changes**.
3. Entra en **[vercel.com/new](https://vercel.com/new)**, elige tu repositorio y pulsa **Deploy**.
4. Listo: Vercel te da una dirección tipo `tu-tienda.vercel.app`. Cada vez que cambies algo en GitHub, se actualiza sola.

### Opción B · Probar primero en tu ordenador

```bash
git clone https://github.com/TU-USUARIO/TU-REPO.git
cd TU-REPO
npm install
cp .env.example .env.local      # en Windows: copy .env.example .env.local
npm run dev                     # abre http://localhost:8765
```

Sin claves la tienda funciona entera; el diseñador con IA y el probador simplemente avisan de que no están activos.

### Activar el diseñador con IA y el probador (opcional)

1. **Pollinations** → crea una clave **Secreta** (empieza por `sk_`). Permisos: solo **Image** y **Text**. Ponle un **presupuesto máximo**.
2. **Decart** → crea una API key.
3. En **Vercel → tu proyecto → Settings → Environment Variables**, añade (marcando *Sensitive*):

   | Variable | Valor |
   |---|---|
   | `POLLINATIONS_API_KEY` | tu clave `sk_...` |
   | `DECART_API_KEY` | tu clave de Decart |
   | `ALLOWED_ORIGINS` | solo si tienes dominio propio: `https://mitienda.com,https://www.mitienda.com` |

4. **Deployments → ⋯ → Redeploy** para que las use.

> ⚠️ **Nunca pongas una clave dentro del código ni la subas a GitHub.** Van solo en Vercel o en tu `.env.local`.

---

## Personalizar

Todo lo básico está en **`tienda.config.js`**: nombre, eslogan, WhatsApp, moneda, precios, texto del envío, nombres de las zonas y qué camisetas van destacadas o llevan estampado detrás.

Para poner **tus camisetas, tu logo y tu mural**, sigue la guía: **[docs/personalizar.md](docs/personalizar.md)**.

Atajo: `npm run ejemplos -- "MI MARCA" "MI ESLOGAN"` regenera el logo, el mural, los iconos y las camisetas de muestra con tu marca (necesita Python con `pillow` y `numpy`).

---

## Comprobar antes de publicar

```bash
npm run check
```

Revisa la configuración, que existan todas las fotos, que las APIs carguen y que **no haya ninguna clave dentro del código**. GitHub lo ejecuta solo en cada cambio (pestaña **Actions**).

---

## Estructura

```
├── index.html              La tienda (sala 3D, fichas, carrito, diseñador, probador)
├── tienda.config.js        ← TU CONFIGURACIÓN
├── colgadas.js             Catálogo: tus camisetas (lo genera la herramienta de fotos)
├── catalog.js              Catálogo de camisetas en 3D generado (vacío en la plantilla)
├── img/                    Logo, mural, iconos y fotos de las camisetas
├── api/
│   ├── estampado.js        Diseñador con IA (Pollinations)
│   ├── tokens.js           Permisos temporales del probador (Decart)
│   └── _limite.js          Límites anti-abuso y webs permitidas
├── herramientas/           Servidor local, comprobador y preparación de fotos
├── docs/                   Guías: personalizar y seguridad
└── vercel.json             Cabeceras de seguridad
```

---

## Seguridad

Lee **[docs/seguridad.md](docs/seguridad.md)**: qué protege la plantilla, cómo poner un cortafuegos gratis en Vercel y qué revisar antes de abrir la tienda.

## Licencia

[MIT](LICENSE) © Profitia. Puedes usarlo, modificarlo y venderlo; solo mantén el aviso de copyright.

Las camisetas, logos y textos de ejemplo son solo de muestra: sustitúyelos por los tuyos. Las fuentes se cargan desde Google Fonts y three.js desde jsDelivr, cada uno con su propia licencia.
