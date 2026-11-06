import gsap from 'gsap';

export default class HeartBeat {
    constructor({ uniforms, target, config, reducedMotion = false, debug }) {
        this.uniforms = uniforms;
        this.target = target;
        this.config = config;
        this.reducedMotion = reducedMotion;

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

    play({ count = this.config.count, delay = 0 } = {}) {
        this.stop();

        if (this.reducedMotion || count < 1) return gsap.timeline();

        const { interval, decay, echoDelay, heartScale } = this.config;
        const { uBeatTime, uBeatStrength } = this.uniforms;
        const scale = this.target.scale;
        const timeline = gsap.timeline({ delay, onComplete: () => this.reset() });

        for (let i = 0; i < count; i++) {
            const at = i * interval;
            const strength = decay ** i;
            const peak = 1 + heartScale * strength;
            const echo = 1 + heartScale * strength * 0.6;
            const rest = 1 - heartScale * strength * 0.15;

            timeline
                .set(uBeatStrength, { value: strength }, at)
                .fromTo(uBeatTime, { value: 0 }, { value: interval, duration: interval, ease: 'none' }, at)
                .to(scale, { x: peak, y: peak, z: peak, duration: 0.11, ease: 'power2.out' }, at)
                .to(scale, { x: rest, y: rest, z: rest, duration: echoDelay - 0.11, ease: 'power2.inOut' }, at + 0.11)
                .to(scale, { x: echo, y: echo, z: echo, duration: 0.1, ease: 'power2.out' }, at + echoDelay)
                .to(scale, { x: 1, y: 1, z: 1, duration: 0.5, ease: 'power3.out' }, at + echoDelay + 0.1);
        }

        this.timeline = timeline;

        return timeline;
    }

    stop() {
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

        folder.add(this.config, 'count', 1, 5, 1).name('latidos');
        folder.add(this.config, 'interval', 0.5, 1.6, 0.01).name('intervalo (s)');
        folder.add(this.config, 'decay', 0.3, 1, 0.01).name('caída por latido');
        folder.add(this.config, 'echo', 0, 1, 0.01).name('2º golpe').onChange(apply);
        folder.add(this.config, 'echoDelay', 0.12, 0.5, 0.01).name('2º golpe (s)').onChange(apply);
        folder.add(this.config, 'spread', 0, 0.3, 0.005).name('onda (s/unidad)').onChange(apply);
        folder.add(this.config, 'lift', 0, 0.2, 0.005).name('empuje bolas').onChange(apply);
        folder.add(this.config, 'scale', 0, 0.4, 0.01).name('crecen bolas').onChange(apply);
        folder.add(this.config, 'glow', 0, 1, 0.01).name('brillo').onChange(apply);
        folder.add(this.config, 'heartScale', 0, 0.1, 0.001).name('escala corazón');
        folder.add({ play: () => this.play() }, 'play').name('▶ Latir');
    }

    dispose() {
        this.stop();
    }
}
