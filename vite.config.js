import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const root = fileURLToPath(new URL('.', import.meta.url));

/**
 * URL pública del site, para que las metaetiquetas de compartir (og:image,
 * twitter:image) sean absolutas, como piden Facebook, WhatsApp o LinkedIn.
 *  - SITE_URL (variable de entorno), p. ej. https://elsorteoquenosune.es
 *  - o, en Vercel, el dominio de producción del proyecto (variable de sistema)
 * Sin ninguna de las dos se dejan las rutas relativas.
 */
function siteUrl() {
    const url = process.env.SITE_URL || process.env.VERCEL_PROJECT_PRODUCTION_URL || '';

    if (!url) return '';

    return (url.startsWith('http') ? url : `https://${url}`).replace(/\/$/, '');
}

function absoluteShareMeta() {
    return {
        name: 'absolute-share-meta',
        transformIndexHtml(html, context) {
            const base = siteUrl();

            if (!base) return html;

            const page = context.path === '/index.html' ? '/' : context.path;

            return html
                .replace(
                    /(<meta (?:property="og:image"|name="twitter:image") content=")(\/[^"]*)"/g,
                    `$1${base}$2"`
                )
                .replace(
                    '<meta property="og:type"',
                    `<meta property="og:url" content="${base}${page}" />\n    <meta property="og:type"`
                );
        }
    };
}

export default defineConfig({
    plugins: [absoluteShareMeta()],
    build: {
        // Dos páginas: la experiencia (index.html) y la descarga de materiales
        rolldownOptions: {
            input: {
                main: `${root}index.html`,
                materiales: `${root}materiales.html`
            }
        }
    }
});
