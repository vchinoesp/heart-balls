import gsap from 'gsap';

/**
 * HeartControls
 *
 * Navegación del corazón pensada para móvil y desktop:
 *  - Arrastrar (1 dedo / ratón): girar el corazón, con inercia.
 *  - Pellizcar (2 dedos) / rueda: zoom hacia el punto señalado.
 *  - 2 dedos arrastrando: desplazar la vista cuando hay zoom.
 *  - Toque corto / clic: onTap (seleccionar bola).
 *  - Teclado (WCAG): flechas giran, +/- zoom, Enter/Espacio elige la bola central.
 *
 * Se gira el corazón (no la cámara): la luz queda fija y las caras cambian de
 * tono al girar, como en un objeto real. Todo el suavizado va con gsap.quickTo.
 */
export default class HeartControls {
    constructor({
        element,
        camera,
        target,
        heartSize,
        onTap,
        onHover,
        onKeySelect,
        reducedMotion = false
    }) {
        this.element = element;
        this.camera = camera;
        this.target = target;
        this.heartSize = heartSize;
        this.onTap = onTap;
        this.onHover = onHover;
        this.onKeySelect = onKeySelect;
        this.reducedMotion = reducedMotion;

        this.enabled = true;
        this.minRatio = 0.2;
        this.maxRotX = 0.75;

        // Valores objetivo (los reales se interpolan hacia ellos)
        this.state = { rotX: 0, rotY: 0, ratio: 1, panX: 0, panY: 0 };
        this.pointers = new Map();
        this.gesture = null;

        this.setTweens();
        this.bindEvents();
    }

    setTweens() {
        const duration = this.reducedMotion ? 0.01 : 0.9;
        const rotation = { duration, ease: 'power3.out' };
        const view = { duration: this.reducedMotion ? 0.01 : 0.7, ease: 'power3.out' };

        this.tweenRotX = gsap.quickTo(this.target.rotation, 'x', rotation);
        this.tweenRotY = gsap.quickTo(this.target.rotation, 'y', rotation);
        this.tweenRatio = gsap.quickTo(this.camera.view, 'ratio', view);
        this.tweenPanX = gsap.quickTo(this.camera.view, 'panX', view);
        this.tweenPanY = gsap.quickTo(this.camera.view, 'panY', view);
    }

    bindEvents() {
        this.handlers = {
            down: (event) => this.onPointerDown(event),
            move: (event) => this.onPointerMove(event),
            up: (event) => this.onPointerUp(event),
            leave: (event) => this.onPointerLeave(event),
            wheel: (event) => this.onWheel(event),
            key: (event) => this.onKeyDown(event)
        };

        const el = this.element;

        el.addEventListener('pointerdown', this.handlers.down);
        el.addEventListener('pointermove', this.handlers.move);
        el.addEventListener('pointerup', this.handlers.up);
        el.addEventListener('pointercancel', this.handlers.up);
        el.addEventListener('pointerleave', this.handlers.leave);
        el.addEventListener('wheel', this.handlers.wheel, { passive: false });
        el.addEventListener('keydown', this.handlers.key);
    }

    /* ------------------------------------------------------------------ */
    /* Utilidades                                                          */
    /* ------------------------------------------------------------------ */

    toNdc(clientX, clientY) {
        const rect = this.element.getBoundingClientRect();

        return {
            x: ((clientX - rect.left) / rect.width) * 2 - 1,
            y: -((clientY - rect.top) / rect.height) * 2 + 1
        };
    }

    setEnabled(enabled) {
        this.enabled = enabled;
        this.pointers.clear();
        this.gesture = null;
    }

    /* ------------------------------------------------------------------ */
    /* Puntero                                                             */
    /* ------------------------------------------------------------------ */

    onPointerDown(event) {
        if (!this.enabled) return;

        this.element.setPointerCapture(event.pointerId);
        this.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });

        if (this.pointers.size === 1) {
            this.gesture = {
                type: 'drag',
                startX: event.clientX,
                startY: event.clientY,
                lastX: event.clientX,
                lastY: event.clientY,
                lastTime: performance.now(),
                startTime: performance.now(),
                velocityX: 0,
                velocityY: 0,
                moved: false,
                pointerType: event.pointerType
            };
        } else if (this.pointers.size === 2) {
            this.startPinch();
        }

        if (event.pointerType !== 'mouse') {
            this.onHover?.(this.toNdc(event.clientX, event.clientY), event.pointerType);
        }
    }

    onPointerMove(event) {
        if (!this.enabled) return;

        const ndc = this.toNdc(event.clientX, event.clientY);

        if (!this.pointers.has(event.pointerId)) {
            // Ratón sin pulsar: solo hover
            if (event.pointerType === 'mouse') this.onHover?.(ndc, 'mouse');

            return;
        }

        this.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });

        if (this.gesture?.type === 'pinch') {
            this.updatePinch();

            return;
        }

        if (this.gesture?.type === 'drag') {
            this.updateDrag(event);
            this.onHover?.(ndc, event.pointerType);
        }
    }

    onPointerUp(event) {
        if (!this.pointers.has(event.pointerId)) return;

        this.pointers.delete(event.pointerId);

        const gesture = this.gesture;

        if (gesture?.type === 'drag') {
            const quick = performance.now() - gesture.startTime < 450;

            if (!gesture.moved && quick && event.type === 'pointerup') {
                this.onTap?.(this.toNdc(event.clientX, event.clientY), gesture.pointerType);
            } else {
                this.applyInertia(gesture);
            }
        }

        if (this.pointers.size === 1 && gesture?.type === 'pinch') {
            // Queda un dedo: continúa como arrastre sin salto
            const [pointer] = this.pointers.values();

            this.gesture = {
                type: 'drag',
                startX: pointer.x,
                startY: pointer.y,
                lastX: pointer.x,
                lastY: pointer.y,
                lastTime: performance.now(),
                startTime: 0,
                velocityX: 0,
                velocityY: 0,
                moved: true,
                pointerType: event.pointerType
            };
        } else if (this.pointers.size === 0) {
            this.gesture = null;

            if (event.pointerType !== 'mouse') this.onHover?.(null, event.pointerType);
        }
    }

    onPointerLeave(event) {
        if (event.pointerType === 'mouse' && !this.pointers.size) {
            this.onHover?.(null, 'mouse');
        }
    }

    /* ------------------------------------------------------------------ */
    /* Giro                                                                */
    /* ------------------------------------------------------------------ */

    updateDrag(event) {
        const gesture = this.gesture;
        const now = performance.now();
        const dx = event.clientX - gesture.lastX;
        const dy = event.clientY - gesture.lastY;
        const dt = Math.max(now - gesture.lastTime, 1);

        if (!gesture.moved) {
            const distance = Math.hypot(
                event.clientX - gesture.startX,
                event.clientY - gesture.startY
            );

            if (distance < 6) return;

            gesture.moved = true;
        }

        // Velocidad suavizada (px/ms) para la inercia al soltar
        gesture.velocityX = gesture.velocityX * 0.6 + (dx / dt) * 0.4;
        gesture.velocityY = gesture.velocityY * 0.6 + (dy / dt) * 0.4;
        gesture.lastX = event.clientX;
        gesture.lastY = event.clientY;
        gesture.lastTime = now;

        this.rotateBy(dx, dy);
    }

    rotateBy(dx, dy) {
        const { width, height } = this.element.getBoundingClientRect();
        // Con zoom se gira más despacio: más control para buscar una bola
        const precision = 0.35 + 0.65 * this.state.ratio;

        this.state.rotY += (dx / width) * Math.PI * 1.6 * precision;
        this.state.rotX = gsap.utils.clamp(
            -this.maxRotX,
            this.maxRotX,
            this.state.rotX + (dy / height) * Math.PI * 0.9 * precision
        );

        this.tweenRotY(this.state.rotY);
        this.tweenRotX(this.state.rotX);
    }

    applyInertia(gesture) {
        if (this.reducedMotion || !gesture?.moved) return;

        // Solo si se soltó en movimiento (flick)
        if (performance.now() - gesture.lastTime > 80) return;

        this.rotateBy(gesture.velocityX * 220, gesture.velocityY * 160);
    }

    /* ------------------------------------------------------------------ */
    /* Zoom y desplazamiento                                              */
    /* ------------------------------------------------------------------ */

    startPinch() {
        const [a, b] = [...this.pointers.values()];

        this.gesture = {
            type: 'pinch',
            startDistance: Math.hypot(a.x - b.x, a.y - b.y) || 1,
            startRatio: this.state.ratio,
            lastMid: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
        };
    }

    updatePinch() {
        const [a, b] = [...this.pointers.values()];
        const gesture = this.gesture;
        const distance = Math.hypot(a.x - b.x, a.y - b.y) || 1;
        const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };

        // Desplazamiento con dos dedos
        this.panByPixels(mid.x - gesture.lastMid.x, mid.y - gesture.lastMid.y);
        gesture.lastMid = mid;

        const ratio = gesture.startRatio * (gesture.startDistance / distance);

        this.zoomTo(ratio, this.toNdc(mid.x, mid.y));
    }

    onWheel(event) {
        if (!this.enabled) return;

        event.preventDefault();

        const ndc = this.toNdc(event.clientX, event.clientY);
        const factor = Math.exp(gsap.utils.clamp(-60, 60, event.deltaY) * 0.004);

        this.zoomTo(this.state.ratio * factor, ndc);
    }

    /** Zoom manteniendo fijo el punto bajo el puntero (zoom "hacia" ahí). */
    zoomTo(ratio, ndc = { x: 0, y: -(this.camera.ndcShiftY ?? 0) }) {
        const next = gsap.utils.clamp(this.minRatio, 1, ratio);
        const current = this.camera.halfExtents(this.state.ratio);
        const after = this.camera.halfExtents(next);

        // ndc de pantalla -> ndc de la vista (la cámara puede estar desplazada)
        const viewY = ndc.y + (this.camera.ndcShiftY ?? 0);
        const pointX = this.state.panX + ndc.x * current.halfWidth;
        const pointY = this.state.panY + viewY * current.halfHeight;

        this.state.ratio = next;
        this.state.panX = pointX - ndc.x * after.halfWidth;
        this.state.panY = pointY - viewY * after.halfHeight;

        this.clampPan();
        this.tweenRatio(this.state.ratio);
        this.tweenPanX(this.state.panX);
        this.tweenPanY(this.state.panY);
    }

    panByPixels(dx, dy) {
        const { width, height } = this.element.getBoundingClientRect();
        const { halfWidth, halfHeight } = this.camera.halfExtents(this.state.ratio);

        this.state.panX -= (dx / width) * halfWidth * 2;
        this.state.panY += (dy / height) * halfHeight * 2;

        this.clampPan();
        this.tweenPanX(this.state.panX);
        this.tweenPanY(this.state.panY);
    }

    /** Sin zoom no hay desplazamiento; con zoom, como mucho hasta el borde del corazón. */
    clampPan() {
        const freedom = 1 - this.state.ratio;
        const maxX = this.heartSize.width * 0.5 * freedom * 1.15;
        const maxY = this.heartSize.height * 0.5 * freedom * 1.15;

        this.state.panX = gsap.utils.clamp(-maxX, maxX, this.state.panX);
        this.state.panY = gsap.utils.clamp(-maxY, maxY, this.state.panY);
    }

    /* ------------------------------------------------------------------ */
    /* Teclado                                                             */
    /* ------------------------------------------------------------------ */

    onKeyDown(event) {
        if (!this.enabled) return;

        const { width, height } = this.element.getBoundingClientRect();
        const stepX = width * 0.08;
        const stepY = height * 0.08;

        switch (event.key) {
            case 'ArrowLeft':
                this.rotateBy(-stepX, 0);
                break;
            case 'ArrowRight':
                this.rotateBy(stepX, 0);
                break;
            case 'ArrowUp':
                this.rotateBy(0, -stepY);
                break;
            case 'ArrowDown':
                this.rotateBy(0, stepY);
                break;
            case '+':
            case '=':
                this.zoomTo(this.state.ratio * 0.8);
                break;
            case '-':
            case '_':
                this.zoomTo(this.state.ratio * 1.25);
                break;
            case 'Enter':
            case ' ':
                this.onKeySelect?.();
                break;
            default:
                return;
        }

        event.preventDefault();
    }

    /** Vuelve a la vista inicial (p. ej. botón "centrar"). */
    reset({ immediate = false } = {}) {
        Object.assign(this.state, { rotX: 0, rotY: 0, ratio: 1, panX: 0, panY: 0 });
        this.pointers.clear();
        this.gesture = null;

        // quickTo(valor, inicio): con inicio = valor el cambio es instantáneo
        const start = (value) => (immediate ? value : undefined);

        this.tweenRotX(0, start(0));
        this.tweenRotY(0, start(0));
        this.tweenRatio(1, start(1));
        this.tweenPanX(0, start(0));
        this.tweenPanY(0, start(0));
    }

    dispose() {
        const el = this.element;

        el.removeEventListener('pointerdown', this.handlers.down);
        el.removeEventListener('pointermove', this.handlers.move);
        el.removeEventListener('pointerup', this.handlers.up);
        el.removeEventListener('pointercancel', this.handlers.up);
        el.removeEventListener('pointerleave', this.handlers.leave);
        el.removeEventListener('wheel', this.handlers.wheel);
        el.removeEventListener('keydown', this.handlers.key);

        gsap.killTweensOf([this.target.rotation, this.camera.view]);
    }
}
