import * as THREE from 'three';

import Sizes from './Sizes.js';
import Time from './Time.js';
import Camera from './Camera.js';
import Renderer from './Renderer.js';

import Debug from '../utils/Debug.js';
import FpsMeter from '../utils/FpsMeter.js';
import World from '../world/World.js';
import HeartControls from '../interaction/HeartControls.js';
import BallSelection from '../interaction/BallSelection.js';
import BallModal from '../ui/BallModal.js';
import heartConfig from '../config/heart.config.js';

/**
 * Experience
 *
 * Punto de entrada de la escena WebGL. Sin variables globales:
 * main.js crea una instancia y la conserva.
 *
 * Flujo: navegar el corazón (HeartControls) -> señalar/elegir bola
 * (BallSelection) -> popup con la bola girando (BallModal) -> "Elige otra".
 */
export default class Experience {
    constructor(canvas) {
        this.canvas = canvas;
        this.config = structuredClone(heartConfig);
        this.isMobile = window.matchMedia('(pointer: coarse)').matches;
        this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        this.paused = false;

        this.scene = new THREE.Scene();
        this.debug = new Debug();
        this.sizes = new Sizes();
    }

    async init() {
        await this.debug.init();

        const { lobeX, lobeY, lobeRadius } = this.config.shape;
        const heartAspect = (2 * (lobeX + lobeRadius)) / (lobeY + lobeRadius);

        this.heartSize = {
            height: this.config.worldHeight,
            width: this.config.worldHeight * heartAspect
        };

        this.camera = new Camera(this.sizes, this.scene, this.debug, {
            subjectHeight: this.heartSize.height,
            subjectWidth: this.heartSize.width
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
            isMobile: this.isMobile,
            reducedMotion: this.reducedMotion
        });

        await this.world.init();

        this.setInteraction();

        if (this.debug.showFps) {
            this.fpsMeter = new FpsMeter({ renderer: this.renderer.instance });
        }

        this.onResize = () => this.resize();
        this.onTick = () => this.update();

        window.addEventListener('sizes:resize', this.onResize);

        this.time = new Time();
        window.addEventListener('time:tick', this.onTick);
    }

    setInteraction() {
        const heartBalls = this.world.heartBalls;

        this.modal = new BallModal({
            root: document.querySelector('.ball-modal'),
            reducedMotion: this.reducedMotion,
            onClose: () => this.onModalClose()
        });

        this.selection = new BallSelection({
            camera: this.camera.instance,
            heartBalls,
            fx: this.world.fx,
            element: this.canvas,
            onSelect: ({ number }) => this.onBallSelected(number)
        });

        this.controls = new HeartControls({
            element: this.canvas,
            camera: this.camera,
            target: heartBalls.group,
            heartSize: this.heartSize,
            reducedMotion: this.reducedMotion,
            onHover: (ndc, type) => this.selection.hover(ndc, type),
            onTap: (ndc, type) => this.selection.tap(ndc, type),
            onKeySelect: () => this.selection.selectCenter()
        });
    }

    onBallSelected(number) {
        this.controls.setEnabled(false);
        this.modal.open({ number });

        // Con el popup abierto el corazón queda detrás, desenfocado: no hace
        // falta renderizarlo a 60 fps (ahorro de batería en móvil).
        this.paused = true;
        this.renderer.update();
    }

    onModalClose() {
        this.paused = false;
        this.controls.setEnabled(true);
        this.selection.release();
    }

    resize() {
        this.camera.resize();
        this.renderer.resize();

        if (this.paused) this.renderer.update();
    }

    update() {
        this.fpsMeter?.update();

        if (this.paused) return;

        this.selection.update();
        this.camera.update();
        this.world.update();
        this.renderer.update();
    }

    dispose() {
        window.removeEventListener('sizes:resize', this.onResize);
        window.removeEventListener('time:tick', this.onTick);

        this.time?.dispose();
        this.sizes.dispose();
        this.controls?.dispose();
        this.modal?.dispose();
        this.fpsMeter?.dispose();
        this.world?.dispose();
        this.renderer?.dispose();
        this.debug.dispose();
    }
}
