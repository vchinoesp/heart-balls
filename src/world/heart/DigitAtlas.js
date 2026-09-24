import * as THREE from 'three';

/**
 * DigitAtlas
 *
 * Textura generada en canvas con los dígitos 0-9 en una fila.
 * El shader compone cualquier número 00000-99999 leyendo 5 celdas,
 * así 1 sola textura (≈120 KB en GPU) sirve para todas las bolas.
 */
export default class DigitAtlas {
    constructor({
        cellWidth = 96,
        cellHeight = 128,
        font = '700 108px "Helvetica Neue", Arial, sans-serif'
    } = {}) {
        this.cellWidth = cellWidth;
        this.cellHeight = cellHeight;
        this.font = font;

        this.texture = this.createTexture();
    }

    createTexture() {
        const canvas = document.createElement('canvas');

        canvas.width = this.cellWidth * 10;
        canvas.height = this.cellHeight;

        const context = canvas.getContext('2d');

        context.clearRect(0, 0, canvas.width, canvas.height);
        context.fillStyle = '#ffffff';
        context.font = this.font;
        context.textAlign = 'center';
        context.textBaseline = 'middle';

        for (let digit = 0; digit < 10; digit++) {
            context.fillText(
                String(digit),
                this.cellWidth * (digit + 0.5),
                this.cellHeight * 0.54
            );
        }

        const texture = new THREE.CanvasTexture(canvas);

        texture.colorSpace = THREE.NoColorSpace;
        texture.wrapS = THREE.ClampToEdgeWrapping;
        texture.wrapT = THREE.ClampToEdgeWrapping;
        texture.minFilter = THREE.LinearMipmapLinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.generateMipmaps = true;
        texture.anisotropy = 4;

        return texture;
    }

    dispose() {
        this.texture.dispose();
    }
}
