// ~/js/Fondo/AprobarFondo.js

// ===============================================================
// Variables globales y Helpers
// ===============================================================
let tabla;
let ultimaFilaModificada = null;
let datosAprobacionActual = null;

function obtenerUsuarioActual() {
    return window.usuarioActual || sessionStorage.getItem('usuarioActual') || "admin";
}

// ===============================================================
// DOCUMENT READY
// ===============================================================
$(document).ready(function () {
    console.log("=== INICIO DE CARGA - AprobarFondo (Workflow Schema) ===");

    $.get("/config", function (config) {
        window.apiBaseUrl = config.apiBaseUrl;
        cargarBandeja();
    });

    $('body').on('click', '#btnLimpiar', function () {
        if (tabla) {
            tabla.search('').draw();
            limpiarSeleccion('#tabla-principal');
        }
    });

    $('body').on('click', '#btnAprobarFondo', function () {
        const comentario = $("#modal-fondo-comentario").val();
        procesarAprobacionFondo("APROBAR", comentario);
    });

    $('body').on('click', '#btnRechazarFondo', function () {
        const comentario = $("#modal-fondo-comentario").val();
        procesarAprobacionFondo("RECHAZAR", comentario);
    });
});

// ===================================================================
// LÓGICA DE DATOS (API)
// ===================================================================

function cargarBandeja() {
    const idOpcionActual = window.obtenerIdOpcionActual();
    const usuario = obtenerUsuarioActual();

    if (!idOpcionActual) return console.error("ID Opción no detectado");

    $.ajax({
        url: `${window.apiBaseUrl}/api/Fondo/bandeja-aprobacion/${usuario}`,
        method: "GET",
        headers: { "idopcion": String(idOpcionActual), "usuario": usuario },
        success: function (response) {
            // ✅ Unwrapping: Acceso a json_response.data
            if (response && response.code_status === 200) {
                const lista = response.json_response.data || [];
                crearListado(lista);
            }
        },
        error: (xhr) => manejarErrorGlobal(xhr, "cargar la bandeja")
    });
}

function abrirModalEditar(idFondo, idAprobacion) {
    const idOpcionActual = window.obtenerIdOpcionActual();
    const usuario = obtenerUsuarioActual();

    datosAprobacionActual = null; // Reset

    $.ajax({
        url: `${window.apiBaseUrl}/api/Fondo/bandeja-aprobacion-id/${idFondo}/${idAprobacion}`,
        method: "GET",
        headers: { "idopcion": String(idOpcionActual), "usuario": usuario },
        success: function (response) {
            if (response && response.code_status === 200) {
                const data = response.json_response.data; // Unwrapping

                // Mapeo de datos para el modal
                const proveedorDesc = (data.proveedor && data.nombre_proveedor)
                    ? `${data.proveedor} - ${data.nombre_proveedor}`
                    : (data.proveedor || data.nombre_proveedor || '');

                datosAprobacionActual = {
                    entidad: data.entidad || 0,
                    identidad: data.idfondo || 0,
                    idtipoproceso: data.idtipoproceso || "",
                    idetiquetatipoproceso: data.idetiquetatipoproceso || "",
                    idaprobacion: idAprobacion,
                    entidad_etiqueta: data.entidad_etiqueta,
                    idetiquetatestado: data.estado_etiqueta || ""
                };

                const vistaModal = {
                    idfondo: data.idfondo,
                    descripcion: data.descripcion,
                    proveedor: proveedorDesc,
                    tipo_fondo: data.nombre_tipo_fondo,
                    fecha_inicio: formatDateForInput(data.fecha_inicio),
                    fecha_fin: formatDateForInput(data.fecha_fin),
                    valor_fondo: formatearMoneda(data.valor_fondo),
                    estado: data.nombre_estado_fondo,
                    valor_disponible: formatearMoneda(data.valor_disponible),
                    valor_comprometido: formatearMoneda(data.valor_comprometido),
                    valor_liquidado: formatearMoneda(data.valor_liquidado)
                };

                renderizarModal(vistaModal);

                // Cargar histórico de aprobaciones
                if (data.entidad_etiqueta && data.idfondo) {
                    cargarAprobaciones(data.entidad_etiqueta, data.idfondo, data.idetiquetatipoproceso);
                }
            }
        },
        error: (xhr) => manejarErrorGlobal(xhr, "obtener detalle del fondo")
    });
}

function ejecutarAprobacionFondo(accion, nuevoEstado, comentario) {
    const idOpcionActual = window.obtenerIdOpcionActual();
    const usuarioActual = obtenerUsuarioActual();

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
        idcontrolinterfaz: accion === "APROBAR" ? "BTNAPROBAR" : "BTNNEGAR",
        idevento: "EVCLICK"
    };

    Swal.fire({ title: 'Procesando...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

    $.ajax({
        url: `${window.apiBaseUrl}/api/Fondo/aprobar-fondo`,
        method: "POST", // ✅ Todos los cambios son POST
        contentType: "application/json",
        data: JSON.stringify(datosPost),
        headers: { "idopcion": String(idOpcionActual), "usuario": usuarioActual },
        success: function (response) {
            cerrarModalFondo();
            if (response && response.code_status === 200) {
                Swal.fire({
                    icon: 'success',
                    title: '¡Éxito!',
                    text: response.json_response.data.mensaje || `Acción ${accion} completada`,
                    timer: 2000
                }).then(() => {
                    cargarBandeja();
                });
            }
        },
        error: (xhr) => manejarErrorGlobal(xhr, "procesar la aprobación")
    });
}

// ===================================================================
// UI Y RENDERIZADO
// ===================================================================

/**
 * Crea el listado de la bandeja de aprobación con el diseño de cabecera original.
 */
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
    html += "<table id='tabla-principal' class='table table-bordered table-striped table-hover w-100'>";
    html += "  <thead>";

    // ✅ RESTAURADO: Fila del Título ROJO (Diseño original solicitado)
    html += "    <tr>";
    html += "      <th colspan='12' style='background-color: #CC0000 !important; color: white; text-align: center; font-weight: bold; padding: 12px; font-size: 1.1rem;'>";
    html += "          BANDEJA DE APROBACIÓN DE FONDOS";
    html += "      </th>";
    html += "    </tr>";

    // Fila de las Cabeceras
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
        html += "  <td class='text-center'>" + (fondo.solicitud ?? "") + "</td>";
        html += "  <td class='text-center'>" + (fondo.idfondo ?? "") + "</td>";
        html += "  <td>" + (fondo.descripcion ?? "") + "</td>";
        html += "  <td>" + (fondo.proveedor ?? "") + "</td>";
        html += "  <td>" + (fondo.nombre_proveedor ?? "") + "</td>";
        html += "  <td>" + (fondo.nombre_tipo_fondo ?? "") + "</td>";
        html += "  <td class='text-center'>" + formatearFecha(fondo.fecha_inicio) + "</td>";
        html += "  <td class='text-center'>" + formatearFecha(fondo.fecha_fin) + "</td>";
        html += "  <td class='text-end'>" + formatearMoneda(fondo.valor_disponible) + "</td>";
        html += "  <td class='text-end'>" + formatearMoneda(fondo.valor_comprometido) + "</td>";
        // ✅ CORREGIDO: Estado como texto simple para mantener la estructura de los otros módulos
        html += "  <td>" + (fondo.nombre_estado_fondo ?? "") + "</td>";
        html += "</tr>";
    }

    html += "  </tbody>";
    html += "</table>";

    $('#tabla').html(html);

    // Inicializa DataTable con la configuración de columnas adecuada
    tabla = $('#tabla-principal').DataTable({
        pageLength: 10,
        lengthMenu: [5, 10, 25, 50],
        order: [[2, 'desc']], // Ordenar por IDFondo descendente por defecto
        language: {
            url: "https://cdn.datatables.net/plug-ins/1.10.25/i18n/Spanish.json"
        },
        drawCallback: function () {
            if (ultimaFilaModificada !== null) {
                if (typeof marcarFilaPorId === 'function') {
                    marcarFilaPorId('#tabla-principal', ultimaFilaModificada);
                }
            }
        }
    });

    if (typeof inicializarMarcadoFilas === 'function') {
        inicializarMarcadoFilas('#tabla-principal');
    }
}

function cargarAprobaciones(entidad, identidad, proceso) {
    const idOpcion = window.obtenerIdOpcionActual();
    const usuario = obtenerUsuarioActual();

    $('#tabla-aprobaciones-fondo').html('<div class="spinner-border text-primary"></div>');

    $.ajax({
        url: `${window.apiBaseUrl}/api/Aprobacion/consultar-aprobaciones/${entidad}/${identidad}/${proceso}`,
        method: "GET",
        headers: { "idopcion": String(idOpcion), "usuario": usuario },
        success: function (response) {
            console.log("data ", response.json_response.data);
            if (response && response.code_status === 200) {
                const lista = response.json_response.data || [];
                renderizarTablaAprobaciones(lista);
            }
        },
        error: (xhr) => $('#tabla-aprobaciones-fondo').html('<p class="text-danger">Error al cargar historial.</p>')
    });
}

function renderizarTablaAprobaciones(data) {
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
        // Lógica para el comentario y Popover
        let comentarioLimpio = (item.comentario && item.comentario !== "string")
            ? item.comentario
            : "Sin comentarios.";

        // ✅ MOSTRAR POPOVER SOLO SI EL ESTADO ES "APROBADO" O "NEGADO"
        let estadoNombre = item.estado_nombre || item.estado_etiqueta || "N/A";
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

        html += `<tr>
                    <td class="text-center">${item.idaprobacion || ""}</td>
                    <td>${item.idusersolicitud || ""}</td>
                    <td>${item.iduseraprobador || ""}</td>
                    <td class="text-nowrap">${estadoNombre}${iconoPopover}</td>
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
            { targets: [0, 4, 5], className: "dt-center" },
            { targets: 3, className: "dt-nowrap" } // Para que el icono no se baje de línea
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
        },
        // RE-INICIALIZAR POPOVERS CADA VEZ QUE SE DIBUJA LA TABLA (Cambio de página, etc)
        drawCallback: function () {
            const popoverTriggerList = document.querySelectorAll('[data-bs-toggle="popover"]');
            [...popoverTriggerList].map(popoverTriggerEl => new bootstrap.Popover(popoverTriggerEl));
        }
    });
}

// ===================================================================
// HELPERS UI
// ===================================================================

/**
 * Renderiza los datos en el modal asegurando que ID, Tipo y Valor se muestren.
 */
function renderizarModal(datos) {
    console.log("DEBUG - Datos recibidos para renderizar:", datos);

    // Mapeo exacto: ID del elemento HTML vs Propiedad del objeto 'datos'
    const campos = {
        'modal-fondo-id': datos.idfondo,           // ID Fondo
        'modal-fondo-descripcion': datos.descripcion,
        'modal-fondo-proveedor': datos.proveedor,
        'modal-fondo-tipofondo': datos.tipo_fondo, // Tipo de Fondo
        'modal-fondo-fechainicio': datos.fecha_inicio,
        'modal-fondo-fechafin': datos.fecha_fin,
        'modal-fondo-valor': datos.valor_fondo,     // Valor Fondo
        'modal-fondo-estado': datos.estado,
        'modal-fondo-disponible': datos.valor_disponible,
        'modal-fondo-comprometido': datos.valor_comprometido,
        'modal-fondo-liquidado': datos.valor_liquidado
    };

    // Iteramos y asignamos valores
    Object.keys(campos).forEach(idElemento => {
        const elemento = document.getElementById(idElemento);
        if (elemento) {
            elemento.value = campos[idElemento] || '';
            console.log(`✅ Seteado ${idElemento} = ${campos[idElemento]}`);
        } else {
            console.warn(`⚠️ No se encontró el elemento HTML con ID: ${idElemento}`);
        }
    });

    // Activar modal
    const modal = document.getElementById('modalEditarFondo');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function cerrarModalFondo() {
    document.getElementById('modalEditarFondo').classList.remove('active');
    document.body.style.overflow = 'auto';
    $("#modal-fondo-comentario").val("");
}

function manejarErrorGlobal(xhr, accion) {
    const msg = xhr.responseJSON?.json_response?.result?.message || xhr.statusText;
    Swal.fire('Error', `No se pudo ${accion}: ${msg}`, 'error');
}

function formatearMoneda(v) {
    return new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD' }).format(v || 0);
}

function formatearFecha(s) {
    if (!s) return '';
    const d = new Date(s);
    return isNaN(d) ? s : d.toLocaleDateString('es-EC');
}

function formatDateForInput(s) {
    return s ? s.split('T')[0] : "";
}

// Autor: JEAN FRANCOIS CALDERON VEAS | Empresa: BMTECSA | Proyecto: SOFTWARE APL