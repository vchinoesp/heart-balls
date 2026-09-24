import * as THREE from 'three';
import { MeshSurfaceSampler } from 'three/examples/jsm/math/MeshSurfaceSampler.js';

export default class HeartHexPackedBalls {
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

        this.anchorCount = 300;

        this.positions = [];

        this.initialized = false;
    }

    init() {
        if (!this.heart.mesh) return;

        this.generatePackedPositions();

        this.createInstances();

        this.createDebug();

        this.initialized = true;

        console.log(
            'HeartPackedBallsV2:',
            this.positions.length
        );
    }

    generatePackedPositions() {
        const sampler =
            new MeshSurfaceSampler(
                this.heart.mesh
            ).build();

        const position =
            new THREE.Vector3();

        const normal =
            new THREE.Vector3();

        const tangent =
            new THREE.Vector3();

        const bitangent =
            new THREE.Vector3();

        const layers = [
            0,
            -0.12,
            -0.24,
            -0.36
        ];

        for (
            let i = 0;
            i < this.anchorCount;
            i++
        ) {
            sampler.sample(
                position,
                normal
            );

            normal.normalize();

            tangent
                .set(
                    normal.y,
                    normal.z,
                    normal.x
                )
                .normalize();

            bitangent
                .crossVectors(
                    normal,
                    tangent
                )
                .normalize();

            layers.forEach(
                (depthOffset) => {

                    const anchor =
                        position
                            .clone()
                            .add(
                                normal
                                    .clone()
                                    .multiplyScalar(
                                        depthOffset
                                    )
                            );

                    const localPositions = [
                        [0, 0],

                        [1, 0],
                        [-1, 0],

                        [0.5, 0.866],
                        [-0.5, 0.866],

                        [0.5, -0.866],
                        [-0.5, -0.866]
                    ];

                    localPositions.forEach(
                        ([tx, ty]) => {

                            const offset =
                                tangent
                                    .clone()
                                    .multiplyScalar(
                                        tx *
                                        this
                                            .ballRadius *
                                        2
                                    )
                                    .add(
                                        bitangent
                                            .clone()
                                            .multiplyScalar(
                                                ty *
                                                this
                                                    .ballRadius *
                                                2
                                            )
                                    );

                            const point =
                                anchor
                                    .clone()
                                    .add(
                                        offset
                                    )
                                    .applyMatrix4(
                                        this
                                            .heart
                                            .model
                                            .matrixWorld
                                    );

                            if (
                                this.isValidPosition(
                                    point
                                )
                            ) {
                                this.positions.push(
                                    point
                                );
                            }
                        }
                    );
                }
            );
        }
    }

    createInstances() {
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
                        0.96,
                        1.04
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
    }

    isValidPosition(candidate) {
        const minDistance =
            this.ballRadius * 1.55;

        for (
            let i = 0;
            i < this.positions.length;
            i++
        ) {
            if (
                candidate.distanceTo(
                    this.positions[i]
                ) < minDistance
            ) {
                return false;
            }
        }

        return true;
    }

    createDebug() {
        if (!this.debug) return;

        const folder =
            this.debug.gui.addFolder(
                'Heart Packed V2'
            );

        folder
            .add(
                this.mesh,
                'visible'
            )
            .name('Show Balls');

        folder
            .add(
                this.config,
                'showHeart'
            )
            .onChange((value) => {
                this.heart.setVisibility(
                    value
                );
            });

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