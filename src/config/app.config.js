/**
 * Configuración de la web (pantallas, vídeos, enlaces).
 *
 * prod: true -> versión de producción: sin #debug, #fps / #stats ni
 *               debugMode. Se activa de cualquiera de estas formas:
 *                 - `npm run build:prod` (vite build --mode prod)
 *                 - variable de entorno VITE_PROD=true (Vercel: Settings →
 *                   Environment Variables, marcada solo para "Production")
 *                 - a mano: cambiar la línea de abajo por `const prod = true;`
 *
 * debugMode: true -> se salta el selector de edad (para probar animaciones
 *                    sin pasar por él cada vez). En prod no tiene efecto.
 */
const prod = import.meta.env?.VITE_PROD === 'true' || import.meta.env?.MODE === 'prod';

const appConfig = {
    prod,

    debugMode: false,

    ageGate: {
        // Segundos que se ve el aviso "Lo sentimos, no cumples con la edad"
        rejectMessageDuration: 4.5
    },

    loader: {
        // Duración mínima de la animación del electrocardiograma (s),
        // aunque todo cargue antes: la animación siempre se ve completa
        minDuration: 2.8
    },

    videos: {
        // TODO: poner los IDs reales de YouTube (lo que va tras ?v= en la URL)
        anuncio: {
            id: 'M7lc1UVf-VE',
            title: 'Anuncio El Sorteo que nos une'
        },
        making: {
            id: 'M7lc1UVf-VE',
            title: 'Making of El Sorteo que nos une'
        }
    },

    // Enlaces del popup de la bola elegida
    links: {
        // "Compra tu décimo". {number} se sustituye por el número elegido con
        // 5 cifras (p. ej. 02845). TODO: URL real
        buy: '#comprar-{number}',
        // "Buscar punto de venta". Vacío ('') = el botón no se muestra
        pointsOfSale: ''
    }
};

export default appConfig;
