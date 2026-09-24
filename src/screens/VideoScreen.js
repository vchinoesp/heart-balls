import gsap from 'gsap';

import Screen from './Screen.js';
import YouTubePlayer from '../ui/YouTubePlayer.js';

/**
 * VideoScreen
 *
 * Visor del anuncio / making of (YouTube IFrame API).
 *  - Póster propio con botón play (la API no se descarga hasta pulsar).
 *  - "Ver making of" ⇄ "Ver anuncio": cambia de vídeo y de texto.
 *  - Al salir de la pantalla el vídeo se pausa.
 */
export default class VideoScreen extends Screen {
    constructor(root, { reducedMotion, videos }) {
        super(root, { reducedMotion });

        this.videos = videos;
        this.current = 'anuncio';

        this.frame = root.querySelector('.video__frame');
        this.poster = root.querySelector('.video__poster');
        this.posterImage = root.querySelector('.video__poster-image');
        this.switchButton = root.querySelector('.video__switch');
        this.switchLabel = this.switchButton.querySelector('.play-button__label');
        this.title = root.querySelector('#video-title');

        this.player = new YouTubePlayer(root.querySelector('.video__player'));

        root.addEventListener('click', (event) => {
            const action = event.target.closest('[data-action]')?.dataset.action;

            if (action === 'play-video') this.play();
            if (action === 'switch-video') this.switchVideo();
        });

        this.updateTexts();
    }

    get animated() {
        return [this.frame, this.switchButton];
    }

    get video() {
        return this.videos[this.current];
    }

    onEnter() {
        this.setPoster();
    }

    onLeave() {
        this.player.pause();
    }

    setPoster() {
        this.posterImage.src = `https://i.ytimg.com/vi/${this.video.id}/maxresdefault.jpg`;
        this.poster.hidden = false;
        gsap.set(this.poster, { opacity: 1 });
    }

    async play() {
        this.poster.setAttribute('aria-busy', 'true');

        try {
            await this.player.load(this.video.id, { autoplay: true });

            gsap.to(this.poster, {
                opacity: 0,
                duration: 0.5,
                ease: 'power2.out',
                onComplete: () => {
                    this.poster.hidden = true;
                }
            });
        } catch (error) {
            console.error(error);
        } finally {
            this.poster.removeAttribute('aria-busy');
        }
    }

    switchVideo() {
        this.current = this.current === 'anuncio' ? 'making' : 'anuncio';
        this.updateTexts();

        // Transición: el marco se oscurece, cambia el vídeo y vuelve
        const playing = Boolean(this.player.player) && this.poster.hidden;

        gsap.timeline()
            .to(this.frame, { opacity: 0, scale: 0.98, duration: 0.35, ease: 'power2.in' })
            .add(() => {
                if (playing) {
                    this.player.load(this.video.id, { autoplay: true });
                } else {
                    this.setPoster();
                }
            })
            .to(this.frame, { opacity: 1, scale: 1, duration: 0.8, ease: 'expo.out' });

        gsap.fromTo(
            this.switchLabel,
            { opacity: 0, x: -8 },
            { opacity: 1, x: 0, duration: 0.6, ease: 'power3.out' }
        );
    }

    updateTexts() {
        const isAd = this.current === 'anuncio';

        this.switchLabel.textContent = isAd ? 'Ver making of' : 'Ver anuncio';
        this.title.textContent = this.video.title;
        this.poster.setAttribute('aria-label', `Reproducir: ${this.video.title}`);
    }
}
