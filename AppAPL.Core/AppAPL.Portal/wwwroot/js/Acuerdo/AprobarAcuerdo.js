// ~/js/Acuerdo/AprobarAcuerdo.js

// ===============================================================
// Variables globales
// ===============================================================
let tabla; // GLOBAL
let ultimaFilaModificada = null; // Para recordar la última fila editada/eliminada
let datosAprobacionActual = null; // Para almacenar los datos de la aprobación actual
let tablaHistorial; // Para la tabla de historial de aprobaciones

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

    console.log("=== INICIO DE CARGA DE PÁGINA - AprobarAcuerdo ===");
    console.log("");

    // 🔍 ===== DIAGNÓSTICO COMPLETO DEL USUARIO ===== 🔍
    const usuarioFinal = obtenerUsuarioActual();
    console.log("  ✅ Usuario final obtenido:", usuarioFinal);

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
                limpiarSeleccion('#tabla-acuerdos');
            }
        }
    });

    // ===============================================================
    // ✅ EVENTOS PARA VOLVER A LA TABLA (CERRAR DETALLE)
    // ===============================================================
    $('#btnVolverTabla, #btnVolverAbajo').on('click', function () {
        cerrarDetalle();
    });

    // ===============================================================
    // ✅ EVENTOS PARA APROBAR Y RECHAZAR ACUERDO
    // ===============================================================
    $('#btnAprobarFondo').on('click', function () {
        let comentario = $("#modal-acuerdo-comentario").val();
        console.log('comentario: ', comentario);
        console.log('boton de aprobar acuerdo');
        procesarAprobacionAcuerdo("APROBAR", comentario);
    });

    $('#btnRechazarFondo').on('click', function () {
        let comentario = $("#modal-acuerdo-comentario").val();
        console.log('comentario: ', comentario);
        console.log('boton de rechazar acuerdo');
        procesarAprobacionAcuerdo("RECHAZAR", comentario);
    });

}); // FIN document.ready


// ===================================================================
// ===== FUNCIONES GLOBALES =====
// ===================================================================

function cargarBandeja() {
    // ✅ OBTENER EL IDOPCION DINÁMICAMENTE
    // Nota: Asegúrate de que esta función exista en tu layout o script global, 
    // si no, usa un valor fijo o "0" como fallback.
    const idOpcionActual = (window.obtenerIdOpcionActual && window.obtenerIdOpcionActual()) || "0";

    const usuario = obtenerUsuarioActual();
    const apiBaseUrl = window.apiBaseUrl;

    if (!usuario) {
        console.error('No hay usuario en sesión, no se puede cargar la bandeja.');
        return;
    }

    console.log('Cargando bandeja de acuerdos para usuario:', usuario, 'con idOpcion:', idOpcionActual);

    $.ajax({
        url: `${apiBaseUrl}/api/Acuerdo/consultar-bandeja-aprobacion/${usuario}`,
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
            console.log("Datos recibidos de bandeja-aprobacion acuerdos:", data);
            crearListado(data);
        },
        error: function (xhr, status, error) {
            console.error("Error al obtener datos de acuerdos:", error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'No se pudieron cargar los acuerdos para aprobación'
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
            "<div class='alert alert-info text-center'>No hay acuerdos para aprobar.</div>"
        );
        return;
    }

    var html = "";
    html += "<table id='tabla-acuerdos' class='table table-bordered table-striped table-hover'>";

    html += "  <thead>";
    // Fila del Título ROJO
    html += "    <tr>";
    html += "      <th colspan='13' style='background-color: #CC0000 !important; color: white; text-align: center; font-weight: bold; padding: 8px; font-size: 1rem;'>";
    html += "          BANDEJA DE APROBACIÓN - ACUERDOS";
    html += "      </th>";
    html += "    </tr>";

    // Fila de las Cabeceras
    html += "    <tr>";
    html += "      <th>Acción</th>";
    html += "      <th>Solicitud</th>";
    html += "      <th>IdAcuerdo</th>";
    html += "      <th>Descripción</th>";
    html += "      <th>Fondo</th>";
    html += "      <th>Clase de Acuerdo</th>";
    html += "      <th>Valor Fondo</th>";
    html += "      <th>Fecha Inicio</th>";
    html += "      <th>Fecha Fin</th>";
    html += "      <th>Valor Disponi</th>";
    html += "      <th>Valor Comprometido</th>";
    html += "      <th>Valor Liquidado</th>";
    html += "      <th>Estado</th>";
    html += "    </tr>";
    html += "  </thead>";
    html += "  <tbody>";

    for (var i = 0; i < data.length; i++) {
        var acuerdo = data[i];

        // Botón de visualizar (Llama a abrirModalEditar)
        var viewButton = '<button type="button" class="btn-action view-btn" title="Visualizar/Aprobar" onclick="abrirModalEditar(' + acuerdo.idacuerdo + ', ' + acuerdo.idaprobacion + ')">' +
            '<i class="fa-regular fa-eye"></i>' +
            '</button>';
        var claseAcuerdoHTML = (acuerdo.nombre_clase_acuerdo ?? "");
        if (acuerdo.cantidad_articulos > 0) {
            claseAcuerdoHTML += '<sup style="font-size: 0.8em; margin-left: 2px; font-weight: bold;">' + acuerdo.cantidad_articulos + '</sup>';
        }
        html += "<tr>";
        html += "  <td class='text-center'>" + viewButton + "</td>";
        html += "  <td>" + (acuerdo.solicitud ?? "") + "</td>";
        html += "  <td>" + (acuerdo.idacuerdo ?? "") + "</td>";
        html += "  <td>" + (acuerdo.descripcion ?? "") + "</td>";
        html += "  <td>" + (acuerdo.nombre_tipo_fondo ?? "") + "</td>";
        html += "  <td>" + claseAcuerdoHTML + "</td>";
        html += "  <td class='text-end'>" + formatearMoneda(acuerdo.valor_acuerdo) + "</td>";
        html += "  <td class='text-center'>" + formatearFecha(acuerdo.fecha_inicio) + "</td>";
        html += "  <td class='text-center'>" + formatearFecha(acuerdo.fecha_fin) + "</td>";
        html += "  <td class='text-end'>" + formatearMoneda(acuerdo.valor_disponible) + "</td>";
        html += "  <td class='text-end'>" + formatearMoneda(acuerdo.valor_comprometido) + "</td>";
        html += "  <td class='text-end'>" + formatearMoneda(acuerdo.valor_liquidado) + "</td>";
        html += "  <td>" + (acuerdo.nombre_estado_fondo ?? "") + "</td>";
        html += "</tr>";
    }

    html += "  </tbody>";
    html += "</table>";

    $('#tabla').html(html);

    // Inicializa DataTable
    tabla = $('#tabla-acuerdos').DataTable({
        pageLength: 10,
        lengthMenu: [5, 10, 25, 50],
        pagingType: 'full_numbers',
        columnDefs: [
            { targets: 0, width: "6%", className: "dt-center", orderable: false },
            { targets: 1, width: "8%", className: "dt-center" },
            { targets: 2, width: "8%", className: "dt-center" },
            { targets: [7, 8], className: "dt-center" },
            { targets: [6, 9, 10, 11], className: "dt-right" },
        ],
        order: [[2, 'desc']],
        language: {
            decimal: "",
            emptyTable: "No hay datos disponibles en la tabla",
            info: "Mostrando _START_ a _END_ de _TOTAL_ registros",
            infoEmpty: "Mostrando 0 a 0 de 0 registros",
            infoFiltered: "(filtrado de _MAX_ registros totales)",
            lengthMenu: "Mostrar _MENU_ registros",
            loadingRecords: "Cargando...",
            processing: "Procesando...",
            search: "Buscar:",
            zeroRecords: "No se encontraron registros coincidentes",
            paginate: { first: "Primero", last: "Último", next: "Siguiente", previous: "Anterior" }
        }
    });
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

// ===================================================================
// ✅ FUNCIONES: LOGICA DE DETALLE (VISUALIZAR)
// ===================================================================

/**
 * Consulta el detalle por ID y muestra el DIV de detalle (Ocultando la tabla)
 */
function abrirModalEditar(idAcuerdo, idAprobacion) {
    console.log("Consultando detalle idAcuerdo:", idAcuerdo, "idAprobacion:", idAprobacion);
    $('body').css('cursor', 'wait');

    const idOpcionActual = (window.obtenerIdOpcionActual && window.obtenerIdOpcionActual()) || "0";
    const usuario = obtenerUsuarioActual();

    // Limpiar datos previos
    datosAprobacionActual = null;

    $("#formVisualizar")[0].reset();
    $("#lblIdAcuerdo").text(idAcuerdo);

    // Limpiar tabla historial previa
    $('#tabla-aprobaciones-fondo').html('');

    $.ajax({
        url: `${window.apiBaseUrl}/api/Acuerdo/bandeja-aprobacion-id/${idAcuerdo}`,
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
            console.log(`Datos del acuerdo (${idAcuerdo}):`, data);

            // ✅ Guardar datos para los botones de aprobación/rechazo
            datosAprobacionActual = {
                entidad: data.id_entidad || 0,
                identidad: data.idacuerdo || 0,
                idtipoproceso: data.idtipoproceso || 43, // temporal hasta q este el sp de la base
                idetiquetatipoproceso: data.tipo_proceso_etiqueta || "",
                idaprobacion: idAprobacion,
                entidad_etiqueta: data.entidad_etiqueta,
                idetiquetatestado: data.estado_etiqueta || "",
                comentario: ""
            };

            console.log("Datos de aprobación guardados:", datosAprobacionActual);

            // 1. Llenar Formulario
            $("#verNombreProveedor").val(data.nombre_proveedor);
            $("#verNombreTipoFondo").val(data.nombre_tipo_fondo);
            $("#verDescripcion").val(data.descripcion);
            $("#verClaseAcuerdo").val(data.nombre_clase_acuerdo);
            $("#verEstado").val(data.nombre_estado_fondo);
            $("#verFechaInicio").val(formatearFecha(data.fecha_inicio));
            $("#verFechaFin").val(formatearFecha(data.fecha_fin));
            $("#verValorAcuerdo").val(formatearMoneda(data.valor_acuerdo));
            $("#verValorDisponible").val(formatearMoneda(data.valor_disponible));
            $("#verValorComprometido").val(formatearMoneda(data.valor_comprometido));
            $("#verValorLiquidado").val(formatearMoneda(data.valor_liquidado));

            // 2. LOGICA VISUAL
            $("#vistaTabla").fadeOut(200, function () {
                $("#vistaDetalle").fadeIn(200);
            });
            $('body').css('cursor', 'default');

            // 3. CARGAR TABLA DE HISTORIAL DE APROBACIONES
            if (data.entidad_etiqueta && data.tipo_proceso_etiqueta) {
                console.log("Cargando historial de aprobaciones...");
                cargarAprobaciones(
                    data.entidad_etiqueta,       // Ej: "ENTACUERDO"
                    idAcuerdo,                   // El ID del acuerdo
                    data.tipo_proceso_etiqueta   // Ej: "TPCREACION"
                );
            } else {
                console.warn("Faltan etiquetas para cargar el historial");
                $('#tabla-aprobaciones-fondo').html(
                    '<p class="alert alert-warning">No se encontraron los parámetros necesarios para cargar aprobaciones.</p>'
                );
            }
        },
        error: function (xhr) {
            $('body').css('cursor', 'default');
            console.error("Error detalle:", xhr);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'No se pudieron cargar los datos del acuerdo.'
            });
        }
    });
}

/**
 * Cierra el div de detalle y vuelve a mostrar la tabla
 */
function cerrarDetalle() {
    $("#vistaDetalle").fadeOut(200, function () {
        $("#vistaTabla").fadeIn(200);
        // Si necesitas ajustar columnas de DataTables al volver a mostrar:
        if (tabla) {
            tabla.columns.adjust();
        }
    });

    // Limpiar datos de aprobación
    datosAprobacionActual = null;
}

/**
 * Consume el servicio de Aprobaciones y dibuja la tabla en el detalle
 * Reutiliza el ID '#tabla-aprobaciones-fondo' que pusiste en el HTML
 */
function cargarAprobaciones(entidad, idEntidad, tipoProceso) {
    const idOpcionActual = (window.obtenerIdOpcionActual && window.obtenerIdOpcionActual()) || "0";
    const usuario = obtenerUsuarioActual();

    console.log("=== CARGANDO APROBACIONES DE ACUERDO ===");
    console.log('Con idOpcion:', idOpcionActual, 'y usuario:', usuario);

    // Destruir tabla anterior si existe
    if ($.fn.DataTable.isDataTable('#dt-historial')) {
        $('#dt-historial').DataTable().destroy();
    }

    // Spinner de carga
    $('#tabla-aprobaciones-fondo').html(`
        <div class="text-center p-3">
            <div class="spinner-border text-primary" role="status"><span class="visually-hidden">Cargando...</span></div>
            <p class="mt-2 small text-muted">Cargando historial...</p>
        </div>
    `);

    const urlCompleta = `${window.apiBaseUrl}/api/Aprobacion/consultar-aprobaciones/${entidad}/${idEntidad}/${tipoProceso}`;

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
            console.log("Datos de aprobaciones del acuerdo:", data);

            let lista = Array.isArray(data) ? data : [data];

            if (!lista || lista.length === 0) {
                $('#tabla-aprobaciones-fondo').html('<div class="alert alert-light text-center border">No hay historial de aprobaciones.</div>');
                return;
            }

            let html = `
            <table id='dt-historial' class='table table-sm table-bordered table-hover w-100'>
                <thead class="table-light">
                    <tr>
                        <th>ID Aprobación</th>
                        <th>Usuario Solicitante</th>
                        <th>Usuario Aprobador</th>
                        <th>Estado</th>
                        <th>Fecha Solicitud</th>
                        <th>Nivel Aprobación</th>
                        <th>Tipo Proceso</th>
                    </tr>
                </thead>
                <tbody>`;

            lista.forEach(item => {
                // Badges para el estado
                let badgeClass = 'bg-secondary';
                if (item.estado_etiqueta === 'ESTADONUEVO') badgeClass = 'bg-primary';
                if (item.estado_etiqueta === 'ESTADOAPROBADO') badgeClass = 'bg-success';
                if (item.estado_etiqueta === 'ESTADOINACTIVO' || item.estado_etiqueta === 'ESTADONEGADO') badgeClass = 'bg-danger';

                html += `<tr>
                    <td class="text-center">${item.idaprobacion || ""}</td>
                    <td>${item.idusersolicitud || ""}</td>
                    <td>${item.iduseraprobador || ""}</td>
                    <td class="text-center"><span class="badge ${badgeClass}">${item.estado_nombre || item.estado_etiqueta}</span></td>
                    <td class="text-center">${formatearFecha(item.fechasolicitud)}</td>
                    <td class="text-center">${item.nivelaprobacion || 0}</td>
                    <td>${item.tipoproceso_nombre || ""}</td>
                </tr>`;
            });

            html += `</tbody></table>`;
            $('#tabla-aprobaciones-fondo').html(html);

            // Convertir a DataTable
            tablaHistorial = $('#dt-historial').DataTable({
                pageLength: 5,
                lengthMenu: [5, 10, 25],
                pagingType: 'simple_numbers',
                searching: false,
                columnDefs: [
                    { targets: [0, 4, 5], className: "dt-center" }
                ],
                order: [[0, 'desc']],
                language: {
                    decimal: "",
                    emptyTable: "No hay aprobaciones disponibles",
                    info: "Mostrando _START_ a _END_ de _TOTAL_ aprobaciones",
                    infoEmpty: "Mostrando 0 a 0 de 0 aprobaciones",
                    infoFiltered: "(filtrado de _MAX_ aprobaciones totales)",
                    lengthMenu: "Mostrar _MENU_ aprobaciones",
                    loadingRecords: "Cargando...",
                    processing: "Procesando...",
                    search: "Buscar:",
                    zeroRecords: "No se encontraron aprobaciones coincidentes",
                    paginate: { first: "Primero", last: "Último", next: "Siguiente", previous: "Anterior" }
                }
            });
        },
        error: function (xhr) {
            console.error("Error historial:", xhr);
            console.error("Detalles del error:", xhr.responseText);
            $('#tabla-aprobaciones-fondo').html('<div class="text-danger small">Error al cargar historial.</div>');
        }
    });
}

// ===================================================================
// ✅ FUNCIONES PARA APROBAR/RECHAZAR ACUERDOS
// ===================================================================

/**
 * Procesa la aprobación o rechazo de un acuerdo
 */
function procesarAprobacionAcuerdo(accion, comentario) {
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
        tituloAccion = "Aprobar Acuerdo";
        mensajeAccion = "¿Está seguro que desea aprobar este acuerdo?";
    } else if (accion === "RECHAZAR") {
        nuevoEstado = "ESTADONEGADO";
        tituloAccion = "Rechazar Acuerdo";
        mensajeAccion = "¿Está seguro que desea rechazar este acuerdo?";
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
            ejecutarAprobacionAcuerdo(accion, nuevoEstado, comentario);
        }
    });
}

/**
 * Ejecuta el POST al API para aprobar o rechazar
 */
function ejecutarAprobacionAcuerdo(accion, nuevoEstado, comentario) {
    const idOpcionActual = (window.obtenerIdOpcionActual && window.obtenerIdOpcionActual()) || "0";
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
        usuarioaprobador: usuarioActual,
        idopcion: idOpcionActual,
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
        url: `${window.apiBaseUrl}/api/Acuerdo/aprobar-acuerdo`,
        method: "POST",
        contentType: "application/json",
        data: JSON.stringify(datosPost),
        headers: {
            "idopcion": String(idOpcionActual),
            "usuario": usuarioActual,
            "idcontrolinterfaz": "0",
            "idevento": "0",
            "entidad": "0",
            "identidad": "0",
            "idtipoproceso": "0"
        },
        success: function (response) {
            cerrarDetalle();

            Swal.fire({
                icon: 'success',
                title: '¡Éxito!',
                text: response.respuesta || `Acuerdo ${accion === "APROBAR" ? "aprobado" : "rechazado"} correctamente`,
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