import gsap from 'gsap';

import Screen from './Screen.js';

/**
 * LoaderScreen
 *
 * Electrocardiograma que se dibuja de izquierda a derecha mientras carga el
 * corazón, con un punto luminoso en la cabeza de la línea y el porcentaje.
 *
 * El porcentaje refleja la carga real (fuentes + datos + WebGL) pero nunca
 * va más rápido que `minDuration`: la animación siempre se ve completa.
 */
const BASELINE = 80;

// Latido grande y latido pequeño (puntos relativos: x, desplazamiento en y)
const BIG_BEAT = [
    [0, 0], [5, -14], [8, 0], [11, 12], [15, -72], [20, 74], [24, -6], [28, 8], [32, 0]
];
const SMALL_BEAT = [
    [0, 0], [5, -8], [8, 6], [12, -32], [16, 34], [20, -7], [24, 6], [28, 0]
];
const SEQUENCE = [
    { x: 58, beat: BIG_BEAT, scale: 1 },
    { x: 190, beat: SMALL_BEAT, scale: 1 },
    { x: 330, beat: BIG_BEAT, scale: 1 },
    { x: 468, beat: SMALL_BEAT, scale: 1 }
];
const END_X = 578;

export default class LoaderScreen extends Screen {
    constructor(root, { reducedMotion, minDuration = 2.8 }) {
        super(root, { reducedMotion });

        this.minDuration = minDuration;
        this.progressbar = root.querySelector('.loader');
        this.line = root.querySelector('.loader__line');
        this.dot = root.querySelector('.loader__dot');
        this.glow = root.querySelector('.loader__glow');
        this.value = root.querySelector('.loader__value');

        this.line.setAttribute('d', LoaderScreen.buildPath());
        this.length = this.line.getTotalLength();

        // pathLength = 1: el trazo visible y el punto usan exactamente la misma
        // medida (evita que el punto quede por detrás de la línea)
        this.line.setAttribute('pathLength', '1');
        this.line.style.strokeDasharray = '1 1';
        this.line.style.strokeDashoffset = '1';

        this.displayed = 0;
    }

    static buildPath() {
        // Marca vertical inicial + línea base con latidos
        let d = `M4 ${BASELINE - 24} L4 ${BASELINE + 24} M4 ${BASELINE}`;

        for (const { x, beat, scale } of SEQUENCE) {
            for (const [dx, dy] of beat) {
                d += ` L${x + dx} ${BASELINE + dy * scale}`;
            }
        }

        return `${d} L${END_X} ${BASELINE}`;
    }

    get animated() {
        return [this.progressbar];
    }

    /**
     * Arranca la animación. `getProgress` devuelve la carga real (0..1).
     * Resuelve cuando el ECG llega al 100 % y la carga ha terminado.
     */
    run(getProgress) {
        const start = performance.now();

        this.glowTween = gsap.to(this.glow, {
            attr: { r: 24 },
            opacity: 0.55,
            duration: 0.5,
            ease: 'sine.inOut',
            yoyo: true,
            repeat: -1
        });

        return new Promise((resolve) => {
            const tick = () => {
                const elapsed = (performance.now() - start) / 1000;
                const timeLimit = this.reducedMotion ? 1 : Math.min(elapsed / this.minDuration, 1);
                const target = Math.min(getProgress(), timeLimit);

                // Suavizado: la línea nunca da saltos aunque la carga sí los dé
                this.displayed += (target - this.displayed) * 0.12;

                if (target >= 1 && this.displayed > 0.995) this.displayed = 1;

                this.render(this.displayed);

                if (this.displayed >= 1) {
                    gsap.ticker.remove(tick);
                    this.finish().then(resolve);
                }
            };

            gsap.ticker.add(tick);
        });
    }

    render(progress) {
        const length = this.length * progress;
        const point = this.line.getPointAtLength(length);
        const percent = Math.round(progress * 100);

        this.line.style.strokeDashoffset = `${1 - progress}`;
        this.dot.setAttribute('cx', point.x);
        this.dot.setAttribute('cy', point.y);
        this.glow.setAttribute('cx', point.x);
        this.glow.setAttribute('cy', point.y);

        if (percent !== this.lastPercent) {
            this.lastPercent = percent;
            this.value.textContent = percent;
            this.progressbar.setAttribute('aria-valuenow', percent);
        }
    }

    /** Último "latido" del punto antes de pasar a la home. */
    finish() {
        this.glowTween?.kill();

        return gsap
            .timeline()
            .to(this.glow, { attr: { r: 40 }, opacity: 0.9, duration: 0.35, ease: 'power2.out' })
            .to(this.glow, { attr: { r: 18 }, opacity: 0.35, duration: 0.5, ease: 'power2.inOut' })
            .then();
    }
}
