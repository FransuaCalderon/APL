// ~/js/Fondo/InactivarFondo.js

// ===============================================================
// Variables globales
// ===============================================================
let tabla;
let ultimaFilaModificada = null;
let datosModal = null;

// ===============================================================
// FUNCIÓN HELPER PARA OBTENER USUARIO
// ===============================================================
function obtenerUsuarioActual() {
    return window.usuarioActual
        || sessionStorage.getItem('usuarioActual')
        || sessionStorage.getItem('usuario')
        || localStorage.getItem('usuarioActual')
        || localStorage.getItem('usuario')
        || "admin";
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
// DOCUMENT READY
// ===================================================================
$(document).ready(function () {
    console.log("=== INICIO DE CARGA DE PÁGINA - InactivarFondo (Estructura Post-REST) ===");

    const usuarioFinal = obtenerUsuarioActual();
    console.log("Usuario final obtenido:", usuarioFinal);

    // Configuración inicial y carga de datos
    $.get("/config", function (config) {
        window.apiBaseUrl = config.apiBaseUrl;
        console.log("API Base URL configurada:", config.apiBaseUrl);

        const idOpcionActual = window.obtenerIdOpcionActual();
        if (!idOpcionActual) {
            Swal.fire({
                ...SwalConfig,
                icon: 'error',
                title: 'Error de Contexto',
                text: 'No se detectó el ID de opción. Acceda desde el menú lateral.'
            });
            return;
        }

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

});

// ===================================================================
// LÓGICA DE DATOS (API)
// ===================================================================

function recargarTablaFondos() {
    const idOpcionActual = window.obtenerIdOpcionActual();

    if (!idOpcionActual) {
        console.error("No se pudo obtener el idOpcion para recargar la tabla");
        return;
    }

    console.log('Recargando tabla de fondos con idOpcion:', idOpcionActual);

    const payload = {
        code_app: "APP20260128155212346",
        http_method: "GET",
        endpoint_path: "api/Fondo/bandeja-inactivacion",
        client: "APL",
        endpoint_query_params: ""
    };

    $.ajax({
        url: "/api/apigee-router-proxy",
        method: "POST",
        contentType: "application/json",
        data: JSON.stringify(payload),
        success: function (response) {
            console.log("Respuesta de bandeja-inactivacion:", response);

            if (response && response.code_status === 200) {
                console.log("Datos de bandeja:", response.json_response);
                crearListado(response.json_response);
            } else {
                Swal.fire({
                    ...SwalConfig,
                    icon: 'error',
                    title: 'Error',
                    text: 'No se pudo recargar la tabla de fondos'
                });
            }
        },
        error: (xhr) => manejarErrorGlobal(xhr, "recargar la tabla de fondos")
    });
}

function abrirModalEditar(id) {
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

    console.log('Abriendo modal para visualizar fondo ID:', id);

    // 1. Cargar la tabla de acuerdos
    if (typeof cargarAcuerdoFondo === 'function') {
        cargarAcuerdoFondo(id);
    }

    // 2. Llama a la API para obtener los datos del fondo por ID
    const payload = {
        code_app: "APP20260128155212346",
        http_method: "GET",
        endpoint_path: "api/Fondo/bandeja-inactivacion-id",
        client: "APL",
        endpoint_query_params: `/${id}`
    };

    $.ajax({
        url: "/api/apigee-router-proxy",
        method: "POST",
        contentType: "application/json",
        data: JSON.stringify(payload),
        success: function (response) {
            console.log("Respuesta de bandeja-inactivacion-id:", response);

            if (!response || response.code_status !== 200) {
                Swal.fire({
                    ...SwalConfig,
                    icon: 'error',
                    title: 'Error',
                    text: 'No se pudieron cargar los datos del fondo.'
                });
                return;
            }

            // Los datos pueden venir como array o como objeto único
            const data = Array.isArray(response.json_response)
                ? response.json_response[0]
                : response.json_response;

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

            console.log("datosModal:", datosModal);
            abrirModalFondo(datosModal);
        },
        error: (xhr) => manejarErrorGlobal(xhr, "obtener datos del fondo")
    });
}

function cargarAcuerdoFondo(idFondo) {
    const idOpcionActual = window.obtenerIdOpcionActual();

    if (!idOpcionActual) {
        console.error("No se pudo obtener el idOpcion para cargar acuerdos");
        return;
    }

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

    const payload = {
        code_app: "APP20260128155212346",
        http_method: "GET",
        endpoint_path: "api/acuerdo/consultar-acuerdo-fondo",
        client: "APL",
        endpoint_query_params: `/${idFondo}`
    };

    $.ajax({
        url: "/api/apigee-router-proxy",
        method: "POST",
        contentType: "application/json",
        data: JSON.stringify(payload),
        success: function (response) {
            console.log("Respuesta de consultar-acuerdo-fondo:", response);

            let data = response.json_response || [];

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

            renderizarTablaAcuerdos(acuerdos);
        },
        error: function (xhr) {
            console.error("Error al obtener datos del acuerdo:", xhr.responseText);
            $('#tabla-acuerdo-fondo').html('<p class="alert alert-danger text-center">Error al cargar el acuerdo.</p>');
        }
    });
}

function ejecutarInactivacion(idFondo) {
    const idOpcionActual = window.obtenerIdOpcionActual();
    const usuario = obtenerUsuarioActual();

    if (!idOpcionActual) {
        Swal.fire({
            ...SwalConfig,
            icon: 'error',
            title: 'Error',
            text: 'No se pudo obtener el ID de la opción. Por favor, acceda nuevamente desde el menú.'
        });
        return;
    }

    console.log('Ejecutando inactivación con idOpcion:', idOpcionActual, 'y usuario:', usuario);

    const body = {
        idfondo: parseInt(idFondo),
        nombreusuarioingreso: usuario,
        idopcion: idOpcionActual,
        idcontrolinterfaz: "BTNINACTIVAR",
        idevento: "EVCLICK",
        nombreusuario: usuario
    };

    console.log("Cuerpo de la solicitud para inactivar:", body);

    Swal.fire({
        ...SwalConfig,
        title: 'Procesando...',
        text: 'Inactivando el fondo',
        allowOutsideClick: false,
        allowEscapeKey: false,
        didOpen: () => Swal.showLoading()
    });

    const payload = {
        code_app: "APP20260128155212346",
        http_method: "POST",
        endpoint_path: "api/Fondo/inactivar-fondo",
        client: "APL",
        body_request: body
    };

    $.ajax({
        url: "/api/apigee-router-proxy",
        method: "POST",
        contentType: "application/json",
        data: JSON.stringify(payload),
        success: function (response) {
            console.log("Respuesta de inactivar-fondo:", response);

            if (response && response.code_status === 200) {
                // Verificar si hay error de negocio (codigoretorno negativo)
                if (response.json_response?.codigoretorno && response.json_response.codigoretorno < 0) {
                    const mensajeError = response.json_response.mensaje || 'Error al inactivar el fondo';

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
                const mensajeExito = response.json_response?.mensaje || 'El fondo ha sido inactivado correctamente';

                Swal.fire({
                    ...SwalConfig,
                    icon: 'success',
                    title: '¡Operación Exitosa!',
                    text: mensajeExito,
                    showConfirmButton: false,
                    timer: 2000,
                    timerProgressBar: true
                }).then(() => {
                    cerrarModalFondo();
                    recargarTablaFondos();
                });
            } else {
                const mensajeError = response.json_response?.mensaje || 'No se pudo inactivar el fondo';

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
            }
        },
        error: (xhr) => {
            console.log("Error en inactivación - Respuesta:", xhr.responseText);

            // CASO ESPECIAL: PENDIENTE DE APROBACIÓN (puede venir como error HTTP)
            try {
                const errorResponse = JSON.parse(xhr.responseText);
                const mensaje = errorResponse?.json_response?.mensaje || '';
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
            } catch (e) { }

            manejarErrorGlobal(xhr, "inactivar el fondo");
        }
    });
}

// ===================================================================
// UI Y RENDERIZADO
// ===================================================================

function crearListado(data) {
    if (tabla) {
        tabla.destroy();
    }

    if (!data || data.length === 0) {
        $('#tabla').html(
            "<div class='alert alert-info text-center'>No hay fondos disponibles para inactivar.</div>"
        );
        return;
    }

    var html = "";
    html += "<table id='tabla-principal' class='table table-bordered table-striped table-hover'>";
    html += "  <thead>";
    html += "    <tr>";
    html += "      <th colspan='13' style='background-color: #CC0000 !important; color: white; text-align: center; font-weight: bold; padding: 8px; font-size: 1rem;'>";
    html += "          BANDEJA DE INACTIVACIÓN DE FONDOS";
    html += "      </th>";
    html += "    </tr>";
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

    $('#tabla').html(html);

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
            url: "https://cdn.datatables.net/plug-ins/1.10.25/i18n/Spanish.json"
        },
        drawCallback: function () {
            if (ultimaFilaModificada !== null && typeof marcarFilaPorId === 'function') {
                marcarFilaPorId('#tabla-principal', ultimaFilaModificada);
            }
        }
    });

    if (typeof inicializarMarcadoFilas === 'function') {
        inicializarMarcadoFilas('#tabla-principal');
    }
}

function renderizarTablaAcuerdos(acuerdos) {
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
        const valor = acuerdo.valoraporte || acuerdo.valoraporte || 0;

        html += "<tr>";
        html += "  <td>" + id + "</td>";
        html += "  <td>" + (acuerdo.acuerdo_estado_nombre ?? "") + "</td>";
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
            url: "https://cdn.datatables.net/plug-ins/1.10.25/i18n/Spanish.json"
        }
    });
}

// ===================================================================
// FUNCIONES DEL MODAL
// ===================================================================

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

function cerrarModalFondo() {
    const modal = document.getElementById('modalVisualizarFondo');
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';

    if ($.fn.DataTable.isDataTable('#tabla-acuerdo')) {
        $('#tabla-acuerdo').DataTable().destroy();
    }
    $('#tabla-acuerdo-fondo').html('');
}

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

// ===================================================================
// HELPERS DE UTILIDAD
// ===================================================================

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

function formatDateForInput(fechaString) {
    if (!fechaString) return "";
    return fechaString.split('T')[0];
}

function manejarErrorGlobal(xhr, accion) {
    console.error(`QA Report - Error al ${accion}:`, xhr.responseText);
    Swal.fire({
        ...SwalConfig,
        icon: 'error',
        title: 'Error de Comunicación',
        text: `No se pudo completar la acción: ${accion}.`
    });
}

// ===================================================================
// EVENT LISTENERS PARA EL MODAL
// ===================================================================

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

// Autor: JEAN FRANCOIS CALDERON VEAS | Empresa: BMTECSA | Proyecto: SOFTWARE APL