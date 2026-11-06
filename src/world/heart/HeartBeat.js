import gsap from 'gsap';

export default class HeartBeat {
    constructor({ uniforms, target, config, reducedMotion = false, debug }) {
        this.uniforms = uniforms;
        this.target = target;
        this.config = config;
        this.reducedMotion = reducedMotion;
        this.looping = false;

        this.applyConfig();
        this.setDebug(debug);
    }

    get playing() {
        return Boolean(this.timeline?.isActive());
    }

    applyConfig() {
        const { uniforms, config } = this;

        uniforms.uBeatEcho.value.set(config.echo, config.echoDelay);
        uniforms.uBeatSpread.value = config.spread;
        uniforms.uBeatLift.value = config.lift;
        uniforms.uBeatScale.value = config.scale;
        uniforms.uBeatGlow.value = config.glow;
    }

    start() {
        if (this.reducedMotion) return;

        this.looping = true;

        if (!this.playing) this.beat();
    }

    finish() {
        this.looping = false;
    }

    beat() {
        const { interval, echoDelay, heartScale } = this.config;
        const { uBeatTime, uBeatStrength } = this.uniforms;
        const scale = this.target.scale;
        const peak = 1 + heartScale;
        const echo = 1 + heartScale * 0.6;
        const rest = 1 - heartScale * 0.15;

        this.timeline?.kill();
        this.timeline = gsap
            .timeline({ onComplete: () => this.next() })
            .set(uBeatStrength, { value: 1 }, 0)
            .fromTo(uBeatTime, { value: 0 }, { value: interval, duration: interval, ease: 'none' }, 0)
            .to(scale, { x: peak, y: peak, z: peak, duration: 0.11, ease: 'power2.out' }, 0)
            .to(scale, { x: rest, y: rest, z: rest, duration: echoDelay - 0.11, ease: 'power2.inOut' }, 0.11)
            .to(scale, { x: echo, y: echo, z: echo, duration: 0.1, ease: 'power2.out' }, echoDelay)
            .to(scale, { x: 1, y: 1, z: 1, duration: 0.5, ease: 'power3.out' }, echoDelay + 0.1);
    }

    next() {
        if (this.looping) {
            this.beat();

            return;
        }

        this.timeline = null;
        this.reset();
    }

    stop() {
        this.looping = false;
        this.timeline?.kill();
        this.timeline = null;
        this.reset();
    }

    reset() {
        this.uniforms.uBeatTime.value = -10;
        this.uniforms.uBeatStrength.value = 0;
        this.target.scale.setScalar(1);
    }

    setDebug(debug) {
        if (!debug?.active) return;

        const folder = debug.gui.addFolder('Latido');
        const apply = () => this.applyConfig();

        folder.add(this.config, 'interval', 0.5, 1.6, 0.01).name('intervalo (s)');
        folder.add(this.config, 'echo', 0, 1, 0.01).name('2º golpe').onChange(apply);
        folder.add(this.config, 'echoDelay', 0.12, 0.5, 0.01).name('2º golpe (s)').onChange(apply);
        folder.add(this.config, 'spread', 0, 0.3, 0.005).name('onda (s/unidad)').onChange(apply);
        folder.add(this.config, 'lift', 0, 0.2, 0.005).name('empuje bolas').onChange(apply);
        folder.add(this.config, 'scale', 0, 0.4, 0.01).name('crecen bolas').onChange(apply);
        folder.add(this.config, 'glow', 0, 1, 0.01).name('brillo').onChange(apply);
        folder.add(this.config, 'heartScale', 0, 0.1, 0.001).name('escala corazón');
        folder.add(this.config, 'idleDelay', 1, 30, 1).name('vuelve a latir (s)');
    }

    dispose() {
        this.stop();
    }
}
