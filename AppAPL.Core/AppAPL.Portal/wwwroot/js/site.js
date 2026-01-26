// wwwroot/js/site.js
$(document).ready(function () {
    console.log("🚀 Usuario actual capturado:", window.usuarioActual);

    /**
     * Resalta la opción activa basándose en la URL actual.
     */
    function resaltarOpcionActiva() {
        const rutaActual = window.location.pathname.toLowerCase();
        console.log("🔍 Analizando ruta activa:", rutaActual);

        let encontrada = false;

        $('#menu-dinamico a').each(function () {
            const $link = $(this);
            const href = $link.attr('href');

            if (href && href !== '#') {
                const hrefMinusculas = href.toLowerCase();

                // Lógica de coincidencia: Exacta o si la ruta empieza por el href (evitando root)
                const esCoincidencia = (hrefMinusculas === rutaActual) ||
                    (hrefMinusculas !== '/' && rutaActual.startsWith(hrefMinusculas));

                if (esCoincidencia) {
                    $link.addClass('active');
                    encontrada = true;

                    // Expandir ancestros (acordeón)
                    const $collapsePadre = $link.closest('.collapse');
                    if ($collapsePadre.length > 0) {
                        $collapsePadre.addClass('show');
                        const $btnGrupo = $collapsePadre.prev('button');
                        if ($btnGrupo.length > 0) {
                            $btnGrupo.removeClass('collapsed').attr('aria-expanded', 'true');
                            $btnGrupo.addClass('fw-bold text-primary');
                        }
                    }
                }
            }
        });

        if (!encontrada) console.warn("⚠️ No se encontró coincidencia en el menú para esta ruta.");
    }

    // Configuración inicial y carga de datos
    $.get("/config", function (config) {
        window.apiBaseUrl = config.apiBaseUrl;

        $.ajax({
            url: `${window.apiBaseUrl}/api/Opciones/listarOpcionesAutorizadasInternas/${window.usuarioActual}`,
            method: "GET",
            success: function (response) {
                // Validación de integridad del nuevo JSON
                if (!response || response.code_status !== 200 || !response.json_response.data) {
                    console.error("QA Report: Error en la estructura del servidor.");
                    return;
                }

                const dataInterior = response.json_response.data;
                const grupos = dataInterior.grupos || [];
                const todasLasOpciones = dataInterior.opciones || [];

                const $menu = $("#menu-dinamico");
                $menu.empty();

                // --- CONSTRUCCIÓN DEL MENÚ ---
                grupos.forEach(grupo => {
                    const idGrupo = grupo.idgrupo;
                    const nombreGrupo = grupo.grupo;
                    const collapseId = `collapse-${idGrupo}`;

                    // Botón del Grupo (Acordeón)
                    const $button = $(`
                        <button class="btn btn-toggle d-inline-flex align-items-center rounded border-0 collapsed"
                                data-bs-toggle="collapse" data-bs-target="#${collapseId}" aria-expanded="false">
                            ${nombreGrupo}
                        </button>
                    `);

                    const $ulOpciones = $('<ul class="btn-toggle-nav list-unstyled fw-normal pb-1 small"></ul>');

                    // Filtrar opciones por grupo y ordenar por idopcion (o nombre)
                    const opcionesDelGrupo = todasLasOpciones
                        .filter(op => op.idgrupo === idGrupo)
                        .sort((a, b) => a.idopcion - b.idopcion);

                    opcionesDelGrupo.forEach(opcion => {
                        const rutaReal = opcion.vista || '#';
                        const $li = $(`
                            <li>
                                <a href="${rutaReal}" 
                                   class="link-body-emphasis d-inline-flex text-decoration-none rounded"
                                   data-id-opcion="${opcion.idopcion}"
                                   data-ruta-original="${opcion.vista}">
                                   ${opcion.nombre}
                                </a>
                            </li>
                        `);
                        $ulOpciones.append($li);
                    });

                    // Ensamblado
                    const $collapseDiv = $(`<div class="collapse" id="${collapseId}"></div>`).append($ulOpciones);
                    const $liGrupo = $('<li class="mb-1"></li>').append($button).append($collapseDiv);

                    $menu.append($liGrupo);
                });

                resaltarOpcionActiva();
                console.log("✅ Menú renderizado correctamente.");
            },
            error: function (xhr) {
                console.error("Critical Error al obtener el menú:", xhr.responseText);
                $("#menu-dinamico").html("<p class='text-danger p-3'>Error de conexión al cargar menú.</p>");
            }
        });
    });

    // Event Delegator para persistencia de opción seleccionada
    $(document).on('click', '#menu-dinamico a[data-id-opcion]', function () {
        const info = {
            id: $(this).data('id-opcion'),
            nombre: $(this).text().trim(),
            ruta: $(this).data('ruta-original')
        };
        sessionStorage.setItem('idOpcionActual', info.id);
        sessionStorage.setItem('rutaOpcionActual', info.ruta);
        sessionStorage.setItem('nombreOpcionActual', info.nombre);
    });
});

// --- FUNCIONES GLOBALES (DataTable Helpers) ---

window.obtenerIdOpcionActual = () => parseInt(sessionStorage.getItem('idOpcionActual'), 10) || null;

window.obtenerInfoOpcionActual = () => ({
    idOpcion: window.obtenerIdOpcionActual(),
    ruta: sessionStorage.getItem('rutaOpcionActual'),
    nombre: sessionStorage.getItem('nombreOpcionActual')
});

function inicializarMarcadoFilas(tablaSelector) {
    $(document).on('click', `${tablaSelector} tbody tr`, function (e) {
        if ($(e.target).closest('.action-buttons, .btn-action').length > 0) return;

        const $fila = $(this);
        const yaSeleccionada = $fila.hasClass('fila-seleccionada') || $fila.hasClass('fila-accion');

        $(`${tablaSelector} tbody tr`).removeClass('fila-seleccionada fila-accion');
        if (!yaSeleccionada) $fila.addClass('fila-seleccionada');
    });

    $(document).on('mouseenter', `${tablaSelector} tbody tr`, function () {
        if (!$(this).is('.fila-seleccionada, .fila-accion')) $(this).addClass('fila-marcada');
    }).on('mouseleave', `${tablaSelector} tbody tr`, function () {
        $(this).removeClass('fila-marcada');
    });
}

// Autor: JEAN FRANCOIS CALDERON VEAS | Empresa: BMTECSA | Proyecto: SOFTWARE APL