const STORAGE_KEY = 'el-sorteo-que-nos-une:sound';

function readPreference() {
    try {
        return window.localStorage.getItem(STORAGE_KEY) !== 'off';
    } catch {
        return true;
    }
}

function writePreference(enabled) {
    try {
        window.localStorage.setItem(STORAGE_KEY, enabled ? 'on' : 'off');
    } catch {
        return;
    }
}

export default class Soundtrack {
    constructor({ src, volume = 0.6, fade = 1.2, onChange } = {}) {
        this.src = src;
        this.volume = volume;
        this.fade = fade;
        this.onChange = onChange;

        this.enabled = readPreference();
        this.wanted = false;
        this.source = null;

        this.handleVisibility = () => this.updateVisibility();
        document.addEventListener('visibilitychange', this.handleVisibility);
    }

    get supported() {
        return Boolean(window.AudioContext || window.webkitAudioContext);
    }

    get playing() {
        return Boolean(this.source);
    }

    get time() {
        if (!this.source) return null;

        const latency = this.context.outputLatency || this.context.baseLatency || 0;
        const elapsed = this.context.currentTime - this.startedAt - latency;
        const duration = this.source.buffer.duration;

        return ((elapsed % duration) + duration) % duration;
    }

    preload() {
        this.data ??= fetch(this.src)
            .then((response) => {
                if (!response.ok) throw new Error(`No se pudo cargar ${this.src} (HTTP ${response.status})`);

                return response.arrayBuffer();
            })
            .catch((error) => {
                this.data = null;
                throw error;
            });

        return this.data;
    }

    unlock() {
        if (!this.supported) return;

        if (!this.context) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;

            this.context = new AudioContext();
            this.gain = this.context.createGain();
            this.gain.gain.value = 0;
            this.gain.connect(this.context.destination);
        }

        if (this.context.state === 'suspended' && !document.hidden) this.context.resume().catch(() => {});
    }

    decode() {
        this.buffer ??= this.preload()
            .then((data) => this.context.decodeAudioData(data.slice(0)))
            .catch((error) => {
                this.buffer = null;
                throw error;
            });

        return this.buffer;
    }

    async play() {
        this.wanted = true;

        if (!this.enabled || !this.context) return;

        if (this.source) {
            this.fadeTo(this.volume);

            return;
        }

        try {
            const buffer = await this.decode();

            if (!this.wanted || !this.enabled || this.source) return;

            const source = this.context.createBufferSource();

            source.buffer = buffer;
            source.loop = true;
            source.connect(this.gain);
            source.start();

            this.source = source;
            this.startedAt = this.context.currentTime;
            this.fadeTo(this.volume);
            this.onChange?.(this);
        } catch (error) {
            console.error(error);
        }
    }

    stop() {
        this.wanted = false;
        this.halt();
    }

    halt() {
        if (!this.source) return;

        const source = this.source;

        this.source = null;
        this.fadeTo(0);
        source.stop(this.context.currentTime + this.fade);
        this.onChange?.(this);
    }

    fadeTo(value) {
        const param = this.gain.gain;
        const now = this.context.currentTime;

        param.cancelScheduledValues(now);
        param.setValueAtTime(param.value, now);
        param.linearRampToValueAtTime(value, now + this.fade);
    }

    setEnabled(enabled) {
        this.enabled = enabled;
        writePreference(enabled);

        if (!enabled) {
            this.halt();
        } else if (this.wanted) {
            this.unlock();
            this.play();
        }

        this.onChange?.(this);
    }

    updateVisibility() {
        if (!this.context) return;

        if (document.hidden) {
            this.context.suspend().catch(() => {});
        } else if (this.source) {
            this.context.resume().catch(() => {});
        }
    }

    dispose() {
        document.removeEventListener('visibilitychange', this.handleVisibility);
        this.source?.stop();
        this.context?.close();
    }
}
