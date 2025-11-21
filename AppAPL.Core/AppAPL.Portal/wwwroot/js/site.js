// wwwroot/js/site.js
$(document).ready(function () {

    // ----- ELIMINADO -----
    // const rutasMapeo = { ... };
    // function obtenerRutaReal(rutaApi) { ... }
    // Ya no son necesarios, usaremos la "vista" directamente.

    // Función para resaltar la opción activa (CORREGIDA)
    function resaltarOpcionActiva() {
        // Convertir la ruta actual a minúsculas para una comparación consistente
        const rutaActual = window.location.pathname.toLowerCase();

        $('#menu-dinamico a').each(function () {
            const $link = $(this);
            const href = $link.attr('href');

            // Limpiar la clase 'active' de todos los enlaces primero
            $link.removeClass('active');

            if (href && href !== '#') {
                // Convertir también el href a minúsculas
                const hrefMinusculas = href.toLowerCase();

                // Comparar la ruta actual con el href del enlace (ambos en minúsculas)
                if (hrefMinusculas === rutaActual || (hrefMinusculas !== '/' && rutaActual.startsWith(hrefMinusculas))) {

                    $link.addClass('active'); // <-- Aquí se aplica la clase

                    // Expandir el grupo padre
                    $link.closest('.collapse').addClass('show');
                    $link.closest('.collapse').prev('button').attr('aria-expanded', 'true').removeClass('collapsed');
                }
            }
        });
    }


    // Configuración inicial y carga de datos
    $.get("/config", function (config) {
        const apiBaseUrl = config.apiBaseUrl;
        const idUsuario = 1; // O tómalo de la configuración según tu lógica

        window.apiBaseUrl = apiBaseUrl;

        $.ajax({
            url: `${apiBaseUrl}/api/Opciones/ListarOpcionesAutorizadasInternas/${idUsuario}`,
            method: "GET",
            headers: {
                // Tus headers
                "idopcion": "1",
                "usuario": "admin"
            },
            success: function (data) {
                console.log("data de opciones listar por rol", data);

                const $menu = $("#menu-dinamico");
                $menu.empty(); // Limpiar menú existente

                // ----- INICIO DE LÓGICA MODIFICADA -----

                // 1. Obtener las listas principales del JSON
                const grupos = data.grupos;
                const todasLasOpciones = data.opciones;

                // 2. Iterar sobre la lista de GRUPOS para crear las secciones
                grupos.forEach(grupo => {
                    const idGrupo = grupo.idgrupo;
                    const nombreGrupo = grupo.grupo;
                    const collapseId = `collapse-${idGrupo}`;

                    // Crear el botón del grupo
                    // NOTA: Tu nueva API no parece incluir un campo para ícono (como 'adicional' antes).
                    // Si lo necesitas, debes agregarlo a la respuesta de 'grupos' en tu API.
                    // Por ahora, lo creo sin ícono.
                    const $button = $(`
                        <button class="btn btn-toggle d-inline-flex align-items-center rounded border-0 collapsed"
                                data-bs-toggle="collapse" data-bs-target="#${collapseId}" aria-expanded="false">
                            ${nombreGrupo}
                        </button>
                    `);

                    // Crear la lista de opciones (subopciones)
                    const $ulOpciones = $('<ul class="btn-toggle-nav list-unstyled fw-normal pb-1 small"></ul>');

                    // 3. Filtrar las opciones que pertenecen a ESTE grupo
                    const opcionesDelGrupo = todasLasOpciones.filter(opcion => opcion.idgrupo === idGrupo);

                    // 4. Ordenar y agregar cada opción a la lista
                    opcionesDelGrupo.sort((a, b) => a.idopcion - b.idopcion); // Ordenar por idopcion

                    opcionesDelGrupo.forEach(opcion => {
                        // Usar la ruta 'vista' directamente
                        const rutaReal = opcion.vista || '#';
                        const nombreOpcion = opcion.nombre; // Campo 'nombre' de la nueva API

                        const $li = $(`
                            <li>
                                <a href="${rutaReal}"
                                   class="link-body-emphasis d-inline-flex text-decoration-none rounded"
                                   data-id-opcion="${opcion.idopcion}"
                                   data-ruta-original="${opcion.vista}">
                                   ${nombreOpcion}
                                </a>
                            </li>
                        `);
                        $ulOpciones.append($li);
                    });

                    // 5. Crear el contenedor colapsable
                    const $collapseDiv = $(`
                        <div class="collapse" id="${collapseId}"></div>
                    `).append($ulOpciones);

                    // 6. Agrupar todo dentro del <li> principal
                    const $liGrupo = $('<li class="mb-1"></li>')
                        .append($button)
                        .append($collapseDiv);

                    // 7. Agregarlo al menú principal
                    $menu.append($liGrupo);
                });

                // ----- FIN DE LÓGICA MODIFICADA -----

                // Resaltar la opción activa después de cargar el menú
                resaltarOpcionActiva();

                // ✅ ===== CÓDIGO NUEVO: CAPTURAR IDOPCION AL HACER CLIC ===== ✅
                // Capturar clicks en opciones del menú para guardar el idopcion en sessionStorage
                $(document).on('click', '#menu-dinamico a[data-id-opcion]', function (e) {
                    const idOpcion = $(this).data('id-opcion');
                    const rutaOriginal = $(this).data('ruta-original');
                    const nombreOpcion = $(this).text().trim();

                    // Guardar en sessionStorage para uso en otras páginas
                    sessionStorage.setItem('idOpcionActual', idOpcion);
                    sessionStorage.setItem('rutaOpcionActual', rutaOriginal);
                    sessionStorage.setItem('nombreOpcionActual', nombreOpcion);

                    console.log('Opción del menú seleccionada:', {
                        id: idOpcion,
                        nombre: nombreOpcion,
                        ruta: rutaOriginal
                    });
                });
                // ✅ ===== FIN CÓDIGO NUEVO ===== ✅

                console.log("Menú cargado exitosamente con nueva estructura");
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

// ✅ ===== FUNCIÓN HELPER GLOBAL ===== ✅
// Función global para obtener el idOpcion actual desde sessionStorage
window.obtenerIdOpcionActual = function () {
    const idOpcion = parseInt(sessionStorage.getItem('idOpcionActual'), 10);
    if (!idOpcion) {
        console.warn('No se encontró idOpcionActual en sessionStorage');
        return null;
    }
    return idOpcion;
};

// Función global para obtener toda la información de la opción actual
window.obtenerInfoOpcionActual = function () {
    return {
        idOpcion: parseInt(sessionStorage.getItem('idOpcionActual'), 10) || null,
        ruta: sessionStorage.getItem('rutaOpcionActual') || null,
        nombre: sessionStorage.getItem('nombreOpcionActual') || null
    };
};
// ✅ ===== FIN FUNCIÓN HELPER GLOBAL ===== ✅


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