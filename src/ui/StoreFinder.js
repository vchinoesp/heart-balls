import gsap from 'gsap';

import PointsOfSale from '../utils/PointsOfSale.js';

const DATA = {
    points: '/data/puntos-venta.json',
    postalCodes: '/data/codigos-postales.json'
};

const MESSAGES = {
    invalid: 'Introduce un código postal de 5 dígitos.',
    loading: 'Buscando puntos de venta…',
    unknown: 'No encontramos ese código postal. Revisa que sea correcto.',
    error: 'No se han podido cargar los puntos de venta. Inténtalo de nuevo.'
};

export default class StoreFinder {
    constructor(root, { reducedMotion = false, container = root } = {}) {
        this.root = root;
        this.container = container;
        this.reducedMotion = reducedMotion;

        this.form = root.querySelector('.store-finder__form');
        this.input = root.querySelector('.store-finder__input');
        this.status = root.querySelector('.store-finder__status');
        this.results = root.querySelector('.store-finder__results');
        this.rows = root.querySelector('.store-finder__rows');

        this.handleSubmit = this.handleSubmit.bind(this);
        this.handleInput = () => this.setInvalid(false);

        this.form.addEventListener('submit', this.handleSubmit);
        this.input.addEventListener('input', this.handleInput);
    }

    prepare() {
        this.loading ??= PointsOfSale.load(DATA).catch((error) => {
            this.loading = null;
            throw error;
        });

        return this.loading;
    }

    focus() {
        this.input.focus({ preventScroll: true });
    }

    reset() {
        this.searchId = (this.searchId ?? 0) + 1;
        this.form.reset();
        this.setInvalid(false);
        this.setStatus('');
        this.results.hidden = true;
        this.rows.replaceChildren();
    }

    async handleSubmit(event) {
        event.preventDefault();

        const postalCode = this.input.value.trim();

        if (!PointsOfSale.isPostalCode(postalCode)) {
            this.setInvalid(true);
            this.setStatus(MESSAGES.invalid);
            this.focus();

            return;
        }

        const searchId = (this.searchId ?? 0) + 1;

        this.searchId = searchId;
        this.setInvalid(false);
        this.setStatus(MESSAGES.loading);
        this.results.setAttribute('aria-busy', 'true');

        try {
            const pointsOfSale = await this.prepare();

            if (searchId !== this.searchId) return;

            this.show(postalCode, pointsOfSale.search(postalCode));
        } catch (error) {
            if (searchId !== this.searchId) return;

            console.error(error);
            this.setStatus(MESSAGES.error);
            this.results.hidden = true;
        } finally {
            this.results.removeAttribute('aria-busy');
        }
    }

    show(postalCode, { match, results }) {
        const from = this.container.offsetHeight;

        this.rows.replaceChildren(...results.map((point) => StoreFinder.createRow(point)));
        this.results.hidden = !results.length;
        this.results.scrollTop = 0;
        this.setStatus(StoreFinder.summary(postalCode, match, results.length));

        if (this.reducedMotion) return;

        const to = this.container.offsetHeight;

        if (from !== to) {
            gsap.fromTo(
                this.container,
                { height: from, overflow: 'hidden' },
                { height: to, duration: 0.6, ease: 'expo.out', overwrite: 'auto', clearProps: 'height,overflow' }
            );
        }

        if (!results.length) return;

        gsap.fromTo(
            this.rows.children,
            { opacity: 0, y: 10 },
            { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out', stagger: 0.04, clearProps: 'opacity,transform' }
        );
    }

    static summary(postalCode, match, count) {
        if (match === 'unknown') return MESSAGES.unknown;

        if (match === 'nearby') {
            return `No hay puntos de venta en el ${postalCode}. Te mostramos los más cercanos.`;
        }

        return count === 1
            ? `1 punto de venta en el ${postalCode}.`
            : `${count} puntos de venta en el ${postalCode}.`;
    }

    static createRow({ address, postalCode, town }) {
        const row = document.createElement('tr');

        row.className = 'store-finder__row';
        row.setAttribute('role', 'row');

        [
            ['address', address],
            ['postal-code', postalCode],
            ['town', town]
        ].forEach(([modifier, text]) => {
            const cell = document.createElement('td');

            cell.className = `store-finder__cell store-finder__cell--${modifier}`;
            cell.setAttribute('role', 'cell');
            cell.textContent = text;
            row.append(cell);
        });

        return row;
    }

    setStatus(text) {
        this.status.textContent = text;
    }

    setInvalid(invalid) {
        if (invalid) {
            this.input.setAttribute('aria-invalid', 'true');
        } else {
            this.input.removeAttribute('aria-invalid');
        }
    }

    dispose() {
        this.form.removeEventListener('submit', this.handleSubmit);
        this.input.removeEventListener('input', this.handleInput);
    }
}
