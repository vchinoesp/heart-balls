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
 *  - Todas las bolas se pueden elegir (también las pequeñas de relleno).
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
        this.hoverRelease = 1.15; // la bola destacada se suelta al alejarse 1.15 radios
        // Radio extra para saber si el puntero está "sobre el corazón": así las
        // costuras entre bolas no apagan la repulsión
        this.surfaceInflate = 1.35;
        // Táctil: el segundo toque confirma si cae a menos de 1.6 radios
        this.touchConfirmRadius = 1.6;
    }

    /** Llamado por HeartControls en cada movimiento (ndc o null). */
    hover(ndc, pointerType) {
        this.pointer = ndc;
        this.pointerType = pointerType;
    }

    tap(ndc, pointerType) {
        if (this.locked) return;

        let hit = this.pickHoverable(ndc);

        // Ratón: se elige la bola destacada (la que el usuario está viendo
        // resaltada), aunque el clic caiga justo en su borde
        const hovered = this.fx.hoverIndex;

        if (
            pointerType === 'mouse' &&
            hovered >= 0 &&
            this.picker.relativeDistance(hovered, this.heartBalls) < this.hoverRelease
        ) {
            this.select(hovered);

            return;
        }

        // Táctil: segundo toque sobre (o muy cerca de) la bola ya destacada =
        // elegirla. El dedo es impreciso y la bola destacada ha crecido.
        if (
            pointerType !== 'mouse' &&
            this.armedIndex >= 0 &&
            this.picker.relativeDistance(this.armedIndex, this.heartBalls) < this.touchConfirmRadius
        ) {
            this.select(this.armedIndex);

            return;
        }

        // Táctil: si el dedo cae en un hueco, la bola más cercana en reposo
        if (!hit && pointerType !== 'mouse') {
            hit = this.picker.pick(ndc.x, ndc.y, this.heartBalls, { displayed: false, inflate: 1.2 });
        }

        if (!hit) {
            this.armedIndex = -1;
            this.fx.setHover(-1);

            return;
        }

        if (pointerType === 'mouse' || hit.index === this.armedIndex) {
            this.select(hit.index);

            return;
        }

        // Táctil: primer toque destaca la bola (más exagerado que con ratón)
        this.armedIndex = hit.index;
        this.fx.setPointer(hit.point, true);
        this.fx.setHover(hit.index, { boost: this.interaction.touchHoverBoost ?? 1 });
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

    /** Estado limpio al (re)entrar en el corazón. */
    reset() {
        this.pointer = null;
        this.lastPointer = null;
        this.speed = 0;
        this.armedIndex = -1;
        this.hadPointer = false;
        this.missFrames = 0;
        this.element.style.cursor = '';
    }

    /** Tras cerrar el popup: la bola vuelve a su sitio. */
    release() {
        this.fx.restore();
        this.locked = false;
        this.hadPointer = false;
    }

    /**
     * La bola bajo el puntero en su posición de reposo, grande o pequeña.
     *
     * Debe ser en reposo: la repulsión aparta TODAS las bolas cercanas al
     * puntero, también la que está justo debajo, y solo la bola destacada
     * vuelve a su sitio (y crece). Si se buscara con las posiciones
     * desplazadas, bajo el puntero solo habría hueco y nunca se podría
     * destacar ni elegir nada. En reposo, la bola destacada queda
     * exactamente bajo el puntero: lo que se ve resaltado es lo que se elige.
     */
    pickHoverable(ndc) {
        return this.picker.pick(ndc.x, ndc.y, this.heartBalls, { displayed: false });
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

        // Posiciones en reposo (sin la repulsión): estable, sin realimentación
        const hit = this.picker.pick(this.pointer.x, this.pointer.y, this.heartBalls, {
            displayed: false,
            inflate: this.surfaceInflate
        });

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
