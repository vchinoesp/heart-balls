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

    sound: {
        src: '/audio/corazon.mp3',
        volume: 0.6,
        beats: [
            [0.02, 0.93, 1.23],
            [2.43, 3.33, 3.62],
            [4.84, 5.72, 6.02],
            [7.24, 8.14, 8.42],
            [9.64, 10.52, 10.83],
            [12.04, 12.93, 13.22],
            [14.44, 15.32, 15.62],
            [16.67, 17.57, 17.87],
            [19.07, 19.97, 20.27],
            [21.47, 22.37, 22.67],
            [23.87, 24.77, 25.07],
            [26.27, 27.17, 27.47]
        ]
    },

    links: {
        buy: ''
    }
};

export default appConfig;
