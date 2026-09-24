/**
 * Precalcula la colocación de las bolas y la guarda en binario.
 *
 *   npm run bake
 *
 * Genera public/data/heart-layout.bin a partir de src/config/heart.config.js.
 * En producción el navegador solo descarga este archivo (~50 KB) en lugar de
 * calcular el empaquetado (≈1-3 s en móvil).
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import heartConfig from '../src/config/heart.config.js';
import HeartLayout from '../src/world/heart/HeartLayout.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const output = resolve(root, 'public/data/heart-layout.bin');

const start = performance.now();
const layout = HeartLayout.generate(heartConfig);
const buffer = HeartLayout.toBuffer(layout);

await mkdir(dirname(output), { recursive: true });
await writeFile(output, Buffer.from(buffer));

const ms = Math.round(performance.now() - start);
const kb = (buffer.byteLength / 1024).toFixed(1);

console.log(
    `[bake] ${layout.count} bolas + ${layout.core.count} núcleo · ${kb} KB · ${ms} ms -> public/data/heart-layout.bin`
);
