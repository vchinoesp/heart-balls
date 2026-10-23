export default class Time {
    constructor() {
        this.start = performance.now();
        this.current = this.start;
        this.elapsed = 0;
        this.delta = 16;

        this.tick = this.tick.bind(this);
        this.frame = requestAnimationFrame(this.tick);
    }

    tick(now) {
        this.delta = Math.min(now - this.current, 100);
        this.current = now;
        this.elapsed = this.current - this.start;

        window.dispatchEvent(new CustomEvent('time:tick'));

        this.frame = requestAnimationFrame(this.tick);
    }

    dispose() {
        cancelAnimationFrame(this.frame);
    }
}
