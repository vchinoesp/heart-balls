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
 * - Interacción en el vertex shader (0 coste CPU por bola):
 *   · Repulsión: las bolas cercanas al puntero se apartan y se elevan.
 *   · Hover: la bola señalada sube y crece (con salida suave de la anterior).
 *   · Selección: la bola elegida se encoge hasta desaparecer (va al popup).
 */
export default class BallMaterial extends THREE.MeshStandardMaterial {
    constructor({ digits, color, roughness, numberColor, interaction }) {
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
            uSurfaceShade: { value: 0.22 },

            // Interacción (espacio local del InstancedMesh)
            uPointer: { value: new THREE.Vector3(0, 0, 999) },
            uRepel: { value: 0 },
            uRepelRadius: { value: interaction.repelRadius },
            uRepelPush: { value: interaction.repelPush },
            uRepelLift: { value: interaction.repelLift },
            uHoverId: { value: -1 },
            uHover: { value: 0 },
            uPrevHoverId: { value: -1 },
            uPrevHover: { value: 0 },
            uHoverLift: { value: interaction.hoverLift },
            uHoverScale: { value: interaction.hoverScale },
            uSelectedId: { value: -1 },
            uSelectedScale: { value: 1 }
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
                uniform vec3 uPointer;
                uniform float uRepel;
                uniform float uRepelRadius;
                uniform float uRepelPush;
                uniform float uRepelLift;
                uniform float uHoverId;
                uniform float uHover;
                uniform float uPrevHoverId;
                uniform float uPrevHover;
                uniform float uHoverLift;
                uniform float uHoverScale;
                uniform float uSelectedId;
                uniform float uSelectedScale;
                varying vec3 vLocal;
                varying float vNumber;
                varying vec3 vSurfaceNormal;
                varying float vHover;
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
            )
            .replace(
                '#include <project_vertex>',
                /* glsl */ `
                float instanceId = float(gl_InstanceID);
                vec3 ballCenter = instanceMatrix[3].xyz;
                vec3 ballNormal = normalize(instanceMatrix[2].xyz);
                vec3 ballLocal = (instanceMatrix * vec4(transformed, 1.0)).xyz - ballCenter;

                // Hover (actual + anterior saliendo)
                float hover = 0.0;
                if (abs(instanceId - uHoverId) < 0.5) hover = uHover;
                if (abs(instanceId - uPrevHoverId) < 0.5) hover = max(hover, uPrevHover);
                vHover = hover;

                // Repulsión: se apartan en el plano tangente y se elevan un poco
                vec3 fromPointer = ballCenter - uPointer;
                float field = (1.0 - smoothstep(0.0, uRepelRadius, length(fromPointer))) * uRepel;
                vec3 tangent = fromPointer - ballNormal * dot(fromPointer, ballNormal);
                float tangentLength = length(tangent);
                vec3 push = tangentLength > 1e-4 ? tangent / tangentLength : vec3(0.0);
                field *= 1.0 - hover;

                vec3 offset = push * field * uRepelPush + ballNormal * (field * uRepelLift + hover * uHoverLift);

                float selected = abs(instanceId - uSelectedId) < 0.5 ? uSelectedScale : 1.0;
                ballLocal *= (1.0 + hover * uHoverScale) * selected;

                vec4 mvPosition = modelViewMatrix * vec4(ballCenter + ballLocal + offset, 1.0);
                gl_Position = projectionMatrix * mvPosition;
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
                varying float vHover;

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
                // La bola señalada sale de la sombra y brilla un poco más
                cavity = mix(cavity, 1.15, vHover * 0.8);

                float facing = dot(normalize(vSurfaceNormal), uLightDirection);
                float surfaceShade = mix(uSurfaceShade, 1.0, smoothstep(-0.15, 0.9, facing));
                surfaceShade = mix(surfaceShade, 1.0, vHover * 0.6);

                reflectedLight.directDiffuse *= cavity * surfaceShade;
                reflectedLight.indirectDiffuse *= cavity * mix(0.45, 1.0, surfaceShade);
                reflectedLight.directSpecular *= cavity * cavity * surfaceShade;
                reflectedLight.indirectSpecular *= cavity * cavity;
                `
            );
    }

    customProgramCacheKey() {
        return 'BallMaterial_v3';
    }
}
