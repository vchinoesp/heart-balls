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
        // Solo modo suave: radios de la pasada principal
        passes: [{ min: 0.018, max: 0.021 }],
        // Relleno de huecos por capas: en cada hueco entra la bola más grande que
        // cabe (sin solaparse). `depth` = profundidad extra bajo la superficie.
        gapFill: [
            // Huecos grandes en la superficie (aristas entre caras)
            { depth: 0, min: 0.009, max: 0.018 },
            // Bolas pequeñas encajadas entre las grandes
            { depth: 0.005, min: 0.006, max: 0.012 },
            // Bolitas en los huecos que quedan en la superficie
            { depth: 0.003, min: 0.0055, max: 0.008 },
            // Segunda capa: lo que se ve por los huecos son más bolas, no fondo
            { depth: 0.024, min: 0.012, max: 0.02, onlyUnderGaps: 0.005 },
            // Relleno fino final
            { depth: 0.012, min: 0.005, max: 0.01, onlyUnderGaps: 0.005 }
        ],
        // Candidatos casi en un hueco (espacio libre > holeSearch·min) se
        // recolocan en el centro del hueco antes de descartarlos
        holeSearch: 0.2,
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
        separation: 1.0,
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
            radius: 0.035,
            inset: 0.065,
            spacing: 1.0,
            // Fracción del radio que debe quedar libre (1 = no toca ninguna bola)
            clearance: 0.45
        },
        // Límite de bolas (protección rendimiento)
        maxBalls: 12000
    },

    ball: {
        color: '#d8ab6c',
        colorVariation: 0.07,
        roughness: 0.62,
        numberColor: '#3f342a',
        // Interior del corazón (lo que se ve entre las bolas): granate
        coreColor: '#5a0d1c',
        maxRoll: 0.18
    },

    /**
     * Interacción con el puntero. Estos son los valores por defecto;
     * en #debug → "Interacción" se pueden probar en vivo y luego copiar aquí.
     */
    interaction: {
        // Repulsión alrededor del puntero (unidades de escena; bola ≈ 0.1)
        repelRadius: 1.5,
        repelPush: 0.18, // empuje lateral
        repelLift: 0.025, // elevación hacia fuera
        // Bola bajo el puntero
        hoverLift: 0.035, // subida
        hoverScale: 0.1, // crecimiento (0.1 = +10 %)
        // Suavizado del seguimiento del puntero (segundos): más = más suave
        pointerSmoothing: 0.55,
        // Por encima de esta velocidad (pantallas/segundo) no se destaca bola:
        // al barrer con el ratón no "saltan" bolas, solo al frenar
        hoverMaxSpeed: 0.9
    }
};

export default heartConfig;
