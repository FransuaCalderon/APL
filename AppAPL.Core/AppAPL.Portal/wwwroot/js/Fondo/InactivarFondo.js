// ~/js/Fondo/InactivarFondo.js

// ===============================================================
// Variables globales
// ===============================================================
let tabla; // GLOBAL
let ultimaFilaModificada = null; // Para recordar la última fila editada/eliminada
let datosModal = null; // Variable global para almacenar los datos del modal

// ===============================================================
// FUNCIONES HELPER PARA MANEJO DE RESPUESTAS DEL API
// ===============================================================

/**
 * Procesa la respuesta del API y extrae los datos
 * @param {Object} response - Respuesta del API
 * @returns {Object} - { success: boolean, data: any, message: string, result: Object }
 */
function procesarRespuestaAPI(response) {
    // Verificar si la respuesta tiene la nueva estructura
    if (response && typeof response === 'object' && 'status' in response) {
        const esExitoso = response.status === 'ok' && response.code_status === 200;
        const jsonResponse = response.json_response || {};
        const data = jsonResponse.data || null;
        const result = jsonResponse.result || {};

        return {
            success: esExitoso,
            data: data,
            message: result.message || response.status,
            result: result,
            unitransac: response.unitransac || null,
            codigoRetorno: data?.codigoretorno || null,
            filasAfectadas: data?.filasafectadas || null,
            mensajeData: data?.mensaje || null
        };
    }

    // Si es la estructura antigua (array directo o objeto simple), mantener compatibilidad
    return {
        success: true,
        data: response,
        message: 'OK',
        result: { statuscode: '200', title: 'OK', message: 'successful' },
        unitransac: null,
        codigoRetorno: null,
        filasAfectadas: null,
        mensajeData: null
    };
}

/**
 * Procesa errores del API de manera uniforme
 * @param {Object} xhr - Objeto XMLHttpRequest
 * @param {string} status - Estado del error
 * @param {string} error - Mensaje de error
 * @returns {Object} - { message: string, details: string, codigoRetorno: number }
 */
function procesarErrorAPI(xhr, status, error) {
    let mensaje = error || 'Error desconocido';
    let detalles = '';
    let codigoRetorno = null;

    try {
        if (xhr.responseJSON) {
            const respuesta = procesarRespuestaAPI(xhr.responseJSON);
            mensaje = respuesta.result?.message || respuesta.message || mensaje;
            detalles = respuesta.data?.mensaje || '';
            codigoRetorno = respuesta.codigoRetorno;
        } else if (xhr.responseText) {
            const parsed = JSON.parse(xhr.responseText);
            const respuesta = procesarRespuestaAPI(parsed);
            mensaje = respuesta.result?.message || mensaje;
            detalles = respuesta.data?.mensaje || '';
            codigoRetorno = respuesta.codigoRetorno;
        }
    } catch (e) {
        detalles = xhr.responseText || '';
    }

    return {
        message: mensaje,
        details: detalles,
        codigoRetorno: codigoRetorno,
        fullMessage: detalles ? `${mensaje}: ${detalles}` : mensaje
    };
}

/**
 * Obtiene el usuario actual de múltiples fuentes posibles
 * @returns {string} - Usuario actual
 */
function obtenerUsuarioActual() {
    const usuario = window.usuarioActual
        || sessionStorage.getItem('usuarioActual')
        || sessionStorage.getItem('usuario')
        || localStorage.getItem('usuarioActual')
        || localStorage.getItem('usuario')
        || "admin"; // Fallback final

    return usuario;
}

/**
 * Obtiene los headers estándar para las peticiones al API
 * @returns {Object} - Headers para la petición
 */
function obtenerHeadersAPI() {
    const idOpcionActual = window.obtenerIdOpcionActual();
    const usuario = obtenerUsuarioActual();

    return {
        "idopcion": String(idOpcionActual || 0),
        "usuario": usuario,
        "idcontrolinterfaz": "0",
        "idevento": "0",
        "entidad": "0",
        "identidad": "0",
        "idtipoproceso": "0"
    };
}

// ===============================================================
// Configuración global de SweetAlert2 para z-index
// ===============================================================
const SwalConfig = {
    customClass: {
        container: 'swal2-container-high-z'
    }
};

// CSS dinámico para SweetAlert2
const style = document.createElement('style');
style.textContent = `
    .swal2-container-high-z {
        z-index: 99999 !important;
    }
`;
document.head.appendChild(style);

// ===================================================================
// ===== DOCUMENT READY ==============================================
// ===================================================================
$(document).ready(function () {

    console.log("=== INICIO DE CARGA DE PÁGINA - InactivarFondo ===");
    console.log("");

    // 🔍 ===== DIAGNÓSTICO COMPLETO DEL USUARIO ===== 🔍
    console.log("🔍 DIAGNÓSTICO DE USUARIO:");
    console.log("  window.usuarioActual:", window.usuarioActual);
    console.log("  Tipo:", typeof window.usuarioActual);
    console.log("  sessionStorage.usuarioActual:", sessionStorage.getItem('usuarioActual'));
    console.log("  sessionStorage.usuario:", sessionStorage.getItem('usuario'));
    console.log("  localStorage.usuarioActual:", localStorage.getItem('usuarioActual'));
    console.log("  localStorage.usuario:", localStorage.getItem('usuario'));

    const usuarioFinal = obtenerUsuarioActual();
    console.log("  ✅ Usuario final obtenido:", usuarioFinal);
    console.log("");

    // ✅ LOGS DE VERIFICACIÓN DE IDOPCION
    console.log("🔍 DIAGNÓSTICO DE IDOPCION:");
    const infoOpcion = window.obtenerInfoOpcionActual();
    console.log("  Información de la opción actual:", {
        idOpcion: infoOpcion.idOpcion,
        nombre: infoOpcion.nombre,
        ruta: infoOpcion.ruta
    });

    // Verificación adicional
    if (!infoOpcion.idOpcion) {
        console.warn("  ⚠️ ADVERTENCIA: No se detectó un idOpcion al cargar la página.");
        console.warn("  Esto es normal si accediste directamente a la URL sin pasar por el menú.");
        console.warn("  Para que funcione correctamente, accede a esta página desde el menú.");
    } else {
        console.log("  ✅ idOpcion capturado correctamente:", infoOpcion.idOpcion);
    }

    console.log("");
    console.log("=== FIN DE VERIFICACIÓN INICIAL ===");
    console.log("");

    // Configuración inicial y carga de datos
    $.get("/config", function (config) {
        const apiBaseUrl = config.apiBaseUrl;
        window.apiBaseUrl = apiBaseUrl;

        console.log("API Base URL configurada:", apiBaseUrl);

        // ✅ Cargar la bandeja con la misma función que se usa para refrescar
        recargarTablaFondos();
    });

    // ===== BOTÓN LIMPIAR =====
    $('body').on('click', '#btnLimpiar', function () {
        if (tabla) {
            tabla.search('').draw();
            tabla.page(0).draw('page');
            ultimaFilaModificada = null;
            if (typeof limpiarSeleccion === 'function') {
                limpiarSeleccion('#tabla-principal');
            }
        }
    });

}); // FIN document.ready


// ===================================================================
// ===== FUNCIONES GLOBALES ==========================================
// ===================================================================

function crearListado(data) {
    if (tabla) {
        tabla.destroy();
    }

    // Si no hay datos, mostramos mensaje y salimos
    if (!data || data.length === 0) {
        $('#tabla').html(
            "<div class='alert alert-info text-center'>No hay fondos disponibles para inactivar.</div>"
        );
        return;
    }

    var html = "";
    html += "<table id='tabla-principal' class='table table-bordered table-striped table-hover'>";
    html += "  <thead>";

    // Fila del Título ROJO
    html += "    <tr>";
    html += "      <th colspan='13' style='background-color: #CC0000 !important; color: white; text-align: center; font-weight: bold; padding: 8px; font-size: 1rem;'>";
    html += "          BANDEJA DE INACTIVACIÓN DE FONDOS";
    html += "      </th>";
    html += "    </tr>";
    // Fila de las Cabeceras
    html += "    <tr>";
    html += "      <th>Acción</th>";
    html += "      <th>IDFondo</th>";
    html += "      <th>Descripción</th>";
    html += "      <th>RUC</th>";
    html += "      <th>Proveedor</th>";
    html += "      <th>Tipo Fondo</th>";
    html += "      <th>$ Fondo</th>";
    html += "      <th>Fecha Inicio</th>";
    html += "      <th>Fecha Fin</th>";
    html += "      <th>$ Disponible</th>";
    html += "      <th>$ Comprometido</th>";
    html += "      <th>$ Liquidado</th>";
    html += "      <th>Estado</th>";
    html += "    </tr>";
    html += "  </thead>";
    html += "  <tbody>";

    for (var i = 0; i < data.length; i++) {
        var fondo = data[i];
        var id = fondo.idfondo;

        var viewButton = '<button type="button" class="btn-action edit-btn" title="Visualizar" onclick="abrirModalEditar(' + id + ')">' +
            '<i class="fa-regular fa-pen-to-square"></i>' +
            '</button>';

        html += "<tr>";
        html += "  <td class='text-center'>" + viewButton + "</td>";
        html += "  <td>" + (fondo.idfondo ?? "") + "</td>";
        html += "  <td>" + (fondo.descripcion ?? "") + "</td>";
        html += "  <td>" + (fondo.proveedor ?? "") + "</td>";
        html += "  <td>" + (fondo.nombre_proveedor ?? "") + "</td>";
        html += "  <td>" + (fondo.nombre_tipo_fondo ?? "") + "</td>";
        html += "  <td class='text-end'>" + formatearMoneda(fondo.valor_fondo) + "</td>";
        html += "  <td class='text-center'>" + formatearFecha(fondo.fecha_inicio) + "</td>";
        html += "  <td class='text-center'>" + formatearFecha(fondo.fecha_fin) + "</td>";
        html += "  <td class='text-end'>" + formatearMoneda(fondo.valor_disponible) + "</td>";
        html += "  <td class='text-end'>" + formatearMoneda(fondo.valor_comprometido) + "</td>";
        html += "  <td class='text-end'>" + formatearMoneda(fondo.valor_liquidado) + "</td>";
        html += "  <td>" + (fondo.estado ?? "") + "</td>";
        html += "</tr>";
    }

    html += "  </tbody>";
    html += "</table>";

    // Inserta la tabla en el div
    $('#tabla').html(html);

    // Inicializa DataTable
    tabla = $('#tabla-principal').DataTable({
        pageLength: 10,
        lengthMenu: [5, 10, 25, 50],
        pagingType: 'full_numbers',
        columnDefs: [
            { targets: 0, width: "8%", className: "dt-center", orderable: false },
            { targets: 1, width: "6%", className: "dt-center" },
            { targets: [5, 8, 9, 10], className: "dt-right" },
            { targets: [6, 7], className: "dt-center" },
        ],
        order: [[1, 'desc']],
        language: {
            decimal: "",
            emptyTable: "No hay datos disponibles en la tabla",
            info: "Mostrando _START_ a _END_ de _TOTAL_ registros",
            infoEmpty: "Mostrando 0 a 0 de 0 registros",
            infoFiltered: "(filtrado de _MAX_ registros totales)",
            infoPostFix: "",
            thousands: ",",
            lengthMenu: "Mostrar _MENU_ registros",
            loadingRecords: "Cargando...",
            processing: "Procesando...",
            search: "Buscar:",
            zeroRecords: "No se encontraron registros coincidentes",
            paginate: {
                first: "Primero",
                last: "Último",
                next: "Siguiente",
                previous: "Anterior"
            }
        },
        drawCallback: function () {
            if (ultimaFilaModificada !== null && typeof marcarFilaPorId === 'function') {
                marcarFilaPorId('#tabla-principal', ultimaFilaModificada);
            }
        }
    });

    console.log('Llamando a inicializarMarcadoFilas para Fondos');
    if (typeof inicializarMarcadoFilas === 'function') {
        inicializarMarcadoFilas('#tabla-principal');
    }
}

// ===================================================================
// ===== FUNCIONES PARA EL MODAL PERSONALIZADO =======================
// ===================================================================

/**
 * Abre el modal personalizado y carga los datos del fondo.
 */
function abrirModalEditar(id) {
    // ✅ OBTENER EL IDOPCION DINÁMICAMENTE
    const idOpcionActual = window.obtenerIdOpcionActual();
    if (!idOpcionActual) {
        Swal.fire({
            ...SwalConfig,
            icon: 'error',
            title: 'Error',
            text: 'No se pudo obtener el ID de la opción. Por favor, acceda nuevamente desde el menú.'
        });
        return;
    }

    const usuario = obtenerUsuarioActual();
    console.log('Abriendo modal para visualizar fondo ID:', id, 'con idOpcion:', idOpcionActual, 'y usuario:', usuario);

    // 1. Cargar la tabla de acuerdos
    if (typeof cargarAcuerdoFondo === 'function') {
        cargarAcuerdoFondo(id);
    }

    // 2. Llama a la API para obtener los datos del fondo por ID
    $.ajax({
        url: `${window.apiBaseUrl}/api/Fondo/bandeja-inactivacion-id/${id}`,
        method: "GET",
        headers: obtenerHeadersAPI(),
        success: function (response) {
            console.log("Respuesta cruda de bandeja-inactivacion-id:", response);

            // Procesar la respuesta con la nueva estructura
            const resultado = procesarRespuestaAPI(response);

            if (!resultado.success) {
                Swal.fire({
                    ...SwalConfig,
                    icon: 'error',
                    title: 'Error',
                    text: resultado.message || 'No se pudieron cargar los datos del fondo.'
                });
                return;
            }

            // Los datos pueden venir como array o como objeto único
            const data = Array.isArray(resultado.data) ? resultado.data[0] : resultado.data;

            if (!data) {
                Swal.fire({
                    ...SwalConfig,
                    icon: 'error',
                    title: 'Error',
                    text: 'No se encontraron datos del fondo.'
                });
                return;
            }

            console.log("Datos procesados del fondo:", data);

            // CONCATENACIÓN RUC/ID y NOMBRE
            const idProveedor = data.proveedor || '';
            const nombreProveedor = data.nombre_proveedor || '';
            const proveedorCompleto = (idProveedor && nombreProveedor)
                ? `${idProveedor} - ${nombreProveedor}`
                : idProveedor || nombreProveedor || '';

            datosModal = {
                idfondo: data.idfondo,
                descripcion: data.descripcion,
                proveedor: proveedorCompleto,
                tipo_fondo: data.nombre_tipo_fondo,
                valor_disponible: formatearMoneda(data.valor_disponible),
                valor_comprometido: formatearMoneda(data.valor_comprometido),
                valor_liquidado: formatearMoneda(data.valor_liquidado),
                valor_fondo: formatearMoneda(data.valor_fondo),
                fecha_inicio: formatDateForInput(data.fecha_inicio),
                fecha_fin: formatDateForInput(data.fecha_fin),
                estado: data.estado,
                estado_etiqueta: data.estado_etiqeuta
            };

            console.log("datosModal: ", datosModal);
            abrirModalFondo(datosModal);
        },
        error: function (xhr, status, error) {
            const errorInfo = procesarErrorAPI(xhr, status, error);
            console.error("Error al obtener datos del fondo:", errorInfo.fullMessage);

            Swal.fire({
                ...SwalConfig,
                icon: 'error',
                title: 'Error',
                text: errorInfo.fullMessage || 'No se pudieron cargar los datos del fondo.'
            });
        }
    });
}

/**
 * Función para abrir el modal personalizado
 */
function abrirModalFondo(datos) {
    const modal = document.getElementById('modalVisualizarFondo');

    document.getElementById('modal-fondo-id').value = datos.idfondo || '';
    document.getElementById('modal-fondo-descripcion').value = datos.descripcion || '';
    document.getElementById('modal-fondo-proveedor').value = datos.proveedor || '';
    document.getElementById('modal-fondo-tipofondo').value = datos.tipo_fondo || '';
    document.getElementById('modal-fondo-fechainicio').value = datos.fecha_inicio || '';
    document.getElementById('modal-fondo-fechafin').value = datos.fecha_fin || '';
    document.getElementById('modal-fondo-valor').value = datos.valor_fondo || '';
    document.getElementById('modal-fondo-estado').value = datos.estado || '';
    document.getElementById('modal-fondo-disponible').value = datos.valor_disponible ?? '';
    document.getElementById('modal-fondo-comprometido').value = datos.valor_comprometido ?? '';
    document.getElementById('modal-fondo-liquidado').value = datos.valor_liquidado ?? '';

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

/**
 * Función para cerrar el modal personalizado
 */
function cerrarModalFondo() {
    const modal = document.getElementById('modalVisualizarFondo');
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';

    // Limpiar la tabla de acuerdos
    if ($.fn.DataTable.isDataTable('#tabla-acuerdo')) {
        $('#tabla-acuerdo').DataTable().destroy();
    }
    $('#tabla-acuerdo-fondo').html('');
}

/**
 * Convierte una fecha/hora al formato "YYYY-MM-DD"
 */
function formatDateForInput(fechaString) {
    if (!fechaString) {
        return "";
    }
    return fechaString.split('T')[0];
}

// ===================================================================
// ===== FUNCIONES UTILITARIAS =======================================
// ===================================================================

/**
 * Formatea un número como moneda
 */
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

/**
 * Formatea la fecha al formato DD/MM/YYYY
 */
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

// ===================================================================
// ===== ACUERDOS POR FONDO ==========================================
// ===================================================================
function cargarAcuerdoFondo(idFondo) {
    const idOpcionActual = window.obtenerIdOpcionActual();

    if (!idOpcionActual) {
        console.error("No se pudo obtener el idOpcion para cargar acuerdos");
        return;
    }

    const usuario = obtenerUsuarioActual();

    if ($.fn.DataTable.isDataTable('#tabla-acuerdo')) {
        $('#tabla-acuerdo').DataTable().destroy();
    }

    $('#tabla-acuerdo-fondo').html(`
        <div class="text-center p-4">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Cargando...</span>
            </div>
            <p class="mt-2">Cargando datos del acuerdo...</p>
        </div>
    `);

    $.ajax({
        url: `${window.apiBaseUrl}/api/acuerdo/consultar-acuerdo-fondo/${idFondo}`,
        method: "GET",
        dataType: "json",
        headers: obtenerHeadersAPI(),
        success: function (response) {
            console.log("Respuesta cruda de consultar-acuerdo-fondo:", response);

            // Procesar la respuesta con la nueva estructura
            const resultado = procesarRespuestaAPI(response);
            let data = resultado.success ? resultado.data : response;

            // Si data es string, intentar parsear
            if (typeof data === "string") {
                try {
                    data = JSON.parse(data);
                } catch (e) {
                    console.error("Error parseando JSON:", e);
                    $('#tabla-acuerdo-fondo').html('<p class="alert alert-danger text-center">Respuesta inválida del servidor.</p>');
                    return;
                }
            }

            // Validamos si la data es un array o un objeto único
            let acuerdos = Array.isArray(data) ? data : (data && (data.idacuerdofondo || data.idfondo) ? [data] : []);

            // VALIDACIÓN CRÍTICA
            if (!acuerdos.length || (acuerdos[0].idacuerdofondo === undefined && acuerdos[0].idAcuerdofondo === undefined)) {
                $('#tabla-acuerdo-fondo').html(
                    '<div class="alert alert-warning mb-0 text-center">No se encontraron datos de acuerdo para este fondo.</div>'
                );
                return;
            }

            var html = "";
            html += "<table id='tabla-acuerdo' class='table table-bordered table-striped table-hover w-100'>";
            html += "  <thead>";
            html += "    <tr>";
            html += "      <th>ID Acuerdo</th>";
            html += "      <th>Estado</th>";
            html += "      <th>Descripción</th>";
            html += "      <th>Valor</th>";
            html += "      <th>Valor Disponible</th>";
            html += "      <th>Valor Comprometido</th>";
            html += "      <th>Valor Liquidado</th>";
            html += "    </tr>";
            html += "  </thead>";
            html += "  <tbody>";

            acuerdos.forEach(acuerdo => {
                const id = acuerdo.idacuerdofondo || acuerdo.idAcuerdofondo || "";
                const valor = acuerdo.valorfondo || acuerdo.valorFondo || 0;

                html += "<tr>";
                html += "  <td>" + id + "</td>";
                html += "  <td>" + (acuerdo.acuerdofondo_estado_nombre ?? "") + "</td>";
                html += "  <td>" + (acuerdo.acuerdo_descripcion ?? "") + "</td>";
                html += "  <td class='text-end'>" + formatearMoneda(valor) + "</td>";
                html += "  <td class='text-end'>" + formatearMoneda(acuerdo.acuerdofondo_disponible) + "</td>";
                html += "  <td class='text-end'>" + formatearMoneda(acuerdo.acuerdofondo_comprometido) + "</td>";
                html += "  <td class='text-end'>" + formatearMoneda(acuerdo.acuerdofondo_liquidado) + "</td>";
                html += "</tr>";
            });

            html += "  </tbody>";
            html += "</table>";

            $('#tabla-acuerdo-fondo').html(html);

            $('#tabla-acuerdo').DataTable({
                pageLength: 5,
                lengthMenu: [5, 10, 25],
                pagingType: 'simple_numbers',
                searching: false,
                columnDefs: [
                    { targets: [3, 4, 5, 6], className: "dt-right" }
                ],
                order: [[0, 'desc']],
                language: {
                    "sProcessing": "Procesando...",
                    "sLengthMenu": "Mostrar _MENU_ registros",
                    "sZeroRecords": "No se encontraron resultados",
                    "sEmptyTable": "Ningún dato disponible en esta tabla",
                    "sInfo": "Mostrando registros del _START_ al _END_ de un total de _TOTAL_ registros",
                    "sInfoEmpty": "Mostrando registros del 0 al 0 de un total de 0 registros",
                    "sInfoFiltered": "(filtrado de un total de _MAX_ registros)",
                    "sSearch": "Buscar:",
                    "sInfoThousands": ",",
                    "sLoadingRecords": "Cargando...",
                    "oPaginate": {
                        "sFirst": "Primero",
                        "sLast": "Último",
                        "sNext": "Siguiente",
                        "sPrevious": "Anterior"
                    }
                }
            });
        },
        error: function (xhr, status, error) {
            const errorInfo = procesarErrorAPI(xhr, status, error);
            console.error("Error al obtener datos del acuerdo:", errorInfo.fullMessage);

            $('#tabla-acuerdo-fondo').html('<p class="alert alert-danger text-center">Error al cargar el acuerdo: ' + errorInfo.message + '</p>');
        }
    });
}

// ===================================================================
// ===== EVENT LISTENERS PARA EL MODAL Y PROCESO =====================
// ===================================================================

// Cerrar modal al hacer clic fuera
document.addEventListener('DOMContentLoaded', function () {
    const modal = document.getElementById('modalVisualizarFondo');
    if (modal) {
        modal.addEventListener('click', function (e) {
            if (e.target === this) {
                cerrarModalFondo();
            }
        });
    }
});

/**
 * Función para inactivar/rechazar un fondo
 */
function rechazarFondo() {
    const idFondo = document.getElementById('modal-fondo-id').value;

    if (!idFondo) {
        Swal.fire({
            ...SwalConfig,
            icon: 'warning',
            title: 'Advertencia',
            text: 'No se pudo obtener el ID del fondo'
        });
        return;
    }

    Swal.fire({
        ...SwalConfig,
        title: '¿Está seguro?',
        text: `¿Desea inactivar el fondo ${idFondo}?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Sí, inactivar',
        cancelButtonText: 'Cancelar'
    }).then((result) => {
        if (result.isConfirmed) {
            ejecutarInactivacion(idFondo);
        }
    });
}

function ejecutarInactivacion(idFondo) {
    // ✅ OBTENER EL IDOPCION DINÁMICAMENTE
    const idOpcionActual = window.obtenerIdOpcionActual();

    if (!idOpcionActual) {
        Swal.fire({
            ...SwalConfig,
            icon: 'error',
            title: 'Error',
            text: 'No se pudo obtener el ID de la opción. Por favor, acceda nuevamente desde el menú.'
        });
        return;
    }

    // ✅ OBTENER EL USUARIO DINÁMICAMENTE
    const usuario = obtenerUsuarioActual();

    console.log('Ejecutando inactivación con idOpcion:', idOpcionActual, 'y usuario:', usuario);

    const requestBody = {
        idfondo: parseInt(idFondo),
        nombreusuarioingreso: usuario,
        idopcion: idOpcionActual,
        idcontrolinterfaz: "BTNINACTIVAR",
        idevento: "EVCLICK",
        nombreusuario: usuario
    };

    console.log("Cuerpo de la solicitud (requestBody) para inactivar:", requestBody);

    Swal.fire({
        ...SwalConfig,
        title: 'Procesando...',
        text: 'Inactivando el fondo',
        allowOutsideClick: false,
        allowEscapeKey: false,
        didOpen: () => {
            Swal.showLoading();
        }
    });

    $.ajax({
        url: `${window.apiBaseUrl}/api/Fondo/inactivar-fondo`,
        method: "POST",
        contentType: "application/json",
        headers: obtenerHeadersAPI(),
        data: JSON.stringify(requestBody),
        success: function (response) {
            console.log("Respuesta cruda de inactivar-fondo:", response);

            // Procesar la respuesta con la nueva estructura
            const resultado = procesarRespuestaAPI(response);

            // Verificar si fue exitoso
            if (resultado.success) {
                // Verificar si hay error de negocio (codigoretorno negativo)
                if (resultado.codigoRetorno && resultado.codigoRetorno < 0) {
                    const mensajeError = resultado.mensajeData || resultado.message || 'Error al inactivar el fondo';

                    // CASO ESPECIAL: PENDIENTE DE APROBACIÓN
                    if (mensajeError.toLowerCase().includes("pendiente de aprobación")) {
                        Swal.fire({
                            ...SwalConfig,
                            icon: 'info',
                            title: 'Solicitud generada',
                            text: mensajeError,
                            confirmButtonText: 'Aceptar'
                        }).then(() => {
                            cerrarModalFondo();
                            recargarTablaFondos();
                        });
                        return;
                    }

                    Swal.fire({
                        ...SwalConfig,
                        icon: 'error',
                        title: 'Error',
                        text: mensajeError
                    });
                    return;
                }

                // Éxito total
                const mensajeExito = resultado.mensajeData || 'El fondo ha sido inactivado correctamente';

                Swal.fire({
                    ...SwalConfig,
                    icon: 'success',
                    title: 'Éxito',
                    text: mensajeExito,
                    confirmButtonText: 'Aceptar',
                    timer: 2000,
                    timerProgressBar: true
                }).then(() => {
                    cerrarModalFondo();
                    recargarTablaFondos();
                });
            } else {
                // Error en la respuesta (status != 'ok' o code_status != 200)
                const mensajeError = resultado.mensajeData || resultado.message || 'No se pudo inactivar el fondo';

                // CASO ESPECIAL: PENDIENTE DE APROBACIÓN
                if (mensajeError.toLowerCase().includes("pendiente de aprobación")) {
                    Swal.fire({
                        ...SwalConfig,
                        icon: 'info',
                        title: 'Solicitud generada',
                        text: mensajeError,
                        confirmButtonText: 'Aceptar'
                    }).then(() => {
                        cerrarModalFondo();
                        recargarTablaFondos();
                    });
                    return;
                }

                Swal.fire({
                    ...SwalConfig,
                    icon: 'error',
                    title: 'Error',
                    text: mensajeError,
                    confirmButtonText: 'Aceptar'
                });
            }
        },
        error: function (xhr, status, error) {
            console.log("Error en inactivación - Respuesta del servidor:", xhr.responseText);

            const errorInfo = procesarErrorAPI(xhr, status, error);

            // CASO ESPECIAL: PENDIENTE DE APROBACIÓN (puede venir como error HTTP)
            if (errorInfo.details.toLowerCase().includes("pendiente de aprobación") ||
                errorInfo.message.toLowerCase().includes("pendiente de aprobación")) {
                Swal.fire({
                    ...SwalConfig,
                    icon: 'info',
                    title: 'Solicitud generada',
                    text: errorInfo.details || errorInfo.message,
                    confirmButtonText: 'Aceptar'
                }).then(() => {
                    cerrarModalFondo();
                    recargarTablaFondos();
                });
                return;
            }

            Swal.fire({
                ...SwalConfig,
                icon: 'error',
                title: 'Error',
                text: errorInfo.fullMessage || 'No se pudo inactivar el fondo',
                confirmButtonText: 'Aceptar'
            });
        }
    });
}

/**
 * Carga / recarga la bandeja de fondos para inactivación
 */
function recargarTablaFondos() {
    // ✅ OBTENER EL IDOPCION DINÁMICAMENTE
    const idOpcionActual = window.obtenerIdOpcionActual();

    if (!idOpcionActual) {
        console.error("No se pudo obtener el idOpcion para recargar la tabla");
        return;
    }

    const usuario = obtenerUsuarioActual();

    console.log('Recargando tabla de fondos con idOpcion:', idOpcionActual, 'y usuario:', usuario);

    $.ajax({
        url: `${window.apiBaseUrl}/api/Fondo/bandeja-inactivacion`,
        method: "GET",
        headers: obtenerHeadersAPI(),
        success: function (response) {
            console.log("Respuesta cruda de bandeja-inactivacion:", response);

            // Procesar la respuesta con la nueva estructura
            const resultado = procesarRespuestaAPI(response);

            if (resultado.success) {
                console.log("Datos procesados de bandeja:", resultado.data);
                crearListado(resultado.data);
            } else {
                console.error("Error en respuesta de bandeja:", resultado.message);
                Swal.fire({
                    ...SwalConfig,
                    icon: 'error',
                    title: 'Error',
                    text: resultado.message || 'No se pudo recargar la tabla de fondos'
                });
            }
        },
        error: function (xhr, status, error) {
            const errorInfo = procesarErrorAPI(xhr, status, error);
            console.error("Error al recargar la tabla:", errorInfo.fullMessage);

            Swal.fire({
                ...SwalConfig,
                icon: 'error',
                title: 'Error',
                text: errorInfo.fullMessage || 'No se pudo recargar la tabla de fondos'
            });
        }
    });
}

// Autor: JEAN FRANCOIS CALDERON VEAS | Empresa: BMTECSA | Proyecto: SOFTWARE APL