import * as THREE from 'three';

export default class Camera {
    constructor(
        sizes,
        scene,
        debug
    ) {
        this.sizes = sizes;
        this.scene = scene;
        this.debug = debug;

        this.setInstance();
        this.setDebug();
    }

    setInstance() {
        this.instance =
            new THREE.PerspectiveCamera(
                35,
                this.sizes.width /
                this.sizes.height,
                0.1,
                100
            );

        this.instance.position.set(
            0,
            0,
            15
        );

        this.scene.add(
            this.instance
        );
    }

    setDebug() {
        if (!this.debug) return;

        const folder =
            this.debug.gui.addFolder(
                'Camera'
            );

        folder
            .add(
                this.instance.position,
                'x',
                -20,
                20,
                0.01
            )
            .name('Position X');

        folder
            .add(
                this.instance.position,
                'y',
                -20,
                20,
                0.01
            )
            .name('Position Y');

        folder
            .add(
                this.instance.position,
                'z',
                1,
                50,
                0.01
            )
            .name('Position Z');

        folder
            .add(
                this.instance,
                'fov',
                10,
                90,
                1
            )
            .name('FOV')
            .onChange(() => {
                this.instance.updateProjectionMatrix();
            });

        folder.open();
    }

    resize() {
        this.instance.aspect =
            this.sizes.width /
            this.sizes.height;

        this.instance.updateProjectionMatrix();
    }

    update() {}
}