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
 *
 * Sincronía línea / punto: la línea NO se dibuja con stroke-dasharray (cada
 * navegador mide el trazo a su manera: pathLength, subtrazos, Safari...).
 * El ECG es una polilínea conocida, así que en cada frame se calcula a mano
 * el punto de la cabeza y la línea visible se construye hasta ese mismo
 * punto. Línea y punto salen del mismo número: imposible que se desfasen.
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
const START_X = 4;
const END_X = 578;
const TICK = 24; // marca vertical inicial

export default class LoaderScreen extends Screen {
    constructor(root, { reducedMotion, minDuration = 2.8 }) {
        super(root, { reducedMotion });

        this.minDuration = minDuration;
        this.progressbar = root.querySelector('.loader');
        this.line = root.querySelector('.loader__line');
        this.dot = root.querySelector('.loader__dot');
        this.glow = root.querySelector('.loader__glow');
        this.value = root.querySelector('.loader__value');

        this.segments = LoaderScreen.buildSegments();
        this.length = this.segments.at(-1).end;

        this.displayed = 0;
        this.render(0);
    }

    /**
     * Tramos rectos del ECG con su longitud acumulada. `move` indica que el
     * tramo empieza un subtrazo nuevo (la marca vertical va aparte).
     */
    static buildSegments() {
        const points = [
            { x: START_X, y: BASELINE - TICK, move: true },
            { x: START_X, y: BASELINE + TICK },
            { x: START_X, y: BASELINE, move: true }
        ];

        for (const { x, beat, scale } of SEQUENCE) {
            for (const [dx, dy] of beat) {
                points.push({ x: x + dx, y: BASELINE + dy * scale });
            }
        }

        points.push({ x: END_X, y: BASELINE });

        const segments = [];
        let total = 0;

        for (let i = 1; i < points.length; i++) {
            const from = points[i - 1];
            const to = points[i];

            // Salto de subtrazo: no suma longitud (no se dibuja)
            if (to.move) continue;

            const length = Math.hypot(to.x - from.x, to.y - from.y);

            if (length === 0) continue;

            segments.push({
                from,
                to,
                start: total,
                end: total + length,
                length,
                move: Boolean(from.move) || segments.at(-1)?.to !== from
            });

            total += length;
        }

        return segments;
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

    /** Línea visible hasta `progress` y el punto exactamente en su extremo. */
    render(progress) {
        const head = this.length * progress;
        let d = '';
        let point = this.segments[0].from;

        for (const segment of this.segments) {
            if (segment.start >= head && d) break;

            if (segment.move || !d) d += `M${segment.from.x} ${segment.from.y}`;

            const t = Math.min(Math.max((head - segment.start) / segment.length, 0), 1);

            point = {
                x: segment.from.x + (segment.to.x - segment.from.x) * t,
                y: segment.from.y + (segment.to.y - segment.from.y) * t
            };

            d += `L${point.x.toFixed(2)} ${point.y.toFixed(2)}`;

            if (t < 1) break;
        }

        const percent = Math.round(progress * 100);

        this.line.setAttribute('d', d);
        this.dot.setAttribute('cx', point.x.toFixed(2));
        this.dot.setAttribute('cy', point.y.toFixed(2));
        this.glow.setAttribute('cx', point.x.toFixed(2));
        this.glow.setAttribute('cy', point.y.toFixed(2));

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
