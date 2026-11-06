// Entrega al navegador un permiso temporal de Decart para el probador con cámara.
// La clave de verdad (DECART_API_KEY) vive solo en las variables de entorno de Vercel; nunca llega a la página.
// Pensado para gastar lo mínimo: solo desde la tienda, permiso de 60 s y sesión de 90 s como mucho.
import { createDecartClient } from "@decartai/sdk";
import { ipDe, limitador, origenPermitido } from "./_limite.js";
// Cada permiso abre hasta 90 s de cámara con IA (créditos de Decart): 2 por minuto por visitante, 40 por hora en cada servidor
const limite = limitador({ porIpMinuto: 2, globalHora: 40 });

const MODEL = "lucy-vton-latest";
// Solo se dan permisos a la propia tienda (y a pruebas en local). Así nadie puede usar tus créditos desde otra web.

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") return res.status(405).json({ error: "Usa POST" });

  const origin = (req.headers.origin || "").trim();
  if (!origenPermitido(origin)) return res.status(403).json({ error: "Origen no permitido" });

  const freno = limite(ipDe(req));
  if (freno) return res.status(429).json({ error: freno === "ip" ? "Espera un minuto antes de volver a probar" : "El probador está muy solicitado. Prueba en unos minutos." });

  const apiKey = (process.env.DECART_API_KEY || "").trim();
  if (!apiKey) return res.status(500).json({ error: "Falta DECART_API_KEY en Vercel" });

  try {
    const client = createDecartClient({ apiKey });
    const token = await client.tokens.create({
      expiresIn: 60,                                          // el permiso caduca al minuto si no se usa
      allowedModels: [MODEL],                                 // solo sirve para el probador
      allowedOrigins: [origin],                               // y solo desde esta web
      constraints: { realtime: { maxSessionDuration: 90 } },  // cada prueba dura como mucho 90 s (tope de gasto)
    });
    return res.status(200).json({ apiKey: token.apiKey, expiresAt: token.expiresAt });
  } catch (err) {
    console.error("decart token", err?.message || err);
    return res.status(502).json({ error: "No se pudo crear el permiso del probador" });
  }
}
