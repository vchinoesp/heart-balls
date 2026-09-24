import * as THREE from 'three';

/**
 * BallMaterial
 *
 * MeshStandardMaterial extendido (onBeforeCompile) con:
 * - Número de 5 dígitos por instancia (atributo `aNumber` + DigitAtlas).
 * - Veta de madera procedural muy sutil.
 * - "Cavity AO": oscurece la cara de cada bola que mira hacia sus vecinas.
 *   Como cada instancia está orientada con +Z = normal de la superficie del
 *   corazón, basta con la Z local del fragmento. Da la sensación de bolas
 *   apretadas con sombras de contacto sin shadow maps (clave en móvil).
 */
export default class BallMaterial extends THREE.MeshStandardMaterial {
    constructor({ digits, color, roughness, numberColor }) {
        super({
            color: 0xffffff,
            roughness,
            metalness: 0
        });

        this.name = 'BallMaterial';

        this.uniforms = {
            uDigits: { value: digits },
            uNumberColor: { value: new THREE.Color(numberColor) },
            uBaseColor: { value: new THREE.Color(color) },
            // Ancho y alto del número en coordenadas de la esfera unidad
            uLabelSize: { value: new THREE.Vector2(1.5, 0.5) },
            uCavity: { value: new THREE.Vector2(0.18, 1.0) },
            // Sombreado global del corazón: la cara que no mira a la luz se oscurece
            uLightDirection: { value: new THREE.Vector3(-0.75, 0.45, 0.5).normalize() },
            uSurfaceShade: { value: 0.22 }
        };
    }

    onBeforeCompile(shader) {
        Object.assign(shader.uniforms, this.uniforms);

        shader.vertexShader = shader.vertexShader
            .replace(
                '#include <common>',
                /* glsl */ `
                #include <common>
                attribute float aNumber;
                varying vec3 vLocal;
                varying float vNumber;
                varying vec3 vSurfaceNormal;
                `
            )
            .replace(
                '#include <begin_vertex>',
                /* glsl */ `
                #include <begin_vertex>
                vLocal = position;
                vNumber = aNumber;
                // +Z de la instancia = normal de la superficie del corazón (en mundo)
                vSurfaceNormal = normalize(mat3(modelMatrix) * mat3(instanceMatrix) * vec3(0.0, 0.0, 1.0));
                `
            );

        shader.fragmentShader = shader.fragmentShader
            .replace(
                '#include <common>',
                /* glsl */ `
                #include <common>
                uniform sampler2D uDigits;
                uniform vec3 uNumberColor;
                uniform vec3 uBaseColor;
                uniform vec2 uLabelSize;
                uniform vec2 uCavity;
                uniform vec3 uLightDirection;
                uniform float uSurfaceShade;
                varying vec3 vLocal;
                varying float vNumber;
                varying vec3 vSurfaceNormal;

                float digitPower(float index) {
                    if (index < 0.5) return 10000.0;
                    if (index < 1.5) return 1000.0;
                    if (index < 2.5) return 100.0;
                    if (index < 3.5) return 10.0;
                    return 1.0;
                }

                float numberMask(vec3 local, float number) {
                    vec2 label = local.xy / uLabelSize + 0.5;

                    // Coordenada continua para derivadas (evita costuras de mipmap)
                    vec2 continuous = vec2(label.x * 0.5, label.y);
                    vec2 gradX = dFdx(continuous);
                    vec2 gradY = dFdy(continuous);

                    if (local.z < 0.0 || any(lessThan(label, vec2(0.0))) || any(greaterThan(label, vec2(1.0)))) {
                        return 0.0;
                    }

                    float cell = label.x * 5.0;
                    float index = floor(cell);
                    float digit = mod(floor((number + 0.5) / digitPower(index)), 10.0);
                    vec2 atlasUv = vec2((digit + fract(cell)) / 10.0, label.y);

                    return textureGrad(uDigits, atlasUv, gradX, gradY).a;
                }

                float woodGrain(vec3 local, float seed) {
                    float warp = sin(local.y * 5.0 + seed) * 0.6 + sin(local.z * 7.0 + seed * 1.7) * 0.3;
                    float rings = sin((local.x + warp * 0.25) * 34.0 + seed * 3.1);
                    return rings * 0.5 + 0.5;
                }
                `
            )
            .replace(
                '#include <color_fragment>',
                /* glsl */ `
                #include <color_fragment>

                vec3 local = normalize(vLocal);
                float seed = fract(vNumber * 0.61803) * 6.2831;

                diffuseColor.rgb *= uBaseColor;
                diffuseColor.rgb *= 1.0 - 0.06 * woodGrain(local, seed);

                float mask = numberMask(local, vNumber);
                diffuseColor.rgb = mix(diffuseColor.rgb, uNumberColor, mask * 0.95);
                `
            )
            .replace(
                '#include <lights_fragment_end>',
                /* glsl */ `
                #include <lights_fragment_end>

                float cavity = smoothstep(-0.55, 0.85, local.z);
                cavity = mix(uCavity.x, uCavity.y, cavity);

                float facing = dot(normalize(vSurfaceNormal), uLightDirection);
                float surfaceShade = mix(uSurfaceShade, 1.0, smoothstep(-0.25, 0.75, facing));

                reflectedLight.directDiffuse *= cavity * surfaceShade;
                reflectedLight.indirectDiffuse *= cavity * mix(0.45, 1.0, surfaceShade);
                reflectedLight.directSpecular *= cavity * cavity * surfaceShade;
                reflectedLight.indirectSpecular *= cavity * cavity;
                `
            );
    }

    customProgramCacheKey() {
        return 'BallMaterial_v2';
    }
}
