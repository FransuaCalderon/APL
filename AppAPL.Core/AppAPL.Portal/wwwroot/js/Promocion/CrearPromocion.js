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
        { id: "mediopago", select: "#filtroMedioPagoGeneral", btnOpen: "#btnMedioPagoGeneral", body: "#bodyModalMedioPago", btnAccept: "#btnAceptarMedioPago", triggerVal: "7" } // Ojo: Medio pago suele usar 7 u otro valor
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
        // Elimina todo lo que no sea número o punto (asumiendo formato guardado o crudo)
        // Si viene con formato español (1.000,00), hay que normalizar.
        // Estrategia simple: limpiar no numéricos excepto coma y punto.
        let clean = str.toString().replace(/[^0-9.,-]/g, '');
        // Si tiene coma como decimal, reemplazar.
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
        const tipo = getTipoPromocion();
        $("#formGeneral").toggle(tipo === "General");
        $("#formArticulos").toggle(tipo === "Articulos");
        $("#formCombos").toggle(tipo === "Combos");
    }

    // Helper para llenar Select y Modal simultáneamente
    const llenarComboYModal = ($select, $modalBody, items, labelDefault, valorVarios, idPrefijo) => {
        // 1. Llenar Select
        $select.empty();
        $select.append(`<option selected value="">${labelDefault}</option>`);
        // Opción Varios
        $select.append(`<option value="${valorVarios}" class="fw-bold text-success">-- VARIOS --</option>`);

        // 2. Llenar Modal con Checkboxes
        $modalBody.empty();
        const $ul = $('<ul class="list-group w-100"></ul>');

        if (Array.isArray(items)) {
            items.forEach(i => {
                const codigo = i.codigo || i.id || i.valor;
                const texto = i.nombre || i.descripcion || i.codigo;

                // Opción simple en select
                $select.append($("<option>", { value: codigo, text: texto }));

                // Checkbox en modal
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

        // --- 1. VALIDACIÓN PRESUPUESTO PROVEEDOR ---
        $("#fondoValorTotalGeneral").on("blur", function () {
            // Limpieza: solo números y puntos
            let valStr = $(this).val().replace(/[^0-9.]/g, '');
            let valorIngresado = parseFloat(valStr) || 0;

            // Obtener disponible del hidden (se setea al elegir proveedor)
            let disponibleStr = $("#fondoDisponibleHiddenGeneral").val();
            // Limpiar disponible por si viene con formato
            let disponible = parseCurrency(disponibleStr);

            // Validar
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
                // Formatear visualmente
                $(this).val(formatCurrencySpanish(valorIngresado));
            }
        });

        // --- 2. VALIDACIÓN PRESUPUESTO PROPIO ---
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

        // --- 3. CÁLCULO DE PORCENTAJES ---
        const soloNumeros = function (e) {
            // Reemplaza cualquier cosa que no sea número o punto
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

        // Formato visual al salir (% al final)
        $("#descuentoProveedorGeneral, #descuentoPropioGeneral").on("blur", function () {
            let val = parseFloat($(this).val()) || 0;
            if (val > 0) $(this).val(val.toFixed(2) + "%");
        });

        // Limpiar % al entrar para editar
        $("#descuentoProveedorGeneral, #descuentoPropioGeneral").on("focus", function () {
            let val = $(this).val().replace("%", "");
            $(this).val(val);
        });
    }

    // Lógica para manejar la selección múltiple en todos los filtros
    function initLogicaSeleccionMultiple() {
        CONFIG_MULTIPLE.forEach(conf => {
            // 1. Listener en el Select (Change)
            $(conf.select).off("change").on("change", function () {
                const val = $(this).val();

                // Si selecciona "Varios", mostrar botón y abrir modal
                if (val === conf.triggerVal) {
                    $(conf.btnOpen).removeClass("d-none");
                    // Opcional: abrir modal automáticamente al seleccionar
                    // const modalId = $(conf.btnOpen).attr("data-bs-target");
                    // $(modalId).modal("show");
                } else {
                    $(conf.btnOpen).addClass("d-none");
                    // Limpiar data guardada si cambia a selección simple
                    $(conf.btnOpen).removeData("seleccionados");
                    $(conf.btnOpen).html(`<i class="fa-solid fa-list-check"></i>`);
                    $(conf.btnOpen).removeClass("btn-success").addClass("btn-outline-secondary");
                }

                // VALIDACIÓN ESPECÍFICA MARCA: 
                // Si cambia en el select principal a algo que NO es Varios (1 sola marca)
                if (conf.id === "marca") {
                    if (val !== conf.triggerVal && val !== "") {
                        validarBloqueoProveedor(1); // 1 marca -> Desbloqueado
                    } else if (val === "") {
                        validarBloqueoProveedor(0); // Nada -> Desbloqueado (o bloqueado según regla negocio, asumo desbloqueado para elegir)
                    }
                }
            });

            // 2. Listener en el Botón "Aceptar" del Modal
            $(conf.btnAccept).off("click").on("click", function () {
                // Obtener checkboxes marcados en el body correspondiente
                const seleccionados = [];
                $(`${conf.body} input[type='checkbox']:checked`).each(function () {
                    seleccionados.push($(this).val());
                });

                // Guardar array en el botón de apertura
                const $btnTrigger = $(conf.btnOpen);
                $btnTrigger.data("seleccionados", seleccionados);

                // Feedback Visual
                if (seleccionados.length > 0) {
                    $btnTrigger.removeClass("btn-outline-secondary").addClass("btn-success");
                    $btnTrigger.html(`<i class="fa-solid fa-list-check"></i> (${seleccionados.length})`);
                } else {
                    $btnTrigger.removeClass("btn-success").addClass("btn-outline-secondary");
                    $btnTrigger.html(`<i class="fa-solid fa-list-check"></i>`);
                }

                // VALIDACIÓN ESPECÍFICA MARCA:
                if (conf.id === "marca") {
                    validarBloqueoProveedor(seleccionados.length);
                }

                console.log(`Guardado ${conf.id}:`, seleccionados);
            });
        });
    }

    function validarBloqueoProveedor(cantidad) {
        const $inputProv = $("#fondoProveedorGeneral");
        const $btnProv = $inputProv.next("button"); // El botón de la lupa
        const $idProv = $("#fondoProveedorIdGeneral");
        const $idHidden = $("#fondoDisponibleHiddenGeneral");

        if (cantidad > 1) {
            // Bloquear
            $inputProv.val("").prop("disabled", true).attr("placeholder", "Bloqueado por múltiples marcas");
            $idProv.val("");
            $idHidden.val("0");
            $btnProv.prop("disabled", true);
            // Limpiar valores dependientes
            $("#fondoValorTotalGeneral").val("");
            $("#descuentoProveedorGeneral").val("");
            $("#descuentoTotalGeneral").val("");
        } else {
            // Desbloquear
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
                        $select.append($("<option>").val("General").text(item.nombre_catalogo));
                    } else if (etiqueta === "PRARTICULO") {
                        idCatalogoArticulo = item.idcatalogo;
                        $select.append($("<option>").val("Articulos").text(item.nombre_catalogo));
                    } else if (etiqueta === "PRCOMBO") {
                        idCatalogoCombos = item.idcatalogo;
                        $select.append($("<option>").val("Combos").text(item.nombre_catalogo));
                    }
                });
                $select.val("General");
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

                // Usamos el helper para llenar Select y Modal
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

                // Tipo Cliente (Manejo especial o similar)
                const $cli = $("#tipoClienteGeneral");
                $cli.empty().append('<option selected value="">Todos</option>');
                if (data.tiposclientes) data.tiposclientes.forEach(c => $cli.append(`<option value="${c.codigo}">${c.nombre}</option>`));
                $cli.append('<option value="3">Lista Específica</option><option value="4">Varios</option>'); // Ajustar valores según backend
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
    // LOGICA GUARDAR Y ARTICULOS
    // ==========================================

    function initLogicaArticuloGeneral() {
        $("#chkArticuloGeneral").on("change", function () {
            const isChecked = $(this).is(":checked");
            $("#articuloGeneral").prop("disabled", !isChecked);
            if (!isChecked) $("#articuloGeneral").val("");
            const $jerarquia = $("#filtroMarcaGeneral, #filtroDivisionGeneral, #filtroDepartamentoGeneral, #filtroClaseGeneral");
            // Botones de modal tambien
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

    // Función auxiliar para obtener datos de un campo (Simple o Múltiple)
    function obtenerValorCampo(configId, selectId, triggerVal) {
        const valSelect = $(selectId).val();

        // Si es selección múltiple (Varios)
        if (valSelect === triggerVal) {
            // Buscamos la configuración para obtener el botón
            const conf = CONFIG_MULTIPLE.find(c => c.id === configId);
            if (conf) {
                const seleccionados = $(conf.btnOpen).data("seleccionados");
                return seleccionados || []; // Retorna Array
            }
        }

        // Si es selección simple y tiene valor
        if (valSelect && valSelect !== "") {
            return [valSelect]; // Retorna Array con 1 elemento
        }

        return []; // Retorna Array vacío
    }

    function guardarPromocion(tipo) {
        const sufijo = tipo;
        const motivo = $(`#motivo${sufijo}`).val();
        const desc = $(`#descripcion${sufijo}`).val();
        const fechaInicio = getFullISOString(`#fechaInicio${sufijo}`, `#timeInicio${sufijo}`);
        const fechaFin = getFullISOString(`#fechaFin${sufijo}`, `#timeFin${sufijo}`);

        if (!motivo || !desc || !fechaInicio || !fechaFin) {
            Swal.fire("Error", "Faltan datos obligatorios (Motivo, Descripción, Fechas)", "warning"); return;
        }

        // Recolección dinámica de datos generales
        const marcas = obtenerValorCampo("marca", "#filtroMarcaGeneral", "3");
        const divisiones = obtenerValorCampo("division", "#filtroDivisionGeneral", "3");
        const canales = obtenerValorCampo("canal", "#filtroCanalGeneral", "3");
        // ... agregar el resto según necesidad del backend

        const body = {
            "tipoclaseetiqueta": "PRGENERAL",
            "idopcion": getIdOpcionSeguro(),
            "promocion": {
                "descripcion": desc,
                "motivo": parseInt(motivo, 10) || 0,
                "clasepromocion": 1,
                "fechahorainicio": fechaInicio,
                "fechahorafin": fechaFin,
                "marcaregalo": $("#regaloGeneral").is(":checked") ? "S" : "N",
                "idusuarioingreso": getUsuario(),
            },
            // Ejemplo de cómo se mandan los segmentos seleccionados
            "segmentos": [
                { "tiposegmento": "SEGMARCA", "codigos": marcas },
                { "tiposegmento": "SEGDIVISION", "codigos": divisiones },
                { "tiposegmento": "SEGCANAL", "codigos": canales }
            ],
            // Valores financieros limpios
            "finanzas": {
                "comprometido_proveedor": parseCurrency($("#fondoValorTotalGeneral").val()),
                "dscto_proveedor": parseFloat($("#descuentoProveedorGeneral").val()) || 0,
                "comprometido_propio": parseCurrency($("#comprometidoPropioGeneral").val()),
                "dscto_propio": parseFloat($("#descuentoPropioGeneral").val()) || 0
            }
        };

        const payload = {
            code_app: "APP20260128155212346",
            http_method: "POST",
            endpoint_path: "/api/promocion/insertar",
            client: "APL",
            body_request: body
        };

        var formData = new FormData();
        var fileInput = $('#inputGroupFile24')[0].files[0];
        if (fileInput) formData.append("ArchivoSoporte", fileInput);
        formData.append("RouterRequestJson", JSON.stringify(payload));

        Swal.fire({ title: 'Guardando...', didOpen: () => Swal.showLoading() });

        $.ajax({
            url: "/api/apigee-router-proxy",
            method: "POST",
            processData: false,
            contentType: false,
            data: formData,
            success: function (res) {
                if (res?.code_status === 200) Swal.fire("Éxito", "Promoción Guardada", "success");
                else Swal.fire("Error", res?.json_response?.mensaje || "Error al guardar", "error");
            },
            error: function () { Swal.fire("Error", "Error de comunicación", "error"); }
        });
    }

    // ==========================================
    // INIT
    // ==========================================
    $(document).ready(function () {
        console.log("=== CrearPromocion JS Loaded ===");

        togglePromocionForm();
        initLogicaArticuloGeneral();
        initLogicaSeleccionMultiple(); // ✅ Inicia listeners para TODOS los selects (Jerarquía + Combos)
        initValidacionesFinancieras(); // ✅ Inicia validaciones $, Presupuesto y %
        initDatepickers();

        $("#promocionTipo").change(function () {
            togglePromocionForm();
            const tipo = getTipoPromocion();
            if (tipo === "Articulos") cargarMotivosPromociones("#motivoArticulos");
            if (tipo === "Combos") cargarMotivosPromociones("#motivoCombos");
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

        // Tipo Cliente (Manejo de archivo específico)
        $("#tipoClienteGeneral").off("change").on("change", function () {
            const val = $(this).val();
            // Si es 3 (Lista Esp) o 4 (Varios) -> segun la carga de combos
            if (val === "3" || val === "4") {
                $("#btnListaClienteGeneral").removeClass("d-none");
                // Logica visual adicional si se requiere
            } else {
                $("#btnListaClienteGeneral").addClass("d-none");
            }
        });

        // Input File
        $('#inputGroupFile24').on('change', function () {
            const fileNameSpan = document.getElementById('fileName');
            if (this.files && this.files.length > 0) fileNameSpan.textContent = this.files[0].name;
        });

        $(".btn-secondary[id^='btnCancelar']").click(() => location.reload());
    });
})();