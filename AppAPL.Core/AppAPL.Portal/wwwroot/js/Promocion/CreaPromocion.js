/**
 * CrearPromocion.js - VERSIÓN MAQUETADO (SIN API)
 * Lógica de UI para la vista CrearPromocion.cshtml
 * - Diferencia General vs Artículos vs Combos
 * - Datepickers
 * - Modales
 * - Validaciones básicas de UI
 * - Toggle de formularios
 */

(function () {
    "use strict";

    // -----------------------------
    // Helpers base
    // -----------------------------
    function getUsuario() {
        return window.usuarioActual || "admin";
    }

    function isValidDateDDMMYYYY(s) {
        if (!s || !/^\d{2}\/\d{2}\/\d{4}$/.test(s)) return false;
        const [dd, mm, yyyy] = s.split("/").map(Number);
        const d = new Date(yyyy, mm - 1, dd);
        return d.getFullYear() === yyyy && d.getMonth() === mm - 1 && d.getDate() === dd;
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

    function parseCurrencyToNumber(monedaStr) {
        if (!monedaStr) return 0;
        let v = String(monedaStr).trim();
        v = v.replace(/\$/g, "").replace(/\s/g, "");
        if (!v) return 0;

        const tieneComaDecimal = v.includes(',');
        if (tieneComaDecimal) {
            v = v.replace(/\./g, "").replace(",", ".");
        }
        return parseFloat(v) || 0;
    }

    // -----------------------------
    // Control de tipo de promoción
    // -----------------------------
    function getTipoPromocion() {
        return $("#promocionTipo").val();
    }

    function togglePromocionForm() {
        const tipo = getTipoPromocion();
        $("#formGeneral").toggle(tipo === "General");
        $("#formArticulos").toggle(tipo === "Articulos");
        $("#formCombos").toggle(tipo === "Combos");

        console.log(`📌 Tipo de promoción seleccionado: ${tipo}`);
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

        // General
        setupDatePair("#fechaInicioGeneral", "#fechaFinGeneral");

        // Artículos
        setupDatePair("#fechaInicioArticulos", "#fechaFinArticulos");

        // Combos
        setupDatePair("#fechaInicioCombos", "#fechaFinCombos");

        // Botones de calendario
        $("#btnFechaInicioGeneral").on("click", function () {
            $("#fechaInicioGeneral").datepicker("show");
        });
        $("#btnFechaFinGeneral").on("click", function () {
            $("#fechaFinGeneral").datepicker("show");
        });
        $("#btnFechaInicioArticulos").on("click", function () {
            $("#fechaInicioArticulos").datepicker("show");
        });
        $("#btnFechaFinArticulos").on("click", function () {
            $("#fechaFinArticulos").datepicker("show");
        });
        $("#btnFechaInicioCombos").on("click", function () {
            $("#fechaInicioCombos").datepicker("show");
        });
        $("#btnFechaFinCombos").on("click", function () {
            $("#fechaFinCombos").datepicker("show");
        });
    }

    // -----------------------------
    // Checkbox Artículo (habilitar/deshabilitar)
    // -----------------------------
    function initCheckboxArticulo() {
        $("#chkArticuloGeneral").on("change", function () {
            const isChecked = $(this).is(":checked");
            $("#articuloGeneral").prop("disabled", !isChecked);

            // Deshabilitar selects múltiples si está marcado
            $("#filtroMarcaGeneral, #filtroDivisionGeneral, #filtroDepartamentoGeneral, #filtroClaseGeneral")
                .prop("disabled", isChecked);

            if (!isChecked) {
                $("#articuloGeneral").val("");
            }
        });
    }

    // -----------------------------
    // Tipo de Cliente - Mostrar botón lista
    // -----------------------------
    function initTipoCliente() {
        $("#tipoClienteGeneral").on("change", function () {
            const valor = $(this).val();
            if (valor === "3") {
                $("#btnListaClienteGeneral").removeClass("d-none");
            } else {
                $("#btnListaClienteGeneral").addClass("d-none");
            }
        });
    }

    // -----------------------------
    // Modal Clientes - Archivo
    // -----------------------------
    function initModalClientesArchivo() {
        $("#chkSeleccionaFile").on("change", function () {
            const isChecked = $(this).is(":checked");
            $("#txtListaClientes").prop("disabled", isChecked);
            $("#inputFileClientes").prop("disabled", !isChecked);
            $("#btnUploadClientes").prop("disabled", !isChecked);

            if (!isChecked) {
                $("#fileNameClientes").text("Ningún archivo seleccionado");
            }
        });

        $("#inputFileClientes").on("change", function () {
            if (this.files && this.files[0]) {
                $("#fileNameClientes").text(this.files[0].name);
            }
        });
    }

    // -----------------------------
    // Modal Items - Checkbox Todos
    // -----------------------------
    function initModalItemsCheckbox() {
        $("#checkTodosItemsModal").on("change", function () {
            const isChecked = $(this).is(":checked");
            $("#tablaItemsModal tbody .item-checkbox-modal").prop("checked", isChecked);
        });

        // Búsqueda en tabla
        $("#buscarItemModal").on("keyup", function () {
            const valor = $(this).val().toLowerCase();
            $("#tablaItemsModal tbody tr").each(function () {
                const texto = $(this).text().toLowerCase();
                $(this).toggle(texto.indexOf(valor) > -1);
            });
        });
    }

    // -----------------------------
    // Agregar Items a Tabla Artículos
    // -----------------------------
    function agregarItemsATablaArticulos() {
        const $tbody = $("#tablaArticulosBody");

        // Datos de ejemplo (en producción vendrían de la selección del modal)
        const itemsEjemplo = [
            {
                codigo: "123",
                descripcion: "TV 65 Samsung 4K",
                costo: 1400.00,
                stockBodega: 300,
                stockTienda: 100,
                invOptimo: 250,
                excedenteU: 150,
                excedenteS: 210000.00
            },
            {
                codigo: "126",
                descripcion: "TV 55 Samsung 4K",
                costo: 1200.00,
                stockBodega: 250,
                stockTienda: 100,
                invOptimo: 200,
                excedenteU: 150,
                excedenteS: 180000.00
            }
        ];

        itemsEjemplo.forEach((item) => {
            const existe = $tbody.find(`tr[data-codigo="${item.codigo}"]`).length > 0;
            if (existe) {
                console.log(`Item ${item.codigo} ya existe en la tabla`);
                return;
            }

            const nuevaFila = `
                <tr data-codigo="${item.codigo}">
                    <td class="table-sticky-col align-middle table-light">
                        <div class="form-check">
                            <input class="form-check-input item-row-radio" type="radio" name="itemArticuloSeleccionado">
                            <label class="form-check-label">${item.codigo} - ${item.descripcion}</label>
                        </div>
                    </td>
                    <td><input type="text" style="width: 6rem;" class="form-control form-control-sm custom-celda-bg" value="${formatCurrencySpanish(item.costo)}" readonly></td>
                    <td><input type="text" style="width: 5rem;" class="form-control form-control-sm custom-celda-bg" value="${item.stockBodega}" readonly></td>
                    <td><input type="text" style="width: 5rem;" class="form-control form-control-sm custom-celda-bg" value="${item.stockTienda}" readonly></td>
                    <td><input type="text" style="width: 5rem;" class="form-control form-control-sm custom-celda-bg" value="${item.invOptimo}" readonly></td>
                    <td><input type="text" style="width: 5rem;" class="form-control form-control-sm custom-celda-bg" value="${item.excedenteU}" readonly></td>
                    <td><input type="text" style="width: 6rem;" class="form-control form-control-sm custom-celda-bg" value="${formatCurrencySpanish(item.excedenteS)}" readonly></td>
                    <td><input type="text" style="width: 5rem;" class="form-control form-control-sm custom-celda-bg" value="75" readonly></td>
                    <td><input type="text" style="width: 6rem;" class="form-control form-control-sm custom-celda-bg" value="${formatCurrencySpanish(2000)}" readonly></td>
                    <td><input type="text" style="width: 5rem;" class="form-control form-control-sm custom-celda-bg" value="50" readonly></td>
                    <td><input type="text" style="width: 6rem;" class="form-control form-control-sm custom-celda-bg" value="${formatCurrencySpanish(2100)}" readonly></td>
                    <td><input type="text" style="width: 5rem;" class="form-control form-control-sm custom-celda-bg" value="40" readonly></td>
                    <td><input type="text" style="width: 6rem;" class="form-control form-control-sm custom-celda-bg" value="${formatCurrencySpanish(2200)}" readonly></td>
                    <td><input type="text" style="width: 6rem;" class="form-control form-control-sm custom-celda-bg" value="${formatCurrencySpanish(2200)}" readonly></td>
                    <td><input type="text" style="width: 5rem;" class="form-control form-control-sm custom-celda-bg" value="15%" readonly></td>
                    <td><input type="text" style="width: 5rem;" class="form-control form-control-sm custom-celda-bg" value="16%" readonly></td>
                    <td><input type="text" style="width: 5rem;" class="form-control form-control-sm custom-celda-bg" value="17%" readonly></td>
                    <td><input type="text" style="width: 5rem;" class="form-control form-control-sm custom-celda-bg" value="14%" readonly></td>
                    <td><input type="number" style="width: 5rem;" class="form-control form-control-sm" placeholder="999"></td>
                    <td><input type="number" style="width: 5rem;" class="form-control form-control-sm" placeholder="999"></td>
                    <td>
                        <button type="button" class="btn btn-outline-secondary btn-sm" data-bs-toggle="modal" data-bs-target="#modalMediosPago">
                            Medios Pago
                        </button>
                    </td>
                    <td><input type="text" style="width: 6rem;" class="form-control form-control-sm custom-celda-bg" value="${formatCurrencySpanish(2200)}" readonly></td>
                    <td><input type="text" style="width: 6rem;" class="form-control form-control-sm" placeholder="$ 0.00"></td>
                    <td><input type="text" style="width: 6rem;" class="form-control form-control-sm" placeholder="$ 0.00"></td>
                    <td><input type="text" style="width: 6rem;" class="form-control form-control-sm" placeholder="$ 0.00"></td>
                    <td><input type="text" style="width: 6rem;" class="form-control form-control-sm" placeholder="$ 0.00"></td>
                    <td><input type="text" style="width: 6rem;" class="form-control form-control-sm" placeholder="$ 0.00"></td>
                    <td><input type="text" style="width: 6rem;" class="form-control form-control-sm" placeholder="$ 0.00"></td>
                    <td><input type="text" style="width: 6rem;" class="form-control form-control-sm" placeholder="$ 0.00"></td>
                    <td><input type="text" style="width: 6rem;" class="form-control form-control-sm" placeholder="$ 0.00"></td>
                    <td><input type="text" style="width: 6rem;" class="form-control form-control-sm" placeholder="$ 0.00"></td>
                    <td>
                        <div class="input-group input-group-sm">
                            <input type="text" class="form-control" placeholder="APR999">
                            <button class="btn btn-outline-secondary" type="button"><img src="~/img/ico/search.svg" alt="Buscar" style="width:14px;"></button>
                        </div>
                    </td>
                    <td><input type="text" style="width: 6rem;" class="form-control form-control-sm" placeholder="$ 0.00"></td>
                    <td>
                        <div class="input-group input-group-sm">
                            <input type="text" class="form-control" placeholder="REB999">
                            <button class="btn btn-outline-secondary" type="button"><img src="~/img/ico/search.svg" alt="Buscar" style="width:14px;"></button>
                        </div>
                    </td>
                    <td><input type="text" style="width: 6rem;" class="form-control form-control-sm" placeholder="$ 0.00"></td>
                    <td>
                        <div class="input-group input-group-sm">
                            <input type="text" class="form-control" placeholder="PROP999">
                            <button class="btn btn-outline-secondary" type="button"><img src="~/img/ico/search.svg" alt="Buscar" style="width:14px;"></button>
                        </div>
                    </td>
                    <td><input type="text" style="width: 5rem;" class="form-control form-control-sm custom-celda-bg" value="36%" readonly></td>
                    <td><input type="text" style="width: 5rem;" class="form-control form-control-sm" placeholder="0%"></td>
                    <td><input type="text" style="width: 5rem;" class="form-control form-control-sm" placeholder="0%"></td>
                    <td><input type="text" style="width: 5rem;" class="form-control form-control-sm" placeholder="0%"></td>
                    <td><input type="text" style="width: 5rem;" class="form-control form-control-sm" placeholder="0%"></td>
                    <td><input type="text" style="width: 6rem;" class="form-control form-control-sm" placeholder="$ 0.00"></td>
                    <td><input type="text" style="width: 6rem;" class="form-control form-control-sm" placeholder="$ 0.00"></td>
                    <td><input type="text" style="width: 6rem;" class="form-control form-control-sm" placeholder="$ 0.00"></td>
                    <td class="text-center">
                        <input class="form-check-input" type="checkbox">
                    </td>
                </tr>
            `;
            $tbody.append(nuevaFila);
        });

        Swal.fire({
            toast: true,
            position: "top-end",
            icon: "success",
            title: "Items agregados",
            showConfirmButton: false,
            timer: 1500,
        });
    }

    // -----------------------------
    // Eliminar Item de Tabla Artículos
    // -----------------------------
    function eliminarItemArticulo() {
        const $radioSeleccionado = $("#tablaArticulosBody .item-row-radio:checked");

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
        const itemDescripcion = $fila.find("label").text();

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
    // Agregar Combo a Tabla
    // -----------------------------
    function agregarComboATabla() {
        const $tbody = $("#tablaCombosBody");
        const codigo = "CO" + Math.floor(Math.random() * 1000);
        const nombre = $("#nombreCombo").val() || "Nuevo Combo";

        const nuevaFila = `
            <tr data-codigo="${codigo}">
                <td class="table-sticky-col align-middle table-light">
                    <div class="form-check">
                        <input class="form-check-input combo-row-radio" type="radio" name="comboSeleccionado">
                        <label class="form-check-label">${codigo} - ${nombre} <span class="badge text-bg-success rounded-pill">2</span></label>
                    </div>
                </td>
                <td><input type="text" style="width: 6rem;" class="form-control form-control-sm custom-celda-bg" value="${formatCurrencySpanish(2500)}" readonly></td>
                <td><input type="text" style="width: 5rem;" class="form-control form-control-sm custom-celda-bg" value="150" readonly></td>
                <td><input type="text" style="width: 5rem;" class="form-control form-control-sm custom-celda-bg" value="50" readonly></td>
                <td><input type="text" style="width: 5rem;" class="form-control form-control-sm custom-celda-bg" value="100" readonly></td>
                <td><input type="text" style="width: 5rem;" class="form-control form-control-sm custom-celda-bg" value="100" readonly></td>
                <td><input type="text" style="width: 6rem;" class="form-control form-control-sm custom-celda-bg" value="${formatCurrencySpanish(250000)}" readonly></td>
                <td><input type="number" style="width: 5rem;" class="form-control form-control-sm" placeholder="999"></td>
                <td><input type="number" style="width: 5rem;" class="form-control form-control-sm" placeholder="999"></td>
                <td>
                    <button type="button" class="btn btn-outline-secondary btn-sm" data-bs-toggle="modal" data-bs-target="#modalMediosPago">
                        Medios Pago
                    </button>
                </td>
                <td><input type="text" style="width: 6rem;" class="form-control form-control-sm custom-celda-bg" value="${formatCurrencySpanish(3500)}" readonly></td>
                <td><input type="text" style="width: 6rem;" class="form-control form-control-sm" placeholder="$ 0.00"></td>
                <td><input type="text" style="width: 6rem;" class="form-control form-control-sm" placeholder="$ 0.00"></td>
                <td><input type="text" style="width: 6rem;" class="form-control form-control-sm" placeholder="$ 0.00"></td>
                <td><input type="text" style="width: 6rem;" class="form-control form-control-sm" placeholder="$ 0.00"></td>
                <td><input type="text" style="width: 6rem;" class="form-control form-control-sm" placeholder="$ 0.00"></td>
                <td><input type="text" style="width: 6rem;" class="form-control form-control-sm" placeholder="$ 0.00"></td>
                <td><input type="text" style="width: 5rem;" class="form-control form-control-sm" placeholder="0%"></td>
                <td><input type="text" style="width: 5rem;" class="form-control form-control-sm" placeholder="0%"></td>
                <td><input type="text" style="width: 5rem;" class="form-control form-control-sm" placeholder="0%"></td>
                <td><input type="text" style="width: 6rem;" class="form-control form-control-sm" placeholder="$ 0.00"></td>
                <td><input type="text" style="width: 6rem;" class="form-control form-control-sm" placeholder="$ 0.00"></td>
                <td><input type="text" style="width: 6rem;" class="form-control form-control-sm" placeholder="$ 0.00"></td>
                <td class="text-center">
                    <input class="form-check-input" type="checkbox">
                </td>
            </tr>
        `;
        $tbody.append(nuevaFila);

        // Limpiar y cerrar sección de creación
        $("#nombreCombo").val("");
        $("#seccionCrearCombo").collapse("hide");

        Swal.fire({
            toast: true,
            position: "top-end",
            icon: "success",
            title: "Combo agregado",
            showConfirmButton: false,
            timer: 1500,
        });
    }

    // -----------------------------
    // Eliminar Combo
    // -----------------------------
    function eliminarCombo() {
        const $radioSeleccionado = $("#tablaCombosBody .combo-row-radio:checked");

        if ($radioSeleccionado.length === 0) {
            Swal.fire({
                icon: "warning",
                title: "Atención",
                text: "Debe seleccionar un combo para eliminar.",
                confirmButtonColor: "#009845"
            });
            return;
        }

        const $fila = $radioSeleccionado.closest("tr");
        const comboDescripcion = $fila.find("label").text();

        Swal.fire({
            title: "¿Está seguro?",
            html: `Se eliminará el combo:<br><strong>${comboDescripcion}</strong>`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#d33",
            cancelButtonColor: "#6c757d",
            confirmButtonText: "Sí, Eliminar",
            cancelButtonText: "Cancelar"
        }).then((result) => {
            if (result.isConfirmed) {
                $fila.remove();
                Swal.fire({
                    toast: true,
                    position: "top-end",
                    icon: "success",
                    title: "Combo eliminado",
                    showConfirmButton: false,
                    timer: 1500,
                });
            }
        });
    }

    // -----------------------------
    // Calcular descuento total (General)
    // -----------------------------
    function calcularDescuentoTotal() {
        const descProv = parseFloat($("#descuentoProveedorGeneral").val().replace("%", "")) || 0;
        const descProp = parseFloat($("#descuentoPropioGeneral").val().replace("%", "")) || 0;
        const total = descProv + descProp;
        $("#descuentoTotalGeneral").val(total.toFixed(2) + "%");
    }

    // -----------------------------
    // Limpiar formularios
    // -----------------------------
    function limpiarFormularioGeneral() {
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
                $("#formGeneral")[0].reset();
                $("#btnListaClienteGeneral").addClass("d-none");
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
    }

    function limpiarFormularioArticulos() {
        Swal.fire({
            title: '¿Está seguro?',
            html: 'Se perderán todos los datos ingresados<br><small class="text-muted">Incluyendo el detalle de artículos</small>',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'Sí, Cancelar',
            cancelButtonText: 'No, Continuar'
        }).then((result) => {
            if (result.isConfirmed) {
                $("#formArticulos")[0].reset();
                $("#tablaArticulosBody").empty();
                $("#promocionTipo").val("General").trigger("change");
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
    }

    function limpiarFormularioCombos() {
        Swal.fire({
            title: '¿Está seguro?',
            html: 'Se perderán todos los datos ingresados<br><small class="text-muted">Incluyendo los combos creados</small>',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'Sí, Cancelar',
            cancelButtonText: 'No, Continuar'
        }).then((result) => {
            if (result.isConfirmed) {
                $("#formCombos")[0].reset();
                $("#tablaCombosBody").empty();
                $("#seccionCrearCombo").collapse("hide");
                $("#promocionTipo").val("General").trigger("change");
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
    }

    // -----------------------------
    // Guardar (simulado - sin API)
    // -----------------------------
    function guardarPromocion(tipo) {
        Swal.fire({
            title: "Confirmar Guardado",
            html: `¿Desea guardar la promoción <strong>${tipo}</strong>?`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#009845",
            cancelButtonColor: "#d33",
            confirmButtonText: "Sí, Guardar",
            cancelButtonText: "Cancelar",
        }).then((result) => {
            if (result.isConfirmed) {
                // Simulación de guardado
                Swal.fire({
                    title: 'Guardando...',
                    text: 'Por favor espere',
                    allowOutsideClick: false,
                    allowEscapeKey: false,
                    timer: 1500,
                    didOpen: () => {
                        Swal.showLoading();
                    }
                }).then(() => {
                    Swal.fire({
                        icon: "success",
                        title: "¡Guardado!",
                        html: `La promoción <strong>${tipo}</strong> se guardó correctamente.<br><small class="text-muted">(Simulación - Sin API)</small>`,
                        showConfirmButton: true,
                        confirmButtonColor: "#009845"
                    });
                });
            }
        });
    }

    // -----------------------------
    // Init principal
    // -----------------------------
    $(document).ready(function () {
        console.log("=== CrearPromocion INIT (MAQUETADO) ===");

        // Mostrar formulario por defecto
        togglePromocionForm();

        // Cambio de tipo de promoción
        $("#promocionTipo").on("change", function () {
            togglePromocionForm();
        });

        // Inicializar componentes
        initDatepickers();
        initCheckboxArticulo();
        initTipoCliente();
        initModalClientesArchivo();
        initModalItemsCheckbox();

        // Eventos de descuento
        $("#descuentoProveedorGeneral, #descuentoPropioGeneral").on("blur", function () {
            calcularDescuentoTotal();
        });

        // Botones Cancelar
        $("#btnCancelarGeneral").on("click", function (e) {
            e.preventDefault();
            limpiarFormularioGeneral();
        });

        $("#btnCancelarArticulos").on("click", function (e) {
            e.preventDefault();
            limpiarFormularioArticulos();
        });

        $("#btnCancelarCombos").on("click", function (e) {
            e.preventDefault();
            limpiarFormularioCombos();
        });

        // Botones Guardar
        $("#btnGuardarPromocionGeneral").on("click", function (e) {
            e.preventDefault();
            guardarPromocion("GENERAL");
        });

        $("#btnGuardarPromocionArticulos").on("click", function (e) {
            e.preventDefault();
            guardarPromocion("CON ARTÍCULOS");
        });

        $("#btnGuardarPromocionCombos").on("click", function (e) {
            e.preventDefault();
            guardarPromocion("CON COMBOS");
        });

        // Botón seleccionar items del modal
        $("#btnSeleccionarItemsModal").on("click", function () {
            agregarItemsATablaArticulos();
            $("#modalConsultaItems").modal("hide");
        });

        // Botón eliminar item artículos
        $("#btnDeleteItemArticulos").on("click", function (e) {
            e.preventDefault();
            eliminarItemArticulo();
        });

        // Botón nuevo combo - mostrar sección
        $("#btnNuevoCombo").on("click", function () {
            $("#codigoCombo").val("CO" + Math.floor(Math.random() * 1000));
            $("#nombreCombo").val("");
            $("#seccionCrearCombo").collapse("show");
        });

        // Botón modificar combo
        $("#btnModificarCombo").on("click", function () {
            const $radioSeleccionado = $("#tablaCombosBody .combo-row-radio:checked");
            if ($radioSeleccionado.length === 0) {
                Swal.fire({
                    icon: "warning",
                    title: "Atención",
                    text: "Debe seleccionar un combo para modificar.",
                    confirmButtonColor: "#009845"
                });
                return;
            }
            $("#seccionCrearCombo").collapse("show");
        });

        // Botón eliminar combo
        $("#btnEliminarCombo").on("click", function (e) {
            e.preventDefault();
            eliminarCombo();
        });

        // Botón aceptar combo (agregar a tabla)
        $("#btnAceptarCombo").on("click", function () {
            if (!$("#nombreCombo").val().trim()) {
                Swal.fire({
                    icon: "warning",
                    title: "Atención",
                    text: "Debe ingresar un nombre para el combo.",
                    confirmButtonColor: "#009845"
                });
                return;
            }
            agregarComboATabla();
        });

        // Procesar filtros modal (simulado)
        $("#btnProcesarFiltrosModal").on("click", function () {
            Swal.fire({
                toast: true,
                position: "top-end",
                icon: "info",
                title: "Filtros aplicados (simulado)",
                showConfirmButton: false,
                timer: 1500,
            });
        });

        console.log("✅ CrearPromocion inicializado correctamente");
    });
})();