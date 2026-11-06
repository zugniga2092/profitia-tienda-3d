# Seguridad

La plantilla viene protegida de serie. Esto es lo que hace y lo que te toca a ti.

## Lo que ya hace

| Riesgo | Protección |
|---|---|
| **Robo de tus claves** | Las claves (Pollinations, Decart) solo viven en el servidor (variables de Vercel). La página nunca las ve. `npm run check` y GitHub Actions avisan si alguna se cuela en el código. |
| **Que otros gasten tus créditos de IA** | Las APIs solo responden a tu tienda (tu dominio de Vercel se detecta solo; el propio va en `ALLOWED_ORIGINS`). Como esa comprobación se puede falsear fuera del navegador, además hay **límites**: por visitante (diseños 4/min, probador 2/min) y un **tope por hora** (150 diseños y 40 pruebas de cámara por servidor). |
| **XSS / inyección** | Lo que escribe el cliente solo se dibuja en imágenes o como texto plano, nunca como HTML. El carrito guardado se valida antes de mostrarse. Política de seguridad de contenido (CSP) estricta. |
| **Clickjacking** | Nadie puede meter tu tienda dentro de otra web (`frame-ancestors 'none'`, `X-Frame-Options: DENY`). |
| **Uso indebido de la cámara** | `Permissions-Policy`: solo tu tienda puede pedir la cámara; micrófono, ubicación y pagos bloqueados. |
| **Conexión** | HTTPS forzado con HSTS. |
| **Dependencias** | Versiones fijadas con `package-lock.json`. |

## Lo que te toca a ti (10 minutos)

1. **Verificación en dos pasos** en GitHub, Vercel, Pollinations y Decart. Es lo que más protege.
2. **Presupuesto máximo** en tu clave de Pollinations y límites de gasto en Decart. Si algo falla, el gasto se para solo.
3. **Cortafuegos gratis en Vercel** (recomendado). Con la [CLI de Vercel](https://vercel.com/docs/cli), desde la carpeta del proyecto:
   ```bash
   vercel firewall rules add "APIs: límite por IP" \
     --condition '{"type":"path","op":"inc","value":["/api/estampado","/api/tokens"]}' \
     --action rate_limit --rate-limit-window 60 --rate-limit-requests 6 \
     --rate-limit-keys ip --rate-limit-action rate_limit --yes
   vercel firewall publish --yes
   ```
   Limita a 6 peticiones por minuto y por IP la IA y el probador, sin tocar el resto de la web. El plan gratis permite una regla de límite.
4. **Nunca** subas `.env.local` ni pegues claves en el código, en issues o en capturas.
5. Si una clave se filtra: **revócala** en su panel, crea otra y cámbiala en Vercel.

## Si tienes dominio propio

- Añade un registro **CAA** `0 issue "letsencrypt.org"` para que solo Let's Encrypt (el que usa Vercel) pueda emitir tu certificado.
- Si usas correo con tu dominio, pon **DMARC** al menos en `p=quarantine` para que nadie se haga pasar por ti.

## Avisar de un fallo de seguridad

No abras un issue público. Escribe a Profitia (https://profitia.digital) y lo revisamos.
