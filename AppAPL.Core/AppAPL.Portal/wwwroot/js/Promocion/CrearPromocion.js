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
    let dtItemsConsultaPromo = null;
    let dtAcuerdosArticulo = null;
    let acuerdoArticuloTemporal = null;
    let acuerdoArticuloContexto = null;

    // Configuración para el manejo unificado de "Varios"
    // Mapea: Select -> Botón Apertura -> Modal Body -> Botón Aceptar Modal -> Valor Trigger "Varios"
    const CONFIG_MULTIPLE = [
        // Jerarquía General
        { id: "marca", select: "#filtroMarcaGeneral", btnOpen: "#btnMarcaGeneral", body: "#bodyModalMarca", btnAccept: "#btnAceptarMarca", triggerVal: "3" },
        { id: "division", select: "#filtroDivisionGeneral", btnOpen: "#btnDivisionGeneral", body: "#bodyModalDivision", btnAccept: "#btnAceptarDivision", triggerVal: "3" },
        { id: "depto", select: "#filtroDepartamentoGeneral", btnOpen: "#btnDepartamentoGeneral", body: "#bodyModalDepartamento", btnAccept: "#btnAceptarDepartamento", triggerVal: "3" },
        { id: "clase", select: "#filtroClaseGeneral", btnOpen: "#btnClaseGeneral", body: "#bodyModalClase", btnAccept: "#btnAceptarClase", triggerVal: "3" },

        // Otros Filtros General
        { id: "canal", select: "#filtroCanalGeneral", btnOpen: "#btnCanalGeneral", body: "#bodyModalCanal", btnAccept: "#btnAceptarCanal", triggerVal: "3" },
        { id: "grupo", select: "#filtroGrupoAlmacenGeneral", btnOpen: "#btnGrupoAlmacenGeneral", body: "#bodyModalGrupoAlmacen", btnAccept: "#btnAceptarGrupoAlmacen", triggerVal: "3" },
        { id: "almacen", select: "#filtroAlmacenGeneral", btnOpen: "#btnAlmacenGeneral", body: "#bodyModalAlmacen", btnAccept: "#btnAceptarAlmacen", triggerVal: "3" },
        { id: "mediopago", select: "#filtroMedioPagoGeneral", btnOpen: "#btnMedioPagoGeneral", body: "#bodyModalMedioPago", btnAccept: "#btnAceptarMedioPago", triggerVal: "7" },

        // --- NUEVOS: Filtros Artículos ---
        { id: "canalArticulos", select: "#filtroCanalArticulos", btnOpen: "#btnCanalArticulos", body: "#bodyModalCanal", btnAccept: "#btnAceptarCanal", triggerVal: "3" },
        { id: "grupoArticulos", select: "#filtroGrupoAlmacenArticulos", btnOpen: "#btnGrupoAlmacenArticulos", body: "#bodyModalGrupoAlmacen", btnAccept: "#btnAceptarGrupoAlmacen", triggerVal: "3" },
        { id: "almacenArticulos", select: "#filtroAlmacenArticulos", btnOpen: "#btnAlmacenArticulos", body: "#bodyModalAlmacen", btnAccept: "#btnAceptarAlmacen", triggerVal: "3" }
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
    // MODIFICADO: Se agrega parámetro opcional textoTodas para insertar opción "Todas"/"Todos" después de "Seleccione..."
    const llenarComboYModal = ($select, $modalBody, items, labelDefault, valorVarios, idPrefijo, textoTodas = null) => {
        $select.empty();
        $select.append(`<option selected value="">${labelDefault}</option>`);

        // Si se pasa textoTodas, agregar opción "Todas"/"Todos" con valor "TODAS"
        if (textoTodas) {
            $select.append(`<option value="TODAS">${textoTodas}</option>`);
        }

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
        $("#descuentoProveedorGeneral, #fondoValorTotalGeneral").prop("disabled", true);
        $("#descuentoPropioGeneral, #comprometidoPropioGeneral").prop("disabled", true);
        // --- VALIDACIONES DE PRESUPUESTO AL SALIR DEL CAMPO (BLUR) ---
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

        // NUEVO: Bloquear letras mientras se escribe en los campos de dólares (solo números, punto y coma)
        $("#fondoValorTotalGeneral, #comprometidoPropioGeneral").on("input", function () {
            this.value = this.value.replace(/[^0-9.,]/g, '');
        });

        // --- VALIDACIONES DE DESCUENTO ---
        const soloNumerosDescuento = function (e) {
            // Solo permite números y puntos
            this.value = this.value.replace(/[^0-9.]/g, '');

            // NUEVO: Validar que no sobrepase el 100%
            let val = parseFloat(this.value);
            if (val > 100) {
                this.value = "100";
            }
            calcularTotalDescuento();
        };

        $("#descuentoProveedorGeneral").on("input", soloNumerosDescuento);
        $("#descuentoPropioGeneral").on("input", soloNumerosDescuento);

        function calcularTotalDescuento() {
            let descProv = parseFloat($("#descuentoProveedorGeneral").val()) || 0;
            let descProp = parseFloat($("#descuentoPropioGeneral").val()) || 0;
            let total = descProv + descProp;
            // Opcional: si la suma de ambos supera 100, puedes limitarla también si tu negocio lo requiere.
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

                    // NUEVO: Guardar en el botón Aceptar quién lo invocó (General o Artículos)
                    $(conf.btnAccept).data("target-btn", conf.btnOpen);
                    $(conf.btnAccept).data("target-body", conf.body);
                    $(conf.btnAccept).data("target-id", conf.id);

                    setTimeout(() => {
                        $(conf.btnOpen)[0].click();
                    }, 50);

                } else {
                    $(conf.btnOpen).addClass("d-none");
                    $(conf.btnOpen).removeData("seleccionados");
                    $(conf.btnOpen).html(`<i class="fa-solid fa-list-check"></i>`);
                    $(conf.btnOpen).removeClass("btn-success").addClass("btn-outline-secondary");
                }

                if (conf.id === "marca" || conf.id === "marcaArticulos") {
                    if (val === "TODAS") {
                        validarBloqueoProveedor(true);
                    } else if (val !== "" && val !== conf.triggerVal) {
                        validarBloqueoProveedor(false);
                    } else if (val === "") {
                        validarBloqueoProveedor(false);
                    }
                }
            });

            // Si el usuario da clic manual al botoncito azul para reabrir
            $(conf.btnOpen).off("click.setTarget").on("click.setTarget", function () {
                $(conf.btnAccept).data("target-btn", conf.btnOpen);
                $(conf.btnAccept).data("target-body", conf.body);
                $(conf.btnAccept).data("target-id", conf.id);
            });
        });

        // Unificar el evento 'click' para todos los botones de Aceptar (evita que se sobreescriban)
        const uniqueAcceptBtns = [...new Set(CONFIG_MULTIPLE.map(c => c.btnAccept))];
        uniqueAcceptBtns.forEach(btnAcceptSelector => {
            $(btnAcceptSelector).off("click.acceptMulti").on("click.acceptMulti", function () {
                const targetBtnSelector = $(this).data("target-btn");
                const targetBodySelector = $(this).data("target-body");
                const targetId = $(this).data("target-id");

                if (!targetBtnSelector) return;

                const seleccionados = [];
                $(`${targetBodySelector} input[type='checkbox']:checked`).each(function () {
                    seleccionados.push($(this).val());
                });

                const $btnTrigger = $(targetBtnSelector);
                $btnTrigger.data("seleccionados", seleccionados);

                if (seleccionados.length > 0) {
                    $btnTrigger.removeClass("btn-outline-secondary").addClass("btn-success");
                    $btnTrigger.html(`<i class="fa-solid fa-list-check"></i> (${seleccionados.length})`);
                } else {
                    $btnTrigger.removeClass("btn-success").addClass("btn-outline-secondary");
                    $btnTrigger.html(`<i class="fa-solid fa-list-check"></i>`);
                }

                if (targetId === "marca" || targetId === "marcaArticulos") {
                    validarBloqueoProveedor(seleccionados.length > 1);
                }
            });
        });
    }

    // MODIFICADO: Ahora recibe un booleano (bloquear) y además bloquea/desbloquea % Dscto Prov. y $ Comprometido Prov.
    function validarBloqueoProveedor(bloquear) {
        const $inputProv = $("#fondoProveedorGeneral");
        const $btnProv = $inputProv.next("button");
        const $idProv = $("#fondoProveedorIdGeneral");
        const $idHidden = $("#fondoDisponibleHiddenGeneral");
        const $descuentoProv = $("#descuentoProveedorGeneral");
        const $comprometidoProv = $("#fondoValorTotalGeneral");

        if (bloquear) {
            // Bloquear ID Acuerdo Proveedor
            $inputProv.val("").prop("disabled", true).attr("placeholder", "");
            $idProv.val("");
            $idHidden.val("0");
            $btnProv.prop("disabled", true);

            // Bloquear % Dscto Prov.
            $descuentoProv.val("").prop("disabled", true);

            // Bloquear $ Comprometido Prov.
            $comprometidoProv.val("").prop("disabled", true);

            // Limpiar Descuento Total
            $("#descuentoTotalGeneral").val("");
        }   else {
            // Desbloquear SOLO el buscador de ID Acuerdo Proveedor
            $inputProv.prop("disabled", false).attr("placeholder", "Seleccione...");
            $btnProv.prop("disabled", false);

            // NUEVO: Solo desbloquear montos/descuentos si YA hay un ID seleccionado
            if ($idProv.val() !== "") {
                $descuentoProv.prop("disabled", false);
                $comprometidoProv.prop("disabled", false);
            } else {
                $descuentoProv.prop("disabled", true);
                $comprometidoProv.prop("disabled", true);
            }
        }
    }

    // ==========================================
    // CARGA DE DATOS (APIS)
    // ==========================================

    function cargarTiposPromocion(callback) {
        const idOpcion = getIdOpcionSeguro();
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
                // MODIFICADO: "Seleccione..." como default + opción "Todas"/"Todos" separada
                llenarComboYModal($("#filtroMarcaGeneral"), $("#bodyModalMarca"), data.marcas, "Seleccione...", "3", "marca", "Todas");
                llenarComboYModal($("#filtroDivisionGeneral"), $("#bodyModalDivision"), data.divisiones, "Seleccione...", "3", "division", "Todas");
                llenarComboYModal($("#filtroDepartamentoGeneral"), $("#bodyModalDepartamento"), data.departamentos, "Seleccione...", "3", "depto", "Todos");
                llenarComboYModal($("#filtroClaseGeneral"), $("#bodyModalClase"), data.clases, "Seleccione...", "3", "clase", "Todas");
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

                // 1. Filtrar "Todos" o "0" del Medio de Pago para que no aparezca
                let mediosPagoFiltrados = (data.mediospagos || []).filter(m => {
                    let nom = (m.nombre || "").toUpperCase();
                    return nom !== "TODOS" && nom !== "TODAS" && m.codigo !== "0";
                });

                llenarComboYModal($("#filtroCanalGeneral"), $("#bodyModalCanal"), data.canales, "Seleccione...", "3", "canal");
                llenarComboYModal($("#filtroGrupoAlmacenGeneral"), $("#bodyModalGrupoAlmacen"), data.gruposalmacenes, "Seleccione...", "3", "grupo");
                llenarComboYModal($("#filtroAlmacenGeneral"), $("#bodyModalAlmacen"), data.almacenes, "Seleccione...", "3", "almacen");
                llenarComboYModal($("#filtroMedioPagoGeneral"), $("#bodyModalMedioPago"), mediosPagoFiltrados, "Seleccione...", "7", "mediopago");
                
                $("#filtroCanalArticulos").html($("#filtroCanalGeneral").html());
                $("#filtroGrupoAlmacenArticulos").html($("#filtroGrupoAlmacenGeneral").html());
                $("#filtroAlmacenArticulos").html($("#filtroAlmacenGeneral").html());

                // Llenar Selects y Modal de Tipo Cliente
                const $cliGen = $("#tipoClienteGeneral");
                const $cliArt = $("#tipoClienteArticulos");
                const $cliCom = $("#tipoClienteCombos");
                const $modalBodyCli = $("#bodyModalTipoCliente");

                // 2. Opciones Iniciales agregando explícitamente "Todos"
                const opcionesBase = `
                    <option selected value="">Seleccione...</option>
                    <option value="TODOS">Todos</option>
                    <option value="4" class="fw-bold text-success">-- VARIOS --</option>
                `;
                $cliGen.empty().append(opcionesBase);
                $cliArt.empty().append(opcionesBase);
                $cliCom.empty().append(opcionesBase);

                $modalBodyCli.empty();
                const $ulCli = $('<ul class="list-group w-100"></ul>');

                if (data.tiposclientes) {
                    data.tiposclientes.forEach(c => {
                        if (c.nombre.toUpperCase() !== "TODOS" && c.codigo !== "0" && c.codigo !== "") {
                            const opt = `<option value="${c.codigo}">${c.nombre}</option>`;
                            $cliGen.append(opt); $cliArt.append(opt); $cliCom.append(opt);

                            const chkId = `chk_tipocliente_${c.codigo}`;
                            $ulCli.append(`
                                <li class="list-group-item">
                                    <input class="form-check-input me-1 chk-seleccion-multiple" type="checkbox" value="${c.codigo}" id="${chkId}">
                                    <label class="form-check-label stretched-link" for="${chkId}">${c.nombre}</label>
                                </li>
                            `);
                        }
                    });
                }
                $modalBodyCli.append($ulCli);

                const opcionFinal = '<option value="3">Lista Específica</option>';
                $cliGen.append(opcionFinal); $cliArt.append(opcionFinal); $cliCom.append(opcionFinal);
            }
        });
    }

    // ==========================================
    // CONSULTA ACUERDOS (PROVEEDOR / PROPIO)
    // ==========================================
    // ==========================================
    // CONSULTA ACUERDOS (PROVEEDOR / PROPIO)
    // ==========================================
    function consultarAcuerdos(tipoFondo, tablaId, onSeleccion) {
        // Destruir DataTable si ya existe para evitar que "se quede pegado" con datos viejos
        if ($.fn.DataTable.isDataTable(`#${tablaId}`)) {
            $(`#${tablaId}`).DataTable().clear().destroy();
        }

        const $tbody = $(`#${tablaId} tbody`);
        $tbody.html('<tr><td colspan="13" class="text-center">Cargando...</td></tr>');
        const claseAcuerdo = getClaseAcuerdo();

        let endpointParams = "/" + tipoFondo + "/" + claseAcuerdo;

        // Condición: Solo mandar parámetro de Marca si es Fondo Proveedor
        if (tipoFondo === "TFPROVEDOR") {
            let marcas = obtenerValorCampo("marca", "#filtroMarcaGeneral", "3");
            let parametroMarca = "0";
            if (marcas && marcas.length === 1) {
                parametroMarca = marcas[0];
            }
            endpointParams += "/" + parametroMarca;
        }

        const payload = {
            code_app: "APP20260128155212346",
            http_method: "GET",
            endpoint_path: "api/Promocion/consultar-acuerdo",
            client: "APL",
            endpoint_query_params: endpointParams
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

                // Generar filas con las clases align-middle
                data.forEach(x => {
                    const row = `<tr class="text-nowrap">
                        <td class="text-center align-middle">
                            <input class="form-check-input acuerdo-radio" type="radio" name="acuerdo_${tipoFondo}"
                                data-idacuerdo="${x.idacuerdo || ''}"
                                data-desc="${x.descripcion || ''}"
                                data-prov="${x.nombre_proveedor || ''}"
                                data-disp="${x.valor_disponible || 0}"
                                data-estado="${x.estado || ''}">
                        </td>
                        <td class="align-middle">${x.idacuerdo}</td>
                        <td class="align-middle">${x.descripcion}</td>
                        <td class="align-middle">${x.idfondo}</td>
                        <td class="align-middle">${x.nombre_proveedor}</td>
                        <td class="align-middle">${x.nombre_tipo_fondo}</td>
                        <td class="align-middle text-end">${formatCurrencySpanish(x.valor_acuerdo)}</td>
                        <td class="align-middle">${fmtDate(x.fecha_inicio)}</td>
                        <td class="align-middle">${fmtDate(x.fecha_fin)}</td>
                        <td class="align-middle text-end">${formatCurrencySpanish(x.valor_disponible)}</td>
                        <td class="align-middle text-end">${formatCurrencySpanish(x.valor_comprometido)}</td>
                        <td class="align-middle text-end">${formatCurrencySpanish(x.valor_liquidado)}</td>
                        <td class="align-middle">${x.estado}</td>
                    </tr>`;
                    $tbody.append(row);
                });

                // Inicialización idéntica a la tabla de Consulta en CrearAcuerdo
                let dt = $(`#${tablaId}`).DataTable({
                    destroy: true,
                    deferRender: true,
                    pageLength: 10,
                    lengthChange: false,
                    dom: '<"row"<"col-12"tr>><"row"<"col-12 text-center"i>><"row"<"col-12 d-flex justify-content-center"p>>',
                    language: {
                        search: "Buscar:",
                        zeroRecords: "No se encontraron acuerdos.",
                        info: "Mostrando _START_ a _END_ de _TOTAL_ acuerdos",
                        infoEmpty: "Sin acuerdos",
                        infoFiltered: "(filtrado de _MAX_ totales)",
                        paginate: { first: "«", last: "»", next: "›", previous: "‹" }
                    },
                    initComplete: function () {
                        const wrapper = $(`#${tablaId}_wrapper`);
                        wrapper.find(".dataTables_paginate").attr("style", "text-align:center !important; float:none !important; display:block !important; width:100% !important; padding-top:0.5rem;");
                        wrapper.find(".dataTables_info").attr("style", "text-align:center !important; float:none !important; display:block !important; width:100% !important; font-size:0.8rem; padding-top:0.5rem;");
                    },
                    drawCallback: function () {
                        const wrapper = $(`#${tablaId}_wrapper`);
                        wrapper.find(".dataTables_paginate").attr("style", "text-align:center !important; float:none !important; display:block !important; width:100% !important; padding-top:0.5rem;");
                    }
                });

                // Enlazar los inputs de búsqueda creados arriba de la tabla en el modal
                if (tablaId === "tablaProveedores") {
                    $("#buscarProveedorInput").off("keyup").on("keyup", function () {
                        dt.search($(this).val()).draw();
                    });
                } else if (tablaId === "tablaAcuerdosPropios") {
                    $("#buscarAcuerdoPropioInput").off("keyup").on("keyup", function () {
                        dt.search($(this).val()).draw();
                    });
                }

                // Delegación de eventos para que detecte el click aunque esté en la página 2 o 3 de la tabla
                $(`#${tablaId} tbody`).off('change', '.acuerdo-radio').on('change', '.acuerdo-radio', function () {
                    $(`#${tablaId} tbody tr`).removeClass("table-active");
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

        // NUEVO: Habilitar campos porque ya se seleccionó un Proveedor
        $("#descuentoProveedorGeneral, #fondoValorTotalGeneral").prop("disabled", false);
    }

    function setFondoPropioEnForm(f) {
        $("#acuerdoPropioGeneral").val(f.display);
        $("#acuerdoPropioIdGeneral").val(f.idAcuerdo);
        $("#acuerdoPropioDisponibleHiddenGeneral").val(f.disponible);

        // NUEVO: Habilitar campos porque ya se seleccionó un Propio
        $("#descuentoPropioGeneral, #comprometidoPropioGeneral").prop("disabled", false);
    }

    // ==========================================
    // RESET FORMULARIO
    // ==========================================
    function resetearFormulario(sufijo) {
        $(`#motivo${sufijo}`).val("").trigger("change");
        $(`#descripcion${sufijo}`).val("");
        $(`#fechaInicio${sufijo}`).val("");
        $(`#fechaFin${sufijo}`).val("");
        $(`#timeInicio${sufijo}`).val("");
        $(`#timeFin${sufijo}`).val("");
        $("#regaloGeneral").prop("checked", false);

        $("#fondoProveedorGeneral").val("").prop("disabled", false).attr("placeholder", "Seleccione...");
        $("#fondoProveedorGeneral").next("button").prop("disabled", false);
        $("#fondoProveedorIdGeneral").val("");
        $("#fondoDisponibleHiddenGeneral").val("");
        $("#fondoValorTotalGeneral").val("").prop("disabled", true);
        $("#descuentoProveedorGeneral").val("").prop("disabled", true);

        $("#acuerdoPropioGeneral").val("");
        $("#acuerdoPropioIdGeneral").val("");
        $("#acuerdoPropioDisponibleHiddenGeneral").val("");
        $("#comprometidoPropioGeneral").val("").prop("disabled", true);
        $("#descuentoPropioGeneral").val("").prop("disabled", true);

        $("#descuentoTotalGeneral").val("");

        CONFIG_MULTIPLE.forEach(conf => {
            $(conf.select).val("").trigger("change");
            $(conf.btnOpen).addClass("d-none");
            $(conf.btnOpen).removeData("seleccionados");
            $(conf.btnOpen).html(`<i class="fa-solid fa-list-check"></i>`);
            $(conf.btnOpen).removeClass("btn-success").addClass("btn-outline-secondary");
            $(`${conf.body} input[type='checkbox']`).prop("checked", false);
        });

        $("#tipoClienteGeneral, #tipoClienteArticulos, #tipoClienteCombos").val("").trigger("change");

        $("#inputGroupFile24").val("");
        const fileNameSpan = document.getElementById("fileName");
        if (fileNameSpan) fileNameSpan.textContent = "";
        $("#tablaArticulosBody").empty();
        $("#chkArticuloGeneral").prop("checked", false).trigger("change");
        $("#articuloGeneral").val("").prop("disabled", true);

        proveedorTemporal = null;
        propioTemporal = null;

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

        // NUEVO: Permitir solo ingreso de números en el input de Artículo
        $("#articuloGeneral").on("input", function () {
            this.value = this.value.replace(/[^0-9]/g, '');
        });
    }

    function initDatepickers() {
        if (!$.datepicker) return;

        const commonOptions = {
            dateFormat: "dd/mm/yy",
            changeMonth: true,
            changeYear: true
        };

        // Datepicker Fecha Inicio
        $("#fechaInicioGeneral, #fechaInicioArticulos, #fechaInicioCombos").datepicker({
            ...commonOptions,
            minDate: 0, // 0 significa "desde el día de hoy"
            onSelect: function (dateText, inst) {
                const startDate = $(this).datepicker("getDate");
                const idFin = this.id.replace("Inicio", "Fin"); // Obtiene el ID correspondiente del Fin

                if (startDate) {
                    // La fecha fin solo puede seleccionarse desde la fecha inicio en adelante
                    $("#" + idFin).datepicker("option", "minDate", startDate);

                    const currentEndDate = $("#" + idFin).datepicker("getDate");
                    if (currentEndDate && currentEndDate < startDate) {
                        $("#" + idFin).val(""); // Borra la fecha fin si quedó obsoleta
                    }
                }
            }
        });

        // Datepicker Fecha Fin
        $("#fechaFinGeneral, #fechaFinArticulos, #fechaFinCombos").datepicker({
            ...commonOptions,
            minDate: 0
        });

        // Mostrar datepicker al dar clic en el ícono de calendario
        $(".btn-outline-secondary:has(.fa-calendar), .btn-outline-secondary:has(img[alt='Calendario'])").click(function () {
            $(this).parent().find("input[type='text']").datepicker("show");
        });
    }

    function obtenerValorCampo(configId, selectId, triggerVal) {
        const valSelect = $(selectId).val();

        // Agregamos "TODOS" a la validación de arreglos vacíos
        if (!valSelect || valSelect === "" || valSelect === "TODAS" || valSelect === "TODOS") {
            return [];
        }

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
        const idProvSeleccionado = parseInt($("#fondoProveedorIdGeneral").val(), 10) || 0;
        const idPropSeleccionado = parseInt($("#acuerdoPropioIdGeneral").val(), 10) || 0;

        // 1. Validaciones iniciales
        if (idProvSeleccionado === 0 && idPropSeleccionado === 0) {
            Swal.fire(
                "Proveedor Requerido",
                "Debe seleccionar al menos un Acuerdo (Proveedor o Propio) para calcular el Descuento Total.",
                "warning"
            );
            return; // Detiene el guardado
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

            // Definimos una función auxiliar para determinar el tipo de asignación
            const determinarAsignacion = (idSelector) => {
                const selector = $(idSelector);
                const valorSeleccionado = selector.val();

                // Si dice TODOS, TODAS o está vacío, es asignación "T" (Todos)
                if (valorSeleccionado === "TODAS" || valorSeleccionado === "TODOS" || !valorSeleccionado || valorSeleccionado.length === 0) {
                    return "T";
                }

                // Lista Específica
                if (valorSeleccionado === "3") {
                    return "D";
                }

                return "C";
            };

            const segmentosConfig = [
                { tipo: "SEGMARCA", codigos: obtenerValorCampo("marca", "#filtroMarcaGeneral", "3"), id: "#filtroMarcaGeneral" },
                { tipo: "SEGDIVISION", codigos: obtenerValorCampo("division", "#filtroDivisionGeneral", "3"), id: "#filtroDivisionGeneral" },
                { tipo: "SEGCLASE", codigos: obtenerValorCampo("clase", "#filtroClaseGeneral", "3"), id: "#filtroClaseGeneral" },
                { tipo: "SEGDEPARTAMENTO", codigos: obtenerValorCampo("departamento", "#filtroDepartamentoGeneral", "3"), id: "#filtroDepartamentoGeneral" },
                { tipo: "SEGCANAL", codigos: obtenerValorCampo("canal", "#filtroCanalGeneral", "3"), id: "#filtroCanalGeneral" },
                { tipo: "SEGGRUPOALMACEN", codigos: obtenerValorCampo("grupoalmacen", "#filtroGrupoAlmacenGeneral", "3"), id: "#filtroGrupoAlmacenGeneral" },
                { tipo: "SEGALMACEN", codigos: obtenerValorCampo("almacen", "#filtroAlmacenGeneral", "3"), id: "#filtroAlmacenGeneral" },
                { tipo: "SEGTIPOCLIENTE", codigos: obtenerValorCampo("tipocliente", "#tipoClienteGeneral", "3"), id: "#tipoClienteGeneral" },
                { tipo: "SEGMEDIOPAGO", codigos: obtenerValorCampo("mediopago", "#filtroMedioPagoGeneral", "3"), id: "#filtroMedioPagoGeneral" }
            ];

            const segmentosValidados = segmentosConfig.map(seg => ({
                tiposegmento: seg.tipo,
                codigos: seg.codigos,
                tipoasignacion: determinarAsignacion(seg.id)
            }));

            // --- NUEVA VALIDACIÓN FRONTEND ---
            // Buscamos si hay algún segmento que sea "D" pero tenga el arreglo de códigos vacío
            const segmentoInvalido = segmentosValidados.find(seg => seg.tipoasignacion === "D" && (!seg.codigos || seg.codigos.length === 0));

            if (segmentoInvalido) {
                Swal.fire(
                    "Atención",
                    `Has seleccionado "Varios" en el filtro de ${segmentoInvalido.tiposegmento.replace('SEG', '')}, pero no has marcado ningún elemento en la lista.`,
                    "warning"
                );
                return; // Detenemos la ejecución para que no haga la petición AJAX
            }

            const idProveedorGeneral = parseInt($("#fondoProveedorIdGeneral").val(), 10) || 0;
            const idProveedorPropio = parseInt($("#acuerdoPropioIdGeneral").val(), 10) || 0;

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
                    "marcaregalo": $("#regaloGeneral").is(":checked") ? "✓" : "",
                    "marcaprocesoaprobacion": "",
                    "idusuarioingreso": getUsuario(),
                    "nombreusuario": getUsuario(),
                },
                "acuerdos": [
                    // Validamos solo el de Proveedor General
                    ...(idProveedorGeneral !== 0 ? [{
                        "idacuerdo": idProveedorGeneral,
                        "porcentajedescuento": parseFloat($("#descuentoProveedorGeneral").val()) || 0,
                        "valorcomprometido": parseCurrency($("#fondoValorTotalGeneral").val()),
                        "etiqueta_tipo_fondo": "TFPROVEDOR"
                    }] : []),
                    ...(idProveedorPropio !== 0 ? [{
                        "idacuerdo": idProveedorPropio,
                        "porcentajedescuento": parseFloat($("#descuentoPropioGeneral").val()) || 0,
                        "valorcomprometido": parseCurrency($("#comprometidoPropioGeneral").val()),
                        "etiqueta_tipo_fondo": "TFPROPIO"
                    }] : [])
                    
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

        // --- Acuerdo Proveedor (incluye desbloqueo) ---
        $("#fondoProveedorGeneral").val("").prop("disabled", false);
        $("#fondoProveedorIdGeneral").val("");
        $("#fondoDisponibleHiddenGeneral").val("");
        $("#fondoValorTotalGeneral").val("").prop("disabled", false);
        $("#descuentoProveedorGeneral").val("").prop("disabled", false);

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

        // --- Tipo Cliente (Resetea los 3 selects de golpe) ---
        $("#tipoClienteGeneral, #tipoClienteArticulos, #tipoClienteCombos").val("").trigger("change");

        // --- Archivo ---
        $("#inputGroupFile24, #inputFileArticulos").val("");
        if (document.getElementById("fileName")) document.getElementById("fileName").textContent = "";
        if (document.getElementById("fileNameArticulos")) document.getElementById("fileNameArticulos").textContent = "";

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
    // CONSULTA DE ITEMS (MODAL ARTÍCULOS)
    // ==========================================

    function cargarFiltrosItemsPromocion() {
        $("#filtroMarcaModal").html('<div class="text-center"><small class="text-muted">Cargando...</small></div>');
        $("#filtroDivisionModal").html('<div class="text-center"><small class="text-muted">Cargando...</small></div>');
        $("#filtroDepartamentoModal").html('<div class="text-center"><small class="text-muted">Cargando...</small></div>');
        $("#filtroClaseModal").html('<div class="text-center"><small class="text-muted">Cargando...</small></div>');

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

                const llenarFiltro = (containerId, items, label) => {
                    const $container = $(`#${containerId}`);
                    $container.empty();
                    if (Array.isArray(items) && items.length > 0) {
                        items.forEach(item => {
                            $container.append(`
                            <div class="form-check">
                                <input class="form-check-input filtro-item-checkbox" type="checkbox"
                                       id="${containerId}_${item.codigo}" value="${item.nombre}">
                                <label class="form-check-label" for="${containerId}_${item.codigo}">${item.nombre}</label>
                            </div>
                        `);
                        });
                    } else {
                        $container.html(`<small class="text-muted">No hay ${label} disponibles</small>`);
                    }
                };

                llenarFiltro("filtroMarcaModal", data.marcas, "marcas");
                llenarFiltro("filtroDivisionModal", data.divisiones, "divisiones");
                llenarFiltro("filtroDepartamentoModal", data.departamentos, "departamentos");
                llenarFiltro("filtroClaseModal", data.clases, "clases");

                initFiltrosModalItems();
            },
            error: function () {
                const errorMsg = '<small class="text-danger">Error al cargar</small>';
                $("#filtroMarcaModal, #filtroDivisionModal, #filtroDepartamentoModal, #filtroClaseModal").html(errorMsg);
            }
        });
    }

    function initFiltrosModalItems() {
        $(".filtro-todas").off("change").on("change", function () {
            const targetId = $(this).data("target");
            const isChecked = $(this).is(":checked");
            $(`#${targetId} .filtro-item-checkbox`).prop("checked", isChecked);
        });

        $(document).off("change.filtroItem", ".filtro-item-checkbox").on("change.filtroItem", ".filtro-item-checkbox", function () {
            const $container = $(this).closest(".border.rounded");
            const $checkboxTodas = $container.find(".filtro-todas");
            const $todos = $container.find(".filtro-item-checkbox");
            $checkboxTodas.prop("checked", $todos.length === $todos.filter(":checked").length);
        });
    }

    function getSelectedFilterValuesPromo(containerId) {
        const valores = [];
        $(`#${containerId} .filtro-item-checkbox:checked`).each(function () {
            valores.push($(this).val());
        });
        return valores;
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
                        data-excedentes="${item.excedente_s || 0}"
                        data-m0u="${item.m0_u || 0}"
                        data-m0s="${item.m0_s || 0}"
                        data-m1u="${item.m1_u || 0}"
                        data-m1s="${item.m1_s || 0}"
                        data-m2u="${item.m2_u || 0}"
                        data-m2s="${item.m2_s || 0}">`,
                        item.codigo || item.iditem || "",
                        item.descripcion || item.nombre || "",
                        formatCurrencySpanish(item.costo || 0),
                        item.stock || 0,
                        item.optimo || 0,
                        item.excedente_u || 0,
                        formatCurrencySpanish(item.excedente_s || 0),
                        item.m0_u || 0,
                        formatCurrencySpanish(item.m0_s || 0),
                        item.m1_u || 0,
                        formatCurrencySpanish(item.m1_s || 0),
                        item.m2_u || 0,
                        formatCurrencySpanish(item.m2_s || 0)
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

    function agregarItemsATablaArticulos(items) {
        const $tbody = $("#tablaArticulosBody");
        let itemsNuevos = 0;

        items.forEach(item => {
            const existe = $tbody.find(`tr[data-codigo="${item.codigo}"]`).length > 0;
            if (existe) return;

            itemsNuevos++;
            const fila = `
        <tr data-codigo="${item.codigo}">
            <td class="text-center align-middle">
                <input type="radio" class="form-check-input item-row-radio" name="itemArticuloSel">
            </td>
            <td class="align-middle table-sticky-col">${item.codigo} - ${item.descripcion}</td>
            <td class="align-middle text-end">${formatCurrencySpanish(item.costo)}</td>
            <td class="align-middle text-end">${item.stock || 0}</td>
            <td class="align-middle text-end">0</td>
            <td class="align-middle text-end">${item.optimo || 0}</td>
            <td class="align-middle text-end">${item.excedenteu || 0}</td>
            <td class="align-middle text-end">${formatCurrencySpanish(item.excedentes || 0)}</td>
            <td class="align-middle text-end">${item.m0u || 0}</td>
            <td class="align-middle text-end">${formatCurrencySpanish(item.m0s || 0)}</td>
            <td class="align-middle text-end">${item.m1u || 0}</td>
            <td class="align-middle text-end">${formatCurrencySpanish(item.m1s || 0)}</td>
            <td class="align-middle text-end">${item.m2u || 0}</td>
            <td class="align-middle text-end">${formatCurrencySpanish(item.m2s || 0)}</td>
            <td class="align-middle text-end">0</td>
            <td class="align-middle text-end">0.00%</td>
            <td class="align-middle text-end">0.00%</td>
            <td class="align-middle text-end">0.00%</td>
            <td class="align-middle text-end">0.00%</td>
            <td class="align-middle celda-editable"><input type="number" class="form-control form-control-sm text-end" placeholder="0" min="0" disabled></td>
            <td class="align-middle celda-editable"><input type="number" class="form-control form-control-sm text-end" placeholder="0" min="0" disabled></td>
            <td class="align-middle celda-editable">
    <select class="form-select form-select-sm select-mediopago-articulo" disabled>
        ${$("#filtroMedioPagoGeneral").html()}
    </select>
</td>
            <td class="align-middle text-end">${formatCurrencySpanish(0)}</td>
            <td class="align-middle celda-editable"><input type="text" class="form-control form-control-sm text-end" placeholder="0.00" disabled></td>
            <td class="align-middle celda-editable"><input type="text" class="form-control form-control-sm text-end" placeholder="0.00" disabled></td>
            <td class="align-middle celda-editable"><input type="text" class="form-control form-control-sm text-end" placeholder="0.00" disabled></td>
            <td class="align-middle celda-editable"><input type="text" class="form-control form-control-sm text-end" placeholder="0.00" disabled></td>
            <td class="align-middle text-end">0.00%</td>
            <td class="align-middle text-end">0.00%</td>
            <td class="align-middle text-end">0.00%</td>
            <td class="align-middle text-end">0.00%</td>
            <td class="align-middle"><input type="text" class="form-control form-control-sm text-end aporte-valor aporte-proveedor" placeholder="0.00" disabled></td>
            <td class="align-middle celda-editable">
                <input type="hidden" class="acuerdo-id-hidden" value="">
                <div class="input-group input-group-sm">
                    <input type="text" class="form-control form-control-sm" placeholder="Seleccione..." readonly disabled>
                    <button class="btn btn-outline-secondary btn-buscar-acuerdo-art" type="button" data-tipofondo="TFPROVEDOR" disabled>
                        <i class="fa-solid fa-magnifying-glass"></i>
                    </button>
                </div>
            </td>
           <td class="align-middle"><input type="text" class="form-control form-control-sm text-end aporte-valor aporte-rebate" placeholder="0.00" disabled></td>
           <td class="align-middle celda-editable">
                <input type="hidden" class="acuerdo-id-hidden" value="">
                <div class="input-group input-group-sm">
                    <input type="text" class="form-control form-control-sm" placeholder="Seleccione..." readonly disabled>
                    <button class="btn btn-outline-secondary btn-buscar-acuerdo-art" type="button" data-tipofondo="TFREBATE" disabled>
                        <i class="fa-solid fa-magnifying-glass"></i>
                    </button>
                </div>
            </td>
            <td class="align-middle celda-editable"><input type="text" class="form-control form-control-sm text-end" placeholder="0.00" disabled></td>
            <td class="align-middle celda-editable">
                <input type="hidden" class="acuerdo-id-hidden" value="">
                <div class="input-group input-group-sm">
                    <input type="text" class="form-control form-control-sm" placeholder="Seleccione..." readonly disabled>
                    <button class="btn btn-outline-secondary btn-buscar-acuerdo-art" type="button" data-tipofondo="TFPROPIO" disabled>
                        <i class="fa-solid fa-magnifying-glass"></i>
                    </button>
                </div>
            </td>
            <td class="align-middle text-end">0.00%</td>
            <td class="align-middle text-end">0.00%</td>
            <td class="align-middle text-end">0.00%</td>
            <td class="align-middle text-end">0.00%</td>
            <td class="align-middle text-end">0.00%</td>
            <td class="align-middle text-end">${formatCurrencySpanish(0)}</td>
            <td class="align-middle text-end">${formatCurrencySpanish(0)}</td>
            <td class="align-middle text-end">${formatCurrencySpanish(0)}</td>
            <td class="align-middle celda-editable text-center"><input class="form-check-input" type="checkbox" disabled></td>
        </tr>`;
            $tbody.append(fila);
        });

        // Lógica de selección de radio buttons
        $(document).off("change", ".item-row-radio").on("change", ".item-row-radio", function () {
            // Bloquear todo
            $("#tablaArticulosBody tr").removeClass("table-active");
            $("#tablaArticulosBody .celda-editable input, #tablaArticulosBody .celda-editable button, #tablaArticulosBody .celda-editable select").prop("disabled", true);
            $("#tablaArticulosBody .aporte-proveedor, #tablaArticulosBody .aporte-rebate, #tablaArticulosBody .aporte-propio").prop("disabled", true);

            // Habilitar la fila seleccionada
            const $fila = $(this).closest("tr");
            $fila.addClass("table-active");
            $fila.find(".celda-editable input, .celda-editable button, .celda-editable select").prop("disabled", false);

            // Solo habilitar aportes si ya tienen un acuerdo seleccionado
            const tieneProvedor = $fila.find("td:eq(32) .acuerdo-id-hidden").val();
            const tieneRebate = $fila.find("td:eq(34) .acuerdo-id-hidden").val();
            const tienePropio = $fila.find("td:eq(36) .acuerdo-id-hidden").val();

            if (tieneProvedor) $fila.find(".aporte-proveedor").prop("disabled", false);
            if (tieneRebate) $fila.find(".aporte-rebate").prop("disabled", false);
            if (tienePropio) $fila.find(".aporte-propio").prop("disabled", false);
            // Checkbox Regalo: quitar disabled de TODAS las filas para que se vea el estado
            $("#tablaArticulosBody td:last-child input[type='checkbox']").prop("disabled", true);
            $fila.find("td:last-child input[type='checkbox']").prop("disabled", false);
        });

        // Auto-seleccionar el primero si no hay ninguno seleccionado
        if (itemsNuevos > 0 && $tbody.find(".item-row-radio:checked").length === 0) {
            const $primeraFila = $tbody.find("tr").first();
            $primeraFila.find(".item-row-radio").prop("checked", true).trigger("change");
        }
    }


    // ==========================================
    // ACUERDOS POR ARTÍCULO (PROVEEDOR/REBATE/PROPIO)
    // ==========================================

    function consultarAcuerdosPorArticulo(etiquetaTipoFondo, codigoItem) {
        if (dtAcuerdosArticulo) {
            dtAcuerdosArticulo.clear().destroy();
            $("#tablaAcuerdosArticulo tbody").empty();
        }

        $("#tablaAcuerdosArticulo tbody").html('<tr><td colspan="16" class="text-center">Cargando...</td></tr>');

        const payload = {
            code_app: "APP20260128155212346",
            http_method: "GET",
            endpoint_path: "api/Promocion/acuerdos-promocion-articulos",
            client: "APL",
            endpoint_query_params: `/${etiquetaTipoFondo}/${codigoItem}`
        };

        $.ajax({
            url: "/api/apigee-router-proxy",
            method: "POST",
            contentType: "application/json",
            data: JSON.stringify(payload),
            success: function (res) {
                const data = res.json_response || [];
                const $tbody = $("#tablaAcuerdosArticulo tbody");
                $tbody.empty();

                if (!data.length) {
                    $tbody.html('<tr><td colspan="16" class="text-center">No hay acuerdos disponibles.</td></tr>');
                    return;
                }

                const fmtDate = (s) => s ? new Date(s).toLocaleDateString("es-EC") : "";

                data.forEach(x => {
                    $tbody.append(`<tr class="text-nowrap">
                    <td class="text-center align-middle">
                        <input class="form-check-input acuerdo-art-radio" type="radio" name="acuerdoArticuloSel"
                            data-idacuerdo="${x.idacuerdo || ''}"
                            data-descripcion="${x.descripcion || ''}"
                            data-proveedor="${x.nombre_proveedor || ''}"
                            data-disponible="${x.valor_disponible || 0}"
                            data-aporte="${x.valor_aporte_por_items || 0}"
                            data-unidades="${x.unidades_limite || 0}"
                            data-estado="${x.estado || ''}">
                    </td>
                    <td class="align-middle">${x.idacuerdo}</td>
                    <td class="align-middle">${x.descripcion}</td>
                    <td class="align-middle">${x.idfondo}</td>
                    <td class="align-middle">${x.nombre_proveedor}</td>
                    <td class="align-middle">${x.nombre_tipo_fondo}</td>
                    <td class="align-middle">${x.clase_acuerdo}</td>
                    <td class="align-middle text-end">${formatCurrencySpanish(x.valor_acuerdo)}</td>
                    <td class="align-middle">${fmtDate(x.fecha_inicio)}</td>
                    <td class="align-middle">${fmtDate(x.fecha_fin)}</td>
                    <td class="align-middle text-end">${formatCurrencySpanish(x.valor_disponible)}</td>
                    <td class="align-middle text-end">${formatCurrencySpanish(x.valor_comprometido)}</td>
                    <td class="align-middle text-end">${formatCurrencySpanish(x.valor_liquidado)}</td>
                    <td class="align-middle text-end">${formatCurrencySpanish(x.valor_aporte_por_items)}</td>
                    <td class="align-middle text-end">${x.unidades_limite}</td>
                    <td class="align-middle">${x.estado}</td>
                </tr>`);
                });

                dtAcuerdosArticulo = $("#tablaAcuerdosArticulo").DataTable({
                    destroy: true,
                    deferRender: true,
                    pageLength: 10,
                    lengthChange: false,
                    dom: '<"row"<"col-12"tr>><"row"<"col-12 text-center"i>><"row"<"col-12 d-flex justify-content-center"p>>',
                    language: {
                        zeroRecords: "No se encontraron acuerdos.",
                        info: "Mostrando _START_ a _END_ de _TOTAL_ acuerdos",
                        infoEmpty: "Sin acuerdos",
                        infoFiltered: "(filtrado de _MAX_ totales)",
                        paginate: { first: "«", last: "»", next: "›", previous: "‹" }
                    }
                });

                $("#buscarAcuerdoArticuloInput").off("keyup").on("keyup", function () {
                    dtAcuerdosArticulo.search($(this).val()).draw();
                });

                $("#tablaAcuerdosArticulo tbody").off("change", ".acuerdo-art-radio").on("change", ".acuerdo-art-radio", function () {
                    $("#tablaAcuerdosArticulo tbody tr").removeClass("table-active");
                    $(this).closest("tr").addClass("table-active");
                    const d = $(this).data();
                    acuerdoArticuloTemporal = {
                        idAcuerdo: d.idacuerdo,
                        descripcion: d.descripcion,
                        proveedor: d.proveedor,
                        disponible: d.disponible,
                        aporte: d.aporte,
                        unidades: d.unidades,
                        display: `${d.idacuerdo} - ${d.proveedor}`
                    };
                });
            },
            error: function () {
                $("#tablaAcuerdosArticulo tbody").html('<tr><td colspan="16" class="text-center text-danger">Error al consultar.</td></tr>');
            }
        });
    }

    function abrirModalAcuerdoArticulo(tipoFondo, tituloModal, codigoItem, $inputDisplay, $inputId) {
        acuerdoArticuloTemporal = null;
        acuerdoArticuloContexto = {
            tipoFondo: tipoFondo,
            codigoItem: codigoItem,
            $inputDisplay: $inputDisplay,
            $inputId: $inputId
        };

        $("#tituloModalAcuerdoArticulo").text(tituloModal);
        $("#buscarAcuerdoArticuloInput").val("");
        $("#modalAcuerdoArticulo").modal("show");

        consultarAcuerdosPorArticulo(tipoFondo, codigoItem);
    }

    async function guardarPromocionArticulos() {
        const motivo = $("#motivoArticulos").val();
        const desc = $("#descripcionArticulos").val();
        const fechaInicio = getFullISOString("#fechaInicioArticulos", "#timeInicioArticulos");
        const fechaFin = getFullISOString("#fechaFinArticulos", "#timeFinArticulos");

        // Validaciones básicas
        if (!desc || desc.trim().length < 3) {
            Swal.fire("Validación", "Debe ingresar una descripción.", "warning"); return;
        }
        if (!motivo) {
            Swal.fire("Validación", "Debe seleccionar un motivo.", "warning"); return;
        }
        if (!fechaInicio || !fechaFin) {
            Swal.fire("Validación", "Debe ingresar las fechas de inicio y fin.", "warning"); return;
        }

        const $filas = $("#tablaArticulosBody tr");
        if ($filas.length === 0) {
            Swal.fire("Validación", "Debe agregar al menos un artículo en el detalle.", "warning"); return;
        }

        // Validar archivo
        if (!esArchivoValido('#inputFileArticulos', '#fileNameArticulos')) {
            if ($('#inputFileArticulos')[0].files.length === 0) {
                Swal.fire("Archivo requerido", "Debe adjuntar el soporte", "warning");
            }
            return;
        }

        const fileInput = $('#inputFileArticulos')[0].files[0];
        if (!fileInput) {
            Swal.fire("Archivo requerido", "Debe adjuntar el soporte de la promoción", "warning"); return;
        }

        const leerArchivo = file => new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = e => reject(e);
        });

        Swal.fire({ title: 'Procesando...', didOpen: () => Swal.showLoading() });

        try {
            const base64Completo = await leerArchivo(fileInput);

            // Construir artículos desde la tabla
            const articulos = [];
            let errorFila = "";

            $filas.each(function (index) {
                const $fila = $(this);
                const numFila = index + 1;
                const codigo = String($fila.data("codigo"));

                // Leer todos los inputs de la fila en orden
                const $inputs = $fila.find("input, select, button");

                // Valores de consulta (no editables)
                const costo = parseCurrency($fila.find("td:eq(2)").text());
                const stockBodega = parseInt($fila.find("td:eq(3)").text()) || 0;
                const stockTienda = parseInt($fila.find("td:eq(4)").text()) || 0;
                const invOptimo = parseInt($fila.find("td:eq(5)").text()) || 0;
                const excedenteU = parseInt($fila.find("td:eq(6)").text()) || 0;
                const excedenteV = parseCurrency($fila.find("td:eq(7)").text());
                const m0u = parseInt($fila.find("td:eq(8)").text()) || 0;
                const m0p = parseCurrency($fila.find("td:eq(9)").text());
                const m1u = parseInt($fila.find("td:eq(10)").text()) || 0;
                const m1p = parseCurrency($fila.find("td:eq(11)").text());
                const m2u = parseInt($fila.find("td:eq(12)").text()) || 0;
                const m2p = parseCurrency($fila.find("td:eq(13)").text());
                const igualarPrecio = parseCurrency($fila.find("td:eq(14)").text());

                // Márgenes mínimos (consulta)
                const margenMinContado = parseFloat($fila.find("td:eq(15)").text()) || 0;
                const margenMinTC = parseFloat($fila.find("td:eq(16)").text()) || 0;
                const margenMinCredito = parseFloat($fila.find("td:eq(17)").text()) || 0;
                const margenMinIgualar = parseFloat($fila.find("td:eq(18)").text()) || 0;

                // Campos editables (inputs)
                const unidadesLimite = parseInt($fila.find("td:eq(19) input").val()) || 0;
                const proyeccionVtas = parseInt($fila.find("td:eq(20) input").val()) || 0;

                if (unidadesLimite > 0 && proyeccionVtas > 0) {
                    errorFila = `Fila ${numFila}: Solo debe ingresar valor en Unidades Límite O Proyección Vtas, no en ambas.`;
                    return false;
                }
                if (unidadesLimite === 0 && proyeccionVtas === 0) {
                    errorFila = `Fila ${numFila}: Debe ingresar valor en Unidades Límite o Proyección Vtas.`;
                    return false;
                }

                // Medio de Pago
                const $selectMedioPago = $fila.find("td:eq(21) select");
                const medioPagoVal = $selectMedioPago.val();

                // Precio Lista (consulta)
                const precioLista = parseCurrency($fila.find("td:eq(22)").text());

                // Precios promo (editables)
                const precioPromoContado = parseCurrency($fila.find("td:eq(23) input").val());
                const precioPromoTC = parseCurrency($fila.find("td:eq(24) input").val());
                const precioPromoCredito = parseCurrency($fila.find("td:eq(25) input").val());
                const precioIgualar = parseCurrency($fila.find("td:eq(26) input").val());

                // Descuentos (cálculo)
                const dsctoContado = parseFloat($fila.find("td:eq(27)").text()) || 0;
                const dsctoTC = parseFloat($fila.find("td:eq(28)").text()) || 0;
                const dsctoCredito = parseFloat($fila.find("td:eq(29)").text()) || 0;
                const dsctoIgualar = parseFloat($fila.find("td:eq(30)").text()) || 0;

                // Aportes y sus IDs
                const aporteProveedor = parseCurrency($fila.find(".aporte-proveedor").val());
                const idAcuerdoProveedor = parseInt($fila.find("td:eq(32) .acuerdo-id-hidden").val()) || 0;
                const aporteRebate = parseCurrency($fila.find(".aporte-rebate").val());
                const idAcuerdoRebate = parseInt($fila.find("td:eq(34) .acuerdo-id-hidden").val()) || 0;
                const aportePropio = parseCurrency($fila.find(".aporte-propio").val());
                const idAcuerdoPropio = parseInt($fila.find("td:eq(36) .acuerdo-id-hidden").val()) || 0;

                // Márgenes (cálculo)
                const margenPrecioLista = parseFloat($fila.find("td:eq(37)").text()) || 0;
                const margenPromoContado = parseFloat($fila.find("td:eq(38)").text()) || 0;
                const margenPromoTC = parseFloat($fila.find("td:eq(39)").text()) || 0;
                const margenPromoCredito = parseFloat($fila.find("td:eq(40)").text()) || 0;
                const margenIgualar = parseFloat($fila.find("td:eq(41)").text()) || 0;

                // Comprometidos (cálculo)
                const compProveedor = parseCurrency($fila.find("td:eq(42)").text());
                const compRebate = parseCurrency($fila.find("td:eq(43)").text());
                const compPropio = parseCurrency($fila.find("td:eq(44)").text());

                // Regalo
                const regalo = $fila.find("td:eq(45) input[type='checkbox']").is(":checked") ? "S" : "N";

                // Construir acuerdos del artículo
                const acuerdosArticulo = [];
                if (idAcuerdoProveedor > 0) {
                    acuerdosArticulo.push({ idAcuerdo: idAcuerdoProveedor, valorAporte: aporteProveedor });
                }
                if (idAcuerdoRebate > 0) {
                    acuerdosArticulo.push({ idAcuerdo: idAcuerdoRebate, valorAporte: aporteRebate });
                }
                if (idAcuerdoPropio > 0) {
                    acuerdosArticulo.push({ idAcuerdo: idAcuerdoPropio, valorAporte: aportePropio });
                }

                // Construir medios de pago
                const mediosPago = [];
                if (medioPagoVal && medioPagoVal !== "" && medioPagoVal !== "TODAS") {
                    mediosPago.push({
                        tipoAsignacion: "C",
                        codigos: [medioPagoVal]
                    });
                } else {
                    mediosPago.push({ tipoAsignacion: "T", codigos: [] });
                }

                articulos.push({
                    codigoItem: String(codigo),
                    descripcion: $fila.find("td:eq(1)").text(),
                    costo: costo,
                    stockBodega: stockBodega,
                    stockTienda: stockTienda,
                    inventarioOptimo: invOptimo,
                    excedenteUnidad: excedenteU,
                    excedenteValor: excedenteV,
                    m0Unidades: m0u,
                    m0Precio: m0p,
                    m1Unidades: m1u,
                    m1Precio: m1p,
                    m2Unidades: m2u,
                    m2Precio: m2p,
                    igualarPrecio: igualarPrecio,
                    margenMinimoContado: margenMinContado,
                    margenMinimoTarjetaCredito: margenMinTC,
                    margenMinimoCredito: margenMinCredito,
                    margenMinimoIgualar: margenMinIgualar,
                    unidadesLimite: unidadesLimite,
                    unidadesProyeccionVentas: proyeccionVtas,
                    precioListaContado: precioLista,
                    precioPromocionContado: precioPromoContado,
                    precioPromocionTarjetaCredito: precioPromoTC,
                    precioPromocionCredito: precioPromoCredito,
                    precioIgualarPrecio: precioIgualar,
                    descuentoPromocionContado: dsctoContado,
                    descuentoPromocionTarjetaCredito: dsctoTC,
                    descuentoPromocionCredito: dsctoCredito,
                    descuentoIgualarPrecio: dsctoIgualar,
                    margenPrecioListaContado: margenPrecioLista,
                    margenPromocionContado: margenPromoContado,
                    margenPromocionTarjetaCredito: margenPromoTC,
                    margenPromocionCredito: margenPromoCredito,
                    margenIgualarPrecio: margenIgualar,
                    marcaRegalo: regalo,
                    mediosPago: mediosPago,
                    acuerdos: acuerdosArticulo,
                    otrosCostos: []
                });
            });

            if (errorFila) {
                Swal.fire("Validación de Detalle", errorFila, "warning"); return;
            }

            // Segmentos de Artículos
            const determinarAsignacion = (idSelector) => {
                const val = $(idSelector).val();
                if (val === "TODAS" || val === "TODOS" || !val || val === "") return "T";
                if (val === "3") return "D";
                return "C";
            };

            const segmentos = [
                { tiposegmento: "SEGCANAL", codigos: obtenerValorCampo("canalArticulos", "#filtroCanalArticulos", "3"), tipoasignacion: determinarAsignacion("#filtroCanalArticulos") },
                { tiposegmento: "SEGGRUPOALMACEN", codigos: obtenerValorCampo("grupoArticulos", "#filtroGrupoAlmacenArticulos", "3"), tipoasignacion: determinarAsignacion("#filtroGrupoAlmacenArticulos") },
                { tiposegmento: "SEGALMACEN", codigos: obtenerValorCampo("almacenArticulos", "#filtroAlmacenArticulos", "3"), tipoasignacion: determinarAsignacion("#filtroAlmacenArticulos") },
                { tiposegmento: "SEGTIPOCLIENTE", codigos: (function () {
                    const val = $("#tipoClienteArticulos").val();
                    if (val === "4") {
                        return $("#btnListaClienteArticulos").data("seleccionados") || [];
                    } else if (val && val !== "" && val !== "TODOS") {
                        return [val];
                    }
                    return [];
                  })(), tipoasignacion: determinarAsignacion("#tipoClienteArticulos")
                }
            ];

            const body = {
                tipoclaseetiqueta: "PRARTICULO",
                idopcion: getIdOpcionSeguro(),
                idcontrolinterfaz: "BTNGRABAR",
                ideventoetiqueta: "EVCLICK",
                nombreArchivoSoporte: fileInput.name,
                archivoSoporteBase64: base64Completo,
                promocion: {
                    descripcion: desc,
                    motivo: parseInt(motivo, 10) || 0,
                    clasepromocion: parseInt($("#promocionTipo").val(), 10) || 0,
                    fechahorainicio: fechaInicio,
                    fechahorafin: fechaFin,
                    marcaregalo: "",
                    marcaprocesoaprobacion: "",
                    idusuarioingreso: getUsuario(),
                    nombreusuario: getUsuario()
                },
                acuerdos: [],
                segmentos: segmentos,
                articulos: articulos
            };

            const payload = {
                code_app: "APP20260128155212346",
                http_method: "POST",
                endpoint_path: "api/promocion/insertar",
                client: "APL",
                body_request: body
            };

            console.log("body articulos: ", body);

            $.ajax({
                url: "/api/apigee-router-proxy",
                method: "POST",
                contentType: "application/json",
                data: JSON.stringify(payload),
                success: function (res) {
                    const respuesta = res.json_response || res;
                    if (respuesta.codigoretorno == 1) {
                        Swal.fire("Éxito", "Promoción por Artículos Guardada: " + respuesta.mensaje, "success")
                            .then(() => resetearFormulario("Articulos"));
                    } else {
                        Swal.fire("Atención", respuesta.mensaje || "Error en base de datos", "warning");
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
            $("#buscarProveedorInput").val(""); // <-- AÑADIR ESTA LÍNEA
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
            $("#buscarAcuerdoPropioInput").val(""); // <-- AÑADIR ESTA LÍNEA
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
        $("#tipoClienteGeneral, #tipoClienteArticulos, #tipoClienteCombos").off("change").on("change", function () {
            const val = $(this).val();
            const idSelect = $(this).attr("id");
            let $btn;

            if (idSelect === "tipoClienteGeneral") $btn = $("#btnListaClienteGeneral");
            else if (idSelect === "tipoClienteArticulos") $btn = $("#btnListaClienteArticulos");
            else if (idSelect === "tipoClienteCombos") $btn = $("#btnListaClienteCombos");

            if (!$btn) return;

            if (val === "3") {
                $btn.removeClass("d-none btn-success").addClass("btn-outline-secondary");
                $btn.attr("data-bs-target", "#ModalClientesEspecificos");
                setTimeout(() => { $("#ModalClientesEspecificos").modal("show"); }, 50);
            } else if (val === "4") {
                $btn.removeClass("d-none");
                $btn.attr("data-bs-target", "#ModalTipoClienteVarios");
                setTimeout(() => { $("#ModalTipoClienteVarios").modal("show"); }, 50);
            } else {
                $btn.addClass("d-none");
                $btn.removeData("seleccionados");
                $btn.html(`<i class="fa-solid fa-list-check"></i>`);
                $btn.removeClass("btn-success").addClass("btn-outline-secondary");
            }
        });

        // Input File General ---
        $('#inputGroupFile24').on('change', function () {
            esArchivoValido('#inputGroupFile24', '#fileName');
        });

        // Input File Artículos ---
        $('#inputFileArticulos').on('change', function () {
            esArchivoValido('#inputFileArticulos', '#fileNameArticulos');
        });

        // Función auxiliar para no repetir código


        $(".btn-secondary[id^='btnCancelar']").click(() => location.reload());
        // Aceptar Selección de "Varios" Tipos de Clientes
        $("#btnAceptarTipoCliente").off("click").on("click", function () {
            let $btnTrigger;

            // Buscar cuál es el botón visible actualmente
            if ($("#tipoClienteGeneral").val() === "4") $btnTrigger = $("#btnListaClienteGeneral");
            else if ($("#tipoClienteCombos").val() === "4") $btnTrigger = $("#btnListaClienteCombos");
            else if ($("#tipoClienteArticulos").val() === "4") $btnTrigger = $("#btnListaClienteArticulos");

            if (!$btnTrigger) return;

            const seleccionados = [];
            $("#bodyModalTipoCliente input[type='checkbox']:checked").each(function () {
                seleccionados.push($(this).val());
            });

            $btnTrigger.data("seleccionados", seleccionados);

            if (seleccionados.length > 0) {
                $btnTrigger.removeClass("btn-outline-secondary").addClass("btn-success");
                $btnTrigger.html(`<i class="fa-solid fa-list-check"></i> (${seleccionados.length})`);
            } else {
                $btnTrigger.removeClass("btn-success").addClass("btn-outline-secondary");
                $btnTrigger.html(`<i class="fa-solid fa-list-check"></i>`);
            }
        });

        // ==========================================
        // MODAL CONSULTA ITEMS - ARTÍCULOS
        // ==========================================
        $("#modalConsultaItems").on("show.bs.modal", function () {
            cargarFiltrosItemsPromocion();

            if (!dtItemsConsultaPromo) {
                dtItemsConsultaPromo = $("#tablaItemsConsulta").DataTable({
                    data: [],
                    columns: [
                        { title: "Sel", className: "text-center align-middle", orderable: false, searchable: false },
                        { title: "Código", className: "align-middle" },
                        { title: "Descripción", className: "align-middle" },
                        { title: "Costo", className: "align-middle text-end" },
                        { title: "Stock", className: "align-middle text-center" },
                        { title: "Óptimo", className: "align-middle text-center" },
                        { title: "Excedente(u)", className: "align-middle text-center" },
                        { title: "Excedente($)", className: "align-middle text-end" },
                        { title: "M-0(u)", className: "align-middle text-center" },
                        { title: "M-0($)", className: "align-middle text-end" },
                        { title: "M-1(u)", className: "align-middle text-center" },
                        { title: "M-1($)", className: "align-middle text-end" },
                        { title: "M-2(u)", className: "align-middle text-center" },
                        { title: "M-2($)", className: "align-middle text-end" }
                    ],
                    deferRender: true,
                    pageLength: 10,
                    lengthChange: false,
                    dom: '<"row"<"col-12"tr>><"row"<"col-12 text-center"i>><"row"<"col-12 d-flex justify-content-center"p>>',
                    language: {
                        emptyTable: '<div class="text-center text-muted p-4"><i class="fa-solid fa-filter"></i><br>Seleccione los criterios y presione <strong>"Procesar Selección"</strong></div>',
                        zeroRecords: "No se encontraron items.",
                        info: "Mostrando _START_ a _END_ de _TOTAL_ items",
                        infoEmpty: "Sin items",
                        infoFiltered: "(filtrado de _MAX_ totales)",
                        paginate: { first: "«", last: "»", next: "›", previous: "‹" }
                    },
                    order: [[1, 'asc']]
                });
            }
            dtItemsConsultaPromo.clear().draw();
        });

        $("#btnProcesarFiltros").on("click", function () {
            const marcas = getSelectedFilterValuesPromo("filtroMarcaModal");
            const divisiones = getSelectedFilterValuesPromo("filtroDivisionModal");
            const departamentos = getSelectedFilterValuesPromo("filtroDepartamentoModal");
            const clases = getSelectedFilterValuesPromo("filtroClaseModal");
            const articulo = $("#filtroArticuloModal").val().trim();

            if (marcas.length === 0 && divisiones.length === 0 && departamentos.length === 0 && clases.length === 0 && articulo === "") {
                Swal.fire({ icon: "warning", title: "Atención", text: "Debe seleccionar al menos un criterio de búsqueda." });
                return;
            }

            consultarItemsPromocion({
                marcas: marcas,
                divisiones: divisiones,
                departamentos: departamentos,
                clases: clases,
                codigoarticulo: articulo
            });
        });

        $("#checkTodosItems").on("change", function () {
            const isChecked = $(this).is(":checked");
            if (dtItemsConsultaPromo) {
                $(dtItemsConsultaPromo.$(".item-checkbox")).prop("checked", isChecked);
            }
        });

        $("#btnSeleccionarItems").on("click", function () {
            const items = [];
            const checkboxes = dtItemsConsultaPromo ? dtItemsConsultaPromo.$(".item-checkbox:checked") : $("#tablaItemsConsulta .item-checkbox:checked");

            checkboxes.each(function () {
                const $c = $(this);
                items.push({
                    codigo: $c.data("codigo"),
                    descripcion: $c.data("descripcion"),
                    costo: $c.data("costo"),
                    stock: $c.data("stock"),
                    optimo: $c.data("optimo"),
                    excedenteu: $c.data("excedenteu"),
                    excedentes: $c.data("excedentes"),
                    m0u: $c.data("m0u"), m0s: $c.data("m0s"),
                    m1u: $c.data("m1u"), m1s: $c.data("m1s"),
                    m2u: $c.data("m2u"), m2s: $c.data("m2s")
                });
            });

            if (items.length === 0) {
                Swal.fire("Atención", "Seleccione al menos un item.", "info");
                return;
            }

            agregarItemsATablaArticulos(items);
            $("#modalConsultaItems").modal("hide");
            $("#checkTodosItems").prop("checked", false);
        });

        $(document).on("change", ".select-mediopago-articulo", function () {
            const val = $(this).val();
            if (val === "7") {
                $("#ModalMedioPago").modal("show");
            }
        });

        $("#btnDeleteItemArticulos").on("click", function () {
            const $radioSeleccionado = $("#tablaArticulosBody .item-row-radio:checked");

            if ($radioSeleccionado.length === 0) {
                Swal.fire({ icon: "warning", title: "Atención", text: "Debe seleccionar un item para eliminar." });
                return;
            }

            const $fila = $radioSeleccionado.closest("tr");
            const descripcion = $fila.find("td:eq(1)").text();

            Swal.fire({
                title: "¿Está seguro?",
                html: `Se eliminará el Artículo:<br><strong>${descripcion}</strong>`,
                icon: "warning",
                showCancelButton: true,
                confirmButtonColor: "#d33",
                cancelButtonColor: "#6c757d",
                confirmButtonText: "Sí, Eliminar",
                cancelButtonText: "Cancelar"
            }).then((result) => {
                if (result.isConfirmed) {
                    $fila.remove();

                    // Si quedan filas, seleccionar la primera automáticamente
                    const $primeraFila = $("#tablaArticulosBody tr").first();
                    if ($primeraFila.length) {
                        $primeraFila.find(".item-row-radio").prop("checked", true).trigger("change");
                    }

                    Swal.fire({ toast: true, position: "top-end", icon: "success", title: "Item eliminado", showConfirmButton: false, timer: 1500 });
                }
            });
        });

        // ==========================================
        // EVENTOS ACUERDOS POR ARTÍCULO
        // ==========================================

        // Click en lupitas de Aporte Prov. ID Acuerdo / Rebate / Propio
        $(document).on("click", ".btn-buscar-acuerdo-art", function () {
            const $btn = $(this);
            const tipoFondo = $btn.data("tipofondo");
            const $fila = $btn.closest("tr");
            const codigoItem = $fila.data("codigo");
            const $inputDisplay = $btn.closest(".input-group").find("input");
            const $inputId = $btn.closest("td").find("input.acuerdo-id-hidden");

            const titulos = {
                "TFPROVEDOR": "Acuerdos - Fondo Proveedor",
                "TFREBATE": "Acuerdos - Fondo Rebate",
                "TFPROPIO": "Acuerdos - Fondo Propio"
            };

            abrirModalAcuerdoArticulo(tipoFondo, titulos[tipoFondo] || "Acuerdos", codigoItem, $inputDisplay, $inputId);
        });

        // Aceptar selección del modal
        $("#btnAceptarAcuerdoArticulo").on("click", function () {
            if (!acuerdoArticuloTemporal) {
                Swal.fire({ icon: "info", title: "Atención", text: "Debe seleccionar un acuerdo." });
                return;
            }

            if (acuerdoArticuloContexto) {
                acuerdoArticuloContexto.$inputDisplay.val(acuerdoArticuloTemporal.display);
                acuerdoArticuloContexto.$inputId.val(acuerdoArticuloTemporal.idAcuerdo);

                // Habilitar el campo de Aporte correspondiente
                const $fila = acuerdoArticuloContexto.$inputId.closest("tr");
                const tipo = acuerdoArticuloContexto.tipoFondo;

                if (tipo === "TFPROVEDOR") {
                    $fila.find(".aporte-proveedor").prop("disabled", false);
                } else if (tipo === "TFREBATE") {
                    $fila.find(".aporte-rebate").prop("disabled", false);
                } else if (tipo === "TFPROPIO") {
                    $fila.find(".aporte-propio").prop("disabled", false);
                }
            }

            $("#modalAcuerdoArticulo").modal("hide");
            acuerdoArticuloTemporal = null;
            acuerdoArticuloContexto = null;
        });
        // Solo permitir números, punto y coma en todos los inputs de la tabla de Detalle de Artículos
        $(document).on("input", "#tablaArticulosBody input[type='text'], #tablaArticulosBody input[type='number']", function () {
            this.value = this.value.replace(/[^0-9.,]/g, '');
        });

        $("#btnGuardarPromocionArticulos").click(() => guardarPromocionArticulos());
    });
})();