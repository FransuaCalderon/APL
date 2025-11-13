// ~/js/Fondo/AprobarFondo.js

// Variables globales
let tabla; // GLOBAL
let ultimaFilaModificada = null; // Para recordar la última fila editada/eliminada
let datosAprobacionActual = null; // Para almacenar los datos de la aprobación actual

// Se ejecuta cuando el DOM está listo
$(document).ready(function () {

    // Configuración inicial y carga de datos
    $.get("/config", function (config) {
        const apiBaseUrl = config.apiBaseUrl;
        window.apiBaseUrl = apiBaseUrl;

        $.ajax({
            // ===== ENDPOINT PARA APROBACIÓN =====
            url: `${apiBaseUrl}/api/Fondo/bandeja-aprobacion/JGONZALEZ`,
            // ====================================
            method: "GET",
            // Parámetro obligatorio usuarioAprobador
            data: {
                //usuarioAprobador: "JGONZALEZ"
            },

            /** data: {
                usuarioAprobador: obtenerUsuarioActual() // función que obtiene el usuario logueado
            }*/

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
                console.log("Datos recibidos de bandeja-aprobacion:", data);
                crearListado(data);
            },
            error: function (xhr, status, error) {
                console.error("Error al obtener datos de fondos:", error);
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'No se pudieron cargar los fondos para aprobación'
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

    // ===== BOTÓN APROBAR =====
    $('body').on('click', '#btnAprobarFondo', function () {
        procesarAprobacionFondo("APROBAR");
    });

    // ===== BOTÓN RECHAZAR =====
    $('body').on('click', '#btnRechazarFondo', function () {
        procesarAprobacionFondo("RECHAZAR");
    });

    // ===== MANEJADOR DEL BOTÓN GUARDAR DEL MODAL DE EDICIÓN (MANTENIDO PARA EL CONTEXTO) =====
    $("#btnGuardarCambiosFondo").on("click", function (e) {
        e.preventDefault();

        // 1. Obtener datos del formulario
        const id = $("#modal-fondo-id").val();
        const dataParaGuardar = {
            idfondo: id,
            descripcion: $("#modal-fondo-descripcion").val(),
            proveedor: $("#modal-fondo-proveedor").val(),
            tipo_fondo: $("#modal-fondo-tipofondo").val(),
            valor_fondo: parseFloat($("#modal-fondo-valor").val()),
            fecha_inicio: $("#modal-fondo-fechainicio").val(),
            fecha_fin: $("#modal-fondo-fechafin").val()
            //... y cualquier otro campo que tu API de "Actualizar" necesite
        };

        console.log("Datos a guardar:", dataParaGuardar);

        // 2. Aquí harías tu $.ajax({ type: "PUT", url: `.../api/Fondo/actualizar/${id}` ... })

        // 3. Por ahora, solo simulamos éxito
        Swal.fire({
            icon: 'info',
            title: 'En desarrollo',
            text: 'La lógica para guardar aún no está implementada.'
        });

        // 4. Cierra el modal
        var modal = bootstrap.Modal.getInstance(document.getElementById('modalEditarFondo'));
        modal.hide();

        // 5. Opcional: Recargar la tabla (descomentar cuando el guardado funcione)
        // $.get(`${window.apiBaseUrl}/api/Fondo/bandeja-aprobacion`, function (data) {
        //      crearListado(data);
        // });
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
    // 1. Añadimos el id="tabla-fondos" para que tu CSS funcione
    html += "<table id='tabla-fondos' class='table table-bordered table-striped table-hover'>";

    html += "  <thead>";

    // 1. Fila del Título ROJO (con estilo en línea para máxima prioridad)
    html += "    <tr>";
    html += "      <th colspan='12' style='background-color: #CC0000 !important; color: white; text-align: center; font-weight: bold; padding: 8px; font-size: 1rem;'>";
    html += "           BANDEJA DE APROBACIÓN - FONDOS";
    html += "      </th>";
    html += "    </tr>";

    // Fila de las Cabeceras (esto tomará tu CSS)
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
            var idFondo = fondo.idfondo;
            // 📌 CAMBIO CLAVE: Asumo que la respuesta de la bandeja incluye idaprobacion
            var idAprobacion = fondo.idaprobacion || 0;

            // 3. Tu botón de editar (CAMBIO: Se pasan idFondo e idAprobacion)
            // IMPORTANTE: idAprobacion debe ser un campo válido en tu objeto 'fondo'
            var editButton = '<button type="button" class="btn-action edit-btn" title="Editar" onclick="abrirModalEditar(' + idFondo + ', ' + idAprobacion + ')">' +
                '<i class="fa-regular fa-pen-to-square"></i>' +
                '</button>';

            html += "<tr>";
            // 4. Tu celda con el botón de visualizar
            html += "  <td class='text-center'>" + editButton + "</td>";
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
    // Asumiendo que esta función existe en otro script
    // inicializarMarcadoFilas('#tabla-fondos'); 
}

// ===================================================================
// ===== FUNCIONES PARA EL MODAL DE VISUALIZACIÓN/APROBACIÓN =====
// ===================================================================

/**
 * Abre el modal de visualización, carga los datos del fondo y su acuerdo asociado.
 * @param {number} idFondo - El ID del Fondo
 * @param {number} idAprobacion - El ID de la Aprobación
 */
function abrirModalEditar(idFondo, idAprobacion) {
    // 1. Reinicia el formulario y datos
    $('#formEditarFondo')[0].reset();
    datosAprobacionActual = null; // Limpiar datos previos

    // 2. Configura el título del modal
    $('#modalEditarFondoLabel').text('Visualizar Datos de Fondo (Aprobación)');

    // 4. Llama a la API para obtener los datos detallados del fondo
    $.ajax({
        url: `${window.apiBaseUrl}/api/Fondo/bandeja-aprobacion-id/${idFondo}/${idAprobacion}`,
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
            console.log(`Datos del fondo (${idFondo}, ${idAprobacion}) para visualización:`, data);

            // 📌 GUARDAR DATOS PARA LOS BOTONES DE APROBACIÓN/RECHAZO
            datosAprobacionActual = {
                entidad: data.entidad_id || 0,
                identidad: data.idfondo || 0,
                idtipoproceso: data.tipoproceso_etiqueta || "",
                idetiquetatipoproceso: data.idetiquetatipoproceso || "",
                idaprobacion: idAprobacion,
                entidad_etiqueta: data.entidad_etiqueta,
                idetiquetatestado: data.estado_etiqueta || ""
            };

            console.log("Datos guardados para aprobación:", datosAprobacionActual);

            // 5. Rellena el formulario con los datos
            $("#modal-fondo-id").val(data.idfondo);
            $("#modal-fondo-descripcion").val(data.descripcion);
            $("#modal-fondo-proveedor").val(data.proveedor);
            $("#modal-fondo-tipofondo").val(data.tipo_fondo);
            $("#modal-fondo-valor").val(data.valor_fondo ? parseFloat(data.valor_fondo) : '');
            $("#modal-fondo-estado").val(data.estado);
            $("#modal-fondo-fechainicio").val(formatDateForInput(data.fecha_inicio));
            $("#modal-fondo-fechafin").val(formatDateForInput(data.fecha_fin));

            // Cargar aprobaciones
            console.log("=== VERIFICANDO PARÁMETROS PARA APROBACIONES ===");
            console.log("entidad_etiqueta del JSON:", data.entidad_etiqueta);
            console.log("idfondo del JSON:", data.idfondo);
            console.log("idetiquetatipoproceso del JSON:", data.idetiquetatipoproceso);

            if (data.entidad_etiqueta && data.idfondo && data.idetiquetatipoproceso) {
                cargarAprobaciones(
                    data.entidad_etiqueta,
                    data.idfondo,
                    data.idetiquetatipoproceso
                );
            } else {
                console.error("❌ FALTAN PARÁMETROS NECESARIOS");
                console.error("Datos recibidos:", {
                    entidad_etiqueta: data.entidad_etiqueta,
                    idfondo: data.idfondo,
                    idetiquetatipoproceso: data.idetiquetatipoproceso
                });
                $('#tabla-aprobaciones-fondo').html(
                    '<p class="alert alert-warning">No se encontraron los parámetros necesarios para cargar aprobaciones.</p>'
                );
            }

            // 6. Muestra el modal
            var editarModal = new bootstrap.Modal(document.getElementById('modalEditarFondo'));
            editarModal.show();
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
 * Convierte una fecha/hora (ej: "2025-11-03T00:00:00")
 * al formato "YYYY-MM-DD" que necesita <input type="date">.
 */
function formatDateForInput(fechaString) {
    if (!fechaString) {
        return "";
    }
    // Simplemente partimos la cadena en la 'T' y tomamos la primera parte (la fecha)
    return fechaString.split('T')[0];
}

// ===================================================================
// ===== FUNCIONES UTILITARIAS =====
// ===================================================================

/**
 * Formatea un número como moneda (ej: 20000 -> $ 20,000.00)
 */
function formatearMoneda(valor) {
    var numero = parseFloat(valor);
    if (isNaN(numero)) {
        return valor;
    }

    return '$ ' + numero.toLocaleString('es-EC', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

/**
 * Formatea la fecha al formato dd/mm/yyyy
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
 * @param {string} valorEntidad - Valor que viene de "entidad_etiqueta" del JSON
 * @param {number} valorIdentidad - Valor que viene de "idfondo" del JSON
 * @param {string} valorIdTipoProceso - Valor que viene de "idetiquetatipoproceso" del JSON
 */
function cargarAprobaciones(valorEntidad, valorIdentidad, valorIdTipoProceso) {
    console.log("=== CARGANDO APROBACIONES ===");
    console.log("Valores recibidos de la función:", {
        valorEntidad: valorEntidad,
        valorIdentidad: valorIdentidad,
        valorIdTipoProceso: valorIdTipoProceso
    });

    // 1. Destruir tabla anterior si existe
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

    // 2. Construir la URL con los parámetros en la ruta (path parameters)
    const urlCompleta = `${window.apiBaseUrl}/api/Aprobacion/consultar-aprobaciones/${valorEntidad}/${valorIdentidad}/${valorIdTipoProceso}`;

    console.log("URL completa con path parameters:", urlCompleta);

    // 3. Llamada al endpoint de aprobaciones
    $.ajax({
        url: urlCompleta,
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
            console.log("=== RESPUESTA DEL API DE APROBACIONES ===");
            console.log("Tipo de data:", typeof data);
            console.log("Es Array:", Array.isArray(data));
            console.log("Datos completos:", data);

            // 4. Procesar la respuesta
            let aprobaciones = [];

            if (Array.isArray(data)) {
                aprobaciones = data;
                console.log("✅ Data es un array con", data.length, "elementos");
            } else if (data && typeof data === 'object') {
                aprobaciones = [data];
                console.log("✅ Data es un objeto único, convertido a array");
            } else {
                console.error("❌ Data tiene un formato inesperado");
                $('#tabla-aprobaciones-fondo').html(
                    '<p class="alert alert-warning">Formato de datos no reconocido.</p>'
                );
                return;
            }

            console.log("Total de aprobaciones a procesar:", aprobaciones.length);

            // Validar si hay datos
            if (aprobaciones.length === 0) {
                $('#tabla-aprobaciones-fondo').html(
                    '<p class="alert alert-info">No se encontraron aprobaciones para este fondo.</p>'
                );
                return;
            }

            // 5. Crear la estructura de la tabla
            var html = "";
            html += "<table id='tabla-aprobaciones' class='table table-bordered table-striped table-hover w-100'>";
            html += "  <thead>";
            html += "    <tr style='background-color: #f8f9fa;'>";
            html += "      <th>ID Aprobación</th>";
            html += "      <th>Usuario Solicitante</th>";
            html += "      <th>Usuario Aprobador</th>";
            html += "      <th>Estado</th>";
            html += "      <th>Fecha Solicitud</th>";
            html += "      <th>Nivel Aprobación</th>";
            html += "      <th>Tipo Proceso</th>";
            html += "    </tr>";
            html += "  </thead>";
            html += "  <tbody>";

            aprobaciones.forEach((aprobacion, index) => {
                console.log(`Procesando aprobación ${index + 1}:`, aprobacion);

                // Determinar el color del estado
                let estadoClass = '';
                let estadoEtiqueta = aprobacion.estado_etiqueta || '';
                if (estadoEtiqueta === 'ESTADONUEVO') {
                    estadoClass = 'badge bg-primary';
                } else if (estadoEtiqueta === 'ESTADOAPROBADO') {
                    estadoClass = 'badge bg-success';
                } else if (estadoEtiqueta === 'ESTADORECHAZADO') {
                    estadoClass = 'badge bg-danger';
                } else {
                    estadoClass = 'badge bg-secondary';
                }

                html += "<tr>";
                html += "  <td class='text-center'>" + (aprobacion.idaprobacion ?? "-") + "</td>";
                html += "  <td>" + (aprobacion.idusersolicitud ?? "-") + "</td>";
                html += "  <td>" + (aprobacion.iduseraprobador ?? "-") + "</td>";
                html += "  <td><span class='" + estadoClass + "'>" + (aprobacion.estado_nombre ?? "-") + "</span></td>";
                html += "  <td class='text-center'>" + formatearFecha(aprobacion.fechasolicitud) + "</td>";
                html += "  <td class='text-center'>" + (aprobacion.nivelaprobacion ?? "-") + "</td>";
                html += "  <td>" + (aprobacion.tipoproceso_nombre ?? "-") + "</td>";
                html += "</tr>";
            });

            html += "  </tbody>";
            html += "</table>";

            console.log("Insertando HTML de la tabla");
            $('#tabla-aprobaciones-fondo').html(html);

            // 6. Inicializar DataTable
            console.log("Inicializando DataTable de aprobaciones");
            $('#tabla-aprobaciones').DataTable({
                pageLength: 5,
                lengthMenu: [5, 10, 25],
                pagingType: 'simple_numbers',
                searching: false,
                info: true,
                ordering: true,
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
                    paginate: {
                        first: "Primero",
                        last: "Último",
                        next: "Siguiente",
                        previous: "Anterior"
                    }
                }
            });

            console.log("=== ✅ TABLA DE APROBACIONES CARGADA EXITOSAMENTE ===");
        },
        error: function (xhr, status, error) {
            console.error("=== ❌ ERROR AL CARGAR APROBACIONES ===");
            console.error("Status:", status);
            console.error("Error:", error);
            console.error("Response:", xhr.responseText);
            console.error("URL intentada:", urlCompleta);

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
 * @param {string} accion - "APROBAR" o "RECHAZAR"
 */
function procesarAprobacionFondo(accion) {
    if (!datosAprobacionActual) {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No hay datos de aprobación disponibles.'
        });
        return;
    }

    // Determinar el estado según la acción
    let nuevoEstado = "";
    let tituloAccion = "";
    let mensajeAccion = "";

    if (accion === "APROBAR") {
        nuevoEstado = "ESTADOAPROBADO"; // o el código que uses para "Aprobado"
        tituloAccion = "Aprobar Fondo";
        mensajeAccion = "¿Está seguro que desea aprobar este fondo?";
    } else if (accion === "RECHAZAR") {
        nuevoEstado = "ESTADORECHAZADO"; // o el código que uses para "Rechazado"
        tituloAccion = "Rechazar Fondo";
        mensajeAccion = "¿Está seguro que desea rechazar este fondo?";
    }

    // Confirmar la acción con el usuario
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
            ejecutarAprobacionFondo(accion, nuevoEstado);
        }
    });
}

/**
 * Ejecuta el POST al API para aprobar o rechazar
 * @param {string} accion - "APROBAR" o "RECHAZAR"
 * @param {string} nuevoEstado - Código del nuevo estado
 */
function ejecutarAprobacionFondo(accion, nuevoEstado) {
    // Obtener el usuario actual (ajusta esto según tu sistema de autenticación)
    const usuarioActual = "JGONZALEZ"; // TODO: Obtener del usuario logueado

    // Construir el objeto de datos para el POST
    const datosPost = {
        entidad: datosAprobacionActual.entidad,
        identidad: datosAprobacionActual.identidad,
        idtipoproceso: datosAprobacionActual.idtipoproceso,
        idetiquetatipoproceso: datosAprobacionActual.idetiquetatipoproceso,
        idetiquetatestado: nuevoEstado,
        idaprobacion: datosAprobacionActual.idaprobacion,
        usuarioaprobador: usuarioActual
    };

    console.log("=== ENVIANDO APROBACIÓN/RECHAZO ===");
    console.log("Acción:", accion);
    console.log("Datos a enviar:", datosPost);

    // Mostrar loading
    Swal.fire({
        title: 'Procesando...',
        text: 'Por favor espere',
        allowOutsideClick: false,
        didOpen: () => {
            Swal.showLoading();
        }
    });

    // Hacer el POST al API
    $.ajax({
        url: `${window.apiBaseUrl}/api/Fondo/aprobar-fondo`,
        method: "POST",
        contentType: "application/json",
        data: JSON.stringify(datosPost),
        headers: {
            "idopcion": "1",
            "usuario": "admin",
            "idcontrolinterfaz": "0",
            "idevento": "0",
            "entidad": "0",
            "identidad": "0",
            "idtipoproceso": "0"
        },
        success: function (response) {
            console.log("=== RESPUESTA DEL API ===");
            console.log(response);

            Swal.fire({
                icon: 'success',
                title: '¡Éxito!',
                text: response.respuesta || `Fondo ${accion === "APROBAR" ? "aprobado" : "rechazado"} correctamente`,
                confirmButtonText: 'Aceptar'
            }).then(() => {
                // Cerrar el modal
                var modal = bootstrap.Modal.getInstance(document.getElementById('modalEditarFondo'));
                modal.hide();

                // Recargar la tabla de fondos
                $.ajax({
                    url: `${window.apiBaseUrl}/api/Fondo/bandeja-aprobacion/JGONZALEZ`,
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
                        crearListado(data);
                    }
                });
            });
        },
        error: function (xhr, status, error) {
            console.error("=== ERROR AL PROCESAR APROBACIÓN ===");
            console.error("Status:", status);
            console.error("Error:", error);
            console.error("Response:", xhr.responseText);

            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'No se pudo procesar la aprobación/rechazo: ' + error
            });
        }
    });
}