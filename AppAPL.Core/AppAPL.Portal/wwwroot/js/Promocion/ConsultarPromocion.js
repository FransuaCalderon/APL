// ~/js/Promocion/ConsultarPromocion.js

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
    return (v || 0).toLocaleString('es-EC', { style: 'currency', currency: 'USD' });
}

function formatearFecha(f) {
    if (!f) return "";
    const d = new Date(f);
    if (isNaN(d.getTime())) return "";
    const dia = d.getUTCDate().toString().padStart(2, '0');
    const mes = (d.getUTCMonth() + 1).toString().padStart(2, '0');
    const anio = d.getUTCFullYear();
    return `${dia}/${mes}/${anio}`;
}

/**
 * Extrae el nombre del archivo desde una ruta completa, removiendo el GUID prefix
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
    console.log("=== INICIO - ConsultarPromocion (Estructura Post-REST) ===");

    $.get("/config", function (config) {
        window.apiBaseUrl = config.apiBaseUrl;
        cargarBandeja();
    }).fail(function (xhr) {
        console.error("[config] Error al cargar /config:", xhr);
        cargarBandeja();
    });

    // Eventos de Navegación
    $('#btnVolverTabla, #btnVolverAbajo').on('click', function () {
        cerrarDetalle();
    });

    // Botón Limpiar Filtros
    $('body').on('click', '#btnLimpiar', function () {
        if (tabla) {
            tabla.search('').draw();
            tabla.page(0).draw('page');
        }
    });
});

// ===================================================================
// FUNCIONES DE CARGA (BANDEJA)
// ===================================================================

function cargarBandeja() {
    console.log("[cargarBandeja] Iniciando carga de bandeja consulta promociones...");

    const payload = {
        code_app: "APP20260128155212346",
        http_method: "GET",
        endpoint_path: "api/Promocion/consultar-bandeja-general",
        client: "APL"
    };

    $.ajax({
        url: "/api/apigee-router-proxy",
        method: "POST",
        contentType: "application/json",
        data: JSON.stringify(payload),
        success: function (response) {
            console.log("[cargarBandeja] Respuesta completa:", response);

            if (response && response.code_status === 200) {
                const data = response.json_response || [];
                console.log("[cargarBandeja] Total registros:", Array.isArray(data) ? data.length : "No es array");
                crearListado(data);
            } else {
                Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo cargar la bandeja de consulta.' });
            }
        },
        error: (xhr) => manejarErrorGlobal(xhr, "cargar la bandeja de consulta de promociones")
    });
}

function crearListado(data) {
    if (tabla) tabla.destroy();

    const datos = Array.isArray(data) ? data : (data.data || []);

    if (!datos || datos.length === 0) {
        $('#tabla').html(
            "<div class='alert alert-info text-center'>No hay promociones disponibles.</div>"
        );
        return;
    }

    let html = `
        <table id="tabla-principal" class="table table-bordered table-striped table-hover">
            <thead>
                <tr>
                    <th colspan="10" style="background-color: #CC0000 !important; color: white; text-align: center; font-weight: bold; padding: 8px; font-size: 1rem;">
                        BANDEJA DE CONSULTA DE PROMOCIONES
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

    datos.forEach(promo => {
        html += `
            <tr>
                <td class="text-center">
                    <button type="button" class="btn-action view-btn" title="Ver Detalle" onclick="abrirModalEditar(${promo.idpromocion})">
                        <i class="fa-regular fa-eye"></i>
                    </button>
                </td>
                <td class="text-center">${promo.idpromocion ?? ""}</td>
                <td>${promo.descripcion ?? ""}</td>
                <td>${promo.nombre_motivo ?? ""}</td>
                <td>${promo.clase_promocion ?? ""}</td>
                <td class="text-center">${formatearFecha(promo.fecha_inicio)}</td>
                <td class="text-center">${formatearFecha(promo.fecha_fin)}</td>
                <td class="text-center">${promo.regalo ?? ""}</td>
                <td>${obtenerNombreArchivo(promo.soporte)}</td>
                <td>${promo.estado ?? ""}</td>
            </tr>`;
    });

    html += `</tbody></table>`;
    $('#tabla').html(html);

    tabla = $('#tabla-principal').DataTable({
        pageLength: 10,
        lengthMenu: [5, 10, 25, 50],
        pagingType: 'full_numbers',
        columnDefs: [
            { targets: 0, width: "5%", className: "dt-center", orderable: false },
            { targets: 1, width: "8%", className: "dt-center" },
            { targets: [5, 6, 7], className: "dt-center" },
        ],
        order: [[1, 'desc']],
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
        },
        drawCallback: function () {
            if (ultimaFilaModificada !== null) {
                if (typeof marcarFilaPorId === 'function') {
                    marcarFilaPorId('#tabla-principal', ultimaFilaModificada);
                }
            }
        }
    });
}

// ===================================================================
// LÓGICA DE DETALLE
// ===================================================================

function abrirModalEditar(idPromocion) {
    console.log("Consultando detalle idPromocion:", idPromocion);
    $('body').css('cursor', 'wait');

    // Limpiar campos
    $("#formVisualizar")[0].reset();
    $("#lblIdPromocion").text(idPromocion);
    $('#contenedor-tabla-articulos').hide().html('');
    $('#contenedor-tabla-acuerdos').hide().html('');

    const payload = {
        code_app: "APP20260128155212346",
        http_method: "GET",
        endpoint_path: "api/Promocion/bandeja-general-id",
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
                const cab = data.cabecera || {};
                console.log(`Datos de la promoción (${idPromocion}):`, data);

                // Mapeo de Cabecera
                $("#verMotivo").val(cab.nombre_motivo ?? "");
                $("#verClasePromocion").val(cab.nombre_clase_promocion ?? "");
                $("#verEstado").val(cab.nombre_estado_promocion ?? "");
                $("#verDescripcion").val(cab.descripcion ?? "");
                $("#verUsuarioSolicita").val(cab.nombreusersolicitud ?? "");
                $("#verFechaSolicitud").val(formatearFecha(cab.fechasolicitud));
                $("#verFechaInicio").val(formatearFecha(cab.fecha_inicio));
                $("#verFechaFin").val(formatearFecha(cab.fecha_fin));
                $("#verRegalo").val(cab.marcaregalo ?? "");
                $("#verSoporte").val(obtenerNombreArchivo(cab.archivosoporte));

                // Acuerdos asociados
                if (data.acuerdos && data.acuerdos.length > 0) {
                    renderizarTablaAcuerdos(data.acuerdos);
                }

                // Artículos
                if (data.articulos && data.articulos.length > 0) {
                    renderizarTablaArticulos(data.articulos);
                }

                $("#vistaTabla").fadeOut(200, function () {
                    $("#vistaDetalle").fadeIn(200);
                });
                $('body').css('cursor', 'default');
            } else {
                $('body').css('cursor', 'default');
                Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo obtener el detalle de la promoción.' });
            }
        },
        error: function (xhr) {
            $('body').css('cursor', 'default');
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
    $('#contenedor-tabla-acuerdos').html(html).fadeIn();
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
    $('#contenedor-tabla-articulos').html(html).fadeIn();
}

function cerrarDetalle() {
    $('#contenedor-tabla-acuerdos').hide().html('');
    $('#contenedor-tabla-articulos').hide().html('');
    $("#vistaDetalle").fadeOut(200, function () {
        $("#vistaTabla").fadeIn(200);
        if (tabla) tabla.columns.adjust();
    });
}

// Autor: JEAN FRANCOIS CALDERON VEAS | Empresa: BMTECSA | Proyecto: SOFTWARE APL