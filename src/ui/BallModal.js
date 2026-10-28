import gsap from 'gsap';

import HeroBall from './HeroBall.js';
import StoreFinder from './StoreFinder.js';
import TicketsFan from './TicketsFan.js';

export default class BallModal {
    constructor({ root, links = {}, reducedMotion = false, ball, onClose }) {
        this.root = root;
        this.ball = ball;
        this.links = links;
        this.reducedMotion = reducedMotion;
        this.onClose = onClose;
        this.isOpen = false;

        this.panel = root.querySelector('.ball-modal__panel');
        this.stage = root.querySelector('.ball-modal__stage');
        this.canvas = root.querySelector('.ball-modal__canvas');
        this.shadow = root.querySelector('.ball-modal__shadow');
        this.numberText = root.querySelector('[data-ball-number]');
        this.buyLink = root.querySelector('[data-action="buy"]');
        this.searchButton = root.querySelector('[data-action="search"]');

        if (!links.buy) this.buyLink.hidden = true;

        this.tickets = new TicketsFan(root.querySelector('.tickets--popup'), { reducedMotion });
        this.finder = new StoreFinder(root.querySelector('.store-finder'), { reducedMotion, container: this.panel });

        this.views = {
            ball: {
                title: root.querySelector('.ball-modal__title:not(.ball-modal__title--search)'),
                body: root.querySelector('.ball-modal__actions')
            },
            search: {
                title: root.querySelector('.ball-modal__title--search'),
                body: root.querySelector('.store-finder')
            }
        };
        this.view = 'ball';

        this.content = [
            this.views.ball.title,
            ...root.querySelectorAll('.ball-modal__actions > :not([hidden])')
        ];

        this.prefetchStores = () => this.finder.prepare().catch(() => {});
        this.searchButton.addEventListener('pointerenter', this.prefetchStores, { once: true });
        this.searchButton.addEventListener('focus', this.prefetchStores, { once: true });

        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.handleClick = this.handleClick.bind(this);
        this.handleResize = () => this.hero?.resize();

        root.addEventListener('click', this.handleClick);
    }

    open({ number }) {
        if (this.isOpen) return;

        this.isOpen = true;
        this.number = number;
        this.returnFocus = document.activeElement;

        const formatted = HeroBall.format(number);

        this.numberText.textContent = `Tu número: ${formatted}`;
        this.buyLink.dataset.number = formatted;

        if (this.links.buy) {
            this.buyLink.href = this.links.buy.replace('{number}', String(number).padStart(5, '0'));
        }

        this.setView('ball');
        this.finder.reset();

        this.root.hidden = false;
        document.documentElement.classList.add('has-modal');
        document.addEventListener('keydown', this.handleKeyDown);
        window.addEventListener('resize', this.handleResize);

        this.createHero();

        const duration = this.reducedMotion ? 0.01 : 0.6;

        gsap.fromTo(this.root, { opacity: 0 }, { opacity: 1, duration: duration * 0.7, ease: 'power2.out' });
        gsap.fromTo(
            this.panel,
            { y: 40, scale: 0.96 },
            { y: 0, scale: 1, duration, ease: 'expo.out' }
        );
        gsap.fromTo(
            this.shadow,
            { scaleX: 0.3, autoAlpha: 0 },
            { scaleX: 1, autoAlpha: 1, duration: this.reducedMotion ? 0.01 : 1.4, ease: 'expo.out', delay: duration * 0.3 }
        );

        if (!this.reducedMotion) {
            gsap.fromTo(
                this.content,
                { opacity: 0, y: 18 },
                { opacity: 1, y: 0, duration: 0.9, ease: 'expo.out', stagger: 0.07, delay: 0.15, clearProps: 'transform' }
            );
        }

        this.hero.open(number);
        this.tickets.open({ delay: 0.35 });

        this.root.querySelector('.ball-modal__actions [data-action]:not([hidden])')?.focus({ preventScroll: true });
    }

    createHero() {
        this.hero ??= new HeroBall(this.canvas, { reducedMotion: this.reducedMotion, ball: this.ball });
    }

    prewarm() {
        this.createHero();
        this.hero.prewarm();
    }

    close({ another = false } = {}) {
        if (!this.isOpen) return;

        this.isOpen = false;
        document.removeEventListener('keydown', this.handleKeyDown);
        window.removeEventListener('resize', this.handleResize);

        const duration = this.reducedMotion ? 0.01 : 0.4;

        this.viewTimeline?.kill();
        gsap.to(this.panel, { y: 24, scale: 0.97, duration, ease: 'power2.in' });
        gsap.to(this.root, {
            opacity: 0,
            duration,
            ease: 'power2.in',
            onComplete: () => {
                this.root.hidden = true;
                this.hero.close();
                document.documentElement.classList.remove('has-modal');
            }
        });

        this.returnFocus?.focus?.({ preventScroll: true });
        this.onClose?.({ another });
    }

    handleClick(event) {
        const action = event.target.closest('[data-action]')?.dataset.action;

        if (action === 'close') this.close();
        if (action === 'another') this.close({ another: true });
        if (action === 'search') this.showView('search');
        if (action === 'search-back') this.showView('ball');

        if (event.target === this.root) this.close();
    }

    setView(name) {
        const leaving = name === 'search' ? this.views.ball : this.views.search;
        const entering = this.views[name];

        this.viewTimeline?.kill();
        gsap.set([this.panel, this.stage, leaving.title, leaving.body, entering.title, entering.body], {
            clearProps: 'height,overflow,opacity,transform'
        });

        leaving.title.hidden = true;
        leaving.body.hidden = true;
        entering.title.hidden = false;
        entering.body.hidden = false;

        this.view = name;
        this.panel.dataset.view = name;
        this.root.setAttribute('aria-labelledby', entering.title.id);
    }

    showView(name) {
        if (!this.isOpen || this.view === name) return;

        if (name === 'search') this.prefetchStores();

        const leaving = name === 'search' ? this.views.ball : this.views.search;
        const entering = this.views[name];
        const focusTarget = name === 'search' ? this.finder.input : this.searchButton;
        const quick = this.reducedMotion;

        this.viewTimeline?.kill();

        this.viewTimeline = gsap
            .timeline()
            .to([leaving.title, leaving.body, this.stage], {
                opacity: 0,
                y: quick ? 0 : -10,
                duration: quick ? 0.01 : 0.28,
                ease: 'power2.in',
                stagger: quick ? 0 : 0.04
            })
            .add(() => {
                const from = this.panel.offsetHeight;

                this.setView(name);
                this.hero.resize();

                const to = this.panel.offsetHeight;

                gsap.set([entering.title, entering.body, this.stage], { opacity: 0 });
                focusTarget.focus({ preventScroll: true });

                if (!quick) this.hero.open(this.number);

                gsap.timeline()
                    .fromTo(
                        this.panel,
                        { height: from, overflow: 'hidden' },
                        {
                            height: to,
                            duration: quick ? 0.01 : 0.7,
                            ease: 'expo.out',
                            clearProps: 'height,overflow'
                        }
                    )
                    .fromTo(
                        [entering.title, this.stage, entering.body],
                        { opacity: 0, y: quick ? 0 : 16 },
                        {
                            opacity: 1,
                            y: 0,
                            duration: quick ? 0.01 : 0.8,
                            ease: 'expo.out',
                            stagger: quick ? 0 : 0.08,
                            clearProps: 'opacity,transform'
                        },
                        quick ? 0 : 0.1
                    );
            });
    }

    handleKeyDown(event) {
        if (event.key === 'Escape') {
            event.preventDefault();
            this.close();

            return;
        }

        if (event.key === 'Tab') this.trapFocus(event);
    }

    trapFocus(event) {
        const focusable = [
            ...this.root.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), [tabindex="0"]')
        ].filter((element) => element.offsetParent !== null);

        if (!focusable.length) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
        }
    }

    dispose() {
        this.root.removeEventListener('click', this.handleClick);
        this.finder.dispose();
        document.removeEventListener('keydown', this.handleKeyDown);
        this.hero?.dispose();
    }
}
