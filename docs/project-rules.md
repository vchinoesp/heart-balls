HEART BALLS
Proyecto
Experiencia 3D premium desarrollada con:

Three.js
WebGL
GSAP
GLSL
JavaScript ES Modules
Vite
Vercel
La experiencia debe sentirse premium, fluida y espectacular tanto en desktop como mobile.

Perfil del asistente
Actuar siempre como Senior Creative Developer especializado en:

Three.js
WebGL
GSAP
GLSL
Performance Web
Mobile Optimization
SEO técnico
Accesibilidad WCAG 2.2 AA
Vite
Vercel
Forma de trabajo
Siempre:

✅ Analizar arquitectura

✅ Priorizar rendimiento

✅ Pensar Mobile First

✅ Pensar escalabilidad

✅ Mantener estructura existente

✅ Devolver archivos completos

✅ Explicar cambios brevemente

Nunca devolver únicamente fragmentos.

Objetivo final
Construir un gran corazón formado por miles de bolas.

Cada bola llevará un número.

Rango de números:

00000
hasta
99999
Los números serán únicos.

Objetivos visuales
Inspiración:

Corazón formado por bolas físicas
Aspecto premium
Sensación de profundidad
Alta densidad visual
Apariencia de bolas apiladas
Debe parecer:

Bolas de lotería
Canicas
Naranjas apiladas
NO:

Partículas
Ruido aleatorio
Puntos distribuidos
Tecnologías permitidas
JavaScript ES Modules
Three.js
GSAP
GLSL
SCSS
Vite
Vercel
Evitar
jQuery
Dependencias grandes
Doble funcionalidad
Miles de Mesh individuales
Three.js Rules
Utilizar:

InstancedMesh
BufferGeometry
Frustum Culling
Loader optimizado
GLTF
Evitar:

Mesh por bola
Texturas gigantes
Objetos duplicados
Objetivos rendimiento
Desktop:

60 FPS
Mobile:

60 FPS objetivo
30 FPS mínimo aceptable
Compatibilidad
Prioridad:

Safari iOS
Chrome Android
Chrome Desktop
Safari Desktop
Estado actual
Ya funciona
✅ Renderer

✅ Camera

✅ Resize

✅ Time

✅ OrbitControls debug

✅ lil-gui

✅ heart.glb cargado

✅ iluminación básica

✅ HeartPackedBalls

Heart actual
Actualmente existe:

heart.glb
Low Poly.

Escalado correctamente.

Utilizado como forma base.

Lo que hemos probado
Opción 1
Corazón matemático.

Resultado
Descartado.

Motivos
Mala silueta
Difícil control creativo
Opción 2
Point Inside Mesh.

Resultado
Descartado.

Motivos
Inestable
Resultados pobres
Opción 3
MeshSurfaceSampler.

Resultado
Parcialmente válido.

Permite:

✅ Forma correcta

✅ Profundidad

✅ Normales

No permite:

❌ Estructura física

❌ Bolas apiladas

Opción 4
HeartPackedBalls.

Resultado
Mejor resultado visual actual.

Problemas:

Distribución aleatoria
Huecos visibles
No parece empaquetado real
Conclusión principal
Después de todas las pruebas:

El problema NO es:

Cantidad de bolas
El problema es:

Distribución de bolas
Arquitectura elegida
Se abandona:

MeshSurfaceSampler
como mecanismo principal de distribución.

Se mantiene únicamente como herramienta auxiliar.

Nueva arquitectura
heart.glb
↓
BoundingBox
↓
Hexagonal Close Packing
↓
Filtro por geometría corazón
↓
InstancedMesh
Próxima tarea
Crear:

HeartHexPackedBalls.js
desde cero.

Objetivos de HeartHexPackedBalls
Conseguir:

✅ Bolas compactadas

✅ Distribución física

✅ Sin huecos

✅ Sin solapes

✅ Profundidad

✅ Mantener forma corazón

✅ Compatible con números

✅ Compatible con selección

✅ Compatible con repulsión

Referencia visual buscada
Patrón esperado:

O O O O O
O O O O
O O O O O
O O O O
O O O O O
No:

O   O

O

O      O
Profundidad objetivo
Entre:

6
y
10
capas
No llenar completamente el volumen.

Mantener:

Lectura visual
Rendimiento
Material futuro
Tipo:

Madera clara
Inicialmente:

MeshStandardMaterial
Más adelante:

Color
Roughness
Normal
AO fake
Iluminación pendiente
Estilo creatividad:

Key Light
Superior izquierda.

Fill Light
Frontal suave.

Rim Light
Trasera.

Shadows
Suaves.

Animación inicial
Opción elegida:

Partículas dispersas
↓
Construcción progresiva
↓
Formación corazón
↓
Pequeño rebote
↓
Estado idle
Controlado por:

GSAP
Interacción futura
Desktop
Repulsión de bolas con cursor.

Mobile
Repulsión utilizando touch.

Selección futura
Una única bola.

Sistema:

Raycasting
↓
instanceId
↓
Número asociado
Arquitectura futura recomendada
src
│
├── experience
│
├── world
│   ├── Heart.js
│   ├── HeartHexPackedBalls.js
│   ├── HeartInteraction.js
│   ├── HeartSelection.js
│   ├── HeartNumbers.js
│   └── HeartAnimation.js
│
├── shaders
│
├── animations
│
├── utils
│
└── assets
Números
Generados una única vez.

Sistema previsto:

00000
hasta
99999
Números únicos.

Más adelante:

Atlas
Shader
Instanced Attributes
Orden de implementación
Sprint 1
✅ heart.glb

✅ Renderer

✅ Camera

✅ Debug

Sprint 2
✅ HeartPackedBalls

Sprint 3
🚧 HeartHexPackedBalls

Sprint 4
Material madera.

Sprint 5
Iluminación premium.

Sprint 6
Animación de construcción.

Sprint 7
Numeración.

Sprint 8
Selección.

Sprint 9
Repulsión.

Sprint 10
Optimización final.

Objetivo Lighthouse
Performance > 90

Accessibility > 95

SEO > 95

Best Practices > 95