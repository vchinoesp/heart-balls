import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const root = fileURLToPath(new URL('.', import.meta.url));

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
        rolldownOptions: {
            input: {
                main: `${root}index.html`,
                materiales: `${root}materiales-descarga-prensa-2026.html`
            }
        }
    }
});
