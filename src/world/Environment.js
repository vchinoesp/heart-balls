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
 */
export default class Environment {
    constructor(scene, renderer, debug) {
        this.scene = scene;
        this.renderer = renderer;
        this.debug = debug;

        this.setEnvironmentMap();
        this.setLights();
        this.setDebug();
    }

    setEnvironmentMap() {
        const pmrem = new THREE.PMREMGenerator(this.renderer);
        const room = new RoomEnvironment();

        this.environmentMap = pmrem.fromScene(room, 0.04).texture;
        this.scene.environment = this.environmentMap;
        this.scene.environmentIntensity = 0.16;

        room.dispose();
        pmrem.dispose();
    }

    setLights() {
        this.keyLight = new THREE.DirectionalLight('#fff1dc', 3.2);
        this.keyLight.position.set(-7, 5, 5);

        this.fillLight = new THREE.DirectionalLight('#c9d6ff', 0.3);
        this.fillLight.position.set(6, -1, 4);

        this.rimLight = new THREE.DirectionalLight('#ffe7c4', 1.3);
        this.rimLight.position.set(3, 5, -7);

        this.scene.add(this.keyLight, this.fillLight, this.rimLight);
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
