// ~/js/Fondo/InactivarFondo.js

// Variables globales
let tabla; // GLOBAL
let ultimaFilaModificada = null; // Para recordar la última fila editada/eliminada
let datosModal = null; // Variable global para almacenar los datos del modal

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

    // Configuración inicial y carga de datos
    $.get("/config", function (config) {
        const apiBaseUrl = config.apiBaseUrl;
        window.apiBaseUrl = apiBaseUrl;

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

}); // <-- FIN de $(document).ready


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

    /*
    if (!data || data.length === 0) {
        html += "<tr><td colspan='13' class='text-center'>Sin datos</td></tr>";
    } else {
        for (var i = 0; i < data.length; i++) {
            var fondo = data[i];
            var id = fondo.idfondo;

            // Botón de visualizar
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
    }*/

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
    // 1. Cargar la tabla de acuerdos
    if (typeof cargarAcuerdoFondo === 'function') {
        cargarAcuerdoFondo(id);
    }

    // 2. Llama a la API para obtener los datos del fondo por ID
    $.ajax({
        url: `${window.apiBaseUrl}/api/Fondo/bandeja-inactivacion-id/${id}`,
        method: "GET",
        headers: {
            "idopcion": "1",
            "usuario": "admin",
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
 * Convierte una fecha/hora (ej: "2025-11-03T00:00:00")
 * al formato "YYYY-MM-DD" que necesita <input type="date">.
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
 * Formatea un número como moneda (ej: 20000 -> 20,000.00)
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
        url: `${window.apiBaseUrl}/consultar-acuerdo-fondo/${idFondo}`, // ✅ CORREGIDO: Agregado /api/Fondo/
        method: "GET",
        dataType: "json",
        headers: {
            "idopcion": "1",
            "usuario": "admin",
            "idcontrolinterfaz": "0",
            "idevento": "0",
            "entidad": "0",
            "identidad": "0",
            "idtipoproceso": "0"
        },
        success: function (data) {
            console.log("Datos del Acuerdo (raw):", data, typeof data);

            if (typeof data === "string") {
                try {
                    data = JSON.parse(data);
                } catch (e) {
                    console.error("No se pudo parsear la respuesta como JSON:", e);
                    $('#tabla-acuerdo-fondo').html('<p class="alert alert-danger text-center">Respuesta inválida del servidor.</p>');
                    return;
                }
            }

            let acuerdos = Array.isArray(data) ? data : [data];

            if (!acuerdos.length || !acuerdos[0].idAcuerdofondo || acuerdos[0].idAcuerdofondo === 0) {
                $('#tabla-acuerdo-fondo').html(
                    '<p class="alert alert-warning mb-0 text-center">No se encontraron datos de acuerdo para este fondo.</p>'
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
                console.log("Acuerdo completo:", acuerdo);
                const valor = acuerdo.valorImporte ?? acuerdo.valorFondo ?? 0;

                html += "<tr>";
                html += "  <td>" + (acuerdo.idAcuerdofondo ?? "") + "</td>";
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
                    decimal: "",
                    emptyTable: "No hay acuerdos disponibles",
                    info: "Mostrando _START_ a _END_ de _TOTAL_ acuerdos",
                    infoEmpty: "Mostrando 0 a 0 de 0 acuerdos",
                    infoFiltered: "(filtrado de _MAX_ acuerdos totales)",
                    lengthMenu: "Mostrar _MENU_ acuerdos",
                    loadingRecords: "Cargando...",
                    processing: "Procesando...",
                    search: "Buscar:",
                    zeroRecords: "No se encontraron acuerdos coincidentes",
                    paginate: {
                        first: "Primero",
                        last: "Último",
                        next: "Siguiente",
                        previous: "Anterior"
                    }
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
    const requestBody = {
        entidad: 0,
        identidad: parseInt(idFondo),
        idtipoproceso: 0,
        idetiquetatipoproceso: "TPINACTIVACION",
        comentario: "Fondo inactivado desde bandeja de inactivación",
        idetiquetaestado: datosModal.estado_etiqueta,
        idaprobacion: 0,
        usuarioaprobador: "admin",
        idopcion: 12,
        idcontrolinterfaz: 28,
        idevento: 29
    };

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
        url: `${window.apiBaseUrl}/api/Fondo/aprobar-fondo`,
        method: "POST",
        contentType: "application/json",
        data: JSON.stringify(requestBody),
        success: function (response) {
            console.log("Respuesta de inactivación:", response);

            Swal.fire({
                ...SwalConfig,
                icon: 'success',
                title: 'Éxito',
                text: 'El fondo ha sido inactivado correctamente',
                confirmButtonText: 'Aceptar'
            }).then(() => {
                // recordar la última fila modificada (por si quieres marcarla)
                ultimaFilaModificada = idFondo;
                cerrarModalFondo();
                // 🔄 Refrescar bandeja después de inactivar
                recargarTablaFondos();
            });
        },
        error: function (xhr, status, error) {
            console.error("Error al inactivar el fondo:", error);
            console.error("Respuesta del servidor:", xhr.responseText);

            let mensajeError = 'No se pudo inactivar el fondo';

            if (xhr.responseJSON && xhr.responseJSON.message) {
                mensajeError = xhr.responseJSON.message;
            } else if (xhr.responseText) {
                try {
                    const errorObj = JSON.parse(xhr.responseText);
                    mensajeError = errorObj.message || mensajeError;
                } catch (e) {
                    // ignorar parseo fallido
                }
            }

            Swal.fire({
                ...SwalConfig,
                icon: 'error',
                title: 'Error',
                text: mensajeError,
                confirmButtonText: 'Aceptar'
            });
        }
    });
}

/**
 * Carga / recarga la bandeja de fondos para inactivación
 */
function recargarTablaFondos() {
    $.ajax({
        url: `${window.apiBaseUrl}/api/Fondo/bandeja-inactivacion`,
        method: "GET",
        headers: {
            "idopcion": "1",
            "usuario": "admin",
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
            Swal.fire({
                ...SwalConfig,
                icon: 'error',
                title: 'Error',
                text: 'No se pudo recargar la tabla de fondos'
            });
        }
    });
}
