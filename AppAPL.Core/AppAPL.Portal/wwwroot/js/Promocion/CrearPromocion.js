// ~/js/Promocion/CrearPromocion.js

(function () {
    "use strict";

    // ✅ VARIABLES GLOBALES
    let idCatalogoGeneral = null;
    let idCatalogoArticulo = null;
    let idCatalogoCombos = null;

    let proveedorTemporal = null;

    // -----------------------------
    // Helpers base
    // -----------------------------
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

    function isValidDateDDMMYYYY(s) {
        if (!s || !/^\d{2}\/\d{2}\/\d{4}$/.test(s)) return false;
        const [dd, mm, yyyy] = s.split("/").map(Number);
        const d = new Date(yyyy, mm - 1, dd);
        return d.getFullYear() === yyyy && d.getMonth() === mm - 1 && d.getDate() === dd;
    }

    function parseCurrencyToNumber(monedaStr) {
        if (!monedaStr) return 0;
        let v = String(monedaStr).trim();
        v = v.replace(/\$/g, "").replace(/\s/g, "");
        if (!v) return 0;

        const tieneComaDecimal = v.includes(',');
        const tienePuntoDecimal = v.includes('.');

        if (tieneComaDecimal) {
            v = v.replace(/\./g, "").replace(",", ".");
        } else if (tienePuntoDecimal) {
            const partes = v.split('.');
            if (partes.length === 2 && partes[1].length <= 2) {
                // Es decimal
            } else {
                v = v.replace(/\./g, "");
            }
        }
        return parseFloat(v) || 0;
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

    function getTipoPromocion() {
        return $("#promocionTipo").val();
    }

    function togglePromocionForm() {
        const tipo = getTipoPromocion();
        $("#formGeneral").toggle(tipo === "General");
        $("#formArticulos").toggle(tipo === "Articulos");
        $("#formCombos").toggle(tipo === "Combos");
    }

    function manejarErrorGlobal(xhr, accion) {
        console.error(`QA Report - Error al ${accion}:`, xhr.responseText);
        Swal.fire({
            icon: 'error',
            title: 'Error de Comunicación',
            text: `No se pudo completar la acción: ${accion}.`
        });
    }

    // -----------------------------
    // Lógica Específica: Checkbox Artículo vs Jerarquía
    // -----------------------------
    function initLogicaArticuloGeneral() {
        $("#chkArticuloGeneral").on("change", function () {
            const isChecked = $(this).is(":checked");

            $("#articuloGeneral").prop("disabled", !isChecked);
            if (!isChecked) $("#articuloGeneral").val("");

            const $jerarquia = $("#filtroMarcaGeneral, #filtroDivisionGeneral, #filtroDepartamentoGeneral, #filtroClaseGeneral");
            $jerarquia.prop("disabled", isChecked);

            if (isChecked) {
                $jerarquia.val([]);
            }
        });
    }

    // -----------------------------
    // ✅ LÓGICA MODALES (Varios y Lista Específica)
    // -----------------------------
    function initLogicaVariosYArchivos() {
        const setupToggleBtn = (selectId, btnId, triggerVal, modalId) => {
            $(selectId).off("change").on("change", function () {
                const val = $(this).val();
                if (val === triggerVal) {
                    $(btnId).removeClass("d-none");
                    if (modalId) $(modalId).modal("show");
                } else {
                    $(btnId).addClass("d-none");
                }
            });
        };

        // 1. Canal (Varios = 3)
        setupToggleBtn("#filtroCanalGeneral", "#btnCanalGeneral", "3", "#ModalCanal");

        // 2. Grupo Almacén (Varios = 3)
        setupToggleBtn("#filtroGrupoAlmacenGeneral", "#btnGrupoAlmacenGeneral", "3", "#ModalGrupoAlmacen");

        // 3. Almacén (Varios = 3)
        setupToggleBtn("#filtroAlmacenGeneral", "#btnAlmacenGeneral", "3", "#ModalAlmacen");

        // 4. Medio Pago (Varios = 7)
        setupToggleBtn("#filtroMedioPagoGeneral", "#btnMedioPagoGeneral", "7", "#ModalMedioPago");

        // 5. Tipo Cliente (3=Lista, 4=Varios)
        $("#tipoClienteGeneral").off("change").on("change", function () {
            const val = $(this).val();
            if (val === "3" || val === "4") {
                $("#btnListaClienteGeneral").removeClass("d-none");
                $("#ModalClientesEspecificos").modal("show");

                // Auto-check para archivo si es Lista Específica
                if (val === "3") $("#chkSeleccionaFile").prop("checked", true).trigger("change");
                else if (val === "4") $("#chkSeleccionaFile").prop("checked", false).trigger("change");

            } else {
                $("#btnListaClienteGeneral").addClass("d-none");
            }
        });

        // 6. Lógica interna Modal Clientes
        $("#chkSeleccionaFile").on("change", function () {
            const isFileMode = $(this).is(":checked");
            if (isFileMode) {
                $("#txtListaClientes").val("").prop("disabled", true);
                $("#inputFileClientes").prop("disabled", false);
                $("#btnUploadClientes").prop("disabled", false);
            } else {
                $("#txtListaClientes").prop("disabled", false);
                $("#inputFileClientes").val("").prop("disabled", true);
                $("#fileNameClientes").text("Ningún archivo seleccionado");
                $("#btnUploadClientes").prop("disabled", true);
            }
        });

        $("#inputFileClientes").on("change", function () {
            const name = this.files[0] ? this.files[0].name : "Ningún archivo seleccionado";
            $("#fileNameClientes").text(name);
        });
    }

    // -----------------------------
    // CARGA DE DATOS (APIS)
    // -----------------------------
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
            },
            error: function () { $select.html("<option>Error</option>"); }
        });
    }

    function cargarMotivosPromociones(selectId, callback) {
        const idOpcion = getIdOpcionSeguro();
        if (!idOpcion) return;
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
                if (callback) callback();
            },
            error: function () { $select.html("<option>Error</option>"); }
        });
    }

    function cargarFiltrosGeneral() {
        const idOpcion = getIdOpcionSeguro();
        if (!idOpcion) return;

        const $marca = $("#filtroMarcaGeneral");
        const $division = $("#filtroDivisionGeneral");
        const $depto = $("#filtroDepartamentoGeneral");
        const $clase = $("#filtroClaseGeneral");

        const loading = '<option selected>Cargando...</option>';
        $marca.html(loading); $division.html(loading); $depto.html(loading); $clase.html(loading);

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

                const llenar = ($el, items, label) => {
                    $el.empty().append(`<option selected value="">${label}</option>`);
                    if (Array.isArray(items)) {
                        items.forEach(i => $el.append($("<option>", { value: i.codigo, text: i.nombre })));
                    }
                };

                llenar($marca, data.marcas, "Todas");
                llenar($division, data.divisiones, "Todas");
                llenar($depto, data.departamentos, "Todos");
                llenar($clase, data.clases, "Todas");
            },
            error: function () {
                const err = '<option>Error</option>';
                $marca.html(err); $division.html(err); $depto.html(err); $clase.html(err);
            }
        });
    }

    // -----------------------------
    // ✅ CARGAR COMBOS (Canal, Grupo, Almacén, Cliente, Pago)
    // -----------------------------
    function cargarCombosPromociones() {
        const idOpcion = getIdOpcionSeguro();
        if (!idOpcion) return;

        // Selectores
        const $canal = $("#filtroCanalGeneral");
        const $grupo = $("#filtroGrupoAlmacenGeneral");
        const $almacen = $("#filtroAlmacenGeneral");
        const $cliente = $("#tipoClienteGeneral");
        const $medio = $("#filtroMedioPagoGeneral");

        // Loading visual
        const loading = '<option selected>Cargando...</option>';
        $canal.html(loading); $grupo.html(loading);
        $almacen.html(loading); $cliente.html(loading); $medio.html(loading);

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

                // Helper mejorado: Detecta automáticamente 'nombre' o 'descripcion'
                const llenar = ($el, items, opcionesExtra = []) => {
                    $el.empty();
                    if (Array.isArray(items)) {
                        items.forEach(i => {
                            // ✅ CORRECCIÓN: Busca nombre, si no existe usa descripcion, sino codigo
                            const text = i.nombre || i.descripcion || i.codigo;
                            $el.append($("<option>", { value: i.codigo, text: text }));
                        });
                    }
                    // Agrega las opciones manuales (Varios, Lista Específica, etc.)
                    opcionesExtra.forEach(opt => {
                        $el.append($("<option>", { value: opt.val, text: opt.text }));
                    });
                };

                // 1. Canales
                llenar($canal, data.canales, [{ val: "3", text: "Varios" }]);

                // 2. Grupos
                llenar($grupo, data.gruposalmacenes, [{ val: "3", text: "Varios" }]);

                // 3. Almacenes
                llenar($almacen, data.almacenes, [{ val: "3", text: "Varios" }]);

                // 4. Clientes - ✅ CORRECCIÓN: Agregada "Lista Específica" (3) y "Varios" (4)
                llenar($cliente, data.tiposclientes, [
                    { val: "3", text: "Lista Específica" },
                    { val: "4", text: "Varios" }
                ]);

                // 5. Medios Pago - ✅ CORRECCIÓN: El helper ahora detectará 'descripcion' automáticamente
                llenar($medio, data.mediospagos, [{ val: "7", text: "Varios" }]);

                // Disparar change para que la lógica de mostrar/ocultar botones se refresque
                $canal.trigger("change");
                $grupo.trigger("change");
                $almacen.trigger("change");
                $cliente.trigger("change");
                $medio.trigger("change");
            },
            error: function (xhr) {
                console.error("Error combos promos", xhr);
                const err = '<option>Error</option>';
                $canal.html(err); $grupo.html(err);
                $almacen.html(err); $cliente.html(err); $medio.html(err);
            }
        });
    }

    function consultarProveedor() {
        const $tbody = $("#tablaProveedores tbody");
        $tbody.html('<tr><td colspan="13" class="text-center">Cargando...</td></tr>');

        $.ajax({
            url: "/api/apigee-router-proxy",
            method: "POST",
            contentType: "application/json",
            data: JSON.stringify({
                code_app: "APP20260128155212346",
                http_method: "GET",
                endpoint_path: "api/Acuerdo/consultar-fondo-acuerdo",
                client: "APL",
                endpoint_query_params: ""
            }),
            success: function (res) {
                const data = res.json_response || [];
                $tbody.empty();
                if (!data.length) { $tbody.html('<tr><td colspan="13" class="text-center">No hay datos.</td></tr>'); return; }

                const pick = (o, k) => { for (let i of k) if (o[i]) return String(o[i]).trim(); return ""; };
                const fmtDate = (s) => s ? new Date(s).toLocaleDateString("es-EC") : "";

                data.forEach(x => {
                    const idF = pick(x, ["idfondo", "idFondo"]);
                    const row = `<tr class="text-nowrap">
                        <td class="text-center"><input class="form-check-input proveedor-radio" type="radio" name="sp" 
                            data-id="${idF}" data-desc="${pick(x, ["descripcion"])}" data-prov="${pick(x, ["nombre", "proveedor"])}"
                            data-tipo="${pick(x, ["nombre_tipo_fondo"])}" data-disp="${pick(x, ["valordisponible"])}"></td>
                        <td>${idF}</td>
                        <td>${pick(x, ["descripcion", "descripcionFondo"])}</td>
                        <td>${pick(x, ["idproveedor", "ruc"])}</td>
                        <td>${pick(x, ["nombre", "proveedor"])}</td>
                        <td>${pick(x, ["nombre_tipo_fondo", "tipoFondo"])}</td>
                        <td class="text-end">${formatCurrencySpanish(pick(x, ["valorfondo"], 0))}</td>
                        <td>${fmtDate(pick(x, ["fechainidovigencia"]))}</td>
                        <td>${fmtDate(pick(x, ["fechafinvigencia"]))}</td>
                        <td class="text-end">${formatCurrencySpanish(pick(x, ["valordisponible"], 0))}</td>
                        <td class="text-end">${formatCurrencySpanish(pick(x, ["valorcomprometido"], 0))}</td>
                        <td class="text-end">${formatCurrencySpanish(pick(x, ["valorliquidado"], 0))}</td>
                        <td>${pick(x, ["nombre_registro"], "")}</td>
                    </tr>`;
                    $tbody.append(row);
                });

                $(".proveedor-radio").change(function () {
                    $("#tablaProveedores tr").removeClass("table-active");
                    $(this).closest("tr").addClass("table-active");
                    const d = $(this).data();
                    proveedorTemporal = { idFondo: d.id, descripcion: d.desc, proveedor: d.prov, disponible: d.disp, tipoFondo: d.tipo };
                });
            },
            error: function () { $tbody.html('<tr><td colspan="13" class="text-center text-danger">Error.</td></tr>'); }
        });
    }

    function setFondoEnFormActivo(f) {
        const tipo = getTipoPromocion();
        if (tipo === "General") {
            $("#fondoProveedorGeneral").val(f.display);
            $("#fondoProveedorIdGeneral").val(f.idFondo);
            $("#fondoDisponibleHiddenGeneral").val(f.disponible);
        } else if (tipo === "Articulos") {
            $("#fondoProveedorArticulos").val(f.display);
            $("#fondoProveedorIdArticulos").val(f.idFondo);
        } else if (tipo === "Combos") {
            $("#fondoProveedorCombos").val(f.display);
            $("#fondoProveedorIdCombos").val(f.idFondo);
        }
    }

    function initDatepickers() {
        if (!$.datepicker) return;
        const opts = { dateFormat: "dd/mm/yy", changeMonth: true, changeYear: true };
        $("#fechaInicioGeneral, #fechaFinGeneral").datepicker(opts);
        $("#fechaInicioArticulos, #fechaFinArticulos").datepicker(opts);
        $("#fechaInicioCombos, #fechaFinCombos").datepicker(opts);
        $(".btn-outline-secondary:has(.fa-calendar)").click(function () { $(this).parent().find("input[type='text']").datepicker("show"); });
    }

    function initCurrencyItems() {
        $("#fondoValorTotalGeneral").blur(function () {
            $(this).val(formatCurrencySpanish($(this).val().replace(",", ".")));
        });
    }

    function guardarPromocion(tipo) {
        const sufijo = tipo;
        const motivo = $(`#motivo${sufijo}`).val();
        const desc = $(`#descripcion${sufijo}`).val();

        const fechaInicio = getFullISOString(`#fechaInicio${sufijo}`, `#timeInicio${sufijo}`);
        const fechaFin = getFullISOString(`#fechaFin${sufijo}`, `#timeFin${sufijo}`);
        
        if (!motivo || !desc) { Swal.fire("Error", "Faltan datos", "warning"); return; }
        if (!fechaInicio || !fechaFin) { Swal.fire("Error", "Fechas inválidas", "warning"); return; }


        const body = {
            "tipoclaseetiqueta": "PRGENERAL", // modificar segun el parametro
            "idopcion": getIdOpcionSeguro(),
            "idcontrolinterfaz": "BTNGRABAR",
            "ideventoetiqueta": "EVCLICK",
            "promocion": {
                "descripcion": $("#descripcionGeneral").val(),
                "motivo": parseInt($("#motivoGeneral").val(), 10) || 0,
                "clasepromocion": 1,
                "fechahorainicio": fechaInicio,
                "fechahorafin": fechaFin,
                "marcaregalo": $("#regaloGeneral").val(),
                "marcaprocesoaprobacion": "",
                "idusuarioingreso": getUsuario(),
                "nombreusuario": getUsuario(),
            },
            "acuerdos": [
                { "idacuerdo": 6, "porcentajedescuento": 15.00, "valorcomprometido": 10000.00 },
                { "idacuerdo": 8, "porcentajedescuento": 5.00, "valorcomprometido": 2500.00 }
            ],
            "segmentos": [
                { "tiposegmento": "SEGMARCA", "tipoasignacion": "T", "codigos": [] },
                { "tiposegmento": "SEGDIVISION", "tipoasignacion": "C", "codigos": ["DIV01", "DIV02"] }
            ]
        };

        const payload = {
            code_app: "APP20260128155212346",
            http_method: "POST",
            endpoint_path: "/api/promocion/insertar",
            //endpoint_query_params: "",
            client: "APL",
            body_request: body
        }

        var formData = new FormData();
        var fileInput = $('#inputGroupFile24')[0].files[0];


        formData.append("ArchivoSoporte", fileInput);
        formData.append("RouterRequestJson", JSON.stringify(payload));

        console.log('body: ', payload);

        Swal.fire({ title: 'Guardando...', didOpen: () => Swal.showLoading() });


        $.ajax({
            url: "/api/apigee-router-proxy",
            method: "POST",
            processData: false,
            contentType: false,
            data: formData,
            success: function (res) {
                if (res?.code_status === 200) Swal.fire("Éxito", "Guardado", "success");
                else Swal.fire("Error", res?.json_response?.mensaje || "Fallo", "error");
            },
            error: function () { Swal.fire("Error", "Error de comunicación", "error"); }
        });
    }

    function gestionarCambioArchivo(input) {
        const fileNameSpan = document.getElementById('fileName');

        // 1. Validar si hay un archivo seleccionado
        if (!input.files || input.files.length === 0) {
            fileNameSpan.textContent = "Ningún archivo seleccionado";
            return;
        }

        const archivo = input.files[0];
        const maxMB = parseFloat(input.getAttribute('data-max-mb')) || 5;
        const maxBytes = maxMB * 1024 * 1024;

        // 2. Validar Tamaño
        if (archivo.size > maxBytes) {
            alert(`El archivo "${archivo.name}" es muy pesado. El límite es de ${maxMB}MB.`);

            // Resetear el input y el texto
            input.value = "";
            fileNameSpan.textContent = "Ningún archivo seleccionado";
            return;
        }

        // 3. Si todo está bien, actualizar el nombre (tu lógica original)
        fileNameSpan.textContent = archivo.name;

        console.log("Archivo validado y listo:", archivo.name);
    }

    // -----------------------------
    // ✅ INIT PRINCIPAL
    // -----------------------------
    $(document).ready(function () {
        console.log("=== CrearPromocion INIT Completo ===");

        togglePromocionForm();
        initLogicaArticuloGeneral();
        initLogicaVariosYArchivos(); // Activa botones/modales

        $("#promocionTipo").change(function () {
            togglePromocionForm();
            const tipo = getTipoPromocion();
            if (tipo === "Articulos" && $("#motivoArticulos option").length <= 1) cargarMotivosPromociones("#motivoArticulos");
            if (tipo === "Combos" && $("#motivoCombos option").length <= 1) cargarMotivosPromociones("#motivoCombos");
        });

        // Carga Inicial en Cadena
        $.get("/config").done(function (config) {
            window.apiBaseUrl = config.apiBaseUrl;

            cargarTiposPromocion(function () {
                cargarMotivosPromociones("#motivoGeneral");
                cargarFiltrosGeneral();        // Carga Marca/Div/Depto/Clase
                cargarCombosPromociones();     // ✅ Carga Canal/Almacen/Cliente/Pago
            });
        }).fail(function () {
            cargarTiposPromocion(function () {
                cargarMotivosPromociones("#motivoGeneral");
                cargarFiltrosGeneral();
                cargarCombosPromociones();
            });
        });

        initDatepickers();
        initCurrencyItems();

        $("#btnGuardarPromocionGeneral").click(() => guardarPromocion("General"));

        $("#modalConsultaProveedor").on("show.bs.modal", () => { proveedorTemporal = null; consultarProveedor(); });
        $("#btnAceptarProveedor").click(() => {
            if (!proveedorTemporal) return;
            const display = `${proveedorTemporal.idFondo} - ${proveedorTemporal.proveedor}`;
            setFondoEnFormActivo({ ...proveedorTemporal, display });
            $("#modalConsultaProveedor").modal("hide");
        });

        $("#btnAddItemArticulos, #btnAddItemCombos").click((e) => {
            e.preventDefault();
            $("#modalConsultaItems").modal("show");
        });

        $(".btn-secondary[id^='btnCancelar']").click(() => location.reload());

        // Conectamos el evento change a nuestra función externa
        $('#inputGroupFile24').on('change', function () {
            gestionarCambioArchivo(this); // 'this' le pasa el elemento del input a la función
        });
    });
})();
