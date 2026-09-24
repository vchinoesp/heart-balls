import * as THREE from 'three';
import { MeshSurfaceSampler } from 'three/examples/jsm/math/MeshSurfaceSampler.js';

export default class HeartSurfacePoints {
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

        this.count = 20000;

        this.initialized = false;
    }

    init() {
        if (!this.heart.mesh) return;

        const sampler =
            new MeshSurfaceSampler(
                this.heart.mesh
            ).build();

        const positions = [];

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

        const samplesPerLayer =
            Math.floor(
                this.count /
                layers.length
            );

        layers.forEach(
            (layerOffset) => {

                let created = 0;

                while (
                    created <
                    samplesPerLayer
                    ) {
                    sampler.sample(
                        position,
                        normal
                    );

                    const point =
                        position
                            .clone()
                            .add(
                                normal
                                    .clone()
                                    .multiplyScalar(
                                        layerOffset
                                    )
                            )
                            .applyMatrix4(
                                this.heart.mesh.matrixWorld
                            );

                    positions.push(
                        point
                    );

                    created++;
                }
            }
        );

        this.createPoints(
            positions
        );

        this.createDebug();

        this.initialized = true;

        console.log(
            'Surface Points:',
            positions.length
        );
    }

    createPoints(positions) {
        const geometry =
            new THREE.BufferGeometry();

        const vertices = [];

        positions.forEach(
            (position) => {
                vertices.push(
                    position.x,
                    position.y,
                    position.z
                );
            }
        );

        geometry.setAttribute(
            'position',
            new THREE.Float32BufferAttribute(
                vertices,
                3
            )
        );

        const material =
            new THREE.PointsMaterial({
                color: 0xff0000,
                size: 0.06,
                sizeAttenuation: true
            });

        this.points =
            new THREE.Points(
                geometry,
                material
            );

        this.scene.add(
            this.points
        );
    }

    createDebug() {
        if (!this.debug) return;

        const folder =
            this.debug.gui.addFolder(
                'Surface Points'
            );

        folder.add(
            this.config,
            'showHeart'
        ).onChange((value) => {
            this.heart.setVisibility(
                value
            );
        });

        folder.add(
            this.config,
            'showPoints'
        ).onChange((value) => {
            this.points.visible =
                value;
        });

        this.points.visible =
            this.config.showPoints;

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