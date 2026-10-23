import numbersConfig from './numbers.config.js';

const heartConfig = {
    seed: 1225,

    worldHeight: 5.2,

    shape: {
        mode: 'faceted',
        facetDetail: 1,
        facetRotation: { x: 0, y: 0.25, z: 0.3 },
        seam: 'ridge',
        notch: { y: 0.86, slope: 0.9 },
        lobeX: 0.25,
        lobeY: 0.68,
        lobeRadius: 0.33,
        tipRadius: 0.02,
        cleftSmooth: 0.04,
        depth: 0.3,
        roundness: 0.28,
        fold: 0.5
    },

    view: {
        pitch: 0.05
    },

    navigation: {
        maxTilt: 1.45,
        minSurfaceDistance: 1.2
    },

    packing: {
        passes: [{ min: 0.018, max: 0.021 }],
        gapFill: [
            { depth: 0, min: 0.0077, max: 0.0153 },
            { depth: 0.0043, min: 0.0051, max: 0.0102 },
            { depth: 0.0026, min: 0.0047, max: 0.0068 },
            { depth: 0.0204, min: 0.0102, max: 0.017, onlyUnderGaps: 0.0043 },
            { depth: 0.0102, min: 0.0043, max: 0.0085, onlyUnderGaps: 0.0043 }
        ],
        holeSearch: 0.2,
        lattice: {
            radius: 0.0166,
            jitter: 0.1,
            spacing: 1.0,
            edgeScales: [1, 0.8, 0.62]
        },
        candidates: 150000,
        inset: 0.0102,
        separation: 1.0,
        relax: {
            initialSeparation: 0.8,
            iterations: 40,
            strength: 0.8,
            target: 1.0
        },
        growIterations: 2,
        maxGrow: 1.15,
        core: {
            radius: 0.035,
            inset: 0.065,
            spacing: 1.0,
            clearance: 0.45
        },
        maxBalls: 12000
    },

    numbers: {
        unavailable: numbersConfig.unavailable
    },

    ball: {
        color: '#e6ae80',
        colorVariation: 0.07,
        roughness: 0.4,
        numberColor: '#4b2d17',
        coreColor: '#5a0d1c',
        coreShade: 0.45,
        maxRoll: 0.18
    },

    interaction: {
        repelRadius: 1.5,
        repelPush: 0.18,
        repelLift: 0.025,
        hoverLift: 0.035,
        hoverScale: 0.1,
        touchHoverBoost: 2.8,
        pointerSmoothing: 0.55,
        hoverMaxSpeed: 0.9
    }
};

export default heartConfig;
