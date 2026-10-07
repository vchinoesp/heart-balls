import gsap from 'gsap';

/**
 * TicketsFan
 *
 * Bodegón de décimos con "Compra tu décimo" (home). Entra como una baraja:
 * los tres décimos llegan apilados (rectos, uno encima de otro) y se abren
 * en abanico, uno tras otro (efecto escalera). Al salir de la home se
 * vuelven a recoger.
 *
 * Cada carta lleva en el HTML:
 *  - data-dx / data-dy: desplazamiento hasta el centro de la carta central,
 *    en unidades del bodegón (ancho / 175)
 *  - data-tilt: giro que deshace la inclinación del PNG (queda recta)
 * La posición final (abanico abierto) es la del CSS: al acabar se limpian
 * los transform inline para que funcione el hover.
 *
 * Se usa en la home (enlace "Compra tu décimo", con href) y en el popup de
 * la bola (decorativo, sin href, solo desktop).
 */
export default class TicketsFan {
    constructor(root, { href, reducedMotion = false } = {}) {
        this.root = root;
        this.reducedMotion = reducedMotion;
        this.stage = root.querySelector('.tickets__stage');
        this.label = root.querySelector('.tickets__label'); // no existe en el popup
        // Lo que aparece con fundido (bodegón + texto si lo hay)
        this.faded = [this.stage, this.label].filter(Boolean);
        // De la carta de atrás a la de delante: la de delante se abre la última
        this.cards = [...root.querySelectorAll('.tickets__card')];

        // Con enlace: sin URL en la config, el bodegón no se muestra
        if (href !== undefined) {
            if (href) {
                root.href = href;
            } else {
                root.hidden = true;
            }
        }
    }

    get unit() {
        return this.stage.offsetWidth / 175;
    }

    /** Posición "apilada" de cada carta (todas sobre la central, rectas). */
    stackedState(card) {
        const unit = this.unit;

        return {
            x: Number(card.dataset.dx) * unit,
            y: Number(card.dataset.dy) * unit,
            rotation: Number(card.dataset.tilt)
        };
    }

    /** No visible (oculto o con display: none, p. ej. el del popup en móvil). */
    get visible() {
        return !this.root.hidden && this.root.offsetParent !== null;
    }

    /** Entrada: aparece la baraja y se abre en abanico. */
    open({ delay = 0 } = {}) {
        this.timeline?.kill();

        if (!this.visible) return gsap.timeline();

        if (this.reducedMotion) {
            gsap.set(this.cards, { clearProps: 'transform' });

            return gsap.fromTo(this.faded, { opacity: 0 }, { opacity: 1, duration: 0.3, delay });
        }

        const fanned = this.cards.filter((card) => card.dataset.tilt !== '0');

        // Oculto hasta que empiece (la entrada va con retardo)
        gsap.set(this.faded, { opacity: 0 });

        this.timeline = gsap
            .timeline({ delay })
            // 1. La baraja (apilada) sube y aparece
            .set(this.cards, { x: 0, y: 0, rotation: 0 })
            .set(fanned, {
                x: (i, card) => this.stackedState(card).x,
                y: (i, card) => this.stackedState(card).y,
                rotation: (i, card) => this.stackedState(card).rotation
            })
            .fromTo(
                this.stage,
                { opacity: 0, y: 24, scale: 0.9 },
                { opacity: 1, y: 0, scale: 1, duration: 0.7, ease: 'power3.out' }
            )
            // 2. Se abre en abanico: primero la de atrás, luego la de delante
            .to(
                fanned,
                {
                    x: 0,
                    y: 0,
                    rotation: 0,
                    duration: 1.1,
                    ease: 'expo.out',
                    stagger: 0.14,
                    clearProps: 'transform'
                },
                0.35
            );

        if (this.label) {
            this.timeline.fromTo(
                this.label,
                { opacity: 0, y: 8 },
                { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out', clearProps: 'transform' },
                0.6
            );
        }

        return this.timeline;
    }

    /** Salida: el abanico se recoge (se llama al dejar la home). */
    close() {
        this.timeline?.kill();

        if (!this.visible || this.reducedMotion) return gsap.timeline();

        const fanned = this.cards.filter((card) => card.dataset.tilt !== '0');

        this.timeline = gsap.timeline().to(fanned, {
            x: (i, card) => this.stackedState(card).x,
            y: (i, card) => this.stackedState(card).y,
            rotation: (i, card) => this.stackedState(card).rotation,
            duration: 0.4,
            ease: 'power2.in',
            stagger: { each: 0.06, from: 'end' }
        });

        return this.timeline;
    }
}
