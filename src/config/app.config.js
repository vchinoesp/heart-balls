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
            id: 'ksLwcaZfv5c',
            title: 'Spot TV'
        },
        making: {
            id: '',
            title: 'Making of El Sorteo que nos une'
        }
    },

    links: {
        buy: ''
    }
};

export default appConfig;
