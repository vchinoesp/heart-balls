import gsap from 'gsap';

import Screen from './Screen.js';
import SvgDraw from '../ui/SvgDraw.js';
import TicketsFan from '../ui/TicketsFan.js';

/**
 * HomeScreen
 *
 * Portada: rótulo "Esta Navidad tengo una corazonada" (SVG que se pinta
 * trazo a trazo), copy y CTA "Elige el tuyo y mucha suerte", que lleva a la
 * pantalla del corazón (HeartScreen). El texto cambia según el dispositivo
 * (ratón / táctil) desde el CSS.
 */
export default class HomeScreen extends Screen {
    constructor(root, { onStart, ticketsHref, ...options }) {
        super(root, options);

        this.intro = root.querySelector('.intro');
        this.title = root.querySelector('.intro__title');
        this.cta = root.querySelector('[data-action="start"]');
        this.titleDraw = new SvgDraw(root.querySelector('.intro__title-art'), {
            reducedMotion: this.reducedMotion
        });

        this.tickets = new TicketsFan(root.querySelector('.tickets'), {
            href: ticketsHref,
            reducedMotion: this.reducedMotion
        });

        this.cta.addEventListener('click', () => onStart?.());
    }

    get animated() {
        // Solo los elementos visibles (el texto de la otra variante está oculto)
        return [...this.intro.children].filter(
            (element) => element !== this.title && element.offsetParent !== null
        );
    }

    /**
     * El rótulo se pinta (≈2.6 s) y el texto y el CTA entran mientras tanto.
     * La promesa que espera App es la del texto: el CTA se puede pulsar sin
     * esperar a que termine el dibujo.
     */
    enter() {
        this.show();

        const timeline = gsap.timeline();

        timeline.set(this.root, { opacity: 1 });
        timeline.set(this.title, { opacity: 1 });

        if (this.reducedMotion) {
            this.titleDraw.showFinal();
            this.tickets.open();
            timeline.fromTo(this.animated, { opacity: 0 }, { opacity: 1, duration: 0.3 });

            return timeline;
        }

        this.titleDraw.play({ delay: 0.1 });
        // El bodegón se abre en abanico mientras entra el texto (no se espera)
        this.tickets.open({ delay: 0.9 });

        timeline.fromTo(
            this.animated,
            { opacity: 0, y: 28 },
            // clearProps: sin transform inline al acabar (si no, anula los :hover)
            { opacity: 1, y: 0, duration: 1.1, ease: 'expo.out', stagger: 0.1, clearProps: 'transform' },
            0.45
        );

        return timeline;
    }

    leave() {
        this.tickets.close();

        const timeline = super.leave();

        timeline.eventCallback('onComplete', () => {
            this.titleDraw.stop();
            this.hide();
        });

        return timeline;
    }
}
