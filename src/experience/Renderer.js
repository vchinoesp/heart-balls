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
            alpha: true,
            powerPreference: 'high-performance'
        });

        this.instance.setClearColor(0x000000, 0);
        this.instance.outputColorSpace = THREE.SRGBColorSpace;
        this.instance.toneMapping = THREE.ACESFilmicToneMapping;
        this.instance.toneMappingExposure = 1;

        this.resize();
    }

    resize() {
        this.instance.setSize(this.sizes.width, this.sizes.height);
        this.instance.setPixelRatio(this.sizes.pixelRatio);
    }

    update() {
        this.instance.render(this.scene, this.camera.instance);
    }

    dispose() {
        this.instance.dispose();
    }
}
