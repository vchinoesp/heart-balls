/**
 * Rejilla espacial 3D para búsquedas de vecinos en O(1) aproximado.
 * Guarda índices; las posiciones viven en un Float32Array externo.
 */
export default class SpatialHash {
    constructor(cellSize) {
        this.cellSize = cellSize;
        this.inverse = 1 / cellSize;
        this.cells = new Map();
    }

    key(ix, iy, iz) {
        // Empaquetado en un entero (rango ±512 celdas por eje, de sobra)
        return ((ix + 512) * 1024 + (iy + 512)) * 1024 + (iz + 512);
    }

    insert(index, x, y, z) {
        const k = this.key(
            Math.floor(x * this.inverse),
            Math.floor(y * this.inverse),
            Math.floor(z * this.inverse)
        );

        let cell = this.cells.get(k);

        if (!cell) {
            cell = [];
            this.cells.set(k, cell);
        }

        cell.push(index);
    }

    /** Llama a callback(index) para cada índice en las 27 celdas vecinas. */
    forEachNear(x, y, z, callback) {
        const cx = Math.floor(x * this.inverse);
        const cy = Math.floor(y * this.inverse);
        const cz = Math.floor(z * this.inverse);

        for (let ix = cx - 1; ix <= cx + 1; ix++) {
            for (let iy = cy - 1; iy <= cy + 1; iy++) {
                for (let iz = cz - 1; iz <= cz + 1; iz++) {
                    const cell = this.cells.get(this.key(ix, iy, iz));

                    if (!cell) continue;

                    for (let i = 0; i < cell.length; i++) {
                        if (callback(cell[i]) === false) return;
                    }
                }
            }
        }
    }
}
