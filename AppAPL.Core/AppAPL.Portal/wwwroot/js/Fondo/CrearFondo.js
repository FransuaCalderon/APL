// ~/js/Fondo/CrearFondo.js

// ===============================================================
// FUNCIONES DE CARGA Y API
// ===============================================================

/**
 * Carga el combo de Tipos de Fondo.
 */
function cargarTipoFondo(callback) {
    const payload = {
        code_app: "APP20260128155212346",
        http_method: "GET",
        endpoint_path: "api/Opciones/ConsultarCombos",
        client: "APL",
        endpoint_query_params: "/TIPOFONDO"
    };

    $.ajax({
        url: "/api/apigee-router-proxy",
        method: "POST",
        contentType: "application/json",
        data: JSON.stringify(payload),
        success: function (response) {
            if (response && response.code_status === 200) {
                console.log("Tipos de fondo recibidos:", response.json_response);
                const data = response.json_response || [];
                const $selectFondoTipo = $("#fondoTipo");

                $selectFondoTipo.empty().append('<option value="">Seleccione...</option>');

                data.forEach(item => {
                    $selectFondoTipo.append(
                        $('<option></option>')
                            .val(item.idcatalogo)
                            .text(item.nombre_catalogo)
                            .attr('data-nombre', item.nombre_catalogo)
                    );
                });

                if (callback) callback();
            }
        },
        error: (xhr) => manejarErrorGlobal(xhr, "cargar tipos de fondo")
    });
}

/**
 * Consulta la lista de proveedores para el modal.
 */
function consultarProveedor() {
    const $tbody = $("#tablaProveedores tbody");
    const esFondoPropio = verificarSiFondoPropio();
    const RUC_FONDO_PROPIO = "1790895548001";

    $tbody.empty().append('<tr><td colspan="7" class="text-center">Cargando proveedores...</td></tr>');

    const payload = {
        code_app: "APP20260128155212346",
        http_method: "GET",
        endpoint_path: "api/Proveedor/Listar",
        client: "APL",
        endpoint_query_params: ""
    };

    $.ajax({
        url: "/api/apigee-router-proxy",
        method: "POST",
        contentType: "application/json",
        data: JSON.stringify(payload),
        success: function (response) {
            console.log("Proveedores recibidos:", response.json_response);
            const data = response.json_response || [];
            $tbody.empty();

            if (data && data.length > 0) {
                data.forEach(proveedor => {
                    const ruc = proveedor.identificacion ?? '';

                    // Lógica de filtrado de negocio
                    if (!esFondoPropio && ruc === RUC_FONDO_PROPIO) return;

                    const contacto = proveedor.nombrecontacto1 || proveedor.nombrecontacto2 || '';
                    const mail = proveedor.mailcontacto1 || proveedor.mailcontacto2 || '';

                    const fila = `
                        <tr>
                            <td class="text-center"><input type="radio" name="selectProveedor" 
                                data-id="${proveedor.codigo}" data-nombre="${proveedor.nombre}" data-ruc="${ruc}"></td>
                            <td>${proveedor.codigo}</td>
                            <td>${ruc}</td>
                            <td>${proveedor.nombre}</td>
                            <td>${contacto}</td>
                            <td>${mail}</td>
                            <td>-</td>
                        </tr>`;
                    $tbody.append(fila);
                });
            } else {
                $tbody.append('<tr><td colspan="7" class="text-center">No hay proveedores disponibles.</td></tr>');
            }
        },
        error: (xhr) => $tbody.html(`<tr><td colspan="7" class="text-danger">Error al cargar datos.</td></tr>`)
    });
}

// ===============================================================
// HELPERS DE MONEDA
// ===============================================================

/**
 * Convierte un string formateado como "$ 12.000,50" o "12000.50" a número flotante.
 * ✅ CORRECCIÓN: maneja correctamente separadores de miles (.) y decimal (,) en es-EC.
 */
function parsearMoneda(str) {
    if (!str) return 0;
    // 1. Quitar el símbolo $, espacios y cualquier letra
    let limpio = String(str).replace(/[^\d.,]/g, '');
    // 2. En formato es-EC el punto es separador de miles y la coma es decimal
    //    Ej: "12.000,50" → quitar puntos de miles → "12000,50" → reemplazar coma → "12000.50"
    //    Si no tiene coma, asumir que el punto (si existe) es decimal directo: "12000.50"
    if (limpio.includes(',')) {
        // Tiene coma: punto = miles, coma = decimal
        limpio = limpio.replace(/\./g, '').replace(',', '.');
    }
    // Si no tiene coma el punto ya es decimal, no hay que hacer nada más
    return parseFloat(limpio) || 0;
}

/**
 * Formatea un número como moneda con $ al inicio.
 * Ej: 12000.5 → "$ 12.000,50"
 */
function formatearMonedaInput(valor) {
    const num = parseFloat(valor) || 0;
    return '$ ' + num.toLocaleString('es-EC', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

// ===============================================================
// LÓGICA DE NEGOCIO Y EVENTOS
// ===============================================================

function ejecutarGuardadoFondo() {
    const idOpcionActual = window.obtenerIdOpcionActual();
    const usuario = window.usuarioActual || "admin";

    // ✅ CORRECCIÓN: toISO recibe fecha en formato dd/mm/yyyy del datepicker
    const toISO = (f) => {
        if (!f) return null;
        const p = f.split('/');
        if (p.length !== 3) return null;
        return new Date(p[2], p[1] - 1, p[0]).toISOString();
    };

    // ✅ CORRECCIÓN: usar parsearMoneda que maneja correctamente el formato es-EC
    const body = {
        descripcion: $("#fondoDescripcion").val(),
        idproveedor: $("#fondoProveedorId").val(),
        idtipofondo: parseInt($("#fondoTipo").val()) || 0,
        valorfondo: parsearMoneda($("#fondoValorTotal").val()),
        fechainiciovigencia: toISO($("#fondoFechaInicio").val()),
        fechafinvigencia: toISO($("#fondoFechaFin").val()),
        idusuarioingreso: usuario,
        nombreusuario: usuario,
        idopcion: idOpcionActual,
        idcontrolinterfaz: "BTNGRABAR",
        idevento: "EVCLICK"
    };

    console.log("Valor parseado para guardar:", body.valorfondo); // ✅ Verificación en consola

    if (!body.fechainiciovigencia || !body.fechafinvigencia) {
        return Swal.fire('Error', 'Las fechas no son válidas.', 'error');
    }

    Swal.fire({
        title: 'Guardando...',
        didOpen: () => Swal.showLoading(),
        allowOutsideClick: false
    });

    const payload = {
        code_app: "APP20260128155212346",
        http_method: "POST",
        endpoint_path: "api/Fondo/insertar",
        client: "APL",
        body_request: body
    };

    console.log("Payload a enviar:", payload);

    $.ajax({
        url: "/api/apigee-router-proxy",
        method: "POST",
        contentType: "application/json",
        data: JSON.stringify(payload),
        success: function (response) {
            if (response && response.code_status === 200) {
                Swal.fire({
                    icon: 'success',
                    title: '¡Operación Exitosa!',
                    text: response.json_response.mensaje || 'Fondo guardado correctamente.',
                    showConfirmButton: false,
                    timer: 1500
                }).then(() => {
                    limpiarFormularioFondo();
                });
            }
        },
        error: (xhr) => manejarErrorGlobal(xhr, "guardar el fondo")
    });
}

// ===============================================================
// INITIALIZATION
// ===============================================================

$(document).ready(function () {
    $.get("/config", function (config) {
        window.apiBaseUrl = config.apiBaseUrl;
        cargarTipoFondo();
    });

    // Eventos de UI
    $("#fondoTipo").on("change", function () {
        verificarSiFondoPropio() ? seleccionarProveedorFondoPropio() : habilitarSeleccionProveedor();
    });

    $('#modalConsultaProveedor').on('show.bs.modal', () => consultarProveedor());

    $("#btnGuardarFondos").on("click", (e) => {
        e.preventDefault();

        console.log("click btnGuardarFondos");

        Swal.fire({
            title: '¿Confirmar guardado?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Sí, Guardar'
        }).then((r) => { if (r.isConfirmed) ejecutarGuardadoFondo(); });
    });

    // ===================================================================
    // ✅ CAMPO VALOR TOTAL - Validaciones corregidas
    // ===================================================================

    // 1. BLOQUEAR caracteres inválidos al presionar tecla
    //    Solo permite: dígitos (0-9), punto (.), coma (,) y teclas de control
    $("#fondoValorTotal").on("keypress", function (e) {
        const char = String.fromCharCode(e.which);
        // Permitir solo dígitos, punto y coma
        if (!/[\d.,]/.test(char)) {
            e.preventDefault();
        }
    });

    // 2. TAMBIÉN bloquear en el evento input (cubre pegar con ratón)
    $("#fondoValorTotal").on("input", function () {
        // Eliminar cualquier caracter que no sea dígito, punto o coma
        const valorLimpio = $(this).val().replace(/[^\d.,]/g, '');
        if ($(this).val() !== valorLimpio) {
            $(this).val(valorLimpio);
        }
    });

    // 3. AL SALIR DEL CAMPO: formatear con $ al inicio y separadores correctos
    $("#fondoValorTotal").on("blur", function () {
        const num = parsearMoneda($(this).val());
        // ✅ $ al INICIO, formato es-EC (punto=miles, coma=decimal)
        const formatted = formatearMonedaInput(num);
        $(this).val(formatted);
        $("#fondoDisponible").val(formatted);
    });

    // 4. AL ENTRAR AL CAMPO: mostrar solo el número limpio para facilitar edición
    $("#fondoValorTotal").on("focus", function () {
        const num = parsearMoneda($(this).val());
        // Si el valor es 0, limpiar el campo para no mostrar "0"
        $(this).val(num === 0 ? '' : String(num));
    });

    // ===================================================================

    // Init fechas
    $("#fondoFechaInicio").val(obtenerFechaActualFormateada());

    $("#btnAceptarProveedor").on("click", () => {
        const seleccionado = $('input[name="selectProveedor"]:checked');

        if (seleccionado.length > 0) {
            const proveedor = {
                id: seleccionado.data("id"),
                nombre: seleccionado.data("nombre"),
                ruc: seleccionado.data("ruc")
            };

            console.log("Proveedor seleccionado:", proveedor);

            $("#fondoProveedor").val(proveedor.nombre);
            $("#fondoProveedorId").val(proveedor.ruc);

            $("#modalConsultaProveedor").modal("hide");

        } else {
            Swal.fire('Atención', 'Debes seleccionar un proveedor de la lista.', 'warning');
        }
    });
});

// ===============================================================
// HELPERS DE UTILIDAD
// ===============================================================

function limpiarFormularioFondo() {
    $("#fondoTipo").val("");
    $("#fondoDescripcion").val("");
    $("#fondoValorTotal, #fondoDisponible, #fondoFechaFin").val("");
    $("#fondoFechaInicio").val(obtenerFechaActualFormateada());
    habilitarSeleccionProveedor();
}

function manejarErrorGlobal(xhr, accion) {
    console.error(`QA Report - Error al ${accion}:`, xhr.responseText);
    Swal.fire({
        icon: 'error',
        title: 'Error de Comunicación',
        text: `No se pudo completar la acción: ${accion}.`
    });
}

function manejarErrorContexto() {
    Swal.fire('Error de Contexto', 'ID de opción no encontrado.', 'error');
}

function verificarSiFondoPropio() {
    const text = $("#fondoTipo option:selected").attr('data-nombre') || "";
    return /fondo\s*propio|propio/i.test(text);
}

function seleccionarProveedorFondoPropio() {
    $("#fondoProveedorId").val("1790895548001");
    $("#fondoProveedor").val("Unicomer de Ecuador S.A.");
    $("#btnBuscarProveedorModal").prop('disabled', true).addClass('disabled');
}

function habilitarSeleccionProveedor() {
    console.log("Habilitando selección de proveedor");
    $("#fondoProveedorId, #fondoProveedor").val("");
    $("#btnBuscarProveedorModal").prop('disabled', false).removeClass('disabled');
}

function obtenerFechaActualFormateada() {
    const h = new Date();
    return `${String(h.getDate()).padStart(2, '0')}/${String(h.getMonth() + 1).padStart(2, '0')}/${h.getFullYear()}`;
}

// Autor: JEAN FRANCOIS CALDERON VEAS | Empresa: BMTECSA | Proyecto: SOFTWARE APL