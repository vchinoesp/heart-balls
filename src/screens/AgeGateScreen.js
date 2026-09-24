import gsap from 'gsap';

import Screen from './Screen.js';

/**
 * AgeGateScreen
 *
 * "¿Tienes más de 18 años?"
 *  - Sí: continúa (onAccept).
 *  - No: muestra "Lo sentimos, no cumples con la edad." y lo retira pasados
 *    unos segundos (gsap.delayedCall, nada de setTimeout).
 */
export default class AgeGateScreen extends Screen {
    constructor(root, { reducedMotion, messageDuration = 4.5, onAccept }) {
        super(root, { reducedMotion });

        this.messageDuration = messageDuration;
        this.onAccept = onAccept;
        this.message = root.querySelector('.age-gate__message');

        root.addEventListener('click', (event) => {
            const answer = event.target.closest('[data-age]')?.dataset.age;

            if (answer === 'yes') this.accept();
            if (answer === 'no') this.reject();
        });
    }

    accept() {
        this.hideMessage(true);
        this.onAccept?.();
    }

    reject() {
        this.hideCall?.kill();

        this.message.textContent = 'Lo sentimos, no cumples con la edad.';

        gsap.fromTo(
            this.message,
            { opacity: 0, y: 10 },
            { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out', overwrite: true }
        );

        this.hideCall = gsap.delayedCall(this.messageDuration, () => this.hideMessage());
    }

    hideMessage(immediate = false) {
        this.hideCall?.kill();

        gsap.to(this.message, {
            opacity: 0,
            y: -6,
            duration: immediate ? 0.01 : 0.6,
            ease: 'power2.inOut',
            overwrite: true,
            onComplete: () => {
                this.message.textContent = '';
            }
        });
    }
}
