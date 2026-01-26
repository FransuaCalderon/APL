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

// ===============================================================
// FUNCIÓN HELPER PARA OBTENER USUARIO
// ===============================================================
function obtenerUsuarioActual() {
    return window.usuarioActual || sessionStorage.getItem('usuarioActual') || "admin";
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

// ===============================================================
// DOCUMENT READY
// ===============================================================
$(document).ready(function () {
    console.log("=== INICIO - ModificarAcuerdo ===");

    toggleAcuerdoForm();
    /*
    $("#acuerdoTipo").on("change", function () {
        toggleAcuerdoForm();

        if (getTipoAcuerdo() === "Items" && $("#acuerdoTipoItems option").length <= 1) {
            cargarMotivosItems();
        }
    });*/

    $.get("/config", function (config) {
        window.apiBaseUrl = config.apiBaseUrl;
        cargarBandeja();
        consultarProveedor();
        // ✅ CARGAR TIPOS DE ACUERDO PRIMERO
        cargarTiposAcuerdo(function () {
            // ✅ Después cargar motivos
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

    
    // Modal Proveedores
    $("#modalConsultaProveedor").on("show.bs.modal", function () {
        proveedorTemporal = null;
        console.log("abriendo modal de proveedores");
        
    });

    $("#modalConsultaProveedor").on("hidden.bs.modal", function () {
        proveedorTemporal = null;
        $("#tablaProveedores tbody tr").removeClass("table-active");
        $("#tablaProveedores tbody input[name='selectProveedor']").prop("checked", false);
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

        if (!proveedorTemporal) {
            Swal.fire({
                icon: "error",
                title: "Error",
                text: "No se pudieron obtener los datos del proveedor seleccionado.",
            });
            return;
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

        const $tbody = $("#tablaItemsConsulta tbody");
        $tbody.empty().append(`
                <tr>
                    <td colspan="14" class="text-center text-muted p-4">
                        <i class="fa-solid fa-filter"></i><br>
                        Seleccione los criterios de búsqueda y presione <strong>"Procesar Selección"</strong>
                    </td>
                </tr>
            `);
    });

    $("#checkTodosItems").on("change", function () {
        const isChecked = $(this).is(":checked");
        $("#tablaItemsConsulta tbody .item-checkbox").prop("checked", isChecked);
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
// ===== FUNCIONES DE CARGA =====
// ===================================================================

function consultarProveedor() {
    const idOpcionActual = getIdOpcionSeguro();
    const usuario = getUsuario();

    if (!ensureApiBaseUrl()) return;

    if (!idOpcionActual) {
        Swal.fire({
            icon: "error",
            title: "Error",
            text: "No se pudo obtener el ID de la opción. Ingrese nuevamente desde el menú.",
        });
        return;
    }

    const $tbody = $("#tablaProveedores tbody");
    if ($tbody.length === 0) {
        console.error("No existe #tablaProveedores tbody");
        return;
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

    $tbody.empty().append('<tr><td colspan="13" class="text-center">Cargando...</td></tr>');

    $.ajax({
        url: `${window.apiBaseUrl}/api/Acuerdo/consultar-fondo-acuerdo`,
        method: "GET",
        headers: {
            idopcion: String(idOpcionActual),
            usuario: usuario,
        },
        success: function (response) {

            const data = response.json_response.data;
            console.log("Datos fondo-acuerdo:", data);
            $tbody.empty();

            if (!Array.isArray(data) || data.length === 0) {
                $tbody.append('<tr><td colspan="13" class="text-center">No se encontraron registros.</td></tr>');
                return;
            }

            data.forEach((x) => {
                const idFondo = pick(x, ["idfondo", "idFondo"]);
                const descripcion = pick(x, ["descripcion", "descripcionFondo", "nombreFondo"]);
                const ruc = pick(x, ["idproveedor", "ruc", "identificacion"]);
                const proveedor = pick(x, ["nombre", "proveedor", "nombreProveedor", "razonSocialProveedor"], "");
                const tipoFondo = pick(
                    x,
                    ["tipoFondo", "tipoFondoDescripcion", "descTipoFondo"],
                    pick(x, ["idtipofondo", "idTipoFondo"])
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
                    ["estado", "descEstado"],
                    pick(x, ["idestadoregistro", "idEstadoRegistro"])
                );

                const fila = `
          <tr class="text-nowrap">
            <td class="align-middle text-center">
              <input class="form-check-input proveedor-radio" type="radio" name="selectProveedor"
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
                data-estado="${esc(estado)}">
            </td>
            <td class="align-middle">${esc(idFondo)}</td>
            <td class="align-middle">${esc(descripcion)}</td>
            <td class="align-middle">${esc(ruc)}</td>
            <td class="align-middle">${esc(proveedor)}</td>
            <td class="align-middle">${esc(tipoFondo)}</td>
            <td class="align-middle text-end">${esc(valorFondo)}</td>
            <td class="align-middle">${esc(fechaInicio)}</td>
            <td class="align-middle">${esc(fechaFin)}</td>
            <td class="align-middle text-end">${esc(disponible)}</td>
            <td class="align-middle text-end">${esc(comprometido)}</td>
            <td class="align-middle text-end">${esc(liquidado)}</td>
            <td class="align-middle">${esc(estado)}</td>
          </tr>
        `;
                $tbody.append(fila);
            });

            initProveedorRowSelection();
        },
        error: function (xhr, status, error) {
            console.error("Error fondo-acuerdo:", error);
            $tbody.empty().append(
                '<tr><td colspan="13" class="text-center text-danger">Error al cargar datos.</td></tr>'
            );
        },
    });
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


function marcarProveedorEnTablaExistente(idFondo) {
    if (!idFondo) return;

    // Buscamos el radio que tenga el data-idfondo igual al que recibimos
    // Usamos == por si uno es string y el otro es number
    const $radio = $(`.proveedor-radio`).filter(function () {
        return $(this).data("idfondo") == idFondo;
    });

    if ($radio.length > 0) {
        $radio.prop("checked", true).trigger("change");

        // Opcional: Desplazar la tabla hasta la fila seleccionada
        $radio[0].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        console.log("✅ Radio marcado para ID:", idFondo);
        initProveedorRowSelection();
    } else {
        console.warn("⚠️ No se encontró el ID de fondo en la tabla actual:", idFondo);
    }
}

function setFondoEnFormActivo(f) {
    const tipo = getTipoAcuerdo();

    if (tipo === "General") {
        $("#fondoProveedorGeneral").val(f.display);
        $("#fondoProveedorIdGeneral").val(f.idFondo);
        $("#fondoDisponibleHiddenGeneral").val(f.disponible); // ✅ NUEVO: Guardar disponible

    } else {
        $("#fondoProveedorItems").val(f.display);
        $("#fondoProveedorIdItems").val(f.idFondo);
    }
}

// -----------------------------
// Items (modal) - CON CHECKBOXES
// -----------------------------
function consultarItems(filtros = {}) {
    const idOpcionActual = getIdOpcionSeguro();
    const usuario = getUsuario();

    if (!ensureApiBaseUrl()) return;

    if (!idOpcionActual) {
        Swal.fire({
            icon: "error",
            title: "Error",
            text: "No se pudo obtener el ID de la opción.",
        });
        return;
    }

    const $tbody = $("#tablaItemsConsulta tbody");
    if ($tbody.length === 0) {
        console.error("No existe #tablaItemsConsulta tbody");
        return;
    }

    const esc = (s) =>
        String(s ?? "")
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#39;");

    $tbody.empty().append('<tr><td colspan="14" class="text-center">Cargando...</td></tr>');

    let url = `${window.apiBaseUrl}/api/Acuerdo/consultar-articulos`;

    console.log("filtros: ", filtros);

    $.ajax({
        url: url,
        method: "POST",
        contentType: "application/json",
        data: JSON.stringify(filtros),
        success: function (response) {
            const data = response.json_response.data;

            console.log("Datos items:", data);
            $tbody.empty();

            if (!Array.isArray(data) || data.length === 0) {
                $tbody.append(`
                        <tr>
                            <td colspan="14" class="text-center text-muted p-3">
                                <i class="fa-solid fa-circle-info"></i><br>
                                No se encontraron items con los criterios seleccionados
                            </td>
                        </tr>
                    `);
                return;
            }

            data.forEach((item) => {
                const fila = `
            <tr>
              <td class="text-center">
                <input type="checkbox" class="form-check-input item-checkbox"
                  data-codigo="${esc(item.codigo || item.iditem || "")}"
                  data-descripcion="${esc(item.descripcion || item.nombre || "")}"
                  data-costo="${esc(item.costo || 0)}"
                  data-stock="${esc(item.stock || 0)}"
                  data-optimo="${esc(item.optimo || 0)}"
                  data-excedenteu="${esc(item.excedente_u || 0)}"
                  data-excedentes="${esc(item.excedente_s || 0)}"
                  data-m0u="${esc(item.m0_u || 0)}"
                  data-m0s="${esc(item.m0_s || 0)}"
                  data-m1u="${esc(item.m1_u || 0)}"
                  data-m1s="${esc(item.m1_s || 0)}"
                  data-m2u="${esc(item.m2_u || 0)}"
                  data-m2s="${esc(item.m2_s || 0)}">
              </td>
              <td>${esc(item.codigo || item.iditem || "")}</td>
              <td>${esc(item.descripcion || item.nombre || "")}</td>
              <td class="text-end">${formatCurrencySpanish(item.costo || 0)}</td>
              <td class="text-center">${esc(item.stock || 0)}</td>
              <td class="text-center">${esc(item.optimo || 0)}</td>
              <td class="text-center">${esc(item.excedente_u || 0)}</td>
              <td class="text-end">${formatCurrencySpanish(item.excedente_s || 0)}</td>
              <td class="text-center">${esc(item.m0_u || 0)}</td>
              <td class="text-end">${formatCurrencySpanish(item.m0_s || 0)}</td>
              <td class="text-center">${esc(item.m1_u || 0)}</td>
              <td class="text-end">${formatCurrencySpanish(item.m1_s || 0)}</td>
              <td class="text-center">${esc(item.m2_u || 0)}</td>
              <td class="text-end">${formatCurrencySpanish(item.m2_s || 0)}</td>
            </tr>
          `;
                $tbody.append(fila);
            });

            initBusquedaItems();
        },
        error: function (xhr, status, error) {
            console.error("Error consultando items:", error);
            $tbody.empty().append(
                '<tr><td colspan="14" class="text-center text-danger">Error al cargar items.</td></tr>'
            );
        },
    });
}

function cargarFiltrosItems() {
    const idOpcionActual = getIdOpcionSeguro();
    const usuario = getUsuario();

    if (!ensureApiBaseUrl() || !idOpcionActual) return;

    console.log("📥 Cargando filtros desde consultar-combos...");

    $("#filtroMarca").html('<div class="text-center"><small class="text-muted">Cargando...</small></div>');
    $("#filtroDivision").html('<div class="text-center"><small class="text-muted">Cargando...</small></div>');
    $("#filtroDepartamento").html('<div class="text-center"><small class="text-muted">Cargando...</small></div>');
    $("#filtroClase").html('<div class="text-center"><small class="text-muted">Cargando...</small></div>');

    $.ajax({
        url: `${window.apiBaseUrl}/api/Acuerdo/consultar-combos`,
        method: "GET",
        headers: {
            idopcion: String(idOpcionActual),
            usuario: usuario,
        },
        success: function (response) {

            const data = response.json_response.data;
            console.log("✅ Datos de combos recibidos:", data);

            $("#filtroMarca").empty();
            $("#filtroDivision").empty();
            $("#filtroDepartamento").empty();
            $("#filtroClase").empty();

            if (Array.isArray(data.marcas) && data.marcas.length > 0) {
                data.marcas.forEach((marca) => {
                    const checkboxHtml = `
                        <div class="form-check">
                            <input class="form-check-input filtro-item-checkbox" type="checkbox" 
                                id="marca_${marca.codigo}" value="${marca.nombre}">
                            <label class="form-check-label" for="marca_${marca.codigo}">
                                ${marca.nombre}
                            </label>
                        </div>
                    `;
                    $("#filtroMarca").append(checkboxHtml);
                });
                console.log(`✅ ${data.marcas.length} marcas cargadas`);
            } else {
                $("#filtroMarca").html('<small class="text-muted">No hay marcas disponibles</small>');
            }

            if (Array.isArray(data.divisiones) && data.divisiones.length > 0) {
                data.divisiones.forEach((div) => {
                    const checkboxHtml = `
                        <div class="form-check">
                            <input class="form-check-input filtro-item-checkbox" type="checkbox"
                                   id="division_${div.codigo}" value="${div.nombre}">
                            <label class="form-check-label" for="division_${div.codigo}">
                                ${div.nombre}
                            </label>
                        </div>
                    `;
                    $("#filtroDivision").append(checkboxHtml);
                });
                console.log(`✅ ${data.divisiones.length} divisiones cargadas`);
            } else {
                $("#filtroDivision").html('<small class="text-muted">No hay divisiones disponibles</small>');
            }

            if (Array.isArray(data.departamentos) && data.departamentos.length > 0) {
                data.departamentos.forEach((dep) => {
                    const checkboxHtml = `
                        <div class="form-check">
                            <input class="form-check-input filtro-item-checkbox" type="checkbox" 
                                   id="departamento_${dep.codigo}" value="${dep.nombre}">
                            <label class="form-check-label" for="departamento_${dep.codigo}">
                                ${dep.nombre}
                            </label>
                        </div>
                    `;
                    $("#filtroDepartamento").append(checkboxHtml);
                });
                console.log(`✅ ${data.departamentos.length} departamentos cargados`);
            } else {
                $("#filtroDepartamento").html('<small class="text-muted">No hay departamentos disponibles</small>');
            }

            if (Array.isArray(data.clases) && data.clases.length > 0) {
                data.clases.forEach((clase) => {
                    const checkboxHtml = `
                        <div class="form-check">
                            <input class="form-check-input filtro-item-checkbox" type="checkbox" 
                                   id="clase_${clase.codigo}" value="${clase.nombre}">
                            <label class="form-check-label" for="clase_${clase.codigo}">
                                ${clase.nombre}
                            </label>
                        </div>
                    `;
                    $("#filtroClase").append(checkboxHtml);
                });
                console.log(`✅ ${data.clases.length} clases cargadas`);
            } else {
                $("#filtroClase").html('<small class="text-muted">No hay clases disponibles</small>');
            }

            initMultiSelectFilters();
        },
        error: function (xhr, status, error) {
            console.error("❌ Error cargando combos:", error);
            console.error("Respuesta:", xhr.responseText);

            const errorMsg = '<small class="text-danger">Error al cargar</small>';
            $("#filtroMarca").html(errorMsg);
            $("#filtroDivision").html(errorMsg);
            $("#filtroDepartamento").html(errorMsg);
            $("#filtroClase").html(errorMsg);

            Swal.fire({
                icon: "error",
                title: "Error",
                text: "No se pudieron cargar los filtros de búsqueda.",
            });
        },
    });
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

function isTodasSelected(checkboxTodasId) {
    return $(`#${checkboxTodasId}`).is(":checked");
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
    console.log("items: ", items);

    // 1. Validar si tiene filas y vaciar si es necesario
    if ($tbody.children("tr").length > 0) {
        console.log("Limpiando tabla antes de agregar nuevos items...");
        $tbody.empty();
    }

    // 2. Agregar los nuevos items
    items.forEach((item) => {
        const existe = $tbody.find(`tr[data-codigo="${item.articulo}"]`).length > 0;
        if (existe) {
            console.log(`Item ${item.articulo} ya existe en la tabla`);
            return;
        }

        const nuevaFila = `
        <tr data-codigo="${item.articulo}">
          <td class="text-center align-middle">
            <input type="radio" class="form-check-input item-row-radio" name="itemSeleccionado">
          </td>
          <td class="align-middle celda-readonly">${item.articulo}</td>
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
          <input type="hidden" class= "item-id-acuerdo-articulo" value="${item.idacuerdoarticulo}">
          <input type="hidden" class= "item-accion" value="U">
          
        </tr>
      `;

        //<td class="text-center align-middle celda-readonly margen-credito">0.00%</td>
        $tbody.append(nuevaFila);
    });

    $(document).off("change", ".item-row-radio").on("change", ".item-row-radio", function () {
        $("#tablaItemsBody tr").removeClass("fila-seleccionada");
        $(this).closest("tr").addClass("fila-seleccionada");
    });
    //calcularTotalesItems();
}

function agregarItemsATabla(items) {
    const $tbody = $("#tablaItemsBody");

    items.forEach((item) => {
        // --- VALIDACIÓN DE DUPLICADOS Y BORRADO LÓGICO ---
        const $filaExistente = $tbody.find(`tr[data-codigo="${item.codigo}"]`);
        console.log("codigo item: ", item.codigo);

        if ($filaExistente.length > 0) {
            const $accion = $filaExistente.find(".item-accion");
            const idAcuerdoArticulo = parseInt($filaExistente.find(".item-id-acuerdo-articulo").val(), 10) || 0;

            // Si la fila existe pero está oculta (marcada con 'D')
            if ($accion.val() === "D") {
                // RESTAURAR: Si el ID es 0 vuelve a ser Insert ('I'), sino Update ('U')
                if (idAcuerdoArticulo === 0) {
                    $accion.val("I");
                } else {
                    $accion.val("U");
                }

                $filaExistente.show(); // Volver a mostrar en la tabla
                console.log(`Item ${item.articulo} restaurado con acción: ${$accion.val()}`);
            } else {
                // Si ya está visible, solo informamos
                console.warn(`Item ${item.articulo} ya está activo en la tabla.`);
            }

            Swal.fire({
                title: "Advertencia",
                text: `Articulo ${item.codigo} ya se encuentra en la tabla`,
                icon: "warning",
                showCancelButton: false,
                //confirmButtonColor: "",
                //cancelButtonColor: "#3085d6",
                confirmButtonText: "Aceptar",
               // cancelButtonText: "Cancelar",
            });
            return; // Saltar a la siguiente iteración del loop
        }

        //<td class="align-middle celda-readonly">${item.codigo} - ${item.descripcion}</td>
        const nuevaFila = `
        <tr data-codigo="${item.codigo}">
          <td class="text-center align-middle">
            <input type="radio" class="form-check-input item-row-radio" name="itemSeleccionado">
          </td>
          <td class="align-middle celda-readonly">${item.codigo}</td>
          <td class="align-middle celda-readonly">
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
          <input type="hidden" class= "item-id-acuerdo-articulo" value="0">
          <input type="hidden" class= "item-accion" value="I">
        </tr>
      `;
        // <td class="text-center align-middle celda-readonly margen-credito">0.00%</td>
        $tbody.append(nuevaFila);
    });

    $(document).off("change", ".item-row-radio").on("change", ".item-row-radio", function () {
        $("#tablaItemsBody tr").removeClass("fila-seleccionada");
        $(this).closest("tr").addClass("fila-seleccionada");
    });
    //calcularTotalesItems();
}

function calcularTotalesItems() {
    let totalProveedor = 0;

    $("#tablaItemsBody tr:visible").each(function () {
        const costoStr = $(this).find(".item-costo").val();
        const costo = parseCurrencyToNumber(costoStr);
        const unidades = parseInt($(this).find('input[name="unidadesLimite"]').val()) || 0;
        const aporteStr = $(this).find(".item-aporte").val();
        const aporte = parseCurrencyToNumber(aporteStr);

        const subtotal = aporte * unidades;
        totalProveedor += subtotal;
        $(this).find(".item-comprometido").val(formatCurrencySpanish(subtotal));

        if (costo > 0) {
            const precioContado = parseCurrencyToNumber($(this).find(".item-precio-contado").val());
            const precioTC = parseCurrencyToNumber($(this).find(".item-precio-tc").val());
            const precioCredito = parseCurrencyToNumber($(this).find(".item-precio-credito").val());

            const margenContado = precioContado > 0
                ? (((precioContado - costo) / precioContado) * 100).toFixed(2)
                : "0.00";
            const margenTC = precioTC > 0
                ? (((precioTC - costo) / precioTC) * 100).toFixed(2)
                : "0.00";
            const margenCredito = precioCredito > 0
                ? (((precioCredito - costo) / precioCredito) * 100).toFixed(2)
                : "0.00";

            $(this).find(".margen-contado").text(margenContado + "%");
            $(this).find(".margen-tc").text(margenTC + "%");
            $(this).find(".margen-credito").text(margenCredito + "%");
        }
    });
    $("#acuerdoValorTotalItems").val(formatCurrencySpanish(totalProveedor));
}


/*
function eliminarItemsSeleccionados() {
    const $checkboxes = $("#tablaItemsBody .item-row-checkbox:checked");

    if ($checkboxes.length === 0) {
        Swal.fire("Atención", "Seleccione al menos un item para eliminar.", "info");
        return;
    }

    Swal.fire({
        title: "¿Está seguro?",
        text: `Se eliminarán ${$checkboxes.length} item(s) seleccionado(s).`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#d33",
        cancelButtonColor: "#3085d6",
        confirmButtonText: "Sí, eliminar",
        cancelButtonText: "Cancelar",
    }).then((result) => {
        if (result.isConfirmed) {
            $checkboxes.closest("tr").remove();
            calcularTotalesItems();
            Swal.fire("Eliminado", "Los items han sido eliminados.", "success");
        }
    });
}
*/

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
    const itemDescripcion = $fila.find("td:eq(1)").text(); // El código/artículo

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

            // 1. Cambiamos el valor del input hidden de acción a 'D' (Delete)
            $fila.find(".item-accion").val("D");

            // 2. Ocultamos la fila visualmente para el usuario
            $fila.hide();

            // 3. Desmarcamos el radio y quitamos clase de selección
            $radioSeleccionado.prop("checked", false);
            $fila.removeClass("fila-seleccionada");

            /*
            // 4. Recalculamos totales (Importante: tu función debe ignorar filas ocultas)
            if (typeof calcularTotalesItems === "function") {
                calcularTotalesItems();
            }*/

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


// -----------------------------
// Datepickers
// -----------------------------
// -----------------------------
// Datepickers (MODIFICADO CON VALIDACIÓN DE FECHAS)
// -----------------------------
function initDatepickers() {
    if (!$.datepicker) {
        console.warn("jQuery UI Datepicker no está disponible.");
        return;
    }

    $.datepicker.setDefaults($.datepicker.regional["es"] || {});

    // Configuración base con tus botones personalizados (Borrar/Hoy)
    const commonOptions = {
        dateFormat: "dd/mm/yy",
        changeMonth: true,
        changeYear: true,
        showButtonPanel: true,
        beforeShow: function (input, inst) {
            setTimeout(function () {
                let buttonPane = $(inst.dpDiv).find(".ui-datepicker-buttonpane");

                // Botón Borrar
                let doneButton = buttonPane.find(".ui-datepicker-close");
                doneButton.text("Borrar");
                doneButton.off("click").on("click", function () {
                    $(input).val("");
                    // Si borramos inicio, reseteamos la restricción del fin
                    if (input.id.includes("Inicio")) {
                        const endId = input.id.replace("Inicio", "Fin");
                        $("#" + endId).datepicker("option", "minDate", null);
                    }
                    $.datepicker._hideDatepicker();
                });

                // Botón Hoy
                let todayButton = buttonPane.find(".ui-datepicker-current");
                todayButton.text("Hoy");
            }, 1);
        }
    };

    // Función auxiliar para vincular Inicio -> Fin
    function setupDatePair(startId, endId) {
        // 1. Configurar Fecha Inicio
        $(startId).datepicker({
            ...commonOptions,
            minDate: 0, // ✅ REGLA 1: No permite fechas anteriores a hoy
            onSelect: function (dateText, inst) {
                // Obtener la fecha seleccionada como objeto Date
                const startDate = $(this).datepicker("getDate");

                if (startDate) {
                    // Crear una nueva fecha para el Fin (Inicio + 1 día)
                    const minEndDate = new Date(startDate.getTime());
                    minEndDate.setDate(minEndDate.getDate() + 1);

                    // ✅ REGLA 2: Actualizar el minDate del campo Fin
                    $(endId).datepicker("option", "minDate", minEndDate);

                    // Opcional: Si la fecha fin actual es menor o igual a la nueva fecha inicio, limpiarla
                    const currentEndDate = $(endId).datepicker("getDate");
                    if (currentEndDate && currentEndDate <= startDate) {
                        $(endId).val("");
                    }
                }
            }
        });

        // 2. Configurar Fecha Fin
        $(endId).datepicker({
            ...commonOptions,
            minDate: 1 // Por defecto mañana (se actualiza dinámicamente)
        });
    }

    // --- Aplicar la lógica a los pares de inputs ---

    // Par 1: Formulario General
    setupDatePair("#acuerdoFechaInicioGeneral", "#acuerdoFechaFinGeneral");

    // Par 2: Formulario Items
    setupDatePair("#acuerdoFechaInicioItems", "#acuerdoFechaFinItems");

    // --- Eventos de los botones de calendario (íconos) ---
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

// -----------------------------
// Formateo moneda (General)
// -----------------------------
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

// -----------------------------
// Validaciones
// -----------------------------
function validarGeneral() {
    const idFondo = $("#fondoProveedorIdGeneral").val();
    const motivo = $("#acuerdoTipoGeneral").val();
    const desc = $("#acuerdoDescripcionGeneral").val();
    const ini = $("#acuerdoFechaInicioGeneral").val();
    const fin = $("#acuerdoFechaFinGeneral").val();
    const total = parseCurrencyToNumber($("#acuerdoValorTotalGeneral").val());

    // ✅ NUEVO: Obtener el disponible del fondo
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

    // ✅ NUEVO: Validar que el valor total no exceda el disponible del fondo
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

// -----------------------------
// Leer Detalle Items
// -----------------------------


function leerDetalleItemsDesdeTabla() {
    const articulos = [];
    $("#tablaItemsBody tr").each(function () {
        const $tr = $(this);

        // 1. LEER LA ACCIÓN REAL (U, D o la que tenga el input)
        const accionActual = $tr.find(".item-accion").val();
        const idacuerdoarticulo = parseInt($tr.find(".item-id-acuerdo-articulo").val(), 10) || 0;

        // --- VALIDACIÓN DE "BASURA" ---
        // Si no tiene ID (es nuevo) y se marcó para eliminar, lo ignoramos por completo
        if (idacuerdoarticulo === 0 && accionActual === "D") {
            return; // Salta a la siguiente fila
        }

        const codigo = $tr.data("codigo");
        const costoStr = $tr.find(".item-costo").val();
        const costo = parseCurrencyToNumber(costoStr);
        const unidades = parseInt($tr.find('input[name="unidadesLimite"]').val()) || 0;
        const precioContado = parseCurrencyToNumber($tr.find(".item-precio-contado").val());
        const precioTC = parseCurrencyToNumber($tr.find(".item-precio-tc").val());
        const precioCredito = parseCurrencyToNumber($tr.find(".item-precio-credito").val());
        const aporte = parseCurrencyToNumber($tr.find(".item-aporte").val());

        const margenContadoStr = $tr.find(".margen-contado").text().replace("%", "").trim();
        const margenTCStr = $tr.find(".margen-tc").text().replace("%", "").trim();
        const margenContado = parseFloat(margenContadoStr) || 0;
        const margenTC = parseFloat(margenTCStr) || 0;

        

        articulos.push({
            // 2. USAR LA VARIABLE ACCION ACTUAL
            accion: accionActual,
            idacuerdoarticulo: idacuerdoarticulo,
            codigoarticulo: codigo,
            costoactual: costo,
            unidadeslimite: unidades,
            preciocontado: precioContado,
            preciotarjetacredito: precioTC,
            preciocredito: precioCredito,
            valoraporte: aporte,
            margencontado: margenContado,
            margentarjetacredito: margenTC,
        });
    });

    console.log("Artículos a enviar al API:", articulos);
    return articulos;
}

// -----------------------------
// ✅ Guardar (Items) - MODIFICADO
// -----------------------------
async function guardarItems() {
    console.log("ejecutar guardarItems actual");
    if (!ensureApiBaseUrl()) return;
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

    console.log("tipoProceso: ", tipoProceso);

    const valorTotal = parseCurrencyToNumber($("#acuerdoValorTotalItems").val());
   
    
    const data = {
        "idacuerdo": parseInt($("#modalAcuerdoIdArticulo").val(), 10) || 0,
        "claseacuerdo": tipoAcuerdo,
        "idmotivoacuerdo": parseInt($("#acuerdoTipoItems").val(), 10) || 0,
        "descripcion": $("#acuerdoDescripcionItems").val(),
        "fechainiciovigencia": toISOFromDDMMYYYY($("#acuerdoFechaInicioItems").val()),
        "fechafinvigencia": toISOFromDDMMYYYY($("#acuerdoFechaFinItems").val()),
        "idusuariomodifica": usuarioActual,
        "idtipoproceso": tipoProceso.idcatalogo,
        "idfondo": parseInt($("#fondoProveedorIdItems").val(), 10) || 0,
        "valoraporte": valorTotal,
        "valordisponible": valorTotal,
        "valorcomprometido": 0,
        "valorliquidado": 0,
        "idopcion": idOpcionActual,
        "idcontrolinterfaz": "BTNGRABAR",
        "idevento_etiqueta": "EVCLICK",
        "articulos": articulos
    };

    console.log("📤 Enviando JSON Items:", data);
    
    //console.log("articulos: ", articulos);
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
            didOpen: () => {
                Swal.showLoading();
            }
        });

        $.ajax({
            url: `${window.apiBaseUrl}/api/Acuerdo/actualizar-acuerdo`,
            type: "POST",
            contentType: "application/json",
            data: JSON.stringify(data),
            success: function (response) {

                const data = response.json_response.data;
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
                cargarBandeja();
                cerrarDetalle();
            },
            error: function (xhr, status, error) {
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
            },
        });
    });
}

function validarItems() {
    const proveedorIdFondo = $("#fondoProveedorIdItems").val();
    const motivo = $("#acuerdoTipoItems").val();
    const desc = $("#acuerdoDescripcionItems").val();
    const ini = $("#acuerdoFechaInicioItems").val();
    const fin = $("#acuerdoFechaFinItems").val();

    // 1. Validaciones de cabecera (se mantienen igual)
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

    // 2. MODIFICACIÓN: Validar si hay al menos un ítem ACTIVO (que no sea "D")
    // Filtramos las filas que no tienen la acción "D"
    const filasActivas = $("#tablaItemsBody tr").filter(function () {
        return $(this).find(".item-accion").val() !== "D";
    });

    if (filasActivas.length <= 0) {
        Swal.fire("Validación", "Debe existir al menos un ítem activo en el detalle.", "warning");
        return false;
    }

    // 3. MODIFICACIÓN: Validar unidades solo en filas activas
    let unidadesInvalidas = false;

    // Recorremos solo las filas activas para validar sus inputs
    filasActivas.each(function () {
        const $inputUnidades = $(this).find("input[name='unidadesLimite']");
        const v = String($inputUnidades.val() || "").trim();
        const n = parseInt(v, 10);

        if (!v || isNaN(n) || n <= 0) {
            unidadesInvalidas = true;
            return false; // Rompe el loop de .each()
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

// -----------------------------
// ✅ Guardar (General) - MODIFICADO
// -----------------------------
async function guardarGeneral() {
    if (!ensureApiBaseUrl()) return;
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

    console.log("tipoProceso: ", tipoProceso);

    const valorTotal = parseCurrencyToNumber($("#acuerdoValorTotalGeneral").val());
    const valorDisponible = parseCurrencyToNumber($("#acuerdoDisponibleGeneral").val());

    //const valorComprometido = parseCurrencyToNumber($("#acuerdoComprometidoGeneral").val());
    //const valorLiquidado = parseCurrencyToNumber($("#acuerdoLiquidadoGeneral").val());

    const data = {
        "idacuerdo": parseInt($("#modalAcuerdoIdGeneral").val(), 10) || 0,
        "claseacuerdo": tipoAcuerdo,
        "idmotivoacuerdo": parseInt($("#acuerdoTipoGeneral").val(), 10) || 0,
        "descripcion": $("#acuerdoDescripcionGeneral").val(),
        "fechainiciovigencia": toISOFromDDMMYYYY($("#acuerdoFechaInicioGeneral").val()),
        "fechafinvigencia": toISOFromDDMMYYYY($("#acuerdoFechaFinGeneral").val()),
        "idusuariomodifica": usuarioActual,
        "idtipoproceso": tipoProceso.idcatalogo,
        "idfondo": parseInt($("#fondoProveedorIdGeneral").val(), 10) || 0,
        "valoraporte": valorTotal,
        "valordisponible": valorDisponible,
        "valorcomprometido": 0,
        "valorliquidado": 0,
        "idopcion": idOpcionActual,
        "idcontrolinterfaz": "BTNGRABAR",
        "idevento_etiqueta": "EVCLICK",
        "articulos": []
    }

    console.log("📤 Enviando JSON General:", data);
    console.log("acuerdoTemporal: ",acuerdoTemporal);


   
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

        $.ajax({
            url: `${window.apiBaseUrl}/api/Acuerdo/actualizar-acuerdo`,
            type: "POST",
            contentType: "application/json",
            data: JSON.stringify(data),
            
            success: function (response) {
                const data = response.json_response.data;
                console.log("✅ Respuesta exitosa:", data);
                Swal.fire({
                    icon: "success",
                    title: "¡Guardado!",
                    text: "El acuerdo GENERAL se guardó correctamente.",
                    showConfirmButton: false,
                    timer: 1400,
                });
                cargarBandeja();
                cerrarDetalle();
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


                if (xhr.status >= 400 && xhr.status < 500) {
                    mensajeError = xhr.responseJSON?.mensaje || error || 'Error desconocido';

                    Swal.fire({
                        icon: "warning",
                        title: "Error al Guardar, validacion de lado del cliente",
                        text: mensajeError,
                        footer: `<small>Código: ${xhr.status}</small>`,
                    });
                } else {
                    Swal.fire({
                        icon: "error",
                        title: "Error al Guardar",
                        text: mensajeError,
                        footer: `<small>Código: ${xhr.status}</small>`,
                    });
                }



            },
        });
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


function cargarBandeja() {
    const idOpcionActual = (window.obtenerIdOpcionActual && window.obtenerIdOpcionActual()) || "0";
    const usuario = obtenerUsuarioActual();

    $.ajax({
        url: `${window.apiBaseUrl}/api/Acuerdo/consultar-bandeja-modificacion`,
        method: "GET",
        headers: {
            "idopcion": String(idOpcionActual),
            "usuario": usuario
        },
        success: function (response) {

            const data = response.json_response.data;
            crearListado(data);
            cargarTiposAcuerdo();
        },
        error: function () {
            Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo cargar la bandeja' });
        }
    });
}

async function consultarCombos(etiqueta) {
    try {
        // Retornamos el resultado del AJAX usando await
        const response = await $.ajax({
            url: `${window.apiBaseUrl}/api/Opciones/ConsultarCombos/${etiqueta}`,
            method: "GET"
        });

        //console.log(data);
        const data = response.json_response.data;
        return data; // Ahora la función devuelve los datos directamente
    } catch (error) {
        Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo cargar datos' });
        throw error;
    }
}

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

// -----------------------------
// ✅ NUEVA FUNCIÓN: Cargar Tipos de Acuerdo desde API
// -----------------------------
function cargarTiposAcuerdo(callback) {
    console.log("=== INICIO cargarTiposAcuerdo (Optimizado) ===");

    if (!ensureApiBaseUrl()) {
        console.error("❌ apiBaseUrl no está configurado");
        return;
    }

    const $select = $("#acuerdoTipo");
    $select.empty().append($("<option>").val("").text("Cargando..."));

    // ✅ Una sola llamada al nuevo endpoint
    $.ajax({
        url: `${window.apiBaseUrl}/api/Opciones/ConsultarCombos/CLASEACUERDO`,
        method: "GET",
        success: function (response) {
            const data = response.json_response.data;
            console.log("✅ Datos recibidos:", data);

            if (!Array.isArray(data) || data.length === 0) {
                console.error("❌ El API no devolvió datos válidos");
                return;
            }

            $select.empty();

            // ✅ Iterar sobre los resultados para llenar el select
            data.forEach(item => {
                // Definir el value basado en la etiqueta para mantener compatibilidad con tu lógica actual
                let value = "";
                if (item.idetiqueta_catalogo === "CLAGENERAL") {
                    value = "General";
                    window.idCatalogoGeneral = item.idcatalogo; // Guardar en variable global si la necesitas
                } else if (item.idetiqueta_catalogo === "CLAARTICULO") {
                    value = "Items"; // Mantenemos "Items" según tu código original
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

            // ✅ Seleccionar General por defecto
            $select.val("General");

            
            // ✅ Ejecutar lógica de interfaz
            toggleAcuerdoForm();

            if (typeof callback === "function") {
                callback();
            }

            console.log("✅ Tipos de acuerdo cargados correctamente");
        },
        error: function (xhr, status, error) {
            console.error("❌ Error cargando CLASEACUERDO:", error);
            $select.empty().append($("<option>").val("").text("Error al cargar"));
            Swal.fire({
                icon: "error",
                title: "Error",
                text: "No se pudieron cargar los tipos de acuerdo.",
            });
        }
    });
}
function getTipoAcuerdo() {
    return $("#acuerdoTipo").val();
}

function toggleAcuerdoForm() {
    const tipo = getTipoAcuerdo();
    $("#formGeneral").toggle(tipo === "General");
    $("#formItems").toggle(tipo === "Items");
}
function cargarMotivosGeneral() {
    cargarTipoMotivoIntoSelect($("#acuerdoTipoGeneral"));
}

function cargarMotivosItems() {
    cargarTipoMotivoIntoSelect($("#acuerdoTipoItems"));
}

// -----------------------------
// Carga de Motivos
// -----------------------------
function cargarTipoMotivoIntoSelect($select, callback) {
    console.log("=== INICIO cargarTipoMotivoIntoSelect ===");

    const idOpcionActual = getIdOpcionSeguro();
    const usuario = getUsuario();

    if (!$select || $select.length === 0) {
        console.error("❌ Select no existe para cargar motivos.");
        return;
    }

    if (!ensureApiBaseUrl()) {
        console.error("❌ apiBaseUrl no está configurado");
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

    const etiqueta = "ACMOTIVOS";
    const urlCompleta = `${window.apiBaseUrl}/api/Opciones/ConsultarCombos/${etiqueta}`;

    $select.empty().append($("<option>").val("").text("Cargando..."));

    const headersAjax = {
        idopcion: String(idOpcionActual),
        usuario: usuario,
    };

    $.ajax({
        url: urlCompleta,
        method: "GET",
        headers: headersAjax,
        success: function (response) {

            const data = response.json_response.data;
            console.log("✅ SUCCESS - Respuesta recibida del servidor");
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
        },
        error: function (xhr, status, error) {
            console.error("❌ ERROR en petición AJAX");
            $select.empty().append($("<option>").val("").text("No se pudo cargar"));
            Swal.fire({
                icon: "error",
                title: "Error",
                text: "No se pudieron cargar los motivos de acuerdo.",
            });
        },
    });
}



function ensureApiBaseUrl() {
    if (!window.apiBaseUrl) {
        console.error("apiBaseUrl no está configurado. /config falló o no se ejecutó.");
        Swal.fire({
            icon: "error",
            title: "Error",
            text: "No se pudo configurar la URL del API (apiBaseUrl).",
        });
        return false;
    }
    return true;
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

function getUsuario() {
    return window.usuarioActual || "admin";
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
    try {
        if (!fechaString) return '';
        var fecha = new Date(fechaString);
        if (isNaN(fecha)) return fechaString;
        var dia = String(fecha.getDate()).padStart(2, '0');
        var mes = String(fecha.getMonth() + 1).padStart(2, '0');
        var anio = fecha.getFullYear();
        return `${dia}/${mes}/${anio}`;
    } catch (e) {
        console.warn("Error formateando fecha:", fechaString);
        return fechaString;
    }
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


// ===================================================================
// ===== LÓGICA DE DETALLE (EL NÚCLEO QUE BUSCABAS) =====
// ===================================================================

function abrirModalEditar(idAcuerdo) {
    $('body').css('cursor', 'wait');
    const usuario = obtenerUsuarioActual();

    // Limpiar campos
    $("#formGeneral")[0].reset();
    $("#formItems")[0].reset();
    $("#lblIdAcuerdo").text(idAcuerdo);
    $('#contenedor-tabla-articulos').hide().html('');

    $.ajax({
        url: `${window.apiBaseUrl}/api/Acuerdo/bandeja-modificacion-id/${idAcuerdo}`,
        method: "GET",
        headers: { "usuario": usuario },
        success: function (response) {

            const data = response.json_response.data;
            acuerdoTemporal = data;
            console.log("acuerdo a modificar: ", data);
            const cab = data.cabecera;
            const $select = $("#acuerdoTipo");

            tipoAcuerdo = data.tipoacuerdo;

            switch (tipoAcuerdo) {
                case "CLAGENERAL":
                    $select.val("General");
                    marcarProveedorEnTablaExistente(cab.idfondo);
                    $("#modalAcuerdoIdGeneral").val(cab.idacuerdo);
                    //$("#modalFondoIdGeneral").val(cab.idfondo);
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
                    marcarProveedorEnTablaExistente(cab.idfondo);

                    $("#acuerdoTipoItems").val(cab.idmotivoacuerdo);
                    $("#modalAcuerdoIdArticulo").val(cab.idacuerdo);
                    $("#acuerdoDescripcionItems").val(cab.descripcion);
                    $("#acuerdoFechaInicioItems").val(formatearFecha(cab.fecha_inicio));
                    $("#acuerdoFechaFinItems").val(formatearFecha(cab.fecha_fin));
                    // ✅ CORREGIDO: Usar los IDs correctos del HTML
                    $("#acuerdoValorTotalItems").val(formatearMoneda(cab.valor_total));
                    $("#verValorAcuerdo").val(formatearMoneda(cab.valor_total));      // Campo adicional
                    $("#verValorDisponible").val(formatearMoneda(cab.valor_disponible));
                    $("#verValorComprometido").val(formatearMoneda(cab.valor_comprometido));
                    $("#verValorLiquidado").val(formatearMoneda(cab.valor_liquidado));

                    agregarItemsExistenteATabla(data.articulos);
                    break;
            }

            console.log("Datos capturados globalmente:", proveedorTemporal);
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


            toggleAcuerdoForm();

            /*
            // Renderizado de Artículos
            if (data.articulos && data.articulos.length > 0) {
                renderizarTablaArticulos(data.articulos);
            }*/

            $("#vistaTabla").fadeOut(200, function () {
                $("#vistaDetalle").fadeIn(200);
            });
            $('body').css('cursor', 'default');
        },
        error: function () {
            $('body').css('cursor', 'default');
            Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo obtener el detalle' });
        }
    });
}

function renderizarTablaArticulos(articulos) {
    let htmlArticulos = `
        <h6 class="fw-bold mb-2"><i class="fa fa-list"></i> Detalle de Artículos</h6>
        <div class="table-responsive" style="max-height: 300px; overflow-y: auto;">
            <table class="table table-bordered table-sm mb-0">
                <thead class="sticky-top text-nowrap">
                    <tr class="text-center tabla-items-header">                                     
                        <th scope="col" class="custom-header-cons-bg">Item</th>
                        <th scope="col" class="custom-header-cons-bg">Costo</th>
                        <th scope="col" class="custom-header-ingr-bg">Unidades Limite</th>
                        <th scope="col" class="custom-header-ingr-bg">Precio - Contado</th>
                        <th scope="col" class="custom-header-ingr-bg">Precio - TC</th>
                        <th scope="col" class="custom-header-ingr-bg">Precio - Crédito</th>
                        <th scope="col" class="custom-header-ingr-bg">Aporte x Unidad</th>
                        <th scope="col" class="custom-header-calc-bg">Comprometido Prov.</th>
                        <th scope="col" class="custom-header-calc-bg">Margen Contado</th>
                        <th scope="col" class="custom-header-calc-bg">Margen TC</th>
                        <th scope="col" class="custom-header-calc-bg">Margen Crédito</th>
                    </tr>
                </thead>
                <tbody class="text-nowrap tabla-items-body bg-white">`;

    articulos.forEach(art => {
        // Cálculo del margen de crédito (Costo - Precio Crédito) si no viene en el JSON
        let margenCredito = (art.precio_credito || 0) - (art.costo || 0);

        htmlArticulos += `
            <tr>
                <td class="fw-bold text-center">${art.articulo || ''}</td>
                <td class="text-end">${formatearMoneda(art.costo)}</td>
                <td class="text-center fw-bold text-primary">${art.unidades_limite}</td>
                <td class="text-end">${formatearMoneda(art.precio_contado)}</td>
                <td class="text-end">${formatearMoneda(art.precio_tc)}</td>
                <td class="text-end">${formatearMoneda(art.precio_credito)}</td>
                <td class="text-end fw-bold">${formatearMoneda(art.aporte_unidad_proveedor)}</td>
                <td class="text-end fw-bold">${formatearMoneda(art.comprometido_proveedor)}</td>
                <td class="text-end">${formatearMoneda(art.margen_contado)}</td>
                <td class="text-end">${formatearMoneda(art.margen_tc)}</td>
                <td class="text-end">${formatearMoneda(margenCredito)}</td>
            </tr>`;
    });

    htmlArticulos += `
                </tbody>
            </table>
        </div>`;

    $('#contenedor-tabla-articulos').html(htmlArticulos).fadeIn();
}

function cerrarDetalle() {
    $("#vistaDetalle").fadeOut(200, function () { $("#vistaTabla").fadeIn(200); });
}

// Utilidades
function formatearMoneda(v) {
    return (v || 0).toLocaleString('es-EC', { style: 'currency', currency: 'USD' });
}
function formatearFecha(fechaString) {
    if (!fechaString) return "";

    // Creamos el objeto fecha
    const fecha = new Date(fechaString);

    // Validamos que sea una fecha válida
    if (isNaN(fecha.getTime())) return "Fecha inválida";

    // Usamos métodos UTC para evitar que la zona horaria del servidor
    // o del cliente nos cambie el día por la diferencia de horas.
    const dia = fecha.getUTCDate().toString().padStart(2, '0');
    const mes = (fecha.getUTCMonth() + 1).toString().padStart(2, '0');
    const anio = fecha.getUTCFullYear();

    return `${dia}/${mes}/${anio}`;
}