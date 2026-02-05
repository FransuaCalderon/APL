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
// LÓGICA DE NEGOCIO Y EVENTOS
// ===============================================================

function ejecutarGuardadoFondo() {
    const idOpcionActual = window.obtenerIdOpcionActual();
    const usuario = window.usuarioActual || "admin";

    // Helpers de conversión
    const toISO = (f) => {
        if (!f) return null;
        const p = f.split('/');
        return new Date(p[2], p[1] - 1, p[0]).toISOString();
    };

    const toNum = (s) => parseFloat(String(s).replace(/[^\d,.-]/g, '').replace(',', '.')) || 0;

    const body = {
        descripcion: $("#fondoDescripcion").val(),
        idproveedor: $("#fondoProveedorId").val(),
        idtipofondo: parseInt($("#fondoTipo").val()) || 0,
        valorfondo: toNum($("#fondoValorTotal").val()),
        fechainiciovigencia: toISO($("#fondoFechaInicio").val()),
        fechafinvigencia: toISO($("#fondoFechaFin").val()),
        idusuarioingreso: usuario,
        nombreusuario: usuario,
        idopcion: idOpcionActual,
        idcontrolinterfaz: "BTNGRABAR",
        idevento: "EVCLICK"
    };

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
        Swal.fire({
            title: '¿Confirmar guardado?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Sí, Guardar'
        }).then((r) => { if (r.isConfirmed) ejecutarGuardadoFondo(); });
    });

    // Formateo de moneda
    $("#fondoValorTotal").on("blur", function () {
        const val = $(this).val().replace(',', '.');
        const formatted = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'USD' }).format(parseFloat(val) || 0);
        $(this).val(formatted);
        $("#fondoDisponible").val(formatted);
    });

    // Init fechas
    $("#fondoFechaInicio").val(obtenerFechaActualFormateada());

    $("#btnAceptarProveedor").on("click", () => {
        // 1. Buscamos el radio button que esté marcado dentro de la tabla
        const seleccionado = $('input[name="selectProveedor"]:checked');

        if (seleccionado.length > 0) {
            // 2. Extraemos los datos usando la función .data() de jQuery
            const proveedor = {
                id: seleccionado.data("id"),
                nombre: seleccionado.data("nombre"),
                ruc: seleccionado.data("ruc")
            };

            console.log("Proveedor seleccionado:", proveedor);

            // 3. Asignamos los valores a los inputs de la pantalla principal
            $("#fondoProveedor").val(proveedor.nombre);
            $("#fondoProveedorId").val(proveedor.ruc);

            // 4. Cerramos el modal
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