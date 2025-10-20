// wwwroot/js/site.js
$(document).ready(function () {
    // Configuración inicial y carga de datos
    $.get("/config", function (config) {
        const apiBaseUrl = config.apiBaseUrl;
        const usuarioRol = "admin"; // O tómalo de la configuración según tu lógica

        window.apiBaseUrl = apiBaseUrl;

        // Llamar a la API correcta
        $.get(`${apiBaseUrl}/api/Opciones/listarPorRol/${usuarioRol}`, function (data) {
            console.log(data);

            const $menu = $("#menu-dinamico");
            $menu.empty(); // Limpiar menú existente

            // Agrupar opciones por idCatalogo
            const gruposAgrupados = {};

            data.opciones.forEach(opcion => {
                const idCatalogo = opcion.idCatalogo;

                if (!gruposAgrupados[idCatalogo]) {
                    gruposAgrupados[idCatalogo] = {
                        catalogo_Nombre: opcion.catalogo_Nombre,
                        adicional: opcion.adicional, // Icono
                        opciones: []
                    };
                }

                gruposAgrupados[idCatalogo].opciones.push(opcion);
            });

            // Crear el menú por cada grupo
            Object.keys(gruposAgrupados).forEach((idCatalogo, index) => {
                const grupo = gruposAgrupados[idCatalogo];
                const collapseId = `collapse-${idCatalogo}`;

                // Crear el botón del catálogo con icono
                const $button = $(`
                    <button class="btn btn-toggle d-inline-flex align-items-center rounded border-0 collapsed"
                            data-bs-toggle="collapse" data-bs-target="#${collapseId}" aria-expanded="false">
                        <i class="${grupo.adicional} me-2"></i>
                        ${grupo.catalogo_Nombre}
                    </button>
                `);

                // Crear la lista de opciones (subopciones)
                const $ulOpciones = $('<ul class="btn-toggle-nav list-unstyled fw-normal pb-1 small"></ul>');

                // Ordenar opciones por idOpcion (opcional)
                grupo.opciones.sort((a, b) => a.idOpcion - b.idOpcion);

                grupo.opciones.forEach(opcion => {
                    const $li = $(`
                        <li>
                            <a href="${opcion.vista || '#'}"
                               class="link-body-emphasis d-inline-flex text-decoration-none rounded"
                               data-id-opcion="${opcion.idOpcion}">
                               ${opcion.opcion_Nombre}
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

            console.log("Menú cargado exitosamente");
        })
            .fail(function (xhr, status, error) {
                console.error("Error al obtener el menú:", error);
                console.error("Detalles:", xhr.responseText);
                $("#menu-dinamico").html("<p class='text-danger'>Error al cargar el menú</p>");
            });
    });
});