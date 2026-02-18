//Path: ~/js/Promocion/CrearPromocion.js

(function () {
    "use strict";

    // ==========================================
    // VARIABLES GLOBALES
    // ==========================================
    let idCatalogoGeneral = null;
    let idCatalogoArticulo = null;
    let idCatalogoCombos = null;

    let proveedorTemporal = null;
    let propioTemporal = null;

    // Configuración para el manejo unificado de "Varios"
    // Mapea: Select -> Botón Apertura -> Modal Body -> Botón Aceptar Modal -> Valor Trigger "Varios"
    const CONFIG_MULTIPLE = [
        // Jerarquía
        { id: "marca", select: "#filtroMarcaGeneral", btnOpen: "#btnMarcaGeneral", body: "#bodyModalMarca", btnAccept: "#btnAceptarMarca", triggerVal: "3" },
        { id: "division", select: "#filtroDivisionGeneral", btnOpen: "#btnDivisionGeneral", body: "#bodyModalDivision", btnAccept: "#btnAceptarDivision", triggerVal: "3" },
        { id: "depto", select: "#filtroDepartamentoGeneral", btnOpen: "#btnDepartamentoGeneral", body: "#bodyModalDepartamento", btnAccept: "#btnAceptarDepartamento", triggerVal: "3" },
        { id: "clase", select: "#filtroClaseGeneral", btnOpen: "#btnClaseGeneral", body: "#bodyModalClase", btnAccept: "#btnAceptarClase", triggerVal: "3" },
        // Otros Filtros
        { id: "canal", select: "#filtroCanalGeneral", btnOpen: "#btnCanalGeneral", body: "#bodyModalCanal", btnAccept: "#btnAceptarCanal", triggerVal: "3" },
        { id: "grupo", select: "#filtroGrupoAlmacenGeneral", btnOpen: "#btnGrupoAlmacenGeneral", body: "#bodyModalGrupoAlmacen", btnAccept: "#btnAceptarGrupoAlmacen", triggerVal: "3" },
        { id: "almacen", select: "#filtroAlmacenGeneral", btnOpen: "#btnAlmacenGeneral", body: "#bodyModalAlmacen", btnAccept: "#btnAceptarAlmacen", triggerVal: "3" },
        { id: "mediopago", select: "#filtroMedioPagoGeneral", btnOpen: "#btnMedioPagoGeneral", body: "#bodyModalMedioPago", btnAccept: "#btnAceptarMedioPago", triggerVal: "7" }
    ];

    // ==========================================
    // HELPERS & UTILS
    // ==========================================
    function getUsuario() {
        return window.usuarioActual || "admin";
    }

    function getIdOpcionSeguro() {
        try {
            return (
                (window.obtenerIdOpcionActual && window.obtenerIdOpcionActual()) ||
                (window.obtenerInfoOpcionActual && window.obtenerInfoOpcionActual().idOpcion) ||
                null
            );
        } catch (e) {
            console.error("Error obteniendo idOpcion:", e);
            return null;
        }
    }

    function getFullISOString(dateInputId, timeInputId) {
        const dateVal = $(dateInputId).val();
        const timeVal = $(timeInputId).val();
        if (!dateVal) return null;
        const [dd, mm, yyyy] = dateVal.split("/").map(Number);
        const fecha = new Date(yyyy, mm - 1, dd);
        if (timeVal) {
            const [hh, min] = timeVal.split(":").map(Number);
            fecha.setHours(hh || 0);
            fecha.setMinutes(min || 0);
        }
        const offset = fecha.getTimezoneOffset() * 60000;
        return (new Date(fecha - offset)).toISOString().slice(0, -1);
    }

    function formatCurrencySpanish(value) {
        let number = parseFloat(value);
        if (isNaN(number)) number = 0.0;
        const formatter = new Intl.NumberFormat("es-ES", {
            style: "decimal",
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
        return `$ ${formatter.format(number)}`;
    }

    function parseCurrency(str) {
        if (!str) return 0;
        let clean = str.toString().replace(/[^0-9.,-]/g, '');
        if (clean.includes(',') && !clean.includes('.')) clean = clean.replace(',', '.');
        else if (clean.includes(',') && clean.includes('.')) clean = clean.replace(/\./g, '').replace(',', '.');
        return parseFloat(clean) || 0;
    }

    function getTipoPromocion() {
        return $("#promocionTipo").val();
    }

    function getClaseAcuerdo() {
        const tipo = getTipoPromocion();
        if (tipo === "Articulos") return "CLAARTICULO";
        if (tipo === "Combos") return "CLACOMBO";
        return "CLAGENERAL";
    }

    function togglePromocionForm() {
        const idSeleccionado = getTipoPromocion();

        console.log('tipo: ', idSeleccionado);

        // Comparamos contra las variables que llenaste en el AJAX
        $("#formGeneral").toggle(idSeleccionado == idCatalogoGeneral);
        $("#formArticulos").toggle(idSeleccionado == idCatalogoArticulo);
        $("#formCombos").toggle(idSeleccionado == idCatalogoCombos);
    }

    // Helper para llenar Select y Modal simultáneamente
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
                const li = `
                    <li class="list-group-item">
                        <input class="form-check-input me-1 chk-seleccion-multiple" type="checkbox" value="${codigo}" id="${chkId}" data-target="${idPrefijo}">
                        <label class="form-check-label stretched-link" for="${chkId}">${texto}</label>
                    </li>`;
                $ul.append(li);
            });
        }
        $modalBody.append($ul);
    };

    // ==========================================
    // LÓGICA DE NEGOCIO Y VALIDACIONES
    // ==========================================

    function initValidacionesFinancieras() {

        $("#fondoValorTotalGeneral").on("blur", function () {
            let valStr = $(this).val().replace(/[^0-9.]/g, '');
            let valorIngresado = parseFloat(valStr) || 0;
            let disponibleStr = $("#fondoDisponibleHiddenGeneral").val();
            let disponible = parseCurrency(disponibleStr);

            if (valorIngresado > disponible) {
                Swal.fire({
                    icon: 'warning',
                    title: 'Presupuesto Excedido',
                    text: `El valor comprometido ($${valorIngresado}) es mayor al disponible del acuerdo ($${disponible}).`
                });
                $(this).val("");
                $(this).addClass("is-invalid");
            } else {
                $(this).removeClass("is-invalid");
                $(this).val(formatCurrencySpanish(valorIngresado));
            }
        });

        $("#comprometidoPropioGeneral").on("blur", function () {
            let valStr = $(this).val().replace(/[^0-9.]/g, '');
            let valorIngresado = parseFloat(valStr) || 0;
            let disponibleStr = $("#acuerdoPropioDisponibleHiddenGeneral").val();
            let disponible = parseCurrency(disponibleStr);

            if (valorIngresado > disponible) {
                Swal.fire({
                    icon: 'warning',
                    title: 'Presupuesto Excedido',
                    text: `El valor propio ($${valorIngresado}) excede el disponible del acuerdo propio ($${disponible}).`
                });
                $(this).val("");
                $(this).addClass("is-invalid");
            } else {
                $(this).removeClass("is-invalid");
                $(this).val(formatCurrencySpanish(valorIngresado));
            }
        });

        const soloNumeros = function (e) {
            this.value = this.value.replace(/[^0-9.]/g, '');
            calcularTotalDescuento();
        };

        $("#descuentoProveedorGeneral").on("input", soloNumeros);
        $("#descuentoPropioGeneral").on("input", soloNumeros);

        function calcularTotalDescuento() {
            let descProv = parseFloat($("#descuentoProveedorGeneral").val()) || 0;
            let descProp = parseFloat($("#descuentoPropioGeneral").val()) || 0;
            let total = descProv + descProp;
            $("#descuentoTotalGeneral").val(total.toFixed(2) + "%");
        }

        $("#descuentoProveedorGeneral, #descuentoPropioGeneral").on("blur", function () {
            let val = parseFloat($(this).val()) || 0;
            if (val > 0) $(this).val(val.toFixed(2) + "%");
        });

        $("#descuentoProveedorGeneral, #descuentoPropioGeneral").on("focus", function () {
            let val = $(this).val().replace("%", "");
            $(this).val(val);
        });
    }

    function initLogicaSeleccionMultiple() {
        CONFIG_MULTIPLE.forEach(conf => {
            $(conf.select).off("change").on("change", function () {
                const val = $(this).val();

                if (val === conf.triggerVal) {
                    $(conf.btnOpen).removeClass("d-none");
                } else {
                    $(conf.btnOpen).addClass("d-none");
                    $(conf.btnOpen).removeData("seleccionados");
                    $(conf.btnOpen).html(`<i class="fa-solid fa-list-check"></i>`);
                    $(conf.btnOpen).removeClass("btn-success").addClass("btn-outline-secondary");
                }

                if (conf.id === "marca") {
                    if (val !== conf.triggerVal && val !== "") {
                        validarBloqueoProveedor(1);
                    } else if (val === "") {
                        validarBloqueoProveedor(0);
                    }
                }
            });

            $(conf.btnAccept).off("click").on("click", function () {
                const seleccionados = [];
                $(`${conf.body} input[type='checkbox']:checked`).each(function () {
                    seleccionados.push($(this).val());
                });

                const $btnTrigger = $(conf.btnOpen);
                $btnTrigger.data("seleccionados", seleccionados);

                if (seleccionados.length > 0) {
                    $btnTrigger.removeClass("btn-outline-secondary").addClass("btn-success");
                    $btnTrigger.html(`<i class="fa-solid fa-list-check"></i> (${seleccionados.length})`);
                } else {
                    $btnTrigger.removeClass("btn-success").addClass("btn-outline-secondary");
                    $btnTrigger.html(`<i class="fa-solid fa-list-check"></i>`);
                }

                if (conf.id === "marca") {
                    validarBloqueoProveedor(seleccionados.length);
                }

                console.log(`Guardado ${conf.id}:`, seleccionados);
            });
        });
    }

    function validarBloqueoProveedor(cantidad) {
        const $inputProv = $("#fondoProveedorGeneral");
        const $btnProv = $inputProv.next("button");
        const $idProv = $("#fondoProveedorIdGeneral");
        const $idHidden = $("#fondoDisponibleHiddenGeneral");

        if (cantidad > 1) {
            $inputProv.val("").prop("disabled", true).attr("placeholder", "Bloqueado por múltiples marcas");
            $idProv.val("");
            $idHidden.val("0");
            $btnProv.prop("disabled", true);
            $("#fondoValorTotalGeneral").val("");
            $("#descuentoProveedorGeneral").val("");
            $("#descuentoTotalGeneral").val("");
        } else {
            $inputProv.prop("disabled", false).attr("placeholder", "Seleccione...");
            $btnProv.prop("disabled", false);
        }
    }

    // ==========================================
    // CARGA DE DATOS (APIS)
    // ==========================================

    function cargarTiposPromocion(callback) {
        const idOpcion = getIdOpcionSeguro();
        if (!idOpcion) return;
        const $select = $("#promocionTipo");

        const payload = {
            code_app: "APP20260128155212346",
            http_method: "GET",
            endpoint_path: "api/Opciones/ConsultarCombos",
            client: "APL",
            endpoint_query_params: "/CLASEPROMOCION"
        };

        $.ajax({
            url: "/api/apigee-router-proxy",
            method: "POST",
            contentType: "application/json",
            data: JSON.stringify(payload),
            success: function (res) {
                const data = res.json_response || [];
                $select.empty();
                if (!data.length) { $select.append("<option>Sin datos</option>"); return; }

                data.forEach(function (item) {
                    const etiqueta = (item.idetiqueta_catalogo || "").toUpperCase();
                    if (etiqueta === "PRGENERAL") {
                        idCatalogoGeneral = item.idcatalogo;
                        $select.append($("<option>").val(item.idcatalogo).text(item.nombre_catalogo));
                    } else if (etiqueta === "PRARTICULO") {
                        idCatalogoArticulo = item.idcatalogo;
                        $select.append($("<option>").val(item.idcatalogo).text(item.nombre_catalogo));
                    } else if (etiqueta === "PRCOMBO") {
                        idCatalogoCombos = item.idcatalogo;
                        $select.append($("<option>").val(item.idcatalogo).text(item.nombre_catalogo));
                    }
                });

                const promocionGeneral = data.find(x => x.idetiqueta_catalogo == 'PRGENERAL');
                $select.val(promocionGeneral.idcatalogo);
                togglePromocionForm();
                if (callback) callback();
            }
        });
    }

    function cargarMotivosPromociones(selectId) {
        const $select = $(selectId);
        const payload = {
            code_app: "APP20260128155212346",
            http_method: "GET",
            endpoint_path: "api/Opciones/ConsultarCombos",
            client: "APL",
            endpoint_query_params: "/PRMOTIVOS"
        };
        $.ajax({
            url: "/api/apigee-router-proxy",
            method: "POST",
            contentType: "application/json",
            data: JSON.stringify(payload),
            success: function (res) {
                const data = res.json_response || [];
                $select.empty().append('<option value="">Seleccione...</option>');
                data.forEach(item => $select.append($("<option>").val(item.idcatalogo).text(item.nombre_catalogo)));
            }
        });
    }

    function cargarFiltrosJerarquia() {
        const payload = {
            code_app: "APP20260128155212346",
            http_method: "GET",
            endpoint_path: "api/Acuerdo/consultar-combos",
            client: "APL",
            endpoint_query_params: ""
        };

        $.ajax({
            url: "/api/apigee-router-proxy",
            method: "POST",
            contentType: "application/json",
            data: JSON.stringify(payload),
            success: function (res) {
                const data = res.json_response || {};
                llenarComboYModal($("#filtroMarcaGeneral"), $("#bodyModalMarca"), data.marcas, "Todas", "3", "marca");
                llenarComboYModal($("#filtroDivisionGeneral"), $("#bodyModalDivision"), data.divisiones, "Todas", "3", "division");
                llenarComboYModal($("#filtroDepartamentoGeneral"), $("#bodyModalDepartamento"), data.departamentos, "Todos", "3", "depto");
                llenarComboYModal($("#filtroClaseGeneral"), $("#bodyModalClase"), data.clases, "Todas", "3", "clase");
            }
        });
    }

    function cargarCombosPromociones() {
        const payload = {
            code_app: "APP20260128155212346",
            http_method: "GET",
            endpoint_path: "api/Promocion/consultar-combos-promociones",
            client: "APL",
            endpoint_query_params: ""
        };

        $.ajax({
            url: "/api/apigee-router-proxy",
            method: "POST",
            contentType: "application/json",
            data: JSON.stringify(payload),
            success: function (response) {
                const data = response.json_response || {};

                llenarComboYModal($("#filtroCanalGeneral"), $("#bodyModalCanal"), data.canales, "Cargando...", "3", "canal");
                llenarComboYModal($("#filtroGrupoAlmacenGeneral"), $("#bodyModalGrupoAlmacen"), data.gruposalmacenes, "Cargando...", "3", "grupo");
                llenarComboYModal($("#filtroAlmacenGeneral"), $("#bodyModalAlmacen"), data.almacenes, "Cargando...", "3", "almacen");
                llenarComboYModal($("#filtroMedioPagoGeneral"), $("#bodyModalMedioPago"), data.mediospagos, "Cargando...", "7", "mediopago");

                const $cli = $("#tipoClienteGeneral");
                $cli.empty().append('<option selected value="">Todos</option>');
                if (data.tiposclientes) data.tiposclientes.forEach(c => $cli.append(`<option value="${c.codigo}">${c.nombre}</option>`));
                $cli.append('<option value="3">Lista Específica</option><option value="4">Varios</option>');
            }
        });
    }

    // ==========================================
    // CONSULTA ACUERDOS (PROVEEDOR / PROPIO)
    // ==========================================
    function consultarAcuerdos(tipoFondo, tablaId, onSeleccion) {
        const $tbody = $(`#${tablaId} tbody`);
        $tbody.html('<tr><td colspan="13" class="text-center">Cargando...</td></tr>');
        const claseAcuerdo = getClaseAcuerdo();

        const payload = {
            code_app: "APP20260128155212346",
            http_method: "GET",
            endpoint_path: "api/Promocion/consultar-acuerdo",
            client: "APL",
            endpoint_query_params: "/" + tipoFondo + "/" + claseAcuerdo
        };

        $.ajax({
            url: "/api/apigee-router-proxy",
            method: "POST",
            contentType: "application/json",
            data: JSON.stringify(payload),
            success: function (res) {
                const data = res.json_response || [];
                $tbody.empty();
                if (!data.length) {
                    $tbody.html('<tr><td colspan="13" class="text-center">No hay datos.</td></tr>');
                    return;
                }
                const fmtDate = (s) => s ? new Date(s).toLocaleDateString("es-EC") : "";

                data.forEach(x => {
                    const row = `<tr class="text-nowrap">
                        <td class="text-center">
                            <input class="form-check-input acuerdo-radio" type="radio" name="acuerdo_${tipoFondo}"
                                data-idacuerdo="${x.idacuerdo || ''}"
                                data-desc="${x.descripcion || ''}"
                                data-prov="${x.nombre_proveedor || ''}"
                                data-disp="${x.valor_disponible || 0}"
                                data-estado="${x.estado || ''}">
                        </td>
                        <td>${x.idacuerdo}</td>
                        <td>${x.descripcion}</td>
                        <td>${x.idfondo}</td>
                        <td>${x.nombre_proveedor}</td>
                        <td>${x.nombre_tipo_fondo}</td>
                        <td class="text-end">${formatCurrencySpanish(x.valor_acuerdo)}</td>
                        <td>${fmtDate(x.fecha_inicio)}</td>
                        <td>${fmtDate(x.fecha_fin)}</td>
                        <td class="text-end">${formatCurrencySpanish(x.valor_disponible)}</td>
                        <td class="text-end">${formatCurrencySpanish(x.valor_comprometido)}</td>
                        <td class="text-end">${formatCurrencySpanish(x.valor_liquidado)}</td>
                        <td>${x.estado}</td>
                    </tr>`;
                    $tbody.append(row);
                });

                $(`#${tablaId} .acuerdo-radio`).change(function () {
                    $(`#${tablaId} tr`).removeClass("table-active");
                    $(this).closest("tr").addClass("table-active");
                    const d = $(this).data();
                    if (onSeleccion) onSeleccion({
                        idAcuerdo: d.idacuerdo,
                        display: `${d.idacuerdo} - ${d.prov}`,
                        disponible: d.disp
                    });
                });
            }
        });
    }

    function setFondoProveedorEnForm(f) {
        $("#fondoProveedorGeneral").val(f.display);
        $("#fondoProveedorIdGeneral").val(f.idAcuerdo);
        $("#fondoDisponibleHiddenGeneral").val(f.disponible);
    }

    function setFondoPropioEnForm(f) {
        $("#acuerdoPropioGeneral").val(f.display);
        $("#acuerdoPropioIdGeneral").val(f.idAcuerdo);
        $("#acuerdoPropioDisponibleHiddenGeneral").val(f.disponible);
    }

    // ==========================================
    // RESET FORMULARIO
    // ==========================================
    function resetearFormulario(sufijo) {
        // Campos básicos
        $(`#motivo${sufijo}`).val("").trigger("change");
        $(`#descripcion${sufijo}`).val("");
        $(`#fechaInicio${sufijo}`).val("");
        $(`#fechaFin${sufijo}`).val("");
        $(`#timeInicio${sufijo}`).val("");
        $(`#timeFin${sufijo}`).val("");
        $("#regaloGeneral").prop("checked", false);

        // Acuerdo Proveedor
        $("#fondoProveedorGeneral").val("").prop("disabled", false).attr("placeholder", "Seleccione...");
        $("#fondoProveedorGeneral").next("button").prop("disabled", false);
        $("#fondoProveedorIdGeneral").val("");
        $("#fondoDisponibleHiddenGeneral").val("");
        $("#fondoValorTotalGeneral").val("");
        $("#descuentoProveedorGeneral").val("");

        // Acuerdo Propio
        $("#acuerdoPropioGeneral").val("");
        $("#acuerdoPropioIdGeneral").val("");
        $("#acuerdoPropioDisponibleHiddenGeneral").val("");
        $("#comprometidoPropioGeneral").val("");
        $("#descuentoPropioGeneral").val("");

        // Descuento Total
        $("#descuentoTotalGeneral").val("");

        // Filtros múltiples: selects, botones y checkboxes
        CONFIG_MULTIPLE.forEach(conf => {
            $(conf.select).val("").trigger("change");
            $(conf.btnOpen).addClass("d-none");
            $(conf.btnOpen).removeData("seleccionados");
            $(conf.btnOpen).html(`<i class="fa-solid fa-list-check"></i>`);
            $(conf.btnOpen).removeClass("btn-success").addClass("btn-outline-secondary");
            $(`${conf.body} input[type='checkbox']`).prop("checked", false);
        });

        // Tipo Cliente
        $("#tipoClienteGeneral").val("").trigger("change");
        $("#btnListaClienteGeneral").addClass("d-none");

        // Archivo
        $("#inputGroupFile24").val("");
        const fileNameSpan = document.getElementById("fileName");
        if (fileNameSpan) fileNameSpan.textContent = "";

        // Artículo
        $("#chkArticuloGeneral").prop("checked", false).trigger("change");
        $("#articuloGeneral").val("").prop("disabled", true);

        // Variables temporales
        proveedorTemporal = null;
        propioTemporal = null;

        // Clases de validación visual
        $(".is-invalid").removeClass("is-invalid");
    }

    // ==========================================
    // LOGICA GUARDAR Y ARTICULOS
    // ==========================================

    function initLogicaArticuloGeneral() {
        $("#chkArticuloGeneral").on("change", function () {
            const isChecked = $(this).is(":checked");
            $("#articuloGeneral").prop("disabled", !isChecked);
            if (!isChecked) $("#articuloGeneral").val("");
            const $jerarquia = $("#filtroMarcaGeneral, #filtroDivisionGeneral, #filtroDepartamentoGeneral, #filtroClaseGeneral");
            const $btns = $("#btnMarcaGeneral, #btnDivisionGeneral, #btnDepartamentoGeneral, #btnClaseGeneral");

            $jerarquia.prop("disabled", isChecked);
            if (isChecked) {
                $jerarquia.val([]);
                $btns.addClass("d-none");
            }
        });
    }

    function initDatepickers() {
        if (!$.datepicker) return;
        const opts = { dateFormat: "dd/mm/yy", changeMonth: true, changeYear: true };
        $("#fechaInicioGeneral, #fechaFinGeneral").datepicker(opts);
        $(".btn-outline-secondary:has(.fa-calendar)").click(function () { $(this).parent().find("input[type='text']").datepicker("show"); });
    }

    function obtenerValorCampo(configId, selectId, triggerVal) {
        const valSelect = $(selectId).val();

        if (valSelect === triggerVal) {
            const conf = CONFIG_MULTIPLE.find(c => c.id === configId);
            if (conf) {
                const seleccionados = $(conf.btnOpen).data("seleccionados");
                return seleccionados || [];
            }
        }

        if (valSelect && valSelect !== "") {
            return [valSelect];
        }

        return [];
    }

    const archivoToBase64 = file => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });

    async function guardarPromocion(tipo) {
        const sufijo = tipo;
        const motivo = $(`#motivo${sufijo}`).val();
        const desc = $(`#descripcion${sufijo}`).val();
        const fechaInicio = getFullISOString(`#fechaInicio${sufijo}`, `#timeInicio${sufijo}`);
        const fechaFin = getFullISOString(`#fechaFin${sufijo}`, `#timeFin${sufijo}`);

        // 1. Validaciones iniciales
        if (!motivo || !desc || !fechaInicio || !fechaFin) {
            Swal.fire("Error", "Faltan datos obligatorios (Motivo, Descripción, Fechas)", "warning");
            return;
        }


        // Validamos el archivo antes de seguir
        if (!esArchivoValido('#inputGroupFile24', '#fileName')) {
            // Si no hay archivo o es inválido, mostramos alerta si está vacío
            if ($('#inputGroupFile24')[0].files.length === 0) {
                Swal.fire("Archivo requerido", "Debe adjuntar el soporte", "warning");
            }
            return; // Detenemos la ejecución
        }

        // 2. Manejo del Archivo
        const fileInput = $('#inputGroupFile24')[0].files[0];
        if (!fileInput) {
            Swal.fire("Archivo requerido", "Debe adjuntar el soporte de la promoción", "warning");
            return;
        }

        const leerArchivo = file => new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = e => reject(e);
        });

        Swal.fire({ title: 'Procesando archivo...', didOpen: () => Swal.showLoading() });

        try {
            const base64Completo = await leerArchivo(fileInput);

            // 3. Recolección de segmentos
            const marcas = obtenerValorCampo("marca", "#filtroMarcaGeneral", "3");
            const divisiones = obtenerValorCampo("division", "#filtroDivisionGeneral", "3");
            const canales = obtenerValorCampo("canal", "#filtroCanalGeneral", "3");

            const segmentosValidados = [
                { "tiposegmento": "SEGMARCA", "codigos": marcas },
                { "tiposegmento": "SEGDIVISION", "codigos": divisiones },
                { "tiposegmento": "SEGCANAL", "codigos": canales }
            ].map(seg => ({
                ...seg,
                "tipoasignacion": (seg.codigos && seg.codigos.length > 0) ? "C" : "T"
            }));

            // 4. Construcción del Body
            const body = {
                "tipoclaseetiqueta": "PRGENERAL",
                "idopcion": getIdOpcionSeguro(),
                "idcontrolinterfaz": "BTNGRABAR",
                "ideventoetiqueta": "EVCLICK",
                "nombreArchivoSoporte": fileInput.name,
                "archivoSoporteBase64": base64Completo,
                "promocion": {
                    "descripcion": desc,
                    "motivo": parseInt(motivo, 10) || 0,
                    "clasepromocion": parseInt($("#promocionTipo").val(), 10) || 0,
                    "fechahorainicio": fechaInicio,
                    "fechahorafin": fechaFin,
                    "marcaregalo": $("#regaloGeneral").is(":checked") ? "S" : "N",
                    "marcaprocesoaprobacion": "",
                    "idusuarioingreso": getUsuario(),
                    "nombreusuario": getUsuario(),
                },
                "acuerdos": [
                    {
                        "idacuerdo": parseInt($("#fondoProveedorIdGeneral").val(), 10) || 0,
                        "porcentajedescuento": parseFloat($("#descuentoProveedorGeneral").val()) || 0,
                        "valorcomprometido": parseCurrency($("#fondoValorTotalGeneral").val())
                    },
                    {
                        "idacuerdo": parseInt($("#acuerdoPropioIdGeneral").val(), 10) || 0,
                        "porcentajedescuento": parseFloat($("#descuentoPropioGeneral").val()) || 0,
                        "valorcomprometido": parseCurrency($("#comprometidoPropioGeneral").val())
                    }
                ],
                "segmentos": segmentosValidados
            };

            const payload = {
                "code_app": "APP20260128155212346",
                "http_method": "POST",
                "endpoint_path": "api/promocion/insertar",
                "client": "APL",
                "body_request": body
            };

            console.log("body: ", body);
            // 5. Envío vía AJAX
            $.ajax({
                url: "/api/apigee-router-proxy",
                method: "POST",
                contentType: "application/json",
                data: JSON.stringify(payload),
                success: function (res) {
                    console.log(res);
                    const respuestaNegocio = res.json_response || res;

                    if (respuestaNegocio.codigoretorno == 1) {
                        Swal.fire("Éxito", "Promoción Guardada: " + respuestaNegocio.mensaje, "success")
                            .then(() => {
                                resetearFormulario(tipo); // ← AQUÍ, después de que el usuario cierra el Swal
                            });
                    } else {
                        Swal.fire("Atención", respuestaNegocio.mensaje || "Error en base de datos", "warning");
                    }
                },
                error: function (xhr) {
                    Swal.fire("Error", "Error de comunicación: " + xhr.statusText, "error");
                }
            });

        } catch (error) {
            console.error(error);
            Swal.fire("Error", "No se pudo procesar el archivo seleccionado", "error");
        }
    }

    function resetearFormulario(sufijo) {
        console.log('resetearFormulario sufijo: ', sufijo);

        // --- Campos de texto / select básicos ---
        $(`#motivo${sufijo}`).val("").trigger("change");
        $(`#descripcion${sufijo}`).val("");
        $(`#fechaInicio${sufijo}`).val("");
        $(`#fechaFin${sufijo}`).val("");
        $(`#timeInicio${sufijo}`).val("");
        $(`#timeFin${sufijo}`).val("");
        $(`#regaloGeneral`).prop("checked", false);

        // --- Acuerdo Proveedor ---
        $("#fondoProveedorGeneral").val("").prop("disabled", false);
        $("#fondoProveedorIdGeneral").val("");
        $("#fondoDisponibleHiddenGeneral").val("");
        $("#fondoValorTotalGeneral").val("");
        $("#descuentoProveedorGeneral").val("");

        // --- Acuerdo Propio ---
        $("#acuerdoPropioGeneral").val("");
        $("#acuerdoPropioIdGeneral").val("");
        $("#acuerdoPropioDisponibleHiddenGeneral").val("");
        $("#comprometidoPropioGeneral").val("");
        $("#descuentoPropioGeneral").val("");

        // --- Descuento Total ---
        $("#descuentoTotalGeneral").val("");

        // --- Filtros Jerarquía y Combos (Selects + Botones múltiple) ---
        CONFIG_MULTIPLE.forEach(conf => {
            $(conf.select).val("").trigger("change");         // Reset select
            $(conf.btnOpen).addClass("d-none");               // Ocultar botón Varios
            $(conf.btnOpen).removeData("seleccionados");      // Limpiar selección guardada
            $(conf.btnOpen).html(`<i class="fa-solid fa-list-check"></i>`);
            $(conf.btnOpen).removeClass("btn-success").addClass("btn-outline-secondary");

            // Desmarcar todos los checkboxes del modal correspondiente
            $(`${conf.body} input[type='checkbox']`).prop("checked", false);
        });

        // --- Tipo Cliente ---
        $("#tipoClienteGeneral").val("").trigger("change");
        $("#btnListaClienteGeneral").addClass("d-none");

        // --- Archivo ---
        $("#inputGroupFile24").val("");
        $("#fileName").textContent = "";  // Si usas span de nombre
        const fileNameSpan = document.getElementById("fileName");
        if (fileNameSpan) fileNameSpan.textContent = "";

        // --- Artículo (si aplica) ---
        $("#chkArticuloGeneral").prop("checked", false).trigger("change");
        $("#articuloGeneral").val("").prop("disabled", true);

        // --- Limpiar variables temporales globales ---
        proveedorTemporal = null;
        propioTemporal = null;

        // --- Quitar clases de validación visual ---
        $(".is-invalid").removeClass("is-invalid");
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

    // ==========================================
    // INIT
    // ==========================================
    $(document).ready(function () {
        console.log("=== CrearPromocion JS Loaded ===");

        togglePromocionForm();
        initLogicaArticuloGeneral();
        initLogicaSeleccionMultiple();
        initValidacionesFinancieras();
        initDatepickers();

        $("#promocionTipo").change(function () {
            togglePromocionForm();
            const tipo = getTipoPromocion();
            if (tipo == idCatalogoArticulo) cargarMotivosPromociones("#motivoArticulos");
            if (tipo == idCatalogoCombos) cargarMotivosPromociones("#motivoCombos");
        });

        // Carga inicial
        cargarTiposPromocion(function () {
            cargarMotivosPromociones("#motivoGeneral");
            cargarFiltrosJerarquia();
            cargarCombosPromociones();
        });

        // Eventos Botones Guardar
        $("#btnGuardarPromocionGeneral").click(() => guardarPromocion("General"));

        // Modales de Acuerdo
        $("#modalConsultaProveedor").on("show.bs.modal", function () {
            proveedorTemporal = null;
            consultarAcuerdos("TFPROVEDOR", "tablaProveedores", (s) => proveedorTemporal = s);
        });
        $("#btnAceptarProveedor").click(function () {
            if (proveedorTemporal) {
                setFondoProveedorEnForm(proveedorTemporal);
                $("#modalConsultaProveedor").modal("hide");
            }
        });

        $("#modalConsultaAcuerdoPropio").on("show.bs.modal", function () {
            propioTemporal = null;
            consultarAcuerdos("TFPROPIO", "tablaAcuerdosPropios", (s) => propioTemporal = s);
        });
        $("#btnAceptarAcuerdoPropio").click(function () {
            if (propioTemporal) {
                setFondoPropioEnForm(propioTemporal);
                $("#modalConsultaAcuerdoPropio").modal("hide");
            }
        });

        // Tipo Cliente
        $("#tipoClienteGeneral").off("change").on("change", function () {
            const val = $(this).val();
            if (val === "3" || val === "4") {
                $("#btnListaClienteGeneral").removeClass("d-none");
            } else {
                $("#btnListaClienteGeneral").addClass("d-none");
            }
        });

        // Input File
        $('#inputGroupFile24').on('change', function () {
           esArchivoValido('#inputGroupFile24', '#fileName');
        });

        // Función auxiliar para no repetir código
        

        $(".btn-secondary[id^='btnCancelar']").click(() => location.reload());
    });
})();