// "Dile a la tienda qué quieres": el cliente escribe su idea (en su idioma, como le salga) y Pollinations dibuja el estampado.
// La clave (POLLINATIONS_API_KEY, secreta sk_) vive solo en Vercel; la página nunca la ve.
// Pensado para gastar lo mínimo: solo desde la tienda, idea corta y unos pocos dibujos por minuto y visitante.
const MODEL = (process.env.POLLINATIONS_MODEL || "tongyi-mai/z-image-turbo").trim();         // dibujo: modelo gratis
// Director: entiende la idea. El "nano" confundía cambios del dibujo con texto ("ponle alas" lo rotulaba) → "mini" (sigue costando casi nada)
const DIRECTOR = (process.env.POLLINATIONS_DIRECTOR || "openai/gpt-5.4-mini").trim();
import { ipDe, limitador, origenPermitido } from "./_limite.js";
// 4 dibujos/min por visitante y, como mucho, 150 por hora en cada servidor (tope de gasto aunque falseen el origen)
const limite = limitador({ porIpMinuto: 4, globalHora: 150 });

// Estilo de la marca: como la colección, primer plano dramático y recortado que llena el lienzo y se sale por abajo
// (nada de un animal entero pequeño en el centro). Se dibuja sobre el color de la camiseta para quitar ese fondo en la página.
// Ojo, palabras que estropean: "t-shirt" (dibuja la camiseta), "sticker" (borde y sombra), "poster" (le pone título).
// Estilo STREETWEAR (el aerógrafo realista quedaba "muy suave"): dos estilos probados
// con la misma idea y elegidos frente al anterior. "Otra versión" alterna entre ellos; si el cliente pide blanco y negro, serigrafía.
const COMUN = "the huge main subject is cropped by the frame and bleeds off the bottom edge, raw and aggressive, heavy black ink outlines, " +
  "halftone dot shading, gritty grunge distressed cracked screen-print texture, high contrast, no drop shadow, no frame, no border";
const ESTILOS = {
  // Collage: llamas, alambre de espino, cromo Y2K, destellos, colores ácidos
  collage: "Bold underground streetwear graphic, collage composition: the subject surrounded by flames, barbed wire, chrome Y2K tribal shapes, " +
    `sparkle stars and lightning, ${COMUN}, saturated acid colors with black`,
  // Serigrafía: fotocopia, trama de puntos, paleta corta y dura
  serigrafia: `Bold streetwear graphic design for a screen print, ${COMUN}, xerox photocopy grain, harsh dramatic lighting, limited punchy color palette`,
};
// Fondo del color de la camiseta para quitarlo luego en la página (en la blanca, si no se insiste, la IA pone fondo oscuro)
const FONDO = {
  black: "isolated on a plain flat pure black background",
  white: "printed on white paper, the background is plain pure white paper, white negative space around the subject, no dark background",
};
const BN = "strictly black and white monochrome only, absolutely no color";
const pideBN = s => /blanco y negro|b\s*\/\s*n\b|\bbyn\b|monocrom|escala de grises|black and white|grayscale|sin color/i.test(s);

// El director convierte lo que escribe el cliente en: dibujo en inglés (con TODO lo que pide) + frase a rotular (si la hay) + si es B/N.
// Si la clave no tiene permiso de texto o falla, se sigue con reglas sencillas (comillas = texto, "blanco y negro" = B/N).
// Retoque: si llega el plan del diseño anterior, el director lo EDITA con lo que pide el cliente
// ("quítale el nombre", "ponle alas") y dice si hace falta redibujar o basta con cambiar las letras.
const EDITAR = "You edit an existing t-shirt print design. You get the PREVIOUS design as JSON and the customer's change request (usually Spanish). " +
  "Apply ONLY the requested change and keep everything else exactly as it was (copy unchanged fields verbatim). " +
  'Reply ONLY with JSON: {"subject": string, "text": string|null, "extras": string[], "monochrome": boolean, "redraw": boolean}. ' +
  "redraw: false ONLY when the change is about the lettering (remove/change the name, the main text or the side texts); " +
  "true whenever they ask to add, remove or change anything in the picture (objects, wings, animals, colors, background, style). " +
  "A request like 'ponle alas', 'hazlo rojo', 'quítale el fuego' is a PICTURE change: update subject, redraw true, keep text as it was. " +
  "Only change text when they explicitly give the words to write (in quotes, 'que diga X', 'pon el nombre X', 'cambia el nombre a X'). " +
  "If they ask to remove the name/text, set text to null. If they ask to remove side texts, set extras to []. " +
  "New text must be copied character by character from the request. Never mention words or lettering in subject. " +
  "monochrome: true only if the design is or must become black and white.";
async function dirigir(idea, key, anterior){
  const sistema = anterior ? EDITAR : "You turn a customer's t-shirt print request (usually Spanish) into JSON for an image model. Reply ONLY with JSON: " +
    '{"subject": string, "text": string|null, "extras": string[], "monochrome": boolean}. ' +
    "subject: English description of the illustration with EVERY element, color and detail the customer names (never drop any). " +
    "Never mention words, letters, lettering, names, titles, banners, labels, signs or text of any kind in subject: describe only the picture. " +
    "text: the exact words to letter on the print, copied character by character from the request, or null. Use it when the customer puts words in quotes, " +
    "asks for a word/phrase/name (e.g. 'con el nombre Camilo' → text 'Camilo', 'que diga bendecida' → 'bendecida'), " +
    "or when the whole request is just a phrase or slogan rather than a picture description. Never put a picture description in text. " +
    "If the request is only a phrase, subject must be a powerful illustration that matches its meaning (religious, gothic, street, cinematic mood). " +
    "Always stage subject like a bold streetwear graphic: a dramatic close-up or cropped hero shot of the main subject, aggressive attitude. " +
    "extras: exactly 2 short streetwear taglines (2 or 3 words each) that match the vibe of the idea, like the side texts on bootleg rap prints " +
    "(e.g. 'Fight For Glory', 'Trust Your Vision', 'Born Loud', 'Sin Miedo', 'Hecho Con Fe'). Write them in the customer's language, never repeat the main text. " +
    "monochrome: true only if they ask for black and white / no color.";
  try {
    const r = await fetch("https://gen.pollinations.ai/v1/chat/completions", {
      method: "POST", headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" }, signal: AbortSignal.timeout(15_000),
      body: JSON.stringify({ model: DIRECTOR, messages: [{ role: "system", content: sistema },
        { role: "user", content: anterior ? `PREVIOUS: ${JSON.stringify({ subject: anterior.tema, text: anterior.texto, extras: anterior.extras, monochrome: anterior.bn })}\nCHANGE: ${idea}` : idea }] }) });
    const txt = (await r.json())?.choices?.[0]?.message?.content || "";
    const j = JSON.parse(txt.slice(txt.indexOf("{"), txt.lastIndexOf("}") + 1));   // si responde un aviso (p. ej. "no permitido"), esto falla y se usan las reglas
    if (!j.subject) return null;
    // La frase tiene que estar escrita tal cual por el cliente (o ser la que ya tenía): si el modelo la "corrige" o la traduce, no se usa.
    const fuentes = [idea, anterior?.texto || ""].join(" \n ").toLowerCase();
    let texto = j.text && fuentes.includes(String(j.text).toLowerCase().trim()) ? String(j.text).trim() : null;
    let redibujar = anterior ? j.redraw !== false : true;
    // Seguro: en un retoque, si el "texto" es la petición entera ("ponle alas de ángel"), es un cambio del dibujo, no algo a rotular
    const orden = /^(ponle|ponerle|pon|quítale|quitale|quita|añádele|añadele|añade|agrega|agrégale|cambia|cambiale|cámbiale|hazlo|hazle|haz|dale|mete|métele|metele|sin)\b/i;
    if (anterior && texto && (texto.toLowerCase() === idea.toLowerCase() || orden.test(texto))){ texto = anterior.texto; redibujar = true; }
    // Por si acaso: si el dibujo menciona "nombre", "texto"… la IA de imagen lo escribe ella sola (salía "NAME")
    const tema = String(j.subject).replace(/\s*\b(with|and|featuring|plus|showing|bearing)?\s*(an?|the)?\s*\b(names?|text|texts|words?|letters?|lettering|typography|titles?|banners?|labels?|signs?|captions?|slogans?)\b[^.,;]*/gi, "").replace(/\s+([.,;])/g, "$1").replace(/([.,;])[.,;]+/g, "$1").trim();
    // Frases cortas para los lados (como "Fight / For / Glory" en las camisetas de rap vintage): solo letras normales, 2–3 palabras
    const extras = (Array.isArray(j.extras) ? j.extras : []).map(s => String(s).replace(/[^\p{L}\p{N} '!¡?¿&.-]/gu, "").trim())
      .filter(s => s && s.split(/\s+/).length <= 4 && s.length <= 28).slice(0, 2);
    return { tema: (tema || String(j.subject)).slice(0, 400), texto, extras, bn: !!j.monochrome || pideBN(idea), redibujar };
  } catch { return null; }
}
// El plan anterior llega del navegador: se trata como dato no fiable y se limpia campo a campo
function leerAnterior(a){
  if (!a || typeof a !== "object" || typeof a.tema !== "string") return null;
  const limpia = s => String(s).replace(/[^\p{L}\p{N} '!¡?¿&.,-]/gu, "").trim();
  return { tema: a.tema.slice(0, 400), texto: a.texto ? limpia(a.texto).slice(0, 60) || null : null,
    extras: (Array.isArray(a.extras) ? a.extras : []).map(limpia).filter(Boolean).slice(0, 2).map(s => s.slice(0, 28)),
    bn: !!a.bn, seed: Number.isInteger(a.seed) && a.seed >= 0 && a.seed < 1e9 ? a.seed : null };
}
function reglas(idea){
  const texto = (idea.match(/["“«]([^"”»]{1,60})["”»]/) || [])[1]?.trim() || null;
  const tema = idea.replace(/\s*(y\s+)?(con\s+)?(la\s+|el\s+)?(palabra|frase|texto|nombre|que diga|que ponga)?\s*["“«][^"”»]*["”»]/gi, "").trim() || "dramatic gothic ornament";
  return { tema, texto, bn: pideBN(idea) };
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") return res.status(405).json({ error: "Usa POST" });

  const origin = (req.headers.origin || "").trim();
  if (!origenPermitido(origin)) return res.status(403).json({ error: "Origen no permitido" });

  const key = (process.env.POLLINATIONS_API_KEY || "").trim();
  if (!key) return res.status(503).json({ error: "El diseñador con IA no está activado en esta tienda (falta POLLINATIONS_API_KEY). Puedes subir tu diseño." });

  const idea = String(req.body?.idea || "").replace(/\s+/g, " ").trim().slice(0, 200);
  if (idea.length < 3) return res.status(400).json({ error: "Escribe tu idea" });
  const color = req.body?.color === "white" ? "white" : "black";

  const freno = limite(ipDe(req));
  if (freno === "ip") return res.status(429).json({ error: "Espera un minuto antes de pedir otro diseño" });
  if (freno === "global"){ console.warn("estampado: tope por hora alcanzado"); return res.status(429).json({ error: "Hay mucha gente diseñando ahora. Prueba en unos minutos." }); }

  // Tres modos: diseño nuevo · retoque del anterior ("quítale el nombre") · otra versión del mismo plan (nueva semilla, sin director)
  const anterior = leerAnterior(req.body?.anterior), otra = !!req.body?.otra && anterior;
  const plan = otra ? { ...anterior, redibujar: true }
    : (await dirigir(idea, key, anterior)) || (anterior ? { ...anterior, redibujar: true } : { ...reglas(idea), redibujar: true });
  // Retoque solo de letras: no se gasta dibujo; la página vuelve a rotular sobre el mismo dibujo
  if (anterior && !otra && !plan.redibujar)
    return res.status(200).json({ soloTexto: true, plan: { tema: plan.tema, texto: plan.texto, extras: plan.extras || [], bn: plan.bn, seed: anterior.seed } });
  // La IA de imagen nunca escribe (se equivoca con las letras): la frase la rotula la página, que la recibe en una cabecera.
  const estilo = plan.bn ? "serigrafia" : (req.body?.estilo === "serigrafia" ? "serigrafia" : "collage");
  const prompt = `${plan.tema}. Include every element described above. ${ESTILOS[estilo]}${plan.bn ? `, ${BN}` : ""}, ${FONDO[color]}. ` +
    "Textless, pure illustration only, absolutely no text, no letters, no words, no typography.";
  // Retoque del dibujo: misma semilla que el anterior para que se parezca; nuevo u otra versión: semilla al azar
  const seed = anterior && !otra && anterior.seed !== null ? anterior.seed : Math.floor(Math.random() * 1e9);

  const q = new URLSearchParams({ model: MODEL, width: "896", height: "1152", nologo: "true", safe: "true", seed: String(seed) });
  try {
    const r = await fetch(`https://gen.pollinations.ai/image/${encodeURIComponent(prompt)}?${q}`,
      { headers: { Authorization: `Bearer ${key}` }, signal: AbortSignal.timeout(55_000) });
    const tipo = r.headers.get("content-type") || "";
    if (!r.ok || !tipo.startsWith("image/")){
      console.error("pollinations", r.status, (await r.text()).slice(0, 300));
      // 402 = sin saldo de pollen (el gratis se acaba): mensaje claro para el cliente y aviso en los registros
      if (r.status === 402) return res.status(503).json({ error: "El diseñador con IA está en pausa ahora mismo. Puedes subir tu diseño o escribirnos por WhatsApp y te ayudamos." });
      return res.status(502).json({ error: "La IA no pudo dibujarlo ahora. Prueba otra vez." });
    }
    res.setHeader("Content-Type", tipo);
    if (plan.texto) res.setHeader("X-Texto", encodeURIComponent(plan.texto));
    if (plan.extras?.length) res.setHeader("X-Extras", encodeURIComponent(JSON.stringify(plan.extras)));
    // El plan vuelve a la página para poder retocarlo después
    res.setHeader("X-Plan", encodeURIComponent(JSON.stringify({ tema: plan.tema, texto: plan.texto || null, extras: plan.extras || [], bn: !!plan.bn, seed })));
    return res.status(200).send(Buffer.from(await r.arrayBuffer()));
  } catch (err) {
    console.error("pollinations", err?.message || err);
    return res.status(504).json({ error: "La IA tardó demasiado. Prueba otra vez." });
  }
}
