export default class Sizes {
    constructor() {
        this.update();

        this.onResize = () => {
            this.update();
            window.dispatchEvent(new CustomEvent('sizes:resize'));
        };

        window.addEventListener('resize', this.onResize);
    }

    update() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        // Máx. 2: en iPhone (DPR 3) renderizar a 3x no compensa el coste
        this.pixelRatio = Math.min(window.devicePixelRatio, 2);
    }

    dispose() {
        window.removeEventListener('resize', this.onResize);
    }
}
