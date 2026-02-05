// ~/js/Fondo/AprobarFondo.js

// ===============================================================
// Variables globales
// ===============================================================
let tabla;
let ultimaFilaModificada = null;
let datosAprobacionActual = null;

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
// DOCUMENT READY
// ===============================================================
$(document).ready(function () {
    console.log("=== INICIO DE CARGA DE PÁGINA - AprobarFondo (Estructura Post-REST) ===");

    const usuarioFinal = obtenerUsuarioActual();
    console.log("Usuario final obtenido:", usuarioFinal);

    // Configuración inicial y carga de datos
    $.get("/config", function (config) {
        window.apiBaseUrl = config.apiBaseUrl;
        console.log("API Base URL configurada:", config.apiBaseUrl);

        const idOpcionActual = window.obtenerIdOpcionActual();
        if (!idOpcionActual) {
            Swal.fire({
                icon: 'error',
                title: 'Error de Contexto',
                text: 'No se detectó el ID de opción. Acceda desde el menú lateral.'
            });
            return;
        }

        cargarBandeja();
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

    // ===== BOTÓN APROBAR =====
    $('body').on('click', '#btnAprobarFondo', function () {
        let comentario = $("#modal-fondo-comentario").val();
        console.log('Comentario:', comentario);
        procesarAprobacionFondo("APROBAR", comentario);
    });

    // ===== BOTÓN RECHAZAR =====
    $('body').on('click', '#btnRechazarFondo', function () {
        let comentario = $("#modal-fondo-comentario").val();
        console.log('Comentario:', comentario);
        procesarAprobacionFondo("RECHAZAR", comentario);
    });

});

// ===================================================================
// LÓGICA DE DATOS (API)
// ===================================================================

function cargarBandeja() {
    const idOpcionActual = window.obtenerIdOpcionActual();
    const usuario = obtenerUsuarioActual();

    if (!idOpcionActual) {
        console.error("No se pudo obtener el idOpcion para cargar la bandeja");
        return;
    }

    if (!usuario) {
        console.error('No hay usuario en sesión, no se puede cargar la bandeja.');
        return;
    }

    console.log('Cargando bandeja para usuario:', usuario, 'con idOpcion:', idOpcionActual);

    const payload = {
        code_app: "APP20260128155212346",
        http_method: "GET",
        endpoint_path: "api/Fondo/bandeja-aprobacion",
        client: "APL",
        endpoint_query_params: `/${usuario}`
    };

    $.ajax({
        url: "/api/apigee-router-proxy",
        method: "POST",
        contentType: "application/json",
        data: JSON.stringify(payload),
        success: function (response) {
            console.log("Respuesta de bandeja-aprobacion:", response);

            if (response && response.code_status === 200) {
                console.log("Datos de bandeja:", response.json_response);
                crearListado(response.json_response);
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'No se pudieron cargar los fondos para aprobación'
                });
            }
        },
        error: (xhr) => manejarErrorGlobal(xhr, "cargar la bandeja de aprobación")
    });
}

function abrirModalEditar(idFondo, idAprobacion) {
    const idOpcionActual = window.obtenerIdOpcionActual();
    const usuario = obtenerUsuarioActual();

    if (!idOpcionActual) {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo obtener el ID de la opción. Por favor, acceda nuevamente desde el menú.'
        });
        return;
    }

    console.log('Abriendo modal para aprobar fondo ID:', idFondo, 'idAprobacion:', idAprobacion);

    // Limpiar datos previos
    datosAprobacionActual = null;

    const payload = {
        code_app: "APP20260128155212346",
        http_method: "GET",
        endpoint_path: "api/Fondo/bandeja-aprobacion-id",
        client: "APL",
        endpoint_query_params: `/${idFondo}/${idAprobacion}`
    };

    $.ajax({
        url: "/api/apigee-router-proxy",
        method: "POST",
        contentType: "application/json",
        data: JSON.stringify(payload),
        success: function (response) {
            console.log(`Respuesta del fondo (${idFondo}, ${idAprobacion}):`, response);

            if (!response || response.code_status !== 200) {
                Swal.fire({
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
                    icon: 'error',
                    title: 'Error',
                    text: 'No se encontraron datos del fondo.'
                });
                return;
            }

            console.log(`Datos procesados del fondo:`, data);

            // CONCATENACIÓN RUC/ID y NOMBRE
            const idProveedor = data.proveedor || '';
            const nombreProveedor = data.nombre_proveedor || '';
            const proveedorCompleto = (idProveedor && nombreProveedor)
                ? `${idProveedor} - ${nombreProveedor}`
                : idProveedor || nombreProveedor || '';

            // Guardar datos para los botones de aprobación/rechazo
            datosAprobacionActual = {
                entidad: data.entidad || 0,
                identidad: data.idfondo || 0,
                idtipoproceso: data.idtipoproceso || "",
                idetiquetatipoproceso: data.idetiquetatipoproceso || "",
                idaprobacion: idAprobacion,
                entidad_etiqueta: data.entidad_etiqueta,
                idetiquetatestado: data.estado_etiqueta || "",
                comentario: ""
            };

            // Preparar los datos para el modal
            const datosModal = {
                idfondo: data.idfondo,
                descripcion: data.descripcion,
                proveedor: proveedorCompleto,
                tipo_fondo: data.nombre_tipo_fondo,
                valor_fondo: formatearMoneda(data.valor_fondo),
                fecha_inicio: formatDateForInput(data.fecha_inicio),
                fecha_fin: formatDateForInput(data.fecha_fin),
                estado: data.nombre_estado_fondo,
                valor_disponible: formatearMoneda(data.valor_disponible),
                valor_comprometido: formatearMoneda(data.valor_comprometido),
                valor_liquidado: formatearMoneda(data.valor_liquidado)
            };

            // Abrir el modal personalizado
            abrirModalFondo(datosModal);

            // Cargar aprobaciones
            if (data.entidad_etiqueta && data.idfondo && data.idetiquetatipoproceso) {
                cargarAprobaciones(
                    data.entidad_etiqueta,
                    data.idfondo,
                    data.idetiquetatipoproceso
                );
            } else {
                $('#tabla-aprobaciones-fondo').html(
                    '<p class="alert alert-warning">No se encontraron los parámetros necesarios para cargar aprobaciones.</p>'
                );
            }
        },
        error: (xhr) => manejarErrorGlobal(xhr, "obtener datos del fondo")
    });
}

function cargarAprobaciones(valorEntidad, valorIdentidad, valorIdTipoProceso) {
    const idOpcionActual = window.obtenerIdOpcionActual();

    if (!idOpcionActual) {
        console.error("No se pudo obtener el idOpcion para cargar aprobaciones");
        return;
    }

    console.log("=== CARGANDO APROBACIONES ===");
    console.log("valorEntidad:", valorEntidad);
    console.log("valorIdentidad:", valorIdentidad);
    console.log("valorIdTipoProceso:", valorIdTipoProceso);

    // Destruir tabla anterior si existe
    if ($.fn.DataTable.isDataTable('#tabla-aprobaciones')) {
        $('#tabla-aprobaciones').DataTable().destroy();
    }

    // Mostrar indicador de carga
    $('#tabla-aprobaciones-fondo').html(`
        <div class="text-center p-4">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Cargando...</span>
            </div>
            <p class="mt-2">Cargando aprobaciones...</p>
        </div>
    `);

    const payload = {
        code_app: "APP20260128155212346",
        http_method: "GET",
        endpoint_path: "api/Aprobacion/consultar-aprobaciones",
        client: "APL",
        endpoint_query_params: `/${valorEntidad}/${valorIdentidad}/${valorIdTipoProceso}`
    };

    $.ajax({
        url: "/api/apigee-router-proxy",
        method: "POST",
        contentType: "application/json",
        data: JSON.stringify(payload),
        success: function (response) {
            console.log("Respuesta de aprobaciones:", response);

            if (!response || response.code_status !== 200) {
                $('#tabla-aprobaciones-fondo').html(
                    '<p class="alert alert-warning">Error al cargar aprobaciones.</p>'
                );
                return;
            }

            let aprobaciones = Array.isArray(response.json_response)
                ? response.json_response
                : [response.json_response];

            if (aprobaciones.length === 0 || (aprobaciones.length === 1 && (!aprobaciones[0] || aprobaciones[0].idaprobacion === 0))) {
                $('#tabla-aprobaciones-fondo').html(
                    '<p class="alert alert-info">No se encontraron aprobaciones para este fondo.</p>'
                );
                return;
            }

            renderizarTablaAprobaciones(aprobaciones);
        },
        error: function (xhr) {
            console.error("Error al cargar aprobaciones:", xhr.responseText);
            $('#tabla-aprobaciones-fondo').html(
                '<p class="alert alert-danger">Error al cargar las aprobaciones.</p>'
            );
        }
    });
}

function ejecutarAprobacionFondo(accion, nuevoEstado, comentario) {
    const idOpcionActual = window.obtenerIdOpcionActual();
    const usuarioActual = obtenerUsuarioActual();

    if (!idOpcionActual) {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo obtener el ID de la opción. Por favor, acceda nuevamente desde el menú.'
        });
        return;
    }

    console.log("Acción:", accion);
    console.log("datosAprobacionActual:", datosAprobacionActual);

    const body = {
        entidad: datosAprobacionActual.entidad,
        identidad: datosAprobacionActual.identidad,
        idtipoproceso: datosAprobacionActual.idtipoproceso,
        idetiquetatipoproceso: datosAprobacionActual.idetiquetatipoproceso,
        comentario: comentario,
        idetiquetaestado: nuevoEstado,
        idaprobacion: datosAprobacionActual.idaprobacion,
        usuarioaprobador: usuarioActual,
        idopcion: idOpcionActual,
        idcontrolinterfaz: accion === "APROBAR" ? "BTNAPROBAR" : "BTNNEGAR",
        idevento: "EVCLICK",
        nombreusuario: usuarioActual
    };

    console.log("Enviando aprobación/rechazo:", body);

    Swal.fire({
        title: 'Procesando...',
        text: 'Por favor espere',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
    });

    const payload = {
        code_app: "APP20260128155212346",
        http_method: "POST",
        endpoint_path: "api/Fondo/aprobar-fondo",
        client: "APL",
        body_request: body
    };

    $.ajax({
        url: "/api/apigee-router-proxy",
        method: "POST",
        contentType: "application/json",
        data: JSON.stringify(payload),
        success: function (response) {
            console.log("Respuesta de aprobar-fondo:", response);

            if (response && response.code_status === 200) {
                const mensajeExito = response.json_response?.mensaje
                    || `Fondo ${accion === "APROBAR" ? "aprobado" : "rechazado"} correctamente`;

                Swal.fire({
                    icon: 'success',
                    title: '¡Operación Exitosa!',
                    text: mensajeExito,
                    showConfirmButton: false,
                    timer: 2000,
                    timerProgressBar: true
                }).then(() => {
                    datosAprobacionActual = null;
                    ultimaFilaModificada = null;
                    cargarBandeja();
                });
            } else {
                const mensajeError = response.json_response?.mensaje || 'Error al procesar la solicitud';
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: mensajeError
                });
            }
        },
        error: (xhr) => manejarErrorGlobal(xhr, "procesar la aprobación/rechazo")
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
            "<div class='alert alert-info text-center'>No hay fondos para aprobar.</div>"
        );
        return;
    }

    var html = "";
    html += "<table id='tabla-principal' class='table table-bordered table-striped table-hover'>";
    html += "  <thead>";
    html += "    <tr>";
    html += "      <th colspan='12' style='background-color: #CC0000 !important; color: white; text-align: center; font-weight: bold; padding: 8px; font-size: 1rem;'>";
    html += "          BANDEJA DE APROBACIÓN DE FONDOS";
    html += "      </th>";
    html += "    </tr>";
    html += "    <tr>";
    html += "      <th>Acción</th>";
    html += "      <th>Solicitud</th>";
    html += "      <th>IDFondo</th>";
    html += "      <th>Descripción</th>";
    html += "      <th>RUC</th>";
    html += "      <th>Proveedor</th>";
    html += "      <th>Tipo Fondo</th>";
    html += "      <th>Fecha Inicio</th>";
    html += "      <th>Fecha Fin</th>";
    html += "      <th>$ Disponible</th>";
    html += "      <th>$ Comprometido</th>";
    html += "      <th>Estado</th>";
    html += "    </tr>";
    html += "  </thead>";
    html += "  <tbody>";

    for (var i = 0; i < data.length; i++) {
        var fondo = data[i];

        var viewButton = '<button type="button" class="btn-action view-btn" title="Visualizar/Aprobar" onclick="abrirModalEditar(' + fondo.idfondo + ', ' + fondo.idaprobacion + ')">' +
            '<i class="fa-regular fa-eye"></i>' +
            '</button>';

        html += "<tr>";
        html += "  <td class='text-center'>" + viewButton + "</td>";
        html += "  <td>" + (fondo.solicitud ?? "") + "</td>";
        html += "  <td>" + (fondo.idfondo ?? "") + "</td>";
        html += "  <td>" + (fondo.descripcion ?? "") + "</td>";
        html += "  <td>" + (fondo.proveedor ?? "") + "</td>";
        html += "  <td>" + (fondo.nombre_proveedor ?? "") + "</td>";
        html += "  <td>" + (fondo.nombre_tipo_fondo ?? "") + "</td>";
        html += "  <td class='text-center'>" + formatearFecha(fondo.fecha_inicio) + "</td>";
        html += "  <td class='text-center'>" + formatearFecha(fondo.fecha_fin) + "</td>";
        html += "  <td class='text-end'>" + formatearMoneda(fondo.valor_disponible) + "</td>";
        html += "  <td class='text-end'>" + formatearMoneda(fondo.valor_comprometido) + "</td>";
        html += "  <td>" + (fondo.nombre_estado_fondo ?? "") + "</td>";
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
            { targets: 1, width: "8%", className: "dt-center" },
            { targets: 2, width: "6%", className: "dt-center" },
            { targets: [8, 9], className: "dt-right" },
            { targets: [6, 7], className: "dt-center" },
        ],
        order: [[2, 'desc']],
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

function renderizarTablaAprobaciones(aprobaciones) {
    var html = "";
    html += "<table id='tabla-aprobaciones' class='table table-bordered table-striped table-hover w-100'>";
    html += "  <thead>";
    html += "    <tr>";
    html += "      <th>ID</th>";
    html += "      <th>Solicitante</th>";
    html += "      <th>Aprobador</th>";
    html += "      <th>Estado</th>";
    html += "      <th>Fecha Solicitud</th>";
    html += "      <th>Nivel</th>";
    html += "      <th>Tipo Proceso</th>";
    html += "    </tr>";
    html += "  </thead>";
    html += "  <tbody>";

    aprobaciones.forEach((aprobacion) => {
        if (!aprobacion) return;

        let comentarioLimpio = (aprobacion.comentario && aprobacion.comentario !== "string")
            ? aprobacion.comentario
            : "Sin comentarios.";

        let estadoNombre = aprobacion.estado_nombre || "N/A";
        let estadoUpper = estadoNombre.toUpperCase();

        let iconoPopover = "";
        if (estadoUpper.includes("APROBADO") || estadoUpper.includes("NEGADO")) {
            iconoPopover = `
            <i class="fa-solid fa-comment-dots text-warning ms-1"
               style="cursor: pointer; font-size: 0.9rem;"
               data-bs-toggle="popover" 
               data-bs-trigger="focus" 
               data-bs-placement="top"
               tabindex="0"
               title="Comentario" 
               data-bs-content="${comentarioLimpio}">
            </i>`;
        }

        html += "<tr>";
        html += "  <td class='text-center'>" + (aprobacion.idaprobacion ?? "") + "</td>";
        html += "  <td>" + (aprobacion.idusersolicitud ?? "") + "</td>";
        html += "  <td>" + (aprobacion.iduseraprobador ?? "") + "</td>";
        html += "  <td class='text-nowrap'>" + estadoNombre + iconoPopover + "</td>";
        html += "  <td class='text-center'>" + formatearFecha(aprobacion.fechasolicitud) + "</td>";
        html += "  <td class='text-center'>" + (aprobacion.nivelaprobacion ?? "") + "</td>";
        html += "  <td>" + (aprobacion.tipoproceso_nombre ?? "FONDO") + "</td>";
        html += "</tr>";
    });

    html += "  </tbody>";
    html += "</table>";

    $('#tabla-aprobaciones-fondo').html(html);

    $('#tabla-aprobaciones').DataTable({
        pageLength: 5,
        lengthMenu: [5, 10, 25],
        pagingType: 'simple_numbers',
        searching: false,
        columnDefs: [
            { targets: [0, 4, 5], className: "dt-center" },
            { targets: 3, className: "dt-nowrap" }
        ],
        order: [[0, 'desc']],
        language: {
            url: "https://cdn.datatables.net/plug-ins/1.10.25/i18n/Spanish.json"
        },
        drawCallback: function () {
            const popoverTriggerList = document.querySelectorAll('[data-bs-toggle="popover"]');
            [...popoverTriggerList].map(popoverTriggerEl => new bootstrap.Popover(popoverTriggerEl));
        }
    });
}

// ===================================================================
// FUNCIONES DEL MODAL
// ===================================================================

function abrirModalFondo(datos) {
    const modal = document.getElementById('modalEditarFondo');

    document.getElementById('modal-fondo-id').value = datos.idfondo || '';
    document.getElementById('modal-fondo-descripcion').value = datos.descripcion || '';
    document.getElementById('modal-fondo-proveedor').value = datos.proveedor || '';
    document.getElementById('modal-fondo-tipofondo').value = datos.tipo_fondo || '';
    document.getElementById('modal-fondo-fechainicio').value = datos.fecha_inicio || '';
    document.getElementById('modal-fondo-fechafin').value = datos.fecha_fin || '';
    document.getElementById('modal-fondo-valor').value = datos.valor_fondo || '';
    document.getElementById('modal-fondo-estado').value = datos.estado || '';
    document.getElementById('modal-fondo-disponible').value = datos.valor_disponible || '';
    document.getElementById('modal-fondo-comprometido').value = datos.valor_comprometido || '';
    document.getElementById('modal-fondo-liquidado').value = datos.valor_liquidado || '';

    const comentarioElement = document.getElementById('modal-fondo-comentario');
    if (comentarioElement) {
        comentarioElement.value = '';
    }

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function cerrarModalFondo() {
    const modal = document.getElementById('modalEditarFondo');
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';

    if ($.fn.DataTable.isDataTable('#tabla-aprobaciones')) {
        $('#tabla-aprobaciones').DataTable().destroy();
    }
    $('#tabla-aprobaciones-fondo').html('');
}

function procesarAprobacionFondo(accion, comentario) {
    cerrarModalFondo();

    if (!datosAprobacionActual) {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No hay datos de aprobación disponibles.'
        });
        return;
    }

    let nuevoEstado = "";
    let tituloAccion = "";
    let mensajeAccion = "";

    if (accion === "APROBAR") {
        nuevoEstado = "ESTADOAPROBADO";
        tituloAccion = "Aprobar Fondo";
        mensajeAccion = "¿Está seguro que desea aprobar este fondo?";
    } else if (accion === "RECHAZAR") {
        nuevoEstado = "ESTADONEGADO";
        tituloAccion = "Rechazar Fondo";
        mensajeAccion = "¿Está seguro que desea rechazar este fondo?";
    }

    Swal.fire({
        title: tituloAccion,
        text: mensajeAccion,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: accion === "APROBAR" ? '#28a745' : '#dc3545',
        cancelButtonColor: '#6c757d',
        confirmButtonText: accion === "APROBAR" ? 'Sí, aprobar' : 'Sí, rechazar',
        cancelButtonText: 'Cancelar'
    }).then((result) => {
        if (result.isConfirmed) {
            ejecutarAprobacionFondo(accion, nuevoEstado, comentario);
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
        icon: 'error',
        title: 'Error de Comunicación',
        text: `No se pudo completar la acción: ${accion}.`
    });
}

// ===================================================================
// EVENT LISTENERS PARA EL MODAL
// ===================================================================

document.addEventListener('DOMContentLoaded', function () {
    const modal = document.getElementById('modalEditarFondo');
    if (modal) {
        modal.addEventListener('click', function (e) {
            if (e.target === this) {
                cerrarModalFondo();
            }
        });
    }
});

// Autor: JEAN FRANCOIS CALDERON VEAS | Empresa: BMTECSA | Proyecto: SOFTWARE APL