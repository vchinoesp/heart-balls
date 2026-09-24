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
        // 'faceted' = tallado en caras planas (creatividad) · 'smooth' = redondeado
        mode: 'faceted',
        // Caras: 0 = 32 (hexágonos + pentágonos) · 1 = 122 (más fino)
        facetDetail: 0,
        // Orientación del conjunto de caras (radianes)
        facetRotation: { x: 0, y: 0.2, z: 0.3 },
        // Lóbulos superiores
        lobeX: 0.25,
        lobeY: 0.68,
        lobeRadius: 0.33,
        // Punta inferior
        tipRadius: 0.02,
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
        pitch: 0.05
    },

    packing: {
        // Pasada 1 = principal (se relaja en filas). Resto = relleno de huecos.
        // `sink`: cuánto más se hunden las de relleno (se asoman entre las grandes)
        passes: [
            { min: 0.018, max: 0.021 },
            { min: 0.014, max: 0.018, sink: 0.002 },
            { min: 0.010, max: 0.014, sink: 0.004 },
            { min: 0.007, max: 0.010, sink: 0.006 }
        ],
        // Modo tallado: rejilla hexagonal perfecta en cada cara
        lattice: {
            radius: 0.0195,
            jitter: 0.1,
            spacing: 1.0,
            // En las aristas: si no cabe, se prueba con bolas más pequeñas
            edgeScales: [1, 0.8, 0.62]
        },
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
        coreColor: '#4a3220',
        maxRoll: 0.18
    }
};

export default heartConfig;
