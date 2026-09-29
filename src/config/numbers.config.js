/**
 * Números NO disponibles a la venta.
 *
 * Los números de esta lista no aparecen en ninguna bola del corazón (ni se
 * pueden elegir). Lista vacía = se usan todos los números 00000-99999.
 *
 * Formatos admitidos (se pueden mezclar):
 *   2845        -> número
 *   '02845'     -> texto con 5 cifras
 *   '02.845'    -> formato lotería con punto
 *
 * Ejemplo:
 *   unavailable: [2845, '00001', '99.999']
 */
const numbersConfig = {
    unavailable: []
};

export default numbersConfig;
