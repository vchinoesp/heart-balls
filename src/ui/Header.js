import gsap from 'gsap';

export default class Header {
    constructor(root, { reducedMotion = false, onWatch, onBack }) {
        this.root = root;
        this.reducedMotion = reducedMotion;

        this.brand = root.querySelector('.site-header__brand');
        this.title = root.querySelector('.site-header__title');
        this.titleLogo = root.querySelector('.site-header__title-logo');
        this.actions = root.querySelector('.site-header__actions');
        this.watch = root.querySelector('.site-header__watch');
        this.back = root.querySelector('.site-header__back');

        this.watch.addEventListener('click', () => onWatch?.());
        this.back.addEventListener('click', () => onBack?.());

        gsap.set([this.brand, this.title], { opacity: 0 });
        gsap.set(this.title, { transformOrigin: '50% 0%' });
        this.setAction(this.watch, false, true);
        this.setAction(this.back, false, true);

        this.revealed = false;
        this.compact = false;
    }

    get compactScale() {
        return window.innerWidth < 768 ? 0.62 : 0.48;
    }

    reveal() {
        if (this.revealed) return;

        this.revealed = true;

        gsap.fromTo(
            [this.title, this.brand],
            { opacity: 0, y: this.reducedMotion ? 0 : -18 },
            { opacity: 1, y: 0, duration: 1.4, ease: 'expo.out', stagger: 0.15 }
        );
    }

    static watchVisibleOn(screen) {
        return screen === 'home' || screen === 'heart';
    }

    static backVisibleOn(screen) {
        return screen === 'heart' || screen === 'video';
    }

    static layoutFor(screen) {
        return screen === 'video' ? 'back-only' : 'default';
    }

    hide(nextScreen) {
        const layoutChanges = this.actions.dataset.layout !== Header.layoutFor(nextScreen);
        const leaving = [];

        if (!Header.watchVisibleOn(nextScreen)) leaving.push(this.watch);
        if (!Header.backVisibleOn(nextScreen) || layoutChanges) leaving.push(this.back);

        const visible = leaving.filter((element) => Number(gsap.getProperty(element, 'opacity')) > 0);

        if (!visible.length) return Promise.resolve();

        visible.forEach((element) => {
            element.inert = true;
        });

        return gsap
            .to(visible, {
                autoAlpha: 0,
                x: this.reducedMotion ? 0 : 12,
                duration: 0.35,
                ease: 'power2.in',
                overwrite: true
            })
            .then();
    }

    show(screen) {
        this.reveal();
        this.actions.dataset.layout = Header.layoutFor(screen);
        this.setVideoLayout(screen === 'video');
        this.setCompact(screen === 'heart');
        this.setAction(this.watch, Header.watchVisibleOn(screen));
        this.setAction(this.back, Header.backVisibleOn(screen));
    }

    setVideoLayout(active) {
        if (active === this.root.classList.contains('site-header--video')) return;

        const before = this.titleLogo.getBoundingClientRect().width;

        this.root.classList.toggle('site-header--video', active);

        const after = this.titleLogo.offsetWidth;
        const targetScale = this.compact ? this.compactScale : 1;

        if (!before || !after || Math.abs(before - after * targetScale) < 1) return;

        gsap.fromTo(
            this.title,
            { scale: before / after },
            {
                scale: targetScale,
                duration: this.reducedMotion ? 0.01 : 1.1,
                ease: 'expo.inOut',
                overwrite: 'auto'
            }
        );
    }

    setCompact(compact) {
        if (compact === this.compact) return;

        this.compact = compact;

        gsap.to(this.title, {
            scale: compact ? this.compactScale : 1,
            duration: this.reducedMotion ? 0.01 : 1.1,
            ease: 'expo.inOut',
            overwrite: 'auto'
        });
    }

    getCompactBottom() {
        const titleTop = this.title.offsetTop;
        const titleBottom = titleTop + this.title.offsetHeight * this.compactScale;
        const brandBottom = this.brand.getBoundingClientRect().bottom;
        const wide = window.innerWidth / window.innerHeight > 1.2;
        const actionsBottom = wide ? 0 : this.actions.getBoundingClientRect().bottom;

        return Math.max(titleBottom, brandBottom, actionsBottom);
    }

    setAction(element, visible, immediate = false) {
        element.inert = !visible;

        const current = Number(gsap.getProperty(element, 'opacity'));

        if (!immediate && ((visible && current === 1) || (!visible && current === 0))) return;

        gsap.to(element, {
            autoAlpha: visible ? 1 : 0,
            x: visible || this.reducedMotion ? 0 : 12,
            duration: immediate ? 0 : visible ? 0.9 : 0.35,
            delay: visible && !immediate ? 0.1 : 0,
            ease: visible ? 'expo.out' : 'power2.in',
            overwrite: true
        });
    }
}
