// ~/js/Promocion/ModificarPromocion.js

// ===============================================================
// VARIABLES GLOBALES
// ===============================================================
let tabla;
let promocionTemporal = null;
let proveedorTemporal = null;
let propioTemporal = null;
let isPopulating = false;

// --- VARIABLES PARA ARTÍCULOS ---
let dtItemsConsultaPromo = null;
let dtAcuerdosArticulo = null;
let acuerdoArticuloTemporal = null;
let acuerdoArticuloContexto = null;
let filaActualMedioPago = null;

// --- VARIABLES PARA COMBOS ---
let comboEnEdicion = null;
let articulosPorComboMemoria = {};
let combosBDOriginal = []; // Para detectar combos eliminados al guardar
window.contextoModalItems = "ARTICULOS";

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
    { id: "tipocliente", select: "#segTipoCliente", btnOpen: "#btnTipoCliente", body: "#bodyModalTipoCliente", btnAccept: "#btnAceptarTipoCliente", triggerVal: "4" },
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

function generarHtmlMedioPagoArticulo(articulossegmentos, codigoItem) {
    if (!articulossegmentos) return "Todos";
    const items = articulossegmentos.filter(s => s.codigoitem === codigoItem && s.etiqueta_tipo_segmento === "SEGMEDIOPAGO");

    if (items.length > 1) {
        const codigos = items.map(i => i.codigo_detalle);
        return `<button type="button" class="btn btn-success btn-sm select-mediopago-articulo" style="font-size:0.7rem; width:100%;" data-seleccionados='${JSON.stringify(codigos)}'><i class="fa-solid fa-list-check"></i> Varios (${items.length})</button>`;
    }

    const opciones = generarOpcionesMedioPago();
    const valor = items.length === 1 ? items[0].codigo_detalle : "";
    return `<select class="form-select form-select-sm select-mediopago-articulo" disabled>${opciones}</select>`;
}

// ===============================================================
// ACTUALIZACIÓN DE EVENTO SELECT MEDIO PAGO
// ===============================================================
$(document).on("click", ".select-mediopago-articulo", function () {
    const $this = $(this);
    const isButton = $this.is('button');

    filaActualMedioPago = $this.closest("tr");
    filaActualMedioPago.find(".item-row-radio").prop("checked", true).trigger("change");

    if (isButton || $this.val() === "7") {
        const guardados = $this.data("seleccionados") || [];
        $("#bodyModalMedioPago input[type='checkbox']").prop("checked", false);
        guardados.forEach(v => $(`#bodyModalMedioPago input[value='${v}']`).prop("checked", true));

        $("#btnAceptarMedioPago").off("click.articulo").on("click.articulo", function () {
            if (filaActualMedioPago) {
                const sel = [];
                $("#bodyModalMedioPago input[type='checkbox']:checked").each(function () { sel.push($(this).val()); });

                const $target = filaActualMedioPago.find(".select-mediopago-articulo");
                $target.data("seleccionados", sel);

                if (sel.length > 1) {
                    const btnHtml = `<button type="button" class="btn btn-success btn-sm select-mediopago-articulo" style="font-size:0.7rem; width:100%;" data-seleccionados='${JSON.stringify(sel)}'><i class="fa-solid fa-list-check"></i> Varios (${sel.length})</button>`;
                    $target.parent().html(btnHtml);
                } else {
                    const opciones = generarOpcionesMedioPago();
                    const selectHtml = `<select class="form-select form-select-sm select-mediopago-articulo">${opciones}</select>`;
                    $target.parent().html(selectHtml);
                    if (sel.length === 1) filaActualMedioPago.find("select").val(sel[0]);
                }
                filaActualMedioPago = null;
            }
        });
        $("#ModalMedioPago").modal("show");
    }
});

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

function obtenerSoloFecha(fechaString) {
    if (!fechaString) return "";
    // Soporta tanto "2026-04-27T00:00:00" como "2026-04-27 00:00:00"
    const parteFecha = fechaString.split(/[T ]/)[0];
    if (!parteFecha || !parteFecha.includes("-")) return "";
    const [anio, mes, dia] = parteFecha.split("-");
    if (!anio || !mes || !dia) return "";
    return `${dia}/${mes}/${anio}`;
}

function obtenerSoloHora(fechaString) {
    if (!fechaString) return "00:00";
    // Soporta tanto "2026-04-27T00:00:00" como "2026-04-27 00:00:00"
    const partes = fechaString.split(/[T ]/);
    if (partes.length < 2) return "00:00";
    return partes[1].substring(0, 5);
}

function unirFechaHora(idInputFecha, idInputHora) {
    const fechaValor = $(`#${idInputFecha}`).val();
    const horaValor = $(`#${idInputHora}`).val();
    if (!fechaValor || !horaValor) return null;
    const [dia, mes, anio] = fechaValor.split('/');
    return `${anio}-${mes}-${dia}T${horaValor}:00`;
}

function isValidDateDDMMYYYYHHMM(s) {
    if (!s) return false;
    return /^\d{2}\/\d{2}\/\d{4}( \d{2}:\d{2})?$/.test(s);
}

function obtenerNombreArchivo(rutaCompleta) {
    if (!rutaCompleta) return "";
    var nombreArchivo = rutaCompleta.replace(/^.*[\\/]/, '');
    return nombreArchivo.replace(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}_/i, '') || nombreArchivo;
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

function getTipoPromocionActual() {
    return ($('#modalTipoPromocion').val() || "PRGENERAL").toUpperCase();
}

function getClaseAcuerdo() {
    const tipo = getTipoPromocionActual();
    if (tipo === "PRARTICULO") return "CLAARTICULO";
    if (tipo === "PRCOMBO") return "CLACOMBO";
    return "CLAGENERAL";
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
            llenarComboYModal($("#segMarca"), $("#bodyModalMarca"), data.marcas, "Seleccione...", "3", "marca", "Todas");
            llenarComboYModal($("#segDivision"), $("#bodyModalDivision"), data.divisiones, "Seleccione...", "3", "division", "Todas");
            llenarComboYModal($("#segDepartamento"), $("#bodyModalDepartamento"), data.departamentos, "Seleccione...", "3", "depto", "Todos");
            llenarComboYModal($("#segClase"), $("#bodyModalClase"), data.clases, "Seleccione...", "3", "clase", "Todas");
            window._filtrosJerarquiaData = data;
        }
    });
}

function consultarAlmacenes(codigoGrupo = undefined, callback = null) {
    const payload = {
        code_app: "APP20260128155212346",
        http_method: "GET",
        endpoint_path: "api/Promocion/consultar-almacen",
        client: "APL",
        endpoint_query_params: codigoGrupo ? `/${codigoGrupo}` : ""
    };

    $.ajax({
        url: "/api/apigee-router-proxy",
        method: "POST",
        contentType: "application/json",
        data: JSON.stringify(payload),
        success: function (response) {
            const listaAlmacenes = response.json_response || [];
            llenarComboYModal($("#segAlmacen"), $("#bodyModalAlmacen"), listaAlmacenes, "Seleccione...", "3", "almacen", "Todos");
            if (callback && typeof callback === "function") callback();
        }
    });
}

function cargarCombosPromociones() {
    const payload = { code_app: "APP20260128155212346", http_method: "GET", endpoint_path: "api/Promocion/consultar-combos-promociones", client: "APL", endpoint_query_params: "" };
    $.ajax({
        url: "/api/apigee-router-proxy", method: "POST", contentType: "application/json", data: JSON.stringify(payload),
        success: function (res) {
            const data = res.json_response || {};
            let mediosPagoFiltrados = (data.mediospagos || []).filter(m => {
                let nom = (m.nombre || "").toUpperCase();
                return nom !== "TODOS" && nom !== "TODAS" && m.codigo !== "0";
            });

            window._mediosPagoData = mediosPagoFiltrados;
            llenarComboYModal($("#segCanal"), $("#bodyModalCanal"), data.canales, "Seleccione...", "3", "canal");
            llenarComboYModal($("#segGrupoAlmacen"), $("#bodyModalGrupoAlmacen"), data.gruposalmacenes, "Seleccione...", "3", "grupo", "Todos");
            llenarComboYModal($("#segMedioPago"), $("#bodyModalMedioPago"), mediosPagoFiltrados, "Seleccione...", "7", "mediopago");

            const $cli = $("#segTipoCliente");
            const $modalBodyCli = $("#bodyModalTipoCliente");
            $cli.empty();
            $cli.append('<option selected value="">Seleccione...</option>');
            $cli.append('<option value="TODOS">Todos</option>');
            $cli.append('<option value="4" class="fw-bold text-success">-- VARIOS --</option>');
            $modalBodyCli.empty();
            const $ulCli = $('<ul class="list-group w-100"></ul>');
            if (data.tiposclientes) {
                data.tiposclientes.forEach(c => {
                    if (c.nombre.toUpperCase() !== "TODOS" && c.codigo !== "0" && c.codigo !== "") {
                        $cli.append(`<option value="${c.codigo}">${c.nombre}</option>`);
                        const chkId = `chk_tipocliente_${c.codigo}`;
                        $ulCli.append(`<li class="list-group-item"><input class="form-check-input me-1 chk-seleccion-multiple" type="checkbox" value="${c.codigo}" id="${chkId}"><label class="form-check-label stretched-link" for="${chkId}">${c.nombre}</label></li>`);
                    }
                });
            }
            $modalBodyCli.append($ulCli);
            $cli.append('<option value="3">Lista Específica</option>');
        }
    });
}

const llenarComboYModal = ($select, $modalBody, items, labelDefault, valorVarios, idPrefijo, textoTodas = null) => {
    $select.empty();
    $select.append(`<option selected value="">${labelDefault}</option>`);
    if (textoTodas) $select.append(`<option value="TODOS">${textoTodas}</option>`);
    $select.append(`<option value="${valorVarios}" class="fw-bold text-success">-- VARIOS --</option>`);
    $modalBody.empty();
    const $ul = $('<ul class="list-group w-100"></ul>');
    if (Array.isArray(items)) {
        items.forEach(i => {
            const codigo = i.codigo || i.id || i.valor || i.codigogrupo || i.codigoalmacen;
            const texto = i.nombre || i.descripcion || i.codigo || i.nombregrupo || i.nombrealmacen;
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
            const val = $(this).val();

            if (conf.id === "tipocliente") {
                if (val === "3") {
                    $(conf.btnOpen).removeClass("d-none").attr("data-bs-target", "#ModalClientesEspecificos");
                    if (!isPopulating) setTimeout(() => { $("#ModalClientesEspecificos").modal("show"); }, 50);
                } else if (val === "4") {
                    $(conf.btnOpen).removeClass("d-none").attr("data-bs-target", "#ModalTipoClienteVarios");
                    if (!isPopulating) setTimeout(() => { $("#ModalTipoClienteVarios").modal("show"); }, 50);
                } else {
                    $(conf.btnOpen).addClass("d-none").removeData("seleccionados").html(`<i class="fa-solid fa-list-check"></i>`).removeClass("btn-success-custom").addClass("btn-outline-secondary");
                }
            } else {
                if (val === conf.triggerVal) {
                    $(conf.btnOpen).removeClass("d-none");
                    if (!isPopulating) {
                        setTimeout(() => { $(conf.btnOpen)[0].click(); }, 50);
                    }
                } else {
                    $(conf.btnOpen).addClass("d-none").removeData("seleccionados").html(`<i class="fa-solid fa-list-check"></i>`).removeClass("btn-success-custom").addClass("btn-outline-secondary");
                }
            }

            if (conf.id === "marca") {
                if (!isPopulating) {
                    const idProveedorActual = $("#fondoProveedorId").val();
                    if (idProveedorActual) {
                        Swal.fire({ icon: 'warning', title: 'Cambio de Marca Detectado', text: 'Se ha limpiado el acuerdo actual por seguridad.' });
                        validarBloqueoProveedor(true);
                    } else {
                        Swal.fire({ icon: 'info', title: 'Marca Modificada', text: 'Los acuerdos de proveedor se filtrarán por esta marca.', toast: true, position: 'top-end', timer: 3000, showConfirmButton: false });
                    }
                }
                if (val === "" || val === "TODAS") {
                    validarBloqueoProveedor(true);
                } else if (val !== conf.triggerVal) {
                    validarBloqueoProveedor(false);
                }
            }
        });

        if (conf.id === "tipocliente") {
            $("#btnAceptarClientesEspecificos, #btnAceptarTipoCliente").off("click").on("click", function () {
                let seleccionados = [];
                if ($(this).attr("id") === "btnAceptarClientesEspecificos") {
                    const text = $("#txtListaClientes").val() || "";
                    seleccionados = text.split(/[\n,]+/).map(s => s.trim()).filter(s => s !== "");
                } else {
                    $(`#bodyModalTipoCliente input[type='checkbox']:checked`).each(function () { seleccionados.push($(this).val()); });
                }
                if (seleccionados.length === 0) {
                    $(conf.select).val("").trigger("change");
                    return;
                } else if (seleccionados.length === 1 && $(this).attr("id") !== "btnAceptarClientesEspecificos") {
                    const valorUnico = seleccionados[0];
                    if ($(conf.select).find(`option[value='${valorUnico}']`).length > 0) {
                        $(conf.select).val(valorUnico).trigger("change");
                        return;
                    }
                }
                const $btnTrigger = $(conf.btnOpen);
                $btnTrigger.data("seleccionados", seleccionados);
                if (seleccionados.length > 0) {
                    $btnTrigger.removeClass("btn-outline-secondary").addClass("btn-success-custom").html(`<i class="fa-solid fa-list-check"></i> (${seleccionados.length})`);
                }
            });
        } else {
            $(conf.btnAccept).off("click").on("click", function () {
                let seleccionados = [];
                $(`${conf.body} input[type='checkbox']:checked`).each(function () { seleccionados.push($(this).val()); });
                if (seleccionados.length === 0) {
                    $(conf.select).val("").trigger("change");
                    return;
                } else if (seleccionados.length === 1) {
                    const valorUnico = seleccionados[0];
                    if ($(conf.select).find(`option[value='${valorUnico}']`).length > 0) {
                        $(conf.select).val(valorUnico).trigger("change");
                        return;
                    }
                }
                const $btnTrigger = $(conf.btnOpen);
                $btnTrigger.data("seleccionados", seleccionados);
                if (seleccionados.length > 0) {
                    $btnTrigger.removeClass("btn-outline-secondary").addClass("btn-success-custom").html(`<i class="fa-solid fa-list-check"></i> (${seleccionados.length})`);
                }
                if (conf.id === "marca") {
                    validarBloqueoProveedor(seleccionados.length > 1);
                }
            });
        }
    });
}

function poblarSelectSegmento(configId, segmentos, etiqueta) {
    const conf = CONFIG_MULTIPLE.find(c => c.id === configId);
    if (!conf) return;

    const $select = $(conf.select);
    const $btn = $(conf.btnOpen);
    const $modalBody = $(conf.body);

    $modalBody.find("input[type='checkbox']").prop("checked", false);
    if (configId === "tipocliente") $("#txtListaClientes").val("");

    $btn.addClass("d-none").removeClass("btn-success-custom").addClass("btn-outline-secondary").html(`<i class="fa-solid fa-list-check"></i>`).removeData("seleccionados");

    const items = (segmentos || []).filter(s => s.etiqueta_tipo_segmento === etiqueta);

    if (items.length === 0) {
        $select.val("").trigger("change");
        return;
    }

    const primerItem = items[0];

    if (primerItem.tipoasignacion === "T" || primerItem.tipoasignacion === "TODOS") {
        $select.val("TODOS").trigger("change");
        return;
    }

    if (items.length === 1 && primerItem.codigo_detalle) {
        const existeOpcion = $select.find(`option[value='${primerItem.codigo_detalle}']`).length > 0;
        if (existeOpcion && primerItem.codigo_detalle !== conf.triggerVal) {
            $select.val(primerItem.codigo_detalle).trigger("change");
            return;
        }
    }

    if (items.length > 0) {
        let valParaTrigger = conf.triggerVal;

        if (configId === "tipocliente" && primerItem.codigo_detalle && primerItem.codigo_detalle.length > 5) {
            valParaTrigger = "3";
        } else if (configId === "tipocliente" && items.length > 1) {
            valParaTrigger = "4";
        }

        $select.val(valParaTrigger).trigger("change");
        $btn.removeClass("d-none").removeClass("btn-outline-secondary").addClass("btn-success-custom");
        $btn.html(`<i class="fa-solid fa-list-check"></i> (${items.length})`);

        const seleccionados = [];
        items.forEach(i => {
            const cod = i.codigo_detalle;
            seleccionados.push(cod);
            $modalBody.find(`input[value='${cod}']`).prop("checked", true);
        });

        if (configId === "tipocliente" && valParaTrigger === "3") {
            $("#txtListaClientes").val(seleccionados.join(",\n"));
        }

        $btn.data("seleccionados", seleccionados);
    }
}

// ===============================================================
// LÓGICA DE CÁLCULOS ACUERDOS (GENERAL)
// ===============================================================
function initValidacionesFinancieras() {
    $("#descuentoProveedor, #descuentoPropio")
        .off("focus input blur")
        .on("focus", function () {
            if (parseFloat($(this).val()) === 0) $(this).val("");
        })
        .on("input", function () {
            this.value = this.value.replace(/[^0-9.]/g, '');
            calcularTotalDescuento();
        })
        .on("blur", function () {
            let val = parseFloat($(this).val()) || 0;
            $(this).val(val > 0 ? val.toFixed(2) : "");
            calcularTotalDescuento();
        });

    $("#fondoValorTotal, #comprometidoPropio")
        .off("focus input blur")
        .on("focus", function () {
            let valStr = $(this).val().replace(/[^0-9.,]/g, '');
            if (valStr.includes(',') && !valStr.includes('.')) valStr = valStr.replace(',', '.');
            else if (valStr.includes(',') && valStr.includes('.')) valStr = valStr.replace(/\./g, '').replace(',', '.');
            let val = parseFloat(valStr);
            $(this).val(!isNaN(val) && val > 0 ? val : "");
        })
        .on("input", function () {
            this.value = this.value.replace(/[^0-9.]/g, '');
        })
        .on("blur", function () {
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

function consultarAcuerdos(tipoFondo, tablaId, onSeleccion) {
    const $tbody = $(`#${tablaId} tbody`);
    $tbody.html('<tr><td colspan="13" class="text-center">Cargando...</td></tr>');

    const claseAcuerdo = getClaseAcuerdo();
    let endpointParams = `/${tipoFondo}/${claseAcuerdo}`;

    if (tipoFondo === "TFPROVEDOR") {
        let parametroMarca = "0";
        const valMarca = $("#segMarca").val();
        if (valMarca === "3") {
            const seleccionados = $("#btnMarca").data("seleccionados") || [];
            if (seleccionados.length === 1) parametroMarca = seleccionados[0];
        } else if (valMarca && valMarca !== "TODAS" && valMarca !== "") {
            parametroMarca = valMarca;
        }
        endpointParams += `/${parametroMarca}`;
    }

    const payload = { code_app: "APP20260128155212346", http_method: "GET", endpoint_path: "api/Promocion/consultar-acuerdo", client: "APL", endpoint_query_params: endpointParams };

    $.ajax({
        url: "/api/apigee-router-proxy", method: "POST", contentType: "application/json", data: JSON.stringify(payload),
        success: function (res) {
            const data = res.json_response || [];
            $tbody.empty();
            if (!data.length) { $tbody.html('<tr><td colspan="13" class="text-center">No hay datos.</td></tr>'); return; }

            const fmtDate = (s) => s ? new Date(s).toLocaleDateString("es-EC") : "";
            data.forEach(x => {
                const row = `<tr class="text-nowrap">
                    <td class="text-center"><input class="form-check-input acuerdo-radio" type="radio" name="acuerdo_${tipoFondo}" data-idacuerdo="${x.idacuerdo || ''}" data-desc="${x.descripcion || ''}" data-prov="${x.nombre_proveedor || ''}" data-disp="${x.valor_disponible || 0}"></td>
                    <td>${x.idacuerdo}</td><td>${x.descripcion}</td><td>${x.idfondo}</td><td>${x.nombre_proveedor}</td>
                    <td>${x.nombre_tipo_fondo}</td><td class="text-end">${formatCurrencySpanish(x.valor_acuerdo)}</td>
                    <td>${fmtDate(x.fecha_inicio)}</td><td>${fmtDate(x.fecha_fin)}</td><td class="text-end">${formatCurrencySpanish(x.valor_disponible)}</td>
                    <td class="text-end">${formatCurrencySpanish(x.valor_comprometido)}</td><td class="text-end">${formatCurrencySpanish(x.valor_liquidado)}</td>
                    <td>${x.estado}</td></tr>`;
                $tbody.append(row);
            });

            $(`#${tablaId} .acuerdo-radio`).change(function () {
                $(`#${tablaId} tr`).removeClass("table-active");
                $(this).closest("tr").addClass("table-active");
                const d = $(this).data();
                let textoDisplay = `${d.idacuerdo} - ${d.desc}`;
                if (d.prov && d.prov.toString().trim() !== "") textoDisplay = `${d.idacuerdo} - ${d.prov} - ${d.desc}`;
                if (onSeleccion) onSeleccion({ idAcuerdo: d.idacuerdo, display: textoDisplay, disponible: d.disp });
            });
        }
    });
}

function evaluarBloqueosAcuerdos() {
    const idProv = $("#fondoProveedorId").val();
    if (idProv && idProv !== "0" && idProv !== "") {
        $("#descuentoProveedor, #fondoValorTotal").prop("disabled", false);
    } else {
        $("#descuentoProveedor, #fondoValorTotal").val("").prop("disabled", true);
    }
    const idProp = $("#acuerdoPropioId").val();
    if (idProp && idProp !== "0" && idProp !== "") {
        $("#descuentoPropio, #comprometidoPropio").prop("disabled", false);
    } else {
        $("#descuentoPropio, #comprometidoPropio").val("").prop("disabled", true);
    }
    calcularTotalDescuento();
}

function validarBloqueoProveedor(bloquear) {
    const $inputProv = $("#fondoProveedorText");
    const $btnBuscar = $("#btnBuscarProv");
    const $btnBorrar = $("#btnBorrarProv");
    const $idProv = $("#fondoProveedorId");
    const $idHidden = $("#fondoDisponibleProv");
    if (bloquear) {
        $inputProv.val("").prop("disabled", true).attr("placeholder", "");
        $idProv.val("");
        $idHidden.val("0");
        $btnBuscar.prop("disabled", true);
        $btnBorrar.prop("disabled", true);
    } else {
        $inputProv.prop("disabled", false).attr("placeholder", "Selec...");
        $btnBuscar.prop("disabled", false);
        $btnBorrar.prop("disabled", false);
    }
    evaluarBloqueosAcuerdos();
}

// ===============================================================
// LÓGICA ARTÍCULOS - TABLA EDITABLE
// ===============================================================
function generarOpcionesMedioPago() {
    let html = '<option value="">Seleccione...</option>';
    html += '<option value="7" class="fw-bold text-success">-- VARIOS --</option>';
    if (window._mediosPagoData) {
        window._mediosPagoData.forEach(m => {
            const codigo = m.codigo || m.id || m.valor;
            const nombre = m.nombre || m.descripcion || m.codigo;
            html += `<option value="${codigo}">${nombre}</option>`;
        });
    }
    return html;
}

function agregarItemsATablaArticulos(items) {
    const $tbody = $("#tablaArticulosBody");
    let itemsNuevos = 0;
    const opcionesMedioPago = generarOpcionesMedioPago();

    items.forEach(item => {
        const codigo = item.codigo || item.codigoitem || "";
        const existe = $tbody.find(`tr[data-codigo="${codigo}"]`).length > 0;
        if (existe) return;

        itemsNuevos++;
        const fila = `
        <tr data-codigo="${codigo}" data-accion="I" data-idpromocionarticulo="0">
            <td class="text-center align-middle"><input type="radio" class="form-check-input item-row-radio" name="itemArticuloSel"></td>
            <td class="align-middle table-sticky-col">${codigo} - ${item.descripcion || ''}</td>
            <td class="align-middle text-end">${formatCurrencySpanish(item.costo || 0)}</td>
            <td class="align-middle text-end">${item.stock || item.stockbodega || 0}</td>
            <td class="align-middle text-end">${item.stocktienda || 0}</td>
            <td class="align-middle text-end">${item.optimo || item.inventariooptimo || 0}</td>
            <td class="align-middle text-end">${item.excedenteu || item.excedenteunidad || 0}</td>
            <td class="align-middle text-end">${formatCurrencySpanish(item.excedentes || item.excedentevalor || 0)}</td>
            <td class="align-middle text-end">${item.m0u || item.m0unidades || 0}</td>
            <td class="align-middle text-end">${formatCurrencySpanish(item.m0s || item.m0precio || 0)}</td>
            <td class="align-middle text-end">${item.m1u || item.m1unidades || 0}</td>
            <td class="align-middle text-end">${formatCurrencySpanish(item.m1s || item.m1precio || 0)}</td>
            <td class="align-middle text-end">${item.m2u || item.m2unidades || 0}</td>
            <td class="align-middle text-end">${formatCurrencySpanish(item.m2s || item.m2precio || 0)}</td>
            <td class="align-middle text-end">${item.m12u || item.m12unidades || 0}</td>
            <td class="align-middle text-end">${formatCurrencySpanish(item.m12s || item.m12precio || 0)}</td>
            <td class="align-middle text-end">${formatCurrencySpanish(item.igualarprecio || 0)}</td>
            <td class="align-middle text-end">${item.diasantiguedad || 0}</td>
            <td class="align-middle text-end">${item.margenminimocontado || '0.00'}%</td>
            <td class="align-middle text-end">${item.margenminimotarjetacredito || '0.00'}%</td>
            <td class="align-middle text-end">${item.margenminimocredito || '0.00'}%</td>
            <td class="align-middle text-end">${item.margenminimoigualar || '0.00'}%</td>
            <td class="align-middle celda-editable"><input type="number" class="form-control form-control-sm text-end" value="${item.unidadeslimite || ''}" placeholder="0" min="0" disabled></td>
            <td class="align-middle celda-editable"><input type="number" class="form-control form-control-sm text-end" value="${item.unidadesproyeccionventas || ''}" placeholder="0" min="0" disabled></td>
            <td class="align-middle celda-editable">
                <select class="form-select form-select-sm select-mediopago-articulo" disabled>${opcionesMedioPago}</select>
            </td>
            <td class="align-middle text-end">${formatCurrencySpanish(item.preciolistacontado || 0)}</td>
            <td class="align-middle text-end">${formatCurrencySpanish(item.preciolistacredito || 0)}</td>
            <td class="align-middle celda-editable"><input type="text" class="form-control form-control-sm text-end" value="${item.preciopromocioncontado || ''}" placeholder="0.00" disabled></td>
            <td class="align-middle celda-editable"><input type="text" class="form-control form-control-sm text-end" value="${item.preciopromociontarjetacredito || ''}" placeholder="0.00" disabled></td>
            <td class="align-middle celda-editable"><input type="text" class="form-control form-control-sm text-end" value="${item.preciopromocioncredito || ''}" placeholder="0.00" disabled></td>
            <td class="align-middle celda-editable"><input type="text" class="form-control form-control-sm text-end" value="${item.precioigualarprecio || ''}" placeholder="0.00" disabled></td>
            <td class="align-middle text-end">${(item.descuentopromocioncontado || 0).toFixed ? parseFloat(item.descuentopromocioncontado || 0).toFixed(2) : '0.00'}</td>
            <td class="align-middle text-end">${parseFloat(item.descuentopromociontarjetacredito || 0).toFixed(2)}</td>
            <td class="align-middle text-end">${parseFloat(item.descuentopromocioncredito || 0).toFixed(2)}</td>
            <td class="align-middle text-end">${parseFloat(item.descuentoigualarprecio || 0).toFixed(2)}</td>
            <td class="align-middle"><input type="text" class="form-control form-control-sm text-end aporte-valor aporte-proveedor" value="${item._aporteProveedor || ''}" placeholder="0.00" disabled></td>
            <td class="align-middle celda-editable">
                <input type="hidden" class="acuerdo-id-hidden acuerdo-prov1-hidden" value="${item._idAcuerdoProveedor || ''}">
                <div class="input-group input-group-sm">
                    <input type="text" class="form-control form-control-sm" value="${item._displayAcuerdoProveedor || ''}" placeholder="Seleccione..." readonly disabled>
                    <button class="btn btn-outline-secondary btn-buscar-acuerdo-art" type="button" data-tipofondo="TFPROVEDOR" data-slot="1" disabled><i class="fa-solid fa-magnifying-glass"></i></button>
                </div>
            </td>
            <td class="align-middle"><input type="text" class="form-control form-control-sm text-end aporte-valor aporte-proveedor2" value="${item._aporteProveedor2 || ''}" placeholder="0.00" disabled></td>
            <td class="align-middle celda-editable">
                <input type="hidden" class="acuerdo-id-hidden acuerdo-prov2-hidden" value="${item._idAcuerdoProveedor2 || ''}">
                <div class="input-group input-group-sm">
                    <input type="text" class="form-control form-control-sm" value="${item._displayAcuerdoProveedor2 || ''}" placeholder="Seleccione..." readonly disabled>
                    <button class="btn btn-outline-secondary btn-buscar-acuerdo-art" type="button" data-tipofondo="TFPROVEDOR" data-slot="2" disabled><i class="fa-solid fa-magnifying-glass"></i></button>
                </div>
            </td>
            <td class="align-middle"><input type="text" class="form-control form-control-sm text-end aporte-valor aporte-rebate" value="${item._aporteRebate || ''}" placeholder="0.00" disabled></td>
            <td class="align-middle celda-editable">
                <input type="hidden" class="acuerdo-id-hidden acuerdo-rebate-hidden" value="${item._idAcuerdoRebate || ''}">
                <div class="input-group input-group-sm">
                    <input type="text" class="form-control form-control-sm" value="${item._displayAcuerdoRebate || ''}" placeholder="Seleccione..." readonly disabled>
                    <button class="btn btn-outline-secondary btn-buscar-acuerdo-art" type="button" data-tipofondo="TFREBATE" data-slot="1" disabled><i class="fa-solid fa-magnifying-glass"></i></button>
                </div>
            </td>
            <td class="align-middle celda-editable"><input type="text" class="form-control form-control-sm text-end aporte-valor aporte-propio" value="${item._aportePropio || ''}" placeholder="0.00" disabled></td>
            <td class="align-middle celda-editable">
                <input type="hidden" class="acuerdo-id-hidden acuerdo-propio1-hidden" value="${item._idAcuerdoPropio || ''}">
                <div class="input-group input-group-sm">
                    <input type="text" class="form-control form-control-sm" value="${item._displayAcuerdoPropio || ''}" placeholder="Seleccione..." readonly disabled>
                    <button class="btn btn-outline-secondary btn-buscar-acuerdo-art" type="button" data-tipofondo="TFPROPIO" data-slot="1" disabled><i class="fa-solid fa-magnifying-glass"></i></button>
                </div>
            </td>
            <td class="align-middle celda-editable"><input type="text" class="form-control form-control-sm text-end aporte-valor aporte-propio2" value="${item._aportePropio2 || ''}" placeholder="0.00" disabled></td>
            <td class="align-middle celda-editable">
                <input type="hidden" class="acuerdo-id-hidden acuerdo-propio2-hidden" value="${item._idAcuerdoPropio2 || ''}">
                <div class="input-group input-group-sm">
                    <input type="text" class="form-control form-control-sm" value="${item._displayAcuerdoPropio2 || ''}" placeholder="Seleccione..." readonly disabled>
                    <button class="btn btn-outline-secondary btn-buscar-acuerdo-art" type="button" data-tipofondo="TFPROPIO" data-slot="2" disabled><i class="fa-solid fa-magnifying-glass"></i></button>
                </div>
            </td>
            <td class="align-middle text-end">0.00%</td>
            <td class="align-middle text-end">0.00%</td> <td class="align-middle text-end">0.00%</td>
            <td class="align-middle text-end">0.00%</td>
            <td class="align-middle text-end">0.00%</td>
            <td class="align-middle text-end">0.00%</td>
            <td class="align-middle text-end">${formatCurrencySpanish(0)}</td>
            <td class="align-middle text-end">${formatCurrencySpanish(0)}</td>
            <td class="align-middle text-end">${formatCurrencySpanish(0)}</td>
            <td class="align-middle text-end">${formatCurrencySpanish(0)}</td>
            <td class="align-middle text-end">${formatCurrencySpanish(0)}</td>
            <td class="align-middle celda-editable text-center"><input class="form-check-input" type="checkbox" disabled></td>
        </tr>`;
        $tbody.append(fila);
    });

    if (itemsNuevos > 0 && $tbody.find(".item-row-radio:checked").length === 0) {
        const $primeraFila = $tbody.find("tr").first();
        $primeraFila.find(".item-row-radio").prop("checked", true).trigger("change");
    }
}

function poblarArticulosDesdeAPI(data) {
    const articulos = data.articulos || [];
    const articulosacuerdos = data.articulosacuerdos || [];
    const articulossegmentos = data.articulossegmentos || [];
    const articulosotros = data.articulosotros || [];

    const $tbody = $("#tablaArticulosBody");
    $tbody.empty();
    const opcionesMedioPago = generarOpcionesMedioPago();

    articulos.forEach(art => {
        const codigoItem = art.codigoitem || "";
        const idPromocionArticulo = art.idpromocionarticulo || 0;

        const acuerdosArt = articulosacuerdos.filter(a => a.idpromocionarticulo === idPromocionArticulo);
        const acuerdosProv = acuerdosArt.filter(a => (a.etiqueta_tipo_fondo || "").toUpperCase() === "TFPROVEDOR");
        const acProv1 = acuerdosProv.length > 0 ? acuerdosProv[0] : null;
        const acProv2 = acuerdosProv.length > 1 ? acuerdosProv[1] : null;

        const acuerdosProp = acuerdosArt.filter(a => (a.etiqueta_tipo_fondo || "").toUpperCase() === "TFPROPIO");
        const acProp1 = acuerdosProp.length > 0 ? acuerdosProp[0] : null;
        const acProp2 = acuerdosProp.length > 1 ? acuerdosProp[1] : null;

        const acRebate = acuerdosArt.find(a => (a.etiqueta_tipo_fondo || "").toUpperCase() === "TFREBATE");

        const provDisplay1 = acProv1 ? `${acProv1.idacuerdo} - ${acProv1.nombre_proveedor || ""}` : "";
        const provDisplay2 = acProv2 ? `${acProv2.idacuerdo} - ${acProv2.nombre_proveedor || ""}` : "";
        const rebateDisplay = acRebate ? `${acRebate.idacuerdo} - ${acRebate.nombre_proveedor || ""}` : "";
        const propioDisplay1 = acProp1 ? `${acProp1.idacuerdo} - ${acProp1.nombre_proveedor || ""}` : "";
        const propioDisplay2 = acProp2 ? `${acProp2.idacuerdo} - ${acProp2.nombre_proveedor || ""}` : "";

        const apProv1 = acProv1 ? (acProv1.valor_aporte || 0) : 0;
        const apProv2 = acProv2 ? (acProv2.valor_aporte || 0) : 0;
        const apReb = acRebate ? (acRebate.valor_aporte || 0) : 0;
        const apProp1 = acProp1 ? (acProp1.valor_aporte || 0) : 0;
        const apProp2 = acProp2 ? (acProp2.valor_aporte || 0) : 0;

        const mpItems = (articulossegmentos || []).filter(s => s.codigoitem === codigoItem && (s.etiqueta_tipo_segmento || "").toUpperCase() === "SEGMEDIOPAGO");

        const otrosCostosArt = (articulosotros || []).filter(s => s.idpromocionarticulo === idPromocionArticulo);
        const totalOtrosCostos = otrosCostosArt.reduce((sum, oc) => sum + (parseFloat(oc.costo) || 0), 0);

        const esRegalo = (art.marcaregalo ?? "").toString().trim().toUpperCase() === "S";

        const fila = `
        <tr data-codigo="${codigoItem}" data-accion="U" data-idpromocionarticulo="${idPromocionArticulo}">
            <td class="text-center align-middle"><input type="radio" class="form-check-input item-row-radio" name="itemArticuloSel"></td>
            <td class="align-middle table-sticky-col">${art.descripcion || (codigoItem + ' - ')}</td>
            <td class="align-middle text-end">${formatCurrencySpanish(art.costo || 0)}</td>
            <td class="align-middle text-end">${art.stockbodega || 0}</td>
            <td class="align-middle text-end">${art.stocktienda || 0}</td>
            <td class="align-middle text-end">${art.inventariooptimo || 0}</td>
            <td class="align-middle text-end">${art.excedenteunidad || 0}</td>
            <td class="align-middle text-end">${formatCurrencySpanish(art.excedentevalor || 0)}</td>
            <td class="align-middle text-end">${art.m0unidades || 0}</td>
            <td class="align-middle text-end">${formatCurrencySpanish(art.m0precio || 0)}</td>
            <td class="align-middle text-end">${art.m1unidades || 0}</td>
            <td class="align-middle text-end">${formatCurrencySpanish(art.m1precio || 0)}</td>
            <td class="align-middle text-end">${art.m2unidades || 0}</td>
            <td class="align-middle text-end">${formatCurrencySpanish(art.m2precio || 0)}</td>
            <td class="align-middle text-end">${art.m12unidades || 0}</td>
            <td class="align-middle text-end">${formatCurrencySpanish(art.m12precio || 0)}</td>
            <td class="align-middle text-end">${formatCurrencySpanish(art.igualarprecio || 0)}</td>
            <td class="align-middle text-end">${art.diasantiguedad || 0}</td>
            <td class="align-middle text-end">${(art.margenminimocontado || 0).toFixed(2)}%</td>
            <td class="align-middle text-end">${(art.margenminimotarjetacredito || 0).toFixed(2)}%</td>
            <td class="align-middle text-end">${(art.margenminimocredito || 0).toFixed(2)}%</td>
            <td class="align-middle text-end">${(art.margenminimoigualar || 0).toFixed(2)}%</td>
            <td class="align-middle celda-editable"><input type="number" class="form-control form-control-sm text-end" value="${art.unidadeslimite || ''}" placeholder="0" min="0" disabled></td>
            <td class="align-middle celda-editable"><input type="number" class="form-control form-control-sm text-end" value="${art.unidadesproyeccionventas || ''}" placeholder="0" min="0" disabled></td>
            <td class="align-middle celda-editable">
                <select class="form-select form-select-sm select-mediopago-articulo" disabled>${opcionesMedioPago}</select>
            </td>
            <td class="align-middle text-end">${formatCurrencySpanish(art.preciolistacontado || 0)}</td>
            <td class="align-middle text-end">${formatCurrencySpanish(art.preciolistacredito || 0)}</td>
            <td class="align-middle celda-editable"><input type="text" class="form-control form-control-sm text-end" value="${art.preciopromocioncontado || ''}" placeholder="0.00" disabled></td>
            <td class="align-middle celda-editable"><input type="text" class="form-control form-control-sm text-end" value="${art.preciopromociontarjetacredito || ''}" placeholder="0.00" disabled></td>
            <td class="align-middle celda-editable"><input type="text" class="form-control form-control-sm text-end" value="${art.preciopromocioncredito || ''}" placeholder="0.00" disabled></td>
            <td class="align-middle celda-editable"><input type="text" class="form-control form-control-sm text-end" value="${art.precioigualarprecio || ''}" placeholder="0.00" disabled></td>
            <td class="align-middle text-end">${parseFloat(art.descuentopromocioncontado || 0).toFixed(2)}</td>
            <td class="align-middle text-end">${parseFloat(art.descuentopromociontarjetacredito || 0).toFixed(2)}</td>
            <td class="align-middle text-end">${parseFloat(art.descuentopromocioncredito || 0).toFixed(2)}</td>
            <td class="align-middle text-end">${parseFloat(art.descuentoigualarprecio || 0).toFixed(2)}</td>

            <td class="align-middle"><input type="text" class="form-control form-control-sm text-end aporte-valor aporte-proveedor" value="${apProv1 || ''}" placeholder="0.00" disabled></td>
            <td class="align-middle celda-editable">
                <input type="hidden" class="acuerdo-id-hidden acuerdo-prov1-hidden" value="${acProv1 ? acProv1.idacuerdo : ''}">
                <div class="input-group input-group-sm">
                    <input type="text" class="form-control form-control-sm" value="${provDisplay1}" placeholder="Seleccione..." readonly disabled>
                    <button class="btn btn-outline-secondary btn-buscar-acuerdo-art" type="button" data-tipofondo="TFPROVEDOR" data-slot="1" disabled><i class="fa-solid fa-magnifying-glass"></i></button>
                </div>
            </td>
            <td class="align-middle"><input type="text" class="form-control form-control-sm text-end aporte-valor aporte-proveedor2" value="${apProv2 || ''}" placeholder="0.00" disabled></td>
            <td class="align-middle celda-editable">
                <input type="hidden" class="acuerdo-id-hidden acuerdo-prov2-hidden" value="${acProv2 ? acProv2.idacuerdo : ''}">
                <div class="input-group input-group-sm">
                    <input type="text" class="form-control form-control-sm" value="${provDisplay2}" placeholder="Seleccione..." readonly disabled>
                    <button class="btn btn-outline-secondary btn-buscar-acuerdo-art" type="button" data-tipofondo="TFPROVEDOR" data-slot="2" disabled><i class="fa-solid fa-magnifying-glass"></i></button>
                </div>
            </td>

            <td class="align-middle"><input type="text" class="form-control form-control-sm text-end aporte-valor aporte-rebate" value="${apReb || ''}" placeholder="0.00" disabled></td>
            <td class="align-middle celda-editable">
                <input type="hidden" class="acuerdo-id-hidden acuerdo-rebate-hidden" value="${acRebate ? acRebate.idacuerdo : ''}">
                <div class="input-group input-group-sm">
                    <input type="text" class="form-control form-control-sm" value="${rebateDisplay}" placeholder="Seleccione..." readonly disabled>
                    <button class="btn btn-outline-secondary btn-buscar-acuerdo-art" type="button" data-tipofondo="TFREBATE" data-slot="1" disabled><i class="fa-solid fa-magnifying-glass"></i></button>
                </div>
            </td>

            <td class="align-middle celda-editable"><input type="text" class="form-control form-control-sm text-end aporte-valor aporte-propio" value="${apProp1 || ''}" placeholder="0.00" disabled></td>
            <td class="align-middle celda-editable">
                <input type="hidden" class="acuerdo-id-hidden acuerdo-propio1-hidden" value="${acProp1 ? acProp1.idacuerdo : ''}">
                <div class="input-group input-group-sm">
                    <input type="text" class="form-control form-control-sm" value="${propioDisplay1}" placeholder="Seleccione..." readonly disabled>
                    <button class="btn btn-outline-secondary btn-buscar-acuerdo-art" type="button" data-tipofondo="TFPROPIO" data-slot="1" disabled><i class="fa-solid fa-magnifying-glass"></i></button>
                </div>
            </td>
            <td class="align-middle celda-editable"><input type="text" class="form-control form-control-sm text-end aporte-valor aporte-propio2" value="${apProp2 || ''}" placeholder="0.00" disabled></td>
            <td class="align-middle celda-editable">
                <input type="hidden" class="acuerdo-id-hidden acuerdo-propio2-hidden" value="${acProp2 ? acProp2.idacuerdo : ''}">
                <div class="input-group input-group-sm">
                    <input type="text" class="form-control form-control-sm" value="${propioDisplay2}" placeholder="Seleccione..." readonly disabled>
                    <button class="btn btn-outline-secondary btn-buscar-acuerdo-art" type="button" data-tipofondo="TFPROPIO" data-slot="2" disabled><i class="fa-solid fa-magnifying-glass"></i></button>
                </div>
            </td>

            <td class="align-middle text-end">${(art.margenpreciolistacontado || 0).toFixed(2)}%</td>
            <td class="align-middle text-end">${(art.margenpreciolistacredito || 0).toFixed(2)}%</td> <td class="align-middle text-end">${(art.margenpromocioncontado || 0).toFixed(2)}%</td>
            <td class="align-middle text-end">${(art.margenpromociontarjetacredito || 0).toFixed(2)}%</td>
            <td class="align-middle text-end">${(art.margenpromocioncredito || 0).toFixed(2)}%</td>
            <td class="align-middle text-end">${(art.margenigualarprecio || 0).toFixed(2)}%</td>
            <td class="align-middle text-end">${formatCurrencySpanish(0)}</td>
            <td class="align-middle text-end">${formatCurrencySpanish(0)}</td>
            <td class="align-middle text-end">${formatCurrencySpanish(0)}</td>
            <td class="align-middle text-end">${formatCurrencySpanish(0)}</td>
            <td class="align-middle text-end">${formatCurrencySpanish(0)}</td>
            <td class="align-middle celda-editable text-center"><input class="form-check-input" type="checkbox" ${esRegalo ? "checked" : ""} disabled></td>
        </tr>`;
        $tbody.append(fila);

        const $filaAppended = $tbody.find(`tr[data-codigo="${codigoItem}"]`).last();
        $filaAppended.data("total-otros-costos", totalOtrosCostos);
        $filaAppended.data("detalle-otros-costos", otrosCostosArt.map(oc => ({
            codigo: oc.idpromocionarticulo, nombre: oc.descripcion, valor: parseFloat(oc.costo) || 0
        })));

        if (mpItems.length > 0) {
            const tipoAsig = (mpItems[0].tipoasignacion || "").toUpperCase();
            if (tipoAsig !== "T") {
                const codigos = mpItems.map(mp => mp.codigo_detalle).filter(c => c);
                if (codigos.length > 1) {
                    const btnHtml = `<button type="button" class="btn btn-success btn-sm select-mediopago-articulo" style="font-size:0.7rem; width:100%;" data-seleccionados='${JSON.stringify(codigos)}'><i class="fa-solid fa-list-check"></i> Varios (${codigos.length})</button>`;
                    $filaAppended.find(".select-mediopago-articulo").replaceWith(btnHtml);
                } else if (codigos.length === 1) {
                    $filaAppended.find(".select-mediopago-articulo").val(codigos[0]);
                }
            }
        }

        recalcularFilaArticulo($filaAppended);
    });

    if ($tbody.find("tr").length > 0) {
        $tbody.find("tr").first().find(".item-row-radio").prop("checked", true).trigger("change");
    }
}

function recalcularFilaArticulo($fila) {
    const costo = parseCurrencyToNumber($fila.find("td:eq(2)").text());
    const precioListaContado = parseCurrencyToNumber($fila.find("td:eq(25)").text());
    const precioListaCredito = parseCurrencyToNumber($fila.find("td:eq(26)").text());

    const precioContado = parseCurrencyToNumber($fila.find("td:eq(27) input").val());
    const precioTC = parseCurrencyToNumber($fila.find("td:eq(28) input").val());
    const precioCredito = parseCurrencyToNumber($fila.find("td:eq(29) input").val());
    const precioIgualar = parseCurrencyToNumber($fila.find("td:eq(30) input").val());

    const aporteProveedor = parseCurrencyToNumber($fila.find(".aporte-proveedor").val());
    const aporteProveedor2 = parseCurrencyToNumber($fila.find(".aporte-proveedor2").val());
    const aporteRebate = parseCurrencyToNumber($fila.find(".aporte-rebate").val());
    const aportePropio = parseCurrencyToNumber($fila.find(".aporte-propio").val());
    const aportePropio2 = parseCurrencyToNumber($fila.find(".aporte-propio2").val());

    const otrosCostos = parseFloat($fila.data("total-otros-costos")) || 0;

    // Unidades límite estrictamente para cálculos de compensaciones
    const unidadesLimite = parseInt($fila.find("td:eq(22) input").val()) || 0;

    // Descuentos
    $fila.find("td:eq(31)").text((precioListaContado - precioContado).toFixed(2));
    $fila.find("td:eq(32)").text((precioListaContado - precioTC).toFixed(2));
    $fila.find("td:eq(33)").text((precioListaCredito - precioCredito).toFixed(2));
    $fila.find("td:eq(34)").text((precioListaContado - precioIgualar).toFixed(2));

    // Margen Precio Lista
    const margenPLContado = precioListaContado > 0 ? ((precioListaContado - costo) / precioListaContado * 100) : 0;
    $fila.find("td:eq(45)").text(margenPLContado.toFixed(2) + "%");

    const margenPLCredito = precioListaCredito > 0 ? ((precioListaCredito - costo) / precioListaCredito * 100) : 0;
    $fila.find("td:eq(46)").text(margenPLCredito.toFixed(2) + "%");

    // Márgenes Promoción
    // Fórmula pedida: (Precio Promo + Aporte Prov + Aporte Rebate - Costo - Otros) / (Precio Promo + Aporte Prov + Aporte Rebate)
    const calcMargenPromo = (precioPromocion) => {
        const denominador = precioPromocion + aporteProveedor + aporteRebate;
        if (denominador > 0) {
            return ((precioPromocion + aporteProveedor + aporteRebate - costo - otrosCostos) / denominador) * 100;
        }
        return 0;
    };

    $fila.find("td:eq(47)").text(calcMargenPromo(precioContado).toFixed(2) + "%");
    $fila.find("td:eq(48)").text(calcMargenPromo(precioTC).toFixed(2) + "%");
    $fila.find("td:eq(49)").text(calcMargenPromo(precioCredito).toFixed(2) + "%");
    $fila.find("td:eq(50)").text(calcMargenPromo(precioIgualar).toFixed(2) + "%");

    // Compensaciones (Comp. Proveedor = Aporte * Unidades Límite)
    $fila.find("td:eq(51)").text(formatCurrencySpanish(aporteProveedor * unidadesLimite));
    $fila.find("td:eq(52)").text(formatCurrencySpanish(aporteProveedor2 * unidadesLimite));
    $fila.find("td:eq(53)").text(formatCurrencySpanish(aporteRebate * unidadesLimite));
    $fila.find("td:eq(54)").text(formatCurrencySpanish(aportePropio * unidadesLimite));
    $fila.find("td:eq(55)").text(formatCurrencySpanish(aportePropio2 * unidadesLimite));

    // Colores
    $fila.find("td:eq(31), td:eq(32), td:eq(33), td:eq(34), td:eq(45), td:eq(46), td:eq(47), td:eq(48), td:eq(49), td:eq(50)").each(function () {
        const textVal = $(this).text().replace('%', '');
        const valor = parseFloat(textVal);
        if (valor < 0) $(this).css("color", "#dc3545");
        else if (valor > 0) $(this).css("color", "#198754");
        else $(this).css("color", "#212529");
    });
}

function consultarAcuerdosPorArticulo(etiquetaTipoFondo, codigoItem, idAcuerdoActual) {
    if (dtAcuerdosArticulo) { dtAcuerdosArticulo.clear().destroy(); $("#tablaAcuerdosArticulo tbody").empty(); }
    $("#tablaAcuerdosArticulo tbody").html('<tr><td colspan="16" class="text-center">Cargando...</td></tr>');

    const payload = { code_app: "APP20260128155212346", http_method: "GET", endpoint_path: "api/Promocion/acuerdos-promocion-articulos", client: "APL", endpoint_query_params: `/${etiquetaTipoFondo}/${codigoItem}` };

    $.ajax({
        url: "/api/apigee-router-proxy", method: "POST", contentType: "application/json", data: JSON.stringify(payload),
        success: function (res) {
            const data = res.json_response || [];
            const $tbody = $("#tablaAcuerdosArticulo tbody");
            $tbody.empty();

            if (!data.length) { $tbody.html('<tr><td colspan="16" class="text-center">No hay acuerdos disponibles.</td></tr>'); return; }

            const fmtDate = (s) => s ? new Date(s).toLocaleDateString("es-EC") : "";
            data.forEach(x => {
                const isChecked = (String(x.idacuerdo) === String(idAcuerdoActual)) ? 'checked' : '';
                $tbody.append(`<tr class="text-nowrap">
                    <td class="text-center align-middle"><input class="form-check-input acuerdo-art-radio" type="radio" name="acuerdoArticuloSel" data-idacuerdo="${x.idacuerdo || ''}" data-descripcion="${x.descripcion || ''}" data-proveedor="${x.nombre_proveedor || ''}" data-disponible="${x.valor_disponible || 0}" data-aporte="${x.valor_aporte_por_items || 0}" data-unidades="${x.unidades_limite || 0}" data-valoracuerdo="${x.valor_acuerdo || 0}" data-estado="${x.estado || ''}" ${isChecked}></td>
                    <td>${x.idacuerdo}</td><td>${x.descripcion}</td><td>${x.idfondo}</td><td>${x.nombre_proveedor}</td>
                    <td>${x.nombre_tipo_fondo}</td><td>${x.clase_acuerdo || ''}</td>
                    <td class="text-end">${formatCurrencySpanish(x.valor_acuerdo)}</td><td>${fmtDate(x.fecha_inicio)}</td><td>${fmtDate(x.fecha_fin)}</td>
                    <td class="text-end">${formatCurrencySpanish(x.valor_disponible)}</td><td class="text-end">${formatCurrencySpanish(x.valor_comprometido)}</td>
                    <td class="text-end">${formatCurrencySpanish(x.valor_liquidado)}</td><td class="text-end">${formatCurrencySpanish(x.valor_aporte_por_items)}</td>
                    <td class="text-end">${x.unidades_limite}</td><td>${x.estado}</td></tr>`);
            });

            dtAcuerdosArticulo = $("#tablaAcuerdosArticulo").DataTable({ destroy: true, deferRender: true, pageLength: 10, lengthChange: false, dom: '<"row"<"col-12"tr>><"row"<"col-12 text-center"i>><"row"<"col-12 d-flex justify-content-center"p>>', language: { zeroRecords: "No se encontraron acuerdos.", info: "Mostrando _START_ a _END_ de _TOTAL_ acuerdos", infoEmpty: "Sin acuerdos", paginate: { first: "«", last: "»", next: "›", previous: "‹" } } });

            const $preSelected = $tbody.find("input[name='acuerdoArticuloSel']:checked");
            if ($preSelected.length > 0) {
                $preSelected.closest("tr").addClass("table-active");
                const d = $preSelected.data();
                acuerdoArticuloTemporal = { idAcuerdo: d.idacuerdo, descripcion: d.descripcion, proveedor: d.proveedor, disponible: d.disponible, aporte: d.aporte, unidades: d.unidades, valorAcuerdo: d.valoracuerdo, display: `${d.idacuerdo} - ${d.proveedor}` };
            }

            $("#buscarAcuerdoArticuloInput").off("keyup").on("keyup", function () { dtAcuerdosArticulo.search($(this).val()).draw(); });
            $tbody.off("change", ".acuerdo-art-radio").on("change", ".acuerdo-art-radio", function () {
                $tbody.find("tr").removeClass("table-active");
                $(this).closest("tr").addClass("table-active");
                const d = $(this).data();
                acuerdoArticuloTemporal = { idAcuerdo: d.idacuerdo, descripcion: d.descripcion, proveedor: d.proveedor, disponible: d.disponible, aporte: d.aporte, unidades: d.unidades, valorAcuerdo: d.valoracuerdo, display: `${d.idacuerdo} - ${d.proveedor}` };
            });
        }
    });
}

function abrirModalAcuerdoArticulo(tipoFondo, tituloModal, codigoItem, $inputDisplay, $inputId, slot, $fila) {
    acuerdoArticuloTemporal = null;
    acuerdoArticuloContexto = { tipoFondo, codigoItem, $inputDisplay, $inputId, idActual: $inputId.val(), slot, $fila };
    $("#tituloModalAcuerdoArticulo").text(tituloModal);
    $("#buscarAcuerdoArticuloInput").val("");
    $("#modalAcuerdoArticulo").modal("show");
    consultarAcuerdosPorArticulo(tipoFondo, codigoItem, $inputId.val());
}

// ===============================================================
// CONSULTA DE ITEMS (MODAL)
// ===============================================================
function cargarFiltrosItemsPromocion() {
    const data = window._filtrosJerarquiaData || {};
    const llenarFiltro = (containerId, items, label) => {
        const $container = $(`#${containerId}`);
        $container.empty();
        if (Array.isArray(items) && items.length > 0) {
            items.forEach(item => {
                $container.append(`<div class="form-check"><input class="form-check-input filtro-item-checkbox" type="checkbox" id="${containerId}_${item.codigo}" value="${item.nombre}"><label class="form-check-label" for="${containerId}_${item.codigo}">${item.nombre}</label></div>`);
            });
        } else {
            $container.html(`<small class="text-muted">No hay ${label}</small>`);
        }
    };
    llenarFiltro("filtroMarcaModal", data.marcas, "marcas");
    llenarFiltro("filtroDivisionModal", data.divisiones, "divisiones");
    llenarFiltro("filtroDepartamentoModal", data.departamentos, "departamentos");
    llenarFiltro("filtroClaseModal", data.clases, "clases");

    $(".filtro-todas").off("change").on("change", function () {
        const targetId = $(this).data("target");
        $(`#${targetId} .filtro-item-checkbox`).prop("checked", $(this).is(":checked"));
    });
}

function consultarItemsPromocion(filtros) {
    if (dtItemsConsultaPromo) {
        dtItemsConsultaPromo.clear().draw();
        $('.dataTables_empty').text("Cargando resultados...");
    }

    const payload = {
        code_app: "APP20260128155212346",
        http_method: "POST",
        endpoint_path: "api/Acuerdo/consultar-articulos",
        client: "APL",
        body_request: filtros
    };

    $.ajax({
        url: "/api/apigee-router-proxy",
        method: "POST",
        contentType: "application/json",
        data: JSON.stringify(payload),
        success: function (res) {
            const data = res.json_response || [];

            const filas = data.map(item => {
                return [
                    `<input type="checkbox" class="form-check-input item-checkbox"
                        data-codigo="${item.codigo || item.iditem || ''}"
                        data-descripcion="${item.descripcion || item.nombre || ''}"
                        data-costo="${item.costo || 0}"
                        data-stock="${item.stock || 0}"
                        data-optimo="${item.optimo || 0}"
                        data-excedenteu="${item.excedente_u || 0}"
                        data-excedentes="${item.excedente_s || item.excedente_d || 0}"
                        data-m0u="${item.m0_u || 0}"
                        data-m0s="${item.m0_s || item.m0_d || 0}"
                        data-m1u="${item.m1_u || 0}"
                        data-m1s="${item.m1_s || item.m1_d || 0}"
                        data-m2u="${item.m2_u || 0}"
                        data-m2s="${item.m2_s || item.m2_d || 0}"
                        data-m12u="${item.m12_u || 0}"
                        data-m12s="${item.m12_s || item.m12_d || 0}"
                        data-margenmincontado="${item.margen_min_contado || 0}"
                        data-margenmintc="${item.margen_min_tarjeta_credito || 0}"
                        data-margenmincredito="${item.margen_min_precio_credito || 0}"
                        data-margenminigualar="${item.margen_min_igualar || 0}"
                        data-preciolistacontado="${item.precio_lista_contado || 0}"
                        data-preciolistacredito="${item.precio_lista_credito || 0}">`,
                    item.codigo || item.iditem || "",
                    item.descripcion || item.nombre || "",
                    formatCurrencySpanish(item.costo || 0),
                    item.stock || 0,
                    item.optimo || 0,
                    item.excedente_u || 0,
                    formatCurrencySpanish(item.excedente_s || item.excedente_d || 0),
                    item.m0_u || 0,
                    formatCurrencySpanish(item.m0_s || item.m0_d || 0),
                    item.m1_u || 0,
                    formatCurrencySpanish(item.m1_s || item.m1_d || 0),
                    item.m2_u || 0,
                    formatCurrencySpanish(item.m2_s || item.m2_d || 0),
                    item.m12_u || 0,
                    formatCurrencySpanish(item.m12_s || item.m12_d || 0)
                ];
            });

            if (dtItemsConsultaPromo) {
                dtItemsConsultaPromo.clear();
                dtItemsConsultaPromo.rows.add(filas);
                dtItemsConsultaPromo.draw();
            }

            $("#buscarItemModal").off("keyup").on("keyup", function () {
                if (dtItemsConsultaPromo) {
                    dtItemsConsultaPromo.search($(this).val()).draw();
                }
            });
        },
        error: function () {
            if (dtItemsConsultaPromo) {
                dtItemsConsultaPromo.clear().draw();
                $('.dataTables_empty').html('<span class="text-danger">Error al cargar items.</span>');
            }
        }
    });
}

function obtenerCodigoArticuloSeleccionado() {
    const $radio = $("#tablaArticulosBody .item-row-radio:checked");
    if ($radio.length === 0) { Swal.fire({ icon: "warning", title: "Atención", text: "Debe seleccionar un artículo." }); return null; }
    return $radio.closest("tr").data("codigo");
}

function consultarServicioAdicional(endpoint_path, codigoArticulo, callbackExito) {
    Swal.fire({ title: 'Consultando...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
    const payload = { code_app: "APP20260128155212346", http_method: "GET", endpoint_path: endpoint_path, client: "APL", endpoint_query_params: "/" + codigoArticulo };
    $.ajax({
        url: "/api/apigee-router-proxy", method: "POST", contentType: "application/json", data: JSON.stringify(payload),
        success: function (res) { Swal.close(); callbackExito(res.json_response || []); },
        error: function () { Swal.fire("Error", "No se pudo obtener la información.", "error"); }
    });
}


// ===============================================================
// LÓGICA DE COMBOS - MODIFICAR
// ===============================================================

function poblarCombosDesdeAPI(data) {
    const articulos = data.articulos || [];
    const articulossegmento = data.articulossegmento || [];
    const articulossegmentodetalle = data.articulossegmentodetalle || [];
    const articuloscomponentes = data.articuloscomponentes || [];
    const articuloscompacuerdo = data.articuloscompacuerdo || [];
    const articuloscompotroscostos = data.articuloscompotroscostos || [];

    const $tbody = $("#tablaCombosBodyMod");
    $tbody.empty();
    articulosPorComboMemoria = {};
    combosBDOriginal = [];

    // 1. Construir mapa de combos (cada artículo es un combo)
    const combosMap = {};
    articulos.forEach(art => {
        const idCombo = art.idpromocionarticulo;
        combosMap[idCombo] = {
            idpromocionarticulo: idCombo,
            codigocombo: art.codigo_combo || "",
            descripcion: art.descripcion_combo || "",
            costo: art.costo_combo || 0,
            stockbodega: art.stockbodega || 0,
            stocktienda: art.stocktienda || 0,
            inventariooptimo: art.inventariooptimo || 0,
            excedenteunidad: art.excedenteunidad || 0,
            excedentevalor: art.excedentevalor || 0,
            unidadeslimite: art.combo_unidades_limite || 0,
            unidadesproyeccionventas: art.combo_unidades_proyeccion || 0,
            preciolistacontado: art.combo_precio_lista_contado || 0,
            preciolistacredito: art.combo_precio_lista_credito || 0,
            preciopromocioncontado: art.combo_precio_promo_contado || 0,
            preciopromociontarjetacredito: art.combo_precio_promo_tc || 0,
            preciopromocioncredito: art.combo_precio_promo_credito || 0,
            descuentopromocioncontado: art.combo_desc_promo_contado || 0,
            descuentopromociontarjetacredito: art.combo_desc_promo_tc || 0,
            descuentopromocioncredito: art.combo_desc_promo_credito || 0,
            margenpromocioncontado: art.combo_margen_promo_contado || 0,
            margenpromociontarjetacredito: art.combo_margen_promo_tc || 0,
            margenpromocioncredito: art.combo_margen_promo_credito || 0,
            marcaregalo: (art.combo_marca_regalo || "N").toString().trim().toUpperCase() === "S",
            componentes: []
        };
        combosBDOriginal.push(idCombo);
    });

    // 2. Asociar componentes a cada combo
    articuloscomponentes.forEach(comp => {
        const idCombo = comp.idpromocionarticulo;
        if (!combosMap[idCombo]) return;

        // Buscar acuerdos de este componente
        const idCompUnico = comp.idpromocionarticulocomponente;
        const acuerdosComp = articuloscompacuerdo.filter(a => a.idpromocionarticulocomponente === idCompUnico);
        const acProv = acuerdosComp.find(a => (a.etiqueta_tipo_fondo || "").toUpperCase() === "TFPROVEDOR");
        const acProv2 = acuerdosComp.filter(a => (a.etiqueta_tipo_fondo || "").toUpperCase() === "TFPROVEDOR")[1];
        const acRebate = acuerdosComp.find(a => (a.etiqueta_tipo_fondo || "").toUpperCase() === "TFREBATE");
        const acProp = acuerdosComp.find(a => (a.etiqueta_tipo_fondo || "").toUpperCase() === "TFPROPIO");
        const acProp2 = acuerdosComp.filter(a => (a.etiqueta_tipo_fondo || "").toUpperCase() === "TFPROPIO")[1];

        // Buscar otros costos de este componente
        const otrosCostosComp = articuloscompotroscostos
            .filter(o => o.idpromocionarticulocomponente === idCompUnico)
            .map(oc => ({
                codigo: oc.codigoparametro,
                nombre: oc.descripcion_parametro,
                valor: parseFloat(oc.costo) || 0
            }));
        const totalOtrosCostosComp = otrosCostosComp.reduce((s, c) => s + c.valor, 0);

        combosMap[idCombo].componentes.push({
            codigo: comp.componente_codigoitem,
            descripcion: comp.componente_descripcion,
            costo: comp.componente_costo || 0,
            stock: comp.componente_stock_bodega || 0,
            stockTienda: comp.componente_stock_tienda || 0,
            optimo: comp.componente_inventario_optimo || 0,
            excedenteu: comp.componente_excedente_unidad || 0,
            excedentes: comp.componente_excedente_valor || 0,
            m0u: comp.componente_m0_unidades || 0, m0s: comp.componente_m0_precio || 0,
            m1u: comp.componente_m1_unidades || 0, m1s: comp.componente_m1_precio || 0,
            m2u: comp.componente_m2_unidades || 0, m2s: comp.componente_m2_precio || 0,
            m12u: comp.componente_m12_unidades || 0, m12s: comp.componente_m12_precio || 0,
            preciolistacontado: comp.componente_precio_lista_contado || 0,
            preciolistacredito: comp.componente_precio_lista_credito || 0,
            promoContado: comp.componente_precio_promo_contado || 0,
            promoTC: comp.componente_precio_promo_tc || 0,
            promoCredito: comp.componente_precio_promo_credito || 0,
            dsctoContado: comp.componente_desc_promo_contado || 0,
            dsctoTC: comp.componente_desc_promo_tc || 0,
            dsctoCredito: comp.componente_desc_promo_credito || 0,
            margenPLContado: comp.componente_margen_pl_contado || 0,
            margenPLCredito: comp.componente_margen_pl_credito || 0,
            margenPromoContado: comp.componente_margen_promo_contado || 0,
            margenPromoTC: comp.componente_margen_promo_tc || 0,
            margenPromoCredito: comp.componente_margen_promo_credito || 0,
            // Acuerdos del componente
            idAcuerdoProveedor: acProv ? acProv.idacuerdo : 0,
            displayAcuerdoProveedor: acProv ? `${acProv.idacuerdo} - ${acProv.nombre_proveedor || ""}` : "",
            aporteProveedor: acProv ? (acProv.valor_aporte || 0) : 0,
            idAcuerdoProveedor2: acProv2 ? acProv2.idacuerdo : 0,
            displayAcuerdoProveedor2: acProv2 ? `${acProv2.idacuerdo} - ${acProv2.nombre_proveedor || ""}` : "",
            aporteProveedor2: acProv2 ? (acProv2.valor_aporte || 0) : 0,
            idAcuerdoRebate: acRebate ? acRebate.idacuerdo : 0,
            displayAcuerdoRebate: acRebate ? `${acRebate.idacuerdo} - ${acRebate.nombre_proveedor || ""}` : "",
            aporteRebate: acRebate ? (acRebate.valor_aporte || 0) : 0,
            idAcuerdoPropio: acProp ? acProp.idacuerdo : 0,
            displayAcuerdoPropio: acProp ? `${acProp.idacuerdo} - ${acProp.nombre_proveedor || ""}` : "",
            aportePropio: acProp ? (acProp.valor_aporte || 0) : 0,
            idAcuerdoPropio2: acProp2 ? acProp2.idacuerdo : 0,
            displayAcuerdoPropio2: acProp2 ? `${acProp2.idacuerdo} - ${acProp2.nombre_proveedor || ""}` : "",
            aportePropio2: acProp2 ? (acProp2.valor_aporte || 0) : 0,
            // Otros costos
            otrosCostos: otrosCostosComp,
            totalOtrosCostos: totalOtrosCostosComp,
            mediosPago: []
        });
    });

    // 3. Renderizar cada combo en la tabla
    Object.values(combosMap).forEach(combo => {
        const codigoCombo = combo.codigocombo;
        articulosPorComboMemoria[codigoCombo] = combo.componentes;

        // Medios de Pago para este combo (vienen en articulossegmento + articulossegmentodetalle)
        const segmentoMP = articulossegmento.find(s =>
            s.idpromocionarticulo === combo.idpromocionarticulo &&
            (s.etiqueta_tipo_segmento || "").toUpperCase() === "SEGMEDIOPAGO"
        );

        let medioPagoVal = "";
        let mpSeleccionados = [];
        let btnMPHtml = `<button class="btn btn-outline-secondary btn-sm d-none btn-editar-mp-combo-mod" type="button" disabled><i class="fa-solid fa-list-check"></i></button>`;

        if (segmentoMP) {
            const tipoAsig = (segmentoMP.tipoasignacion || "").toUpperCase();
            if (tipoAsig !== "T") {
                const detallesMP = articulossegmentodetalle.filter(d =>
                    d.idpromocionarticulosegmento === segmentoMP.idpromocionarticulosegmento
                );
                mpSeleccionados = detallesMP.map(d => d.codigo_medio_pago).filter(c => c);
                if (mpSeleccionados.length > 1) {
                    medioPagoVal = "7";
                    btnMPHtml = `<button class="btn btn-success btn-sm btn-editar-mp-combo-mod" type="button" disabled><i class="fa-solid fa-list-check"></i> (${mpSeleccionados.length})</button>`;
                } else if (mpSeleccionados.length === 1) {
                    medioPagoVal = mpSeleccionados[0];
                }
            }
        }

        const filaCombo = `
            <tr data-codigo="${codigoCombo}" data-idpromocionarticulo="${combo.idpromocionarticulo}" data-accion="U" class="align-middle">
                <td class="text-center align-middle"><input type="radio" class="form-check-input combo-row-radio-mod" name="comboRadioSelMod"></td>
                <td class="table-sticky-col" style="background-color: #f8f9fa;">
                    <span class="text-nowrap"><span class="fw-bold">${codigoCombo}</span> - ${combo.descripcion}</span>
                </td>
                <td class="text-end">${formatCurrencySpanish(combo.costo)}</td>
                <td class="text-end">${combo.stockbodega}</td>
                <td class="text-end">${combo.stocktienda}</td>
                <td class="text-end">${combo.inventariooptimo}</td>
                <td class="text-end">${combo.excedenteunidad}</td>
                <td class="text-end">${formatCurrencySpanish(combo.excedentevalor)}</td>
                <td><input type="number" class="form-control form-control-sm text-end val-unidades-combo-mod" placeholder="0" value="${combo.unidadeslimite}" disabled></td>
                <td><input type="number" class="form-control form-control-sm text-end val-proyeccion-combo-mod" placeholder="0" value="${combo.unidadesproyeccionventas}" disabled></td>
                <td>
                    <div class="input-group input-group-sm" style="min-width:140px;">
                        ${btnMPHtml}
                        <select class="form-select select-mediopago-combo-final-mod" disabled>
                            ${generarOpcionesMedioPago()}
                        </select>
                    </div>
                </td>
                <td class="text-end">${formatCurrencySpanish(combo.preciolistacontado)}</td>
                <td class="text-end">${formatCurrencySpanish(combo.preciolistacredito)}</td>
                <td class="text-end">${formatCurrencySpanish(combo.preciopromocioncontado)}</td>
                <td class="text-end">${formatCurrencySpanish(combo.preciopromociontarjetacredito)}</td>
                <td class="text-end">${formatCurrencySpanish(combo.preciopromocioncredito)}</td>
                <td class="text-end">${formatCurrencySpanish(combo.descuentopromocioncontado)}</td>
                <td class="text-end">${formatCurrencySpanish(combo.descuentopromociontarjetacredito)}</td>
                <td class="text-end">${formatCurrencySpanish(combo.descuentopromocioncredito)}</td>
                <td class="text-end">${parseFloat(combo.margenpromocioncontado).toFixed(2)}%</td>
                <td class="text-end">${parseFloat(combo.margenpromociontarjetacredito).toFixed(2)}%</td>
                <td class="text-end">${parseFloat(combo.margenpromocioncredito).toFixed(2)}%</td>
                <td class="text-end">${formatCurrencySpanish(0)}</td>
                <td class="text-end">${formatCurrencySpanish(0)}</td>
                <td class="text-end">${formatCurrencySpanish(0)}</td>
                <td class="text-center"><input class="form-check-input" type="checkbox" disabled ${combo.marcaregalo ? "checked" : ""}></td>
            </tr>`;
        $tbody.append(filaCombo);

        const $filaInsertada = $tbody.find(`tr[data-codigo="${codigoCombo}"]`).last();
        $filaInsertada.data("combo-nombre", combo.descripcion);
        $filaInsertada.data("combo-articulos", combo.componentes);

        const $filaSelect = $filaInsertada.find(".select-mediopago-combo-final-mod");
        $filaSelect.val(medioPagoVal);
        if (medioPagoVal === "7") $filaSelect.data("seleccionados", mpSeleccionados);
    });

    if ($tbody.find("tr").length > 0) {
        $tbody.find("tr").first().find(".combo-row-radio-mod").prop("checked", true).trigger("change");
    }
}

function limpiarModalComboMod() {
    const numCols = $("#trHeadersCombo th").length;
    for (let i = numCols - 1; i >= 2; i--) {
        $("#trHeadersCombo th:eq(" + i + ")").remove();
        $("#tablaCreacionCombo tbody tr").each(function () {
            $(this).find("td:eq(" + i + ")").remove();
        });
    }

    $("#nombreComboModalMod").val("");
    $("#btnHeaderComboTotalMod").text("Combo");

    $("#tablaCreacionCombo tbody tr").each(function () {
        const $td = $(this).find("td:eq(1)");
        const $input = $td.find("input");
        const $select = $td.find("select");
        const $btn = $td.find("button");

        if ($input.length > 0) {
            if ($input.attr("type") === "checkbox") {
                $input.prop("checked", false);
            } else {
                const placeholder = $input.attr("placeholder") || "";
                if ($input.prop("readonly")) {
                    if (placeholder.includes("$") || placeholder === "") {
                        $input.val("$ 0.00");
                    } else {
                        $input.val($input.hasClass("custom-celda-bg") ? "-" : "0%");
                    }
                } else {
                    $input.val("");
                }
            }
        }
        if ($select.length > 0) {
            $select.val("").removeData("seleccionados");
        }
        if ($btn.length > 0) {
            $btn.addClass("d-none").removeClass("btn-success").addClass("btn-outline-secondary").html(`<i class="fa-solid fa-list-check"></i>`);
        }
    });

    comboEnEdicion = null;
}

function recalcularColumnaComboMod(colIndex) {
    if (colIndex < 2) return;

    const getColVal = (campo, selector) => {
        const text = $(`#tablaCreacionCombo tbody tr[data-campo='${campo}'] td[data-colindex='${colIndex}'] ${selector}`).val() ||
            $(`#tablaCreacionCombo tbody tr[data-campo='${campo}'] td[data-colindex='${colIndex}'] ${selector}`).text();
        return parseCurrencyToNumber(text);
    };
    const setColVal = (campo, selector, val) => {
        $(`#tablaCreacionCombo tbody tr[data-campo='${campo}'] td[data-colindex='${colIndex}'] ${selector}`).val(val);
    };

    const costo = getColVal("costo", "input");
    const precioListaContado = getColVal("precio_lista_contado", "input");
    const precioListaCredito = getColVal("precio_lista_credito", "input");
    const otrosCostos = parseFloat($(`#trHeadersCombo th:eq(${colIndex})`).data("total-otros-costos")) || 0;

    const getComboVal = (campo) => parseCurrencyToNumber($(`#tablaCreacionCombo tbody tr[data-campo='${campo}'] td:eq(1) input`).val());
    const unidadesLimite = getComboVal("unidades_limite");
    const proyeccionVtas = getComboVal("proyeccion_vta");
    const unidades = unidadesLimite > 0 ? unidadesLimite : proyeccionVtas;

    const promoContado = getColVal("promo_contado", "input");
    const promoTC = getColVal("promo_tc", "input");
    const promoCredito = getColVal("promo_credito", "input");

    setColVal("dscto_contado", "input", formatCurrencySpanish(precioListaContado - promoContado));
    setColVal("dscto_tc", "input", formatCurrencySpanish(precioListaContado - promoTC));
    setColVal("dscto_credito", "input", formatCurrencySpanish(precioListaCredito - promoCredito));

    const apProv = getColVal("aporte_prov", "input");
    const apProv2 = getColVal("aporte_prov2", "input");
    const apRebate = getColVal("aporte_rebate", "input");
    const apPropio = getColVal("aporte_propio", "input");
    const apPropio2 = getColVal("aporte_propio2", "input");

    setColVal("comp_proveedor", "input", formatCurrencySpanish(apProv * unidades));
    setColVal("comp_proveedor2", "input", formatCurrencySpanish(apProv2 * unidades));
    setColVal("comp_rebate", "input", formatCurrencySpanish(apRebate * unidades));
    setColVal("comp_propio", "input", formatCurrencySpanish(apPropio * unidades));
    setColVal("comp_propio2", "input", formatCurrencySpanish(apPropio2 * unidades));

    const calcMargenPL = (precioLista) => {
        if (precioLista > 0) return (((precioLista - costo) / precioLista) * 100).toFixed(2) + "%";
        return "0.00%";
    };
    const calcMargenPromo = (precioPromo) => {
        const denominador = precioPromo + apProv + apRebate;
        if (denominador > 0) return (((denominador - costo - otrosCostos) / denominador) * 100).toFixed(2) + "%";
        return "0.00%";
    };

    setColVal("margen_pl_contado", "input", calcMargenPL(precioListaContado));
    setColVal("margen_pl_credito", "input", calcMargenPL(precioListaCredito));
    setColVal("margen_promo_contado", "input", calcMargenPromo(promoContado));
    setColVal("margen_promo_tc", "input", calcMargenPromo(promoTC));
    setColVal("margen_promo_cred", "input", calcMargenPromo(promoCredito));
}

function recalcularTotalesComboMod() {
    const camposNum = ["stock_bodega", "stock_tienda", "inv_optimo", "excedentes_u"];
    const camposMoneda = [
        "costo", "excedentes_usd",
        "precio_lista_contado", "precio_lista_credito",
        "promo_contado", "promo_tc", "promo_credito",
        "dscto_contado", "dscto_tc", "dscto_credito",
        "aporte_prov", "aporte_prov2", "aporte_rebate", "aporte_propio", "aporte_propio2"
    ];

    const setComboVal = (campo, val) => $(`#tablaCreacionCombo tbody tr[data-campo='${campo}'] td:eq(1) input`).val(val);
    const getComboVal = (campo) => parseCurrencyToNumber($(`#tablaCreacionCombo tbody tr[data-campo='${campo}'] td:eq(1) input`).val());

    camposNum.forEach(campo => {
        let suma = 0;
        $(`#tablaCreacionCombo tbody tr[data-campo='${campo}'] td:gt(1) input`).each(function () {
            suma += parseInt($(this).val().replace(/[^0-9-]/g, '')) || 0;
        });
        setComboVal(campo, suma);
    });

    camposMoneda.forEach(campo => {
        let suma = 0;
        $(`#tablaCreacionCombo tbody tr[data-campo='${campo}'] td:gt(1) input`).each(function () {
            suma += parseCurrencyToNumber($(this).val());
        });
        setComboVal(campo, formatCurrencySpanish(suma));
    });

    const camposComprometidos = ["comp_proveedor", "comp_proveedor2", "comp_rebate", "comp_propio", "comp_propio2"];
    camposComprometidos.forEach(campo => setComboVal(campo, ""));

    const totalCosto = getComboVal("costo");
    let totalOtrosCostos = 0;
    $("#trHeadersCombo th:gt(1)").each(function () {
        totalOtrosCostos += parseFloat($(this).data("total-otros-costos")) || 0;
    });

    const totalPLContado = getComboVal("precio_lista_contado");
    const totalPLCredito = getComboVal("precio_lista_credito");
    const totalPromoContado = getComboVal("promo_contado");
    const totalPromoTC = getComboVal("promo_tc");
    const totalPromoCredito = getComboVal("promo_credito");
    const totalApProv = getComboVal("aporte_prov");
    const totalApRebate = getComboVal("aporte_rebate");

    const calcMargenPLCombo = (precioLista) => {
        if (precioLista > 0) return (((precioLista - totalCosto) / precioLista) * 100).toFixed(2) + "%";
        return "0.00%";
    };
    const calcMargenPromoCombo = (precioPromo) => {
        const denominador = precioPromo + totalApProv + totalApRebate;
        if (denominador > 0) return (((denominador - totalCosto - totalOtrosCostos) / denominador) * 100).toFixed(2) + "%";
        return "0.00%";
    };

    setComboVal("margen_pl_contado", calcMargenPLCombo(totalPLContado));
    setComboVal("margen_pl_credito", calcMargenPLCombo(totalPLCredito));
    setComboVal("margen_promo_contado", calcMargenPromoCombo(totalPromoContado));
    setComboVal("margen_promo_tc", calcMargenPromoCombo(totalPromoTC));
    setComboVal("margen_promo_cred", calcMargenPromoCombo(totalPromoCredito));
}

function agregarColumnaAComboMod(item) {
    const formatVal = (val) => (val !== undefined && val !== null && val !== '') ? formatCurrencySpanish(val) : '';

    const thHtml = `
        <th class="table-dark">
            <div class="dropdown">
                <button class="btn btn-dark dropdown-toggle btn-sm border-0 w-100 header-combo-btn" type="button" data-bs-toggle="dropdown" title="${item.codigo} - ${item.descripcion}">
                    <span class="header-combo-content">
                        <span class="header-combo-codigo">${item.codigo}</span>
                        <span class="header-combo-desc">${item.descripcion}</span>
                    </span>
                </button>
                <ul class="dropdown-menu">
                    <li><a class="dropdown-item btn-add-articulo-combo-mod" href="#" data-bs-toggle="modal" data-bs-target="#modalConsultaItems"><i class="fa-solid fa-plus"></i> Añadir Artículo</a></li>
                    <li><hr class="dropdown-divider"></li>
                    <li><a class="dropdown-item text-danger btn-eliminar-col-combo-mod" href="#"><i class="fa-solid fa-trash"></i> Eliminar Artículo</a></li>
                </ul>
            </div>
        </th>`;
    $("#trHeadersCombo").append(thHtml);

    const colIndex = $("#trHeadersCombo th").length - 1;

    $("#tablaCreacionCombo tbody tr").each(function () {
        const campo = $(this).data("campo");
        let html = `<td class="align-middle" data-colindex="${colIndex}">`;

        switch (campo) {
            case "art_codigo":
                html += `<input type="hidden" class="art-codigo-hidden" value="${item.codigo}"><input type="text" class="form-control form-control-sm custom-celda-bg text-end" readonly value="${item.codigo}">`; break;
            case "art_descripcion":
                html += `<input type="text" class="form-control form-control-sm custom-celda-bg" readonly value="${item.descripcion}">`; break;
            case "costo":
                html += `<input type="text" class="form-control form-control-sm custom-celda-bg text-end" readonly value="${formatCurrencySpanish(item.costo)}">`; break;
            case "stock_bodega":
                html += `<input type="text" class="form-control form-control-sm custom-celda-bg text-end" readonly value="${item.stock || 0}">`; break;
            case "stock_tienda":
                html += `<input type="text" class="form-control form-control-sm custom-celda-bg text-end" readonly value="${item.stockTienda || 0}">`; break;
            case "inv_optimo":
                html += `<input type="text" class="form-control form-control-sm custom-celda-bg text-end" readonly value="${item.optimo || 0}">`; break;
            case "excedentes_u":
                html += `<input type="text" class="form-control form-control-sm custom-celda-bg text-end" readonly value="${item.excedenteu || 0}">`; break;
            case "excedentes_usd":
                html += `<input type="text" class="form-control form-control-sm custom-celda-bg text-end" readonly value="${formatCurrencySpanish(item.excedentes || 0)}">`; break;
            case "unidades_limite":
            case "proyeccion_vta":
                html += `<input type="text" class="form-control form-control-sm text-end custom-celda-bg" disabled placeholder="-">`; break;
            case "medio_pago":
                html += `<select class="form-select form-select-sm custom-celda-bg" disabled><option value="">-</option></select>`; break;
            case "regalo":
                html += `<div class="d-flex justify-content-center text-muted">-</div>`; break;
            case "precio_lista_contado":
                html += `<input type="text" class="form-control form-control-sm custom-celda-bg text-end" readonly value="${formatCurrencySpanish(item.preciolistacontado || 0)}">`; break;
            case "precio_lista_credito":
                html += `<input type="text" class="form-control form-control-sm custom-celda-bg text-end" readonly value="${formatCurrencySpanish(item.preciolistacredito || 0)}">`; break;
            case "promo_contado":
                html += `<input type="text" class="form-control form-control-sm text-end input-combo-art-mod" placeholder="$ 0.00" value="${formatVal(item.promoContado)}">`; break;
            case "promo_tc":
                html += `<input type="text" class="form-control form-control-sm text-end input-combo-art-mod" placeholder="$ 0.00" value="${formatVal(item.promoTC)}">`; break;
            case "promo_credito":
                html += `<input type="text" class="form-control form-control-sm text-end input-combo-art-mod" placeholder="$ 0.00" value="${formatVal(item.promoCredito)}">`; break;
            case "dscto_contado":
            case "dscto_tc":
            case "dscto_credito":
                html += `<input type="text" class="form-control form-control-sm custom-celda-bg text-end" readonly placeholder="0.00">`; break;
            case "aporte_prov":
                html += `<input type="text" class="form-control form-control-sm text-end input-combo-art-mod aporte-valor aporte-proveedor-combo-mod" placeholder="$ 0.00" value="${formatVal(item.aporteProveedor)}" ${item.idAcuerdoProveedor ? '' : 'disabled'}>`; break;
            case "aporte_prov2":
                html += `<input type="text" class="form-control form-control-sm text-end input-combo-art-mod aporte-valor" placeholder="$ 0.00" value="${formatVal(item.aporteProveedor2)}" ${item.idAcuerdoProveedor2 ? '' : 'disabled'}>`; break;
            case "aporte_rebate":
                html += `<input type="text" class="form-control form-control-sm text-end input-combo-art-mod aporte-valor" placeholder="$ 0.00" value="${formatVal(item.aporteRebate)}" ${item.idAcuerdoRebate ? '' : 'disabled'}>`; break;
            case "aporte_propio":
                html += `<input type="text" class="form-control form-control-sm text-end input-combo-art-mod aporte-valor" placeholder="$ 0.00" value="${formatVal(item.aportePropio)}" ${item.idAcuerdoPropio ? '' : 'disabled'}>`; break;
            case "aporte_propio2":
                html += `<input type="text" class="form-control form-control-sm text-end input-combo-art-mod aporte-valor" placeholder="$ 0.00" value="${formatVal(item.aportePropio2)}" ${item.idAcuerdoPropio2 ? '' : 'disabled'}>`; break;
            case "aporte_prov_id":
                html += `
                    <input type="hidden" class="acuerdo-id-hidden acuerdo-prov1-hidden" value="${item.idAcuerdoProveedor || ''}">
                    <div class="input-group input-group-sm">
                        <input type="text" class="form-control text-end" placeholder="Seleccione..." readonly value="${item.displayAcuerdoProveedor || ''}">
                        <button class="btn btn-outline-secondary btn-buscar-acuerdo-combo-mod" type="button" data-tipofondo="TFPROVEDOR" data-slot="1"><i class="fa-solid fa-magnifying-glass"></i></button>
                    </div>`; break;
            case "aporte_prov2_id":
                html += `
                    <input type="hidden" class="acuerdo-id-hidden acuerdo-prov2-hidden" value="${item.idAcuerdoProveedor2 || ''}">
                    <div class="input-group input-group-sm">
                        <input type="text" class="form-control text-end" placeholder="Seleccione..." readonly value="${item.displayAcuerdoProveedor2 || ''}">
                        <button class="btn btn-outline-secondary btn-buscar-acuerdo-combo-mod" type="button" data-tipofondo="TFPROVEDOR" data-slot="2"><i class="fa-solid fa-magnifying-glass"></i></button>
                    </div>`; break;
            case "aporte_rebate_id":
                html += `
                    <input type="hidden" class="acuerdo-id-hidden acuerdo-rebate-hidden" value="${item.idAcuerdoRebate || ''}">
                    <div class="input-group input-group-sm">
                        <input type="text" class="form-control text-end" placeholder="Seleccione..." readonly value="${item.displayAcuerdoRebate || ''}">
                        <button class="btn btn-outline-secondary btn-buscar-acuerdo-combo-mod" type="button" data-tipofondo="TFREBATE" data-slot="1"><i class="fa-solid fa-magnifying-glass"></i></button>
                    </div>`; break;
            case "aporte_propio_id":
                html += `
                    <input type="hidden" class="acuerdo-id-hidden acuerdo-propio1-hidden" value="${item.idAcuerdoPropio || ''}">
                    <div class="input-group input-group-sm">
                        <input type="text" class="form-control text-end" placeholder="Seleccione..." readonly value="${item.displayAcuerdoPropio || ''}">
                        <button class="btn btn-outline-secondary btn-buscar-acuerdo-combo-mod" type="button" data-tipofondo="TFPROPIO" data-slot="1"><i class="fa-solid fa-magnifying-glass"></i></button>
                    </div>`; break;
            case "aporte_propio2_id":
                html += `
                    <input type="hidden" class="acuerdo-id-hidden acuerdo-propio2-hidden" value="${item.idAcuerdoPropio2 || ''}">
                    <div class="input-group input-group-sm">
                        <input type="text" class="form-control text-end" placeholder="Seleccione..." readonly value="${item.displayAcuerdoPropio2 || ''}">
                        <button class="btn btn-outline-secondary btn-buscar-acuerdo-combo-mod" type="button" data-tipofondo="TFPROPIO" data-slot="2"><i class="fa-solid fa-magnifying-glass"></i></button>
                    </div>`; break;
            case "margen_pl_contado":
            case "margen_pl_credito":
            case "margen_promo_contado":
            case "margen_promo_tc":
            case "margen_promo_cred":
                html += `<input type="text" class="form-control form-control-sm custom-celda-bg text-end" readonly placeholder="0.00%">`; break;
            case "comp_proveedor":
            case "comp_proveedor2":
            case "comp_rebate":
            case "comp_propio":
            case "comp_propio2":
                html += `<input type="text" class="form-control form-control-sm text-end custom-celda-bg" readonly placeholder="$ 0.00">`; break;
            default:
                html += `<input type="text" class="form-control form-control-sm custom-celda-bg text-end" readonly>`; break;
        }
        html += `</td>`;
        $(this).append(html);
    });

    recalcularColumnaComboMod(colIndex);
    recalcularTotalesComboMod();
}

function extraerArticulosDelModalComboMod() {
    const articulos = [];
    const numColumnas = $("#trHeadersCombo th").length;

    for (let colIdx = 2; colIdx < numColumnas; colIdx++) {
        const art = { mediosPago: [], acuerdos: [], otrosCostos: [] };

        $("#tablaCreacionCombo tbody tr").each(function () {
            const campo = $(this).data("campo");
            const $td = $(this).find(`td[data-colindex='${colIdx}']`);
            if ($td.length === 0) return;

            const $input = $td.find("input[type='text'], input[type='number'], input[type='hidden']");
            const $checkbox = $td.find("input[type='checkbox']");

            let val = $input.length > 0 ? $input.val() : $td.text();

            switch (campo) {
                case "art_codigo": art.codigo = val; break;
                case "art_descripcion": art.descripcion = val; break;
                case "costo": art.costo = parseCurrencyToNumber(val); break;
                case "stock_bodega": art.stock = parseInt(val) || 0; break;
                case "stock_tienda": art.stockTienda = parseInt(val) || 0; break;
                case "inv_optimo": art.optimo = parseInt(val) || 0; break;
                case "excedentes_u": art.excedenteu = parseInt(val) || 0; break;
                case "excedentes_usd": art.excedentes = parseCurrencyToNumber(val); break;
                case "precio_lista_contado": art.preciolistacontado = parseCurrencyToNumber(val); break;
                case "precio_lista_credito": art.preciolistacredito = parseCurrencyToNumber(val); break;
                case "promo_contado": art.promoContado = parseCurrencyToNumber(val); break;
                case "promo_tc": art.promoTC = parseCurrencyToNumber(val); break;
                case "promo_credito": art.promoCredito = parseCurrencyToNumber(val); break;
                case "dscto_contado": art.dsctoContado = parseCurrencyToNumber(val); break;
                case "dscto_tc": art.dsctoTC = parseCurrencyToNumber(val); break;
                case "dscto_credito": art.dsctoCredito = parseCurrencyToNumber(val); break;
                case "margen_pl_contado": art.margenPLContado = parseFloat(val) || 0; break;
                case "margen_pl_credito": art.margenPLCredito = parseFloat(val) || 0; break;
                case "margen_promo_contado": art.margenPromoContado = parseFloat(val) || 0; break;
                case "margen_promo_tc": art.margenPromoTC = parseFloat(val) || 0; break;
                case "margen_promo_cred": art.margenPromoCredito = parseFloat(val) || 0; break;
                case "aporte_prov": art.aporteProveedor = parseCurrencyToNumber(val); break;
                case "aporte_prov2": art.aporteProveedor2 = parseCurrencyToNumber(val); break;
                case "aporte_rebate": art.aporteRebate = parseCurrencyToNumber(val); break;
                case "aporte_propio": art.aportePropio = parseCurrencyToNumber(val); break;
                case "aporte_propio2": art.aportePropio2 = parseCurrencyToNumber(val); break;
                case "aporte_prov_id":
                    art.idAcuerdoProveedor = parseInt($td.find(".acuerdo-id-hidden").val()) || 0;
                    art.displayAcuerdoProveedor = $td.find("input[type='text']").val();
                    break;
                case "aporte_prov2_id":
                    art.idAcuerdoProveedor2 = parseInt($td.find(".acuerdo-id-hidden").val()) || 0;
                    art.displayAcuerdoProveedor2 = $td.find("input[type='text']").val();
                    break;
                case "aporte_rebate_id":
                    art.idAcuerdoRebate = parseInt($td.find(".acuerdo-id-hidden").val()) || 0;
                    art.displayAcuerdoRebate = $td.find("input[type='text']").val();
                    break;
                case "aporte_propio_id":
                    art.idAcuerdoPropio = parseInt($td.find(".acuerdo-id-hidden").val()) || 0;
                    art.displayAcuerdoPropio = $td.find("input[type='text']").val();
                    break;
                case "aporte_propio2_id":
                    art.idAcuerdoPropio2 = parseInt($td.find(".acuerdo-id-hidden").val()) || 0;
                    art.displayAcuerdoPropio2 = $td.find("input[type='text']").val();
                    break;
                case "regalo": art.regalo = $checkbox.is(":checked") ? "S" : "N"; break;
            }
        });

        if (art.codigo && art.codigo.trim() !== "" && art.codigo !== "Auto") {
            articulos.push(art);
        }
    }
    return articulos;
}

function initLogicaCombosMod() {
    // BOTÓN NUEVO COMBO
    $("#btnNuevoComboMod").off("click").on("click", function () {
        comboEnEdicion = null;
        limpiarModalComboMod();
    });

    // BOTÓN MODIFICAR COMBO
    $("#btnModificarComboMod").off("click").on("click", function () {
        const $radio = $("#tablaCombosBodyMod .combo-row-radio-mod:checked");
        if ($radio.length === 0) {
            Swal.fire({ icon: "warning", title: "Atención", text: "Debe seleccionar un combo para modificar." });
            return;
        }
        const $fila = $radio.closest("tr");
        const codigoCombo = $fila.data("codigo");
        const nombreCombo = $fila.data("combo-nombre") || "";
        const articulosGuardados = $fila.data("combo-articulos") || [];

        const unidadesCombo = $fila.find(".val-unidades-combo-mod").val();
        const proyeccionCombo = $fila.find(".val-proyeccion-combo-mod").val();
        const medioPagoCombo = $fila.find(".select-mediopago-combo-final-mod").val();
        const seleccionadosMP = $fila.find(".select-mediopago-combo-final-mod").data("seleccionados");
        const regaloCombo = $fila.find("td:last-child input[type='checkbox']").is(":checked");

        limpiarModalComboMod();
        comboEnEdicion = codigoCombo;

        $("#nombreComboModalMod").val(nombreCombo);
        $("#btnHeaderComboTotalMod").text(`[${codigoCombo}] ${nombreCombo}`);

        $(`#tablaCreacionCombo tbody tr[data-campo='unidades_limite'] td:eq(1) input`).val(unidadesCombo);
        $(`#tablaCreacionCombo tbody tr[data-campo='proyeccion_vta'] td:eq(1) input`).val(proyeccionCombo);

        const $mpCombo = $(`#tablaCreacionCombo tbody tr[data-campo='medio_pago'] td:eq(1) select`);
        const $mpBtn = $mpCombo.closest(".input-group").find("button");

        $mpCombo.val(medioPagoCombo);
        if (medioPagoCombo === "7" && seleccionadosMP) {
            $mpCombo.data("seleccionados", seleccionadosMP);
            $mpBtn.removeClass("d-none btn-outline-secondary").addClass("btn-success").html(`<i class="fa-solid fa-list-check"></i> (${seleccionadosMP.length})`);
        }
        $(`#tablaCreacionCombo tbody tr[data-campo='regalo'] td:eq(1) input[type='checkbox']`).prop("checked", regaloCombo);

        articulosGuardados.forEach(art => agregarColumnaAComboMod(art));
    });

    // BOTÓN ELIMINAR COMBO
    $("#btnEliminarComboMod").off("click").on("click", function () {
        const $radio = $("#tablaCombosBodyMod .combo-row-radio-mod:checked");
        if ($radio.length === 0) {
            Swal.fire({ icon: "warning", title: "Atención", text: "Debe seleccionar un combo." });
            return;
        }
        const $fila = $radio.closest("tr");
        Swal.fire({
            title: "¿Está seguro?", text: "Se eliminará el combo seleccionado.",
            icon: "warning", showCancelButton: true, confirmButtonColor: "#d33", confirmButtonText: "Sí, Eliminar"
        }).then((result) => {
            if (result.isConfirmed) {
                $fila.remove();
                Swal.fire({ toast: true, position: "top-end", icon: "success", title: "Combo eliminado", showConfirmButton: false, timer: 1500 });
            }
        });
    });

    // BOTÓN CONFIRMAR COMBO (Guardar al detalle)
    $("#btnConfirmarComboMod").off("click").on("click", function () {
        let codigo = comboEnEdicion ? comboEnEdicion : "CMB-NEW-" + ($("#tablaCombosBodyMod tr").length + 1);
        const nombre = $("#nombreComboModalMod").val().trim();

        if (!nombre) { Swal.fire("Validación", "Debe ingresar un nombre para el combo.", "warning"); return; }

        const articulosCombo = extraerArticulosDelModalComboMod();
        if (articulosCombo.length === 0) { Swal.fire("Validación", "Debe agregar al menos un artículo al combo.", "warning"); return; }

        articulosPorComboMemoria[codigo] = articulosCombo;

        const getModalComboVal = (campo) => $(`#tablaCreacionCombo tbody tr[data-campo='${campo}'] td:eq(1) input`).val() || "-";

        const modalCosto = getModalComboVal("costo");
        const modalStock = getModalComboVal("stock_bodega");
        const modalStockTienda = getModalComboVal("stock_tienda");
        const modalOptimo = getModalComboVal("inv_optimo");
        const modalExcU = getModalComboVal("excedentes_u");
        const modalExcS = getModalComboVal("excedentes_usd");
        const modalUnidades = getModalComboVal("unidades_limite");
        const modalProyeccion = getModalComboVal("proyeccion_vta");

        const $selectMPModal = $(`#tablaCreacionCombo tbody tr[data-campo='medio_pago'] td:eq(1) select`);
        const modalMedioPago = $selectMPModal.val();
        const modalMedioPagoSel = $selectMPModal.data("seleccionados");

        const modalPLContado = getModalComboVal("precio_lista_contado");
        const modalPLCredito = getModalComboVal("precio_lista_credito");
        const modalPromoContado = getModalComboVal("promo_contado");
        const modalPromoTC = getModalComboVal("promo_tc");
        const modalPromoCredito = getModalComboVal("promo_credito");
        const modalDsctoContado = getModalComboVal("dscto_contado");
        const modalDsctoTC = getModalComboVal("dscto_tc");
        const modalDsctoCredito = getModalComboVal("dscto_credito");
        const modalMargenContado = getModalComboVal("margen_promo_contado");
        const modalMargenTC = getModalComboVal("margen_promo_tc");
        const modalMargenCredito = getModalComboVal("margen_promo_cred");
        const modalRegalo = $(`#tablaCreacionCombo tbody tr[data-campo='regalo'] td:eq(1) input[type='checkbox']`).is(":checked");

        let totalAporteProv = 0, totalAporteRebate = 0, totalAportePropio = 0;
        articulosCombo.forEach(a => {
            totalAporteProv += (a.aporteProveedor || 0) + (a.aporteProveedor2 || 0);
            totalAporteRebate += a.aporteRebate || 0;
            totalAportePropio += (a.aportePropio || 0) + (a.aportePropio2 || 0);
        });

        let idPromocionArticulo = 0;
        let accion = "I";
        if (comboEnEdicion) {
            const $filaExistente = $(`#tablaCombosBodyMod tr[data-codigo="${comboEnEdicion}"]`);
            idPromocionArticulo = $filaExistente.data("idpromocionarticulo") || 0;
            accion = idPromocionArticulo > 0 ? "U" : "I";
            $filaExistente.remove();
        }

        const btnMPHtml = (modalMedioPago === "7" && modalMedioPagoSel && modalMedioPagoSel.length > 0)
            ? `<button class="btn btn-success btn-sm btn-editar-mp-combo-mod" type="button" disabled><i class="fa-solid fa-list-check"></i> (${modalMedioPagoSel.length})</button>`
            : `<button class="btn btn-outline-secondary btn-sm d-none btn-editar-mp-combo-mod" type="button" disabled><i class="fa-solid fa-list-check"></i></button>`;

        const filaCombo = `
            <tr data-codigo="${codigo}" data-idpromocionarticulo="${idPromocionArticulo}" data-accion="${accion}" class="align-middle">
                <td class="text-center align-middle"><input type="radio" class="form-check-input combo-row-radio-mod" name="comboRadioSelMod"></td>
                <td class="table-sticky-col" style="background-color: #f8f9fa;">
                    <span class="text-nowrap"><span class="fw-bold">${codigo}</span> - ${nombre}</span>
                </td>
                <td class="text-end">${modalCosto}</td>
                <td class="text-end">${modalStock}</td>
                <td class="text-end">${modalStockTienda}</td>
                <td class="text-end">${modalOptimo}</td>
                <td class="text-end">${modalExcU}</td>
                <td class="text-end">${modalExcS}</td>
                <td><input type="number" class="form-control form-control-sm text-end val-unidades-combo-mod" placeholder="0" value="${modalUnidades}" disabled></td>
                <td><input type="number" class="form-control form-control-sm text-end val-proyeccion-combo-mod" placeholder="0" value="${modalProyeccion}" disabled></td>
                <td>
                    <div class="input-group input-group-sm" style="min-width:140px;">
                        ${btnMPHtml}
                        <select class="form-select select-mediopago-combo-final-mod" disabled>
                            ${generarOpcionesMedioPago()}
                        </select>
                    </div>
                </td>
                <td class="text-end">${modalPLContado}</td>
                <td class="text-end">${modalPLCredito}</td>
                <td class="text-end">${modalPromoContado}</td>
                <td class="text-end">${modalPromoTC}</td>
                <td class="text-end">${modalPromoCredito}</td>
                <td class="text-end">${modalDsctoContado}</td>
                <td class="text-end">${modalDsctoTC}</td>
                <td class="text-end">${modalDsctoCredito}</td>
                <td class="text-end">${modalMargenContado}</td>
                <td class="text-end">${modalMargenTC}</td>
                <td class="text-end">${modalMargenCredito}</td>
                <td class="text-end">${formatCurrencySpanish(totalAporteProv)}</td>
                <td class="text-end">${formatCurrencySpanish(totalAporteRebate)}</td>
                <td class="text-end">${formatCurrencySpanish(totalAportePropio)}</td>
                <td class="text-center"><input class="form-check-input" type="checkbox" disabled ${modalRegalo ? "checked" : ""}></td>
            </tr>`;

        $("#tablaCombosBodyMod").append(filaCombo);

        const $filaInsertada = $(`#tablaCombosBodyMod tr[data-codigo="${codigo}"]`);
        $filaInsertada.data("combo-nombre", nombre);
        $filaInsertada.data("combo-articulos", articulosCombo);

        const $filaSelect = $filaInsertada.find(".select-mediopago-combo-final-mod");
        $filaSelect.val(modalMedioPago);
        if (modalMedioPago === "7" && modalMedioPagoSel) {
            $filaSelect.data("seleccionados", modalMedioPagoSel);
        }

        const modalCombo = bootstrap.Modal.getInstance(document.getElementById('modalCrearComboMod'));
        if (modalCombo) modalCombo.hide();

        limpiarModalComboMod();
        comboEnEdicion = null;

        Swal.fire({ toast: true, position: "top-end", icon: "success", title: `Combo "${nombre}" guardado.`, showConfirmButton: false, timer: 2000 });
    });

    // SELECCIÓN DE FILA EN COMBOS
    $(document).off("change", ".combo-row-radio-mod").on("change", ".combo-row-radio-mod", function () {
        $("#tablaCombosBodyMod tr").removeClass("table-active");
        $(this).closest("tr").addClass("table-active");
    });

    // ELIMINAR COLUMNA EN MODAL DE COMBO
    $(document).off("click", ".btn-eliminar-col-combo-mod").on("click", ".btn-eliminar-col-combo-mod", function (e) {
        e.preventDefault();
        const colIndex = $(this).closest("th").index();
        Swal.fire({
            title: "¿Eliminar artículo del combo?", icon: "warning",
            showCancelButton: true, confirmButtonText: "Sí, eliminar"
        }).then((res) => {
            if (res.isConfirmed) {
                $(`#trHeadersCombo th:eq(${colIndex})`).remove();
                $("#tablaCreacionCombo tbody tr").each(function () {
                    $(this).find(`td:eq(${colIndex})`).remove();
                });
                recalcularTotalesComboMod();
            }
        });
    });

    // ACTUALIZAR HEADER NOMBRE COMBO
    $("#btnActualizarHeaderComboMod").off("click").on("click", function () {
        const nom = $("#nombreComboModalMod").val().trim();
        if (nom) {
            const prefijo = comboEnEdicion ? `[${comboEnEdicion}] ` : "";
            $("#btnHeaderComboTotalMod").text(`${prefijo}${nom}`);
        } else {
            Swal.fire("Atención", "Ingrese un nombre para el combo", "warning");
        }
    });

    // RECÁLCULO DE INPUTS EN MODAL COMBO
    $(document).off("input change", "#tablaCreacionCombo tbody input.input-combo-art-mod").on("input change", "#tablaCreacionCombo tbody input.input-combo-art-mod", function () {
        this.value = this.value.replace(/[^0-9.,]/g, '');
        recalcularColumnaComboMod($(this).closest("td").data("colindex"));
        recalcularTotalesComboMod();
    });

    // CAMBIO DE UNIDADES LÍMITE/PROYECCIÓN EN COLUMNA DEL COMBO
    $(document).off("input change", "#tablaCreacionCombo tbody tr[data-campo='unidades_limite'] td:eq(1) input, #tablaCreacionCombo tbody tr[data-campo='proyeccion_vta'] td:eq(1) input").on("input change", "#tablaCreacionCombo tbody tr[data-campo='unidades_limite'] td:eq(1) input, #tablaCreacionCombo tbody tr[data-campo='proyeccion_vta'] td:eq(1) input", function () {
        const numCols = $("#trHeadersCombo th").length;
        for (let i = 2; i < numCols; i++) recalcularColumnaComboMod(i);
        recalcularTotalesComboMod();
    });

    // BUSCAR ACUERDO POR ARTÍCULO EN COMBO
    $(document).off("click", ".btn-buscar-acuerdo-combo-mod").on("click", ".btn-buscar-acuerdo-combo-mod", function () {
        const $btn = $(this);
        const colIndex = $btn.closest("td").data("colindex");
        const tipoFondo = $btn.data("tipofondo");
        const slot = parseInt($btn.data("slot")) || 1;
        const $tdCodigo = $(`#tablaCreacionCombo tbody tr[data-campo='art_codigo'] td[data-colindex='${colIndex}']`);
        const codigoItem = $tdCodigo.find(".art-codigo-hidden").val();

        const $inputDisplay = $btn.closest(".input-group").find("input[type='text']");
        const $inputId = $btn.closest("td").find("input.acuerdo-id-hidden");

        const titulos = { "TFPROVEDOR": "Acuerdos Proveedor", "TFREBATE": "Acuerdos Rebate", "TFPROPIO": "Acuerdos Propio" };
        abrirModalAcuerdoArticulo(tipoFondo, titulos[tipoFondo], codigoItem, $inputDisplay, $inputId, slot, null);

        acuerdoArticuloContexto.esCombo = true;
        acuerdoArticuloContexto.colIndex = colIndex;
    });

    // CONTEXTO PARA AÑADIR ARTÍCULOS A COMBO
    $(document).off("click", ".btn-add-articulo-combo-mod").on("click", ".btn-add-articulo-combo-mod", function () {
        window.contextoModalItems = "COMBOS_MOD";
        $("#modalCrearComboMod").data("estaba-abierto", true);
    });

    // RE-ABRIR MODAL COMBO AL CERRAR ITEMS
    $("#modalConsultaItems").off("hidden.bs.modal.combosMod").on("hidden.bs.modal.combosMod", function () {
        if (window.contextoModalItems === "COMBOS_MOD" || $("#modalCrearComboMod").data("estaba-abierto")) {
            $("#modalCrearComboMod").data("estaba-abierto", false);
            setTimeout(() => {
                $("#modalCrearComboMod").modal("show");
                window.contextoModalItems = "ARTICULOS";
            }, 300);
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
    initDatepickers();
    initLogicaCombosMod();

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
        if (isChecked) { $jerarquia.val("").trigger("change"); $btns.addClass("d-none"); }
    });

    $('#btnVerSoporteActual').off('click').on('click', function () {
        const ruta = $(this).data('soporte');
        if (!ruta) { Swal.fire({ icon: 'info', title: 'Sin soporte', text: 'No hay archivo adjunto.' }); return; }
        abrirVisorPDF(obtenerNombreArchivo(ruta));
    });

    $("#btnCerrarVisorPdf, #btnCerrarVisorPdfFooter").on("click", function () { cerrarVisorPDF(); });
    $("#btnDescargarPdf").on("click", function () {
        const url = $(this).data("blob-url"); const nombre = $(this).data("nombre-archivo");
        if (url) { const a = document.createElement("a"); a.href = url; a.download = nombre || "soporte.pdf"; document.body.appendChild(a); a.click(); document.body.removeChild(a); }
    });

    $("#segGrupoAlmacen").on("change", function () {
        if (isPopulating) return;
        const codigoGrupo = $(this).val();
        if (codigoGrupo && codigoGrupo !== "" && codigoGrupo !== "TODAS" && codigoGrupo !== "3") {
            consultarAlmacenes(codigoGrupo);
        } else if (codigoGrupo === "TODAS" || codigoGrupo === "") {
            consultarAlmacenes();
        }
    });

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
            evaluarBloqueosAcuerdos();
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
            evaluarBloqueosAcuerdos();
        }
    });

    $('#inputArchivoSoporte').on('change', function () { esArchivoValido('#inputArchivoSoporte', '#lblArchivoActual'); });

    $("#btnBorrarProv").on("click", function () { $("#fondoProveedorId, #fondoProveedorText").val(""); $("#fondoDisponibleProv").val("0"); evaluarBloqueosAcuerdos(); });
    $("#btnBorrarPropio").on("click", function () { $("#acuerdoPropioId, #acuerdoPropioText").val(""); $("#acuerdoPropioDisponible").val("0"); evaluarBloqueosAcuerdos(); });

    // ===================================================================
    // EVENTOS ARTÍCULOS
    // ===================================================================
    $(document).off("change", ".item-row-radio").on("change", ".item-row-radio", function () {
        $("#tablaArticulosBody tr").removeClass("table-active");
        $("#tablaArticulosBody .celda-editable input, #tablaArticulosBody .celda-editable button, #tablaArticulosBody .celda-editable select").prop("disabled", true);
        $("#tablaArticulosBody .aporte-proveedor, #tablaArticulosBody .aporte-proveedor2, #tablaArticulosBody .aporte-rebate, #tablaArticulosBody .aporte-propio, #tablaArticulosBody .aporte-propio2").prop("disabled", true);
        $("#tablaArticulosBody td:last-child input[type='checkbox']").prop("disabled", true);

        const $fila = $(this).closest("tr");
        $fila.addClass("table-active");
        $fila.find(".celda-editable input, .celda-editable button, .celda-editable select").not(".aporte-proveedor, .aporte-proveedor2, .aporte-rebate, .aporte-propio, .aporte-propio2").prop("disabled", false);

        if ($fila.find(".acuerdo-prov1-hidden").val()) $fila.find(".aporte-proveedor").prop("disabled", false);
        if ($fila.find(".acuerdo-prov2-hidden").val()) $fila.find(".aporte-proveedor2").prop("disabled", false);
        if ($fila.find(".acuerdo-rebate-hidden").val()) $fila.find(".aporte-rebate").prop("disabled", false);
        if ($fila.find(".acuerdo-propio1-hidden").val()) $fila.find(".aporte-propio").prop("disabled", false);
        if ($fila.find(".acuerdo-propio2-hidden").val()) $fila.find(".aporte-propio2").prop("disabled", false);

        $fila.find("td:last-child input[type='checkbox']").prop("disabled", false);
    });

    $(document).on("click", ".btn-buscar-acuerdo-art", function () {
        const $btn = $(this);
        const tipoFondo = $btn.data("tipofondo");
        const slot = parseInt($btn.data("slot")) || 1;
        const $fila = $btn.closest("tr");
        const codigoItem = $fila.data("codigo");
        const $inputDisplay = $btn.closest(".input-group").find("input[type='text']");
        const $inputId = $btn.closest("td").find("input.acuerdo-id-hidden");
        const titulos = {
            "TFPROVEDOR": "Acuerdos - Fondo Proveedor" + (slot === 2 ? " (2)" : ""),
            "TFREBATE": "Acuerdos - Fondo Rebate",
            "TFPROPIO": "Acuerdos - Fondo Propio" + (slot === 2 ? " (2)" : "")
        };
        abrirModalAcuerdoArticulo(tipoFondo, titulos[tipoFondo] || "Acuerdos", codigoItem, $inputDisplay, $inputId, slot, $fila);
    });

    $("#btnAceptarAcuerdoArticulo").on("click", function () {
        if (!acuerdoArticuloTemporal) { Swal.fire({ icon: "info", title: "Atención", text: "Debe seleccionar un acuerdo." }); return; }
        if (acuerdoArticuloContexto) {

            // ====== MANEJO PARA COMBOS ======
            if (acuerdoArticuloContexto.esCombo) {
                const tipo = acuerdoArticuloContexto.tipoFondo;
                const slot = acuerdoArticuloContexto.slot;
                const colIdx = acuerdoArticuloContexto.colIndex;
                const idSeleccionado = String(acuerdoArticuloTemporal.idAcuerdo);
                const getVal = (c) => $(`#tablaCreacionCombo tbody tr[data-campo='${c}'] td[data-colindex='${colIdx}'] input.acuerdo-id-hidden`).val();

                if (tipo === "TFPROVEDOR" && (slot === 1 ? getVal("aporte_prov2_id") : getVal("aporte_prov_id")) === idSeleccionado) {
                    Swal.fire({ icon: "warning", title: "Acuerdo Duplicado" }); return;
                }
                if (tipo === "TFPROPIO" && (slot === 1 ? getVal("aporte_propio2_id") : getVal("aporte_propio_id")) === idSeleccionado) {
                    Swal.fire({ icon: "warning", title: "Acuerdo Duplicado" }); return;
                }

                acuerdoArticuloContexto.$inputDisplay.val(acuerdoArticuloTemporal.display);
                acuerdoArticuloContexto.$inputId.val(acuerdoArticuloTemporal.idAcuerdo);

                const maxVal = acuerdoArticuloTemporal.valorAcuerdo || 0;
                const setInputAporte = (c) => $(`#tablaCreacionCombo tbody tr[data-campo='${c}'] td[data-colindex='${colIdx}'] input.aporte-valor`).prop("disabled", false).attr("data-max", maxVal).val("");

                if (tipo === "TFPROVEDOR") setInputAporte(slot === 1 ? "aporte_prov" : "aporte_prov2");
                else if (tipo === "TFREBATE") setInputAporte("aporte_rebate");
                else if (tipo === "TFPROPIO") setInputAporte(slot === 1 ? "aporte_propio" : "aporte_propio2");

                recalcularColumnaComboMod(colIdx);
                recalcularTotalesComboMod();
                $("#modalAcuerdoArticulo").modal("hide");
                acuerdoArticuloTemporal = null;
                acuerdoArticuloContexto = null;
                return;
            }

            // ====== MANEJO ORIGINAL PARA ARTÍCULOS (sin cambios) ======
            const tipo = acuerdoArticuloContexto.tipoFondo;
            const slot = acuerdoArticuloContexto.slot;
            const $fila = acuerdoArticuloContexto.$fila;
            const idSeleccionado = String(acuerdoArticuloTemporal.idAcuerdo);

            if (tipo === "TFPROVEDOR") {
                const otroSlotClass = slot === 1 ? ".acuerdo-prov2-hidden" : ".acuerdo-prov1-hidden";
                const idOtroSlot = String($fila.find(otroSlotClass).val() || "");
                if (idOtroSlot && idOtroSlot !== "" && idOtroSlot === idSeleccionado) {
                    Swal.fire({ icon: "warning", title: "Acuerdo Duplicado", text: `El acuerdo ${idSeleccionado} ya fue seleccionado en el otro slot.` });
                    return;
                }
            } else if (tipo === "TFPROPIO") {
                const otroSlotClass = slot === 1 ? ".acuerdo-propio2-hidden" : ".acuerdo-propio1-hidden";
                const idOtroSlot = String($fila.find(otroSlotClass).val() || "");
                if (idOtroSlot && idOtroSlot !== "" && idOtroSlot === idSeleccionado) {
                    Swal.fire({ icon: "warning", title: "Acuerdo Duplicado", text: `El acuerdo ${idSeleccionado} ya fue seleccionado en el otro slot.` });
                    return;
                }
            }

            acuerdoArticuloContexto.$inputDisplay.val(acuerdoArticuloTemporal.display);
            acuerdoArticuloContexto.$inputId.val(acuerdoArticuloTemporal.idAcuerdo);

            const maxVal = acuerdoArticuloTemporal.valorAcuerdo || 0;
            if (tipo === "TFPROVEDOR" && slot === 1) $fila.find(".aporte-proveedor").prop("disabled", false).attr("data-max", maxVal).val("");
            else if (tipo === "TFPROVEDOR" && slot === 2) $fila.find(".aporte-proveedor2").prop("disabled", false).attr("data-max", maxVal).val("");
            else if (tipo === "TFREBATE") $fila.find(".aporte-rebate").prop("disabled", false).attr("data-max", maxVal).val("");
            else if (tipo === "TFPROPIO" && slot === 1) $fila.find(".aporte-propio").prop("disabled", false).attr("data-max", maxVal).val("");
            else if (tipo === "TFPROPIO" && slot === 2) $fila.find(".aporte-propio2").prop("disabled", false).attr("data-max", maxVal).val("");

            recalcularFilaArticulo($fila);
        }
        $("#modalAcuerdoArticulo").modal("hide");
        acuerdoArticuloTemporal = null; acuerdoArticuloContexto = null;
    });

    $(document).on("input change", "#tablaArticulosBody input[type='text'], #tablaArticulosBody input[type='number']", function () {
        this.value = this.value.replace(/[^0-9.,]/g, '');
        recalcularFilaArticulo($(this).closest("tr"));
    });

    $(document).on("blur", "#tablaArticulosBody .aporte-proveedor, #tablaArticulosBody .aporte-proveedor2, #tablaArticulosBody .aporte-rebate, #tablaArticulosBody .aporte-propio, #tablaArticulosBody .aporte-propio2", function () {
        const max = parseFloat($(this).attr("data-max")) || 0;
        const valor = parseCurrencyToNumber($(this).val());
        if (max > 0 && valor > max) {
            Swal.fire({ icon: 'warning', title: 'Valor Excedido', text: `El aporte ($${valor.toFixed(2)}) supera el valor del acuerdo ($${max.toFixed(2)}).` });
            $(this).val("").addClass("is-invalid");
        } else { $(this).removeClass("is-invalid"); }
    });

    $(document).on("change", ".select-mediopago-articulo", function () {
        const $select = $(this); const val = $select.val();
        if (val === "7") {
            filaActualMedioPago = $select.closest("tr");
            const guardados = $select.data("seleccionados") || [];
            $("#bodyModalMedioPago input[type='checkbox']").prop("checked", false);
            guardados.forEach(v => $(`#bodyModalMedioPago input[value='${v}']`).prop("checked", true));
            $("#btnAceptarMedioPago").off("click.articulo").on("click.articulo", function () {
                if (filaActualMedioPago) {
                    const sel = []; $("#bodyModalMedioPago input[type='checkbox']:checked").each(function () { sel.push($(this).val()); });
                    filaActualMedioPago.find(".select-mediopago-articulo").data("seleccionados", sel);
                    if (sel.length === 0) filaActualMedioPago.find(".select-mediopago-articulo").val("");
                    filaActualMedioPago = null;
                }
            });
            $("#ModalMedioPago").modal("show");
        } else { $select.removeData("seleccionados"); }
    });

    $("#modalConsultaItems").on("show.bs.modal", function () {
        cargarFiltrosItemsPromocion();
        if (!dtItemsConsultaPromo) {
            dtItemsConsultaPromo = $("#tablaItemsConsulta").DataTable({
                data: [], columns: [
                    { title: "Sel", className: "text-center align-middle", orderable: false, searchable: false },
                    { title: "Código", className: "align-middle" }, { title: "Descripción", className: "align-middle" },
                    { title: "Costo", className: "align-middle text-end" }, { title: "Stock", className: "align-middle text-center" },
                    { title: "Óptimo", className: "align-middle text-center" }, { title: "Excedente(u)", className: "align-middle text-center" },
                    { title: "Excedente($)", className: "align-middle text-end" }, { title: "M-0(u)", className: "align-middle text-center" },
                    { title: "M-0($)", className: "align-middle text-end" }, { title: "M-1(u)", className: "align-middle text-center" },
                    { title: "M-1($)", className: "align-middle text-end" }, { title: "M-2(u)", className: "align-middle text-center" },
                    { title: "M-2($)", className: "align-middle text-end" }, { title: "M-12(u)", className: "align-middle text-center" },
                    { title: "M-12($)", className: "align-middle text-end" }
                ], deferRender: true, pageLength: 10, lengthChange: false,
                dom: '<"row"<"col-12"tr>><"row"<"col-12 text-center"i>><"row"<"col-12 d-flex justify-content-center"p>>',
                language: { emptyTable: '<div class="text-center text-muted p-4"><i class="fa-solid fa-filter"></i><br>Presione <strong>"Procesar Selección"</strong></div>', zeroRecords: "No se encontraron items.", info: "Mostrando _START_ a _END_ de _TOTAL_ items", infoEmpty: "Sin items", paginate: { first: "«", last: "»", next: "›", previous: "‹" } },
                order: [[1, 'asc']]
            });
        }
        dtItemsConsultaPromo.clear().draw();
    });

    $("#btnProcesarFiltros").on("click", function () {
        const getVals = (id) => { const v = []; $(`#${id} .filtro-item-checkbox:checked`).each(function () { v.push($(this).val()); }); return v; };
        const marcas = getVals("filtroMarcaModal"), divisiones = getVals("filtroDivisionModal"), departamentos = getVals("filtroDepartamentoModal"), clases = getVals("filtroClaseModal");
        const articulo = $("#filtroArticuloModal").val().trim();
        if (marcas.length === 0 && divisiones.length === 0 && departamentos.length === 0 && clases.length === 0 && articulo === "") {
            Swal.fire({ icon: "warning", title: "Atención", text: "Seleccione al menos un criterio." }); return;
        }
        consultarItemsPromocion({ marcas, divisiones, departamentos, clases, codigoarticulo: articulo });
    });

    $("#checkTodosItems").on("change", function () {
        if (dtItemsConsultaPromo) $(dtItemsConsultaPromo.$(".item-checkbox")).prop("checked", $(this).is(":checked"));
    });

    $("#btnSeleccionarItems").off("click").on("click", function () {
        const items = [];
        const checkboxes = dtItemsConsultaPromo ? dtItemsConsultaPromo.$(".item-checkbox:checked") : [];
        checkboxes.each(function () {
            const $c = $(this);
            items.push({
                codigo: $c.data("codigo"), descripcion: $c.data("descripcion"),
                costo: $c.data("costo"), stock: $c.data("stock"), optimo: $c.data("optimo"),
                excedenteu: $c.data("excedenteu"), excedentes: $c.data("excedentes"),
                m0u: $c.data("m0u"), m0s: $c.data("m0s"), m1u: $c.data("m1u"), m1s: $c.data("m1s"),
                m2u: $c.data("m2u"), m2s: $c.data("m2s"), m12u: $c.data("m12u"), m12s: $c.data("m12s"),
                margenmincontado: $c.data("margenmincontado"),
                margenmintc: $c.data("margenmintc"),
                margenmincredito: $c.data("margenmincredito"),
                margenminigualar: $c.data("margenminigualar"),
                preciolistacontado: $c.data("preciolistacontado"),
                preciolistacredito: $c.data("preciolistacredito")
            });
        });
        if (items.length === 0) { Swal.fire("Atención", "Seleccione al menos un item.", "info"); return; }

        if (window.contextoModalItems === "COMBOS_MOD") {
            items.forEach(item => agregarColumnaAComboMod(item));
        } else {
            agregarItemsATablaArticulos(items);
        }

        $("#modalConsultaItems").modal("hide");
        $("#checkTodosItems").prop("checked", false);
    });

    $("#btnDeleteItemArticulos").on("click", function () {
        const $radio = $("#tablaArticulosBody .item-row-radio:checked");
        if ($radio.length === 0) { Swal.fire({ icon: "warning", title: "Atención", text: "Seleccione un artículo." }); return; }
        const $fila = $radio.closest("tr");
        const descripcion = $fila.find("td:eq(1)").text();
        Swal.fire({ title: "¿Está seguro?", html: `Se eliminará: <strong>${descripcion}</strong>`, icon: "warning", showCancelButton: true, confirmButtonColor: "#d33", confirmButtonText: "Sí, Eliminar", cancelButtonText: "Cancelar" }).then((result) => {
            if (result.isConfirmed) {
                $fila.remove();
                const $primera = $("#tablaArticulosBody tr").first();
                if ($primera.length) $primera.find(".item-row-radio").prop("checked", true).trigger("change");
            }
        });
    });

    $("#btnEquivalentes").on("click", function () {
        const codigo = obtenerCodigoArticuloSeleccionado(); if (!codigo) return;
        consultarServicioAdicional("api/Promocion/consultar-articulo-equivalente", codigo, function (data) {
            const $tbody = $("#tbodyEquivalentes"); $tbody.empty();
            if (!data.length) { $tbody.html('<tr><td colspan="14" class="text-center text-muted">No existen equivalentes.</td></tr>'); }
            else { data.forEach(item => { $tbody.append(`<tr><td>${item.codigo || ''} - ${item.descripcion || ''}</td><td class="text-end">${formatCurrencySpanish(item.costo)}</td><td class="text-center">${item.stock_bodega || 0}</td><td class="text-center">${item.stock_tiendas || 0}</td><td class="text-center">${item.inventario_optimo || 0}</td><td class="text-center">${item.excedentes_unidades || 0}</td><td class="text-end">${formatCurrencySpanish(item.excedentes_dolares)}</td><td class="text-center">${item.dias_antiguedad || 0}</td><td class="text-center">${item.m0_unidades || 0}</td><td class="text-end">${formatCurrencySpanish(item.m0_dolares)}</td><td class="text-center">${item.m1_unidades || 0}</td><td class="text-end">${formatCurrencySpanish(item.m1_dolares)}</td><td class="text-center">${item.m2_unidades || 0}</td><td class="text-end">${formatCurrencySpanish(item.m2_dolares)}</td></tr>`); }); }
            $("#modalEquivalentes").modal("show");
        });
    });

    $("#btnPreciosCompetencia").on("click", function () {
        const codigo = obtenerCodigoArticuloSeleccionado(); if (!codigo) return;
        consultarServicioAdicional("api/Promocion/consultar-articulo-precio-competencia", codigo, function (data) {
            const $tbody = $("#tbodyPreciosCompetencia"); $tbody.empty();
            if (!data.length) { $tbody.html('<tr><td colspan="2" class="text-center text-muted">No hay precios registrados.</td></tr>'); }
            else { data.forEach(item => { $tbody.append(`<tr><td>${item.nombre_competencia || ''}</td><td class="text-end">${formatCurrencySpanish(item.precio_contado)}</td></tr>`); }); }
            $("#modalPreciosCompetencia").modal("show");
        });
    });

    $("#btnOtrosCostos").on("click", function () {
        const codigo = obtenerCodigoArticuloSeleccionado(); if (!codigo) return;
        consultarServicioAdicional("api/Promocion/consultar-otros-costos", codigo, function (data) {
            const $tbody = $("#tbodyOtrosCostos"); $tbody.empty();
            if (!data.length) { $tbody.html('<tr><td colspan="3" class="text-center text-muted">No hay otros costos.</td></tr>'); }
            else { data.forEach(item => { $tbody.append(`<tr><td class="text-center align-middle"><input class="form-check-input chk-otro-costo" type="checkbox" data-codigo="${item.codigo}" data-nombre="${item.nombre}" data-valor="${item.valor}"></td><td class="align-middle">${item.nombre || ''}</td><td class="text-end align-middle">${formatCurrencySpanish(item.valor)}</td></tr>`); }); }

            const $filaArticulo = $("#tablaArticulosBody .item-row-radio:checked").closest("tr");
            const otrosCostosGuardados = $filaArticulo.data("detalle-otros-costos") || [];
            otrosCostosGuardados.forEach(function (oc) {
                $("#tbodyOtrosCostos .chk-otro-costo").each(function () {
                    if (String($(this).data("codigo")) === String(oc.codigo) || $(this).data("nombre") === oc.nombre) $(this).prop("checked", true);
                });
            });

            $("#modalOtrosCostos").modal("show");
        });
    });

    $("#btnAplicarOtrosCostos").off("click").on("click", function () {
        let totalOtrosCostos = 0; let seleccionados = [];
        $("#tbodyOtrosCostos .chk-otro-costo:checked").each(function () {
            const valor = parseFloat($(this).data("valor")) || 0; totalOtrosCostos += valor;
            seleccionados.push({ codigo: $(this).data("codigo"), nombre: $(this).data("nombre"), valor });
        });
        const $filaArticulo = $("#tablaArticulosBody .item-row-radio:checked").closest("tr");
        $filaArticulo.data("total-otros-costos", totalOtrosCostos);
        $filaArticulo.data("detalle-otros-costos", seleccionados);
        recalcularFilaArticulo($filaArticulo);
        $("#modalOtrosCostos").modal("hide");
        if (totalOtrosCostos > 0) Swal.fire({ toast: true, position: "top-end", icon: "success", title: `Otros costos: ${formatCurrencySpanish(totalOtrosCostos)}`, showConfirmButton: false, timer: 2000 });
    });
});

// ===================================================================
// FUNCIONES DE CARGA (BANDEJA)
// ===================================================================
function cargarBandeja() {
    const payload = { code_app: "APP20260128155212346", http_method: "GET", endpoint_path: "api/Promocion/consultar-bandeja-modificacion", client: "APL" };
    $.ajax({
        url: "/api/apigee-router-proxy", method: "POST", contentType: "application/json", data: JSON.stringify(payload),
        success: function (res) { crearListado(res.json_response || []); },
        error: function (xhr) { manejarErrorGlobal(xhr, "cargar bandeja"); }
    });
}

function crearListado(data) {
    if (tabla) tabla.destroy();
    if (!data || data.length === 0) { $('#tabla').html("<div class='alert alert-info text-center'>No hay promociones.</div>"); return; }
    let html = `<table id="tabla-principal" class="table table-bordered table-striped table-hover"><thead>
        <tr><th colspan="10" style="background-color: #CC0000 !important; color: white; text-align: center; font-weight: bold; padding: 8px; font-size: 1rem;">BANDEJA DE MODIFICACIÓN DE PROMOCIONES</th></tr>
        <tr><th>Acción</th><th>Id Promoción</th><th>Descripción</th><th>Motivo</th><th>Clase de Promoción</th><th>Fecha Inicio</th><th>Fecha Fin</th><th>Regalo</th><th>Soporte</th><th>Estado</th></tr></thead><tbody>`;
    data.forEach(promo => {
        html += `<tr><td class="text-center"><button type="button" class="btn-action edit-btn" title="Modificar" onclick="abrirModalEditar(${promo.idpromocion})" style="border:none; background:none; color:#0d6efd;"><i class="fa-regular fa-pen-to-square"></i></button></td>
            <td class="text-center">${promo.idpromocion ?? ""}</td><td>${promo.descripcion ?? ""}</td><td>${promo.motivo ?? ""}</td><td>${promo.clase_promocion ?? ""}</td>
            <td class="text-center">${formatearFecha(promo.fecha_inicio)}</td><td class="text-center">${formatearFecha(promo.fecha_fin)}</td>
            <td class="text-center">${promo.marcaregalo && promo.marcaregalo !== "N" ? "✓" : ""}</td><td>${obtenerNombreArchivo(promo.archivosoporte)}</td><td>${promo.estado ?? ""}</td></tr>`;
    });
    html += `</tbody></table>`;
    $("#tabla").html(html);
    tabla = $("#tabla-principal").DataTable({ pageLength: 10, lengthMenu: [5, 10, 25, 50], pagingType: 'full_numbers', columnDefs: [{ targets: 0, width: "5%", className: "dt-center", orderable: false }, { targets: 1, width: "8%", className: "dt-center" }, { targets: [5, 6, 7], className: "dt-center" }], order: [[1, "desc"]], language: { processing: "Procesando...", search: "Buscar:", lengthMenu: "Mostrar _MENU_ registros", info: "Mostrando _START_ a _END_ de _TOTAL_ registros", infoEmpty: "Sin registros", infoFiltered: "(filtrado de _MAX_ registros)", loadingRecords: "Cargando...", zeroRecords: "No se encontraron resultados", emptyTable: "No hay datos disponibles", paginate: { first: "Primero", previous: "Anterior", next: "Siguiente", last: "Último" } } });
}

function abrirModalEditar(idPromocion) {
    isPopulating = true;
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
    isPopulating = true;

    const cab = data.cabecera || {};
    const acuerdos = data.acuerdos || [];
    const segmentos = data.segmentos || [];
    const tipoPromocion = (cab.etiqueta_clase_promocion || "PRGENERAL").toUpperCase();

    $('#verPromocionHeader').val(`${cab.idpromocion || ""} - ${cab.nombre_clase_promocion || ""}`);
    $('#verPromocionNum').val(cab.idpromocion);
    $('#modalTipoPromocion').val(cab.etiqueta_clase_promocion || "");
    $('#promocionDescripcion').val(cab.descripcion || "");

    $('#promocionFechaInicio').val(obtenerSoloFecha(cab.fecha_inicio));
    $('#promocionHoraInicio').val(obtenerSoloHora(cab.fecha_inicio));
    $('#promocionFechaFin').val(obtenerSoloFecha(cab.fecha_fin));
    $('#promocionHoraFin').val(obtenerSoloHora(cab.fecha_fin));

    $('#verEstadoPromocion').val(cab.nombre_estado_promocion || cab.estado || "");

    const rutaSoporte = cab.archivosoporte || "";
    $('#btnVerSoporteActual').data('soporte', rutaSoporte);
    $('#lblArchivoActual').text(obtenerNombreArchivo(rutaSoporte) || "Ningún archivo seleccionado");

    cargarMotivos(function () { $('#promocionMotivo').val(cab.id_motivo); });

    const marcaRegaloVal = (cab.marcaregalo || "").toString().trim();
    $('#promocionMarcaRegalo').prop('checked', marcaRegaloVal !== "" && marcaRegaloVal !== "N");

    const segGrupo = segmentos.find(s => s.etiqueta_tipo_segmento === "SEGGRUPOALMACEN");
    const codigoGrupo = (segGrupo && segGrupo.codigo_detalle) ? segGrupo.codigo_detalle : undefined;

    consultarAlmacenes(codigoGrupo, function () {
        poblarSelectSegmento("almacen", segmentos, "SEGALMACEN");
    });

    if (tipoPromocion === "PRARTICULO") {
        $("#seccionGeneralSegmentos").hide();
        $("#seccionGeneralAcuerdos").hide();
        $("#seccionArticuloSegmentos").show();
        $("#seccionArticuloDetalle").show();
        $("#seccionComboDetalle").hide();

        poblarSelectSegmento("canal", segmentos, "SEGCANAL");
        poblarSelectSegmento("grupo", segmentos, "SEGGRUPOALMACEN");
        poblarSelectSegmento("tipocliente", segmentos, "SEGTIPOCLIENTE");

        poblarArticulosDesdeAPI(data);

    } else if (tipoPromocion === "PRCOMBO") {
        $("#seccionGeneralSegmentos").hide();
        $("#seccionGeneralAcuerdos").hide();
        $("#seccionArticuloSegmentos").show();
        $("#seccionArticuloDetalle").hide();
        $("#seccionComboDetalle").show();

        poblarSelectSegmento("canal", segmentos, "SEGCANAL");
        poblarSelectSegmento("grupo", segmentos, "SEGGRUPOALMACEN");
        poblarSelectSegmento("tipocliente", segmentos, "SEGTIPOCLIENTE");

        poblarCombosDesdeAPI(data);

    } else {
        $("#seccionGeneralSegmentos").show();
        $("#seccionGeneralAcuerdos").show();
        $("#seccionArticuloSegmentos").hide();
        $("#seccionArticuloDetalle").hide();
        $("#seccionComboDetalle").hide();

        poblarSelectSegmento("marca", segmentos, "SEGMARCA");
        poblarSelectSegmento("division", segmentos, "SEGDIVISION");
        poblarSelectSegmento("depto", segmentos, "SEGDEPARTAMENTO");
        poblarSelectSegmento("clase", segmentos, "SEGCLASE");
        poblarSelectSegmento("canal", segmentos, "SEGCANAL");
        poblarSelectSegmento("grupo", segmentos, "SEGGRUPOALMACEN");
        poblarSelectSegmento("tipocliente", segmentos, "SEGTIPOCLIENTE");
        poblarSelectSegmento("mediopago", segmentos, "SEGMEDIOPAGO");

        const artItems = segmentos.filter(s => s.etiqueta_tipo_segmento === "SEGARTICULO");
        if (artItems.length > 0 && artItems[0].codigo_detalle) {
            $('#chkArticulo').prop('checked', true).trigger("change");
            $('#segArticulo').val(artItems[0].codigo_detalle);
        }

        const acProv = acuerdos.find(a => a.etiqueta_tipo_fondo === "TFPROVEDOR");
        const acProp = acuerdos.find(a => a.etiqueta_tipo_fondo === "TFPROPIO");
        $(".inputs-acuerdos").val("");

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

        const marcaVal = $('#segMarca').val();
        if (marcaVal === "" || marcaVal === "TODAS") { validarBloqueoProveedor(true); }
        else if (marcaVal === "3") { const selec = $('#btnMarca').data("seleccionados") || []; validarBloqueoProveedor(selec.length > 1); }
        else { validarBloqueoProveedor(false); }

        evaluarBloqueosAcuerdos();
    }

    setTimeout(() => { isPopulating = false; }, 500);
}

function resetFormulario() {
    isPopulating = true;
    $('#formPromocion')[0].reset();
    const fileNameSpan = document.getElementById("lblArchivoActual");
    if (fileNameSpan) fileNameSpan.textContent = "Ningún archivo seleccionado";
    proveedorTemporal = null;
    propioTemporal = null;
    acuerdoArticuloTemporal = null;
    acuerdoArticuloContexto = null;
    comboEnEdicion = null;
    articulosPorComboMemoria = {};
    combosBDOriginal = [];

    $("#tablaArticulosBody").empty();
    $("#tablaCombosBodyMod").empty();
    $("#seccionGeneralSegmentos, #seccionGeneralAcuerdos").show();
    $("#seccionArticuloSegmentos, #seccionArticuloDetalle, #seccionComboDetalle").hide();

    isPopulating = false;
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
// GUARDAR PROMOCIÓN (GENERAL + ARTÍCULOS)
// ===============================================================
async function guardarPromocion() {
    if (!isValidDateDDMMYYYYHHMM($('#promocionFechaInicio').val()) || !isValidDateDDMMYYYYHHMM($('#promocionFechaFin').val())) {
        return Swal.fire('Validación', 'Fechas inválidas. Use el formato dd/mm/aaaa HH:mm.', 'warning');
    }

    const tipoPromocion = getTipoPromocionActual();

    if (tipoPromocion === "PRARTICULO") {
        await guardarPromocionArticulos();
    } else if (tipoPromocion === "PRCOMBO") {
        await guardarPromocionCombos();
    } else {
        await guardarPromocionGeneral();
    }
}

async function guardarPromocionGeneral() {
    const idProvSeleccionado = parseInt($("#fondoProveedorId").val(), 10) || 0;
    const idPropSeleccionado = parseInt($("#acuerdoPropioId").val(), 10) || 0;
    const descTotal = parseFloat($("#descuentoTotal").val()) || 0;

    if (idProvSeleccionado === 0 && idPropSeleccionado === 0) {
        return Swal.fire('Validación', 'Debe seleccionar al menos un Acuerdo (Proveedor o Propio).', 'warning');
    }
    if (descTotal < 1) {
        return Swal.fire('Validación', 'El % Dscto Total debe ser igual o mayor a 1.', 'warning');
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
        if (val === "3" || val === "7" || val === "4") return "C";
        return "C";
    };

    const fileInput = $('#inputArchivoSoporte')[0].files[0];
    const leerArchivo = file => new Promise((resolve, reject) => { const reader = new FileReader(); reader.readAsDataURL(file); reader.onload = () => resolve(reader.result); reader.onerror = e => reject(e); });
    const base64Completo = fileInput ? await leerArchivo(fileInput) : null;

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

    const acuerdosModificados = [];
    const acuerdosBD = (promocionTemporal && promocionTemporal.acuerdos) ? promocionTemporal.acuerdos : [];
    const acProvBD = acuerdosBD.find(a => a.etiqueta_tipo_fondo === "TFPROVEDOR");
    const acPropBD = acuerdosBD.find(a => a.etiqueta_tipo_fondo === "TFPROPIO");

    const idProvActual = parseInt($("#fondoProveedorId").val(), 10) || 0;
    if (idProvActual > 0) {
        acuerdosModificados.push({ accion: (acProvBD && acProvBD.idpromocionacuerdo) ? 'U' : 'I', idpromocionacuerdo: (acProvBD && acProvBD.idpromocionacuerdo) ? acProvBD.idpromocionacuerdo : 0, idacuerdo: idProvActual, porcentajedescuento: parseFloat($("#descuentoProveedor").val()) || 0, valorcomprometido: parseCurrencyToNumber($("#fondoValorTotal").val()), porcentaje_descuento: parseFloat($("#descuentoProveedor").val()) || 0, valor_comprometido: parseCurrencyToNumber($("#fondoValorTotal").val()), etiqueta_tipo_fondo: "TFPROVEDOR" });
    } else if (acProvBD && acProvBD.idpromocionacuerdo) {
        acuerdosModificados.push({ accion: 'D', idpromocionacuerdo: acProvBD.idpromocionacuerdo, idacuerdo: acProvBD.idacuerdo, porcentajedescuento: 0, valorcomprometido: 0, porcentaje_descuento: 0, valor_comprometido: 0 });
    }

    const idPropActual = parseInt($("#acuerdoPropioId").val(), 10) || 0;
    if (idPropActual > 0) {
        acuerdosModificados.push({ accion: (acPropBD && acPropBD.idpromocionacuerdo) ? 'U' : 'I', idpromocionacuerdo: (acPropBD && acPropBD.idpromocionacuerdo) ? acPropBD.idpromocionacuerdo : 0, idacuerdo: idPropActual, porcentajedescuento: parseFloat($("#descuentoPropio").val()) || 0, valorcomprometido: parseCurrencyToNumber($("#comprometidoPropio").val()), porcentaje_descuento: parseFloat($("#descuentoPropio").val()) || 0, valor_comprometido: parseCurrencyToNumber($("#comprometidoPropio").val()), etiqueta_tipo_fondo: "TFPROPIO" });
    } else if (acPropBD && acPropBD.idpromocionacuerdo) {
        acuerdosModificados.push({ accion: 'D', idpromocionacuerdo: acPropBD.idpromocionacuerdo, idacuerdo: acPropBD.idacuerdo, porcentajedescuento: 0, valorcomprometido: 0, porcentaje_descuento: 0, valor_comprometido: 0 });
    }

    const body = {
        idpromocion: parseInt($('#modalPromocionId').val(), 10) || 0,
        clasepromocion: $('#modalTipoPromocion').val() || "",
        promocion: {
            descripcion: $('#promocionDescripcion').val(), motivo: parseInt($('#promocionMotivo').val(), 10) || 0,
            fechahorainicio: unirFechaHora("promocionFechaInicio", "promocionHoraInicio"),
            fechahorafin: unirFechaHora("promocionFechaFin", "promocionHoraFin"),
            marcaregalo: $('#promocionMarcaRegalo').is(':checked') ? "✓" : "",
            idusuariomodifica: obtenerUsuarioActual(), nombreusuario: obtenerUsuarioActual()
        },
        acuerdos: acuerdosModificados, segmentos: segmentosValidados,
        ...(base64Completo ? {
            archivosoportebase64: base64Completo,
            nombrearchivosoporte: fileInput.name
        } : {}),
        rutaarchivoantiguo: promocionTemporal.cabecera.archivosoporte,
        idtipoproceso: tipoProceso ? tipoProceso.idcatalogo : 0,
        idopcion: getIdOpcionSeguro(), idcontrolinterfaz: "BTNGRABAR", ideventoetiqueta: "EVCLICK"
    };

    enviarGuardado(body);
}

async function guardarPromocionArticulos() {
    const $filas = $("#tablaArticulosBody tr");
    if ($filas.length === 0) {
        return Swal.fire("Validación", "Debe tener al menos un artículo en el detalle.", "warning");
    }

    const combos = await consultarCombos("TPMODIFICACION");
    const tipoProceso = combos && combos.length > 0 ? combos[0] : null;

    const fileInput = $('#inputArchivoSoporte')[0].files[0];
    const leerArchivo = file => new Promise((resolve, reject) => { const reader = new FileReader(); reader.readAsDataURL(file); reader.onload = () => resolve(reader.result); reader.onerror = e => reject(e); });
    const base64Completo = fileInput ? await leerArchivo(fileInput) : null;

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
        if (val === "3" || val === "7" || val === "4") return "C";
        return "C";
    };

    const segmentos = [
        { tiposegmento: "SEGCANAL", codigos: obtenerValorCampo("canal", "#segCanal", "3"), tipoasignacion: determinarAsignacion("#segCanal") },
        { tiposegmento: "SEGGRUPOALMACEN", codigos: obtenerValorCampo("grupo", "#segGrupoAlmacen", "3"), tipoasignacion: determinarAsignacion("#segGrupoAlmacen") },
        { tiposegmento: "SEGALMACEN", codigos: obtenerValorCampo("almacen", "#segAlmacen", "3"), tipoasignacion: determinarAsignacion("#segAlmacen") },
        { tiposegmento: "SEGTIPOCLIENTE", codigos: obtenerValorCampo("tipocliente", "#segTipoCliente", "3"), tipoasignacion: determinarAsignacion("#segTipoCliente") },
        { tiposegmento: "SEGMARCA", codigos: [], tipoasignacion: "T" },
        { tiposegmento: "SEGDIVISION", codigos: [], tipoasignacion: "T" },
        { tiposegmento: "SEGDEPARTAMENTO", codigos: [], tipoasignacion: "T" },
        { tiposegmento: "SEGCLASE", codigos: [], tipoasignacion: "T" },
        { tiposegmento: "SEGMEDIOPAGO", codigos: [], tipoasignacion: "T" }
    ];

    const articulos = [];
    let errorFila = "";

    $filas.each(function (index) {
        const $fila = $(this);
        const numFila = index + 1;
        const codigo = String($fila.data("codigo"));
        const accion = $fila.data("accion") || "U";
        const idPromocionArticulo = $fila.data("idpromocionarticulo") || 0;

        const costo = parseCurrencyToNumber($fila.find("td:eq(2)").text());
        const stockBodega = parseInt($fila.find("td:eq(3)").text()) || 0;
        const stockTienda = parseInt($fila.find("td:eq(4)").text()) || 0;
        const invOptimo = parseInt($fila.find("td:eq(5)").text()) || 0;
        const excedenteU = parseInt($fila.find("td:eq(6)").text()) || 0;
        const excedenteV = parseCurrencyToNumber($fila.find("td:eq(7)").text());
        const m0u = parseInt($fila.find("td:eq(8)").text()) || 0;
        const m0p = parseCurrencyToNumber($fila.find("td:eq(9)").text());
        const m1u = parseInt($fila.find("td:eq(10)").text()) || 0;
        const m1p = parseCurrencyToNumber($fila.find("td:eq(11)").text());
        const m2u = parseInt($fila.find("td:eq(12)").text()) || 0;
        const m2p = parseCurrencyToNumber($fila.find("td:eq(13)").text());
        const m12u = parseInt($fila.find("td:eq(14)").text()) || 0;
        const m12p = parseCurrencyToNumber($fila.find("td:eq(15)").text());

        const igualarPrecio = parseCurrencyToNumber($fila.find("td:eq(16)").text());
        const diasIgualar = parseInt($fila.find("td:eq(17)").text()) || 0;

        const margenMinContado = parseFloat($fila.find("td:eq(18)").text()) || 0;
        const margenMinTC = parseFloat($fila.find("td:eq(19)").text()) || 0;
        const margenMinCredito = parseFloat($fila.find("td:eq(20)").text()) || 0;
        const margenMinIgualar = parseFloat($fila.find("td:eq(21)").text()) || 0;

        const unidadesLimite = parseInt($fila.find("td:eq(22) input").val()) || 0;
        const proyeccionVtas = parseInt($fila.find("td:eq(23) input").val()) || 0;

        if (unidadesLimite > 0 && proyeccionVtas > 0) { errorFila = `Fila ${numFila}: Solo Unidades Límite O Proyección Vtas.`; return false; }
        if (unidadesLimite === 0 && proyeccionVtas === 0) { errorFila = `Fila ${numFila}: Ingrese Unidades Límite o Proyección Vtas.`; return false; }

        const $selectMedioPago = $fila.find("td:eq(24) select");
        const medioPagoVal = $selectMedioPago.val();
        const mediosPagoSeleccionados = $selectMedioPago.data("seleccionados") || [];

        const precioListaContado = parseCurrencyToNumber($fila.find("td:eq(25)").text());
        const precioListaCredito = parseCurrencyToNumber($fila.find("td:eq(26)").text());
        const precioContado = parseCurrencyToNumber($fila.find("td:eq(27) input").val());
        const precioTC = parseCurrencyToNumber($fila.find("td:eq(28) input").val());
        const precioCredito = parseCurrencyToNumber($fila.find("td:eq(29) input").val());
        const precioIgualar = parseCurrencyToNumber($fila.find("td:eq(30) input").val());

        const dsctoContado = parseFloat($fila.find("td:eq(31)").text()) || 0;
        const dsctoTC = parseFloat($fila.find("td:eq(32)").text()) || 0;
        const dsctoCredito = parseFloat($fila.find("td:eq(33)").text()) || 0;
        const dsctoIgualar = parseFloat($fila.find("td:eq(34)").text()) || 0;

        const aporteProveedor = parseCurrencyToNumber($fila.find(".aporte-proveedor").val());
        const idAcuerdoProveedor = parseInt($fila.find(".acuerdo-prov1-hidden").val()) || 0;

        const aporteProveedor2 = parseCurrencyToNumber($fila.find(".aporte-proveedor2").val());
        const idAcuerdoProveedor2 = parseInt($fila.find(".acuerdo-prov2-hidden").val()) || 0;

        const aporteRebate = parseCurrencyToNumber($fila.find(".aporte-rebate").val());
        const idAcuerdoRebate = parseInt($fila.find(".acuerdo-rebate-hidden").val()) || 0;

        const aportePropio = parseCurrencyToNumber($fila.find(".aporte-propio").val());
        const idAcuerdoPropio = parseInt($fila.find(".acuerdo-propio1-hidden").val()) || 0;

        const aportePropio2 = parseCurrencyToNumber($fila.find(".aporte-propio2").val());
        const idAcuerdoPropio2 = parseInt($fila.find(".acuerdo-propio2-hidden").val()) || 0;

        const compProveedor = parseCurrencyToNumber($fila.find("td:eq(51)").text());
        const compProveedor2 = parseCurrencyToNumber($fila.find("td:eq(52)").text());
        const compRebate = parseCurrencyToNumber($fila.find("td:eq(53)").text());
        const compPropio = parseCurrencyToNumber($fila.find("td:eq(54)").text());
        const compPropio2 = parseCurrencyToNumber($fila.find("td:eq(55)").text());

        const margenPLContado = parseFloat($fila.find("td:eq(45)").text()) || 0;
        const margenPLCredito = parseFloat($fila.find("td:eq(46)").text()) || 0; // NUEVO
        const margenContado = parseFloat($fila.find("td:eq(47)").text()) || 0;
        const margenTC = parseFloat($fila.find("td:eq(48)").text()) || 0;
        const margenCredito = parseFloat($fila.find("td:eq(49)").text()) || 0;
        const margenIgualar = parseFloat($fila.find("td:eq(50)").text()) || 0;

        const regalo = $fila.find("td:eq(56) input[type='checkbox']").is(":checked") ? "S" : "N";

        const acuerdosArticulo = [];
        if (idAcuerdoProveedor > 0) acuerdosArticulo.push({ idacuerdo: idAcuerdoProveedor, valoraporte: aporteProveedor, valorcomprometido: compProveedor, etiqueta_tipo_fondo: "TFPROVEDOR" });
        if (idAcuerdoProveedor2 > 0) acuerdosArticulo.push({ idacuerdo: idAcuerdoProveedor2, valoraporte: aporteProveedor2, valorcomprometido: compProveedor2, etiqueta_tipo_fondo: "TFPROVEDOR" });
        if (idAcuerdoRebate > 0) acuerdosArticulo.push({ idacuerdo: idAcuerdoRebate, valoraporte: aporteRebate, valorcomprometido: compRebate, etiqueta_tipo_fondo: "TFREBATE" });
        if (idAcuerdoPropio > 0) acuerdosArticulo.push({ idacuerdo: idAcuerdoPropio, valoraporte: aportePropio, valorcomprometido: compPropio, etiqueta_tipo_fondo: "TFPROPIO" });
        if (idAcuerdoPropio2 > 0) acuerdosArticulo.push({ idacuerdo: idAcuerdoPropio2, valoraporte: aportePropio2, valorcomprometido: compPropio2, etiqueta_tipo_fondo: "TFPROPIO" });

        const mediosPago = [];
        if (medioPagoVal === "7") { mediosPago.push({ tipoasignacion: "D", codigos: mediosPagoSeleccionados }); }
        else if (medioPagoVal && medioPagoVal !== "" && medioPagoVal !== "TODAS" && medioPagoVal !== "TODOS") { mediosPago.push({ tipoasignacion: "C", codigos: [medioPagoVal] }); }
        else { mediosPago.push({ tipoasignacion: "T", codigos: [] }); }

        const otrosCostosGuardados = $fila.data("detalle-otros-costos") || [];
        const otrosCostosMapeados = otrosCostosGuardados.map(oc => ({ codigoparametro: parseInt(oc.codigo, 10) || 0, costo: parseFloat(oc.valor) || 0 }));

        articulos.push({
            accion: accion,
            idpromocionarticulo: idPromocionArticulo,
            codigoitem: codigo, descripcion: $fila.find("td:eq(1)").text(),
            costo, stockbodega: stockBodega, stocktienda: stockTienda, inventariooptimo: invOptimo,
            excedenteunidad: excedenteU, excedentevalor: excedenteV,
            m0unidades: m0u, m0precio: m0p, m1unidades: m1u, m1precio: m1p, m2unidades: m2u, m2precio: m2p,
            m12unidades: m12u, m12precio: m12p, igualarprecio: igualarPrecio, diasantiguedad: diasIgualar,
            unidadeslimite: unidadesLimite, unidadesproyeccionventas: proyeccionVtas,
            preciolistacontado: precioListaContado, preciolistacredito: precioListaCredito,
            preciopromocioncontado: precioContado, preciopromociontarjetacredito: precioTC,
            preciopromocioncredito: precioCredito, precioigualarprecio: precioIgualar,
            descuentopromocioncontado: dsctoContado, descuentopromociontarjetacredito: dsctoTC,
            descuentopromocioncredito: dsctoCredito, descuentoigualarprecio: dsctoIgualar,
            margenminimocontado: margenMinContado, margenminimotarjetacredito: margenMinTC,
            margenminimocredito: margenMinCredito, margenminimoigualar: margenMinIgualar,
            margenpreciolistacontado: margenPLContado, margenpreciolistacredito: margenPLCredito,
            margenpromocioncontado: margenContado, margenpromociontarjetacredito: margenTC,
            margenpromocioncredito: margenCredito, margenigualarprecio: margenIgualar,
            marcaregalo: regalo,
            mediospago: mediosPago, acuerdos: acuerdosArticulo, otroscostos: otrosCostosMapeados
        });
    });

    if (errorFila) { return Swal.fire("Validación de Detalle", errorFila, "warning"); }

    const articulosBD = (promocionTemporal && promocionTemporal.articulos) ? promocionTemporal.articulos : [];
    const codigosEnTabla = articulos.map(a => a.codigoitem);
    articulosBD.forEach(artBD => {
        if (!codigosEnTabla.includes(artBD.codigoitem)) {
            articulos.push({
                accion: "D",
                idpromocionarticulo: artBD.idpromocionarticulo,
                codigoitem: artBD.codigoitem,
                descripcion: artBD.descripcion || "",
                costo: 0, stockbodega: 0, stocktienda: 0, inventariooptimo: 0,
                excedenteunidad: 0, excedentevalor: 0,
                m0unidades: 0, m0precio: 0, m1unidades: 0, m1precio: 0, m2unidades: 0, m2precio: 0,
                m12unidades: 0, m12precio: 0, igualarprecio: 0, diasantiguedad: 0,
                unidadeslimite: 0, unidadesproyeccionventas: 0,
                preciolistacontado: 0, preciolistacredito: 0,
                preciopromocioncontado: 0, preciopromociontarjetacredito: 0, preciopromocioncredito: 0,
                precioigualarprecio: 0,
                descuentopromocioncontado: 0, descuentopromociontarjetacredito: 0, descuentopromocioncredito: 0, descuentoigualarprecio: 0,
                margenminimocontado: 0, margenminimotarjetacredito: 0, margenminimocredito: 0, margenminimoigualar: 0,
                margenpreciolistacontado: 0, margenpreciolistacredito: 0,
                margenpromocioncontado: 0, margenpromociontarjetacredito: 0, margenpromocioncredito: 0, margenigualarprecio: 0,
                marcaregalo: "N", mediospago: [], acuerdos: [], otroscostos: []
            });
        }
    });

    const body = {
        idpromocion: parseInt($('#modalPromocionId').val(), 10) || 0,
        clasepromocion: $('#modalTipoPromocion').val() || "",
        promocion: {
            descripcion: $('#promocionDescripcion').val(), motivo: parseInt($('#promocionMotivo').val(), 10) || 0,
            fechahorainicio: unirFechaHora("promocionFechaInicio", "promocionHoraInicio"),
            fechahorafin: unirFechaHora("promocionFechaFin", "promocionHoraFin"),
            marcaregalo: $('#promocionMarcaRegalo').is(':checked') ? "✓" : "",
            idusuariomodifica: obtenerUsuarioActual(), nombreusuario: obtenerUsuarioActual()
        },
        acuerdos: [],
        segmentos: segmentos,
        articulos: articulos,
        ...(base64Completo ? {
            archivosoportebase64: base64Completo,
            nombrearchivosoporte: fileInput.name
        } : {}),
        rutaarchivoantiguo: promocionTemporal.cabecera.archivosoporte,
        idtipoproceso: tipoProceso ? tipoProceso.idcatalogo : 0,
        idopcion: getIdOpcionSeguro(), idcontrolinterfaz: "BTNGRABAR", ideventoetiqueta: "EVCLICK"
    };

    enviarGuardado(body);
}

async function guardarPromocionCombos() {
    const $filas = $("#tablaCombosBodyMod tr");
    if ($filas.length === 0) {
        return Swal.fire("Validación", "Debe tener al menos un combo en el detalle.", "warning");
    }

    const combos = await consultarCombos("TPMODIFICACION");
    const tipoProceso = combos && combos.length > 0 ? combos[0] : null;

    const fileInput = $('#inputArchivoSoporte')[0].files[0];
    const leerArchivo = file => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = e => reject(e);
    });
    const base64Completo = fileInput ? await leerArchivo(fileInput) : null;

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
        if (val === "3" || val === "7" || val === "4") return "C";
        return "C";
    };

    const segmentos = [
        { tiposegmento: "SEGCANAL", codigos: obtenerValorCampo("canal", "#segCanal", "3"), tipoasignacion: determinarAsignacion("#segCanal") },
        { tiposegmento: "SEGGRUPOALMACEN", codigos: obtenerValorCampo("grupo", "#segGrupoAlmacen", "3"), tipoasignacion: determinarAsignacion("#segGrupoAlmacen") },
        { tiposegmento: "SEGALMACEN", codigos: obtenerValorCampo("almacen", "#segAlmacen", "3"), tipoasignacion: determinarAsignacion("#segAlmacen") },
        { tiposegmento: "SEGTIPOCLIENTE", codigos: obtenerValorCampo("tipocliente", "#segTipoCliente", "3"), tipoasignacion: determinarAsignacion("#segTipoCliente") },
        { tiposegmento: "SEGMARCA", codigos: [], tipoasignacion: "T" },
        { tiposegmento: "SEGDIVISION", codigos: [], tipoasignacion: "T" },
        { tiposegmento: "SEGDEPARTAMENTO", codigos: [], tipoasignacion: "T" },
        { tiposegmento: "SEGCLASE", codigos: [], tipoasignacion: "T" },
        { tiposegmento: "SEGMEDIOPAGO", codigos: [], tipoasignacion: "T" }
    ];

    const articulos = [];
    const articulosComponentes = [];
    const idsEnTabla = [];

    $filas.each(function (index) {
        const $fila = $(this);
        const codigoCombo = String($fila.data("codigo"));
        const idPromocionArticulo = $fila.data("idpromocionarticulo") || 0;
        const accion = $fila.data("accion") || "U";
        const nombreCombo = $fila.data("combo-nombre") || "";
        const componentes = articulosPorComboMemoria[codigoCombo] || [];

        if (idPromocionArticulo > 0) idsEnTabla.push(idPromocionArticulo);

        const rnArticulo = index + 1;

        const listaComponentes = componentes.map(art => ({
            codigoarticulo: String(art.codigo),
            descripcion: art.descripcion,
            costo: art.costo || 0,
            stockbodega: art.stock || 0,
            stocktienda: art.stockTienda || 0,
            inventariooptimo: art.optimo || 0,
            excedenteu: art.excedenteu || 0,
            excedenteusd: art.excedentes || 0,
            ventahistoricam0u: art.m0u || 0, ventahistoricam0usd: art.m0s || 0,
            ventahistoricam1u: art.m1u || 0, ventahistoricam1usd: art.m1s || 0,
            ventahistoricam2u: art.m2u || 0, ventahistoricam2usd: art.m2s || 0,
            ventahistoricam12u: art.m12u || 0, ventahistoricam12usd: art.m12s || 0,
            margenminimocontado: 0, margenminimotarjetacredito: 0,
            margenminimopreciocredito: 0, margenminimoigualar: 0,
            preciolistacontado: 0, preciolistacredito: 0,
            preciopromocioncontado: art.promoContado || 0,
            preciopromociontarjetacredito: art.promoTC || 0,
            preciopromocioncredito: art.promoCredito || 0,
            descuentopromocioncontado: art.dsctoContado || 0,
            descuentopromociontarjetacredito: art.dsctoTC || 0,
            descuentopromocioncredito: art.dsctoCredito || 0,
            margenpreciolistacontado: art.margenPLContado || 0,
            margenpreciolistacredito: art.margenPLCredito || 0,
            margenpromocioncontado: art.margenPromoContado || 0,
            margenpromociontarjetacredito: art.margenPromoTC || 0,
            margenpromocioncredito: art.margenPromoCredito || 0,
            jsonacuerdos: [
                ...(art.idAcuerdoProveedor ? [{ idacuerdo: art.idAcuerdoProveedor, valoraporte: art.aporteProveedor, valorcomprometido: 0 }] : []),
                ...(art.idAcuerdoProveedor2 ? [{ idacuerdo: art.idAcuerdoProveedor2, valoraporte: art.aporteProveedor2, valorcomprometido: 0 }] : []),
                ...(art.idAcuerdoRebate ? [{ idacuerdo: art.idAcuerdoRebate, valoraporte: art.aporteRebate, valorcomprometido: 0 }] : []),
                ...(art.idAcuerdoPropio ? [{ idacuerdo: art.idAcuerdoPropio, valoraporte: art.aportePropio, valorcomprometido: 0 }] : []),
                ...(art.idAcuerdoPropio2 ? [{ idacuerdo: art.idAcuerdoPropio2, valoraporte: art.aportePropio2, valorcomprometido: 0 }] : [])
            ],
            jsonotroscostos: (art.otrosCostos || []).map(oc => ({
                codigo: parseInt(oc.codigo, 10) || 0,
                costos: parseFloat(oc.valor) || 0
            }))
        }));

        const esRegalo = $fila.find("td:last-child input").is(":checked") ? "S" : "N";

        articulos.push({
            accion: accion,
            idpromocionarticulo: idPromocionArticulo,
            codigoitem: codigoCombo,
            descripcion: nombreCombo,
            descripcioncombo: nombreCombo,
            costo: parseCurrencyToNumber($fila.find("td:eq(2)").text()),
            stockbodega: parseInt($fila.find("td:eq(3)").text()) || 0,
            stocktienda: parseInt($fila.find("td:eq(4)").text()) || 0,
            inventariooptimo: parseInt($fila.find("td:eq(5)").text()) || 0,
            excedenteunidad: parseInt($fila.find("td:eq(6)").text()) || 0,
            excedentevalor: parseCurrencyToNumber($fila.find("td:eq(7)").text()),
            m0unidades: 0, m0precio: 0, m1unidades: 0, m1precio: 0,
            m2unidades: 0, m2precio: 0, m12unidades: 0, m12precio: 0,
            igualarprecio: 0, diasantiguedad: 0,
            margenminimocontado: 0, margenminimotarjetacredito: 0,
            margenminimocredito: 0, margenminimoigualar: 0,
            unidadeslimite: parseInt($fila.find(".val-unidades-combo-mod").val()) || 0,
            unidadesproyeccionventas: parseInt($fila.find(".val-proyeccion-combo-mod").val()) || 0,
            preciolistacontado: parseCurrencyToNumber($fila.find("td:eq(11)").text()),
            preciolistacredito: parseCurrencyToNumber($fila.find("td:eq(12)").text()),
            preciopromocioncontado: parseCurrencyToNumber($fila.find("td:eq(13)").text()),
            preciopromociontarjetacredito: parseCurrencyToNumber($fila.find("td:eq(14)").text()),
            preciopromocioncredito: parseCurrencyToNumber($fila.find("td:eq(15)").text()),
            precioigualarprecio: 0,
            descuentopromocioncontado: parseCurrencyToNumber($fila.find("td:eq(16)").text()),
            descuentopromociontarjetacredito: parseCurrencyToNumber($fila.find("td:eq(17)").text()),
            descuentopromocioncredito: parseCurrencyToNumber($fila.find("td:eq(18)").text()),
            descuentoigualarprecio: 0,
            margenpreciolistacontado: 0, margenpreciolistacredito: 0,
            margenpromocioncontado: parseFloat($fila.find("td:eq(19)").text()) || 0,
            margenpromociontarjetacredito: parseFloat($fila.find("td:eq(20)").text()) || 0,
            margenpromocioncredito: parseFloat($fila.find("td:eq(21)").text()) || 0,
            margenigualarprecio: 0,
            marcaregalo: esRegalo,
            mediospago: (function () {
                const selMP = $fila.find(".select-mediopago-combo-final-mod");
                const valMP = selMP.val();
                const codesMP = selMP.data("seleccionados") || [];
                if (valMP === "7") return [{ tipoasignacion: "D", codigos: codesMP }];
                if (valMP && valMP !== "TODAS") return [{ tipoasignacion: "C", codigos: [valMP] }];
                return [{ tipoasignacion: "T", codigos: [] }];
            })(),
            acuerdos: [],
            otroscostos: []
        });

        articulosComponentes.push({
            rnarticulo: rnArticulo,
            componentes: listaComponentes
        });
    });

    // Detectar combos eliminados (estaban en BD pero no en la tabla)
    combosBDOriginal.forEach(idBD => {
        if (!idsEnTabla.includes(idBD)) {
            articulos.push({
                accion: "D",
                idpromocionarticulo: idBD,
                codigoitem: "",
                descripcion: "",
                costo: 0, stockbodega: 0, stocktienda: 0, inventariooptimo: 0,
                excedenteunidad: 0, excedentevalor: 0,
                m0unidades: 0, m0precio: 0, m1unidades: 0, m1precio: 0,
                m2unidades: 0, m2precio: 0, m12unidades: 0, m12precio: 0,
                igualarprecio: 0, diasantiguedad: 0,
                unidadeslimite: 0, unidadesproyeccionventas: 0,
                preciolistacontado: 0, preciolistacredito: 0,
                preciopromocioncontado: 0, preciopromociontarjetacredito: 0,
                preciopromocioncredito: 0, precioigualarprecio: 0,
                descuentopromocioncontado: 0, descuentopromociontarjetacredito: 0,
                descuentopromocioncredito: 0, descuentoigualarprecio: 0,
                margenminimocontado: 0, margenminimotarjetacredito: 0,
                margenminimocredito: 0, margenminimoigualar: 0,
                margenpreciolistacontado: 0, margenpreciolistacredito: 0,
                margenpromocioncontado: 0, margenpromociontarjetacredito: 0,
                margenpromocioncredito: 0, margenigualarprecio: 0,
                marcaregalo: "N", mediospago: [], acuerdos: [], otroscostos: []
            });
        }
    });

    const body = {
        idpromocion: parseInt($('#modalPromocionId').val(), 10) || 0,
        clasepromocion: $('#modalTipoPromocion').val() || "",
        promocion: {
            descripcion: $('#promocionDescripcion').val(),
            motivo: parseInt($('#promocionMotivo').val(), 10) || 0,
            fechahorainicio: unirFechaHora("promocionFechaInicio", "promocionHoraInicio"),
            fechahorafin: unirFechaHora("promocionFechaFin", "promocionHoraFin"),
            marcaregalo: $('#promocionMarcaRegalo').is(':checked') ? "✓" : "",
            idusuariomodifica: obtenerUsuarioActual(),
            nombreusuario: obtenerUsuarioActual()
        },
        acuerdos: [],
        segmentos: segmentos,
        articulos: articulos,
        articulos_componentes: articulosComponentes,
        ...(base64Completo ? {
            archivosoportebase64: base64Completo,
            nombrearchivosoporte: fileInput.name
        } : {}),
        rutaarchivoantiguo: promocionTemporal.cabecera.archivosoporte,
        idtipoproceso: tipoProceso ? tipoProceso.idcatalogo : 0,
        idopcion: getIdOpcionSeguro(),
        idcontrolinterfaz: "BTNGRABAR",
        ideventoetiqueta: "EVCLICK"
    };

    enviarGuardado(body);
}

function enviarGuardado(body) {
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

// ===============================================================
// FUNCIONES AUXILIARES
// ===============================================================
function esArchivoValido(inputSelector, spanSelector) {
    const $input = $(inputSelector);
    const fileNameSpan = $(spanSelector)[0];
    const file = $input[0].files[0];
    if (!file) return false;
    const tamanoMaxMB = parseFloat($input.data('max-mb')) || 5;
    const tamanoMaxBytes = tamanoMaxMB * 1024 * 1024;
    const acceptAttr = $input.attr('accept') || "";
    const extensionesPermitidas = acceptAttr.replace(/\./g, '').split(',').map(ext => ext.trim().toLowerCase());
    const extensionArchivo = file.name.split('.').pop().toLowerCase();
    if (acceptAttr !== "" && !extensionesPermitidas.includes(extensionArchivo)) { Swal.fire("Extensión no permitida", `Solo se aceptan: ${acceptAttr}`, "error"); $input.val(''); if (fileNameSpan) fileNameSpan.textContent = "Archivo no válido"; return false; }
    if (file.size > tamanoMaxBytes) { Swal.fire("Archivo muy pesado", `El límite es de ${tamanoMaxMB}MB`, "error"); $input.val(''); if (fileNameSpan) fileNameSpan.textContent = "Archivo muy pesado"; return false; }
    if (fileNameSpan) fileNameSpan.textContent = file.name;
    return true;
}

function initDatepickers() {
    if (!$.datepicker) return;
    $.datepicker.setDefaults($.datepicker.regional["es"] || {});
    $('#promocionFechaInicio').datepicker({ dateFormat: "dd/mm/yy", onSelect: function () { const d = $(this).datepicker("getDate"); if (d) { d.setDate(d.getDate() + 1); $('#promocionFechaFin').datepicker("option", "minDate", d); } } });
    $('#promocionFechaFin').datepicker({ dateFormat: "dd/mm/yy", minDate: 1 });
    $('#btnFechaInicio').click(() => $('#promocionFechaInicio').datepicker('show'));
    $('#btnFechaFin').click(() => $('#promocionFechaFin').datepicker('show'));
}

// ===============================================================
// FUNCIONES VISOR PDF
// ===============================================================
function abrirVisorPDF(nombreArchivo) {
    $("#pdfSpinner").show(); $("#pdfVisorContenido").hide(); $("#pdfVisorError").hide(); $("#btnDescargarPdf").hide();
    $("#modalVisorPdfLabel .pdf-nombre-archivo").text(obtenerNombreArchivo(nombreArchivo) || "Soporte");
    const modal = new bootstrap.Modal(document.getElementById("modalVisorPdf")); modal.show();
    fetchPDFDirecto(nombreArchivo);
}

function fetchPDFDirecto(nombreArchivo) {
    let baseUrl = (window.apiBaseUrl || "http://localhost:5074").replace("/api/router-proxy/execute", "");
    const url = `${baseUrl}/api/Descargas/descargar/${encodeURIComponent(nombreArchivo)}`;
    fetch(url).then(function (response) { if (!response.ok) return response.text().then(txt => { throw new Error(txt || `Error HTTP ${response.status}`); }); return response.blob(); })
        .then(function (blob) {
            const blobUrl = URL.createObjectURL(new Blob([blob], { type: "application/pdf" }));
            $("#pdfIframe").attr("src", blobUrl); $("#pdfSpinner").hide(); $("#pdfVisorContenido").show();
            $("#btnDescargarPdf").data("blob-url", blobUrl).data("nombre-archivo", obtenerNombreArchivo(nombreArchivo) || "soporte.pdf").show();
        }).catch(function (error) { $("#pdfSpinner").hide(); $("#pdfVisorError").html(`<i class="fa-solid fa-triangle-exclamation me-2"></i> ${error.message}`).show(); });
}

function cerrarVisorPDF() {
    const blobUrl = $("#btnDescargarPdf").data("blob-url");
    if (blobUrl) { URL.revokeObjectURL(blobUrl); $("#btnDescargarPdf").removeData("blob-url"); }
    const iframe = document.getElementById("pdfIframe"); if (iframe) iframe.src = "about:blank";
    const modal = bootstrap.Modal.getInstance(document.getElementById("modalVisorPdf")); if (modal) modal.hide();
}