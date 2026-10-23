import * as THREE from 'three';
import gsap from 'gsap';

import Environment from '../world/Environment.js';
import Renderer from '../experience/Renderer.js';
import BallMaterial from '../world/heart/BallMaterial.js';

export default class HeroBall {
    constructor(canvas, { reducedMotion = false, ball } = {}) {
        this.canvas = canvas;
        this.reducedMotion = reducedMotion;
        this.ballOptions = ball;
        this.render = this.render.bind(this);

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
        Renderer.applyColorSettings(this.renderer);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    }

    setScene() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(26, 1, 0.1, 50);
        this.camera.position.set(0, 0, 6.2);

        ({ environmentMap: this.environment } = Environment.apply(this.scene, this.renderer));
    }

    setBall() {
        const { digits, color, roughness, numberColor, interaction } = this.ballOptions;

        this.material = new BallMaterial({ digits, color, roughness, numberColor, interaction });

        const uniforms = this.material.uniforms;

        uniforms.uCavity.value.set(0.82, 1.0);
        uniforms.uSurfaceShade.value = 1;
        uniforms.uHeightShade.value.set(-100, -99, 1);

        this.geometry = new THREE.SphereGeometry(1, 96, 64);
        this.numberAttribute = new THREE.InstancedBufferAttribute(new Float32Array(1), 1);
        this.geometry.setAttribute('aNumber', this.numberAttribute);
        this.geometry.setAttribute(
            'aIntro',
            new THREE.InstancedBufferAttribute(new Float32Array(2), 2)
        );

        this.ball = new THREE.InstancedMesh(this.geometry, this.material, 1);
        this.ball.setMatrixAt(0, new THREE.Matrix4());
        this.ball.frustumCulled = false;

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

    startSway() {
        if (this.reducedMotion) return;

        this.stopSway();

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

    stopSway() {
        this.sway?.kill();
        this.sway = null;
        this.swayCall?.kill();
        this.swayCall = null;
    }

    setNumber(number) {
        this.numberAttribute.array[0] = number;
        this.numberAttribute.needsUpdate = true;
    }

    resize() {
        const { clientWidth, clientHeight } = this.canvas;

        if (!clientWidth || !clientHeight) return;

        this.renderer.setSize(clientWidth, clientHeight, false);
        this.camera.aspect = clientWidth / clientHeight;
        this.camera.updateProjectionMatrix();
    }

    open(number) {
        this.setNumber(number);
        this.resize();

        gsap.killTweensOf([this.ball.position, this.ball.rotation, this.ball.scale]);
        this.stopSway();
        this.drag = null;

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

    prewarm() {
        this.setNumber(0);
        this.render();
    }

    render() {
        this.renderer.render(this.scene, this.camera);
    }

    static format(number) {
        const digits = String(number).padStart(5, '0');

        return `${digits.slice(0, 2)}.${digits.slice(2)}`;
    }

    dispose() {
        this.close();
        this.geometry.dispose();
        this.material.dispose();
        this.ball.dispose();
        this.environment.dispose();
        this.renderer.dispose();
    }
}
