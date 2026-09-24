/**
 * Configuración central del corazón de bolas.
 *
 * Todas las medidas de forma están normalizadas: el corazón mide ~1 de alto
 * (punta en y = 0) y luego se escala a `worldHeight` unidades de escena.
 */
const heartConfig = {
    seed: 1225,

    worldHeight: 5.2,

    shape: {
        // Lóbulos superiores
        lobeX: 0.25,
        lobeY: 0.68,
        lobeRadius: 0.33,
        // Punta inferior
        tipRadius: 0.05,
        // Suavizado de la hendidura central (smooth-min)
        cleftSmooth: 0.04,
        // Volumen: semigrosor máximo y distancia al borde en la que se redondea
        depth: 0.3,
        roundness: 0.28,
        // Pliegue central: 0 = frente redondeado, 1 = laterales muy finos
        fold: 0.5
    },

    // Inclinación base: cámara ligeramente por encima, como en la creatividad
    view: {
        pitch: 0.14
    },

    packing: {
        // Pasada 1 = principal (se relaja en filas). Resto = relleno de huecos.
        passes: [
            { min: 0.018, max: 0.021 },
            { min: 0.015, max: 0.02 },
            { min: 0.011, max: 0.015 }
        ],
        // Puntos candidatos sobre la superficie (más = empaquetado más denso)
        candidates: 150000,
        // Cuánto se hunde el centro de cada bola bajo la superficie (unidades normalizadas)
        inset: 0.012,
        // Separación mínima relativa entre bolas (1 = tocándose)
        separation: 0.96,
        // Relajación de la pasada principal (orden hexagonal)
        relax: {
            initialSeparation: 0.8,
            iterations: 40,
            strength: 0.8,
            target: 1.0
        },
        // Iteraciones de "crecimiento" para cerrar huecos
        growIterations: 2,
        maxGrow: 1.15,
        // Núcleo oscuro interior que tapa los huecos (no lleva número)
        core: {
            radius: 0.04,
            inset: 0.045,
            spacing: 1.3
        },
        // Límite de bolas (protección rendimiento)
        maxBalls: 12000
    },

    ball: {
        color: '#d8ab6c',
        colorVariation: 0.07,
        roughness: 0.62,
        numberColor: '#3f342a',
        coreColor: '#2a1c10',
        maxRoll: 0.18
    }
};

export default heartConfig;
