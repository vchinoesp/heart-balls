import * as THREE from 'three';

export default class Renderer {
    constructor(canvas, sizes, scene, camera) {
        this.canvas = canvas;
        this.sizes = sizes;
        this.scene = scene;
        this.camera = camera;

        this.setInstance();
    }

    setInstance() {
        this.instance = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true,
            alpha: true
        });

        this.instance.setSize(
            this.sizes.width,
            this.sizes.height
        );

        this.instance.setPixelRatio(
            Math.min(window.devicePixelRatio, 2)
        );
    }

    resize() {
        this.instance.setSize(
            this.sizes.width,
            this.sizes.height
        );

        this.instance.setPixelRatio(
            Math.min(window.devicePixelRatio, 2)
        );
    }

    update() {
        this.instance.render(
            this.scene,
            this.camera.instance
        );
    }
}