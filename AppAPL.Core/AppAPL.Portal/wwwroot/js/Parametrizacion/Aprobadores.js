// Variable global para guardar la instancia de DataTable
var apDataTable = null;
var apModo = 'nuevo';
var apIdEditar = null;
var apIdEliminar = null;
var apModalBS = null;
var apModalElimBS = null;

$(document).ready(function () {
    console.log("=== INICIO - Parametrizacion APROBADORES ===");

    $.get("/config", function (config) {
        window.apiBaseUrl = config.apiBaseUrl;
        
    });

    // 1. Inicializamos la tabla (puedes pasarle 'apDatos' por ahora, 
    // o pasarle un arreglo vacío [] si vas a esperar a la API)
    renderizarTablaAprobadores(apDatos);
    cargarAprobadores(); // <--- Llama a la API (Read)

    // Filtro de búsqueda personalizado
    $('#apFiltroTexto').on('input', function () {
        if (apDataTable) apDataTable.search($(this).val()).draw();
    });

    // Inicializar modales de Bootstrap (obteniendo el elemento DOM puro para BS)
    var elModal = $('#apModalOverlay')[0];
    var elElim = $('#apModalEliminar')[0];
    if (elModal) apModalBS = new bootstrap.Modal(elModal);
    if (elElim) apModalElimBS = new bootstrap.Modal(elElim);
});

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


// ==========================================
// FUNCIÓN PARA RENDERIZAR / ACTUALIZAR DATATABLE
// ==========================================
function renderizarTablaAprobadores(dataArray) {
    if ($.fn.DataTable.isDataTable('#apTabla')) {
        apDataTable.clear().rows.add(dataArray).draw();
        return;
    }

    apDataTable = $('#apTabla').DataTable({
        data: dataArray || [],
        deferRender: true,
        pageLength: 5,
        lengthMenu: [5, 10, 20],
        autoWidth: false,
        language: {
            "url": "/json/i18n/es-ES.json?v=1.1",
            "emptyTable": "No hay aprobadores disponibles"
        },
        columns: [
            { data: 'nombre_entidad', defaultContent: '' },
            { data: 'nombre_tipo_proceso', defaultContent: '' },
            { data: 'iduseraprobador', defaultContent: '' },
            {
                data: 'nivelaprobacion', defaultContent: '',
                render: function (data) { return data ? 'Nivel ' + data : ''; }
            },
            {
                data: 'idaprobador',
                orderable: false,
                className: 'text-center',
                render: function (data) {
                    return '<div class="d-flex justify-content-center gap-1">' +
                        '<button onclick="apAbrirModalEditar(' + data + ')" class="btn btn-sm btn-outline-secondary border-0 py-0 px-1" title="Modificar"><i class="fa-regular fa-pen-to-square"></i></button>' +
                        '<button onclick="apAbrirModalEliminar(' + data + ')" class="btn btn-sm btn-outline-danger border-0 py-0 px-1" title="Eliminar"><i class="fa-solid fa-trash"></i></button>' +
                        '</div>';
                }
            }
        ]
    });
}


function cargarAprobadores() {
    const payload = {
        code_app: "APP20260128155212346",
        http_method: "GET",
        endpoint_path: "api/Aprobador/listar", // Ajustar a tu ruta real
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
                renderizarTablaAprobadores(response.json_response || []);
            } else {
                Swal.fire({ icon: "error", title: "Error", text: "No se pudieron cargar los aprobadores." });
            }
        },
        error: function (xhr) { manejarErrorGlobal(xhr, "cargar los aprobadores"); }
    });
}

function apConfirmarEliminar() {
    // Verificamos que tengamos un ID válido seleccionado
    if (!apIdEliminar) return;

    // 1. Armamos el JSON exactamente como lo pide tu API
    const payloadBody = {
        idaprobador: apIdEliminar, // ID que capturamos al abrir el modal de eliminar
        idusuario: getUsuario()         // Recuerda reemplazar "admin" por tu variable de sesión
    };

    // 2. Configuramos el payload para el proxy
    const payload = {
        code_app: "APP20260128155212346",
        http_method: "POST", // El verbo HTTP de tu API es POST
        endpoint_path: "api/Aprobador/eliminar", // Tu ruta
        client: "APL",
       
        body_request: payloadBody // Mandamos el JSON en el cuerpo
    };

    // 3. Ejecutamos la petición AJAX
    $.ajax({
        url: "/api/apigee-router-proxy",
        method: "POST",
        contentType: "application/json",
        data: JSON.stringify(payload),
        success: function (response) {
            if (response && response.code_status === 200) {
                // Cerramos el modal de confirmación
                apCerrarModalElim();

                // Mostramos mensaje de éxito
                Swal.fire({
                    icon: "success",
                    title: "Eliminado",
                    text: "Aprobador eliminado correctamente.",
                    timer: 1500,
                    showConfirmButton: false
                });

                // Recargamos la tabla para que el registro desaparezca de la vista
                cargarAprobadores();
            } else {
                Swal.fire({
                    icon: "error",
                    title: "Error",
                    text: "No se pudo eliminar el aprobador."
                });
            }
        },
        error: function (xhr) {
            manejarErrorGlobal(xhr, "eliminar el aprobador");
        }
    });
}


// ==========================================
// 1. VARIABLES GLOBALES (Fuera del ready)
// ==========================================
var apDatos = [
    { id: 1, entidad: 'Fondo', tipoProceso: 'Creación', usuario: 'USR001', nivel: '1' },
    { id: 2, entidad: 'Fondo', tipoProceso: 'Creación', usuario: 'USR002', nivel: '2' },
    { id: 3, entidad: 'Fondo', tipoProceso: 'Inactivación', usuario: 'USR003', nivel: '1' },
    { id: 4, entidad: 'Acuerdo', tipoProceso: 'Creación', usuario: 'USR004', nivel: '1' },
    { id: 5, entidad: 'Acuerdo', tipoProceso: 'Inactivación', usuario: 'USR005', nivel: '2' },
    { id: 6, entidad: 'Promoción', tipoProceso: 'Creación', usuario: 'USR006', nivel: '1' },
];

var apNextId = 7, apModo = 'nuevo', apIdEditar = null, apIdEliminar = null;
var apModalBS = null, apModalElimBS = null;

// ==========================================
// 2. DOCUMENT READY (Solo la inicialización)
// ==========================================


/* NOTA: Si no usas jQuery, el equivalente en Javascript puro que venía en tu archivo es:
document.addEventListener('DOMContentLoaded', function() {
    apRenderTabla(); ...
});
*/

// ==========================================
// 3. FUNCIONES GLOBALES (Fuera del ready)
// ==========================================
function apRenderTabla() {
    if (apDataTable) {
        // Borra los datos viejos, carga el array actualizado y vuelve a dibujar la tabla
        apDataTable.clear().rows.add(apDatos).draw();
    }
}

function apLimpiarModal() {
    // Resetea los inputs
    $('#apMEntidad, #apMTipoProceso, #apMUsuario, #apMNivel')
        .val('').prop('disabled', false)
        .removeClass('is-invalid is-valid')
        .css({ 'background': '', 'color': '' });

    $('#apAlertaModal').hide();
}

function apAbrirModalNuevo() {
    apModo = 'nuevo';
    apIdEditar = null;
    apLimpiarModal();

    $('#apModalTitulo').text('Nuevo aprobador');
    $('#apBtnGuardar').text('Guardar').show();

    if (apModalBS) apModalBS.show();
}

function apAbrirModalEditar(idAprobador) {
    const payload = {
        code_app: "APP20260128155212346",
        http_method: "GET",
        endpoint_path: "api/Aprobador/obtener", // Ruta específica
        client: "APL",
        endpoint_query_params: `/${idAprobador}`
    };

    $.ajax({
        url: "/api/apigee-router-proxy",
        method: "POST",
        contentType: "application/json",
        data: JSON.stringify(payload),
        success: function (response) {
            if (response && response.code_status === 200 && response.json_response) {
                const d = response.json_response;

                apModo = 'editar';
                apIdEditar = idAprobador;
                apLimpiarModal();

                $('#apModalTitulo').text('Modificar aprobador');

                // Mapear respuesta a los inputs
                $('#apMEntidad').val(d.idetiqueta_entidad);
                $('#apMTipoProceso').val(d.idetiqueta_tipo_proceso);
                $('#apMUsuario').val(d.iduseraprobador);
                $('#apMNivel').val(d.nivelaprobacion);

                // Bloquear selectores visualmente
                $('#apMEntidad, #apMTipoProceso').prop('disabled', true).css('background', '#f5f5f5');

                $('#apBtnGuardar').text('Actualizar').show();

                if (apModalBS) apModalBS.show();
            } else {
                Swal.fire({ icon: "error", title: "Error", text: "No se pudo cargar la información." });
            }
        },
        error: function (xhr) { manejarErrorGlobal(xhr, "consultar el aprobador específico"); }
    });
}

function apValidarCampo(selector) {
    var el = $(selector);
    var ok = $.trim(el.val()) !== '';
    el.toggleClass('is-invalid', !ok).toggleClass('is-valid', ok);
    return ok;
}

function apGuardarRegistro() {
    // 1. Validar visualmente los campos del formulario
    var isValid = true;
    $.each(['#apMEntidad', '#apMTipoProceso', '#apMUsuario', '#apMNivel'], function (i, selector) {
        if (!apValidarCampo(selector)) isValid = false;
    });
    if (!isValid) return;

    // Variables que van a cambiar dependiendo de si es Nuevo o Editar
    let rutaEndpoint = '';
    let payloadBody = {};

    // 2. Armar el objeto según el modo (Crear vs Actualizar)
    if (apModo === 'nuevo') {
        rutaEndpoint = 'api/Aprobador/insertar';
        payloadBody = {
            idetiquetaentidad: $('#apMEntidad').val(),      
            idtipoproceso: $('#apMTipoProceso').val(), 
            iduseraprobador: $.trim($('#apMUsuario').val()),
            nivelaprobacion: parseInt($('#apMNivel').val()),
            idusuario: getUsuario()
        };
    } else if (apModo === 'editar') {
        rutaEndpoint = 'api/Aprobador/actualizar';
        payloadBody = {
            idaprobador: apIdEditar, // Tomamos el ID que guardamos al abrir el modal
            iduseraprobador: $.trim($('#apMUsuario').val()),
            nivelaprobacion: parseInt($('#apMNivel').val()),
            idusuario: getUsuario()
        };
    }

    // 3. Armar el payload maestro para el proxy
    const payload = {
        code_app: "APP20260128155212346",
        http_method: "POST", // Ambas APIs usan POST
        endpoint_path: rutaEndpoint, // Cambia dinámicamente
        client: "APL",
        
        body_request: payloadBody // Nuestro JSON dinámico
    };

    // 4. Ejecutar la llamada AJAX
    $.ajax({
        url: "/api/apigee-router-proxy",
        method: "POST",
        contentType: "application/json",
        data: JSON.stringify(payload),
        success: function (response) {
            if (response && response.code_status === 200) {
                apCerrarModal();
                Swal.fire({
                    icon: "success",
                    title: "Éxito",
                    text: apModo === 'nuevo' ? "Aprobador creado correctamente." : "Aprobador actualizado correctamente.",
                    timer: 1500,
                    showConfirmButton: false
                });

                // Recargamos el DataTable
                cargarAprobadores();
            } else {
                Swal.fire({
                    icon: "error",
                    title: "Error",
                    text: "No se pudo guardar el registro."
                });
            }
        },
        error: function (xhr) {
            manejarErrorGlobal(xhr, apModo === 'nuevo' ? "crear el aprobador" : "actualizar el aprobador");
        }
    });
}

function apAbrirModalEliminar(idAprobador) {
    apIdEliminar = idAprobador;

    // Para eliminar, leemos directamente la data de la fila en DataTables sin golpear la API de nuevo
    var rows = apDataTable.rows().data().toArray();
    var d = rows.find(function (x) { return x.idaprobador === idAprobador; });

    if (d) {
        $('#apElimDetalle').html(
            '<b>Usuario:</b> ' + d.iduseraprobador + '<br><b>Entidad:</b> ' + d.nombre_entidad +
            '<br><b>Proceso:</b> ' + d.nombre_tipo_proceso + '<br><b>Nivel:</b> ' + d.nivelaprobacion
        );
        if (apModalElimBS) apModalElimBS.show();
    }
}

function apCerrarModal() { if (apModalBS) apModalBS.hide(); }
function apCerrarModalElim() { if (apModalElimBS) apModalElimBS.hide(); }