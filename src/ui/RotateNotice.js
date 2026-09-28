import gsap from 'gsap';

/**
 * RotateNotice
 *
 * Móvil en horizontal (alto < 450 px): la experiencia no cabe, así que se
 * muestra una pantalla "Para una mejor experiencia gira tu móvil" con un
 * icono de móvil girando. Solo en pantallas táctiles (pointer: coarse), para
 * no bloquear una ventana de escritorio baja.
 *
 * Mientras está visible:
 *  - el resto de la web queda `inert` (ni foco ni lector de pantalla)
 *  - se avisa con onChange(true) para pausar el render WebGL (batería)
 * Al volver a vertical, todo sigue exactamente donde estaba.
 */
export default class RotateNotice {
    static QUERY = '(orientation: landscape) and (max-height: 449.98px) and (pointer: coarse)';

    constructor(root, { blocked = [], reducedMotion = false, onChange } = {}) {
        this.root = root;
        this.blocked = blocked.filter(Boolean);
        this.reducedMotion = reducedMotion;
        this.onChange = onChange;

        this.phone = root.querySelector('.rotate-notice__phone');
        this.message = root.querySelector('.rotate-notice__text');
        this.active = false;

        this.media = window.matchMedia(RotateNotice.QUERY);
        this.handleChange = () => this.update();
        this.media.addEventListener('change', this.handleChange);

        gsap.set(this.phone, { svgOrigin: '40 36' });
        this.update({ immediate: true });
    }

    update({ immediate = false } = {}) {
        const active = this.media.matches;

        if (active === this.active) return;

        this.active = active;

        if (active) this.open(immediate);
        else this.close(immediate);

        this.onChange?.(active);
    }

    open(immediate) {
        this.returnFocus = document.activeElement;
        this.blocked.forEach((element) => {
            element.inert = true;
        });

        this.root.hidden = false;
        gsap.fromTo(
            this.root,
            { opacity: 0 },
            { opacity: 1, duration: immediate || this.reducedMotion ? 0 : 0.4, ease: 'power2.out', overwrite: true }
        );

        this.message.focus({ preventScroll: true });
        this.playIcon();
    }

    close(immediate) {
        this.loop?.kill();
        this.blocked.forEach((element) => {
            element.inert = false;
        });

        gsap.to(this.root, {
            opacity: 0,
            duration: immediate || this.reducedMotion ? 0 : 0.3,
            ease: 'power2.in',
            overwrite: true,
            onComplete: () => {
                this.root.hidden = true;
            }
        });

        if (this.returnFocus?.isConnected) this.returnFocus.focus({ preventScroll: true });
    }

    /** El móvil del icono pasa de horizontal a vertical, en bucle. */
    playIcon() {
        this.loop?.kill();

        if (this.reducedMotion) {
            gsap.set(this.phone, { rotation: 0 });

            return;
        }

        this.loop = gsap
            .timeline({ repeat: -1, repeatDelay: 0.8 })
            .set(this.phone, { rotation: -90 })
            .to(this.phone, { rotation: 0, duration: 1.1, ease: 'expo.inOut', delay: 0.5 })
            .to(this.phone, { rotation: -90, duration: 0.6, ease: 'power2.inOut', delay: 1.2 });
    }

    dispose() {
        this.loop?.kill();
        this.media.removeEventListener('change', this.handleChange);
    }
}
