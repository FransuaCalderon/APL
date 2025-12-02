/**
 * CrearAcuerdo.js
 * Lógica completa para la vista CrearAcuerdo.cshtml
 * - Diferencia General vs Items
 * - Carga combos Motivo (ACMOTIVO)
 * - Modal Proveedores
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
        // intenta con obtenerIdOpcionActual, y si no existe, con obtenerInfoOpcionActual().idOpcion
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
        return d.toISOString();
    }

    function compareDatesDDMMYYYY(a, b) {
        // retorna: a - b en ms
        const [da, ma, ya] = a.split("/").map(Number);
        const [db, mb, yb] = b.split("/").map(Number);
        return new Date(ya, ma - 1, da).getTime() - new Date(yb, mb - 1, db).getTime();
    }

    function parseCurrencyToNumber(monedaStr) {
        if (!monedaStr) return 0;

        let v = String(monedaStr)
            .replace(/\$/g, "")
            .replace(/\s/g, "")
            .replace(/\./g, ""); // miles

        v = v.replace(",", "."); // decimal
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
        return $("#acuerdoTipo").val(); // "General" | "Items"
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

        console.log("idOpcionActual obtenido:", idOpcionActual);
        console.log("usuario obtenido:", usuario);
        console.log("$select existe:", $select && $select.length > 0);
        console.log("$select selector:", $select ? $select.selector : "N/A");

        if (!$select || $select.length === 0) {
            console.error("❌ Select no existe para cargar motivos.");
            return;
        }

        if (!ensureApiBaseUrl()) {
            console.error("❌ apiBaseUrl no está configurado");
            return;
        }

        console.log("✓ apiBaseUrl configurado:", window.apiBaseUrl);

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
        console.log("Etiqueta a consultar:", etiqueta);

        const urlCompleta = `${window.apiBaseUrl}/api/Opciones/ConsultarCombos/${etiqueta}`;
        console.log("URL completa del AJAX:", urlCompleta);

        $select.empty().append($("<option>").val("").text("Cargando..."));
        console.log("Select limpiado y mensaje 'Cargando...' agregado");

        const headersAjax = {
            idopcion: String(idOpcionActual),
            usuario: usuario,
        };
        console.log("Headers del AJAX:", JSON.stringify(headersAjax, null, 2));

        console.log("🚀 Iniciando petición AJAX...");

        $.ajax({
            url: urlCompleta,
            method: "GET",
            headers: headersAjax,
            beforeSend: function (xhr) {
                console.log("beforeSend - Headers configurados en XHR:");
                console.log("  - idopcion:", xhr.getRequestHeader ? xhr.getRequestHeader('idopcion') : 'N/A');
                console.log("  - usuario:", xhr.getRequestHeader ? xhr.getRequestHeader('usuario') : 'N/A');
            },
            success: function (data) {
                console.log("✅ SUCCESS - Respuesta recibida del servidor");
                console.log("Tipo de data recibida:", typeof data);
                console.log("Es array:", Array.isArray(data));
                console.log("Data completa:", JSON.stringify(data, null, 2));
                console.log("Cantidad de registros:", Array.isArray(data) ? data.length : "N/A");

                $select.empty().append($("<option>").val("").text("Seleccione..."));
                console.log("Select limpiado y opción 'Seleccione...' agregada");

                if (Array.isArray(data) && data.length > 0) {
                    console.log(`📋 Procesando ${data.length} motivos...`);

                    data.forEach(function (item, index) {
                        console.log(`  Motivo ${index + 1}:`, {
                            idcatalogo: item.idcatalogo,
                            nombre_catalogo: item.nombre_catalogo,
                            item_completo: item
                        });

                        $select.append(
                            $("<option>").val(item.idcatalogo).text(item.nombre_catalogo)
                        );
                    });

                    console.log("✓ Todas las opciones agregadas al select");
                    console.log("Total opciones en select:", $select.find("option").length);
                } else {
                    console.warn("⚠️ No se recibieron motivos (lista vacía o no es array).");
                    console.log("Data recibida:", data);
                }

                if (typeof callback === "function") {
                    console.log("Ejecutando callback...");
                    callback();
                } else {
                    console.log("No hay callback para ejecutar");
                }

                console.log("=== FIN cargarTipoMotivoIntoSelect SUCCESS ===");
            },
            error: function (xhr, status, error) {
                console.error("❌ ERROR en petición AJAX");
                console.error("Status:", status);
                console.error("Error:", error);
                console.error("HTTP Status Code:", xhr.status);
                console.error("Response Text:", xhr.responseText);
                console.error("Ready State:", xhr.readyState);
                console.error("Status Text:", xhr.statusText);

                try {
                    const responseJson = JSON.parse(xhr.responseText);
                    console.error("Response JSON parseado:", responseJson);
                } catch (e) {
                    console.error("No se pudo parsear responseText como JSON");
                }

                $select.empty().append($("<option>").val("").text("No se pudo cargar"));
                console.log("Select actualizado con mensaje de error");

                Swal.fire({
                    icon: "error",
                    title: "Error",
                    text: "No se pudieron cargar los motivos de acuerdo.",
                });

                console.log("=== FIN cargarTipoMotivoIntoSelect ERROR ===");
            },
        });
    }

    function cargarMotivosGeneral() {
        console.log(">>> Llamando cargarMotivosGeneral()");
        console.log("Select target: #fondoTipoGeneral");
        console.log("Select existe:", $("#fondoTipoGeneral").length > 0);
        cargarTipoMotivoIntoSelect($("#fondoTipoGeneral"));
        console.log("<<< Fin cargarMotivosGeneral()");
    }

    function cargarMotivosItems() {
        console.log(">>> Llamando cargarMotivosItems()");
        console.log("Select target: #fondoTipoItems");
        console.log("Select existe:", $("#fondoTipoItems").length > 0);
        cargarTipoMotivoIntoSelect($("#fondoTipoItems"));
        console.log("<<< Fin cargarMotivosItems()");
    }
    // -----------------------------
    // Proveedores (modal)
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
                    // === ASOCIACIÓN REAL a tu endpoint ===
                    const idFondo = pick(x, ["idfondo", "idFondo"]);
                    const descripcion = pick(x, ["descripcion", "descripcionFondo", "nombreFondo"]);
                    const ruc = pick(x, ["idproveedor", "ruc", "identificacion"]);
                    const proveedor = pick(x, ["proveedor", "nombreProveedor", "razonSocialProveedor"], ""); // si no viene, queda vacío
                    const tipoFondo = pick(x, ["tipoFondo", "tipoFondoDescripcion", "descTipoFondo"], pick(x, ["idtipofondo", "idTipoFondo"]));

                    const valorFondo = fmtMoney(pick(x, ["valorfondo", "valorFondo", "montoFondo"], 0));
                    const fechaInicio = fmtDate(pick(x, ["fechainidovigencia", "fechainicio", "fechaInicio", "fechaIniVigencia"]));
                    const fechaFin = fmtDate(pick(x, ["fechafinvigencia", "fechafin", "fechaFin", "fechaFinVigencia"]));

                    const disponible = fmtMoney(pick(x, ["valordisponible", "valorDisponible"], 0));
                    const comprometido = fmtMoney(pick(x, ["valorcomprometido", "valorComprometido"], 0));
                    const liquidado = fmtMoney(pick(x, ["valorliquidado", "valorLiquidado"], 0));

                    // Estado: si el endpoint trae texto, úsalo; si no, muestra el id
                    const estado = pick(x, ["estado", "descEstado"], pick(x, ["idestadoregistro", "idEstadoRegistro"]));

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
                console.error("Detalles:", xhr.status, xhr.responseText);
                $tbody.empty().append(
                    '<tr><td colspan="13" class="text-center text-danger">Error al cargar datos.</td></tr>'
                );
            },
        });
    }


    function setProveedorEnFormActivo(proveedorNombre, proveedorRuc) {
        const tipo = getTipoAcuerdo();
        if (tipo === "General") {
            $("#fondoProveedorGeneral").val(proveedorNombre);
            $("#fondoProveedorIdGeneral").val(proveedorRuc);
        } else {
            $("#fondoProveedorItems").val(proveedorNombre);
            $("#fondoProveedorIdItems").val(proveedorRuc);
        }
    }

    // -----------------------------
    // Datepickers
    // -----------------------------
    function initDatepickers() {
        if (!$.datepicker) {
            console.warn("jQuery UI Datepicker no está disponible. Revisa el script jquery-ui.min.js");
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

        // General
        attachPicker("#fondoFechaInicioGeneral");
        attachPicker("#fondoFechaFinGeneral");

        // Items
        attachPicker("#fondoFechaInicioItems");
        attachPicker("#fondoFechaFinItems");

        // Botones abrir calendario
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

        // Solo deja números y una coma
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

    // -----------------------------
    // Validaciones
    // -----------------------------
    function validarGeneral() {
        const proveedorRuc = $("#fondoProveedorIdGeneral").val();
        const motivo = $("#fondoTipoGeneral").val();
        const desc = $("#fondoDescripcionGeneral").val();
        const ini = $("#fondoFechaInicioGeneral").val();
        const fin = $("#fondoFechaFinGeneral").val();
        const total = parseCurrencyToNumber($("#fondoValorTotalGeneral").val());

        if (!proveedorRuc || proveedorRuc.trim() === "") {
            Swal.fire("Validación", "Debe seleccionar un proveedor.", "warning");
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

    function leerDetalleItemsDesdeTabla() {
        // Lee filas de tablaItemsBody y construye arreglo.
        const detalle = [];
        $("#tablaItemsBody tr").each(function () {
            const $tr = $(this);
            const radio = $tr.find('input[type="radio"][name="selectedItem"]').val() || "";
            const unidades = ($tr.find('input[name="unidadesLimite"]').val() || "").trim();

            // si tu tabla real tiene más inputs con name, léelos aquí
            detalle.push({
                itemId: radio,
                unidadesLimite: unidades ? parseInt(unidades, 10) : 0,
            });
        });
        return detalle;
    }

    function validarItems() {
        const proveedorRuc = $("#fondoProveedorIdItems").val();
        const motivo = $("#fondoTipoItems").val();
        const desc = $("#fondoDescripcionItems").val();
        const ini = $("#fondoFechaInicioItems").val();
        const fin = $("#fondoFechaFinItems").val();

        if (!proveedorRuc || proveedorRuc.trim() === "") {
            Swal.fire("Validación", "Debe seleccionar un proveedor.", "warning");
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

        // Validar que haya al menos 1 fila en la tabla
        const filas = $("#tablaItemsBody tr").length;
        if (filas <= 0) {
            Swal.fire("Validación", "Debe existir al menos un ítem en el detalle.", "warning");
            return false;
        }

        // Validar unidades (si aplica)
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
            Swal.fire("Validación", "Revise el detalle: 'Unidades Límite' debe ser un número mayor a 0.", "warning");
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
            Swal.fire("Error", "No se pudo obtener idOpcion. Ingrese nuevamente desde el menú.", "error");
            return;
        }

        const data = {
            descripcion: $("#fondoDescripcionGeneral").val().trim(),
            idproveedor: $("#fondoProveedorIdGeneral").val().trim(),
            idmotivo: parseInt($("#fondoTipoGeneral").val(), 10) || 0,
            valoracuerdo: parseCurrencyToNumber($("#fondoValorTotalGeneral").val()),
            fechainicio: toISOFromDDMMYYYY($("#fondoFechaInicioGeneral").val()),
            fechafin: toISOFromDDMMYYYY($("#fondoFechaFinGeneral").val()),
            idusuarioingreso: getUsuario(),
            nombreusuarioingreso: getUsuario(),
            idopcion: idOpcionActual,
            idcontrolinterfaz: "BTNGRABAR",
            idevento: "EVCLICK",
            nombreusuario: getUsuario(),
        };

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
                success: function () {
                    Swal.fire({
                        icon: "success",
                        title: "¡Guardado!",
                        text: "El acuerdo GENERAL se guardó correctamente.",
                        showConfirmButton: false,
                        timer: 1400,
                    });

                    // Limpieza
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
                    console.error("Error guardado general:", xhr.status, xhr.responseText);
                    Swal.fire({
                        icon: "error",
                        title: "Oops...",
                        text: "Algo salió mal al guardar el acuerdo GENERAL.",
                        footer: xhr.responseText ? `Detalle: ${xhr.responseText}` : "",
                    });
                },
            });
        });
    }

    // -----------------------------
    // Guardar (Items)
    // -----------------------------
    function guardarItems() {
        if (!ensureApiBaseUrl()) return;
        if (!validarItems()) return;

        const idOpcionActual = getIdOpcionSeguro();
        if (!idOpcionActual) {
            Swal.fire("Error", "No se pudo obtener idOpcion. Ingrese nuevamente desde el menú.", "error");
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

            // Si tu backend usa otro endpoint, cámbialo aquí:
            const url = `${window.apiBaseUrl}/api/Acuerdo/insertar`;

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

                    // Limpieza (básica)
                    $("#fondoTipoItems").val("");
                    $("#fondoProveedorItems").val("Seleccione...");
                    $("#fondoProveedorIdItems").val("");
                    $("#fondoDescripcionItems").val("");
                    $("#fondoFechaInicioItems").val("");
                    $("#fondoFechaFinItems").val("");
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
    }

    // -----------------------------
    // Demo: Render tabla Items (si aún no conectas API)
    // -----------------------------
    function renderItemsTableMock() {
        const mockItems = [
            { id: "COD1231", nombre: "TV 65 Samsung 4K", costo: "999,999.99", unidades: "10" },
            { id: "COD1232", nombre: "TV 70 Samsung 4K", costo: "999,999.99", unidades: "5" },
        ];

        const $tbody = $("#tablaItemsBody");
        $tbody.empty();

        mockItems.forEach((item) => {
            const row = `
        <tr>
          <td class="align-middle text-center">
            <input type="radio" name="selectedItem" value="${item.id}">
          </td>
          <td class="align-middle">${item.id} - ${item.nombre}</td>
          <td class="align-middle">
            <input type="text" class="form-control-sm w-100" value="$ ${item.costo}" disabled>
          </td>
          <td class="align-middle">
            <input type="text" class="form-control-sm w-100" name="unidadesLimite" value="${item.unidades}">
          </td>
          <td class="align-middle"><input type="text" class="form-control-sm w-100" value="$ 0,00"></td>
          <td class="align-middle"><input type="text" class="form-control-sm w-100" value="$ 0,00"></td>
          <td class="align-middle"><input type="text" class="form-control-sm w-100" value="$ 0,00"></td>
          <td class="align-middle"><input type="text" class="form-control-sm w-100" value="$ 0,00"></td>
          <td class="align-middle"><input type="text" class="form-control-sm w-100" value="$ 0,00" disabled></td>
          <td class="align-middle"><input type="text" class="form-control-sm w-100" value="0,00"></td>
          <td class="align-middle"><input type="text" class="form-control-sm w-100" value="0,00"></td>
          <td class="align-middle"><input type="text" class="form-control-sm w-100" value="0,00"></td>
        </tr>
      `;
            $tbody.append(row);
        });
    }

    // -----------------------------
    // Init principal
    // -----------------------------
    $(document).ready(function () {
        console.log("=== CrearAcuerdo INIT ===");
        console.log("Usuario actual:", getUsuario());

        toggleAcuerdoForm();
        $("#acuerdoTipo").on("change", function () {
            toggleAcuerdoForm();

            // cuando cambias a Items, si está vacío recarga
            if (getTipoAcuerdo() === "Items" && $("#fondoTipoItems option").length <= 1) {
                cargarMotivosItems();
            }
        });

        // Cargar config + luego combos
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
                    text: "No se pudo cargar /config. Revise apiBaseUrl.",
                });
            });

        // Modal proveedores
        $("#modalConsultaProveedor").on("show.bs.modal", function () {
            consultarProveedor();
        });

        $("#btnAceptarProveedor").on("click", function () {
            const $selected = $("#tablaProveedores tbody input[name='selectProveedor']:checked");
            if ($selected.length === 0) {
                Swal.fire("Atención", "Seleccione un proveedor.", "info");
                return;
            }

            const proveedorNombre = $selected.data("nombre");
            const proveedorRuc = $selected.data("ruc");

            setProveedorEnFormActivo(proveedorNombre, proveedorRuc);
            $("#modalConsultaProveedor").modal("hide");
        });

        // Datepickers + moneda
        initDatepickers();
        initCurrencyGeneral();

        // Botones guardar
        $("#btnGuardarAcuerdoGeneral").on("click", function (e) {
            e.preventDefault();
            guardarGeneral();
        });

        $("#btnGuardarAcuerdoItems").on("click", function (e) {
            e.preventDefault();
            guardarItems();
        });

        // Tabla items mock (si aún no conectas API)
        renderItemsTableMock();

        // Botones de la tabla (placeholder)
        $("#btnAddItem").on("click", function (e) {
            e.preventDefault();
            console.log("Añadir Item (pendiente).");
        });
        $("#btnModifyItem").on("click", function (e) {
            e.preventDefault();
            console.log("Modificar Item (pendiente).");
        });
        $("#btnDeleteItem").on("click", function (e) {
            e.preventDefault();
            console.log("Eliminar Item (pendiente).");
        });
    });
})();
