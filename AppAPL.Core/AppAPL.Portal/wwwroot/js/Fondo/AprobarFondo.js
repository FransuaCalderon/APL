// ~/js/Fondo/AprobarFondo.js

// ===============================================================
// Variables globales
// ===============================================================
let tabla; // GLOBAL
let ultimaFilaModificada = null; // Para recordar la última fila editada/eliminada
let datosAprobacionActual = null; // Para almacenar los datos de la aprobación actual

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

// ===============================================================
// DOCUMENT READY
// ===============================================================
$(document).ready(function () {

    console.log("=== INICIO DE CARGA DE PÁGINA - AprobarFondo ===");
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
        console.log('comentario: ', comentario);
        console.log('boton de aprobar fondo');
        procesarAprobacionFondo("APROBAR", comentario);
    });

    // ===== BOTÓN RECHAZAR =====
    $('body').on('click', '#btnRechazarFondo', function () {
        let comentario = $("#modal-fondo-comentario").val();
        console.log('comentario: ', comentario);
        console.log('boton de rechazar fondo');
        procesarAprobacionFondo("RECHAZAR", comentario);
    });

}); // FIN document.ready


// ===================================================================
// ===== FUNCIONES GLOBALES =====
// ===================================================================

function cargarBandeja() {
    // ✅ OBTENER EL IDOPCION DINÁMICAMENTE
    const idOpcionActual = window.obtenerIdOpcionActual();

    if (!idOpcionActual) {
        console.error("No se pudo obtener el idOpcion para cargar la bandeja");
        return;
    }

    const usuario = obtenerUsuarioActual(); // ✅ USAR FUNCIÓN ROBUSTA
    const apiBaseUrl = window.apiBaseUrl;

    if (!usuario) {
        console.error('No hay usuario en sesión, no se puede cargar la bandeja.');
        return;
    }

    console.log('Cargando bandeja para usuario:', usuario, 'con idOpcion:', idOpcionActual);

    $.ajax({
        url: `${apiBaseUrl}/api/Fondo/bandeja-aprobacion/${usuario}`,
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
            console.log("Datos recibidos de bandeja-aprobacion:", data);
            crearListado(data);
        },
        error: function (xhr, status, error) {
            console.error("Error al obtener datos de fondos:", error);
            console.error("Detalles del error:", xhr.responseText);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'No se pudieron cargar los fondos para aprobación'
            });
        }
    });
}

function crearListado(data) {
    if (tabla) {
        tabla.destroy();
    }

    // Si no hay datos, mostramos mensaje y salimos
    if (!data || data.length === 0) {
        $('#tabla').html(
            "<div class='alert alert-info text-center'>No hay fondos para aprobar.</div>"
        );
        return;
    }

    var html = "";
    html += "<table id='tabla-principal' class='table table-bordered table-striped table-hover'>";
    html += "  <thead>";

    // Fila del Título ROJO
    html += "    <tr>";
    html += "      <th colspan='12' style='background-color: #CC0000 !important; color: white; text-align: center; font-weight: bold; padding: 8px; font-size: 1rem;'>";
    html += "          BANDEJA DE APROBACIÓN DE FONDOS";
    html += "      </th>";
    html += "    </tr>";
    // Fila de las Cabeceras - Agregada columna Solicitud
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

        // Botón de visualizar
        var viewButton = '<button type="button" class="btn-action view-btn" title="Visualizar/Aprobar" onclick="abrirModalEditar(' + fondo.idfondo + ', ' + fondo.idaprobacion + ')">' +
            '<i class="fa-regular fa-eye"></i>' +
            '</button>';

        html += "<tr>";
        html += "  <td class='text-center'>" + viewButton + "</td>";
        html += "  <td>" + (fondo.solicitud ?? "") + "</td>";
        html += "  <td>" + (fondo.idfondo ?? "") + "</td>";
        html += "  <td>" + (fondo.descripcion ?? "") + "</td>";
        html += "  <td>" + (fondo.proveedor ?? "") + "</td>";
        html += "  <td>" + (fondo.nombre ?? "") + "</td>";
        html += "  <td>" + (fondo.tipo_fondo ?? "") + "</td>";
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

    // Inicializa DataTable
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
                if (typeof marcarFilaPorId === 'function') {
                    marcarFilaPorId('#tabla-principal', ultimaFilaModificada);
                }
            }
        }
    });

    console.log('Llamando a inicializarMarcadoFilas para Fondos');
    if (typeof inicializarMarcadoFilas === 'function') {
        inicializarMarcadoFilas('#tabla-principal');
    }
}

// ===================================================================
// ===== FUNCIONES PARA EL MODAL PERSONALIZADO =====
// ===================================================================

/**
 * Abre el modal personalizado y carga los datos del fondo para aprobar.
 */
function abrirModalEditar(idFondo, idAprobacion) {
    // ✅ OBTENER EL IDOPCION DINÁMICAMENTE
    const idOpcionActual = window.obtenerIdOpcionActual();

    if (!idOpcionActual) {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo obtener el ID de la opción. Por favor, acceda nuevamente desde el menú.'
        });
        return;
    }

    const usuario = obtenerUsuarioActual(); // ✅ USAR FUNCIÓN ROBUSTA

    console.log('Abriendo modal para aprobar fondo ID:', idFondo, 'idAprobacion:', idAprobacion, 'con idOpcion:', idOpcionActual, 'y usuario:', usuario);

    // Limpiar datos previos
    datosAprobacionActual = null;

    // Llama a la API para obtener los datos del fondo por ID
    $.ajax({
        url: `${window.apiBaseUrl}/api/Fondo/bandeja-aprobacion-id/${idFondo}/${idAprobacion}`,
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
            console.log(`Datos del fondo (${idFondo}, ${idAprobacion}):`, data);

            // CONCATENACIÓN RUC/ID y NOMBRE
            const idProveedor = data.proveedor || '';
            const nombreProveedor = data.nombre || '';

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
                tipo_fondo: data.tipo_fondo,
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
        error: function (xhr, status, error) {
            console.error("Error al obtener datos del fondo:", error);
            console.error("Detalles del error:", xhr.responseText);
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

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

/**
 * Función para cerrar el modal personalizado
 */
function cerrarModalFondo() {
    const modal = document.getElementById('modalEditarFondo');
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';

    // Limpiar la tabla de aprobaciones
    if ($.fn.DataTable.isDataTable('#tabla-aprobaciones')) {
        $('#tabla-aprobaciones').DataTable().destroy();
    }
    $('#tabla-aprobaciones-fondo').html('');
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
// ===== FUNCIONES UTILITARIAS =====
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

/**
 * Llama a la API para obtener las aprobaciones y crea la tabla.
 */
/**
 * Llama a la API para obtener las aprobaciones y crea la tabla.
 * Se ha agregado un botón de popover al lado del estado para ver el comentario.
 */
function cargarAprobaciones(valorEntidad, valorIdentidad, valorIdTipoProceso) {
    // ✅ OBTENER EL IDOPCION DINÁMICAMENTE
    const idOpcionActual = window.obtenerIdOpcionActual();

    if (!idOpcionActual) {
        console.error("No se pudo obtener el idOpcion para cargar aprobaciones");
        return;
    }

    const usuario = obtenerUsuarioActual();

    console.log("=== CARGANDO APROBACIONES ===");

    console.log("valorEntidad: ", valorEntidad);
    console.log("valorIdentidad: ", valorIdentidad);
    console.log("valorIdTipoProceso: ", valorIdTipoProceso);

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

    const urlCompleta = `${window.apiBaseUrl}/api/Aprobacion/consultar-aprobaciones/${valorEntidad}/${valorIdentidad}/${valorIdTipoProceso}`;

    $.ajax({
        url: urlCompleta,
        method: "GET",
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
            console.log("Datos de aprobaciones recibidos:", data);

            let aprobaciones = Array.isArray(data) ? data : [data];

            if (aprobaciones.length === 0 || (aprobaciones.length === 1 && aprobaciones[0].idaprobacion === 0)) {
                $('#tabla-aprobaciones-fondo').html(
                    '<p class="alert alert-info">No se encontraron aprobaciones para este fondo.</p>'
                );
                return;
            }

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
                // Lógica para el comentario y Popover
                let comentarioLimpio = (aprobacion.comentario && aprobacion.comentario !== "string")
                    ? aprobacion.comentario
                    : "Sin comentarios.";

                // ✅ MOSTRAR POPOVER SOLO SI EL ESTADO ES "APROBADO" O "NEGADO"
                let estadoNombre = aprobacion.estado_nombre || "N/A";
                let estadoUpper = estadoNombre.toUpperCase();

                let iconoPopover = "";
                if (estadoUpper.includes("APROBADO") || estadoUpper.includes("NEGADO")) {
                    // ✅ USAR SOLO EL ICONO SIN BORDE DE BOTÓN
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

                // ✅ Celda de Estado + Icono Popover (solo si corresponde)
                html += "  <td class='text-nowrap'>" +
                    estadoNombre +
                    iconoPopover +
                    "</td>";

                html += "  <td class='text-center'>" + formatearFecha(aprobacion.fechasolicitud) + "</td>";
                html += "  <td class='text-center'>" + (aprobacion.nivelaprobacion ?? "") + "</td>";
                html += "  <td>" + (aprobacion.tipoproceso_nombre ?? "FONDO") + "</td>";
                html += "</tr>";
            });

            html += "  </tbody>";
            html += "</table>";

            $('#tabla-aprobaciones-fondo').html(html);

            // Inicializar DataTable
            $('#tabla-aprobaciones').DataTable({
                pageLength: 5,
                lengthMenu: [5, 10, 25],
                pagingType: 'simple_numbers',
                searching: false,
                columnDefs: [
                    { targets: [0, 4, 5], className: "dt-center" },
                    { targets: 3, className: "dt-nowrap" } // Para que el botón no se baje de línea
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
                },
                // RE-INICIALIZAR POPOVERS CADA VEZ QUE SE DIBUJA LA TABLA (Cambio de página, etc)
                drawCallback: function () {
                    const popoverTriggerList = document.querySelectorAll('[data-bs-toggle="popover"]');
                    [...popoverTriggerList].map(popoverTriggerEl => new bootstrap.Popover(popoverTriggerEl));
                }
            });
        },
        error: function (xhr, status, error) {
            console.error("Error al cargar aprobaciones:", error);
            $('#tabla-aprobaciones-fondo').html(
                '<p class="alert alert-danger">Error al cargar las aprobaciones: ' + error + '</p>'
            );
        }
    });
}

// ===================================================================
// ===== FUNCIONES PARA APROBAR/RECHAZAR FONDOS =====
// ===================================================================

/**
 * Procesa la aprobación o rechazo de un fondo
 */
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
        confirmButtonColor: accion == "APROBAR" ? '#28a745' : '#dc3545',
        cancelButtonColor: '#6c757d',
        confirmButtonText: accion == "APROBAR" ? 'Sí, aprobar' : 'Sí, rechazar',
        cancelButtonText: 'Cancelar'
    }).then((result) => {
        if (result.isConfirmed) {
            ejecutarAprobacionFondo(accion, nuevoEstado, comentario);
        }
    });
}

/**
 * Ejecuta el POST al API para aprobar o rechazar
 */
function ejecutarAprobacionFondo(accion, nuevoEstado, comentario) {
    // ✅ OBTENER EL IDOPCION DINÁMICAMENTE
    const idOpcionActual = window.obtenerIdOpcionActual();

    if (!idOpcionActual) {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo obtener el ID de la opción. Por favor, acceda nuevamente desde el menú.'
        });
        return;
    }

    // ✅ OBTENER EL USUARIO DINÁMICAMENTE
    const usuarioActual = obtenerUsuarioActual();

    console.log("accion: ", accion);
    console.log("datosAprobacionActual: ", datosAprobacionActual);
    console.log('Ejecutando aprobación/rechazo con idOpcion:', idOpcionActual, 'y usuario:', usuarioActual);

    const datosPost = {
        entidad: datosAprobacionActual.entidad,
        identidad: datosAprobacionActual.identidad,
        idtipoproceso: datosAprobacionActual.idtipoproceso,
        idetiquetatipoproceso: datosAprobacionActual.idetiquetatipoproceso,
        comentario: comentario,
        idetiquetaestado: nuevoEstado,
        idaprobacion: datosAprobacionActual.idaprobacion,
        usuarioaprobador: usuarioActual,       // ✅ DINÁMICO
        idopcion: idOpcionActual,              // ✅ DINÁMICO
        idcontrolinterfaz: accion == "APROBAR" ? "BTNAPROBAR" : "BTNNEGAR", 
        idevento: "EVCLICK",
        nombreusuario: usuarioActual
    };

    console.log("Enviando aprobación/rechazo:", datosPost);

    Swal.fire({
        title: 'Procesando...',
        text: 'Por favor espere',
        allowOutsideClick: false,
        didOpen: () => {
            Swal.showLoading();
        }
    });

    $.ajax({
        url: `${window.apiBaseUrl}/api/Fondo/aprobar-fondo`,
        method: "POST",
        contentType: "application/json",
        data: JSON.stringify(datosPost),
        headers: {
            "idopcion": String(idOpcionActual), // ✅ DINÁMICO en headers también
            "usuario": usuarioActual,            // ✅ DINÁMICO en headers también
            "idcontrolinterfaz": "0",
            "idevento": "0",
            "entidad": "0",
            "identidad": "0",
            "idtipoproceso": "0"
        },
        success: function (response) {
            cerrarModalFondo();

            Swal.fire({
                icon: 'success',
                title: '¡Éxito!',
                text: response.respuesta || `Fondo ${accion === "APROBAR" ? "aprobado" : "rechazado"} correctamente`,
                confirmButtonText: 'Aceptar',
                timer: 2000,
                timerProgressBar: true
            }).then(() => {
                // Limpiar datos de la aprobación actual
                datosAprobacionActual = null;
                ultimaFilaModificada = null;

                // Recargar la bandeja para reflejar los cambios
                cargarBandeja();
            });
        },
        error: function (xhr, status, error) {
            cerrarModalFondo();

            const mensajeError = xhr.responseJSON?.mensaje || error || 'Error desconocido';
            console.error("Error al procesar aprobación:", mensajeError);
            console.error("Detalles del error:", xhr.responseText);

            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'No se pudo procesar la aprobación/rechazo: ' + mensajeError
            });
        }
    });
}

// ===================================================================
// ===== EVENT LISTENERS PARA EL MODAL (Cerrar) =====
// ===================================================================

// Cerrar modal al hacer clic fuera
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