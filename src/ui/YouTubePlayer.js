/**
 * YouTubePlayer
 *
 * Reproductor de YouTube en modo de privacidad mejorada, sin la IFrame API:
 *  - Solo un <iframe> de www.youtube-nocookie.com/embed/… (no se descarga
 *    ningún script de www.youtube.com).
 *  - El iframe se crea la primera vez que se reproduce (no penaliza la carga
 *    inicial ni Lighthouse, y hasta entonces no hay ninguna petición a YouTube).
 *  - load(id) cambia de vídeo reutilizando el mismo iframe.
 *  - pause() usa postMessage (enablejsapi=1), sin cargar la API.
 */
const EMBED_ORIGIN = 'https://www.youtube-nocookie.com';

export default class YouTubePlayer {
    constructor(container) {
        this.container = container;
        this.iframe = null;
    }

    /** ¿Hay un vídeo cargado? */
    get active() {
        return Boolean(this.iframe);
    }

    static embedUrl(videoId, { autoplay = true } = {}) {
        const params = new URLSearchParams({
            autoplay: autoplay ? '1' : '0',
            playsinline: '1',
            rel: '0',
            enablejsapi: '1',
            origin: window.location.origin
        });

        return `${EMBED_ORIGIN}/embed/${encodeURIComponent(videoId)}?${params}`;
    }

    createIframe(title) {
        const iframe = document.createElement('iframe');

        iframe.title = title;
        // fullscreen va en allow (con allowfullscreen además, Chrome avisa en consola)
        iframe.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
        iframe.referrerPolicy = 'strict-origin-when-cross-origin';
        this.container.append(iframe);

        return iframe;
    }

    /** Carga un vídeo (y crea el iframe si aún no existe). Resuelve al cargar. */
    load(videoId, { autoplay = true, title = 'Vídeo de YouTube' } = {}) {
        this.iframe ??= this.createIframe(title);
        this.iframe.title = title;

        return new Promise((resolve, reject) => {
            const iframe = this.iframe;

            iframe.addEventListener('load', () => resolve(iframe), { once: true });
            iframe.addEventListener('error', () => reject(new Error('No se pudo cargar el vídeo')), {
                once: true
            });
            iframe.src = YouTubePlayer.embedUrl(videoId, { autoplay });
        });
    }

    pause() {
        this.iframe?.contentWindow?.postMessage(
            JSON.stringify({ event: 'command', func: 'pauseVideo', args: [] }),
            EMBED_ORIGIN
        );
    }

    dispose() {
        this.iframe?.remove();
        this.iframe = null;
    }
}
