import gsap from 'gsap';

/**
 * BallFx
 *
 * Anima (con GSAP) los uniforms de interacción de BallMaterial:
 * posición suavizada del puntero, intensidad de repulsión, hover y selección.
 * Todo el movimiento de las bolas ocurre en el vertex shader.
 */
export default class BallFx {
    constructor(uniforms, { reducedMotion = false } = {}) {
        this.uniforms = uniforms;
        this.reducedMotion = reducedMotion;
        this.hoverIndex = -1;

        const pointer = uniforms.uPointer.value;
        const follow = { duration: 0.35, ease: 'power3.out' };

        this.pointerX = gsap.quickTo(pointer, 'x', follow);
        this.pointerY = gsap.quickTo(pointer, 'y', follow);
        this.pointerZ = gsap.quickTo(pointer, 'z', follow);

        if (reducedMotion) {
            uniforms.uRepelPush.value = 0;
            uniforms.uRepelLift.value = 0;
            uniforms.uHoverLift.value *= 0.5;
        }
    }

    /** Punto en espacio local del mesh. `snap` evita que viaje desde lejos. */
    setPointer(point, snap = false) {
        if (snap) {
            this.uniforms.uPointer.value.copy(point);
            this.pointerX(point.x, point.x);
            this.pointerY(point.y, point.y);
            this.pointerZ(point.z, point.z);

            return;
        }

        this.pointerX(point.x);
        this.pointerY(point.y);
        this.pointerZ(point.z);
    }

    setRepel(active) {
        gsap.to(this.uniforms.uRepel, {
            value: active ? 1 : 0,
            duration: active ? 0.5 : 0.9,
            ease: 'power2.out',
            overwrite: true
        });
    }

    setHover(index) {
        if (index === this.hoverIndex) return;

        const u = this.uniforms;

        // La bola anterior baja suavemente mientras sube la nueva
        u.uPrevHoverId.value = u.uHoverId.value;
        u.uPrevHover.value = u.uHover.value;
        gsap.to(u.uPrevHover, {
            value: 0,
            duration: 0.45,
            ease: 'power2.out',
            overwrite: true
        });

        this.hoverIndex = index;
        u.uHoverId.value = index;
        u.uHover.value = 0;

        if (index < 0) return;

        gsap.to(u.uHover, {
            value: 1,
            duration: this.reducedMotion ? 0.01 : 0.5,
            ease: 'expo.out',
            overwrite: true
        });
    }

    /** La bola elegida se encoge y "sale" del corazón hacia el popup. */
    select(index) {
        const u = this.uniforms;

        this.setHover(-1);
        u.uSelectedId.value = index;

        return gsap.to(u.uSelectedScale, {
            value: 0,
            duration: this.reducedMotion ? 0.01 : 0.45,
            ease: 'power2.in',
            overwrite: true
        });
    }

    /** Devuelve la bola a su hueco con un pequeño rebote. */
    restore() {
        const u = this.uniforms;

        return gsap.to(u.uSelectedScale, {
            value: 1,
            duration: this.reducedMotion ? 0.01 : 1.1,
            ease: 'elastic.out(1, 0.55)',
            overwrite: true,
            onComplete: () => {
                u.uSelectedId.value = -1;
            }
        });
    }

    dispose() {
        const u = this.uniforms;

        gsap.killTweensOf([u.uPointer.value, u.uRepel, u.uHover, u.uPrevHover, u.uSelectedScale]);
    }
}
