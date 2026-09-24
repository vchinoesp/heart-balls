import BallPicker from '../world/heart/BallPicker.js';

/**
 * BallSelection
 *
 * Une controles, picking y efectos para "buscar tu corazonada":
 *  - Ratón: el campo de repulsión sigue al puntero de forma suave; la bola
 *    bajo el puntero se destaca solo cuando el ratón va despacio o se para
 *    (al barrer rápido no "saltan" bolas). Clic = elegir.
 *  - Táctil: al arrastrar, las bolas se apartan bajo el dedo; primer toque en
 *    una bola la destaca, segundo toque en la misma la elige.
 *  - Teclado: Enter/Espacio elige la bola del centro de la pantalla.
 *
 * Anti-saltos:
 *  - El picking se hace una vez por frame con la última posición conocida
 *    (también si el corazón sigue girando por inercia con el ratón quieto).
 *  - Pasar por un hueco entre bolas no apaga la repulsión (tolerancia de frames).
 *  - Histéresis: la bola destacada se mantiene mientras el puntero siga cerca
 *    de ella, aunque el rayo toque ya a una vecina.
 *  - Las bolitas de relleno no se destacan (solo las de tamaño normal).
 */
export default class BallSelection {
    constructor({ camera, heartBalls, fx, element, interaction, onSelect, getCenterNdc }) {
        this.heartBalls = heartBalls;
        this.fx = fx;
        this.element = element;
        this.interaction = interaction;
        this.onSelect = onSelect;
        // Centro visual del corazón en pantalla (la cámara puede estar desplazada)
        this.getCenterNdc = getCenterNdc ?? (() => ({ x: 0, y: 0 }));

        this.picker = new BallPicker(camera);

        this.pointer = null; // última posición ndc conocida
        this.pointerType = 'mouse';
        this.lastPointer = null;
        this.lastTime = performance.now();
        this.speed = 0;

        this.armedIndex = -1;
        this.locked = false;
        this.hadPointer = false;
        this.missFrames = 0;

        this.maxMissFrames = 10;
        this.hoverRelease = 1.25; // la bola destacada se suelta al alejarse 1.25 radios
    }

    /** Llamado por HeartControls en cada movimiento (ndc o null). */
    hover(ndc, pointerType) {
        this.pointer = ndc;
        this.pointerType = pointerType;
    }

    tap(ndc, pointerType) {
        if (this.locked) return;

        const hit = this.pickHoverable(ndc);

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

        const hit = this.pickHoverable(this.getCenterNdc());

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
        this.hadPointer = false;
    }

    /** Primero cualquier bola; si es una bolita de relleno, la normal más cercana tras ella. */
    pickHoverable(ndc) {
        const minRadius = this.heartBalls.referenceRadius * 0.55;
        const hit = this.picker.pick(ndc.x, ndc.y, this.heartBalls);

        if (!hit || this.heartBalls.radii[hit.index] >= minRadius) return hit;

        return this.picker.pick(ndc.x, ndc.y, this.heartBalls, { minRadius }) ?? hit;
    }

    updateSpeed() {
        const now = performance.now();
        const dt = Math.max(now - this.lastTime, 1) / 1000;

        if (this.pointer && this.lastPointer) {
            // ndc va de -1 a 1: /2 para tener "pantallas por segundo"
            const distance =
                Math.hypot(this.pointer.x - this.lastPointer.x, this.pointer.y - this.lastPointer.y) / 2;
            const instant = distance / dt;

            // Suavizado exponencial para no reaccionar a un solo frame
            this.speed = this.speed * 0.75 + instant * 0.25;
        } else {
            this.speed = 0;
        }

        this.lastPointer = this.pointer ? { ...this.pointer } : null;
        this.lastTime = now;
    }

    leave() {
        this.fx.setRepel(false);

        if (this.pointerType === 'mouse') this.fx.setHover(-1);

        this.element.style.cursor = '';
        this.hadPointer = false;
        this.missFrames = 0;
    }

    update() {
        if (this.locked) return;

        this.updateSpeed();

        if (!this.pointer) {
            if (this.hadPointer) this.leave();

            return;
        }

        const hit = this.picker.pick(this.pointer.x, this.pointer.y, this.heartBalls);

        if (!hit) {
            // Hueco entre bolas o borde: margen antes de apagar el efecto
            this.missFrames++;
            if (this.missFrames > this.maxMissFrames && this.hadPointer) this.leave();

            return;
        }

        this.missFrames = 0;

        // Al entrar al corazón el campo aparece en el punto (sin "viajar")
        this.fx.setPointer(hit.point, !this.hadPointer);
        this.fx.setRepel(true);
        this.hadPointer = true;

        if (this.pointerType === 'mouse') {
            this.element.style.cursor = 'pointer';
            this.updateMouseHover();
        }
    }

    updateMouseHover() {
        const current = this.fx.hoverIndex;
        const tooFast = this.speed > this.interaction.hoverMaxSpeed;

        // Histéresis: mantener la bola actual mientras el puntero siga cerca
        if (current >= 0) {
            const distance = this.picker.relativeDistance(current, this.heartBalls);

            if (distance < this.hoverRelease) return;
            if (tooFast) {
                this.fx.setHover(-1);

                return;
            }
        }

        if (tooFast) return;

        const hit = this.pickHoverable(this.pointer);

        this.fx.setHover(hit ? hit.index : -1);
    }
}
