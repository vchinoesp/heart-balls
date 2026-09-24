/**
 * Debug
 *
 * Se controla con el hash de la URL (se pueden combinar con & o ,):
 *   #debug      -> panel lil-gui + controles + contador de FPS
 *   #fps        -> solo el contador de FPS (ideal para probar en móvil)
 *   #debug&fps  -> ambos
 *
 * lil-gui se importa dinámicamente: nunca se descarga sin #debug.
 */
export default class Debug {
    constructor() {
        const flags = new Set(
            window.location.hash
                .slice(1)
                .split(/[&,]/)
                .filter(Boolean)
        );

        this.active = flags.has('debug');
        this.showFps = this.active || flags.has('fps');
        this.gui = null;
    }

    async init() {
        if (!this.active) return;

        const { default: GUI } = await import('lil-gui');

        this.gui = new GUI({ width: 320, title: 'Heart Balls · debug' });
        this.gui.close();
    }

    dispose() {
        this.gui?.destroy();
    }
}
