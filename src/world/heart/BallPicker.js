import * as THREE from 'three';

/**
 * BallPicker
 *
 * Detecta qué bola hay bajo el puntero con un test rayo-esfera en CPU.
 * Mucho más barato que Raycaster sobre el InstancedMesh (que prueba triángulo
 * a triángulo): ~3.000 esferas = microsegundos, apto para cada frame en móvil.
 *
 * Las esferas se prueban donde se DIBUJAN (con la repulsión y el hover del
 * shader aplicados, ver HeartBalls.getDisplayedSphere): la bola elegida es
 * siempre la primera que se ve bajo el puntero, sea grande o pequeña.
 */
export default class BallPicker {
    constructor(camera) {
        this.camera = camera;
        this.raycaster = new THREE.Raycaster();
        this.inverse = new THREE.Matrix4();
        this.localRay = new THREE.Ray();
        this.ndc = new THREE.Vector2();
        this.hitPoint = new THREE.Vector3();
        this.sphere = { x: 0, y: 0, z: 0, radius: 0 };
    }

    /**
     * @param {number} x, y  Coordenadas normalizadas (-1..1)
     * @param {HeartBalls} heartBalls
     * @returns {{ index: number, point: THREE.Vector3 } | null} punto en espacio local del mesh
     */
    pick(x, y, heartBalls) {
        const mesh = heartBalls.mesh;

        if (!mesh) return null;

        this.ndc.set(x, y);
        this.raycaster.setFromCamera(this.ndc, this.camera);

        mesh.updateWorldMatrix(true, false);
        this.inverse.copy(mesh.matrixWorld).invert();
        this.localRay.copy(this.raycaster.ray).applyMatrix4(this.inverse);

        const { origin, direction } = this.localRay;
        const sphere = this.sphere;

        let best = -1;
        let bestT = Infinity;

        for (let i = 0; i < heartBalls.count; i++) {
            heartBalls.getDisplayedSphere(i, sphere);

            if (sphere.radius <= 0) continue;

            const ox = origin.x - sphere.x;
            const oy = origin.y - sphere.y;
            const oz = origin.z - sphere.z;
            const b = ox * direction.x + oy * direction.y + oz * direction.z;
            const c = ox * ox + oy * oy + oz * oz - sphere.radius * sphere.radius;
            const discriminant = b * b - c;

            if (discriminant < 0) continue;

            const t = -b - Math.sqrt(discriminant);

            if (t > 0 && t < bestT) {
                bestT = t;
                best = i;
            }
        }

        if (best < 0) return null;

        this.localRay.at(bestT, this.hitPoint);

        return { index: best, point: this.hitPoint };
    }

    /**
     * Distancia (relativa a su radio) del último rayo al centro de una bola.
     * < 1 = el rayo atraviesa la bola. Se usa para la histéresis del hover.
     */
    relativeDistance(index, heartBalls) {
        const sphere = heartBalls.getDisplayedSphere(index, this.sphere);
        const { origin, direction } = this.localRay;
        const ox = sphere.x - origin.x;
        const oy = sphere.y - origin.y;
        const oz = sphere.z - origin.z;
        const along = ox * direction.x + oy * direction.y + oz * direction.z;
        const distanceSq = ox * ox + oy * oy + oz * oz - along * along;

        return Math.sqrt(Math.max(distanceSq, 0)) / Math.max(sphere.radius, 1e-6);
    }
}
