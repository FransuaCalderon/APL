// ~/js/Fondo/ConsultarFondo.js

// Variables globales
let tabla; // GLOBAL
let ultimaFilaModificada = null; // Para recordar la última fila editada/eliminada

// Se ejecuta cuando el DOM está listo
$(document).ready(function () {

    // Configuración inicial y carga de datos
    $.get("/config", function (config) {
        const apiBaseUrl = config.apiBaseUrl;
        window.apiBaseUrl = apiBaseUrl;

        // Se mantiene la carga de combos para el modal
        cargarTipoFondo();
        consultarProveedor();

        // Endpoint de listado/consulta general: /api/Fondo/listar
        $.ajax({
            url: `${apiBaseUrl}/api/Fondo/bandeja-modificacion`,
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
                console.log("Datos de Consulta/Listar recibidos:", data);
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


    function cargarTipoFondo() {
        const etiqueta = "TIPOFONDO";

        $.ajax({
            url: `${window.apiBaseUrl}/api/Opciones/ConsultarCombos/${etiqueta}`,
            method: "GET",
            headers: { "idopcion": "1", "usuario": "admin" },
            success: function (data) {
                const $selectFondoTipo = $("#modal-fondo-tipofondo");
                $selectFondoTipo.empty();
                $selectFondoTipo.append($('<option></option>').val("").text("Seleccione..."));
                if (data && data.length > 0) {
                    data.forEach(function (item) {
                        $selectFondoTipo.append($('<option></option>').val(item.nombre_catalogo).text(item.nombre_catalogo));
                    });
                }
            },
            error: function (xhr, status, error) {
                console.error("Error al cargar tipos de fondo:", error);
            }
        });
    }

    function consultarProveedor() {
        const usuario = "1";
        const idopcion = "9";

        $.ajax({
            url: `${window.apiBaseUrl}/api/Proveedor/Listar`,
            method: "GET",
            headers: { "idopcion": idopcion, "usuario": usuario },
            success: function (data) {
                const $selectFondoTipo = $("#modal-fondo-proveedor");
                $selectFondoTipo.empty();
                $selectFondoTipo.append($('<option></option>').val("").text("Seleccione..."));
                if (data && data.length > 0) {
                    data.forEach(function (item) {
                        $selectFondoTipo.append($('<option></option>').val(item.codigo).text(item.nombre));
                    });
                }
            },
            error: function (xhr, status, error) {
                console.error("Error al cargar proveedor:", error);
            }
        });
    }

    $('body').on('click', '#btnLimpiar', function () {
        if (tabla) {
            tabla.search('').draw();
            tabla.page(0).draw('page');
            ultimaFilaModificada = null;
            // Asumiendo que limpiarSeleccion es una función global
            if (typeof limpiarSeleccion === 'function') {
                limpiarSeleccion('#tabla-fondos');
            }
        }
    });

}); // <-- FIN de $(document).ready


// ===================================================================
// ===== FUNCIONES GLOBALES CORREGIDAS =====
// ===================================================================

function crearListado(data) {
    if (tabla) {
        tabla.destroy();
    }

    var html = "";
    html += "<table id='tabla-fondos' class='table table-bordered table-striped table-hover'>";
    html += "  <thead>";
    html += "    <tr>";
    html += "      <th colspan='12' style='background-color: #CC0000 !important; color: white; text-align: center; font-weight: bold; padding: 8px; font-size: 1rem;'>";
    html += "          BANDEJA DE FONDOS";
    html += "      </th>";
    html += "    </tr>";
    html += "    <tr>";
    html += "      <th>Acción</th>";
    html += "      <th>IDFondo</th>";
    html += "      <th>Descripción</th>";
    html += "      <th>Proveedor</th>";
    html += "      <th>Tipo Fondo</th>";
    html += "      <th>$ Fondo</th>";
    html += "      <th>Fecha Inicio</th>";
    html += "      <th>Fecha Fin</th>";
    html += "      <th>$ Disponible</th>";
    html += "      <th>$ Comprometido</th>";
    html += "      <th>$ Liquidado</th>";
    html += "      <th>Estado</th>";
    html += "    </tr>";
    html += "  </thead>";
    html += "  <tbody>";

    if (!data || data.length === 0) {
        html += "<tr><td colspan='12' class='text-center'>Sin datos</td></tr>";
    } else {
        for (var i = 0; i < data.length; i++) {
            var fondo = data[i];
            var id = fondo.idfondo;

            // 💡 CAMBIO CLAVE: Usar el ícono de consulta/ojo
            var viewButton = '<button type="button" class="btn-action view-btn" title="Consultar" onclick="abrirModalEditar(' + id + ')">' +
                '<i class="fa-solid fa-eye"></i>' +
                '</button>';

            html += "<tr>";
            html += "  <td class='text-center'>" + viewButton + "</td>";
            html += "  <td>" + (fondo.idfondo ?? "") + "</td>";
            html += "  <td>" + (fondo.descripcion ?? "") + "</td>";
            html += "  <td>" + (fondo.proveedor ?? "") + "</td>";
            html += "  <td>" + (fondo.tipo_fondo ?? "") + "</td>";

            // 💡 CORRECCIÓN DE UNDEFINED: Asegurando que los valores numéricos y de fecha se muestren, si vienen en el JSON
            html += "  <td class='text-end'>" + formatearMoneda(fondo.valor_fondo) + "</td>";
            html += "  <td class='text-center'>" + formatearFecha(fondo.fecha_inicio) + "</td>";
            html += "  <td class='text-center'>" + formatearFecha(fondo.fecha_fin) + "</td>";
            html += "  <td class='text-end'>" + formatearMoneda(fondo.valor_disponible) + "</td>";
            html += "  <td class='text-end'>" + formatearMoneda(fondo.valor_comprometido) + "</td>";
            html += "  <td class='text-end'>" + formatearMoneda(fondo.valor_liquidado) + "</td>";
            html += "  <td>" + (fondo.estado ?? "") + "</td>";
            html += "</tr>";
        }
    }

    html += "  </tbody>";
    html += "</table>";

    $('#tabla').html(html);

    // Inicializa DataTable (sin cambios)
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
                // Asumiendo que marcarFilaPorId es una función global
                if (typeof marcarFilaPorId === 'function') {
                    marcarFilaPorId('#tabla-fondos', ultimaFilaModificada);
                }
            }
        }
    });

    console.log('Llamando a inicializarMarcadoFilas para Fondos');
    // Asumiendo que inicializarMarcadoFilas es una función global
    if (typeof inicializarMarcadoFilas === 'function') {
        inicializarMarcadoFilas('#tabla-fondos');
    }
}

// ===================================================================
// ===== FUNCIONES PARA EL MODAL DE CONSULTA (anteriormente EDICIÓN) =====
// ===================================================================

/**
 * Abre el modal de consulta y carga los datos del fondo.
 */
function abrirModalEditar(id) {
    $('#formEditarFondo')[0].reset();
    $('#modalEditarFondoLabel').text('Visualizar Fondo');

    // Mantenemos la URL original del modal de edición para consultar por ID
    $.ajax({
        url: `${window.apiBaseUrl}/api/Fondo/bandeja-modificacion-id/${id}`,
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
            $("#modal-fondo-id").val(data.idfondo);
            $("#modal-fondo-descripcion").val(data.descripcion);
            $("#modal-fondo-proveedor").val(data.proveedor);
            $("#modal-fondo-tipofondo").val(data.tipo_fondo);

            // Usamos cargarValorEnInput para formatear el valor numérico
            cargarValorEnInput(data.valor_fondo);

            $("#modal-fondo-estado").val(data.estado);
            $("#modal-fondo-fechainicio").val(formatDateForInput(data.fecha_inicio));
            $("#modal-fondo-fechafin").val(formatDateForInput(data.fecha_fin));

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
 * Convierte una fecha/hora al formato "YYYY-MM-DD" que necesita <input type="date">.
 */
function formatDateForInput(fechaString) {
    if (!fechaString) return "";
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
    if (isNaN(numero) || valor === null) { // Agregada verificación de null
        return "$ 0.00"; // Devuelve un formato estándar si no es un número válido
    }
    return '$ ' + numero.toLocaleString('es-EC', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

// Se mantiene la función para cargar el valor desde JS para el input disabled
function cargarValorEnInput(valor) {
    const inputValor = document.getElementById('modal-fondo-valor');
    if (inputValor && valor !== undefined && valor !== null) {
        // Al ser un input[type=number] deshabilitado, lo cargamos sin el símbolo de dólar para evitar errores de tipo.
        let numero = parseFloat(valor);
        inputValor.value = isNaN(numero) ? '' : numero.toFixed(2);
    }
}

/**
 * Formatea la fecha al formato DD/MM/AAAA
 */
function formatearFecha(fechaString) {
    try {
        if (!fechaString) return '';

        var fecha = new Date(fechaString);
        if (isNaN(fecha.getTime())) return fechaString; // Mejorado: usar getTime()

        var dia = String(fecha.getDate()).padStart(2, '0');
        var mes = String(fecha.getMonth() + 1).padStart(2, '0');
        var anio = fecha.getFullYear();

        return `${dia}/${mes}/${anio}`;
    } catch (e) {
        console.warn("Error formateando fecha:", fechaString);
        return fechaString;
    }
}