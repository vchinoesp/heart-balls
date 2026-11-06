import gsap from 'gsap';

const WAVE_DURATION = 1.6;

export default class HeartBeat {
    constructor({ uniforms, target, config, reducedMotion = false, debug }) {
        this.uniforms = uniforms;
        this.target = target;
        this.config = config;
        this.reducedMotion = reducedMotion;
        this.looping = false;
        this.clock = null;
        this.events = [];

        this.tick = this.tick.bind(this);

        this.applyConfig();
        this.setDebug(debug);
    }

    get playing() {
        return Boolean(this.timeline?.isActive() || this.wave?.isActive() || this.pulse?.isActive());
    }

    get syncTime() {
        return this.clock?.getTime() ?? null;
    }

    setClock({ getTime, cycles = [] }) {
        this.clock = { getTime };
        this.events = cycles
            .flatMap(([lead, beat, echo]) => [
                { time: lead, kind: 'lead' },
                { time: beat, kind: 'beat', echoDelay: echo - beat },
                { time: echo, kind: 'echo' }
            ])
            .sort((a, b) => a.time - b.time);
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
        this.awaitingLead = true;
        this.lastTime = null;
        gsap.ticker.add(this.tick);

        if (this.syncTime === null && !this.timeline?.isActive()) this.freeBeat();
    }

    finish() {
        this.looping = false;
    }

    stop() {
        this.looping = false;
        this.pendingEcho = false;
        gsap.ticker.remove(this.tick);
        [this.timeline, this.wave, this.pulse].forEach((animation) => animation?.kill());
        this.timeline = null;
        this.wave = null;
        this.pulse = null;
        this.reset();
    }

    tick() {
        const time = this.syncTime;
        const previous = this.lastTime;

        this.lastTime = time;

        if (time === null) {
            if (this.looping && !this.timeline?.isActive()) this.freeBeat();
            if (!this.looping && !this.playing) gsap.ticker.remove(this.tick);

            return;
        }

        if (this.timeline?.isActive() || previous === null) return;

        this.events.forEach((event) => {
            if (HeartBeat.crossed(previous, time, event.time)) this.fire(event);
        });

        if (!this.looping && !this.pendingEcho && !this.playing) gsap.ticker.remove(this.tick);
    }

    static crossed(previous, time, at) {
        if (time >= previous) return at > previous && at <= time;

        return at > previous || at <= time;
    }

    fire(event) {
        if (event.kind === 'echo') {
            if (!this.pendingEcho) return;

            this.pendingEcho = false;
            this.scalePulse('echo');

            return;
        }

        if (!this.looping) return;

        if (event.kind === 'lead') {
            this.awaitingLead = false;
            this.startWave(this.config.leadWave, 0, 0);

            return;
        }

        if (this.awaitingLead) return;

        this.startWave(1, this.config.echo, event.echoDelay);
        this.scalePulse('beat');
        this.pendingEcho = true;
    }

    startWave(strength, echo, echoDelay) {
        const { uBeatTime, uBeatStrength, uBeatEcho } = this.uniforms;

        this.wave?.kill();
        uBeatEcho.value.set(echo, echoDelay);
        uBeatStrength.value = strength;
        this.wave = gsap.fromTo(
            uBeatTime,
            { value: 0 },
            { value: WAVE_DURATION, duration: WAVE_DURATION, ease: 'none' }
        );
    }

    scalePulse(kind) {
        const { heartScale } = this.config;
        const scale = this.target.scale;

        this.pulse?.kill();

        if (kind === 'beat') {
            const peak = 1 + heartScale;
            const rest = 1 - heartScale * 0.15;

            this.pulse = gsap
                .timeline()
                .to(scale, { x: peak, y: peak, z: peak, duration: 0.11, ease: 'power2.out' })
                .to(scale, { x: rest, y: rest, z: rest, duration: 0.18, ease: 'power2.inOut' });

            return;
        }

        const echo = 1 + heartScale * 0.6;

        this.pulse = gsap
            .timeline()
            .to(scale, { x: echo, y: echo, z: echo, duration: 0.1, ease: 'power2.out' })
            .to(scale, { x: 1, y: 1, z: 1, duration: 0.5, ease: 'power3.out' });
    }

    freeBeat() {
        const { interval, echo, echoDelay, heartScale } = this.config;
        const { uBeatTime, uBeatStrength, uBeatEcho } = this.uniforms;
        const scale = this.target.scale;
        const peak = 1 + heartScale;
        const echoScale = 1 + heartScale * 0.6;
        const rest = 1 - heartScale * 0.15;

        this.wave?.kill();
        this.pulse?.kill();
        this.timeline?.kill();
        this.timeline = gsap
            .timeline({
                onStart: () => uBeatEcho.value.set(echo, echoDelay),
                onComplete: () => this.nextFreeBeat()
            })
            .set(uBeatStrength, { value: 1 }, 0)
            .fromTo(uBeatTime, { value: 0 }, { value: interval, duration: interval, ease: 'none' }, 0)
            .to(scale, { x: peak, y: peak, z: peak, duration: 0.11, ease: 'power2.out' }, 0)
            .to(scale, { x: rest, y: rest, z: rest, duration: echoDelay - 0.11, ease: 'power2.inOut' }, 0.11)
            .to(scale, { x: echoScale, y: echoScale, z: echoScale, duration: 0.1, ease: 'power2.out' }, echoDelay)
            .to(scale, { x: 1, y: 1, z: 1, duration: 0.5, ease: 'power3.out' }, echoDelay + 0.1);
    }

    nextFreeBeat() {
        this.timeline = null;

        if (this.looping && this.syncTime === null) {
            this.freeBeat();

            return;
        }

        this.awaitingLead = true;
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

        folder.add(this.config, 'interval', 0.5, 1.6, 0.01).name('intervalo sin música (s)');
        folder.add(this.config, 'echo', 0, 1, 0.01).name('2º golpe').onChange(apply);
        folder.add(this.config, 'echoDelay', 0.12, 0.5, 0.01).name('2º golpe sin música (s)').onChange(apply);
        folder.add(this.config, 'leadWave', 0, 1, 0.01).name('ola 1er golpe (música)');
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
