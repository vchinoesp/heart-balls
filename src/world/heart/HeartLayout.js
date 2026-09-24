import HeartShape from './HeartShape.js';
import BallPacker from './BallPacker.js';

/**
 * HeartLayout
 *
 * Datos de colocación de las bolas (unidades normalizadas, punta en y = 0):
 * { count, positions: Float32Array(3n), normals: Float32Array(3n), radii: Float32Array(n), height,
 *   core: { count, radius, positions: Float32Array(3m) } }
 *
 * - generate(): cálculo completo (≈0.5-1 s). Se usa en el script de bake y en modo #debug.
 * - fromBuffer()/toBuffer(): formato binario precalculado (public/data/heart-layout.bin)
 *   para que en producción la carga sea instantánea y no bloquee el hilo principal.
 *
 * Formato binario (little endian):
 *   Uint32 version | Uint32 count | Float32 height | Uint32 coreCount | Float32 coreRadius | pad[3]
 *   Float32 positions[3n] | Float32 normals[3n] | Float32 radii[n] | Float32 corePositions[3m]
 */
const VERSION = 2;
const HEADER_BYTES = 32;

export default class HeartLayout {
    static generate(config) {
        const shape = new HeartShape(config.shape);
        const packer = new BallPacker(shape, config.packing, config.seed);
        const { count, positions, normals, radii, core } = packer.pack();

        return {
            count,
            positions: positions.slice(),
            normals: normals.slice(),
            radii: radii.slice(),
            height: shape.height,
            core
        };
    }

    static toBuffer(layout) {
        const { count, core } = layout;
        const floats = count * 7 + core.count * 3;
        const buffer = new ArrayBuffer(HEADER_BYTES + floats * 4);
        const view = new DataView(buffer);

        view.setUint32(0, VERSION, true);
        view.setUint32(4, count, true);
        view.setFloat32(8, layout.height, true);
        view.setUint32(12, core.count, true);
        view.setFloat32(16, core.radius, true);

        const data = new Float32Array(buffer, HEADER_BYTES);

        data.set(layout.positions, 0);
        data.set(layout.normals, count * 3);
        data.set(layout.radii, count * 6);
        data.set(core.positions, count * 7);

        return buffer;
    }

    static fromBuffer(buffer) {
        const view = new DataView(buffer);
        const version = view.getUint32(0, true);

        if (version !== VERSION) {
            throw new Error(`HeartLayout: versión ${version} no soportada`);
        }

        const count = view.getUint32(4, true);
        const height = view.getFloat32(8, true);
        const coreCount = view.getUint32(12, true);
        const coreRadius = view.getFloat32(16, true);
        const data = new Float32Array(
            buffer,
            HEADER_BYTES,
            count * 7 + coreCount * 3
        );

        return {
            count,
            height,
            positions: data.subarray(0, count * 3),
            normals: data.subarray(count * 3, count * 6),
            radii: data.subarray(count * 6, count * 7),
            core: {
                count: coreCount,
                radius: coreRadius,
                positions: data.subarray(count * 7, count * 7 + coreCount * 3)
            }
        };
    }

    static async load(url) {
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`HeartLayout: no se pudo cargar ${url}`);
        }

        return HeartLayout.fromBuffer(await response.arrayBuffer());
    }
}
