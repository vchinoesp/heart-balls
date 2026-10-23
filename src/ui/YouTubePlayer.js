const EMBED_ORIGIN = 'https://www.youtube-nocookie.com';

export default class YouTubePlayer {
    constructor(container) {
        this.container = container;
        this.iframe = null;
    }

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
        iframe.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
        iframe.referrerPolicy = 'strict-origin-when-cross-origin';
        this.container.append(iframe);

        return iframe;
    }

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
