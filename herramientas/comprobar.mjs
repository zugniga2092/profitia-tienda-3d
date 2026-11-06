// Comprueba que la tienda está bien montada antes de publicarla:   npm run check
// (lo mismo lo ejecuta GitHub en cada cambio: .github/workflows/comprobar.yml)
import fs from "node:fs"; import path from "node:path"; import vm from "node:vm"; import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const errores = [], avisos = [];
const ok = m => console.log("  ✔", m), mal = m => errores.push(m), ojo = m => avisos.push(m);

// 1) Configuración y catálogo: se ejecutan como en el navegador
const window = {};
for (const f of ["tienda.config.js", "catalog.js", "colgadas.js"]) {
  try { vm.runInNewContext(fs.readFileSync(path.join(ROOT, f), "utf8"), { window }); ok(`${f} se lee bien`); }
  catch (e) { mal(`${f}: ${e.message}`); }
}
const T = window.TIENDA || {}, C = window.COLGADAS || {};
if (!T.nombre) mal("tienda.config.js: falta 'nombre'");
if (!/^\d{8,15}$/.test(String(T.whatsapp || ""))) mal("tienda.config.js: 'whatsapp' debe ser solo números con prefijo de país (ej. 34600111222)");
else if (/^34600000000$/.test(T.whatsapp)) ojo("tienda.config.js: el WhatsApp es el de ejemplo; pon el tuyo");
for (const k of ["unLado", "dosLados"]) if (!(T.precios?.[k] > 0)) mal(`tienda.config.js: precios.${k} debe ser un número mayor que 0`);
for (const k of ["conEspalda", "destacadas"]) for (const id of T[k] || []) if (!C[id]) mal(`tienda.config.js: '${id}' (en ${k}) no está en colgadas.js`);

// 2) Todas las fotos del catálogo existen
let fotos = 0;
for (const [id, it] of Object.entries(C)) for (const v of ["frente", "espalda", "lado"]) if (it[v]) {
  fotos++; if (!fs.existsSync(path.join(ROOT, it[v]))) mal(`colgadas.js: falta la foto de '${id}' (${v}): ${it[v]}`);
}
for (const f of ["img/logo-blanco.png", "img/mural.webp", "img/favicon.ico", "img/colgadas/custom-negra-lisa.webp", "img/colgadas/custom-blanca-lisa.webp",
  "img/colgadas/custom-negra-frente.webp", "img/colgadas/custom-blanca-frente.webp"]) if (!fs.existsSync(path.join(ROOT, f))) mal(`falta ${f}`);
ok(`${Object.keys(C).length} camisetas, ${fotos} fotos revisadas`);

// 3) Las APIs cargan sin errores de sintaxis
for (const f of ["api/_limite.js", "api/estampado.js"]) {
  try { await import(pathToFileURL(path.join(ROOT, f)).href); ok(`${f} carga`); } catch (e) { mal(`${f}: ${e.message}`); }
}
try { JSON.parse(fs.readFileSync(path.join(ROOT, "vercel.json"), "utf8")); ok("vercel.json es válido"); } catch (e) { mal(`vercel.json: ${e.message}`); }

// 4) Ninguna clave dentro del código (las claves van en .env.local o en Vercel)
const PATRONES = [/\bsk_[A-Za-z0-9]{20,}/, /\bpk_[A-Za-z0-9]{20,}/, /(api[_-]?key|secret|token)\s*[:=]\s*["'][A-Za-z0-9_\-]{24,}["']/i, /-----BEGIN [A-Z ]*PRIVATE KEY-----/];
const IGNORAR = new Set(["node_modules", ".git", ".vercel", "fotos", "img"]);
const recorrer = d => fs.readdirSync(d, { withFileTypes: true }).flatMap(e => IGNORAR.has(e.name) ? [] : e.isDirectory() ? recorrer(path.join(d, e.name)) : [path.join(d, e.name)]);
let revisados = 0;
for (const f of recorrer(ROOT)) {
  const rel = path.relative(ROOT, f);
  if (/^\.env/.test(path.basename(f)) && path.basename(f) !== ".env.example") { ojo(`${rel} existe: comprueba que NO lo subes (está en .gitignore)`); continue; }
  if (fs.statSync(f).size > 2_000_000) continue;
  const txt = fs.readFileSync(f, "utf8"); revisados++;
  for (const p of PATRONES) if (p.test(txt)) mal(`${rel}: parece que contiene una clave secreta. Quítala y ponla en .env.local / Vercel`);
}
ok(`${revisados} archivos revisados en busca de claves`);

for (const a of avisos) console.log("  ⚠", a);
if (errores.length){ for (const e of errores) console.log("  ✘", e); console.log(`\n${errores.length} problema(s). Corrígelos antes de publicar.`); process.exit(1); }
console.log("\nTodo en orden ✔");
