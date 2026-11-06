// ─────────────────────────────────────────────────────────────────────────────
//  CONFIGURACIÓN DE TU TIENDA — es lo único que tienes que tocar para empezar.
//  Guarda el archivo y recarga la página para ver los cambios.
// ─────────────────────────────────────────────────────────────────────────────
window.TIENDA = {
  // Marca
  nombre: "TU MARCA",                    // sale en la sala 3D, la carga, el pedido y la ficha del diseño
  eslogan: "TU ESLOGAN AQUÍ",            // sale en la pared de graffiti y en la pantalla de carga
  descripcion: "Tienda 3D de camisetas: recorre la sala, mira cada prenda, calcula tu talla y pide por WhatsApp.",

  // Pedidos por WhatsApp: tu número con prefijo de país, SIN "+" ni espacios (ej. España 34 + 600111222)
  whatsapp: "34600000000",

  // Precios (en la moneda de abajo). "dosLados" = estampado delante y detrás.
  moneda: "EUR",
  idioma: "es-ES",
  precios: { unLado: 34.5, dosLados: 38.5 },
  // Camisetas de tu catálogo con estampado también en la espalda (por su id, ver colgadas.js)
  conEspalda: ["ejemplo-05", "ejemplo-06"],
  // Las 3 que van en la pared "Lo más top"
  destacadas: ["ejemplo-04", "ejemplo-05", "ejemplo-06"],

  // Texto del envío que se ve en el carrito
  envio: "Envío a toda Europa desde 5 € (aparte). Te confirmamos el precio exacto por WhatsApp.",

  // Nombres de las zonas de la sala
  zonas: { negras: "Colección", drops: "Drops · delante y detrás", top: "Lo más top", custom: "Haz tu estampado" },
};
