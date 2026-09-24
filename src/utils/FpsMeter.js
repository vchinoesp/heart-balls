/**
 * FpsMeter
 *
 * Contador de FPS ligero para probar en móvil: añade #fps a la URL
 * (también aparece con #debug). Media cada 500 ms + peor frame del periodo.
 */
export default class FpsMeter {
    constructor({ renderer } = {}) {
        this.renderer = renderer;
        this.frames = 0;
        this.worst = 0;
        this.last = performance.now();
        this.previous = this.last;

        this.element = document.createElement('div');
        this.element.className = 'fps-meter';
        this.element.setAttribute('aria-hidden', 'true');
        document.body.append(this.element);
    }

    update() {
        const now = performance.now();

        this.worst = Math.max(this.worst, now - this.previous);
        this.previous = now;
        this.frames++;

        const elapsed = now - this.last;

        if (elapsed < 500) return;

        const fps = Math.round((this.frames * 1000) / elapsed);
        const info = this.renderer?.info.render;
        const dpr = Math.min(window.devicePixelRatio, 2);

        this.element.textContent =
            `${fps} fps · peor ${Math.round(this.worst)} ms` +
            (info ? ` · ${info.calls} draws · ${Math.round(info.triangles / 1000)}k tris` : '') +
            ` · dpr ${dpr}`;

        this.element.dataset.level = fps >= 55 ? 'good' : fps >= 40 ? 'ok' : 'bad';

        this.frames = 0;
        this.worst = 0;
        this.last = now;
    }

    dispose() {
        this.element.remove();
    }
}
