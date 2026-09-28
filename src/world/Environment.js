import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

/**
 * Environment
 *
 * Iluminación de estudio inspirada en la creatividad:
 * - Luz principal cálida desde arriba-izquierda (sombras hacia abajo-derecha).
 * - Relleno frío y suave desde la derecha.
 * - Contraluz para separar la silueta del fondo azul.
 * - RoomEnvironment (PMREM) como luz ambiental/reflejos suaves: sin HDR externo.
 *
 * `Environment.apply()` monta exactamente la misma luz en otra escena: la
 * bola del popup (HeroBall) se ilumina igual que las bolas del corazón.
 */
export default class Environment {
    static settings = {
        environmentIntensity: 0.15,
        key: { color: '#ffe9cf', intensity: 4.8, position: [-5, 8, 6] },
        fill: { color: '#c9d6ff', intensity: 0.2, position: [6, -1, 4] },
        rim: { color: '#ffe7c4', intensity: 1.3, position: [3, 5, -7] }
    };

    /** Mapa de entorno + luces en `scene`. Devuelve { environmentMap, keyLight, fillLight, rimLight }. */
    static apply(scene, renderer) {
        const { environmentIntensity, key, fill, rim } = Environment.settings;
        const pmrem = new THREE.PMREMGenerator(renderer);
        const room = new RoomEnvironment();
        const environmentMap = pmrem.fromScene(room, 0.04).texture;

        scene.environment = environmentMap;
        scene.environmentIntensity = environmentIntensity;

        room.dispose();
        pmrem.dispose();

        const createLight = ({ color, intensity, position }) => {
            const light = new THREE.DirectionalLight(color, intensity);

            light.position.fromArray(position);

            return light;
        };

        const keyLight = createLight(key);
        const fillLight = createLight(fill);
        const rimLight = createLight(rim);

        scene.add(keyLight, fillLight, rimLight);

        return { environmentMap, keyLight, fillLight, rimLight };
    }

    constructor(scene, renderer, debug) {
        this.scene = scene;
        this.debug = debug;

        Object.assign(this, Environment.apply(scene, renderer));

        this.setDebug();
    }

    setDebug() {
        if (!this.debug.active) return;

        const folder = this.debug.gui.addFolder('Environment');

        folder.add(this.scene, 'environmentIntensity', 0, 2, 0.01);
        folder.add(this.keyLight, 'intensity', 0, 8, 0.01).name('key');
        folder.add(this.fillLight, 'intensity', 0, 4, 0.01).name('fill');
        folder.add(this.rimLight, 'intensity', 0, 4, 0.01).name('rim');
        folder.close();
    }

    dispose() {
        this.environmentMap.dispose();
    }
}
