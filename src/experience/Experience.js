import * as THREE from 'three';

import Sizes from './Sizes.js';
import Time from './Time.js';
import Camera from './Camera.js';
import Renderer from './Renderer.js';

import Debug from '../utils/Debug.js';
import World from '../world/World.js';
import heartConfig from '../config/heart.config.js';

/**
 * Experience
 *
 * Punto de entrada de la escena WebGL. Sin variables globales:
 * main.js crea una instancia y la conserva.
 */
export default class Experience {
    constructor(canvas) {
        this.canvas = canvas;
        this.config = structuredClone(heartConfig);
        this.isMobile = window.matchMedia('(pointer: coarse)').matches;

        this.scene = new THREE.Scene();
        this.debug = new Debug();
        this.sizes = new Sizes();
    }

    async init() {
        await this.debug.init();

        const { lobeX, lobeY, lobeRadius } = this.config.shape;
        const heartAspect = (2 * (lobeX + lobeRadius)) / (lobeY + lobeRadius);

        this.camera = new Camera(this.sizes, this.scene, this.debug, {
            subjectHeight: this.config.worldHeight,
            subjectWidth: this.config.worldHeight * heartAspect
        });

        this.renderer = new Renderer(
            this.canvas,
            this.sizes,
            this.scene,
            this.camera
        );

        this.world = new World({
            scene: this.scene,
            renderer: this.renderer.instance,
            debug: this.debug,
            config: this.config,
            isMobile: this.isMobile
        });

        await this.setControls();
        await this.world.init();

        this.onResize = () => this.resize();
        this.onTick = () => this.update();

        window.addEventListener('sizes:resize', this.onResize);

        this.time = new Time();
        window.addEventListener('time:tick', this.onTick);
    }

    /** OrbitControls solo en #debug (en producción el corazón se inclina con el puntero). */
    async setControls() {
        if (!this.debug.active) return;

        const { OrbitControls } = await import(
            'three/examples/jsm/controls/OrbitControls.js'
        );

        this.controls = new OrbitControls(this.camera.instance, this.canvas);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
    }

    resize() {
        this.camera.resize();
        this.renderer.resize();
    }

    update() {
        this.controls?.update();
        this.world.update();
        this.renderer.update();
    }

    dispose() {
        window.removeEventListener('sizes:resize', this.onResize);
        window.removeEventListener('time:tick', this.onTick);

        this.time?.dispose();
        this.sizes.dispose();
        this.controls?.dispose();
        this.world?.dispose();
        this.renderer?.dispose();
        this.debug.dispose();
    }
}
