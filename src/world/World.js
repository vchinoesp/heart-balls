import Environment from './Environment.js';
import HeartBalls from './heart/HeartBalls.js';
import HeartLayout from './heart/HeartLayout.js';
import BallFx from './heart/BallFx.js';

/**
 * World
 *
 * Orquesta el contenido 3D: entorno + corazón de bolas.
 * - Producción: carga el layout precalculado (public/data/heart-layout.bin).
 * - #debug: genera el layout en vivo y permite ajustar forma/empaquetado.
 */
export default class World {
    constructor({ scene, renderer, debug, config, isMobile, reducedMotion }) {
        this.scene = scene;
        this.debug = debug;
        this.config = config;

        this.environment = new Environment(scene, renderer, debug);

        this.heartBalls = new HeartBalls(scene, config, {
            detail: isMobile ? 3 : 4
        });

        // Repulsión / hover / selección (uniforms del shader animados con GSAP)
        this.fx = new BallFx(this.heartBalls.material.uniforms, {
            reducedMotion,
            pointerSmoothing: config.interaction.pointerSmoothing
        });
    }

    async init() {
        const layout = await this.loadLayout();

        this.heartBalls.setLayout(layout);
        this.setDebug();

        window.dispatchEvent(
            new CustomEvent('world:ready', { detail: { count: layout.count } })
        );
    }

    async loadLayout() {
        if (!this.debug.active) {
            try {
                return await HeartLayout.load(
                    `${import.meta.env?.BASE_URL ?? '/'}data/heart-layout.bin`
                );
            } catch {
                // Sin layout precalculado: lo generamos en el momento
            }
        }

        return HeartLayout.generate(this.config);
    }

    regenerate() {
        const start = performance.now();
        const layout = HeartLayout.generate(this.config);

        this.heartBalls.setLayout(layout);
        this.stats.count = layout.count;
        this.stats.ms = Math.round(performance.now() - start);
    }

    setDebug() {
        if (!this.debug.active) return;

        const { shape, packing } = this.config;
        const gui = this.debug.gui;

        this.stats = { count: this.heartBalls.count, ms: 0 };

        const info = gui.addFolder('Info');

        info.add(this.stats, 'count').name('bolas').listen().disable();
        info.add(this.stats, 'ms').name('ms generación').listen().disable();

        const shapeFolder = gui.addFolder('Forma');

        shapeFolder.add(shape, 'mode', ['faceted', 'smooth']).name('modo');
        shapeFolder.add(shape, 'facetDetail', [0, 1]).name('caras (0=32, 1=122)');
        shapeFolder.add(shape.facetRotation, 'x', -Math.PI, Math.PI, 0.01).name('giro caras X');
        shapeFolder.add(shape.facetRotation, 'y', -Math.PI, Math.PI, 0.01).name('giro caras Y');
        shapeFolder.add(shape.facetRotation, 'z', -Math.PI, Math.PI, 0.01).name('giro caras Z');

        shapeFolder.add(shape, 'lobeX', 0.1, 0.45, 0.005).name('separación lóbulos');
        shapeFolder.add(shape, 'lobeY', 0.5, 0.9, 0.005).name('altura lóbulos');
        shapeFolder.add(shape, 'lobeRadius', 0.15, 0.45, 0.005).name('radio lóbulos');
        shapeFolder.add(shape, 'tipRadius', 0.005, 0.15, 0.005).name('radio punta');
        shapeFolder.add(shape, 'cleftSmooth', 0, 0.2, 0.005).name('suavizado hendidura');
        shapeFolder.add(shape, 'depth', 0.08, 0.5, 0.005).name('grosor');
        shapeFolder.add(shape, 'roundness', 0.05, 0.6, 0.005).name('redondez borde');
        shapeFolder.add(shape, 'fold', 0, 0.9, 0.01).name('pliegue central');
        shapeFolder
            .add(this.heartBalls.pivot.rotation, 'x', -0.6, 0.6, 0.01)
            .name('inclinación');

        const packFolder = gui.addFolder('Empaquetado');

        packFolder.add(packing.passes[0], 'min', 0.004, 0.06, 0.001).name('radio min (suave)');
        packFolder.add(packing.passes[0], 'max', 0.004, 0.06, 0.001).name('radio max (suave)');

        packing.gapFill.forEach((layer, index) => {
            const label = `hueco ${index + 1}`;

            packFolder.add(layer, 'depth', 0, 0.05, 0.001).name(`${label} profundidad`);
            packFolder.add(layer, 'min', 0.002, 0.03, 0.0005).name(`${label} min`);
            packFolder.add(layer, 'max', 0.002, 0.03, 0.0005).name(`${label} max`);
        });

        packFolder.add(packing.lattice, 'radius', 0.008, 0.04, 0.0005).name('radio bolas (tallado)');
        packFolder.add(packing.lattice, 'jitter', 0, 0.3, 0.01).name('variación tamaño');
        packFolder.add(packing, 'candidates', 10000, 300000, 1000).name('candidatos');
        packFolder.add(packing, 'inset', 0, 0.04, 0.001).name('hundimiento');
        packFolder.add(packing, 'separation', 0.85, 1.2, 0.01).name('separación');
        packFolder.add(packing, 'maxGrow', 1, 1.6, 0.01).name('crecimiento máx');
        packFolder.add(packing.relax, 'initialSeparation', 0.6, 1, 0.01).name('compresión inicial');
        packFolder.add(packing.relax, 'iterations', 0, 120, 1).name('iteraciones relax');

        const lookFolder = gui.addFolder('Material');
        const uniforms = this.heartBalls.material.uniforms;

        lookFolder.addColor(uniforms.uBaseColor, 'value').name('color madera');
        lookFolder.addColor(uniforms.uNumberColor, 'value').name('color número');

        // Color del interior: proxy en hex (lo que se ve en config.ball.coreColor)
        const core = { color: this.config.ball.coreColor };

        lookFolder
            .addColor(core, 'color')
            .name('color interior')
            .onChange((value) => this.heartBalls.coreMaterial.color.set(value));
        lookFolder.add(uniforms.uSurfaceShade, 'value', 0, 1, 0.01).name('sombra global');
        lookFolder.add(uniforms.uCavity.value, 'x', 0, 1, 0.01).name('sombra contacto');
        lookFolder.add(uniforms.uLabelSize.value, 'x', 0.6, 1.9, 0.01).name('ancho número');
        lookFolder.add(uniforms.uLabelSize.value, 'y', 0.2, 0.8, 0.01).name('alto número');
        lookFolder.open();

        const fxFolder = gui.addFolder('Interacción');

        fxFolder.add(uniforms.uRepelRadius, 'value', 0.1, 3, 0.01).name('radio repulsión');
        fxFolder.add(uniforms.uRepelPush, 'value', 0, 0.3, 0.005).name('empuje lateral');
        fxFolder.add(uniforms.uRepelLift, 'value', 0, 0.3, 0.005).name('elevación');
        fxFolder.add(uniforms.uHoverLift, 'value', 0, 0.4, 0.005).name('subida bola hover');
        fxFolder.add(uniforms.uHoverScale, 'value', 0, 1, 0.01).name('crecimiento hover');
        fxFolder.add(this.config.interaction, 'hoverMaxSpeed', 0.1, 5, 0.05).name('vel. máx. para destacar');
        fxFolder.close();

        gui.add({ regenerate: () => this.regenerate() }, 'regenerate').name('↻ Regenerar corazón');
    }

    update() {}

    dispose() {
        this.fx.dispose();
        this.heartBalls.dispose();
        this.environment.dispose();
    }
}
