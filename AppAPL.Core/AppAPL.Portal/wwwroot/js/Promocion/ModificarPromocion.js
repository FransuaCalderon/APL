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
        return `<button type="button" class="btn btn-success btn-sm select-mediopago-articulo" style="font-size:0.7rem;" data-seleccionados='${JSON.stringify(codigos)}'><i class="fa-solid fa-list-check"></i> Varios (${items.length})</button>`;
    }

    const opciones = generarOpcionesMedioPago();
    const valor = items.length === 1 ? items[0].codigo_detalle : "";
    return `<select class="form-select form-select-sm select-mediopago-articulo" disabled>${opciones}</select>`;
}

function generarHtmlOtrosCostosArticulo(articulosotros, idPromocionArticulo) {
    const items = (articulosotros || []).filter(s => s.idpromocionarticulo === idPromocionArticulo);
    const total = items.reduce((sum, oc) => sum + (parseFloat(oc.costo) || 0), 0);

    const detalleJson = JSON.stringify(items.map(i => ({ codigo: i.idpromocionarticulo, nombre: i.descripcion, valor: i.costo })));

    if (items.length > 0) {
        return `<button type="button" class="btn btn-success btn-sm btn-ver-otroscostos-fila" style="font-size:0.7rem;" data-detalle='${detalleJson}' data-total="${total}"><i class="fa-solid fa-coins"></i> $${total.toFixed(2)}</button>`;
    }
    return `<span class="text-muted">N/A</span>`;
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

function formatearFechaHora(fechaString) {
    if (!fechaString) return "";
    const fecha = new Date(fechaString);
    if (isNaN(fecha.getTime())) return "";
    const dia = fecha.getDate().toString().padStart(2, '0');
    const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
    const anio = fecha.getFullYear();
    const horas = fecha.getHours().toString().padStart(2, '0');
    const minutos = fecha.getMinutes().toString().padStart(2, '0');
    return `${dia}/${mes}/${anio} ${horas}:${minutos}`;
}

function obtenerSoloFecha(fechaString) {
    if (!fechaString || !fechaString.includes("T")) return "";
    const parteFecha = fechaString.split("T")[0];
    const [anio, mes, dia] = parteFecha.split("-");
    return `${dia}/${mes}/${anio}`;
}

function obtenerSoloHora(fechaString) {
    if (!fechaString || !fechaString.includes("T")) return "00:00";
    const parteHora = fechaString.split("T")[1];
    return parteHora.substring(0, 5);
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

function toISOFromDDMMYYYYHHMM(s) {
    if (!s || !isValidDateDDMMYYYYHHMM(s)) return null;
    const partes = s.split(" ");
    const [dd, mm, yyyy] = partes[0].split("/").map(Number);
    let hh = 0, min = 0;
    if (partes[1]) {
        const tiempo = partes[1].split(":");
        hh = Number(tiempo[0]);
        min = Number(tiempo[1]);
    }
    return new Date(yyyy, mm - 1, dd, hh, min).toISOString();
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

// Retorna el tipo de promoción actual (etiqueta)
function getTipoPromocionActual() {
    return ($('#modalTipoPromocion').val() || "PRGENERAL").toUpperCase();
}

function esPromocionArticulo() {
    return getTipoPromocionActual() === "PRARTICULO";
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

            // Guardar datos para el modal de Items
            window._filtrosJerarquiaData = data;
        }
    });
}

// ===============================================================
// CONSULTAR ALMACENES (FILTRADO POR GRUPO)
// ===============================================================
function consultarAlmacenes(codigoGrupo = undefined) {
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
            console.log("cantidad de almacenes consultados: ", listaAlmacenes.length);
            llenarComboYModal($("#segAlmacen"), $("#bodyModalAlmacen"), listaAlmacenes, "Seleccione...", "3", "almacen", "Todos");
        }
    });
}

function cargarCombosPromociones() {
    const payload = { code_app: "APP20260128155212346", http_method: "GET", endpoint_path: "api/Promocion/consultar-combos-promociones", client: "APL", endpoint_query_params: "" };
    $.ajax({
        url: "/api/apigee-router-proxy", method: "POST", contentType: "application/json", data: JSON.stringify(payload),
        success: function (res) {
            const data = res.json_response || {};

            // Filtrar medios de pago (excluir "TODOS"/"TODAS" y código "0")
            let mediosPagoFiltrados = (data.mediospagos || []).filter(m => {
                let nom = (m.nombre || "").toUpperCase();
                return nom !== "TODOS" && nom !== "TODAS" && m.codigo !== "0";
            });

            // Guardar medios de pago filtrados para uso en artículos
            window._mediosPagoData = mediosPagoFiltrados;

            llenarComboYModal($("#segCanal"), $("#bodyModalCanal"), data.canales, "Seleccione...", "3", "canal");
            llenarComboYModal($("#segGrupoAlmacen"), $("#bodyModalGrupoAlmacen"), data.gruposalmacenes, "Seleccione...", "3", "grupo", "Todos");

            // Almacenes se cargan por separado (filtrados por grupo)
            consultarAlmacenes();

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
    if (textoTodas) {
        $select.append(`<option value="TODAS">${textoTodas}</option>`);
    }
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
        $select.val("").trigger("change");
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

// ===============================================================
// CONSULTA DE ACUERDOS MODALES (GENERAL)
// ===============================================================
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
            <td class="align-middle text-end">${item.igualarprecio || 0}</td>
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
                <input type="hidden" class="acuerdo-id-hidden" value="${item._idAcuerdoProveedor || ''}">
                <div class="input-group input-group-sm">
                    <input type="text" class="form-control form-control-sm" value="${item._displayAcuerdoProveedor || ''}" placeholder="Seleccione..." readonly disabled>
                    <button class="btn btn-outline-secondary btn-buscar-acuerdo-art" type="button" data-tipofondo="TFPROVEDOR" disabled><i class="fa-solid fa-magnifying-glass"></i></button>
                </div>
            </td>
            <td class="align-middle"><input type="text" class="form-control form-control-sm text-end aporte-valor aporte-rebate" value="${item._aporteRebate || ''}" placeholder="0.00" disabled></td>
            <td class="align-middle celda-editable">
                <input type="hidden" class="acuerdo-id-hidden" value="${item._idAcuerdoRebate || ''}">
                <div class="input-group input-group-sm">
                    <input type="text" class="form-control form-control-sm" value="${item._displayAcuerdoRebate || ''}" placeholder="Seleccione..." readonly disabled>
                    <button class="btn btn-outline-secondary btn-buscar-acuerdo-art" type="button" data-tipofondo="TFREBATE" disabled><i class="fa-solid fa-magnifying-glass"></i></button>
                </div>
            </td>
            <td class="align-middle celda-editable"><input type="text" class="form-control form-control-sm text-end aporte-valor aporte-propio" value="${item._aportePropio || ''}" placeholder="0.00" disabled></td>
            <td class="align-middle celda-editable">
                <input type="hidden" class="acuerdo-id-hidden" value="${item._idAcuerdoPropio || ''}">
                <div class="input-group input-group-sm">
                    <input type="text" class="form-control form-control-sm" value="${item._displayAcuerdoPropio || ''}" placeholder="Seleccione..." readonly disabled>
                    <button class="btn btn-outline-secondary btn-buscar-acuerdo-art" type="button" data-tipofondo="TFPROPIO" disabled><i class="fa-solid fa-magnifying-glass"></i></button>
                </div>
            </td>
            <td class="align-middle text-end">${parseFloat(item.margenpreciolistacontado || 0).toFixed(2)}%</td>
            <td class="align-middle text-end">${parseFloat(item.margenpromocioncontado || 0).toFixed(2)}%</td>
            <td class="align-middle text-end">${parseFloat(item.margenpromociontarjetacredito || 0).toFixed(2)}%</td>
            <td class="align-middle text-end">${parseFloat(item.margenpromocioncredito || 0).toFixed(2)}%</td>
            <td class="align-middle text-end">${parseFloat(item.margenigualarprecio || 0).toFixed(2)}%</td>
            <td class="align-middle text-end">${formatCurrencySpanish(0)}</td>
            <td class="align-middle text-end">${formatCurrencySpanish(0)}</td>
            <td class="align-middle text-end">${formatCurrencySpanish(0)}</td>
            <td class="align-middle celda-editable text-center"><input class="form-check-input" type="checkbox" ${(item.marcaregalo || "").toString().toUpperCase() === "S" ? "checked" : ""} disabled></td>
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

        // Obtener acuerdos del artículo
        const acuerdosArt = articulosacuerdos.filter(a => a.idpromocionarticulo === idPromocionArticulo);
        const acProv = acuerdosArt.find(a => (a.etiqueta_tipo_fondo || "").toUpperCase() === "TFPROVEDOR");
        const acRebate = acuerdosArt.find(a => (a.etiqueta_tipo_fondo || "").toUpperCase() === "TFREBATE");
        const acPropio = acuerdosArt.find(a => (a.etiqueta_tipo_fondo || "").toUpperCase() === "TFPROPIO");

        const provDisplay = acProv ? `${acProv.idacuerdo} - ${acProv.nombre_proveedor || ""}` : "";
        const rebateDisplay = acRebate ? `${acRebate.idacuerdo} - ${acRebate.nombre_proveedor || ""}` : "";
        const propioDisplay = acPropio ? `${acPropio.idacuerdo} - ${acPropio.nombre_proveedor || ""}` : "";

        const apProv = acProv ? (acProv.valor_aporte || 0) : 0;
        const apReb = acRebate ? (acRebate.valor_aporte || 0) : 0;
        const apProp = acPropio ? (acPropio.valor_aporte || 0) : 0;

        // Medio de pago del artículo
        const mpItems = (articulossegmentos || []).filter(s => s.codigoitem === codigoItem && (s.etiqueta_tipo_segmento || "").toUpperCase() === "SEGMEDIOPAGO");

        // Otros costos del artículo
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
            <td class="align-middle text-end">${art.igualarprecio || 0}</td>
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
            <td class="align-middle celda-editable"><input type="text" class="form-control form-control-sm text-end" value="${art.preciopromocioncontado || ''}" placeholder="0.00" disabled></td>
            <td class="align-middle celda-editable"><input type="text" class="form-control form-control-sm text-end" value="${art.preciopromociontarjetacredito || ''}" placeholder="0.00" disabled></td>
            <td class="align-middle celda-editable"><input type="text" class="form-control form-control-sm text-end" value="${art.preciopromocioncredito || ''}" placeholder="0.00" disabled></td>
            <td class="align-middle celda-editable"><input type="text" class="form-control form-control-sm text-end" value="${art.precioigualarprecio || ''}" placeholder="0.00" disabled></td>
            <td class="align-middle text-end">${parseFloat(art.descuentopromocioncontado || 0).toFixed(2)}</td>
            <td class="align-middle text-end">${parseFloat(art.descuentopromociontarjetacredito || 0).toFixed(2)}</td>
            <td class="align-middle text-end">${parseFloat(art.descuentopromocioncredito || 0).toFixed(2)}</td>
            <td class="align-middle text-end">${parseFloat(art.descuentoigualarprecio || 0).toFixed(2)}</td>
            <td class="align-middle"><input type="text" class="form-control form-control-sm text-end aporte-valor aporte-proveedor" value="${apProv || ''}" placeholder="0.00" disabled></td>
            <td class="align-middle celda-editable">
                <input type="hidden" class="acuerdo-id-hidden" value="${acProv ? acProv.idacuerdo : ''}">
                <div class="input-group input-group-sm">
                    <input type="text" class="form-control form-control-sm" value="${provDisplay}" placeholder="Seleccione..." readonly disabled>
                    <button class="btn btn-outline-secondary btn-buscar-acuerdo-art" type="button" data-tipofondo="TFPROVEDOR" disabled><i class="fa-solid fa-magnifying-glass"></i></button>
                </div>
            </td>
            <td class="align-middle"><input type="text" class="form-control form-control-sm text-end aporte-valor aporte-rebate" value="${apReb || ''}" placeholder="0.00" disabled></td>
            <td class="align-middle celda-editable">
                <input type="hidden" class="acuerdo-id-hidden" value="${acRebate ? acRebate.idacuerdo : ''}">
                <div class="input-group input-group-sm">
                    <input type="text" class="form-control form-control-sm" value="${rebateDisplay}" placeholder="Seleccione..." readonly disabled>
                    <button class="btn btn-outline-secondary btn-buscar-acuerdo-art" type="button" data-tipofondo="TFREBATE" disabled><i class="fa-solid fa-magnifying-glass"></i></button>
                </div>
            </td>
            <td class="align-middle celda-editable"><input type="text" class="form-control form-control-sm text-end aporte-valor aporte-propio" value="${apProp || ''}" placeholder="0.00" disabled></td>
            <td class="align-middle celda-editable">
                <input type="hidden" class="acuerdo-id-hidden" value="${acPropio ? acPropio.idacuerdo : ''}">
                <div class="input-group input-group-sm">
                    <input type="text" class="form-control form-control-sm" value="${propioDisplay}" placeholder="Seleccione..." readonly disabled>
                    <button class="btn btn-outline-secondary btn-buscar-acuerdo-art" type="button" data-tipofondo="TFPROPIO" disabled><i class="fa-solid fa-magnifying-glass"></i></button>
                </div>
            </td>
            <td class="align-middle text-end">${(art.margenpreciolistacontado || 0).toFixed(2)}%</td>
            <td class="align-middle text-end">${(art.margenpromocioncontado || 0).toFixed(2)}%</td>
            <td class="align-middle text-end">${(art.margenpromociontarjetacredito || 0).toFixed(2)}%</td>
            <td class="align-middle text-end">${(art.margenpromocioncredito || 0).toFixed(2)}%</td>
            <td class="align-middle text-end">${(art.margenigualarprecio || 0).toFixed(2)}%</td>
            <td class="align-middle text-end">${formatCurrencySpanish(0)}</td>
            <td class="align-middle text-end">${formatCurrencySpanish(0)}</td>
            <td class="align-middle text-end">${formatCurrencySpanish(0)}</td>
            <td class="align-middle celda-editable text-center"><input class="form-check-input" type="checkbox" ${esRegalo ? "checked" : ""} disabled></td>
        </tr>`;
        $tbody.append(fila);

        // Guardar datos de otros costos en la fila
        const $filaAppended = $tbody.find(`tr[data-codigo="${codigoItem}"]`).last();
        $filaAppended.data("total-otros-costos", totalOtrosCostos);
        $filaAppended.data("detalle-otros-costos", otrosCostosArt.map(oc => ({
            codigo: oc.idpromocionarticulo,
            nombre: oc.descripcion,
            valor: parseFloat(oc.costo) || 0
        })));

        // Poblar medio de pago
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
    });

    // Seleccionar primera fila
    if ($tbody.find("tr").length > 0) {
        $tbody.find("tr").first().find(".item-row-radio").prop("checked", true).trigger("change");
    }
}

function recalcularFilaArticulo($fila) {
    const costo = parseCurrencyToNumber($fila.find("td:eq(2)").text());
    const precioLista = parseCurrencyToNumber($fila.find("td:eq(22)").text());
    const precioContado = parseCurrencyToNumber($fila.find("td:eq(23) input").val());
    const precioTC = parseCurrencyToNumber($fila.find("td:eq(24) input").val());
    const precioCredito = parseCurrencyToNumber($fila.find("td:eq(25) input").val());
    const precioIgualar = parseCurrencyToNumber($fila.find("td:eq(26) input").val());
    const aporteProveedor = parseCurrencyToNumber($fila.find(".aporte-proveedor").val());
    const aporteRebate = parseCurrencyToNumber($fila.find(".aporte-rebate").val());
    const otrosCostos = parseFloat($fila.data("total-otros-costos")) || 0;
    const unidadesLimite = parseInt($fila.find("td:eq(19) input").val()) || 0;
    const proyeccionVtas = parseInt($fila.find("td:eq(20) input").val()) || 0;
    const unidades = unidadesLimite > 0 ? unidadesLimite : proyeccionVtas;

    // Descuentos
    $fila.find("td:eq(27)").text((precioLista - precioContado).toFixed(2));
    $fila.find("td:eq(28)").text((precioLista - precioTC).toFixed(2));
    $fila.find("td:eq(29)").text((precioLista - precioCredito).toFixed(2));
    $fila.find("td:eq(30)").text((precioLista - precioIgualar).toFixed(2));

    // Margen PL
    const margenPL = precioLista > 0 ? ((precioLista - costo) / precioLista * 100) : 0;
    $fila.find("td:eq(37)").text(margenPL.toFixed(2) + "%");

    // Márgenes
    const calcMargen = (precioPromocion) => {
        const denominador = precioPromocion + aporteProveedor + aporteRebate;
        if (denominador > 0) return ((denominador - costo - otrosCostos) / denominador) * 100;
        return 0;
    };
    $fila.find("td:eq(38)").text(calcMargen(precioContado).toFixed(2) + "%");
    $fila.find("td:eq(39)").text(calcMargen(precioTC).toFixed(2) + "%");
    $fila.find("td:eq(40)").text(calcMargen(precioCredito).toFixed(2) + "%");
    $fila.find("td:eq(41)").text(calcMargen(precioIgualar).toFixed(2) + "%");

    // Comprometidos
    $fila.find("td:eq(42)").text(formatCurrencySpanish(aporteProveedor * unidades));
    $fila.find("td:eq(43)").text(formatCurrencySpanish(aporteRebate * unidades));
    const aportePropio = parseCurrencyToNumber($fila.find("td:eq(35) input").val());
    $fila.find("td:eq(44)").text(formatCurrencySpanish(aportePropio * unidades));

    // Colores
    $fila.find("td:eq(27), td:eq(28), td:eq(29), td:eq(30), td:eq(37), td:eq(38), td:eq(39), td:eq(40), td:eq(41)").each(function () {
        const valor = parseFloat($(this).text());
        if (valor < 0) $(this).css("color", "#dc3545");
        else if (valor > 0) $(this).css("color", "#198754");
        else $(this).css("color", "#212529");
    });
}

// ===============================================================
// ACUERDOS POR ARTÍCULO
// ===============================================================
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

function abrirModalAcuerdoArticulo(tipoFondo, tituloModal, codigoItem, $inputDisplay, $inputId) {
    acuerdoArticuloTemporal = null;
    acuerdoArticuloContexto = { tipoFondo, codigoItem, $inputDisplay, $inputId, idActual: $inputId.val() };
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
    if (dtItemsConsultaPromo) { dtItemsConsultaPromo.clear().draw(); $('.dataTables_empty').text("Cargando resultados..."); }
    const payload = { code_app: "APP20260128155212346", http_method: "POST", endpoint_path: "api/Acuerdo/consultar-articulos", client: "APL", body_request: filtros };

    $.ajax({
        url: "/api/apigee-router-proxy", method: "POST", contentType: "application/json", data: JSON.stringify(payload),
        success: function (res) {
            const data = res.json_response || [];
            const filas = data.map(item => [
                `<input type="checkbox" class="form-check-input item-checkbox" data-codigo="${item.codigo || ''}" data-descripcion="${item.descripcion || ''}" data-costo="${item.costo || 0}" data-stock="${item.stock || 0}" data-optimo="${item.optimo || 0}" data-excedenteu="${item.excedente_u || 0}" data-excedentes="${item.excedente_s || 0}" data-m0u="${item.m0_u || 0}" data-m0s="${item.m0_s || 0}" data-m1u="${item.m1_u || 0}" data-m1s="${item.m1_s || 0}" data-m2u="${item.m2_u || 0}" data-m2s="${item.m2_s || 0}">`,
                item.codigo || "", item.descripcion || "", formatCurrencySpanish(item.costo || 0),
                item.stock || 0, item.optimo || 0, item.excedente_u || 0, formatCurrencySpanish(item.excedente_s || 0),
                item.m0_u || 0, formatCurrencySpanish(item.m0_s || 0), item.m1_u || 0, formatCurrencySpanish(item.m1_s || 0),
                item.m2_u || 0, formatCurrencySpanish(item.m2_s || 0)
            ]);
            if (dtItemsConsultaPromo) { dtItemsConsultaPromo.clear(); dtItemsConsultaPromo.rows.add(filas); dtItemsConsultaPromo.draw(); }
            $("#buscarItemModal").off("keyup").on("keyup", function () { if (dtItemsConsultaPromo) dtItemsConsultaPromo.search($(this).val()).draw(); });
        }
    });
}

// ===============================================================
// SERVICIOS ADICIONALES (Equivalentes, Precios Competencia, Otros Costos)
// ===============================================================
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
// DOCUMENT READY
// ===============================================================
$(document).ready(function () {
    cargarFiltrosJerarquia();
    cargarCombosPromociones();
    initLogicaSeleccionMultiple();
    initValidacionesFinancieras();
    initDatepickers();

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
        abrirVisorPDF(obtenerNombreArchivoConGuid(ruta));
    });

    $("#btnCerrarVisorPdf, #btnCerrarVisorPdfFooter").on("click", function () { cerrarVisorPDF(); });
    $("#btnDescargarPdf").on("click", function () {
        const url = $(this).data("blob-url"); const nombre = $(this).data("nombre-archivo");
        if (url) { const a = document.createElement("a"); a.href = url; a.download = nombre || "soporte.pdf"; document.body.appendChild(a); a.click(); document.body.removeChild(a); }
    });

    // Recargar almacenes al cambiar Grupo Almacén
    $("#segGrupoAlmacen").on("change", function () {
        const codigoGrupo = $(this).val();
        if (codigoGrupo && codigoGrupo !== "" && codigoGrupo !== "TODAS" && codigoGrupo !== "3") {
            consultarAlmacenes(codigoGrupo);
        } else if (codigoGrupo === "TODAS" || codigoGrupo === "") {
            consultarAlmacenes();
        }
    });

    // Modales de Acuerdo (General)
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

    // Selección de fila de artículo
    $(document).off("change", ".item-row-radio").on("change", ".item-row-radio", function () {
        $("#tablaArticulosBody tr").removeClass("table-active");
        $("#tablaArticulosBody .celda-editable input, #tablaArticulosBody .celda-editable button, #tablaArticulosBody .celda-editable select").prop("disabled", true);
        $("#tablaArticulosBody .aporte-proveedor, #tablaArticulosBody .aporte-rebate, #tablaArticulosBody .aporte-propio").prop("disabled", true);
        $("#tablaArticulosBody td:last-child input[type='checkbox']").prop("disabled", true);

        const $fila = $(this).closest("tr");
        $fila.addClass("table-active");
        $fila.find(".celda-editable input, .celda-editable button, .celda-editable select").not(".aporte-proveedor, .aporte-rebate, .aporte-propio").prop("disabled", false);

        if ($fila.find("td:eq(32) .acuerdo-id-hidden").val()) $fila.find(".aporte-proveedor").prop("disabled", false);
        if ($fila.find("td:eq(34) .acuerdo-id-hidden").val()) $fila.find(".aporte-rebate").prop("disabled", false);
        if ($fila.find("td:eq(36) .acuerdo-id-hidden").val()) $fila.find(".aporte-propio").prop("disabled", false);
        $fila.find("td:last-child input[type='checkbox']").prop("disabled", false);
    });

    // Búsqueda de acuerdos por artículo
    $(document).on("click", ".btn-buscar-acuerdo-art", function () {
        const $btn = $(this); const tipoFondo = $btn.data("tipofondo");
        const $fila = $btn.closest("tr"); const codigoItem = $fila.data("codigo");
        const $inputDisplay = $btn.closest(".input-group").find("input[type='text']");
        const $inputId = $btn.closest("td").find("input.acuerdo-id-hidden");
        const titulos = { "TFPROVEDOR": "Acuerdos - Fondo Proveedor", "TFREBATE": "Acuerdos - Fondo Rebate", "TFPROPIO": "Acuerdos - Fondo Propio" };
        abrirModalAcuerdoArticulo(tipoFondo, titulos[tipoFondo] || "Acuerdos", codigoItem, $inputDisplay, $inputId);
    });

    // Aceptar acuerdo artículo
    $("#btnAceptarAcuerdoArticulo").on("click", function () {
        if (!acuerdoArticuloTemporal) { Swal.fire({ icon: "info", title: "Atención", text: "Debe seleccionar un acuerdo." }); return; }
        if (acuerdoArticuloContexto) {
            acuerdoArticuloContexto.$inputDisplay.val(acuerdoArticuloTemporal.display);
            acuerdoArticuloContexto.$inputId.val(acuerdoArticuloTemporal.idAcuerdo);
            const $fila = acuerdoArticuloContexto.$inputId.closest("tr");
            const tipo = acuerdoArticuloContexto.tipoFondo;
            const maxVal = acuerdoArticuloTemporal.valorAcuerdo || 0;
            if (tipo === "TFPROVEDOR") $fila.find(".aporte-proveedor").prop("disabled", false).attr("data-max", maxVal).val("");
            else if (tipo === "TFREBATE") $fila.find(".aporte-rebate").prop("disabled", false).attr("data-max", maxVal).val("");
            else if (tipo === "TFPROPIO") $fila.find(".aporte-propio").prop("disabled", false).attr("data-max", maxVal).val("");
            recalcularFilaArticulo($fila);
        }
        $("#modalAcuerdoArticulo").modal("hide");
        acuerdoArticuloTemporal = null; acuerdoArticuloContexto = null;
    });

    // Recalcular al editar inputs de artículos
    $(document).on("input change", "#tablaArticulosBody input[type='text'], #tablaArticulosBody input[type='number']", function () {
        this.value = this.value.replace(/[^0-9.,]/g, '');
        recalcularFilaArticulo($(this).closest("tr"));
    });

    // Validar aportes vs acuerdo
    $(document).on("blur", "#tablaArticulosBody .aporte-proveedor, #tablaArticulosBody .aporte-rebate, #tablaArticulosBody .aporte-propio", function () {
        const max = parseFloat($(this).attr("data-max")) || 0;
        const valor = parseCurrencyToNumber($(this).val());
        if (max > 0 && valor > max) {
            Swal.fire({ icon: 'warning', title: 'Valor Excedido', text: `El aporte ($${valor.toFixed(2)}) supera el valor del acuerdo ($${max.toFixed(2)}).` });
            $(this).val("").addClass("is-invalid");
        } else { $(this).removeClass("is-invalid"); }
    });

    // Medio de pago por artículo
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

    // Añadir artículos
    $("#btnAddItemArticulos").on("click", function () {
        // Se abre el modal de consulta de items
    });

    // Modal consulta items
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
                    { title: "M-2($)", className: "align-middle text-end" }
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

    $("#btnSeleccionarItems").on("click", function () {
        const items = [];
        const checkboxes = dtItemsConsultaPromo ? dtItemsConsultaPromo.$(".item-checkbox:checked") : [];
        checkboxes.each(function () {
            const $c = $(this);
            items.push({ codigo: $c.data("codigo"), descripcion: $c.data("descripcion"), costo: $c.data("costo"), stock: $c.data("stock"), optimo: $c.data("optimo"), excedenteu: $c.data("excedenteu"), excedentes: $c.data("excedentes"), m0u: $c.data("m0u"), m0s: $c.data("m0s"), m1u: $c.data("m1u"), m1s: $c.data("m1s"), m2u: $c.data("m2u"), m2s: $c.data("m2s") });
        });
        if (items.length === 0) { Swal.fire("Atención", "Seleccione al menos un item.", "info"); return; }
        agregarItemsATablaArticulos(items);
        $("#modalConsultaItems").modal("hide");
        $("#checkTodosItems").prop("checked", false);
    });

    // Eliminar artículo
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

    // Equivalentes
    $("#btnEquivalentes").on("click", function () {
        const codigo = obtenerCodigoArticuloSeleccionado(); if (!codigo) return;
        consultarServicioAdicional("api/Promocion/consultar-articulo-equivalente", codigo, function (data) {
            const $tbody = $("#tbodyEquivalentes"); $tbody.empty();
            if (!data.length) { $tbody.html('<tr><td colspan="14" class="text-center text-muted">No existen equivalentes.</td></tr>'); }
            else { data.forEach(item => { $tbody.append(`<tr><td>${item.codigo || ''} - ${item.descripcion || ''}</td><td class="text-end">${formatCurrencySpanish(item.costo)}</td><td class="text-center">${item.stock_bodega || 0}</td><td class="text-center">${item.stock_tiendas || 0}</td><td class="text-center">${item.inventario_optimo || 0}</td><td class="text-center">${item.excedentes_unidades || 0}</td><td class="text-end">${formatCurrencySpanish(item.excedentes_dolares)}</td><td class="text-center">${item.dias_antiguedad || 0}</td><td class="text-center">${item.m0_unidades || 0}</td><td class="text-end">${formatCurrencySpanish(item.m0_dolares)}</td><td class="text-center">${item.m1_unidades || 0}</td><td class="text-end">${formatCurrencySpanish(item.m1_dolares)}</td><td class="text-center">${item.m2_unidades || 0}</td><td class="text-end">${formatCurrencySpanish(item.m2_dolares)}</td></tr>`); }); }
            $("#modalEquivalentes").modal("show");
        });
    });

    // Precios Competencia
    $("#btnPreciosCompetencia").on("click", function () {
        const codigo = obtenerCodigoArticuloSeleccionado(); if (!codigo) return;
        consultarServicioAdicional("api/Promocion/consultar-articulo-precio-competencia", codigo, function (data) {
            const $tbody = $("#tbodyPreciosCompetencia"); $tbody.empty();
            if (!data.length) { $tbody.html('<tr><td colspan="2" class="text-center text-muted">No hay precios registrados.</td></tr>'); }
            else { data.forEach(item => { $tbody.append(`<tr><td>${item.nombre_competencia || ''}</td><td class="text-end">${formatCurrencySpanish(item.precio_contado)}</td></tr>`); }); }
            $("#modalPreciosCompetencia").modal("show");
        });
    });

    // Otros Costos
    $("#btnOtrosCostos").on("click", function () {
        const codigo = obtenerCodigoArticuloSeleccionado(); if (!codigo) return;
        consultarServicioAdicional("api/Promocion/consultar-otros-costos", codigo, function (data) {
            const $tbody = $("#tbodyOtrosCostos"); $tbody.empty();
            if (!data.length) { $tbody.html('<tr><td colspan="3" class="text-center text-muted">No hay otros costos.</td></tr>'); }
            else { data.forEach(item => { $tbody.append(`<tr><td class="text-center align-middle"><input class="form-check-input chk-otro-costo" type="checkbox" data-codigo="${item.codigo}" data-nombre="${item.nombre}" data-valor="${item.valor}"></td><td class="align-middle">${item.nombre || ''}</td><td class="text-end align-middle">${formatCurrencySpanish(item.valor)}</td></tr>`); }); }

            // PRE-MARCAR los otros costos ya guardados en la fila del artículo
            const $filaArticulo = $("#tablaArticulosBody .item-row-radio:checked").closest("tr");
            const otrosCostosGuardados = $filaArticulo.data("detalle-otros-costos") || [];
            otrosCostosGuardados.forEach(function (oc) {
                $("#tbodyOtrosCostos .chk-otro-costo").each(function () {
                    if (String($(this).data("codigo")) === String(oc.codigo) ||
                        $(this).data("nombre") === oc.nombre) {
                        $(this).prop("checked", true);
                    }
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
    resetFormulario();
    $('#lblIdPromocion').text(idPromocion);
    $('#modalPromocionId').val(idPromocion);

    const payload = { code_app: "APP20260128155212346", http_method: "GET", endpoint_path: "api/Promocion/bandeja-modificacion-id", client: "APL", endpoint_query_params: `/${idPromocion}` };
    $.ajax({
        url: "/api/apigee-router-proxy", method: "POST", contentType: "application/json", data: JSON.stringify(payload),
        success: function (res) {
            const data = res.json_response || {};
            console.log("data: ", data);
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

    // LÍNEA 1
    $('#verPromocionHeader').val(`${cab.idpromocion || ""} - ${cab.nombre_clase_promocion || ""}`);
    $('#verPromocionNum').val(cab.idpromocion);
    $('#modalTipoPromocion').val(cab.etiqueta_clase_promocion || "");
    $('#promocionDescripcion').val(cab.descripcion || "");

    const fechaInicioFormateada = obtenerSoloFecha(cab.fecha_inicio);
    const horaInicioFormateada = obtenerSoloHora(cab.fecha_inicio);
    $('#promocionFechaInicio').val(fechaInicioFormateada);
    $('#promocionHoraInicio').val(horaInicioFormateada);

    const fechaFinFormateada = obtenerSoloFecha(cab.fecha_fin);
    const horaFinFormateada = obtenerSoloHora(cab.fecha_fin);
    $('#promocionFechaFin').val(fechaFinFormateada);
    $('#promocionHoraFin').val(horaFinFormateada);

    $('#verEstadoPromocion').val(cab.nombre_estado_promocion || cab.estado || "");

    const rutaSoporte = cab.archivosoporte || "";
    $('#btnVerSoporteActual').data('soporte', rutaSoporte);
    $('#lblArchivoActual').text(obtenerNombreArchivo(rutaSoporte) || "Ningún archivo seleccionado");

    cargarMotivos(function () { $('#promocionMotivo').val(cab.id_motivo); });

    const marcaRegaloVal = (cab.marcaregalo || "").toString().trim();
    $('#promocionMarcaRegalo').prop('checked', marcaRegaloVal !== "" && marcaRegaloVal !== "N");

    // ===================================================================
    // TOGGLE SECCIONES SEGÚN TIPO
    // ===================================================================
    if (tipoPromocion === "PRARTICULO") {
        $("#seccionGeneralSegmentos").hide();
        $("#seccionGeneralAcuerdos").hide();
        $("#seccionArticuloSegmentos").show();
        $("#seccionArticuloDetalle").show();

        poblarSelectSegmento("canal", segmentos, "SEGCANAL");
        poblarSelectSegmento("grupo", segmentos, "SEGGRUPOALMACEN");
        poblarSelectSegmento("almacen", segmentos, "SEGALMACEN");
        poblarSelectSegmento("tipocliente", segmentos, "SEGTIPOCLIENTE");

        poblarArticulosDesdeAPI(data);

    } else {
        $("#seccionGeneralSegmentos").show();
        $("#seccionGeneralAcuerdos").show();
        $("#seccionArticuloSegmentos").hide();
        $("#seccionArticuloDetalle").hide();

        poblarSelectSegmento("marca", segmentos, "SEGMARCA");
        poblarSelectSegmento("division", segmentos, "SEGDIVISION");
        poblarSelectSegmento("depto", segmentos, "SEGDEPARTAMENTO");
        poblarSelectSegmento("clase", segmentos, "SEGCLASE");
        poblarSelectSegmento("canal", segmentos, "SEGCANAL");
        poblarSelectSegmento("grupo", segmentos, "SEGGRUPOALMACEN");
        poblarSelectSegmento("almacen", segmentos, "SEGALMACEN");
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

    isPopulating = false;
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

    $("#tablaArticulosBody").empty();

    $("#seccionGeneralSegmentos, #seccionGeneralAcuerdos").show();
    $("#seccionArticuloSegmentos, #seccionArticuloDetalle").hide();

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
            nombrearchivosoporte: fileInput.name,
            rutaarchivoantiguo: promocionTemporal.cabecera.archivosoporte
        } : {}),
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

        const unidadesLimite = parseInt($fila.find("td:eq(19) input").val()) || 0;
        const proyeccionVtas = parseInt($fila.find("td:eq(20) input").val()) || 0;

        if (unidadesLimite > 0 && proyeccionVtas > 0) { errorFila = `Fila ${numFila}: Solo Unidades Límite O Proyección Vtas.`; return false; }
        if (unidadesLimite === 0 && proyeccionVtas === 0) { errorFila = `Fila ${numFila}: Ingrese Unidades Límite o Proyección Vtas.`; return false; }

        const $selectMedioPago = $fila.find("td:eq(21) select");
        const medioPagoVal = $selectMedioPago.val();
        const mediosPagoSeleccionados = $selectMedioPago.data("seleccionados") || [];

        const precioLista = parseCurrencyToNumber($fila.find("td:eq(22)").text());
        const precioContado = parseCurrencyToNumber($fila.find("td:eq(23) input").val());
        const precioTC = parseCurrencyToNumber($fila.find("td:eq(24) input").val());
        const precioCredito = parseCurrencyToNumber($fila.find("td:eq(25) input").val());
        const precioIgualar = parseCurrencyToNumber($fila.find("td:eq(26) input").val());

        const dsctoContado = parseFloat($fila.find("td:eq(27)").text()) || 0;
        const dsctoTC = parseFloat($fila.find("td:eq(28)").text()) || 0;
        const dsctoCredito = parseFloat($fila.find("td:eq(29)").text()) || 0;
        const dsctoIgualar = parseFloat($fila.find("td:eq(30)").text()) || 0;

        const aporteProveedor = parseCurrencyToNumber($fila.find(".aporte-proveedor").val());
        const idAcuerdoProveedor = parseInt($fila.find("td:eq(32) .acuerdo-id-hidden").val()) || 0;
        const aporteRebate = parseCurrencyToNumber($fila.find(".aporte-rebate").val());
        const idAcuerdoRebate = parseInt($fila.find("td:eq(34) .acuerdo-id-hidden").val()) || 0;
        const aportePropio = parseCurrencyToNumber($fila.find(".aporte-propio").val());
        const idAcuerdoPropio = parseInt($fila.find("td:eq(36) .acuerdo-id-hidden").val()) || 0;

        const margenPL = parseFloat($fila.find("td:eq(37)").text()) || 0;
        const margenContado = parseFloat($fila.find("td:eq(38)").text()) || 0;
        const margenTC = parseFloat($fila.find("td:eq(39)").text()) || 0;
        const margenCredito = parseFloat($fila.find("td:eq(40)").text()) || 0;
        const margenIgualar = parseFloat($fila.find("td:eq(41)").text()) || 0;

        const regalo = $fila.find("td:eq(45) input[type='checkbox']").is(":checked") ? "S" : "N";

        const acuerdosArticulo = [];
        if (idAcuerdoProveedor > 0) acuerdosArticulo.push({ idacuerdo: idAcuerdoProveedor, valoraporte: aporteProveedor });
        if (idAcuerdoRebate > 0) acuerdosArticulo.push({ idacuerdo: idAcuerdoRebate, valoraporte: aporteRebate });
        if (idAcuerdoPropio > 0) acuerdosArticulo.push({ idacuerdo: idAcuerdoPropio, valoraporte: aportePropio });

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
            unidadeslimite: unidadesLimite, unidadesproyeccionventas: proyeccionVtas,
            preciolistacontado: precioLista, preciolistacredito: precioLista,
            preciopromocioncontado: precioContado, preciopromociontarjetacredito: precioTC,
            preciopromocioncredito: precioCredito, precioigualarprecio: precioIgualar,
            descuentopromocioncontado: dsctoContado, descuentopromociontarjetacredito: dsctoTC,
            descuentopromocioncredito: dsctoCredito, descuentoigualarprecio: dsctoIgualar,
            margenpreciolistacontado: margenPL, margenpreciolistacredito: margenPL,
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
                unidadeslimite: 0, unidadesproyeccionventas: 0,
                preciolistacontado: 0, preciolistacredito: 0,
                preciopromocioncontado: 0, preciopromociontarjetacredito: 0, preciopromocioncredito: 0,
                precioigualarprecio: 0,
                descuentopromocioncontado: 0, descuentopromociontarjetacredito: 0, descuentopromocioncredito: 0, descuentoigualarprecio: 0,
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
            nombrearchivosoporte: fileInput.name,
            
        } : {}),
        rutaarchivoantiguo: promocionTemporal.cabecera.archivosoporte,
        idtipoproceso: tipoProceso ? tipoProceso.idcatalogo : 0,
        idopcion: getIdOpcionSeguro(), idcontrolinterfaz: "BTNGRABAR", ideventoetiqueta: "EVCLICK"
    };

    enviarGuardado(body);
}

function enviarGuardado(body) {
    console.log("📤 Enviando JSON Modificar Promoción:", body);

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
function obtenerNombreArchivoConGuid(rutaCompleta) { if (!rutaCompleta) return ""; return rutaCompleta.replace(/^.*[\\/]/, ''); }

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