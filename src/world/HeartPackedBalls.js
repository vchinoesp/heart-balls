import * as THREE from 'three';
import { MeshSurfaceSampler } from 'three/examples/jsm/math/MeshSurfaceSampler.js';

export default class HeartPackedBalls {
    constructor(
        scene,
        heart,
        debug,
        config
    ) {
        this.scene = scene;
        this.heart = heart;
        this.debug = debug;
        this.config = config;

        this.ballRadius = 0.12;

        this.count = 3500;

        this.minDistance =
            this.ballRadius * 1.9;

        this.positions = [];

        this.initialized = false;
    }

    init() {
        if (!this.heart.mesh) return;

        this.generatePositions();

        this.createBalls();

        this.createDebug();

        this.initialized = true;

        console.log(
            'Packed Balls:',
            this.positions.length
        );
    }

    generatePositions() {

        this.heart.model.updateMatrixWorld(
            true
        );

        const sampler =
            new MeshSurfaceSampler(
                this.heart.mesh
            ).build();

        const position =
            new THREE.Vector3();

        const normal =
            new THREE.Vector3();

        const layers = [
            0,
            -0.08,
            -0.16,
            -0.24,
            -0.32,
            -0.40,
            -0.48
        ];

        const attemptsLimit =
            this.count * 50;

        let attempts = 0;

        while (
            this.positions.length <
            this.count &&
            attempts <
            attemptsLimit
            ) {
            sampler.sample(
                position,
                normal
            );

            for (const layer of layers) {

                const candidate =
                    position
                        .clone()
                        .add(
                            normal
                                .clone()
                                .multiplyScalar(
                                    layer
                                )
                        );

                candidate.applyMatrix4(
                    this.heart.model.matrixWorld
                );

                let valid = true;

                for (
                    let i = 0;
                    i <
                    this.positions.length;
                    i++
                ) {
                    if (
                        candidate.distanceTo(
                            this.positions[
                                i
                                ]
                        ) <
                        this.minDistance
                    ) {
                        valid = false;
                        break;
                    }
                }

                if (valid) {
                    this.positions.push(
                        candidate.clone()
                    );

                    if (
                        this.positions
                            .length >=
                        this.count
                    ) {
                        break;
                    }
                }
            }

            attempts++;
        }
    }

    createBalls() {
        const geometry =
            new THREE.SphereGeometry(
                this.ballRadius,
                20,
                20
            );

        const material =
            new THREE.MeshStandardMaterial({
                color: '#d4af7a',
                roughness: 0.9,
                metalness: 0
            });

        this.mesh =
            new THREE.InstancedMesh(
                geometry,
                material,
                this.positions.length
            );

        const dummy =
            new THREE.Object3D();

        this.positions.forEach(
            (position, index) => {

                const scale =
                    THREE.MathUtils.randFloat(
                        0.95,
                        1.05
                    );

                dummy.position.copy(
                    position
                );

                dummy.scale.setScalar(
                    scale
                );

                dummy.updateMatrix();

                this.mesh.setMatrixAt(
                    index,
                    dummy.matrix
                );
            }
        );

        this.mesh.instanceMatrix.needsUpdate =
            true;

        this.scene.add(
            this.mesh
        );


        const box =
            new THREE.Box3().setFromObject(
                this.mesh
            );

        console.log(
            'BALLS SIZE',
            new THREE.Vector3().subVectors(
                box.max,
                box.min
            )
        );
    }

    createDebug() {
        if (!this.debug) return;

        const folder =
            this.debug.gui.addFolder(
                'Packed Balls'
            );

        folder
            .add(
                this.config,
                'showHeart'
            )
            .onChange(
                (value) => {
                    this.heart.setVisibility(
                        value
                    );
                }
            );

        folder
            .add(
                this.mesh,
                'visible'
            )
            .name('showBalls');

        folder.open();
    }

    update() {
        if (
            this.initialized ||
            !this.heart.mesh
        ) {
            return;
        }

        this.init();
    }
}