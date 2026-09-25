import * as THREE from 'three';
import gsap from 'gsap';

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
 * Escena WebGL del corazón. La crea App durante la carga y la controla:
 *  - init({ onProgress })  carga datos, crea el mundo y precompila shaders
 *  - playIntro()           el corazón se "genera" al llegar a la home
 *  - pause() / resume()    fuera de la home no se renderiza (batería)
 *  - setSafeArea()         encuadra el corazón entre el copy y el footer
 *
 * Flujo interno: navegar (HeartControls) -> señalar/elegir bola
 * (BallSelection) -> popup con la bola (BallModal) -> "Elige otra".
 */
export default class Experience {
    constructor(canvas, { modalRoot, links } = {}) {
        this.canvas = canvas;
        this.modalRoot = modalRoot;
        this.links = links;
        this.config = structuredClone(heartConfig);
        this.isMobile = window.matchMedia('(pointer: coarse)').matches;
        this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        this.hidden = true; // fuera de la home
        this.modalOpen = false;

        this.scene = new THREE.Scene();
        this.debug = new Debug();
        this.sizes = new Sizes();
    }

    get paused() {
        return this.hidden || this.modalOpen;
    }

    async init({ onProgress } = {}) {
        const progress = (value) => onProgress?.(value);

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

        this.renderer = new Renderer(this.canvas, this.sizes, this.scene, this.camera);
        progress(0.15);

        this.world = new World({
            scene: this.scene,
            renderer: this.renderer.instance,
            debug: this.debug,
            config: this.config,
            isMobile: this.isMobile,
            reducedMotion: this.reducedMotion
        });

        await this.world.init();
        progress(0.6);

        this.setInteraction();

        // Precompilar shaders ahora (y no en el primer frame de la home)
        const renderer = this.renderer.instance;

        if (renderer.extensions.has('KHR_parallel_shader_compile')) {
            await renderer.compileAsync(this.scene, this.camera.instance);
        } else {
            renderer.compile(this.scene, this.camera.instance);
        }
        this.world.heartBalls.setIntro(0);
        progress(0.9);

        this.modal.prewarm();
        progress(1);

        if (this.debug.showFps) {
            this.fpsMeter = new FpsMeter({ renderer: this.renderer.instance });
        }

        this.onResize = () => this.resize();
        this.onTick = () => this.update();

        window.addEventListener('sizes:resize', this.onResize);

        this.time = new Time();
        window.addEventListener('time:tick', this.onTick);

        this.ready = true;
    }

    setInteraction() {
        const heartBalls = this.world.heartBalls;

        this.modal = new BallModal({
            root: this.modalRoot,
            links: this.links,
            reducedMotion: this.reducedMotion,
            onClose: () => this.onModalClose()
        });

        this.selection = new BallSelection({
            camera: this.camera.instance,
            heartBalls,
            fx: this.world.fx,
            element: this.canvas,
            interaction: this.config.interaction,
            getCenterNdc: () => ({ x: 0, y: -this.camera.ndcShiftY }),
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

        this.setInteractive(false);
    }

    /* ------------------------------------------------------------------ */
    /* API para App                                                        */
    /* ------------------------------------------------------------------ */

    setInteractive(enabled) {
        this.controls.setEnabled(enabled);
        this.selection.locked = !enabled;
    }

    pause() {
        this.hidden = true;
    }

    resume() {
        this.hidden = false;
    }

    setSafeArea({ top, bottom }) {
        this.camera.setSafeArea({ top, bottom });
    }

    /**
     * El corazón se genera: las bolas llegan en espiral desde fuera, de abajo
     * arriba, mientras el corazón termina de girar hacia el frente.
     */
    /**
     * Vuelta al estado inicial antes de cada entrada al corazón: vista sin
     * zoom ni giro, sin bola destacada y con las bolas "sin formar".
     */
    resetView() {
        const heartBalls = this.world.heartBalls;

        this.introTimeline?.kill();
        this.setInteractive(false);
        this.controls.reset({ immediate: true });
        this.camera.applyView();

        this.world.fx.setHover(-1);
        this.world.fx.setRepel(false);
        this.selection.reset();

        heartBalls.group.rotation.set(0, -Math.PI * 0.9, 0);
        heartBalls.group.position.set(0, -0.6, 0);
        heartBalls.setIntro(this.reducedMotion ? 1 : 0);
    }

    playIntro({ delay = 0 } = {}) {
        const heartBalls = this.world.heartBalls;
        const group = heartBalls.group;

        this.introTimeline?.kill();

        if (this.reducedMotion) {
            group.rotation.set(0, 0, 0);
            group.position.set(0, 0, 0);
            heartBalls.setIntro(1);
            this.setInteractive(true);

            return gsap.timeline();
        }

        const state = { progress: 0 };
        const timeline = gsap.timeline({
            delay,
            onComplete: () => this.setInteractive(true)
        });

        timeline
            .to(state, {
                progress: 1,
                duration: 3.4,
                ease: 'power2.inOut',
                onUpdate: () => heartBalls.setIntro(state.progress)
            })
            .fromTo(
                group.rotation,
                { y: -Math.PI * 0.9 },
                { y: 0, duration: 3.8, ease: 'expo.out' },
                0
            )
            .fromTo(
                group.position,
                { y: -0.6 },
                { y: 0, duration: 3.4, ease: 'expo.out' },
                0
            );

        this.introTimeline = timeline;

        return timeline;
    }

    /* ------------------------------------------------------------------ */
    /* Popup                                                               */
    /* ------------------------------------------------------------------ */

    onBallSelected(number) {
        this.controls.setEnabled(false);
        this.modal.open({ number });

        // Con el popup abierto el corazón queda detrás, desenfocado: no hace
        // falta renderizarlo a 60 fps (ahorro de batería en móvil).
        this.modalOpen = true;
        this.renderer.update();
    }

    onModalClose() {
        this.modalOpen = false;
        this.controls.setEnabled(true);
        this.selection.release();
    }

    /* ------------------------------------------------------------------ */
    /* Bucle                                                               */
    /* ------------------------------------------------------------------ */

    resize() {
        this.camera.resize();
        this.renderer.resize();

        if (this.modalOpen) this.renderer.update();
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
