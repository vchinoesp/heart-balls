import Screen from './Screen.js';

/**
 * HeartScreen
 *
 * Pantalla del corazón a tamaño grande: sin copy ni footer, con la ayuda
 * de navegación abajo (distinta para ratón y táctil). El corazón (WebGL) lo
 * gestiona Experience; aquí solo se mide cuánto ocupa la ayuda para que la
 * cámara encuadre el corazón en el espacio libre.
 */
export default class HeartScreen extends Screen {
    constructor(root, options) {
        super(root, options);

        this.help = root.querySelector('.heart-help');
    }

    get animated() {
        return [this.help];
    }

    /** No hay título visible: el foco va al propio corazón (canvas). */
    get focusTarget() {
        return document.querySelector('.webgl');
    }

    /** Alto reservado abajo (px) para la ayuda. */
    getReservedBottom() {
        const rect = this.help.getBoundingClientRect();

        return window.innerHeight - rect.top;
    }
}
