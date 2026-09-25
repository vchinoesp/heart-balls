import gsap from 'gsap';

/**
 * Screen
 *
 * Base de cada pantalla de la one-page. Una pantalla es una <section
 * data-screen> que se muestra/oculta con `hidden` + `inert` y anima la
 * entrada/salida de sus elementos [data-animate] con GSAP.
 *
 * Las subclases pueden sobrescribir onEnter/onLeave o las timelines.
 */
export default class Screen {
    constructor(root, { reducedMotion = false } = {}) {
        this.root = root;
        this.reducedMotion = reducedMotion;
        this.name = root.dataset.screen;
    }

    get animated() {
        return [...this.root.querySelectorAll('[data-animate]')];
    }

    /** Elemento que recibe el foco al entrar (accesibilidad). */
    get focusTarget() {
        return this.root.querySelector('[tabindex="-1"]');
    }

    show() {
        this.root.hidden = false;
        this.root.inert = false;
    }

    hide() {
        this.root.hidden = true;
        this.root.inert = true;
    }

    enter() {
        this.show();
        this.onEnter?.();

        const timeline = gsap.timeline();

        if (this.reducedMotion) {
            timeline.fromTo(this.root, { opacity: 0 }, { opacity: 1, duration: 0.3 });

            return timeline;
        }

        timeline.set(this.root, { opacity: 1 });

        if (this.animated.length) {
            timeline.fromTo(
                this.animated,
                { opacity: 0, y: 28 },
                // clearProps: sin transform inline al acabar (si no, anula los :hover)
                { opacity: 1, y: 0, duration: 1.1, ease: 'expo.out', stagger: 0.09, clearProps: 'transform' }
            );
        }

        return timeline;
    }

    leave() {
        this.root.inert = true;
        this.onLeave?.();

        const timeline = gsap.timeline({ onComplete: () => this.hide() });

        timeline.to(this.root, {
            opacity: 0,
            y: this.reducedMotion ? 0 : -12,
            duration: this.reducedMotion ? 0.2 : 0.45,
            ease: 'power2.in'
        });
        timeline.set(this.root, { y: 0 });

        return timeline;
    }
}
