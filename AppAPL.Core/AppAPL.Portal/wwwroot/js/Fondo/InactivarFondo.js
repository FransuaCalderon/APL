// ~/js/Fondo/InactivarFondo.js

// Variables globales
let tabla; // GLOBAL
let ultimaFilaModificada = null; // Para recordar la última fila editada/eliminada
let datosModal = null;
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

// Se ejecuta cuando el DOM está listo
$(document).ready(function () {

    // Configuración inicial y carga de datos
    $.get("/config", function (config) {
        const apiBaseUrl = config.apiBaseUrl;
        window.apiBaseUrl = apiBaseUrl;

        $.ajax({
            url: `${apiBaseUrl}/api/Fondo/bandeja-inactivacion`,
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
                console.log(data);
                crearListado(data);
            },
            error: function (xhr, status, error) {
                console.error("Error al obtener datos de fondos:", error);
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'No se pudieron cargar los fondos'
                });
            }
        });
    });

    // ===== BOTÓN LIMPIAR =====
    $('body').on('click', '#btnLimpiar', function () {
        if (tabla) {
            tabla.search('').draw();
            tabla.page(0).draw('page');
            ultimaFilaModificada = null;
            limpiarSeleccion('#tabla-fondos');
        }
    });

}); // <-- FIN de $(document).ready


// ===================================================================
// ===== FUNCIONES GLOBALES =====
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
    html += "      <th colspan='12' style='background-color: #CC0000 !important; color: white; text-align: center; font-weight: bold; padding: 8px; font-size: 1rem;'>";
    html += "          BANDEJA DE FONDOS";
    html += "      </th>";
    html += "    </tr>";

    // Fila de las Cabeceras
    html += "    <tr>";
    html += "      <th>Acción</th>";
    html += "      <th>IDFondo</th>";
    html += "      <th>Descripción</th>";
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

    if (!data || data.length === 0) {
        html += "<tr><td colspan='12' class='text-center'>Sin datos</td></tr>";
    } else {
        for (var i = 0; i < data.length; i++) {
            var fondo = data[i];
            var id = fondo.idfondo;

            // Botón de visualizar
            var viewButton = '<button type="button" class="btn-action view-btn" title="Visualizar" onclick="abrirModalEditar(' + id + ')">' +
                '<i class="fa-regular fa-eye"></i>' +
                '</button>';

            html += "<tr>";
            html += "  <td class='text-center'>" + viewButton + "</td>";
            html += "  <td>" + (fondo.idfondo ?? "") + "</td>";
            html += "  <td>" + (fondo.descripcion ?? "") + "</td>";
            html += "  <td>" + (fondo.proveedor ?? "") + "</td>";
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
            if (ultimaFilaModificada !== null) {
                marcarFilaPorId('#tabla-fondos', ultimaFilaModificada);
            }
        }
    });

    console.log('Llamando a inicializarMarcadoFilas para Fondos');
    inicializarMarcadoFilas('#tabla-fondos');
}

// ===================================================================
// ===== FUNCIONES PARA EL MODAL PERSONALIZADO =====
// ===================================================================

/**
 * Abre el modal personalizado y carga los datos del fondo.
 */
function abrirModalEditar(id) {
    // 1. Cargar la tabla de acuerdos
    cargarAcuerdoFondo(id);

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
            console.log("bandeja modificacion id: ", data);
            // 3. Preparar los datos para el modal
            datosModal = {
                idfondo: data.idfondo,
                descripcion: data.descripcion,
                proveedor: data.proveedor,
                tipo_fondo: data.tipo_fondo,
                valor_fondo: formatearMoneda(data.valor_fondo).replace('$ ', '').replace(',', ''),
                fecha_inicio: formatDateForInput(data.fecha_inicio),
                fecha_fin: formatDateForInput(data.fecha_fin),
                estado: data.estado,
                estado_etiqueta: data.estado_etiqeuta
            };
            console.log("datosModal: ", datosModal);
            // 4. Abrir el modal personalizado
            abrirModalFondo(datosModal);
        },
        error: function (xhr, status, error) {
            console.error("Error al obtener datos del fondo:", error);
            Swal.fire({
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

    // Llenar los datos
    document.getElementById('modal-fondo-id').value = datos.idfondo || '';
    document.getElementById('modal-fondo-descripcion').value = datos.descripcion || '';
    document.getElementById('modal-fondo-proveedor').value = datos.proveedor || '';
    document.getElementById('modal-fondo-tipofondo').value = datos.tipo_fondo || '';
    document.getElementById('modal-fondo-fechainicio').value = datos.fecha_inicio || '';
    document.getElementById('modal-fondo-fechafin').value = datos.fecha_fin || '';
    document.getElementById('modal-fondo-valor').value = datos.valor_fondo || '';
    document.getElementById('modal-fondo-estado').value = datos.estado || '';

    // Mostrar modal
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
// ===== FUNCIONES UTILITARIAS =====
// ===================================================================

/**
 * Formatea un número como moneda (ej: 20000 -> 20,000.00)
 */
function formatearMoneda(valor) {
    var numero = parseFloat(valor);
    if (isNaN(numero) || valor === null || valor === undefined) {
        return "$ 0.00"; // Retorna un valor por defecto en lugar de undefined
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

/**
 * Llama a la API para obtener el acuerdo por ID de Fondo y crea la tabla.
 */
function cargarAcuerdoFondo(idFondo) {
    // 1. Destruir tabla anterior si existe
    if ($.fn.DataTable.isDataTable('#tabla-acuerdo')) {
        $('#tabla-acuerdo').DataTable().destroy();
    }

    // Limpiar el contenedor antes de cargar
    $('#tabla-acuerdo-fondo').html(`
        <div class="text-center p-4">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Cargando...</span>
            </div>
            <p class="mt-2">Cargando datos del acuerdo...</p>
        </div>
    `);

    // 2. Llamada al endpoint para el acuerdo
    $.ajax({
        url: `${window.apiBaseUrl}/consultar-acuerdo-fondo/${idFondo}`,
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
            console.log("Datos del Acuerdo:", data);

            // 3. Crear la estructura de la tabla
            let acuerdos = Array.isArray(data) ? data : [data];
            if (acuerdos.length === 0 || acuerdos[0].idacuerdofondo === 0) {
                $('#tabla-acuerdo-fondo').html('<p class="alert alert-warning">No se encontraron datos de acuerdo para este fondo.</p>');
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
                // LOG PARA DEBUGGING - Ver qué campos existen
                console.log("Campo valorFondo:", acuerdo.valorFondo);
                console.log("Acuerdo completo:", acuerdo);

                html += "<tr>";
                html += "  <td>" + (acuerdo.idacuerdofondo ?? "") + "</td>";
                html += "  <td>" + (acuerdo.acuerdofondo_estado_nombre ?? "") + "</td>";
                html += "  <td>" + (acuerdo.acuerdo_descripcion ?? "") + "</td>";
                html += "  <td class='text-end'>" + formatearMoneda(acuerdo.valorFondo) + "</td>";
                html += "  <td class='text-end'>" + formatearMoneda(acuerdo.acuerdofondo_disponible) + "</td>";
                html += "  <td class='text-end'>" + formatearMoneda(acuerdo.acuerdofondo_comprometido) + "</td>";
                html += "  <td class='text-end'>" + formatearMoneda(acuerdo.acuerdofondo_liquidado) + "</td>";
                html += "</tr>";
            });

            html += "  </tbody>";
            html += "</table>";

            $('#tabla-acuerdo-fondo').html(html);

            // 4. Inicializar DataTable
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
            $('#tabla-acuerdo-fondo').html('<p class="alert alert-danger">Error al cargar el acuerdo.</p>');
        }
    });
}

// ===================================================================
// ===== EVENT LISTENERS PARA EL MODAL =====
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
            ...SwalConfig,  // Añadir configuración
            icon: 'warning',
            title: 'Advertencia',
            text: 'No se pudo obtener el ID del fondo'
        });
        return;
    }

    Swal.fire({
        ...SwalConfig,  // Añadir configuración
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
        entidad: 0, //debe venir de la base
        identidad: parseInt(idFondo),
        idtipoproceso: 0, // debe venir de la base
        idetiquetatipoproceso: "TPINACTIVACION",
        comentario: "Fondo inactivado desde bandeja de inactivación",
        idetiquetaestado: datosModal.estado_etiqueta,
        idaprobacion: 0, // debe venir de la base
        usuarioaprobador: "admin",
        idopcion: 43,
        idcontrolinterfaz: 28,
        idevento: 29
    };

    Swal.fire({
        ...SwalConfig,  // Añadir configuración
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
                ...SwalConfig,  // Añadir configuración
                icon: 'success',
                title: 'Éxito',
                text: 'El fondo ha sido inactivado correctamente',
                confirmButtonText: 'Aceptar'
            }).then(() => {
                cerrarModalFondo();
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
                    // Si no se puede parsear, usar mensaje por defecto
                }
            }

            Swal.fire({
                ...SwalConfig,  // Añadir configuración
                icon: 'error',
                title: 'Error',
                text: mensajeError,
                confirmButtonText: 'Aceptar'
            });
        }
    });
}
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
                icon: 'error',
                title: 'Error',
                text: 'No se pudo recargar la tabla de fondos'
            });
        }
    });
}