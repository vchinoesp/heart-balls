export default class Sizes {
    constructor() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;

        window.addEventListener('resize', () => {
            this.width = window.innerWidth;
            this.height = window.innerHeight;

            window.dispatchEvent(
                new CustomEvent('sizes:resize')
            );
        });
    }
}