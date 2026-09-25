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
 * Entrada: llega rodando desde la izquierda (gira de izq. a dcha.).
 * Después se balancea sola y se puede girar arrastrando (ratón o dedo), con
 * inercia; al soltarla vuelve a balancearse sola.
 */
export default class HeroBall {
    constructor(canvas, { reducedMotion = false } = {}) {
        this.canvas = canvas;
        this.reducedMotion = reducedMotion;
        this.render = this.render.bind(this);

        // Amplitud del balanceo automático (rad) y sensibilidad del arrastre
        this.swayAmplitude = 0.6;
        this.dragSpeed = 0.012;

        this.setRenderer();
        this.setScene();
        this.setBall();
        this.setDrag();
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

        // Tres niveles de giro independientes (así no se pisan las animaciones):
        //  pivot      -> arrastre del usuario (gsap.quickTo)
        //  swayGroup  -> balanceo automático (timeline GSAP)
        //  ball       -> animación de entrada
        this.pivot = new THREE.Group();
        this.swayGroup = new THREE.Group();
        this.swayGroup.add(this.ball);
        this.pivot.add(this.swayGroup);
        this.scene.add(this.pivot);
    }

    setDrag() {
        const rotation = this.pivot.rotation;
        const follow = { duration: 0.8, ease: 'power3.out' };

        this.rotateX = gsap.quickTo(rotation, 'x', follow);
        this.rotateY = gsap.quickTo(rotation, 'y', follow);
        this.target = { x: 0, y: 0 };
        this.drag = null;

        this.canvas.addEventListener('pointerdown', (event) => {
            this.canvas.setPointerCapture(event.pointerId);
            this.stopSway();
            this.drag = { x: event.clientX, y: event.clientY, vx: 0, time: performance.now() };
        });

        this.canvas.addEventListener('pointermove', (event) => {
            if (!this.drag) return;

            const now = performance.now();
            const dx = event.clientX - this.drag.x;
            const dy = event.clientY - this.drag.y;

            this.drag.vx = dx / Math.max(now - this.drag.time, 1);
            this.drag.x = event.clientX;
            this.drag.y = event.clientY;
            this.drag.time = now;

            this.target.y += dx * this.dragSpeed;
            this.target.x = gsap.utils.clamp(-0.6, 0.6, this.target.x + dy * this.dragSpeed);
            this.rotateY(this.target.y);
            this.rotateX(this.target.x);
        });

        const release = () => {
            if (!this.drag) return;

            // Inercia al soltar (solo si se soltó en movimiento)
            if (!this.reducedMotion && performance.now() - this.drag.time < 80) {
                this.target.y += this.drag.vx * 16 * this.dragSpeed * 10;
                this.rotateY(this.target.y);
            }

            this.drag = null;
            this.target.x = 0;
            this.rotateX(0);
            this.swayCall?.kill();
            this.swayCall = gsap.delayedCall(1.6, () => this.startSway());
        };

        this.canvas.addEventListener('pointerup', release);
        this.canvas.addEventListener('pointercancel', release);
        this.canvas.addEventListener('lostpointercapture', release);
    }

    /** Vuelve a dejar el número de frente y se balancea de lado a lado. */
    startSway() {
        if (this.reducedMotion) return;

        this.stopSway();

        // Número de frente: la vuelta completa más cercana al giro del usuario
        this.target.y = Math.round(this.target.y / (Math.PI * 2)) * Math.PI * 2;
        this.rotateY(this.target.y);

        const rotation = this.swayGroup.rotation;
        const amplitude = this.swayAmplitude;

        this.sway = gsap
            .timeline({ repeat: -1 })
            .to(rotation, { y: amplitude, duration: 2.6, ease: 'sine.inOut' })
            .to(rotation, { y: -amplitude, duration: 5.2, ease: 'sine.inOut' })
            .to(rotation, { y: 0, duration: 2.6, ease: 'sine.inOut' });
    }

    /** Detiene el balanceo donde esté (sin saltos) y cancela reanudaciones. */
    stopSway() {
        this.sway?.kill();
        this.sway = null;
        this.swayCall?.kill();
        this.swayCall = null;
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

        // Tipografía fina (Source Sans 3 Light), "tostada" sobre la madera
        context.font = `300 ${height * 0.34}px "Source Sans 3", "Helvetica Neue", Arial, sans-serif`;
        context.textAlign = 'center';
        context.textBaseline = 'middle';

        context.filter = 'blur(1.5px)';
        context.fillStyle = 'rgba(255, 236, 200, 0.5)';
        context.fillText(text, centerX + 2, centerY + 3);

        context.filter = 'blur(0.8px)';
        context.fillStyle = '#6e4827';
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
        this.stopSway();
        this.drag = null;

        // Reinicio completo del estado de giro (cada apertura empieza igual)
        this.target.x = 0;
        this.target.y = 0;
        this.rotateX(0, 0);
        this.rotateY(0, 0);
        this.pivot.rotation.set(0, 0, 0);
        this.swayGroup.rotation.set(0, 0, 0);
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
            .add(() => this.startSway(), 1.5);

        this.timeline = timeline;

        return timeline;
    }

    close() {
        this.timeline?.kill();
        this.stopSway();
        this.drag = null;
        gsap.ticker.remove(this.render);
    }

    /** Compila shaders y sube texturas antes del primer uso (sin tirón al abrir). */
    prewarm() {
        this.paintLabel(0);
        this.render();
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
