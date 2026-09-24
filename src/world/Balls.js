import * as THREE from 'three';

export default class Balls {
    constructor(scene) {
        this.scene = scene;

        this.count = 200;

        this.ballRadius = 0.15;

        this.spacing =
            this.ballRadius * 2.2;

        this.setInstances();
    }

    setInstances() {
        const geometry =
            new THREE.SphereGeometry(
                this.ballRadius,
                16,
                16
            );

        const material =
            new THREE.MeshStandardMaterial({
                color: '#f2d1a0',
                roughness: 0.8,
                metalness: 0
            });

        this.mesh =
            new THREE.InstancedMesh(
                geometry,
                material,
                this.count
            );

        const dummy =
            new THREE.Object3D();

        let index = 0;

        for (
            let x = -2;
            x <= 2;
            x += this.spacing
        ) {
            for (
                let y = -2;
                y <= 2;
                y += this.spacing
            ) {
                for (
                    let z = -2;
                    z <= 2;
                    z += this.spacing
                ) {
                    if (
                        index >=
                        this.count
                    )
                        break;

                    dummy.position.set(
                        x,
                        y,
                        z
                    );

                    dummy.updateMatrix();

                    this.mesh.setMatrixAt(
                        index,
                        dummy.matrix
                    );

                    index++;
                }
            }
        }

        this.scene.add(this.mesh);
    }

    update() {}
}