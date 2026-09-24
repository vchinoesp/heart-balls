import * as THREE from 'three';

/**
 * Camera
 *
 * Cámara en perspectiva que encuadra el corazón automáticamente
 * (responsive: en móvil vertical manda el ancho, en desktop el alto).
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

        this.setInstance();
        this.fit();
        this.setDebug();
    }

    setInstance() {
        this.instance = new THREE.PerspectiveCamera(
            30,
            this.sizes.width / this.sizes.height,
            0.1,
            100
        );

        this.scene.add(this.instance);
    }

    /** Calcula la distancia para que el corazón entre en pantalla. */
    fit() {
        const { aspect, fov } = this.instance;
        const halfTan = Math.tan(THREE.MathUtils.degToRad(fov) * 0.5);

        const byHeight =
            (this.subjectHeight * this.framing.vertical) / (2 * halfTan);
        const byWidth =
            (this.subjectWidth * this.framing.horizontal) /
            (2 * halfTan * aspect);

        this.instance.position.set(0, 0, Math.max(byHeight, byWidth));
        this.instance.lookAt(0, 0, 0);
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

    update() {}
}
