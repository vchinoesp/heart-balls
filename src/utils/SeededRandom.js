/**
 * Generador pseudoaleatorio determinista (mulberry32).
 * Mismo seed => mismo corazón en todos los dispositivos y recargas.
 */
export default class SeededRandom {
    constructor(seed = 1) {
        this.state = seed >>> 0;
    }

    next() {
        this.state = (this.state + 0x6d2b79f5) >>> 0;

        let t = this.state;

        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);

        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }

    range(min, max) {
        return min + (max - min) * this.next();
    }

    int(max) {
        return Math.floor(this.next() * max);
    }

    shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = this.int(i + 1);
            const tmp = array[i];

            array[i] = array[j];
            array[j] = tmp;
        }

        return array;
    }
}
