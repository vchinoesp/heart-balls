import HeartShape from './HeartShape.js';

export default class FacetedHeartShape extends HeartShape {
    setParams(params) {
        super.setParams(params);

        this.facetDetail = params.facetDetail ?? 0;
        this.facetRotation = params.facetRotation ?? { x: 0, y: 0, z: 0 };
        this.seam = params.seam ?? 'valley';
        this.notch = params.notch ?? { y: 0.86, slope: 0.9 };

        this.buildPlanes();
    }

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

        if (this.seam === 'ridge') {
            directions = directions.filter((d) => d[0] <= 1e-6);
        }
        const supports = new Float64Array(directions.length).fill(-Infinity);
        const step = 0.004;
        const { minX, maxX, maxY } = this.bounds;

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

    buildRidgePlanes() {
        const mirrored = this.planes
            .filter(({ normal }) => normal[0] < -1e-6)
            .map(({ normal, distance }) => ({
                normal: [-normal[0], normal[1], normal[2]],
                distance
            }));

        this.solidPlanes = [...this.planes, ...mirrored];

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
            const notch = Math.min(
                FacetedHeartShape.maxPlane([this.notchPlanes[0]], x, y, z),
                FacetedHeartShape.maxPlane([this.notchPlanes[1]], x, y, z)
            );

            return Math.max(solid, notch);
        }

        return Math.min(this.half(x, y, z), this.half(-x, y, z));
    }

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
        let cy = Math.cos(rx);
        let sy = Math.sin(rx);
        [y, z] = [y * cy - z * sy, y * sy + z * cy];
        cy = Math.cos(ry);
        sy = Math.sin(ry);
        [x, z] = [x * cy + z * sy, -x * sy + z * cy];
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
