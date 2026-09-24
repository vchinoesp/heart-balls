/**
 * Configuración de la web (pantallas, vídeos, enlaces).
 *
 * debugMode: true  -> se salta el selector de edad (para probar animaciones
 *                     sin pasar por él cada vez). ¡Dejar en false en producción!
 */
const appConfig = {
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

    links: {
        // TODO: URLs reales. {number} se sustituye por el número elegido (p. ej. 02845)
        buy: '#comprar-{number}',
        pointsOfSale: '#puntos-de-venta'
    }
};

export default appConfig;
