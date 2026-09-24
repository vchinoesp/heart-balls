import gsap from 'gsap';

/**
 * Header
 *
 * Cabecera común: logo Lotería Nacional, logo del sorteo (h1) y acción
 * contextual a la derecha:
 *  - home  -> "Ver el anuncio"
 *  - video -> "< Volver"
 *  - resto -> nada
 */
export default class Header {
    constructor(root, { reducedMotion = false, onWatch, onBack }) {
        this.root = root;
        this.reducedMotion = reducedMotion;

        this.brand = root.querySelector('.site-header__brand');
        this.title = root.querySelector('.site-header__title');
        this.watch = root.querySelector('.site-header__watch');
        this.back = root.querySelector('.site-header__back');

        this.watch.addEventListener('click', () => onWatch?.());
        this.back.addEventListener('click', () => onBack?.());

        gsap.set([this.brand, this.title], { opacity: 0 });
        this.setAction(this.watch, false, true);
        this.setAction(this.back, false, true);

        this.revealed = false;
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
        this.setAction(this.watch, screen === 'home');
        this.setAction(this.back, screen === 'video');
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
