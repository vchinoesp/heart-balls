import * as THREE from 'three';

/**
 * DigitAtlas
 *
 * Textura generada en canvas con los dígitos 0-9 y el punto en una fila
 * (11 celdas). El shader compone cualquier número en formato lotería
 * "00.000" leyendo 5 dígitos + el punto, así 1 sola textura sirve para
 * todas las bolas.
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
        this.canvas.width = this.cellWidth * 11;
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

        // Punto: el shader lo muestra en media celda, así que se pinta al doble
        // de ancho para que se vea redondo
        context.save();
        context.translate(cellWidth * 10.5, cellHeight * 0.53);
        context.scale(2, 1);
        context.fillText('.', 0, 0);
        context.restore();

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
