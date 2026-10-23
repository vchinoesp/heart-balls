import appConfig from '../config/app.config.js';

export default class Debug {
    constructor() {
        const flags = appConfig.prod
            ? new Set()
            : new Set(
                  window.location.hash
                      .slice(1)
                      .split(/[&,]/)
                      .filter(Boolean)
              );

        this.active = flags.has('debug');
        this.showFps = this.active || flags.has('fps') || flags.has('stats');
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
