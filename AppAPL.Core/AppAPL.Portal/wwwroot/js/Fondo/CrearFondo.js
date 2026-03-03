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

// ===============================================================
// ✅ MODIFICADO: CONSULTA DE PROVEEDORES CON DATATABLES + CACHÉ
// ===============================================================

// Variable para guardar la instancia de DataTables
let dtProveedores = null;
// Caché de proveedores para no volver a llamar al API cada vez que se abre el modal
let cacheProveedores = null;

/**
 * Consulta la lista de proveedores para el modal.
 * ✅ Usa DataTables para búsqueda y paginación automática.
 * ✅ Cachea los datos para que la segunda apertura sea instantánea.
 */
function consultarProveedor() {
    const etiqueta = obtenerEtiquetaFondo();
    const queryParam = etiqueta ? "/" + etiqueta : "";

    // Función que recibe los datos y los pinta con DataTables
    function renderizarTabla(data) {
        const filas = data.map(p => {
            const ruc = p.identificacion ?? '';
            const contacto = p.nombrecontacto1 || p.nombrecontacto2 || '';
            const mail = p.mailcontacto1 || p.mailcontacto2 || '';
            return [
                `<input type="radio" name="selectProveedor" data-id="${p.codigo}" data-nombre="${p.nombre}" data-ruc="${ruc}">`,
                p.codigo,
                ruc,
                p.nombre,
                contacto,
                mail,
                '-'
            ];
        });

        if (dtProveedores) {
            dtProveedores.destroy();
            $("#tablaProveedores tbody").empty();
        }

        dtProveedores = $("#tablaProveedores").DataTable({
            data: filas,
            columns: [
                { title: "Seleccionar", className: "text-center", orderable: false, searchable: false },
                { title: "Código" },
                { title: "RUC" },
                { title: "Nombre Proveedor" },
                { title: "Contacto" },
                { title: "Mail" },
                { title: "Teléfono", searchable: false }
            ],
            deferRender: true,
            pageLength: 10,
            lengthChange: false,
            dom: '<"row"<"col-12"tr>><"row"<"col-12 text-center"i>><"row"<"col-12 d-flex justify-content-center"p>>',
            language: {
                search: "Buscar:",
                zeroRecords: "No se encontraron proveedores.",
                info: "Mostrando _START_ a _END_ de _TOTAL_ proveedores",
                infoEmpty: "Sin proveedores",
                infoFiltered: "(filtrado de _MAX_ totales)",
                paginate: { first: "«", last: "»", next: "›", previous: "‹" }
            },
            order: [[3, 'asc']],
            // ✅ NUEVO: Forzar centrado después de que DataTables termine de renderizar
            initComplete: function () {
                const wrapper = $("#tablaProveedores_wrapper");
                wrapper.find(".dataTables_paginate").attr("style",
                    "text-align:center !important; float:none !important; display:block !important; width:100% !important; padding-top:0.5rem;"
                );
                wrapper.find(".dataTables_info").attr("style",
                    "text-align:center !important; float:none !important; display:block !important; width:100% !important; font-size:0.8rem; padding-top:0.5rem;"
                );
            },
            drawCallback: function () {
                const wrapper = $("#tablaProveedores_wrapper");
                wrapper.find(".dataTables_paginate").attr("style",
                    "text-align:center !important; float:none !important; display:block !important; width:100% !important; padding-top:0.5rem;"
                );
            }
        });

        if (etiqueta) {
            $('input[name="selectProveedor"]').first().prop('checked', true);
        }

        $("#buscarProveedorInput").off("keyup").on("keyup", function () {
            dtProveedores.search($(this).val()).draw();
        });
    }

    // ✅ Solo usar caché si NO tiene etiqueta (listado general)
    //    Si tiene etiqueta (TFPROPIO/TFCREDITO) siempre llamar al API
    if (!etiqueta && cacheProveedores) {
        renderizarTabla(cacheProveedores);
        return;
    }

    const $tbody = $("#tablaProveedores tbody");
    $tbody.empty().append('<tr><td colspan="7" class="text-center">Cargando proveedores...</td></tr>');

    const payload = {
        code_app: "APP20260128155212346",
        http_method: "GET",
        endpoint_path: "api/Proveedor/Listar",
        client: "APL",
        endpoint_query_params: queryParam
    };

    $.ajax({
        url: "/api/apigee-router-proxy",
        method: "POST",
        contentType: "application/json",
        data: JSON.stringify(payload),
        success: function (response) {
            const data = response.json_response || [];

            // Solo cachear el listado general (sin etiqueta)
            if (!etiqueta) {
                cacheProveedores = data;
            }

            renderizarTabla(data);
        },
        error: (xhr) => {
            $tbody.html('<tr><td colspan="7" class="text-danger">Error al cargar datos.</td></tr>');
        }
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

    $("#fondoTipo").on("change", function () {
        const etiqueta = obtenerEtiquetaFondo();
        if (etiqueta) {
            seleccionarProveedorAutomatico(etiqueta);
        } else {
            habilitarSeleccionProveedor();
        }
    });

    $('#modalConsultaProveedor').on('show.bs.modal', function () {
        // ✅ Limpiar búsqueda al abrir el modal
        $("#buscarProveedorInput").val("");
        consultarProveedor();
    });

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


function obtenerEtiquetaFondo() {
    const text = $("#fondoTipo option:selected").attr('data-nombre') || "";
    if (/fondo\s*propio|propio/i.test(text)) return "TFPROPIO";
    if (/fondo\s*cr[eé]dito/i.test(text)) return "TFCREDITO";
    return null;
}

function verificarSiFondoPropio() {
    return obtenerEtiquetaFondo() !== null;
}

function seleccionarProveedorAutomatico(etiqueta) {
    // ✅ NO deshabilitar la lupa, para que pueda ver el listado filtrado
    $("#fondoProveedor").val("Cargando...");

    const payload = {
        code_app: "APP20260128155212346",
        http_method: "GET",
        endpoint_path: "api/Proveedor/Listar",
        client: "APL",
        endpoint_query_params: "/" + etiqueta
    };

    $.ajax({
        url: "/api/apigee-router-proxy",
        method: "POST",
        contentType: "application/json",
        data: JSON.stringify(payload),
        success: function (response) {
            const data = response.json_response || [];
            if (data.length > 0) {
                const p = data[0];
                $("#fondoProveedor").val(p.nombre);
                $("#fondoProveedorId").val(p.identificacion || "");
                console.log("Proveedor automático (" + etiqueta + "):", p.nombre);
            } else {
                $("#fondoProveedor").val("Sin proveedor");
                $("#fondoProveedorId").val("");
            }
        },
        error: (xhr) => {
            $("#fondoProveedor").val("Error al cargar");
            manejarErrorGlobal(xhr, "cargar proveedor automático");
        }
    });
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