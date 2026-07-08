// wwwroot/js/site.js
$(function () {

    console.log("🚀 Usuario actual:", window.usuarioActual);

    let apiBaseUrl = null;
    let apigeeToken = null;
    let opcionesCorporativas = null;
    console.log("🚀 Accediendo a los datos desde Index.cshtml");

    // Ya puedes leerlas directamente desde window
    console.log("Total de accesos en Index:", window.misAccesos);
    console.log("Accesos filtrados en Index:", window.accesosFiltrados);

    opcionesCorporativas = window.accesosFiltrados.map(item => ({
        idopcion: item.SecuenciaID
    }));

    console.log("opcionesCorporativas:", opcionesCorporativas);

    /*
    

    let moduloIdFiltro = @ViewBag.ModuloFiltroId;
    var misAccesos = @Html.Raw(ViewBag.AccesosJson ?? "[]");

    var usuarioAprobado = @Html.Raw(ViewBag.usuarioAprobadoJson ?? "[]");
    let accesosFiltrados = null;



    /*
    // Función para inicializar y mantener la configuración
    function inicializarAppConfig() {
        // 1. Si el servidor envió datos reales (misAccesos no es null)
        if (typeof serverConfig !== 'undefined' && serverConfig.misAccesos !== null) {
            // Los guardamos en sessionStorage convertido a texto
            sessionStorage.setItem('appConfig', JSON.stringify(serverConfig));
            return serverConfig;
        }

        // 2. Si el servidor NO envió datos (cambio de vista), buscamos en caché
        const configGuardada = sessionStorage.getItem('appConfig');
        if (configGuardada) {
            return JSON.parse(configGuardada); // Convertimos de texto a objeto JS
        }

        // 3. Fallback en caso de que no haya ni datos del servidor ni en caché
        return {
            moduloIdFiltro: "0",
            misAccesos: [],
            usuarioAprobado: {}
        };
    }*/



    // Asignamos a window.appConfig
    //window.appConfig = inicializarAppConfig();
    /*
    window.appConfig.moduloIdFiltro = moduloIdFiltro;
    window.appConfig.usuarioAprobado = usuarioAprobado;
    window.appConfig.misAccesos = misAccesos;


    console.log("window.appConfig recuperado: ", window.appConfig);

    // Tu lógica original de filtrado
    if (window.appConfig && window.appConfig.misAccesos.length > 0) {
        moduloIdFiltro = window.appConfig.moduloIdFiltro;
        misAccesos = window.appConfig.misAccesos;
        usuarioAprobado = window.appConfig.usuarioAprobado;

        window.usuarioActual = window.appConfig.usuarioAprobado.CodigoUsuario;

        // Aplicamos el filtrado usando la variable dinámica
        // Asegúrate de parsear moduloIdFiltro si en tu BD ModuloID es un entero
        accesosFiltrados = misAccesos.filter(x => x.ModuloID == moduloIdFiltro);

        console.log("Mis permisos totales:", misAccesos);
        console.log("Usuario Aprobado:", usuarioAprobado);
        console.log(`Accesos Filtrados (Módulo ${moduloIdFiltro}):`, accesosFiltrados);
        console.log("window.usuarioActual: ", window.usuarioActual);

        opcionesCorporativas = accesosFiltrados.map(item => ({
            idopcion: item.SecuenciaID
        }));

        console.log("opcionesCorporativas: ", opcionesCorporativas);

        // Lógica para DataTables o botones (Ejemplo)
        // if (!accesosFiltrados.some(a => a.PermiteCrear)) { $('#btnAgregarNuevo').hide(); }
    } else {
        console.warn("No se encontraron accesos en el servidor ni en sessionStorage.");
    }*/

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

    /*
    function obtenerTokenApigee() {

        return $.ajax({
            url: "/api/router-proxy",
            method: "POST",
            contentType: "application/json",
            data: JSON.stringify(datosParaRouter),
            success: function (resp) {
                console.log("✅ Respuesta exitosa:", resp);
            },
            error: function (err) {
                console.error("❌ Error validación:", err.responseJSON);
            }
        });
    }*/

    function llamarApiUnicomer(datosDeNegocio) {
        /* 'datosDeNegocio' debe ser un objeto con:
           client, code_app, http_method, endpoint_path
        */

        return $.ajax({
            url: "/api/apigee-router-proxy", // Llamamos a nuestro servidor, no a Apigee
            method: "POST",
            contentType: "application/json",
            data: JSON.stringify(datosDeNegocio),
            success: function (resp) {
                console.log("✅ Respuesta desde Unicomer:", resp);
            },
            error: function (err) {
                console.error("❌ Error en la llamada:", err.responseText);
            }
        });
    }

    /* ======================================================
     * 3. CONSUMIR APIGEE API ROUTER (POST)
     * ====================================================== */

    /*
    function consumirApigeeMenu() {
        const payload = {
            code_app: "APP20260128155212346",
            http_method: "GET",
            endpoint_path: "api/Opciones/listarOpcionesAutorizadasInternas",
            client: "APL",
            endpoint_query_params: `/${window.usuarioActual}`
        };

        return $.ajax({
            url: "/api/apigee-router-proxy",
            method: "POST",
            contentType: "application/json",
            data: JSON.stringify(payload),
            success: function (resp) {
                console.log("✅ Menú cargado correctamente");
                // Aquí puedes llamar a tu función que renderiza el menú
            },
            error: function (xhr) {
                // Validamos si el código de estado es 500 o superior (errores de servidor)
                if (xhr.status >= 500) {
                    console.error("❌ Error Crítico en el Servidor:", xhr.status);
                    alert("El servicio de Apigee no está disponible actualmente. Por favor, contacte a soporte.");
                } else if (xhr.status === 400) {
                    console.warn("⚠️ Error de Validación (400): Revise los parámetros enviados.");
                } else {
                    console.error("❌ Error inesperado:", xhr.status, xhr.responseText);
                }
            }
        });
    }*/

    
    function consumirApigeeMenu() {
        console.log("consumirApigeeMenu");
        console.log("usuarioAprobado: ", window.usuarioAprobado);

        const body = {
            idusuario: window.usuarioAprobado.CodigoUsuario,
            opcioneslista: opcionesCorporativas
        }

        console.log("body para el menu: ", body);


        const payload = {
            code_app: "APP20260128155212346",
            http_method: "POST",
            endpoint_path: "api/Opciones/listarOpcionesAutorizadasCorporativa",
            client: "APL",
            body_request: body
            //endpoint_query_params: `/${window.usuarioActual}`
        };

        return $.ajax({
            url: "/api/apigee-router-proxy",  //RUTA TEMPORAL HASTA Q ESTE EL API GEE
            method: "POST",
            contentType: "application/json",
            data: JSON.stringify(payload),
            success: function (resp) {
                //console.log("resp: ", resp);
                console.log("✅ Menú cargado correctamente");
                // Aquí puedes llamar a tu función que renderiza el menú
            },
            error: function (xhr) {
                // Validamos si el código de estado es 500 o superior (errores de servidor)
                if (xhr.status >= 500) {
                    console.error("❌ Error Crítico en el Servidor:", xhr.status);
                    alert("El servicio de Apigee no está disponible actualmente. Por favor, contacte a soporte.");
                } else if (xhr.status === 400) {
                    console.warn("⚠️ Error de Validación (400): Revise los parámetros enviados.");
                } else {
                    console.error("❌ Error inesperado:", xhr.status, xhr.responseText);
                }
            }
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
        //.then(obtenerTokenApigee)
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