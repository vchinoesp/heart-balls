import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export default class Heart {
    constructor(
        scene,
        debug
    ) {
        this.scene = scene;
        this.debug = debug;

        this.loader = new GLTFLoader();

        this.setModel();
    }

    setModel() {
        this.loader.load(
            '/models/heart.glb',
            (gltf) => {
                this.model = gltf.scene;

                this.model.updateMatrixWorld(true);

                this.model.traverse((child) => {
                    if (child.isMesh) {
                        this.mesh = child;
                    }
                });

                this.model.scale.setScalar(
                    2.5
                );

                this.scene.add(
                    this.model
                );



                this.model.traverse(
                    (child) => {
                        if (child.isMesh) {
                            child.material =
                                new THREE.MeshStandardMaterial(
                                    {
                                        color:
                                            '#ff4d6d',
                                        roughness:
                                            0.8,
                                        metalness:
                                            0
                                    }
                                );
                        }
                    }
                );
                this.model.visible = true;
                const box =
                    new THREE.Box3().setFromObject(
                        this.model
                    );

                const size =
                    new THREE.Vector3();

                box.getSize(size);

                console.log(
                    'HEART SIZE',
                    size
                );
                const helper = new THREE.Box3Helper(
                    new THREE.Box3().setFromObject(
                        this.model
                    ),
                    0x00ff00
                );

                this.scene.add(helper);

                this.setDebug();
            }
        );
    }

    isPointInside(worldPoint) {
        if (!this.mesh) return false;

        const raycaster =
            new THREE.Raycaster();

        const direction =
            new THREE.Vector3(
                1,
                0,
                0
            );

        raycaster.set(
            worldPoint,
            direction
        );

        const intersections =
            raycaster.intersectObject(
                this.mesh,
                false
            );

        return (
            intersections.length % 2 === 1
        );
    }



    setVisibility(visible) {
        if (!this.model) return;

        this.model.visible = visible;
    }


    setDebug() {
        if (
            !this.debug ||
            !this.model
        )
            return;

        const folder =
            this.debug.gui.addFolder(
                'Heart'
            );

        folder
            .add(
                this.model.position,
                'x',
                -10,
                10,
                0.01
            )
            .name('Position X');

        folder
            .add(
                this.model.position,
                'y',
                -10,
                10,
                0.01
            )
            .name('Position Y');

        folder
            .add(
                this.model.position,
                'z',
                -10,
                10,
                0.01
            )
            .name('Position Z');

        folder
            .add(
                this.model.rotation,
                'x',
                -Math.PI,
                Math.PI,
                0.001
            )
            .name('Rotation X');

        folder
            .add(
                this.model.rotation,
                'y',
                -Math.PI,
                Math.PI,
                0.001
            )
            .name('Rotation Y');

        folder
            .add(
                this.model.rotation,
                'z',
                -Math.PI,
                Math.PI,
                0.001
            )
            .name('Rotation Z');

        folder
            .add(
                this.model.scale,
                'x',
                0.1,
                10,
                0.01
            )
            .name('Scale X');

        folder
            .add(
                this.model.scale,
                'y',
                0.1,
                10,
                0.01
            )
            .name('Scale Y');

        folder
            .add(
                this.model.scale,
                'z',
                0.1,
                10,
                0.01
            )
            .name('Scale Z');

        folder.open();
    }

    update() {}
}