import HeartShape from './HeartShape.js';

/**
 * FacetedHeartShape
 *
 * Versión "tallada" del corazón, como en la creatividad: caras planas
 * (hexágonos y pentágonos) en lugar de superficies redondeadas.
 *
 * Construcción:
 * 1. Se toma la mitad izquierda del corazón suave (una "gota" inflada).
 * 2. Se elige un conjunto de direcciones tipo balón de fútbol
 *    (vértices + centros de cara de un icosaedro = 12 + 20 = 32 caras).
 * 3. Para cada dirección se calcula el plano tangente a la gota (función soporte).
 *    La intersección de esos planos es un poliedro convexo que envuelve la gota.
 * 4. Corazón = unión de ese poliedro y su reflejo (mitad derecha). La unión
 *    genera sola la hendidura superior y la arista central.
 *
 * Sobre cada cara plana las bolas se colocan en una rejilla hexagonal perfecta
 * (ver BallPacker.placeLattice) y en las aristas quedan los huecos que se
 * rellenan con bolas más pequeñas.
 */
export default class FacetedHeartShape extends HeartShape {
    setParams(params) {
        super.setParams(params);

        this.facetDetail = params.facetDetail ?? 0;
        this.facetRotation = params.facetRotation ?? { x: 0, y: 0, z: 0 };

        this.buildPlanes();
    }

    /** Implícita de la gota izquierda suave (sin unión con la derecha). */
    smoothHalf(x, y) {
        const sd = this.capsule(x, y);
        const edge = Math.max(1 + sd / this.roundness, 0);

        if (edge > 1) return -1;

        const thickness =
            this.depth * (1 - this.fold * Math.min(Math.abs(x) / this.halfWidth, 1));

        return thickness * Math.sqrt(1 - edge * edge);
    }

    buildPlanes() {
        const directions = FacetedHeartShape.createDirections(
            this.facetDetail,
            this.facetRotation
        );
        const supports = new Float64Array(directions.length).fill(-Infinity);
        const step = 0.004;
        const { minX, maxX, maxY } = this.bounds;

        // Función soporte: máximo de n·p sobre la superficie de la gota
        for (let x = minX; x <= maxX; x += step) {
            for (let y = 0; y <= maxY; y += step) {
                const z = this.smoothHalf(x, y);

                if (z < 0) continue;

                for (let i = 0; i < directions.length; i++) {
                    const d = directions[i];
                    const base = d[0] * x + d[1] * y;
                    const value = base + Math.abs(d[2]) * z;

                    if (value > supports[i]) supports[i] = value;
                }
            }
        }

        this.planes = directions.map((normal, i) => ({
            normal,
            distance: supports[i]
        }));

        // El poliedro puede ser algo mayor que la forma suave: actualizamos límites
        const margin = 0.08;

        this.bounds = {
            minX: this.bounds.minX - margin,
            maxX: this.bounds.maxX + margin,
            minY: this.bounds.minY - margin,
            maxY: this.bounds.maxY + margin,
            minZ: this.bounds.minZ - margin,
            maxZ: this.bounds.maxZ + margin
        };
    }

    /** Distancia (con signo) al poliedro de la mitad izquierda. */
    half(x, y, z) {
        let value = -Infinity;

        for (let i = 0; i < this.planes.length; i++) {
            const { normal, distance } = this.planes[i];
            const d = normal[0] * x + normal[1] * y + normal[2] * z - distance;

            if (d > value) value = d;
        }

        return value;
    }

    evaluate(x, y, z) {
        return Math.min(this.half(x, y, z), this.half(-x, y, z));
    }

    /**
     * Caras de ambas mitades: { normal, distance, origin } en el espacio del corazón.
     * La mitad derecha es el reflejo en X de la izquierda.
     */
    getFaces() {
        const faces = [];

        for (const { normal, distance } of this.planes) {
            faces.push({ normal, distance });
            faces.push({
                normal: [-normal[0], normal[1], normal[2]],
                distance
            });
        }

        return faces;
    }

    /**
     * Direcciones de las caras: vértices del icosaedro (pentágonos) +
     * centros de sus caras (hexágonos). detail 1 subdivide una vez (más caras).
     */
    static createDirections(detail, rotation) {
        const t = (1 + Math.sqrt(5)) / 2;
        let vertices = [
            [-1, t, 0], [1, t, 0], [-1, -t, 0], [1, -t, 0],
            [0, -1, t], [0, 1, t], [0, -1, -t], [0, 1, -t],
            [t, 0, -1], [t, 0, 1], [-t, 0, -1], [-t, 0, 1]
        ].map(FacetedHeartShape.normalize);

        let faces = [
            [0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11],
            [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8],
            [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9],
            [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1]
        ];

        for (let level = 0; level < detail; level++) {
            ({ vertices, faces } = FacetedHeartShape.subdivide(vertices, faces));
        }

        const centers = faces.map(([a, b, c]) =>
            FacetedHeartShape.normalize([
                vertices[a][0] + vertices[b][0] + vertices[c][0],
                vertices[a][1] + vertices[b][1] + vertices[c][1],
                vertices[a][2] + vertices[b][2] + vertices[c][2]
            ])
        );

        return [...vertices, ...centers].map((d) =>
            FacetedHeartShape.rotate(d, rotation)
        );
    }

    static subdivide(vertices, faces) {
        const cache = new Map();
        const next = vertices.slice();

        const midpoint = (a, b) => {
            const key = a < b ? `${a}_${b}` : `${b}_${a}`;

            if (cache.has(key)) return cache.get(key);

            next.push(
                FacetedHeartShape.normalize([
                    vertices[a][0] + vertices[b][0],
                    vertices[a][1] + vertices[b][1],
                    vertices[a][2] + vertices[b][2]
                ])
            );
            cache.set(key, next.length - 1);

            return next.length - 1;
        };

        const nextFaces = [];

        for (const [a, b, c] of faces) {
            const ab = midpoint(a, b);
            const bc = midpoint(b, c);
            const ca = midpoint(c, a);

            nextFaces.push([a, ab, ca], [b, bc, ab], [c, ca, bc], [ab, bc, ca]);
        }

        return { vertices: next, faces: nextFaces };
    }

    static rotate([x, y, z], { x: rx = 0, y: ry = 0, z: rz = 0 }) {
        // X
        let cy = Math.cos(rx);
        let sy = Math.sin(rx);
        [y, z] = [y * cy - z * sy, y * sy + z * cy];
        // Y
        cy = Math.cos(ry);
        sy = Math.sin(ry);
        [x, z] = [x * cy + z * sy, -x * sy + z * cy];
        // Z
        cy = Math.cos(rz);
        sy = Math.sin(rz);
        [x, y] = [x * cy - y * sy, x * sy + y * cy];

        return [x, y, z];
    }

    static normalize([x, y, z]) {
        const length = Math.hypot(x, y, z);

        return [x / length, y / length, z / length];
    }
}
