import gsap from 'gsap';

export default class SoundToggle {
    constructor(root, { reducedMotion = false, onToggle } = {}) {
        this.root = root;
        this.reducedMotion = reducedMotion;
        this.bars = [...root.querySelectorAll('.sound-toggle__bar')];

        gsap.set(this.bars, { transformOrigin: '50% 100%', scaleY: 0.25 });

        root.addEventListener('click', () => onToggle?.());
    }

    update({ enabled, playing }) {
        this.root.setAttribute('aria-pressed', String(enabled));
        this.root.classList.toggle('sound-toggle--off', !enabled);
        this.animate(enabled && playing);
    }

    animate(active) {
        if (active === this.active) return;

        this.active = active;
        this.stopLoops();

        if (!active || this.reducedMotion) {
            gsap.to(this.bars, {
                scaleY: active ? 0.7 : 0.25,
                duration: 0.4,
                ease: 'power2.out',
                overwrite: true
            });

            return;
        }

        this.loops = this.bars.map((bar, index) =>
            gsap
                .timeline({ repeat: -1, delay: index * 0.12 })
                .to(bar, { scaleY: 1, duration: 0.32 + index * 0.05, ease: 'power2.inOut' })
                .to(bar, { scaleY: 0.35, duration: 0.28 + index * 0.04, ease: 'power2.inOut' })
        );
    }

    stopLoops() {
        this.loops?.forEach((loop) => loop.kill());
        this.loops = null;
    }

    dispose() {
        this.stopLoops();
    }
}
