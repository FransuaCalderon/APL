// ~/js/Acuerdo/ModificarAcuerdo.js

// ===============================================================
// Variables globales
// ===============================================================
let tabla;
let ultimaFilaModificada = null;
let proveedorTemporal = null;
let idCatalogoGeneral = null;
let idCatalogoArticulo = null;
let tipoAcuerdo = null;
let acuerdoTemporal = null;
let dtItemsConsulta = null;
// ✅ NUEVAS VARIABLES - DataTables y caché para proveedores
let dtProveedoresAcuerdo = null;
let cacheProveedoresAcuerdo = null;

// ===============================================================
// FUNCIONES HELPER
// ===============================================================
function obtenerUsuarioActual() {
    return window.usuarioActual || sessionStorage.getItem('usuarioActual') || "admin";
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

function getIdCatalogoActual() {
    const tipoAcuerdo = getTipoAcuerdo();

    if (tipoAcuerdo === "General") {
        return idCatalogoGeneral;
    } else if (tipoAcuerdo === "Items") {
        return idCatalogoArticulo;
    }

    console.error("❌ Tipo de acuerdo no válido:", tipoAcuerdo);
    return null;
}

function getTipoAcuerdo() {
    return $("#acuerdoTipo").val();
}

function manejarErrorGlobal(xhr, accion) {
    console.error(`Error al ${accion}:`, xhr.responseText);
    Swal.fire({
        icon: 'error',
        title: 'Error de Comunicación',
        text: `No se pudo completar la acción: ${accion}.`
    });
}

function isValidDateDDMMYYYY(s) {
    if (!s || !/^\d{2}\/\d{2}\/\d{4}$/.test(s)) return false;
    const [dd, mm, yyyy] = s.split("/").map(Number);
    const d = new Date(yyyy, mm - 1, dd);
    return d.getFullYear() === yyyy && d.getMonth() === mm - 1 && d.getDate() === dd;
}

function toISOFromDDMMYYYY(s) {
    const [dd, mm, yyyy] = s.split("/").map(Number);
    const d = new Date(yyyy, mm - 1, dd);
    return d.toISOString().split('T')[0];
}

function compareDatesDDMMYYYY(a, b) {
    const [da, ma, ya] = a.split("/").map(Number);
    const [db, mb, yb] = b.split("/").map(Number);
    return new Date(ya, ma - 1, da).getTime() - new Date(yb, mb - 1, db).getTime();
}

function parseCurrencyToNumber(monedaStr) {
    if (!monedaStr) return 0;

    let v = String(monedaStr)
        .replace(/\$/g, "")
        .replace(/\s/g, "")
        .replace(/\./g, "");

    v = v.replace(",", ".");
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

function formatearFecha(fechaString) {
    if (!fechaString) return "";
    const fecha = new Date(fechaString);
    if (isNaN(fecha.getTime())) return "Fecha inválida";

    const dia = fecha.getUTCDate().toString().padStart(2, '0');
    const mes = (fecha.getUTCMonth() + 1).toString().padStart(2, '0');
    const anio = fecha.getUTCFullYear();

    return `${dia}/${mes}/${anio}`;
}

function formatearMoneda(valor) {
    var numero = parseFloat(valor);
    if (isNaN(numero) || valor === null || valor === undefined) {
        return "$ 0.00";
    }
    return '$ ' + numero.toLocaleString('es-EC', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

// ===============================================================
// DOCUMENT READY
// ===============================================================
$(document).ready(function () {
    console.log("=== INICIO - ModificarAcuerdo (Estructura Post-REST) ===");

    toggleAcuerdoForm();

    $.get("/config", function (config) {
        window.apiBaseUrl = config.apiBaseUrl;
        cargarBandeja();
        cargarTiposAcuerdo(function () {
            cargarMotivosGeneral();
            cargarMotivosItems();
        });
    }).fail(function (xhr) {
        console.error("ERROR /config:", xhr.status, xhr.responseText);
        Swal.fire({
            icon: "error",
            title: "Error",
            text: "No se pudo cargar /config.",
        });
    });

    // ✅ Modal Proveedores - ACTUALIZADO: llama consultarProveedor() al abrir
    $("#modalConsultaProveedor").on("show.bs.modal", function () {
        $("#buscarProveedorInputAcuerdo").val("");
        proveedorTemporal = null;
        consultarProveedor();
    });

    $("#modalConsultaProveedor").on("hidden.bs.modal", function () {
        proveedorTemporal = null;
    });

    $("#btnGuardarCambios").on("click", function () {
        btnGuardarCambios();
    });

    $("#btnAceptarProveedor").on("click", function () {
        const $selected = $("#tablaProveedores tbody input[name='selectProveedor']:checked");

        if ($selected.length === 0) {
            Swal.fire({
                icon: "info",
                title: "Atención",
                text: "Debe seleccionar un proveedor de la tabla.",
                confirmButtonColor: "#009845"
            });
            return;
        }

        // ✅ Si no hizo click manual (venía pre-seleccionado), reconstruir temporal
        if (!proveedorTemporal) {
            proveedorTemporal = {
                idFondo: $selected.data("idfondo"),
                descripcion: $selected.data("descripcion"),
                proveedor: $selected.data("proveedor"),
                ruc: $selected.data("ruc"),
                disponible: $selected.data("disponible"),
                comprometido: $selected.data("comprometido"),
                liquidado: $selected.data("liquidado"),
            };
        }

        const display = `${proveedorTemporal.idFondo} - (${proveedorTemporal.proveedor})`;

        console.log("✅ Proveedor confirmado:", {
            idFondo: proveedorTemporal.idFondo,
            proveedor: proveedorTemporal.proveedor,
            disponible: proveedorTemporal.disponible,
        });

        setFondoEnFormActivo({
            idFondo: proveedorTemporal.idFondo,
            display: display,
            ruc: proveedorTemporal.ruc,
            disponible: proveedorTemporal.disponible,
            comprometido: proveedorTemporal.comprometido,
            liquidado: proveedorTemporal.liquidado,
        });

        Swal.fire({
            toast: true,
            position: "top-end",
            icon: "success",
            title: "Proveedor seleccionado",
            showConfirmButton: false,
            timer: 1500,
        });

        $("#modalConsultaProveedor").modal("hide");
        proveedorTemporal = null;
    });

    $("#modalConsultaProveedor .btn-secondary, #modalConsultaProveedor .btn-close").on("click", function () {
        proveedorTemporal = null;
    });

    // Modal Items
    $("#modalConsultaItems").on("show.bs.modal", function () {
        cargarFiltrosItems();
        $("#checkTodosItems").prop("checked", false); // Desmarca siempre

        if (!dtItemsConsulta) {
            dtItemsConsulta = $("#tablaItemsConsulta").DataTable({
                data: [],
                columns: [
                    { title: "Sel", className: "text-center align-middle", orderable: false, searchable: false },
                    { title: "Codigo", className: "align-middle" },
                    { title: "Descripcion", className: "align-middle" },
                    { title: "Costo", className: "align-middle text-end" },
                    { title: "Stock", className: "align-middle text-center" },
                    { title: "Optimo", className: "align-middle text-center" },
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
                    search: "Buscar:",
                    emptyTable: `<div class="text-center text-muted p-4">
                                <i class="fa-solid fa-filter"></i><br>
                                Seleccione los criterios de búsqueda y presione <strong>"Procesar Selección"</strong>
                             </div>`,
                    zeroRecords: "No se encontraron items.",
                    info: "Mostrando _START_ a _END_ de _TOTAL_ items",
                    infoEmpty: "Sin items",
                    paginate: { first: "«", last: "»", next: "›", previous: "‹" }
                },
                order: [[1, 'asc']],
                initComplete: function () {
                    const wrapper = $("#tablaItemsConsulta_wrapper");
                    wrapper.find(".dataTables_paginate, .dataTables_info").attr("style", "text-align:center !important; float:none !important; display:block !important; width:100% !important; padding-top:0.5rem;");
                }
            });
        }

        dtItemsConsulta.clear().draw();
    });

    $("#checkTodosItems").on("change", function () {
        const isChecked = $(this).is(":checked");
        if (dtItemsConsulta) {
            $(dtItemsConsulta.$(".item-checkbox")).prop("checked", isChecked);
        }
    });

    $("#btnProcesarFiltros").on("click", function () {
        console.log("🔍 Procesando filtros...");

        const marcasSeleccionadas = getSelectedFilterValues('filtroMarca');
        const divisionesSeleccionadas = getSelectedFilterValues('filtroDivision');
        const departamentosSeleccionados = getSelectedFilterValues('filtroDepartamento');
        const clasesSeleccionadas = getSelectedFilterValues('filtroClase');
        const articuloBuscado = $("#filtroArticulo").val().trim();

        if (marcasSeleccionadas.length === 0 &&
            divisionesSeleccionadas.length === 0 &&
            departamentosSeleccionados.length === 0 &&
            clasesSeleccionadas.length === 0 &&
            articuloBuscado === '') {

            Swal.fire({
                icon: 'warning',
                title: 'Atención',
                text: 'Debe seleccionar al menos un criterio de búsqueda',
                confirmButtonColor: '#009845'
            });
            return;
        }

        const filtros = {
            marcas: marcasSeleccionadas.length > 0 ? marcasSeleccionadas : [],
            divisiones: divisionesSeleccionadas.length > 0 ? divisionesSeleccionadas : [],
            departamentos: departamentosSeleccionados.length > 0 ? departamentosSeleccionados : [],
            clases: clasesSeleccionadas.length > 0 ? clasesSeleccionadas : [],
            codigoarticulo: articuloBuscado || '',
        };

        console.log("📋 Filtros aplicados:", filtros);

        Swal.fire({
            toast: true,
            position: "top-end",
            icon: "info",
            title: "Aplicando filtros...",
            showConfirmButton: false,
            timer: 1000,
        });

        consultarItems(filtros);
    });

    $("#btnLimpiarFiltros").on("click", function () {
        limpiarFiltros();
    });

    $("#btnSeleccionarItems").on("click", function () {
        const itemsSeleccionados = [];

        $("#tablaItemsConsulta tbody .item-checkbox:checked").each(function () {
            const $checkbox = $(this);
            itemsSeleccionados.push({
                codigo: $checkbox.data("codigo"),
                descripcion: $checkbox.data("descripcion"),
                costo: $checkbox.data("costo"),
                stock: $checkbox.data("stock"),
                optimo: $checkbox.data("optimo"),
            });
        });

        if (itemsSeleccionados.length === 0) {
            Swal.fire("Atención", "Seleccione al menos un item.", "info");
            return;
        }

        agregarItemsATabla(itemsSeleccionados);
        $("#modalConsultaItems").modal("hide");

        $("#checkTodosItems").prop("checked", false);
        $("#tablaItemsConsulta tbody .item-checkbox").prop("checked", false);
    });

    $("#btnAddItem").on("click", function (e) {
        e.preventDefault();
        $("#modalConsultaItems").modal("show");
    });

    $("#btnModifyItem").on("click", function (e) {
        e.preventDefault();
        modificarItemSeleccionado();
    });

    $("#btnDeleteItem").on("click", function (e) {
        e.preventDefault();
        eliminarItemSeleccionado();
    });

    initDatepickers();
    initCurrencyGeneral();
    initCurrencyItems();

    $("#btnGuardarAcuerdoGeneral").on("click", function (e) {
        e.preventDefault();
        guardarGeneral();
    });

    $("#btnGuardarAcuerdoItems").on("click", function (e) {
        e.preventDefault();
        guardarItems();
    });

    $("#formGeneral button.btn-secondary").on("click", function (e) {
        e.preventDefault();

        Swal.fire({
            title: '¿Está seguro?',
            html: 'Se perderán todos los datos ingresados en el formulario <strong>GENERAL</strong>',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'Sí, Cancelar',
            cancelButtonText: 'No, Continuar'
        }).then((result) => {
            if (result.isConfirmed) {
                $("#acuerdoTipoGeneral").val("");
                $("#fondoProveedorGeneral").val("Seleccione...");
                $("#fondoProveedorIdGeneral").val("");
                $("#acuerdoDescripcionGeneral").val("");
                $("#acuerdoFechaInicioGeneral").val("");
                $("#acuerdoFechaFinGeneral").val("");
                $("#acuerdoValorTotalGeneral").val("");
                $("#acuerdoDisponibleGeneral").val("");

                Swal.fire({
                    toast: true,
                    position: 'top-end',
                    icon: 'info',
                    title: 'Formulario limpiado',
                    showConfirmButton: false,
                    timer: 1500
                });
            }
        });
    });

    $("#formItems button.btn-secondary").on("click", function (e) {
        e.preventDefault();

        Swal.fire({
            title: '¿Está seguro?',
            html: 'Se perderán todos los datos ingresados en el formulario de <strong>ARTÍCULOS</strong><br><small class="text-muted">Incluyendo el detalle de items agregados</small>',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'Sí, Cancelar',
            cancelButtonText: 'No, Continuar'
        }).then((result) => {
            if (result.isConfirmed) {
                $("#acuerdoTipoItems").val("");
                $("#fondoProveedorItems").val("Seleccione...");
                $("#fondoProveedorIdItems").val("");
                $("#acuerdoDescripcionItems").val("");
                $("#acuerdoFechaInicioItems").val("");
                $("#acuerdoFechaFinItems").val("");
                $("#acuerdoValorTotalItems").val("");
                $("#tablaItemsBody").empty();

                $("#acuerdoTipo").val("General").trigger("change");

                Swal.fire({
                    toast: true,
                    position: 'top-end',
                    icon: 'info',
                    title: 'Formulario limpiado',
                    showConfirmButton: false,
                    timer: 1500
                });
            }
        });
    });

    // Eventos de Navegación
    $('#btnVolverTabla, #btnVolverAbajo').on('click', function () {
        cerrarDetalle();
    });

    // Botón Limpiar Filtros
    $('body').on('click', '#btnLimpiar', function () {
        if (tabla) {
            tabla.search('').draw();
        }
    });

    $("#buscarItemAgregado").on("keyup", function () {
        const value = $(this).val().toLowerCase();
        $("#tablaItemsBody tr").filter(function () {
            // Busca en toda la fila (o si tienes clase td-descripcion, la aplicas)
            $(this).toggle($(this).text().toLowerCase().indexOf(value) > -1)
        });
    });
});

function btnGuardarCambios() {
    if (tipoAcuerdo) {
        switch (tipoAcuerdo) {
            case "CLAGENERAL":
                guardarGeneral();
                break;
            case "CLAARTICULO":
                guardarItems();
                break;
        }
    }
}

// ===================================================================
// FUNCIONES DE CARGA - MIGRADAS A APIGEE PROXY
// ===================================================================

function cargarBandeja() {
    const idOpcionActual = getIdOpcionSeguro() || "0";
    const usuario = obtenerUsuarioActual();

    const payload = {
        code_app: "APP20260128155212346",
        http_method: "GET",
        endpoint_path: "api/Acuerdo/consultar-bandeja-modificacion",
        client: "APL",
        endpoint_query_params: ""
    };

    $.ajax({
        url: "/api/apigee-router-proxy",
        method: "POST",
        contentType: "application/json",
        data: JSON.stringify(payload),
        success: function (response) {
            if (response && response.code_status === 200) {
                const data = response.json_response || [];
                crearListado(data);
                cargarTiposAcuerdo();
            } else {
                Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo cargar la bandeja' });
            }
        },
        error: (xhr) => manejarErrorGlobal(xhr, "cargar la bandeja de modificación")
    });
}

// ===================================================================
// ✅ CONSULTAR PROVEEDOR - REESCRITO CON DATATABLES, CACHÉ Y BÚSQUEDA
// ===================================================================
function consultarProveedor() {
    const idOpcionActual = getIdOpcionSeguro();

    if (!idOpcionActual) {
        Swal.fire({
            icon: "error",
            title: "Error",
            text: "No se pudo obtener el ID de la opción. Ingrese nuevamente desde el menú.",
        });
        return;
    }

    // ✅ Obtener idFondo actualmente seleccionado en el formulario activo
    const tipoAcuerdoActivo = getTipoAcuerdo();
    let idFondoActualFormulario = "";

    if (tipoAcuerdoActivo === "General") {
        idFondoActualFormulario = $("#fondoProveedorIdGeneral").val();
    } else {
        idFondoActualFormulario = $("#fondoProveedorIdItems").val();
    }

    const pick = (obj, keys, def = "") => {
        for (const k of keys) {
            const v = obj?.[k];
            if (v != null && String(v).trim() !== "") return String(v).trim();
        }
        return def;
    };

    const toNumber = (v) => {
        const n = Number(v);
        return Number.isFinite(n) ? n : 0;
    };

    const fmtMoney = (v) =>
        toNumber(v).toLocaleString("es-EC", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const fmtDate = (iso) => {
        if (!iso) return "";
        const d = new Date(iso);
        if (isNaN(d.getTime())) return "";
        return new Intl.DateTimeFormat("es-EC", { year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
    };

    const esc = (s) =>
        String(s ?? "")
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#39;");

    // ✅ Función interna que renderiza con DataTables
    function renderizarTabla(data) {
        const filas = data.map((x) => {
            const idFondo = pick(x, ["idfondo", "idFondo"]);
            const descripcion = pick(x, ["descripcion", "descripcionFondo", "nombreFondo"]);
            const ruc = pick(x, ["idproveedor", "ruc", "identificacion"]);
            const proveedor = pick(x, ["nombre", "proveedor", "nombreProveedor", "razonSocialProveedor"], "");
            const tipoFondo = pick(
                x,
                ["tipoFondo", "tipoFondoDescripcion", "descTipoFondo"],
                pick(x, ["nombre_tipo_fondo", "idtipofondo", "idTipoFondo"])
            );

            const valorFondo = fmtMoney(pick(x, ["valorfondo", "valorFondo", "montoFondo"], 0));
            const fechaInicio = fmtDate(
                pick(x, ["fechainidovigencia", "fechainicio", "fechaInicio", "fechaIniVigencia"])
            );
            const fechaFin = fmtDate(
                pick(x, ["fechafinvigencia", "fechafin", "fechaFin", "fechaFinVigencia"])
            );

            const disponible = fmtMoney(pick(x, ["valordisponible", "valorDisponible"], 0));
            const comprometido = fmtMoney(pick(x, ["valorcomprometido", "valorComprometido"], 0));
            const liquidado = fmtMoney(pick(x, ["valorliquidado", "valorLiquidado"], 0));

            const estado = pick(
                x,
                ["estado", "descEstado", "nombre_registro", "nombreRegistro"],
                pick(x, ["idestadoregistro", "idEstadoRegistro"])
            );

            // ✅ Pre-seleccionar el proveedor que ya está en el formulario
            const isChecked = (String(idFondo) === String(idFondoActualFormulario)) ? 'checked' : '';

            return [
                `<input class="form-check-input proveedor-radio" type="radio" name="selectProveedor"
                    data-idfondo="${esc(idFondo)}"
                    data-descripcion="${esc(descripcion)}"
                    data-ruc="${esc(ruc)}"
                    data-proveedor="${esc(proveedor)}"
                    data-idtipofondo="${esc(pick(x, ["idtipofondo", "idTipoFondo"]))}"
                    data-tipofondo="${esc(tipoFondo)}"
                    data-valorfondo="${esc(pick(x, ["valorfondo", "valorFondo"]))}"
                    data-fechainicio="${esc(pick(x, ["fechainidovigencia", "fechainicio", "fechaInicio"]))}"
                    data-fechafin="${esc(pick(x, ["fechafinvigencia", "fechafin", "fechaFin"]))}"
                    data-disponible="${esc(pick(x, ["valordisponible", "valorDisponible"]))}"
                    data-comprometido="${esc(pick(x, ["valorcomprometido", "valorComprometido"]))}"
                    data-liquidado="${esc(pick(x, ["valorliquidado", "valorLiquidado"]))}"
                    data-estado="${esc(estado)}"
                    ${isChecked}>`,
                esc(idFondo),
                esc(descripcion),
                esc(ruc),
                esc(proveedor),
                esc(tipoFondo),
                esc(valorFondo),
                esc(fechaInicio),
                esc(fechaFin),
                esc(disponible),
                esc(comprometido),
                esc(liquidado),
                esc(estado)
            ];
        });

        // Destruir DataTable anterior si existe
        if (dtProveedoresAcuerdo) {
            dtProveedoresAcuerdo.destroy();
            $("#tablaProveedores tbody").empty();
        }

        // ✅ Inicializar DataTables con paginación y búsqueda
        dtProveedoresAcuerdo = $("#tablaProveedores").DataTable({
            data: filas,
            columns: [
                { title: "Sel.", className: "text-center align-middle", orderable: false, searchable: false },
                { title: "IDFondo", className: "align-middle" },
                { title: "Descripción", className: "align-middle" },
                { title: "RUC", className: "align-middle" },
                { title: "Proveedor", className: "align-middle" },
                { title: "Tipo Fondo", className: "align-middle" },
                { title: "$ Fondo", className: "align-middle text-end" },
                { title: "Fecha Inicio", className: "align-middle" },
                { title: "Fecha Fin", className: "align-middle" },
                { title: "$ Disponible", className: "align-middle text-end" },
                { title: "$ Comprometido", className: "align-middle text-end" },
                { title: "$ Liquidado", className: "align-middle text-end" },
                { title: "Estado", className: "align-middle" }
            ],
            deferRender: true,
            pageLength: 10,
            lengthChange: false,
            dom: '<"row"<"col-12"tr>><"row"<"col-12 text-center"i>><"row"<"col-12 d-flex justify-content-center"p>>',
            language: {
                search: "Buscar:",
                zeroRecords: "No se encontraron fondos de proveedor.",
                info: "Mostrando _START_ a _END_ de _TOTAL_ fondos",
                infoEmpty: "Sin fondos",
                infoFiltered: "(filtrado de _MAX_ totales)",
                paginate: { first: "«", last: "»", next: "›", previous: "‹" }
            },
            order: [[1, 'desc']],
            initComplete: function () {
                const wrapper = $("#tablaProveedores_wrapper");
                wrapper.find(".dataTables_paginate").attr("style", "text-align:center !important; float:none !important; display:block !important; width:100% !important; padding-top:0.5rem;");
                wrapper.find(".dataTables_info").attr("style", "text-align:center !important; float:none !important; display:block !important; width:100% !important; font-size:0.8rem; padding-top:0.5rem;");
            },
            drawCallback: function () {
                const wrapper = $("#tablaProveedores_wrapper");
                wrapper.find(".dataTables_paginate").attr("style", "text-align:center !important; float:none !important; display:block !important; width:100% !important; padding-top:0.5rem;");
            }
        });

        // ✅ Resaltar fila pre-seleccionada
        $("#tablaProveedores tbody input[name='selectProveedor']:checked").closest("tr").addClass("table-active");

        // ✅ Vincular búsqueda al input del modal
        $("#buscarProveedorInputAcuerdo").off("keyup").on("keyup", function () {
            dtProveedoresAcuerdo.search($(this).val()).draw();
        });

        // ✅ Inicializar selección de filas
        initProveedorRowSelection();
    }

    // ✅ Si ya tenemos datos en caché, no volvemos a consultar
    if (cacheProveedoresAcuerdo) {
        renderizarTabla(cacheProveedoresAcuerdo);
        return;
    }

    const $tbody = $("#tablaProveedores tbody");
    $tbody.empty().append('<tr><td colspan="13" class="text-center">Cargando...</td></tr>');

    const payload = {
        code_app: "APP20260128155212346",
        http_method: "GET",
        endpoint_path: "api/Acuerdo/consultar-fondo-acuerdo",
        client: "APL",
        endpoint_query_params: ""
    };

    $.ajax({
        url: "/api/apigee-router-proxy",
        method: "POST",
        contentType: "application/json",
        data: JSON.stringify(payload),
        success: function (response) {
            const data = response.json_response || [];
            console.log("Datos fondo-acuerdo:", data);

            cacheProveedoresAcuerdo = data; // ✅ Almacenar en caché
            renderizarTabla(data);
        },
        error: (xhr) => {
            console.error("Error fondo-acuerdo:", xhr.responseText);
            $tbody.empty().append(
                '<tr><td colspan="13" class="text-center text-danger">Error al cargar datos.</td></tr>'
            );
        }
    });
}

function consultarItems(filtros = {}) {
    const idOpcionActual = getIdOpcionSeguro();
    if (!idOpcionActual) {
        Swal.fire({ icon: "error", title: "Error", text: "No se pudo obtener el ID de la opción." });
        return;
    }

    const esc = (s) => String(s ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");

    if (dtItemsConsulta) {
        dtItemsConsulta.clear().draw();
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
        success: function (response) {
            const data = response.json_response || [];

            const filas = data.map((item) => {
                return [
                    `<input type="checkbox" class="form-check-input item-checkbox"
                        data-codigo="${esc(item.codigo || item.iditem || "")}"
                        data-descripcion="${esc(item.descripcion || item.nombre || "")}"
                        data-costo="${esc(item.costo || 0)}"
                        data-stock="${esc(item.stock || 0)}"
                        data-optimo="${esc(item.optimo || 0)}">`,
                    esc(item.codigo || item.iditem || ""),
                    esc(item.descripcion || item.nombre || ""),
                    formatCurrencySpanish(item.costo || 0),
                    esc(item.stock || 0),
                    esc(item.optimo || 0),
                    esc(item.excedente_u || 0),
                    formatCurrencySpanish(item.excedente_s || 0),
                    esc(item.m0_u || 0),
                    formatCurrencySpanish(item.m0_s || 0),
                    esc(item.m1_u || 0),
                    formatCurrencySpanish(item.m1_s || 0),
                    esc(item.m2_u || 0),
                    formatCurrencySpanish(item.m2_s || 0)
                ];
            });

            if (dtItemsConsulta) {
                dtItemsConsulta.clear();
                dtItemsConsulta.rows.add(filas);
                dtItemsConsulta.draw();
                if (filas.length === 0) $('.dataTables_empty').text("No se encontraron items con los criterios seleccionados.");
            }

            $("#buscarItemInputAcuerdo").off("keyup").on("keyup", function () {
                if (dtItemsConsulta) dtItemsConsulta.search($(this).val()).draw();
            });
        },
        error: (xhr) => {
            if (dtItemsConsulta) {
                dtItemsConsulta.clear().draw();
                $('.dataTables_empty').html('<span class="text-danger">Error al cargar items.</span>');
            }
        }
    });
}

function cargarFiltrosItems() {
    const idOpcionActual = getIdOpcionSeguro();

    if (!idOpcionActual) return;

    console.log("📥 Cargando filtros desde consultar-combos...");

    $("#filtroMarca").html('<div class="text-center"><small class="text-muted">Cargando...</small></div>');
    $("#filtroDivision").html('<div class="text-center"><small class="text-muted">Cargando...</small></div>');
    $("#filtroDepartamento").html('<div class="text-center"><small class="text-muted">Cargando...</small></div>');
    $("#filtroClase").html('<div class="text-center"><small class="text-muted">Cargando...</small></div>');

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
        success: function (response) {
            const data = response.json_response || {};
            console.log("✅ Datos de combos recibidos:", data);

            $("#filtroMarca").empty();
            $("#filtroDivision").empty();
            $("#filtroDepartamento").empty();
            $("#filtroClase").empty();

            if (Array.isArray(data.marcas) && data.marcas.length > 0) {
                data.marcas.forEach((marca) => {
                    $("#filtroMarca").append(`
                        <div class="form-check">
                            <input class="form-check-input filtro-item-checkbox" type="checkbox" 
                                id="marca_${marca.codigo}" value="${marca.nombre}">
                            <label class="form-check-label" for="marca_${marca.codigo}">${marca.nombre}</label>
                        </div>
                    `);
                });
            } else {
                $("#filtroMarca").html('<small class="text-muted">No hay marcas disponibles</small>');
            }

            if (Array.isArray(data.divisiones) && data.divisiones.length > 0) {
                data.divisiones.forEach((div) => {
                    $("#filtroDivision").append(`
                        <div class="form-check">
                            <input class="form-check-input filtro-item-checkbox" type="checkbox"
                                id="division_${div.codigo}" value="${div.nombre}">
                            <label class="form-check-label" for="division_${div.codigo}">${div.nombre}</label>
                        </div>
                    `);
                });
            } else {
                $("#filtroDivision").html('<small class="text-muted">No hay divisiones disponibles</small>');
            }

            if (Array.isArray(data.departamentos) && data.departamentos.length > 0) {
                data.departamentos.forEach((dep) => {
                    $("#filtroDepartamento").append(`
                        <div class="form-check">
                            <input class="form-check-input filtro-item-checkbox" type="checkbox" 
                                id="departamento_${dep.codigo}" value="${dep.nombre}">
                            <label class="form-check-label" for="departamento_${dep.codigo}">${dep.nombre}</label>
                        </div>
                    `);
                });
            } else {
                $("#filtroDepartamento").html('<small class="text-muted">No hay departamentos disponibles</small>');
            }

            if (Array.isArray(data.clases) && data.clases.length > 0) {
                data.clases.forEach((clase) => {
                    $("#filtroClase").append(`
                        <div class="form-check">
                            <input class="form-check-input filtro-item-checkbox" type="checkbox" 
                                id="clase_${clase.codigo}" value="${clase.nombre}">
                            <label class="form-check-label" for="clase_${clase.codigo}">${clase.nombre}</label>
                        </div>
                    `);
                });
            } else {
                $("#filtroClase").html('<small class="text-muted">No hay clases disponibles</small>');
            }

            initMultiSelectFilters();
        },
        error: (xhr) => {
            console.error("❌ Error cargando combos:", xhr.responseText);

            const errorMsg = '<small class="text-danger">Error al cargar</small>';
            $("#filtroMarca").html(errorMsg);
            $("#filtroDivision").html(errorMsg);
            $("#filtroDepartamento").html(errorMsg);
            $("#filtroClase").html(errorMsg);

            manejarErrorGlobal(xhr, "cargar los filtros de búsqueda");
        }
    });
}

async function consultarCombos(etiqueta) {
    try {
        const payload = {
            code_app: "APP20260128155212346",
            http_method: "GET",
            endpoint_path: "api/Opciones/ConsultarCombos",
            client: "APL",
            endpoint_query_params: `/${etiqueta}`
        };

        const response = await $.ajax({
            url: "/api/apigee-router-proxy",
            method: "POST",
            contentType: "application/json",
            data: JSON.stringify(payload)
        });

        const data = response.json_response || [];
        return data;
    } catch (error) {
        Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo cargar datos' });
        throw error;
    }
}

function cargarTiposAcuerdo(callback) {
    console.log("=== INICIO cargarTiposAcuerdo ===");

    const $select = $("#acuerdoTipo");
    $select.empty().append($("<option>").val("").text("Cargando..."));

    const payload = {
        code_app: "APP20260128155212346",
        http_method: "GET",
        endpoint_path: "api/Opciones/ConsultarCombos",
        client: "APL",
        endpoint_query_params: "/CLASEACUERDO"
    };

    $.ajax({
        url: "/api/apigee-router-proxy",
        method: "POST",
        contentType: "application/json",
        data: JSON.stringify(payload),
        success: function (response) {
            if (response && response.code_status === 200) {
                const data = response.json_response || [];
                console.log("✅ Datos recibidos:", data);

                if (!Array.isArray(data) || data.length === 0) {
                    console.error("❌ El API no devolvió datos válidos");
                    return;
                }

                $select.empty();

                data.forEach(item => {
                    let value = "";
                    if (item.idetiqueta_catalogo === "CLAGENERAL") {
                        value = "General";
                        window.idCatalogoGeneral = item.idcatalogo;
                    } else if (item.idetiqueta_catalogo === "CLAARTICULO") {
                        value = "Items";
                        window.idCatalogoArticulo = item.idcatalogo;
                    }

                    $select.append(
                        $("<option>")
                            .val(value)
                            .text(item.nombre_catalogo)
                            .attr("data-idcatalogo", item.idcatalogo)
                            .attr("data-etiqueta", item.idetiqueta_catalogo)
                    );
                });

                $select.val("General");
                toggleAcuerdoForm();

                if (typeof callback === "function") {
                    callback();
                }

                console.log("✅ Tipos de acuerdo cargados correctamente");
            }
        },
        error: (xhr) => {
            console.error("❌ Error cargando CLASEACUERDO:", xhr.responseText);
            $select.empty().append($("<option>").val("").text("Error al cargar"));
            manejarErrorGlobal(xhr, "cargar los tipos de acuerdo");
        }
    });
}

function cargarTipoMotivoIntoSelect($select, callback) {
    console.log("=== INICIO cargarTipoMotivoIntoSelect ===");

    const idOpcionActual = getIdOpcionSeguro();

    if (!$select || $select.length === 0) {
        console.error("❌ Select no existe para cargar motivos.");
        return;
    }

    if (!idOpcionActual) {
        console.error("❌ No se pudo obtener idOpcion para cargar motivos.");
        Swal.fire({
            icon: "error",
            title: "Error",
            text: "No se pudo obtener el ID de la opción. Ingrese nuevamente desde el menú.",
        });
        return;
    }

    $select.empty().append($("<option>").val("").text("Cargando..."));

    const payload = {
        code_app: "APP20260128155212346",
        http_method: "GET",
        endpoint_path: "api/Opciones/ConsultarCombos",
        client: "APL",
        endpoint_query_params: "/ACMOTIVOS"
    };

    $.ajax({
        url: "/api/apigee-router-proxy",
        method: "POST",
        contentType: "application/json",
        data: JSON.stringify(payload),
        success: function (response) {
            if (response && response.code_status === 200) {
                const data = response.json_response || [];
                console.log("✅ SUCCESS - Motivos recibidos:", data);
                $select.empty().append($("<option>").val("").text("Seleccione..."));

                if (Array.isArray(data) && data.length > 0) {
                    data.forEach(function (item) {
                        $select.append(
                            $("<option>").val(item.idcatalogo).text(item.nombre_catalogo)
                        );
                    });
                } else {
                    console.warn("⚠️ No se recibieron motivos.");
                }

                if (typeof callback === "function") {
                    callback();
                }
            }
        },
        error: (xhr) => {
            console.error("❌ ERROR cargando motivos");
            $select.empty().append($("<option>").val("").text("No se pudo cargar"));
            manejarErrorGlobal(xhr, "cargar los motivos de acuerdo");
        }
    });
}

function cargarMotivosGeneral() {
    cargarTipoMotivoIntoSelect($("#acuerdoTipoGeneral"));
}

function cargarMotivosItems() {
    cargarTipoMotivoIntoSelect($("#acuerdoTipoItems"));
}

// ===================================================================
// LÓGICA DE DETALLE (VISUALIZAR/EDITAR)
// ===================================================================

function abrirModalEditar(idAcuerdo) {
    $('body').css('cursor', 'wait');

    // Limpiar campos
    $("#formGeneral")[0].reset();
    $("#formItems")[0].reset();
    $("#lblIdAcuerdo").text(idAcuerdo);
    $('#contenedor-tabla-articulos').hide().html('');

    // ✅ Invalidar caché para que al abrir el modal recargue con el check correcto
    cacheProveedoresAcuerdo = null;

    const payload = {
        code_app: "APP20260128155212346",
        http_method: "GET",
        endpoint_path: "api/Acuerdo/bandeja-modificacion-id",
        client: "APL",
        endpoint_query_params: `/${idAcuerdo}`
    };

    $.ajax({
        url: "/api/apigee-router-proxy",
        method: "POST",
        contentType: "application/json",
        data: JSON.stringify(payload),
        success: function (response) {
            if (response && response.code_status === 200) {
                const data = response.json_response || {};
                acuerdoTemporal = data;
                console.log("acuerdo a modificar:", data);
                const cab = data.cabecera;
                const $select = $("#acuerdoTipo");

                tipoAcuerdo = data.tipoacuerdo;

                switch (tipoAcuerdo) {
                    case "CLAGENERAL":
                        $select.val("General");
                        $("#modalAcuerdoIdGeneral").val(cab.idacuerdo);
                        // ✅ ESTA LÍNEA ES CLAVE: asignamos el ID del fondo para validación posterior
                        $("#fondoProveedorIdGeneral").val(cab.idfondo);
                        $("#acuerdoTipoGeneral").val(cab.idmotivoacuerdo);
                        $("#acuerdoDescripcionGeneral").val(cab.descripcion);
                        $("#acuerdoFechaInicioGeneral").val(formatearFecha(cab.fecha_inicio));
                        $("#acuerdoFechaFinGeneral").val(formatearFecha(cab.fecha_fin));
                        $("#acuerdoValorTotalGeneral").val(formatearMoneda(cab.valor_total));
                        $("#acuerdoDisponibleGeneral").val(formatearMoneda(cab.valor_disponible));
                        $("#acuerdoComprometidoGeneral").val(formatearMoneda(cab.valor_comprometido));
                        $("#acuerdoLiquidadoGeneral").val(formatearMoneda(cab.valor_liquidado));
                        break;
                    case "CLAARTICULO":
                        $select.val("Items");
                        $("#modalAcuerdoIdArticulo").val(cab.idacuerdo);
                        // ✅ ESTA LÍNEA ES CLAVE: asignamos el ID del fondo para validación posterior
                        $("#fondoProveedorIdItems").val(cab.idfondo);
                        $("#acuerdoTipoItems").val(cab.idmotivoacuerdo);
                        $("#acuerdoDescripcionItems").val(cab.descripcion);
                        $("#acuerdoFechaInicioItems").val(formatearFecha(cab.fecha_inicio));
                        $("#acuerdoFechaFinItems").val(formatearFecha(cab.fecha_fin));
                        $("#acuerdoValorTotalItems").val(formatearMoneda(cab.valor_total));
                        $("#verValorAcuerdo").val(formatearMoneda(cab.valor_total));
                        $("#verValorDisponible").val(formatearMoneda(cab.valor_disponible));
                        $("#verValorComprometido").val(formatearMoneda(cab.valor_comprometido));
                        $("#verValorLiquidado").val(formatearMoneda(cab.valor_liquidado));
                        agregarItemsExistenteATabla(data.articulos);
                        break;
                }

                // ✅ Cargar proveedores y marcar el actual usando la nueva función
                cargarProveedorYMarcar(cab.idfondo);

                toggleAcuerdoForm();

                $("#vistaTabla").fadeOut(200, function () {
                    $("#vistaDetalle").fadeIn(200);
                });
                $('body').css('cursor', 'default');
            } else {
                $('body').css('cursor', 'default');
                Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo obtener el detalle' });
            }
        },
        error: function (xhr) {
            $('body').css('cursor', 'default');
            manejarErrorGlobal(xhr, "obtener el detalle del acuerdo");
        }
    });
}

// ✅ FUNCIÓN: Carga proveedores y marca el seleccionado + setea el display
function cargarProveedorYMarcar(idFondo) {
    const pick = (obj, keys, def = "") => {
        for (const k of keys) {
            const v = obj?.[k];
            if (v != null && String(v).trim() !== "") return String(v).trim();
        }
        return def;
    };

    function procesarDatos(data) {
        const proveedorEncontrado = data.find(x => {
            const id = pick(x, ["idfondo", "idFondo"]);
            return String(id) === String(idFondo);
        });

        if (proveedorEncontrado) {
            const prov = {
                idFondo: pick(proveedorEncontrado, ["idfondo", "idFondo"]),
                proveedor: pick(proveedorEncontrado, ["nombre", "proveedor", "nombreProveedor", "razonSocialProveedor"], ""),
                ruc: pick(proveedorEncontrado, ["idproveedor", "ruc", "identificacion"]),
                disponible: pick(proveedorEncontrado, ["valordisponible", "valorDisponible"], 0),
                comprometido: pick(proveedorEncontrado, ["valorcomprometido", "valorComprometido"], 0),
                liquidado: pick(proveedorEncontrado, ["valorliquidado", "valorLiquidado"], 0),
            };

            const display = `${prov.idFondo} - (${prov.proveedor})`;

            console.log("✅ Proveedor marcado desde datos:", prov);

            setFondoEnFormActivo({
                idFondo: prov.idFondo,
                display: display,
                ruc: prov.ruc,
                disponible: prov.disponible,
                comprometido: prov.comprometido,
                liquidado: prov.liquidado,
            });
        } else {
            console.warn("⚠️ No se encontró el proveedor con idFondo:", idFondo);
        }
    }

    // Si ya tenemos caché, usar directamente
    if (cacheProveedoresAcuerdo) {
        procesarDatos(cacheProveedoresAcuerdo);
        return;
    }

    // Si no, cargar desde API
    const payload = {
        code_app: "APP20260128155212346",
        http_method: "GET",
        endpoint_path: "api/Acuerdo/consultar-fondo-acuerdo",
        client: "APL",
        endpoint_query_params: ""
    };

    $.ajax({
        url: "/api/apigee-router-proxy",
        method: "POST",
        contentType: "application/json",
        data: JSON.stringify(payload),
        success: function (response) {
            const data = response.json_response || [];
            cacheProveedoresAcuerdo = data;
            procesarDatos(data);
        },
        error: (xhr) => {
            console.error("Error cargando proveedores para marcar:", xhr.responseText);
        }
    });
}

function cerrarDetalle() {
    $("#vistaDetalle").fadeOut(200, function () { $("#vistaTabla").fadeIn(200); });
}

// ===================================================================
// GUARDAR GENERAL
// ===================================================================

async function guardarGeneral() {
    if (!validarGeneral()) return;

    const idOpcionActual = getIdOpcionSeguro();
    if (!idOpcionActual) {
        Swal.fire("Error", "No se pudo obtener idOpcion.", "error");
        return;
    }

    const usuarioActual = obtenerUsuarioActual();
    const combos = await consultarCombos("TPMODIFICACION");
    let tipoProceso = null;

    if (combos || combos.length > 0) {
        tipoProceso = combos[0];
    }

    console.log("tipoProceso:", tipoProceso);

    const valorTotal = parseCurrencyToNumber($("#acuerdoValorTotalGeneral").val());
    const valorDisponible = parseCurrencyToNumber($("#acuerdoDisponibleGeneral").val());

    // ✅ LECTURA DIRECTA DEL CAMPO OCULTO (que se actualiza en setFondoEnFormActivo)
    const idFondoActualizado = parseInt($("#fondoProveedorIdGeneral").val(), 10) || 0;

    const body = {
        "idacuerdo": parseInt($("#modalAcuerdoIdGeneral").val(), 10) || 0,
        "claseacuerdo": tipoAcuerdo,
        "idmotivoacuerdo": parseInt($("#acuerdoTipoGeneral").val(), 10) || 0,
        "descripcion": $("#acuerdoDescripcionGeneral").val(),
        "fechainiciovigencia": toISOFromDDMMYYYY($("#acuerdoFechaInicioGeneral").val()),
        "fechafinvigencia": toISOFromDDMMYYYY($("#acuerdoFechaFinGeneral").val()),
        "idusuariomodifica": usuarioActual,
        "idtipoproceso": tipoProceso ? tipoProceso.idcatalogo : 0,
        "idfondo": idFondoActualizado, // ✅ Usamos la variable que siempre tendrá el ID correcto seleccionado
        "valoraporte": valorTotal,
        "valordisponible": valorDisponible,
        "valorcomprometido": 0,
        "valorliquidado": 0,
        "idopcion": idOpcionActual,
        "idcontrolinterfaz": "BTNGRABAR",
        "idevento_etiqueta": "EVCLICK",
        "articulos": []
    };

    console.log("📤 Enviando JSON General:", body);
    console.log("acuerdoTemporal:", acuerdoTemporal);

    Swal.fire({
        title: "Confirmar Guardado",
        text: "¿Desea guardar el acuerdo GENERAL?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#009845",
        cancelButtonColor: "#d33",
        confirmButtonText: "Sí, Guardar",
        cancelButtonText: "Cancelar",
    }).then((result) => {
        if (!result.isConfirmed) return;

        Swal.fire({
            title: 'Guardando...',
            text: 'Por favor espere',
            allowOutsideClick: false,
            didOpen: () => Swal.showLoading()
        });

        const payload = {
            code_app: "APP20260128155212346",
            http_method: "POST",
            endpoint_path: "api/Acuerdo/actualizar-acuerdo",
            client: "APL",
            body_request: body
        };

        $.ajax({
            url: "/api/apigee-router-proxy",
            method: "POST",
            contentType: "application/json",
            data: JSON.stringify(payload),
            success: function (response) {
                if (response && response.code_status === 200) {
                    const data = response.json_response || {};
                    console.log("✅ Respuesta exitosa:", data);

                    Swal.fire({
                        icon: "success",
                        title: "¡Guardado!",
                        text: "El acuerdo GENERAL se guardó correctamente.",
                        showConfirmButton: false,
                        timer: 1400,
                    });
                    cacheProveedoresAcuerdo = null; // ✅ Invalidar caché
                    cargarBandeja();
                    cerrarDetalle();
                } else {
                    const mensajeError = response.json_response?.mensaje || 'Error al guardar el acuerdo';
                    Swal.fire({
                        icon: "error",
                        title: "Error al Guardar",
                        text: mensajeError,
                    });
                }
            },
            error: function (xhr) {
                console.error("❌ Error guardado general:", xhr.status, xhr.responseText);
                let mensajeError = "Algo salió mal al guardar el acuerdo GENERAL.";

                try {
                    const errorResponse = JSON.parse(xhr.responseText);
                    if (errorResponse.message) {
                        mensajeError = errorResponse.message;
                    }
                } catch (e) {
                    if (xhr.responseText) {
                        mensajeError = xhr.responseText;
                    }
                }

                Swal.fire({
                    icon: "error",
                    title: "Error al Guardar",
                    text: mensajeError,
                    footer: `<small>Código: ${xhr.status}</small>`,
                });
            }
        });
    });
}

// ===================================================================
// GUARDAR ITEMS
// ===================================================================

async function guardarItems() {
    console.log("ejecutar guardarItems actual");
    if (!validarItems()) return;

    const idOpcionActual = getIdOpcionSeguro();
    if (!idOpcionActual) {
        Swal.fire("Error", "No se pudo obtener idOpcion.", "error");
        return;
    }

    const usuarioActual = obtenerUsuarioActual();
    const articulos = leerDetalleItemsDesdeTabla();
    const combos = await consultarCombos("TPMODIFICACION");
    let tipoProceso = null;

    if (combos || combos.length > 0) {
        tipoProceso = combos[0];
    }

    console.log("tipoProceso:", tipoProceso);

    const valorTotal = parseCurrencyToNumber($("#acuerdoValorTotalItems").val());

    // ✅ LECTURA DIRECTA DEL CAMPO OCULTO
    const idFondoActualizado = parseInt($("#fondoProveedorIdItems").val(), 10) || 0;

    const body = {
        "idacuerdo": parseInt($("#modalAcuerdoIdArticulo").val(), 10) || 0,
        "claseacuerdo": tipoAcuerdo,
        "idmotivoacuerdo": parseInt($("#acuerdoTipoItems").val(), 10) || 0,
        "descripcion": $("#acuerdoDescripcionItems").val(),
        "fechainiciovigencia": toISOFromDDMMYYYY($("#acuerdoFechaInicioItems").val()),
        "fechafinvigencia": toISOFromDDMMYYYY($("#acuerdoFechaFinItems").val()),
        "idusuariomodifica": usuarioActual,
        "idtipoproceso": tipoProceso ? tipoProceso.idcatalogo : 0,
        "idfondo": idFondoActualizado, // ✅ Garantiza que se envía el ID modificado
        "valoraporte": valorTotal,
        "valordisponible": valorTotal,
        "valorcomprometido": 0,
        "valorliquidado": 0,
        "idopcion": idOpcionActual,
        "idcontrolinterfaz": "BTNGRABAR",
        "idevento_etiqueta": "EVCLICK",
        "articulos": articulos
    };

    console.log("📤 Enviando JSON Items:", body);

    Swal.fire({
        title: "Confirmar Guardado",
        html: `
            <p>¿Desea guardar el acuerdo POR ÍTEMS?</p>
            <p class="text-muted small">Se guardarán ${articulos.length} artículo(s)</p>
        `,
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#009845",
        cancelButtonColor: "#d33",
        confirmButtonText: "Sí, Guardar",
        cancelButtonText: "Cancelar",
    }).then((result) => {
        if (!result.isConfirmed) return;

        Swal.fire({
            title: 'Guardando...',
            text: 'Por favor espere',
            allowOutsideClick: false,
            allowEscapeKey: false,
            didOpen: () => Swal.showLoading()
        });

        const payload = {
            code_app: "APP20260128155212346",
            http_method: "POST",
            endpoint_path: "api/Acuerdo/actualizar-acuerdo",
            client: "APL",
            body_request: body
        };

        $.ajax({
            url: "/api/apigee-router-proxy",
            method: "POST",
            contentType: "application/json",
            data: JSON.stringify(payload),
            success: function (response) {
                if (response && response.code_status === 200) {
                    const data = response.json_response || {};
                    console.log("✅ Respuesta exitosa Items:", data);

                    Swal.fire({
                        icon: "success",
                        title: "¡Guardado!",
                        html: `
                            El acuerdo POR ÍTEMS se guardó correctamente.
                            <br><small class="text-muted">${articulos.length} artículo(s) registrado(s)</small>
                        `,
                        showConfirmButton: false,
                        timer: 2000,
                    });
                    cacheProveedoresAcuerdo = null; // ✅ Invalidar caché
                    cargarBandeja();
                    cerrarDetalle();
                } else {
                    const mensajeError = response.json_response?.mensaje || 'Error al guardar el acuerdo';
                    Swal.fire({
                        icon: "error",
                        title: "Error al Guardar",
                        text: mensajeError,
                        confirmButtonColor: "#d33"
                    });
                }
            },
            error: function (xhr) {
                console.error("❌ Error guardado items:", xhr.status, xhr.responseText);

                let mensajeError = "Algo salió mal al guardar el acuerdo POR ÍTEMS.";

                try {
                    const errorResponse = JSON.parse(xhr.responseText);
                    if (errorResponse.message) {
                        mensajeError = errorResponse.message;
                    } else if (errorResponse.errors) {
                        const errores = Object.values(errorResponse.errors).flat();
                        mensajeError = errores.join('<br>');
                    }
                } catch (e) {
                    if (xhr.responseText) {
                        mensajeError = xhr.responseText;
                    }
                }

                Swal.fire({
                    icon: "error",
                    title: "Error al Guardar",
                    html: mensajeError,
                    footer: `<small>Código: ${xhr.status}</small>`,
                    confirmButtonColor: "#d33"
                });
            }
        });
    });
}

// ===================================================================
// VALIDACIONES
// ===================================================================

function validarGeneral() {
    const idFondo = $("#fondoProveedorIdGeneral").val();
    const motivo = $("#acuerdoTipoGeneral").val();
    const desc = $("#acuerdoDescripcionGeneral").val();
    const ini = $("#acuerdoFechaInicioGeneral").val();
    const fin = $("#acuerdoFechaFinGeneral").val();
    const total = parseCurrencyToNumber($("#acuerdoValorTotalGeneral").val());
    const disponibleFondo = parseCurrencyToNumber($("#fondoDisponibleHiddenGeneral").val());

    if (!idFondo || String(idFondo).trim() === "") {
        Swal.fire("Validación", "Debe seleccionar un fondo del proveedor.", "warning");
        return false;
    }
    if (!motivo || String(motivo).trim() === "") {
        Swal.fire("Validación", "Debe seleccionar un motivo.", "warning");
        return false;
    }
    if (!desc || desc.trim().length < 3) {
        Swal.fire("Validación", "Debe ingresar una descripción (mínimo 3 caracteres).", "warning");
        return false;
    }
    if (!isValidDateDDMMYYYY(ini) || !isValidDateDDMMYYYY(fin)) {
        Swal.fire("Validación", "Fechas inválidas. Use el formato dd/mm/aaaa.", "warning");
        return false;
    }
    if (compareDatesDDMMYYYY(ini, fin) > 0) {
        Swal.fire("Validación", "La fecha inicio no puede ser mayor que la fecha fin.", "warning");
        return false;
    }
    if (!(total > 0)) {
        Swal.fire("Validación", "El valor total debe ser mayor a 0.", "warning");
        return false;
    }
    if (total > disponibleFondo) {
        Swal.fire({
            icon: "warning",
            title: "Fondo Insuficiente",
            html: `El valor total ingresado (<strong>${formatCurrencySpanish(total)}</strong>) excede el disponible del fondo (<strong>${formatCurrencySpanish(disponibleFondo)}</strong>).`,
        });
        return false;
    }

    return true;
}

function validarItems() {
    const proveedorIdFondo = $("#fondoProveedorIdItems").val();
    const motivo = $("#acuerdoTipoItems").val();
    const desc = $("#acuerdoDescripcionItems").val();
    const ini = $("#acuerdoFechaInicioItems").val();
    const fin = $("#acuerdoFechaFinItems").val();

    if (!proveedorIdFondo || proveedorIdFondo.trim() === "") {
        Swal.fire("Validación", "Debe seleccionar un proveedor / fondo.", "warning");
        return false;
    }
    if (!motivo || String(motivo).trim() === "") {
        Swal.fire("Validación", "Debe seleccionar un motivo.", "warning");
        return false;
    }
    if (!desc || desc.trim().length < 3) {
        Swal.fire("Validación", "Debe ingresar una descripción (mínimo 3 caracteres).", "warning");
        return false;
    }
    if (!isValidDateDDMMYYYY(ini) || !isValidDateDDMMYYYY(fin)) {
        Swal.fire("Validación", "Fechas inválidas. Use el formato dd/mm/aaaa.", "warning");
        return false;
    }
    if (compareDatesDDMMYYYY(ini, fin) > 0) {
        Swal.fire("Validación", "La fecha inicio no puede ser mayor que la fecha fin.", "warning");
        return false;
    }

    const filasActivas = $("#tablaItemsBody tr").filter(function () {
        return $(this).find(".item-accion").val() !== "D";
    });

    if (filasActivas.length <= 0) {
        Swal.fire("Validación", "Debe existir al menos un ítem activo en el detalle.", "warning");
        return false;
    }

    let unidadesInvalidas = false;
    filasActivas.each(function () {
        const $inputUnidades = $(this).find("input[name='unidadesLimite']");
        const v = String($inputUnidades.val() || "").trim();
        const n = parseInt(v, 10);

        if (!v || isNaN(n) || n <= 0) {
            unidadesInvalidas = true;
            return false;
        }
    });

    if (unidadesInvalidas) {
        Swal.fire(
            "Validación",
            "Revise el detalle: 'Unidades Límite' debe ser un número mayor a 0 en todos los ítems activos.",
            "warning"
        );
        return false;
    }

    return true;
}

// ===================================================================
// FUNCIONES AUXILIARES
// ===================================================================

function toggleAcuerdoForm() {
    const tipo = getTipoAcuerdo();
    $("#formGeneral").toggle(tipo === "General");
    $("#formItems").toggle(tipo === "Items");
}

function initProveedorRowSelection() {
    $(document).off("change", ".proveedor-radio").on("change", ".proveedor-radio", function () {
        $("#tablaProveedores tbody tr").removeClass("table-active");
        $(this).closest("tr").addClass("table-active");

        const $selected = $(this);
        proveedorTemporal = {
            idFondo: $selected.data("idfondo"),
            descripcion: $selected.data("descripcion"),
            proveedor: $selected.data("proveedor"),
            ruc: $selected.data("ruc"),
            disponible: $selected.data("disponible"),
            comprometido: $selected.data("comprometido"),
            liquidado: $selected.data("liquidado"),
        };

        console.log("✓ Proveedor seleccionado (temporal):", proveedorTemporal.idFondo);
    });
}

function setFondoEnFormActivo(f) {
    const tipo = getTipoAcuerdo();

    // ✅ ACTUALIZAMOS TANTO EL DISPLAY COMO LOS INPUTS OCULTOS
    if (tipo === "General") {
        $("#fondoProveedorGeneral").val(f.display);
        $("#fondoProveedorIdGeneral").val(f.idFondo);
        $("#fondoDisponibleHiddenGeneral").val(f.disponible);
    } else {
        $("#fondoProveedorItems").val(f.display);
        $("#fondoProveedorIdItems").val(f.idFondo);
    }

    // ✅ ACTUALIZAMOS EL TEMPORAL EN MEMORIA POR SEGURIDAD DE LA DATA
    if (acuerdoTemporal && acuerdoTemporal.cabecera) {
        acuerdoTemporal.cabecera.idfondo = f.idFondo;
    }
}

function initMultiSelectFilters() {
    console.log("🎯 Inicializando filtros con checkboxes");

    $(".filtro-todas").off("change").on("change", function () {
        const targetId = $(this).data("target");
        const isChecked = $(this).is(":checked");
        $(`#${targetId} .filtro-item-checkbox`).prop("checked", isChecked);
        console.log(`${isChecked ? "✅" : "❌"} Todas - ${targetId}`);
    });

    $(document).off("change", ".filtro-item-checkbox").on("change", ".filtro-item-checkbox", function () {
        const $container = $(this).closest(".border.rounded");
        const $checkboxTodas = $container.find(".filtro-todas");
        const $todosLosItems = $container.find(".filtro-item-checkbox");
        const totalItems = $todosLosItems.length;
        const itemsMarcados = $todosLosItems.filter(":checked").length;

        if (itemsMarcados === totalItems) {
            $checkboxTodas.prop("checked", true);
        } else {
            $checkboxTodas.prop("checked", false);
        }

        const targetId = $checkboxTodas.data("target");
        console.log(`📊 ${targetId}: ${itemsMarcados}/${totalItems} seleccionados`);
    });
}

function getSelectedFilterValues(containerId) {
    const valores = [];
    $(`#${containerId} .filtro-item-checkbox:checked`).each(function () {
        valores.push($(this).val());
    });
    return valores;
}

function limpiarFiltros() {
    $(".filtro-todas").prop("checked", true).trigger("change");
    $("#filtroArticulo").val("");
    console.log("🧹 Filtros limpiados");

    Swal.fire({
        toast: true,
        position: "top-end",
        icon: "info",
        title: "Filtros limpiados",
        showConfirmButton: false,
        timer: 1500,
    });
}

function initBusquedaItems() {
    $("#buscarItem")
        .off("keyup")
        .on("keyup", function () {
            const valor = $(this).val().toLowerCase();
            $("#tablaItemsConsulta tbody tr").each(function () {
                const texto = $(this).text().toLowerCase();
                $(this).toggle(texto.indexOf(valor) > -1);
            });
        });
}

function agregarItemsExistenteATabla(items) {
    const $tbody = $("#tablaItemsBody");
    console.log("items a cargar:", items);

    if ($tbody.children("tr").length > 0) {
        console.log("Limpiando tabla antes de agregar nuevos items...");
        $tbody.empty();
    }

    items.forEach((item) => {
        // ✅ Se cambia item.articulo por item.codigo_articulo
        const existe = $tbody.find(`tr[data-codigo="${item.codigo_articulo}"]`).length > 0;
        if (existe) {
            console.log(`Item ${item.codigo_articulo} ya existe en la tabla`);
            return;
        }

        // ✅ Se usan item.codigo_articulo y item.descripcion_articulo
        const nuevaFila = `
        <tr data-codigo="${item.codigo_articulo}">
          <td class="text-center align-middle">
            <input type="radio" class="form-check-input item-row-radio" name="itemSeleccionado">
          </td>
          <td class="align-middle celda-readonly td-descripcion">${item.codigo_articulo} - ${item.descripcion_articulo}</td>
          <td class="align-middle celda-readonly">
            <input type="text" class="form-control form-control-sm text-end item-costo" 
                   value="${formatCurrencySpanish(item.costo)}" readonly disabled>
          </td>
          <td class="align-middle celda-editable">
            <input type="number" class="form-control form-control-sm text-end" 
                   name="unidadesLimite" value="${item.unidades_limite}" min="1" disabled required>
          </td>
          <td class="align-middle celda-editable">
            <input type="text" class="form-control form-control-sm text-end item-precio-contado" 
                   value="${formatCurrencySpanish(item.precio_contado)}" data-tipo="contado" disabled>
          </td>
          <td class="align-middle celda-editable">
            <input type="text" class="form-control form-control-sm text-end item-precio-tc" 
                   value="${formatCurrencySpanish(item.precio_tc)}" data-tipo="tc" disabled>
          </td>
          <td class="align-middle celda-editable">
            <input type="text" class="form-control form-control-sm text-end item-precio-credito" 
                   value="${formatCurrencySpanish(item.precio_credito)}" data-tipo="credito" disabled>
          </td>
          <td class="align-middle celda-editable">
            <input type="text" class="form-control form-control-sm text-end item-aporte" 
                   value="${formatCurrencySpanish(item.aporte_unidad_proveedor)}" disabled>
          </td>
          <td class="align-middle celda-readonly">
            <input type="text" class="form-control form-control-sm text-end item-comprometido" 
                   value="${formatCurrencySpanish(item.comprometido_proveedor)}" readonly disabled>
          </td>
          <td class="text-center align-middle celda-readonly margen-contado">${item.margen_contado}%</td>
          <td class="text-center align-middle celda-readonly margen-tc">${item.margen_tc}%</td>
          <td class="text-center align-middle celda-readonly margen-credito">${item.margen_credito || "0.00"}%</td>
          <input type="hidden" class="item-id-acuerdo-articulo" value="${item.idacuerdoarticulo}">
          <input type="hidden" class="item-accion" value="U">
        </tr>`;
        $tbody.append(nuevaFila);
    });

    $(document).off("change", ".item-row-radio").on("change", ".item-row-radio", function () {
        // 1. Desmarcar visualmente todas las filas
        $("#tablaItemsBody tr").removeClass("fila-seleccionada");

        // 2. BLOQUEAR absolutamente todos los inputs editables de toda la tabla
        // Esto asegura que al cambiar de ítem, el usuario deba presionar "Modificar" obligatoriamente
        $("#tablaItemsBody .celda-editable input").prop("disabled", true);

        // 3. Marcamos visualmente la fila actual a la que le dimos clic
        const $filaActual = $(this).closest("tr");
        $filaActual.addClass("fila-seleccionada");
    });

    // ✅ Forzamos el cálculo inicial para que se apliquen los colores (verde/rojo) al cargar
    calcularTotalesItems();
}
function agregarItemsATabla(items) {
    const $tbody = $("#tablaItemsBody");

    items.forEach((item) => {
        const $filaExistente = $tbody.find(`tr[data-codigo="${item.codigo}"]`);
        console.log("codigo item:", item.codigo);

        if ($filaExistente.length > 0) {
            const $accion = $filaExistente.find(".item-accion");
            const idAcuerdoArticulo = parseInt($filaExistente.find(".item-id-acuerdo-articulo").val(), 10) || 0;

            if ($accion.val() === "D") {
                if (idAcuerdoArticulo === 0) {
                    $accion.val("I");
                } else {
                    $accion.val("U");
                }

                $filaExistente.show();
                console.log(`Item ${item.articulo} restaurado con acción: ${$accion.val()}`);
            } else {
                console.warn(`Item ${item.articulo} ya está activo en la tabla.`);
            }

            Swal.fire({
                title: "Advertencia",
                text: `Articulo ${item.codigo} ya se encuentra en la tabla`,
                icon: "warning",
                showCancelButton: false,
                confirmButtonText: "Aceptar",
            });
            return;
        }

        const nuevaFila = `
        <tr data-codigo="${item.codigo}">
            <td class="text-center align-middle">
                <input type="radio" class="form-check-input item-row-radio" name="itemSeleccionado">
            </td>
            <td class="align-middle celda-readonly td-descripcion">${item.codigo} - ${item.descripcion}</td> <td class="align-middle celda-readonly">
                <input type="text" class="form-control form-control-sm text-end item-costo" 
                        value="${formatCurrencySpanish(item.costo)}" readonly disabled>
            </td>
            <td class="align-middle celda-editable">
                <input type="number" class="form-control form-control-sm text-end" 
                        name="unidadesLimite" placeholder="0" min="1" disabled required>
            </td>
            <td class="align-middle celda-editable">
                <input type="text" class="form-control form-control-sm text-end item-precio-contado" 
                        placeholder="0.00" data-tipo="contado" disabled>
            </td>
            <td class="align-middle celda-editable">
                <input type="text" class="form-control form-control-sm text-end item-precio-tc" 
                        placeholder="0.00" data-tipo="tc" disabled>
            </td>
            <td class="align-middle celda-editable">
                <input type="text" class="form-control form-control-sm text-end item-precio-credito" 
                        placeholder="0.00" data-tipo="credito" disabled>
            </td>
            <td class="align-middle celda-editable">
                <input type="text" class="form-control form-control-sm text-end item-aporte" 
                        placeholder="0.00" disabled>
            </td>
            <td class="align-middle celda-readonly">
                <input type="text" class="form-control form-control-sm text-end item-comprometido" 
                        placeholder="0.00" readonly disabled>
            </td>
            <td class="text-center align-middle celda-readonly margen-contado">0.00%</td>
            <td class="text-center align-middle celda-readonly margen-tc">0.00%</td>
            <td class="text-center align-middle celda-readonly margen-credito">0.00%</td> <input type="hidden" class="item-id-acuerdo-articulo" value="0">
            <input type="hidden" class="item-accion" value="I">
    </tr>`;
        $tbody.append(nuevaFila);
    });

    $(document).off("change", ".item-row-radio").on("change", ".item-row-radio", function () {
        $("#tablaItemsBody tr").removeClass("fila-seleccionada");
        $(this).closest("tr").addClass("fila-seleccionada");
    });
}

function calcularTotalesItems() {
    let totalProveedor = 0;

    $("#tablaItemsBody tr:visible").each(function () {
        const $fila = $(this);

        const costoStr = $fila.find(".item-costo").val();
        const costo = parseCurrencyToNumber(costoStr);
        const unidades = parseInt($fila.find('input[name="unidadesLimite"]').val()) || 0;
        const aporteStr = $fila.find(".item-aporte").val();
        const aporte = parseCurrencyToNumber(aporteStr);

        const subtotal = aporte * unidades;
        totalProveedor += subtotal;
        $fila.find(".item-comprometido").val(formatCurrencySpanish(subtotal));

        const precioContado = parseCurrencyToNumber($fila.find(".item-precio-contado").val());
        const precioTC = parseCurrencyToNumber($fila.find(".item-precio-tc").val());
        const precioCredito = parseCurrencyToNumber($fila.find(".item-precio-credito").val());

        // --- Recálculo Margen Contado ---
        if (precioContado > 0) {
            const mContado = (((precioContado + aporte - costo) / precioContado) * 100).toFixed(2);
            $fila.find(".margen-contado").text(mContado + "%");
        } else {
            $fila.find(".margen-contado").text("0.00%");
        }

        // --- Recálculo Margen TC ---
        if (precioTC > 0) {
            const mTC = (((precioTC + aporte - costo) / precioTC) * 100).toFixed(2);
            $fila.find(".margen-tc").text(mTC + "%");
        } else {
            $fila.find(".margen-tc").text("0.00%");
        }

        // --- Recálculo Margen Crédito ---
        if (precioCredito > 0) {
            const mCredito = (((precioCredito + aporte - costo) / precioCredito) * 100).toFixed(2);
            $fila.find(".margen-credito").text(mCredito + "%");
        } else {
            $fila.find(".margen-credito").text("0.00%");
        }

        // --- Colores Dinámicos (✅ Igual a CrearAcuerdo) ---
        $fila.find(".margen-contado, .margen-tc, .margen-credito").each(function () {
            const valor = parseFloat($(this).text());
            if (valor < 0) {
                $(this).css("color", "#dc3545"); // Rojo si hay pérdida
            } else if (valor > 0) {
                $(this).css("color", "#198754"); // Verde si es positivo
            } else {
                $(this).css("color", "#212529"); // Neutro/Oscuro si es 0%
            }
        });
    });

    $("#acuerdoValorTotalItems").val(formatCurrencySpanish(totalProveedor));
}

function eliminarItemSeleccionado() {
    const $radioSeleccionado = $("#tablaItemsBody .item-row-radio:checked");

    if ($radioSeleccionado.length === 0) {
        Swal.fire({
            icon: "warning",
            title: "Atención",
            text: "Debe seleccionar un item para eliminar.",
            confirmButtonColor: "#009845"
        });
        return;
    }

    const $fila = $radioSeleccionado.closest("tr");
    const itemDescripcion = $fila.find("td:eq(1)").text();

    Swal.fire({
        title: "¿Está seguro?",
        html: `Se eliminará el item:<br><strong>${itemDescripcion}</strong>`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#d33",
        cancelButtonColor: "#6c757d",
        confirmButtonText: "Sí, Eliminar",
        cancelButtonText: "Cancelar"
    }).then((result) => {
        if (result.isConfirmed) {
            $fila.find(".item-accion").val("D");
            $fila.hide();
            $radioSeleccionado.prop("checked", false);
            $fila.removeClass("fila-seleccionada");

            Swal.fire({
                toast: true,
                position: "top-end",
                icon: "success",
                title: "Item marcado para eliminar",
                showConfirmButton: false,
                timer: 1500,
            });
        }
    });
}

function modificarItemSeleccionado() {
    const $radioSeleccionado = $("#tablaItemsBody .item-row-radio:checked");

    if ($radioSeleccionado.length === 0) {
        Swal.fire({
            icon: "warning",
            title: "Atención",
            text: "Debe seleccionar un item para modificar.",
            confirmButtonColor: "#009845"
        });
        return;
    }

    const $fila = $radioSeleccionado.closest("tr");
    const yaEnEdicion = !$fila.find('input[name="unidadesLimite"]').prop("disabled");

    if (yaEnEdicion) {
        Swal.fire({
            title: "Guardar Cambios",
            text: "¿Desea guardar los cambios realizados?",
            icon: "question",
            showCancelButton: true,
            confirmButtonColor: "#009845",
            cancelButtonColor: "#6c757d",
            confirmButtonText: "Sí, Guardar",
            cancelButtonText: "Cancelar"
        }).then((result) => {
            if (result.isConfirmed) {
                $fila.find(".celda-editable input").prop("disabled", true);
                calcularTotalesItems();

                Swal.fire({
                    toast: true,
                    position: "top-end",
                    icon: "success",
                    title: "Cambios guardados",
                    showConfirmButton: false,
                    timer: 1500
                });
            }
        });
    } else {
        $fila.find(".celda-editable input").prop("disabled", false);
        $fila.find('input[name="unidadesLimite"]').focus();

        Swal.fire({
            toast: true,
            position: "top-end",
            icon: "info",
            title: "Modo edición activado",
            showConfirmButton: false,
            timer: 1500
        });
    }
}

function leerDetalleItemsDesdeTabla() {
    const articulos = [];
    $("#tablaItemsBody tr").each(function () {
        const $tr = $(this);

        const accionActual = $tr.find(".item-accion").val();
        const idacuerdoarticulo = parseInt($tr.find(".item-id-acuerdo-articulo").val(), 10) || 0;

        if (idacuerdoarticulo === 0 && accionActual === "D") {
            return;
        }

        // ✅ 1. FORZAR QUE EL CÓDIGO SEA UN STRING
        const codigo = String($tr.data("codigo"));

        const costoStr = $tr.find(".item-costo").val();
        const costo = parseCurrencyToNumber(costoStr);
        const unidades = parseInt($tr.find('input[name="unidadesLimite"]').val()) || 0;
        const precioContado = parseCurrencyToNumber($tr.find(".item-precio-contado").val());
        const precioTC = parseCurrencyToNumber($tr.find(".item-precio-tc").val());
        const precioCredito = parseCurrencyToNumber($tr.find(".item-precio-credito").val());
        const aporte = parseCurrencyToNumber($tr.find(".item-aporte").val());

        const margenContadoStr = $tr.find(".margen-contado").text().replace("%", "").trim();
        const margenTCStr = $tr.find(".margen-tc").text().replace("%", "").trim();
        // ✅ 2. LEER TAMBIÉN EL MARGEN DE CRÉDITO (Que agregamos recién)
        const margenCreditoStr = $tr.find(".margen-credito").text().replace("%", "").trim();

        const margenContado = parseFloat(margenContadoStr) || 0;
        const margenTC = parseFloat(margenTCStr) || 0;
        const margenCredito = parseFloat(margenCreditoStr) || 0;

        articulos.push({
            accion: accionActual,
            idacuerdoarticulo: idacuerdoarticulo,
            codigoarticulo: codigo, // <--- Ahora se envía como "123875" (String)
            costoactual: costo,
            unidadeslimite: unidades,
            preciocontado: precioContado,
            preciotarjetacredito: precioTC,
            preciocredito: precioCredito,
            valoraporte: aporte,
            margencontado: margenContado,
            margentarjetacredito: margenTC,
            margencredito: margenCredito // <--- Lo enviamos por si la API lo pide
        });
    });

    console.log("Artículos a enviar al API:", articulos);
    return articulos;
}

// ===================================================================
// DATEPICKERS
// ===================================================================

function initDatepickers() {
    if (!$.datepicker) {
        console.warn("jQuery UI Datepicker no está disponible.");
        return;
    }

    $.datepicker.setDefaults($.datepicker.regional["es"] || {});

    const commonOptions = {
        dateFormat: "dd/mm/yy",
        changeMonth: true,
        changeYear: true,
        showButtonPanel: true,
        beforeShow: function (input, inst) {
            setTimeout(function () {
                let buttonPane = $(inst.dpDiv).find(".ui-datepicker-buttonpane");

                let doneButton = buttonPane.find(".ui-datepicker-close");
                doneButton.text("Borrar");
                doneButton.off("click").on("click", function () {
                    $(input).val("");
                    if (input.id.includes("Inicio")) {
                        const endId = input.id.replace("Inicio", "Fin");
                        $("#" + endId).datepicker("option", "minDate", null);
                    }
                    $.datepicker._hideDatepicker();
                });

                let todayButton = buttonPane.find(".ui-datepicker-current");
                todayButton.text("Hoy");
            }, 1);
        }
    };

    function setupDatePair(startId, endId) {
        $(startId).datepicker({
            ...commonOptions,
            minDate: 0,
            onSelect: function (dateText, inst) {
                const startDate = $(this).datepicker("getDate");

                if (startDate) {
                    const minEndDate = new Date(startDate.getTime());
                    minEndDate.setDate(minEndDate.getDate() + 1);

                    $(endId).datepicker("option", "minDate", minEndDate);

                    const currentEndDate = $(endId).datepicker("getDate");
                    if (currentEndDate && currentEndDate <= startDate) {
                        $(endId).val("");
                    }
                }
            }
        });

        $(endId).datepicker({
            ...commonOptions,
            minDate: 1
        });
    }

    setupDatePair("#acuerdoFechaInicioGeneral", "#acuerdoFechaFinGeneral");
    setupDatePair("#acuerdoFechaInicioItems", "#acuerdoFechaFinItems");

    $("#btnFechaInicioGeneral").on("click", function () {
        $("#acuerdoFechaInicioGeneral").datepicker("show");
    });
    $("#btnFechaFinGeneral").on("click", function () {
        $("#acuerdoFechaFinGeneral").datepicker("show");
    });
    $("#btnFechaInicioItems").on("click", function () {
        $("#acuerdoFechaInicioItems").datepicker("show");
    });
    $("#btnFechaFinItems").on("click", function () {
        $("#acuerdoFechaFinItems").datepicker("show");
    });
}

// ===================================================================
// CURRENCY INPUTS
// ===================================================================

function initCurrencyGeneral() {
    const $valor = $("#acuerdoValorTotalGeneral");
    const $dispo = $("#acuerdoDisponibleGeneral");

    $valor.on("keypress", function (event) {
        const char = event.key;
        const currentValue = $(this).val();

        if (char >= "0" && char <= "9") return true;
        if (char === "," && currentValue.indexOf(",") === -1) return true;

        event.preventDefault();
        return false;
    });

    $valor.on("blur", function () {
        const rawValue = $(this).val().replace(",", ".");
        const formattedValue = formatCurrencySpanish(rawValue);
        $(this).val(formattedValue);
        $dispo.val(formattedValue);
    });
}

function initCurrencyItems() {
    $(document).on(
        "blur",
        ".item-precio-contado, .item-precio-tc, .item-precio-credito, .item-aporte",
        function () {
            if (!$(this).prop("disabled")) {
                const rawValue = $(this).val().replace(",", ".");
                $(this).val(formatCurrencySpanish(rawValue));
                calcularTotalesItems();
            }
        }
    );

    $(document).on("change", "input[name='unidadesLimite']", function () {
        calcularTotalesItems();
    });

    $(document).on("keyup", ".item-precio-contado, .item-precio-tc, .item-precio-credito", function () {
        if (!$(this).prop("disabled")) {
            calcularTotalesItems();
        }
    });
}

// ===================================================================
// CREAR LISTADO (DataTable)
// ===================================================================

function crearListado(data) {
    if (tabla) tabla.destroy();

    let html = `
        <table id='tabla-principal' class='table table-bordered table-striped table-hover'>
            <thead>
                <tr>
                    <th colspan='12' style='background-color: #CC0000 !important; color: white; text-align: center; font-weight: bold;'>
                        BANDEJA DE MODIFICACIÓN DE ACUERDOS
                    </th>
                </tr>
                <tr>
                    <th>Acción</th>
                    <th>IdAcuerdo</th>
                    <th>Descripción</th>
                    <th>Fondo</th>
                    <th>Clase</th>
                    <th>Valor</th>
                    <th>Inicio</th>
                    <th>Fin</th>
                    <th>Disponible</th>
                    <th>Comprometido</th>
                    <th>Liquidado</th>
                    <th>Estado</th>
                </tr>
            </thead>
            <tbody>`;

    data.forEach(acuerdo => {
        let fondoCompleto = [acuerdo.idfondo, acuerdo.nombre_tipo_fondo, acuerdo.nombre_proveedor].filter(Boolean).join(" - ");
        let claseHTML = (acuerdo.clase_acuerdo ?? "") + (acuerdo.cantidad_articulos > 0 ? `<sup class="fw-bold"> ${acuerdo.cantidad_articulos}</sup>` : "");

        html += `<tr>
            <td class='text-center'>
                <button type="button" class="btn-action edit-btn" onclick="abrirModalEditar(${acuerdo.idacuerdo})">
                    <i class="fa-regular fa-pen-to-square"></i>
                </button>
            </td>
            <td>${acuerdo.idacuerdo ?? ""}</td>
            <td>${acuerdo.descripcion ?? ""}</td>
            <td>${fondoCompleto}</td>
            <td>${claseHTML}</td>
            <td class='text-end'>${formatearMoneda(acuerdo.valor_acuerdo)}</td>
            <td class='text-center'>${formatearFecha(acuerdo.fecha_inicio)}</td>
            <td class='text-center'>${formatearFecha(acuerdo.fecha_fin)}</td>
            <td class='text-end'>${formatearMoneda(acuerdo.valor_disponible)}</td>
            <td class='text-end'>${formatearMoneda(acuerdo.valor_comprometido)}</td>
            <td class='text-end'>${formatearMoneda(acuerdo.valor_liquidado)}</td>
            <td>${acuerdo.estado ?? ""}</td>
        </tr>`;
    });

    html += "</tbody></table>";
    $('#tabla').html(html);

    tabla = $('#tabla-principal').DataTable({
        pageLength: 10,
        order: [[1, 'desc']],
        language: { url: "https://cdn.datatables.net/plug-ins/1.10.25/i18n/Spanish.json" }
    });
}

// Autor: JEAN FRANCOIS CALDERON VEAS | Empresa: BMTECSA | Proyecto: SOFTWARE APL