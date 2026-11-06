// Freno de gasto dentro de cada función (segunda capa; la primera es la regla del cortafuegos de Vercel, 6 peticiones/min por IP).
// Cuenta en memoria de la instancia: no es exacto entre servidores, pero corta ráfagas y pone un techo de gasto por hora
// aunque el abuso venga de muchas IPs distintas (la cabecera Origin se puede falsear desde fuera del navegador).

// Webs que pueden usar las APIs (la IA y el probador gastan créditos: solo tu tienda).
// Se detectan solas en Vercel (dominio de producción y de cada despliegue) + los de ALLOWED_ORIGINS (tu dominio propio) + localhost.
const propios = [process.env.VERCEL_PROJECT_PRODUCTION_URL, process.env.VERCEL_URL, process.env.VERCEL_BRANCH_URL]
  .filter(Boolean).map(h => `https://${h.trim()}`);
const extra = (process.env.ALLOWED_ORIGINS || "").split(",").map(s => s.trim().replace(/\/+$/, "")).filter(Boolean);
export const origenPermitido = origin => {
  const o = String(origin || "").trim();
  return [...propios, ...extra].includes(o) || /^http:\/\/localhost(:\d+)?$/.test(o);
};

// IP real del cliente: en Vercel, x-real-ip / x-forwarded-for las pone la plataforma (el cliente no puede colarlas)
export const ipDe = req => String(req.headers["x-real-ip"] || req.headers["x-forwarded-for"] || "").split(",")[0].trim() || "?";

export function limitador({ porIpMinuto, globalHora }){
  const porIp = new Map(), global = [];
  return ip => {
    const ahora = Date.now();
    while (global.length && ahora - global[0] > 3_600_000) global.shift();
    if (global.length >= globalHora) return "global";
    const recientes = (porIp.get(ip) || []).filter(t => ahora - t < 60_000);
    if (recientes.length >= porIpMinuto) return "ip";
    recientes.push(ahora); porIp.set(ip, recientes); global.push(ahora);
    if (porIp.size > 5000) for (const [k, v] of porIp) if (!v.some(t => ahora - t < 60_000)) porIp.delete(k);   // limpieza
    return null;
  };
}
