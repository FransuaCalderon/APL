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

        $("#inputGroupFile24, #inputFileArticulos").val("");
        if (document.getElementById("fileName")) document.getElementById("fileName").textContent = "";
        if (document.getElementById("fileNameArticulos")) document.getElementById("fileNameArticulos").textContent = "";

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
                        Swal.fire("Éxito", "Promoción Guardada: " + respuestaNegocio.mensaje, "success").then(() => {
                            resetearFormulario(tipo);
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
        console.log("guardando promocion por combo");

        const motivo = parseInt($("#motivoCombos").val(), 10) || 0;
        const desc = $("#descripcionCombos").val();
        const fechaInicio = getFullISOString("#fechaInicioCombos", "#timeInicioCombos");
        const fechaFin = getFullISOString("#fechaFinCombos", "#timeFinCombos");
        /*
        if (!desc || desc.trim().length < 3) { Swal.fire("Validación", "Debe ingresar una descripción.", "warning"); return; }
        if (!motivo) { Swal.fire("Validación", "Debe seleccionar un motivo.", "warning"); return; }
        if (!fechaInicio || !fechaFin) { Swal.fire("Validación", "Debe ingresar las fechas de inicio y fin.", "warning"); return; }

        const grupoCboVal = $("#filtroGrupoAlmacenCombos").val();
        if (!grupoCboVal || grupoCboVal === "") { Swal.fire("Validación", "Debe seleccionar un Grupo de Almacén.", "warning"); return; }

        const almacenCboVal = $("#filtroAlmacenCombos").val();
        if (!almacenCboVal || almacenCboVal === "") { Swal.fire("Validación", "Debe seleccionar un Almacén.", "warning"); return; }



        

        if (!esArchivoValido('#inputFileCombos', '#fileNameCombos')) {
            if ($('#inputFileCombos')[0].files.length === 0) { Swal.fire("Archivo requerido", "Debe adjuntar el soporte", "warning"); }
            return;
        }
        */

        

        const fileInput = $('#inputFileCombos')[0].files[0];
        if (!fileInput) { Swal.fire("Archivo requerido", "Debe adjuntar el soporte de la promoción", "warning"); return; }

        const leerArchivo = file => new Promise((resolve, reject) => {
            const reader = new FileReader(); 
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = e => reject(e);
        });

        const base64Completo = await leerArchivo(fileInput);
        

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


        const $filas = $("#tablaCombosBody tr");
        if ($filas.length === 0) { Swal.fire("Validación", "Debe agregar al menos un combo en el detalle.", "warning"); return; }

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
            /*
            if (unidadesLimite > 0 && proyeccionVtas > 0) {
                errorFila = `Fila ${numFila}: Solo debe ingresar valor en Unidades Límite O Proyección Vtas, no en ambas.`;
                return false;
            }
            if (unidadesLimite === 0 && proyeccionVtas === 0) {
                errorFila = `Fila ${numFila}: Debe ingresar valor en Unidades Límite o Proyección Vtas.`;
                return false;
            }*/

            const $selectMedioPago = $fila.find("td:eq(24) select");
            const medioPagoVal = $selectMedioPago.val();

            const precioLista = parseCurrency($fila.find("td:eq(25)").text());
            const precioPromoContado = parseCurrency($fila.find("td:eq(26) input").val());
            const precioPromoTC = parseCurrency($fila.find("td:eq(27) input").val());
            const precioPromoCredito = parseCurrency($fila.find("td:eq(28) input").val());
            const precioIgualarPromo = parseCurrency($fila.find("td:eq(29) input").val());

            const dsctoContado = parseFloat($fila.find("td:eq(30)").text()) || 0;
            const dsctoTC = parseFloat($fila.find("td:eq(31)").text()) || 0;
            const dsctoCredito = parseFloat($fila.find("td:eq(32)").text()) || 0;
            const dsctoIgualar = parseFloat($fila.find("td:eq(33)").text()) || 0;

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

            const compProveedor = parseCurrency($fila.find("td:eq(49)").text());
            const compProveedor2 = parseCurrency($fila.find("td:eq(50)").text());
            const compRebate = parseCurrency($fila.find("td:eq(51)").text());
            const compPropio = parseCurrency($fila.find("td:eq(52)").text());
            const compPropio2 = parseCurrency($fila.find("td:eq(53)").text());

            const margenPrecioLista = parseFloat($fila.find("td:eq(44)").text()) || 0;
            const margenPromoContado = parseFloat($fila.find("td:eq(45)").text()) || 0;
            const margenPromoTC = parseFloat($fila.find("td:eq(46)").text()) || 0;
            const margenPromoCredito = parseFloat($fila.find("td:eq(47)").text()) || 0;
            const margenIgualar = parseFloat($fila.find("td:eq(48)").text()) || 0;

            const regalo = $fila.find("td:eq(54) input[type='checkbox']").is(":checked") ? "S" : "N";

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
                preciolistacontado: precioLista,
                preciolistacredito: precioLista,
                preciopromocioncontado: precioPromoContado,
                preciopromociontarjetacredito: precioPromoTC,
                preciopromocioncredito: precioPromoCredito,
                precioigualarprecio: precioIgualarPromo,
                descuentopromocioncontado: dsctoContado,
                descuentopromociontarjetacredito: dsctoTC,
                descuentopromocioncredito: dsctoCredito,
                descuentoigualarprecio: dsctoIgualar,
                margenpreciolistacontado: margenPrecioLista,
                margenpreciolistacredito: margenPrecioLista,
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
                marcaregalo: "",
                marcaprocesoaprobacion: "",
                idusuarioingreso: getUsuario(),
                nombreusuario: getUsuario()
            },
            "acuerdos": [],
            "segmentos": segmentos,
            "articulos": articulos
        }

        const payload = {
            code_app: "APP20260128155212346",
            http_method: "POST",
            endpoint_path: "api/promocion/insertar",
            client: "APL",
            body_request: body
        };

        console.log("body: ", body);
        
        /*
        $.ajax({
            url: "/api/apigee-router-proxy",
            method: "POST",
            contentType: "application/json",
            data: JSON.stringify(payload),
            success: function (res) {
                const respuesta = res.json_response || res;
                if (respuesta.codigoretorno == 1) {
                    Swal.fire("Éxito", "Promoción por Combos Guardada: " + respuesta.mensaje, "success")
                        .then(() => resetearFormulario("Articulos"));
                } else {
                    Swal.fire("Atención", respuesta.mensaje || "Error en base de datos", "warning");
                }
            },
            error: function (xhr) {
                Swal.fire("Error", "Error de comunicación: " + xhr.statusText, "error");
            }
        });*/
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
                // CORRECCIÓN CRÍTICA: Usar colIdx en lugar de colIndex
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
                    case "aporte_prov_id": art.idAcuerdoProveedor = parseInt(val) || 0; break;
                    case "aporte_prov2_id": art.idAcuerdoProveedor2 = parseInt(val) || 0; break;
                    case "aporte_rebate_id": art.idAcuerdoRebate = parseInt(val) || 0; break;
                    case "aporte_propio_id": art.idAcuerdoPropio = parseInt(val) || 0; break;
                    case "aporte_propio2_id": art.idAcuerdoPropio2 = parseInt(val) || 0; break;
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

            // Recuperar otros costos si existen (CORRECCIÓN: Usar colIdx)
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
        // Eliminar columnas dinámicas de artículos (todas después de las 2 primeras)
        const numCols = $("#trHeadersCombo th").length;
        for (let i = numCols - 1; i >= 2; i--) {
            $("#trHeadersCombo th:eq(" + i + ")").remove();
            $("#tablaCreacionCombo tbody tr").each(function () {
                $(this).find("td:eq(" + i + ")").remove();
            });
        }

        // Resetear campos
        $("#codigoComboModal").val("");
        $("#nombreComboModal").val("");
        $("#btnHeaderComboTotal").text("Nuevo Combo");

        // Resetear inputs de la columna total (col index 1 → segundo td en cada fila)
        $("#tablaCreacionCombo tbody tr").each(function () {
            const $td = $(this).find("td:eq(1)");
            const $input = $td.find("input");
            if ($input.length > 0) {
                if ($input.attr("type") === "checkbox") {
                    $input.prop("checked", false);
                } else {
                    const placeholder = $input.attr("placeholder") || "";
                    if ($input.prop("readonly")) {
                        // Para campos calculados/totales, resetear a valor por defecto
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
        });

        comboEnEdicion = null;
    }

    // ==========================================
    // FUNCIÓN AUXILIAR DE CÁLCULO PARA COLUMNAS DEL COMBO
    // ==========================================
    function recalcularColumnaCombo(colIndex) {
        const getColVal = (campo, selector) => {
            const text = $(`#tablaCreacionCombo tbody tr[data-campo='${campo}'] td[data-colindex='${colIndex}'] ${selector}`).val() || $(`#tablaCreacionCombo tbody tr[data-campo='${campo}'] td[data-colindex='${colIndex}'] ${selector}`).text();
            return parseCurrency(text);
        };

        const setColVal = (campo, selector, val) => {
            $(`#tablaCreacionCombo tbody tr[data-campo='${campo}'] td[data-colindex='${colIndex}'] ${selector}`).val(val);
        };

        const costo = getColVal("costo", "input");
        const precioLista = getColVal("precio_lista_contado", "input");
        const otrosCostos = parseFloat($(`#trHeadersCombo th:eq(${colIndex})`).data("total-otros-costos")) || 0;

        const unidadesLimite = getColVal("unidades_limite", "input");
        const proyeccionVtas = getColVal("proyeccion_vta", "input");
        const unidades = unidadesLimite > 0 ? unidadesLimite : proyeccionVtas;

        const promoContado = getColVal("promo_contado", "input");
        const promoTC = getColVal("promo_tc", "input");
        const promoCredito = getColVal("promo_credito", "input");

        setColVal("dscto_contado", "input", formatCurrencySpanish(precioLista - promoContado));
        setColVal("dscto_tc", "input", formatCurrencySpanish(precioLista - promoTC));
        setColVal("dscto_credito", "input", formatCurrencySpanish(precioLista - promoCredito));

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

        const calcMargen = (precioPromo) => {
            const denominador = precioPromo + apProv + apProv2 + apRebate;
            if (denominador > 0) return (((denominador - costo - otrosCostos) / denominador) * 100).toFixed(2) + "%";
            return "0.00%";
        };

        setColVal("margen_promo_contado", "input", calcMargen(promoContado));
        setColVal("margen_promo_tc", "input", calcMargen(promoTC));
        setColVal("margen_promo_cred", "input", calcMargen(promoCredito));
    }

    // ==========================================
    // LÓGICA PRINCIPAL DE COMBOS
    // ==========================================
    function initLogicaCombos() {

        // 1. Nuevo Combo - Abrir modal limpio
        $("#btnNuevoCombo").off("click").on("click", function () {
            comboEnEdicion = null;
            limpiarModalCombo();

            // Generar código temporal
            //let numRandom = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
            //$("#codigoComboModal").val("CMB-" + numRandom);
        });

        // 2. GUARDAR COMBO → Leer artículos del modal y agregar fila a tablaCombosBody
        $("#btnConfirmarCombo").off("click").on("click", function () {
            const codigo = $("#codigoComboModal").val().trim();
            const nombre = $("#nombreComboModal").val().trim();

            if (!nombre) {
                Swal.fire("Validación", "Debe ingresar un nombre para el combo.", "warning");
                return;
            }
            if (!codigo) {
                Swal.fire("Validación", "Debe ingresar un código para el combo.", "warning");
                return;
            }

            // Extraer artículos de las columnas dinámicas del modal
            const articulosCombo = extraerArticulosDelModalCombo();
            console.log("articulosCombo: ", articulosCombo);

            if (articulosCombo.length === 0) {
                Swal.fire("Validación", "Debe agregar al menos un artículo al combo.", "warning");
                return;
            }

            // Calcular totales sumando los artículos
            let totalCosto = 0, totalStock = 0, totalStockTienda = 0, totalOptimo = 0;
            let totalExcU = 0, totalExcS = 0;
            let totalPromoContado = 0, totalPromoTC = 0, totalPromoCredito = 0;
            let totalAporteProv = 0, totalAporteRebate = 0, totalAportePropio = 0;

            const nombresArticulos = [];

            articulosCombo.forEach(a => {
                totalCosto += a.costo || 0;
                totalStock += a.stock || 0;
                totalStockTienda += a.stockTienda || 0;
                totalOptimo += a.optimo || 0;
                totalExcU += a.excedenteu || 0;
                totalExcS += a.excedentes || 0;
                totalPromoContado += a.promoContado || 0;
                totalPromoTC += a.promoTC || 0;
                totalPromoCredito += a.promoCredito || 0;
                totalAporteProv += (a.aporteProveedor || 0) + (a.aporteProveedor2 || 0);
                totalAporteRebate += a.aporteRebate || 0;
                totalAportePropio += (a.aportePropio || 0) + (a.aportePropio2 || 0);
                nombresArticulos.push(a.codigo);
            });

            const precioListaCombo = 0; // Se suma de los precios de lista si se tuvieran
            const dsctoContado = precioListaCombo - totalPromoContado;
            const dsctoTC = precioListaCombo - totalPromoTC;
            const dsctoCredito = precioListaCombo - totalPromoCredito;

            const calcMargenCombo = (precioPromo) => {
                if (precioPromo > 0) return (((precioPromo - totalCosto) / precioPromo) * 100).toFixed(2) + "%";
                return "0.00%";
            };

            // Si estamos editando, eliminar la fila anterior
            if (comboEnEdicion) {
                $(`#tablaCombosBody tr[data-codigo="${comboEnEdicion}"]`).remove();
            }

            // Verificar que no exista ya el mismo código (si no estamos editando)
            if (!comboEnEdicion && $(`#tablaCombosBody tr[data-codigo="${codigo}"]`).length > 0) {
                Swal.fire("Atención", "Este código de combo ya existe en el detalle.", "warning");
                return;
            }

            // Construir la fila asegurando que los inputs interactivos nazcan DESHABILITADOS
            const filaCombo = `
                <tr data-codigo="${codigo}" class="align-middle">
                    <td class="table-sticky-col" style="background-color: #a4c995;">
                        <div class="d-flex align-items-center">
                            <input type="radio" class="form-check-input combo-row-radio me-2" name="comboRadioSel">
                            <span class="text-nowrap"><span class="fw-bold">${codigo}</span> - ${nombre}</span>
                        </div>
                        </td>
                    <td class="text-end">${formatCurrencySpanish(totalCosto)}</td>
                    <td class="text-end">${totalStock}</td>
                    <td class="text-end">${totalStockTienda}</td>
                    <td class="text-end">${totalOptimo}</td>
                    <td class="text-end">${totalExcU}</td>
                    <td class="text-end">${formatCurrencySpanish(totalExcS)}</td>
                    <td class="celda-editable"><input type="number" class="form-control form-control-sm text-end val-unidades-combo" placeholder="0"></td>
                    <td class="celda-editable"><input type="number" class="form-control form-control-sm text-end val-proyeccion-combo" placeholder="0"></td>
                    <td class="celda-editable">
                        <select class="form-select form-select-sm select-mediopago-combo-final">
                            ${$("#filtroMedioPagoGeneral").html()}
                        </select>
                    </td>
                    <td class="text-end">${formatCurrencySpanish(precioListaCombo)}</td>
                    <td class="text-end">${formatCurrencySpanish(totalPromoContado)}</td>
                    <td class="text-end">${formatCurrencySpanish(totalPromoTC)}</td>
                    <td class="text-end">${formatCurrencySpanish(totalPromoCredito)}</td>
                    <td class="text-end">${formatCurrencySpanish(dsctoContado)}</td>
                    <td class="text-end">${formatCurrencySpanish(dsctoTC)}</td>
                    <td class="text-end">${formatCurrencySpanish(dsctoCredito)}</td>
                    <td class="text-end">${calcMargenCombo(totalPromoContado)}</td>
                    <td class="text-end">${calcMargenCombo(totalPromoTC)}</td>
                    <td class="text-end">${calcMargenCombo(totalPromoCredito)}</td>
                    <td class="text-end">${formatCurrencySpanish(totalAporteProv)}</td>
                    <td class="text-end">${formatCurrencySpanish(totalAporteRebate)}</td>
                    <td class="text-end">${formatCurrencySpanish(totalAportePropio)}</td>
                    <td class="text-center celda-editable"><input class="form-check-input" type="checkbox" disabled></td>
                </tr>
            `;

            $("#tablaCombosBody").append(filaCombo);

            // Guardar los artículos en la fila para poder re-editar luego
            const $filaInsertada = $(`#tablaCombosBody tr[data-codigo="${codigo}"]`);
            $filaInsertada.data("combo-nombre", nombre);
            $filaInsertada.data("combo-articulos", articulosCombo);

            // CERRAR MODAL Y LIMPIAR
            $("#modalCrearCombo").modal("hide");
            limpiarModalCombo();
            comboEnEdicion = null;

            // Si es la primera fila agregada, la seleccionamos automáticamente
            if ($("#tablaCombosBody tr").length === 1) {
                $("#tablaCombosBody .combo-row-radio").first().prop("checked", true).trigger("change");
            }

            Swal.fire({
                toast: true, position: "top-end", icon: "success",
                title: `Combo "${nombre}" agregado.`,
                showConfirmButton: false, timer: 2000
            });
        });

        // 3. Eliminar Combo de la tabla
        $("#btnEliminarCombo").off("click").on("click", function () {
            const $radioSeleccionado = $("#tablaCombosBody .combo-row-radio:checked");
            if ($radioSeleccionado.length === 0) {
                Swal.fire({ icon: "warning", title: "Atención", text: "Debe seleccionar un combo del detalle para eliminar." });
                return;
            }

            const $fila = $radioSeleccionado.closest("tr");

            Swal.fire({
                title: "¿Está seguro?",
                text: "Se eliminará el combo seleccionado.",
                icon: "warning",
                showCancelButton: true,
                confirmButtonColor: "#d33",
                cancelButtonColor: "#6c757d",
                confirmButtonText: "Sí, Eliminar"
            }).then((result) => {
                if (result.isConfirmed) {
                    $fila.remove();
                    Swal.fire({ toast: true, position: "top-end", icon: "success", title: "Combo eliminado", showConfirmButton: false, timer: 1500 });
                }
            });
        });

        // 4. Modificar Combo - Re-abrir modal con los datos del combo seleccionado
        $("#btnModificarCombo").off("click").on("click", function () {
            const $radioSeleccionado = $("#tablaCombosBody .combo-row-radio:checked");
            if ($radioSeleccionado.length === 0) {
                Swal.fire({ icon: "warning", title: "Atención", text: "Debe seleccionar un combo del detalle para modificar." });
                return;
            }

            const $fila = $radioSeleccionado.closest("tr");
            const codigoCombo = $fila.data("codigo");
            const nombreCombo = $fila.data("combo-nombre") || "";
            const articulosGuardados = $fila.data("combo-articulos") || [];

            limpiarModalCombo();
            comboEnEdicion = codigoCombo;

            $("#codigoComboModal").val(codigoCombo);
            $("#nombreComboModal").val(nombreCombo);
            $("#btnHeaderComboTotal").text(`[${codigoCombo}] ${nombreCombo}`);

            // Re-agregar cada artículo como columna en el modal
            articulosGuardados.forEach(art => {
                agregarColumnaACombo({
                    codigo: art.codigo,
                    descripcion: art.descripcion,
                    costo: art.costo,
                    stock: art.stock,
                    optimo: art.optimo,
                    excedenteu: art.excedenteu,
                    excedentes: art.excedentes,
                    m0u: art.m0u,
                    m0s: art.m0s,
                    m1u: art.m1u,
                    m1s: art.m1s,
                    m2u: art.m2u,
                    m2s: art.m2s,
                    m12u: art.m12u,
                    m12s: art.m12s
                });
            });
        });

        // 5. Pintar fila al seleccionarla (Radio Button) y Habilitar campos
        $(document).off("change", ".combo-row-radio").on("change", ".combo-row-radio", function () {
            // Deshabilitar todas primero
            $("#tablaCombosBody tr").removeClass("table-active");
            $("#tablaCombosBody .celda-editable input, #tablaCombosBody .celda-editable button, #tablaCombosBody .celda-editable select").prop("disabled", true);
            $("#tablaCombosBody td:last-child input[type='checkbox']").prop("disabled", true).css("pointer-events", "none");

            // Habilitar solo la fila seleccionada
            const $fila = $(this).closest("tr");
            $fila.addClass("table-active");
            $fila.find(".celda-editable input, .celda-editable button, .celda-editable select").prop("disabled", false);
            $fila.find("td:last-child input[type='checkbox']").prop("disabled", false).css("pointer-events", "auto");
        });

        // -------------------------------------------------------------
        // EVENTOS PARA BOTONES DE ACCIÓN POR ARTÍCULO EN COMBO
        // -------------------------------------------------------------

        // Equivalentes
        $(document).off("click", ".btn-equivalentes-combo").on("click", ".btn-equivalentes-combo", function (e) {
            e.preventDefault();
            const codigo = $(this).data("codigo");
            consultarServicioAdicional("api/Promocion/consultar-articulo-equivalente", codigo, function (data) {
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

        // Precios Competencia
        $(document).off("click", ".btn-competencia-combo").on("click", ".btn-competencia-combo", function (e) {
            e.preventDefault();
            const codigo = $(this).data("codigo");
            consultarServicioAdicional("api/Promocion/consultar-articulo-precio-competencia", codigo, function (data) {
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

        // Otros Costos
        let colIndexCostosActual = null;
        $(document).off("click", ".btn-otros-costos-combo").on("click", ".btn-otros-costos-combo", function (e) {
            e.preventDefault();
            const codigo = $(this).data("codigo");
            colIndexCostosActual = $(this).closest("th").index();

            consultarServicioAdicional("api/Promocion/consultar-otros-costos", codigo, function (data) {
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
            let totalOtrosCostos = 0;
            let seleccionados = [];
            $("#tbodyOtrosCostos .chk-otro-costo-combo:checked").each(function () {
                const valor = parseFloat($(this).data("valor")) || 0;
                totalOtrosCostos += valor;
                seleccionados.push({
                    codigo: $(this).data("codigo"), nombre: $(this).data("nombre"), valor: valor
                });
            });

            if (colIndexCostosActual !== null) {
                const $th = $(`#trHeadersCombo th:eq(${colIndexCostosActual})`);
                $th.data("total-otros-costos", totalOtrosCostos);
                $th.data("detalle-otros-costos", seleccionados);
                recalcularColumnaCombo(colIndexCostosActual);
            }
            $("#modalOtrosCostos").modal("hide");
            if (totalOtrosCostos > 0) {
                Swal.fire({ toast: true, position: "top-end", icon: "success", title: `Otros costos aplicados: ${formatCurrencySpanish(totalOtrosCostos)}`, showConfirmButton: false, timer: 2000 });
            }
        });

        // -------------------------------------------------------------
        // MEDIO DE PAGO COMBO (Modal de Creación y Tabla Final)
        // -------------------------------------------------------------
        let selectMedioPagoComboFinalActual = null;

        // Usamos una sola lógica para cualquier select de Medio de Pago en el módulo de Combos
        $(document).off("change.comboMedioPago", ".select-mediopago-combo, .select-mediopago-combo-final").on("change.comboMedioPago", ".select-mediopago-combo, .select-mediopago-combo-final", function () {
            const $select = $(this);
            const val = $select.val();

            // Si elige "Varios" (Valor 7)
            if (val === "7") {
                selectMedioPagoComboFinalActual = $select;
                const guardados = $select.data("seleccionados") || [];

                // Limpiamos el modal y marcamos los checkboxes guardados previamente
                $("#bodyModalMedioPago input[type='checkbox']").prop("checked", false);
                guardados.forEach(v => $(`#bodyModalMedioPago input[value='${v}']`).prop("checked", true));

                // AQUÍ ESTÁ LA SOLUCIÓN: Usamos .off("click.combo"). Al ponerle ".combo" (un namespace), 
                // le decimos a jQuery que NO borre los clics de General ni de Artículos.
                $("#btnAceptarMedioPago").off("click.combo").on("click.combo", function () {
                    if (selectMedioPagoComboFinalActual) {
                        const seleccionados = [];
                        $("#bodyModalMedioPago input[type='checkbox']:checked").each(function () {
                            seleccionados.push($(this).val());
                        });

                        selectMedioPagoComboFinalActual.data("seleccionados", seleccionados);

                        // Si no seleccionó nada y dio aceptar, regresamos el select a vacío
                        if (seleccionados.length === 0) selectMedioPagoComboFinalActual.val("");
                        selectMedioPagoComboFinalActual = null;
                    }
                });

                // Abrimos el modal SOLO aquí mediante JS
                $("#ModalMedioPago").modal("show");
            } else {
                // Si elige cualquier otro, limpiamos la data guardada
                $select.removeData("seleccionados");
            }
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

            const titulos = {
                "TFPROVEDOR": "Acuerdos - Fondo Proveedor" + (slot === 2 ? " (2)" : ""),
                "TFREBATE": "Acuerdos - Fondo Rebate",
                "TFPROPIO": "Acuerdos - Fondo Propio" + (slot === 2 ? " (2)" : "")
            };

            abrirModalAcuerdoArticulo(tipoFondo, titulos[tipoFondo] || "Acuerdos", codigoItem, $inputDisplay, $inputId, slot, null);

            // Asignar variables al contexto global para ser procesado al aceptar
            acuerdoArticuloContexto.esCombo = true;
            acuerdoArticuloContexto.colIndex = colIndex;
        });

        // Intercepción del botón de aceptar acuerdos genérico para Combos
        const oldBtnAceptarAcuerdoArticulo = $._data($("#btnAceptarAcuerdoArticulo")[0], "events")?.click[0].handler;

        $("#btnAceptarAcuerdoArticulo").off("click").on("click", function (e) {
            if (acuerdoArticuloContexto && acuerdoArticuloContexto.esCombo) {
                if (!acuerdoArticuloTemporal) {
                    Swal.fire({ icon: "info", title: "Atención", text: "Debe seleccionar un acuerdo." }); return;
                }

                const tipo = acuerdoArticuloContexto.tipoFondo;
                const slot = acuerdoArticuloContexto.slot;
                const colIdx = acuerdoArticuloContexto.colIndex;
                const idSeleccionado = String(acuerdoArticuloTemporal.idAcuerdo);

                const getVal = (campo) => $(`#tablaCreacionCombo tbody tr[data-campo='${campo}'] td[data-colindex='${colIdx}'] input.acuerdo-id-hidden`).val();

                if (tipo === "TFPROVEDOR") {
                    const idOtro = slot === 1 ? getVal("aporte_prov2_id") : getVal("aporte_prov_id");
                    if (idOtro && idOtro === idSeleccionado) {
                        Swal.fire({ icon: "warning", title: "Acuerdo Duplicado", text: "Ya fue seleccionado." }); return;
                    }
                } else if (tipo === "TFPROPIO") {
                    const idOtro = slot === 1 ? getVal("aporte_propio2_id") : getVal("aporte_propio_id");
                    if (idOtro && idOtro === idSeleccionado) {
                        Swal.fire({ icon: "warning", title: "Acuerdo Duplicado", text: "Ya fue seleccionado." }); return;
                    }
                }

                acuerdoArticuloContexto.$inputDisplay.val(acuerdoArticuloTemporal.display);
                acuerdoArticuloContexto.$inputId.val(acuerdoArticuloTemporal.idAcuerdo);

                const maxVal = acuerdoArticuloTemporal.valorAcuerdo || 0;
                const setInputAporte = (campo) => {
                    const $inp = $(`#tablaCreacionCombo tbody tr[data-campo='${campo}'] td[data-colindex='${colIdx}'] input.aporte-valor`);
                    $inp.prop("disabled", false).attr("data-max", maxVal).val("");
                };

                if (tipo === "TFPROVEDOR" && slot === 1) setInputAporte("aporte_prov");
                else if (tipo === "TFPROVEDOR" && slot === 2) setInputAporte("aporte_prov2");
                else if (tipo === "TFREBATE") setInputAporte("aporte_rebate");
                else if (tipo === "TFPROPIO" && slot === 1) setInputAporte("aporte_propio");
                else if (tipo === "TFPROPIO" && slot === 2) setInputAporte("aporte_propio2");

                recalcularColumnaCombo(colIdx);
                $("#modalAcuerdoArticulo").modal("hide");
                acuerdoArticuloTemporal = null;
                acuerdoArticuloContexto = null;
            } else {
                if (oldBtnAceptarAcuerdoArticulo) oldBtnAceptarAcuerdoArticulo(e);
            }
        });

        // Cálculos dinámicos al teclear en inputs de la columna del combo
        $(document).off("input change", "#tablaCreacionCombo tbody input.input-combo-art").on("input change", "#tablaCreacionCombo tbody input.input-combo-art", function () {
            this.value = this.value.replace(/[^0-9.,]/g, '');
            const colIndex = $(this).closest("td").data("colindex");
            recalcularColumnaCombo(colIndex);
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
        const cod = $("#codigoComboModal").val();
        const nom = $("#nombreComboModal").val();
        if (cod && nom) {
            $("#btnHeaderComboTotal").text(`${cod} - ${nom}`);
        }
    });

    // ==========================================
    // RECALCULAR TOTALES DEL COMBO (COLUMNA PRINCIPAL)
    // ==========================================
    function recalcularTotalesCombo() {
        // Campos que son números enteros (cantidades)
        const camposNum = [
            "stock_bodega", "stock_tienda", "inv_optimo", "excedentes_u",
            "m0_u", "m1_u", "m2_u", "m12_u"
        ];
        // Campos que son valores en dólares
        const camposMoneda = [
            "costo", "excedentes_usd", "m0_usd", "m1_usd", "m2_usd", "m12_usd",
            "precio_lista_contado", "precio_lista_credito"
        ];

        // Sumar campos enteros
        camposNum.forEach(campo => {
            let suma = 0;
            $(`#tablaCreacionCombo tbody tr[data-campo='${campo}'] td:gt(1) input`).each(function () {
                suma += parseInt($(this).val().replace(/[^0-9-]/g, '')) || 0;
            });
            $(`#tablaCreacionCombo tbody tr[data-campo='${campo}'] td:eq(1) input`).val(suma);
        });

        // Sumar campos de moneda
        camposMoneda.forEach(campo => {
            let suma = 0;
            $(`#tablaCreacionCombo tbody tr[data-campo='${campo}'] td:gt(1) input`).each(function () {
                suma += parseCurrency($(this).val());
            });
            $(`#tablaCreacionCombo tbody tr[data-campo='${campo}'] td:eq(1) input`).val(formatCurrencySpanish(suma));
        });
    }

    function agregarColumnaACombo(item) {
        const thHtml = `
        <th scope="col" class="table-dark" style="min-width: 200px;">
            <div class="dropdown">
                <button class="btn btn-dark dropdown-toggle btn-sm border-0 w-100" type="button" data-bs-toggle="dropdown">
                    ${item.codigo} - ${item.descripcion}
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
                    html += `<input type="text" class="form-control form-control-sm custom-celda-bg text-end val-stock-tienda" readonly value="0">`; break;
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
                    html += `<input type="text" class="form-control form-control-sm custom-celda-bg text-end val-dias-antiguedad" readonly value="0">`; break;
                case "margen_min_cont":
                case "margen_min_tc":
                case "margen_min_cred":
                case "margen_min_igual":
                    html += `<input type="text" class="form-control form-control-sm custom-celda-bg text-end val-margen-min" readonly value="0%">`; break;
                case "unidades_limite":
                case "proyeccion_vta":
                    html += `<input type="number" class="form-control form-control-sm text-end input-combo-art val-unidades" placeholder="0" min="0">`; break;
                case "medio_pago":
                    html += `<select class="form-select form-select-sm select-mediopago-combo">
                                ${$("#filtroMedioPagoGeneral").html()}
                             </select>`; break;
                case "precio_lista_contado":
                case "precio_lista_credito":
                    html += `<input type="text" class="form-control form-control-sm custom-celda-bg text-end val-precio-lista" readonly value="${formatCurrencySpanish(0)}">`; break;
                case "promo_contado":
                    html += `<input type="text" class="form-control form-control-sm text-end input-combo-art val-precio-promo val-promo-contado" placeholder="$ 0.00">`; break;
                case "promo_tc":
                    html += `<input type="text" class="form-control form-control-sm text-end input-combo-art val-precio-promo val-promo-tc" placeholder="$ 0.00">`; break;
                case "promo_credito":
                    html += `<input type="text" class="form-control form-control-sm text-end input-combo-art val-precio-promo val-promo-credito" placeholder="$ 0.00">`; break;
                case "dscto_contado":
                case "dscto_tc":
                case "dscto_credito":
                    html += `<input type="text" class="form-control form-control-sm custom-celda-bg text-end val-dscto" readonly placeholder="0.00">`; break;
                case "aporte_prov":
                    html += `<input type="text" class="form-control form-control-sm text-end input-combo-art aporte-valor aporte-proveedor-combo" placeholder="$ 0.00" disabled>`; break;
                case "aporte_prov2":
                    html += `<input type="text" class="form-control form-control-sm text-end input-combo-art aporte-valor aporte-proveedor2-combo" placeholder="$ 0.00" disabled>`; break;
                case "aporte_rebate":
                    html += `<input type="text" class="form-control form-control-sm text-end input-combo-art aporte-valor aporte-rebate-combo" placeholder="$ 0.00" disabled>`; break;
                case "aporte_propio":
                    html += `<input type="text" class="form-control form-control-sm text-end input-combo-art aporte-valor aporte-propio-combo" placeholder="$ 0.00" disabled>`; break;
                case "aporte_propio2":
                    html += `<input type="text" class="form-control form-control-sm text-end input-combo-art aporte-valor aporte-propio2-combo" placeholder="$ 0.00" disabled>`; break;
                case "aporte_prov_id":
                    html += `
                    <input type="hidden" class="acuerdo-id-hidden acuerdo-prov1-hidden" value="">
                    <div class="input-group input-group-sm">
                        <input type="text" class="form-control text-end" placeholder="Seleccione..." readonly>
                        <button class="btn btn-outline-secondary btn-buscar-acuerdo-combo" type="button" data-tipofondo="TFPROVEDOR" data-slot="1"><i class="fa-solid fa-magnifying-glass"></i></button>
                    </div>`; break;
                case "aporte_prov2_id":
                    html += `
                    <input type="hidden" class="acuerdo-id-hidden acuerdo-prov2-hidden" value="">
                    <div class="input-group input-group-sm">
                        <input type="text" class="form-control text-end" placeholder="Seleccione..." readonly>
                        <button class="btn btn-outline-secondary btn-buscar-acuerdo-combo" type="button" data-tipofondo="TFPROVEDOR" data-slot="2"><i class="fa-solid fa-magnifying-glass"></i></button>
                    </div>`; break;
                case "aporte_rebate_id":
                    html += `
                    <input type="hidden" class="acuerdo-id-hidden acuerdo-rebate-hidden" value="">
                    <div class="input-group input-group-sm">
                        <input type="text" class="form-control text-end" placeholder="Seleccione..." readonly>
                        <button class="btn btn-outline-secondary btn-buscar-acuerdo-combo" type="button" data-tipofondo="TFREBATE" data-slot="1"><i class="fa-solid fa-magnifying-glass"></i></button>
                    </div>`; break;
                case "aporte_propio_id":
                    html += `
                    <input type="hidden" class="acuerdo-id-hidden acuerdo-propio1-hidden" value="">
                    <div class="input-group input-group-sm">
                        <input type="text" class="form-control text-end" placeholder="Seleccione..." readonly>
                        <button class="btn btn-outline-secondary btn-buscar-acuerdo-combo" type="button" data-tipofondo="TFPROPIO" data-slot="1"><i class="fa-solid fa-magnifying-glass"></i></button>
                    </div>`; break;
                case "aporte_propio2_id":
                    html += `
                    <input type="hidden" class="acuerdo-id-hidden acuerdo-propio2-hidden" value="">
                    <div class="input-group input-group-sm">
                        <input type="text" class="form-control text-end" placeholder="Seleccione..." readonly>
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
                case "regalo":
                    html += `<div class="d-flex justify-content-center"><input class="form-check-input val-regalo" type="checkbox"></div>`; break;
                default:
                    html += `<input type="text" class="form-control form-control-sm custom-celda-bg text-end" readonly>`; break;
            }

            html += `</td>`;
            $(this).append(html);
        });
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

        // --- FIX: AJUSTE DINÁMICO Y LIMPIEZA DE Z-INDEX PARA MODALES ---
        $(document).on('show.bs.modal', '.modal', function () {
            const zIndex = 1050 + (10 * $('.modal:visible').length);
            $(this).css('z-index', zIndex);
            setTimeout(() => {
                $('.modal-backdrop').not('.modal-stack').css('z-index', zIndex - 1).addClass('modal-stack');
            }, 0);
        });

        // Limpieza de pantalla oscura al cerrar modales
        $(document).on('hidden.bs.modal', '.modal', function () {
            if ($('.modal:visible').length > 0) {
                // Si aún hay modales abiertos, devuelve el scroll al body
                $(document.body).addClass('modal-open');
            } else {
                // Si ya no hay modales, elimina cualquier fondo negro atascado
                $('.modal-backdrop').remove();
                $('body').removeClass('modal-open').css({ 'padding-right': '', 'overflow': '' });
            }
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

        $("#promocionTipo").on("change", function () {
            togglePromocionForm();
            const tipo = getTipoPromocion();
            if (tipo == idCatalogoArticulo) cargarMotivosPromociones("#motivoArticulos");
            if (tipo == idCatalogoCombos) cargarMotivosPromociones("#motivoCombos");
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

                $("#btnAceptarMedioPago").off("click.articulo").on("click.articulo", function () {
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
    });
})();