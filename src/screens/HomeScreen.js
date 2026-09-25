import Screen from './Screen.js';

/**
 * HomeScreen
 *
 * Portada: copy centrado + CTA "Elige el tuyo y mucha suerte", que lleva
 * a la pantalla del corazón (HeartScreen). El texto cambia según el
 * dispositivo (ratón / táctil) desde el CSS.
 */
export default class HomeScreen extends Screen {
    constructor(root, { onStart, ...options }) {
        super(root, options);

        this.intro = root.querySelector('.intro');
        this.cta = root.querySelector('[data-action="start"]');

        this.cta.addEventListener('click', () => onStart?.());
    }

    get animated() {
        // Solo los elementos visibles (el texto de la otra variante está oculto)
        return [...this.intro.children].filter((element) => element.offsetParent !== null);
    }
}
