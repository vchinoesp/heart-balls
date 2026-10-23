export default class HeartShape {
    constructor(params) {
        this.setParams(params);
    }

    setParams({
        lobeX,
        lobeY,
        lobeRadius,
        tipRadius,
        cleftSmooth,
        depth,
        roundness,
        fold = 0
    }) {
        this.lobeX = lobeX;
        this.lobeY = lobeY;
        this.lobeRadius = lobeRadius;
        this.tipRadius = tipRadius;
        this.cleftSmooth = cleftSmooth;
        this.depth = depth;
        this.roundness = roundness;
        this.fold = fold;

        const dx = 0 - -lobeX;
        const dy = tipRadius - lobeY;

        this.capsuleLength = Math.hypot(dx, dy);
        this.axisX = dx / this.capsuleLength;
        this.axisY = dy / this.capsuleLength;

        const b = (lobeRadius - tipRadius) / this.capsuleLength;

        this.capB = b;
        this.capA = Math.sqrt(Math.max(1 - b * b, 0));

        this.bounds = {
            minX: -(lobeX + lobeRadius),
            maxX: lobeX + lobeRadius,
            minY: 0,
            maxY: lobeY + lobeRadius,
            minZ: -depth,
            maxZ: depth
        };

        this.height = this.bounds.maxY;
        this.halfWidth = this.bounds.maxX;
    }

    capsule(x, y) {
        const qx = x + this.lobeX;
        const qy = y - this.lobeY;

        const ly = qx * this.axisX + qy * this.axisY;
        const lx = Math.abs(qx * -this.axisY + qy * this.axisX);

        const a = this.capA;
        const b = this.capB;
        const h = this.capsuleLength;
        const k = -b * lx + a * ly;

        if (k < 0) return Math.hypot(lx, ly) - this.lobeRadius;
        if (k > a * h) return Math.hypot(lx, ly - h) - this.tipRadius;

        return lx * a + ly * b - this.lobeRadius;
    }

    silhouette(x, y) {
        const left = this.capsule(x, y);
        const right = this.capsule(-x, y);

        return HeartShape.smoothMin(left, right, this.cleftSmooth);
    }

    evaluate(x, y, z) {
        const sd = this.silhouette(x, y);
        const edge = Math.max(1 + sd / this.roundness, 0);
        const thickness =
            this.depth * (1 - this.fold * Math.min(Math.abs(x) / this.halfWidth, 1));

        return Math.hypot(z / thickness, edge) - 1;
    }

    gradient(x, y, z, out) {
        const e = 1e-4;

        out[0] = this.evaluate(x + e, y, z) - this.evaluate(x - e, y, z);
        out[1] = this.evaluate(x, y + e, z) - this.evaluate(x, y - e, z);
        out[2] = this.evaluate(x, y, z + e) - this.evaluate(x, y, z - e);

        const inv = 1 / (2 * e);

        out[0] *= inv;
        out[1] *= inv;
        out[2] *= inv;

        return out;
    }

    project(p, normal, iterations = 8) {
        for (let i = 0; i < iterations; i++) {
            const value = this.evaluate(p[0], p[1], p[2]);

            this.gradient(p[0], p[1], p[2], normal);

            const lengthSq =
                normal[0] * normal[0] +
                normal[1] * normal[1] +
                normal[2] * normal[2];

            if (lengthSq < 1e-10) return false;

            const step = value / lengthSq;

            p[0] -= normal[0] * step;
            p[1] -= normal[1] * step;
            p[2] -= normal[2] * step;

            if (Math.abs(value) < 1e-5) break;
        }

        this.gradient(p[0], p[1], p[2], normal);

        const length = Math.hypot(normal[0], normal[1], normal[2]);

        if (!length) return false;

        normal[0] /= length;
        normal[1] /= length;
        normal[2] /= length;

        return Math.abs(this.evaluate(p[0], p[1], p[2])) < 1e-3;
    }

    static smoothMin(a, b, k) {
        if (k <= 0) return Math.min(a, b);

        const h = Math.max(k - Math.abs(a - b), 0) / k;

        return Math.min(a, b) - h * h * k * 0.25;
    }
}
