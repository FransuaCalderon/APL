// ~/js/Promocion/InactivarPromocion.js

// ===============================================================
// Variables globales
// ===============================================================
let tabla;
let ultimaFilaModificada = null;

// ===============================================================
// FUNCIONES HELPER
// ===============================================================
function obtenerUsuarioActual() {
    return window.usuarioActual
        || sessionStorage.getItem('usuarioActual')
        || sessionStorage.getItem('usuario')
        || localStorage.getItem('usuarioActual')
        || "admin";
}

function getIdOpcionSeguro() {
    try {
        return (
            (window.obtenerIdOpcionActual && window.obtenerIdOpcionActual()) ||
            (window.obtenerInfoOpcionActual && window.obtenerInfoOpcionActual().idOpcion) ||
            "0"
        );
    } catch (e) {
        console.error("Error obteniendo idOpcion:", e);
        return "0";
    }
}

function manejarErrorGlobal(xhr, accion) {
    console.error(`Error al ${accion}:`, xhr.responseText);
    Swal.fire({
        icon: 'error',
        title: 'Error de Comunicación',
        text: `No se pudo completar la acción: ${accion}.`
    });
}

function formatearMoneda(v) {
    return (v || 0).toLocaleString("es-EC", { style: "currency", currency: "USD" });
}

function formatearFecha(f) {
    if (!f) return "";
    const d = new Date(f);
    return d.toLocaleDateString("es-EC");
}

/**
 * Extrae el nombre del archivo desde una ruta completa, removiendo el GUID prefix
 * Ej: "C:\Soportes\Promociones\guid_archivo.xlsx" => "archivo.xlsx"
 */
function obtenerNombreArchivo(rutaCompleta) {
    if (!rutaCompleta) return "";
    var nombreArchivo = rutaCompleta.replace(/^.*[\\/]/, '');
    var sinGuid = nombreArchivo.replace(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}_/i, '');
    return sinGuid || nombreArchivo;
}

// ===============================================================
// DOCUMENT READY
// ===============================================================
$(document).ready(function () {
    console.log("=== INICIO - InactivarPromocion (Estructura Post-REST) ===");

    $.get("/config", function (config) {
        console.log("[config] Config cargada:", config);
        window.apiBaseUrl = config.apiBaseUrl;
        cargarBandeja();
    }).fail(function (xhr) {
        console.error("[config] Error al cargar /config:", xhr);
        console.warn("[config] Intentando cargar bandeja sin config...");
        cargarBandeja();
    });

    // Eventos de Navegación
    $("#btnVolverTabla, #btnVolverAbajo").on("click", function () {
        cerrarDetalle();
    });

    // Botón Limpiar Filtros
    $("body").on("click", "#btnLimpiar", function () {
        if (tabla) {
            tabla.search("").draw();
        }
    });

    // Botón Inactivar
    $("#btnInactivarPromocion").on("click", function () {
        inactivarPromocion();
    });

    // Botón PDF - Ver Soporte
    $("#btnVerSoporte").on("click", function () {
        const soporte = $(this).data("soporte");
        if (!soporte) {
            Swal.fire({ icon: "info", title: "Sin soporte", text: "Esta promoción no tiene un archivo de soporte adjunto." });
            return;
        }
        const urlVisualizacion = `/api/Promocion/ver-soporte?ruta=${encodeURIComponent(soporte)}`;
        window.open(urlVisualizacion, "_blank");
    });

    // Botón Registro de Log
    $("#btnVerLog").on("click", function () {
        const idPromocion = parseInt($("#lblIdPromocion").text(), 10);
        if (!idPromocion || isNaN(idPromocion)) {
            Swal.fire({ icon: "warning", title: "Atención", text: "No se pudo determinar el Id de la promoción." });
            return;
        }
        abrirModalLog(idPromocion);
    });

    // Botón Registro de Aprobaciones
    $("#btnVerAprobaciones").on("click", function () {
        const idPromocion = parseInt($("#lblIdPromocion").text(), 10);
        if (!idPromocion || isNaN(idPromocion)) {
            Swal.fire({ icon: "warning", title: "Atención", text: "No se pudo determinar el Id de la promoción." });
            return;
        }
        abrirModalAprobaciones(idPromocion);
    });
});

// ===================================================================
// FUNCIONES DE CARGA (BANDEJA)
// ===================================================================

function cargarBandeja() {
    console.log("[cargarBandeja] Iniciando carga de bandeja inactivacion promociones...");

    const payload = {
        code_app: "APP20260128155212346",
        http_method: "GET",
        endpoint_path: "api/Promocion/consultar-bandeja-inactivacion",
        client: "APL"
    };

    console.log("[cargarBandeja] Payload enviado:", JSON.stringify(payload));

    $.ajax({
        url: "/api/apigee-router-proxy",
        method: "POST",
        contentType: "application/json",
        data: JSON.stringify(payload),
        success: function (response) {
            console.log("[cargarBandeja] Respuesta completa del proxy:", response);

            if (response && response.code_status === 200) {
                const data = response.json_response || [];
                console.log("[cargarBandeja] Datos recibidos:", data);
                console.log("[cargarBandeja] Total registros:", Array.isArray(data) ? data.length : "No es array");
                crearListado(data);
            } else {
                console.error("[cargarBandeja] code_status no es 200:", response?.code_status, response);
                Swal.fire({ icon: "error", title: "Error", text: "No se pudo cargar la bandeja de inactivación. Código: " + (response?.code_status || "desconocido") });
            }
        },
        error: function (xhr) {
            console.error("[cargarBandeja] Error AJAX:", xhr.status, xhr.responseText);
            manejarErrorGlobal(xhr, "cargar la bandeja de inactivación de promociones");
        }
    });
}

function crearListado(data) {
    if (tabla) tabla.destroy();

    if (!data || data.length === 0) {
        $('#tabla').html(
            "<div class='alert alert-info text-center'>No hay promociones para inactivar.</div>"
        );
        return;
    }

    let html = `
        <table id="tabla-principal" class="table table-bordered table-striped table-hover">
            <thead>
                <tr>
                    <th colspan="10" style="background-color: #CC0000 !important; color: white; text-align: center; font-weight: bold; padding: 8px; font-size: 1rem;">
                        BANDEJA DE INACTIVACIÓN DE PROMOCIONES
                    </th>
                </tr>
                <tr>
                    <th>Acción</th>
                    <th>Id Promoción</th>
                    <th>Descripción</th>
                    <th>Motivo</th>
                    <th>Clase de Promoción</th>
                    <th>Fecha Inicio</th>
                    <th>Fecha Fin</th>
                    <th>Regalo</th>
                    <th>Soporte</th>
                    <th>Estado</th>
                </tr>
            </thead>
            <tbody>`;

    data.forEach(promo => {
        html += `
            <tr>
                <td class="text-center">
                    <button type="button" class="btn-action edit-btn" title="Ver / Inactivar" onclick="abrirModalEditar(${promo.idpromocion})">
                        <i class="fa-regular fa-pen-to-square"></i>
                    </button>
                </td>
                <td class="text-center">${promo.idpromocion ?? ""}</td>
                <td>${promo.descripcion ?? ""}</td>
                <td>${promo.motivo ?? ""}</td>
                <td>${promo.clase_promocion ?? ""}</td>
                <td class="text-center">${formatearFecha(promo.fecha_inicio)}</td>
                <td class="text-center">${formatearFecha(promo.fecha_fin)}</td>
                <td class="text-center">${promo.regalo ?? ""}</td>
                <td>${obtenerNombreArchivo(promo.soporte)}</td>
                <td>${promo.estado ?? ""}</td>
            </tr>`;
    });

    html += `</tbody></table>`;
    $("#tabla").html(html);

    tabla = $("#tabla-principal").DataTable({
        pageLength: 10,
        lengthMenu: [5, 10, 25, 50],
        pagingType: 'full_numbers',
        columnDefs: [
            { targets: 0, width: "5%", className: "dt-center", orderable: false },
            { targets: 1, width: "8%", className: "dt-center" },
            { targets: [5, 6, 7], className: "dt-center" },
        ],
        order: [[1, "desc"]],
        language: {
            decimal: "",
            emptyTable: "No hay datos disponibles en la tabla",
            info: "Mostrando _START_ a _END_ de _TOTAL_ registros",
            infoEmpty: "Mostrando 0 a 0 de 0 registros",
            infoFiltered: "(filtrado de _MAX_ registros totales)",
            lengthMenu: "Mostrar _MENU_ registros",
            loadingRecords: "Cargando...",
            processing: "Procesando...",
            search: "Buscar:",
            zeroRecords: "No se encontraron registros coincidentes",
            paginate: { first: "Primero", last: "Último", next: "Siguiente", previous: "Anterior" }
        }
    });
}

// ===================================================================
// LÓGICA DE DETALLE
// ===================================================================

function abrirModalEditar(idPromocion) {
    console.log("Consultando detalle idPromocion:", idPromocion);
    $("body").css("cursor", "wait");

    // Limpiar campos
    $("#formVisualizar")[0].reset();
    $("#lblIdPromocion").text(idPromocion);
    $("#verPromocionHeader").val("");
    $("#btnVerSoporte").data("soporte", "").removeData("soporte").attr("title", "Ver Soporte").removeClass("text-danger");
    $("#contenedor-tabla-articulos").hide().html("");
    $("#contenedor-tabla-acuerdos").hide().html("");

    const payload = {
        code_app: "APP20260128155212346",
        http_method: "GET",
        endpoint_path: "api/Promocion/bandeja-inactivacion-id",
        client: "APL",
        endpoint_query_params: `/${idPromocion}`
    };

    $.ajax({
        url: "/api/apigee-router-proxy",
        method: "POST",
        contentType: "application/json",
        data: JSON.stringify(payload),
        success: function (response) {
            if (response && response.code_status === 200) {
                const data = response.json_response || {};
                const cab = data?.cabecera || {};
                console.log(`Datos de la promoción (${idPromocion}):`, data);

                // ── FILA 1: Header "Promoción" = idPromocion + nombre_clase_promocion ──
                const idStr = cab.idpromocion ?? "";
                const claseStr = cab.nombre_clase_promocion ?? "";
                $("#verPromocionHeader").val(`${idStr} - ${claseStr}`);

                // Guardar ruta de soporte en el botón PDF para abrirlo al clickear
                const rutaSoporte = cab.archivosoporte ?? "";
                $("#btnVerSoporte").data("soporte", rutaSoporte)
                    .toggleClass("text-danger", !!rutaSoporte)
                    .attr("title", rutaSoporte ? `Ver Soporte: ${obtenerNombreArchivo(rutaSoporte)}` : "Sin soporte");

                // ── FILA 2: Descripción | Motivo | Inicio | Fin | Estado ──
                $("#verDescripcion").val(cab.descripcion ?? "");
                $("#verMotivo").val(cab.nombre_motivo ?? "");
                $("#verFechaInicio").val(formatearFecha(cab.fecha_inicio));
                $("#verFechaFin").val(formatearFecha(cab.fecha_fin));
                $("#verEstado").val(cab.nombre_estado_promocion ?? "");

                // Regalo: checkbox checked si es "S"
                const esRegalo = (cab.marcaregalo ?? "").toString().trim().toUpperCase() === "S";
                $("#verRegalo").prop("checked", esRegalo);

                // ── ACUERDOS ──────────────────────────
                if (data?.acuerdos && data.acuerdos.length > 0) {
                    renderizarTablaAcuerdos(data.acuerdos);
                }

                // ── ARTÍCULOS ─────────────────────────
                if (data?.articulos && data.articulos.length > 0) {
                    renderizarTablaArticulos(data.articulos);
                }

                $("#vistaTabla").fadeOut(200, function () {
                    $("#vistaDetalle").fadeIn(200);
                });
                $("body").css("cursor", "default");

            } else {
                $("body").css("cursor", "default");
                Swal.fire({ icon: "error", title: "Error", text: "No se pudo obtener el detalle de la promoción." });
            }
        },
        error: function (xhr) {
            $("body").css("cursor", "default");
            manejarErrorGlobal(xhr, "obtener el detalle de la promoción");
        }
    });
}

function renderizarTablaAcuerdos(acuerdos) {
    let html = `
        <h6 class="fw-bold mb-2"><i class="fa fa-handshake"></i> Acuerdos Asociados</h6>
        <div class="table-responsive" style="max-height: 300px; overflow-y: auto;">
            <table class="table table-bordered table-sm mb-0">
                <thead class="sticky-top text-nowrap">
                    <tr class="text-center tabla-items-header">
                        <th scope="col" class="custom-header-cons-bg"># Acuerdo</th>
                        <th scope="col" class="custom-header-cons-bg">Descripción Acuerdo</th>
                        <th scope="col" class="custom-header-ingr-bg">% Descuento</th>
                        <th scope="col" class="custom-header-ingr-bg">Valor Disponible</th>
                        <th scope="col" class="custom-header-ingr-bg">Valor Comprometido</th>
                        <th scope="col" class="custom-header-calc-bg">Valor Liquidado</th>
                        <th scope="col" class="custom-header-calc-bg">Estado</th>
                    </tr>
                </thead>
                <tbody class="text-nowrap tabla-items-body bg-white">`;

    acuerdos.forEach(ac => {
        html += `
            <tr>
                <td class="fw-bold text-center">${ac.idacuerdo || ""}</td>
                <td>${ac.descripcion_acuerdo || ""}</td>
                <td class="text-center fw-bold text-primary">${ac.porcentaje_descuento ?? 0}%</td>
                <td class="text-end">${formatearMoneda(ac.valor_disponible)}</td>
                <td class="text-end">${formatearMoneda(ac.valor_comprometido)}</td>
                <td class="text-end">${formatearMoneda(ac.valor_liquidado)}</td>
                <td class="text-center">${ac.nombre_estado_detalle || ""}</td>
            </tr>`;
    });

    html += `</tbody></table></div>`;
    $("#contenedor-tabla-acuerdos").html(html).fadeIn();
}

function renderizarTablaArticulos(articulos) {
    let html = `
        <h6 class="fw-bold mb-2"><i class="fa fa-list"></i> Detalle de Artículos</h6>
        <div class="table-responsive" style="max-height: 300px; overflow-y: auto;">
            <table class="table table-bordered table-sm mb-0">
                <thead class="sticky-top text-nowrap">
                    <tr class="text-center tabla-items-header">
                        <th scope="col" class="custom-header-cons-bg">Item</th>
                        <th scope="col" class="custom-header-cons-bg">Descripción</th>
                        <th scope="col" class="custom-header-ingr-bg">Precio Contado</th>
                        <th scope="col" class="custom-header-ingr-bg">Precio TC</th>
                        <th scope="col" class="custom-header-ingr-bg">Precio Crédito</th>
                        <th scope="col" class="custom-header-calc-bg">% Descuento</th>
                        <th scope="col" class="custom-header-calc-bg">Valor Descuento</th>
                    </tr>
                </thead>
                <tbody class="text-nowrap tabla-items-body bg-white">`;

    articulos.forEach(art => {
        html += `
            <tr>
                <td class="fw-bold text-center">${art.codigoarticulo || ""}</td>
                <td>${art.descripcion || ""}</td>
                <td class="text-end">${formatearMoneda(art.preciocontado)}</td>
                <td class="text-end">${formatearMoneda(art.preciotarjetacredito)}</td>
                <td class="text-end">${formatearMoneda(art.preciocredito)}</td>
                <td class="text-center fw-bold text-primary">${art.porcentajedescuento ?? 0}%</td>
                <td class="text-end fw-bold">${formatearMoneda(art.valordescuento)}</td>
            </tr>`;
    });

    html += `</tbody></table></div>`;
    $("#contenedor-tabla-articulos").html(html).fadeIn();
}

function cerrarDetalle() {
    $("#contenedor-tabla-acuerdos").hide().html("");
    $("#contenedor-tabla-articulos").hide().html("");
    $("#vistaDetalle").fadeOut(200, function () {
        $("#vistaTabla").fadeIn(200);
        if (tabla) tabla.columns.adjust();
    });
}

// ===================================================================
// INACTIVAR PROMOCIÓN
// ===================================================================

function inactivarPromocion() {
    const usuario = obtenerUsuarioActual();
    const idOpcionActual = getIdOpcionSeguro();
    const idPromocion = parseInt($("#lblIdPromocion").text(), 10);

    if (!idPromocion || isNaN(idPromocion)) {
        Swal.fire({ icon: "warning", title: "Atención", text: "No se pudo determinar el Id de la promoción." });
        return;
    }

    if (idOpcionActual === "0" || !idOpcionActual) {
        Swal.fire({
            icon: "error",
            title: "Error de Sesión",
            text: "No se pudo obtener el ID de la opción. Por favor, reingrese desde el menú."
        });
        return;
    }

    Swal.fire({
        icon: "question",
        title: "Confirmar inactivación",
        text: `¿Deseas inactivar la Promoción #${idPromocion}?`,
        showCancelButton: true,
        confirmButtonColor: '#dc3545',
        cancelButtonColor: '#6c757d',
        confirmButtonText: "Sí, inactivar",
        cancelButtonText: "Cancelar"
    }).then((r) => {
        if (!r.isConfirmed) return;

        $("body").css("cursor", "wait");

        Swal.fire({
            title: 'Procesando...',
            text: 'Por favor espere',
            allowOutsideClick: false,
            didOpen: () => Swal.showLoading()
        });

        const body = {
            idpromocion: idPromocion,
            nombreusuarioingreso: usuario,
            idopcion: idOpcionActual,
            idcontrolinterfaz: "BTNINACTIVAR",
            idevento: "EVCLICK",
            nombreusuario: usuario
        };

        console.log("Enviando inactivación de promoción:", body);

        const payload = {
            code_app: "APP20260128155212346",
            http_method: "POST",
            endpoint_path: "api/Promocion/inactivar-promocion",
            client: "APL",
            body_request: body
        };

        $.ajax({
            url: "/api/apigee-router-proxy",
            method: "POST",
            contentType: "application/json",
            data: JSON.stringify(payload),
            success: function (response) {
                $("body").css("cursor", "default");

                if (response && response.code_status === 200) {
                    const data = response.json_response || {};
                    Swal.fire({
                        icon: "success",
                        title: "¡Operación Exitosa!",
                        text: data.respuesta || "Promoción inactivada correctamente.",
                        confirmButtonText: "Aceptar",
                        timer: 2000,
                        timerProgressBar: true
                    }).then(() => {
                        cerrarDetalle();
                        cargarBandeja();
                    });
                } else {
                    const msg = response.json_response?.mensaje || "No se pudo inactivar la promoción.";
                    Swal.fire({ icon: "error", title: "Error", text: msg });
                }
            },
            error: function (xhr) {
                $("body").css("cursor", "default");
                const msg = xhr?.responseJSON?.mensaje || xhr?.responseText || "No se pudo inactivar la promoción.";
                Swal.fire({ icon: "error", title: "Error", text: msg });
            }
        });
    });
}

// ===================================================================
// REGISTRO DE LOG
// ===================================================================

function abrirModalLog(idPromocion) {
    console.log("[abrirModalLog] Consultando logs para idPromocion:", idPromocion);

    // Limpiar estado previo
    $("#tbodyLog").empty();
    $("#logSinDatos").hide();
    $("#contenedorTablaLog").hide();
    $("#logSpinner").show();

    // Abrir modal
    const modal = new bootstrap.Modal(document.getElementById("modalRegistroLog"));
    modal.show();

    const payload = {
        code_app: "APP20260128155212346",
        http_method: "GET",
        endpoint_path: "api/Auditoria/consultar-logs-general",
        client: "APL",
        endpoint_query_params: `/ENTPROMOCION/${idPromocion}`
    };

    console.log("[abrirModalLog] Payload enviado:", JSON.stringify(payload));

    $.ajax({
        url: "/api/apigee-router-proxy",
        method: "POST",
        contentType: "application/json",
        data: JSON.stringify(payload),
        success: function (response) {
            $("#logSpinner").hide();
            $("#contenedorTablaLog").show();

            console.log("[abrirModalLog] Respuesta:", response);

            if (response && response.code_status === 200) {
                const logs = response.json_response || [];

                if (!Array.isArray(logs) || logs.length === 0) {
                    $("#logSinDatos").show();
                    return;
                }

                let html = "";
                logs.forEach(function (log) {
                    const tieneDatos = log.datos && log.datos.toString().trim() !== "";
                    html += `
                        <tr>
                            <td class="text-center fw-bold">${log.idlog ?? ""}</td>
                            <td class="text-center text-nowrap">${log.fecha ?? ""}</td>
                            <td class="text-center">${log.usuario ?? ""}</td>
                            <td>${log.opcion ?? ""}</td>
                            <td>${log.accion ?? ""}</td>
                            <td class="text-center">${log.entidad ?? ""}</td>
                            <td class="text-center">${log.tipo_proceso ?? ""}</td>
                            <td class="text-center">
                                ${tieneDatos
                            ? `<button type="button" class="btn btn-sm btn-outline-secondary py-0 px-1"
                                           title="Ver datos" onclick="verDatosLog(${log.idlog})">
                                           <i class="fa-regular fa-file-lines"></i>
                                       </button>`
                            : ""}
                            </td>
                        </tr>`;
                });

                $("#tbodyLog").html(html);

            } else {
                $("#logSinDatos").show();
                console.warn("[abrirModalLog] code_status no es 200:", response?.code_status);
            }
        },
        error: function (xhr) {
            $("#logSpinner").hide();
            $("#contenedorTablaLog").show();
            $("#logSinDatos").show();
            console.error("[abrirModalLog] Error AJAX:", xhr.status, xhr.responseText);
        }
    });
}

function verDatosLog(idLog) {
    console.log("[verDatosLog] Ver datos del log idLog:", idLog);
    Swal.fire({
        icon: "info",
        title: `Datos del Log #${idLog}`,
        text: "Funcionalidad de detalle de datos pendiente de implementación."
    });
}

// ===================================================================
// REGISTRO DE APROBACIONES
// ===================================================================

function abrirModalAprobaciones(idPromocion) {
    console.log("[abrirModalAprobaciones] Consultando aprobaciones para idPromocion:", idPromocion);

    // Limpiar estado previo
    $("#tbodyAprobaciones").empty();
    $("#aprobacionesSinDatos").hide();
    $("#contenedorTablaAprobaciones").hide();
    $("#aprobacionesSpinner").show();

    // Abrir modal
    const modal = new bootstrap.Modal(document.getElementById("modalRegistroAprobaciones"));
    modal.show();

    const payload = {
        code_app: "APP20260128155212346",
        http_method: "GET",
        endpoint_path: "api/Aprobacion/consultar-aprobaciones-generales",
        client: "APL",
        endpoint_query_params: `/ENTPROMOCION/${idPromocion}`
    };

    console.log("[abrirModalAprobaciones] Payload enviado:", JSON.stringify(payload));

    $.ajax({
        url: "/api/apigee-router-proxy",
        method: "POST",
        contentType: "application/json",
        data: JSON.stringify(payload),
        success: function (response) {
            $("#aprobacionesSpinner").hide();
            $("#contenedorTablaAprobaciones").show();

            console.log("[abrirModalAprobaciones] Respuesta:", response);

            if (response && response.code_status === 200) {
                const aprobaciones = response.json_response || [];

                if (!Array.isArray(aprobaciones) || aprobaciones.length === 0) {
                    $("#aprobacionesSinDatos").show();
                    return;
                }

                let html = "";
                aprobaciones.forEach(function (apr) {
                    const tieneComentario = apr.comentario_aprobador && apr.comentario_aprobador.toString().trim() !== "";

                    // Badge de color segun estado
                    let badgeClass = "bg-secondary";
                    const estado = (apr.estado ?? "").toLowerCase();
                    if (estado === "aprobado") badgeClass = "bg-success";
                    if (estado === "rechazado") badgeClass = "bg-danger";
                    if (estado === "nuevo") badgeClass = "bg-primary";
                    if (estado === "pendiente") badgeClass = "bg-warning text-dark";

                    const comentarioEscapado = (apr.comentario_aprobador ?? "").replace(/'/g, "\\'");

                    html += `
                        <tr>
                            <td class="text-center">${apr.tipo_solicitud ?? ""}</td>
                            <td class="text-center">${apr.usuario_solicita ?? ""}</td>
                            <td class="text-center">${apr.nombre_solicita ?? ""}</td>
                            <td class="text-center text-nowrap">${formatearFecha(apr.fecha_solicitud)}</td>
                            <td class="text-center">
                                <span>${apr.usuario_aprobador ?? ""}</span>
                                ${tieneComentario
                            ? `<button type="button"
                                           class="btn btn-sm btn-link p-0 ms-1 text-dark"
                                           title="${apr.comentario_aprobador.replace(/"/g, '&quot;')}"
                                           onclick="verComentarioAprobacion('${apr.usuario_aprobador ?? ""}', '${comentarioEscapado}')">
                                           <i class="fa-solid fa-message" style="font-size:0.8rem;"></i>
                                       </button>`
                            : ""}
                            </td>
                            <td class="text-center">${apr.nombre_aprobador ?? ""}</td>
                            <td class="text-center text-nowrap">${formatearFecha(apr.fecha_aprobacion)}</td>
                            <td class="text-center fw-bold">${apr.nivel ?? ""}</td>
                            <td class="text-center">
                                <span class="badge ${badgeClass}">${apr.estado ?? ""}</span>
                            </td>
                            <td class="text-center">${apr.lote ?? ""}</td>
                        </tr>`;
                });

                $("#tbodyAprobaciones").html(html);

            } else {
                $("#aprobacionesSinDatos").show();
                console.warn("[abrirModalAprobaciones] code_status no es 200:", response?.code_status);
            }
        },
        error: function (xhr) {
            $("#aprobacionesSpinner").hide();
            $("#contenedorTablaAprobaciones").show();
            $("#aprobacionesSinDatos").show();
            console.error("[abrirModalAprobaciones] Error AJAX:", xhr.status, xhr.responseText);
        }
    });
}

function verComentarioAprobacion(usuario, comentario) {
    Swal.fire({
        icon: "info",
        title: "Comentario de " + usuario,
        text: comentario,
        confirmButtonText: "Cerrar"
    });
}

// Autor: JEAN FRANCOIS CALDERON VEAS | Empresa: BMTECSA | Proyecto: SOFTWARE APL