import gsap from 'gsap';

import './styles/materiales.scss';
import materialesConfig from './config/materiales.config.js';
import Backdrop from './ui/Backdrop.js';

/**
 * Página de descarga de materiales (materiales.html).
 *
 * El listado sale de src/config/materiales.config.js. La cabecera, el fondo y
 * el footer son los mismos componentes (BEM) que la web principal.
 */
class MaterialsPage {
    constructor(config) {
        this.config = config;
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

    /** Nombre del archivo para el atributo download (solo archivos propios). */
    static fileName(file) {
        if (/^https?:\/\//.test(file)) return null;

        return file.split('/').pop();
    }

    renderItem(item) {
        const esc = MaterialsPage.escape;
        const fileName = MaterialsPage.fileName(item.file);
        const external = !fileName;
        const meta = [item.format, item.size].filter(Boolean).join(' · ');
        const preview = item.preview
            ? `<img class="materials__preview-image" src="${esc(item.preview)}" alt="" loading="lazy" decoding="async" />`
            : `<span class="materials__preview-format">${esc(item.format)}</span>`;

        return `
            <li class="materials__item">
                <a
                    class="materials__card"
                    href="${esc(item.file)}"
                    ${external ? 'target="_blank" rel="noopener noreferrer"' : `download="${esc(fileName)}"`}
                >
                    <span class="materials__preview" aria-hidden="true">${preview}</span>
                    <span class="materials__info">
                        <span class="materials__name">${esc(item.title)}</span>
                        ${meta ? `<span class="materials__meta">${esc(meta)}</span>` : ''}
                    </span>
                    <span class="materials__action">
                        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                            <path d="M12 4v11m0 0l-4.5-4.5M12 15l4.5-4.5M5 19h14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
                        </svg>
                        Descargar<span class="u-visually-hidden"> ${esc(item.title)} (${esc(meta)})</span>
                    </span>
                </a>
            </li>`;
    }

    render() {
        const esc = MaterialsPage.escape;
        const { sections = [] } = this.config;

        if (!sections.length) {
            this.list.innerHTML = '<p class="materials__empty">Próximamente.</p>';

            return;
        }

        this.list.innerHTML = sections
            .map(
                (section, index) => `
                <section class="materials__section" aria-labelledby="materials-section-${index}">
                    <h2 class="materials__section-title" id="materials-section-${index}">${esc(section.title)}</h2>
                    <ul class="materials__grid" role="list">
                        ${section.items.map((item) => this.renderItem(item)).join('')}
                    </ul>
                </section>`
            )
            .join('');
    }

    animate() {
        this.backdrop.update('home');

        if (this.reducedMotion) return;

        const timeline = gsap.timeline({ defaults: { ease: 'expo.out' } });

        timeline
            .from('.site-header__brand, .site-header__title', {
                opacity: 0,
                y: -18,
                duration: 1.2,
                stagger: 0.12
            })
            .from(
                '.materials__head > *',
                { opacity: 0, y: 24, duration: 1, stagger: 0.08, clearProps: 'transform' },
                0.2
            )
            .from(
                '.materials__section-title, .materials__item',
                { opacity: 0, y: 28, duration: 1, stagger: 0.06, clearProps: 'transform' },
                0.35
            )
            .from('.site-footer', { opacity: 0, duration: 1 }, 0.6);
    }
}

new MaterialsPage(materialesConfig);
