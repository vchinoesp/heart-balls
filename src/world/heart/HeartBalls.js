import * as THREE from 'three';

import SeededRandom from '../../utils/SeededRandom.js';
import BallMaterial from './BallMaterial.js';
import DigitAtlas from './DigitAtlas.js';

/**
 * HeartBalls
 *
 * Pinta un HeartLayout con un único InstancedMesh (1 draw call).
 * Cada instancia:
 *  - se escala a su radio,
 *  - se orienta con +Z local = normal de la superficie (para número y cavity AO),
 *  - lleva un número único 00000-99999 (atributo aNumber) y una ligera
 *    variación de tono (instanceColor) para que la madera no sea plana.
 */
export default class HeartBalls {
    constructor(scene, config, { detail = 4 } = {}) {
        this.scene = scene;
        this.config = config;
        this.detail = detail;

        this.group = new THREE.Group();
        this.group.name = 'HeartBalls';
        this.scene.add(this.group);

        // Pivot interior con la inclinación base; `group` lo giran los controles
        // (arrastrar/teclado) sin pisar la pose base.
        this.pivot = new THREE.Group();
        this.pivot.rotation.x = config.view.pitch;
        this.group.add(this.pivot);

        this.digits = new DigitAtlas();
        this.material = new BallMaterial({
            digits: this.digits.texture,
            color: config.ball.color,
            roughness: config.ball.roughness,
            numberColor: config.ball.numberColor,
            interaction: config.interaction
        });

        // Núcleo: bolas oscuras y de baja resolución, solo tapan huecos
        this.coreGeometry = new THREE.IcosahedronGeometry(1, 1);
        this.coreMaterial = new THREE.MeshStandardMaterial({
            // El interior se lee como sombra: su color, pero muy apagado
            color: new THREE.Color(config.ball.coreColor).multiplyScalar(config.ball.coreShade ?? 1),
            roughness: 1,
            metalness: 0
        });
    }

    setLayout(layout) {
        this.disposeMesh();

        this.layout = layout;
        this.count = layout.count;

        const scale = this.config.worldHeight / layout.height;

        // Radio de referencia (bola "normal"): las muy pequeñas de relleno
        // no se destacan al pasar el ratón (serían saltos raros)
        this.referenceRadius = (this.config.packing.lattice?.radius ?? 0.02) * scale;
        const offsetY = -layout.height * 0.5 * scale;
        const random = new SeededRandom(this.config.seed + 7);

        // Geometría propia por layout: el atributo aNumber depende del nº de bolas
        this.geometry = new THREE.IcosahedronGeometry(1, this.detail);

        const mesh = new THREE.InstancedMesh(
            this.geometry,
            this.material,
            this.count
        );

        mesh.name = 'HeartBallsMesh';
        mesh.frustumCulled = false;
        mesh.instanceMatrix.setUsage(THREE.StaticDrawUsage);

        this.writeMatrices(mesh, layout, scale, offsetY, random);
        this.writeColors(mesh, random);

        this.geometry.setAttribute(
            'aIntro',
            new THREE.InstancedBufferAttribute(this.createIntroData(layout, random), 2)
        );

        this.numbers = this.createNumbers(this.count, random);
        this.geometry.setAttribute(
            'aNumber',
            new THREE.InstancedBufferAttribute(this.numbers, 1)
        );

        this.mesh = mesh;
        this.pivot.add(mesh);

        this.createCore(layout.core, scale, offsetY);
    }

    createCore(core, scale, offsetY) {
        const mesh = new THREE.InstancedMesh(
            this.coreGeometry,
            this.coreMaterial,
            core.count
        );
        const matrix = new THREE.Matrix4();
        const radius = core.radius * scale;

        mesh.name = 'HeartCoreMesh';
        mesh.frustumCulled = false;

        for (let i = 0; i < core.count; i++) {
            const i3 = i * 3;

            matrix.makeScale(radius, radius, radius);
            matrix.setPosition(
                core.positions[i3] * scale,
                core.positions[i3 + 1] * scale + offsetY,
                core.positions[i3 + 2] * scale
            );
            mesh.setMatrixAt(i, matrix);
        }

        mesh.instanceMatrix.needsUpdate = true;

        this.coreMesh = mesh;
        this.pivot.add(mesh);
    }

    writeMatrices(mesh, layout, scale, offsetY, random) {
        const { positions, normals, radii } = layout;
        const maxRoll = this.config.ball.maxRoll;

        const matrix = new THREE.Matrix4();
        const normal = new THREE.Vector3();
        const right = new THREE.Vector3();
        const up = new THREE.Vector3();
        const worldUp = new THREE.Vector3(0, 1, 0);
        const fallback = new THREE.Vector3(1, 0, 0);
        const roll = new THREE.Quaternion();

        // Copia en CPU (espacio local del mesh) para el picking por rayo
        this.centers = new Float32Array(this.count * 3);
        this.radii = new Float32Array(this.count);
        this.surfaceNormals = new Float32Array(this.count * 3);

        for (let i = 0; i < this.count; i++) {
            const i3 = i * 3;

            normal.fromArray(normals, i3);

            // Base ortonormal: +Z = normal, +X = "derecha" horizontal, +Y ≈ arriba
            right.crossVectors(worldUp, normal);

            if (right.lengthSq() < 1e-4) right.copy(fallback);

            right.normalize();
            up.crossVectors(normal, right).normalize();

            // Pequeño giro aleatorio del número sobre la normal (más natural)
            roll.setFromAxisAngle(normal, random.range(-maxRoll, maxRoll));
            right.applyQuaternion(roll);
            up.applyQuaternion(roll);

            const radius = radii[i] * scale;

            matrix.makeBasis(right, up, normal);
            matrix.scale(new THREE.Vector3(radius, radius, radius));
            matrix.setPosition(
                positions[i3] * scale,
                positions[i3 + 1] * scale + offsetY,
                positions[i3 + 2] * scale
            );

            mesh.setMatrixAt(i, matrix);

            this.centers[i3] = positions[i3] * scale;
            this.centers[i3 + 1] = positions[i3 + 1] * scale + offsetY;
            this.centers[i3 + 2] = positions[i3 + 2] * scale;
            this.radii[i] = radius;
            this.surfaceNormals[i3] = normal.x;
            this.surfaceNormals[i3 + 1] = normal.y;
            this.surfaceNormals[i3 + 2] = normal.z;
        }

        mesh.instanceMatrix.needsUpdate = true;
    }

    /** Retardo de llegada (de abajo arriba + azar) y giro de la espiral. */
    createIntroData(layout, random) {
        const data = new Float32Array(this.count * 2);

        for (let i = 0; i < this.count; i++) {
            const heightFactor = layout.positions[i * 3 + 1] / layout.height;

            data[i * 2] = Math.min(heightFactor * 0.7 + random.next() * 0.3, 1);
            data[i * 2 + 1] = random.range(1.6, 3.6) * (random.next() > 0.5 ? 1 : -1);
        }

        return data;
    }

    /** 0 = dispersas / 1 = corazón formado. El núcleo aparece al final. */
    setIntro(progress) {
        this.material.uniforms.uIntro.value = progress;

        if (this.coreMesh) this.coreMesh.visible = progress > 0.75;
    }

    /**
     * Esfera de la bola `i` tal y como la dibuja ahora el vertex shader
     * (repulsión + hover + selección), en espacio local del mesh.
     * El picking la usa para elegir exactamente la bola que se ve.
     * Misma fórmula que BallMaterial (project_vertex).
     */
    getDisplayedSphere(i, out) {
        const u = this.material.uniforms;
        const i3 = i * 3;
        const cx = this.centers[i3];
        const cy = this.centers[i3 + 1];
        const cz = this.centers[i3 + 2];
        const nx = this.surfaceNormals[i3];
        const ny = this.surfaceNormals[i3 + 1];
        const nz = this.surfaceNormals[i3 + 2];

        let hover = 0;

        if (i === u.uHoverId.value) hover = u.uHover.value;
        if (i === u.uPrevHoverId.value) hover = Math.max(hover, u.uPrevHover.value);

        const pointer = u.uPointer.value;
        const fx = cx - pointer.x;
        const fy = cy - pointer.y;
        const fz = cz - pointer.z;
        const distance = Math.hypot(fx, fy, fz);
        const t = Math.min(Math.max(distance / u.uRepelRadius.value, 0), 1);
        let field = (1 - t * t * (3 - 2 * t)) * u.uRepel.value * (1 - Math.min(hover, 1));

        const along = fx * nx + fy * ny + fz * nz;
        let tx = fx - nx * along;
        let ty = fy - ny * along;
        let tz = fz - nz * along;
        const tangentLength = Math.hypot(tx, ty, tz);

        if (tangentLength > 1e-4) {
            tx /= tangentLength;
            ty /= tangentLength;
            tz /= tangentLength;
        } else {
            tx = ty = tz = 0;
        }

        const boost = u.uHoverBoost.value;
        const push = field * u.uRepelPush.value;
        const lift = field * u.uRepelLift.value + hover * u.uHoverLift.value * boost;
        const selected = i === u.uSelectedId.value ? u.uSelectedScale.value : 1;

        out.x = cx + tx * push + nx * lift;
        out.y = cy + ty * push + ny * lift;
        out.z = cz + tz * push + nz * lift;
        out.radius = this.radii[i] * (1 + hover * u.uHoverScale.value * boost) * selected;

        return out;
    }

    /**
     * z (mundo) de la bola más cercana a la cámara entre las que caen dentro
     * del rectángulo (x ± halfWidth, y ± halfHeight) de la vista.
     * La usa HeartControls para no dejar que el zoom atraviese el corazón.
     */
    getFrontDepth(x, y, halfWidth, halfHeight) {
        if (!this.mesh) return -Infinity;

        this.mesh.updateWorldMatrix(true, false);

        const e = this.mesh.matrixWorld.elements;
        const { centers, radii } = this;
        let front = -Infinity;

        for (let i = 0; i < this.count; i++) {
            const i3 = i * 3;
            const lx = centers[i3];
            const ly = centers[i3 + 1];
            const lz = centers[i3 + 2];
            const wx = e[0] * lx + e[4] * ly + e[8] * lz + e[12];

            if (Math.abs(wx - x) > halfWidth) continue;

            const wy = e[1] * lx + e[5] * ly + e[9] * lz + e[13];

            if (Math.abs(wy - y) > halfHeight) continue;

            const wz = e[2] * lx + e[6] * ly + e[10] * lz + e[14] + radii[i];

            if (wz > front) front = wz;
        }

        return front;
    }

    getNumber(index) {
        return Math.round(this.numbers[index]);
    }

    writeColors(mesh, random) {
        const variation = this.config.ball.colorVariation;
        const color = new THREE.Color();

        for (let i = 0; i < this.count; i++) {
            const light = 1 + random.range(-variation, variation);
            const warm = random.range(-variation, variation) * 0.5;

            color.setRGB(light + warm, light, light - warm);
            mesh.setColorAt(i, color);
        }

        mesh.instanceColor.needsUpdate = true;
    }

    /** Números únicos 00000-99999 repartidos al azar (Fisher-Yates parcial). */
    createNumbers(count, random) {
        const total = 100000;
        const pool = new Uint32Array(total);

        for (let i = 0; i < total; i++) pool[i] = i;

        const numbers = new Float32Array(count);
        const limit = Math.min(count, total);

        for (let i = 0; i < limit; i++) {
            const j = i + random.int(total - i);
            const tmp = pool[i];

            pool[i] = pool[j];
            pool[j] = tmp;
            numbers[i] = pool[i];
        }

        return numbers;
    }

    disposeMesh() {
        if (!this.mesh) return;

        this.pivot.remove(this.mesh);
        this.mesh.dispose();
        this.geometry.dispose();
        this.mesh = null;
        this.geometry = null;

        this.pivot.remove(this.coreMesh);
        this.coreMesh.dispose();
        this.coreMesh = null;
    }

    update() {}

    dispose() {
        this.disposeMesh();
        this.material.dispose();
        this.coreGeometry.dispose();
        this.coreMaterial.dispose();
        this.digits.dispose();
        this.scene.remove(this.group);
    }
}
