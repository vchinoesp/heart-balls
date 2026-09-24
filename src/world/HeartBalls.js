import * as THREE from 'three';

export default class HeartBalls {
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

        this.points = [];

        this.initialized = false;
    }

    init() {
        if (this.initialized) return;

        this.initialized = true;
        if (!this.heart.model) return;

        const box =
            new THREE.Box3().setFromObject(
                this.heart.model
            );

        this.generateHexGrid(box);

        this.createPoints();

       // this.createBalls();

        this.createDebug();

        this.initialized = true;
    }

    generateHexGrid(box) {
        this.points = [];

        const spacing =
            this.ballRadius * 2;

        const rowHeight =
            spacing * 0.866;

        const layerDepth =
            spacing * 0.816;

        let layer = 0;

        for (
            let z = box.min.z;
            z <= box.max.z;
            z += layerDepth
        ) {
            let row = 0;

            for (
                let y = box.min.y;
                y <= box.max.y;
                y += rowHeight
            ) {
                const xOffset =
                    row % 2 === 0
                        ? 0
                        : spacing * 0.5;

                const zOffset =
                    layer % 2 === 0
                        ? 0
                        : spacing * 0.5;

                for (
                    let x = box.min.x;
                    x <= box.max.x;
                    x += spacing
                ) {
                    const point =
                        new THREE.Vector3(
                            x + xOffset,
                            y,
                            z + zOffset
                        );

                    if (
                        this.isNearHeartSurface(
                            point
                        )
                    ) {
                        this.points.push(
                            point
                        );
                    }
                }

                row++;
            }

            layer++;
        }

        console.log(
            'HexGrid Points:',
            this.points.length
        );
    }

    isNearHeartSurface(point) {
        const worldPoint =
            point.clone();

        const localPoint =
            this.heart.mesh.worldToLocal(
                worldPoint.clone()
            );

        const geometry =
            this.heart.mesh.geometry;

        geometry.computeBoundingBox();

        const bounds =
            geometry.boundingBox;

        return bounds.containsPoint(
            localPoint
        );
    }

    createPoints() {
        const geometry =
            new THREE.BufferGeometry();

        const vertices = [];

        this.points.forEach(
            (point) => {
                vertices.push(
                    point.x,
                    point.y,
                    point.z
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
                size: 0.03
            });

        this.pointCloud =
            new THREE.Points(
                geometry,
                material
            );

        this.scene.add(
            this.pointCloud
        );
    }

    createBalls() {
        const geometry =
            new THREE.SphereGeometry(
                this.ballRadius,
                16,
                16
            );

        const material =
            new THREE.MeshStandardMaterial({
                color: '#d8b07e',
                roughness: 0.85,
                metalness: 0
            });

        this.balls =
            new THREE.InstancedMesh(
                geometry,
                material,
                this.points.length
            );

        const dummy =
            new THREE.Object3D();

        this.points.forEach(
            (point, index) => {
                const scale =
                    THREE.MathUtils.randFloat(
                        0.97,
                        1.03
                    );

                dummy.position.copy(
                    point
                );

                dummy.scale.setScalar(
                    scale
                );

                dummy.updateMatrix();

                this.balls.setMatrixAt(
                    index,
                    dummy.matrix
                );
            }
        );

        this.scene.add(
            this.balls
        );
    }

    createDebug() {
        if (!this.debug) return;

        const folder =
            this.debug.gui.addFolder(
                'Heart Balls'
            );

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

        folder
            .add(
                this.config,
                'showPoints'
            )
            .onChange((value) => {
                this.pointCloud.visible =
                    value;
            });

        folder
            .add(
                this.config,
                'showBalls'
            )
            .onChange((value) => {
                this.balls.visible =
                    value;
            });

        this.pointCloud.visible =
            this.config.showPoints;

        this.balls.visible =
            this.config.showBalls;
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