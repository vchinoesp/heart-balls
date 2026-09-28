import * as THREE from 'three';

/**
 * DigitAtlas
 *
 * Textura generada en canvas con los dígitos 0-9 en una fila.
 * El shader compone cualquier número 00000-99999 leyendo 5 celdas,
 * así 1 sola textura (≈120 KB en GPU) sirve para todas las bolas.
 *
 * Tipografía: la misma que la bola del popup (Source Sans 3 Light), fina y
 * alta. Si la fuente aún no ha cargado se pinta con la de reserva y se
 * repinta en cuanto llega (la textura se actualiza sola en la GPU).
 */
export default class DigitAtlas {
    constructor({
        cellWidth = 80,
        cellHeight = 160,
        family = '"Source Sans 3", "Helvetica Neue", Arial, sans-serif',
        weight = 300,
        size = 150
    } = {}) {
        this.cellWidth = cellWidth;
        this.cellHeight = cellHeight;
        this.font = `${weight} ${size}px ${family}`;

        this.canvas = document.createElement('canvas');
        this.canvas.width = this.cellWidth * 10;
        this.canvas.height = this.cellHeight;
        this.context = this.canvas.getContext('2d');

        this.texture = this.createTexture();
        this.draw();
        this.redrawWhenFontReady();
    }

    createTexture() {
        const texture = new THREE.CanvasTexture(this.canvas);

        texture.colorSpace = THREE.NoColorSpace;
        texture.wrapS = THREE.ClampToEdgeWrapping;
        texture.wrapT = THREE.ClampToEdgeWrapping;
        texture.minFilter = THREE.LinearMipmapLinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.generateMipmaps = true;
        texture.anisotropy = 4;

        return texture;
    }

    draw() {
        const { context, canvas, cellWidth, cellHeight } = this;

        context.clearRect(0, 0, canvas.width, canvas.height);
        context.fillStyle = '#ffffff';
        context.font = this.font;
        context.textAlign = 'center';
        context.textBaseline = 'middle';

        for (let digit = 0; digit < 10; digit++) {
            const x = cellWidth * (digit + 0.5);
            const y = cellHeight * 0.53;
            const width = context.measureText(String(digit)).width;
            // Algo estrecha: más alta que ancha, como en la bola del popup
            const squeeze = Math.min(1, (cellWidth * 0.86) / width) * 0.9;

            context.save();
            context.translate(x, y);
            context.scale(squeeze, 1);
            context.fillText(String(digit), 0, 0);
            context.restore();
        }

        this.texture.needsUpdate = true;
    }

    redrawWhenFontReady() {
        if (!document.fonts?.load) return;

        document.fonts
            .load(this.font)
            .then((faces) => {
                if (faces.length) this.draw();
            })
            .catch(() => {});
    }

    dispose() {
        this.texture.dispose();
    }
}
