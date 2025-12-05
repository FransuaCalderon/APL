/**
 * CrearAcuerdo.js - VERSIÓN CON FILTROS CHECKBOX
 * Lógica completa para la vista CrearAcuerdo.cshtml
 * - Diferencia General vs Items
 * - Carga combos Motivo (ACMOTIVO)
 * - Modal Proveedores (Fondos)
 * - Modal Items (Consulta y Selección con CHECKBOXES)
 * - Validaciones por formulario
 * - Datepickers separados
 */

(function () {
    "use strict";

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

    function getTipoAcuerdo() {
        return $("#acuerdoTipo").val();
    }

    function toggleAcuerdoForm() {
        const tipo = getTipoAcuerdo();
        $("#formGeneral").toggle(tipo === "General");
        $("#formItems").toggle(tipo === "Items");
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
              <input class="form-check-input" type="radio" name="selectProveedor"
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
              >
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
            },
            error: function (xhr, status, error) {
                console.error("Error fondo-acuerdo:", error);
                $tbody.empty().append(
                    '<tr><td colspan="13" class="text-center text-danger">Error al cargar datos.</td></tr>'
                );
            },
        });
    }

    function setFondoEnFormActivo(f) {
        const tipo = getTipoAcuerdo();

        if (tipo === "General") {
            $("#fondoProveedorGeneral").val(f.display);
            $("#fondoProveedorIdGeneral").val(f.idFondo);

            if (f.disponible != null && f.disponible !== "") {
                $("#fondoDisponibleGeneral").val(formatCurrencySpanish(f.disponible));
            }
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

        // Construir URL con filtros
        let url = `${window.apiBaseUrl}/api/Acuerdo/consultar-articulos`;

        console.log("filtros: ", filtros);
        
        $.ajax({
            url: url,
            method: "POST",
            contentType: "application/json",
            data: JSON.stringify(filtros),
            /*
            headers: {
                idopcion: String(idOpcionActual),
                usuario: usuario,
            },*/
            success: function (data) {
                console.log("Datos items:", data);
                $tbody.empty();

                if (!Array.isArray(data) || data.length === 0) {
                    $tbody.append('<tr><td colspan="14" class="text-center">No se encontraron items.</td></tr>');
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

    /**
     * Carga los filtros usando CHECKBOXES desde el endpoint
     */
    function cargarFiltrosItems() {
        const idOpcionActual = getIdOpcionSeguro();
        const usuario = getUsuario();

        if (!ensureApiBaseUrl() || !idOpcionActual) return;

        console.log("📥 Cargando filtros desde consultar-combos...");

        // Mostrar indicador de carga
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

                // Limpiar contenedores
                $("#filtroMarca").empty();
                $("#filtroDivision").empty();
                $("#filtroDepartamento").empty();
                $("#filtroClase").empty();

                // Cargar Marcas
                if (Array.isArray(data.marcas) && data.marcas.length > 0) {
                    data.marcas.forEach((marca) => {
                        const checkboxHtml = `
                        <div class="form-check">
                            <input class="form-check-input filtro-item-checkbox" type="checkbox" 
                                   id="marca_${marca.codigo}" value="${marca.nombre}" checked>
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

                // Cargar Divisiones
                if (Array.isArray(data.divisiones) && data.divisiones.length > 0) {
                    data.divisiones.forEach((div) => {
                        const checkboxHtml = `
                        <div class="form-check">
                            <input class="form-check-input filtro-item-checkbox" type="checkbox"
                                   id="division_${div.codigo}" value="${div.nombre}" checked>
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

                // Cargar Departamentos
                if (Array.isArray(data.departamentos) && data.departamentos.length > 0) {
                    data.departamentos.forEach((dep) => {
                        const checkboxHtml = `
                        <div class="form-check">
                            <input class="form-check-input filtro-item-checkbox" type="checkbox" 
                                   id="departamento_${dep.codigo}" value="${dep.nombre}" checked>
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

                // Cargar Clases
                if (Array.isArray(data.clases) && data.clases.length > 0) {
                    data.clases.forEach((clase) => {
                        const checkboxHtml = `
                        <div class="form-check">
                            <input class="form-check-input filtro-item-checkbox" type="checkbox" 
                                   id="clase_${clase.codigo}" value="${clase.nombre}" checked>
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

                // ✅ INICIALIZAR LÓGICA DE CHECKBOXES
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

    /**
     * Inicializa la lógica de checkboxes para los filtros
     */
    function initMultiSelectFilters() {
        console.log("🎯 Inicializando filtros con checkboxes");

        // Manejar checkbox "Todas" de cada categoría
        $(".filtro-todas").off("change").on("change", function () {
            const targetId = $(this).data("target");
            const isChecked = $(this).is(":checked");

            // Marcar/desmarcar todos los checkboxes del grupo
            $(`#${targetId} .filtro-item-checkbox`).prop("checked", isChecked);

            console.log(`${isChecked ? "✅" : "❌"} Todas - ${targetId}`);
        });

        // Manejar checkboxes individuales (delegado para elementos dinámicos)
        $(document).off("change", ".filtro-item-checkbox").on("change", ".filtro-item-checkbox", function () {
            const $container = $(this).closest(".border.rounded");
            const $checkboxTodas = $container.find(".filtro-todas");
            const $todosLosItems = $container.find(".filtro-item-checkbox");
            const totalItems = $todosLosItems.length;
            const itemsMarcados = $todosLosItems.filter(":checked").length;

            // Si todos están marcados, marcar "Todas"
            if (itemsMarcados === totalItems) {
                $checkboxTodas.prop("checked", true);
            } else {
                $checkboxTodas.prop("checked", false);
            }

            const targetId = $checkboxTodas.data("target");
            console.log(`📊 ${targetId}: ${itemsMarcados}/${totalItems} seleccionados`);
        });
    }

    /**
     * Obtiene los valores seleccionados de un grupo de checkboxes
     */
    function getSelectedFilterValues(containerId) {
        const valores = [];
        $(`#${containerId} .filtro-item-checkbox:checked`).each(function () {
            valores.push($(this).val());
        });
        return valores;
    }

    /**
     * Verifica si "Todas" está seleccionado en un filtro
     */
    function isTodasSelected(checkboxTodasId) {
        return $(`#${checkboxTodasId}`).is(":checked");
    }

    /**
     * Limpia todos los filtros
     */
    function limpiarFiltros() {
        // Marcar todos los checkboxes "Todas"
        $(".filtro-todas").prop("checked", true).trigger("change");

        // Limpiar campo de artículo
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

        // Agregar evento para resaltar fila seleccionada
        $(document).off("change", ".item-row-radio").on("change", ".item-row-radio", function () {
            $("#tablaItemsBody tr").removeClass("fila-seleccionada");
            $(this).closest("tr").addClass("fila-seleccionada");
        });

        calcularTotalesItems();
    }

    function calcularTotalesItems() {
        let totalProveedor = 0;

        $("#tablaItemsBody tr").each(function () {
            // Obtener costo (ya está en formato currency)
            const costoStr = $(this).find(".item-costo").val();
            const costo = parseCurrencyToNumber(costoStr);

            // Obtener unidades
            const unidades = parseInt($(this).find('input[name="unidadesLimite"]').val()) || 0;

            // Obtener aporte
            const aporteStr = $(this).find(".item-aporte").val();
            const aporte = parseCurrencyToNumber(aporteStr);

            // Calcular comprometido proveedor
            const subtotal = aporte * unidades;
            totalProveedor += subtotal;
            $(this).find(".item-comprometido").val(formatCurrencySpanish(subtotal));

            // Calcular márgenes solo si hay costo
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
        // Actualizar total proveedor
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
    function initDatepickers() {
        if (!$.datepicker) {
            console.warn("jQuery UI Datepicker no está disponible.");
            return;
        }

        $.datepicker.setDefaults($.datepicker.regional["es"] || {});

        function attachPicker(inputId) {
            $(inputId).datepicker({
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
                            $.datepicker._hideDatepicker();
                        });

                        let todayButton = buttonPane.find(".ui-datepicker-current");
                        todayButton.text("Hoy");
                    }, 1);
                },
            });
        }

        attachPicker("#fondoFechaInicioGeneral");
        attachPicker("#fondoFechaFinGeneral");
        attachPicker("#fondoFechaInicioItems");
        attachPicker("#fondoFechaFinItems");

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
        // Formatear campos de precio y aporte al perder el foco
        $(document).on(
            "blur",
            ".item-precio-contado, .item-precio-tc, .item-precio-credito, .item-aporte",
            function () {
                // Solo formatear si no está disabled
                if (!$(this).prop("disabled")) {
                    const rawValue = $(this).val().replace(",", ".");
                    $(this).val(formatCurrencySpanish(rawValue));
                    calcularTotalesItems();
                }
            }
        );

        // Recalcular al cambiar unidades
        $(document).on("change", "input[name='unidadesLimite']", function () {
            calcularTotalesItems();
        });

        // Recalcular al escribir en campos de precio (para ver márgenes en tiempo real)
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
    // Leer Detalle Items (ACTUALIZADO)
    // -----------------------------
    function leerDetalleItemsDesdeTabla() {
        const articulos = [];

        $("#tablaItemsBody tr").each(function () {
            const $tr = $(this);
            const codigo = $tr.data("codigo");

            // Leer valores
            const costoStr = $tr.find(".item-costo").val();
            const costo = parseCurrencyToNumber(costoStr);

            const unidades = parseInt($tr.find('input[name="unidadesLimite"]').val()) || 0;

            const precioContado = parseCurrencyToNumber($tr.find(".item-precio-contado").val());
            const precioTC = parseCurrencyToNumber($tr.find(".item-precio-tc").val());
            const precioCredito = parseCurrencyToNumber($tr.find(".item-precio-credito").val());
            const aporte = parseCurrencyToNumber($tr.find(".item-aporte").val());

            // Leer márgenes (están en formato "XX.XX%")
            const margenContadoStr = $tr.find(".margen-contado").text().replace("%", "").trim();
            const margenTCStr = $tr.find(".margen-tc").text().replace("%", "").trim();
            const margenCreditoStr = $tr.find(".margen-credito").text().replace("%", "").trim();

            const margenContado = parseFloat(margenContadoStr) || 0;
            const margenTC = parseFloat(margenTCStr) || 0;
            const margenCredito = parseFloat(margenCreditoStr) || 0;

            // Calcular comprometido
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
                //margenCredito: margenCredito
            });
        });

        return articulos;
    }

    // -----------------------------
    // Guardar (Items) - ACTUALIZADO
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

        // Leer datos del formulario
        const idFondo = parseInt($("#fondoProveedorIdItems").val(), 10) || 0;
        const idMotivo = parseInt($("#fondoTipoItems").val(), 10) || 0;
        const descripcion = $("#fondoDescripcionItems").val().trim();
        const fechaInicio = toISOFromDDMMYYYY($("#fondoFechaInicioItems").val());
        const fechaFin = toISOFromDDMMYYYY($("#fondoFechaFinItems").val());

        // Leer valor total (es calculado)
        const valorTotal = parseCurrencyToNumber($("#fondoValorTotalItems").val());

        // Leer artículos de la tabla
        const articulos = leerDetalleItemsDesdeTabla();

        // Construir JSON
        const data = {
            tipoclaseetiqueta: "ACARTICULO",
            idopcion: idOpcionActual,
            idcontrolinterfaz: "BTNGRABAR",
            idevento: "EVCLICK",
            acuerdo: {
                idTipoAcuerdo: 2, // 2 para Items (ajusta según tu lógica)
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

            // Mostrar loading
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
                        // Limpiar formulario
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
                            // Si hay errores de validación
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
    // Guardar (General)
    // -----------------------------
    function guardarGeneral() {
        if (!ensureApiBaseUrl()) return;
        if (!validarGeneral()) return;

        const idOpcionActual = getIdOpcionSeguro();
        if (!idOpcionActual) {
            Swal.fire("Error", "No se pudo obtener idOpcion.", "error");
            return;
        }

        const valorTotal = parseCurrencyToNumber($("#fondoValorTotalGeneral").val());
        const valorDisponible = parseCurrencyToNumber($("#fondoDisponibleGeneral").val());

        const data = {
            tipoclaseetiqueta: "ACGENERAL",
            idopcion: idOpcionActual,
            idcontrolinterfaz: "BTNGRABAR",
            idevento: "EVCLICK",
            acuerdo: {
                idTipoAcuerdo: 1,
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

                    Swal.fire({
                        icon: "error",
                        title: "Error al Guardar",
                        text: mensajeError,
                        footer: `<small>Código: ${xhr.status}</small>`,
                    });
                },
            });
        });
    }

    // -----------------------------
    // Guardar (Items)
    // -----------------------------

    /*
    function guardarItems() {
        console.log("ejecutar guardar items");
        if (!ensureApiBaseUrl()) return;
        if (!validarItems()) return;

        const idOpcionActual = getIdOpcionSeguro();
        console.log("idOpcionActual: ", idOpcionActual);
        if (!idOpcionActual) {
            Swal.fire("Error", "No se pudo obtener idOpcion.", "error");
            return;
        }

        const detalle = leerDetalleItemsDesdeTabla();

        const data = {
            descripcion: $("#fondoDescripcionItems").val().trim(),
            idproveedor: $("#fondoProveedorIdItems").val().trim(),
            idmotivo: parseInt($("#fondoTipoItems").val(), 10) || 0,
            fechainicio: toISOFromDDMMYYYY($("#fondoFechaInicioItems").val()),
            fechafin: toISOFromDDMMYYYY($("#fondoFechaFinItems").val()),
            detalleItems: detalle,
            idusuarioingreso: getUsuario(),
            nombreusuarioingreso: getUsuario(),
            idopcion: idOpcionActual,
            idcontrolinterfaz: "BTNGRABAR",
            idevento: "EVCLICK",
            nombreusuario: getUsuario(),
        };

        console.log("data que envia al guardar: ", data);
        Swal.fire({
            title: "Confirmar Guardado",
            text: "¿Desea guardar el acuerdo POR ÍTEMS?",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#009845",
            cancelButtonColor: "#d33",
            confirmButtonText: "Sí, Guardar",
            cancelButtonText: "Cancelar",
        }).then((result) => {
            if (!result.isConfirmed) return;

            const url = `${window.apiBaseUrl}/api/Acuerdo/insertar-items`;

            $.ajax({
                url: url,
                type: "POST",
                contentType: "application/json",
                data: JSON.stringify(data),
                headers: {
                    idopcion: String(idOpcionActual),
                    usuario: getUsuario(),
                },
                success: function () {
                    Swal.fire({
                        icon: "success",
                        title: "¡Guardado!",
                        text: "El acuerdo POR ÍTEMS se guardó correctamente.",
                        showConfirmButton: false,
                        timer: 1400,
                    });

                    $("#fondoTipoItems").val("");
                    $("#fondoProveedorItems").val("Seleccione...");
                    $("#fondoProveedorIdItems").val("");
                    $("#fondoDescripcionItems").val("");
                    $("#fondoFechaInicioItems").val("");
                    $("#fondoFechaFinItems").val("");
                    $("#fondoValorTotalItems").val("");
                    $("#tablaItemsBody").empty();
                },
                error: function (xhr) {
                    console.error("Error guardado items:", xhr.status, xhr.responseText);
                    Swal.fire({
                        icon: "error",
                        title: "Oops...",
                        text: "Algo salió mal al guardar el acuerdo POR ÍTEMS.",
                        footer: xhr.responseText ? `Detalle: ${xhr.responseText}` : "",
                    });
                },
            });
        });
    }*/

    /**
 * Modifica el item seleccionado habilitando los campos editables
 */
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

        // Verificar si ya está en modo edición
        const yaEnEdicion = !$fila.find('input[name="unidadesLimite"]').prop("disabled");

        if (yaEnEdicion) {
            // Guardar cambios y deshabilitar
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
                    // Deshabilitar campos editables
                    $fila.find(".celda-editable input").prop("disabled", true);

                    // Recalcular totales
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
            // Habilitar campos editables (amarillos)
            $fila.find(".celda-editable input").prop("disabled", false);

            // Enfocar el primer campo editable
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

    /**
     * Elimina el item seleccionado
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
                    timer: 1500
                });
            }
        });
    }

    // -----------------------------
    // Init principal
    // -----------------------------
    $(document).ready(function () {
        console.log("=== CrearAcuerdo INIT (CON CHECKBOXES) ===");

        toggleAcuerdoForm();
        $("#acuerdoTipo").on("change", function () {
            toggleAcuerdoForm();

            if (getTipoAcuerdo() === "Items" && $("#fondoTipoItems option").length <= 1) {
                cargarMotivosItems();
            }
        });

        // Cargar config + combos
        $.get("/config")
            .done(function (config) {
                window.apiBaseUrl = config.apiBaseUrl;
                console.log("apiBaseUrl:", window.apiBaseUrl);

                cargarMotivosGeneral();
                cargarMotivosItems();
            })
            .fail(function (xhr) {
                console.error("ERROR /config:", xhr.status, xhr.responseText);
                Swal.fire({
                    icon: "error",
                    title: "Error",
                    text: "No se pudo cargar /config.",
                });
            });

        // Modal proveedores
        $("#modalConsultaProveedor").on("show.bs.modal", function () {
            consultarProveedor();
        });

        $("#btnAceptarProveedor").on("click", function () {
            const $selected = $("#tablaProveedores tbody input[name='selectProveedor']:checked");
            if ($selected.length === 0) {
                Swal.fire("Atención", "Seleccione un registro.", "info");
                return;
            }

            const idFondo = $selected.data("idfondo");
            const descripcion = $selected.data("descripcion");
            const proveedor = $selected.data("proveedor");
            const ruc = $selected.data("ruc");
            const disponible = $selected.data("disponible");
            const comprometido = $selected.data("comprometido");
            const liquidado = $selected.data("liquidado");

            const display = `${idFondo} - (${proveedor})`;

            console.log("✅ Fondo seleccionado:", {
                idFondo,
                descripcion,
                proveedor,
                ruc,
                disponible,
                comprometido,
                liquidado,
            });

            setFondoEnFormActivo({
                idFondo,
                display,
                ruc,
                disponible,
                comprometido,
                liquidado,
            });

            $("#modalConsultaProveedor").modal("hide");
        });

        // Modal Items
        $("#modalConsultaItems").on("show.bs.modal", function () {
            cargarFiltrosItems();
            consultarItems();
        });

        // Checkbox "Todos" en modal Items
        $("#checkTodosItems").on("change", function () {
            const isChecked = $(this).is(":checked");
            $("#tablaItemsConsulta tbody .item-checkbox").prop("checked", isChecked);
        });

        // Botón Procesar Selección
        $("#btnProcesarFiltros").on("click", function () {
            console.log("🔍 Procesando filtros...");

            const marcasSeleccionadas = getSelectedFilterValues('filtroMarca');
            const divisionesSeleccionadas = getSelectedFilterValues('filtroDivision');
            const departamentosSeleccionados = getSelectedFilterValues('filtroDepartamento');
            const clasesSeleccionadas = getSelectedFilterValues('filtroClase');
            const articuloBuscado = $("#filtroArticulo").val().trim();

            const filtros = {
                marcas: marcasSeleccionadas.length > 0 ? marcasSeleccionadas : [],
                divisiones: divisionesSeleccionadas.length > 0 ? divisionesSeleccionadas : [],
                departamentos: departamentosSeleccionados.length > 0 ? departamentosSeleccionados : [],
                clases: clasesSeleccionadas.length > 0 ? clasesSeleccionadas : [],
                codigoarticulo: articuloBuscado || '',
            };

            console.log("📋 Filtros aplicados:", filtros);
            console.log(`   - Marcas: ${marcasSeleccionadas.length} seleccionadas`);
            console.log(`   - Divisiones: ${divisionesSeleccionadas.length} seleccionadas`);
            console.log(`   - Departamentos: ${departamentosSeleccionados.length} seleccionados`);
            console.log(`   - Clases: ${clasesSeleccionadas.length} seleccionadas`);

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

        // Botón Limpiar Filtros (si existe en el HTML)
        $("#btnLimpiarFiltros").on("click", function () {
            limpiarFiltros();
        });

        // Botón Seleccionar Items
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

        // Botones de gestión de items
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

        // Datepickers + moneda
        initDatepickers();
        initCurrencyGeneral();
        initCurrencyItems();

        // Botones guardar
        $("#btnGuardarAcuerdoGeneral").on("click", function (e) {
            e.preventDefault();
            guardarGeneral();
        });

        $("#btnGuardarAcuerdoItems").on("click", function (e) {
            e.preventDefault();
            guardarItems();
        });
    });
})();