/**
* CrearAcuerdo.js - VERSIÓN CON FILTROS CHECKBOX Y VALIDACIÓN DE PROVEEDOR
* Lógica completa para la vista CrearAcuerdo.cshtml
* - Diferencia General vs Items
* - Carga combos Motivo (ACMOTIVO)
* - Modal Proveedores (Fondos) con validación de selección
* - Modal Items (Consulta y Selección con CHECKBOXES)
* - Validaciones por formulario
* - Datepickers separados
* - ✅ CARGA DINÁMICA DE TIPOS DE ACUERDO (CLAGENERAL / CLAARTICULO)
*/

(function () {
    "use strict";

    // ✅ VARIABLES GLOBALES para almacenar los IDs de catálogo
    let idCatalogoGeneral = null;
    let idCatalogoArticulo = null;

    // Variable para almacenar temporalmente el proveedor seleccionado
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

        let v = String(monedaStr).trim();

        // Eliminar símbolo de dólar y espacios
        v = v.replace(/\$/g, "").replace(/\s/g, "");

        // Si está vacío después de limpiar, retornar 0
        if (!v) return 0;

        // Detectar si usa formato español (coma como decimal)
        const tieneComaDecimal = v.includes(',');
        const tienePuntoDecimal = v.includes('.');

        if (tieneComaDecimal) {
            // Formato español: 1.234,56
            // Eliminar puntos (miles) y reemplazar coma por punto
            v = v.replace(/\./g, "").replace(",", ".");
        } else if (tienePuntoDecimal) {
            // Formato con punto decimal: 5.00
            // Verificar si el punto es separador de miles o decimal
            const partes = v.split('.');
            if (partes.length === 2 && partes[1].length <= 2) {
                // Es decimal (ejemplo: 5.00)
                // No hacer nada, ya está correcto
            } else {
                // Es separador de miles (ejemplo: 1.234)
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

    function getTipoAcuerdo() {
        return $("#acuerdoTipo").val();
    }

    function toggleAcuerdoForm() {
        const tipo = getTipoAcuerdo();
        $("#formGeneral").toggle(tipo === "General");
        $("#formItems").toggle(tipo === "Items");
    }

    // -----------------------------
    // ✅ NUEVA FUNCIÓN: Cargar Tipos de Acuerdo desde API
    // -----------------------------
    function cargarTiposAcuerdo(callback) {
        console.log("=== INICIO cargarTiposAcuerdo ===");

        const idOpcionActual = getIdOpcionSeguro();
        const usuario = getUsuario();

        if (!ensureApiBaseUrl()) {
            console.error("❌ apiBaseUrl no está configurado");
            return;
        }

        if (!idOpcionActual) {
            console.error("❌ No se pudo obtener idOpcion para cargar tipos de acuerdo");
            Swal.fire({
                icon: "error",
                title: "Error",
                text: "No se pudo obtener el ID de la opción. Ingrese nuevamente desde el menú.",
            });
            return;
        }

        const $select = $("#acuerdoTipo");
        $select.empty().append($("<option>").val("").text("Cargando..."));

        // ✅ Cargar CLAGENERAL
        $.ajax({
            url: `${window.apiBaseUrl}/api/Opciones/ConsultarCombos/CLAGENERAL`,
            method: "GET",
            headers: {
                idopcion: String(idOpcionActual),
                usuario: usuario,
            },
            success: function (dataGeneral) {
                console.log("✅ CLAGENERAL cargado:", dataGeneral);

                // ✅ Cargar CLAARTICULO
                $.ajax({
                    url: `${window.apiBaseUrl}/api/Opciones/ConsultarCombos/CLAARTICULO`,
                    method: "GET",
                    headers: {
                        idopcion: String(idOpcionActual),
                        usuario: usuario,
                    },
                    success: function (dataArticulo) {
                        console.log("✅ CLAARTICULO cargado:", dataArticulo);

                        // ✅ Limpiar el select
                        $select.empty();

                        // ✅ Agregar opción General
                        if (Array.isArray(dataGeneral) && dataGeneral.length > 0) {
                            const itemGeneral = dataGeneral[0];
                            idCatalogoGeneral = itemGeneral.idcatalogo;

                            $select.append(
                                $("<option>")
                                    .val("General")
                                    .text(itemGeneral.nombre_catalogo || "General")
                                    .attr("data-idcatalogo", itemGeneral.idcatalogo)
                            );

                            console.log(`📌 General - ID Catálogo: ${idCatalogoGeneral}`);
                        }

                        // ✅ Agregar opción Artículo
                        if (Array.isArray(dataArticulo) && dataArticulo.length > 0) {
                            const itemArticulo = dataArticulo[0];
                            idCatalogoArticulo = itemArticulo.idcatalogo;

                            $select.append(
                                $("<option>")
                                    .val("Items")
                                    .text(itemArticulo.nombre_catalogo || "Artículo")
                                    .attr("data-idcatalogo", itemArticulo.idcatalogo)
                            );

                            console.log(`📌 Artículo - ID Catálogo: ${idCatalogoArticulo}`);
                        }

                        // ✅ Seleccionar General por defecto
                        $select.val("General");

                        // ✅ MOSTRAR FORMULARIO GENERAL POR DEFECTO
                        toggleAcuerdoForm();

                        // ✅ Ejecutar callback si existe
                        if (typeof callback === "function") {
                            callback();
                        }

                        console.log("✅ Tipos de acuerdo cargados correctamente");
                    },
                    error: function (xhr, status, error) {
                        console.error("❌ Error cargando CLAARTICULO:", error);
                        $select.empty().append(
                            $("<option>").val("").text("Error al cargar")
                        );
                        Swal.fire({
                            icon: "error",
                            title: "Error",
                            text: "No se pudieron cargar los tipos de acuerdo (Artículo).",
                        });
                    },
                });
            },
            error: function (xhr, status, error) {
                console.error("❌ Error cargando CLAGENERAL:", error);
                $select.empty().append(
                    $("<option>").val("").text("Error al cargar")
                );
                Swal.fire({
                    icon: "error",
                    title: "Error",
                    text: "No se pudieron cargar los tipos de acuerdo (General).",
                });
            },
        });
    }

    // -----------------------------
    // ✅ FUNCIÓN AUXILIAR: Obtener ID Catálogo actual
    // -----------------------------
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
            success: function (data) {
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

    function cargarMotivosGeneral() {
        cargarTipoMotivoIntoSelect($("#fondoTipoGeneral"));
    }

    function cargarMotivosItems() {
        cargarTipoMotivoIntoSelect($("#fondoTipoItems"));
    }

    // -----------------------------
    // Proveedores / Fondos (modal)
    // -----------------------------
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
            success: function (data) {
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

    function setFondoEnFormActivo(f) {
        const tipo = getTipoAcuerdo();

        if (tipo === "General") {
            $("#fondoProveedorGeneral").val(f.display);
            $("#fondoProveedorIdGeneral").val(f.idFondo);

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
            success: function (data) {
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
            success: function (data) {
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

    function agregarItemsATabla(items) {
        const $tbody = $("#tablaItemsBody");

        items.forEach((item) => {
            const existe = $tbody.find(`tr[data-codigo="${item.codigo}"]`).length > 0;
            if (existe) {
                console.log(`Item ${item.codigo} ya existe en la tabla`);
                return;
            }

            const nuevaFila = `
        <tr data-codigo="${item.codigo}">
          <td class="text-center align-middle">
            <input type="radio" class="form-check-input item-row-radio" name="itemSeleccionado">
          </td>
          <td class="align-middle celda-readonly">${item.codigo} - ${item.descripcion}</td>
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
          <td class="text-center align-middle celda-readonly margen-credito">0.00%</td>
        </tr>
      `;
            $tbody.append(nuevaFila);
        });

        $(document).off("change", ".item-row-radio").on("change", ".item-row-radio", function () {
            $("#tablaItemsBody tr").removeClass("fila-seleccionada");
            $(this).closest("tr").addClass("fila-seleccionada");
        });
        calcularTotalesItems();
    }

    function calcularTotalesItems() {
        let totalProveedor = 0;

        $("#tablaItemsBody tr").each(function () {
            const $fila = $(this);

            // 1. Obtener y limpiar valores
            const costo = parseCurrencyToNumber($fila.find(".item-costo").val());
            const unidades = parseInt($fila.find('input[name="unidadesLimite"]').val()) || 0;
            const aporte = parseCurrencyToNumber($fila.find(".item-aporte").val());

            // 2. Calcular Comprometido (Aporte * Unidades)
            const subtotal = aporte * unidades;
            totalProveedor += subtotal;
            $fila.find(".item-comprometido").val(formatCurrencySpanish(subtotal));

            // 3. Obtener Precios de Venta
            const precioContado = parseCurrencyToNumber($fila.find(".item-precio-contado").val());
            const precioTC = parseCurrencyToNumber($fila.find(".item-precio-tc").val());
            const precioCredito = parseCurrencyToNumber($fila.find(".item-precio-credito").val());

            // 4. Aplicar las fórmulas EXACTAS:
            // Margen = (Precio + Aporte - Costo) / Precio * 100

            if (precioContado > 0) {
                const mContado = ((precioContado + aporte - costo) / precioContado * 100).toFixed(2);
                $fila.find(".margen-contado").text(mContado + "%");
            }

            if (precioTC > 0) {
                const mTC = ((precioTC + aporte - costo) / precioTC * 100).toFixed(2);
                $fila.find(".margen-tc").text(mTC + "%");
            }

            if (precioCredito > 0) {
                const mCredito = ((precioCredito + aporte - costo) / precioCredito * 100).toFixed(2);
                $fila.find(".margen-credito").text(mCredito + "%");
            }

            // 5. Estética: Si el margen es negativo, ponerlo en rojo
            $fila.find(".margen-contado, .margen-tc, .margen-credito").each(function () {
                const valor = parseFloat($(this).text());
                $(this).css("color", valor < 0 ? "#dc3545" : "#198754");
            });
        });

        // Actualizar el total del fondo
        $("#fondoValorTotalItems").val(formatCurrencySpanish(totalProveedor));
    }

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
        setupDatePair("#fondoFechaInicioGeneral", "#fondoFechaFinGeneral");

        // Par 2: Formulario Items
        setupDatePair("#fondoFechaInicioItems", "#fondoFechaFinItems");

        // --- Eventos de los botones de calendario (íconos) ---
        $("#btnFechaInicioGeneral").on("click", function () {
            $("#fondoFechaInicioGeneral").datepicker("show");
        });
        $("#btnFechaFinGeneral").on("click", function () {
            $("#fondoFechaFinGeneral").datepicker("show");
        });
        $("#btnFechaInicioItems").on("click", function () {
            $("#fondoFechaInicioItems").datepicker("show");
        });
        $("#btnFechaFinItems").on("click", function () {
            $("#fondoFechaFinItems").datepicker("show");
        });
    }

    // -----------------------------
    // Formateo moneda (General)
    // -----------------------------
    function initCurrencyGeneral() {
        const $valor = $("#fondoValorTotalGeneral");
        const $dispo = $("#fondoDisponibleGeneral");

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
        const motivo = $("#fondoTipoGeneral").val();
        const desc = $("#fondoDescripcionGeneral").val();
        const ini = $("#fondoFechaInicioGeneral").val();
        const fin = $("#fondoFechaFinGeneral").val();
        const total = parseCurrencyToNumber($("#fondoValorTotalGeneral").val());

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
        return true;
    }

    // -----------------------------
    // Leer Detalle Items
    // -----------------------------
    function leerDetalleItemsDesdeTabla() {
        const articulos = [];
        $("#tablaItemsBody tr").each(function () {
            const $tr = $(this);
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
            const margenCreditoStr = $tr.find(".margen-credito").text().replace("%", "").trim();
            const margenContado = parseFloat(margenContadoStr) || 0;
            const margenTC = parseFloat(margenTCStr) || 0;
            const margenCredito = parseFloat(margenCreditoStr) || 0;
            const comprometido = aporte * unidades;

            articulos.push({
                codigoArticulo: codigo,
                costoActual: costo,
                unidadesLimite: unidades,
                precioContado: precioContado,
                precioTarjetaCredito: precioTC,
                precioCredito: precioCredito,
                valorAporte: aporte,
                valorComprometido: comprometido,
                margenContado: margenContado,
                margenTarjetaCredito: margenTC,
            });
        });
        return articulos;
    }

    // -----------------------------
    // ✅ Guardar (Items) - MODIFICADO
    // -----------------------------
    function guardarItems() {
        console.log("ejecutar guardarItems actual");
        if (!ensureApiBaseUrl()) return;
        if (!validarItems()) return;

        const idOpcionActual = getIdOpcionSeguro();
        if (!idOpcionActual) {
            Swal.fire("Error", "No se pudo obtener idOpcion.", "error");
            return;
        }

        // ✅ OBTENER ID CATÁLOGO DINÁMICAMENTE
        const idTipoAcuerdoDinamico = getIdCatalogoActual();

        if (!idTipoAcuerdoDinamico) {
            Swal.fire({
                icon: "error",
                title: "Error",
                text: "No se pudo determinar el tipo de acuerdo. Recargue la página.",
            });
            return;
        }

        console.log(`📌 Guardando Items con ID Tipo Acuerdo: ${idTipoAcuerdoDinamico}`);

        const idFondo = parseInt($("#fondoProveedorIdItems").val(), 10) || 0;
        const idMotivo = parseInt($("#fondoTipoItems").val(), 10) || 0;
        const descripcion = $("#fondoDescripcionItems").val().trim();
        const fechaInicio = toISOFromDDMMYYYY($("#fondoFechaInicioItems").val());
        const fechaFin = toISOFromDDMMYYYY($("#fondoFechaFinItems").val());
        const valorTotal = parseCurrencyToNumber($("#fondoValorTotalItems").val());
        const articulos = leerDetalleItemsDesdeTabla();

        const data = {
            tipoclaseetiqueta: "CLAARTICULO",
            idopcion: idOpcionActual,
            idcontrolinterfaz: "BTNGRABAR",
            idevento: "EVCLICK",
            acuerdo: {
                idTipoAcuerdo: idTipoAcuerdoDinamico, // ✅ DINÁMICO
                idMotivoAcuerdo: idMotivo,
                descripcion: descripcion,
                fechaInicioVigencia: fechaInicio,
                fechaFinVigencia: fechaFin,
                idUsuarioIngreso: getUsuario(),
                idEstadoRegistro: 1,
                marcaProcesoAprobacion: " "
            },
            fondo: {
                idFondo: idFondo,
                valorAporte: valorTotal,
                valorDisponible: valorTotal,
                valorComprometido: 0,
                valorLiquidado: 0
            },
            articulos: articulos
        };

        console.log("📤 Enviando JSON Items:", JSON.stringify(data, null, 2));

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
                url: `${window.apiBaseUrl}/api/Acuerdo/insertar`,
                type: "POST",
                contentType: "application/json",
                data: JSON.stringify(data),
                headers: {
                    idopcion: String(idOpcionActual),
                    usuario: getUsuario(),
                },
                success: function (response) {
                    console.log("✅ Respuesta exitosa Items:", response);

                    Swal.fire({
                        icon: "success",
                        title: "¡Guardado!",
                        html: `
                        El acuerdo POR ÍTEMS se guardó correctamente.
                        <br><small class="text-muted">${articulos.length} artículo(s) registrado(s)</small>
                    `,
                        showConfirmButton: false,
                        timer: 2000,
                    }).then(() => {
                        $("#fondoTipoItems").val("");
                        $("#fondoProveedorItems").val("Seleccione...");
                        $("#fondoProveedorIdItems").val("");
                        $("#fondoDescripcionItems").val("");
                        $("#fondoFechaInicioItems").val("");
                        $("#fondoFechaFinItems").val("");
                        $("#fondoValorTotalItems").val("");
                        $("#tablaItemsBody").empty();
                    });
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
        const motivo = $("#fondoTipoItems").val();
        const desc = $("#fondoDescripcionItems").val();
        const ini = $("#fondoFechaInicioItems").val();
        const fin = $("#fondoFechaFinItems").val();

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

        const filas = $("#tablaItemsBody tr").length;
        if (filas <= 0) {
            Swal.fire("Validación", "Debe existir al menos un ítem en el detalle.", "warning");
            return false;
        }

        let unidadesInvalidas = false;
        $("#tablaItemsBody input[name='unidadesLimite']").each(function () {
            const v = String($(this).val() || "").trim();
            const n = parseInt(v, 10);
            if (!v || isNaN(n) || n <= 0) {
                unidadesInvalidas = true;
                return false;
            }
        });

        if (unidadesInvalidas) {
            Swal.fire(
                "Validación",
                "Revise el detalle: 'Unidades Límite' debe ser un número mayor a 0.",
                "warning"
            );
            return false;
        }

        return true;
    }

    // -----------------------------
    // ✅ Guardar (General) - MODIFICADO
    // -----------------------------
    function guardarGeneral() {
        if (!ensureApiBaseUrl()) return;
        if (!validarGeneral()) return;

        const idOpcionActual = getIdOpcionSeguro();
        if (!idOpcionActual) {
            Swal.fire("Error", "No se pudo obtener idOpcion.", "error");
            return;
        }

        // ✅ OBTENER ID CATÁLOGO DINÁMICAMENTE
        const idTipoAcuerdoDinamico = getIdCatalogoActual();

        if (!idTipoAcuerdoDinamico) {
            Swal.fire({
                icon: "error",
                title: "Error",
                text: "No se pudo determinar el tipo de acuerdo. Recargue la página.",
            });
            return;
        }

        console.log(`📌 Guardando General con ID Tipo Acuerdo: ${idTipoAcuerdoDinamico}`);

        const valorTotal = parseCurrencyToNumber($("#fondoValorTotalGeneral").val());
        const valorDisponible = parseCurrencyToNumber($("#fondoDisponibleGeneral").val());

        const data = {
            tipoclaseetiqueta: "CLAGENERAL",
            idopcion: idOpcionActual,
            idcontrolinterfaz: "BTNGRABAR",
            idevento: "EVCLICK",
            acuerdo: {
                idTipoAcuerdo: idTipoAcuerdoDinamico, // ✅ DINÁMICO
                idMotivoAcuerdo: parseInt($("#fondoTipoGeneral").val(), 10) || 0,
                descripcion: $("#fondoDescripcionGeneral").val().trim(),
                fechaInicioVigencia: toISOFromDDMMYYYY($("#fondoFechaInicioGeneral").val()),
                fechaFinVigencia: toISOFromDDMMYYYY($("#fondoFechaFinGeneral").val()),
                idUsuarioIngreso: getUsuario(),
                idEstadoRegistro: 1,
                marcaProcesoAprobacion: " "
            },
            fondo: {
                idFondo: parseInt($("#fondoProveedorIdGeneral").val(), 10) || 0,
                valorAporte: valorTotal,
                valorDisponible: valorDisponible,
                valorComprometido: 0,
                valorLiquidado: 0
            },
            articulos: []
        };

        console.log("📤 Enviando JSON General:", JSON.stringify(data, null, 2));

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
                url: `${window.apiBaseUrl}/api/Acuerdo/insertar`,
                type: "POST",
                contentType: "application/json",
                data: JSON.stringify(data),
                headers: {
                    idopcion: String(idOpcionActual),
                    usuario: getUsuario(),
                },
                success: function (response) {
                    console.log("✅ Respuesta exitosa:", response);
                    Swal.fire({
                        icon: "success",
                        title: "¡Guardado!",
                        text: "El acuerdo GENERAL se guardó correctamente.",
                        showConfirmButton: false,
                        timer: 1400,
                    });

                    $("#fondoTipoGeneral").val("");
                    $("#fondoProveedorGeneral").val("Seleccione...");
                    $("#fondoProveedorIdGeneral").val("");
                    $("#fondoDescripcionGeneral").val("");
                    $("#fondoFechaInicioGeneral").val("");
                    $("#fondoFechaFinGeneral").val("");
                    $("#fondoValorTotalGeneral").val("");
                    $("#fondoDisponibleGeneral").val("");
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
                $fila.remove();
                calcularTotalesItems();

                Swal.fire({
                    toast: true,
                    position: "top-end",
                    icon: "success",
                    title: "Item eliminado",
                    showConfirmButton: false,
                    timer: 1500,
                });
            }
        });
    }

    // -----------------------------
    // ✅ Init principal - MODIFICADO
    // -----------------------------
    $(document).ready(function () {
        console.log("=== CrearAcuerdo INIT (CON CARGA DINÁMICA DE TIPOS) ===");

        toggleAcuerdoForm();
        $("#acuerdoTipo").on("change", function () {
            toggleAcuerdoForm();

            if (getTipoAcuerdo() === "Items" && $("#fondoTipoItems option").length <= 1) {
                cargarMotivosItems();
            }
        });

        // ✅ Cargar config + tipos de acuerdo + combos
        $.get("/config")
            .done(function (config) {
                window.apiBaseUrl = config.apiBaseUrl;
                console.log("apiBaseUrl:", window.apiBaseUrl);

                // ✅ CARGAR TIPOS DE ACUERDO PRIMERO
                cargarTiposAcuerdo(function () {
                    // ✅ Después cargar motivos
                    cargarMotivosGeneral();
                    cargarMotivosItems();
                });
            })
            .fail(function (xhr) {
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
            consultarProveedor();
        });

        $("#modalConsultaProveedor").on("hidden.bs.modal", function () {
            proveedorTemporal = null;
            $("#tablaProveedores tbody tr").removeClass("table-active");
            $("#tablaProveedores tbody input[name='selectProveedor']").prop("checked", false);
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
                    $("#fondoTipoGeneral").val("");
                    $("#fondoProveedorGeneral").val("Seleccione...");
                    $("#fondoProveedorIdGeneral").val("");
                    $("#fondoDescripcionGeneral").val("");
                    $("#fondoFechaInicioGeneral").val("");
                    $("#fondoFechaFinGeneral").val("");
                    $("#fondoValorTotalGeneral").val("");
                    $("#fondoDisponibleGeneral").val("");

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
                    $("#fondoTipoItems").val("");
                    $("#fondoProveedorItems").val("Seleccione...");
                    $("#fondoProveedorIdItems").val("");
                    $("#fondoDescripcionItems").val("");
                    $("#fondoFechaInicioItems").val("");
                    $("#fondoFechaFinItems").val("");
                    $("#fondoValorTotalItems").val("");
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
    });
})();