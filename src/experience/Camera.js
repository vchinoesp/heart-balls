import * as THREE from 'three';

/**
 * Camera
 *
 * Cámara en perspectiva que encuadra el corazón automáticamente
 * (responsive: en móvil vertical manda el ancho, en desktop el alto).
 *
 * `view` lo modifican los controles (HeartControls):
 *  - ratio: 1 = corazón completo encuadrado, <1 = más cerca (zoom)
 *  - panX / panY: desplazamiento del punto de mira (para acercarse a una zona)
 */
export default class Camera {
    constructor(sizes, scene, debug, { subjectWidth, subjectHeight }) {
        this.sizes = sizes;
        this.scene = scene;
        this.debug = debug;

        this.subjectWidth = subjectWidth;
        this.subjectHeight = subjectHeight;

        // Margen alrededor del corazón (1 = justo al borde)
        this.framing = { vertical: 1.3, horizontal: 1.14 };
        this.view = { ratio: 1, panX: 0, panY: 0 };

        this.setInstance();
        this.fit();
        this.setDebug();
    }

    setInstance() {
        this.instance = new THREE.PerspectiveCamera(
            30,
            this.sizes.width / this.sizes.height,
            0.05,
            100
        );

        this.scene.add(this.instance);
    }

    /** Distancia a la que el corazón entra completo en pantalla. */
    fit() {
        const { aspect } = this.instance;
        const halfTan = this.halfTan();

        const byHeight =
            (this.subjectHeight * this.framing.vertical) / (2 * halfTan);
        const byWidth =
            (this.subjectWidth * this.framing.horizontal) /
            (2 * halfTan * aspect);

        this.fitDistance = Math.max(byHeight, byWidth);
        this.applyView();
    }

    halfTan() {
        return Math.tan(THREE.MathUtils.degToRad(this.instance.fov) * 0.5);
    }

    /** Medio alto/ancho visibles en el plano z = 0 para un ratio de zoom. */
    halfExtents(ratio = this.view.ratio) {
        const halfHeight = this.fitDistance * ratio * this.halfTan();

        return {
            halfHeight,
            halfWidth: halfHeight * this.instance.aspect
        };
    }

    applyView() {
        const { ratio, panX, panY } = this.view;

        this.instance.position.set(panX, panY, this.fitDistance * ratio);
        this.instance.lookAt(panX, panY, 0);
    }

    setDebug() {
        if (!this.debug.active) return;

        const folder = this.debug.gui.addFolder('Camera');

        folder
            .add(this.instance, 'fov', 10, 90, 1)
            .name('FOV')
            .onChange(() => {
                this.instance.updateProjectionMatrix();
                this.fit();
            });

        folder.add(this.framing, 'vertical', 1, 2, 0.01).onChange(() => this.fit());
        folder.add(this.framing, 'horizontal', 1, 2, 0.01).onChange(() => this.fit());
        folder.close();
    }

    resize() {
        this.instance.aspect = this.sizes.width / this.sizes.height;
        this.instance.updateProjectionMatrix();
        this.fit();
    }

    update() {
        this.applyView();
    }
}
