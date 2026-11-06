// Servidor local para probar la tienda en tu ordenador: sirve la página y ejecuta las APIs (api/*.js) como Vercel.
// Uso:  npm run dev   →   http://localhost:8765
// Las claves se leen de .env.local (copia .env.example y rellénalo). Sin claves la tienda funciona, pero sin IA ni probador.
import http from "node:http"; import fs from "node:fs"; import path from "node:path"; import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PUERTO = Number(process.env.PORT) || 8765;

// .env.local → process.env (sin dependencias)
const envFile = path.join(ROOT, ".env.local");
if (fs.existsSync(envFile)) for (const l of fs.readFileSync(envFile, "utf8").split(/\r?\n/)) {
  const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/); if (m) process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
}

const APIS = {};
for (const nombre of ["estampado", "tokens"]) {
  try { APIS[`/api/${nombre}`] = (await import(pathToFileURL(path.join(ROOT, "api", `${nombre}.js`)).href)).default; }
  catch (e) { console.warn(`api/${nombre}.js no se pudo cargar (¿falta npm install?): ${e.message}`); }
}
const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".mjs": "text/javascript", ".webp": "image/webp",
  ".png": "image/png", ".jpg": "image/jpeg", ".ico": "image/x-icon", ".json": "application/json", ".css": "text/css", ".svg": "image/svg+xml" };

http.createServer(async (req, res) => {
  const u = new URL(req.url, "http://localhost");
  const api = APIS[u.pathname];
  if (api) {
    let raw = ""; for await (const c of req) raw += c;
    try { req.body = JSON.parse(raw || "{}"); } catch { req.body = {}; }
    res.status = n => { res.statusCode = n; return res; };
    res.json = o => { res.setHeader("Content-Type", "application/json"); res.end(JSON.stringify(o)); };
    res.send = b => res.end(b);
    return api(req, res);
  }
  // Archivos estáticos, sin salir de la carpeta del proyecto ni servir secretos
  const f = path.join(ROOT, decodeURIComponent(u.pathname === "/" ? "/index.html" : u.pathname));
  if (!f.startsWith(ROOT + path.sep) || /[\\/]\.(env|git|vercel)/.test(f) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) {
    res.statusCode = 404; return res.end("No encontrado");
  }
  res.setHeader("Content-Type", TYPES[path.extname(f)] || "application/octet-stream"); fs.createReadStream(f).pipe(res);
}).listen(PUERTO, () => console.log(`Tienda en http://localhost:${PUERTO}  (Ctrl+C para parar)`));
