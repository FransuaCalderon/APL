// ~/js/Fondo/InactivarFondo.js

// Variables globales
let tabla; // GLOBAL
let ultimaFilaModificada = null; // Para recordar la última fila editada/eliminada

// Se ejecuta cuando el DOM está listo
$(document).ready(function () {

    // Configuración inicial y carga de datos
    $.get("/config", function (config) {
        const apiBaseUrl = config.apiBaseUrl;
        window.apiBaseUrl = apiBaseUrl;

        $.ajax({
            // ===== ¡ÚNICO CAMBIO AQUÍ! =====
            url: `${apiBaseUrl}/api/Fondo/bandeja-inactivacion`,
            // ================================
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

    // ===== MANEJADOR DEL BOTÓN GUARDAR DEL MODAL DE EDICIÓN =====
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
        // $.get(`${window.apiBaseUrl}/api/Fondo/bandeja-inactivacion`, function (data) {
        //     crearListado(data);
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
    html += "          BANDEJA DE FONDOS";
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
            var id = fondo.idfondo;

            // 3. Tu botón de visualizar
            var viewButton = '<button type="button" class="btn-action view-btn" title="Visualizar" onclick="abrirModalEditar(' + id + ')">' +
                '<i class="fa-regular fa-eye"></i>' +
                '</button>';

            html += "<tr>";
            // 4. Tu celda con el botón de editar
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
            // (Tu configuración de idioma está bien)
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
// ===== FUNCIONES PARA EL MODAL DE EDICIÓN =====
// ===================================================================

/**
 * Abre el modal de edición y carga los datos del fondo.
 * (Esta función sigue apuntando al endpoint de "modificacion-idr"
 * ya que no me diste uno nuevo para "inactivacion-idr")
 */
// ... (código existente) ...

function abrirModalEditar(id) {
    // 1. Reinicia el formulario
    $('#formEditarFondo')[0].reset();

    // 2. Configura el título y el botón del modal
    $('#modalEditarFondoLabel').text('Visualizar Fondo'); // Título más apropiado
    // Eliminamos la lógica de botón de "Guardar" o la cambiamos a "Inactivar" si fuera el caso
    // Como es solo visualizar, nos aseguramos de que no haya botón de guardar visible en el footer.

    // 📌 NUEVO: Cargar la tabla de acuerdos antes de abrir el modal.
    cargarAcuerdoFondo(id);


    // 3. Llama a la API para obtener los datos del fondo por ID
    $.ajax({
        // (Este endpoint es el de la página anterior, cámbialo si tienes uno nuevo)
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
            // 4. Rellena el formulario con los datos (¡usa snake_case!)
            $("#modal-fondo-id").val(data.idfondo);
            $("#modal-fondo-descripcion").val(data.descripcion);
            $("#modal-fondo-proveedor").val(data.proveedor);
            $("#modal-fondo-tipofondo").val(data.tipo_fondo);
            $("#modal-fondo-valor").val(formatearMoneda(data.valor_fondo).replace('$ ', '').replace(',', '')); // Quita formato para input type="number"
            $("#modal-fondo-estado").val(data.estado);

            // 5. Formatea las fechas para los inputs <input type="date">
            $("#modal-fondo-fechainicio").val(formatDateForInput(data.fecha_inicio));
            $("#modal-fondo-fechafin").val(formatDateForInput(data.fecha_fin));

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

// ... (El resto de tus funciones utilitarias se mantienen sin cambios) ...

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
// ===== FUNCIONES UTILITARIAS (de tu código) =====
// ===================================================================

/**
 * Formatea un número como moneda (ej: 20000 -> 20,000.00)
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
 * Formatea la fecha al formato Nov-01-2025
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

    // 2. Llamada al nuevo endpoint para el acuerdo
    $.ajax({
        url: `${window.apiBaseUrl}/consultar-acuerdo-fondo/${idFondo}`,
        method: "GET",
        headers: {
            "idopcion": "1", // Usar los headers definidos en el código original
            "usuario": "admin",
            "idcontrolinterfaz": "0",
            "idevento": "0",
            "entidad": "0",
            "identidad": "0",
            "idtipoproceso": "0"
        },
        success: function (data) {
            console.log("Datos del Acuerdo:", data);

            // 3. Crear la estructura de la tabla (usando el DataTables que ya tienes)
            let acuerdos = Array.isArray(data) ? data : [data]; // Aseguramos que sea un array
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
                html += "<tr>";
                html += "  <td>" + (acuerdo.idacuerdofondo ?? "") + "</td>";
                html += "  <td>" + (acuerdo.acuerdofondo_estado_nombre ?? "") + "</td>";
                html += "  <td>" + (acuerdo.acuerdofondo_descripcion ?? "") + "</td>";
                html += "  <td class='text-end'>" + formatearMoneda(acuerdo.acuerdofondo_valor) + "</td>";
                html += "  <td class='text-end'>" + formatearMoneda(acuerdo.acuerdofondo_valor_disponible) + "</td>";
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
                        first: "Primero", last: "Último", next: "Siguiente", previous: "Anterior"
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
