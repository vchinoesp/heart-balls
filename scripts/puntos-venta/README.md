# Datos del buscador de puntos de venta

`generar.py` convierte las dos fuentes de esta carpeta en los JSON que usa la web:

| Fuente | Comando | Resultado |
| --- | --- | --- |
| `puntos-venta.xlsx` (primera hoja) | `python3 scripts/puntos-venta/generar.py pv` | `public/data/puntos-venta.json` |
| `ES.txt` (GeoNames, códigos postales de España) | `python3 scripts/puntos-venta/generar.py cp` | `public/data/codigos-postales.json` |

Se puede lanzar desde cualquier carpeta: las rutas son relativas al propio script.

## Requisitos

- Python 3.
- `openpyxl`: `python3 -m pip install openpyxl`.

## Actualizar los puntos de venta

1. Sustituye `puntos-venta.xlsx` por el Excel nuevo, con el mismo nombre. La primera fila son las cabeceras y se necesitan estas columnas, en cualquier orden: `DESPACHO`, `ADMON`, `DOMICILIO`, `CODPOSTAL`, `LOCALIDAD`, `LATITUD` y `LONGITUD`.
2. Ejecuta `python3 scripts/puntos-venta/generar.py pv`.
3. Haz commit de `public/data/puntos-venta.json`.

Si una fila tiene un dato no válido, el script se detiene e indica la fila del Excel. Si el Excel está abierto en otro programa y tiene fórmulas sin guardar, guárdalo antes.

`codigos-postales.json` solo hay que regenerarlo (`cp`) si cambia `ES.txt`.

## Formato

- `puntos-venta.json`: `[DESPACHO, ADMON, DOMICILIO, CP, LOCALIDAD, LAT, LNG]`.
- `codigos-postales.json`: `[CP, LNG, LAT]`, con un único punto por CP.
- Las coordenadas se guardan con 5 decimales (unos 1 m de precisión).

## Reglas de búsqueda (`src/utils/PointsOfSale.js`)

1. Si hay puntos de venta en el CP buscado, se muestran todos, ordenados por cercanía al punto del CP.
2. Si no hay, se muestran hasta 5 a 50 km o menos del CP.
3. Si no hay ninguno a 50 km, se muestra el más cercano y hasta otros 2 que estén a 20 km o menos de él.

Las distancias son en línea recta (Haversine), no por carretera.

Los JSON son públicos: cualquiera que visite la web puede descargarlos.
