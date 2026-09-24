import './styles/main.scss';
import Experience from './experience/Experience.js';

const canvas = document.querySelector('.webgl');

/**
 * Progressive enhancement: el contenido (h1, textos) vive en el HTML.
 * Si no hay WebGL, se queda el fondo y el texto; nunca una pantalla vacía.
 */
function supportsWebGL() {
    try {
        const test = document.createElement('canvas');

        return Boolean(test.getContext('webgl2') || test.getContext('webgl'));
    } catch {
        return false;
    }
}

if (canvas && supportsWebGL()) {
    const experience = new Experience(canvas);

    experience
        .init()
        .then(() => document.documentElement.classList.add('is-webgl-ready'))
        .catch((error) => {
            document.documentElement.classList.add('is-webgl-error');
            console.error(error);
        });
} else {
    document.documentElement.classList.add('no-webgl');
}
