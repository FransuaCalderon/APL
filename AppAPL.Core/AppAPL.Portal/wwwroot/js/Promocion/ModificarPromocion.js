// ~/js/Promocion/ModificarPromocion.js

// ===============================================================
// VARIABLES GLOBALES
// ===============================================================
let tabla;
let promocionTemporal = null;
let proveedorTemporal = null;
let propioTemporal = null;

// ===============================================================
// CONFIGURACIÓN MÚLTIPLE (Segmentos)
// ===============================================================
const CONFIG_MULTIPLE = [
    { id: "marca", select: "#segMarca", btnOpen: "#btnMarca", body: "#bodyModalMarca", btnAccept: "#btnAceptarMarca", triggerVal: "3" },
    { id: "division", select: "#segDivision", btnOpen: "#btnDivision", body: "#bodyModalDivision", btnAccept: "#btnAceptarDivision", triggerVal: "3" },
    { id: "depto", select: "#segDepartamento", btnOpen: "#btnDepartamento", body: "#bodyModalDepartamento", btnAccept: "#btnAceptarDepartamento", triggerVal: "3" },
    { id: "clase", select: "#segClase", btnOpen: "#btnClase", body: "#bodyModalClase", btnAccept: "#btnAceptarClase", triggerVal: "3" },
    { id: "canal", select: "#segCanal", btnOpen: "#btnCanal", body: "#bodyModalCanal", btnAccept: "#btnAceptarCanal", triggerVal: "3" },
    { id: "grupo", select: "#segGrupoAlmacen", btnOpen: "#btnGrupoAlmacen", body: "#bodyModalGrupoAlmacen", btnAccept: "#btnAceptarGrupoAlmacen", triggerVal: "3" },
    { id: "almacen", select: "#segAlmacen", btnOpen: "#btnAlmacen", body: "#bodyModalAlmacen", btnAccept: "#btnAceptarAlmacen", triggerVal: "3" },
    { id: "tipocliente", select: "#segTipoCliente", btnOpen: "#btnTipoCliente", body: "#ModalClientesEspecificos", btnAccept: "#btnAceptarClientesEspecificos", triggerVal: "3" },
    { id: "mediopago", select: "#segMedioPago", btnOpen: "#btnMedioPago", body: "#bodyModalMedioPago", btnAccept: "#btnAceptarMedioPago", triggerVal: "7" }
];

// ===============================================================
// FUNCIONES HELPER
// ===============================================================
function obtenerUsuarioActual() {
    return window.usuarioActual || "admin";
}

function getIdOpcionSeguro() {
    try {
        return ((window.obtenerIdOpcionActual && window.obtenerIdOpcionActual()) || "0");
    } catch (e) {
        return "0";
    }
}

function manejarErrorGlobal(xhr, accion) {
    console.error(`Error al ${accion}:`, xhr.responseText);
    Swal.fire({ icon: 'error', title: 'Error', text: `No se pudo completar la acción: ${accion}.` });
}

function formatearFecha(fechaString) {
    if (!fechaString) return "";
    const fecha = new Date(fechaString);
    if (isNaN(fecha.getTime())) return "";
    const dia = fecha.getUTCDate().toString().padStart(2, '0');
    const mes = (fecha.getUTCMonth() + 1).toString().padStart(2, '0');
    const anio = fecha.getUTCFullYear();
    return `${dia}/${mes}/${anio}`;
}

function obtenerNombreArchivo(rutaCompleta) {
    if (!rutaCompleta) return "";
    var nombreArchivo = rutaCompleta.replace(/^.*[\\/]/, '');
    return nombreArchivo.replace(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}_/i, '') || nombreArchivo;
}

function isValidDateDDMMYYYY(s) {
    if (!s || !/^\d{2}\/\d{2}\/\d{4}$/.test(s)) return false;
    const [dd, mm, yyyy] = s.split("/").map(Number);
    const d = new Date(yyyy, mm - 1, dd);
    return d.getFullYear() === yyyy && d.getMonth() === mm - 1 && d.getDate() === dd;
}

function toISOFromDDMMYYYY(s) {
    if (!s || !isValidDateDDMMYYYY(s)) return null;
    const [dd, mm, yyyy] = s.split("/").map(Number);
    return new Date(yyyy, mm - 1, dd).toISOString();
}

function parseCurrencyToNumber(str) {
    if (!str) return 0;
    let clean = str.toString().replace(/[^0-9.,-]/g, '');
    if (clean.includes(',') && !clean.includes('.')) clean = clean.replace(',', '.');
    else if (clean.includes(',') && clean.includes('.')) clean = clean.replace(/\./g, '').replace(',', '.');
    return parseFloat(clean) || 0;
}

function formatCurrencySpanish(value) {
    let number = parseFloat(value);
    if (isNaN(number)) number = 0.0;
    const formatter = new Intl.NumberFormat("es-ES", { style: "decimal", minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return `$ ${formatter.format(number)}`;
}

async function consultarCombos(etiqueta) {
    try {
        const response = await $.ajax({
            url: "/api/apigee-router-proxy",
            method: "POST",
            contentType: "application/json",
            data: JSON.stringify({ code_app: "APP20260128155212346", http_method: "GET", endpoint_path: "api/Opciones/ConsultarCombos", client: "APL", endpoint_query_params: `/${etiqueta}` })
        });
        return response.json_response || [];
    } catch (error) {
        return [];
    }
}

// ===============================================================
// INICIALIZACIÓN DE FILTROS Y COMBOS (SEGMENTOS)
// ===============================================================
function cargarFiltrosJerarquia() {
    const payload = { code_app: "APP20260128155212346", http_method: "GET", endpoint_path: "api/Acuerdo/consultar-combos", client: "APL", endpoint_query_params: "" };
    $.ajax({
        url: "/api/apigee-router-proxy", method: "POST", contentType: "application/json", data: JSON.stringify(payload),
        success: function (res) {
            const data = res.json_response || {};
            llenarComboYModal($("#segMarca"), $("#bodyModalMarca"), data.marcas, "Todas", "3", "marca");
            llenarComboYModal($("#segDivision"), $("#bodyModalDivision"), data.divisiones, "Todas", "3", "division");
            llenarComboYModal($("#segDepartamento"), $("#bodyModalDepartamento"), data.departamentos, "Todos", "3", "depto");
            llenarComboYModal($("#segClase"), $("#bodyModalClase"), data.clases, "Todas", "3", "clase");
        }
    });
}

function cargarCombosPromociones() {
    const payload = { code_app: "APP20260128155212346", http_method: "GET", endpoint_path: "api/Promocion/consultar-combos-promociones", client: "APL", endpoint_query_params: "" };
    $.ajax({
        url: "/api/apigee-router-proxy", method: "POST", contentType: "application/json", data: JSON.stringify(payload),
        success: function (res) {
            const data = res.json_response || {};
            llenarComboYModal($("#segCanal"), $("#bodyModalCanal"), data.canales, "Todos", "3", "canal");
            llenarComboYModal($("#segGrupoAlmacen"), $("#bodyModalGrupoAlmacen"), data.gruposalmacenes, "Todos", "3", "grupo");
            llenarComboYModal($("#segAlmacen"), $("#bodyModalAlmacen"), data.almacenes, "Todos", "3", "almacen");
            llenarComboYModal($("#segMedioPago"), $("#bodyModalMedioPago"), data.mediospagos, "Todos", "7", "mediopago");

            const $cli = $("#segTipoCliente");
            $cli.empty().append('<option selected value="">Todos</option>');
            if (data.tiposclientes) data.tiposclientes.forEach(c => $cli.append(`<option value="${c.codigo}">${c.nombre}</option>`));
            $cli.append('<option value="3">Lista Específica</option><option value="4">Varios</option>');
        }
    });
}

const llenarComboYModal = ($select, $modalBody, items, labelDefault, valorVarios, idPrefijo) => {
    $select.empty();
    $select.append(`<option selected value="">${labelDefault}</option>`);
    $select.append(`<option value="${valorVarios}" class="fw-bold text-success">-- VARIOS --</option>`);
    $modalBody.empty();
    const $ul = $('<ul class="list-group w-100"></ul>');
    if (Array.isArray(items)) {
        items.forEach(i => {
            const codigo = i.codigo || i.id || i.valor;
            const texto = i.nombre || i.descripcion || i.codigo;
            $select.append($("<option>", { value: codigo, text: texto }));
            const chkId = `chk_${idPrefijo}_${codigo}`;
            $ul.append(`<li class="list-group-item"><input class="form-check-input me-1 chk-seleccion-multiple" type="checkbox" value="${codigo}" id="${chkId}"><label class="form-check-label stretched-link" for="${chkId}">${texto}</label></li>`);
        });
    }
    $modalBody.append($ul);
};

function initLogicaSeleccionMultiple() {
    CONFIG_MULTIPLE.forEach(conf => {
        $(conf.select).off("change").on("change", function () {
            if ($(this).val() === conf.triggerVal || ($(this).val() === "4" && conf.id === "tipocliente")) {
                $(conf.btnOpen).removeClass("d-none");
            } else {
                $(conf.btnOpen).addClass("d-none").removeData("seleccionados").html(`<i class="fa-solid fa-list-check"></i>`).removeClass("btn-success-custom").addClass("btn-outline-secondary");
            }
        });

        $(conf.btnAccept).off("click").on("click", function () {
            let seleccionados = [];
            if (conf.id === "tipocliente" && conf.triggerVal === "3") {
                const text = $("#txtListaClientes").val() || "";
                seleccionados = text.split(/[\n,]+/).map(s => s.trim()).filter(s => s !== "");
            } else {
                $(`${conf.body} input[type='checkbox']:checked`).each(function () { seleccionados.push($(this).val()); });
            }

            const $btnTrigger = $(conf.btnOpen);
            $btnTrigger.data("seleccionados", seleccionados);
            if (seleccionados.length > 0) {
                $btnTrigger.removeClass("btn-outline-secondary").addClass("btn-success-custom").html(`<i class="fa-solid fa-list-check"></i> (${seleccionados.length})`);
            } else {
                $btnTrigger.removeClass("btn-success-custom").addClass("btn-outline-secondary").html(`<i class="fa-solid fa-list-check"></i>`);
            }
        });
    });
}

function poblarSelectSegmento(configId, segmentos, etiqueta) {
    const conf = CONFIG_MULTIPLE.find(c => c.id === configId);
    if (!conf) return;

    const $select = $(conf.select);
    const $btn = $(conf.btnOpen);
    const $modalBody = $(conf.body);

    $modalBody.find("input[type='checkbox']").prop("checked", false);
    $btn.addClass("d-none").removeClass("btn-success-custom").addClass("btn-outline-secondary").html(`<i class="fa-solid fa-list-check"></i>`).removeData("seleccionados");

    const items = (segmentos || []).filter(s => s.etiqueta_tipo_segmento === etiqueta);

    if (items.length === 0) {
        $select.val("").trigger("change");
        return;
    }

    const primerItem = items[0];

    // Tipo Todos
    if (primerItem.tipoasignacion === "T" || primerItem.tipoasignacion === "TODOS") {
        $select.val("").trigger("change");
        return;
    }

    // Un solo registro
    if (items.length === 1 && primerItem.codigo_detalle && primerItem.tipoasignacion !== "C") {
        $select.val(primerItem.codigo_detalle).trigger("change");
        return;
    }

    // Tipo Lista o Varios
    if (items.length > 1 || primerItem.tipoasignacion === "C" || primerItem.tipoasignacion === "D") {
        $select.val(conf.triggerVal).trigger("change");
        $btn.removeClass("d-none").removeClass("btn-outline-secondary").addClass("btn-success-custom");
        $btn.html(`<i class="fa-solid fa-list-check"></i> (${items.length})`);

        const seleccionados = [];
        items.forEach(i => {
            const cod = i.codigo_detalle;
            seleccionados.push(cod);
            $modalBody.find(`input[value='${cod}']`).prop("checked", true);
        });

        if (configId === "tipocliente" && conf.triggerVal === "3") {
            $("#txtListaClientes").val(seleccionados.join(",\n"));
        }

        $btn.data("seleccionados", seleccionados);
    }
}

// ===============================================================
// LÓGICA DE CÁLCULOS ACUERDOS
// ===============================================================
function initValidacionesFinancieras() {
    const soloNumeros = function () {
        this.value = this.value.replace(/[^0-9.]/g, '');
        calcularTotalDescuento();
    };

    $("#descuentoProveedor, #descuentoPropio").on("input", soloNumeros);
    $("#descuentoProveedor, #descuentoPropio").on("blur", function () {
        let val = parseFloat($(this).val()) || 0;
        if (val > 0) $(this).val(val.toFixed(2));
    });

    $("#fondoValorTotal, #comprometidoPropio").on("blur", function () {
        let valStr = $(this).val().replace(/[^0-9.]/g, '');
        let valorIngresado = parseFloat(valStr) || 0;
        $(this).val(valorIngresado > 0 ? formatCurrencySpanish(valorIngresado) : "");
    });
}

function calcularTotalDescuento() {
    let descProv = parseFloat($("#descuentoProveedor").val()) || 0;
    let descProp = parseFloat($("#descuentoPropio").val()) || 0;
    let total = descProv + descProp;
    $("#descuentoTotal").val(total > 0 ? total.toFixed(2) : "");
}

// ===============================================================
// CONSULTA DE ACUERDOS MODALES
// ===============================================================
function consultarAcuerdos(tipoFondo, tablaId, onSeleccion) {
    const $tbody = $(`#${tablaId} tbody`);
    $tbody.html('<tr><td colspan="13" class="text-center">Cargando...</td></tr>');

    // Obtenemos la etiqueta de la clase de la promoción actual para buscar acuerdos compatibles
    const claseAcuerdo = $('#modalTipoPromocion').val() || "PRGENERAL";
    // Mapeamos a la clase de acuerdo correspondiente (CLAARTICULO, CLACOMBO, CLAGENERAL)
    let claseMapeada = "CLAGENERAL";
    if (claseAcuerdo === "PRARTICULO") claseMapeada = "CLAARTICULO";
    else if (claseAcuerdo === "PRCOMBO") claseMapeada = "CLACOMBO";

    const payload = {
        code_app: "APP20260128155212346", http_method: "GET", endpoint_path: "api/Promocion/consultar-acuerdo", client: "APL",
        endpoint_query_params: "/" + tipoFondo + "/" + claseMapeada
    };

    $.ajax({
        url: "/api/apigee-router-proxy", method: "POST", contentType: "application/json", data: JSON.stringify(payload),
        success: function (res) {
            const data = res.json_response || [];
            $tbody.empty();
            if (!data.length) { $tbody.html('<tr><td colspan="13" class="text-center">No hay datos.</td></tr>'); return; }

            const fmtDate = (s) => s ? new Date(s).toLocaleDateString("es-EC") : "";
            data.forEach(x => {
                const row = `<tr class="text-nowrap">
                    <td class="text-center">
                        <input class="form-check-input acuerdo-radio" type="radio" name="acuerdo_${tipoFondo}"
                            data-idacuerdo="${x.idacuerdo || ''}" data-desc="${x.descripcion || ''}"
                            data-disp="${x.valor_disponible || 0}">
                    </td>
                    <td>${x.idacuerdo}</td><td>${x.descripcion}</td><td>${x.idfondo}</td><td>${x.nombre_proveedor}</td>
                    <td>${x.nombre_tipo_fondo}</td><td class="text-end">${formatCurrencySpanish(x.valor_acuerdo)}</td>
                    <td>${fmtDate(x.fecha_inicio)}</td><td>${fmtDate(x.fecha_fin)}</td><td class="text-end">${formatCurrencySpanish(x.valor_disponible)}</td>
                    <td class="text-end">${formatCurrencySpanish(x.valor_comprometido)}</td><td class="text-end">${formatCurrencySpanish(x.valor_liquidado)}</td>
                    <td>${x.estado}</td>
                </tr>`;
                $tbody.append(row);
            });

            $(`#${tablaId} .acuerdo-radio`).change(function () {
                $(`#${tablaId} tr`).removeClass("table-active");
                $(this).closest("tr").addClass("table-active");
                const d = $(this).data();
                if (onSeleccion) onSeleccion({ idAcuerdo: d.idacuerdo, display: `${d.idacuerdo} - ${d.desc}`, disponible: d.disp });
            });
        }
    });
}

// ===============================================================
// DOCUMENT READY
// ===============================================================
$(document).ready(function () {
    cargarFiltrosJerarquia();
    cargarCombosPromociones();
    initLogicaSeleccionMultiple();
    initValidacionesFinancieras();

    $.get("/config", function (config) {
        window.apiBaseUrl = config.apiBaseUrl;
        cargarBandeja();
    }).fail(function () { cargarBandeja(); });

    $('#btnVolverTabla, #btnVolverAbajo').on('click', function () { cerrarDetalle(); });
    $('#btnGuardarModificacion').on('click', function () { guardarPromocion(); });

    $('#chkArticulo').on('change', function () {
        $('#segArticulo').prop('disabled', !this.checked);
        if (!this.checked) $('#segArticulo').val('');

        const isChecked = $(this).is(":checked");
        const $jerarquia = $("#segMarca, #segDivision, #segDepartamento, #segClase");
        const $btns = $("#btnMarca, #btnDivision, #btnDepartamento, #btnClase");
        $jerarquia.prop("disabled", isChecked);
        if (isChecked) {
            $jerarquia.val("").trigger("change");
            $btns.addClass("d-none");
        }
    });

    $('#btnVerSoporteActual').on('click', function () {
        const ruta = $(this).data('soporte');
        if (!ruta) { Swal.fire({ icon: 'info', title: 'Sin soporte', text: 'No hay archivo adjunto.' }); return; }
        window.open(`/api/Promocion/ver-soporte?ruta=${encodeURIComponent(ruta)}`, '_blank');
    });

    // Modales de Acuerdo
    $("#modalConsultaProveedor").on("show.bs.modal", function () {
        proveedorTemporal = null;
        consultarAcuerdos("TFPROVEDOR", "tablaProveedores", (s) => proveedorTemporal = s);
    });
    $("#btnAceptarProveedor").click(function () {
        if (proveedorTemporal) {
            $("#fondoProveedorText").val(proveedorTemporal.display);
            $("#fondoProveedorId").val(proveedorTemporal.idAcuerdo);
            $("#fondoDisponibleProv").val(proveedorTemporal.disponible);
            $("#modalConsultaProveedor").modal("hide");
        }
    });

    $("#modalConsultaAcuerdoPropio").on("show.bs.modal", function () {
        propioTemporal = null;
        consultarAcuerdos("TFPROPIO", "tablaAcuerdosPropios", (s) => propioTemporal = s);
    });
    $("#btnAceptarAcuerdoPropio").click(function () {
        if (propioTemporal) {
            $("#acuerdoPropioText").val(propioTemporal.display);
            $("#acuerdoPropioId").val(propioTemporal.idAcuerdo);
            $("#acuerdoPropioDisponible").val(propioTemporal.disponible);
            $("#modalConsultaAcuerdoPropio").modal("hide");
        }
    });

    initDatepickers();
});

// ===================================================================
// FUNCIONES DE CARGA (BANDEJA) EXACTO ORIGINAL
// ===================================================================
function cargarBandeja() {
    const payload = { code_app: "APP20260128155212346", http_method: "GET", endpoint_path: "api/Promocion/consultar-bandeja-modificacion", client: "APL" };
    $.ajax({
        url: "/api/apigee-router-proxy", method: "POST", contentType: "application/json", data: JSON.stringify(payload),
        success: function (res) {
            const data = res.json_response || [];
            crearListado(data);
        },
        error: function (xhr) { manejarErrorGlobal(xhr, "cargar bandeja"); }
    });
}

function crearListado(data) {
    if (tabla) tabla.destroy();
    if (!data || data.length === 0) { $('#tabla').html("<div class='alert alert-info text-center'>No hay promociones.</div>"); return; }

    let html = `
        <table id="tabla-principal" class="table table-bordered table-striped table-hover">
            <thead>
                <tr>
                    <th colspan="10" style="background-color: #CC0000 !important; color: white; text-align: center; font-weight: bold; padding: 8px; font-size: 1rem;">
                        BANDEJA DE MODIFICACIÓN DE PROMOCIONES
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
                    <button type="button" class="btn-action edit-btn" title="Modificar" onclick="abrirModalEditar(${promo.idpromocion})" style="border:none; background:none; color:#0d6efd;">
                        <i class="fa-regular fa-pen-to-square"></i>
                    </button>
                </td>
                <td class="text-center">${promo.idpromocion ?? ""}</td>
                <td>${promo.descripcion ?? ""}</td>
                <td>${promo.motivo ?? ""}</td>
                <td>${promo.clase_promocion ?? ""}</td>
                <td class="text-center">${formatearFecha(promo.fecha_inicio)}</td>
                <td class="text-center">${formatearFecha(promo.fecha_fin)}</td>
                <td class="text-center">${promo.marcaregalo && promo.marcaregalo !== "N" ? "✓" : ""}</td>
                <td>${obtenerNombreArchivo(promo.archivosoporte)}</td>
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
        language: { url: "//cdn.datatables.net/plug-ins/1.13.6/i18n/es-ES.json" }
    });
}

function abrirModalEditar(idPromocion) {
    resetFormulario();
    $('#lblIdPromocion').text(idPromocion);
    $('#modalPromocionId').val(idPromocion);

    const payload = { code_app: "APP20260128155212346", http_method: "GET", endpoint_path: "api/Promocion/bandeja-modificacion-id", client: "APL", endpoint_query_params: `/${idPromocion}` };
    $.ajax({
        url: "/api/apigee-router-proxy", method: "POST", contentType: "application/json", data: JSON.stringify(payload),
        success: function (res) {
            const data = res.json_response || {};
            promocionTemporal = data;
            poblarFormulario(data);
            $('#vistaTabla').hide();
            $('#vistaDetalle').fadeIn();
        },
        error: function (xhr) { manejarErrorGlobal(xhr, "obtener detalle"); }
    });
}

function poblarFormulario(data) {
    const cab = data.cabecera || {};
    const acuerdos = data.acuerdos || [];
    const segmentos = data.segmentos || [];

    // LÍNEA 1
    $('#verPromocionHeader').val(`${cab.idpromocion || ""} - ${cab.nombre_clase_promocion || ""}`);
    $('#verPromocionNum').val(cab.idpromocion);
    $('#modalTipoPromocion').val(cab.etiqueta_clase_promocion || "");
    $('#promocionDescripcion').val(cab.descripcion || "");
    $('#promocionFechaInicio').val(formatearFecha(cab.fecha_inicio));
    $('#promocionFechaFin').val(formatearFecha(cab.fecha_fin));
    $('#verEstadoPromocion').val(cab.nombre_estado_promocion || cab.estado || "");

    const rutaSoporte = cab.archivosoporte || "";
    $('#btnVerSoporteActual').data('soporte', rutaSoporte);
    $('#lblArchivoActual').val(obtenerNombreArchivo(rutaSoporte) || "Ningún archivo seleccionado");

    cargarMotivos(function () { $('#promocionMotivo').val(cab.id_motivo); });

    // LÍNEA 2 y 3 (Segmentos)
    poblarSelectSegmento("marca", segmentos, "SEGMARCA");
    poblarSelectSegmento("division", segmentos, "SEGDIVISION");
    poblarSelectSegmento("depto", segmentos, "SEGDEPARTAMENTO");
    poblarSelectSegmento("clase", segmentos, "SEGCLASE");
    poblarSelectSegmento("canal", segmentos, "SEGCANAL");
    poblarSelectSegmento("grupo", segmentos, "SEGGRUPOALMACEN");
    poblarSelectSegmento("almacen", segmentos, "SEGALMACEN");
    poblarSelectSegmento("tipocliente", segmentos, "SEGTIPOCLIENTE");
    poblarSelectSegmento("mediopago", segmentos, "SEGMEDIOPAGO");

    // ARTÍCULO
    const artItems = segmentos.filter(s => s.etiqueta_tipo_segmento === "SEGARTICULO");
    if (artItems.length > 0 && artItems[0].codigo_detalle) {
        $('#chkArticulo').prop('checked', true).trigger("change");
        $('#segArticulo').val(artItems[0].codigo_detalle);
    }

    // REGALO
    $('#promocionMarcaRegalo').prop('checked', (cab.marcaregalo || "N").toUpperCase() === "S");

    // LÍNEA 4 (ACUERDOS) PINTAR DESDE DB
    const acProv = acuerdos.length > 0 ? acuerdos[0] : null;
    const acProp = acuerdos.length > 1 ? acuerdos[1] : null;

    if (acProv) {
        $("#descuentoProveedor").val(acProv.porcentaje_descuento || 0);
        $("#fondoProveedorId").val(acProv.idacuerdo || "");
        $("#fondoProveedorText").val(acProv.idacuerdo ? `${acProv.idacuerdo} - ${acProv.descripcion_acuerdo || ""}` : "");
        $("#fondoValorTotal").val(formatCurrencySpanish(acProv.valor_comprometido || 0));
    }
    if (acProp) {
        $("#descuentoPropio").val(acProp.porcentaje_descuento || 0);
        $("#acuerdoPropioId").val(acProp.idacuerdo || "");
        $("#acuerdoPropioText").val(acProp.idacuerdo ? `${acProp.idacuerdo} - ${acProp.descripcion_acuerdo || ""}` : "");
        $("#comprometidoPropio").val(formatCurrencySpanish(acProp.valor_comprometido || 0));
    }
    calcularTotalDescuento();
}

function resetFormulario() {
    $('#formPromocion')[0].reset();
    $('#lblArchivoActual').val('Ningún archivo seleccionado');
    $('#btnVerSoporteActual').removeData('soporte');

    CONFIG_MULTIPLE.forEach(conf => {
        $(conf.select).val("").trigger("change");
        $(conf.btnOpen).addClass("d-none").removeData("seleccionados").html(`<i class="fa-solid fa-list-check"></i>`).removeClass("btn-success-custom").addClass("btn-outline-secondary");
        $(`${conf.body} input[type='checkbox']`).prop("checked", false);
    });
    $("#txtListaClientes").val("");

    $('#chkArticulo').prop('checked', false).trigger("change");
    $('#segArticulo').val('').prop('disabled', true);

    $("#fondoProveedorId, #fondoDisponibleProv, #acuerdoPropioId, #acuerdoPropioDisponible").val("");
    $("#descuentoProveedor, #fondoProveedorText, #fondoValorTotal, #descuentoPropio, #acuerdoPropioText, #comprometidoPropio, #descuentoTotal").val("");

    proveedorTemporal = null;
    propioTemporal = null;
}

function cerrarDetalle() {
    $('#vistaDetalle').hide();
    $('#vistaTabla').fadeIn();
}

function cargarMotivos(callback) {
    const $select = $('#promocionMotivo');
    const payload = { code_app: "APP20260128155212346", http_method: "GET", endpoint_path: "api/Opciones/ConsultarCombos", client: "APL", endpoint_query_params: "/PRMOTIVOS" };
    $.ajax({
        url: "/api/apigee-router-proxy", method: "POST", contentType: "application/json", data: JSON.stringify(payload),
        success: function (res) {
            $select.empty().append('<option value="">Seleccione...</option>');
            (res.json_response || []).forEach(item => $select.append($('<option>').val(item.idcatalogo).text(item.nombre_catalogo)));
            if (callback) callback();
        }
    });
}

// ===============================================================
// GUARDAR PROMOCIÓN
// ===============================================================
async function guardarPromocion() {
    if (!isValidDateDDMMYYYY($('#promocionFechaInicio').val()) || !isValidDateDDMMYYYY($('#promocionFechaFin').val())) {
        return Swal.fire('Validación', 'Fechas inválidas. Use el formato dd/mm/aaaa.', 'warning');
    }

    const combos = await consultarCombos("TPMODIFICACION");
    const tipoProceso = combos && combos.length > 0 ? combos[0] : null;

    const obtenerValorCampo = (configId, selectId, triggerVal) => {
        const valSelect = $(selectId).val();
        if (valSelect === triggerVal || (configId === "tipocliente" && valSelect === "4")) {
            const conf = CONFIG_MULTIPLE.find(c => c.id === configId);
            return $(conf.btnOpen).data("seleccionados") || [];
        }
        return valSelect && valSelect !== "" ? [valSelect] : [];
    };

    const determinarAsignacion = (idSelector) => {
        const val = $(idSelector).val();
        if (!val || val === "T" || val === "TODOS") return "T";
        if (val === "3" || val === "7" || val === "4") return "C"; // Multiples/Listas
        return "C"; // Especificos unicos
    };

    const segmentosConfig = [
        { tipo: "SEGMARCA", codigos: obtenerValorCampo("marca", "#segMarca", "3"), id: "#segMarca" },
        { tipo: "SEGDIVISION", codigos: obtenerValorCampo("division", "#segDivision", "3"), id: "#segDivision" },
        { tipo: "SEGDEPARTAMENTO", codigos: obtenerValorCampo("depto", "#segDepartamento", "3"), id: "#segDepartamento" },
        { tipo: "SEGCLASE", codigos: obtenerValorCampo("clase", "#segClase", "3"), id: "#segClase" },
        { tipo: "SEGCANAL", codigos: obtenerValorCampo("canal", "#segCanal", "3"), id: "#segCanal" },
        { tipo: "SEGGRUPOALMACEN", codigos: obtenerValorCampo("grupo", "#segGrupoAlmacen", "3"), id: "#segGrupoAlmacen" },
        { tipo: "SEGALMACEN", codigos: obtenerValorCampo("almacen", "#segAlmacen", "3"), id: "#segAlmacen" },
        { tipo: "SEGTIPOCLIENTE", codigos: obtenerValorCampo("tipocliente", "#segTipoCliente", "3"), id: "#segTipoCliente" },
        { tipo: "SEGMEDIOPAGO", codigos: obtenerValorCampo("mediopago", "#segMedioPago", "7"), id: "#segMedioPago" }
    ];

    const segmentosValidados = segmentosConfig.map(seg => ({ tiposegmento: seg.tipo, codigos: seg.codigos, tipoasignacion: determinarAsignacion(seg.id) }));
    if ($('#chkArticulo').is(':checked')) segmentosValidados.push({ tiposegmento: "SEGARTICULO", codigos: [$('#segArticulo').val()], tipoasignacion: "C" });

    // ACUERDOS CONTRUIDOS DESDE LOS CAMPOS DE LA LÍNEA 4
    const acuerdosModificados = [];
    const idProv = parseInt($("#fondoProveedorId").val(), 10) || 0;
    if (idProv > 0) {
        acuerdosModificados.push({
            idacuerdo: idProv,
            porcentajedescuento: parseFloat($("#descuentoProveedor").val()) || 0,
            valorcomprometido: parseCurrencyToNumber($("#fondoValorTotal").val())
        });
    }

    const idProp = parseInt($("#acuerdoPropioId").val(), 10) || 0;
    if (idProp > 0) {
        acuerdosModificados.push({
            idacuerdo: idProp,
            porcentajedescuento: parseFloat($("#descuentoPropio").val()) || 0,
            valorcomprometido: parseCurrencyToNumber($("#comprometidoPropio").val())
        });
    }

    let archivoSoporte = "";
    const $fileInput = $('#inputArchivoSoporte')[0];
    if ($fileInput && $fileInput.files.length > 0) archivoSoporte = $fileInput.files[0].name;

    const body = {
        idpromocion: parseInt($('#modalPromocionId').val(), 10) || 0,
        clasepromocion: $('#modalTipoPromocion').val() || "",
        promocion: {
            descripcion: $('#promocionDescripcion').val(),
            motivo: parseInt($('#promocionMotivo').val(), 10) || 0,
            fechahorainicio: toISOFromDDMMYYYY($('#promocionFechaInicio').val()),
            fechahorafin: toISOFromDDMMYYYY($('#promocionFechaFin').val()),
            marcaregalo: $('#promocionMarcaRegalo').is(':checked') ? "S" : "N",
            idusuariomodifica: obtenerUsuarioActual(), nombreusuario: obtenerUsuarioActual()
        },
        acuerdos: acuerdosModificados,
        segmentos: segmentosValidados,
        archivosoporte: archivoSoporte,
        idtipoproceso: tipoProceso ? tipoProceso.idcatalogo : 0,
        idopcion: getIdOpcionSeguro(), idcontrolinterfaz: "BTNGRABAR", ideventoetiqueta: "EVCLICK"
    };

    Swal.fire({
        title: 'Confirmar Modificación', html: `¿Desea guardar los cambios de la Promoción <strong>#${body.idpromocion}</strong>?`, icon: 'warning',
        showCancelButton: true, confirmButtonColor: '#009845', cancelButtonColor: '#d33', confirmButtonText: 'Sí, Guardar', cancelButtonText: 'Cancelar'
    }).then((result) => {
        if (!result.isConfirmed) return;
        Swal.fire({ title: 'Guardando...', didOpen: () => Swal.showLoading() });
        $.ajax({
            url: "/api/apigee-router-proxy", method: "POST", contentType: "application/json",
            data: JSON.stringify({ code_app: "APP20260128155212346", http_method: "POST", endpoint_path: "api/Promocion/actualizar-promocion", client: "APL", body_request: body }),
            success: function (res) {
                if (res && res.code_status === 200) {
                    Swal.fire({ icon: 'success', title: '¡Guardado!', showConfirmButton: false, timer: 1500 });
                    cargarBandeja(); cerrarDetalle();
                } else Swal.fire('Error al Guardar', res.json_response?.mensaje || 'Error al guardar', 'error');
            },
            error: function (xhr) { manejarErrorGlobal(xhr, "guardar promoción"); }
        });
    });
}

function initDatepickers() {
    if (!$.datepicker) return;
    $.datepicker.setDefaults($.datepicker.regional["es"] || {});
    $('#promocionFechaInicio').datepicker({ dateFormat: "dd/mm/yy", onSelect: function () { const d = $(this).datepicker("getDate"); if (d) { d.setDate(d.getDate() + 1); $('#promocionFechaFin').datepicker("option", "minDate", d); } } });
    $('#promocionFechaFin').datepicker({ dateFormat: "dd/mm/yy", minDate: 1 });
    $('#btnFechaInicio').click(() => $('#promocionFechaInicio').datepicker('show'));
    $('#btnFechaFin').click(() => $('#promocionFechaFin').datepicker('show'));
}