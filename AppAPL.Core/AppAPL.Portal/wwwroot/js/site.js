// wwwroot/js/site.js
$(document).ready(function () {
    // Configuración inicial y carga de datos
    $.get("/config", function (config) {
        const apiBaseUrl = config.apiBaseUrl;
        const idGrupo = config.idGrupo;

        window.apiBaseUrl = apiBaseUrl;
        window.idGrupo = idGrupo;

        $.get(`${apiBaseUrl}/api/Grupo/listar/${idGrupo}`, function (data) {
            console.log(data);

            const $menu = $("#menu-dinamico");
            //$menu.empty(); // limpiar

            data.forEach((item, index) => {
                const catalogo = item.catalogo;
                const opciones = item.opciones;

                // ID único para el collapse
                const collapseId = `collapse-${index}`;

                // Crear el botón del catálogo
                const $button = $(`
                <button class="btn btn-toggle d-inline-flex align-items-center rounded border-0 collapsed"
                        data-bs-toggle="collapse" data-bs-target="#${collapseId}" aria-expanded="false">
                    ${catalogo.nombre}
                </button>
            `);

                // Crear la lista de opciones
                const $ulOpciones = $('<ul class="btn-toggle-nav list-unstyled fw-normal pb-1 small"></ul>');

                opciones.forEach(opcion => {
                    const $li = $(`
                    <li>
                        <a href="${opcion.vista || '#'}"
                           class="link-body-emphasis d-inline-flex text-decoration-none rounded">
                           ${opcion.nombre}
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



        })
        .fail(function (xhr, status, error) {
            console.error("Error al obtener el menú:", error);
            $("#menu-dinamico").html("<p class='text-danger'>Error al cargar el menú</p>");
        });
    });
});
