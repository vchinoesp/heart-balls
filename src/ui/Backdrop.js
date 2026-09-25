import gsap from 'gsap';
import SeededRandom from '../utils/SeededRandom.js';

/**
 * Backdrop
 *
 * Fondo en CSS: degradado azul noche + luz de suelo + bokeh (círculos
 * desenfocados como en la creatividad de la home). Sin imágenes ni WebGL.
 * El bokeh deriva muy despacio (GSAP) salvo con prefers-reduced-motion.
 */
export default class Backdrop {
    constructor(root, { reducedMotion = false, count = 34 } = {}) {
        this.root = root;
        this.bokeh = root.querySelector('.backdrop__bokeh');
        this.reducedMotion = reducedMotion;

        this.createBokeh(count);
        gsap.set(this.bokeh, { opacity: 0 });
    }

    createBokeh(count) {
        const random = new SeededRandom(2026);
        const fragment = document.createDocumentFragment();

        for (let i = 0; i < count; i++) {
            const dot = document.createElement('span');
            const size = random.range(28, 90);

            dot.className = 'backdrop__dot';
            dot.style.width = `${size}px`;
            dot.style.height = `${size}px`;
            dot.style.left = `${random.range(-5, 100)}%`;
            dot.style.top = `${random.range(-5, 95)}%`;
            dot.style.opacity = random.range(0.04, 0.13).toFixed(3);

            fragment.append(dot);

            if (!this.reducedMotion) {
                gsap.to(dot, {
                    x: random.range(-40, 40),
                    y: random.range(-30, 30),
                    duration: random.range(9, 16),
                    ease: 'sine.inOut',
                    yoyo: true,
                    repeat: -1
                });
            }
        }

        this.bokeh.append(fragment);
    }

    /** El bokeh acompaña a la home y al corazón. */
    update(screen) {
        gsap.to(this.bokeh, {
            opacity: screen === 'home' || screen === 'heart' ? 1 : 0,
            duration: 1.6,
            ease: 'power2.inOut',
            overwrite: true
        });
    }
}
