// ~/js/Promocion/AprobarPromocion.js

// ===============================================================
// Variables globales
// ===============================================================
let tabla; // GLOBAL
let ultimaFilaModificada = null;
let datosAprobacionActual = null;
let tablaHistorial;

// ===============================================================
// FUNCIÓN HELPER PARA OBTENER USUARIO
// ===============================================================
function obtenerUsuarioActual() {
    const usuario = window.usuarioActual
        || sessionStorage.getItem('usuarioActual')
        || sessionStorage.getItem('usuario')
        || localStorage.getItem('usuarioActual')
        || localStorage.getItem('usuario')
        || "admin";

    return usuario;
}

// ===============================================================
// FUNCIÓN HELPER PARA OBTENER IDOPCION
// ===============================================================
function obtenerIdOpcionSeguro() {
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

// ===============================================================
// FUNCIÓN HELPER PARA MANEJO DE ERRORES
// ===============================================================
function manejarErrorGlobal(xhr, accion) {
    console.error(`Error al ${accion}:`, xhr.responseText);
    Swal.fire({
        icon: 'error',
        title: 'Error de Comunicación',
        text: `No se pudo completar la acción: ${accion}.`
    });
}

// ===============================================================
// DOCUMENT READY
// ===============================================================
$(document).ready(function () {

    console.log("=== INICIO DE CARGA DE PÁGINA - AprobarPromocion (Estructura Post-REST) ===");

    const usuarioFinal = obtenerUsuarioActual();
    console.log("Usuario final obtenido:", usuarioFinal);

    // Configuración inicial y carga de datos
    $.get("/config", function (config) {
        window.apiBaseUrl = config.apiBaseUrl;
        console.log("API Base URL configurada:", config.apiBaseUrl);
        cargarBandeja();
    });

    // ===== BOTÓN LIMPIAR =====
    $('body').on('click', '#btnLimpiar', function () {
        if (tabla) {
            tabla.search('').draw();
            tabla.page(0).draw('page');
            ultimaFilaModificada = null;
            if (typeof limpiarSeleccion === 'function') {
                limpiarSeleccion('#tabla-principal');
            }
        }
    });

    // ===============================================================
    // EVENTOS PARA VOLVER A LA TABLA (CERRAR DETALLE)
    // ===============================================================
    $('#btnVolverTabla, #btnVolverAbajo').on('click', function () {
        cerrarDetalle();
    });

    // ===============================================================
    // EVENTOS PARA APROBAR Y RECHAZAR PROMOCIÓN
    // ===============================================================
    $('#btnAprobarPromocion').on('click', function () {
        let comentario = $("#modal-promocion-comentario").val();
        console.log('comentario:', comentario);
        console.log('boton de aprobar promoción');
        procesarAprobacionPromocion("APROBAR", comentario);
    });

    $('#btnRechazarPromocion').on('click', function () {
        let comentario = $("#modal-promocion-comentario").val();
        console.log('comentario:', comentario);
        console.log('boton de rechazar promoción');
        procesarAprobacionPromocion("RECHAZAR", comentario);
    });

}); // FIN document.ready

// ===================================================================
// ===== FUNCIONES GLOBALES =====
// ===================================================================

function cargarBandeja() {
    const idOpcionActual = obtenerIdOpcionSeguro();
    const usuario = obtenerUsuarioActual();

    if (!usuario) {
        console.error('No hay usuario en sesión, no se puede cargar la bandeja.');
        return;
    }

    console.log('Cargando bandeja de promociones para usuario:', usuario, 'con idOpcion:', idOpcionActual);

    const payload = {
        code_app: "APP20260128155212346",
        http_method: "GET",
        endpoint_path: "api/Promocion/consultar-bandeja-aprobacion",
        client: "APL",
        endpoint_query_params: `/${usuario}`
    };

    $.ajax({
        url: "/api/apigee-router-proxy",
        method: "POST",
        contentType: "application/json",
        data: JSON.stringify(payload),
        success: function (response) {
            if (response && response.code_status === 200) {
                const data = response.json_response || [];
                console.log("Datos recibidos de bandeja-aprobacion promociones:", data);
                crearListado(data);
            } else {
                console.error("Error en respuesta:", response);
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'No se pudieron cargar las promociones para aprobación'
                });
            }
        },
        error: (xhr) => manejarErrorGlobal(xhr, "cargar la bandeja de aprobación de promociones")
    });
}

function crearListado(data) {
    if (tabla) {
        tabla.destroy();
    }

    // Si no hay datos, mostramos mensaje y salimos
    if (!data || data.length === 0) {
        $('#tabla').html(
            "<div class='alert alert-info text-center'>No hay promociones para aprobar.</div>"
        );
        return;
    }

    var html = "";
    html += "<table id='tabla-principal' class='table table-bordered table-striped table-hover'>";

    html += "  <thead>";
    // Fila del Título ROJO
    html += "    <tr>";
    html += "      <th colspan='13' style='background-color: #CC0000 !important; color: white; text-align: center; font-weight: bold; padding: 8px; font-size: 1rem;'>";
    html += "          BANDEJA DE APROBACIÓN DE PROMOCIONES";
    html += "      </th>";
    html += "    </tr>";

    // Fila de las Cabeceras
    html += "    <tr>";
    html += "      <th>Acción</th>";
    html += "      <th>Solicitud</th>";
    html += "      <th>Id Promoción</th>";
    html += "      <th>Descripción</th>";
    html += "      <th>Motivo</th>";
    html += "      <th>Clase de Promoción</th>";
    html += "      <th>Fecha Solicitud</th>";
    html += "      <th>Usuario Solicita</th>";
    html += "      <th>Fecha Inicio</th>";
    html += "      <th>Fecha Fin</th>";
    html += "      <th>Regalo</th>";
    html += "      <th>Soporte</th>";
    html += "      <th>Estado</th>";
    html += "    </tr>";
    html += "  </thead>";
    html += "  <tbody>";

    for (var i = 0; i < data.length; i++) {
        var promo = data[i];

        // Botón de visualizar
        var viewButton = '<button type="button" class="btn-action view-btn" title="Visualizar/Aprobar" onclick="abrirModalEditar(' + promo.idpromocion + ', ' + promo.idaprobacion + ')">' +
            '<i class="fa-regular fa-eye"></i>' +
            '</button>';

        // Clase de Promoción con superíndice de artículos/combos
        var clasePromocionHTML = (promo.nombre_clase_promocion ?? "");
        if (promo.cantidad_articulos > 0) {
            clasePromocionHTML += '<sup style="font-size: 0.8em; margin-left: 2px; font-weight: bold;">' + promo.cantidad_articulos + '</sup>';
        }

        html += "<tr>";
        html += "  <td class='text-center'>" + viewButton + "</td>";
        html += "  <td>" + (promo.nombre_solicitud ?? "") + "</td>";
        html += "  <td>" + (promo.idpromocion ?? "") + "</td>";
        html += "  <td>" + (promo.descripcion ?? "") + "</td>";
        html += "  <td>" + (promo.motivo ?? "") + "</td>";
        html += "  <td>" + clasePromocionHTML + "</td>";
        html += "  <td class='text-center'>" + formatearFecha(promo.fechasolicitud) + "</td>";
        html += "  <td>" + (promo.usuariosolicita ?? promo.idusersolicitud ?? "") + "</td>";
        html += "  <td class='text-center'>" + formatearFecha(promo.fechahorainicio) + "</td>";
        html += "  <td class='text-center'>" + formatearFecha(promo.fechahorafin) + "</td>";
        html += "  <td class='text-center'>" + (promo.marcaregalo ?? "") + "</td>";
        html += "  <td>" + (promo.soporte ?? "") + "</td>";
        html += "  <td>" + (promo.nombre_estado ?? "") + "</td>";
        html += "</tr>";
    }

    html += "  </tbody>";
    html += "</table>";

    $('#tabla').html(html);

    // Inicializa DataTable
    tabla = $('#tabla-principal').DataTable({
        pageLength: 10,
        lengthMenu: [5, 10, 25, 50],
        pagingType: 'full_numbers',
        columnDefs: [
            { targets: 0, width: "5%", className: "dt-center", orderable: false },
            { targets: 1, width: "8%", className: "dt-center" },
            { targets: 2, width: "8%", className: "dt-center" },
            { targets: [6, 8, 9], className: "dt-center" },
        ],
        order: [[2, 'desc']],
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
// ===== FUNCIONES UTILITARIAS =====
// ===================================================================

/**
 * Formatea un número como moneda
 */
function formatearMoneda(valor) {
    var numero = parseFloat(valor);
    if (isNaN(numero) || valor === null || valor === undefined) {
        return "$ 0.00";
    }
    return '$ ' + numero.toLocaleString('es-EC', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

/**
 * Formatea la fecha al formato DD/MM/YYYY
 */
function formatearFecha(fechaString) {
    try {
        if (!fechaString) return '';
        var fecha = new Date(fechaString);
        if (isNaN(fecha)) return fechaString;
        var dia = String(fecha.getDate()).padStart(2, '0');
        var mes = String(fecha.getMonth() + 1).padStart(2, '0');
        var anio = fecha.getFullYear();
        return `${dia}/${mes}/${anio}`;
    } catch (e) {
        console.warn("Error formateando fecha:", fechaString);
        return fechaString;
    }
}

// ===================================================================
// FUNCIONES: LOGICA DE DETALLE (VISUALIZAR)
// ===================================================================

/**
 * Consulta el detalle por ID y muestra el DIV de detalle (Ocultando la tabla)
 */
function abrirModalEditar(idPromocion, idAprobacion) {
    console.log("Consultando detalle idPromocion:", idPromocion, "idAprobacion:", idAprobacion);
    $('body').css('cursor', 'wait');

    // Limpiar datos previos
    datosAprobacionActual = null;

    $("#formVisualizar")[0].reset();
    $("#lblIdPromocion").text(idPromocion);

    // Limpiar tablas previas
    $('#tabla-aprobaciones-promocion').html('');
    $('#contenedor-tabla-articulos').html('').hide();
    $('#contenedor-tabla-combos').html('').hide();

    const payload = {
        code_app: "APP20260128155212346",
        http_method: "GET",
        endpoint_path: "api/Promocion/bandeja-aprobacion-id",
        client: "APL",
        endpoint_query_params: `/${idPromocion}/${idAprobacion}`
    };

    $.ajax({
        url: "/api/apigee-router-proxy",
        method: "POST",
        contentType: "application/json",
        data: JSON.stringify(payload),
        success: function (response) {
            if (response && response.code_status === 200) {
                const data = response.json_response || {};
                console.log(`Datos de la promoción (${idPromocion}):`, data);

                // Guardar datos para los botones de aprobación/rechazo
                datosAprobacionActual = {
                    entidad: data.cabecera?.id_entidad || 0,
                    identidad: data.cabecera?.idpromocion || 0,
                    idtipoproceso: data.cabecera?.id_tipo_proceso || 0,
                    idetiquetatipoproceso: data.cabecera?.tipo_proceso_etiqueta || "",
                    idaprobacion: idAprobacion,
                    entidad_etiqueta: data.cabecera?.entidad_etiqueta,
                    idetiquetatestado: data.cabecera?.estado_etiqueta || "",
                    comentario: ""
                };

                // 1. Llenar Formulario
                $("#verSolicitud").val(data.cabecera?.nombre_solicitud || "");
                $("#verMotivo").val(data.cabecera?.motivo || "");
                $("#verDescripcion").val(data.cabecera?.descripcion || "");
                $("#verClasePromocion").val(data.cabecera?.nombre_clase_promocion || "");
                $("#verEstado").val(data.cabecera?.nombre_estado || "");
                $("#verUsuarioSolicita").val(data.cabecera?.usuariosolicita || data.cabecera?.idusersolicitud || "");
                $("#verFechaSolicitud").val(formatearFecha(data.cabecera?.fechasolicitud));
                $("#verFechaInicio").val(formatearFecha(data.cabecera?.fechahorainicio));
                $("#verFechaFin").val(formatearFecha(data.cabecera?.fechahorafin));
                $("#verRegalo").val(data.cabecera?.marcaregalo || "");
                $("#verSoporte").val(data.cabecera?.soporte || "");

                // =================================================================
                // LOGICA DE ARTÍCULOS
                // =================================================================
                if (data.articulos && data.articulos.length > 0) {
                    console.log("Promoción con artículos detectada. Renderizando tabla...");

                    let htmlArticulos = `
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

                    data.articulos.forEach(art => {
                        htmlArticulos += `
                            <tr>
                                <td class="fw-bold text-center">${art.codigoarticulo || ''}</td>
                                <td>${art.descripcion || ''}</td>
                                <td class="text-end">${formatearMoneda(art.preciocontado)}</td>
                                <td class="text-end">${formatearMoneda(art.preciotarjetacredito)}</td>
                                <td class="text-end">${formatearMoneda(art.preciocredito)}</td>
                                <td class="text-center fw-bold text-primary">${art.porcentajedescuento ?? 0}%</td>
                                <td class="text-end fw-bold">${formatearMoneda(art.valordescuento)}</td>
                            </tr>`;
                    });

                    htmlArticulos += `
                                </tbody>
                            </table>
                        </div>`;

                    $('#contenedor-tabla-articulos').html(htmlArticulos).fadeIn();
                }

                // =================================================================
                // LOGICA DE COMBOS
                // =================================================================
                if (data.combos && data.combos.length > 0) {
                    console.log("Promoción con combos detectada. Renderizando tabla...");

                    let htmlCombos = `
                        <h6 class="fw-bold mb-2 mt-3"><i class="fa fa-layer-group"></i> Detalle de Combos</h6>
                        <div class="table-responsive" style="max-height: 300px; overflow-y: auto;">
                            <table class="table table-bordered table-sm mb-0">
                                <thead class="sticky-top text-nowrap">
                                    <tr class="text-center tabla-items-header">
                                        <th scope="col" class="custom-header-cons-bg">Código Combo</th>
                                        <th scope="col" class="custom-header-cons-bg">Descripción</th>
                                        <th scope="col" class="custom-header-ingr-bg">Cantidad</th>
                                        <th scope="col" class="custom-header-ingr-bg">Precio</th>
                                        <th scope="col" class="custom-header-calc-bg">Valor Total</th>
                                    </tr>
                                </thead>
                                <tbody class="text-nowrap tabla-items-body bg-white">`;

                    data.combos.forEach(combo => {
                        htmlCombos += `
                            <tr>
                                <td class="fw-bold text-center">${combo.codigocombo || ''}</td>
                                <td>${combo.descripcion || ''}</td>
                                <td class="text-center fw-bold text-primary">${combo.cantidad ?? 0}</td>
                                <td class="text-end">${formatearMoneda(combo.precio)}</td>
                                <td class="text-end fw-bold">${formatearMoneda(combo.valortotal)}</td>
                            </tr>`;
                    });

                    htmlCombos += `
                                </tbody>
                            </table>
                        </div>`;

                    $('#contenedor-tabla-combos').html(htmlCombos).fadeIn();
                }

                // 2. LOGICA VISUAL
                $("#vistaTabla").fadeOut(200, function () {
                    $("#vistaDetalle").fadeIn(200);
                });
                $('body').css('cursor', 'default');

                // 3. CARGAR TABLA DE HISTORIAL DE APROBACIONES
                if (data.cabecera?.entidad_etiqueta && data.cabecera?.tipo_proceso_etiqueta) {
                    cargarAprobacionesPromocion(
                        data.cabecera.entidad_etiqueta,
                        idPromocion,
                        data.cabecera.tipo_proceso_etiqueta
                    );
                } else {
                    $('#tabla-aprobaciones-promocion').html(
                        '<p class="alert alert-warning">No se encontraron los parámetros necesarios para cargar aprobaciones.</p>'
                    );
                }
            } else {
                $('body').css('cursor', 'default');
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'No se pudieron cargar los datos de la promoción.'
                });
            }
        },
        error: function (xhr) {
            $('body').css('cursor', 'default');
            console.error("Error detalle:", xhr);
            manejarErrorGlobal(xhr, "cargar los datos de la promoción");
        }
    });
}

/**
 * Cierra el div de detalle y vuelve a mostrar la tabla
 */
function cerrarDetalle() {
    $("#vistaDetalle").fadeOut(200, function () {
        $("#vistaTabla").fadeIn(200);
        if (tabla) {
            tabla.columns.adjust();
        }
    });
    datosAprobacionActual = null;
}

/**
 * Consume el servicio de Aprobaciones y dibuja la tabla en el detalle
 */
function cargarAprobacionesPromocion(entidad, idEntidad, tipoProceso) {
    console.log("=== CARGANDO APROBACIONES DE PROMOCIÓN ===");
    console.log("entidad:", entidad);
    console.log("idEntidad:", idEntidad);
    console.log("tipoProceso:", tipoProceso);

    // Destruir tabla anterior si existe
    if ($.fn.DataTable.isDataTable('#dt-historial')) {
        $('#dt-historial').DataTable().destroy();
    }

    // Spinner de carga
    $('#tabla-aprobaciones-promocion').html(`
        <div class="text-center p-3">
            <div class="spinner-border text-primary" role="status"><span class="visually-hidden">Cargando...</span></div>
            <p class="mt-2 small text-muted">Cargando historial...</p>
        </div>
    `);

    const payload = {
        code_app: "APP20260128155212346",
        http_method: "GET",
        endpoint_path: "api/Aprobacion/consultar-aprobaciones",
        client: "APL",
        endpoint_query_params: `/${entidad}/${idEntidad}/${tipoProceso}`
    };

    $.ajax({
        url: "/api/apigee-router-proxy",
        method: "POST",
        contentType: "application/json",
        data: JSON.stringify(payload),
        success: function (response) {
            if (response && response.code_status === 200) {
                const data = response.json_response || [];
                console.log("Datos de aprobaciones de la promoción:", data);

                let lista = Array.isArray(data) ? data : [data];

                if (!lista || lista.length === 0) {
                    $('#tabla-aprobaciones-promocion').html('<div class="alert alert-light text-center border">No hay historial de aprobaciones.</div>');
                    return;
                }

                let html = `
                <table id='dt-historial' class='table table-sm table-bordered table-hover w-100'>
                    <thead class="table-light">
                        <tr>
                            <th>ID Aprobación</th>
                            <th>Usuario Solicitante</th>
                            <th>Usuario Aprobador</th>
                            <th>Estado</th>
                            <th>Fecha Solicitud</th>
                            <th>Nivel Aprobación</th>
                            <th>Tipo Proceso</th>
                        </tr>
                    </thead>
                    <tbody>`;

                lista.forEach(item => {
                    let comentarioLimpio = (item.comentario && item.comentario !== "string")
                        ? item.comentario
                        : "Sin comentarios.";

                    let estadoNombre = item.estado_nombre || item.estado_etiqueta || "N/A";
                    let estadoUpper = estadoNombre.toUpperCase();

                    let iconoPopover = "";
                    if (estadoUpper.includes("APROBADO") || estadoUpper.includes("NEGADO")) {
                        iconoPopover = `
                        <i class="fa-solid fa-comment-dots text-warning ms-1"
                           style="cursor: pointer; font-size: 0.9rem;"
                           data-bs-toggle="popover" 
                           data-bs-trigger="focus" 
                           data-bs-placement="top"
                           tabindex="0"
                           title="Comentario" 
                           data-bs-content="${comentarioLimpio}">
                        </i>`;
                    }

                    html += `<tr>
                        <td class="text-center">${item.idaprobacion || ""}</td>
                        <td>${item.idusersolicitud || ""}</td>
                        <td>${item.iduseraprobador || ""}</td>
                        <td class="text-nowrap">${estadoNombre}${iconoPopover}</td>
                        <td class="text-center">${formatearFecha(item.fechasolicitud)}</td>
                        <td class="text-center">${item.nivelaprobacion || 0}</td>
                        <td>${item.tipoproceso_nombre || ""}</td>
                    </tr>`;
                });

                html += `</tbody></table>`;
                $('#tabla-aprobaciones-promocion').html(html);

                // Convertir a DataTable
                tablaHistorial = $('#dt-historial').DataTable({
                    pageLength: 5,
                    lengthMenu: [5, 10, 25],
                    pagingType: 'simple_numbers',
                    searching: false,
                    columnDefs: [
                        { targets: [0, 4, 5], className: "dt-center" },
                        { targets: 3, className: "dt-nowrap" }
                    ],
                    order: [[0, 'desc']],
                    language: {
                        decimal: "",
                        emptyTable: "No hay aprobaciones disponibles",
                        info: "Mostrando _START_ a _END_ de _TOTAL_ aprobaciones",
                        infoEmpty: "Mostrando 0 a 0 de 0 aprobaciones",
                        infoFiltered: "(filtrado de _MAX_ aprobaciones totales)",
                        lengthMenu: "Mostrar _MENU_ aprobaciones",
                        loadingRecords: "Cargando...",
                        processing: "Procesando...",
                        search: "Buscar:",
                        zeroRecords: "No se encontraron aprobaciones coincidentes",
                        paginate: { first: "Primero", last: "Último", next: "Siguiente", previous: "Anterior" }
                    },
                    drawCallback: function () {
                        const popoverTriggerList = document.querySelectorAll('[data-bs-toggle="popover"]');
                        [...popoverTriggerList].map(popoverTriggerEl => new bootstrap.Popover(popoverTriggerEl));
                    }
                });
            } else {
                $('#tabla-aprobaciones-promocion').html('<div class="text-danger small">Error al cargar historial.</div>');
            }
        },
        error: function (xhr) {
            console.error("Error historial:", xhr);
            $('#tabla-aprobaciones-promocion').html('<div class="text-danger small">Error al cargar historial.</div>');
        }
    });
}

// ===================================================================
// FUNCIONES PARA APROBAR/RECHAZAR PROMOCIONES
// ===================================================================

/**
 * Procesa la aprobación o rechazo de una promoción
 */
function procesarAprobacionPromocion(accion, comentario) {
    if (!datosAprobacionActual) {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No hay datos de aprobación disponibles.'
        });
        return;
    }

    let nuevoEstado = "";
    let tituloAccion = "";
    let mensajeAccion = "";

    if (accion === "APROBAR") {
        nuevoEstado = "ESTADOAPROBADO";
        tituloAccion = "Aprobar Promoción";
        mensajeAccion = "¿Está seguro que desea aprobar esta promoción?";
    } else if (accion === "RECHAZAR") {
        nuevoEstado = "ESTADONEGADO";
        tituloAccion = "Rechazar Promoción";
        mensajeAccion = "¿Está seguro que desea rechazar esta promoción?";
    }

    Swal.fire({
        title: tituloAccion,
        text: mensajeAccion,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: accion == "APROBAR" ? '#28a745' : '#dc3545',
        cancelButtonColor: '#6c757d',
        confirmButtonText: accion == "APROBAR" ? 'Sí, aprobar' : 'Sí, rechazar',
        cancelButtonText: 'Cancelar'
    }).then((result) => {
        if (result.isConfirmed) {
            ejecutarAprobacionPromocion(accion, nuevoEstado, comentario);
        }
    });
}

/**
 * Ejecuta el POST al API para aprobar o rechazar
 */
function ejecutarAprobacionPromocion(accion, nuevoEstado, comentario) {
    const idOpcionActual = obtenerIdOpcionSeguro();
    const usuarioActual = obtenerUsuarioActual();

    console.log("accion:", accion);
    console.log("datosAprobacionActual:", datosAprobacionActual);
    console.log('Ejecutando aprobación/rechazo con idOpcion:', idOpcionActual, 'y usuario:', usuarioActual);

    const body = {
        entidad: datosAprobacionActual.entidad,
        identidad: datosAprobacionActual.identidad,
        idtipoproceso: datosAprobacionActual.idtipoproceso,
        idetiquetatipoproceso: datosAprobacionActual.idetiquetatipoproceso,
        comentario: comentario,
        idetiquetaestado: nuevoEstado,
        idaprobacion: datosAprobacionActual.idaprobacion,
        usuarioaprobador: usuarioActual,
        idopcion: idOpcionActual,
        idcontrolinterfaz: accion == "APROBAR" ? "BTNAPROBAR" : "BTNNEGAR",
        idevento: "EVCLICK",
        nombreusuario: usuarioActual
    };

    console.log("Enviando aprobación/rechazo:", body);

    Swal.fire({
        title: 'Procesando...',
        text: 'Por favor espere',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
    });

    const payload = {
        code_app: "APP20260128155212346",
        http_method: "POST",
        endpoint_path: "api/Promocion/aprobar-promocion",
        client: "APL",
        body_request: body
    };

    $.ajax({
        url: "/api/apigee-router-proxy",
        method: "POST",
        contentType: "application/json",
        data: JSON.stringify(payload),
        success: function (response) {
            if (response && response.code_status === 200) {
                const data = response.json_response || {};
                cerrarDetalle();

                Swal.fire({
                    icon: 'success',
                    title: '¡Operación Exitosa!',
                    text: data.respuesta || `Promoción ${accion === "APROBAR" ? "aprobada" : "rechazada"} correctamente`,
                    confirmButtonText: 'Aceptar',
                    timer: 2000,
                    timerProgressBar: true
                }).then(() => {
                    datosAprobacionActual = null;
                    ultimaFilaModificada = null;
                    cargarBandeja();
                });
            } else {
                const mensajeError = response.json_response?.mensaje || 'Error al procesar la aprobación';
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: mensajeError
                });
            }
        },
        error: function (xhr) {
            const mensajeError = xhr.responseJSON?.mensaje || 'Error desconocido';
            console.error("Error al procesar aprobación:", mensajeError);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'No se pudo procesar la aprobación/rechazo: ' + mensajeError
            });
        }
    });
}

// Autor: JEAN FRANCOIS CALDERON VEAS | Empresa: BMTECSA | Proyecto: SOFTWARE APL