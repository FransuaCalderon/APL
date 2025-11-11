// ~/js/Fondo/ModificarFondo.js

// Variables globales
let tabla; // GLOBAL
let ultimaFilaModificada = null; // Para recordar la última fila editada/eliminada

// Se ejecuta cuando el DOM está listo
$(document).ready(function () {

    // Configuración inicial y carga de datos
    $.get("/config", function (config) {
        const apiBaseUrl = config.apiBaseUrl;
        window.apiBaseUrl = apiBaseUrl;

        cargarTipoFondo();
        consultarProveedor();

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


    function cargarTipoFondo() {
        // Definimos la etiqueta que quieres enviar
        const etiqueta = "TIPOFONDO";

        $.ajax({
            // 1. URL actualizada para incluir la etiqueta en la ruta
            url: `${window.apiBaseUrl}/api/Opciones/ConsultarCombos/${etiqueta}`,
            method: "GET",
            headers: {
                "idopcion": "1",
                "usuario": "admin"
            },
            success: function (data) {
                console.log("Tipos de fondo cargados:", data);

                // Seleccionamos el <select> por su ID
                const $selectFondoTipo = $("#modal-fondo-tipofondo");

                // Limpiar el select
                $selectFondoTipo.empty();

                // Agregar una opción por defecto
                $selectFondoTipo.append(
                    $('<option></option>')
                        .val("") // Valor vacío para la opción por defecto
                        .text("Seleccione...")
                );

                // Agregar las opciones dinámicamente desde la API
                if (data && data.length > 0) {
                    data.forEach(function (item) {
                        $selectFondoTipo.append(
                            $('<option></option>')
                                // 2. Nombres de propiedades (idcatalogo, nombre_catalogo)
                                .val(item.nombre_catalogo)
                                .text(item.nombre_catalogo)
                        );
                    });
                }

                
            },
            error: function (xhr, status, error) {
                console.error("Error al cargar tipos de fondo:", error);
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'No se pudieron cargar los tipos de fondo'
                });
            }
        });
    }

    function consultarProveedor() {
        // Definimos la etiqueta que quieres enviar
        // Valores fijos
        const usuario = "1";
        const idopcion = "9";

        $.ajax({
            // 1. URL actualizada para incluir la etiqueta en la ruta
            url: `${window.apiBaseUrl}/api/Proveedor/Listar`,
            method: "GET",
            headers: {
                "idopcion": idopcion,
                "usuario": usuario
            },
            success: function (data) {
                console.log("proveedores cargado:", data);

                // Seleccionamos el <select> por su ID
                const $selectFondoTipo = $("#modal-fondo-proveedor");

                // Limpiar el select
                $selectFondoTipo.empty();

                // Agregar una opción por defecto
                $selectFondoTipo.append(
                    $('<option></option>')
                        .val("") // Valor vacío para la opción por defecto
                        .text("Seleccione...")
                );

                // Agregar las opciones dinámicamente desde la API
                if (data && data.length > 0) {
                    data.forEach(function (item) {
                        $selectFondoTipo.append(
                            $('<option></option>')
                                // 2. Nombres de propiedades (idcatalogo, nombre_catalogo)
                                .val(item.codigo)
                                .text(item.nombre)
                        );
                    });
                }


            },
            error: function (xhr, status, error) {
                console.error("Error al cargar proveedor:", error);
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'No se pudieron cargar los proveedores'
                });
            }
        });
    }

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
        // $.get(`${window.apiBaseUrl}/api/Fondo/bandeja-modificacion`, function (data) {
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

            // 3. Tu botón de editar
            var editButton = '<button type="button" class="btn-action edit-btn" title="Editar" onclick="abrirModalEditar(' + id + ')">' +
                '<i class="fa-regular fa-pen-to-square"></i>' +
                '</button>';

            html += "<tr>";
            // 4. Tu celda con el botón de editar
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
 */
function abrirModalEditar(id) {
    // 1. Reinicia el formulario
    $('#formEditarFondo')[0].reset();

    // 2. Configura el título y el botón del modal
    $('#modalEditarFondoLabel').text('Editar Fondo');
    $('#btnGuardarCambiosFondo')
        .html('<i class="fa-solid fa-pen-to-square me-2"></i> Modificar')
        .removeClass('btn-success')
        .addClass('btn-primary');

    

    // 3. Llama a la API para obtener los datos del fondo por ID
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

            
            // 4. Rellena el formulario con los datos (¡usa snake_case!)
            $("#modal-fondo-id").val(data.idfondo);
            $("#modal-fondo-descripcion").val(data.descripcion);
            $("#modal-fondo-proveedor").val(data.proveedor);
            $("#modal-fondo-tipofondo").val(data.tipo_fondo);
            $("#modal-fondo-valor").val(formatearMoneda(data.valor_fondo));
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

document.addEventListener('DOMContentLoaded', function () {
    const inputValor = document.getElementById('modal-fondo-valor');

    // 👉 Formatear mientras se escribe
    inputValor.addEventListener('input', function (e) {
        let valorLimpio = e.target.value.replace(/[^0-9.,]/g, '').replace(',', '.');
        if (valorLimpio === '') {
            e.target.value = '';
            return;
        }
        let numero = parseFloat(valorLimpio);
        if (!isNaN(numero)) {
            e.target.value = formatearMoneda(numero);
        }
    });

    // 👉 Formatear al salir del campo
    inputValor.addEventListener('blur', function (e) {
        let valorLimpio = e.target.value.replace(/[^0-9.,]/g, '').replace(',', '.');
        let numero = parseFloat(valorLimpio);
        if (!isNaN(numero)) {
            e.target.value = formatearMoneda(numero);
        } else {
            e.target.value = '';
        }
    });
});

// 👉 NUEVA FUNCIÓN: Usar cuando cargues datos en el input
function cargarValorEnInput(valor) {
    const inputValor = document.getElementById('modal-fondo-valor');
    if (inputValor && valor) {
        inputValor.value = formatearMoneda(valor);
    }
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