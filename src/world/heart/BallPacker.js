import SeededRandom from '../../utils/SeededRandom.js';
import SpatialHash from '../../utils/SpatialHash.js';

/**
 * BallPacker
 *
 * Reparte bolas sobre la superficie de un HeartShape imitando el
 * empaquetado ordenado de la creatividad:
 *
 * 1. Pool: miles de puntos candidatos proyectados sobre la superficie.
 * 2. Pasada principal: Poisson-disk *comprimido* (separación < 1) con radios
 *    casi uniformes -> más bolas de las que caben.
 * 3. Relajación: las bolas se repelen deslizándose sobre la superficie hasta
 *    tocarse; al estar comprimidas se ordenan en filas hexagonales.
 * 4. Relleno: pasadas con radios menores ocupan los huecos (costuras,
 *    pliegue central, bordes), como las bolas pequeñas de la creatividad.
 * 5. Crecimiento: cada bola crece hasta tocar a su vecina (con límite).
 * 6. Núcleo: capa interior de bolas oscuras que tapa los huecos.
 *
 * Devuelve arrays tipados en unidades normalizadas (corazón ≈ 1 de alto).
 */
export default class BallPacker {
    constructor(shape, options, seed) {
        this.shape = shape;
        this.options = options;
        this.random = new SeededRandom(seed);
    }

    pack() {
        const { passes, relax, separation } = this.options;
        const pool = this.createCandidatePool();
        const state = this.createState();

        const [primary, ...fills] = passes;

        this.placePass(state, pool, primary, relax.initialSeparation);
        this.relax(state);
        this.rebuildHash(state);

        for (const pass of fills) {
            this.placePass(state, pool, pass, separation);
        }

        this.grow(state);

        const { count } = state;

        return {
            count,
            positions: state.positions.slice(0, count * 3),
            normals: state.normals.slice(0, count * 3),
            radii: state.radii.slice(0, count),
            core: this.placeCore(pool)
        };
    }

    createState() {
        const { maxBalls, passes, maxGrow } = this.options;
        const largest = Math.max(...passes.map((pass) => pass.max));

        return {
            count: 0,
            cellSize: largest * maxGrow * 2,
            hash: null,
            surface: new Float32Array(maxBalls * 3),
            positions: new Float32Array(maxBalls * 3),
            normals: new Float32Array(maxBalls * 3),
            radii: new Float32Array(maxBalls)
        };
    }

    createCandidatePool() {
        const { candidates } = this.options;
        const { bounds } = this.shape;
        const points = new Float32Array(candidates * 3);
        const normals = new Float32Array(candidates * 3);
        const p = [0, 0, 0];
        const n = [0, 0, 0];

        let count = 0;
        let guard = 0;

        while (count < candidates && guard < candidates * 3) {
            guard++;

            p[0] = this.random.range(bounds.minX, bounds.maxX);
            p[1] = this.random.range(bounds.minY, bounds.maxY);
            p[2] = this.random.range(bounds.minZ, bounds.maxZ);

            if (!this.shape.project(p, n)) continue;

            const i3 = count * 3;

            points[i3] = p[0];
            points[i3 + 1] = p[1];
            points[i3 + 2] = p[2];
            normals[i3] = n[0];
            normals[i3 + 1] = n[1];
            normals[i3 + 2] = n[2];

            count++;
        }

        const order = new Uint32Array(count);

        for (let i = 0; i < count; i++) order[i] = i;

        this.random.shuffle(order);

        return { points, normals, order, count, used: new Uint8Array(count) };
    }

    /** Poisson-disk sobre el pool con radios en [pass.min, pass.max]. */
    placePass(state, pool, pass, separation) {
        const { maxBalls } = this.options;

        if (!state.hash) this.rebuildHash(state);

        for (let o = 0; o < pool.count && state.count < maxBalls; o++) {
            const index = pool.order[o];

            if (pool.used[index]) continue;

            const i3 = index * 3;
            const radius =
                pass.min + (pass.max - pass.min) * Math.sqrt(this.random.next());

            const center = this.centerFrom(
                pool.points[i3],
                pool.points[i3 + 1],
                pool.points[i3 + 2],
                pool.normals[i3],
                pool.normals[i3 + 1],
                pool.normals[i3 + 2]
            );

            if (!this.fits(state, center, radius, separation)) continue;

            pool.used[index] = 1;

            const b = state.count;
            const b3 = b * 3;

            state.surface[b3] = pool.points[i3];
            state.surface[b3 + 1] = pool.points[i3 + 1];
            state.surface[b3 + 2] = pool.points[i3 + 2];
            state.normals[b3] = pool.normals[i3];
            state.normals[b3 + 1] = pool.normals[i3 + 1];
            state.normals[b3 + 2] = pool.normals[i3 + 2];
            state.positions[b3] = center[0];
            state.positions[b3 + 1] = center[1];
            state.positions[b3 + 2] = center[2];
            state.radii[b] = radius;

            state.hash.insert(b, center[0], center[1], center[2]);
            state.count++;
        }
    }

    /** El centro de la bola se hunde ligeramente bajo la superficie. */
    centerFrom(x, y, z, nx, ny, nz) {
        const inset = this.options.inset;

        return [x - nx * inset, y - ny * inset, z - nz * inset];
    }

    fits(state, center, radius, separation) {
        const [x, y, z] = center;
        const { positions, radii } = state;
        let ok = true;

        state.hash.forEachNear(x, y, z, (j) => {
            const j3 = j * 3;
            const dx = positions[j3] - x;
            const dy = positions[j3 + 1] - y;
            const dz = positions[j3 + 2] - z;
            const min = (radii[j] + radius) * separation;

            if (dx * dx + dy * dy + dz * dz < min * min) {
                ok = false;

                return false;
            }

            return true;
        });

        return ok;
    }

    rebuildHash(state) {
        state.hash = new SpatialHash(state.cellSize);

        for (let i = 0; i < state.count; i++) {
            const i3 = i * 3;

            state.hash.insert(
                i,
                state.positions[i3],
                state.positions[i3 + 1],
                state.positions[i3 + 2]
            );
        }
    }

    /**
     * Repulsión entre bolas deslizando sobre la superficie.
     * Jacobi: se acumulan desplazamientos y se aplican a la vez.
     */
    relax(state) {
        const { iterations, strength, target } = this.options.relax;
        const { count, surface, positions, normals, radii } = state;
        const displacement = new Float32Array(count * 3);
        const p = [0, 0, 0];
        const n = [0, 0, 0];

        for (let iteration = 0; iteration < iterations; iteration++) {
            this.rebuildHash(state);
            displacement.fill(0);

            for (let i = 0; i < count; i++) {
                const i3 = i * 3;
                const x = positions[i3];
                const y = positions[i3 + 1];
                const z = positions[i3 + 2];

                state.hash.forEachNear(x, y, z, (j) => {
                    if (j <= i) return true;

                    const j3 = j * 3;
                    const dx = positions[j3] - x;
                    const dy = positions[j3 + 1] - y;
                    const dz = positions[j3 + 2] - z;
                    const distance = Math.hypot(dx, dy, dz) || 1e-6;
                    const wanted = (radii[i] + radii[j]) * target;

                    if (distance >= wanted) return true;

                    const push = ((wanted - distance) / distance) * 0.5 * strength;

                    displacement[i3] -= dx * push;
                    displacement[i3 + 1] -= dy * push;
                    displacement[i3 + 2] -= dz * push;
                    displacement[j3] += dx * push;
                    displacement[j3 + 1] += dy * push;
                    displacement[j3 + 2] += dz * push;

                    return true;
                });
            }

            for (let i = 0; i < count; i++) {
                const i3 = i * 3;

                p[0] = surface[i3] + displacement[i3];
                p[1] = surface[i3 + 1] + displacement[i3 + 1];
                p[2] = surface[i3 + 2] + displacement[i3 + 2];

                if (!this.shape.project(p, n, 4)) continue;

                surface[i3] = p[0];
                surface[i3 + 1] = p[1];
                surface[i3 + 2] = p[2];
                normals[i3] = n[0];
                normals[i3 + 1] = n[1];
                normals[i3 + 2] = n[2];

                const center = this.centerFrom(p[0], p[1], p[2], n[0], n[1], n[2]);

                positions[i3] = center[0];
                positions[i3 + 1] = center[1];
                positions[i3 + 2] = center[2];
            }
        }
    }

    /** Cada bola crece hasta tocar a su vecina más cercana (con límite). */
    grow(state) {
        const { growIterations, maxGrow, separation } = this.options;
        const { count, positions, radii } = state;
        const original = radii.slice(0, count);

        for (let iteration = 0; iteration < growIterations; iteration++) {
            for (let i = 0; i < count; i++) {
                const i3 = i * 3;
                const x = positions[i3];
                const y = positions[i3 + 1];
                const z = positions[i3 + 2];

                let limit = original[i] * maxGrow;

                state.hash.forEachNear(x, y, z, (j) => {
                    if (j === i) return true;

                    const j3 = j * 3;
                    const distance = Math.hypot(
                        positions[j3] - x,
                        positions[j3 + 1] - y,
                        positions[j3 + 2] - z
                    );

                    limit = Math.min(limit, distance / separation - radii[j]);

                    return true;
                });

                radii[i] = Math.max(radii[i], limit);
            }
        }
    }

    /** La bola del núcleo no puede asomar por zonas finas (p. ej. la punta). */
    isInside(x, y, z, radius) {
        const shape = this.shape;

        return (
            shape.evaluate(x, y, z) < 0 &&
            shape.evaluate(x + radius, y, z) < 0 &&
            shape.evaluate(x - radius, y, z) < 0 &&
            shape.evaluate(x, y + radius, z) < 0 &&
            shape.evaluate(x, y - radius, z) < 0 &&
            shape.evaluate(x, y, z + radius) < 0 &&
            shape.evaluate(x, y, z - radius) < 0
        );
    }

    placeCore(pool) {
        const { radius, inset, spacing } = this.options.core;
        const hash = new SpatialHash(radius * spacing);
        const positions = new Float32Array(pool.count * 3);
        const minDistanceSq = (radius * spacing) ** 2;

        let count = 0;

        for (let o = 0; o < pool.count; o++) {
            const i3 = pool.order[o] * 3;
            const x = pool.points[i3] - pool.normals[i3] * inset;
            const y = pool.points[i3 + 1] - pool.normals[i3 + 1] * inset;
            const z = pool.points[i3 + 2] - pool.normals[i3 + 2] * inset;

            let free = true;

            hash.forEachNear(x, y, z, (j) => {
                const j3 = j * 3;
                const dx = positions[j3] - x;
                const dy = positions[j3 + 1] - y;
                const dz = positions[j3 + 2] - z;

                if (dx * dx + dy * dy + dz * dz < minDistanceSq) {
                    free = false;

                    return false;
                }

                return true;
            });

            if (!free || !this.isInside(x, y, z, radius)) continue;

            positions[count * 3] = x;
            positions[count * 3 + 1] = y;
            positions[count * 3 + 2] = z;
            hash.insert(count, x, y, z);
            count++;
        }

        return {
            count,
            radius,
            positions: positions.slice(0, count * 3)
        };
    }
}
