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
        this.seam = params.seam ?? 'valley';
        this.notch = params.notch ?? { y: 0.86, slope: 0.9 };

        this.buildPlanes();
    }

    /**
     * Altura (z) de la mitad izquierda suave en (x, y); -1 = fuera.
     *  - seam 'valley': gota izquierda sola -> al unir las dos mitades la
     *    línea central queda hundida.
     *  - seam 'ridge': mitad izquierda del corazón completo (hasta x = 0) con
     *    la distancia real al borde de la silueta. El punto más alto queda en
     *    el centro -> arista central hacia fuera, como en la creatividad.
     */
    smoothHalf(x, y) {
        if (this.seam === 'ridge') return this.ridgeHeight(x, y);

        const sd = this.capsule(x, y);
        const edge = Math.max(1 + sd / this.roundness, 0);

        if (edge > 1) return -1;

        return this.thicknessAt(x) * Math.sqrt(1 - edge * edge);
    }

    thicknessAt(x) {
        return this.depth * (1 - this.fold * Math.min(Math.abs(x) / this.halfWidth, 1));
    }

    ridgeHeight(x, y) {
        if (x > 0 || this.silhouette(x, y) > 0) return -1;

        const edge = Math.max(1 - this.boundaryDistance(x, y) / this.roundness, 0);

        return this.thicknessAt(x) * Math.sqrt(1 - edge * edge);
    }

    /**
     * Distancia real al contorno de la silueta. La SDF de una unión (min) se
     * queda corta por dentro justo en la costura central: por eso el centro
     * se hundía. Aquí se mide contra puntos del contorno (solo en el bake).
     */
    boundaryDistance(x, y) {
        this.contour ??= this.sampleContour();

        let best = Infinity;
        const points = this.contour;

        for (let i = 0; i < points.length; i += 2) {
            const dx = points[i] - x;
            const dy = points[i + 1] - y;
            const d = dx * dx + dy * dy;

            if (d < best) best = d;
        }

        return Math.sqrt(best);
    }

    /** Puntos del contorno de la silueta (cambios de signo en una rejilla fina). */
    sampleContour() {
        const step = 0.002;
        const { minX, maxX, maxY } = this.bounds;
        const points = [];

        for (let y = -step; y <= maxY + step; y += step) {
            let previous = this.silhouette(minX - step, y);

            for (let x = minX; x <= maxX + step; x += step) {
                const value = this.silhouette(x, y);

                if (Math.sign(value) !== Math.sign(previous)) {
                    const t = previous / (previous - value);

                    points.push(x - step + step * t, y);
                }

                previous = value;
            }
        }

        for (let x = minX - step; x <= maxX + step; x += step) {
            let previous = this.silhouette(x, -step);

            for (let y = 0; y <= maxY + step; y += step) {
                const value = this.silhouette(x, y);

                if (Math.sign(value) !== Math.sign(previous)) {
                    const t = previous / (previous - value);

                    points.push(x, y - step + step * t);
                }

                previous = value;
            }
        }

        return new Float64Array(points);
    }

    buildPlanes() {
        let directions = FacetedHeartShape.createDirections(
            this.facetDetail,
            this.facetRotation
        );

        // Arista: solo direcciones que miran a la izquierda (o al centro); la
        // derecha es su reflejo exacto -> las caras se encuentran en x = 0
        if (this.seam === 'ridge') {
            directions = directions.filter((d) => d[0] <= 1e-6);
        }
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

        if (this.seam === 'ridge') this.buildRidgePlanes();

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

    /**
     * Modo arista: un único poliedro convexo y simétrico (caras izquierdas +
     * sus reflejos) al que se le talla la hendidura superior con una "V".
     */
    buildRidgePlanes() {
        const mirrored = this.planes
            .filter(({ normal }) => normal[0] < -1e-6)
            .map(({ normal, distance }) => ({
                normal: [-normal[0], normal[1], normal[2]],
                distance
            }));

        this.solidPlanes = [...this.planes, ...mirrored];

        // Hendidura: y > notch.y + slope·|x| queda fuera
        const { y, slope } = this.notch;
        const length = Math.hypot(slope, 1);

        this.notchPlanes = [
            { normal: [slope / length, 1 / length, 0], distance: y / length },
            { normal: [-slope / length, 1 / length, 0], distance: y / length }
        ];
    }

    static maxPlane(planes, x, y, z) {
        let value = -Infinity;

        for (let i = 0; i < planes.length; i++) {
            const { normal, distance } = planes[i];
            const d = normal[0] * x + normal[1] * y + normal[2] * z - distance;

            if (d > value) value = d;
        }

        return value;
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
        if (this.seam === 'ridge') {
            const solid = FacetedHeartShape.maxPlane(this.solidPlanes, x, y, z);
            // Hendidura: min de los dos planos de la "V" (paredes interiores de los lóbulos)
            const notch = Math.min(
                FacetedHeartShape.maxPlane([this.notchPlanes[0]], x, y, z),
                FacetedHeartShape.maxPlane([this.notchPlanes[1]], x, y, z)
            );

            return Math.max(solid, notch);
        }

        return Math.min(this.half(x, y, z), this.half(-x, y, z));
    }

    /**
     * Caras de ambas mitades: { normal, distance, origin } en el espacio del corazón.
     * La mitad derecha es el reflejo en X de la izquierda.
     */
    getFaces() {
        if (this.seam === 'ridge') {
            return [...this.solidPlanes, ...this.notchPlanes].map(({ normal, distance }) => ({
                normal: [...normal],
                distance
            }));
        }

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
