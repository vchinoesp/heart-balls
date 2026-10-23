import gsap from 'gsap';

export default class TicketsFan {
    constructor(root, { reducedMotion = false } = {}) {
        this.root = root;
        this.reducedMotion = reducedMotion;
        this.stage = root.querySelector('.tickets__stage');
        this.cards = [...root.querySelectorAll('.tickets__card')];
    }

    get unit() {
        return this.stage.offsetWidth / 175;
    }

    stackedState(card) {
        const unit = this.unit;

        return {
            x: Number(card.dataset.dx) * unit,
            y: Number(card.dataset.dy) * unit,
            rotation: Number(card.dataset.tilt)
        };
    }

    get visible() {
        return !this.root.hidden && this.root.offsetParent !== null;
    }

    open({ delay = 0 } = {}) {
        this.timeline?.kill();

        if (!this.visible) return gsap.timeline();

        if (this.reducedMotion) {
            gsap.set(this.cards, { clearProps: 'transform' });

            return gsap.fromTo(this.stage, { opacity: 0 }, { opacity: 1, duration: 0.3, delay });
        }

        const fanned = this.cards.filter((card) => card.dataset.tilt !== '0');

        gsap.set(this.stage, { opacity: 0 });

        this.timeline = gsap
            .timeline({ delay })
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

        return this.timeline;
    }

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
