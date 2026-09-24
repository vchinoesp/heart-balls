import BallPicker from '../world/heart/BallPicker.js';

/**
 * BallSelection
 *
 * Une controles, picking y efectos para "buscar tu corazonada":
 *  - Ratón: al pasar por encima la bola sube (hover) y sus vecinas se apartan;
 *    clic = elegir.
 *  - Táctil: al arrastrar, las bolas se apartan bajo el dedo; primer toque en
 *    una bola la destaca, segundo toque en la misma la elige (evita elegir sin
 *    querer con bolas pequeñas en pantalla).
 *  - Teclado: Enter/Espacio elige la bola del centro de la pantalla.
 *
 * El picking se hace como mucho una vez por frame (en update).
 */
export default class BallSelection {
    constructor({ camera, heartBalls, fx, element, onSelect }) {
        this.heartBalls = heartBalls;
        this.fx = fx;
        this.element = element;
        this.onSelect = onSelect;

        this.picker = new BallPicker(camera);
        this.pending = undefined;
        this.pointerType = 'mouse';
        this.armedIndex = -1;
        this.locked = false;
        this.hadPointer = false;
    }

    /** Llamado por HeartControls en cada movimiento (ndc o null). */
    hover(ndc, pointerType) {
        this.pending = ndc;
        this.pointerType = pointerType;
    }

    tap(ndc, pointerType) {
        if (this.locked) return;

        const hit = this.picker.pick(ndc.x, ndc.y, this.heartBalls);

        if (!hit) {
            this.armedIndex = -1;
            this.fx.setHover(-1);

            return;
        }

        if (pointerType === 'mouse' || hit.index === this.armedIndex) {
            this.select(hit.index);

            return;
        }

        // Táctil: primer toque destaca la bola
        this.armedIndex = hit.index;
        this.fx.setPointer(hit.point, true);
        this.fx.setHover(hit.index);
    }

    selectCenter() {
        if (this.locked) return;

        const hit = this.picker.pick(0, 0, this.heartBalls);

        if (hit) this.select(hit.index);
    }

    select(index) {
        this.locked = true;
        this.armedIndex = -1;
        this.element.style.cursor = '';
        this.fx.setRepel(false);

        const number = this.heartBalls.getNumber(index);

        this.fx.select(index).then(() => this.onSelect?.({ index, number }));
    }

    /** Tras cerrar el popup: la bola vuelve a su sitio. */
    release() {
        this.fx.restore();
        this.locked = false;
    }

    update() {
        if (this.pending === undefined || this.locked) return;

        const ndc = this.pending;

        this.pending = undefined;

        if (!ndc) {
            this.fx.setRepel(false);
            if (this.pointerType === 'mouse') this.fx.setHover(-1);
            this.element.style.cursor = '';
            this.hadPointer = false;

            return;
        }

        const hit = this.picker.pick(ndc.x, ndc.y, this.heartBalls);

        if (!hit) {
            this.fx.setRepel(false);
            if (this.pointerType === 'mouse') this.fx.setHover(-1);
            this.element.style.cursor = '';
            this.hadPointer = false;

            return;
        }

        // Al entrar al corazón el campo aparece en el punto (sin "viajar")
        this.fx.setPointer(hit.point, !this.hadPointer);
        this.fx.setRepel(true);
        this.hadPointer = true;

        if (this.pointerType === 'mouse') {
            this.fx.setHover(hit.index);
            this.element.style.cursor = 'pointer';
        }
    }
}
