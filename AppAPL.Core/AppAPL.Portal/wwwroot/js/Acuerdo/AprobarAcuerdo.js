// ~/js/Acuerdo/AprobarAcuerdo.js

// ===============================================================
// Variables globales
// ===============================================================
let tabla; // GLOBAL
let ultimaFilaModificada = null; // Para recordar la última fila editada/eliminada
let datosAprobacionActual = null; // Para almacenar los datos de la aprobación actual
let tablaHistorial; // Para la tabla de historial de aprobaciones

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

    console.log("=== INICIO DE CARGA DE PÁGINA - AprobarAcuerdo (Estructura Post-REST) ===");

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
    // EVENTOS PARA APROBAR Y RECHAZAR ACUERDO
    // ===============================================================
    $('#btnAprobarFondo').on('click', function () {
        let comentario = $("#modal-acuerdo-comentario").val();
        console.log('comentario:', comentario);
        console.log('boton de aprobar acuerdo');
        procesarAprobacionAcuerdo("APROBAR", comentario);
    });

    $('#btnRechazarFondo').on('click', function () {
        let comentario = $("#modal-acuerdo-comentario").val();
        console.log('comentario:', comentario);
        console.log('boton de rechazar acuerdo');
        procesarAprobacionAcuerdo("RECHAZAR", comentario);
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

    console.log('Cargando bandeja de acuerdos para usuario:', usuario, 'con idOpcion:', idOpcionActual);

    const payload = {
        code_app: "APP20260128155212346",
        http_method: "GET",
        endpoint_path: "api/Acuerdo/consultar-bandeja-aprobacion",
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
                console.log("Datos recibidos de bandeja-aprobacion acuerdos:", data);
                crearListado(data);
            } else {
                console.error("Error en respuesta:", response);
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'No se pudieron cargar los acuerdos para aprobación'
                });
            }
        },
        error: (xhr) => manejarErrorGlobal(xhr, "cargar la bandeja de aprobación de acuerdos")
    });
}

function crearListado(data) {
    if (tabla) {
        tabla.destroy();
    }

    // Si no hay datos, mostramos mensaje y salimos
    if (!data || data.length === 0) {
        $('#tabla').html(
            "<div class='alert alert-info text-center'>No hay acuerdos para aprobar.</div>"
        );
        return;
    }

    var html = "";
    html += "<table id='tabla-principal' class='table table-bordered table-striped table-hover'>";

    html += "  <thead>";
    // Fila del Título ROJO
    html += "    <tr>";
    html += "      <th colspan='13' style='background-color: #CC0000 !important; color: white; text-align: center; font-weight: bold; padding: 8px; font-size: 1rem;'>";
    html += "          BANDEJA DE APROBACIÓN - ACUERDOS";
    html += "      </th>";
    html += "    </tr>";

    // Fila de las Cabeceras
    html += "    <tr>";
    html += "      <th>Acción</th>";
    html += "      <th>Solicitud</th>";
    html += "      <th>IdAcuerdo</th>";
    html += "      <th>Descripción</th>";
    html += "      <th>Fondo</th>";
    html += "      <th>Clase de Acuerdo</th>";
    html += "      <th>Valor Fondo</th>";
    html += "      <th>Fecha Inicio</th>";
    html += "      <th>Fecha Fin</th>";
    html += "      <th>Valor Disponi</th>";
    html += "      <th>Valor Comprometido</th>";
    html += "      <th>Valor Liquidado</th>";
    html += "      <th>Estado</th>";
    html += "    </tr>";
    html += "  </thead>";
    html += "  <tbody>";

    for (var i = 0; i < data.length; i++) {
        var acuerdo = data[i];

        // Botón de visualizar (Llama a abrirModalEditar)
        var viewButton = '<button type="button" class="btn-action view-btn" title="Visualizar/Aprobar" onclick="abrirModalEditar(' + acuerdo.idacuerdo + ', ' + acuerdo.idaprobacion + ')">' +
            '<i class="fa-regular fa-eye"></i>' +
            '</button>';
        var claseAcuerdoHTML = (acuerdo.nombre_clase_acuerdo ?? "");
        if (acuerdo.cantidad_articulos > 0) {
            claseAcuerdoHTML += '<sup style="font-size: 0.8em; margin-left: 2px; font-weight: bold;">' + acuerdo.cantidad_articulos + '</sup>';
        }
        html += "<tr>";
        html += "  <td class='text-center'>" + viewButton + "</td>";
        html += "  <td>" + (acuerdo.solicitud ?? "") + "</td>";
        html += "  <td>" + (acuerdo.idacuerdo ?? "") + "</td>";
        html += "  <td>" + (acuerdo.descripcion ?? "") + "</td>";
        html += "  <td>" + (acuerdo.nombre_tipo_fondo ?? "") + "</td>";
        html += "  <td>" + claseAcuerdoHTML + "</td>";
        html += "  <td class='text-end'>" + formatearMoneda(acuerdo.valor_acuerdo) + "</td>";
        html += "  <td class='text-center'>" + formatearFecha(acuerdo.fecha_inicio) + "</td>";
        html += "  <td class='text-center'>" + formatearFecha(acuerdo.fecha_fin) + "</td>";
        html += "  <td class='text-end'>" + formatearMoneda(acuerdo.valor_disponible) + "</td>";
        html += "  <td class='text-end'>" + formatearMoneda(acuerdo.valor_comprometido) + "</td>";
        html += "  <td class='text-end'>" + formatearMoneda(acuerdo.valor_liquidado) + "</td>";
        html += "  <td>" + (acuerdo.nombre_estado_acuerdo ?? "") + "</td>";
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
            { targets: 0, width: "6%", className: "dt-center", orderable: false },
            { targets: 1, width: "8%", className: "dt-center" },
            { targets: 2, width: "8%", className: "dt-center" },
            { targets: [7, 8], className: "dt-center" },
            { targets: [6, 9, 10, 11], className: "dt-right" },
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
function abrirModalEditar(idAcuerdo, idAprobacion) {
    console.log("Consultando detalle idAcuerdo:", idAcuerdo, "idAprobacion:", idAprobacion);
    $('body').css('cursor', 'wait');

    // Limpiar datos previos
    datosAprobacionActual = null;

    $("#formVisualizar")[0].reset();
    $("#lblIdAcuerdo").text(idAcuerdo);

    // Limpiar tablas previas
    $('#tabla-aprobaciones-fondo').html('');
    $('#contenedor-tabla-articulos').html('').hide();

    const payload = {
        code_app: "APP20260128155212346",
        http_method: "GET",
        endpoint_path: "api/Acuerdo/bandeja-aprobacion-id",
        client: "APL",
        endpoint_query_params: `/${idAcuerdo}/${idAprobacion}`
    };

    $.ajax({
        url: "/api/apigee-router-proxy",
        method: "POST",
        contentType: "application/json",
        data: JSON.stringify(payload),
        success: function (response) {
            if (response && response.code_status === 200) {
                const data = response.json_response || {};
                console.log(`Datos del acuerdo (${idAcuerdo}):`, data);

                // Guardar datos para los botones de aprobación/rechazo
                datosAprobacionActual = {
                    entidad: data.cabecera?.id_entidad || 0,
                    identidad: data.cabecera?.idacuerdo || 0,
                    idtipoproceso: data.cabecera?.id_tipo_proceso || 0,
                    idetiquetatipoproceso: data.cabecera?.tipo_proceso_etiqueta || "",
                    idaprobacion: idAprobacion,
                    entidad_etiqueta: data.cabecera?.entidad_etiqueta,
                    idetiquetatestado: data.cabecera?.estado_etiqueta || "",
                    comentario: ""
                };

                // 1. Llenar Formulario
                $("#verNombreProveedor").val(data.cabecera?.nombre_proveedor || "");
                $("#verNombreTipoFondo").val(data.cabecera?.nombre_tipo_fondo || "");
                $("#verDescripcion").val(data.cabecera?.descripcion || "");
                $("#verClaseAcuerdo").val(data.cabecera?.nombre_clase_acuerdo || "");
                $("#verEstado").val(data.cabecera?.nombre_estado_acuerdo || "");
                $("#verFechaInicio").val(formatearFecha(data.cabecera?.fecha_inicio));
                $("#verFechaFin").val(formatearFecha(data.cabecera?.fecha_fin));
                $("#verValorAcuerdo").val(formatearMoneda(data.cabecera?.valor_acuerdo));
                $("#verValorDisponible").val(formatearMoneda(data.cabecera?.valor_disponible));
                $("#verValorComprometido").val(formatearMoneda(data.cabecera?.valor_comprometido));
                $("#verValorLiquidado").val(formatearMoneda(data.cabecera?.valor_liquidado));

                // =================================================================
                // LOGICA DE ARTÍCULOS
                // =================================================================
                if (data.articulos && data.articulos.length > 0) {
                    console.log("Acuerdo por artículos detectado. Renderizando tabla...");

                    let htmlArticulos = `
                        <h6 class="fw-bold mb-2"><i class="fa fa-list"></i> Detalle de Artículos</h6>
                        <div class="table-responsive" style="max-height: 300px; overflow-y: auto;">
                            <table class="table table-bordered table-sm mb-0">
                                <thead class="sticky-top text-nowrap">
                                    <tr class="text-center tabla-items-header">                                    
                                        <th scope="col" class="custom-header-cons-bg">Item</th>
                                        <th scope="col" class="custom-header-cons-bg">Costo</th>
                                        <th scope="col" class="custom-header-ingr-bg">Unidades Limite</th>
                                        <th scope="col" class="custom-header-ingr-bg">Precio - Contado</th>
                                        <th scope="col" class="custom-header-ingr-bg">Precio - TC</th>
                                        <th scope="col" class="custom-header-ingr-bg">Precio - Crédito</th>
                                        <th scope="col" class="custom-header-ingr-bg">Aporte x Unidad</th>
                                        <th scope="col" class="custom-header-calc-bg">Comprometido Prov.</th>
                                        <th scope="col" class="custom-header-calc-bg">Margen Contado</th>
                                        <th scope="col" class="custom-header-calc-bg">Margen TC</th>
                                        <th scope="col" class="custom-header-calc-bg">Margen Crédito</th>
                                    </tr>
                                </thead>
                                <tbody class="text-nowrap tabla-items-body bg-white">`;

                    data.articulos.forEach(art => {
                        let margenCredito = (art.preciocredito || 0) - (art.costoactual || 0);

                        htmlArticulos += `
                            <tr>
                                <td class="fw-bold text-center">${art.codigoarticulo || ''}</td>
                                <td class="text-end">${formatearMoneda(art.costoactual)}</td>
                                <td class="text-center fw-bold text-primary">${art.unidadeslimite}</td>
                                <td class="text-end">${formatearMoneda(art.preciocontado)}</td>
                                <td class="text-end">${formatearMoneda(art.preciotarjetacredito)}</td>
                                <td class="text-end">${formatearMoneda(art.preciocredito)}</td>
                                <td class="text-end fw-bold">${formatearMoneda(art.valoraporte)}</td>
                                <td class="text-end fw-bold">${formatearMoneda(art.valorcomprometido)}</td>
                                <td class="text-end">${formatearMoneda(art.margencontado)}</td>
                                <td class="text-end">${formatearMoneda(art.margentarjetacredito)}</td>
                                <td class="text-end">${formatearMoneda(margenCredito)}</td>
                            </tr>`;
                    });

                    htmlArticulos += `
                                </tbody>
                            </table>
                        </div>`;

                    $('#contenedor-tabla-articulos').html(htmlArticulos).fadeIn();
                }

                // 2. LOGICA VISUAL
                $("#vistaTabla").fadeOut(200, function () {
                    $("#vistaDetalle").fadeIn(200);
                });
                $('body').css('cursor', 'default');

                // 3. CARGAR TABLA DE HISTORIAL DE APROBACIONES
                if (data.cabecera?.entidad_etiqueta && data.cabecera?.tipo_proceso_etiqueta) {
                    cargarAprobacionesAcuerdo(
                        data.cabecera.entidad_etiqueta,
                        idAcuerdo,
                        data.cabecera.tipo_proceso_etiqueta
                    );
                } else {
                    $('#tabla-aprobaciones-fondo').html(
                        '<p class="alert alert-warning">No se encontraron los parámetros necesarios para cargar aprobaciones.</p>'
                    );
                }
            } else {
                $('body').css('cursor', 'default');
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'No se pudieron cargar los datos del acuerdo.'
                });
            }
        },
        error: function (xhr) {
            $('body').css('cursor', 'default');
            console.error("Error detalle:", xhr);
            manejarErrorGlobal(xhr, "cargar los datos del acuerdo");
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
function cargarAprobacionesAcuerdo(entidad, idEntidad, tipoProceso) {
    console.log("=== CARGANDO APROBACIONES DE ACUERDO ===");
    console.log("entidad:", entidad);
    console.log("idEntidad:", idEntidad);
    console.log("tipoProceso:", tipoProceso);

    // Destruir tabla anterior si existe
    if ($.fn.DataTable.isDataTable('#dt-historial')) {
        $('#dt-historial').DataTable().destroy();
    }

    // Spinner de carga
    $('#tabla-aprobaciones-fondo').html(`
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
                console.log("Datos de aprobaciones del acuerdo:", data);

                let lista = Array.isArray(data) ? data : [data];

                if (!lista || lista.length === 0) {
                    $('#tabla-aprobaciones-fondo').html('<div class="alert alert-light text-center border">No hay historial de aprobaciones.</div>');
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
                $('#tabla-aprobaciones-fondo').html(html);

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
                $('#tabla-aprobaciones-fondo').html('<div class="text-danger small">Error al cargar historial.</div>');
            }
        },
        error: function (xhr) {
            console.error("Error historial:", xhr);
            $('#tabla-aprobaciones-fondo').html('<div class="text-danger small">Error al cargar historial.</div>');
        }
    });
}

// ===================================================================
// FUNCIONES PARA APROBAR/RECHAZAR ACUERDOS
// ===================================================================

/**
 * Procesa la aprobación o rechazo de un acuerdo
 */
function procesarAprobacionAcuerdo(accion, comentario) {
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
        tituloAccion = "Aprobar Acuerdo";
        mensajeAccion = "¿Está seguro que desea aprobar este acuerdo?";
    } else if (accion === "RECHAZAR") {
        nuevoEstado = "ESTADONEGADO";
        tituloAccion = "Rechazar Acuerdo";
        mensajeAccion = "¿Está seguro que desea rechazar este acuerdo?";
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
            ejecutarAprobacionAcuerdo(accion, nuevoEstado, comentario);
        }
    });
}

/**
 * Ejecuta el POST al API para aprobar o rechazar
 */
function ejecutarAprobacionAcuerdo(accion, nuevoEstado, comentario) {
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
        endpoint_path: "api/Acuerdo/aprobar-acuerdo",
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
                    text: data.respuesta || `Acuerdo ${accion === "APROBAR" ? "aprobado" : "rechazado"} correctamente`,
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