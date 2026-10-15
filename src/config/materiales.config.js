/**
 * Materiales descargables (página materiales.html).
 *
 * Cada sección agrupa materiales. Para cada material:
 *   title    -> nombre que se ve
 *   file     -> ruta del archivo (dentro de public/, p. ej. '/materiales/spot_20s.mp4')
 *               o URL externa
 *   format   -> formato que se muestra (MP4, JPG, PDF, ZIP…)
 *   size     -> peso que se muestra (p. ej. '12 MB'), opcional
 *   preview  -> miniatura (opcional; si no hay, se muestra el icono del formato)
 *
 * Los archivos se dejan en public/materiales/ y se enlazan como '/materiales/…'.
 *
 * TODO: sustituir por el listado real de materiales (el del año pasado en Vue).
 * Los de ahora son de ejemplo, con archivos que ya están en el proyecto.
 */
const materialesConfig = {
    sections: [
        {
            title: 'Logotipos',
            items: [
                {
                    title: 'Logotipo El Sorteo que nos une',
                    file: '/images/logoelsorteoquenosune.svg',
                    format: 'SVG',
                    preview: '/images/logoelsorteoquenosune.svg'
                },
                {
                    title: 'Logotipo Lotería Nacional',
                    file: '/images/logo_loteria.svg',
                    format: 'SVG',
                    preview: '/images/logo_loteria.svg'
                },
                {
                    title: 'Rótulo "Esta Navidad tengo una corazonada"',
                    file: '/images/txt_corazonada.svg',
                    format: 'SVG',
                    preview: '/images/txt_corazonada.svg'
                }
            ]
        },
        {
            title: 'Imágenes',
            items: [
                {
                    title: 'Imagen para redes sociales',
                    file: '/images/img_compartir.jpg',
                    format: 'JPG',
                    size: '600 KB',
                    preview: '/images/img_compartir.jpg'
                }
            ]
        }
    ]
};

export default materialesConfig;
