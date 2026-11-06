import Screen from './Screen.js';

export default class HeartScreen extends Screen {
    constructor(root, options) {
        super(root, options);

        this.help = root.querySelector('.heart-help');
        this.soundToggle = root.querySelector('.sound-toggle');
    }

    get animated() {
        return [this.help, this.soundToggle];
    }

    get focusTarget() {
        return document.querySelector('.webgl');
    }

    getReservedBottom() {
        const rect = this.help.getBoundingClientRect();

        return window.innerHeight - rect.top;
    }
}
