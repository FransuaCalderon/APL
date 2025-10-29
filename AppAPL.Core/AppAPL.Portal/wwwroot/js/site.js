// wwwroot/js/site.js
$(document).ready(function () {
    // Mapeo de rutas de la API a rutas reales de MVC
    const rutasMapeo = {
        '/Configuracion/TipoCatalogo': '/CatalogoTipo/Index',
        '/Configuracion/Catalogos': '/Catalogo/Index',
        '/Configuracion/Opciones': '/Opciones/Index',
        '/Configuracion/Pais': '/Pais/Index',
        '/Configuracion/EstructuraPais': '/EstructuraPais/Index',
        '/Configuracion/DivisionPolitica': '/DivisionPolitica/Index'
    };

    // Función para convertir ruta de API a ruta real
    function obtenerRutaReal(rutaApi) {
        return rutasMapeo[rutaApi] || rutaApi || '#';
    }

    // Función para resaltar la opción activa
    function resaltarOpcionActiva() {
        const rutaActual = window.location.pathname;

        $('#menu-dinamico a').each(function () {
            const $link = $(this);
            const href = $link.attr('href');

            // Comparar la ruta actual con el href del enlace
            if (href && href !== '#' && (href === rutaActual || rutaActual.startsWith(href))) {
                $link.addClass('active');
                // Expandir el grupo padre
                $link.closest('.collapse').addClass('show');
                $link.closest('.collapse').prev('button').attr('aria-expanded', 'true').removeClass('collapsed');
            }
        });
    }

    // Configuración inicial y carga de datos
    $.get("/config", function (config) {
        const apiBaseUrl = config.apiBaseUrl;
        const usuarioRol = "admin"; // O tómalo de la configuración según tu lógica

        window.apiBaseUrl = apiBaseUrl;

        $.ajax({
            url: `${apiBaseUrl}/api/Opciones/listarPorRol/${usuarioRol}`,
            method: "GET",
            headers: {
               
                "idopcion": "1",
                "usuario": "admin"
            },
            success: function (data) {
                console.log("data de opciones listar por rol", data);

                const $menu = $("#menu-dinamico");
                $menu.empty(); // Limpiar menú existente

                // Agrupar opciones por idcatalogo
                const gruposAgrupados = {};

                data.opciones.forEach(opcion => {
                    const idcatalogo = opcion.idcatalogo;

                    if (!gruposAgrupados[idcatalogo]) {
                        gruposAgrupados[idcatalogo] = {
                            catalogo_nombre: opcion.catalogo_nombre,
                            adicional: opcion.adicional, // Icono
                            opciones: []
                        };
                    }

                    gruposAgrupados[idcatalogo].opciones.push(opcion);
                });

                // Crear el menú por cada grupo
                Object.keys(gruposAgrupados).forEach((idcatalogo, index) => {
                    const grupo = gruposAgrupados[idcatalogo];
                    const collapseId = `collapse-${idcatalogo}`;
                    //console.log("grupoo ", grupo);
                    // Crear el botón del catálogo con icono
                    const $button = $(`
                    <button class="btn btn-toggle d-inline-flex align-items-center rounded border-0 collapsed"
                            data-bs-toggle="collapse" data-bs-target="#${collapseId}" aria-expanded="false">
                        <i class="${grupo.adicional} me-2"></i>
                        ${grupo.catalogo_nombre}
                    </button>
                `);

                    // Crear la lista de opciones (subopciones)
                    const $ulOpciones = $('<ul class="btn-toggle-nav list-unstyled fw-normal pb-1 small"></ul>');

                    // Ordenar opciones por idopcion (opcional)
                    grupo.opciones.sort((a, b) => a.idopcion - b.idopcion);

                    grupo.opciones.forEach(opcion => {
                        // Convertir la ruta de la API a la ruta real del controlador
                        const rutaReal = obtenerRutaReal(opcion.vista);

                        const $li = $(`
                        <li>
                            <a href="${rutaReal}"
                               class="link-body-emphasis d-inline-flex text-decoration-none rounded"
                               data-id-opcion="${opcion.idopcion}"
                               data-ruta-original="${opcion.vista}">
                               ${opcion.opcion_nombre}
                            </a>
                        </li>
                    `);
                        $ulOpciones.append($li);
                    });

                    // Crear el contenedor colapsable
                    const $collapseDiv = $(`
                    <div class="collapse" id="${collapseId}"></div>
                `).append($ulOpciones);

                    // Agrupar todo dentro del <li>
                    const $liCatalogo = $('<li class="mb-1"></li>')
                        .append($button)
                        .append($collapseDiv);

                    // Agregarlo al menú principal
                    $menu.append($liCatalogo);
                });

                // Resaltar la opción activa después de cargar el menú
                resaltarOpcionActiva();

                console.log("Menú cargado exitosamente");
            },
            error: function (xhr, status, error) {
                console.error("Error al obtener el menú:", error);
                console.error("Detalles:", xhr.responseText);
                $("#menu-dinamico").html("<p class='text-danger'>Error al cargar el menú</p>");
            }
        });


        /*
        // Llamar a la API correcta
        $.get(`${apiBaseUrl}/api/Opciones/listarPorRol/${usuarioRol}`, function (data) {
            
        })
            .fail(function (xhr, status, error) {
                console.error("Error al obtener el menú:", error);
                console.error("Detalles:", xhr.responseText);
                $("#menu-dinamico").html("<p class='text-danger'>Error al cargar el menú</p>");
            });*/
    });
});


// Función para inicializar el marcado de filas en cualquier DataTable
function inicializarMarcadoFilas(tablaSelector) {
    console.log('Inicializando marcado de filas para:', tablaSelector);

    // Click en la fila completa
    $(document).on('click', `${tablaSelector} tbody tr`, function (e) {
        // Evitar que se active si se hizo clic en un botón o dentro de action-buttons
        if ($(e.target).closest('.action-buttons, .btn-action').length > 0) {
            console.log('Click en botón, ignorando marcado de fila');
            return;
        }

        const $fila = $(this);
        console.log('Click en fila detectado');

        // Si la fila ya está seleccionada (con cualquier clase), la deseleccionamos
        if ($fila.hasClass('fila-seleccionada') || $fila.hasClass('fila-accion')) {
            $fila.removeClass('fila-seleccionada fila-accion');
            console.log('Fila deseleccionada');
        } else {
            // Remover ambas clases de todas las filas
            $(`${tablaSelector} tbody tr`).removeClass('fila-seleccionada fila-accion');
            // Agregar la clase GRIS solo a la fila clickeada
            $fila.addClass('fila-seleccionada');
            console.log('Fila seleccionada con GRIS');
        }
    });

    // Efecto hover solo si NO está seleccionada
    $(document).on('mouseenter', `${tablaSelector} tbody tr`, function () {
        if (!$(this).hasClass('fila-seleccionada') && !$(this).hasClass('fila-accion')) {
            $(this).addClass('fila-marcada');
        }
    });

    $(document).on('mouseleave', `${tablaSelector} tbody tr`, function () {
        $(this).removeClass('fila-marcada');
    });
}

// Función global para obtener los datos de la fila seleccionada
function obtenerFilaSeleccionada(tablaSelector) {
    const tabla = $(tablaSelector).DataTable();
    const $filaSeleccionada = $(`${tablaSelector} tbody tr.fila-seleccionada`);

    if ($filaSeleccionada.length > 0) {
        return tabla.row($filaSeleccionada).data();
    }

    return null;
}

// Función para limpiar selección
function limpiarSeleccion(tablaSelector) {
    $(`${tablaSelector} tbody tr`).removeClass('fila-seleccionada fila-accion');
    console.log('Selección limpiada para:', tablaSelector);
}

// Función para marcar una fila por ID (compatible con tu código existente)
// Esta función es SOLO para cuando se hace clic en botones de ACCIÓN
function marcarFilaPorId(tablaSelector, id) {
    console.log('Marcando fila por ID (acción):', id);
    // Quita ambas clases de todas las filas
    $(`${tablaSelector} tbody tr`).removeClass('fila-seleccionada fila-accion');

    // Busca la fila con ese ID y márcala con el estilo AMARILLO
    $(`${tablaSelector} tbody tr`).each(function () {
        const filaId = $(this).find('td:first').text().trim();
        if (filaId == id) {
            $(this).addClass('fila-accion'); // AMARILLO para acciones
            console.log('Fila marcada con AMARILLO (acción) - ID:', id);
        }
    });
}