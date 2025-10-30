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

        $.ajax({
            url: `${apiBaseUrl}/api/Opciones/listar`,
            method: "GET",
            headers: {
                "idopcion": "1",
                "usuario": "admin"
            },
            success: function (data) {
                console.log(data);
                crearListado(data);
            },
            error: function (xhr, status, error) {
                console.error("Error al obtener config:", error);
            }
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
            // AHORA USA LA FUNCIÓN GLOBAL DE site.js
            limpiarSeleccion('#tabla-curso');
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
            // Asegúrate de incluir aquí el campo 'idTipoServicio' del combobox si es parte de este modal
            // idTipoServicio: $("#modal-tipo-servicio").val() 
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
            headers: {
                "idopcion": "1",
                "usuario": "admin"
            },
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
    // ===== CÓDIGO PARA HOVER EN LA FILA (ELIMINADO) =====
    // 'inicializarMarcadoFilas' de site.js se encarga de esto.
    // ===================================================================

    // ===================================================================
    // ===== MARCAR FILA AL HACER CLIC EN EDITAR/ELIMINAR (ACTUALIZADO) =====
    // ===================================================================

    // Cuando se hace clic en el botón de editar
    $('body').on('click', '.edit-btn', function (e) {
        e.stopPropagation(); // Evita que se active el click de la fila
        const $fila = $(this).closest('tr');
        const id = $fila.find('td:first').text().trim();
        marcarFilaPorId('#tabla-curso', id); // Usa la función global
        ultimaFilaModificada = id;
        console.log('Botón editar clickeado, fila marcada:', id);
    });

    // Cuando se hace clic en el botón de eliminar
    $('body').on('click', '.delete-btn', function (e) {
        e.stopPropagation(); // Evita que se active el click de la fila
        const $fila = $(this).closest('tr');
        const id = $fila.find('td:first').text().trim();
        marcarFilaPorId('#tabla-curso', id); // Usa la función global
        ultimaFilaModificada = id;
        console.log('Botón eliminar clickeado, fila marcada:', id);
    });

}); // <-- FIN de $(document).ready


// ===================================================================
// ===== FUNCIONES GLOBALES =====
// ===================================================================

// ===================================================================
// ===== FUNCIÓN 'marcarFilaPorId' LOCAL (ELIMINADA) =====
// Se usará la función global de 'site.js' en su lugar.
// ===================================================================


function crearListado(data) {
    if (tabla) {
        tabla.destroy();
    }

    var html = "";
    html += "<table id='tabla-curso' class='table table-striped display'>";
    // NOTA: Ajusta tus <thead> si 'Tipo Servicio' debe ser visible en la tabla
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
            // Si agregas 'Tipo Servicio' a la tabla, iría aquí:
            // html += "  <td>" + (c.tiposervicio ?? "") + "</td>";
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
            // Ajustar 'targets' si se agregan más columnas
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
        // ===== ACTUALIZADO: Callback cuando la tabla termina de dibujarse =====
        drawCallback: function () {
            // Si hay una fila marcada anteriormente, volver a marcarla
            if (ultimaFilaModificada !== null) {
                marcarFilaPorId('#tabla-curso', ultimaFilaModificada); // Usa la función global
            }
        }
    });

    // ===================================================================
    // ===== ¡AQUÍ ESTÁ LA LÓGICA QUE FALTABA PARA EL CLIC EN FILA! =====
    // ===================================================================
    console.log('Llamando a inicializarMarcadoFilas para Opciones');
    inicializarMarcadoFilas('#tabla-curso');
    // ===================================================================


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
    $('#modal-idopcion').val(id); // Asegúrate que tu modal tenga un input oculto con id 'modal-idopcion'

    $('#editarModalLabel').text('Editar Opción');
    $('#btnGuardarCambios')
        .html('<i class="fa-solid fa-pen-to-square me-2"></i> Modificar')
        .removeClass('btn-success')
        .addClass('btn-primary');

    $.get(`${window.apiBaseUrl}/api/Opciones/obtener/${id}`, function (data) {
        $("#modal-id").val(data.idopcion); // Esto parece repetido, 'modal-idopcion' ya se seteó
        $("#modal-nombre").val(data.nombre);
        $("#modal-descripcion").val(data.descripcion);
        $("#modal-activo").prop("checked", data.idestado === 1);
        $("#modal-etiqueta").val(data.idetiqueta);
        // Cargar el valor del combobox
        $("#modal-tipo-servicio").val(data.idtiposervicio); // Asumiendo que el campo se llama 'idtiposervicio'

        var editarModal = new bootstrap.Modal(document.getElementById('editarModal'));
        editarModal.show();
    });
}


function abrirModalCrear() {
    $('#formEditar')[0].reset();
    $('#modal-idopcion').val(''); // Limpia el ID para 'crear'

    $('#editarModalLabel').text('Crear Nueva Opción');
    $('#btnGuardarCambios')
        .html('<i class="fa-solid fa-plus me-2"></i> Crear')
        .removeClass('btn-primary')
        .addClass('btn-success');

    // Opcional: setear un valor default para el combobox
    $("#modal-tipo-servicio").val("18"); // Por ejemplo, default a "Modulo Administrador"

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
                headers: {
                    "idopcion": "1",
                    "usuario": "admin"
                },
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
                    ultimaFilaModificada = null;
                    // Llama a la función global para limpiar visualmente
                    limpiarSeleccion('#tabla-curso');

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