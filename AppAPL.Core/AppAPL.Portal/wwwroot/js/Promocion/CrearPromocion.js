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

    // Variable para saber si estamos editando un combo existente
    let comboEnEdicion = null;

    // Almacena los artículos de cada combo: { "CODIGO_COMBO": [ lista_de_articulos ] }
    let articulosPorComboMemoria = {};

    const CONFIG_MULTIPLE = [
        { id: "marca", select: "#filtroMarcaGeneral", btnOpen: "#btnMarcaGeneral", body: "#bodyModalMarca", btnAccept: "#btnAceptarMarca", triggerVal: "3" },
        { id: "division", select: "#filtroDivisionGeneral", btnOpen: "#btnDivisionGeneral", body: "#bodyModalDivision", btnAccept: "#btnAceptarDivision", triggerVal: "3" },
        { id: "depto", select: "#filtroDepartamentoGeneral", btnOpen: "#btnDepartamentoGeneral", body: "#bodyModalDepartamento", btnAccept: "#btnAceptarDepartamento", triggerVal: "3" },
        { id: "clase", select: "#filtroClaseGeneral", btnOpen: "#btnClaseGeneral", body: "#bodyModalClase", btnAccept: "#btnAceptarClase", triggerVal: "3" },
        { id: "canal", select: "#filtroCanalGeneral", btnOpen: "#btnCanalGeneral", body: "#bodyModalCanal", btnAccept: "#btnAceptarCanal", triggerVal: "3" },
        { id: "grupo", select: "#filtroGrupoAlmacenGeneral", btnOpen: "#btnGrupoAlmacenGeneral", body: "#bodyModalGrupoAlmacen", btnAccept: "#btnAceptarGrupoAlmacen", triggerVal: "3" },
        { id: "almacen", select: "#filtroAlmacenGeneral", btnOpen: "#btnAlmacenGeneral", body: "#bodyModalAlmacen", btnAccept: "#btnAceptarAlmacen", triggerVal: "3" },
        { id: "mediopago", select: "#filtroMedioPagoGeneral", btnOpen: "#btnMedioPagoGeneral", body: "#bodyModalMedioPago", btnAccept: "#btnAceptarMedioPago", triggerVal: "7" },
        { id: "canalArticulos", select: "#filtroCanalArticulos", btnOpen: "#btnCanalArticulos", body: "#bodyModalCanal", btnAccept: "#btnAceptarCanal", triggerVal: "3" },
        { id: "grupoArticulos", select: "#filtroGrupoAlmacenArticulos", btnOpen: "#btnGrupoAlmacenArticulos", body: "#bodyModalGrupoAlmacen", btnAccept: "#btnAceptarGrupoAlmacen", triggerVal: "3" },
        { id: "almacenArticulos", select: "#filtroAlmacenArticulos", btnOpen: "#btnAlmacenArticulos", body: "#bodyModalAlmacen", btnAccept: "#btnAceptarAlmacen", triggerVal: "3" }
    ];

    // ==========================================
    // HELPERS & UTILS
    // ==========================================
    function aplicarSelect2($el) {
        if ($el.hasClass("select2-hidden-accessible")) {
            $el.select2('destroy');
        }
        $el.select2({ width: '100%' });
    }

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
        $("#formGeneral").toggle(idSeleccionado == idCatalogoGeneral);
        $("#formArticulos").toggle(idSeleccionado == idCatalogoArticulo);
        $("#formCombos").toggle(idSeleccionado == idCatalogoCombos);
    }

    const llenarComboYModal = ($select, $modalBody, items, labelDefault, valorVarios, idPrefijo, textoTodas = null) => {
        if ($select.hasClass("select2-hidden-accessible")) {
            $select.select2('destroy');
        }
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
                const texto = i.nombre || i.descripcion || i.nombregrupo || i.nombrealmacen;
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

        aplicarSelect2($select);
    };

    // ==========================================
    // LÓGICA DE NEGOCIO Y VALIDACIONES
    // ==========================================
    function initValidacionesFinancieras() {
        $("#descuentoProveedorGeneral, #fondoValorTotalGeneral").prop("disabled", true);
        $("#descuentoPropioGeneral, #comprometidoPropioGeneral").prop("disabled", true);

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
                $(this).val("").addClass("is-invalid");
            } else {
                $(this).removeClass("is-invalid").val(formatCurrencySpanish(valorIngresado));
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
                $(this).val("").addClass("is-invalid");
            } else {
                $(this).removeClass("is-invalid").val(formatCurrencySpanish(valorIngresado));
            }
        });

        $("#fondoValorTotalGeneral, #comprometidoPropioGeneral").on("input", function () {
            this.value = this.value.replace(/[^0-9.,]/g, '');
        });

        const soloNumerosDescuento = function (e) {
            this.value = this.value.replace(/[^0-9.]/g, '');
            let val = parseFloat(this.value);
            if (val > 100) this.value = "100";
            calcularTotalDescuento();
        };

        $("#descuentoProveedorGeneral").on("input", soloNumerosDescuento);
        $("#descuentoPropioGeneral").on("input", soloNumerosDescuento);

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
                    $(conf.btnAccept).data("target-btn", conf.btnOpen);
                    $(conf.btnAccept).data("target-body", conf.body);
                    $(conf.btnAccept).data("target-id", conf.id);
                    setTimeout(() => { $(conf.btnOpen)[0].click(); }, 50);
                } else {
                    $(conf.btnOpen).addClass("d-none").removeData("seleccionados")
                        .html(`<i class="fa-solid fa-list-check"></i>`)
                        .removeClass("btn-success").addClass("btn-outline-secondary");
                }

                if (conf.id === "marca" || conf.id === "marcaArticulos") {
                    if (val === "TODAS") validarBloqueoProveedor(true);
                    else if (val !== "" && val !== conf.triggerVal) validarBloqueoProveedor(false);
                    else if (val === "") validarBloqueoProveedor(false);
                }
            });

            $(conf.btnOpen).off("click.setTarget").on("click.setTarget", function () {
                $(conf.btnAccept).data("target-btn", conf.btnOpen);
                $(conf.btnAccept).data("target-body", conf.body);
                $(conf.btnAccept).data("target-id", conf.id);
            });
        });

        const uniqueAcceptBtns = [...new Set(CONFIG_MULTIPLE.map(c => c.btnAccept))];
        uniqueAcceptBtns.forEach(btnAcceptSelector => {
            $(btnAcceptSelector).off("click.acceptMulti").on("click.acceptMulti", function () {
                // Si el modal de crear combo está abierto, significa que estamos en contexto combo, no ejecutar
                if ($("#modalCrearCombo").hasClass("show")) {
                    return;
                }
                // Si el modal de consulta de items está abierto con contexto combo, tampoco
                if (window.contextoModalItems === "COMBOS") {
                    return;
                }

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
                    $btnTrigger.removeClass("btn-outline-secondary").addClass("btn-success")
                        .html(`<i class="fa-solid fa-list-check"></i> (${seleccionados.length})`);
                } else {
                    $btnTrigger.removeClass("btn-success").addClass("btn-outline-secondary")
                        .html(`<i class="fa-solid fa-list-check"></i>`);
                }

                if (targetId === "marca" || targetId === "marcaArticulos") {
                    validarBloqueoProveedor(seleccionados.length > 1);
                }
            });
        });
    }

    function validarBloqueoProveedor(bloquear) {
        const $inputProv = $("#fondoProveedorGeneral");
        const $btnProv = $inputProv.next("button");
        const $idProv = $("#fondoProveedorIdGeneral");
        const $idHidden = $("#fondoDisponibleHiddenGeneral");
        const $descuentoProv = $("#descuentoProveedorGeneral");
        const $comprometidoProv = $("#fondoValorTotalGeneral");

        if (bloquear) {
            $inputProv.val("").prop("disabled", true).attr("placeholder", "");
            $idProv.val("");
            $idHidden.val("0");
            $btnProv.prop("disabled", true);
            $descuentoProv.val("").prop("disabled", true);
            $comprometidoProv.val("").prop("disabled", true);
            $("#descuentoTotalGeneral").val("");
        } else {
            $inputProv.prop("disabled", false).attr("placeholder", "Seleccione...");
            $btnProv.prop("disabled", false);
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
                if ($select.hasClass("select2-hidden-accessible")) $select.select2('destroy');
                $select.empty();

                if (!data.length) { $select.append("<option>Sin datos</option>"); aplicarSelect2($select); return; }

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
                aplicarSelect2($select);

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
                if ($select.hasClass("select2-hidden-accessible")) $select.select2('destroy');
                $select.empty().append('<option value="">Seleccione...</option>');
                data.forEach(item => $select.append($("<option>").val(item.idcatalogo).text(item.nombre_catalogo)));
                aplicarSelect2($select);
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
                llenarComboYModal($("#filtroMarcaGeneral"), $("#bodyModalMarca"), data.marcas, "Seleccione...", "3", "marca", "Todas");
                llenarComboYModal($("#filtroDivisionGeneral"), $("#bodyModalDivision"), data.divisiones, "Seleccione...", "3", "division", "Todas");
                llenarComboYModal($("#filtroDepartamentoGeneral"), $("#bodyModalDepartamento"), data.departamentos, "Seleccione...", "3", "depto", "Todos");
                llenarComboYModal($("#filtroClaseGeneral"), $("#bodyModalClase"), data.clases, "Seleccione...", "3", "clase", "Todas");
            }
        });
    }

    async function cargarCombosPromociones() {
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
            success: async function (response) {
                const data = response.json_response || {};
                let mediosPagoFiltrados = (data.mediospagos || []).filter(m => {
                    let nom = (m.nombre || "").toUpperCase();
                    return nom !== "TODOS" && nom !== "TODAS" && m.codigo !== "0";
                });

                llenarComboYModal($("#filtroCanalGeneral"), $("#bodyModalCanal"), data.canales, "Seleccione...", "3", "canal");
                llenarComboYModal($("#filtroGrupoAlmacenGeneral"), $("#bodyModalGrupoAlmacen"), data.gruposalmacenes, "Seleccione...", "3", "grupo", "Todos");
                llenarComboYModal($("#filtroMedioPagoGeneral"), $("#bodyModalMedioPago"), mediosPagoFiltrados, "Seleccione...", "7", "mediopago");

                $("#selectMedioPagoModalCombo").html($("#filtroMedioPagoGeneral").html());

                consultarAlmacenes();

                $("#selectMedioPagoModalCombo").html($("#filtroMedioPagoGeneral").html());

                $("#filtroCanalArticulos").html($("#filtroCanalGeneral").html());
                aplicarSelect2($("#filtroCanalArticulos"));
                $("#filtroGrupoAlmacenArticulos").html($("#filtroGrupoAlmacenGeneral").html());
                aplicarSelect2($("#filtroGrupoAlmacenArticulos"));
                $("#filtroAlmacenCombos").html($("#filtroAlmacenGeneral").html());
                aplicarSelect2($("#filtroAlmacenCombos"));

                $("#filtroCanalCombos").html($("#filtroCanalGeneral").html());
                aplicarSelect2($("#filtroCanalCombos"));
                $("#filtroGrupoAlmacenCombos").html($("#filtroGrupoAlmacenGeneral").html());
                aplicarSelect2($("#filtroGrupoAlmacenCombos"));
                $("#filtroAlmacenCombos").html($("#filtroAlmacenGeneral").html());
                aplicarSelect2($("#filtroAlmacenCombos"));

                const $cliGen = $("#tipoClienteGeneral");
                const $cliArt = $("#tipoClienteArticulos");
                const $cliCom = $("#tipoClienteCombos");
                const $modalBodyCli = $("#bodyModalTipoCliente");

                if ($cliGen.hasClass("select2-hidden-accessible")) $cliGen.select2('destroy');
                if ($cliArt.hasClass("select2-hidden-accessible")) $cliArt.select2('destroy');
                if ($cliCom.hasClass("select2-hidden-accessible")) $cliCom.select2('destroy');

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

                aplicarSelect2($cliGen);
                aplicarSelect2($cliArt);
                aplicarSelect2($cliCom);
            }
        });
    }

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
                llenarComboYModal($("#filtroAlmacenGeneral"), $("#bodyModalAlmacen"), listaAlmacenes, "Seleccione...", "3", "almacen", "Todos");

                $("#filtroAlmacenArticulos").html($("#filtroAlmacenGeneral").html());
                aplicarSelect2($("#filtroAlmacenArticulos"));

                $("#filtroAlmacenCombos").html($("#filtroAlmacenGeneral").html());
                aplicarSelect2($("#filtroAlmacenCombos"));
            }
        });
    }

    function consultarAcuerdos(tipoFondo, tablaId, onSeleccion) {
        if ($.fn.DataTable.isDataTable(`#${tablaId}`)) {
            $(`#${tablaId}`).DataTable().clear().destroy();
        }

        const $tbody = $(`#${tablaId} tbody`);
        $tbody.html('<tr><td colspan="13" class="text-center">Cargando...</td></tr>');
        const claseAcuerdo = getClaseAcuerdo();

        let endpointParams = "/" + tipoFondo + "/" + claseAcuerdo;
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

                if (tablaId === "tablaProveedores") {
                    $("#buscarProveedorInput").off("keyup").on("keyup", function () {
                        dt.search($(this).val()).draw();
                    });
                } else if (tablaId === "tablaAcuerdosPropios") {
                    $("#buscarAcuerdoPropioInput").off("keyup").on("keyup", function () {
                        dt.search($(this).val()).draw();
                    });
                }

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
        $("#descuentoProveedorGeneral, #fondoValorTotalGeneral").prop("disabled", false);
    }

    function setFondoPropioEnForm(f) {
        $("#acuerdoPropioGeneral").val(f.display);
        $("#acuerdoPropioIdGeneral").val(f.idAcuerdo);
        $("#acuerdoPropioDisponibleHiddenGeneral").val(f.disponible);
        $("#descuentoPropioGeneral, #comprometidoPropioGeneral").prop("disabled", false);
    }

    function resetearFormulario(sufijo) {
        $(`#motivo${sufijo}`).val("").trigger("change");
        $(`#descripcion${sufijo}`).val("");
        $(`#fechaInicio${sufijo}`).val("");
        $(`#fechaFin${sufijo}`).val("");
        $(`#timeInicio${sufijo}`).val("00:00");
        $(`#timeFin${sufijo}`).val("23:59");
        $(`#regaloGeneral`).prop("checked", false);

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
            $(conf.btnOpen).addClass("d-none").removeData("seleccionados")
                .html(`<i class="fa-solid fa-list-check"></i>`)
                .removeClass("btn-success").addClass("btn-outline-secondary");
            $(`${conf.body} input[type='checkbox']`).prop("checked", false);
        });

        $("#tipoClienteGeneral, #tipoClienteArticulos, #tipoClienteCombos").val("").trigger("change");

        $("#inputGroupFile24, #inputFileArticulos", "#inputFileCombos").val("");
        if (document.getElementById("fileName")) document.getElementById("fileName").textContent = "";
        if (document.getElementById("fileNameArticulos")) document.getElementById("fileNameArticulos").textContent = "";
        if (document.getElementById("fileNameCombos")) document.getElementById("fileNameCombos").textContent = "";

        $("#tablaArticulosBody").empty();
        $("#tablaCombosBody").empty();

        $("#chkArticuloGeneral").prop("checked", false).trigger("change");
        $("#articuloGeneral").val("").prop("disabled", true);

        proveedorTemporal = null;
        propioTemporal = null;
        acuerdoArticuloTemporal = null;
        acuerdoArticuloContexto = null;

        $(".is-invalid").removeClass("is-invalid");
    }

    function initLogicaArticuloGeneral() {
        $("#chkArticuloGeneral").on("change", function () {
            const isChecked = $(this).is(":checked");
            $("#articuloGeneral").prop("disabled", !isChecked);
            if (!isChecked) $("#articuloGeneral").val("");

            const $jerarquia = $("#filtroMarcaGeneral, #filtroDivisionGeneral, #filtroDepartamentoGeneral, #filtroClaseGeneral");
            const $btns = $("#btnMarcaGeneral, #btnDivisionGeneral, #btnDepartamentoGeneral, #btnClaseGeneral");

            $jerarquia.prop("disabled", isChecked);
            if (isChecked) {
                $jerarquia.val([]).trigger("change");
                $btns.addClass("d-none");
            }
        });

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

        $("#fechaInicioGeneral, #fechaInicioArticulos, #fechaInicioCombos").datepicker({
            ...commonOptions,
            minDate: 0,
            onSelect: function (dateText, inst) {
                const startDate = $(this).datepicker("getDate");
                const idFin = this.id.replace("Inicio", "Fin");

                if (startDate) {
                    $("#" + idFin).datepicker("option", "minDate", startDate);
                    const currentEndDate = $("#" + idFin).datepicker("getDate");
                    if (currentEndDate && currentEndDate < startDate) {
                        $("#" + idFin).val("");
                    }
                }
            }
        });

        $("#fechaFinGeneral, #fechaFinArticulos, #fechaFinCombos").datepicker({
            ...commonOptions,
            minDate: 0
        });

        $(".btn-outline-secondary:has(.fa-calendar), .btn-outline-secondary:has(img[alt='Calendario'])").on("click", function () {
            $(this).parent().find("input[type='text']").datepicker("show");
        });
    }

    function obtenerValorCampo(configId, selectId, triggerVal) {
        const valSelect = $(selectId).val();
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

        if (acceptAttr !== "" && !extensionesPermitidas.includes(extensionArchivo)) {
            Swal.fire("Extensión no permitida", `Solo se aceptan: ${acceptAttr}`, "error");
            $input.val('');
            if (fileNameSpan) fileNameSpan.textContent = "Archivo no válido";
            return false;
        }

        if (file.size > tamanoMaxBytes) {
            Swal.fire("Archivo muy pesado", `El límite es de ${tamanoMaxMB}MB`, "error");
            $input.val('');
            if (fileNameSpan) fileNameSpan.textContent = "Archivo muy pesado";
            return false;
        }

        if (fileNameSpan) fileNameSpan.textContent = file.name;
        return true;
    }

    async function guardarPromocion(tipo) {
        const sufijo = tipo;
        const motivo = $(`#motivo${sufijo}`).val();
        const desc = $(`#descripcion${sufijo}`).val();
        const fechaInicio = getFullISOString(`#fechaInicio${sufijo}`, `#timeInicio${sufijo}`);
        const fechaFin = getFullISOString(`#fechaFin${sufijo}`, `#timeFin${sufijo}`);
        const idProvSeleccionado = parseInt($("#fondoProveedorIdGeneral").val(), 10) || 0;
        const idPropSeleccionado = parseInt($("#acuerdoPropioIdGeneral").val(), 10) || 0;

        if (idProvSeleccionado === 0 && idPropSeleccionado === 0) {
            Swal.fire("Proveedor Requerido", "Debe seleccionar al menos un Acuerdo (Proveedor o Propio) para calcular el Descuento Total.", "warning");
            return;
        }

        const grupoVal = $(`#filtroGrupoAlmacen${sufijo}`).val();
        if (!grupoVal || grupoVal === "") {
            Swal.fire("Validación", "Debe seleccionar un Grupo de Almacén.", "warning");
            return;
        }

        const almacenVal = $(`#filtroAlmacen${sufijo}`).val();
        if (!almacenVal || almacenVal === "") {
            Swal.fire("Validación", "Debe seleccionar un Almacén.", "warning");
            return;
        }

        if (!esArchivoValido('#inputGroupFile24', '#fileName')) {
            if ($('#inputGroupFile24')[0].files.length === 0) {
                Swal.fire("Archivo requerido", "Debe adjuntar el soporte", "warning");
            }
            return;
        }

        const fileInput = $('#inputGroupFile24')[0].files[0];
        const leerArchivo = file => new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = e => reject(e);
        });

        Swal.fire({ title: 'Procesando archivo...', didOpen: () => Swal.showLoading() });

        try {
            const base64Completo = await leerArchivo(fileInput);

            const determinarAsignacion = (idSelector) => {
                const selector = $(idSelector);
                const valorSeleccionado = selector.val();
                if (valorSeleccionado === "TODAS" || valorSeleccionado === "TODOS" || !valorSeleccionado || valorSeleccionado.length === 0) return "T";
                if (valorSeleccionado === "3" || valorSeleccionado === "4" || valorSeleccionado === "7") return "D";
                return "C";
            };

            const segmentosConfig = [
                { tipo: "SEGMARCA", codigos: obtenerValorCampo("marca", "#filtroMarcaGeneral", "3"), id: "#filtroMarcaGeneral" },
                { tipo: "SEGDIVISION", codigos: obtenerValorCampo("division", "#filtroDivisionGeneral", "3"), id: "#filtroDivisionGeneral" },
                { tipo: "SEGCLASE", codigos: obtenerValorCampo("clase", "#filtroClaseGeneral", "3"), id: "#filtroClaseGeneral" },
                { tipo: "SEGDEPARTAMENTO", codigos: obtenerValorCampo("depto", "#filtroDepartamentoGeneral", "3"), id: "#filtroDepartamentoGeneral" },
                { tipo: "SEGCANAL", codigos: obtenerValorCampo("canal", "#filtroCanalGeneral", "3"), id: "#filtroCanalGeneral" },
                { tipo: "SEGGRUPOALMACEN", codigos: obtenerValorCampo("grupo", "#filtroGrupoAlmacenGeneral", "3"), id: "#filtroGrupoAlmacenGeneral" },
                { tipo: "SEGALMACEN", codigos: obtenerValorCampo("almacen", "#filtroAlmacenGeneral", "3"), id: "#filtroAlmacenGeneral" },
                {
                    tipo: "SEGTIPOCLIENTE", codigos: (function () {
                        const val = $("#tipoClienteGeneral").val();
                        if (val === "4") return $("#btnListaClienteGeneral").data("seleccionados") || [];
                        if (val && val !== "" && val !== "TODOS" && val !== "3") return [val];
                        return [];
                    })(), id: "#tipoClienteGeneral"
                },
                { tipo: "SEGMEDIOPAGO", codigos: obtenerValorCampo("mediopago", "#filtroMedioPagoGeneral", "7"), id: "#filtroMedioPagoGeneral" }
            ];

            const segmentosValidados = segmentosConfig.map(seg => ({
                tiposegmento: seg.tipo,
                codigos: seg.codigos,
                tipoasignacion: determinarAsignacion(seg.id)
            }));

            const segmentoInvalido = segmentosValidados.find(seg => seg.tipoasignacion === "D" && (!seg.codigos || seg.codigos.length === 0));
            if (segmentoInvalido) {
                Swal.fire("Atención", `Has seleccionado "Varios" en el filtro de ${segmentoInvalido.tiposegmento.replace('SEG', '')}, pero no has marcado ningún elemento en la lista.`, "warning");
                return;
            }

            const idProveedorGeneral = parseInt($("#fondoProveedorIdGeneral").val(), 10) || 0;
            const idProveedorPropio = parseInt($("#acuerdoPropioIdGeneral").val(), 10) || 0;

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

            $.ajax({
                url: "/api/apigee-router-proxy",
                method: "POST",
                contentType: "application/json",
                data: JSON.stringify(payload),
                success: function (res) {
                    const respuestaNegocio = res.json_response || res;
                    if (respuestaNegocio.codigoretorno == 1) {
                        // Limpiar backdrops antes de mostrar SweetAlert
                        window.limpiarBackdropsHuerfanos && window.limpiarBackdropsHuerfanos();
                        Swal.fire("Éxito", "Promoción Guardada: " + respuestaNegocio.mensaje, "success").then(() => {
                            resetearFormulario(tipo);
                            window.limpiarBackdropsHuerfanos && window.limpiarBackdropsHuerfanos();
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

    function cargarFiltrosItemsPromocion() {
        $("#filtroMarcaModal, #filtroDivisionModal, #filtroDepartamentoModal, #filtroClaseModal").html('<div class="text-center"><small class="text-muted">Cargando...</small></div>');

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
                                <input class="form-check-input filtro-item-checkbox" type="checkbox" id="${containerId}_${item.codigo}" value="${item.nombre}">
                                <label class="form-check-label" for="${containerId}_${item.codigo}">${item.nombre}</label>
                            </div>`);
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
                $("#filtroMarcaModal, #filtroDivisionModal, #filtroDepartamentoModal, #filtroClaseModal").html('<small class="text-danger">Error al cargar</small>');
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
                    data-excedentes="${item.excedente_s || item.excedente_d || 0}"
                    data-m0u="${item.m0_u || 0}"
                    data-m0s="${item.m0_s || item.m0_d || 0}"
                    data-m1u="${item.m1_u || 0}"
                    data-m1s="${item.m1_s || item.m1_d || 0}"
                    data-m2u="${item.m2_u || 0}"
                    data-m2s="${item.m2_s || item.m2_d || 0}"
                    data-m12u="${item.m12_u || 0}"
                    data-m12s="${item.m12_s || item.m12_d || 0}"
                    data-diasantiguedad="${item.dias_antiguedad || 0}"
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

    // ==========================================
    // AGREGAR ITEMS A TABLA ARTÍCULOS
    // ==========================================
    function agregarItemsATablaArticulos(items) {
        const $tbody = $("#tablaArticulosBody");
        let itemsNuevos = 0;

        items.forEach(item => {
            const existe = $tbody.find(`tr[data-codigo="${item.codigo}"]`).length > 0;
            if (existe) return;

            itemsNuevos++;
            const fila = `
        <tr data-codigo="${item.codigo}">
            <td class="text-center align-middle"><input type="radio" class="form-check-input item-row-radio" name="itemArticuloSel"></td>
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
            <td class="align-middle text-end">${item.m12u || 0}</td>
            <td class="align-middle text-end">${formatCurrencySpanish(item.m12s || 0)}</td>
            <td class="align-middle text-end">0</td>
            <td class="align-middle text-end">0</td>
            <td class="align-middle text-end">${item.margenmincontado}%</td>
            <td class="align-middle text-end">${item.margenmintc}%</td>
            <td class="align-middle text-end">${item.margenmincredito}%</td>
            <td class="align-middle text-end">${item.margenminigualar}%</td>
            <td class="align-middle celda-editable"><input type="number" class="form-control form-control-sm text-end" placeholder="0" min="0" disabled></td>
            <td class="align-middle celda-editable"><input type="number" class="form-control form-control-sm text-end" placeholder="0" min="0" disabled></td>
            <td class="align-middle celda-editable">
                <select class="form-select form-select-sm select-mediopago-articulo" disabled>
                    ${$("#filtroMedioPagoGeneral").html()}
                </select>
            </td>
            <td class="align-middle text-end">${formatCurrencySpanish(item.preciolistacontado)}</td>
            <td class="align-middle text-end">${formatCurrencySpanish(item.preciolistacredito)}</td>
            <td class="align-middle celda-editable"><input type="text" class="form-control form-control-sm text-end" placeholder="0.00" disabled></td>
            <td class="align-middle celda-editable"><input type="text" class="form-control form-control-sm text-end" placeholder="0.00" disabled></td>
            <td class="align-middle celda-editable"><input type="text" class="form-control form-control-sm text-end" placeholder="0.00" disabled></td>
            <td class="align-middle celda-editable"><input type="text" class="form-control form-control-sm text-end" placeholder="0.00" disabled></td>
            <td class="align-middle text-end">0.00</td>
            <td class="align-middle text-end">0.00</td>
            <td class="align-middle text-end">0.00</td>
            <td class="align-middle text-end">0.00</td>
            <td class="align-middle"><input type="text" class="form-control form-control-sm text-end aporte-valor aporte-proveedor" placeholder="0.00" disabled></td>
            <td class="align-middle celda-editable">
                <input type="hidden" class="acuerdo-id-hidden acuerdo-prov1-hidden" value="">
                <div class="input-group input-group-sm">
                    <input type="text" class="form-control form-control-sm" placeholder="Seleccione..." readonly disabled>
                    <button class="btn btn-outline-secondary btn-buscar-acuerdo-art" type="button" data-tipofondo="TFPROVEDOR" data-slot="1" disabled>
                        <i class="fa-solid fa-magnifying-glass"></i>
                    </button>
                </div>
            </td>
            <td class="align-middle"><input type="text" class="form-control form-control-sm text-end aporte-valor aporte-proveedor2" placeholder="0.00" disabled></td>
            <td class="align-middle celda-editable">
                <input type="hidden" class="acuerdo-id-hidden acuerdo-prov2-hidden" value="">
                <div class="input-group input-group-sm">
                    <input type="text" class="form-control form-control-sm" placeholder="Seleccione..." readonly disabled>
                    <button class="btn btn-outline-secondary btn-buscar-acuerdo-art" type="button" data-tipofondo="TFPROVEDOR" data-slot="2" disabled>
                        <i class="fa-solid fa-magnifying-glass"></i>
                    </button>
                </div>
            </td>
            <td class="align-middle"><input type="text" class="form-control form-control-sm text-end aporte-valor aporte-rebate" placeholder="0.00" disabled></td>
            <td class="align-middle celda-editable">
                <input type="hidden" class="acuerdo-id-hidden acuerdo-rebate-hidden" value="">
                <div class="input-group input-group-sm">
                    <input type="text" class="form-control form-control-sm" placeholder="Seleccione..." readonly disabled>
                    <button class="btn btn-outline-secondary btn-buscar-acuerdo-art" type="button" data-tipofondo="TFREBATE" data-slot="1" disabled>
                        <i class="fa-solid fa-magnifying-glass"></i>
                    </button>
                </div>
            </td>
            <td class="align-middle celda-editable"><input type="text" class="form-control form-control-sm text-end aporte-valor aporte-propio" placeholder="0.00" disabled></td>
            <td class="align-middle celda-editable">
                <input type="hidden" class="acuerdo-id-hidden acuerdo-propio1-hidden" value="">
                <div class="input-group input-group-sm">
                    <input type="text" class="form-control form-control-sm" placeholder="Seleccione..." readonly disabled>
                    <button class="btn btn-outline-secondary btn-buscar-acuerdo-art" type="button" data-tipofondo="TFPROPIO" data-slot="1" disabled>
                        <i class="fa-solid fa-magnifying-glass"></i>
                    </button>
                </div>
            </td>
            <td class="align-middle celda-editable"><input type="text" class="form-control form-control-sm text-end aporte-valor aporte-propio2" placeholder="0.00" disabled></td>
            <td class="align-middle celda-editable">
                <input type="hidden" class="acuerdo-id-hidden acuerdo-propio2-hidden" value="">
                <div class="input-group input-group-sm">
                    <input type="text" class="form-control form-control-sm" placeholder="Seleccione..." readonly disabled>
                    <button class="btn btn-outline-secondary btn-buscar-acuerdo-art" type="button" data-tipofondo="TFPROPIO" data-slot="2" disabled>
                        <i class="fa-solid fa-magnifying-glass"></i>
                    </button>
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

    // ==========================================
    // RECALCULAR FILA ARTÍCULO
    // ==========================================
    function recalcularFilaArticulo($fila) {
        // 1. Obtener valores base
        const costo = parseCurrency($fila.find("td:eq(2)").text());
        const precioListaContado = parseCurrency($fila.find("td:eq(25)").text());
        const precioListaCredito = parseCurrency($fila.find("td:eq(26)").text());

        // 2. Obtener precios ingresados
        const precioContado = parseCurrency($fila.find("td:eq(27) input").val());
        const precioTC = parseCurrency($fila.find("td:eq(28) input").val());
        const precioCredito = parseCurrency($fila.find("td:eq(29) input").val());
        const precioIgualar = parseCurrency($fila.find("td:eq(30) input").val());

        // 3. Obtener aportes
        const aporteProveedor = parseCurrency($fila.find(".aporte-proveedor").val());
        const aporteProveedor2 = parseCurrency($fila.find(".aporte-proveedor2").val());
        const aporteRebate = parseCurrency($fila.find(".aporte-rebate").val());
        const aportePropio = parseCurrency($fila.find(".aporte-propio").val());
        const aportePropio2 = parseCurrency($fila.find(".aporte-propio2").val());

        const otrosCostos = parseFloat($fila.data("total-otros-costos")) || 0;

        // Obtener unidades límite para los cálculos de compensación
        const unidadesLimite = parseInt($fila.find("td:eq(22) input").val()) || 0;

        // 4. CÁLCULO DE DESCUENTOS
        const dsctoContado = precioListaContado - precioContado;
        const dsctoTC = precioListaContado - precioTC;
        const dsctoCredito = precioListaCredito - precioCredito;
        const dsctoIgualar = precioListaContado - precioIgualar; // Usando Contado como base

        $fila.find("td:eq(31)").text(dsctoContado.toFixed(2));
        $fila.find("td:eq(32)").text(dsctoTC.toFixed(2));
        $fila.find("td:eq(33)").text(dsctoCredito.toFixed(2));
        $fila.find("td:eq(34)").text(dsctoIgualar.toFixed(2));

        // 5. CÁLCULO DE MÁRGENES PRECIO DE LISTA
        const margenPLContado = precioListaContado > 0 ? ((precioListaContado - costo) / precioListaContado * 100) : 0;
        $fila.find("td:eq(45)").text(margenPLContado.toFixed(2) + "%");

        const margenPLCredito = precioListaCredito > 0 ? ((precioListaCredito - costo) / precioListaCredito * 100) : 0;
        $fila.find("td:eq(46)").text(margenPLCredito.toFixed(2) + "%");

        // 6. CÁLCULO DE MÁRGENES DE PROMOCIÓN
        // Fórmula: (Precio Promo + Aporte Proveedor + Aporte Rebate – Costo – Otros Costos) / (Precio Promo + Aporte Proveedor + Aporte Rebate)
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

        // 7. CÁLCULO DE COMPENSACIONES (Valores Comprometidos x Unidades Límite)
        $fila.find("td:eq(51)").text(formatCurrencySpanish(aporteProveedor * unidadesLimite));
        $fila.find("td:eq(52)").text(formatCurrencySpanish(aporteProveedor2 * unidadesLimite));
        $fila.find("td:eq(53)").text(formatCurrencySpanish(aporteRebate * unidadesLimite));
        $fila.find("td:eq(54)").text(formatCurrencySpanish(aportePropio * unidadesLimite));
        $fila.find("td:eq(55)").text(formatCurrencySpanish(aportePropio2 * unidadesLimite));

        // 8. PINTADO DE CELDAS SEGÚN VALOR POSITIVO/NEGATIVO
        $fila.find("td:eq(31), td:eq(32), td:eq(33), td:eq(34), td:eq(45), td:eq(46), td:eq(47), td:eq(48), td:eq(49), td:eq(50)").each(function () {
            // Reemplazamos el % si lo tiene para validar el número real
            const textVal = $(this).text().replace('%', '');
            const valor = parseFloat(textVal);

            if (valor < 0) {
                $(this).css("color", "#dc3545"); // Rojo si es negativo
            } else if (valor > 0) {
                $(this).css("color", "#198754"); // Verde si es positivo
            } else {
                $(this).css("color", "#212529"); // Gris oscuro/Negro si es 0
            }
        });
    }

    function consultarAcuerdosPorArticulo(etiquetaTipoFondo, codigoItem, idAcuerdoActual) {
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
                    const isChecked = (String(x.idacuerdo) === String(idAcuerdoActual)) ? 'checked' : '';

                    $tbody.append(`<tr class="text-nowrap">
                    <td class="text-center align-middle">
                        <input class="form-check-input acuerdo-art-radio" type="radio" name="acuerdoArticuloSel"
                            data-idacuerdo="${x.idacuerdo || ''}"
                            data-descripcion="${x.descripcion || ''}"
                            data-proveedor="${x.nombre_proveedor || ''}"
                            data-disponible="${x.valor_disponible || 0}"
                            data-aporte="${x.valor_aporte_por_items || 0}"
                            data-unidades="${x.unidades_limite || 0}"
                            data-valoracuerdo="${x.valor_acuerdo || 0}"
                            data-estado="${x.estado || ''}"
                            ${isChecked}>
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

                $("#tablaAcuerdosArticulo tbody input[name='acuerdoArticuloSel']:checked").closest("tr").addClass("table-active");

                const $preSelected = $("#tablaAcuerdosArticulo tbody input[name='acuerdoArticuloSel']:checked");
                if ($preSelected.length > 0) {
                    const d = $preSelected.data();
                    acuerdoArticuloTemporal = {
                        idAcuerdo: d.idacuerdo,
                        descripcion: d.descripcion,
                        proveedor: d.proveedor,
                        disponible: d.disponible,
                        aporte: d.aporte,
                        unidades: d.unidades,
                        valorAcuerdo: d.valoracuerdo,
                        display: `${d.idacuerdo} - ${d.proveedor}`
                    };
                }

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
                        valorAcuerdo: d.valoracuerdo,
                        display: `${d.idacuerdo} - ${d.proveedor}`
                    };
                });
            },
            error: function () {
                $("#tablaAcuerdosArticulo tbody").html('<tr><td colspan="16" class="text-center text-danger">Error al consultar.</td></tr>');
            }
        });
    }

    function abrirModalAcuerdoArticulo(tipoFondo, tituloModal, codigoItem, $inputDisplay, $inputId, slot, $fila) {
        acuerdoArticuloTemporal = null;
        acuerdoArticuloContexto = {
            tipoFondo: tipoFondo,
            codigoItem: codigoItem,
            $inputDisplay: $inputDisplay,
            $inputId: $inputId,
            idActual: $inputId.val(),
            slot: slot || 1,
            $fila: $fila
        };

        $("#tituloModalAcuerdoArticulo").text(tituloModal);
        $("#buscarAcuerdoArticuloInput").val("");
        $("#modalAcuerdoArticulo").modal("show");

        consultarAcuerdosPorArticulo(tipoFondo, codigoItem, $inputId.val());
    }

    async function guardarPromocionArticulos() {
        const motivo = $("#motivoArticulos").val();
        const desc = $("#descripcionArticulos").val();
        const fechaInicio = getFullISOString("#fechaInicioArticulos", "#timeInicioArticulos");
        const fechaFin = getFullISOString("#fechaFinArticulos", "#timeFinArticulos");

        if (!desc || desc.trim().length < 3) { Swal.fire("Validación", "Debe ingresar una descripción.", "warning"); return; }
        if (!motivo) { Swal.fire("Validación", "Debe seleccionar un motivo.", "warning"); return; }
        if (!fechaInicio || !fechaFin) { Swal.fire("Validación", "Debe ingresar las fechas de inicio y fin.", "warning"); return; }
        const grupoArtVal = $("#filtroGrupoAlmacenArticulos").val();
        if (!grupoArtVal || grupoArtVal === "") { Swal.fire("Validación", "Debe seleccionar un Grupo de Almacén.", "warning"); return; }
        const almacenArtVal = $("#filtroAlmacenArticulos").val();
        if (!almacenArtVal || almacenArtVal === "") { Swal.fire("Validación", "Debe seleccionar un Almacén.", "warning"); return; }

        const $filas = $("#tablaArticulosBody tr");
        if ($filas.length === 0) { Swal.fire("Validación", "Debe agregar al menos un artículo en el detalle.", "warning"); return; }

        if (!esArchivoValido('#inputFileArticulos', '#fileNameArticulos')) {
            if ($('#inputFileArticulos')[0].files.length === 0) { Swal.fire("Archivo requerido", "Debe adjuntar el soporte", "warning"); }
            return;
        }

        const fileInput = $('#inputFileArticulos')[0].files[0];
        if (!fileInput) { Swal.fire("Archivo requerido", "Debe adjuntar el soporte de la promoción", "warning"); return; }

        const leerArchivo = file => new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = e => reject(e);
        });

        Swal.fire({ title: 'Procesando...', didOpen: () => Swal.showLoading() });

        try {
            const base64Completo = await leerArchivo(fileInput);
            const articulos = [];
            let errorFila = "";

            $filas.each(function (index) {
                const $fila = $(this);
                const numFila = index + 1;
                const codigo = String($fila.data("codigo"));

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
                const m12u = parseInt($fila.find("td:eq(14)").text()) || 0;
                const m12p = parseCurrency($fila.find("td:eq(15)").text());

                const igualarPrecio = parseCurrency($fila.find("td:eq(16)").text());

                const margenMinContado = parseFloat($fila.find("td:eq(18)").text()) || 0;
                const margenMinTC = parseFloat($fila.find("td:eq(19)").text()) || 0;
                const margenMinCredito = parseFloat($fila.find("td:eq(20)").text()) || 0;
                const margenMinIgualar = parseFloat($fila.find("td:eq(21)").text()) || 0;

                const unidadesLimite = parseInt($fila.find("td:eq(22) input").val()) || 0;
                const proyeccionVtas = parseInt($fila.find("td:eq(23) input").val()) || 0;

                if (unidadesLimite > 0 && proyeccionVtas > 0) {
                    errorFila = `Fila ${numFila}: Solo debe ingresar valor en Unidades Límite O Proyección Vtas, no en ambas.`;
                    return false;
                }
                if (unidadesLimite === 0 && proyeccionVtas === 0) {
                    errorFila = `Fila ${numFila}: Debe ingresar valor en Unidades Límite o Proyección Vtas.`;
                    return false;
                }

                const $selectMedioPago = $fila.find("td:eq(24) select");
                const medioPagoVal = $selectMedioPago.val();

                const precioListaContado = parseCurrency($fila.find("td:eq(25)").text());
                const precioListaCredito = parseCurrency($fila.find("td:eq(26)").text());
                const precioPromoContado = parseCurrency($fila.find("td:eq(27) input").val());
                const precioPromoTC = parseCurrency($fila.find("td:eq(28) input").val());
                const precioPromoCredito = parseCurrency($fila.find("td:eq(29) input").val());
                const precioIgualarPromo = parseCurrency($fila.find("td:eq(30) input").val());

                const dsctoContado = parseFloat($fila.find("td:eq(31)").text()) || 0;
                const dsctoTC = parseFloat($fila.find("td:eq(32)").text()) || 0;
                const dsctoCredito = parseFloat($fila.find("td:eq(33)").text()) || 0;
                const dsctoIgualar = parseFloat($fila.find("td:eq(34)").text()) || 0;

                const aporteProveedor = parseCurrency($fila.find(".aporte-proveedor").val());
                const idAcuerdoProveedor = parseInt($fila.find(".acuerdo-prov1-hidden").val()) || 0;
                const aporteProveedor2 = parseCurrency($fila.find(".aporte-proveedor2").val());
                const idAcuerdoProveedor2 = parseInt($fila.find(".acuerdo-prov2-hidden").val()) || 0;
                const aporteRebate = parseCurrency($fila.find(".aporte-rebate").val());
                const idAcuerdoRebate = parseInt($fila.find(".acuerdo-rebate-hidden").val()) || 0;
                const aportePropio = parseCurrency($fila.find(".aporte-propio").val());
                const idAcuerdoPropio = parseInt($fila.find(".acuerdo-propio1-hidden").val()) || 0;
                const aportePropio2 = parseCurrency($fila.find(".aporte-propio2").val());
                const idAcuerdoPropio2 = parseInt($fila.find(".acuerdo-propio2-hidden").val()) || 0;

                const compProveedor = parseCurrency($fila.find("td:eq(51)").text());
                const compProveedor2 = parseCurrency($fila.find("td:eq(52)").text());
                const compRebate = parseCurrency($fila.find("td:eq(53)").text());
                const compPropio = parseCurrency($fila.find("td:eq(54)").text());
                const compPropio2 = parseCurrency($fila.find("td:eq(55)").text());

                const margenPrecioListaContado = parseFloat($fila.find("td:eq(45)").text()) || 0;
                const margenPrecioListaCredito = parseFloat($fila.find("td:eq(46)").text()) || 0;
                const margenPromoContado = parseFloat($fila.find("td:eq(47)").text()) || 0;
                const margenPromoTC = parseFloat($fila.find("td:eq(48)").text()) || 0;
                const margenPromoCredito = parseFloat($fila.find("td:eq(49)").text()) || 0;
                const margenIgualar = parseFloat($fila.find("td:eq(50)").text()) || 0;

                const regalo = $fila.find("td:eq(56) input[type='checkbox']").is(":checked") ? "S" : "N";

                const acuerdosArticulo = [];
                if (idAcuerdoProveedor > 0) acuerdosArticulo.push({ idacuerdo: idAcuerdoProveedor, valoraporte: aporteProveedor, valorcomprometido: compProveedor, etiqueta_tipo_fondo: "TFPROVEDOR" });
                if (idAcuerdoProveedor2 > 0) acuerdosArticulo.push({ idacuerdo: idAcuerdoProveedor2, valoraporte: aporteProveedor2, valorcomprometido: compProveedor2, etiqueta_tipo_fondo: "TFPROVEDOR" });
                if (idAcuerdoRebate > 0) acuerdosArticulo.push({ idacuerdo: idAcuerdoRebate, valoraporte: aporteRebate, valorcomprometido: compRebate, etiqueta_tipo_fondo: "TFREBATE" });
                if (idAcuerdoPropio > 0) acuerdosArticulo.push({ idacuerdo: idAcuerdoPropio, valoraporte: aportePropio, valorcomprometido: compPropio, etiqueta_tipo_fondo: "TFPROPIO" });
                if (idAcuerdoPropio2 > 0) acuerdosArticulo.push({ idacuerdo: idAcuerdoPropio2, valoraporte: aportePropio2, valorcomprometido: compPropio2, etiqueta_tipo_fondo: "TFPROPIO" });

                const mediosPago = [];
                const mediosPagoSeleccionados = $selectMedioPago.data("seleccionados") || [];

                if (medioPagoVal === "7" && mediosPagoSeleccionados.length === 0) {
                    errorFila = `Fila ${numFila}: Seleccionaste "Varios" en Medio de Pago, pero no marcaste elementos en la lista.`;
                    return false;
                }

                if (medioPagoVal === "7") {
                    mediosPago.push({ tipoasignacion: "D", codigos: mediosPagoSeleccionados });
                } else if (medioPagoVal && medioPagoVal !== "" && medioPagoVal !== "TODAS" && medioPagoVal !== "TODOS") {
                    mediosPago.push({ tipoasignacion: "C", codigos: [medioPagoVal] });
                } else {
                    mediosPago.push({ tipoasignacion: "T", codigos: [] });
                }

                const otrosCostosGuardados = $fila.data("detalle-otros-costos") || [];
                const otrosCostosMapeados = otrosCostosGuardados.map(oc => {
                    return {
                        codigoparametro: parseInt(oc.codigo, 10) || 0,
                        costo: parseFloat(oc.valor) || 0
                    };
                });

                articulos.push({
                    codigoitem: String(codigo),
                    descripcion: $fila.find("td:eq(1)").text(),
                    costo: costo,
                    stockbodega: stockBodega,
                    stocktienda: stockTienda,
                    inventariooptimo: invOptimo,
                    excedenteunidad: excedenteU,
                    excedentevalor: excedenteV,
                    m0unidades: m0u,
                    m0precio: m0p,
                    m1unidades: m1u,
                    m1precio: m1p,
                    m2unidades: m2u,
                    m2precio: m2p,
                    m12unidades: m12u,
                    m12precio: m12p,
                    igualarprecio: igualarPrecio,
                    diasantiguedad: 0,
                    margenminimocontado: margenMinContado,
                    margenminimotarjetacredito: margenMinTC,
                    margenminimocredito: margenMinCredito,
                    margenminimoigualar: margenMinIgualar,
                    unidadeslimite: unidadesLimite,
                    unidadesproyeccionventas: proyeccionVtas,
                    preciolistacontado: precioListaContado,
                    preciolistacredito: precioListaCredito,
                    preciopromocioncontado: precioPromoContado,
                    preciopromociontarjetacredito: precioPromoTC,
                    preciopromocioncredito: precioPromoCredito,
                    precioigualarprecio: precioIgualarPromo,
                    descuentopromocioncontado: dsctoContado,
                    descuentopromociontarjetacredito: dsctoTC,
                    descuentopromocioncredito: dsctoCredito,
                    descuentoigualarprecio: dsctoIgualar,
                    margenpreciolistacontado: margenPrecioListaContado,
                    margenpreciolistacredito: margenPrecioListaCredito,
                    margenpromocioncontado: margenPromoContado,
                    margenpromociontarjetacredito: margenPromoTC,
                    margenpromocioncredito: margenPromoCredito,
                    margenigualarprecio: margenIgualar,
                    marcaregalo: regalo,
                    mediospago: mediosPago,
                    acuerdos: acuerdosArticulo,
                    otroscostos: otrosCostosMapeados
                });
            });

            if (errorFila) {
                Swal.fire("Validación de Detalle", errorFila, "warning"); return;
            }

            const determinarAsignacion = (idSelector) => {
                const val = $(idSelector).val();
                if (val === "TODAS" || val === "TODOS" || !val || val === "") return "T";
                if (val === "3" || val === "4" || val === "7") return "D";
                return "C";
            };

            const segmentos = [
                { tiposegmento: "SEGCANAL", codigos: obtenerValorCampo("canalArticulos", "#filtroCanalArticulos", "3"), tipoasignacion: determinarAsignacion("#filtroCanalArticulos") },
                { tiposegmento: "SEGGRUPOALMACEN", codigos: obtenerValorCampo("grupoArticulos", "#filtroGrupoAlmacenArticulos", "3"), tipoasignacion: determinarAsignacion("#filtroGrupoAlmacenArticulos") },
                { tiposegmento: "SEGALMACEN", codigos: obtenerValorCampo("almacenArticulos", "#filtroAlmacenArticulos", "3"), tipoasignacion: determinarAsignacion("#filtroAlmacenArticulos") },
                {
                    tiposegmento: "SEGTIPOCLIENTE", codigos: (function () {
                        const val = $("#tipoClienteArticulos").val();
                        if (val === "4") return $("#btnListaClienteArticulos").data("seleccionados") || [];
                        if (val && val !== "" && val !== "TODOS" && val !== "3") return [val];
                        return [];
                    })(), tipoasignacion: determinarAsignacion("#tipoClienteArticulos")
                },
                { tiposegmento: "SEGMARCA", codigos: [], tipoasignacion: "T" },
                { tiposegmento: "SEGDIVISION", codigos: [], tipoasignacion: "T" },
                { tiposegmento: "SEGDEPARTAMENTO", codigos: [], tipoasignacion: "T" },
                { tiposegmento: "SEGCLASE", codigos: [], tipoasignacion: "T" },
                { tiposegmento: "SEGMEDIOPAGO", codigos: [], tipoasignacion: "T" }
            ];

            const body = {
                tipoclaseetiqueta: "PRARTICULO",
                idopcion: getIdOpcionSeguro(),
                idcontrolinterfaz: "BTNGRABAR",
                ideventoetiqueta: "EVCLICK",
                nombrearchivosoporte: fileInput.name,
                archivosoportebase64: base64Completo.split(",")[1] || base64Completo,
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

            console.log("body: ", body);

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

    async function guardarPromocionCombo() {
        const motivo = parseInt($("#motivoCombos").val(), 10) || 0;
        const desc = $("#descripcionCombos").val();
        const fechaInicio = getFullISOString("#fechaInicioCombos", "#timeInicioCombos");
        const fechaFin = getFullISOString("#fechaFinCombos", "#timeFinCombos");

        if (!desc || !motivo || !fechaInicio || !fechaFin) {
            Swal.fire("Validación", "Complete los datos de cabecera (Descripción, Motivo y Fechas).", "warning");
            return;
        }

        const fileInput = $('#inputFileCombos')[0].files[0];
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

        try {
            const base64Completo = await leerArchivo(fileInput);
            const combosParaAPI = [];
            const $filasCombos = $("#tablaCombosBody tr");

            if ($filasCombos.length === 0) {
                Swal.fire("Validación", "Debe agregar al menos un combo.", "warning");
                return;
            }

            $filasCombos.each(function () {
                const $fila = $(this);
                const codigoCombo = String($fila.data("codigo"));
                const nombreCombo = $fila.data("combo-nombre");
                const componentesMemoria = articulosPorComboMemoria[codigoCombo] || [];

                const listaComponentes = componentesMemoria.map(art => ({
                    "codigoarticulo": String(art.codigo),
                    "descripcion": art.descripcion,
                    "costo": art.costo || 0,
                    "stockbodega": art.stock || 0,
                    "stocktienda": art.stockTienda || 0,
                    "inventariooptimo": art.optimo || 0,
                    "excedenteu": art.excedenteu || 0,
                    "excedenteusd": art.excedentes || 0,
                    "ventahistoricam0u": art.m0u || 0,
                    "ventahistoricam0usd": art.m0s || 0,
                    "ventahistoricam1u": art.m1u || 0,
                    "ventahistoricam1usd": art.m1s || 0,
                    "ventahistoricam2u": art.m2u || 0,
                    "ventahistoricam2usd": art.m2s || 0,
                    "ventahistoricam12u": art.m12u || 0,
                    "ventahistoricam12usd": art.m12s || 0,
                    "margenminimocontado": 0,
                    "margenminimotarjetacredito": 0,
                    "margenminimopreciocredito": 0,
                    "margenminimoigualar": 0,
                    "preciolistacontado": 0,
                    "preciolistacredito": 0,
                    "preciopromocioncontado": art.promoContado || 0,
                    "preciopromociontarjetacredito": art.promoTC || 0,
                    "preciopromocioncredito": art.promoCredito || 0,
                    "jsonacuerdos": [
                        ...(art.idAcuerdoProveedor ? [{ "idacuerdo": art.idAcuerdoProveedor, "valoraporte": art.aporteProveedor, "valorcomprometido": 0 }] : []),
                        ...(art.idAcuerdoProveedor2 ? [{ "idacuerdo": art.idAcuerdoProveedor2, "valoraporte": art.aporteProveedor2, "valorcomprometido": 0 }] : []),
                        ...(art.idAcuerdoRebate ? [{ "idacuerdo": art.idAcuerdoRebate, "valoraporte": art.aporteRebate, "valorcomprometido": 0 }] : []),
                        ...(art.idAcuerdoPropio ? [{ "idacuerdo": art.idAcuerdoPropio, "valoraporte": art.aportePropio, "valorcomprometido": 0 }] : []),
                        ...(art.idAcuerdoPropio2 ? [{ "idacuerdo": art.idAcuerdoPropio2, "valoraporte": art.aportePropio2, "valorcomprometido": 0 }] : [])
                    ],
                    "jsonotroscostos": art.otrosCostos || []
                }));

                combosParaAPI.push({
                    "codigoitem": codigoCombo,
                    "descripcion": nombreCombo,
                    "descripcioncombo": nombreCombo,
                    "costo": parseCurrency($fila.find("td:eq(2)").text()),
                    "stockbodega": parseInt($fila.find("td:eq(3)").text()) || 0,
                    "stocktienda": parseInt($fila.find("td:eq(4)").text()) || 0,
                    "inventariooptimo": parseInt($fila.find("td:eq(5)").text()) || 0,
                    "excedenteunidad": parseInt($fila.find("td:eq(6)").text()) || 0,
                    "excedentevalor": parseCurrency($fila.find("td:eq(7)").text()),
                    "m0unidades": 0, "m0precio": 0, "m1unidades": 0, "m1precio": 0,
                    "m2unidades": 0, "m2precio": 0, "m12unidades": 0, "m12precio": 0,
                    "igualarprecio": 0,
                    "diasantiguedad": 0,
                    "margenminimocontado": 0,
                    "margenminimotarjetacredito": 0,
                    "margenminimocredito": 0,
                    "margenminimoigualar": 0,
                    "margenminimoigualarprecio": 0,
                    "unidadeslimite": parseInt($fila.find(".val-unidades-combo").val()) || 0,
                    "unidadesproyeccionventas": parseInt($fila.find(".val-proyeccion-combo").val()) || 0,
                    "proyeccionventas": parseInt($fila.find(".val-proyeccion-combo").val()) || 0,
                    "preciolistacontado": parseCurrency($fila.find("td:eq(11)").text()),
                    "preciolistacredito": parseCurrency($fila.find("td:eq(12)").text()),
                    "preciopromocioncontado": parseCurrency($fila.find("td:eq(13)").text()),
                    "preciopromociontarjetacredito": parseCurrency($fila.find("td:eq(14)").text()),
                    "preciopromocioncredito": parseCurrency($fila.find("td:eq(15)").text()),
                    "precioigualarprecio": 0,
                    "descuentopromocioncontado": parseCurrency($fila.find("td:eq(16)").text()),
                    "descuentopromociontarjetacredito": parseCurrency($fila.find("td:eq(17)").text()),
                    "descuentopromocioncredito": parseCurrency($fila.find("td:eq(18)").text()),
                    "descuentoigualarprecio": 0,
                    "margenpreciolistacontado": 0,
                    "margenpreciolistacredito": 0,
                    "margenpromocioncontado": parseFloat($fila.find("td:eq(19)").text()) || 0,
                    "margenpromociontarjetacredito": parseFloat($fila.find("td:eq(20)").text()) || 0,
                    "margenpromocioncredito": parseFloat($fila.find("td:eq(21)").text()) || 0,
                    "margenigualarprecio": 0,
                    "marcaregalo": $fila.find("td:last-child input").is(":checked") ? "S" : "N",
                    "regalo": $fila.find("td:last-child input").is(":checked") ? "S" : "N",
                    "mediospago": (function () {
                        const selMP = $fila.find(".select-mediopago-combo-final");
                        const valMP = selMP.val();
                        const codesMP = selMP.data("seleccionados") || [];
                        if (valMP === "7") return [{ "tipoasignacion": "D", "codigos": codesMP, "codigo": codesMP }];
                        if (valMP && valMP !== "TODAS") return [{ "tipoasignacion": "C", "codigos": [valMP], "codigo": [valMP] }];
                        return [{ "tipoasignacion": "T", "codigos": [], "codigo": [] }];
                    })(),
                    "acuerdos": [],
                    "otroscostos": [],
                    "componentes": listaComponentes
                });
            });

            const determinarAsignacion = (idSelector) => {
                const val = $(idSelector).val();
                if (val === "TODAS" || val === "TODOS" || !val || val === "") return "T";
                if (val === "3" || val === "4" || val === "7") return "D";
                return "C";
            };

            const segmentos = [
                { tiposegmento: "SEGCANAL", codigos: obtenerValorCampo("canalCombos", "#filtroCanalCombos", "3"), tipoasignacion: determinarAsignacion("#filtroCanalCombos") },
                { tiposegmento: "SEGGRUPOALMACEN", codigos: obtenerValorCampo("grupoCombos", "#filtroGrupoAlmacenCombos", "3"), tipoasignacion: determinarAsignacion("#filtroGrupoAlmacenCombos") },
                { tiposegmento: "SEGALMACEN", codigos: obtenerValorCampo("almacenCombos", "#filtroAlmacenCombos", "3"), tipoasignacion: determinarAsignacion("#filtroAlmacenCombos") },
                {
                    tiposegmento: "SEGTIPOCLIENTE", codigos: (function () {
                        const val = $("#tipoClienteCombos").val();
                        if (val === "4") return $("#btnListaClienteCombos").data("seleccionados") || [];
                        if (val && val !== "" && val !== "TODOS" && val !== "3") return [val];
                        return [];
                    })(), tipoasignacion: determinarAsignacion("#tipoClienteCombos")
                },
                { tiposegmento: "SEGMARCA", codigos: [], tipoasignacion: "T" },
                { tiposegmento: "SEGDIVISION", codigos: [], tipoasignacion: "T" },
                { tiposegmento: "SEGDEPARTAMENTO", codigos: [], tipoasignacion: "T" },
                { tiposegmento: "SEGCLASE", codigos: [], tipoasignacion: "T" },
                { tiposegmento: "SEGMEDIOPAGO", codigos: [], tipoasignacion: "T" }
            ];

            const body = {
                "tipoclaseetiqueta": "PRCOMBO",
                "idopcion": getIdOpcionSeguro(),
                "idcontrolinterfaz": "BTNGRABAR",
                "ideventoetiqueta": "EVCLICK",
                "nombrearchivosoporte": fileInput.name,
                "archivosoportebase64": base64Completo.split(",")[1] || base64Completo,
                "promocion": {
                    "descripcion": desc,
                    "motivo": motivo,
                    "clasepromocion": parseInt($("#promocionTipo").val(), 10) || 0,
                    "fechahorainicio": fechaInicio,
                    "fechahorafin": fechaFin,
                    "idusuarioingreso": getUsuario(),
                    "nombreusuario": getUsuario()
                },
                "acuerdos": [],
                "segmentos": segmentos,
                "articulos": combosParaAPI
            };

            $.ajax({
                url: "/api/apigee-router-proxy",
                method: "POST",
                contentType: "application/json",
                data: JSON.stringify({
                    code_app: "APP20260128155212346",
                    http_method: "POST",
                    endpoint_path: "api/promocion/insertar",
                    client: "APL",
                    body_request: body
                }),
                success: function (res) {
                    const respuesta = res.json_response || res;
                    if (respuesta.codigoretorno == 1) {
                        Swal.fire("Éxito", "Promoción por Combos Guardada: " + respuesta.mensaje, "success")
                            .then(() => resetearFormulario("Combos"));
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
            Swal.fire("Error", "No se pudo procesar el guardado", "error");
        }
    }

    // ==========================================
    // LÓGICA DE BOTONES: EQUIVALENTES, PRECIOS COMPETENCIA, OTROS COSTOS
    // ==========================================
    function obtenerCodigoArticuloSeleccionado() {
        const $radio = $("#tablaArticulosBody .item-row-radio:checked");
        if ($radio.length === 0) {
            Swal.fire({ icon: "warning", title: "Atención", text: "Debe seleccionar un artículo de la tabla primero." });
            return null;
        }
        return $radio.closest("tr").data("codigo");
    }

    function consultarServicioAdicional(endpoint_path, codigoArticulo, callbackExito) {
        Swal.fire({ title: 'Consultando...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

        const payload = {
            code_app: "APP20260128155212346",
            http_method: "GET",
            endpoint_path: endpoint_path,
            client: "APL",
            endpoint_query_params: "/" + codigoArticulo
        };

        $.ajax({
            url: "/api/apigee-router-proxy",
            method: "POST",
            contentType: "application/json",
            data: JSON.stringify(payload),
            success: function (res) {
                Swal.close();
                const data = res.json_response || [];
                callbackExito(data);
            },
            error: function () {
                Swal.fire("Error", "No se pudo obtener la información de este servicio.", "error");
            }
        });
    }

    function initBotonesServiciosArticulos() {
        $("#btnEquivalentes").on("click", function () {
            const codigo = obtenerCodigoArticuloSeleccionado();
            if (!codigo) return;

            consultarServicioAdicional("api/Promocion/consultar-articulo-equivalente", codigo, function (data) {
                const $tbody = $("#tbodyEquivalentes");
                $tbody.empty();

                if (!data.length) {
                    $tbody.html('<tr><td colspan="14" class="text-center text-muted">No existen equivalentes para este artículo.</td></tr>');
                } else {
                    data.forEach(item => {
                        $tbody.append(`
                            <tr>
                                <td>${item.codigo || ''} - ${item.descripcion || ''}</td>
                                <td class="text-end">${formatCurrencySpanish(item.costo)}</td>
                                <td class="text-center">${item.stock_bodega || 0}</td>
                                <td class="text-center">${item.stock_tiendas || 0}</td>
                                <td class="text-center">${item.inventario_optimo || 0}</td>
                                <td class="text-center">${item.excedentes_unidades || 0}</td>
                                <td class="text-end">${formatCurrencySpanish(item.excedentes_dolares)}</td>
                                <td class="text-center">${item.dias_antiguedad || 0}</td> 
                                <td class="text-center">${item.m0_unidades || 0}</td>
                                <td class="text-end">${formatCurrencySpanish(item.m0_dolares)}</td>
                                <td class="text-center">${item.m1_unidades || 0}</td>
                                <td class="text-end">${formatCurrencySpanish(item.m1_dolares)}</td>
                                <td class="text-center">${item.m2_unidades || 0}</td>
                                <td class="text-end">${formatCurrencySpanish(item.m2_dolares)}</td>
                            </tr>
                        `);
                    });
                }
                $("#modalEquivalentes").modal("show");
            });
        });

        $("#btnPreciosCompetencia").on("click", function () {
            const codigo = obtenerCodigoArticuloSeleccionado();
            if (!codigo) return;

            consultarServicioAdicional("api/Promocion/consultar-articulo-precio-competencia", codigo, function (data) {
                const $tbody = $("#tbodyPreciosCompetencia");
                $tbody.empty();

                if (!data.length) {
                    $tbody.html('<tr><td colspan="2" class="text-center text-muted">No hay precios de competencia registrados.</td></tr>');
                } else {
                    data.forEach(item => {
                        $tbody.append(`
                            <tr>
                                <td>${item.nombre_competencia || ''}</td>
                                <td class="text-end">${formatCurrencySpanish(item.precio_contado)}</td>
                            </tr>
                        `);
                    });
                }
                $("#modalPreciosCompetencia").modal("show");
            });
        });

        $("#btnOtrosCostos").on("click", function () {
            const codigo = obtenerCodigoArticuloSeleccionado();
            if (!codigo) return;

            consultarServicioAdicional("api/Promocion/consultar-otros-costos", codigo, function (data) {
                const $tbody = $("#tbodyOtrosCostos");
                $tbody.empty();

                if (!data.length) {
                    $tbody.html('<tr><td colspan="3" class="text-center text-muted">No hay otros costos aplicables.</td></tr>');
                } else {
                    data.forEach(item => {
                        $tbody.append(`
                            <tr>
                                <td class="text-center align-middle">
                                    <input class="form-check-input chk-otro-costo" type="checkbox" 
                                           data-codigo="${item.codigo}" 
                                           data-nombre="${item.nombre}" 
                                           data-valor="${item.valor}">
                                </td>
                                <td class="align-middle">${item.nombre || ''}</td>
                                <td class="text-end align-middle">${formatCurrencySpanish(item.valor)}</td>
                            </tr>
                        `);
                    });
                }
                $("#modalOtrosCostos").modal("show");
            });
        });

        $("#btnAplicarOtrosCostos").off("click").on("click", function () {
            let totalOtrosCostos = 0;
            let seleccionados = [];

            $("#tbodyOtrosCostos .chk-otro-costo:checked").each(function () {
                const valor = parseFloat($(this).data("valor")) || 0;
                totalOtrosCostos += valor;

                seleccionados.push({
                    codigo: $(this).data("codigo"),
                    nombre: $(this).data("nombre"),
                    valor: valor
                });
            });

            const $filaArticulo = $("#tablaArticulosBody .item-row-radio:checked").closest("tr");
            $filaArticulo.data("total-otros-costos", totalOtrosCostos);
            $filaArticulo.data("detalle-otros-costos", seleccionados);

            recalcularFilaArticulo($filaArticulo);

            $("#modalOtrosCostos").modal("hide");

            if (totalOtrosCostos > 0) {
                Swal.fire({ toast: true, position: "top-end", icon: "success", title: `Otros costos aplicados: ${formatCurrencySpanish(totalOtrosCostos)}`, showConfirmButton: false, timer: 2000 });
            }
        });
    }

    // ==========================================
    // LÓGICA DE COMBOS
    // ==========================================

    /**
     * Extrae los artículos del modal de creación de combo (tabla transpuesta).
     * Recorre las columnas dinámicas (índice >= 2) y lee cada campo data-campo.
     * Retorna un array de objetos con la información de cada artículo del combo.
     */
    function extraerArticulosDelModalCombo() {
        const articulos = [];
        const numColumnas = $("#trHeadersCombo th").length;

        for (let colIdx = 2; colIdx < numColumnas; colIdx++) {
            const art = { mediosPago: [], acuerdos: [], otrosCostos: [] };

            $("#tablaCreacionCombo tbody tr").each(function () {
                const campo = $(this).data("campo");
                const $td = $(this).find(`td[data-colindex='${colIdx}']`);
                if ($td.length === 0) return;

                const $input = $td.find("input[type='text'], input[type='number'], input[type='hidden']");
                const $select = $td.find("select");
                const $checkbox = $td.find("input[type='checkbox']");

                let val = "";
                if ($input.length > 0) val = $input.val();
                else if ($select.length > 0) val = $select.val();
                else val = $td.text();

                switch (campo) {
                    case "art_codigo": art.codigo = val; break;
                    case "art_descripcion": art.descripcion = val; break;
                    case "costo": art.costo = parseCurrency(val); break;
                    case "stock_bodega": art.stock = parseInt(val) || 0; break;
                    case "stock_tienda": art.stockTienda = parseInt(val) || 0; break;
                    case "inv_optimo": art.optimo = parseInt(val) || 0; break;
                    case "excedentes_u": art.excedenteu = parseInt(val) || 0; break;
                    case "excedentes_usd": art.excedentes = parseCurrency(val); break;
                    case "m0_u": art.m0u = parseInt(val) || 0; break;
                    case "m0_usd": art.m0s = parseCurrency(val); break;
                    case "m1_u": art.m1u = parseInt(val) || 0; break;
                    case "m1_usd": art.m1s = parseCurrency(val); break;
                    case "m2_u": art.m2u = parseInt(val) || 0; break;
                    case "m2_usd": art.m2s = parseCurrency(val); break;
                    case "m12_u": art.m12u = parseInt(val) || 0; break;
                    case "m12_usd": art.m12s = parseCurrency(val); break;
                    case "dias_antiguedad": art.diasantiguedad = parseInt(val) || 0; break;
                    case "margen_min_cont": art.margenmincontado = parseFloat(val) || 0; break;
                    case "margen_min_tc": art.margenmintc = parseFloat(val) || 0; break;
                    case "margen_min_cred": art.margenmincredito = parseFloat(val) || 0; break;
                    case "margen_min_igual": art.margenminigualar = parseFloat(val) || 0; break;
                    case "precio_lista_contado": art.preciolistacontado = parseCurrency(val); break;
                    case "precio_lista_credito": art.preciolistacredito = parseCurrency(val); break;
                    case "unidades_limite": art.unidadesLimite = parseInt(val) || 0; break;
                    case "proyeccion_vta": art.proyeccionVtas = parseInt(val) || 0; break;
                    case "promo_contado": art.promoContado = parseCurrency(val); break;
                    case "promo_tc": art.promoTC = parseCurrency(val); break;
                    case "promo_credito": art.promoCredito = parseCurrency(val); break;
                    case "aporte_prov": art.aporteProveedor = parseCurrency(val); break;
                    case "aporte_prov2": art.aporteProveedor2 = parseCurrency(val); break;
                    case "aporte_rebate": art.aporteRebate = parseCurrency(val); break;
                    case "aporte_propio": art.aportePropio = parseCurrency(val); break;
                    case "aporte_propio2": art.aportePropio2 = parseCurrency(val); break;
                    case "aporte_prov_id":
                        art.idAcuerdoProveedor = parseInt($td.find(".acuerdo-id-hidden").val()) || 0;
                        art.displayAcuerdoProveedor = $td.find("input[type='text']").val(); // Mantiene el nombre del acuerdo
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
                    case "medio_pago":
                        const $sel = $td.find(".select-mediopago-combo");
                        const medioPagoVal = $sel.val();
                        const mediosPagoSel = $sel.data("seleccionados") || [];
                        if (medioPagoVal === "7") {
                            art.mediosPago.push({ tipoasignacion: "D", codigos: mediosPagoSel });
                        } else if (medioPagoVal && medioPagoVal !== "" && medioPagoVal !== "TODAS" && medioPagoVal !== "TODOS") {
                            art.mediosPago.push({ tipoasignacion: "C", codigos: [medioPagoVal] });
                        } else {
                            art.mediosPago.push({ tipoasignacion: "T", codigos: [] });
                        }
                        break;
                    case "regalo": art.regalo = $checkbox.is(":checked") ? "S" : "N"; break;
                }
            });

            const otrosCostos = $(`#trHeadersCombo th:eq(${colIdx})`).data("detalle-otros-costos") || [];
            art.otrosCostos = otrosCostos.map(oc => ({ codigoparametro: parseInt(oc.codigo, 10) || 0, costo: parseFloat(oc.valor) || 0 }));
            art.totalOtrosCostos = parseFloat($(`#trHeadersCombo th:eq(${colIdx})`).data("total-otros-costos")) || 0;

            if (art.codigo && art.codigo.trim() !== "" && art.codigo !== "Auto") {
                articulos.push(art);
            }
        }
        return articulos;
    }

    /**
     * Limpia el modal de creación de combo: quita columnas dinámicas (>= col 2),
     * resetea los campos de código/nombre.
     */
    function limpiarModalCombo() {
        const numCols = $("#trHeadersCombo th").length;
        for (let i = numCols - 1; i >= 2; i--) {
            $("#trHeadersCombo th:eq(" + i + ")").remove();
            $("#tablaCreacionCombo tbody tr").each(function () {
                $(this).find("td:eq(" + i + ")").remove();
            });
        }

        $("#nombreComboModal").val("");
        $("#btnHeaderComboTotal").text("Nuevo Combo");

        $("#tablaCreacionCombo tbody tr").each(function () {
            const $td = $(this).find("td:eq(1)");
            const $input = $td.find("input");
            const $select = $td.find("select");
            const $btn = $td.find("button"); // Botón del input-group

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

            // Limpiar Select y esconder Botón de Medio de Pago
            if ($select.length > 0) {
                $select.val("");
                $select.removeData("seleccionados");
            }
            if ($btn.length > 0) {
                $btn.addClass("d-none").removeClass("btn-success").addClass("btn-outline-secondary").html(`<i class="fa-solid fa-list-check"></i>`);
            }
        });

        comboEnEdicion = null;
    }

    // ==========================================
    // FUNCIÓN AUXILIAR DE CÁLCULO PARA COLUMNAS DEL COMBO
    // ==========================================
    function recalcularColumnaCombo(colIndex) {
        // Solo se calcula para columnas de artículos (índice 2 en adelante)
        if (colIndex < 2) return;

        const getColVal = (campo, selector) => {
            const text = $(`#tablaCreacionCombo tbody tr[data-campo='${campo}'] td[data-colindex='${colIndex}'] ${selector}`).val() || $(`#tablaCreacionCombo tbody tr[data-campo='${campo}'] td[data-colindex='${colIndex}'] ${selector}`).text();
            return parseCurrency(text);
        };

        const setColVal = (campo, selector, val) => {
            $(`#tablaCreacionCombo tbody tr[data-campo='${campo}'] td[data-colindex='${colIndex}'] ${selector}`).val(val);
        };

        // 1. Obtener valores base del artículo
        const costo = getColVal("costo", "input");
        const precioListaContado = getColVal("precio_lista_contado", "input");
        const precioListaCredito = getColVal("precio_lista_credito", "input");
        const otrosCostos = parseFloat($(`#trHeadersCombo th:eq(${colIndex})`).data("total-otros-costos")) || 0;

        // 2. Obtener Unidades desde la columna del COMBO (td:eq(1))
        const getComboVal = (campo) => parseCurrency($(`#tablaCreacionCombo tbody tr[data-campo='${campo}'] td:eq(1) input`).val());
        const unidadesLimite = getComboVal("unidades_limite");
        const proyeccionVtas = getComboVal("proyeccion_vta");
        const unidades = unidadesLimite > 0 ? unidadesLimite : proyeccionVtas;

        // 3. Precios de Promoción ingresados
        const promoContado = getColVal("promo_contado", "input");
        const promoTC = getColVal("promo_tc", "input");
        const promoCredito = getColVal("promo_credito", "input");

        // --- FÓRMULAS DE DESCUENTOS ---
        setColVal("dscto_contado", "input", formatCurrencySpanish(precioListaContado - promoContado));
        setColVal("dscto_tc", "input", formatCurrencySpanish(precioListaContado - promoTC));
        setColVal("dscto_credito", "input", formatCurrencySpanish(precioListaCredito - promoCredito));

        // 4. Aportes ingresados
        const apProv = getColVal("aporte_prov", "input");
        const apProv2 = getColVal("aporte_prov2", "input");
        const apRebate = getColVal("aporte_rebate", "input");
        const apPropio = getColVal("aporte_propio", "input");
        const apPropio2 = getColVal("aporte_propio2", "input");

        // --- FÓRMULAS DE VALORES COMPROMETIDOS ---
        setColVal("comp_proveedor", "input", formatCurrencySpanish(apProv * unidades));
        setColVal("comp_proveedor2", "input", formatCurrencySpanish(apProv2 * unidades));
        setColVal("comp_rebate", "input", formatCurrencySpanish(apRebate * unidades));
        setColVal("comp_propio", "input", formatCurrencySpanish(apPropio * unidades));
        setColVal("comp_propio2", "input", formatCurrencySpanish(apPropio2 * unidades));

        // --- FÓRMULAS DE MÁRGENES ---
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

    // ==========================================
    // LÓGICA PRINCIPAL DE COMBOS
    // ==========================================
    // ==========================================
    // LÓGICA PRINCIPAL DE COMBOS
    // ==========================================
    // ==========================================
    // LÓGICA PRINCIPAL DE COMBOS
    // ==========================================
    // ==========================================
    // LÓGICA PRINCIPAL DE COMBOS
    // ==========================================
    function initLogicaCombos() {

        $("#btnNuevoCombo").off("click").on("click", function () {
            comboEnEdicion = null;
            limpiarModalCombo();
        });

        // 2. GUARDAR COMBO
        $("#btnConfirmarCombo").off("click").on("click", function () {
            let codigo = comboEnEdicion ? comboEnEdicion : "CMB-" + ($("#tablaCombosBody tr").length + 1);
            const nombre = $("#nombreComboModal").val().trim();

            if (!nombre) { Swal.fire("Validación", "Debe ingresar un nombre para el combo.", "warning"); return; }

            const articulosCombo = extraerArticulosDelModalCombo();
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

            if (comboEnEdicion) {
                $(`#tablaCombosBody tr[data-codigo="${comboEnEdicion}"]`).remove();
            } else if ($(`#tablaCombosBody tr[data-codigo="${codigo}"]`).length > 0) {
                Swal.fire("Atención", "Este código de combo ya existe en el detalle.", "warning"); return;
            }

            // Construimos el botón para Medio de Pago en la tabla principal
            const btnMPHtml = (modalMedioPago === "7" && modalMedioPagoSel && modalMedioPagoSel.length > 0)
                ? `<button class="btn btn-success btn-sm btn-editar-mp-combo" type="button"><i class="fa-solid fa-list-check"></i> (${modalMedioPagoSel.length})</button>`
                : `<button class="btn btn-outline-secondary btn-sm d-none btn-editar-mp-combo" type="button"><i class="fa-solid fa-list-check"></i></button>`;

            const filaCombo = `
                <tr data-codigo="${codigo}" class="align-middle">
                    <td class="text-center align-middle"><input type="radio" class="form-check-input combo-row-radio" name="comboRadioSel"></td>
                    <td class="table-sticky-col" style="background-color: #f8f9fa;">
                        <span class="text-nowrap"><span class="fw-bold">${codigo}</span> - ${nombre}</span>
                    </td>
                    <td class="text-end">${modalCosto}</td>
                    <td class="text-end">${modalStock}</td>
                    <td class="text-end">${modalStockTienda}</td>
                    <td class="text-end">${modalOptimo}</td>
                    <td class="text-end">${modalExcU}</td>
                    <td class="text-end">${modalExcS}</td>
                    <td class="celda-editable"><input type="number" class="form-control form-control-sm text-end val-unidades-combo" placeholder="0" value="${modalUnidades}"></td>
                    <td class="celda-editable"><input type="number" class="form-control form-control-sm text-end val-proyeccion-combo" placeholder="0" value="${modalProyeccion}"></td>
                    <td class="celda-editable">
                        <div class="input-group input-group-sm" style="min-width:140px;">
                            ${btnMPHtml}
                            <select class="form-select select-mediopago-combo-final">
                                ${$("#filtroMedioPagoGeneral").html()}
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
                    <td class="text-center celda-editable"><input class="form-check-input" type="checkbox" disabled ${modalRegalo ? "checked" : ""}></td>
                </tr>
            `;

            $("#tablaCombosBody").append(filaCombo);

            const $filaInsertada = $(`#tablaCombosBody tr[data-codigo="${codigo}"]`);
            $filaInsertada.data("combo-nombre", nombre);
            $filaInsertada.data("combo-articulos", articulosCombo);

            const $filaSelect = $filaInsertada.find(".select-mediopago-combo-final");
            $filaSelect.val(modalMedioPago);
            if (modalMedioPago === "7" && modalMedioPagoSel) {
                $filaSelect.data("seleccionados", modalMedioPagoSel);
            }

            // Cierre limpio del modal
            const modalCombo = bootstrap.Modal.getInstance(document.getElementById('modalCrearCombo'));
            if (modalCombo) {
                modalCombo.hide();
            } else {
                $("#modalCrearCombo").modal("hide");
            }

            // Limpiar backdrops después de cerrar (usa el helper global)
            setTimeout(() => {
                window.limpiarBackdropsHuerfanos && window.limpiarBackdropsHuerfanos();
            }, 300);

            limpiarModalCombo();
            comboEnEdicion = null;

            if ($("#tablaCombosBody tr").length === 1) {
                $("#tablaCombosBody .combo-row-radio").first().prop("checked", true).trigger("change");
            }

            Swal.fire({ toast: true, position: "top-end", icon: "success", title: `Combo "${nombre}" agregado.`, showConfirmButton: false, timer: 2000 });
        });

        $("#btnEliminarCombo").off("click").on("click", function () {
            const $radioSeleccionado = $("#tablaCombosBody .combo-row-radio:checked");
            if ($radioSeleccionado.length === 0) { Swal.fire({ icon: "warning", title: "Atención", text: "Debe seleccionar un combo." }); return; }

            const $fila = $radioSeleccionado.closest("tr");
            Swal.fire({
                title: "¿Está seguro?", text: "Se eliminará el combo seleccionado.", icon: "warning", showCancelButton: true, confirmButtonColor: "#d33", confirmButtonText: "Sí, Eliminar"
            }).then((result) => {
                if (result.isConfirmed) {
                    $fila.remove();
                    Swal.fire({ toast: true, position: "top-end", icon: "success", title: "Combo eliminado", showConfirmButton: false, timer: 1500 });
                }
            });
        });

        $("#btnModificarCombo").off("click").on("click", function () {
            const $radioSeleccionado = $("#tablaCombosBody .combo-row-radio:checked");
            if ($radioSeleccionado.length === 0) { Swal.fire({ icon: "warning", title: "Atención", text: "Debe seleccionar un combo del detalle para modificar." }); return; }

            const $fila = $radioSeleccionado.closest("tr");
            const codigoCombo = $fila.data("codigo");
            const nombreCombo = $fila.data("combo-nombre") || "";
            const articulosGuardados = $fila.data("combo-articulos") || [];

            const unidadesCombo = $fila.find(".val-unidades-combo").val();
            const proyeccionCombo = $fila.find(".val-proyeccion-combo").val();
            const medioPagoCombo = $fila.find(".select-mediopago-combo-final").val();
            const seleccionadosMP = $fila.find(".select-mediopago-combo-final").data("seleccionados");
            const regaloCombo = $fila.find("td:last-child input[type='checkbox']").is(":checked");

            limpiarModalCombo();
            comboEnEdicion = codigoCombo;

            $("#nombreComboModal").val(nombreCombo);
            $("#btnHeaderComboTotal").text(`[${codigoCombo}] ${nombreCombo}`);

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

            articulosGuardados.forEach(art => agregarColumnaACombo(art));
        });

        $(document).off("input change", "#tablaCreacionCombo tbody tr[data-campo='unidades_limite'] td:eq(1) input, #tablaCreacionCombo tbody tr[data-campo='proyeccion_vta'] td:eq(1) input").on("input change", "#tablaCreacionCombo tbody tr[data-campo='unidades_limite'] td:eq(1) input, #tablaCreacionCombo tbody tr[data-campo='proyeccion_vta'] td:eq(1) input", function () {
            const numCols = $("#trHeadersCombo th").length;
            for (let i = 2; i < numCols; i++) { recalcularColumnaCombo(i); }
            recalcularTotalesCombo();
        });

        $(document).off("change", ".combo-row-radio").on("change", ".combo-row-radio", function () {
            $("#tablaCombosBody tr").removeClass("table-active");
            $("#tablaCombosBody .celda-editable input, #tablaCombosBody .celda-editable button, #tablaCombosBody .celda-editable select").prop("disabled", true);
            $("#tablaCombosBody td:last-child input[type='checkbox']").prop("disabled", true).css("pointer-events", "none");

            const $fila = $(this).closest("tr");
            $fila.addClass("table-active");
            $fila.find(".celda-editable input, .celda-editable button, .celda-editable select").prop("disabled", false);
            $fila.find("td:last-child input[type='checkbox']").prop("disabled", false).css("pointer-events", "auto");
        });

        // -------------------------------------------------------------
        // EVENTOS PARA BOTONES DE ACCIÓN POR ARTÍCULO EN COMBO
        // -------------------------------------------------------------

        $(document).off("click", ".btn-equivalentes-combo").on("click", ".btn-equivalentes-combo", function (e) {
            e.preventDefault();
            consultarServicioAdicional("api/Promocion/consultar-articulo-equivalente", $(this).data("codigo"), function (data) {
                const $tbody = $("#tbodyEquivalentes");
                $tbody.empty();
                if (!data.length) {
                    $tbody.html('<tr><td colspan="14" class="text-center text-muted">No existen equivalentes para este artículo.</td></tr>');
                } else {
                    data.forEach(item => {
                        $tbody.append(`<tr>
                            <td>${item.codigo || ''} - ${item.descripcion || ''}</td>
                            <td class="text-end">${formatCurrencySpanish(item.costo)}</td>
                            <td class="text-center">${item.stock_bodega || 0}</td>
                            <td class="text-center">${item.stock_tiendas || 0}</td>
                            <td class="text-center">${item.inventario_optimo || 0}</td>
                            <td class="text-center">${item.excedentes_unidades || 0}</td>
                            <td class="text-end">${formatCurrencySpanish(item.excedentes_dolares)}</td>
                            <td class="text-center">${item.dias_antiguedad || 0}</td> 
                            <td class="text-center">${item.m0_unidades || 0}</td>
                            <td class="text-end">${formatCurrencySpanish(item.m0_dolares)}</td>
                            <td class="text-center">${item.m1_unidades || 0}</td>
                            <td class="text-end">${formatCurrencySpanish(item.m1_dolares)}</td>
                            <td class="text-center">${item.m2_unidades || 0}</td>
                            <td class="text-end">${formatCurrencySpanish(item.m2_dolares)}</td>
                        </tr>`);
                    });
                }
                $("#modalEquivalentes").modal("show");
            });
        });

        $(document).off("click", ".btn-competencia-combo").on("click", ".btn-competencia-combo", function (e) {
            e.preventDefault();
            consultarServicioAdicional("api/Promocion/consultar-articulo-precio-competencia", $(this).data("codigo"), function (data) {
                const $tbody = $("#tbodyPreciosCompetencia");
                $tbody.empty();
                if (!data.length) {
                    $tbody.html('<tr><td colspan="2" class="text-center text-muted">No hay precios de competencia registrados.</td></tr>');
                } else {
                    data.forEach(item => {
                        $tbody.append(`<tr>
                            <td>${item.nombre_competencia || ''}</td>
                            <td class="text-end">${formatCurrencySpanish(item.precio_contado)}</td>
                        </tr>`);
                    });
                }
                $("#modalPreciosCompetencia").modal("show");
            });
        });

        let colIndexCostosActual = null;
        $(document).off("click", ".btn-otros-costos-combo").on("click", ".btn-otros-costos-combo", function (e) {
            e.preventDefault();
            colIndexCostosActual = $(this).closest("th").index();
            consultarServicioAdicional("api/Promocion/consultar-otros-costos", $(this).data("codigo"), function (data) {
                const $tbody = $("#tbodyOtrosCostos");
                $tbody.empty();
                if (!data.length) {
                    $tbody.html('<tr><td colspan="3" class="text-center text-muted">No hay otros costos aplicables.</td></tr>');
                } else {
                    data.forEach(item => {
                        $tbody.append(`<tr>
                            <td class="text-center align-middle">
                                <input class="form-check-input chk-otro-costo-combo" type="checkbox" data-codigo="${item.codigo}" data-nombre="${item.nombre}" data-valor="${item.valor}">
                            </td>
                            <td class="align-middle">${item.nombre || ''}</td>
                            <td class="text-end align-middle">${formatCurrencySpanish(item.valor)}</td>
                        </tr>`);
                    });
                }
                $("#btnAplicarOtrosCostos").addClass("d-none");
                if ($("#btnAplicarOtrosCostosCombo").length === 0) {
                    $("#btnAplicarOtrosCostos").after('<button type="button" class="btn btn-primary" id="btnAplicarOtrosCostosCombo">Aplicar</button>');
                } else {
                    $("#btnAplicarOtrosCostosCombo").removeClass("d-none");
                }
                $("#modalOtrosCostos").modal("show");
            });
        });

        $(document).off("click", "#btnAplicarOtrosCostosCombo").on("click", "#btnAplicarOtrosCostosCombo", function () {
            let totalOtrosCostos = 0, seleccionados = [];
            $("#tbodyOtrosCostos .chk-otro-costo-combo:checked").each(function () {
                const valor = parseFloat($(this).data("valor")) || 0;
                totalOtrosCostos += valor;
                seleccionados.push({ codigo: $(this).data("codigo"), nombre: $(this).data("nombre"), valor: valor });
            });

            if (colIndexCostosActual !== null) {
                const $th = $(`#trHeadersCombo th:eq(${colIndexCostosActual})`);
                $th.data("total-otros-costos", totalOtrosCostos);
                $th.data("detalle-otros-costos", seleccionados);
                recalcularColumnaCombo(colIndexCostosActual);
            }
            $("#modalOtrosCostos").modal("hide");
            if (totalOtrosCostos > 0) Swal.fire({ toast: true, position: "top-end", icon: "success", title: `Costos aplicados: ${formatCurrencySpanish(totalOtrosCostos)}`, showConfirmButton: false, timer: 2000 });
        });

        // -------------------------------------------------------------
        // MEDIO DE PAGO COMBO CON BOTON VERDE Y TEXTO
        // -------------------------------------------------------------
        let selectMedioPagoComboFinalActual = null;
        let btnMedioPagoComboFinalActual = null;

        // 1. Manejo del Select normal (cuando el usuario CAMBIA el dropdown)
        $(document).off("change.comboMedioPago", ".select-mediopago-combo, .select-mediopago-combo-final").on("change.comboMedioPago", ".select-mediopago-combo, .select-mediopago-combo-final", function (event) {
            const $select = $(this);
            const val = $select.val();
            const $btn = $select.siblings("button");

            if (val === "7") {
                selectMedioPagoComboFinalActual = $select;
                btnMedioPagoComboFinalActual = $btn;

                if ($btn.length) $btn.removeClass("d-none");

                const guardados = $select.data("seleccionados") || [];
                $("#bodyModalMedioPago input[type='checkbox']").prop("checked", false);
                guardados.forEach(v => $(`#bodyModalMedioPago input[value='${v}']`).prop("checked", true));

                $("#btnAceptarMedioPago").off("click.combo click.articulo");

                $("#btnAceptarMedioPago").on("click.combo", function (ev) {
                    ev.preventDefault();
                    ev.stopPropagation();

                    if (selectMedioPagoComboFinalActual) {
                        const seleccionados = [];
                        $("#bodyModalMedioPago input[type='checkbox']:checked").each(function () {
                            seleccionados.push($(this).val());
                        });

                        selectMedioPagoComboFinalActual.data("seleccionados", seleccionados);

                        if (seleccionados.length === 0) {
                            selectMedioPagoComboFinalActual.val("");
                            if (btnMedioPagoComboFinalActual && btnMedioPagoComboFinalActual.length) {
                                btnMedioPagoComboFinalActual.addClass("d-none").removeClass("btn-success").addClass("btn-outline-secondary").html(`<i class="fa-solid fa-list-check"></i>`);
                            }
                        } else {
                            if (btnMedioPagoComboFinalActual && btnMedioPagoComboFinalActual.length) {
                                btnMedioPagoComboFinalActual.removeClass("btn-outline-secondary").addClass("btn-success").html(`<i class="fa-solid fa-list-check"></i> (${seleccionados.length})`);
                            }
                        }
                        selectMedioPagoComboFinalActual = null;
                        btnMedioPagoComboFinalActual = null;
                    }

                    // Cerrar SOLO el modal de Medio de Pago
                    const modalMPInstance = bootstrap.Modal.getInstance(document.getElementById('ModalMedioPago'));
                    if (modalMPInstance) {
                        modalMPInstance.hide();
                    }
                });

                // ====== APERTURA SEGURA ======
                const $modal = $("#ModalMedioPago");

                if ($modal.hasClass("show")) {
                    const inst = bootstrap.Modal.getInstance($modal[0]);
                    if (inst) inst.hide();
                }

                setTimeout(function () {
                    const $modalesAbiertos = $('.modal.show');
                    const $backdropsActuales = $('.modal-backdrop');

                    if ($backdropsActuales.length > $modalesAbiertos.length) {
                        $backdropsActuales.slice($modalesAbiertos.length).remove();
                    }

                    let modalInstance = bootstrap.Modal.getInstance($modal[0]);
                    if (!modalInstance) {
                        modalInstance = new bootstrap.Modal($modal[0], {
                            backdrop: true,
                            keyboard: true
                        });
                    }
                    modalInstance.show();
                }, 50);
            } else {
                $select.removeData("seleccionados");
                if ($btn.length) {
                    $btn.addClass("d-none").removeClass("btn-success").addClass("btn-outline-secondary").html(`<i class="fa-solid fa-list-check"></i>`);
                }
            }
        });

        // 2. Manejo cuando hacen Clic en el BOTÓN VERDE (Para editar Medios de Pago ya seleccionados)
        // 2. Manejo cuando hacen Clic en el BOTÓN VERDE (Para editar Medios de Pago ya seleccionados)
        $(document).off("click.editarMpCombo", ".btn-editar-mp-combo").on("click.editarMpCombo", ".btn-editar-mp-combo", function (e) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();

            const $btn = $(this);
            const $select = $btn.siblings(".select-mediopago-combo-final");

            // Guardar referencias
            selectMedioPagoComboFinalActual = $select;
            btnMedioPagoComboFinalActual = $btn;

            // Pre-marcar los checkboxes
            const guardados = $select.data("seleccionados") || [];
            $("#bodyModalMedioPago input[type='checkbox']").prop("checked", false);
            guardados.forEach(v => $(`#bodyModalMedioPago input[value='${v}']`).prop("checked", true));

            // Limpiar handlers previos del botón Aceptar
            $("#btnAceptarMedioPago").off("click.combo click.articulo");

            // Re-vincular handler para combo-final
            $("#btnAceptarMedioPago").on("click.combo", function (ev) {
                ev.preventDefault();
                ev.stopPropagation();

                if (selectMedioPagoComboFinalActual) {
                    const seleccionados = [];
                    $("#bodyModalMedioPago input[type='checkbox']:checked").each(function () {
                        seleccionados.push($(this).val());
                    });
                    selectMedioPagoComboFinalActual.data("seleccionados", seleccionados);

                    if (seleccionados.length === 0) {
                        selectMedioPagoComboFinalActual.val("");
                        btnMedioPagoComboFinalActual.addClass("d-none").removeClass("btn-success").addClass("btn-outline-secondary").html(`<i class="fa-solid fa-list-check"></i>`);
                    } else {
                        btnMedioPagoComboFinalActual.removeClass("btn-outline-secondary").addClass("btn-success").html(`<i class="fa-solid fa-list-check"></i> (${seleccionados.length})`);
                    }
                    selectMedioPagoComboFinalActual = null;
                    btnMedioPagoComboFinalActual = null;
                }

                // Cerrar SOLO el modal de Medio de Pago (no tocar el padre)
                const modalMPInstance = bootstrap.Modal.getInstance(document.getElementById('ModalMedioPago'));
                if (modalMPInstance) {
                    modalMPInstance.hide();
                }
            });

            // ====== APERTURA SEGURA CON DETECCIÓN DE MODAL PADRE ======
            const $modal = $("#ModalMedioPago");

            // Si por alguna razón este modal ya está visible, cerrarlo primero
            if ($modal.hasClass("show")) {
                const inst = bootstrap.Modal.getInstance($modal[0]);
                if (inst) inst.hide();
            }

            setTimeout(function () {
                const $modalesAbiertos = $('.modal.show');
                const $backdropsActuales = $('.modal-backdrop');

                if ($backdropsActuales.length > $modalesAbiertos.length) {
                    $backdropsActuales.slice($modalesAbiertos.length).remove();
                }

                // FORZAR z-index ALTO antes de mostrar
                const cantidadAbiertos = $modalesAbiertos.length;
                const zIndexHijo = 1050 + (10 * (cantidadAbiertos + 1));
                $modal.css('z-index', zIndexHijo);

                let modalInstance = bootstrap.Modal.getInstance($modal[0]);
                if (!modalInstance) {
                    modalInstance = new bootstrap.Modal($modal[0], {
                        backdrop: true,
                        keyboard: true
                    });
                }
                modalInstance.show();

                // Ajustar backdrop después de mostrar
                setTimeout(function () {
                    const $backdropsTras = $('.modal-backdrop');
                    if ($backdropsTras.length > 0) {
                        $backdropsTras.last().css('z-index', zIndexHijo - 1);
                    }
                }, 100);
            }, 50);
        });

        // -------------------------------------------------------------
        // BUSCADOR DE ACUERDOS COMBO
        // -------------------------------------------------------------
        $(document).off("click", ".btn-buscar-acuerdo-combo").on("click", ".btn-buscar-acuerdo-combo", function () {
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

        $("#btnAceptarAcuerdoArticulo").on("click", function (e) {
            if (acuerdoArticuloContexto && acuerdoArticuloContexto.esCombo) {
                e.stopImmediatePropagation();
                if (!acuerdoArticuloTemporal) { Swal.fire({ icon: "info", title: "Atención", text: "Debe seleccionar un acuerdo." }); return; }

                const tipo = acuerdoArticuloContexto.tipoFondo;
                const slot = acuerdoArticuloContexto.slot;
                const colIdx = acuerdoArticuloContexto.colIndex;
                const idSeleccionado = String(acuerdoArticuloTemporal.idAcuerdo);
                const getVal = (c) => $(`#tablaCreacionCombo tbody tr[data-campo='${c}'] td[data-colindex='${colIdx}'] input.acuerdo-id-hidden`).val();

                if (tipo === "TFPROVEDOR" && (slot === 1 ? getVal("aporte_prov2_id") : getVal("aporte_prov_id")) === idSeleccionado) { Swal.fire({ icon: "warning", title: "Duplicado" }); return; }
                if (tipo === "TFPROPIO" && (slot === 1 ? getVal("aporte_propio2_id") : getVal("aporte_propio_id")) === idSeleccionado) { Swal.fire({ icon: "warning", title: "Duplicado" }); return; }

                acuerdoArticuloContexto.$inputDisplay.val(acuerdoArticuloTemporal.display);
                acuerdoArticuloContexto.$inputId.val(acuerdoArticuloTemporal.idAcuerdo);

                const maxVal = acuerdoArticuloTemporal.valorAcuerdo || 0;
                const setInputAporte = (c) => $(`#tablaCreacionCombo tbody tr[data-campo='${c}'] td[data-colindex='${colIdx}'] input.aporte-valor`).prop("disabled", false).attr("data-max", maxVal).val("");

                if (tipo === "TFPROVEDOR") setInputAporte(slot === 1 ? "aporte_prov" : "aporte_prov2");
                else if (tipo === "TFREBATE") setInputAporte("aporte_rebate");
                else if (tipo === "TFPROPIO") setInputAporte(slot === 1 ? "aporte_propio" : "aporte_propio2");

                recalcularColumnaCombo(colIdx);
                recalcularTotalesCombo();
                $("#modalAcuerdoArticulo").modal("hide");
                acuerdoArticuloTemporal = null;
                acuerdoArticuloContexto = null;
            }
        });

        $(document).off("input change", "#tablaCreacionCombo tbody input.input-combo-art").on("input change", "#tablaCreacionCombo tbody input.input-combo-art", function () {
            this.value = this.value.replace(/[^0-9.,]/g, '');
            recalcularColumnaCombo($(this).closest("td").data("colindex"));
            recalcularTotalesCombo();
        });

        $("#btnNuevoCombo").html('<i class="fa-regular fa-file"></i> Nuevo Combo');
    }

    // ==========================================
    // LÓGICA DE TABLA TRANSPUESTA DE COMBOS (MODAL) Y EVENTOS
    // ==========================================

    window.contextoModalItems = "ARTICULOS";

    $(document).on("click", ".btn-add-articulo-combo", function () {
        window.contextoModalItems = "COMBOS";
    });

    $(document).on("click", "#btnAddItemArticulos", function () {
        window.contextoModalItems = "ARTICULOS";
    });

    $(document).on("click", "#btnActualizarHeaderCombo", function () {
        const nom = $("#nombreComboModal").val().trim();
        if (nom) {
            // Si estamos editando, mostramos el código actual, si es nuevo, solo el nombre
            const prefijo = comboEnEdicion ? `[${comboEnEdicion}] ` : "";
            $("#btnHeaderComboTotal").text(`${prefijo}${nom}`);
        } else {
            Swal.fire("Atención", "Ingrese un nombre para el combo", "warning");
        }
    });

    // ==========================================
    // RECALCULAR TOTALES DEL COMBO (COLUMNA PRINCIPAL)
    // ==========================================
    function recalcularTotalesCombo() {
        const camposNum = ["stock_bodega", "stock_tienda", "inv_optimo", "excedentes_u", "m0_u", "m1_u", "m2_u", "m12_u"];

        // Agregamos los Descuentos y Promociones para que se sumen solitos en la columna del Combo
        const camposMoneda = [
            "costo", "excedentes_usd", "m0_usd", "m1_usd", "m2_usd", "m12_usd",
            "precio_lista_contado", "precio_lista_credito",
            "promo_contado", "promo_tc", "promo_credito",
            "dscto_contado", "dscto_tc", "dscto_credito",
            "aporte_prov", "aporte_prov2", "aporte_rebate", "aporte_propio", "aporte_propio2"
        ];

        const setComboVal = (campo, val) => $(`#tablaCreacionCombo tbody tr[data-campo='${campo}'] td:eq(1) input`).val(val);
        const getComboVal = (campo) => parseCurrency($(`#tablaCreacionCombo tbody tr[data-campo='${campo}'] td:eq(1) input`).val());

        // 1. Sumar campos numéricos
        camposNum.forEach(campo => {
            let suma = 0;
            $(`#tablaCreacionCombo tbody tr[data-campo='${campo}'] td:gt(1) input`).each(function () {
                suma += parseInt($(this).val().replace(/[^0-9-]/g, '')) || 0;
            });
            setComboVal(campo, suma);
        });

        // 2. Sumar campos de moneda
        camposMoneda.forEach(campo => {
            let suma = 0;
            $(`#tablaCreacionCombo tbody tr[data-campo='${campo}'] td:gt(1) input`).each(function () {
                suma += parseCurrency($(this).val());
            });
            setComboVal(campo, formatCurrencySpanish(suma));
        });

        // 3. VACIAR Valores Comprometidos del Combo (para que no se vea nada)
        const camposComprometidos = ["comp_proveedor", "comp_proveedor2", "comp_rebate", "comp_propio", "comp_propio2"];
        camposComprometidos.forEach(campo => setComboVal(campo, ""));

        // 4. Calcular MÁRGENES globales del Combo usando las sumas
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

    function agregarColumnaACombo(item) {
        const formatVal = (val) => (val !== undefined && val !== null && val !== '') ? formatCurrencySpanish(val) : '';

        const thHtml = `
        <th scope="col" class="table-dark">
            <div class="dropdown">
                <button class="btn btn-dark dropdown-toggle btn-sm border-0 w-100 header-combo-btn" type="button" data-bs-toggle="dropdown" title="${item.codigo} - ${item.descripcion}">
                    <span class="header-combo-content">
                        <span class="header-combo-codigo">${item.codigo}</span>
                        <span class="header-combo-desc">${item.descripcion}</span>
                    </span>
                </button>
                <ul class="dropdown-menu">
                    <li><a class="dropdown-item btn-add-articulo-combo" href="#" data-bs-toggle="modal" data-bs-target="#modalConsultaItems"><i class="fa-solid fa-plus"></i> Añadir Artículo</a></li>
                    <li><a class="dropdown-item btn-equivalentes-combo" href="#" data-codigo="${item.codigo}"><i class="fa-solid fa-arrows-left-right"></i> Equivalentes</a></li>
                    <li><a class="dropdown-item btn-competencia-combo" href="#" data-codigo="${item.codigo}"><i class="fa-solid fa-tags"></i> Precios Competencia</a></li>
                    <li><a class="dropdown-item btn-otros-costos-combo" href="#" data-codigo="${item.codigo}"><i class="fa-solid fa-coins"></i> Otros Costos</a></li>
                    <li><hr class="dropdown-divider"></li>
                    <li><a class="dropdown-item text-danger btn-eliminar-col-combo" href="#"><i class="fa-solid fa-trash"></i> Eliminar Artículo</a></li>
                </ul>
            </div>
        </th>`;
        $("#trHeadersCombo").append(thHtml);

        const colIndex = $("#trHeadersCombo th").length - 1;

        if (item.otrosCostos && item.otrosCostos.length > 0) {
            $(`#trHeadersCombo th:eq(${colIndex})`).data("detalle-otros-costos", item.otrosCostos);
            $(`#trHeadersCombo th:eq(${colIndex})`).data("total-otros-costos", item.totalOtrosCostos || 0);
        }

        $("#tablaCreacionCombo tbody tr").each(function () {
            const campo = $(this).data("campo");
            let html = `<td class="align-middle" data-colindex="${colIndex}">`;

            switch (campo) {
                case "art_codigo":
                    html += `<input type="hidden" class="art-codigo-hidden" value="${item.codigo}"><input type="text" class="form-control form-control-sm custom-celda-bg text-end" readonly value="${item.codigo}">`; break;
                case "art_descripcion":
                    html += `<input type="text" class="form-control form-control-sm custom-celda-bg" readonly value="${item.descripcion}">`; break;
                case "costo":
                    html += `<input type="text" class="form-control form-control-sm custom-celda-bg text-end val-costo" readonly value="${formatCurrencySpanish(item.costo)}">`; break;
                case "stock_bodega":
                    html += `<input type="text" class="form-control form-control-sm custom-celda-bg text-end val-stock" readonly value="${item.stock || 0}">`; break;
                case "stock_tienda":
                    html += `<input type="text" class="form-control form-control-sm custom-celda-bg text-end val-stock-tienda" readonly value="${item.stockTienda || 0}">`; break;
                case "inv_optimo":
                    html += `<input type="text" class="form-control form-control-sm custom-celda-bg text-end val-optimo" readonly value="${item.optimo || 0}">`; break;
                case "excedentes_u":
                    html += `<input type="text" class="form-control form-control-sm custom-celda-bg text-end val-excedenteu" readonly value="${item.excedenteu || 0}">`; break;
                case "excedentes_usd":
                    html += `<input type="text" class="form-control form-control-sm custom-celda-bg text-end val-excedentes" readonly value="${formatCurrencySpanish(item.excedentes || 0)}">`; break;
                case "m0_u":
                    html += `<input type="text" class="form-control form-control-sm custom-celda-bg text-end val-m0u" readonly value="${item.m0u || 0}">`; break;
                case "m0_usd":
                    html += `<input type="text" class="form-control form-control-sm custom-celda-bg text-end val-m0s" readonly value="${formatCurrencySpanish(item.m0s || 0)}">`; break;
                case "m1_u":
                    html += `<input type="text" class="form-control form-control-sm custom-celda-bg text-end val-m1u" readonly value="${item.m1u || 0}">`; break;
                case "m1_usd":
                    html += `<input type="text" class="form-control form-control-sm custom-celda-bg text-end val-m1s" readonly value="${formatCurrencySpanish(item.m1s || 0)}">`; break;
                case "m2_u":
                    html += `<input type="text" class="form-control form-control-sm custom-celda-bg text-end val-m2u" readonly value="${item.m2u || 0}">`; break;
                case "m2_usd":
                    html += `<input type="text" class="form-control form-control-sm custom-celda-bg text-end val-m2s" readonly value="${formatCurrencySpanish(item.m2s || 0)}">`; break;
                case "m12_u":
                    html += `<input type="text" class="form-control form-control-sm custom-celda-bg text-end val-m12u" readonly value="${item.m12u || 0}">`; break;
                case "m12_usd":
                    html += `<input type="text" class="form-control form-control-sm custom-celda-bg text-end val-m12s" readonly value="${formatCurrencySpanish(item.m12s || 0)}">`; break;
                case "igualar_precio":
                    html += `<input type="text" class="form-control form-control-sm custom-celda-bg text-end val-igualar-precio" readonly value="0">`; break;
                case "dias_antiguedad":
                    html += `<input type="text" class="form-control form-control-sm custom-celda-bg text-end val-dias-antiguedad" readonly value="${item.diasantiguedad || 0}">`; break;
                case "margen_min_cont":
                    html += `<input type="text" class="form-control form-control-sm custom-celda-bg text-end val-margen-min" readonly value="${item.margenmincontado || 0}%">`; break;
                case "margen_min_tc":
                    html += `<input type="text" class="form-control form-control-sm custom-celda-bg text-end val-margen-min" readonly value="${item.margenmintc || 0}%">`; break;
                case "margen_min_cred":
                    html += `<input type="text" class="form-control form-control-sm custom-celda-bg text-end val-margen-min" readonly value="${item.margenmincredito || 0}%">`; break;
                case "margen_min_igual":
                    html += `<input type="text" class="form-control form-control-sm custom-celda-bg text-end val-margen-min" readonly value="${item.margenminigualar || 0}%">`; break;

                // Bloqueados
                case "unidades_limite":
                case "proyeccion_vta":
                    html += `<input type="text" class="form-control form-control-sm text-end custom-celda-bg" disabled placeholder="-">`; break;
                case "medio_pago":
                    html += `<select class="form-select form-select-sm custom-celda-bg" disabled><option value="">-</option></select>`; break;
                case "regalo":
                    html += `<div class="d-flex justify-content-center text-muted">-</div>`; break;

                case "precio_lista_contado":
                    html += `<input type="text" class="form-control form-control-sm custom-celda-bg text-end val-precio-lista" readonly value="${formatCurrencySpanish(item.preciolistacontado || 0)}">`; break;
                case "precio_lista_credito":
                    html += `<input type="text" class="form-control form-control-sm custom-celda-bg text-end val-precio-lista" readonly value="${formatCurrencySpanish(item.preciolistacredito || 0)}">`; break;
                case "promo_contado":
                    html += `<input type="text" class="form-control form-control-sm text-end input-combo-art val-precio-promo val-promo-contado" placeholder="$ 0.00" value="${formatVal(item.promoContado)}">`; break;
                case "promo_tc":
                    html += `<input type="text" class="form-control form-control-sm text-end input-combo-art val-precio-promo val-promo-tc" placeholder="$ 0.00" value="${formatVal(item.promoTC)}">`; break;
                case "promo_credito":
                    html += `<input type="text" class="form-control form-control-sm text-end input-combo-art val-precio-promo val-promo-credito" placeholder="$ 0.00" value="${formatVal(item.promoCredito)}">`; break;
                case "dscto_contado":
                case "dscto_tc":
                case "dscto_credito":
                    html += `<input type="text" class="form-control form-control-sm custom-celda-bg text-end val-dscto" readonly placeholder="0.00">`; break;

                case "aporte_prov":
                    html += `<input type="text" class="form-control form-control-sm text-end input-combo-art aporte-valor aporte-proveedor-combo" placeholder="$ 0.00" value="${formatVal(item.aporteProveedor)}" ${item.idAcuerdoProveedor ? '' : 'disabled'}>`; break;
                case "aporte_prov2":
                    html += `<input type="text" class="form-control form-control-sm text-end input-combo-art aporte-valor aporte-proveedor2-combo" placeholder="$ 0.00" value="${formatVal(item.aporteProveedor2)}" ${item.idAcuerdoProveedor2 ? '' : 'disabled'}>`; break;
                case "aporte_rebate":
                    html += `<input type="text" class="form-control form-control-sm text-end input-combo-art aporte-valor aporte-rebate-combo" placeholder="$ 0.00" value="${formatVal(item.aporteRebate)}" ${item.idAcuerdoRebate ? '' : 'disabled'}>`; break;
                case "aporte_propio":
                    html += `<input type="text" class="form-control form-control-sm text-end input-combo-art aporte-valor aporte-propio-combo" placeholder="$ 0.00" value="${formatVal(item.aportePropio)}" ${item.idAcuerdoPropio ? '' : 'disabled'}>`; break;
                case "aporte_propio2":
                    html += `<input type="text" class="form-control form-control-sm text-end input-combo-art aporte-valor aporte-propio2-combo" placeholder="$ 0.00" value="${formatVal(item.aportePropio2)}" ${item.idAcuerdoPropio2 ? '' : 'disabled'}>`; break;
                case "aporte_prov_id":
                    html += `
                    <input type="hidden" class="acuerdo-id-hidden acuerdo-prov1-hidden" value="${item.idAcuerdoProveedor || ''}">
                    <div class="input-group input-group-sm">
                        <input type="text" class="form-control text-end" placeholder="Seleccione..." readonly value="${item.displayAcuerdoProveedor || item.idAcuerdoProveedor || ''}">
                        <button class="btn btn-outline-secondary btn-buscar-acuerdo-combo" type="button" data-tipofondo="TFPROVEDOR" data-slot="1"><i class="fa-solid fa-magnifying-glass"></i></button>
                    </div>`; break;
                case "aporte_prov2_id":
                    html += `
                    <input type="hidden" class="acuerdo-id-hidden acuerdo-prov2-hidden" value="${item.idAcuerdoProveedor2 || ''}">
                    <div class="input-group input-group-sm">
                        <input type="text" class="form-control text-end" placeholder="Seleccione..." readonly value="${item.displayAcuerdoProveedor2 || item.idAcuerdoProveedor2 || ''}">
                        <button class="btn btn-outline-secondary btn-buscar-acuerdo-combo" type="button" data-tipofondo="TFPROVEDOR" data-slot="2"><i class="fa-solid fa-magnifying-glass"></i></button>
                    </div>`; break;
                case "aporte_rebate_id":
                    html += `
                    <input type="hidden" class="acuerdo-id-hidden acuerdo-rebate-hidden" value="${item.idAcuerdoRebate || ''}">
                    <div class="input-group input-group-sm">
                        <input type="text" class="form-control text-end" placeholder="Seleccione..." readonly value="${item.displayAcuerdoRebate || item.idAcuerdoRebate || ''}">
                        <button class="btn btn-outline-secondary btn-buscar-acuerdo-combo" type="button" data-tipofondo="TFREBATE" data-slot="1"><i class="fa-solid fa-magnifying-glass"></i></button>
                    </div>`; break;
                case "aporte_propio_id":
                    html += `
                    <input type="hidden" class="acuerdo-id-hidden acuerdo-propio1-hidden" value="${item.idAcuerdoPropio || ''}">
                    <div class="input-group input-group-sm">
                        <input type="text" class="form-control text-end" placeholder="Seleccione..." readonly value="${item.displayAcuerdoPropio || item.idAcuerdoPropio || ''}">
                        <button class="btn btn-outline-secondary btn-buscar-acuerdo-combo" type="button" data-tipofondo="TFPROPIO" data-slot="1"><i class="fa-solid fa-magnifying-glass"></i></button>
                    </div>`; break;
                case "aporte_propio2_id":
                    html += `
                    <input type="hidden" class="acuerdo-id-hidden acuerdo-propio2-hidden" value="${item.idAcuerdoPropio2 || ''}">
                    <div class="input-group input-group-sm">
                        <input type="text" class="form-control text-end" placeholder="Seleccione..." readonly value="${item.displayAcuerdoPropio2 || item.idAcuerdoPropio2 || ''}">
                        <button class="btn btn-outline-secondary btn-buscar-acuerdo-combo" type="button" data-tipofondo="TFPROPIO" data-slot="2"><i class="fa-solid fa-magnifying-glass"></i></button>
                    </div>`; break;
                case "margen_pl_contado":
                case "margen_pl_credito":
                case "margen_promo_contado":
                case "margen_promo_tc":
                case "margen_promo_cred":
                    html += `<input type="text" class="form-control form-control-sm custom-celda-bg text-end val-margen" readonly placeholder="0.00%">`; break;
                case "comp_proveedor":
                case "comp_proveedor2":
                case "comp_rebate":
                case "comp_propio":
                case "comp_propio2":
                    html += `<input type="text" class="form-control form-control-sm text-end custom-celda-bg val-comp" readonly placeholder="$ 0.00">`; break;
                default:
                    html += `<input type="text" class="form-control form-control-sm custom-celda-bg text-end" readonly>`; break;
            }

            html += `</td>`;
            $(this).append(html);
        });

        recalcularColumnaCombo(colIndex);
        recalcularTotalesCombo();
    }

    // 5. Eliminar una columna dinámica del Combo
    $(document).on("click", ".btn-eliminar-col-combo", function (e) {
        e.preventDefault();
        const colIndex = $(this).closest("th").index();

        Swal.fire({
            title: "¿Eliminar artículo del combo?",
            icon: "warning", showCancelButton: true, confirmButtonText: "Sí, eliminar", cancelButtonText: "Cancelar"
        }).then((res) => {
            if (res.isConfirmed) {
                $(`#trHeadersCombo th:eq(${colIndex})`).remove();
                $("#tablaCreacionCombo tbody tr").each(function () {
                    $(this).find(`td:eq(${colIndex})`).remove();
                });

                // <--- AGREGA ESTA LÍNEA AQUÍ
                recalcularTotalesCombo();
            }
        });
    });

    // ==========================================
    // ENRUTAR ITEMS SELECCIONADOS A LA TABLA CORRECTA
    // ==========================================
    $(document).off("click", "#btnSeleccionarItems").on("click", "#btnSeleccionarItems", function () {
        const items = [];
        const checkboxes = dtItemsConsultaPromo ? dtItemsConsultaPromo.$(".item-checkbox:checked") : $("#tablaItemsConsulta .item-checkbox:checked");

        checkboxes.each(function () {
            const $c = $(this);
            items.push({
                codigo: $c.data("codigo"), descripcion: $c.data("descripcion"),
                costo: $c.data("costo"), stock: $c.data("stock"), optimo: $c.data("optimo"),
                excedenteu: $c.data("excedenteu"), excedentes: $c.data("excedentes"),
                m0u: $c.data("m0u"), m0s: $c.data("m0s"), m1u: $c.data("m1u"), m1s: $c.data("m1s"),
                m2u: $c.data("m2u"), m2s: $c.data("m2s"),
                m12u: $c.data("m12u"), m12s: $c.data("m12s"),
                diasantiguedad: $c.data("diasantiguedad"),
                margenmincontado: $c.data("margenmincontado"),
                margenmintc: $c.data("margenmintc"),
                margenmincredito: $c.data("margenmincredito"),
                margenminigualar: $c.data("margenminigualar"),
                preciolistacontado: $c.data("preciolistacontado"),
                preciolistacredito: $c.data("preciolistacredito")
            });
        });

        if (items.length === 0) {
            Swal.fire("Atención", "Seleccione al menos un item.", "info"); return;
        }

        if (window.contextoModalItems === "COMBOS") {
            items.forEach(item => agregarColumnaACombo(item));
        } else {
            agregarItemsATablaArticulos(items);
        }

        $("#modalConsultaItems").modal("hide");
        $("#checkTodosItems").prop("checked", false);

        if (window.contextoModalItems !== "COMBOS") {
            window.contextoModalItems = "ARTICULOS";
        }
    });

    // ==========================================
    // INIT
    // ==========================================
    $(function () {
        console.log("=== CrearPromocion JS Loaded ===");

        // --- FIX DEFINITIVO: GESTIÓN DE BACKDROPS PARA EVITAR PANTALLA NEGRA ---

        // Helper global para limpiar backdrops huérfanos (compatible con modales anidados)
        window.limpiarBackdropsHuerfanos = function () {
            // Contar modales realmente visibles
            const $modalesVisibles = $('.modal').filter(function () {
                return $(this).hasClass('show') && $(this).css('display') !== 'none';
            });
            const cantidadVisibles = $modalesVisibles.length;
            const $backdrops = $('.modal-backdrop');

            if (cantidadVisibles === 0) {
                // No hay modales visibles → eliminar TODO
                $backdrops.remove();
                $('body').removeClass('modal-open').css({ 'padding-right': '', 'overflow': '' });
            } else {
                // Hay modales visibles → asegurar que haya EXACTAMENTE el mismo número de backdrops
                if ($backdrops.length > cantidadVisibles) {
                    // Eliminar backdrops sobrantes (los últimos del DOM)
                    $backdrops.slice(cantidadVisibles).remove();
                }

                // Re-sincronizar z-index de cada modal visible y su backdrop correspondiente
                $modalesVisibles.each(function (index) {
                    const zIndexModal = 1050 + (10 * index);
                    $(this).css('z-index', zIndexModal);
                });

                // Re-asignar z-index a backdrops en el orden correcto
                $('.modal-backdrop').each(function (index) {
                    const zIndexBackdrop = 1050 + (10 * index) - 1;
                    $(this).css('z-index', zIndexBackdrop);
                });

                $('body').addClass('modal-open');
            }
        };

        // Antes de mostrar un modal: NO limpiar nada, solo preparar z-index
        $(document).off('show.bs.modal.fixBackdrop').on('show.bs.modal.fixBackdrop', '.modal', function () {
            // Contar modales que YA están visibles (sin contar este que se va a abrir)
            const modalesYaAbiertos = $('.modal.show').length;
            const zIndex = 1050 + (10 * modalesYaAbiertos);
            $(this).css('z-index', zIndex);
        });

        // Después de mostrar el modal: ajustar TODOS los backdrops correctamente
        $(document).off('shown.bs.modal.fixBackdrop').on('shown.bs.modal.fixBackdrop', '.modal', function () {
            // El modal recién mostrado SIEMPRE debe quedar al frente
            const $modalActual = $(this);
            const $todosModalesVisibles = $('.modal.show');
            const totalVisibles = $todosModalesVisibles.length;

            // Asignar al modal actual el z-index MÁS ALTO
            const zIndexModalActual = 1050 + (10 * (totalVisibles - 1));
            $modalActual.css('z-index', zIndexModalActual);

            // Los demás modales mantienen su z-index relativo (no los modificamos drásticamente)
            // Pero sí re-sincronizamos backdrops
            const $backdrops = $('.modal-backdrop');

            // El último backdrop creado pertenece al modal actual
            if ($backdrops.length > 0) {
                const $ultimoBackdrop = $backdrops.last();
                $ultimoBackdrop.css('z-index', zIndexModalActual - 1);
            }

            // Asegurar que body tenga la clase
            $('body').addClass('modal-open');
        });

        // Cuando se cierra cualquier modal: limpiar SOLO si es necesario
        $(document).off('hidden.bs.modal.fixBackdrop').on('hidden.bs.modal.fixBackdrop', '.modal', function () {
            const $modalCerrado = $(this);

            // Pequeño delay para que Bootstrap termine su animación interna
            setTimeout(function () {
                // Verificar cuántos modales siguen visibles
                const $modalesRestantes = $('.modal.show');
                const cantidadRestantes = $modalesRestantes.length;

                if (cantidadRestantes === 0) {
                    // No hay modales abiertos → limpiar todo
                    $('.modal-backdrop').remove();
                    $('body').removeClass('modal-open').css({ 'padding-right': '', 'overflow': '' });
                } else {
                    // Hay modales abiertos → solo limpiar backdrops SOBRANTES
                    const $backdrops = $('.modal-backdrop');
                    if ($backdrops.length > cantidadRestantes) {
                        $backdrops.slice(cantidadRestantes).remove();
                    }

                    // CRÍTICO: Asegurar que body mantenga la clase modal-open
                    $('body').addClass('modal-open').css('overflow', 'hidden');

                    // Re-asegurar que el modal restante tenga z-index visible
                    $modalesRestantes.each(function (index) {
                        const zIndex = 1050 + (10 * index);
                        $(this).css('z-index', zIndex);
                    });

                    // Re-sincronizar backdrops que quedaron
                    $('.modal-backdrop').each(function (index) {
                        const zIndexBackdrop = 1050 + (10 * index) - 1;
                        $(this).css('z-index', zIndexBackdrop);
                    });
                }
            }, 50);
        });

        CONFIG_MULTIPLE.push(
            { id: "canalCombos", select: "#filtroCanalCombos", btnOpen: "#btnCanalCombos", body: "#bodyModalCanal", btnAccept: "#btnAceptarCanal", triggerVal: "3" },
            { id: "grupoCombos", select: "#filtroGrupoAlmacenCombos", btnOpen: "#btnGrupoAlmacenCombos", body: "#bodyModalGrupoAlmacen", btnAccept: "#btnAceptarGrupoAlmacen", triggerVal: "3" },
            { id: "almacenCombos", select: "#filtroAlmacenCombos", btnOpen: "#btnAlmacenCombos", body: "#bodyModalAlmacen", btnAccept: "#btnAceptarAlmacen", triggerVal: "3" }
        );

        // LÓGICA DE SELECCIÓN DE FILA (HABILITAR CAMPOS AMARILLOS)
        $(document).off("change", ".item-row-radio").on("change", ".item-row-radio", function () {
            $("#tablaArticulosBody tr").removeClass("table-active");
            $("#tablaArticulosBody .celda-editable input, #tablaArticulosBody .celda-editable button, #tablaArticulosBody .celda-editable select").prop("disabled", true);
            $("#tablaArticulosBody .aporte-proveedor, #tablaArticulosBody .aporte-proveedor2, #tablaArticulosBody .aporte-rebate, #tablaArticulosBody .aporte-propio, #tablaArticulosBody .aporte-propio2").prop("disabled", true);
            $("#tablaArticulosBody td:last-child input[type='checkbox']").prop("disabled", true).css("pointer-events", "none");

            const $fila = $(this).closest("tr");
            $fila.addClass("table-active");

            $fila.find(".celda-editable input, .celda-editable button, .celda-editable select").not(".aporte-proveedor, .aporte-proveedor2, .aporte-rebate, .aporte-propio, .aporte-propio2").prop("disabled", false);

            const tieneProvedor = $fila.find(".acuerdo-prov1-hidden").val();
            const tieneProvedor2 = $fila.find(".acuerdo-prov2-hidden").val();
            const tieneRebate = $fila.find(".acuerdo-rebate-hidden").val();
            const tienePropio = $fila.find(".acuerdo-propio1-hidden").val();
            const tienePropio2 = $fila.find(".acuerdo-propio2-hidden").val();

            if (tieneProvedor) $fila.find(".aporte-proveedor").prop("disabled", false);
            if (tieneProvedor2) $fila.find(".aporte-proveedor2").prop("disabled", false);
            if (tieneRebate) $fila.find(".aporte-rebate").prop("disabled", false);
            if (tienePropio) $fila.find(".aporte-propio").prop("disabled", false);
            if (tienePropio2) $fila.find(".aporte-propio2").prop("disabled", false);

            $fila.find("td:last-child input[type='checkbox']").prop("disabled", false).css("pointer-events", "auto");
        });

        $("#filtroCanalCombos").html($("#filtroCanalGeneral").html());
        aplicarSelect2($("#filtroCanalCombos"));

        $("#filtroGrupoAlmacenCombos").html($("#filtroGrupoAlmacenGeneral").html());
        aplicarSelect2($("#filtroGrupoAlmacenCombos"));

        $("#filtroAlmacenCombos").html($("#filtroAlmacenGeneral").html());
        aplicarSelect2($("#filtroAlmacenCombos"));

        togglePromocionForm();
        initLogicaArticuloGeneral();
        initLogicaSeleccionMultiple();
        initValidacionesFinancieras();
        initDatepickers();
        initBotonesServiciosArticulos();

        initLogicaCombos();

        $("#filtroGrupoAlmacenGeneral, #filtroGrupoAlmacenArticulos, #filtroGrupoAlmacenCombos").on("change", function () {
            const codigoAlmacen = $(this).val();
            if (codigoAlmacen && codigoAlmacen !== "" && codigoAlmacen !== "3" && codigoAlmacen !== "TODOS") {
                consultarAlmacenes(codigoAlmacen);
            } else if (!codigoAlmacen || codigoAlmacen === "") {
                consultarAlmacenes();
            }
        });

        // Handler ÚNICO para cambio de tipo de promoción
        $("#promocionTipo").off("change.tipoPromo").on("change.tipoPromo", function () {
            // 1. Cerrar TODOS los modales abiertos de forma segura
            $('.modal.show').each(function () {
                const instance = bootstrap.Modal.getInstance(this);
                if (instance) {
                    instance.hide();
                }
            });

            // 2. Limpiar backdrops inmediatamente
            setTimeout(function () {
                $('.modal-backdrop').remove();
                $('body').removeClass('modal-open').css({ 'padding-right': '', 'overflow': '' });
            }, 200);

            // 3. Cambiar el formulario visible
            togglePromocionForm();
            const tipo = getTipoPromocion();
            if (tipo == idCatalogoArticulo) cargarMotivosPromociones("#motivoArticulos");
            if (tipo == idCatalogoCombos) cargarMotivosPromociones("#motivoCombos");

            // 4. Limpiar todos los formularios
            resetearFormulario("General");
            resetearFormulario("Articulos");
            resetearFormulario("Combos");

            // 5. Limpiar memoria de combos
            articulosPorComboMemoria = {};
            comboEnEdicion = null;
            limpiarModalCombo();

            // 6. Establecer contexto global
            window.contextoModalItems = (tipo == idCatalogoCombos) ? "COMBOS" : "ARTICULOS";
            $("#modalCrearCombo").data("estaba-abierto", false);
        });

        cargarTiposPromocion(async function () {
            cargarMotivosPromociones("#motivoGeneral");
            cargarFiltrosJerarquia();
            await cargarCombosPromociones();
        });

        $("#btnGuardarPromocionGeneral").on("click", () => guardarPromocion("General"));

        $("#modalConsultaProveedor").on("show.bs.modal", function () {
            $("#buscarProveedorInput").val("");
            proveedorTemporal = null;
            consultarAcuerdos("TFPROVEDOR", "tablaProveedores", (s) => proveedorTemporal = s);
        });
        $("#btnAceptarProveedor").on("click", function () {
            if (proveedorTemporal) {
                setFondoProveedorEnForm(proveedorTemporal);
                $("#modalConsultaProveedor").modal("hide");
            }
        });

        $("#modalConsultaAcuerdoPropio").on("show.bs.modal", function () {
            $("#buscarAcuerdoPropioInput").val("");
            propioTemporal = null;
            consultarAcuerdos("TFPROPIO", "tablaAcuerdosPropios", (s) => propioTemporal = s);
        });
        $("#btnAceptarAcuerdoPropio").on("click", function () {
            if (propioTemporal) {
                setFondoPropioEnForm(propioTemporal);
                $("#modalConsultaAcuerdoPropio").modal("hide");
            }
        });

        $("#tipoClienteGeneral, #tipoClienteArticulos, #tipoClienteCombos").on("change", function () {
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
                $btn.addClass("d-none").removeData("seleccionados")
                    .html(`<i class="fa-solid fa-list-check"></i>`)
                    .removeClass("btn-success").addClass("btn-outline-secondary");
            }
        });

        $('#inputGroupFile24').on('change', function () {
            esArchivoValido('#inputGroupFile24', '#fileName');
        });

        $('#inputFileArticulos').on('change', function () {
            esArchivoValido('#inputFileArticulos', '#fileNameArticulos');
        });

        $('#inputFileCombos').on('change', function () {
            esArchivoValido('#inputFileCombos', '#fileNameCombos');
        });

        $(".btn-secondary[id^='btnCancelar']").on("click", () => location.reload());

        $("#btnAceptarTipoCliente").on("click", function () {
            let $btnTrigger;
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
                $btnTrigger.removeClass("btn-outline-secondary").addClass("btn-success")
                    .html(`<i class="fa-solid fa-list-check"></i> (${seleccionados.length})`);
            } else {
                $btnTrigger.removeClass("btn-success").addClass("btn-outline-secondary")
                    .html(`<i class="fa-solid fa-list-check"></i>`);
            }
        });

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
                        { title: "M-2($)", className: "align-middle text-end" },
                        { title: "M-12(u)", className: "align-middle text-center" },
                        { title: "M-12($)", className: "align-middle text-end" }
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
                marcas: marcas, divisiones: divisiones, departamentos: departamentos,
                clases: clases, codigoarticulo: articulo
            });
        });

        $("#checkTodosItems").on("change", function () {
            const isChecked = $(this).is(":checked");
            if (dtItemsConsultaPromo) {
                $(dtItemsConsultaPromo.$(".item-checkbox")).prop("checked", isChecked);
            }
        });

        // NOTA: El evento #btnSeleccionarItems ya está manejado arriba con $(document).off/on
        // No duplicar aquí.

        let filaActualMedioPago = null;

        $(document).on("change", ".select-mediopago-articulo", function () {
            const $select = $(this);
            const val = $select.val();

            if (val === "7") {
                filaActualMedioPago = $select.closest("tr");
                const guardados = $select.data("seleccionados") || [];
                $("#bodyModalMedioPago input[type='checkbox']").prop("checked", false);
                guardados.forEach(v => $(`#bodyModalMedioPago input[value='${v}']`).prop("checked", true));

                $("#btnAceptarMedioPago").off("click.articulo").on("click.articulo", function (ev) {
                    ev.preventDefault();
                    ev.stopPropagation();

                    if (filaActualMedioPago) {
                        const seleccionados = [];
                        $("#bodyModalMedioPago input[type='checkbox']:checked").each(function () {
                            seleccionados.push($(this).val());
                        });

                        filaActualMedioPago.find(".select-mediopago-articulo").data("seleccionados", seleccionados);
                        if (seleccionados.length === 0) {
                            filaActualMedioPago.find(".select-mediopago-articulo").val("");
                        }
                        filaActualMedioPago = null;
                    }

                    // Cerrar SOLO el modal de Medio de Pago
                    const modalMPInstance = bootstrap.Modal.getInstance(document.getElementById('ModalMedioPago'));
                    if (modalMPInstance) {
                        modalMPInstance.hide();
                    }
                });
                $("#ModalMedioPago").modal("show");
            } else {
                $select.removeData("seleccionados");
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
                title: "¿Está seguro?", html: `Se eliminará el Artículo:<br><strong>${descripcion}</strong>`,
                icon: "warning", showCancelButton: true, confirmButtonColor: "#d33",
                cancelButtonColor: "#6c757d", confirmButtonText: "Sí, Eliminar", cancelButtonText: "Cancelar"
            }).then((result) => {
                if (result.isConfirmed) {
                    $fila.remove();
                    const $primeraFila = $("#tablaArticulosBody tr").first();
                    if ($primeraFila.length) {
                        $primeraFila.find(".item-row-radio").prop("checked", true).trigger("change");
                    }
                    Swal.fire({ toast: true, position: "top-end", icon: "success", title: "Item eliminado", showConfirmButton: false, timer: 1500 });
                }
            });
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
            if (!acuerdoArticuloTemporal) {
                Swal.fire({ icon: "info", title: "Atención", text: "Debe seleccionar un acuerdo." }); return;
            }

            if (acuerdoArticuloContexto) {
                const tipo = acuerdoArticuloContexto.tipoFondo;
                const slot = acuerdoArticuloContexto.slot;
                const $fila = acuerdoArticuloContexto.$fila;
                const idSeleccionado = String(acuerdoArticuloTemporal.idAcuerdo);

                if (tipo === "TFPROVEDOR") {
                    const otroSlotClass = slot === 1 ? ".acuerdo-prov2-hidden" : ".acuerdo-prov1-hidden";
                    const idOtroSlot = String($fila.find(otroSlotClass).val() || "");
                    if (idOtroSlot && idOtroSlot !== "" && idOtroSlot === idSeleccionado) {
                        Swal.fire({
                            icon: "warning",
                            title: "Acuerdo Duplicado",
                            text: `El acuerdo ${idSeleccionado} ya fue seleccionado en Aporte ${slot === 1 ? "2" : ""} Proveedor. Debe elegir un acuerdo diferente.`
                        });
                        return;
                    }
                } else if (tipo === "TFPROPIO") {
                    const otroSlotClass = slot === 1 ? ".acuerdo-propio2-hidden" : ".acuerdo-propio1-hidden";
                    const idOtroSlot = String($fila.find(otroSlotClass).val() || "");
                    if (idOtroSlot && idOtroSlot !== "" && idOtroSlot === idSeleccionado) {
                        Swal.fire({
                            icon: "warning",
                            title: "Acuerdo Duplicado",
                            text: `El acuerdo ${idSeleccionado} ya fue seleccionado en Aporte ${slot === 1 ? "2" : ""} Propio. Debe elegir un acuerdo diferente.`
                        });
                        return;
                    }
                }

                acuerdoArticuloContexto.$inputDisplay.val(acuerdoArticuloTemporal.display);
                acuerdoArticuloContexto.$inputId.val(acuerdoArticuloTemporal.idAcuerdo);

                const maxVal = acuerdoArticuloTemporal.valorAcuerdo || 0;

                if (tipo === "TFPROVEDOR" && slot === 1) {
                    $fila.find(".aporte-proveedor").prop("disabled", false).attr("data-max", maxVal).val("");
                } else if (tipo === "TFPROVEDOR" && slot === 2) {
                    $fila.find(".aporte-proveedor2").prop("disabled", false).attr("data-max", maxVal).val("");
                } else if (tipo === "TFREBATE") {
                    $fila.find(".aporte-rebate").prop("disabled", false).attr("data-max", maxVal).val("");
                } else if (tipo === "TFPROPIO" && slot === 1) {
                    $fila.find(".aporte-propio").prop("disabled", false).attr("data-max", maxVal).val("");
                } else if (tipo === "TFPROPIO" && slot === 2) {
                    $fila.find(".aporte-propio2").prop("disabled", false).attr("data-max", maxVal).val("");
                }

                recalcularFilaArticulo($fila);
            }
            $("#modalAcuerdoArticulo").modal("hide");
            acuerdoArticuloTemporal = null;
            acuerdoArticuloContexto = null;
        });

        $(document).on("input", "#tablaArticulosBody input[type='text'], #tablaArticulosBody input[type='number']", function () {
            this.value = this.value.replace(/[^0-9.,]/g, '');
        });

        $(document).on("input change", "#tablaArticulosBody input[type='text'], #tablaArticulosBody input[type='number']", function () {
            const $fila = $(this).closest("tr");
            recalcularFilaArticulo($fila);
        });

        $(document).on("blur", "#tablaArticulosBody .aporte-proveedor, #tablaArticulosBody .aporte-proveedor2, #tablaArticulosBody .aporte-rebate, #tablaArticulosBody .aporte-propio, #tablaArticulosBody .aporte-propio2", function () {
            const max = parseFloat($(this).attr("data-max")) || 0;
            const valor = parseCurrency($(this).val());

            if (max > 0 && valor > max) {
                Swal.fire({
                    icon: 'warning', title: 'Valor Excedido',
                    text: `El aporte ingresado ($${valor.toFixed(2)}) supera el valor del acuerdo ($${max.toFixed(2)}).`
                });
                $(this).val("").addClass("is-invalid");
            } else {
                $(this).removeClass("is-invalid");
            }
        });

        $("#btnGuardarPromocionArticulos").on("click", () => guardarPromocionArticulos());

        // Fix: Al cerrar el modal de Items, re-abrir el modal de Combos si el contexto es COMBOS
        $("#modalConsultaItems").on("hidden.bs.modal", function () {
            if (window.contextoModalItems === "COMBOS" || $("#modalCrearCombo").data("estaba-abierto")) {
                $("#modalCrearCombo").data("estaba-abierto", false);
                setTimeout(function () {
                    $("#modalCrearCombo").modal("show");
                    window.contextoModalItems = "ARTICULOS";
                }, 300);
            }
        });

        $(document).on("click", ".btn-add-articulo-combo", function () {
            window.contextoModalItems = "COMBOS";
            $("#modalCrearCombo").data("estaba-abierto", true);
        });


        $("#btnGuardarPromocionCombos").on("click", () => guardarPromocionCombo());

        // Limpieza específica al cerrar el modal de Medio de Pago
        $("#ModalMedioPago").off("hidden.bs.modal.cleanup").on("hidden.bs.modal.cleanup", function () {
            // Limpiar todos los handlers temporales del botón Aceptar
            $("#btnAceptarMedioPago").off("click.combo click.articulo");

            // Limpiar referencias globales si quedaron colgadas
            if (typeof selectMedioPagoComboFinalActual !== 'undefined') {
                selectMedioPagoComboFinalActual = null;
            }
            if (typeof btnMedioPagoComboFinalActual !== 'undefined') {
                btnMedioPagoComboFinalActual = null;
            }
            if (typeof filaActualMedioPago !== 'undefined') {
                filaActualMedioPago = null;
            }

            // Si el modal padre (#modalCrearCombo) sigue abierto, restaurar foco a él
            const $modalCombo = $("#modalCrearCombo");
            if ($modalCombo.hasClass("show")) {
                // Asegurar que body tenga modal-open
                $('body').addClass('modal-open');

                // Reasignar z-index correcto al modal padre
                $modalCombo.css('z-index', 1050);

                // Verificar que su backdrop esté presente y visible
                const $backdrops = $('.modal-backdrop');
                if ($backdrops.length > 0) {
                    $backdrops.first().css('z-index', 1049).addClass('show');
                }
            } else {
                // No hay modal padre, limpiar todo
                setTimeout(function () {
                    if (window.limpiarBackdropsHuerfanos) {
                        window.limpiarBackdropsHuerfanos();
                    }
                }, 100);
            }
        });
    });
})();