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

                // 1. Llenar General
                llenarComboYModal($("#filtroCanalGeneral"), $("#bodyModalCanal"), data.canales, "Seleccione...", "3", "canal");
                llenarComboYModal($("#filtroGrupoAlmacenGeneral"), $("#bodyModalGrupoAlmacen"), data.gruposalmacenes, "Seleccione...", "3", "grupo", "Todos");

                consultarAlmacenes();

                llenarComboYModal($("#filtroMedioPagoGeneral"), $("#bodyModalMedioPago"), mediosPagoFiltrados, "Seleccione...", "7", "mediopago");

                // 2. Clonar para Artículos
                $("#filtroCanalArticulos").html($("#filtroCanalGeneral").html());
                aplicarSelect2($("#filtroCanalArticulos"));
                $("#filtroGrupoAlmacenArticulos").html($("#filtroGrupoAlmacenGeneral").html());
                aplicarSelect2($("#filtroGrupoAlmacenArticulos"));
                $("#filtroAlmacenCombos").html($("#filtroAlmacenGeneral").html());
                aplicarSelect2($("#filtroAlmacenCombos"));

                // 👉 3. Clonar para Combos (ESTO ES LO NUEVO)
                $("#filtroCanalCombos").html($("#filtroCanalGeneral").html());
                aplicarSelect2($("#filtroCanalCombos"));
                $("#filtroGrupoAlmacenCombos").html($("#filtroGrupoAlmacenGeneral").html());
                aplicarSelect2($("#filtroGrupoAlmacenCombos"));
                $("#filtroAlmacenCombos").html($("#filtroAlmacenGeneral").html());
                aplicarSelect2($("#filtroAlmacenCombos"));

                // 4. Lógica para Tipo de Cliente (Se aplica a los 3)
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

                // Clonar a Artículos
                $("#filtroAlmacenArticulos").html($("#filtroAlmacenGeneral").html());
                aplicarSelect2($("#filtroAlmacenArticulos"));

                // Clonar a Combos
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
                        data-m12s="${item.m12_s || item.m12_d || 0}">`,
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
    // AGREGAR ITEMS A TABLA ARTÍCULOS (CON NUEVOS CAMPOS)
    // ==========================================
    // MAPA DE INDICES DE COLUMNAS (td:eq):
    // 0:  Sel (radio)
    // 1:  Artículo (codigo - descripcion)
    // 2:  Costo
    // 3:  Stock Bodega
    // 4:  Stock Tienda
    // 5:  Inv. Óptimo
    // 6:  Excedente(u)
    // 7:  Excedente($)
    // 8:  Vta M-0(u)
    // 9:  Vta M-0($)
    // 10: Vta M-1(u)
    // 11: Vta M-1($)
    // 12: Vta M-2(u)
    // 13: Vta M-2($)
    // 14: Vta M-12(u)
    // 15: Vta M-12($)
    // 16: Vta Igualar
    // 17: Dias Igualar
    // 18: Marg.Min Contado
    // 19: Marg.Min TC
    // 20: Marg.Min Crédito
    // 21: Marg.Min Igualar
    // 22: Unidades Límite (input)
    // 23: Proyección Vtas (input)
    // 24: Medio de Pago (select)
    // 25: Precio Lista
    // 26: Precio Promo Contado (input)
    // 27: Precio Promo TC (input)
    // 28: Precio Promo Crédito (input)
    // 29: Precio Igualar (input)
    // 30: Dscto Promo Contado
    // 31: Dscto Promo TC
    // 32: Dscto Promo Crédito
    // 33: Dscto Igualar
    // 34: Aporte Proveedor (input .aporte-proveedor)
    // 35: Aporte Prov. ID Acuerdo (.acuerdo-prov1-hidden)
    // 36: Aporte 2 Proveedor (input .aporte-proveedor2)
    // 37: Aporte 2 Prov. ID Acuerdo (.acuerdo-prov2-hidden)
    // 38: Aporte Rebate (input .aporte-rebate)
    // 39: Aporte Rebate ID Acuerdo (.acuerdo-rebate-hidden)
    // 40: Aporte Propio (input .aporte-propio)
    // 41: Aporte Propio ID Acuerdo (.acuerdo-propio1-hidden)
    // 42: Aporte Propio 2 (input .aporte-propio2)
    // 43: Aporte 2 Propio ID Acuerdo (.acuerdo-propio2-hidden)
    // 44: Margen Precio Lista
    // 45: Margen Promo Contado
    // 46: Margen Promo TC
    // 47: Margen Promo Crédito
    // 48: Margen Igualar
    // 49: Comp. Proveedor
    // 50: Comp. Proveedor 2
    // 51: Comp. Rebate
    // 52: Comp. Propio
    // 53: Comp. Propio 2
    // 54: Regalo (checkbox)

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
            <td class="align-middle text-end">${item.m12u || 0}</td>
            <td class="align-middle text-end">${formatCurrencySpanish(item.m12s || 0)}</td>
            <td class="align-middle text-end">0</td>
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

            <!-- td 33: Aporte Proveedor -->
            <td class="align-middle"><input type="text" class="form-control form-control-sm text-end aporte-valor aporte-proveedor" placeholder="0.00" disabled></td>
            <!-- td 34: Aporte Prov. ID Acuerdo -->
            <td class="align-middle celda-editable">
                <input type="hidden" class="acuerdo-id-hidden acuerdo-prov1-hidden" value="">
                <div class="input-group input-group-sm">
                    <input type="text" class="form-control form-control-sm" placeholder="Seleccione..." readonly disabled>
                    <button class="btn btn-outline-secondary btn-buscar-acuerdo-art" type="button" data-tipofondo="TFPROVEDOR" data-slot="1" disabled>
                        <i class="fa-solid fa-magnifying-glass"></i>
                    </button>
                </div>
            </td>
            <!-- td 35: Aporte 2 Proveedor ✅ NUEVO -->
            <td class="align-middle"><input type="text" class="form-control form-control-sm text-end aporte-valor aporte-proveedor2" placeholder="0.00" disabled></td>
            <!-- td 36: Aporte 2 Prov. ID Acuerdo ✅ NUEVO -->
            <td class="align-middle celda-editable">
                <input type="hidden" class="acuerdo-id-hidden acuerdo-prov2-hidden" value="">
                <div class="input-group input-group-sm">
                    <input type="text" class="form-control form-control-sm" placeholder="Seleccione..." readonly disabled>
                    <button class="btn btn-outline-secondary btn-buscar-acuerdo-art" type="button" data-tipofondo="TFPROVEDOR" data-slot="2" disabled>
                        <i class="fa-solid fa-magnifying-glass"></i>
                    </button>
                </div>
            </td>

            <!-- td 37: Aporte Rebate -->
            <td class="align-middle"><input type="text" class="form-control form-control-sm text-end aporte-valor aporte-rebate" placeholder="0.00" disabled></td>
            <!-- td 38: Aporte Rebate ID Acuerdo -->
            <td class="align-middle celda-editable">
                <input type="hidden" class="acuerdo-id-hidden acuerdo-rebate-hidden" value="">
                <div class="input-group input-group-sm">
                    <input type="text" class="form-control form-control-sm" placeholder="Seleccione..." readonly disabled>
                    <button class="btn btn-outline-secondary btn-buscar-acuerdo-art" type="button" data-tipofondo="TFREBATE" data-slot="1" disabled>
                        <i class="fa-solid fa-magnifying-glass"></i>
                    </button>
                </div>
            </td>

            <!-- td 39: Aporte Propio -->
            <td class="align-middle celda-editable"><input type="text" class="form-control form-control-sm text-end aporte-valor aporte-propio" placeholder="0.00" disabled></td>
            <!-- td 40: Aporte Propio ID Acuerdo -->
            <td class="align-middle celda-editable">
                <input type="hidden" class="acuerdo-id-hidden acuerdo-propio1-hidden" value="">
                <div class="input-group input-group-sm">
                    <input type="text" class="form-control form-control-sm" placeholder="Seleccione..." readonly disabled>
                    <button class="btn btn-outline-secondary btn-buscar-acuerdo-art" type="button" data-tipofondo="TFPROPIO" data-slot="1" disabled>
                        <i class="fa-solid fa-magnifying-glass"></i>
                    </button>
                </div>
            </td>
            <!-- td 41: Aporte Propio 2 ✅ NUEVO -->
            <td class="align-middle celda-editable"><input type="text" class="form-control form-control-sm text-end aporte-valor aporte-propio2" placeholder="0.00" disabled></td>
            <!-- td 42: Aporte 2 Propio ID Acuerdo ✅ NUEVO -->
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
            <td class="align-middle text-end">0.00%</td>
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
    // RECALCULAR FILA ARTÍCULO (CON NUEVOS CAMPOS)
    // ==========================================
    function recalcularFilaArticulo($fila) {
        const costo = parseCurrency($fila.find("td:eq(2)").text());
        const precioLista = parseCurrency($fila.find("td:eq(25)").text());

        const precioContado = parseCurrency($fila.find("td:eq(26) input").val());
        const precioTC = parseCurrency($fila.find("td:eq(27) input").val());
        const precioCredito = parseCurrency($fila.find("td:eq(28) input").val());
        const precioIgualar = parseCurrency($fila.find("td:eq(29) input").val());

        const aporteProveedor = parseCurrency($fila.find(".aporte-proveedor").val());
        const aporteProveedor2 = parseCurrency($fila.find(".aporte-proveedor2").val());
        const aporteRebate = parseCurrency($fila.find(".aporte-rebate").val());
        const aportePropio = parseCurrency($fila.find(".aporte-propio").val());
        const aportePropio2 = parseCurrency($fila.find(".aporte-propio2").val());

        const otrosCostos = parseFloat($fila.data("total-otros-costos")) || 0;

        const unidadesLimite = parseInt($fila.find("td:eq(22) input").val()) || 0;
        const proyeccionVtas = parseInt($fila.find("td:eq(23) input").val()) || 0;
        const unidades = unidadesLimite > 0 ? unidadesLimite : proyeccionVtas;

        // --- CÁLCULO DE DESCUENTOS (td 30-33) ---
        const dsctoContado = precioLista - precioContado;
        const dsctoTC = precioLista - precioTC;
        const dsctoCredito = precioLista - precioCredito;
        const dsctoIgualar = precioLista - precioIgualar;
        $fila.find("td:eq(30)").text(dsctoContado.toFixed(2));
        $fila.find("td:eq(31)").text(dsctoTC.toFixed(2));
        $fila.find("td:eq(32)").text(dsctoCredito.toFixed(2));
        $fila.find("td:eq(33)").text(dsctoIgualar.toFixed(2));

        // --- MARGEN PRECIO LISTA (td 44) ---
        const margenPL = precioLista > 0 ? ((precioLista - costo) / precioLista * 100) : 0;
        $fila.find("td:eq(44)").text(margenPL.toFixed(2) + "%");

        // --- CÁLCULO DE MÁRGENES (td 45-48) ---
        const calcMargen = (precioPromocion) => {
            const denominador = precioPromocion + aporteProveedor + aporteProveedor2 + aporteRebate;
            if (denominador > 0) {
                return ((denominador - costo - otrosCostos) / denominador) * 100;
            }
            return 0;
        };

        $fila.find("td:eq(45)").text(calcMargen(precioContado).toFixed(2) + "%");
        $fila.find("td:eq(46)").text(calcMargen(precioTC).toFixed(2) + "%");
        $fila.find("td:eq(47)").text(calcMargen(precioCredito).toFixed(2) + "%");
        $fila.find("td:eq(48)").text(calcMargen(precioIgualar).toFixed(2) + "%");

        // --- CÁLCULO DE COMPROMETIDOS ---
        // td 49: Comp. Proveedor
        $fila.find("td:eq(49)").text(formatCurrencySpanish(aporteProveedor * unidades));
        // td 50: Comp. Proveedor 2
        $fila.find("td:eq(50)").text(formatCurrencySpanish(aporteProveedor2 * unidades));
        // td 51: Comp. Rebate
        $fila.find("td:eq(51)").text(formatCurrencySpanish(aporteRebate * unidades));
        // td 52: Comp. Propio
        $fila.find("td:eq(52)").text(formatCurrencySpanish(aportePropio * unidades));
        // td 53: Comp. Propio 2
        $fila.find("td:eq(53)").text(formatCurrencySpanish(aportePropio2 * unidades));

        // --- FORMATO VISUAL (Colores) ---
        $fila.find("td:eq(30), td:eq(31), td:eq(32), td:eq(33), td:eq(44), td:eq(45), td:eq(46), td:eq(47), td:eq(48)").each(function () {
            const valor = parseFloat($(this).text());
            if (valor < 0) {
                $(this).css("color", "#dc3545");
            } else if (valor > 0) {
                $(this).css("color", "#198754");
            } else {
                $(this).css("color", "#212529");
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

                // ✅ NUEVO: Capturar datos de M-12 que faltaban
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

                // ✅ NUEVO: Leer las celdas de Valores Comprometidos
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

                // ✅ MODIFICADO: Formateo de acuerdos incluyendo el "valorcomprometido"
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
                    // ✅ AÑADIDO M-12 al JSON
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

        // --- OTROS COSTOS ---
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
    function initLogicaCombos() {

        // 1. Mostrar la sección de Creación del Combo
        $("#btnNuevoCombo").off("click").on("click", function () {
            // Limpiamos los campos por si había un ingreso previo
            $("#nombreCombo").val("");

            // Generamos un código temporal para el combo (ej: CMB-001) 
            // Esto lo puedes cambiar si el código viene del backend
            let numRandom = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
            $("#codigoCombo").val("CMB-" + numRandom);

            // Desplegamos el panel colapsable usando la API de Bootstrap
            $("#seccionCrearCombo").collapse('show');

            // Opcional: Hacer scroll hacia la sección
            $('html, body').animate({
                scrollTop: $("#seccionCrearCombo").offset().top - 100
            }, 500);
        });

        // 2. Aceptar el Combo y pasarlo a la grilla superior
        $("#btnAceptarCombo").off("click").on("click", function () {
            const codigo = $("#codigoCombo").val();
            const nombre = $("#nombreCombo").val();

            if (!nombre.trim()) {
                Swal.fire("Validación", "Debe ingresar un nombre para el combo.", "warning");
                return;
            }

            // Validar que no exista ya en la tabla
            const existe = $(`#tablaCombosBody tr[data-codigo="${codigo}"]`).length > 0;
            if (existe) {
                Swal.fire("Atención", "Este código de combo ya existe en el detalle.", "warning");
                return;
            }

            // Armamos la fila para la tabla principal de Combos (Respetando tus columnas)
            const filaCombo = `
                <tr data-codigo="${codigo}" class="align-middle">
                    <td class="table-sticky-col" style="background-color: #a4c995;">
                        <input type="radio" class="form-check-input combo-row-radio" name="comboRadioSel">
                        <span class="ms-1 fw-bold">${codigo}</span> - ${nombre}
                    </td>
                    <td class="text-end">$ 0.00</td>
                    <td class="text-end">0</td>
                    <td class="text-end">0</td>
                    <td class="text-end">0</td>
                    <td class="text-end">0</td>
                    <td class="text-end">$ 0.00</td>
                    <td class="celda-editable"><input type="number" class="form-control form-control-sm text-end" placeholder="0"></td>
                    <td class="celda-editable"><input type="number" class="form-control form-control-sm text-end" placeholder="0"></td>
                    <td class="celda-editable">
                        <button type="button" class="btn btn-outline-secondary btn-sm w-100" data-bs-toggle="modal" data-bs-target="#ModalMedioPago">Medios Pago</button>
                    </td>
                    <td class="text-end">$ 0.00</td>
                    <td class="celda-editable"><input type="text" class="form-control form-control-sm text-end" placeholder="$ 0.00"></td>
                    <td class="celda-editable"><input type="text" class="form-control form-control-sm text-end" placeholder="$ 0.00"></td>
                    <td class="celda-editable"><input type="text" class="form-control form-control-sm text-end" placeholder="$ 0.00"></td>
                    <td class="text-end">$ 0.00</td>
                    <td class="text-end">$ 0.00</td>
                    <td class="text-end">$ 0.00</td>
                    <td class="text-end">0.00%</td>
                    <td class="text-end">0.00%</td>
                    <td class="text-end">0.00%</td>
                    <td class="celda-editable"><input type="text" class="form-control form-control-sm text-end" placeholder="$ 0.00"></td>
                    <td class="celda-editable"><input type="text" class="form-control form-control-sm text-end" placeholder="$ 0.00"></td>
                    <td class="celda-editable"><input type="text" class="form-control form-control-sm text-end" placeholder="$ 0.00"></td>
                    <td class="text-center"><input class="form-check-input" type="checkbox"></td>
                </tr>
            `;

            // Agregamos a la tabla
            $("#tablaCombosBody").append(filaCombo);

            // Ocultamos la sección de creación
            $("#seccionCrearCombo").collapse('hide');

            // Mensaje de éxito sutil
            Swal.fire({
                toast: true, position: "top-end", icon: "success", title: "Combo agregado al detalle principal.", showConfirmButton: false, timer: 1500
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

        // 4. Pintar fila al seleccionarla (Radio Button)
        $(document).on("change", ".combo-row-radio", function () {
            $("#tablaCombosBody tr").removeClass("table-active");
            $(this).closest("tr").addClass("table-active");
        });
    }

    // ==========================================
    // LÓGICA DE TABLA TRANSPUESTA DE COMBOS (MODAL) Y EVENTOS
    // ==========================================

    // Bandera global para saber desde qué pestaña abrimos el modal de items
    window.contextoModalItems = "ARTICULOS";

    // Al darle click a "Añadir Artículo" dentro del modal de Combos, cambiamos el contexto
    $(document).on("click", ".btn-add-articulo-combo", function () {
        window.contextoModalItems = "COMBOS";
    });

    // Reiniciar contexto si abren el modal desde "Añadir" en la pestaña Artículos
    $(document).on("click", "#btnAddItemArticulos", function () {
        window.contextoModalItems = "ARTICULOS";
    });

    // Actualizar el título de la columna Combo si escriben el Código y Nombre
    $(document).on("click", "#btnActualizarHeaderCombo", function () {
        const cod = $("#codigoComboModal").val();
        const nom = $("#nombreComboModal").val();
        if (cod && nom) {
            $("#btnHeaderComboTotal").text(`[${cod}] ${nom}`);
        }
    });

    // Función para inyectar una columna nueva en el modal de Combos
    function agregarColumnaACombo(item) {
        // 1. Header con dropdown
        const thHtml = `
        <th scope="col" class="table-dark" style="min-width: 200px;">
            <div class="dropdown">
                <button class="btn btn-dark dropdown-toggle btn-sm border-0 w-100" type="button" data-bs-toggle="dropdown">
                    ${item.codigo} - ${item.descripcion}
                </button>
                <ul class="dropdown-menu">
                    <li><a class="dropdown-item btn-add-articulo-combo" href="#" data-bs-toggle="modal" data-bs-target="#modalConsultaItems"><i class="fa-solid fa-plus"></i> Añadir Artículo</a></li>
                    <li><a class="dropdown-item text-danger btn-eliminar-col-combo" href="#"><i class="fa-solid fa-trash"></i> Eliminar Artículo</a></li>
                </ul>
            </div>
        </th>`;
        $("#trHeadersCombo").append(thHtml);

        const colIndex = $("#trHeadersCombo th").length - 1;

        // 2. Mapear cada fila según data-campo
        $("#tablaCreacionCombo tbody tr").each(function () {
            const campo = $(this).data("campo");
            let html = `<td class="align-middle" data-colindex="${colIndex}">`;

            switch (campo) {
                // === VERDE (consulta - readonly) ===
                case "art_codigo":
                    html += `<input type="text" class="form-control form-control-sm custom-celda-bg" readonly value="${item.codigo}">`; break;
                case "art_descripcion":
                    html += `<input type="text" class="form-control form-control-sm custom-celda-bg" readonly value="${item.descripcion}">`; break;
                case "costo":
                    html += `<input type="text" class="form-control form-control-sm custom-celda-bg text-end" readonly value="${formatCurrencySpanish(item.costo)}">`; break;
                case "stock_bodega":
                    html += `<input type="text" class="form-control form-control-sm custom-celda-bg text-center" readonly value="${item.stock || 0}">`; break;
                case "stock_tienda":
                    html += `<input type="text" class="form-control form-control-sm custom-celda-bg text-center" readonly value="0">`; break;
                case "inv_optimo":
                    html += `<input type="text" class="form-control form-control-sm custom-celda-bg text-center" readonly value="${item.optimo || 0}">`; break;
                case "excedentes_u":
                    html += `<input type="text" class="form-control form-control-sm custom-celda-bg text-center" readonly value="${item.excedenteu || 0}">`; break;
                case "excedentes_usd":
                    html += `<input type="text" class="form-control form-control-sm custom-celda-bg text-end" readonly value="${formatCurrencySpanish(item.excedentes || 0)}">`; break;
                case "m0_u":
                    html += `<input type="text" class="form-control form-control-sm custom-celda-bg text-center" readonly value="${item.m0u || 0}">`; break;
                case "m0_usd":
                    html += `<input type="text" class="form-control form-control-sm custom-celda-bg text-end" readonly value="${formatCurrencySpanish(item.m0s || 0)}">`; break;
                case "m1_u":
                    html += `<input type="text" class="form-control form-control-sm custom-celda-bg text-center" readonly value="${item.m1u || 0}">`; break;
                case "m1_usd":
                    html += `<input type="text" class="form-control form-control-sm custom-celda-bg text-end" readonly value="${formatCurrencySpanish(item.m1s || 0)}">`; break;
                case "m2_u":
                    html += `<input type="text" class="form-control form-control-sm custom-celda-bg text-center" readonly value="${item.m2u || 0}">`; break;
                case "m2_usd":
                    html += `<input type="text" class="form-control form-control-sm custom-celda-bg text-end" readonly value="${formatCurrencySpanish(item.m2s || 0)}">`; break;
                case "m12_u":
                    html += `<input type="text" class="form-control form-control-sm custom-celda-bg text-center" readonly value="${item.m12u || 0}">`; break;
                case "m12_usd":
                    html += `<input type="text" class="form-control form-control-sm custom-celda-bg text-end" readonly value="${formatCurrencySpanish(item.m12s || 0)}">`; break;
                case "igualar_precio":
                    html += `<input type="text" class="form-control form-control-sm custom-celda-bg text-center" readonly value="0">`; break;
                case "dias_antiguedad":
                    html += `<input type="text" class="form-control form-control-sm custom-celda-bg text-center" readonly value="0">`; break;
                case "margen_min_cont":
                case "margen_min_tc":
                case "margen_min_cred":
                case "margen_min_igual":
                    html += `<input type="text" class="form-control form-control-sm custom-celda-bg text-center" readonly value="0%">`; break;

                // === AMARILLO (input) - n/a para componentes ===
                case "unidades_limite":
                case "proyeccion_vta":
                    html += `<input type="text" class="form-control form-control-sm custom-celda-bg text-center" readonly placeholder="-">`; break;
                case "medio_pago":
                    html += `<input type="text" class="form-control form-control-sm custom-celda-bg" readonly placeholder="-">`; break;

                // === VERDE - Precio Lista desde DB ===
                case "precio_lista_contado":
                    html += `<input type="text" class="form-control form-control-sm custom-celda-bg text-end" readonly value="${formatCurrencySpanish(0)}">`; break;
                case "precio_lista_credito":
                    html += `<input type="text" class="form-control form-control-sm custom-celda-bg text-end" readonly value="${formatCurrencySpanish(0)}">`; break;

                // === AMARILLO - Precio Promo (INPUT en componentes) ===
                case "promo_contado":
                    html += `<input type="text" class="form-control form-control-sm text-end input-combo-art" placeholder="$ 0.00">`; break;
                case "promo_tc":
                    html += `<input type="text" class="form-control form-control-sm text-end input-combo-art" placeholder="$ 0.00">`; break;
                case "promo_credito":
                    html += `<input type="text" class="form-control form-control-sm text-end input-combo-art" placeholder="$ 0.00">`; break;

                // === NARANJA - Descuentos (calculados en componentes) ===
                case "dscto_contado":
                case "dscto_tc":
                case "dscto_credito":
                    html += `<input type="text" class="form-control form-control-sm custom-celda-bg text-end" readonly placeholder="">`; break;

                // === AMARILLO - Aportes (INPUT en componentes) ===
                case "aporte_prov":
                case "aporte_prov2":
                case "aporte_rebate":
                case "aporte_propio":
                case "aporte_propio2":
                    html += `<input type="text" class="form-control form-control-sm text-end input-combo-art" placeholder="$ 0.00">`; break;

                // === AMARILLO - Aportes ID Acuerdo (con lupa en componentes) ===
                case "aporte_prov_id":
                case "aporte_prov2_id":
                case "aporte_rebate_id":
                case "aporte_propio_id":
                case "aporte_propio2_id":
                    html += `
                    <div class="input-group input-group-sm">
                        <input type="text" class="form-control" placeholder="Seleccione..." readonly>
                        <button class="btn btn-outline-secondary btn-buscar-acuerdo-combo" type="button"><i class="fa-solid fa-magnifying-glass"></i></button>
                    </div>`; break;

                // === NARANJA - Márgenes (calculados en componentes) ===
                case "margen_pl_contado":
                case "margen_pl_credito":
                case "margen_promo_contado":
                case "margen_promo_tc":
                case "margen_promo_cred":
                    html += `<input type="text" class="form-control form-control-sm custom-celda-bg text-center" readonly placeholder="">`; break;

                // === NARANJA - Comprometidos (calculados en componentes) ===
                case "comp_proveedor":
                case "comp_proveedor2":
                case "comp_rebate":
                case "comp_propio":
                case "comp_propio2":
                    html += `<input type="text" class="form-control form-control-sm text-end" placeholder="$ 0.00">`; break;

                // === Regalo - n/a para componentes ===
                case "regalo":
                    html += `<input type="text" class="form-control form-control-sm custom-celda-bg text-center" readonly placeholder="-">`; break;

                default:
                    html += `<input type="text" class="form-control form-control-sm custom-celda-bg text-center" readonly>`; break;
            }

            html += `</td>`;
            $(this).append(html);
        });
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
                // Borrar encabezado
                $(`#trHeadersCombo th:eq(${colIndex})`).remove();
                // Borrar el td correspondiente en cada fila de datos
                $("#tablaCreacionCombo tbody tr").each(function () {
                    $(this).find(`td:eq(${colIndex})`).remove();
                });
            }
        });
    });

    // ==========================================
    // ESTE EVENTO REEMPLAZA AL QUE TENÍAS ADENTRO DEL $(function() {...})
    // SE ENCARGA DE ENRUTAR LOS ITEMS SELECCIONADOS A LA TABLA CORRECTA
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
                m12u: $c.data("m12u"), m12s: $c.data("m12s")
            });
        });

        if (items.length === 0) {
            Swal.fire("Atención", "Seleccione al menos un item.", "info"); return;
        }

        // 👉 DIRECCIONAMIENTO SEGÚN CONTEXTO (Magia de Combos vs Articulos)
        if (window.contextoModalItems === "COMBOS") {
            // Recorremos los seleccionados y agregamos una columna por cada uno
            items.forEach(item => agregarColumnaACombo(item));
        } else {
            // Comportamiento original para Articulos
            agregarItemsATablaArticulos(items);
        }

        $("#modalConsultaItems").modal("hide");
        $("#checkTodosItems").prop("checked", false);

        // Solo resetear contexto si NO era COMBOS (se resetea en hidden.bs.modal)
        if (window.contextoModalItems !== "COMBOS") {
            window.contextoModalItems = "ARTICULOS";
        }
    });

    // ==========================================
    // INIT
    // ==========================================
    $(function () {
        console.log("=== CrearPromocion JS Loaded ===");

        // 👉 1. AÑADIR CONFIGURACIÓN DE COMBOS AL ARREGLO MÚLTIPLE
        // (Debe ir antes de llamar a initLogicaSeleccionMultiple)
        CONFIG_MULTIPLE.push(
            { id: "canalCombos", select: "#filtroCanalCombos", btnOpen: "#btnCanalCombos", body: "#bodyModalCanal", btnAccept: "#btnAceptarCanal", triggerVal: "3" },
            { id: "grupoCombos", select: "#filtroGrupoAlmacenCombos", btnOpen: "#btnGrupoAlmacenCombos", body: "#bodyModalGrupoAlmacen", btnAccept: "#btnAceptarGrupoAlmacen", triggerVal: "3" },
            { id: "almacenCombos", select: "#filtroAlmacenCombos", btnOpen: "#btnAlmacenCombos", body: "#bodyModalAlmacen", btnAccept: "#btnAceptarAlmacen", triggerVal: "3" }
        );

        // ==========================================
        // LÓGICA DE SELECCIÓN DE FILA (HABILITAR CAMPOS AMARILLOS)
        // ==========================================
        $(document).off("change", ".item-row-radio").on("change", ".item-row-radio", function () {
            $("#tablaArticulosBody tr").removeClass("table-active");
            $("#tablaArticulosBody .celda-editable input, #tablaArticulosBody .celda-editable button, #tablaArticulosBody .celda-editable select").prop("disabled", true);
            $("#tablaArticulosBody .aporte-proveedor, #tablaArticulosBody .aporte-proveedor2, #tablaArticulosBody .aporte-rebate, #tablaArticulosBody .aporte-propio, #tablaArticulosBody .aporte-propio2").prop("disabled", true);
            $("#tablaArticulosBody td:last-child input[type='checkbox']").prop("disabled", true).css("pointer-events", "none");

            const $fila = $(this).closest("tr");
            $fila.addClass("table-active");

            $fila.find(".celda-editable input, .celda-editable button, .celda-editable select").not(".aporte-proveedor, .aporte-proveedor2, .aporte-rebate, .aporte-propio, .aporte-propio2").prop("disabled", false);

            // Habilitar aportes solo si tienen acuerdo seleccionado
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

        // 👉 2. INICIALIZACIÓN SELECT2 PARA COMBOS
        $("#filtroCanalCombos").html($("#filtroCanalGeneral").html());
        aplicarSelect2($("#filtroCanalCombos"));

        $("#filtroGrupoAlmacenCombos").html($("#filtroGrupoAlmacenGeneral").html());
        aplicarSelect2($("#filtroGrupoAlmacenCombos"));

        $("#filtroAlmacenCombos").html($("#filtroAlmacenGeneral").html());
        aplicarSelect2($("#filtroAlmacenCombos"));

        // INICIALIZACIONES GLOBALES
        togglePromocionForm();
        initLogicaArticuloGeneral();
        initLogicaSeleccionMultiple(); // Ahora tomará en cuenta los combos que agregamos arriba
        initValidacionesFinancieras();
        initDatepickers();
        initBotonesServiciosArticulos();

        // 👉 3. LLAMAR A LA LÓGICA DE COMBOS QUE CREAMOS
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

        // 👉 4. EVENTO PARA EL ARCHIVO DE SOPORTE DE COMBOS
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

        $("#btnSeleccionarItems").on("click", function () {
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
                    m12u: $c.data("m12u"), m12s: $c.data("m12s")
                });
            });

            if (items.length === 0) {
                Swal.fire("Atención", "Seleccione al menos un item.", "info"); return;
            }

            agregarItemsATablaArticulos(items);
            $("#modalConsultaItems").modal("hide");
            $("#checkTodosItems").prop("checked", false);
        });

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
                    // Resetear contexto después de re-abrir
                    window.contextoModalItems = "ARTICULOS";
                }, 300);
            }
        });

        // Marcar que el modal de Combos estaba abierto antes de abrir Items
        $(document).on("click", ".btn-add-articulo-combo", function () {
            window.contextoModalItems = "COMBOS";
            $("#modalCrearCombo").data("estaba-abierto", true);
        });
    });
})();