const EARTH_DIAMETER_KM = 12742;
const NEARBY_RADIUS_KM = 50;
const NEARBY_LIMIT = 5;
const CLUSTER_RADIUS_KM = 20;
const CLUSTER_LIMIT = 3;

const toRadians = (degrees) => (degrees * Math.PI) / 180;

function distanceKm(a, b) {
    const h =
        Math.sin(toRadians(b.lat - a.lat) / 2) ** 2 +
        Math.cos(toRadians(a.lat)) * Math.cos(toRadians(b.lat)) * Math.sin(toRadians(b.lng - a.lng) / 2) ** 2;

    return EARTH_DIAMETER_KM * Math.asin(Math.sqrt(Math.min(1, Math.max(0, h))));
}

async function fetchJson(url) {
    const response = await fetch(url);

    if (!response.ok) throw new Error(`No se pudo cargar ${url} (HTTP ${response.status})`);

    return response.json();
}

export default class PointsOfSale {
    static isPostalCode(value) {
        return /^\d{5}$/.test(value);
    }

    static async load({ points, postalCodes }) {
        const [pointRows, postalCodeRows] = await Promise.all([fetchJson(points), fetchJson(postalCodes)]);

        return new PointsOfSale(pointRows, postalCodeRows);
    }

    constructor(pointRows, postalCodeRows) {
        this.points = [];
        this.byPostalCode = new Map();
        this.origins = new Map();
        this.ambiguous = new Set();

        pointRows.forEach(([, , address, postalCode, town, lat, lng]) => {
            const point = { address, postalCode, town, lat, lng };

            this.points.push(point);

            if (!this.byPostalCode.has(postalCode)) this.byPostalCode.set(postalCode, []);

            this.byPostalCode.get(postalCode).push(point);
        });

        postalCodeRows.forEach(([postalCode, lng, lat]) => {
            const previous = this.origins.get(postalCode);

            if (!previous) {
                this.origins.set(postalCode, { lat, lng });
            } else if (previous.lat !== lat || previous.lng !== lng) {
                this.ambiguous.add(postalCode);
            }
        });
    }

    search(postalCode) {
        const origin = this.ambiguous.has(postalCode) ? null : this.origins.get(postalCode);
        const exact = this.byPostalCode.get(postalCode) ?? [];

        if (exact.length) {
            const results = origin
                ? exact
                      .map((point) => ({ point, distance: distanceKm(origin, point) }))
                      .sort((a, b) => a.distance - b.distance)
                      .map(({ point }) => point)
                : exact;

            return { match: 'exact', results };
        }

        if (!origin || !this.points.length) return { match: 'unknown', results: [] };

        const sorted = this.points
            .map((point) => ({ point, distance: distanceKm(origin, point) }))
            .sort((a, b) => a.distance - b.distance);

        const nearby = sorted.filter(({ distance }) => distance <= NEARBY_RADIUS_KM).slice(0, NEARBY_LIMIT);

        if (nearby.length) return { match: 'nearby', results: nearby.map(({ point }) => point) };

        const first = sorted[0].point;
        const results = sorted
            .filter(({ point }) => distanceKm(first, point) <= CLUSTER_RADIUS_KM)
            .slice(0, CLUSTER_LIMIT)
            .map(({ point }) => point);

        return { match: 'nearby', results };
    }
}
