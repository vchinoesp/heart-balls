import Screen from './Screen.js';

/**
 * HomeScreen
 *
 * Copy de la home sobre el corazón. El corazón (WebGL) lo gestiona
 * Experience; esta pantalla solo anima el texto y mide cuánto ocupa para
 * que la cámara encuadre el corazón en el espacio libre de debajo.
 */
export default class HomeScreen extends Screen {
    constructor(root, options) {
        super(root, options);

        this.intro = root.querySelector('.intro');
    }

    get animated() {
        return [...this.intro.children].filter((element) => !element.classList.contains('u-visually-hidden'));
    }

    /** Parte inferior del copy en px (para la "safe area" de la cámara). */
    getContentBottom() {
        const rect = this.intro.getBoundingClientRect();

        return rect.bottom;
    }
}
