const prod = import.meta.env?.VITE_PROD === 'true' || import.meta.env?.MODE === 'prod';

const appConfig = {
    prod,

    debugMode: false,

    ageGate: {
        rejectMessageDuration: 4.5
    },

    loader: {
        minDuration: 2.8
    },

    videos: {
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
        buy: '',
        pointsOfSale: ''
    }
};

export default appConfig;
