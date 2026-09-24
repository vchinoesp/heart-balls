import * as THREE from 'three';

/**
 * BallPicker
 *
 * Detecta qué bola hay bajo el puntero con un test rayo-esfera en CPU.
 * Mucho más barato que Raycaster sobre el InstancedMesh (que prueba triángulo
 * a triángulo): ~3.000 esferas = microsegundos, apto para cada frame en móvil.
 */
export default class BallPicker {
    constructor(camera) {
        this.camera = camera;
        this.raycaster = new THREE.Raycaster();
        this.inverse = new THREE.Matrix4();
        this.localRay = new THREE.Ray();
        this.ndc = new THREE.Vector2();
        this.hitPoint = new THREE.Vector3();
    }

    /**
     * @param {number} x, y  Coordenadas normalizadas (-1..1)
     * @param {HeartBalls} heartBalls
     * @returns {{ index: number, point: THREE.Vector3 } | null} punto en espacio local del mesh
     */
    pick(x, y, heartBalls, { minRadius = 0 } = {}) {
        const mesh = heartBalls.mesh;

        if (!mesh) return null;

        this.ndc.set(x, y);
        this.raycaster.setFromCamera(this.ndc, this.camera);

        this.inverse.copy(mesh.matrixWorld).invert();
        this.localRay.copy(this.raycaster.ray).applyMatrix4(this.inverse);

        const { origin, direction } = this.localRay;
        const { centers, radii, count } = heartBalls;

        let best = -1;
        let bestT = Infinity;

        for (let i = 0; i < count; i++) {
            if (radii[i] < minRadius) continue;

            const i3 = i * 3;
            const ox = origin.x - centers[i3];
            const oy = origin.y - centers[i3 + 1];
            const oz = origin.z - centers[i3 + 2];
            const b = ox * direction.x + oy * direction.y + oz * direction.z;
            const c = ox * ox + oy * oy + oz * oz - radii[i] * radii[i];
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
        const { centers, radii } = heartBalls;
        const { origin, direction } = this.localRay;
        const i3 = index * 3;
        const ox = centers[i3] - origin.x;
        const oy = centers[i3 + 1] - origin.y;
        const oz = centers[i3 + 2] - origin.z;
        const along = ox * direction.x + oy * direction.y + oz * direction.z;
        const distanceSq = ox * ox + oy * oy + oz * oz - along * along;

        return Math.sqrt(Math.max(distanceSq, 0)) / radii[index];
    }
}
