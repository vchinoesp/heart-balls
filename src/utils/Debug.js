/**
 * Debug
 *
 * Solo se activa con #debug en la URL (p. ej. http://localhost:5173/#debug).
 * lil-gui se importa dinámicamente: no entra en el bundle de producción
 * salvo como chunk separado que nunca se descarga sin #debug.
 */
export default class Debug {
    constructor() {
        this.active = window.location.hash === '#debug';
        this.gui = null;
    }

    async init() {
        if (!this.active) return;

        const { default: GUI } = await import('lil-gui');

        this.gui = new GUI({ width: 320, title: 'Heart Balls · debug' });
    }

    dispose() {
        this.gui?.destroy();
    }
}
