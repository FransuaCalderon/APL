// ~/js/Fondo/InactivarFondo.js

// ===============================================================
// Variables globales
// ===============================================================
let tabla; // GLOBAL
let ultimaFilaModificada = null; // Para recordar la última fila editada/eliminada
let datosModal = null; // Variable global para almacenar los datos del modal

// ===============================================================
// FUNCIÓN HELPER PARA OBTENER USUARIO (Busca en múltiples lugares)
// ===============================================================
function obtenerUsuarioActual() {
    // Buscar en múltiples ubicaciones posibles
    const usuario = window.usuarioActual
        || sessionStorage.getItem('usuarioActual')
        || sessionStorage.getItem('usuario')
        || localStorage.getItem('usuarioActual')
        || localStorage.getItem('usuario')
        || "admin"; // Fallback final

    return usuario;
}

// Configuración global de SweetAlert2 para z-index
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
                limpiarSeleccion('#tabla-fondos');
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

    var html = "";
    html += "<table id='tabla-fondos' class='table table-bordered table-striped table-hover'>";
    html += "  <thead>";

    // Fila del Título ROJO
    html += "    <tr>";
    html += "      <th colspan='13' style='background-color: #CC0000 !important; color: white; text-align: center; font-weight: bold; padding: 8px; font-size: 1rem;'>";
    html += "          BANDEJA DE FONDOS";
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

    if (data && data.length > 0) {
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
            html += "  <td>" + (fondo.nombre ?? "") + "</td>";
            html += "  <td>" + (fondo.tipo_fondo ?? "") + "</td>";
            html += "  <td class='text-end'>" + formatearMoneda(fondo.valor_fondo) + "</td>";
            html += "  <td class='text-center'>" + formatearFecha(fondo.fecha_inicio) + "</td>";
            html += "  <td class='text-center'>" + formatearFecha(fondo.fecha_fin) + "</td>";
            html += "  <td class='text-end'>" + formatearMoneda(fondo.valor_disponible) + "</td>";
            html += "  <td class='text-end'>" + formatearMoneda(fondo.valor_comprometido) + "</td>";
            html += "  <td class='text-end'>" + formatearMoneda(fondo.valor_liquidado) + "</td>";
            html += "  <td>" + (fondo.estado ?? "") + "</td>";
            html += "</tr>";
        }
    }

    html += "  </tbody>";
    html += "</table>";

    // Inserta la tabla en el div
    $('#tabla').html(html);

    // Inicializa DataTable
    tabla = $('#tabla-fondos').DataTable({
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
            emptyTable: "Sin datos",
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
                marcarFilaPorId('#tabla-fondos', ultimaFilaModificada);
            }
        }
    });

    console.log('Llamando a inicializarMarcadoFilas para Fondos');
    if (typeof inicializarMarcadoFilas === 'function') {
        inicializarMarcadoFilas('#tabla-fondos');
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

    const usuario = obtenerUsuarioActual(); // ✅ USAR FUNCIÓN ROBUSTA

    console.log('Abriendo modal para visualizar fondo ID:', id, 'con idOpcion:', idOpcionActual, 'y usuario:', usuario);

    // 1. Cargar la tabla de acuerdos
    if (typeof cargarAcuerdoFondo === 'function') {
        cargarAcuerdoFondo(id);
    }

    // 2. Llama a la API para obtener los datos del fondo por ID
    $.ajax({
        url: `${window.apiBaseUrl}/api/Fondo/bandeja-inactivacion-id/${id}`,
        method: "GET",
        headers: {
            "idopcion": String(idOpcionActual), // ✅ DINÁMICO
            "usuario": usuario,                  // ✅ DINÁMICO
            "idcontrolinterfaz": "0",
            "idevento": "0",
            "entidad": "0",
            "identidad": "0",
            "idtipoproceso": "0"
        },
        success: function (data) {
            console.log("bandeja inactivacion id: ", data);

            // CONCATENACIÓN RUC/ID y NOMBRE
            const idProveedor = data.proveedor || '';
            const nombreProveedor = data.nombre || '';

            const proveedorCompleto = (idProveedor && nombreProveedor)
                ? `${idProveedor} - ${nombreProveedor}`
                : idProveedor || nombreProveedor || '';

            datosModal = {
                idfondo: data.idfondo,
                descripcion: data.descripcion,
                proveedor: proveedorCompleto,
                tipo_fondo: data.tipo_fondo,
                valor_fondo: parseFloat(data.valor_fondo) || 0,
                fecha_inicio: formatDateForInput(data.fecha_inicio),
                fecha_fin: formatDateForInput(data.fecha_fin),
                estado: data.estado,
                estado_etiqueta: data.estado_etiqeuta
            };
            console.log("datosModal: ", datosModal);

            abrirModalFondo(datosModal);
        },
        error: function (xhr, status, error) {
            console.error("Error al obtener datos del fondo:", error);
            console.error("Detalles del error:", xhr.responseText);
            Swal.fire({
                ...SwalConfig,
                icon: 'error',
                title: 'Error',
                text: 'No se pudieron cargar los datos del fondo.'
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
        headers: {
            "idopcion": String(idOpcionActual),
            "usuario": usuario,
            "idcontrolinterfaz": "0",
            "idevento": "0",
            "entidad": "0",
            "identidad": "0",
            "idtipoproceso": "0"
        },
        success: function (data) {
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

            // VALIDACIÓN CRÍTICA: Cambiado idAcuerdofondo -> idacuerdofondo
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
                // Usamos las propiedades tal cual vienen de la API (usualmente minúsculas en .NET Core/WebAPI)
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
                    url: "//cdn.datatables.net/plug-ins/1.10.24/i18n/Spanish.json"
                }
            });
        },
        error: function (xhr, status, error) {
            console.error("Error al obtener datos del acuerdo:", error);
            $('#tabla-acuerdo-fondo').html('<p class="alert alert-danger text-center">Error al cargar el acuerdo.</p>');
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
        nombreusuarioingreso: usuario,     // ✅ DINÁMICO
        idopcion: idOpcionActual,          // ✅ DINÁMICO
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
        headers: {
            "idopcion": String(idOpcionActual), // ✅ DINÁMICO en headers también
            "usuario": usuario                   // ✅ DINÁMICO en headers también
        },
        data: JSON.stringify(requestBody),

        success: function (response) {
            Swal.fire({
                ...SwalConfig,
                icon: 'success',
                title: 'Éxito',
                text: 'El fondo ha sido inactivado correctamente',
                confirmButtonText: 'Aceptar'
            }).then(() => {
                cerrarModalFondo();
                recargarTablaFondos();
            });
        },

        error: function (xhr) {
            console.log("Respuesta del servidor:", xhr.responseText);

            let mensaje = "";

            try {
                const json = JSON.parse(xhr.responseText);
                mensaje = json.mensaje || json.message || "";
            } catch (e) {
                mensaje = "";
            }

            // CASO ESPECIAL: PENDIENTE
            if (mensaje.toLowerCase().includes("pendiente de aprobación")) {
                Swal.fire({
                    ...SwalConfig,
                    icon: 'info',
                    title: 'Solicitud generada',
                    text: mensaje,
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
                text: mensaje || 'No se pudo inactivar el fondo',
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

    const usuario = obtenerUsuarioActual(); // ✅ USAR FUNCIÓN ROBUSTA

    console.log('Recargando tabla de fondos con idOpcion:', idOpcionActual, 'y usuario:', usuario);

    $.ajax({
        url: `${window.apiBaseUrl}/api/Fondo/bandeja-inactivacion`,
        method: "GET",
        headers: {
            "idopcion": String(idOpcionActual), // ✅ DINÁMICO
            "usuario": usuario,                  // ✅ DINÁMICO
            "idcontrolinterfaz": "0",
            "idevento": "0",
            "entidad": "0",
            "identidad": "0",
            "idtipoproceso": "0"
        },
        success: function (data) {
            console.log("Tabla recargada:", data);
            crearListado(data);
        },
        error: function (xhr, status, error) {
            console.error("Error al recargar la tabla:", error);
            console.error("Detalles del error:", xhr.responseText);
            Swal.fire({
                ...SwalConfig,
                icon: 'error',
                title: 'Error',
                text: 'No se pudo recargar la tabla de fondos'
            });
        }
    });
}