// ~/js/Promocion/ModificarPromocion.js

// ===============================================================
// VARIABLES GLOBALES
// ===============================================================
let tabla;
let promocionTemporal = null;
let proveedorTemporal = null;
let propioTemporal = null;
let isPopulating = false;

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

// Función para mostrar la fecha con hora en el input
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

// Validación para aceptar el formato con hora opcional
function isValidDateDDMMYYYYHHMM(s) {
    if (!s) return false;
    return /^\d{2}\/\d{2}\/\d{4}( \d{2}:\d{2})?$/.test(s);
}

// Convertir de dd/mm/yyyy HH:mm a formato ISO para el servicio
function toISOFromDDMMYYYYHHMM(s) {
    if (!s || !isValidDateDDMMYYYYHHMM(s)) return null;
    const partes = s.split(" ");
    const [dd, mm, yyyy] = partes[0].split("/").map(Number);
    let hh = 0, min = 0;

    // Si la cadena incluye hora, la separamos
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

            // Lógica unificada para Tipo de Cliente
            const $cli = $("#segTipoCliente");
            const $modalBodyCli = $("#bodyModalTipoCliente");

            $cli.empty();

            // 1. Agregamos las opciones iniciales en la parte superior
            $cli.append('<option selected value="">Seleccione...</option>');
            $cli.append('<option value="TODOS">Todos</option>');
            $cli.append('<option value="4" class="fw-bold text-success">-- VARIOS --</option>');

            $modalBodyCli.empty();
            const $ulCli = $('<ul class="list-group w-100"></ul>');

            // 2. Cargamos las opciones dinámicas (NUEVO, REITERATIVO, etc.)
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

            // 3. Agregamos "Lista Específica" al final de todo
            $cli.append('<option value="3">Lista Específica</option>');
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
            const val = $(this).val();

            // Interceptar específicamente Tipo Cliente
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
                // Lógica original para el resto de segmentos
                if (val === conf.triggerVal) {
                    $(conf.btnOpen).removeClass("d-none");
                    if (!isPopulating) {
                        setTimeout(() => { $(conf.btnOpen)[0].click(); }, 50);
                    }
                } else {
                    $(conf.btnOpen).addClass("d-none").removeData("seleccionados").html(`<i class="fa-solid fa-list-check"></i>`).removeClass("btn-success-custom").addClass("btn-outline-secondary");
                }
            }

            // Lógica de bloqueo de proveedor para la Marca
            if (conf.id === "marca") {
                if (!isPopulating) {
                    const idProveedorActual = $("#fondoProveedorId").val();
                    if (idProveedorActual) {
                        Swal.fire({
                            icon: 'warning',
                            title: 'Cambio de Marca Detectado',
                            text: 'Estás modificando la Marca. Ten en cuenta que los Acuerdos de Proveedor dependen de la marca seleccionada. Se ha limpiado el acuerdo actual por seguridad.'
                        });
                        validarBloqueoProveedor(true);
                    } else {
                        Swal.fire({ icon: 'info', title: 'Marca Modificada', text: 'Recuerda que los acuerdos de proveedor se filtrarán por esta marca.', toast: true, position: 'top-end', timer: 3000, showConfirmButton: false });
                    }
                }

                if (val === "" || val === "TODAS") {
                    validarBloqueoProveedor(true);
                } else if (val !== conf.triggerVal) {
                    validarBloqueoProveedor(false);
                }
            }
        });

        // Configuración de los botones Aceptar
        if (conf.id === "tipocliente") {
            // El Tipo de Cliente tiene 2 botones de aceptar distintos (uno por modal)
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
            // Aceptar estándar para el resto de segmentos
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

    // Tipo Todos
    if (primerItem.tipoasignacion === "T" || primerItem.tipoasignacion === "TODOS") {
        $select.val("").trigger("change");
        return;
    }

    // NUEVA LÓGICA: Un solo registro - Validamos que exista en las opciones normales del Select
    if (items.length === 1 && primerItem.codigo_detalle) {
        const existeOpcion = $select.find(`option[value='${primerItem.codigo_detalle}']`).length > 0;
        if (existeOpcion && primerItem.codigo_detalle !== conf.triggerVal) {
            $select.val(primerItem.codigo_detalle).trigger("change");
            return;
        }
    }

    // Tipo Lista o Varios
    if (items.length > 0) {
        let valParaTrigger = conf.triggerVal;

        // Excepción por si traes códigos cédulas en tipo de cliente
        if (configId === "tipocliente" && primerItem.codigo_detalle && primerItem.codigo_detalle.length > 5) {
            valParaTrigger = "3"; // Fuerza a lista específica
        } else if (configId === "tipocliente" && items.length > 1) {
            valParaTrigger = "4"; // Opciones de catálogo
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
// LÓGICA DE CÁLCULOS ACUERDOS
// ===============================================================
function initValidacionesFinancieras() {
    // 1. Lógica para campos de Porcentaje (%)
    $("#descuentoProveedor, #descuentoPropio")
        .off("focus input blur") // Limpiamos eventos previos por seguridad
        .on("focus", function () {
            // Si está en 0, lo vaciamos para facilitar la escritura
            if (parseFloat($(this).val()) === 0) $(this).val("");
        })
        .on("input", function () {
            // Solo permitir números y punto
            this.value = this.value.replace(/[^0-9.]/g, '');
            calcularTotalDescuento();
        })
        .on("blur", function () {
            let val = parseFloat($(this).val()) || 0;
            $(this).val(val > 0 ? val.toFixed(2) : "");
            calcularTotalDescuento();
        });

    // 2. Lógica para campos de Dinero ($ Comprometido)
    $("#fondoValorTotal, #comprometidoPropio")
        .off("focus input blur")
        .on("focus", function () {
            // Al hacer clic, quitamos el "$ " y las comas para que sea un número puro editable
            let valStr = $(this).val().replace(/[^0-9.,]/g, '');
            // Convertimos la coma europea/española a punto decimal de JS si existe
            if (valStr.includes(',') && !valStr.includes('.')) valStr = valStr.replace(',', '.');
            else if (valStr.includes(',') && valStr.includes('.')) valStr = valStr.replace(/\./g, '').replace(',', '.');

            let val = parseFloat(valStr);
            $(this).val(!isNaN(val) && val > 0 ? val : "");
        })
        .on("input", function () {
            // Mientras escribe, solo permitimos números y punto decimal
            this.value = this.value.replace(/[^0-9.]/g, '');
        })
        .on("blur", function () {
            // Al salir, aplicamos tu formato de moneda en español
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

    let endpointParams = `/${tipoFondo}/${claseMapeada}`;

    // LÓGICA AGREGADA: Enviar parámetro de Marca si es Fondo Proveedor
    if (tipoFondo === "TFPROVEDOR") {
        let parametroMarca = "0";
        const valMarca = $("#segMarca").val();

        if (valMarca === "3") { // "Varios"
            const seleccionados = $("#btnMarca").data("seleccionados") || [];
            if (seleccionados.length === 1) parametroMarca = seleccionados[0];
        } else if (valMarca && valMarca !== "TODAS" && valMarca !== "") {
            parametroMarca = valMarca;
        }

        endpointParams += `/${parametroMarca}`;
    }

    const payload = {
        code_app: "APP20260128155212346", http_method: "GET", endpoint_path: "api/Promocion/consultar-acuerdo", client: "APL",
        endpoint_query_params: endpointParams
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
                            data-idacuerdo="${x.idacuerdo || ''}" 
                            data-desc="${x.descripcion || ''}"
                            data-prov="${x.nombre_proveedor || ''}" 
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

                // Armar el texto de visualización
                let textoDisplay = `${d.idacuerdo} - ${d.desc}`;
                if (d.prov && d.prov.toString().trim() !== "") {
                    textoDisplay = `${d.idacuerdo} - ${d.prov} - ${d.desc}`;
                }

                if (onSeleccion) onSeleccion({ idAcuerdo: d.idacuerdo, display: textoDisplay, disponible: d.disp });
            });
        }
    });
}

function evaluarBloqueosAcuerdos() {
    // Evaluación Proveedor
    const idProv = $("#fondoProveedorId").val();
    if (idProv && idProv !== "0" && idProv !== "") {
        $("#descuentoProveedor, #fondoValorTotal").prop("disabled", false);
    } else {
        $("#descuentoProveedor, #fondoValorTotal").val("").prop("disabled", true);
    }

    // Evaluación Propio
    const idProp = $("#acuerdoPropioId").val();
    if (idProp && idProp !== "0" && idProp !== "") {
        $("#descuentoPropio, #comprometidoPropio").prop("disabled", false);
    } else {
        $("#descuentoPropio, #comprometidoPropio").val("").prop("disabled", true);
    }

    // Recalcular total por si se vaciaron campos
    calcularTotalDescuento();
}

// Función para bloquear o desbloquear la sección del proveedor
// Función modificada para bloquear/desbloquear la sección del proveedor desde la MARCA
function validarBloqueoProveedor(bloquear) {
    const $inputProv = $("#fondoProveedorText");
    const $btnBuscar = $("#btnBuscarProv");
    const $btnBorrar = $("#btnBorrarProv");
    const $idProv = $("#fondoProveedorId");
    const $idHidden = $("#fondoDisponibleProv");

    if (bloquear) {
        // Bloquear ID Acuerdo Proveedor completamente
        $inputProv.val("").prop("disabled", true).attr("placeholder", "");
        $idProv.val("");
        $idHidden.val("0");
        $btnBuscar.prop("disabled", true);
        $btnBorrar.prop("disabled", true);
    } else {
        // Desbloquear ID Acuerdo Proveedor (Solo la búsqueda)
        $inputProv.prop("disabled", false).attr("placeholder", "Selec...");
        $btnBuscar.prop("disabled", false);
        $btnBorrar.prop("disabled", false);
    }

    // Llamamos a la evaluación para que bloquee los montos si se borró el ID
    evaluarBloqueosAcuerdos();
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

    $('#btnVerSoporteActual').off('click').on('click', function () {
        const ruta = $(this).data('soporte');
        if (!ruta) { Swal.fire({ icon: 'info', title: 'Sin soporte', text: 'No hay archivo adjunto.' }); return; }
        const nombreArchivoConGuid = obtenerNombreArchivoConGuid(ruta);
        abrirVisorPDF(nombreArchivoConGuid);
    });

    // Eventos para cerrar y descargar del visor PDF
    $("#btnCerrarVisorPdf, #btnCerrarVisorPdfFooter").on("click", function () { cerrarVisorPDF(); });
    $("#btnDescargarPdf").on("click", function () {
        const url = $(this).data("blob-url");
        const nombre = $(this).data("nombre-archivo");
        if (url) {
            const a = document.createElement("a");
            a.href = url;
            a.download = nombre || "soporte.pdf";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        }
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

    // Input File
    $('#inputArchivoSoporte').on('change', function () {
        esArchivoValido('#inputArchivoSoporte', '#lblArchivoActual');
    });

    initDatepickers();

    // Eventos para Botones Borradores
    $("#btnBorrarProv").on("click", function () {
        $("#fondoProveedorId").val("");
        $("#fondoProveedorText").val("");
        $("#fondoDisponibleProv").val("0");
        evaluarBloqueosAcuerdos();
    });

    $("#btnBorrarPropio").on("click", function () {
        $("#acuerdoPropioId").val("");
        $("#acuerdoPropioText").val("");
        $("#acuerdoPropioDisponible").val("0");
        evaluarBloqueosAcuerdos();
    });
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
        // Por:
        language: {
            processing: "Procesando...",
            search: "Buscar:",
            lengthMenu: "Mostrar _MENU_ registros",
            info: "Mostrando _START_ a _END_ de _TOTAL_ registros",
            infoEmpty: "Sin registros",
            infoFiltered: "(filtrado de _MAX_ registros)",
            loadingRecords: "Cargando...",
            zeroRecords: "No se encontraron resultados",
            emptyTable: "No hay datos disponibles",
            paginate: { first: "Primero", previous: "Anterior", next: "Siguiente", last: "Último" }
        }
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
    isPopulating = true; // <-- EVITA QUE SE ABRAN MODALES SOLOS

    const cab = data.cabecera || {};
    const acuerdos = data.acuerdos || [];
    const segmentos = data.segmentos || [];

    // LÍNEA 1
    $('#verPromocionHeader').val(`${cab.idpromocion || ""} - ${cab.nombre_clase_promocion || ""}`);
    $('#verPromocionNum').val(cab.idpromocion);
    $('#modalTipoPromocion').val(cab.etiqueta_clase_promocion || "");
    $('#promocionDescripcion').val(cab.descripcion || "");
    $('#promocionFechaInicio').val(formatearFechaHora(cab.fecha_inicio));
    $('#promocionFechaFin').val(formatearFechaHora(cab.fecha_fin));
    $('#verEstadoPromocion').val(cab.nombre_estado_promocion || cab.estado || "");

    const rutaSoporte = cab.archivosoporte || "";
    $('#btnVerSoporteActual').data('soporte', rutaSoporte);
    $('#lblArchivoActual').text(obtenerNombreArchivo(rutaSoporte) || "Ningún archivo seleccionado");

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

    const marcaRegaloVal = (cab.marcaregalo || "").toString().trim();
    $('#promocionMarcaRegalo').prop('checked', marcaRegaloVal !== "" && marcaRegaloVal !== "N");

    // LÍNEA 4 (ACUERDOS) - BÚSQUEDA DIRECTA POR ETIQUETA
    const acProv = acuerdos.find(a => a.etiqueta_tipo_fondo === "TFPROVEDOR");
    const acProp = acuerdos.find(a => a.etiqueta_tipo_fondo === "TFPROPIO");

    // Limpiar campos de acuerdos
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

    // NUEVO: Validar bloqueo inicial según lo que vino de la Base de Datos
    const marcaVal = $('#segMarca').val();
    if (marcaVal === "" || marcaVal === "TODAS") {
        validarBloqueoProveedor(true);
    } else if (marcaVal === "3") { // 3 es "Varios" en tu config
        const selec = $('#btnMarca').data("seleccionados") || [];
        validarBloqueoProveedor(selec.length > 1);
    } else {
        validarBloqueoProveedor(false);
    }

    evaluarBloqueosAcuerdos();
    isPopulating = false; // <-- REHABILITAMOS EL COMPORTAMIENTO NORMAL
}

function resetFormulario() {
    isPopulating = true;

    $('#formPromocion')[0].reset();
    const fileNameSpan = document.getElementById("lblArchivoActual");
    // ... (código)
    proveedorTemporal = null;
    propioTemporal = null;

    isPopulating = false; // <-- REHABILITAMOS EL COMPORTAMIENTO
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
    if (!isValidDateDDMMYYYYHHMM($('#promocionFechaInicio').val()) || !isValidDateDDMMYYYYHHMM($('#promocionFechaFin').val())) {
        return Swal.fire('Validación', 'Fechas inválidas. Use el formato dd/mm/aaaa HH:mm.', 'warning');
    }

    // NUEVA VALIDACIÓN DE NEGOCIO
    const idProvSeleccionado = parseInt($("#fondoProveedorId").val(), 10) || 0;
    const idPropSeleccionado = parseInt($("#acuerdoPropioId").val(), 10) || 0;
    const descTotal = parseFloat($("#descuentoTotal").val()) || 0;

    if (idProvSeleccionado === 0 && idPropSeleccionado === 0) {
        return Swal.fire('Validación', 'Debe seleccionar al menos un Acuerdo (Proveedor o Propio).', 'warning');
    }

    if (descTotal < 1) { // Valida que sea al menos 1% como mencionaste en tu requerimiento
        return Swal.fire('Validación', 'El % Dscto Total debe ser igual o mayor a 1. Ingrese los valores respectivos.', 'warning');
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

    // Manejo del Archivo
    const fileInput = $('#inputArchivoSoporte')[0].files[0];

    const leerArchivo = file => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = e => reject(e);
    });

    const base64Completo = fileInput ? await leerArchivo(fileInput) : "";

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

    // ==========================================================
    // ACUERDOS CONTRUIDOS DESDE LOS CAMPOS DE LA LÍNEA 4
    // ==========================================================
    const acuerdosModificados = [];
    const acuerdosBD = (promocionTemporal && promocionTemporal.acuerdos) ? promocionTemporal.acuerdos : [];

    // Respetamos tu orden original: [0] es Prov, [1] es Propio
    const acProvBD = acuerdosBD.length > 0 ? acuerdosBD[0] : null;
    const acPropBD = acuerdosBD.length > 1 ? acuerdosBD[1] : null;

    // --- 1. Acuerdo Proveedor ---
    const idProvActual = parseInt($("#fondoProveedorId").val(), 10) || 0;

    if (idProvActual > 0) {
        // Hay un proveedor seleccionado (nuevo o actualizado)
        acuerdosModificados.push({
            accion: (acProvBD && acProvBD.idpromocionacuerdo) ? 'U' : 'I', // 'U' Update, 'I' Insert
            idpromocionacuerdo: (acProvBD && acProvBD.idpromocionacuerdo) ? acProvBD.idpromocionacuerdo : 0,
            idacuerdo: idProvActual,
            porcentajedescuento: parseFloat($("#descuentoProveedor").val()) || 0,
            valorcomprometido: parseCurrencyToNumber($("#fondoValorTotal").val()),
            porcentaje_descuento: parseFloat($("#descuentoProveedor").val()) || 0,
            valor_comprometido: parseCurrencyToNumber($("#fondoValorTotal").val())
        });
    } else if (acProvBD && acProvBD.idpromocionacuerdo) {
        // Estaba lleno en BD, pero lo borraron en pantalla -> ELIMINAR
        acuerdosModificados.push({
            accion: 'D', // IMPORTANTE: Usa 'D' (Delete) o 'E' (Eliminar) según lo que reciba tu API
            idpromocionacuerdo: acProvBD.idpromocionacuerdo,
            idacuerdo: acProvBD.idacuerdo, // Mandamos el viejo para evitar nulos
            porcentajedescuento: 0,
            valorcomprometido: 0,
            porcentaje_descuento: 0,
            valor_comprometido: 0
        });
    }

    // --- 2. Acuerdo Propio ---
    const idPropActual = parseInt($("#acuerdoPropioId").val(), 10) || 0;

    if (idPropActual > 0) {
        // Hay un acuerdo propio seleccionado (nuevo o actualizado)
        acuerdosModificados.push({
            accion: (acPropBD && acPropBD.idpromocionacuerdo) ? 'U' : 'I',
            idpromocionacuerdo: (acPropBD && acPropBD.idpromocionacuerdo) ? acPropBD.idpromocionacuerdo : 0,
            idacuerdo: idPropActual,
            porcentajedescuento: parseFloat($("#descuentoPropio").val()) || 0,
            valorcomprometido: parseCurrencyToNumber($("#comprometidoPropio").val()),
            porcentaje_descuento: parseFloat($("#descuentoPropio").val()) || 0,
            valor_comprometido: parseCurrencyToNumber($("#comprometidoPropio").val())
        });
    } else if (acPropBD && acPropBD.idpromocionacuerdo) {
        // Estaba lleno en BD, pero lo borraron en pantalla -> ELIMINAR
        acuerdosModificados.push({
            accion: 'D', // IMPORTANTE: Usa 'D' o 'E' 
            idpromocionacuerdo: acPropBD.idpromocionacuerdo,
            idacuerdo: acPropBD.idacuerdo,
            porcentajedescuento: 0,
            valorcomprometido: 0,
            porcentaje_descuento: 0,
            valor_comprometido: 0
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
            fechahorainicio: toISOFromDDMMYYYYHHMM($('#promocionFechaInicio').val()),
            fechahorafin: toISOFromDDMMYYYYHHMM($('#promocionFechaFin').val()),
            marcaregalo: $('#promocionMarcaRegalo').is(':checked') ? "✓" : "",
            idusuariomodifica: obtenerUsuarioActual(), nombreusuario: obtenerUsuarioActual()
        },
        acuerdos: acuerdosModificados,
        segmentos: segmentosValidados,
        archivosoportebase64: base64Completo,
        nombrearchivosoporte: fileInput ? fileInput.name : "",
        rutaarchivoantiguo: promocionTemporal.cabecera.archivosoporte,
        idtipoproceso: tipoProceso ? tipoProceso.idcatalogo : 0,
        idopcion: getIdOpcionSeguro(), idcontrolinterfaz: "BTNGRABAR", ideventoetiqueta: "EVCLICK"
    };

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

function esArchivoValido(inputSelector, spanSelector) {
    const $input = $(inputSelector);
    const fileNameSpan = $(spanSelector)[0];
    const file = $input[0].files[0];

    if (!file) return false;

    // Obtener parámetros dinámicos del ViewBag
    const tamanoMaxMB = parseFloat($input.data('max-mb')) || 5;
    const tamanoMaxBytes = tamanoMaxMB * 1024 * 1024;
    const acceptAttr = $input.attr('accept') || "";

    const extensionesPermitidas = acceptAttr.replace(/\./g, '').split(',').map(ext => ext.trim().toLowerCase());
    const extensionArchivo = file.name.split('.').pop().toLowerCase();

    // Validación: Extensión
    if (acceptAttr !== "" && !extensionesPermitidas.includes(extensionArchivo)) {
        Swal.fire("Extensión no permitida", `Solo se aceptan: ${acceptAttr}`, "error");
        $input.val('');
        if (fileNameSpan) fileNameSpan.textContent = "Archivo no válido";
        return false;
    }

    // Validación: Tamaño
    if (file.size > tamanoMaxBytes) {
        Swal.fire("Archivo muy pesado", `El límite es de ${tamanoMaxMB}MB`, "error");
        $input.val('');
        if (fileNameSpan) fileNameSpan.textContent = "Archivo muy pesado";
        return false;
    }

    // Si todo está bien
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
function obtenerNombreArchivoConGuid(rutaCompleta) {
    if (!rutaCompleta) return "";
    return rutaCompleta.replace(/^.*[\\/]/, '');
}

function abrirVisorPDF(nombreArchivo) {
    $("#pdfSpinner").show();
    $("#pdfVisorContenido").hide();
    $("#pdfVisorError").hide();
    $("#btnDescargarPdf").hide();

    const nombreLegible = obtenerNombreArchivo(nombreArchivo);
    $("#modalVisorPdfLabel .pdf-nombre-archivo").text(nombreLegible || "Soporte");

    const modal = new bootstrap.Modal(document.getElementById("modalVisorPdf"));
    modal.show();

    fetchPDFDirecto(nombreArchivo);
}

function fetchPDFDirecto(nombreArchivo) {
    let baseUrl = (window.apiBaseUrl || "http://localhost:5074").replace("/api/router-proxy/execute", "");
    const url = `${baseUrl}/api/Descargas/descargar/${encodeURIComponent(nombreArchivo)}`;

    fetch(url)
        .then(function (response) {
            if (!response.ok) return response.text().then(txt => { throw new Error(txt || `Error HTTP ${response.status}`); });
            return response.blob();
        })
        .then(function (blob) {
            const pdfBlob = new Blob([blob], { type: "application/pdf" });
            const blobUrl = URL.createObjectURL(pdfBlob);

            $("#pdfIframe").attr("src", blobUrl);
            $("#pdfSpinner").hide();
            $("#pdfVisorContenido").show();

            const nombreLegible = obtenerNombreArchivo(nombreArchivo);
            $("#btnDescargarPdf").data("blob-url", blobUrl).data("nombre-archivo", nombreLegible || "soporte.pdf").show();
        })
        .catch(function (error) {
            $("#pdfSpinner").hide();
            $("#pdfVisorError").html(`<i class="fa-solid fa-triangle-exclamation me-2"></i> ${error.message}`).show();
        });
}

function cerrarVisorPDF() {
    const iframe = document.getElementById("pdfIframe");
    const blobUrl = $("#btnDescargarPdf").data("blob-url");

    if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
        $("#btnDescargarPdf").removeData("blob-url");
    }

    if (iframe) iframe.src = "about:blank";
    const modal = bootstrap.Modal.getInstance(document.getElementById("modalVisorPdf"));
    if (modal) modal.hide();
}