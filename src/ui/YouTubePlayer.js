/**
 * YouTubePlayer
 *
 * Envoltorio mínimo de la YouTube IFrame API:
 *  - La API solo se descarga la primera vez que se va a reproducir
 *    (no penaliza la carga inicial ni Lighthouse).
 *  - Usa youtube-nocookie.com (sin cookies hasta reproducir).
 *  - load(id, autoplay) cambia de vídeo sin recrear el iframe.
 */
let apiPromise = null;

function loadApi() {
    if (window.YT?.Player) return Promise.resolve(window.YT);

    apiPromise ??= new Promise((resolve, reject) => {
        const previous = window.onYouTubeIframeAPIReady;

        window.onYouTubeIframeAPIReady = () => {
            previous?.();
            resolve(window.YT);
        };

        const script = document.createElement('script');

        script.src = 'https://www.youtube.com/iframe_api';
        script.async = true;
        script.onerror = () => {
            apiPromise = null;
            reject(new Error('No se pudo cargar la API de YouTube'));
        };
        document.head.append(script);
    });

    return apiPromise;
}

export default class YouTubePlayer {
    constructor(container, { onStateChange } = {}) {
        this.container = container;
        this.onStateChange = onStateChange;
        this.player = null;
        this.ready = null;
    }

    async create(videoId, autoplay) {
        const YT = await loadApi();

        this.ready = new Promise((resolve) => {
            this.player = new YT.Player(this.container, {
                host: 'https://www.youtube-nocookie.com',
                videoId,
                width: '100%',
                height: '100%',
                playerVars: {
                    autoplay: autoplay ? 1 : 0,
                    playsinline: 1,
                    rel: 0,
                    modestbranding: 1
                },
                events: {
                    onReady: () => resolve(this.player),
                    onStateChange: (event) => this.onStateChange?.(event.data)
                }
            });
        });

        return this.ready;
    }

    /** Carga un vídeo; si el reproductor no existe aún, lo crea. */
    async load(videoId, { autoplay = true } = {}) {
        if (!this.player) {
            const player = await this.create(videoId, autoplay);

            if (autoplay) player.playVideo();

            return;
        }

        await this.ready;

        if (autoplay) this.player.loadVideoById(videoId);
        else this.player.cueVideoById(videoId);
    }

    pause() {
        this.player?.pauseVideo?.();
    }

    dispose() {
        this.player?.destroy?.();
        this.player = null;
    }
}
