import * as THREE from 'three';
import gsap from 'gsap';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

/**
 * HeroBall
 *
 * La bola elegida, grande, dentro del popup. Usa su propio canvas/renderer
 * pequeño (solo existe mientras el popup está abierto) para poder vivir
 * encima del panel del popup. El número se pinta en una textura
 * equirectangular que envuelve la esfera: al girar se lee de izq. a dcha.
 *
 * Entrada: llega rodando desde la izquierda (gira de izq. a dcha.) y se
 * queda balanceándose suavemente.
 */
export default class HeroBall {
    constructor(canvas, { reducedMotion = false } = {}) {
        this.canvas = canvas;
        this.reducedMotion = reducedMotion;
        this.render = this.render.bind(this);

        this.setRenderer();
        this.setScene();
        this.setBall();
    }

    setRenderer() {
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true,
            alpha: true
        });

        this.renderer.setClearColor(0x000000, 0);
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    }

    setScene() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(26, 1, 0.1, 50);
        this.camera.position.set(0, 0, 6.2);

        const pmrem = new THREE.PMREMGenerator(this.renderer);
        const room = new RoomEnvironment();

        this.environment = pmrem.fromScene(room, 0.04).texture;
        this.scene.environment = this.environment;
        this.scene.environmentIntensity = 0.45;

        room.dispose();
        pmrem.dispose();

        const key = new THREE.DirectionalLight('#fff1dc', 2.6);

        key.position.set(-3, 4, 5);

        const rim = new THREE.DirectionalLight('#ffe2b0', 1.2);

        rim.position.set(4, 2, -3);

        this.scene.add(key, rim);
    }

    setBall() {
        this.labelCanvas = document.createElement('canvas');
        this.labelCanvas.width = 2048;
        this.labelCanvas.height = 1024;

        this.texture = new THREE.CanvasTexture(this.labelCanvas);
        this.texture.colorSpace = THREE.SRGBColorSpace;
        this.texture.anisotropy = 8;

        this.ball = new THREE.Mesh(
            new THREE.SphereGeometry(1, 96, 64),
            new THREE.MeshStandardMaterial({
                map: this.texture,
                roughness: 0.48,
                metalness: 0
            })
        );

        this.scene.add(this.ball);
    }

    /** Textura de madera clara con el número "tostado" en el frente. */
    paintLabel(number) {
        const context = this.labelCanvas.getContext('2d');
        const { width, height } = this.labelCanvas;
        const text = HeroBall.format(number);

        // Madera
        const gradient = context.createLinearGradient(0, 0, 0, height);

        gradient.addColorStop(0, '#ddb062');
        gradient.addColorStop(0.5, '#f0cb83');
        gradient.addColorStop(1, '#d4a354');
        context.fillStyle = gradient;
        context.fillRect(0, 0, width, height);

        // Veta sutil
        context.globalAlpha = 0.06;
        context.strokeStyle = '#7a5427';

        for (let y = 0; y < height; y += 9) {
            context.lineWidth = 1 + ((y * 7) % 3);
            context.beginPath();

            for (let x = 0; x <= width; x += 32) {
                const wave = Math.sin(x * 0.004 + y * 0.05) * 6;

                if (x === 0) context.moveTo(x, y + wave);
                else context.lineTo(x, y + wave);
            }

            context.stroke();
        }

        context.globalAlpha = 1;

        // Agujero superior (como las bolas del bombo)
        const hole = context.createLinearGradient(0, 0, 0, height * 0.04);

        hole.addColorStop(0, '#3a2412');
        hole.addColorStop(1, 'rgba(58, 36, 18, 0)');
        context.fillStyle = hole;
        context.fillRect(0, 0, width, height * 0.04);

        // Número: centrado en u = 0.25 (frente de la esfera en Three.js)
        const centerX = width * 0.25;
        const centerY = height * 0.52;

        context.font = `600 ${height * 0.26}px Georgia, "Times New Roman", serif`;
        context.textAlign = 'center';
        context.textBaseline = 'middle';

        context.filter = 'blur(2px)';
        context.fillStyle = 'rgba(255, 236, 200, 0.55)';
        context.fillText(text, centerX + 3, centerY + 4);

        context.filter = 'blur(1px)';
        context.fillStyle = '#6a4523';
        context.fillText(text, centerX, centerY);
        context.filter = 'none';

        this.texture.needsUpdate = true;
    }

    resize() {
        const { clientWidth, clientHeight } = this.canvas;

        if (!clientWidth || !clientHeight) return;

        this.renderer.setSize(clientWidth, clientHeight, false);
        this.camera.aspect = clientWidth / clientHeight;
        this.camera.updateProjectionMatrix();
    }

    open(number) {
        this.paintLabel(number);
        this.resize();

        gsap.killTweensOf([this.ball.position, this.ball.rotation, this.ball.scale]);
        gsap.ticker.add(this.render);

        if (this.reducedMotion) {
            this.ball.position.set(0, 0, 0);
            this.ball.rotation.set(0, 0, 0);
            this.ball.scale.setScalar(1);

            return gsap.timeline();
        }

        // Rueda desde la izquierda girando de izq. a dcha. hasta mostrar el número
        const timeline = gsap.timeline();

        timeline
            .fromTo(
                this.ball.position,
                { x: -3.2 },
                { x: 0, duration: 1.5, ease: 'expo.out' },
                0
            )
            .fromTo(
                this.ball.rotation,
                { y: -Math.PI * 2.5, z: 0.08 },
                { y: 0, z: 0, duration: 1.8, ease: 'expo.out' },
                0
            )
            .fromTo(
                this.ball.scale,
                { x: 0.7, y: 0.7, z: 0.7 },
                { x: 1, y: 1, z: 1, duration: 1.2, ease: 'power3.out' },
                0
            )
            .to(this.ball.rotation, {
                y: 0.22,
                duration: 2.4,
                ease: 'sine.inOut',
                yoyo: true,
                repeat: -1
            });

        this.timeline = timeline;

        return timeline;
    }

    close() {
        this.timeline?.kill();
        gsap.ticker.remove(this.render);
    }

    render() {
        this.renderer.render(this.scene, this.camera);
    }

    /** 2845 -> "02.845" (formato lotería) */
    static format(number) {
        const digits = String(number).padStart(5, '0');

        return `${digits.slice(0, 2)}.${digits.slice(2)}`;
    }

    dispose() {
        this.close();
        this.ball.geometry.dispose();
        this.ball.material.dispose();
        this.texture.dispose();
        this.environment.dispose();
        this.renderer.dispose();
    }
}
