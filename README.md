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
- **Enlaces del popup de la bola**: `src/config/app.config.js` → `links`.
  - `buy`: botón "Compra tu décimo". `{number}` se sustituye por el número elegido con 5 cifras (p. ej. `02845`).
  - `pointsOfSale`: botón "Buscar punto de venta". Vacío (`''`) = el botón no se muestra.
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
