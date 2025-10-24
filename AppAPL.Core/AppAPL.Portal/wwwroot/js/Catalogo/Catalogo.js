// ~/js/Catalogo/Catalogo.js

// Variables globales
let tabla; // GLOBAL
let ultimaFilaModificada = null; // Para recordar la última fila editada/eliminada

// Se ejecuta cuando el DOM está listo
$(document).ready(function () {

    // Configuración inicial y carga de datos
    $.get("/config", function (config) {
        const apiBaseUrl = config.apiBaseUrl;
        window.apiBaseUrl = apiBaseUrl;

        $.get(`${apiBaseUrl}/api/Catalogo/listar`, function (data) {
            console.log(data);
            crearListado(data);
        });
    });

    // Delegación para el botón "Agregar Nuevo"
    $('body').on('click', '#btnAgregarNuevo', function () {
        abrirModalCrear();
    });

    // ===== INICIO DE LA IMPLEMENTACIÓN DEL BOTÓN LIMPIAR =====
    // Funcionalidad del botón Limpiar
    $('body').on('click', '#btnLimpiar', function () {
        if (tabla) { // Se asegura de que la tabla ya esté inicializada
            // 1. Limpia el texto del campo de búsqueda
            tabla.search('').draw();

            // 2. Regresa la tabla a la primera página
            tabla.page(0).draw('page');

            // 3. Limpiar también la fila marcada
            ultimaFilaModificada = null;
            limpiarSeleccion('#tabla-curso');
        }
    });
    // ===== FIN DE LA IMPLEMENTACIÓN =====

    // Lógica para el cierre del modal
    $('#editarModal').on('hidden.bs.modal', function () {
        // NO limpiamos la selección aquí - la fila permanece marcada

        $('#editarModalLabel').text('Editar Catálogo');
        $('#btnGuardarCambios')
            .html('<i class="fa-solid fa-pen-to-square me-2"></i> Modificar')
            .removeClass('btn-success')
            .addClass('btn-primary');
    });

    // Lógica para Guardar o Crear
    $("#btnGuardarCambios").on("click", function (e) {
        e.preventDefault();

        const id = $("#modal-idCatalogo").val();
        const isCrear = !id;

        const data = {
            nombre: $("#modal-nombre").val(),
            adicional: $("#modal-adicional").val(),
            abreviatura: $("#modal-abreviatura").val(),
            idCatalogoTipo: 3, // Asignar el ID de tipo de catálogo correspondiente
            idUsuarioCreacion: 1,
            fechaCreacion: new Date().toISOString(),
            idUsuarioModificacion: 1,
            fechaModificacion: new Date().toISOString(),
            idEstado: $("#modal-activo").is(":checked") ? 1 : 0,
            idEtiqueta: $("#modal-etiqueta").val()
        };

        if (isCrear) {
            data.idUsuarioCreacion = 1;
            data.fechaCreacion = new Date().toISOString();
        }

        const url = id ? `${window.apiBaseUrl}/api/Catalogo/actualizar/${id}`
            : `${window.apiBaseUrl}/api/Catalogo/insertar`;

        const method = id ? "PUT" : "POST";

        $.ajax({
            url: url,
            type: method,
            contentType: "application/json",
            data: JSON.stringify(data),
            success: function (response) {
                $("#editarModal").modal("hide");

                Swal.fire({
                    icon: 'success',
                    title: '¡Guardado!',
                    text: 'El registro se ha guardado correctamente.',
                    showConfirmButton: false,
                    timer: 1500
                });

                // Si es edición, mantén el ID para marcarlo
                if (!isCrear && id) {
                    ultimaFilaModificada = id;
                }

                // Recargar la tabla para mostrar los cambios
                $.get(`${window.apiBaseUrl}/api/Catalogo/listar`, function (data) {
                    crearListado(data);
                });
            },
            error: function () {
                const mensaje = id ? "actualizar" : "guardar";
                Swal.fire({
                    icon: 'error',
                    title: 'Oops...',
                    text: `¡Algo salió mal al ${mensaje} el registro!`
                });
            }
        });
    });

    // ===================================================================
    // ===== MARCAR FILA AL HACER CLIC EN EDITAR/ELIMINAR =====
    // ===================================================================

    // Cuando se hace clic en el botón de editar
    $('body').on('click', '.edit-btn', function (e) {
        e.stopPropagation(); // Evita que se active el click de la fila
        const $fila = $(this).closest('tr');
        const id = $fila.find('td:first').text().trim();
        marcarFilaPorId('#tabla-curso', id);
        ultimaFilaModificada = id;
        console.log('Botón editar clickeado, fila marcada:', id);
    });

    // Cuando se hace clic en el botón de eliminar
    $('body').on('click', '.delete-btn', function (e) {
        e.stopPropagation(); // Evita que se active el click de la fila
        const $fila = $(this).closest('tr');
        const id = $fila.find('td:first').text().trim();
        marcarFilaPorId('#tabla-curso', id);
        ultimaFilaModificada = id;
        console.log('Botón eliminar clickeado, fila marcada:', id);
    });

}); // <-- FIN de $(document).ready


// ===================================================================
// ===== FUNCIONES GLOBALES =====
// ===================================================================

function crearListado(data) {
    // Destruir la instancia de DataTable si ya existe para evitar errores
    if (tabla) {
        tabla.destroy();
    }

    var html = "";
    html += "<table id='tabla-curso' class='table table-striped display'>";
    html += "  <thead><tr><th>ID</th><th>Nombre</th><th>Adicional</th><th>Abreviatura</th><th>Opciones</th></tr></thead>";
    html += "  <tbody>";

    if (!data || data.length === 0) {
        html += "<tr><td colspan='5' class='text-center'>Sin datos</td></tr>";
    } else {
        for (var i = 0; i < data.length; i++) {
            var c = data[i];
            var id = c.idCatalogo;

            var editButton = '<button type="button" class="btn-action edit-btn" title="Editar" onclick="abrirModalEditar(' + id + ')">' +
                '<i class="fa-regular fa-pen-to-square"></i>' +
                '</button>';

            var deleteButton = '<button type="button" class="btn-action delete-btn" title="Eliminar" onclick="confirmDelete(' + id + ')">' +
                '<i class="fa-regular fa-trash-can"></i>' +
                '</button>';

            var optionsHtml = '<div class="action-buttons">' + editButton + deleteButton + '</div>';

            html += "<tr>";
            html += "  <td>" + (c.idCatalogo ?? "") + "</td>";
            html += "  <td>" + (c.nombre ?? "") + "</td>";
            html += "  <td>" + (c.adicional ?? "") + "</td>";
            html += "  <td>" + (c.abreviatura ?? "") + "</td>";
            html += "  <td>" + optionsHtml + "</td>";
            html += "</tr>";
        }
    }

    html += "  </tbody>";
    html += "</table>";

    $('#tabla').html(html);

    // Inicializar DataTable con configuración completa
    tabla = $('#tabla-curso').DataTable({
        pageLength: 5,
        lengthMenu: [5, 10, 50],
        pagingType: 'full_numbers',
        columnDefs: [
            { targets: 0, width: "5%", className: "dt-left" },
            { targets: 4, width: "10%", className: "dt-center", orderable: false },
            { targets: 2, width: "30%" }
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
        // ===== Callback cuando la tabla termina de dibujarse =====
        drawCallback: function () {
            // Si hay una fila marcada anteriormente, volver a marcarla
            if (ultimaFilaModificada !== null) {
                marcarFilaPorId('#tabla-curso', ultimaFilaModificada);
            }
        }
    });

    // Inicializar el marcado de filas al hacer clic
    console.log('Llamando a inicializarMarcadoFilas');
    inicializarMarcadoFilas('#tabla-curso');

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
    $('#modal-idCatalogo').val(id);
    $('#editarModalLabel').text('Editar Catálogo');
    $('#btnGuardarCambios')
        .html('<i class="fa-solid fa-pen-to-square me-2"></i> Modificar')
        .removeClass('btn-success')
        .addClass('btn-primary');

    $.get(`${window.apiBaseUrl}/api/Catalogo/obtener/${id}`, function (data) {
        $("#modal-nombre").val(data.nombre);
        $("#modal-adicional").val(data.adicional);
        $("#modal-abreviatura").val(data.abreviatura);
        $("#modal-activo").prop("checked", data.idEstado === 1);
        $("#modal-etiqueta").val(data.idEtiqueta);

        var editarModal = new bootstrap.Modal(document.getElementById('editarModal'));
        editarModal.show();
    });
}

function abrirModalCrear() {
    $('#formEditar')[0].reset();
    $('#modal-idCatalogo').val('');
    $('#editarModalLabel').text('Crear Nuevo Catálogo');
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
                url: `${window.apiBaseUrl}/api/Catalogo/eliminar/${id}`,
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
                    limpiarSeleccion('#tabla-curso');

                    // Recargar la tabla
                    $.get(`${window.apiBaseUrl}/api/Catalogo/listar`, function (data) {
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