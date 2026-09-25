import gsap from 'gsap';

/**
 * Header
 *
 * Cabecera común: logo Lotería Nacional, logo del sorteo (h1) y acciones:
 *  - home  -> "Ver el anuncio"
 *  - heart -> "Ver el anuncio" + "Volver" debajo; el logo del sorteo se
 *             hace pequeño para dejar sitio al corazón
 *  - video -> "Volver"
 *  - resto -> sin acciones
 */
export default class Header {
    constructor(root, { reducedMotion = false, onWatch, onBack }) {
        this.root = root;
        this.reducedMotion = reducedMotion;

        this.brand = root.querySelector('.site-header__brand');
        this.title = root.querySelector('.site-header__title');
        this.actions = root.querySelector('.site-header__actions');
        this.watch = root.querySelector('.site-header__watch');
        this.back = root.querySelector('.site-header__back');

        this.watch.addEventListener('click', () => onWatch?.());
        this.back.addEventListener('click', () => onBack?.());

        gsap.set([this.brand, this.title], { opacity: 0 });
        gsap.set(this.title, { transformOrigin: '50% 0%' });
        this.setAction(this.watch, false, true);
        this.setAction(this.back, false, true);

        this.revealed = false;
        this.compact = false;
    }

    /** Escala del logo del sorteo en la pantalla del corazón. */
    get compactScale() {
        return window.innerWidth < 768 ? 0.62 : 0.48;
    }

    /** Entrada inicial de los logos (una sola vez). */
    reveal() {
        if (this.revealed) return;

        this.revealed = true;

        gsap.fromTo(
            [this.title, this.brand],
            { opacity: 0, y: this.reducedMotion ? 0 : -18 },
            { opacity: 1, y: 0, duration: 1.4, ease: 'expo.out', stagger: 0.15 }
        );
    }

    update(screen) {
        this.reveal();
        this.setAction(this.watch, screen === 'home' || screen === 'heart');
        this.setAction(this.back, screen === 'heart' || screen === 'video');
        this.actions.dataset.layout = screen === 'video' ? 'back-only' : 'default';
        this.setCompact(screen === 'heart');
    }

    setCompact(compact) {
        if (compact === this.compact) return;

        this.compact = compact;

        gsap.to(this.title, {
            scale: compact ? this.compactScale : 1,
            duration: this.reducedMotion ? 0.01 : 1.1,
            ease: 'expo.inOut',
            overwrite: 'auto'
        });
    }

    /**
     * Parte inferior (px) de la cabecera en modo compacto: tope del corazón.
     * En pantallas anchas los botones de la derecha quedan fuera del corazón,
     * así que solo cuentan los logos; en móvil cuenta todo.
     */
    getCompactBottom() {
        const titleTop = this.title.offsetTop;
        const titleBottom = titleTop + this.title.offsetHeight * this.compactScale;
        const brandBottom = this.brand.getBoundingClientRect().bottom;
        const wide = window.innerWidth / window.innerHeight > 1.2;
        const actionsBottom = wide ? 0 : this.actions.getBoundingClientRect().bottom;

        return Math.max(titleBottom, brandBottom, actionsBottom);
    }

    setAction(element, visible, immediate = false) {
        element.inert = !visible;

        gsap.to(element, {
            autoAlpha: visible ? 1 : 0,
            x: visible || this.reducedMotion ? 0 : 12,
            duration: immediate ? 0 : visible ? 0.9 : 0.35,
            delay: visible && !immediate ? 0.35 : 0,
            ease: visible ? 'expo.out' : 'power2.in',
            overwrite: true
        });
    }
}
