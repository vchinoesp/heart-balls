PROMPT INICIAL DEL PROYECTO
Quiero que actúes como un Senior Creative Developer especializado en:
Three.js
WebGL
GSAP
Shaders GLSL
JavaScript moderno (ES Modules)
Performance Web
Accesibilidad WCAG 2.2 AA
SEO técnico
Mobile Optimization
Vite
Vercel
Este proyecto es una experiencia digital premium con animaciones muy cuidadas y acabados visuales de alta calidad.
Tu forma de trabajar debe ser:
Muy meticulosa.
Muy orientada a rendimiento.
Muy orientada a UX.
Muy orientada a animaciones premium.
Muy organizada arquitectónicamente.
Siempre pensando en desktop y mobile.
Siempre generando código completo actualizado cuando modifiques archivos.
IMPORTANTE:
Cuando me propongas cambios en archivos:
Devuélveme siempre el archivo completo.
No me envíes únicamente fragmentos.
Explica brevemente los cambios.
Mantén la arquitectura existente.



REGLAS DEL PROYECTO
Debes seguir estrictamente las siguientes reglas:
Markdown
# Project Rules

## Objetivo

Crear una experiencia WebGL premium basada en Three.js y GSAP.

La experiencia debe sentirse fluida, elegante y moderna tanto en desktop como mobile.
 
---

# Tecnologías

## Permitidas

- JavaScript (ES Modules)
- Three.js
- GSAP
- SCSS
- Vite
- Vercel

## Evitar

- jQuery
- Frameworks innecesarios
- Librerías pesadas para animaciones
- Dependencias duplicadas

---

# Filosofía de desarrollo

1. Mobile First
2. Performance First
3. Accessibility First
4. SEO Friendly
5. Progressive Enhancement

---

# Código

## JavaScript

- Usar clases cuando aporte valor.
- Evitar funciones gigantes.
- Responsabilidad única.
- No usar variables globales.

---



# Animaciones

Todas las animaciones pasan por GSAP.

No utilizar:

setInterval()

Ni:

setTimeout()

para animaciones.

Utilizar:

gsap.to()
gsap.from()
gsap.timeline()
 
---

# Experiencia visual

Las animaciones deben:

- Tener intención.
- Tener ritmo.
- Tener suavidad.

Evitar movimientos bruscos.

Preferred easings:

power2.out
power3.out
expo.out

Para elementos hero:

elastic.out()

solo en casos especiales.
 
---

# Mobile

Objetivo:

60 FPS

Dispositivos prioritarios:

- iPhone
- Safari iOS
- Chrome Android

---

# Accesibilidad

Cumplir WCAG 2.2 AA

Obligatorio:

- Navegación teclado
- Focus visible
- Contraste AA
- aria-label cuando proceda
- Respeto a prefers-reduced-motion

---

# SEO

La información principal nunca dependerá exclusivamente de WebGL.

Siempre existirán:

- h1
- textos indexables
- metadatos
- OpenGraph

---

# Performance

Objetivos Lighthouse:

Performance > 90

Accessibility > 95

SEO > 95

Best Practices > 95
 
---

# Assets

Imágenes:

- WebP
- AVIF cuando sea posible

Vídeos:

- mp4 h264
- compresión optimizada

---

# Estilos

Metodología BEM.
 
---

# Commits

feat:
fix:
refactor:
style:
perf:
 
---

# Calidad final

Antes de producción:

- Sin errores consola
- Sin warnings consola
- Lighthouse validado
- Tests mobile realizados
- Safari validado
  Mostrar más líneas



CONTEXTO DEL PROYECTO
Vamos a desarrollar una experiencia 3D interactiva.
La idea principal es construir un gran corazón formado por miles de bolas numeradas.
Los números van desde:
Plain Text
00000
hasta
99999
Mostrar más líneas
Más adelante se definirán las creatividades finales.
La experiencia utilizará:
Plain Text
Three.js
GSAP
Shaders
InstancedMesh
Mostrar más líneas
La intención es lograr:
Alto impacto visual.
Excelente rendimiento.
Compatibilidad mobile.
Buen SEO.
Buena accesibilidad.
El proyecto se desplegará en:
Plain Text
GitHub
↓
Vercel
Mostrar más líneas
Con previews automáticas para pruebas en móvil.






ESTADO ACTUAL DEL CÓDIGO
Actualmente ya existe una escena Three.js funcional.
He probrado a utilizar un .glb para adaptanos a la forma del corazón, pero no logro a que las bolas se colequen como en la creatividad, cada bola lleva un nº que se tiene que ver los nº van del 00.000 al 99.999, vamos haciendo pruebas y construyendo el proyecto poco a poco.  Cada bola es como una bola de madera, las bolas de abajo fuera del corazon no la tengas en cuenta, tb te paso como una img para ver como esta formado el corazon por si vale. 
La intención es luego añadirle a las bolas un efecto de repulsión como este ejemplo, https://optimistic-cantaloupe-850021.framer.app/. 

Te voy a pasar las creatividades y la carpeta del proyecto, quiero que analices todo lo que llevamos ya hecho y dime si vamos por buen camino, o lo mejor es empezar de nuevo.