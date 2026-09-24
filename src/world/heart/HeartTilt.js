import gsap from 'gsap';

/**
 * HeartTilt
 *
 * Inclinación sutil del corazón siguiendo al puntero (parallax 3D).
 * gsap.quickTo interpola con power3.out: sin saltos aunque el puntero sea brusco.
 * Desactivado con prefers-reduced-motion.
 */
export default class HeartTilt {
    constructor(target, { maxX = 0.12, maxY = 0.22 } = {}) {
        this.target = target;
        this.maxX = maxX;
        this.maxY = maxY;

        this.motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

        this.rotateX = gsap.quickTo(this.target.rotation, 'x', {
            duration: 1.4,
            ease: 'power3.out'
        });
        this.rotateY = gsap.quickTo(this.target.rotation, 'y', {
            duration: 1.4,
            ease: 'power3.out'
        });

        this.onPointerMove = this.onPointerMove.bind(this);
        this.onPointerLeave = this.onPointerLeave.bind(this);

        window.addEventListener('pointermove', this.onPointerMove, { passive: true });
        document.documentElement.addEventListener('pointerleave', this.onPointerLeave);
    }

    onPointerMove(event) {
        if (this.motionQuery.matches) return;

        const x = (event.clientX / window.innerWidth) * 2 - 1;
        const y = (event.clientY / window.innerHeight) * 2 - 1;

        this.rotateY(x * this.maxY);
        this.rotateX(y * this.maxX);
    }

    onPointerLeave() {
        this.rotateX(0);
        this.rotateY(0);
    }

    dispose() {
        window.removeEventListener('pointermove', this.onPointerMove);
        document.documentElement.removeEventListener('pointerleave', this.onPointerLeave);
        gsap.killTweensOf(this.target.rotation);
    }
}
