// ~/js/TipoCatalogo/TipoCatalogo.js

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
            url: `${apiBaseUrl}/api/CatalogoTipo/listar`,
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

        $('#editarModalLabel').text('Editar Tipo de Catálogo');
        $('#btnGuardarCambios')
            .html('<i class="fa-solid fa-pen-to-square me-2"></i> Modificar')
            .removeClass('btn-success')
            .addClass('btn-primary');
    });

    // Lógica para Guardar o Crear
    $("#btnGuardarCambios").on("click", function (e) {
        e.preventDefault();

        const id = $("#modal-idcatalogotipo").val();
        const isCrear = !id;

        const data = {
            nombre: $("#modal-nombre").val(),
            descripcion: $("#modal-descripcion").val(),
            idusuariocreacion: 1,
            fechacreacion: new Date().toISOString(),
            idusuariomodificacion: 1,
            fechamodificacion: new Date().toISOString(),
            idestado: $("#modal-activo").is(":checked") ? 1 : 0,
            idmarcaabreviaturaautomatica: 1,
            idetiqueta: $("#modal-etiqueta").val()
        };

        if (isCrear) {
            data.idusuariocreacion = 1;
            data.fechacreacion = new Date().toISOString();
        }

        const url = id ? `${window.apiBaseUrl}/api/CatalogoTipo/actualizar/${id}`
            : `${window.apiBaseUrl}/api/CatalogoTipo/insertar`;

        const method = id ? "PUT" : "POST";

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

                $.get(`${window.apiBaseUrl}/api/CatalogoTipo/listar`, function (data) {
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
    // ===== CÓDIGO PARA HOVER EN LA FILA (SOLO EN BOTONES) =====
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
    $('body').on('click', '.edit-btn', function (e) {
        e.stopPropagation(); // Evita que se active el click de la fila
        const $fila = $(this).closest('tr');
        const id = $fila.find('td:first').text().trim();
        marcarFilaPorId('#tabla-curso', id);
        ultimaFilaModificada = id;
    });

    // Cuando se hace clic en el botón de eliminar
    $('body').on('click', '.delete-btn', function (e) {
        e.stopPropagation(); // Evita que se active el click de la fila
        const $fila = $(this).closest('tr');
        const id = $fila.find('td:first').text().trim();
        marcarFilaPorId('#tabla-curso', id);
        ultimaFilaModificada = id;
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
    html += "<table id='tabla-curso' class='table table-striped display'>";
    html += "  <thead><tr><th>ID</th><th>Nombre</th><th>Descripción</th><th>Opciones</th></tr></thead>";
    html += "  <tbody>";

    if (!data || data.length === 0) {
        html += "<tr><td colspan='4' class='text-center'>Sin datos</td></tr>";
    } else {
        for (var i = 0; i < data.length; i++) {
            var c = data[i];
            var id = c.idcatalogotipo;

            var editButton = '<button type="button" class="btn-action edit-btn" title="Editar" onclick="abrirModalEditar(' + id + ')">' +
                '<i class="fa-regular fa-pen-to-square"></i>' +
                '</button>';

            var deleteButton = '<button type="button" class="btn-action delete-btn" title="Eliminar" onclick="confirmDelete(' + id + ')">' +
                '<i class="fa-regular fa-trash-can"></i>' +
                '</button>';

            var optionsHtml = '<div class="action-buttons">' + editButton + deleteButton + '</div>';

            html += "<tr>";
            html += "  <td>" + (c.idcatalogotipo ?? "") + "</td>";
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
        // ===== Callback cuando la tabla termina de dibujarse =====
        drawCallback: function () {
            // Si hay una fila marcada anteriormente, volver a marcarla
            if (ultimaFilaModificada !== null) {
                marcarFilaPorId('#tabla-curso', ultimaFilaModificada);
            }
        }
    });

    // Inicializar el marcado de filas al hacer clic
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
    $('#modal-idcatalogotipo').val(id);
    $('#editarModalLabel').text('Editar Tipo de Catálogo');
    $('#btnGuardarCambios')
        .html('<i class="fa-solid fa-pen-to-square me-2"></i> Modificar')
        .removeClass('btn-success')
        .addClass('btn-primary');

    $.get(`${window.apiBaseUrl}/api/CatalogoTipo/obtener/${id}`, function (data) {
        $("#modal-id").val(data.idcatalogotipo);
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
    $('#modal-idcatalogotipo').val('');
    $('#editarModalLabel').text('Crear Nuevo Tipo de Catálogo');
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
                url: `${window.apiBaseUrl}/api/CatalogoTipo/eliminar/${id}`,
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
                    // ya que esta fila ya no existe
                    ultimaFilaModificada = null;
                    limpiarSeleccion('#tabla-curso');

                    $.get(`${window.apiBaseUrl}/api/CatalogoTipo/listar`, function (data) {
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