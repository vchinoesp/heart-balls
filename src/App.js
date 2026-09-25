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

    /**
     * Cambio de pantalla en dos fases, sin solapes:
     *  1. Salida: la pantalla actual, los botones de la cabecera que cambian,
     *     el footer (si se va) y el corazón (si se va) desaparecen a la vez.
     *  2. Entrada: con todo lo anterior ya fuera, se recoloca la cabecera
     *     (logo grande/pequeño, botones), entra el footer y la nueva pantalla.
     */
    async goTo(name) {
        if (this.current?.name === name || this.transitioning) return;

        this.transitioning = true;

        const previous = this.current;
        const next = this.screens[name];

        this.previous = previous?.name ?? null;

        // Fase 1: salida
        await Promise.all([
            previous?.leave(),
            this.header.hide(name),
            this.hideFooter(name),
            this.hideHeart(name)
        ]);

        // Fase 2: entrada
        this.current = next;
        this.body.dataset.screen = name;

        // Visible (aún transparente) antes de medir: el encuadre del corazón
        // depende de dónde quedan la cabecera y la ayuda
        next.show();
        gsap.set(next.root, { opacity: 0 });

        this.header.show(name);
        this.backdrop.update(name);
        this.showFooter(name);
        this.showHeart(name);

        await next.enter();

        this.transitioning = false;
        next.focusTarget?.focus({ preventScroll: true });

        if (name === 'loading') this.runLoader();
    }

    async runLoader() {
        await this.screens.loading.run(() => this.loadProgress);
        await this.preloading;

        this.goTo('home');
    }

    footerVisibleOn(name) {
        return name === 'age' || name === 'home' || name === 'video';
    }

    /** El footer se va (y deja de ocupar sitio) antes de que entre la pantalla. */
    hideFooter(name) {
        if (this.footerVisibleOn(name) || this.footer.hidden) return null;

        this.footer.inert = true;

        return gsap
            .to(this.footer, {
                autoAlpha: 0,
                duration: 0.4,
                ease: 'power2.in',
                overwrite: true,
                onComplete: () => {
                    this.footer.hidden = true;
                }
            })
            .then();
    }

    showFooter(name) {
        if (!this.footerVisibleOn(name)) return;

        const wasHidden = this.footer.hidden;

        this.footer.hidden = false;
        this.footer.inert = false;

        if (!wasHidden && gsap.getProperty(this.footer, 'opacity') === 1) return;

        gsap.fromTo(
            this.footer,
            { autoAlpha: 0, y: this.reducedMotion ? 0 : 16 },
            { autoAlpha: 1, y: 0, duration: 1, delay: 0.2, ease: 'expo.out', overwrite: true, clearProps: 'transform' }
        );
    }

    /** Salida del corazón: se funde y deja de renderizarse. */
    hideHeart(name) {
        const experience = this.experience;

        if (!experience?.ready || name === 'heart' || this.current?.name !== 'heart') return null;

        this.canvas.tabIndex = -1;
        experience.setInteractive(false);

        return gsap
            .to(this.canvas, {
                autoAlpha: 0,
                duration: 0.5,
                ease: 'power2.in',
                overwrite: true,
                onComplete: () => experience.pause()
            })
            .then();
    }

    /**
     * Entrada al corazón: siempre igual que la primera vez (vista inicial,
     * sin zoom ni giro) y con la animación de generación.
     */
    showHeart(name) {
        const experience = this.experience;

        // Aún cargando en segundo plano (p. ej. en el selector de edad)
        if (!experience?.ready || name !== 'heart') return;

        this.canvas.tabIndex = 0;

        experience.resetView();
        experience.resume();

        // Encuadre: el corazón ocupa todo el espacio entre cabecera y ayuda
        this.updateSafeArea();
        this.onResize ??= () => gsap.delayedCall(0.05, () => this.updateSafeArea());
        window.addEventListener('resize', this.onResize);

        gsap.to(this.canvas, { autoAlpha: 1, duration: 0.6, ease: 'power2.out', overwrite: true });

        experience.playIntro({ delay: 0.35 });
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
