// ~/js/Opciones/Opciones.js

// Variables globales
let tabla; // GLOBAL
let ultimaFilaModificada = null; // Para recordar la última fila editada/eliminada

// Se ejecuta cuando el DOM está listo
$(document).ready(function () {

    // Configuración inicial y carga de datos
    $.get("/config", function (config) {
        const apiBaseUrl = config.apiBaseUrl;
        window.apiBaseUrl = apiBaseUrl;

        $.get(`${apiBaseUrl}/api/Opciones/listar`, function (data) {
            console.log(data);
            crearListado(data);
        });
    });

    // Delegación de clic para el botón "Agregar Nuevo"
    $('body').on('click', '#btnAgregarNuevo', function () {
        abrirModalCrear();
    });

    // ===== INICIO DE LA IMPLEMENTACIÓN DEL BOTÓN LIMPIAR =====
    $('body').on('click', '#btnLimpiar', function () {
        if (tabla) { // Se asegura de que la tabla ya esté inicializada
            // 1. Limpia el texto del campo de búsqueda
            tabla.search('').draw();

            // 2. Regresa la tabla a la primera página
            tabla.page(0).draw('page');

            // 3. Limpiar también la fila marcada
            ultimaFilaModificada = null;
            $('#tabla-curso tbody tr').removeClass('fila-seleccionada');
            $('#tabla-curso tbody tr td').css('box-shadow', '');
        }
    });
    // ===== FIN DE LA IMPLEMENTACIÓN =====

    // Lógica para manejar el cierre del modal
    $('#editarModal').on('hidden.bs.modal', function () {
        // NO limpiamos la selección aquí - la fila permanece marcada

        $('#editarModalLabel').text('Editar Opción');
        $('#btnGuardarCambios')
            .html('<i class="fa-solid fa-pen-to-square me-2"></i> Modificar')
            .removeClass('btn-success')
            .addClass('btn-primary');
    });

    // Lógica para guardar o crear
    $("#btnGuardarCambios").on("click", function (e) {
        e.preventDefault();

        const id = $("#modal-idopcion").val();
        const isCrear = !id;

        const data = {
            nombre: $("#modal-nombre").val(),
            descripcion: $("#modal-descripcion").val(),
            idUsuarioCreacion: 1,
            fechaCreacion: new Date().toISOString(),
            idUsuarioModificacion: 1,
            fechaModificacion: new Date().toISOString(),
            idEstado: $("#modal-activo").is(":checked") ? 1 : 0,
            idMarcaAbreviaturaAutomatica: 1,
            idEtiqueta: $("#modal-etiqueta").val()
        };

        if (isCrear) {
            data.idUsuarioCreacion = 1;
            data.fechaCreacion = new Date().toISOString();
        }

        const url = id ? `${window.apiBaseUrl}/api/Opciones/actualizar/${id}`
            : `${window.apiBaseUrl}/api/Opciones/insertar`;

        const method = id ? "PUT" : "POST";

        // ===== INICIO DE LA MODIFICACIÓN CON SWEETALERT2 =====
        $.ajax({
            url: url,
            type: method,
            contentType: "application/json",
            data: JSON.stringify(data),
            success: function (response) {
                $("#editarModal").modal("hide");

                // 1. Alerta de éxito con SweetAlert2
                Swal.fire({
                    icon: 'success',
                    title: '¡Guardado!',
                    text: 'El registro se ha guardado correctamente.',
                    showConfirmButton: false,
                    timer: 1500
                });

                // Si es creación, necesitamos obtener el ID del nuevo registro
                // Si tu API devuelve el ID en la respuesta, úsalo así:
                // ultimaFilaModificada = response.idopcion;
                // Si no, mantén el ID actual para ediciones
                if (!isCrear && id) {
                    ultimaFilaModificada = id;
                }

                $.get(`${window.apiBaseUrl}/api/Opciones/listar`, function (data) {
                    crearListado(data);
                });
            },
            error: function () {
                const mensaje = id ? "actualizar" : "guardar";

                // 2. Alerta de error con SweetAlert2
                Swal.fire({
                    icon: 'error',
                    title: 'Oops...',
                    text: `¡Algo salió mal al ${mensaje} el registro!`
                });
            }
        });
        // ===== FIN DE LA MODIFICACIÓN =====
    });

    // ===================================================================
    // ===== CÓDIGO PARA HOVER EN LA FILA =====
    // ===================================================================
    // Cuando el mouse entra en el div de los botones...
    $('#tabla').on('mouseenter', '.action-buttons', function () {
        // ...busca la fila (tr) más cercana y agrégale nuestra clase.
        $(this).closest('tr').addClass('fila-marcada');
    });

    // Cuando el mouse sale del div de los botones...
    $('#tabla').on('mouseleave', '.action-buttons', function () {
        // ...busca la fila (tr) y quítale la clase.
        $(this).closest('tr').removeClass('fila-marcada');
    });

    // ===================================================================
    // ===== MARCAR FILA AL HACER CLIC EN EDITAR/ELIMINAR =====
    // ===================================================================

    // Cuando se hace clic en el botón de editar
    $('#tabla').on('click', '.edit-btn', function () {
        const $fila = $(this).closest('tr');
        const id = $fila.find('td:first').text().trim();
        marcarFilaPorId(id);
    });

    // Cuando se hace clic en el botón de eliminar
    $('#tabla').on('click', '.delete-btn', function () {
        const $fila = $(this).closest('tr');
        const id = $fila.find('td:first').text().trim();
        marcarFilaPorId(id);
    });

}); // <-- FIN de $(document).ready


// ===================================================================
// ===== FUNCIONES GLOBALES =====
// ===================================================================

// Función para marcar una fila específica por ID
function marcarFilaPorId(id) {
    const colorSeleccionado = '255, 252, 127'; // Amarillo suave
    const estiloSeleccionado = `inset 0 0 0 9999px rgba(${colorSeleccionado}, 0.4)`;

    // Quita el marcado de todas las filas
    $('#tabla-curso tbody tr').removeClass('fila-seleccionada');
    $('#tabla-curso tbody tr td').css('box-shadow', '');

    // Busca la fila con ese ID y márcala
    $('#tabla-curso tbody tr').each(function () {
        const filaId = $(this).find('td:first').text().trim();
        if (filaId == id) {
            $(this).addClass('fila-seleccionada');
            $(this).children('td').css('box-shadow', estiloSeleccionado);

            // Guarda el ID de la última fila modificada
            ultimaFilaModificada = id;
        }
    });
}


function crearListado(data) {
    if (tabla) {
        tabla.destroy();
    }

    var html = "";
    html += "<table id='tabla-curso' class='table table-striped display'>";
    html += "  <thead><tr><th>ID</th><th>Nombre</th><th>Descripcion</th><th>Opciones</th></tr></thead>";
    html += "  <tbody>";

    if (!data || data.length === 0) {
        html += "<tr><td colspan='4' class='text-center'>Sin datos</td></tr>";
    } else {
        for (var i = 0; i < data.length; i++) {
            var c = data[i];
            var id = c.idopcion;

            var editButton = '<button type="button" class="btn-action edit-btn" title="Editar" onclick="abrirModalEditar(' + id + ')">' +
                '<i class="fa-regular fa-pen-to-square"></i>' +
                '</button>';

            var deleteButton = '<button type="button" class="btn-action delete-btn" title="Eliminar" onclick="confirmDelete(' + id + ')">' +
                '<i class="fa-regular fa-trash-can"></i>' +
                '</button>';

            var optionsHtml = '<div class="action-buttons">' + editButton + deleteButton + '</div>';

            html += "<tr>";
            html += "  <td>" + (c.idopcion ?? "") + "</td>";
            html += "  <td>" + (c.nombre ?? "") + "</td>";
            html += "  <td>" + (c.descripcion ?? "") + "</td>";
            html += "  <td>" + optionsHtml + "</td>";
            html += "</tr>";
        }
    }

    html += "  </tbody>";
    html += "</table>";

    $('#tabla').html(html);

    tabla = $('#tabla-curso').DataTable({
        pageLength: 5,
        lengthMenu: [5, 10, 50],
        pagingType: 'full_numbers',
        columnDefs: [
            { targets: 0, width: "5%", className: "dt-left" },
            { targets: 3, width: "10%", className: "dt-center", orderable: false },
            { targets: 2, width: "60%" }
        ],
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
            },
            aria: {
                sortAscending: ": activar para ordenar la columna de manera ascendente",
                sortDescending: ": activar para ordenar la columna de manera descendente"
            }
        },
        // ===== NUEVO: Callback cuando la tabla termina de dibujarse =====
        drawCallback: function () {
            // Si hay una fila marcada anteriormente, volver a marcarla
            if (ultimaFilaModificada !== null) {
                marcarFilaPorId(ultimaFilaModificada);
            }
        }
    });

    const addButtonHtml = `
        <button type="button" class="btn btn-primary ms-2" id="btnAgregarNuevo" title="Agregar Nuevo" style="height: 38px;">
            <i class="fa-solid fa-plus"></i>
        </button>
    `;

    const lengthContainer = $('#tabla-curso_length');
    lengthContainer.find('#btnAgregarNuevo').remove();
    lengthContainer.prepend(addButtonHtml);
    lengthContainer.css('display', 'flex').css('align-items', 'center');
}


function abrirModalEditar(id) {
    $('#formEditar')[0].reset();
    $('#modal-idopcion').val(id);

    $('#editarModalLabel').text('Editar Opción');
    $('#btnGuardarCambios')
        .html('<i class="fa-solid fa-pen-to-square me-2"></i> Modificar')
        .removeClass('btn-success')
        .addClass('btn-primary');

    $.get(`${window.apiBaseUrl}/api/Opciones/obtener/${id}`, function (data) {
        $("#modal-id").val(data.idopcion);
        $("#modal-nombre").val(data.nombre);
        $("#modal-descripcion").val(data.descripcion);
        $("#modal-activo").prop("checked", data.idestado === 1);
        $("#modal-etiqueta").val(data.idetiqueta);

        var editarModal = new bootstrap.Modal(document.getElementById('editarModal'));
        editarModal.show();
    });
}


function abrirModalCrear() {
    $('#formEditar')[0].reset();
    $('#modal-idopcion').val('');

    $('#editarModalLabel').text('Crear Nueva Opción');
    $('#btnGuardarCambios')
        .html('<i class="fa-solid fa-plus me-2"></i> Crear')
        .removeClass('btn-primary')
        .addClass('btn-success');

    var crearModal = new bootstrap.Modal(document.getElementById('editarModal'));
    crearModal.show();
}


function confirmDelete(id) {
    Swal.fire({
        title: 'Confirmar Eliminación',
        text: "¿Estás seguro de que deseas eliminar el registro con ID: " + id + "?",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#009845',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Sí, Eliminar',
        cancelButtonText: 'Cancelar',
    }).then((result) => {
        if (result.isConfirmed) {
            $.ajax({
                url: `${window.apiBaseUrl}/api/Opciones/eliminar/${id}`,
                type: "DELETE",
                success: function () {
                    // Mostrar alerta de éxito con SweetAlert2
                    Swal.fire({
                        icon: 'success',
                        title: '¡Eliminado!',
                        text: 'El registro se ha eliminado correctamente.',
                        showConfirmButton: false,
                        timer: 1500
                    });

                    // Limpia la referencia de la última fila modificada
                    // ya que esta fila ya no existe
                    ultimaFilaModificada = null;

                    $.get(`${window.apiBaseUrl}/api/Opciones/listar`, function (data) {
                        crearListado(data);
                    });
                },
                error: function () {
                    Swal.fire({
                        icon: 'error',
                        title: 'Oops...',
                        text: '¡Algo salió mal al eliminar el registro!'
                    });
                }
            });
        }
    });
}