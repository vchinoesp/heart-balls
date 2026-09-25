import gsap from 'gsap';

import appConfig from './config/app.config.js';
import Experience from './experience/Experience.js';
import Header from './ui/Header.js';
import Backdrop from './ui/Backdrop.js';
import AgeGateScreen from './screens/AgeGateScreen.js';
import LoaderScreen from './screens/LoaderScreen.js';
import HomeScreen from './screens/HomeScreen.js';
import HeartScreen from './screens/HeartScreen.js';
import VideoScreen from './screens/VideoScreen.js';

/**
 * App
 *
 * One-page con estos estados:
 *   age (selector de edad) -> loading (ECG) -> home (copy + CTA)
 *   home -> heart (corazón grande + ayuda) -> popup de la bola (BallModal)
 *   home / heart ⇄ video (anuncio / making of)
 *
 * La carga del corazón (datos + WebGL) empieza nada más abrir la web, en
 * segundo plano, así el loading suele ir tan rápido como su animación.
 *
 * appConfig.debugMode = true -> se salta el selector de edad.
 */
export default class App {
    constructor() {
        this.config = appConfig;
        this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        this.body = document.body;
        this.canvas = document.querySelector('.webgl');
        this.footer = document.querySelector('.site-footer');

        this.current = null;
        this.previous = null;
        this.progress = { fonts: 0, experience: 0 };
        this.introPlayed = false;

        this.setUi();
        this.setScreens();
    }

    setUi() {
        this.header = new Header(document.querySelector('.site-header'), {
            reducedMotion: this.reducedMotion,
            onWatch: () => this.goTo('video'),
            onBack: () => this.back()
        });

        this.backdrop = new Backdrop(document.querySelector('.backdrop'), {
            reducedMotion: this.reducedMotion
        });

        gsap.set([this.footer, this.canvas], { autoAlpha: 0 });
    }

    setScreens() {
        const find = (name) => document.querySelector(`[data-screen="${name}"]`);
        const options = { reducedMotion: this.reducedMotion };

        this.screens = {
            age: new AgeGateScreen(find('age'), {
                ...options,
                messageDuration: this.config.ageGate.rejectMessageDuration,
                onAccept: () => this.goTo('loading')
            }),
            loading: new LoaderScreen(find('loading'), {
                ...options,
                minDuration: this.config.loader.minDuration
            }),
            home: new HomeScreen(find('home'), { ...options, onStart: () => this.goTo('heart') }),
            heart: new HeartScreen(find('heart'), options),
            video: new VideoScreen(find('video'), { ...options, videos: this.config.videos })
        };

        Object.values(this.screens).forEach((screen) => screen.hide());
    }

    start() {
        this.preloading = this.preload();

        this.goTo(this.config.debugMode ? 'loading' : 'age');
    }

    /* ------------------------------------------------------------------ */
    /* Carga                                                               */
    /* ------------------------------------------------------------------ */

    get loadProgress() {
        return this.progress.fonts * 0.15 + this.progress.experience * 0.85;
    }

    async preload() {
        const fonts = this.loadFonts().finally(() => {
            this.progress.fonts = 1;
        });

        const experience = this.loadExperience();

        await Promise.all([fonts, experience]);
    }

    /** Source Sans 3 (Google Fonts). Si tarda demasiado, seguimos igual. */
    loadFonts() {
        if (!document.fonts?.load) return Promise.resolve();

        const weights = ['300 1em "Source Sans 3"', '400 1em "Source Sans 3"', '600 1em "Source Sans 3"', 'italic 700 1em "Source Sans 3"'];
        const loading = Promise.all(weights.map((font) => document.fonts.load(font)));
        const timeout = new Promise((resolve) => gsap.delayedCall(4, resolve));

        return Promise.race([loading, timeout]).catch(() => {});
    }

    async loadExperience() {
        if (!App.supportsWebGL()) {
            document.documentElement.classList.add('no-webgl');
            this.progress.experience = 1;

            return;
        }

        try {
            this.experience = new Experience(this.canvas, {
                modalRoot: document.querySelector('.ball-modal'),
                links: this.config.links
            });

            await this.experience.init({
                onProgress: (value) => {
                    this.progress.experience = value;
                }
            });

            document.documentElement.classList.add('is-webgl-ready');
        } catch (error) {
            document.documentElement.classList.add('is-webgl-error');
            console.error(error);
            this.experience = null;
        } finally {
            this.progress.experience = 1;
        }
    }

    /* ------------------------------------------------------------------ */
    /* Navegación entre pantallas                                         */
    /* ------------------------------------------------------------------ */

    /** Volver: desde el corazón a la home; desde el vídeo, a donde se estaba. */
    back() {
        if (this.current?.name === 'video') {
            this.goTo(this.previous === 'heart' ? 'heart' : 'home');

            return;
        }

        this.goTo('home');
    }

    async goTo(name) {
        if (this.current?.name === name || this.transitioning) return;

        this.transitioning = true;

        const previous = this.current;
        const next = this.screens[name];

        this.previous = previous?.name ?? null;

        // El footer se va a la vez que la pantalla anterior (así, al medir el
        // encuadre del corazón, ya no ocupa sitio)
        this.updateFooter(name);

        if (previous) await previous.leave();

        this.current = next;
        this.body.dataset.screen = name;

        // Visible (aún transparente) antes de medir: el encuadre del corazón
        // depende de dónde termina el copy
        next.show();
        gsap.set(next.root, { opacity: 0 });

        this.header.update(name);
        this.backdrop.update(name);
        this.updateHeart(name);

        await next.enter();

        this.transitioning = false;
        next.focusTarget?.focus({ preventScroll: true });

        // Tras la entrada (logo ya compacto), recalcular el encuadre exacto
        if (name === 'heart') this.updateSafeArea();

        if (name === 'loading') this.runLoader();
    }

    async runLoader() {
        await this.screens.loading.run(() => this.loadProgress);
        await this.preloading;

        this.goTo('home');
    }

    updateFooter(name) {
        const visible = name === 'age' || name === 'home' || name === 'video';

        this.footer.inert = !visible;

        if (visible) this.footer.hidden = false;

        gsap.to(this.footer, {
            autoAlpha: visible ? 1 : 0,
            duration: visible ? 1 : 0.4,
            delay: visible ? 0.3 : 0,
            ease: 'power2.out',
            overwrite: true,
            // Oculto de verdad: deja de ocupar sitio (más espacio para el corazón)
            onComplete: () => {
                if (!visible) this.footer.hidden = true;
            }
        });
    }

    /** El corazón solo se ve (y solo se renderiza) en su pantalla. */
    updateHeart(name) {
        const experience = this.experience;

        // Aún cargando en segundo plano (p. ej. en el selector de edad)
        if (!experience?.ready) return;

        const visible = name === 'heart';

        this.canvas.tabIndex = visible ? 0 : -1;

        if (!visible) {
            experience.setInteractive(false);
            gsap.to(this.canvas, {
                autoAlpha: 0,
                duration: 0.5,
                ease: 'power2.in',
                overwrite: true,
                onComplete: () => experience.pause()
            });

            return;
        }

        experience.resume();

        // Encuadre: el corazón ocupa todo el espacio entre cabecera y ayuda
        this.updateSafeArea();
        this.onResize ??= () => gsap.delayedCall(0.05, () => this.updateSafeArea());
        window.addEventListener('resize', this.onResize);

        gsap.to(this.canvas, { autoAlpha: 1, duration: 0.6, ease: 'power2.out', overwrite: true });

        if (!this.introPlayed) {
            this.introPlayed = true;
            experience.playIntro({ delay: 0.5 });
        } else {
            experience.setInteractive(true);
        }
    }

    updateSafeArea() {
        if (this.current?.name !== 'heart' || !this.experience) return;

        const height = window.innerHeight;
        const top = Math.min(this.header.getCompactBottom() + 8, height * 0.3);
        const bottom = Math.min(this.screens.heart.getReservedBottom() + 6, height * 0.25);

        this.experience.setSafeArea({ top, bottom });
    }

    static supportsWebGL() {
        try {
            const test = document.createElement('canvas');

            return Boolean(test.getContext('webgl2'));
        } catch {
            return false;
        }
    }
}
