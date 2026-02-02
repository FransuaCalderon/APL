// wwwroot/js/site.js
$(document).ready(function () {

    console.log("🚀 Usuario actual:", window.usuarioActual);

    let apiBaseUrl = null;
    let apigeeToken = null;

    /* ======================================================
     * 1. OBTENER CONFIGURACIÓN (Api Router)
     * ====================================================== */
    function obtenerConfig() {
        return $.get("/config")
            .then(cfg => {
                apiBaseUrl = cfg.apiBaseUrl;
                console.log("⚙️ Api Router:", apiBaseUrl);
            })
            .catch(err => {
                console.error("❌ Error obteniendo config", err);
                throw err;
            });
    }

    /* ======================================================
     * 2. OBTENER TOKEN APIGEE (DESDE BACKEND)
     * ====================================================== */
    function obtenerTokenApigee() {
        return $.get("/apigee/token")
            .then(resp => {

                if (!resp || !resp.access_token) {
                    console.error("❌ Token inválido recibido", resp);
                    throw "Token inválido";
                }

                apigeeToken = resp.access_token;
                console.log("🔐 Token Apigee OK");
            });
    }

    /* ======================================================
     * 3. CONSUMIR APIGEE API ROUTER (POST)
     * ====================================================== */
    function consumirApigeeMenu() {

        const payload = {
            code_app: "APP20260128155212346",
            http_method: "GET",
            endpoint_path: "api/Opciones/listarOpcionesAutorizadasInternas",
            client: "APL",
            endpoint_query_params: `/${window.usuarioActual}`
        };

        return $.ajax({
            url: apiBaseUrl,
            method: "POST",
            contentType: "application/json",
            headers: {
                "Authorization": `Bearer ${apigeeToken}`
            },
            data: JSON.stringify(payload)
        });
    }

    /* ======================================================
     * 4. RENDERIZAR MENÚ
     * ====================================================== */
    function renderizarMenu(response) {

        if (!response || response.code_status !== 200 || !response.json_response) {
            console.error("❌ Respuesta inválida de Apigee", response);
            $("#menu-dinamico").html(
                "<p class='text-danger p-3'>Error en datos del menú</p>"
            );
            return;
        }

        const grupos = response.json_response.grupos || [];
        const opciones = response.json_response.opciones || [];

        const $menu = $("#menu-dinamico");
        $menu.empty();

        grupos.forEach(grupo => {
            const collapseId = `collapse-${grupo.idgrupo}`;

            const $btnGrupo = $(`
                <button class="btn btn-toggle d-inline-flex align-items-center rounded border-0 collapsed"
                        data-bs-toggle="collapse"
                        data-bs-target="#${collapseId}"
                        aria-expanded="false">
                    ${grupo.grupo}
                </button>
            `);

            const $ulOpciones = $('<ul class="btn-toggle-nav list-unstyled fw-normal pb-1 small"></ul>');

            opciones
                .filter(o => o.idgrupo === grupo.idgrupo)
                .sort((a, b) => a.idopcion - b.idopcion)
                .forEach(op => {
                    $ulOpciones.append(`
                        <li>
                            <a href="${op.vista}"
                               class="link-body-emphasis d-inline-flex text-decoration-none rounded"
                               data-id-opcion="${op.idopcion}"
                               data-ruta-original="${op.vista}">
                                ${op.nombre}
                            </a>
                        </li>
                    `);
                });

            const $collapse = $(`<div class="collapse" id="${collapseId}"></div>`)
                .append($ulOpciones);

            const $liGrupo = $('<li class="mb-1"></li>')
                .append($btnGrupo)
                .append($collapse);

            $menu.append($liGrupo);
        });

        resaltarOpcionActiva();
        console.log("✅ Menú cargado correctamente");
    }

    /* ======================================================
     * 5. RESALTAR OPCIÓN ACTIVA
     * ====================================================== */
    function resaltarOpcionActiva() {
        const rutaActual = window.location.pathname.toLowerCase();

        $('#menu-dinamico a').each(function () {
            const $link = $(this);
            const href = ($link.attr('href') || '').toLowerCase();

            if (!href || href === '#') return;

            const coincide =
                href === rutaActual ||
                (href !== '/' && rutaActual.startsWith(href));

            if (coincide) {
                $link.addClass('active');

                const $collapse = $link.closest('.collapse');
                if ($collapse.length) {
                    $collapse.addClass('show');
                    $collapse.prev('button')
                        .removeClass('collapsed')
                        .attr('aria-expanded', 'true')
                        .addClass('fw-bold text-primary');
                }
            }
        });
    }

    /* ======================================================
     * 6. PERSISTENCIA DE OPCIÓN
     * ====================================================== */
    $(document).on('click', '#menu-dinamico a[data-id-opcion]', function () {
        sessionStorage.setItem('idOpcionActual', $(this).data('id-opcion'));
        sessionStorage.setItem('rutaOpcionActual', $(this).data('ruta-original'));
        sessionStorage.setItem('nombreOpcionActual', $(this).text().trim());
    });

    /* ======================================================
     * 7. FLUJO PRINCIPAL
     * ====================================================== */
    obtenerConfig()
        .then(obtenerTokenApigee)
        .then(consumirApigeeMenu)
        .then(renderizarMenu)
        .catch(err => {
            console.error("🔥 Error crítico cargando menú", err);
            $("#menu-dinamico").html(
                "<p class='text-danger p-3'>Error al cargar el menú</p>"
            );
        });
});

/* ======================================================
 * HELPERS GLOBALES
 * ====================================================== */
window.obtenerIdOpcionActual = () =>
    parseInt(sessionStorage.getItem('idOpcionActual'), 10) || null;

window.obtenerInfoOpcionActual = () => ({
    idOpcion: window.obtenerIdOpcionActual(),
    ruta: sessionStorage.getItem('rutaOpcionActual'),
    nombre: sessionStorage.getItem('nombreOpcionActual')
});
// Autor: JEAN FRANCOIS CALDERON VEAS | Empresa: BMTECSA | Proyecto: SOFTWARE APL