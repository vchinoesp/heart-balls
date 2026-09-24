import gsap from 'gsap';

import HeroBall from './HeroBall.js';

/**
 * BallModal
 *
 * Popup "Esta es tu corazonada" (markup en index.html, bloque BEM .ball-modal).
 * Accesible: role="dialog", aria-modal, foco atrapado, Esc cierra y el foco
 * vuelve al elemento que lo abrió. Animaciones de entrada/salida con GSAP.
 */
export default class BallModal {
    constructor({ root, reducedMotion = false, onClose }) {
        this.root = root;
        this.reducedMotion = reducedMotion;
        this.onClose = onClose;
        this.isOpen = false;

        this.panel = root.querySelector('.ball-modal__panel');
        this.canvas = root.querySelector('.ball-modal__canvas');
        this.shadow = root.querySelector('.ball-modal__shadow');
        this.numberText = root.querySelector('[data-ball-number]');
        this.buyLink = root.querySelector('[data-action="buy"]');

        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.handleClick = this.handleClick.bind(this);
        this.handleResize = () => this.hero?.resize();

        root.addEventListener('click', this.handleClick);
    }

    open({ number }) {
        if (this.isOpen) return;

        this.isOpen = true;
        this.number = number;
        this.returnFocus = document.activeElement;

        const formatted = HeroBall.format(number);

        this.numberText.textContent = `Tu número: ${formatted}`;
        // TODO: URL real de compra cuando la facilite el cliente
        this.buyLink.dataset.number = formatted;

        this.root.hidden = false;
        document.documentElement.classList.add('has-modal');
        document.addEventListener('keydown', this.handleKeyDown);
        window.addEventListener('resize', this.handleResize);

        // El renderer del popup se crea la primera vez que se usa
        this.hero ??= new HeroBall(this.canvas, { reducedMotion: this.reducedMotion });

        const duration = this.reducedMotion ? 0.01 : 0.6;

        gsap.fromTo(this.root, { opacity: 0 }, { opacity: 1, duration: duration * 0.7, ease: 'power2.out' });
        gsap.fromTo(
            this.panel,
            { y: 40, scale: 0.96 },
            { y: 0, scale: 1, duration, ease: 'expo.out' }
        );
        gsap.fromTo(
            this.shadow,
            { scaleX: 0.3, autoAlpha: 0 },
            { scaleX: 1, autoAlpha: 1, duration: this.reducedMotion ? 0.01 : 1.4, ease: 'expo.out', delay: duration * 0.3 }
        );

        this.hero.open(number);

        // Foco inicial en la acción principal
        this.root.querySelector('[data-action="buy"]').focus({ preventScroll: true });
    }

    close({ another = false } = {}) {
        if (!this.isOpen) return;

        this.isOpen = false;
        document.removeEventListener('keydown', this.handleKeyDown);
        window.removeEventListener('resize', this.handleResize);

        const duration = this.reducedMotion ? 0.01 : 0.4;

        gsap.to(this.panel, { y: 24, scale: 0.97, duration, ease: 'power2.in' });
        gsap.to(this.root, {
            opacity: 0,
            duration,
            ease: 'power2.in',
            onComplete: () => {
                this.root.hidden = true;
                this.hero.close();
                document.documentElement.classList.remove('has-modal');
            }
        });

        this.returnFocus?.focus?.({ preventScroll: true });
        this.onClose?.({ another });
    }

    handleClick(event) {
        const action = event.target.closest('[data-action]')?.dataset.action;

        if (action === 'close') this.close();
        if (action === 'another') this.close({ another: true });

        // Clic en el fondo oscuro (fuera del panel) = cerrar
        if (event.target === this.root) this.close();
    }

    handleKeyDown(event) {
        if (event.key === 'Escape') {
            event.preventDefault();
            this.close();

            return;
        }

        if (event.key === 'Tab') this.trapFocus(event);
    }

    trapFocus(event) {
        const focusable = [
            ...this.root.querySelectorAll('a[href], button:not([disabled])')
        ].filter((element) => element.offsetParent !== null);

        if (!focusable.length) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
        }
    }

    dispose() {
        this.root.removeEventListener('click', this.handleClick);
        document.removeEventListener('keydown', this.handleKeyDown);
        this.hero?.dispose();
    }
}
