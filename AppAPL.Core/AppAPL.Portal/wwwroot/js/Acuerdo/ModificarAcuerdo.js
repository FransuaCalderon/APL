// ~/js/Acuerdo/ModificarAcuerdo.js

// ===============================================================
// Variables globales
// ===============================================================
let tabla; // GLOBAL
let ultimaFilaModificada = null; // Para recordar la última fila editada/eliminada

// ===============================================================
// FUNCIONES GLOBALES DE CARGA (fuera del ready)
// ===============================================================

/**
 * Carga la bandeja principal de acuerdos.
 */
function cargarBandeja() {
    // ✅ OBTENER EL IDOPCION DINÁMICAMENTE
    const idOpcionActual = window.obtenerIdOpcionActual();

    if (!idOpcionActual) {
        console.error("No se pudo obtener el idOpcion para cargar la bandeja");
        return;
    }

    const usuario = window.usuarioActual || "admin";
    const apiBaseUrl = window.apiBaseUrl;

    console.log('Cargando bandeja de acuerdos con idOpcion:', idOpcionActual);

    $.ajax({
        url: `${apiBaseUrl}/api/Acuerdo/consultar-bandeja-modificacion`,
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
            console.log("Bandeja de acuerdos cargada:", data);
            crearListado(data);
        },
        error: function (xhr, status, error) {
            console.error("Error al obtener datos de acuerdos:", error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'No se pudieron cargar los acuerdos'
            });
        }
    });
}

// ===============================================================
// DOCUMENT READY
// ===============================================================
$(document).ready(function () {

    console.log("=== INICIO DE CARGA DE PÁGINA - ModificarAcuerdo ===");

    // ✅ LOGS DE VERIFICACIÓN AL INICIAR LA PÁGINA
    console.log("Usuario actual capturado:", window.usuarioActual);

    // Obtener información completa de la opción actual
    const infoOpcion = window.obtenerInfoOpcionActual();
    console.log("Información de la opción actual:", {
        idOpcion: infoOpcion.idOpcion,
        nombre: infoOpcion.nombre,
        ruta: infoOpcion.ruta
    });

    // Verificación adicional
    if (!infoOpcion.idOpcion) {
        console.warn("⚠️ ADVERTENCIA: No se detectó un idOpcion al cargar la página.");
        console.warn("Esto es normal si accediste directamente a la URL sin pasar por el menú.");
        console.warn("Para que funcione correctamente, accede a esta página desde el menú.");
    } else {
        console.log("✅ idOpcion capturado correctamente:", infoOpcion.idOpcion);
    }

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
                limpiarSeleccion('#tabla-acuerdos');
            }
        }
    });

}); // FIN document.ready

// ===================================================================
// ===== FUNCIONES GLOBALES (Datatables, Abrir/Cerrar Modal) =====
// ===================================================================

function crearListado(data) {
    if (tabla) {
        tabla.destroy();
    }

    var html = "";
    html += "<table id='tabla-acuerdos' class='table table-bordered table-striped table-hover'>";

    html += "  <thead>";

    // Fila del Título ROJO
    html += "    <tr>";
    html += "      <th colspan='12' style='background-color: #CC0000 !important; color: white; text-align: center; font-weight: bold; padding: 8px; font-size: 1rem;'>";
    html += "          BANDEJA DE ACUERDOS";
    html += "      </th>";
    html += "    </tr>";

    // Fila de las Cabeceras
    html += "    <tr>";
    html += "      <th>Acción</th>";
    html += "      <th>IdAcuerdo</th>";
    html += "      <th>Descripción</th>";
    html += "      <th>Fondo</th>";
    html += "      <th>Clase de Acuerdo</th>";
    html += "      <th>Valor Acuerdo</th>";
    html += "      <th>Fecha Inicio</th>";
    html += "      <th>Fecha Fin</th>";
    html += "      <th>Valor Disponible</th>";
    html += "      <th>Valor Comprometido</th>";
    html += "      <th>Valor Liquidado</th>";
    html += "      <th>Estado</th>";
    html += "    </tr>";
    html += "  </thead>";
    html += "  <tbody>";

    if (data && data.length > 0) {
        for (var i = 0; i < data.length; i++) {
            var acuerdo = data[i];
            var id = acuerdo.idacuerdo;

            // Botón de editar
            var editButton = '<button type="button" class="btn-action edit-btn" title="Editar" onclick="abrirModalEditar(' + id + ')">' +
                '<i class="fa-regular fa-pen-to-square"></i>' +
                '</button>';

            // Construir el campo "Fondo" concatenando: IdFondo - TipoFondo - Proveedor
            var fondoCompleto = "";
            if (acuerdo.idfondo || acuerdo.nombre_tipo_fondo || acuerdo.nombre_proveedor) {
                var partesFondo = [];
                if (acuerdo.idfondo) partesFondo.push(acuerdo.idfondo);
                if (acuerdo.nombre_tipo_fondo) partesFondo.push(acuerdo.nombre_tipo_fondo);
                if (acuerdo.nombre_proveedor) partesFondo.push(acuerdo.nombre_proveedor);
                fondoCompleto = partesFondo.join(" - ");
            }

            // Construir el campo "Clase de Acuerdo" con badge de cantidad de artículos
            var claseAcuerdoHTML = (acuerdo.clase_acuerdo ?? "");
            if (acuerdo.cantidad_articulos > 0) {
                claseAcuerdoHTML += '<sup style="font-size: 0.8em; margin-left: 2px; font-weight: bold;">' + acuerdo.cantidad_articulos + '</sup>';
            }

            html += "<tr>";
            html += "  <td class='text-center'>" + editButton + "</td>";
            html += "  <td>" + (acuerdo.idacuerdo ?? "") + "</td>";
            html += "  <td>" + (acuerdo.descripcion ?? "") + "</td>";
            html += "  <td>" + fondoCompleto + "</td>";
            html += "  <td>" + claseAcuerdoHTML + "</td>";
            html += "  <td class='text-end'>" + formatearMoneda(acuerdo.valor_acuerdo) + "</td>";
            html += "  <td class='text-center'>" + formatearFecha(acuerdo.fecha_inicio) + "</td>";
            html += "  <td class='text-center'>" + formatearFecha(acuerdo.fecha_fin) + "</td>";
            html += "  <td class='text-end'>" + formatearMoneda(acuerdo.valor_disponible) + "</td>";
            html += "  <td class='text-end'>" + formatearMoneda(acuerdo.valor_comprometido) + "</td>";
            html += "  <td class='text-end'>" + formatearMoneda(acuerdo.valor_liquidado) + "</td>";
            html += "  <td>" + (acuerdo.estado ?? "") + "</td>";
            html += "</tr>";
        }
    }

    html += "  </tbody>";
    html += "</table>";

    // Inserta la tabla en el div
    $('#tabla').html(html);

    // Inicializa DataTable
    tabla = $('#tabla-acuerdos').DataTable({
        pageLength: 10,
        lengthMenu: [5, 10, 25, 50],
        pagingType: 'full_numbers',
        columnDefs: [
            { targets: 0, width: "6%", className: "dt-center", orderable: false },
            { targets: 1, width: "7%", className: "dt-center" },
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
            if (ultimaFilaModificada !== null) {
                if (typeof marcarFilaPorId === 'function') {
                    marcarFilaPorId('#tabla-acuerdos', ultimaFilaModificada);
                }
            }
        }
    });

    console.log('Llamando a inicializarMarcadoFilas para Acuerdos');
    if (typeof inicializarMarcadoFilas === 'function') {
        inicializarMarcadoFilas('#tabla-acuerdos');
    }
}

/**
 * Abre el modal y carga los datos del acuerdo para editar.
 * NOTA: Esta función está preparada para cuando implementes el modal de edición
 */
function abrirModalEditar(id) {
    console.log('Función abrirModalEditar preparada para el acuerdo ID:', id);

    Swal.fire({
        icon: 'info',
        title: 'Próximamente',
        text: 'La funcionalidad de edición estará disponible próximamente'
    });

    // TODO: Implementar la lógica de edición cuando esté listo el modal
}

// ===================================================================
// ===== FUNCIONES UTILITARIAS (Formato) =====
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