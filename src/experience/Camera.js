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
        this.framing = { vertical: 1.08, horizontal: 1.12 };
        this.view = { ratio: 1, panX: 0, panY: 0 };
        // Franja de pantalla (px) reservada arriba/abajo para el copy y el footer
        this.safeArea = { top: 0, bottom: 0 };
        this.ndcShiftY = 0;

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

    /**
     * Distancia a la que el corazón entra completo en la franja libre
     * (entre safeArea.top y safeArea.bottom) y desplazamiento de la imagen
     * para centrarlo en esa franja (setViewOffset: el picking lo respeta).
     */
    fit() {
        const { aspect } = this.instance;
        const halfTan = this.halfTan();
        const height = this.sizes.height;
        const { top, bottom } = this.safeArea;
        const available = Math.max(height - top - bottom, height * 0.35) / height;

        const byHeight =
            (this.subjectHeight * this.framing.vertical) / (2 * halfTan * available);
        const byWidth =
            (this.subjectWidth * this.framing.horizontal) /
            (2 * halfTan * aspect);

        this.fitDistance = Math.max(byHeight, byWidth);

        // Centro de la franja libre respecto al centro de la pantalla (px)
        const shift = top + (height - top - bottom) / 2 - height / 2;
        const { width } = this.sizes;

        // Para convertir ndc de pantalla a ndc de la vista desplazada (zoom al puntero)
        this.ndcShiftY = (2 * shift) / height;

        if (Math.abs(shift) > 0.5) {
            this.instance.setViewOffset(width, height, 0, -shift, width, height);
        } else {
            this.instance.clearViewOffset();
        }

        this.applyView();
    }

    setSafeArea({ top = 0, bottom = 0 }) {
        this.safeArea.top = top;
        this.safeArea.bottom = bottom;
        this.fit();
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
