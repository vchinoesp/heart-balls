# El Sorteo que nos une · Heart Balls

Experiencia one-page en WebGL: un corazón formado por miles de bolas de madera numeradas (00.000–99.999). Está hecha con Three.js, GSAP, SCSS, Vite y se despliega en Vercel.

## Scripts

| Comando | Qué hace |
| --- | --- |
| `npm run dev` | Servidor de desarrollo |
| `npm run bake` | Recalcula la colocación de las bolas → `public/data/heart-layout.bin` |
| `npm run build` | Build normal. Admite `#debug` y `#fps` / `#stats` salvo que `VITE_PROD=true` |
| `npm run build:prod` | Build de producción: sin `#debug`, sin `#fps` / `#stats` y sin `debugMode` |
| `npm run preview` | Sirve la carpeta `dist` |

`build` y `build:prod` ejecutan `bake` automáticamente antes de compilar.

## Dónde se cambia cada cosa

- **Vídeos de YouTube** (anuncio y making of): `src/config/app.config.js` → `videos.anuncio.id` y `videos.making.id`. El id es lo que va tras `?v=` en la URL de YouTube.
  - Se reproducen en modo de privacidad mejorada: un iframe de `youtube-nocookie.com`, sin la IFrame API.
  - No se conecta con YouTube hasta pulsar play.
  - `poster` (opcional) es una imagen propia para el póster; si no hay, se usa la miniatura de YouTube.
- **Enlaces**: `src/config/app.config.js` → `links`. Vacío (`''`) = no se muestra.
  - `buy`: botón "Compra tu décimo" del popup de la bola (ahora vacío: no se muestra). `{number}` se sustituye por el número elegido con 5 cifras (p. ej. `02845`).
  - `pointsOfSale`: botón "Buscar punto de venta" del popup.
- **Materiales descargables** (`materiales.html`): listado en `src/config/materiales.config.js` (`titulo` + `url`). Los archivos van en `public/materiales/` con el mismo nombre que en `url`; se admiten espacios y tildes.
- **Compartir en redes**: `public/images/img_compartir.jpg` (1200×629), con el texto de `description` y `og:description` en `index.html`. Para que las URL de la imagen sean absolutas en el build hay que definir `SITE_URL` (p. ej. `https://dominio.es`); en Vercel se usa sola la variable de sistema del dominio de producción.
- **Números no disponibles a la venta**: `src/config/numbers.config.js` → `unavailable`. Admite `2845`, `'02845'` o `'02.845'`. Vacío = se usan todos los números. Afecta al reparto de números en el navegador, así que no hace falta volver a ejecutar `bake`.
- **Forma, bolas, luz e interacción del corazón**: `src/config/heart.config.js`.
  - Si se cambia la forma o el empaquetado, hay que ejecutar `npm run bake`.
  - `navigation.maxTilt` es la inclinación máxima y `navigation.minSurfaceDistance` la distancia mínima de la cámara al corazón al hacer zoom.
- **Textos, loading, edad**: `index.html` y `src/config/app.config.js` (`ageGate`, `loader`).

## Producción

`appConfig.prod` (en `src/config/app.config.js`) desactiva el modo depuración. Se activa de cualquiera de estas formas:

- `npm run build:prod`.
- Variable de entorno `VITE_PROD=true`. En Vercel se añade en Settings → Environment Variables, marcada solo para **Production**. Así las previews siguen admitiendo `#debug` y `#fps`.
- A mano: `const prod = true;` en `app.config.js`.

## Depuración (solo fuera de producción)

- `/#debug`: panel lil-gui (forma, material, interacción, navegación) y contador de FPS.
- `/#fps` o `/#stats`: solo el contador de FPS (para probar en móvil).
- `debugMode: true` en `app.config.js`: se salta el selector de edad.
