import gsap from 'gsap';

export default class SvgDraw {
    constructor(svg, { reducedMotion = false, strokeWidth = 0.7, finalStrokeWidth = 0.25 } = {}) {
        this.svg = svg;
        this.reducedMotion = reducedMotion;
        this.strokeWidth = strokeWidth;
        this.finalStrokeWidth = finalStrokeWidth;
        this.paths = [...svg.querySelectorAll('path')];
        this.lengths = null;
    }

    measure() {
        this.lengths ??= this.paths.map((path) => Math.ceil(path.getTotalLength()) + 1);
    }

    reset() {
        this.timeline?.kill();

        if (this.reducedMotion) {
            this.showFinal();

            return;
        }

        this.measure();

        this.paths.forEach((path, index) => {
            const length = this.lengths[index];

            gsap.set(path, {
                strokeDasharray: `${length} ${length}`,
                strokeDashoffset: length,
                strokeWidth: this.strokeWidth,
                fillOpacity: 0
            });
        });
    }

    showFinal() {
        this.timeline?.kill();
        gsap.set(this.paths, {
            strokeDasharray: 'none',
            strokeDashoffset: 0,
            strokeWidth: this.finalStrokeWidth,
            fillOpacity: 1
        });
    }

    play({ delay = 0, duration = 2.6 } = {}) {
        this.reset();

        if (this.reducedMotion) return gsap.timeline();

        const count = this.paths.length;
        const draw = duration * 0.55;
        const stagger = (duration - draw - 0.6) / Math.max(count - 1, 1);

        this.timeline = gsap
            .timeline({ delay, onComplete: () => this.showFinal() })
            .to(this.paths, {
                strokeDashoffset: 0,
                duration: draw,
                ease: 'power2.inOut',
                stagger
            })
            .to(
                this.paths,
                {
                    fillOpacity: 1,
                    strokeWidth: this.finalStrokeWidth,
                    duration: 0.8,
                    ease: 'power2.out',
                    stagger
                },
                draw * 0.6
            );

        return this.timeline;
    }

    stop() {
        this.timeline?.kill();
    }
}
