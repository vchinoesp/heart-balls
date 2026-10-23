import gsap from 'gsap';

import './styles/materiales.scss';
import materiales from './config/materiales.config.js';
import Backdrop from './ui/Backdrop.js';

class MaterialsPage {
    static FOLDER = '/materiales/';

    constructor(items) {
        this.items = items;
        this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        this.list = document.querySelector('[data-materials]');
        this.backdrop = new Backdrop(document.querySelector('.backdrop'), {
            reducedMotion: this.reducedMotion
        });

        this.render();
        this.animate();
    }

    static escape(value = '') {
        return String(value).replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`);
    }

    static isExternal(url) {
        return /^https?:\/\//.test(url);
    }

    static href(url) {
        return MaterialsPage.isExternal(url) ? url : MaterialsPage.FOLDER + encodeURIComponent(url);
    }

    static format(url) {
        const extension = url.split('?')[0].split('.').pop();

        return extension && extension !== url ? extension.toUpperCase() : '';
    }

    renderItem({ titulo, url }) {
        const esc = MaterialsPage.escape;
        const external = MaterialsPage.isExternal(url);
        const format = MaterialsPage.format(url);
        const linkAttributes = external
            ? 'target="_blank" rel="noopener noreferrer"'
            : `download="${esc(url)}"`;

        return `
            <li class="materials__item">
                <span class="materials__name">${esc(titulo)}</span>
                <a class="materials__download" href="${esc(MaterialsPage.href(url))}" ${linkAttributes}>
                    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                        <path d="M12 4v11m0 0l-4.5-4.5M12 15l4.5-4.5M5 19h14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
                    </svg>
                    Descargar<span class="u-visually-hidden"> ${esc(titulo)}${format ? ` (${esc(format)})` : ''}</span>
                </a>
            </li>`;
    }

    render() {
        if (!this.items.length) {
            this.list.innerHTML = '<p class="materials__empty">Próximamente.</p>';

            return;
        }

        this.list.innerHTML = `
            <ul class="materials__items" role="list">
                ${this.items.map((item) => this.renderItem(item)).join('')}
            </ul>`;
    }

    animate() {
        this.backdrop.update('home');

        if (this.reducedMotion) return;

        gsap.timeline({ defaults: { ease: 'expo.out' } })
            .from('.site-header__brand, .site-header__title', {
                opacity: 0,
                y: -18,
                duration: 1.2,
                stagger: 0.12
            })
            .from('.materials__title', { opacity: 0, y: 24, duration: 1, clearProps: 'transform' }, 0.2)
            .from(
                '.materials__item',
                { opacity: 0, y: 20, duration: 0.9, stagger: 0.05, clearProps: 'transform' },
                0.35
            )
            .from('.site-footer', { opacity: 0, duration: 1 }, 0.6);
    }
}

new MaterialsPage(materiales);
